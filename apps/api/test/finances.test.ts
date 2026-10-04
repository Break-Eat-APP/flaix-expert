/**
 * Cibles de marge (module 5) et gestion financière de la soirée (module 11) — dossier §15.78, §15.79,
 * §15.132 — contre la vraie base. Les tests [F] provoquent l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Categorie, EntreeJournalTechnique, Evenement, FinancesSoiree, PosteDepense, Produit, RapportSoireeFige, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let caisse: string;
let boissons: Categorie;
let biere: Produit;
let hotDog: Produit;
let match: Evenement;
let t: Tablette;
let gobelets: PosteDepense;
let securite: PosteDepense;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown, avec = cookie) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: avec }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const finances = async () => (await appel<FinancesSoiree>("GET", `/api/finances?evenementId=${match.id}`)).corps;
const jet = async () => (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=100")).corps;
const resultats = async () => (await appel<Resultats>("GET", `/api/resultats?evenementId=${match.id}`)).corps;

async function connecter(email: string) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  cookie = await connecter(lieu.email);
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  boissons = (await appel<Categorie[]>("POST", "/api/categories", { nom: "Boissons" })).corps.find((x) => x.nom === "Boissons")!;
  // Bière 7,00 € TTC à 20 % (coût 1,20 €), hot-dog 6,00 € à 10 % (coût 1,50 €).
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, categorieId: boissons.id, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 600, tauxTva: 1000, coutMatiere: 150, standIds: [stand.id] })).corps;
  biere = produits.find((p) => p.nom === "Bière")!;
  hotDog = produits.find((p) => p.nom === "Hot-dog")!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString(), spectateurs: 3_000 })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  // 3 bières (21,00 € TTC, 17,50 € HT) et 1 hot-dog (6,00 € TTC, 5,45 € HT).
  vendreHorsLigne(t, [ligne(biere, 3)]);
  vendreHorsLigne(t, [ligne(hotDog)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("cibles de marge (module 5)", () => {
  it("sans cible saisie, rien n'est jugé", async () => {
    const r = await resultats();
    expect(r.actuel!.produits.every((p) => p.cibleMarge === null)).toBe(true);
    expect(r.alertes.some((a) => a.titre.includes("cible"))).toBe(false);
  });

  it("cible de la catégorie : la bière (79,4 % réalisés) passe sous une cible de 90 % ; alerte et journal", async () => {
    const c = await appel<Categorie[]>("PATCH", `/api/categories/${boissons.id}`, { cibleMarge: 9_000 });
    expect(c.corps.find((x) => x.id === boissons.id)!.cibleMarge).toBe(9_000);
    const r = await resultats();
    expect(r.actuel!.produits.find((p) => p.nom === "Bière")!.cibleMarge).toBe(9_000);
    expect(r.actuel!.produits.find((p) => p.nom === "Hot-dog")!.cibleMarge).toBeNull();
    expect(r.alertes.find((a) => a.titre === "1 produit sous sa cible de marge")!.detail).toContain("Bière");
    expect((await jet()).find((e) => e.type === "cible_marge_modifiee")!.details).toMatchObject({ categorie: "Boissons", modifications: { cibleMarge: { avant: null, apres: 9_000 } } });
  });

  it("la cible du produit prime sur celle de sa catégorie : 70 % pour la bière, tenue", async () => {
    const p = await appel<Produit[]>("PATCH", `/api/produits/${biere.id}`, { cibleMarge: 7_000 });
    expect(p.corps.find((x) => x.id === biere.id)!.cibleMarge).toBe(7_000);
    const r = await resultats();
    expect(r.actuel!.produits.find((x) => x.nom === "Bière")!.cibleMarge).toBe(7_000);
    expect(r.alertes.some((a) => a.titre.includes("cible"))).toBe(false);
  });

  it("[F] une cible hors de 0 à 100 % est refusée", async () => {
    expect((await appel("PATCH", `/api/categories/${boissons.id}`, { cibleMarge: 12_000 })).statut).toBe(400);
    expect((await appel("PATCH", `/api/produits/${biere.id}`, { cibleMarge: -1 })).statut).toBe(400);
  });
});

describe("gestion financière de la soirée (module 11)", () => {
  it("sans dépense ni cible : la cascade s'arrête aux chiffres calculés, aucun jugement", async () => {
    const f = await finances();
    expect(f).toMatchObject({ encaisseTtc: 2_700, tickets: 2, coutMatiere: 510, totalDepenses: 0, depenses: [], etatCible: null, cible: { lieu: null, evenement: null, effective: null } });
    expect(f.margeNette).toBe(f.margeBrute);
    expect(f.cascade.map((l) => l.libelle)).toContain("Dépenses de la soirée");
  });

  it("postes de dépense nommés par le lieu ; [F] un nom ne sert qu'une fois ; journalisés", async () => {
    expect((await appel("POST", "/api/postes-depense", { nom: "Gobelets" })).statut).toBe(201);
    const postes = (await appel<PosteDepense[]>("POST", "/api/postes-depense", { nom: "Sécurité" })).corps;
    gobelets = postes.find((p) => p.nom === "Gobelets")!;
    securite = postes.find((p) => p.nom === "Sécurité")!;
    expect((await appel<{ erreur: string }>("POST", "/api/postes-depense", { nom: " gobelets " })).statut).toBe(409);
    const renomme = await appel<PosteDepense[]>("PATCH", `/api/postes-depense/${gobelets.id}`, { nom: "Gobelets et serviettes" });
    expect(renomme.corps.map((p) => p.nom)).toEqual(["Gobelets et serviettes", "Sécurité"]);
    const types = (await jet()).map((e) => e.type);
    expect(types.filter((x) => x === "poste_depense_cree")).toHaveLength(2);
    expect(types).toContain("poste_depense_modifie");
  });

  it("dépenses en euros et en pourcentage du CA HT : la marge nette de la soirée les retire ; journalisées", async () => {
    await appel("PUT", `/api/finances/${match.id}/depenses/${gobelets.id}`, { mode: "euros", valeur: 150 });
    const f = (await appel<FinancesSoiree>("PUT", `/api/finances/${match.id}/depenses/${securite.id}`, { mode: "pourcent", valeur: 1_000 })).corps;
    const secu = f.depenses.find((d) => d.nom === "Sécurité")!;
    expect(secu).toMatchObject({ mode: "pourcent", valeur: 1_000, montant: Math.round(f.caHt / 10) });
    expect(f.totalDepenses).toBe(150 + secu.montant);
    expect(f.margeNette).toBe(f.margeBrute! - f.totalDepenses);
    expect(f.cascade.find((l) => l.libelle === "Dépenses de la soirée")!.montant).toBe(f.totalDepenses);
    expect((await jet()).find((e) => e.type === "depense_soiree_saisie")!.details).toMatchObject({ poste: "Sécurité", avant: "aucune", apres: "10 % du CA HT" });
  });

  it("[F] un pourcentage au-delà de 100 % est refusé ; une dépense retirée disparaît du calcul", async () => {
    expect((await appel("PUT", `/api/finances/${match.id}/depenses/${securite.id}`, { mode: "pourcent", valeur: 10_001 })).statut).toBe(400);
    const f = (await appel<FinancesSoiree>("PUT", `/api/finances/${match.id}/depenses/${gobelets.id}`, { mode: "euros", valeur: null })).corps;
    expect(f.depenses.find((d) => d.nom === "Gobelets et serviettes")).toMatchObject({ mode: null, montant: 0 });
    await appel("PUT", `/api/finances/${match.id}/depenses/${gobelets.id}`, { mode: "euros", valeur: 150 });
  });

  it("cible de marge nette : le gabarit du lieu, puis une cible propre à l'événement qui prime", async () => {
    expect((await appel("PUT", "/api/finances/cible", { cible: 5_000 })).statut).toBe(200);
    let f = await finances();
    expect(f.cible).toEqual({ lieu: 5_000, evenement: null, effective: 5_000 });
    expect(f.etatCible).toMatchObject({ ciblePb: 5_000, cible: Math.round(f.caHt / 2), ecart: f.margeNette! - Math.round(f.caHt / 2), tenue: true });
    f = (await appel<FinancesSoiree>("PUT", `/api/finances/${match.id}/cible`, { cible: 8_000 })).corps;
    expect(f.cible).toEqual({ lieu: 5_000, evenement: 8_000, effective: 8_000 });
    expect(f.etatCible!.tenue).toBe(false);
    f = (await appel<FinancesSoiree>("PUT", `/api/finances/${match.id}/cible`, { cible: null })).corps;
    expect(f.cible.effective).toBe(5_000);
    expect((await jet()).filter((e) => e.type === "cible_marge_modifiee").length).toBeGreaterThanOrEqual(5);
  });

  it("[F] poste désactivé : il ne se supprime pas, ses montants passés restent ; pas de nouvelle saisie", async () => {
    const postes = (await appel<PosteDepense[]>("PATCH", `/api/postes-depense/${securite.id}`, { actif: false })).corps;
    expect(postes.find((p) => p.id === securite.id)!.actif).toBe(false);
    expect((await finances()).depenses.find((d) => d.nom === "Sécurité")).toMatchObject({ actif: false, mode: "pourcent" });
    const autre = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Gap", debut: new Date(Date.now() + 7 * 86_400_000).toISOString() })).corps.find((e) => e.libelle === "Gap")!;
    const f = (await appel<FinancesSoiree>("GET", `/api/finances?evenementId=${autre.id}`)).corps;
    expect(f.depenses.map((d) => d.nom)).toEqual(["Gobelets et serviettes"]);
    const r = await appel<{ erreur: string }>("PUT", `/api/finances/${autre.id}/depenses/${securite.id}`, { mode: "euros", valeur: 1_000 });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("désactivé");
  });

  it("le rapport de soirée fige les dépenses et la cible du moment de la clôture", async () => {
    expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
    const avant = await finances();
    const r = (await appel<RapportSoireeFige>("GET", `/api/rapports-soiree/${match.id}`)).corps.rapport;
    expect(r.margeNette).toBe(avant.margeNette);
    expect(r.depenses).toEqual([
      { nom: "Gobelets et serviettes", montant: 150, pourcentPb: null },
      { nom: "Sécurité", montant: avant.depenses.find((d) => d.nom === "Sécurité")!.montant, pourcentPb: 1_000 },
    ]);
    expect(r.cibleMargeNette).toMatchObject({ ciblePb: 5_000, tenue: true });
    // Une facture arrivée après la clôture se saisit encore dans Finances, mais ne change pas le rapport figé.
    await appel("PUT", `/api/finances/${match.id}/depenses/${gobelets.id}`, { mode: "euros", valeur: 900 });
    expect((await finances()).totalDepenses).toBeGreaterThan(avant.totalDepenses);
    expect((await appel<RapportSoireeFige>("GET", `/api/rapports-soiree/${match.id}`)).corps.rapport.margeNette).toBe(avant.margeNette);
  });

  it("[F] le directeur d'un autre lieu ne touche ni aux postes ni aux dépenses de ce lieu", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    const sienne = await connecter(autre.email);
    expect((await appel("PATCH", `/api/postes-depense/${gobelets.id}`, { actif: false }, sienne)).statut).toBe(404);
    expect((await appel("GET", `/api/finances?evenementId=${match.id}`, undefined, sienne)).statut).toBe(404);
  });
});
