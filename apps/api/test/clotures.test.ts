/**
 * Clôture du match — contrôle des espèces (dossier §15.102, module 7), contre la vraie base.
 * Les tests [F] provoquent la fraude ou l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, EntreeJournalTechnique, Evenement, Lieu, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let especes: string;
let carte: string;
let biere: Produit;
let match: Evenement;
let tEsp: Tablette;
let tCarte: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const cloture = async () => (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match.id}`)).corps;
const sessionDe = async (caisseId: string) => (await cloture()).sessions.find((s) => s.caisseId === caisseId)!;
const jet = async () => (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=100")).corps;
const ctx = () => ({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  let stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  await appel("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true });
  stand = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!;
  [especes, carte] = stand.caisses.map((k) => k.id) as [string, string];
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [stand.id] })).corps[0]!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match à clôturer", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  tEsp = tablette(especes, (await appel<RepriseCaisse>("POST", `/api/caisses/${especes}/ouverture`, { fond: 15000 })).corps);
  tCarte = tablette(carte, (await appel<RepriseCaisse>("POST", `/api/caisses/${carte}/ouverture`, {})).corps);
  // Espèces : 2 ventes de 7 € → 14,00 € ; carte : 1 vente de 2 bières → 14,00 €.
  vendreHorsLigne(tEsp, [ligne(biere)], { modeReglement: "especes", montantDonne: 1000 });
  vendreHorsLigne(tEsp, [ligne(biere)], { modeReglement: "especes", montantDonne: 700 });
  vendreHorsLigne(tCarte, [ligne(biere, 2)]);
  await envoyer(appel, tEsp);
  await envoyer(appel, tCarte);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("étape 1 — ventes : toutes les caisses clôturées", () => {
  it("tant qu'une caisse est ouverte, l'étape n'est pas faite et son tiroir ne se compte pas", async () => {
    const c = await cloture();
    expect(c.etapes).toMatchObject({ ventes: false, especes: false, cloturable: false, restes: { requis: false, manquants: 0 } });
    const s = c.sessions.find((x) => x.caisseId === especes)!;
    expect(s).toMatchObject({ fond: 15000, especes: 1400, attendu: 16400, comptage: null });
    const r = await appel<{ erreur: string }>("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, { coupures: { "5000": 3 } });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("encore ouverte");
  });

  it("caisses clôturées : l'étape ventes est faite ; la caisse carte n'a pas de tiroir", async () => {
    await appel("POST", `/api/caisses/${especes}/cloture`, { jeton: tEsp.reprise.jeton, derniereSequence: tEsp.tete.sequence });
    await appel("POST", `/api/caisses/${carte}/cloture`, { jeton: tCarte.reprise.jeton, derniereSequence: tCarte.tete.sequence });
    const c = await cloture();
    expect(c.etapes).toMatchObject({ ventes: true, especes: false, cloturable: false });
    const k = c.sessions.find((x) => x.caisseId === carte)!;
    expect(k).toMatchObject({ fond: null, attendu: null, carte: 1400 });
    expect((await appel("POST", `/api/sessions-caisse/${k.sessionId}/comptage`, { coupures: {} })).statut).toBe(409);
  });
});

describe("étape 3 — espèces : comptage par coupure, Z définitif (module 7)", () => {
  it("le match ne se clôt pas tant que le tiroir n'a pas son Z", async () => {
    const r = await appel<{ erreur: string }>("POST", `/api/evenements/${match.id}/cloture`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("tiroir");
  });

  it("écart au-delà de la tolérance (5,00 €) : motif obligatoire ; une coupure inconnue est refusée", async () => {
    const s = await sessionDe(especes);
    // 150 € + 5 € + 2 € = 157,00 € comptés pour 164,00 € attendus : −7,00 €.
    const sansMotif = await appel<{ erreur: string }>("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, { coupures: { "5000": 3, "500": 1, "200": 1 } });
    expect(sansMotif.statut).toBe(400);
    expect(sansMotif.corps.erreur).toContain("motif");
    expect((await appel("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, { coupures: { "300": 1 } })).statut).toBe(400);
  });

  it("avec motif, le Z est enregistré, attribué, et inscrit au journal technique qui le scelle", async () => {
    const s = await sessionDe(especes);
    const r = await appel<ClotureMatch>("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, {
      coupures: { "5000": 3, "500": 1, "200": 1, "1000": 0 },
      motif: "Erreur de rendu sur un billet de 10 €",
    });
    expect(r.statut).toBe(200);
    const z = r.corps.sessions.find((x) => x.caisseId === especes)!.comptage!;
    expect(z).toMatchObject({ type: "comptage", compte: 15700, attendu: 16400, ecart: -700, seuil: 500, coupures: { "5000": 3, "500": 1, "200": 1 } });
    expect(r.corps.etapes).toMatchObject({ ventes: true, especes: true, cloturable: true });
    const e = (await jet()).find((x) => x.type === "z_caisse_clos")!;
    expect(e.details).toMatchObject({ compte: 15700, ecart: -700, motif: "Erreur de rendu sur un billet de 10 €" });
  });

  it("un second Z pour le même tiroir est refusé : on corrige par une rectification", async () => {
    const s = await sessionDe(especes);
    const r = await appel<{ erreur: string }>("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, { coupures: { "5000": 3 }, motif: "Deuxième essai" });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("rectification");
  });

  it("rectification : motif et signature obligatoires ; elle s'ajoute, le Z d'origine reste inchangé", async () => {
    const z = (await sessionDe(especes)).comptage!;
    expect((await appel("POST", `/api/comptages/${z.id}/rectification`, { compte: 16400, motif: "Billet retrouvé sous le tiroir", signature: "" })).statut).toBe(400);
    const r = await appel<ClotureMatch>("POST", `/api/comptages/${z.id}/rectification`, { compte: 16400, motif: "Billet retrouvé sous le tiroir", signature: "Directeur Test" });
    expect(r.statut).toBe(200);
    const s = r.corps.sessions.find((x) => x.caisseId === especes)!;
    expect(s.comptage).toMatchObject({ compte: 15700, ecart: -700 });
    expect(s.rectifications).toHaveLength(1);
    expect(s.rectifications[0]).toMatchObject({ type: "rectification", refComptage: z.id, compte: 16400, ecart: 0, signature: "Directeur Test" });
    expect((await jet()).some((x) => x.type === "z_caisse_rectifie")).toBe(true);
  });

  it("étape 4 : le match se clôt ; ensuite, plus de Z tardif, mais une rectification reste possible", async () => {
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
    const c = await cloture();
    expect(c.evenement.etat).toBe("clos");
    expect(c.etapes.cloturable).toBe(false);
    const z = c.sessions.find((x) => x.caisseId === especes)!.comptage!;
    expect((await appel("POST", `/api/comptages/${z.id}/rectification`, { compte: 16300, motif: "Recompte au coffre le lendemain", signature: "Directeur Test" })).statut).toBe(200);
  });
});

describe("tolérance réglable par le lieu", () => {
  it("5,00 € par défaut ; modifiable, et la modification est journalisée", async () => {
    expect((await appel<Lieu>("GET", "/api/lieu")).corps.seuilEcartEspeces).toBe(500);
    const r = await appel<Lieu>("PUT", "/api/lieu/seuil-especes", { seuilCentimes: 1000 });
    expect(r.corps.seuilEcartEspeces).toBe(1000);
    expect((await appel("PUT", "/api/lieu/seuil-especes", { seuilCentimes: -1 })).statut).toBe(400);
    expect((await jet()).some((x) => x.type === "seuil_especes_modifie")).toBe(true);
  });
});

describe("[F] le Z est protégé par la base elle-même", () => {
  it("ni le serveur ni le propriétaire ne modifient ou ne suppriment un Z", async () => {
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE comptage_especes SET compte_centimes = 16400, ecart_centimes = 0 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("DELETE FROM comptage_especes WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE comptage_especes SET motif = 'réécrit' WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM comptage_especes WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
  });

  it("un Z incohérent (écart faux, hors tolérance sans motif, second Z) est refusé même en écrivant directement", async () => {
    const s = await sessionDe(especes);
    const inserer = (valeurs: { compte: number; ecart: number; motif: string | null }) =>
      app.transaction(ctx(), (c) =>
        c.query(
          `INSERT INTO comptage_especes (lieu_id, session_id, caisse_id, evenement_id, type, coupures, fond_centimes, especes_centimes,
                                         attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, par)
           VALUES ($1, $2, $3, $4, 'comptage', '{}', 15000, 1400, 16400, $5, $6, 500, $7, $8)`,
          [lieu.lieuId, s.sessionId, especes, match.id, valeurs.compte, valeurs.ecart, valeurs.motif, lieu.utilisateurId],
        ),
      );
    expect(await codeErreur(inserer({ compte: 15700, ecart: 0, motif: null }))).toBe("23514");
    expect(await codeErreur(inserer({ compte: 15000, ecart: -1400, motif: null }))).toBe("23514");
    expect(await codeErreur(inserer({ compte: 16400, ecart: 0, motif: null }))).toBe("23505");
  });
});
