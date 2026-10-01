/**
 * Recettes (dossier §15.117, §15.119), contre la vraie base : ingrédients, recette, coût de
 * fabrication recalculé, coût matière protégé, recopie en formation.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, Ingredient, Produit, Recette, SessionInfo, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let burger: Produit;
const ing: Record<string, string> = {};

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const produit = async () => (await appel<Produit[]>("GET", "/api/produits")).corps.find((p) => p.id === burger.id)!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Snack" })).corps[0]!;
  burger = (await appel<Produit[]>("POST", "/api/produits", { nom: "Burger", prixTtc: 900, tauxTva: 1000, standIds: [s.id] })).corps.find((p) => p.nom === "Burger")!;
  for (const [nom, unite, prix] of [
    ["Tomates", "kg", 250],
    ["Salade", "kg", 400],
    ["Steak haché", "kg", 1000],
    ["Pain burger", "piece", 45],
  ] as const) {
    const l = (await appel<Ingredient[]>("POST", "/api/ingredients", { nom, unite, prix })).corps;
    ing[nom] = l.find((i) => i.nom === nom)!.id;
  }
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("ingrédients", () => {
  it("[F] un nom déjà pris est refusé ; une unité inconnue aussi", async () => {
    expect((await appel("POST", "/api/ingredients", { nom: "tomates", unite: "kg", prix: 1 })).statut).toBe(409);
    expect((await appel("POST", "/api/ingredients", { nom: "Sel", unite: "pincée", prix: 1 })).statut).toBe(400);
  });
});

describe("recette du burger (exemple de Rémi)", () => {
  it("100 g de tomates, 25 g de salade, 120 g de steak, 1 pain → 2,00 € ; devient le coût matière", async () => {
    const r = await appel<Recette>("PUT", `/api/produits/${burger.id}/recette`, {
      lignes: [
        { ingredientId: ing["Tomates"], quantiteMilli: 100 },
        { ingredientId: ing["Salade"], quantiteMilli: 25 },
        { ingredientId: ing["Steak haché"], quantiteMilli: 120 },
        { ingredientId: ing["Pain burger"], quantiteMilli: 1000 },
      ],
    });
    expect(r.statut).toBe(200);
    expect(r.corps.cout).toBe(200);
    expect(r.corps.lignes.find((l) => l.nom === "Tomates")!.cout).toBeCloseTo(25, 9);
    expect(await produit()).toMatchObject({ coutMatiere: 200, aRecette: true });
    expect((await appel<Ingredient[]>("GET", "/api/ingredients")).corps.find((i) => i.nom === "Tomates")!.recettes).toBe(1);
  });

  it("[F] un ingrédient en double dans la recette est refusé", async () => {
    const r = await appel("PUT", `/api/produits/${burger.id}/recette`, {
      lignes: [
        { ingredientId: ing["Tomates"], quantiteMilli: 100 },
        { ingredientId: ing["Tomates"], quantiteMilli: 50 },
      ],
    });
    expect(r.statut).toBe(400);
  });

  it("les tomates passent à 3,00 €/kg : le burger est recalculé seul (2,05 €), et c'est journalisé", async () => {
    expect((await appel("PATCH", `/api/ingredients/${ing["Tomates"]}`, { prix: 300 })).statut).toBe(200);
    expect((await produit()).coutMatiere).toBe(205);
    const e = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=20")).corps.find((x) => x.type === "ingredient_modifie")!;
    expect(e.details).toMatchObject({ ingredient: "Tomates", produits_recalcules: [{ produit: "Burger", avant: 200, apres: 205 }] });
  });

  it("[F] un produit avec recette : ni coût saisi à la main, ni livraison", async () => {
    const r = await appel<{ erreur: string }>("PATCH", `/api/produits/${burger.id}`, { coutMatiere: 150 });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("recette");
    const l = await appel<{ erreur: string }>("POST", "/api/stock/livraisons", { produitId: burger.id, quantite: 10, prixUnitaire: 150, fournisseur: "X", dateLivraison: "2026-09-30" });
    expect(l.statut).toBe(409);
  });
});

describe("mode formation", () => {
  it("ingrédients et recettes recopiés ; ils ne se modifient pas dans le lieu d'entraînement", async () => {
    const entree = await appel<SessionInfo>("POST", "/api/formation/entree");
    cookie = `fx_session=${entree.cookies.find((k) => k.name === "fx_session")!.value}`;
    const ingredients = (await appel<Ingredient[]>("GET", "/api/ingredients")).corps;
    expect(ingredients.map((i) => i.nom).sort()).toEqual(["Pain burger", "Salade", "Steak haché", "Tomates"]);
    const burgerF = (await appel<Produit[]>("GET", "/api/produits")).corps.find((p) => p.nom === "Burger")!;
    expect(burgerF).toMatchObject({ coutMatiere: 205, aRecette: true });
    expect((await appel<Recette>("GET", `/api/produits/${burgerF.id}/recette`)).corps.lignes).toHaveLength(4);
    expect((await appel("POST", "/api/ingredients", { nom: "Oignons", unite: "kg", prix: 200 })).statut).toBe(409);
    expect((await appel("PUT", `/api/produits/${burgerF.id}/recette`, { lignes: [] })).statut).toBe(409);
    const sortie = await appel<SessionInfo>("POST", "/api/formation/sortie");
    cookie = `fx_session=${sortie.cookies.find((k) => k.name === "fx_session")!.value}`;
  });
});

describe("retirer la recette", () => {
  it("le coût reste le dernier calculé et redevient modifiable", async () => {
    expect((await appel<Recette>("PUT", `/api/produits/${burger.id}/recette`, { lignes: [] })).corps.cout).toBeNull();
    expect(await produit()).toMatchObject({ coutMatiere: 205, aRecette: false });
    expect((await appel("PATCH", `/api/produits/${burger.id}`, { coutMatiere: 190 })).statut).toBe(200);
  });
});
