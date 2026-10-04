/**
 * Stock suivi à l'unité (dossier §15.105, module 4), contre la vraie base. Les tests [F]
 * provoquent ce que la base doit refuser d'elle-même.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, EntreeJournalTechnique, EtatReserve, Evenement, Produit, RepriseCaisse, Resultats, Stand, StockMatch } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let sud: Stand;
let hotDog: Produit;
let match1: Evenement;
let match2: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const stock = async (e: Evenement) => (await appel<StockMatch>("GET", `/api/stock?evenementId=${e.id}`)).corps;
const ligneHotDog = (s: StockMatch) => s.stands.find((x) => x.standId === sud.id)!.lignes.find((l) => l.produitId === hotDog.id)!;
const reserve = async () => (await appel<EtatReserve>("GET", "/api/stock/reserve")).corps;
const soldeHotDog = async () => (await reserve()).produits.find((p) => p.produitId === hotDog.id)!;
const caisse = () => sud.caisses[0]!.id;

/** Ouvre l'événement et la caisse, vend `n` hot-dogs, clôture la caisse. */
async function jouer(e: Evenement, n: number) {
  await appel("POST", `/api/evenements/${e.id}/ouverture`);
  const t = tablette(caisse(), (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse()}/ouverture`, {})).corps);
  if (n) vendreHorsLigne(t, [ligne(hotDog, n)]);
  await envoyer(appel, t);
  await appel("POST", `/api/caisses/${caisse()}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Sud" })).corps[0]!;
  sud = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!;
  hotDog = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 700, tauxTva: 1000, coutMatiere: 190, standIds: [sud.id] })).corps[0]!;
  const evt = async (libelle: string, jours: number) =>
    (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() + jours * 86_400_000).toISOString() })).corps.find((e) => e.libelle === libelle)!;
  match1 = await evt("Événement 1", 1);
  match2 = await evt("Événement 2", 8);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("réserve centrale : déclaration de départ, livraison, CUMP", () => {
  it("premier inventaire = déclaration de départ, sans écart ; le solde part de là", async () => {
    const r = await appel<EtatReserve>("POST", "/api/stock/inventaires", { dateInventaire: "2026-09-01", lignes: [{ produitId: hotDog.id, compte: 300 }] });
    expect(r.statut).toBe(201);
    expect(r.corps.inventaires[0]!.lignes[0]).toMatchObject({ calcule: null, compte: 300, ecart: null });
    expect(await soldeHotDog()).toMatchObject({ solde: 300, inventaire: { date: "2026-09-01", compte: 300 } });
  });

  it("livraison de 200 à 1,95 € : la réserve monte, le coût matière devient le CUMP (300 × 1,90 + 200 × 1,95) ÷ 500 = 1,92 €", async () => {
    const r = await appel<EtatReserve>("POST", "/api/stock/livraisons", { produitId: hotDog.id, quantite: 200, prixUnitaire: 195, fournisseur: "Grossiste", dateLivraison: "2026-09-05" });
    expect(r.statut).toBe(201);
    expect(r.corps.produits.find((p) => p.produitId === hotDog.id)).toMatchObject({ solde: 500, coutUnitaire: 192 });
    expect(r.corps.mouvements[0]).toMatchObject({ type: "livraison", quantite: 200, coutAvant: 190, coutApres: 192, fournisseur: "Grossiste" });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
    expect(jet.some((e) => e.type === "livraison_recue")).toBe(true);
  });
});

