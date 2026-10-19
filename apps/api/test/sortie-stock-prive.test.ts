/**
 * Un événement privé sort ses consommations de la réserve centrale à sa clôture (dossier §15.169), contre la vraie base :
 * produit simple (canette) sorti lui-même ; produit fait d'un ingrédient suivi (pinte) sorti en ingrédient (0,5 L de
 * fût par pinte), pas en produit ; ligne libre : rien. Rien avant la clôture ; pas de sortie à la main ni en double.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EtatReserve, EtatReserveIngredients, EvenementPrive, Ingredient, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let canette: Produit;
let pinte: Produit;
let fut: Ingredient;
let soiree: EvenementPrive;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const reserveProduits = async () => (await appel<EtatReserve>("GET", "/api/stock/reserve")).corps;
const reserveIngredients = async () => (await appel<EtatReserveIngredients>("GET", "/api/stock/ingredients/reserve")).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  fut = (await appel<Ingredient[]>("POST", "/api/ingredients", { nom: "Fût blonde", unite: "l", prix: 300 })).corps.find((i) => i.nom === "Fût blonde")!;
  await appel("PATCH", `/api/ingredients/${fut.id}`, { suiviStock: true });
  await appel("POST", "/api/produits", { nom: "Canette", prixTtc: 400, tauxTva: 1000, coutMatiere: 80 });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Pinte blonde", prixTtc: 650, tauxTva: 2000, coutMatiere: null })).corps;
  canette = produits.find((p) => p.nom === "Canette")!;
  pinte = produits.find((p) => p.nom === "Pinte blonde")!;
  await appel("PUT", `/api/produits/${pinte.id}/recette`, { lignes: [{ ingredientId: fut.id, quantiteMilli: 500 }] });
  await appel("POST", "/api/stock/livraisons", { produitId: canette.id, quantite: 48, prixUnitaire: 80, dateLivraison: "2026-10-01" });
  await appel("POST", "/api/stock/ingredients/livraisons", { ingredientId: fut.id, quantiteMilli: 60_000, prixTotal: 18_000, dateLivraison: "2026-10-01" });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("événement privé : sortie de la réserve centrale à la clôture", () => {
  it("rien ne sort avant la clôture, ni à la main", async () => {
    soiree = (await appel<EvenementPrive>("POST", "/api/evenements-prives", { nom: "Séminaire", debut: "2026-10-18T19:00:00.000Z" })).corps;
    await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: canette.id, quantite: 12 });
    await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: pinte.id, quantite: 30 });
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/lignes`, { libelle: "Location du salon", prixTtc: 20_000, tauxTva: 2000 })).corps;
    expect(soiree.sortieStock).toEqual([]);
    expect((await reserveProduits()).produits.find((p) => p.produitId === canette.id)!.solde).toBe(48);
    // [F] Une sortie écrite à la main avant la clôture est refusée par la base.
    await expect(
      app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) =>
        c.query("INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_prive_id, quantite, par) VALUES ($1, 'evenement_prive', $2, $3, 1, $4)", [lieu.lieuId, canette.id, soiree.id, lieu.utilisateurId]),
      ),
    ).rejects.toThrow(/qu'à sa clôture/);
  });

  it("clôture : 12 canettes et 15 L de fût sortent ; la pinte ne sort pas en produit ; la location rien", async () => {
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/cloture`)).corps;
    expect(soiree.etat).toBe("cloture");
    expect(soiree.sortieStock).toEqual([
      { nom: "Canette", quantite: "12 ×" },
      { nom: "Fût blonde", quantite: "15 L" },
    ]);
    const produits = await reserveProduits();
    expect(produits.produits.find((p) => p.produitId === canette.id)!.solde).toBe(36);
    expect(produits.produits.find((p) => p.produitId === pinte.id)!.solde).toBe(0);
    expect(produits.mouvements[0]).toMatchObject({ type: "evenement_prive", produit: "Canette", match: "Séminaire", quantite: 12 });
    const ingredients = await reserveIngredients();
    expect(ingredients.ingredients.find((i) => i.ingredientId === fut.id)!.solde).toBe(45_000);
    expect(ingredients.mouvements[0]).toMatchObject({ type: "evenement_prive", match: "Séminaire" });
  });

  it("une seule sortie par produit et par événement privé", async () => {
    await expect(
      app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) =>
        c.query("INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_prive_id, quantite, par) VALUES ($1, 'evenement_prive', $2, $3, 1, $4)", [lieu.lieuId, canette.id, soiree.id, lieu.utilisateurId]),
      ),
    ).rejects.toThrow(/unique|duplicate|doublon/i);
  });
});
