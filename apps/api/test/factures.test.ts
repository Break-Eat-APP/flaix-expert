/**
 * Factures fournisseurs (module 12b ; dossier §15.115), contre la vraie base : saisie, rapprochement
 * avec les livraisons du Stock, écarts, validation, paiement, pièce jointe, facture figée.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, EtatFactures, Produit, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string };
let biere: Produit;
let saucisse: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: (r.headers["content-type"]?.includes("json") ? r.json() : r.rawPayload) as T, entetes: r.headers };
}
const factures = async () => (await appel<EtatFactures>("GET", "/api/factures")).corps.factures;
const facture = async (numero: string) => (await factures()).find((f) => f.numero === numero)!;
const saisir = (numero: string, fournisseur: string, lignes: unknown[], dateFacture = "2026-09-12") =>
  appel<EtatFactures & { erreur?: string }>("POST", "/api/factures", { fournisseur, numero, dateFacture, echeance: "2026-10-12", lignes });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: (lieu as { email: string } & typeof lieu).email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps[0]!;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière pression 25cl", prixTtc: 400, tauxTva: 2000, standIds: [s.id] })).corps.find((p) => p.nom.startsWith("Bière"))!;
  saucisse = (await appel<Produit[]>("POST", "/api/produits", { nom: "Saucisse hot-dog", prixTtc: 500, tauxTva: 1000, standIds: [s.id] })).corps.find((p) => p.nom.startsWith("Saucisse"))!;
  // Livraisons saisies dans le Stock (exemple du dossier).
  await appel("POST", "/api/stock/livraisons", { produitId: biere.id, quantite: 240, prixUnitaire: 125, fournisseur: "Brasserie du Sud", dateLivraison: "2026-09-10" });
  await appel("POST", "/api/stock/livraisons", { produitId: saucisse.id, quantite: 500, prixUnitaire: 95, fournisseur: "Boucherie Grossiste Marseille", dateLivraison: "2026-09-08" });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("saisie et rapprochement", () => {
  it("Brasserie du Sud : identique à la livraison → rapprochée ; un n° déjà saisi est refusé", async () => {
    const r = await saisir("BS-1042", "brasserie du sud", [{ produitId: biere.id, libelle: "Bière pression 25cl", quantite: 240, prixUnitaire: 125 }]);
    expect(r.statut).toBe(200);
    const f = await facture("BS-1042");
    expect(f).toMatchObject({ statut: "rapprochee", totalHt: 30000 });
    expect(f.lignes[0]).toMatchObject({ livraisonChoisie: false, ecart: { ecartQuantite: 0, impactPrix: 0, rapprochee: true } });
    expect((await saisir("BS-1042", "Brasserie du Sud ", [{ produitId: null, libelle: "Doublon", quantite: 1, prixUnitaire: 1 }])).statut).toBe(409);
  });

  it("Boucherie : 0,99 € contre 0,95 € sur 500 → 20 € d'écart, en écart ; frais de livraison sans produit ignorés", async () => {
    await saisir("BGM-77", "Boucherie Grossiste Marseille", [
      { produitId: saucisse.id, libelle: "Saucisses", quantite: 500, prixUnitaire: 99 },
      { produitId: null, libelle: "Frais de livraison", quantite: 1, prixUnitaire: 1500 },
    ]);
    const f = await facture("BGM-77");
    expect(f.statut).toBe("ecart");
    expect(f.lignes[0]!.ecart).toEqual({ ecartQuantite: 0, impactPrix: 2000, seuil: 475, rapprochee: false });
    expect(f.lignes[1]).toMatchObject({ livraison: null, ecart: null });
  });

  it("nouveau fournisseur sans livraison : reçue, à rapprocher", async () => {
    await saisir("FN-1", "Frigo Nord Distribution", [{ produitId: biere.id, libelle: "Bière", quantite: 10, prixUnitaire: 125 }]);
    expect((await facture("FN-1")).statut).toBe("recue");
  });

  it("une livraison déjà rapprochée d'une facture n'est pas proposée à une autre", async () => {
    await saisir("BS-1043", "Brasserie du Sud", [{ produitId: biere.id, libelle: "Bière", quantite: 240, prixUnitaire: 125 }]);
    const f = await facture("BS-1043");
    expect(f.statut).toBe("recue");
    expect(f.lignes[0]!.candidates).toEqual([]);
  });
});

describe("validation et paiement", () => {
  it("[F] une facture en écart ne se valide pas sans motif ; avec motif, elle est validée et figée", async () => {
    const id = (await facture("BGM-77")).id;
    const sans = await appel<{ erreur: string }>("POST", `/api/factures/${id}/validation`, {});
    expect(sans.statut).toBe(400);
    expect(sans.corps.erreur).toContain("écart");
    expect((await appel("POST", `/api/factures/${id}/validation`, { motif: "Hausse annoncée par le fournisseur le 01/09" })).statut).toBe(200);
    const f = await facture("BGM-77");
    expect(f).toMatchObject({ statut: "validee", validation: { motif: "Hausse annoncée par le fournisseur le 01/09" } });
    // Figée : ni l'API ni la base n'acceptent de la modifier.
    expect((await appel("PUT", `/api/factures/${id}`, { fournisseur: "X", numero: "Y", dateFacture: "2026-09-12", echeance: null, lignes: [{ produitId: null, libelle: "Z", quantite: 1, prixUnitaire: 1 }] })).statut).toBe(409);
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE ligne_facture_fournisseur SET livraison_id = NULL WHERE facture_id = $1", [id])))).toBe("23514");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE facture_fournisseur SET numero = 'BIDON' WHERE id = $1", [id])))).toBe("23514");
  });

  it("le rapprochement automatique est figé à la validation", async () => {
    const id = (await facture("BS-1042")).id;
    expect((await appel("POST", `/api/factures/${id}/validation`, {})).statut).toBe(200);
    const { rows } = await proprietaire.pool.query<{ livraison_id: string | null }>("SELECT livraison_id FROM ligne_facture_fournisseur WHERE facture_id = $1", [id]);
    expect(rows[0]!.livraison_id).not.toBeNull();
  });

  it("payée seulement après validation, une seule fois ; tout est journalisé", async () => {
    const recue = (await facture("FN-1")).id;
    expect((await appel("POST", `/api/factures/${recue}/paiement`, { datePaiement: "2026-09-20" })).statut).toBe(409);
    const id = (await facture("BS-1042")).id;
    expect((await appel("POST", `/api/factures/${id}/paiement`, { datePaiement: "2026-09-20" })).statut).toBe(200);
    expect(await facture("BS-1042")).toMatchObject({ statut: "payee", paiement: { date: "2026-09-20" } });
    expect((await appel("POST", `/api/factures/${id}/paiement`, { datePaiement: "2026-09-21" })).statut).toBe(409);
    const types = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps.map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(["facture_saisie", "facture_validee", "facture_payee"]));
  });
});

describe("pièce jointe", () => {
  const pdf = Buffer.from("%PDF-1.4\n% facture d'essai\n").toString("base64");

  it("un PDF se dépose et se relit ; un contenu qui ne correspond pas au type est refusé", async () => {
    const id = (await facture("FN-1")).id;
    expect((await appel("POST", `/api/factures/${id}/fichier`, { nom: "fn-1.pdf", type: "application/pdf", contenu: Buffer.from("pas un pdf").toString("base64") })).statut).toBe(400);
    expect((await appel("POST", `/api/factures/${id}/fichier`, { nom: "fn-1.pdf", type: "application/pdf", contenu: pdf })).statut).toBe(200);
    expect((await facture("FN-1")).fichier).toMatchObject({ nom: "fn-1.pdf", type: "application/pdf" });
    const lu = await appel<Buffer>("GET", `/api/factures/${id}/fichier`);
    expect(lu.entetes["content-type"]).toBe("application/pdf");
    expect(Buffer.from(lu.corps).toString()).toContain("facture d'essai");
  });
});