describe("match 1 : mise en place, réassort, comptage", () => {
  it("mise en place avant l'ouverture : la réserve se décrémente, l'auteur et l'heure sont gardés ; pas d'historique = pas de suggestion", async () => {
    const s = (await appel<StockMatch>("PUT", "/api/stock/mise-en-place", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 160 })).corps;
    const l = ligneHotDog(s);
    expect(l).toMatchObject({ reste: 0, premierMatch: true, miseEnPlace: 160, depart: 160, restant: 160, seuil: 24, suggestion: null });
    expect(l.miseEnPlaceDerniere!.par).toContain("Personne test");
    expect(s.reserve[hotDog.id]).toBe(340);
    // Corriger la mise en place inscrit la différence, jamais une réécriture.
    await appel("PUT", "/api/stock/mise-en-place", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 150 });
    expect(ligneHotDog(await stock(match1)).miseEnPlace).toBe(150);
    await appel("PUT", "/api/stock/mise-en-place", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 160 });
    expect((await reserve()).mouvements.filter((m) => m.type === "mise_en_place").map((m) => m.quantite)).toEqual([10, -10, 160]);
  });

  it("pas de réassort avant l'ouverture ; après l'ouverture, plus de mise en place", async () => {
    expect((await appel("POST", "/api/stock/reassort", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 30 })).statut).toBe(409);
    await jouer(match1, 160);
    expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 200 })).statut).toBe(409);
  });

  it("exemple validé : départ 160, réassort 30, vendu 160 → restant 30 ; « − » ne dépasse pas le réassort", async () => {
    await appel("POST", "/api/stock/reassort", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 35 });
    await appel("POST", "/api/stock/reassort", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: -5 });
    expect((await appel("POST", "/api/stock/reassort", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: -40 })).statut).toBe(400);
    const l = ligneHotDog(await stock(match1));
    expect(l).toMatchObject({ depart: 160, reassort: 30, vendu: 160, restant: 30, alerte: null });
  });

  it("la clôture de l'événement exige le comptage des restes", async () => {
    const c = (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match1.id}`)).corps;
    expect(c.etapes.restes).toEqual({ requis: true, manquants: 1 });
    expect(c.etapes.cloturable).toBe(false);
    const r = await appel<{ erreur: string }>("POST", `/api/evenements/${match1.id}/cloture`);
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("compté");
  });

  it("compté 28 → écart −2, −3,84 € au CUMP ; sous 3 % du départ, pas de motif. Compté 20 → motif exigé", async () => {
    const s = (await appel<StockMatch>("PUT", "/api/stock/comptage", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 28 })).corps;
    expect(ligneHotDog(s)).toMatchObject({ compte: 28, ecart: -2, ecartValeur: -2 * 192, motifRequis: false });
    const sansMotif = await appel<{ erreur: string }>("PUT", "/api/stock/comptage", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 20 });
    expect(sansMotif.statut).toBe(400);
    expect(sansMotif.corps.erreur).toContain("motif");
    await appel("PUT", "/api/stock/comptage", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 20, motif: "Casse au transport" });
    await appel("PUT", "/api/stock/comptage", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 28 });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
    expect(jet.filter((e) => e.type === "comptage_stock_corrige")).toHaveLength(2);
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(200);
  });

  it("[F] événement clos : le comptage est figé par la base ; un mouvement ne se modifie ni ne se supprime", async () => {
    expect((await appel("PUT", "/api/stock/comptage", { evenementId: match1.id, standId: sud.id, produitId: hotDog.id, quantite: 30 })).statut).toBe(409);
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE stock_comptage SET quantite = 30 WHERE evenement_id = $1", [match1.id])))).toBe("23514");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE stock_mouvement SET quantite = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM stock_mouvement WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_id, stand_id, quantite, par) VALUES ($1, 'reassort', $2, $3, $4, 5, $5)", [lieu.lieuId, hotDog.id, match1.id, sud.id, lieu.utilisateurId])))).toBe("23514");
  });
});

describe("événement suivant : reste reporté, suggestion, inventaire réserve", () => {
  it("le reste compté à l'événement 1 devient le départ de l'événement 2 ; suggestion = ventes moyennes − reste", async () => {
    const l = ligneHotDog(await stock(match2));
    // Vendu 160 à l'événement 1, reste 28 → suggestion 132.
    expect(l).toMatchObject({ reste: 28, premierMatch: false, suggestion: 132, miseEnPlace: 0 });
    const s = (await appel<StockMatch>("POST", "/api/stock/mise-en-place/suggestions", { evenementId: match2.id })).corps;
    expect(ligneHotDog(s)).toMatchObject({ miseEnPlace: 132, depart: 160 });
  });

  it("inventaire réserve : solde calculé 500 − 160 − 30 − 132 = 178, compté 170 → écart −8 ; le compté devient le point de départ", async () => {
    expect((await soldeHotDog()).solde).toBe(178);
    const r = (await appel<EtatReserve>("POST", "/api/stock/inventaires", { dateInventaire: "2026-10-05", lignes: [{ produitId: hotDog.id, compte: 170 }] })).corps;
    expect(r.inventaires[0]!.lignes[0]).toMatchObject({ calcule: 178, compte: 170, ecart: -8, valeur: -8 * 192 });
    expect(r.produits.find((p) => p.produitId === hotDog.id)).toMatchObject({ solde: 170, livreDepuis: 0, sortiDepuis: 0 });
  });

  it("Résultats valorise au CUMP : le coût matière de la fiche est celui des livraisons", async () => {
    const r = (await appel<Resultats>("GET", `/api/resultats?evenementId=${match1.id}`)).corps;
    expect(r.actuel!.produits.find((p) => p.nom === "Hot-dog")!.coutUnitaire).toBe(192);
  });
});
