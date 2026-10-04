/**
 * Rapport de soirée (module 9 ; dossier §15.131), contre la vraie base : établi et figé à la clôture de
 * l'événement, lu dans les modules existants, comparé à l'événement précédent, jamais modifiable.
 * Les tests [F] provoquent l'erreur ou la fraude qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, Evenement, Produit, RapportSoireeFige, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieuId = "";
let biere: Produit;
let hotDog: Produit;
let match1: Evenement;
let match2: Evenement;
let caisse: string;

type Lu = RapportSoireeFige & { integre: boolean };
const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
const JOUR = 86_400_000;

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown, avec = cookie) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: avec }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const rapport = (id: string) => appel<Lu>("GET", `/api/rapports-soiree/${id}`);

/** Joue un événement : ouverture, ventes scellées par la tablette, clôture de caisse, Z du tiroir, clôture de l'événement. */
async function jouer(match: Evenement, ventes: (t: ReturnType<typeof tablette>) => void, coupures: Record<string, number>) {
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: 10_000 });
  const t = tablette(caisse, o.corps);
  ventes(t);
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  expect((await appel("POST", `/api/sessions-caisse/${o.corps.contexte.sessionId}/comptage`, { coupures })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true })).corps[0]!.caisses[0]!.id;
  // Bière 7,00 € TTC à 20 % (coût 1,20 €), hot-dog 6,00 € à 10 % (coût 1,50 €).
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 600, tauxTva: 1000, coutMatiere: 150, standIds: [stand.id] })).corps;
  biere = produits.find((p) => p.nom === "Bière")!;
  hotDog = produits.find((p) => p.nom === "Hot-dog")!;
  const creer = async (libelle: string, jours: number, spectateurs: number | null) =>
    (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() - jours * JOUR).toISOString(), spectateurs })).corps.find((e) => e.libelle === libelle)!;
  match1 = await creer("Gap", 7, 2_000);
  match2 = await creer("Rouen", 0, 3_000);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("rapport de soirée : établi et figé à la clôture de l'événement", () => {
  it("événement pas encore clos : pas de rapport (jamais des chiffres provisoires)", async () => {
    const r = await appel<{ erreur: string }>("GET", `/api/rapports-soiree/${match1.id}`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("clôture de l'événement");
  });

  it("clôture de l'événement : le rapport est établi dans la foulée, inscrit au journal, intègre", async () => {
    // Gap : 2 bières en espèces (14,00 €), tiroir compté juste : 100 + 14 = 114,00 €.
    await jouer(match1, (t) => void vendreHorsLigne(t, [ligne(biere, 2)], { modeReglement: "especes", montantDonne: 1_400 }), { "5000": 2, "1000": 1, "200": 2 });
    const r = await rapport(match1.id);
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ etabliA: "cloture", integre: true });
    expect(r.corps.empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(r.corps.rapport.ventes).toMatchObject({ encaisseTtc: 1_400, tickets: 1, parMode: { especes: 1_400, carte: 0 } });
    expect(r.corps.rapport.comparaison.evenement).toBeNull();
    expect(r.corps.rapport.especes.tiroirs).toEqual([{ caisse: 1, stand: "Buvette", attendu: 11_400, compte: 11_400, ecart: 0, motif: null, rectifie: false }]);
    expect(r.corps.rapport.z).toMatchObject({ sequence: 1, totalTtc: 1_400, perpetuel: 1_400 });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
    expect(jet.find((e) => e.type === "rapport_soiree_etabli")!.details).toMatchObject({ evenementId: match1.id, etabliA: "cloture", empreinte: r.corps.empreinte });
  });

  it("cascade complète, comparaison avec l'événement précédent, top produits, espèces et Z", async () => {
    // Rouen : 3 bières en espèces (21,00 €) + 1 hot-dog par carte (6,00 €) ; tiroir compté à 120,00 € pour 121,00 € attendus.
    await jouer(
      match2,
      (t) => {
        vendreHorsLigne(t, [ligne(biere, 3)], { modeReglement: "especes", montantDonne: 2_100 });
        vendreHorsLigne(t, [ligne(hotDog)]);
      },
      { "5000": 2, "1000": 2 },
    );
    const r = (await rapport(match2.id)).corps.rapport;
    const v = r.ventes;
    expect(v).toMatchObject({ encaisseTtc: 2_700, tickets: 2, panierMoyen: 1_350, caParSpectateur: 1, parMode: { especes: 2_100, carte: 600 } });
    expect(v.caHt + v.tva).toBe(2_700);
    // Cascade : encaissé − TVA = CA HT ; − coût matière (3 × 1,20 + 1,50) = marge brute ; personnel 0 (aucune affectation) ; aucune dépense saisie.
    expect(r.cascade.map((l) => l.montant)).toEqual([2_700, v.tva, v.caHt, 510, v.caHt - 510, 0, 0, v.caHt - 510]);
    expect(r).toMatchObject({ depenses: [], cibleMargeNette: null });
    expect(r).toMatchObject({ margeBrute: v.caHt - 510, margeNette: v.caHt - 510, produitsSansCout: [] });
    expect(r.comparaison.evenement?.libelle).toBe("Gap");
    expect(r.comparaison.encaisseTtc).toEqual({ actuel: 2_700, precedent: 1_400, ecart: 1_300, ecartPct: 92.9 });
    expect(r.comparaison.spectateurs).toMatchObject({ ecart: 1_000, ecartPct: 50 });
    expect(r.top.parVolume.map((p) => p.nom)).toEqual(["Bière", "Hot-dog"]);
    expect(r.especes).toMatchObject({ ecartTotal: -100, seuil: 500, coffre: null });
    expect(r.stock).toMatchObject({ produits: [], ingredients: [], suivi: false });
    expect(r.z).toMatchObject({ sequence: 2, totalTtc: 2_700, perpetuel: 4_100 });
  });

  it("[F] le rapport ne bouge plus : un coût changé après coup modifie Résultats, pas le rapport figé", async () => {
    const avant = (await rapport(match2.id)).corps;
    expect((await appel("PATCH", `/api/produits/${biere.id}`, { coutMatiere: 300 })).statut).toBe(200);
    const resultats = (await appel<Resultats>("GET", `/api/resultats?evenementId=${match2.id}`)).corps;
    expect(resultats.actuel!.coutMatiere).toBe(3 * 300 + 150);
    const apres = (await rapport(match2.id)).corps;
    expect(apres.rapport.margeBrute).toBe(avant.rapport.margeBrute);
    expect(apres).toMatchObject({ empreinte: avant.empreinte, etabliLe: avant.etabliLe, integre: true });
  });

  it("[F] ni le serveur ni le propriétaire de la base ne peuvent modifier ou supprimer un rapport", async () => {
    await expect(app.transaction({ lieuId }, (c) => c.query("UPDATE rapport_soiree SET contenu = '{}' WHERE evenement_id = $1", [match2.id]))).rejects.toThrow();
    await expect(proprietaire.transaction({}, (c) => c.query("UPDATE rapport_soiree SET contenu = '{}' WHERE evenement_id = $1", [match2.id]))).rejects.toThrow();
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM rapport_soiree WHERE evenement_id = $1", [match2.id]))).rejects.toThrow();
    expect((await rapport(match2.id)).corps.integre).toBe(true);
  });

  it("événement clos avant que le rapport existe : établi à la première lecture, « a posteriori », une seule fois", async () => {
    const ancien = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Ancien", debut: new Date(Date.now() - 14 * JOUR).toISOString() })).corps.find((e) => e.libelle === "Ancien")!;
    // Clôture faite à l'époque, sans rapport : simulée directement dans la base.
    await proprietaire.transaction({}, async (c) => {
      await c.query("UPDATE evenement SET etat = 'ouvert', ouvert_le = now() WHERE id = $1", [ancien.id]);
      await c.query("UPDATE evenement SET etat = 'clos', clos_le = now() WHERE id = $1", [ancien.id]);
    });
    const premiere = await rapport(ancien.id);
    expect(premiere.corps).toMatchObject({ etabliA: "a_posteriori", integre: true });
    expect(premiere.corps.rapport.ventes.encaisseTtc).toBe(0);
    const seconde = await rapport(ancien.id);
    expect(seconde.corps.empreinte).toBe(premiere.corps.empreinte);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
    expect(jet.filter((e) => e.type === "rapport_soiree_etabli" && e.details.evenementId === ancien.id)).toHaveLength(1);
  });

  it("[F] le directeur d'un autre lieu ne lit pas ce rapport", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: autre.email, motDePasse: MOT_DE_PASSE_TEST } });
    const sienne = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
    expect((await appel("GET", `/api/rapports-soiree/${match2.id}`, undefined, sienne)).statut).toBe(404);
  });
});
