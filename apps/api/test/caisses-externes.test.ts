/**
 * Caisses connectées (dossier §15.150), contre la vraie base : option du lieu, caisse ajoutée, aperçu sans rien enregistrer,
 * import d'un export (ventes regroupées, lignes fautives écartées), réimport sans doublon avec annulation reportée,
 * correspondances produit et point de vente, résultats (chiffre d'affaires, marge, stand, événement, heure). Les ventes
 * importées restent hors du journal de caisse.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CaisseExterne, Evenement, Produit, ProduitExterne, PointDeVenteExterne, ReponsePrevision, Resultats, Stand, SyntheseVentesExternes } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let caisse = "";
let biere: Produit;
let stand: Stand;
let rouen: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}

const EXPORT = [
  "N° ticket;Date;Bar;Article;Code;Qté;Prix unitaire TTC;Montant TTC;TVA;Paiement;Statut",
  "T-001;05/10/2026 20:15;Bar Nord;Bière 50 cl;BIE50;2;7,00;14,00;20;Cashless;",
  "T-001;05/10/2026 20:15;Bar Nord;Consigne gobelet;CONS;2;1,00;2,00;0;Cashless;",
  "T-002;05/10/2026 21:05;Bar Sud;Bière 50 cl;BIE50;1;7,00;7,00;20;Carte;",
  "T-003;illisible;Bar Sud;Eau;EAU;1;2,00;2,00;5,5;Carte;",
  "T-004;05/10/2026 22:01;Bar Nord;Frites;FRI;1;3,50;3,50;10;Carte;",
].join("\n");

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  rouen = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: "2026-10-05T18:00:00.000Z" })).corps.find((e) => e.libelle === "Rouen")!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("caisses connectées", () => {
  it("module désactivé par défaut : refusé tant que FlaiX Expert ne l'a pas activé", async () => {
    expect((await appel("GET", "/api/caisses-externes")).statut).toBe(403);
    await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'caisses_connectees', true, $2)", [lieu.lieuId, lieu.utilisateurId]);
    expect((await appel<CaisseExterne[]>("GET", "/api/caisses-externes")).corps).toEqual([]);
  });

  it("ajout d'une caisse, inscrit au journal ; système inconnu refusé", async () => {
    expect((await appel("POST", "/api/caisses-externes", { nom: "Stade", systeme: "inconnue" })).statut).toBe(400);
    const r = await appel<CaisseExterne[]>("POST", "/api/caisses-externes", { nom: "Digifood stade", systeme: "digifood" });
    expect(r.corps).toEqual([expect.objectContaining({ nom: "Digifood stade", systeme: "digifood", ventes: 0, dernierImport: null })]);
    caisse = r.corps[0]!.id;
    const { rows } = await proprietaire.pool.query("SELECT 1 FROM journal_technique WHERE lieu_id = $1 AND type = 'caisse_externe_creee'", [lieu.lieuId]);
    expect(rows).toHaveLength(1);
  });

  it("aperçu : colonnes reconnues, ventes comptées, ligne fautive montrée ; rien n'est enregistré", async () => {
    const r = await appel<{ manquants: string[]; ventes: number; montant: number; erreurs: { ligne: number }[] }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "ventes.csv", contenu: EXPORT, apercu: true });
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ manquants: [], ventes: 3, montant: 2_650, erreurs: [{ ligne: 5 }] });
    expect((await appel<CaisseExterne[]>("GET", "/api/caisses-externes")).corps[0]!.ventes).toBe(0);
  });

  it("import : ventes ajoutées, colonnes retenues, relevé et journal ; aucune vente dans le journal de caisse", async () => {
    const r = await appel<{ ajoutees: number; deja: number; erreurs: unknown[]; caisses: CaisseExterne[] }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "ventes.csv", contenu: EXPORT });
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ ajoutees: 3, deja: 0, erreurs: [{ ligne: 5 }] });
    expect(r.corps.caisses[0]).toMatchObject({ ventes: 3, colonnes: { vente: 0, date: 1, pointDeVente: 2 }, dernierImport: { fichier: "ventes.csv", ventesAjoutees: 3, erreurs: 1 } });
    const { rows } = await proprietaire.pool.query("SELECT count(*)::int AS n FROM journal_caisse WHERE lieu_id = $1", [lieu.lieuId]);
    expect(rows[0].n).toBe(0);
  });

  it("réimport : aucune vente comptée deux fois, l'annulation est reportée, la nouvelle vente ajoutée", async () => {
    const suite = EXPORT.replace("T-002;05/10/2026 21:05;Bar Sud;Bière 50 cl;BIE50;1;7,00;7,00;20;Carte;", "T-002;05/10/2026 21:05;Bar Sud;Bière 50 cl;BIE50;1;7,00;7,00;20;Carte;Annulée") + "\nT-005;05/10/2026 22:30;Bar Nord;Bière 50 cl;BIE50;1;7,00;7,00;20;Carte;";
    const r = await appel<{ ajoutees: number; deja: number; annulationsReportees: number }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "ventes-suite.csv", contenu: suite });
    expect(r.corps).toMatchObject({ ajoutees: 1, deja: 3, annulationsReportees: 1 });
  });

  it("[F] colonnes obligatoires introuvables : refusé avec la liste ; colonnes choisies à l'écran : import accepté", async () => {
    const fichier = "Ref;Quand;Quoi;Combien;Prix\nX-1;06/10/2026 20:00;Coca;1;3,00";
    const r = await appel<{ erreur: string }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "autre.csv", contenu: fichier, colonnes: { code: 0, prixUnitaire: 4 } });
    expect(r.statut).toBe(400);
    expect(r.corps.erreur).toContain("N° de vente");
    const ok = await appel<{ ajoutees: number }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "autre.csv", contenu: fichier, colonnes: { vente: 0, date: 1, produit: 2, quantite: 3, prixUnitaire: 4 } });
    expect(ok.corps.ajoutees).toBe(1);
  });

  it("correspondances : produit de la caisse → produit FlaiX Expert ou ignoré ; point de vente → stand", async () => {
    const produits = (await appel<ProduitExterne[]>("GET", `/api/caisses-externes/${caisse}/produits`)).corps;
    expect(produits.map((p) => p.cle)).toEqual(["BIE50", "FRI", "Coca", "CONS"]);
    expect(produits[0]).toMatchObject({ libelle: "Bière 50 cl", quantite: 3, montant: 2_100, produitId: null, ignore: false });
    await appel("PUT", `/api/caisses-externes/${caisse}/produits`, { cle: "BIE50", produitId: biere.id, ignore: false });
    const apres = (await appel<ProduitExterne[]>("PUT", `/api/caisses-externes/${caisse}/produits`, { cle: "CONS", produitId: null, ignore: true })).corps;
    expect(apres.find((p) => p.cle === "BIE50")!.produitId).toBe(biere.id);
    expect(apres.find((p) => p.cle === "CONS")!.ignore).toBe(true);
    expect((await appel("PUT", `/api/caisses-externes/${caisse}/produits`, { cle: "FRI", produitId: biere.id, ignore: true })).statut).toBe(400);

    const pdv = (await appel<PointDeVenteExterne[]>("PUT", `/api/caisses-externes/${caisse}/points-de-vente`, { nom: "Bar Nord", standId: stand.id })).corps;
    expect(pdv.find((p) => p.nom === "Bar Nord")).toMatchObject({ standId: stand.id, ventes: 3 });
  });

  it("résultats : chiffre d'affaires sans les annulées ni les ignorés, marge des produits rapprochés, par stand, événement, heure", async () => {
    const r = await appel<SyntheseVentesExternes>("GET", "/api/caisses-externes/synthese?du=2026-10-05&au=2026-10-06");
    expect(r.statut).toBe(200);
    // Non annulées : T-001 (bière 14,00 ; consigne ignorée), T-004 (frites 3,50), T-005 (bière 7,00), X-1 (coca 3,00).
    expect(r.corps).toMatchObject({ ventes: 4, annulees: 1, montant: 2_750, montantAvecCout: 2_100, cout: 360 });
    expect(r.corps.parProduit[0]).toMatchObject({ cle: biere.id, libelle: "Bière", quantite: 3, montant: 2_100, cout: 360 });
    expect(r.corps.parStand.find((s) => s.libelle === "Buvette Nord")).toMatchObject({ montant: 2_450 });
    expect(r.corps.parEvenement.map((e) => e.libelle)).toEqual(["Rouen", "Hors événement"]);
    expect(r.corps.parHeure.map((h) => h.heure)).toEqual([20, 22]);
    expect((await appel("GET", "/api/caisses-externes/synthese?du=2026-10-06&au=2026-10-05")).statut).toBe(400);
  });

  it("les ventes déposées alimentent les Résultats : chiffre d'affaires, stand, mode de paiement, marges ; produit non rapproché sans marge inventée (§15.151)", async () => {
    const r = await appel<Resultats>("GET", `/api/resultats?evenementId=${rouen.id}`);
    expect(r.statut).toBe(200);
    expect(r.corps.matchs.map((m) => m.libelle)).toContain("Rouen");
    // Rouen, le 05/10 : T-001 (bière 14,00 ; consigne ignorée), T-004 (frites 3,50), T-005 (bière 7,00) ; T-002 annulée.
    expect(r.corps.actuel).toMatchObject({ caTtc: 2_450, tickets: 3, parStand: [{ nom: "Buvette Nord", ca: 2_450 }], parMode: { especes: 0, carte: 1_050 } });
    const biereVendue = r.corps.actuel!.produits.find((p) => p.produitId === biere.id)!;
    // 21,00 € TTC à 20 % = 17,50 € HT ; 3 × 1,20 € de coût matière ; marge 13,90 €.
    expect(biereVendue).toMatchObject({ nom: "Bière", quantite: 3, caTtc: 2_100, caHt: 1_750, marge: 1_390 });
    expect(r.corps.actuel!.produits.find((p) => p.produitId === "externe:Frites")).toMatchObject({ nom: "Frites", coutUnitaire: null, marge: null });
    expect(r.corps.actuel).toMatchObject({ produitsSansCout: ["Frites"], margeBrute: null });
    expect(r.corps.alertes.find((a) => a.titre.startsWith("Coût manquant"))!.detail).toContain("Caisses connectées");
  });

  it("… la prévision (réalisé de l'événement), le stock du stand ; et jamais les clôtures fiscales", async () => {
    const p = await appel<ReponsePrevision>("GET", `/api/prevision?evenementId=${rouen.id}`);
    expect(p.corps.realise).toMatchObject({ ca: 2_450, tickets: 3, produits: { [`${stand.id}|${biere.id}`]: 3 } });
    const s = await appel<{ stands: { standId: string; lignes: { produitId: string; vendu: number }[] }[] }>("GET", `/api/stock?evenementId=${rouen.id}`);
    expect(s.statut).toBe(200);
    expect(s.corps.stands.find((x) => x.standId === stand.id)!.lignes.find((l) => l.produitId === biere.id)).toMatchObject({ vendu: 3 });
    const { rows } = await proprietaire.pool.query("SELECT count(*)::int AS n FROM cloture_periode WHERE lieu_id = $1", [lieu.lieuId]);
    expect(rows[0].n).toBe(0);
  });

  it("[F] un autre lieu ne voit rien de ces ventes", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'caisses_connectees', true, $2)", [autre.lieuId, autre.utilisateurId]);
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: autre.email, motDePasse: MOT_DE_PASSE_TEST } });
    const sienne = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
    const liste = await serveur.inject({ method: "GET", url: "/api/caisses-externes", headers: { cookie: sienne } });
    expect(liste.json()).toEqual([]);
    const produits = await serveur.inject({ method: "GET", url: `/api/caisses-externes/${caisse}/produits`, headers: { cookie: sienne } });
    expect(produits.statusCode).toBe(404);
  });

  it("correspondances automatiques (§15.152) : même nom relié à l'import, nom proche proposé, tout accepter ; « aucun » choisi à la main respecté", async () => {
    const id = (await appel<CaisseExterne[]>("POST", "/api/caisses-externes", { nom: "Weezevent", systeme: "weezevent" })).corps.find((c) => c.nom === "Weezevent")!.id;
    const sud = (await appel<Stand[]>("POST", "/api/stands", { nom: "BAR SUD" })).corps.find((s) => s.nom === "BAR SUD")!;
    const frites = (await appel<Produit[]>("POST", "/api/produits", { nom: "frites", prixTtc: 350, tauxTva: 1000, coutMatiere: 80, standIds: [stand.id] })).corps.find((p) => p.nom === "frites")!;
    const eau = (await appel<Produit[]>("POST", "/api/produits", { nom: "Eau minérale 50 cl", prixTtc: 200, tauxTva: 550, coutMatiere: 30, standIds: [stand.id] })).corps.find(
      (p) => p.nom === "Eau minérale 50 cl",
    )!;
    const fichier = [
      "N° ticket;Date;Bar;Article;Qté;Montant TTC",
      "W-1;07/10/2026 20:00;Bar Sud;FRITES;1;3,50",
      "W-1;07/10/2026 20:00;Bar Sud;Eau 50cl;1;2,00",
      "W-2;07/10/2026 20:10;Bar Nord;Bière 50 cl;2;14,00",
      "W-3;07/10/2026 20:20;Bar Nord;Chips;1;2,00",
    ].join("\n");
    const r = await appel<{ relies: { produits: number; pointsDeVente: number } }>("POST", `/api/caisses-externes/${id}/import`, { fichier: "weez.csv", contenu: fichier });
    expect(r.corps.relies).toEqual({ produits: 1, pointsDeVente: 1 });
    const { rows: jet } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'caisse_externe_import' ORDER BY numero DESC LIMIT 1", [lieu.lieuId]);
    expect(jet[0].details.reliesAutomatiquement).toEqual({ produits: 1, pointsDeVente: 1 });

    let produits = (await appel<ProduitExterne[]>("GET", `/api/caisses-externes/${id}/produits`)).corps;
    const de = (cle: string) => produits.find((p) => p.cle === cle)!;
    expect(de("FRITES")).toMatchObject({ produitId: frites.id, automatique: true, suggestion: null });
    expect(de("Eau 50cl")).toMatchObject({ produitId: null, automatique: false, suggestion: { id: eau.id, nom: "Eau minérale 50 cl", memeNom: false } });
    expect(de("Bière 50 cl").suggestion).toMatchObject({ id: biere.id, nom: "Bière" });
    expect(de("Chips").suggestion).toBeNull();
    let pdv = (await appel<PointDeVenteExterne[]>("GET", `/api/caisses-externes/${id}/points-de-vente`)).corps;
    expect(pdv.find((p) => p.nom === "Bar Sud")).toMatchObject({ standId: sud.id, automatique: true, suggestion: null });
    // « Bar Nord » : jamais « BAR SUD » ; « Buvette Nord » proposé.
    expect(pdv.find((p) => p.nom === "Bar Nord")).toMatchObject({ standId: null, suggestion: { id: stand.id, nom: "Buvette Nord" } });

    // Le directeur retire le lien des frites et refuse la bière (« aucun ») : plus de suggestion, plus de liaison automatique.
    await appel("PUT", `/api/caisses-externes/${id}/produits`, { cle: "FRITES", produitId: null, ignore: false });
    produits = (await appel<ProduitExterne[]>("PUT", `/api/caisses-externes/${id}/produits`, { cle: "Bière 50 cl", produitId: null, ignore: false })).corps;
    expect(de("FRITES")).toMatchObject({ produitId: null, automatique: false, suggestion: null });
    expect(de("Bière 50 cl").suggestion).toBeNull();
    const encore = await appel<{ relies: { produits: number } }>("POST", `/api/caisses-externes/${id}/import`, { fichier: "weez.csv", contenu: fichier });
    expect(encore.corps.relies.produits).toBe(0);

    // Tout accepter : l'eau seulement, choix du directeur (pas « automatique »), inscrit au journal.
    produits = (await appel<ProduitExterne[]>("POST", `/api/caisses-externes/${id}/produits/suggestions`)).corps;
    expect(de("Eau 50cl")).toMatchObject({ produitId: eau.id, automatique: false, suggestion: null });
    expect(de("Bière 50 cl").produitId).toBeNull();
    expect(de("FRITES").produitId).toBeNull();
    pdv = (await appel<PointDeVenteExterne[]>("POST", `/api/caisses-externes/${id}/points-de-vente/suggestions`)).corps;
    expect(pdv.find((p) => p.nom === "Bar Nord")).toMatchObject({ standId: stand.id, automatique: false });
    const { rows } = await proprietaire.pool.query("SELECT count(*)::int AS n FROM journal_technique WHERE lieu_id = $1 AND type = 'correspondances_suggerees_acceptees'", [lieu.lieuId]);
    expect(rows[0].n).toBe(2);
  });
});
