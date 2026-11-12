/**
 * Copier le catalogue d'un lieu dans un autre du même client, depuis le back-office (dossier §15.180), contre la vraie
 * base : catégories, produits et prix, ingrédients et recettes, emballages, correspondances des factures fournisseurs.
 * Rien n'est écrasé : un produit déjà là garde son prix ; il reçoit la recette s'il n'en avait pas. [F] Deux lieux sans
 * directeur commun (deux clients) : refusé. Une seconde copie n'ajoute rien.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CatalogueCopie, Categorie, CorrespondanceArticle, Emballage, Ingredient, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let editeur = "";
let source: { lieuId: string; utilisateurId: string; email: string };
let cible: { lieuId: string; utilisateurId: string; email: string };
let autreClient: { lieuId: string; utilisateurId: string; email: string };
let cookieSource = "";
let cookieCible = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function requete<T = unknown>(cookie: string, method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
async function connecter(email: string) {
  const r = await requete("", "POST", "/api/auth/connexion", { email, motDePasse: MOT_DE_PASSE_TEST });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}
const copier = (cibleId: string, sourceId: string) => requete<CatalogueCopie & { erreur?: string }>(editeur, "POST", `/api/editeur/lieux/${cibleId}/copie-catalogue`, { source: sourceId });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  source = await creerLieuDeTest(proprietaire);
  cible = await creerLieuDeTest(proprietaire);
  autreClient = await creerLieuDeTest(proprietaire);
  // Le directeur du lieu d'origine dirige aussi le lieu à remplir : même client.
  await proprietaire.pool.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, 'directeur')", [cible.lieuId, source.utilisateurId]);
  const email = `editeur-copie-${Date.now()}@flaixexpert.test`;
  const { rows } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Rémi', $2) RETURNING id", [email, await hacherMotDePasse(MOT_DE_PASSE_TEST)]);
  await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [rows[0]!.id]);
  const r = await requete("", "POST", "/api/editeur/connexion", { email, motDePasse: MOT_DE_PASSE_TEST });
  editeur = `fx_editeur=${r.cookies.find((k) => k.name === "fx_editeur")!.value}`;

  // Lieu d'origine : une catégorie, deux produits, un ingrédient, une recette, un emballage, une correspondance.
  cookieSource = await connecter(source.email);
  const snack = (await requete<Categorie[]>(cookieSource, "POST", "/api/categories", { nom: "Snacking" })).corps.find((c) => c.nom === "Snacking")!;
  const produits = (await requete<Produit[]>(cookieSource, "POST", "/api/produits", { nom: "Hot dog", prixTtc: 690, tauxTva: 1000, coutMatiere: null, categorieId: snack.id })).corps;
  await requete(cookieSource, "POST", "/api/produits", { nom: "Box hot dog", prixTtc: 990, tauxTva: 1000, coutMatiere: null, categorieId: snack.id });
  const hotdog = produits.find((p) => p.nom === "Hot dog")!;
  const saucisse = (await requete<Ingredient[]>(cookieSource, "POST", "/api/ingredients", { nom: "Hot dog complet (saucisse + pain)", unite: "piece", prix: 169 })).corps[0]!;
  await requete(cookieSource, "PUT", `/api/produits/${hotdog.id}/recette`, { lignes: [{ ingredientId: saucisse.id, quantiteMilli: 1_000 }] });
  const barquette = (await requete<Emballage[]>(cookieSource, "POST", "/api/emballages", { nom: "Barquette", prixMillimes: 120 })).corps.find((e) => e.nom === "Barquette")!;
  await requete(cookieSource, "PUT", `/api/produits/${hotdog.id}/emballages`, { emballages: [{ emballageId: barquette.id, quantite: 1 }] });
  await requete(cookieSource, "POST", "/api/factures", {
    fournisseur: "Relais d'Or Provence",
    numero: "F-1",
    dateFacture: "2026-10-08",
    echeance: null,
    lignes: [{ produitId: null, libelle: "Box hotdog maxi porc 32x160g", codeArticle: "939504", quantite: 1, prixUnitaire: 5_415, ingredientId: saucisse.id, ingredientMilliParUnite: 32_000 }],
  });

  // Lieu à remplir : son « Hot dog » existe déjà, à 7,50 €, sans recette.
  cookieCible = await connecter(cible.email);
  await requete(cookieCible, "POST", "/api/produits", { nom: "hot dog", prixTtc: 750, tauxTva: 1000, coutMatiere: null });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("copie du catalogue entre deux lieux du même client", () => {
  it("[F] deux lieux sans directeur commun (deux clients) : refusé, rien n'est copié", async () => {
    const r = await copier(autreClient.lieuId, source.lieuId);
    expect(r.statut).toBe(403);
    expect(r.corps.erreur).toContain("aucun directeur en commun");
    const { rows } = await proprietaire.pool.query("SELECT count(*)::int AS n FROM produit WHERE lieu_id = $1", [autreClient.lieuId]);
    expect(rows[0].n).toBe(0);
    expect((await copier(source.lieuId, source.lieuId)).statut).toBe(400);
  });

  it("copié : ce qui manque est ajouté ; le produit déjà là garde son prix et reçoit la recette ; journal du lieu rempli", async () => {
    const r = await copier(cible.lieuId, source.lieuId);
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    expect(r.corps).toMatchObject({ categories: 1, produits: 1, ingredients: 1, recettes: 1, emballages: 1, correspondances: 1 });

    const produits = (await requete<Produit[]>(cookieCible, "GET", "/api/produits")).corps;
    const hotdog = produits.find((p) => p.nom === "hot dog")!;
    expect(hotdog.tarifEnVigueur?.prixTtc).toBe(750); // gardé
    expect(hotdog.coutMatiere).toBe(169); // recette reçue, coût recalculé
    expect(produits.find((p) => p.nom === "Box hot dog")!.tarifEnVigueur).toMatchObject({ prixTtc: 990, tauxTva: 1000 });
    const ingredient = (await requete<Ingredient[]>(cookieCible, "GET", "/api/ingredients")).corps.find((i) => i.nom === "Hot dog complet (saucisse + pain)")!;
    const corr = (await requete<CorrespondanceArticle[]>(cookieCible, "GET", "/api/factures/correspondances")).corps;
    expect(corr).toEqual([expect.objectContaining({ cle: "code:939504", ingredientId: ingredient.id, ingredientMilliParUnite: 32_000, produitId: null })]);
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'catalogue_copie'", [cible.lieuId]);
    expect(rows[0].details).toMatchObject({ produits: 1, recettes: 1 });
  });

  it("une seconde copie n'ajoute rien", async () => {
    const r = await copier(cible.lieuId, source.lieuId);
    expect(r.corps).toMatchObject({ categories: 0, produits: 0, ingredients: 0, emballages: 0, correspondances: 0 });
  });
});
