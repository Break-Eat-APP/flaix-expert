/**
 * Remise à zéro du stock et suppression d'un événement à venir (dossier §15.165), contre la vraie base : les restes
 * comptés avant la remise ne passent plus à l'événement suivant, la réserve repart d'un inventaire à 0 ; un événement à
 * venir se supprime avec sa mise en place ; un événement ouvert ou clos, jamais (sa clôture est chaînée) ; les tables en
 * écriture seule le restent hors de cette suppression ; produits et tarifs intacts.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, EtatReserve, Evenement, Produit, RepriseCaisse, Stand, StockMatch } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { travauxTermines } from "../src/arriere-plan.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieuId = "";
let stand: Stand;
let caisse = "";
let frites: Produit;
let essai: Evenement;
let prochain: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const ligneStock = async (e: Evenement) => (await appel<StockMatch>("GET", `/api/stock?evenementId=${e.id}`)).corps.stands.find((s) => s.standId === stand.id)!.lignes.find((l) => l.produitId === frites.id)!;
const soldeReserve = async () => (await appel<EtatReserve>("GET", "/api/stock/reserve")).corps.produits.find((p) => p.produitId === frites.id)!.solde;
const jet = async () => (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
const jour = (decalage: number) => new Date(Date.now() + decalage * 86_400_000).toISOString();

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  frites = (await appel<Produit[]>("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  expect((await appel("POST", "/api/stock/livraisons", { produitId: frites.id, quantite: 100, prixUnitaire: 120, dateLivraison: jour(-3).slice(0, 10) })).statut).toBe(201);

  // L'essai : 20 frites mises en place, ouvert, 15 comptées à la fin, clos — sans aucune vente.
  essai = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Essai du 23", debut: jour(-1) })).corps.find((e) => e.libelle === "Essai du 23")!;
  prochain = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Vrai match", debut: jour(6) })).corps.find((e) => e.libelle === "Vrai match")!;
  expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: essai.id, standId: stand.id, produitId: frites.id, quantite: 20 })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${essai.id}/ouverture`)).statut).toBe(200);
  expect((await appel("PUT", "/api/stock/comptage", { evenementId: essai.id, standId: stand.id, produitId: frites.id, quantite: 15, motif: "Essai, rien vendu" })).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("remise à zéro du stock", () => {
  it("refusée pendant un événement ouvert, ou sans motif ; puis restes et réserve à 0, produits et tarifs intacts", async () => {
    expect((await appel("POST", "/api/stock/remise-a-zero", { motif: "Essais de septembre" })).statut).toBe(409);
    expect((await appel("POST", `/api/evenements/${essai.id}/cloture`)).statut).toBe(200);
    expect((await ligneStock(prochain)).reste).toBe(15);
    expect(await soldeReserve()).toBe(80);
    expect((await appel("POST", "/api/stock/remise-a-zero", { motif: "abc" })).statut).toBe(400);

    const r = await appel<{ produits: number }>("POST", "/api/stock/remise-a-zero", { motif: "Essais de septembre" });
    expect(r.statut).toBe(200);
    expect(r.corps.produits).toBe(1);
    expect((await ligneStock(prochain)).reste).toBe(0);
    expect(await soldeReserve()).toBe(0);
    expect((await jet()).find((e) => e.type === "stock_remis_a_zero")!.details).toMatchObject({ motif: "Essais de septembre", reserveProduits: { Frites: 80 } });
    const p = (await appel<Produit[]>("GET", "/api/produits")).corps.find((x) => x.id === frites.id)!;
    expect(p.tarifEnVigueur!.prixTtc).toBe(500);
  });
});

describe("suppression d'un événement", () => {
  it("[F] hors suppression, le stock reste en écriture seule, même pour le propriétaire de la base ; le réglage seul n'ouvre rien à l'application", async () => {
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM stock_mouvement WHERE lieu_id = $1", [lieuId]))).rejects.toThrow(/écriture seule/);
    await expect(app.transaction({ lieuId }, (c) => c.query(`SELECT set_config('flaix.suppression_evenement', '${essai.id}', true); DELETE FROM stock_mouvement WHERE evenement_id = '${essai.id}'`))).rejects.toThrow();
  });

  it("clos (même sans vente) : refusé, sa clôture est chaînée aux autres ; il reste dans l'historique", async () => {
    const r = await appel<{ erreur: string }>("DELETE", `/api/evenements/${essai.id}`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toMatch(/chaîne des clôtures/);
    await expect(app.transaction({ lieuId }, (c) => c.query("SELECT supprimer_evenement_a_venir($1)", [essai.id]))).rejects.toThrow(/Seul un événement à venir/);
  });

  it("à venir : supprimé avec sa mise en place, inscrit au journal ; produits et tarifs intacts", async () => {
    const annule = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match annulé", debut: jour(10) })).corps.find((e) => e.libelle === "Match annulé")!;
    expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: annule.id, standId: stand.id, produitId: frites.id, quantite: 30 })).statut).toBe(200);
    expect(await soldeReserve()).toBe(-30); // la mise en place sort de la réserve (remise à 0 juste avant)
    const r = await appel<Evenement[]>("DELETE", `/api/evenements/${annule.id}`);
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    expect(r.corps.map((e) => e.libelle)).not.toContain("Match annulé");
    expect(await soldeReserve()).toBe(0);
    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ n: number }>("SELECT count(*)::int AS n FROM stock_mouvement WHERE evenement_id = $1", [annule.id]));
    expect(rows[0]!.n).toBe(0);
    expect((await jet()).find((e) => e.type === "evenement_supprime")!.details).toMatchObject({ libelle: "Match annulé", lignesStock: 1 });
    expect((await appel("DELETE", `/api/evenements/${annule.id}`)).statut).toBe(404);
    expect((await appel<Produit[]>("GET", "/api/produits")).corps.find((x) => x.id === frites.id)!.tarifEnVigueur!.prixTtc).toBe(500);
  });

  it("ouvert, avec des ventes : refusé", async () => {
    expect((await appel("POST", `/api/evenements/${prochain.id}/ouverture`)).statut).toBe(200);
    const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: null });
    const t = tablette(caisse, o.corps);
    vendreHorsLigne(t, [ligne(frites)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    await travauxTermines();
    expect((await appel<{ erreur: string }>("DELETE", `/api/evenements/${prochain.id}`)).corps.erreur).toMatch(/est ouvert/);
    await expect(app.transaction({ lieuId }, (c) => c.query("SELECT supprimer_evenement_a_venir($1)", [prochain.id]))).rejects.toThrow(/Seul un événement à venir/);
  });
});
