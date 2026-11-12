/**
 * Ligne de facture reliée à un ingrédient (dossier §15.179), contre la vraie base : le carton de saucisses (suivi en stock)
 * entre en réserve et fait le prix moyen de la saucisse ; le pain (non suivi) prend le prix de la facture ; le coût du
 * hot dog (sa recette) suit, donc sa marge. L'article est retenu pour la facture suivante. [F] Produit et ingrédient à
 * la fois, quantité d'ingrédient absente, ingrédient d'un autre lieu : refusés.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CorrespondanceArticle, EtatFactures, EtatReserveIngredients, Ingredient, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let cookieB = "";
let saucisse: Ingredient;
let pain: Ingredient;
let hotdog: Produit;
let factureId = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function connecter(email: string) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown, qui = cookie) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: qui }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const facture = (numero: string, lignes: unknown[]) => ({ fournisseur: "Relais d'Or Provence", numero, dateFacture: "2026-10-08", echeance: null, totalAnnonce: null, lignes });
const LIGNE_SAUCISSE = { produitId: null, libelle: "Box hotdog maxi porc 32x160g", codeArticle: "939504", quantite: 2, prixUnitaire: 5_415, ingredientId: "", ingredientMilliParUnite: 32_000 };

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  cookie = await connecter((await creerLieuDeTest(proprietaire)).email);
  cookieB = await connecter((await creerLieuDeTest(proprietaire)).email);
  const ingredients = async (nom: string, unite: string, prix: number) => (await appel<Ingredient[]>("POST", "/api/ingredients", { nom, unite, prix })).corps.find((i) => i.nom === nom)!;
  saucisse = await ingredients("Saucisse hot dog", "piece", 150);
  pain = await ingredients("Pain hot dog", "piece", 20);
  await appel("PATCH", `/api/ingredients/${saucisse.id}`, { suiviStock: true });
  hotdog = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot dog", prixTtc: 690, tauxTva: 1000, coutMatiere: null })).corps[0]!;
  await appel("PUT", `/api/produits/${hotdog.id}/recette`, { lignes: [{ ingredientId: saucisse.id, quantiteMilli: 1_000 }, { ingredientId: pain.id, quantiteMilli: 1_000 }] });
  LIGNE_SAUCISSE.ingredientId = saucisse.id;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("facture fournisseur : ligne reliée à un ingrédient", () => {
  it("[F] produit et ingrédient à la fois, quantité d'ingrédient absente, quantités ou montants hors bornes, ingrédient d'un autre lieu : refusés", async () => {
    const deux = await appel<{ erreur: string }>("POST", "/api/factures", facture("F-0", [{ ...LIGNE_SAUCISSE, produitId: hotdog.id }]));
    expect(deux.statut).toBe(400);
    expect(deux.corps.erreur).toContain("pas aux deux");
    const sansQuantite = await appel<{ erreur: string }>("POST", "/api/factures", facture("F-0", [{ ...LIGNE_SAUCISSE, ingredientMilliParUnite: null }]));
    expect(sansQuantite.statut).toBe(400);
    // [F] BUG-2026-015 : 1 000 000 cartons de 32 000 pièces, ou un montant au-delà d'une livraison : refusés à la saisie.
    const tropGrand = await appel<{ erreur: string }>("POST", "/api/factures", facture("F-0", [{ ...LIGNE_SAUCISSE, quantite: 1_000_000 }]));
    expect(tropGrand.statut).toBe(400);
    expect(tropGrand.corps.erreur).toContain("quantité × contenu trop grand");
    const tropCher = await appel<{ erreur: string }>("POST", "/api/factures", facture("F-0", [{ ...LIGNE_SAUCISSE, quantite: 30_000, prixUnitaire: 5_000 }]));
    expect(tropCher.statut).toBe(400);
    expect(tropCher.corps.erreur).toContain("montant de la ligne trop grand");
    const ailleurs = await appel<{ erreur: string }>("POST", "/api/factures", facture("F-0", [LIGNE_SAUCISSE]), cookieB);
    expect(ailleurs.statut).toBe(404);
    expect(ailleurs.corps.erreur).toContain("Ingrédient introuvable");
  });

  it("enregistrée : la ligne garde l'ingrédient et sa quantité ; pas d'alerte de colis pour un ingrédient", async () => {
    const r = await appel<EtatFactures>("POST", "/api/factures", {
      ...facture("420339906", [LIGNE_SAUCISSE, { produitId: null, libelle: "Petit pain carré nature 200x40g", codeArticle: "938080", quantite: 1, prixUnitaire: 2_263, ingredientId: pain.id, ingredientMilliParUnite: 200_000 }]),
      totalAnnonce: 13_093,
    });
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    const f = r.corps.factures.find((x) => x.numero === "420339906")!;
    factureId = f.id;
    expect(f.lignes.map((l) => [l.ingredientId, l.ingredientMilliParUnite, l.produitId])).toEqual([
      [saucisse.id, 32_000, null],
      [pain.id, 200_000, null],
    ]);
    expect(f.alertes).toEqual([]);
  });

  it("validée avec entrée en réserve : 64 saucisses en réserve au prix de la facture, pain au prix de la facture, coût du hot dog recalculé", async () => {
    const r = await appel<EtatFactures>("POST", `/api/factures/${factureId}/validation`, { entrerEnReserve: true, motif: "Livraison du 8 octobre" });
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    const reserve = (await appel<EtatReserveIngredients>("GET", "/api/stock/ingredients/reserve")).corps;
    // 54,15 € le carton de 32 : 1,69 € la saucisse (169,2 centimes, arrondi) ; 22,63 € les 200 pains : 0,11 €.
    expect(reserve.ingredients.find((g) => g.ingredientId === saucisse.id)).toMatchObject({ solde: 64_000, prix: 169 });
    const prixPain = (await appel<Ingredient[]>("GET", "/api/ingredients")).corps.find((i) => i.id === pain.id)!.prix;
    expect(prixPain).toBe(11);
    const p = (await appel<Produit[]>("GET", "/api/produits")).corps.find((x) => x.id === hotdog.id)!;
    expect(p.coutMatiere).toBe(180);
    const { rows } = await proprietaire.pool.query("SELECT type FROM journal_technique WHERE type IN ('ingredient_livre', 'ingredient_prix_facture') ORDER BY id DESC LIMIT 2");
    expect(rows.map((x) => x.type).sort()).toEqual(["ingredient_livre", "ingredient_prix_facture"]);
  });

  it("l'article est retenu : correspondance vers l'ingrédient et sa quantité, reprise à la facture suivante", async () => {
    const corr = (await appel<CorrespondanceArticle[]>("GET", "/api/factures/correspondances")).corps;
    expect(corr.find((c) => c.cle === "code:939504")).toMatchObject({ ingredientId: saucisse.id, ingredientMilliParUnite: 32_000, produitId: null });
    // Corrigée à la main : un carton de 30, journalisé.
    const r = await appel<CorrespondanceArticle[]>("PUT", "/api/factures/correspondances", {
      fournisseur: "relais d or provence",
      cle: "code:939504",
      produitId: null,
      unitesParColis: 1,
      ingredientId: saucisse.id,
      ingredientMilliParUnite: 30_000,
    });
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    expect(r.corps.find((c) => c.cle === "code:939504")!.ingredientMilliParUnite).toBe(30_000);
  });
});
