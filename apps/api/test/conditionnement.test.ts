/**
 * Conditionnement de chaque produit (dossier §15.155), contre la vraie base : emballages du lieu au millième d'euro,
 * emballages d'un produit, coût du conditionnement vendu déduit avant la marge brute (Finances, Résultats), prix changé
 * puis emballage supprimé, refus, journal.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CentreAlertes, Emballage, EntreeJournalTechnique, Evenement, FinancesSoiree, Produit, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let biere: Produit;
let match: Evenement;
let gobelet: Emballage;
let serviette: Emballage;
let t: Tablette;
let caisse = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const finances = async () => (await appel<FinancesSoiree>("GET", `/api/finances?evenementId=${match.id}`)).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  // Bière 7,00 € TTC à 20 % (17,50 € HT les trois), coût matière 1,20 €.
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(biere, 3)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("conditionnement", () => {
  it("emballages du lieu au millième d'euro ; nom en double refusé", async () => {
    await appel("POST", "/api/emballages", { nom: "Gobelet 50 cl", prixMillimes: 120 });
    const liste = (await appel<Emballage[]>("POST", "/api/emballages", { nom: "Serviette", prixMillimes: 8 })).corps;
    gobelet = liste.find((e) => e.nom === "Gobelet 50 cl")!;
    serviette = liste.find((e) => e.nom === "Serviette")!;
    expect(serviette).toMatchObject({ prixMillimes: 8, produits: 0 });
    expect((await appel("POST", "/api/emballages", { nom: "gobelet 50 CL", prixMillimes: 100 })).statut).toBe(409);
    expect((await appel("POST", "/api/emballages", { nom: "Paille", prixMillimes: 100_001 })).statut).toBe(400);
  });

  it("emballages d'une bière : 1 gobelet et 2 serviettes = 0,136 € la portion ; [F] doublon, quantité nulle, inconnu", async () => {
    const r = await appel<Produit[]>("PUT", `/api/produits/${biere.id}/emballages`, { emballages: [{ emballageId: gobelet.id, quantite: 1 }, { emballageId: serviette.id, quantite: 2 }] });
    expect(r.corps.find((p) => p.id === biere.id)).toMatchObject({ conditionnementMillimes: 136, emballages: [{ nom: "Gobelet 50 cl", quantite: 1 }, { nom: "Serviette", quantite: 2 }] });
    expect((await appel("PUT", `/api/produits/${biere.id}/emballages`, { emballages: [{ emballageId: gobelet.id, quantite: 1 }, { emballageId: gobelet.id, quantite: 2 }] })).statut).toBe(400);
    expect((await appel("PUT", `/api/produits/${biere.id}/emballages`, { emballages: [{ emballageId: gobelet.id, quantite: 0 }] })).statut).toBe(400);
    expect((await appel("PUT", `/api/produits/${biere.id}/emballages`, { emballages: [{ emballageId: "00000000-0000-4000-8000-000000000000", quantite: 1 }] })).statut).toBe(404);
  });

  it("conditionnement vendu déduit avant la marge brute dans Finances", async () => {
    const f = await finances();
    // 3 × 0,136 € = 0,408 € → 0,41 €.
    expect(f.conditionnement).toBe(41);
    expect(f.margeBrute).toBe(f.caHt - 360 - 41);
    expect(f.cascade.find((l) => l.libelle.startsWith("Conditionnement"))).toMatchObject({ montant: 41, sorte: "retire" });
  });

  it("prix du gobelet changé : tous les produits suivent ; emballage supprimé avec ses liens ; journal", async () => {
    await appel("PATCH", `/api/emballages/${gobelet.id}`, { prixMillimes: 150 });
    expect((await finances()).conditionnement).toBe(50); // 3 × 0,166 € = 0,498 €
    const liste = (await appel<Emballage[]>("DELETE", `/api/emballages/${serviette.id}`)).corps;
    expect(liste.map((e) => e.nom)).toEqual(["Gobelet 50 cl"]);
    expect((await finances()).conditionnement).toBe(45);
    const types = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps.map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(["emballage_cree", "emballage_modifie", "emballage_supprime", "conditionnement_produit_modifie"]));
  });

  it("stock des gobelets (§15.158) : comptage, ventes déduites, livraison, seuil et alerte", async () => {
    expect((await appel("POST", `/api/emballages/${gobelet.id}/livraison`, { quantite: 50 })).statut).toBe(409);
    let g = (await appel<Emballage[]>("POST", `/api/emballages/${gobelet.id}/comptage`, { quantite: 100 })).corps.find((e) => e.id === gobelet.id)!;
    // Les 3 bières du match font 3 gobelets par match ; elles sont avant le comptage : pas déduites.
    expect(g.stock).toMatchObject({ estime: 100, consommeDepuis: 0, parMatch: 3 });
    vendreHorsLigne(t, [ligne(biere, 2)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    g = (await appel<Emballage[]>("POST", `/api/emballages/${gobelet.id}/livraison`, { quantite: 50 })).corps.find((e) => e.id === gobelet.id)!;
    expect(g.stock).toMatchObject({ estime: 148, livreDepuis: 50, consommeDepuis: 2, parMatch: 5 });
    expect((await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes.some((a) => a.type === "stock_emballage")).toBe(false);
    await appel("PATCH", `/api/emballages/${gobelet.id}`, { seuil: 200 });
    const alerte = (await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes.find((a) => a.type === "stock_emballage")!;
    expect(alerte).toMatchObject({ titre: "Stock bas : Gobelet 50 cl", niveau: "normale" });
    expect(alerte.detail).toContain("148");
  });

  it("Résultats, une fois l'événement clos (§15.167) : marge du produit, conditionnement compris", async () => {
    expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
    const f = await finances();
    const r = (await appel<Resultats>("GET", `/api/resultats?evenementId=${match.id}`)).corps;
    expect(r.actuel).toMatchObject({ coutConditionnement: f.conditionnement, margeBrute: f.margeBrute });
    // 5 bières, 1 gobelet à 0,150 € chacune (serviettes retirées) : marge = CA HT − 5 × (1,20 € + 0,15 €).
    const b = r.actuel!.produits.find((p) => p.produitId === biere.id)!;
    expect(b).toMatchObject({ quantite: 5, conditionnementMillimes: 150 });
    expect(b.marge).toBe(b.caHt - 675);
  });
});
