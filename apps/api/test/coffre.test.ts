/**
 * Remontées d'espèces au coffre et Z du coffre de la soirée (dossier §15.106), contre la vraie base.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let caisse: string;
let match: Evenement;
let t: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const cloture = async () => (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match.id}`)).corps;
const session = async () => (await cloture()).sessions[0]!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, { especesAutorisees: true })).corps[0]!.caisses[0]!.id;
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [s.id] })).corps[0]!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match du coffre", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: 10000 })).corps);
  // 3 bières en espèces : 21,00 €.
  vendreHorsLigne(t, [ligne(biere, 3)], { modeReglement: "especes", montantDonne: 2100 });
  await envoyer(appel, t);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("remontées au coffre pendant le match", () => {
  it("une remontée se déduit de l'attendu du tiroir ; une erreur s'annule avec motif, sans être effacée", async () => {
    const s0 = await session();
    await appel("POST", `/api/sessions-caisse/${s0.sessionId}/remontees`, { montant: 1500 });
    const avecErreur = (await appel<ClotureMatch>("POST", `/api/sessions-caisse/${s0.sessionId}/remontees`, { montant: 500 })).corps;
    const erreur = avecErreur.sessions[0]!.remontees.find((r) => r.montant === 500)!;
    expect((await appel("POST", `/api/remontees/${erreur.id}/annulation`, { motif: "" })).statut).toBe(400);
    const c = (await appel<ClotureMatch>("POST", `/api/remontees/${erreur.id}/annulation`, { motif: "Saisie en double" })).corps;
    const s = c.sessions[0]!;
    expect(s.remontees).toHaveLength(2);
    expect(s.remontees.find((r) => r.id === erreur.id)!.annulee!.motif).toBe("Saisie en double");
    // Attendu : 100,00 € de fond + 21,00 € d'espèces − 15,00 € au coffre = 106,00 €.
    expect(s).toMatchObject({ totalRemonte: 1500, attendu: 10600 });
    expect(c.coffre).toMatchObject({ requis: true, attendu: 1500, comptage: null });
    expect(c.etapes.especes).toBe(false);
  });

  it("le coffre ne se compte pas tant qu'une caisse est ouverte", async () => {
    const r = await appel<{ erreur: string }>("POST", "/api/clotures/coffre", { evenementId: match.id, coupures: { "1000": 1, "500": 1 } });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("encore ouvertes");
  });

  it("Z du tiroir : les remontées sont inscrites avec lui ; plus aucune remontée ensuite", async () => {
    await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
    const s = await session();
    // 106,00 € : 2 × 50 € + 1 × 5 € + 1 × 1 €.
    const z = (await appel<ClotureMatch>("POST", `/api/sessions-caisse/${s.sessionId}/comptage`, { coupures: { "5000": 2, "500": 1, "100": 1 } })).corps.sessions[0]!.comptage!;
    expect(z).toMatchObject({ fond: 10000, especes: 2100, sorties: 1500, attendu: 10600, compte: 10600, ecart: 0 });
    const r = await appel<{ erreur: string }>("POST", `/api/sessions-caisse/${s.sessionId}/remontees`, { montant: 100 });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("déjà compté");
  });

  it("le match ne se clôt pas tant que le coffre n'est pas compté", async () => {
    const r = await appel<{ erreur: string }>("POST", `/api/evenements/${match.id}/cloture`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("coffre");
  });

  it("Z du coffre : attendu = total des remontées ; un second Z est refusé ; la rectification s'ajoute", async () => {
    const c = (await appel<ClotureMatch>("POST", "/api/clotures/coffre", { evenementId: match.id, coupures: { "1000": 1, "500": 1 } })).corps;
    expect(c.coffre.comptage).toMatchObject({ attendu: 1500, compte: 1500, ecart: 0, coupures: { "1000": 1, "500": 1 } });
    expect(c.etapes).toMatchObject({ especes: true, cloturable: true });
    expect((await appel("POST", "/api/clotures/coffre", { evenementId: match.id, coupures: { "1000": 1 } })).statut).toBe(409);
    const rect = (await appel<ClotureMatch>("POST", `/api/comptages-coffre/${c.coffre.comptage!.id}/rectification`, { compte: 1400, motif: "Billet de 5 € trouvé dans le tiroir", signature: "Directeur Test" })).corps;
    expect(rect.coffre.rectifications[0]).toMatchObject({ compte: 1400, ecart: -100, signature: "Directeur Test" });
    expect(rect.coffre.comptage!.compte).toBe(1500);
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=100")).corps.map((e) => e.type);
    expect(jet).toEqual(expect.arrayContaining(["remontee_coffre", "remontee_coffre_annulee", "z_coffre_clos", "z_coffre_rectifie"]));
  });

  it("[F] remontées et Z du coffre en écriture seule, même pour le propriétaire", async () => {
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE sortie_especes SET montant_centimes = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("DELETE FROM comptage_coffre WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM sortie_especes WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE comptage_coffre SET compte_centimes = 1500 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
  });
});
