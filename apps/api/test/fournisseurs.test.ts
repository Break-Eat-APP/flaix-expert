/**
 * Comparaison des prix entre fournisseurs (module 5 ; dossier §15.141), contre la vraie base : prix unitaire
 * de la dernière livraison chez chaque fournisseur, colis renseigné une fois, écoulement et sur-conditionnement.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ComparaisonFournisseurs, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let biere: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const jour = (decalage: number) => new Date(Date.now() + decalage * 86_400_000).toISOString().slice(0, 10);

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  const caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière 33 cl", prixTtc: 500, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  // Brasserie A : 1,30 € puis 1,25 € la canette ; Grossiste B : 1,40 €.
  for (const [prix, date, fournisseur] of [[130, jour(-20), "Brasserie A"], [140, jour(-10), "Grossiste B"], [125, jour(-2), "brasserie a "]] as const) {
    expect((await appel("POST", "/api/stock/livraisons", { produitId: biere.id, quantite: 48, prixUnitaire: prix, fournisseur, dateLivraison: date })).statut).toBe(201);
  }
  // Un événement clos où 16 bières ont été vendues : consommation moyenne de 16 par événement.
  const e = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Gap", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${e.id}/ouverture`);
  const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: null });
  const t = tablette(caisse, o.corps);
  vendreHorsLigne(t, [ligne(biere, 16)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("comparaison des prix entre fournisseurs (§15.141)", () => {
  it("prix de la dernière livraison chez chaque fournisseur, regroupés sans majuscules ni espaces ; +12 % chez le plus cher", async () => {
    const r = (await appel<ComparaisonFournisseurs>("GET", "/api/stock/fournisseurs")).corps;
    expect(r.evenementsConsommation).toBe(1);
    const a = r.articles[0]!;
    expect(a).toMatchObject({ nom: "Bière 33 cl", unite: null, consommationParEvenement: 16, surConditionnement: false });
    expect(a.offres.map((o) => [o.fournisseur, o.prixUnitaire, o.ecartPct, o.livraisons])).toEqual([
      ["brasserie a", 125, null, 2],
      ["Grossiste B", 140, 12, 1],
    ]);
  });

  it("colis renseigné : un carton de 24 couvre 1,5 événement (pas d'alerte) ; une palette de 240 couvre 15 événements → sur-conditionnement ; journalisé", async () => {
    let r = (await appel<ComparaisonFournisseurs>("PUT", "/api/stock/fournisseurs/conditionnement", { produitId: biere.id, fournisseur: "Brasserie A", libelle: "carton", contenance: 24 })).corps;
    expect(r.articles[0]!.offres[0]).toMatchObject({ conditionnement: { libelle: "carton", contenance: 24 }, couvre: 1.5 });
    expect(r.articles[0]!.surConditionnement).toBe(false);
    r = (await appel<ComparaisonFournisseurs>("PUT", "/api/stock/fournisseurs/conditionnement", { produitId: biere.id, fournisseur: "brasserie a", libelle: "palette", contenance: 240 })).corps;
    expect(r.articles[0]!.offres[0]!.couvre).toBe(15);
    expect(r.articles[0]!.surConditionnement).toBe(true);
    const jets = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps.filter((j) => j.type === "conditionnement_modifie");
    expect(jets).toHaveLength(2);
    expect(jets[0]!.details).toMatchObject({ avant: "carton de 24 portions", apres: "palette de 240 portions" });
  });

  it("[F] colis sans contenance refusé ; article d'un autre lieu introuvable", async () => {
    expect((await appel("PUT", "/api/stock/fournisseurs/conditionnement", { produitId: biere.id, fournisseur: "A", libelle: "fût", contenance: null })).statut).toBe(400);
    expect((await appel("PUT", "/api/stock/fournisseurs/conditionnement", { produitId: "00000000-0000-4000-8000-000000000000", fournisseur: "A", libelle: "fût", contenance: 30 })).statut).toBe(404);
  });
});
