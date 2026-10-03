/**
 * Stock des ingrédients suivis (décision de Rémi, dossier §15.124), contre la vraie base.
 * Cas de Rémi : la bière pression — fût en litres, la pinte de 50 cl déduit 0,5 L.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, EntreeJournalTechnique, EtatReserveIngredients, Evenement, Ingredient, Produit, RepriseCaisse, Stand, StockIngredientsMatch } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let nord: Stand;
let fut: Ingredient;
let pinte: Produit;
let match1: Evenement;
let match2: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const stock = async (e: Evenement) => (await appel<StockIngredientsMatch>("GET", `/api/stock/ingredients?evenementId=${e.id}`)).corps;
const ligneFut = (s: StockIngredientsMatch) => s.stands.find((x) => x.standId === nord.id)!.lignes.find((l) => l.ingredientId === fut.id);
const reserve = async () => (await appel<EtatReserveIngredients>("GET", "/api/stock/ingredients/reserve")).corps;
const caisse = () => nord.caisses[0]!.id;
const champ = (e: Evenement) => ({ evenementId: e.id, standId: nord.id, ingredientId: fut.id });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  nord = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!;
  fut = (await appel<Ingredient[]>("POST", "/api/ingredients", { nom: "Fût blonde", unite: "l", prix: 300 })).corps.find((i) => i.nom === "Fût blonde")!;
  pinte = (await appel<Produit[]>("POST", "/api/produits", { nom: "Pinte blonde", prixTtc: 650, tauxTva: 2000, coutMatiere: null, standIds: [nord.id] })).corps[0]!;
  await appel("PUT", `/api/produits/${pinte.id}/recette`, { lignes: [{ ingredientId: fut.id, quantiteMilli: 500 }] });
  const evt = async (libelle: string, jours: number) =>
    (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() + jours * 86_400_000).toISOString() })).corps.find((e) => e.libelle === libelle)!;
  match1 = await evt("Match 1", 1);
  match2 = await evt("Match 2", 8);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("un ingrédient n'est suivi que si le directeur le décide", () => {
  it("non suivi : absent du stock, livraison refusée", async () => {
    expect(fut.suiviStock).toBe(false);
    expect(ligneFut(await stock(match1))).toBeUndefined();
    const r = await appel<{ erreur: string }>("POST", "/api/stock/ingredients/livraisons", { ingredientId: fut.id, quantiteMilli: 60_000, prixTotal: 18_000, dateLivraison: "2026-09-01" });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("suivre le stock");
  });

  it("case cochée : il apparaît au stand où se vend la pinte, journalisé", async () => {
    const i = (await appel<Ingredient[]>("PATCH", `/api/ingredients/${fut.id}`, { suiviStock: true })).corps.find((x) => x.id === fut.id)!;
    expect(i.suiviStock).toBe(true);
    expect(ligneFut(await stock(match1))).toMatchObject({ nom: "Fût blonde", unite: "l", depart: 0, consomme: 0 });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=20")).corps.find((e) => e.type === "ingredient_modifie")!;
    expect(jet.details).toMatchObject({ apres: { suiviStock: true } });
  });
});

describe("réserve : livraisons au prix total, coût moyen pondéré", () => {
  it("2 fûts de 30 L à 180 € : 3,00 €/L ; puis 30 L à 102 € → (60 × 3,00 + 30 × 3,40) ÷ 90 = 3,13 €/L, la pinte suit", async () => {
    let r = await appel<EtatReserveIngredients>("POST", "/api/stock/ingredients/livraisons", { ingredientId: fut.id, quantiteMilli: 60_000, prixTotal: 18_000, fournisseur: "Brasseur", dateLivraison: "2026-09-01" });
    expect(r.statut).toBe(201);
    expect(r.corps.ingredients[0]).toMatchObject({ solde: 60_000, prix: 300 });
    r = await appel<EtatReserveIngredients>("POST", "/api/stock/ingredients/livraisons", { ingredientId: fut.id, quantiteMilli: 30_000, prixTotal: 10_200, dateLivraison: "2026-09-02" });
    expect(r.corps.ingredients[0]).toMatchObject({ solde: 90_000, prix: 313 });
    expect(r.corps.mouvements[0]).toMatchObject({ type: "livraison", quantite: 30_000, prixTotal: 10_200, prixAvant: 300, prixApres: 313 });
    const produits = (await appel<Produit[]>("GET", "/api/produits")).corps;
    expect(produits.find((p) => p.id === pinte.id)!.coutMatiere).toBe(157);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=20")).corps.find((e) => e.type === "ingredient_livre")!;
    expect(jet.details).toMatchObject({ quantite: "30 L", produits_recalcules: [{ produit: "Pinte blonde", apres: 157 }] });
  });
});

describe("match 1 : la bière pression", () => {
  it("mise en place de 30 L au stand avant l'ouverture : la réserve descend à 60 L", async () => {
    const s = (await appel<StockIngredientsMatch>("PUT", "/api/stock/ingredients/mise-en-place", { ...champ(match1), quantiteMilli: 30_000 })).corps;
    expect(ligneFut(s)).toMatchObject({ miseEnPlace: 30_000, depart: 30_000, restant: 30_000, premierMatch: true, suggestion: null });
    expect(s.reserve[fut.id]).toBe(60_000);
  });

  it("52 pintes vendues : 26 L consommés selon la recette, restant attendu 4 L", async () => {
    await appel("POST", `/api/evenements/${match1.id}/ouverture`);
    const t = tablette(caisse(), (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse()}/ouverture`, {})).corps);
    vendreHorsLigne(t, [ligne(pinte, 52)]);
    await envoyer(appel, t);
    await appel("POST", `/api/caisses/${caisse()}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
    expect(ligneFut(await stock(match1))).toMatchObject({ consomme: 26_000, restant: 4_000 });
    expect((await appel("PUT", "/api/stock/ingredients/mise-en-place", { ...champ(match1), quantiteMilli: 40_000 })).statut).toBe(409);
  });

  it("la clôture du match exige le comptage du fût", async () => {
    const c = (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match1.id}`)).corps;
    expect(c.etapes.restes).toEqual({ requis: true, manquants: 1 });
    const r = await appel<{ erreur: string }>("POST", `/api/evenements/${match1.id}/cloture`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("ingrédient");
  });

  it("fût vide en fin de match : −4 L, au-delà de 3 % du départ → motif exigé ; valorisé au prix moyen", async () => {
    const sansMotif = await appel<{ erreur: string }>("PUT", "/api/stock/ingredients/comptage", { ...champ(match1), quantiteMilli: 0 });
    expect(sansMotif.statut).toBe(400);
    expect(sansMotif.corps.erreur).toContain("−4 L");
    const s = (await appel<StockIngredientsMatch>("PUT", "/api/stock/ingredients/comptage", { ...champ(match1), quantiteMilli: 0, motif: "Mousse et verres offerts" })).corps;
    expect(ligneFut(s)).toMatchObject({ compte: 0, ecart: -4_000, ecartValeur: -4_000 * 313 / 1000, motifRequis: true });
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(200);
  });

  it("match clos : la consommation est figée, une recette changée ensuite ne réécrit pas le passé", async () => {
    await appel("PUT", `/api/produits/${pinte.id}/recette`, { lignes: [{ ingredientId: fut.id, quantiteMilli: 400 }] });
    expect(ligneFut(await stock(match1))).toMatchObject({ consomme: 26_000, ecart: -4_000 });
    expect((await appel("PUT", "/api/stock/ingredients/comptage", { ...champ(match1), quantiteMilli: 1_000, motif: "Correction tardive" })).statut).toBe(409);
  });

  it("[F] la base refuse de modifier ou supprimer un mouvement ou une consommation figée", async () => {
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE ingredient_mouvement SET quantite_milli = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE ingredient_consommation SET quantite_milli = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM ingredient_mouvement WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE ingredient_comptage SET quantite_milli = 5 WHERE evenement_id = $1", [match1.id])))).toBe("23514");
  });
});

describe("match suivant et inventaire", () => {
  it("reste 0 L reporté ; suggestion = consommation moyenne (26 L) − reste", async () => {
    expect(ligneFut(await stock(match2))).toMatchObject({ reste: 0, premierMatch: false, suggestion: 26_000 });
    const s = (await appel<StockIngredientsMatch>("POST", "/api/stock/ingredients/mise-en-place/suggestions", { evenementId: match2.id })).corps;
    expect(ligneFut(s)).toMatchObject({ miseEnPlace: 26_000 });
  });

  it("inventaire de la réserve : calculé 90 − 30 − 26 = 34 L, compté 33,5 L → écart −0,5 L", async () => {
    expect((await reserve()).ingredients[0]!.solde).toBe(34_000);
    const r = (await appel<EtatReserveIngredients>("POST", "/api/stock/ingredients/inventaires", { dateInventaire: "2026-10-05", lignes: [{ ingredientId: fut.id, compteMilli: 33_500 }] })).corps;
    expect(r.inventaires[0]!.lignes[0]).toMatchObject({ calcule: 34_000, compte: 33_500, ecart: -500 });
    expect(r.ingredients[0]).toMatchObject({ solde: 33_500, livreDepuis: 0, sortiDepuis: 0 });
  });
});
