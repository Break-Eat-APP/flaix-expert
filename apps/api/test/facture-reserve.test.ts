/**
 * Valider une facture fournisseur fait entrer ses produits en réserve centrale (dossier §15.172), contre la vraie base :
 * chaque produit sans livraison devient une livraison au prix et à la date de la facture, rapprochée de sa ligne, coût
 * moyen pondéré recalculé ; ligne sans produit (frais) : rien ; sans la case, la validation demande toujours un motif.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CorrespondanceArticle, EtatFactures, EtatReserve, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let canette: Produit;
let lieuId = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const saisir = async (numero: string) =>
  (
    await appel<EtatFactures>("POST", "/api/factures", {
      fournisseur: "Boissons du Nord",
      numero,
      dateFacture: "2026-10-20",
      echeance: null,
      lignes: [
        // Un colis de 24 canettes à 14,40 € HT : 24 canettes à 0,60 € en réserve (§15.173).
        { produitId: canette.id, libelle: "Canette 33 cl x24", codeArticle: "CAN33", quantite: 1, prixUnitaire: 1_440, unitesParColis: 24 },
        { produitId: null, libelle: "Frais de livraison", quantite: 1, prixUnitaire: 1_500 },
      ],
    })
  ).corps.factures.find((f) => f.numero === numero)!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  canette = (await appel<Produit[]>("POST", "/api/produits", { nom: "Canette", prixTtc: 400, tauxTva: 1000, coutMatiere: null })).corps[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("facture validée, produits entrés en réserve", () => {
  it("[F] sans la case : un produit sans livraison demande un motif, rien n'entre en réserve", async () => {
    const f = await saisir("F-1");
    expect(f.statut).toBe("recue");
    expect((await appel("POST", `/api/factures/${f.id}/validation`, {})).statut).toBe(400);
    expect((await appel<EtatReserve>("GET", "/api/stock/reserve")).corps.produits.find((p) => p.produitId === canette.id)!.solde).toBe(0);
  });

  it("avec la case : 24 canettes entrent en réserve au prix et à la date de la facture, ligne rapprochée, facture validée", async () => {
    const f = (await appel<EtatFactures>("GET", "/api/factures")).corps.factures.find((x) => x.numero === "F-1")!;
    const r = await appel<EtatFactures>("POST", `/api/factures/${f.id}/validation`, { entrerEnReserve: true });
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    const v = r.corps.factures.find((x) => x.id === f.id)!;
    expect(v.statut).toBe("validee");
    expect(v.lignes.find((l) => l.produitId === canette.id)!.livraison).not.toBeNull();
    const reserve = (await appel<EtatReserve>("GET", "/api/stock/reserve")).corps;
    expect(reserve.produits.find((p) => p.produitId === canette.id)).toMatchObject({ solde: 24, coutUnitaire: 60 });
    expect(reserve.mouvements[0]).toMatchObject({ type: "livraison", produit: "Canette", quantite: 24, prixUnitaire: 60, fournisseur: "Boissons du Nord", dateLivraison: "2026-10-20" });
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'facture_validee'", [lieuId]);
    expect(rows[0].details.entrees_en_reserve).toEqual(["Canette 33 cl x24"]);
  });

  it("correspondance apprise ; [F] colis oublié : alerte, validation refusée sans « J'ai vérifié », acceptée avec", async () => {
    const corr = (await appel<CorrespondanceArticle[]>("GET", "/api/factures/correspondances")).corps;
    expect(corr).toEqual([{ fournisseur: "boissons du nord", cle: "code:can33", libelle: "Canette 33 cl x24", produitId: canette.id, unitesParColis: 24 }]);
    const r = await appel<EtatFactures>("POST", "/api/factures", {
      fournisseur: "Boissons du Nord",
      numero: "F-2",
      dateFacture: "2026-10-22",
      echeance: null,
      totalAnnonce: 2_880,
      lignes: [{ produitId: canette.id, libelle: "Canette 33 cl x24", quantite: 2, prixUnitaire: 1_440 }],
    });
    const f = r.corps.factures.find((x) => x.numero === "F-2")!;
    // Colis oublié : 2 « canettes » à 14,40 € au lieu de 48 à 0,60 € — le prix à l'unité saute aussi.
    expect(f.alertes.map((a) => a.type)).toEqual(["colis", "prix"]);
    expect((await appel("POST", `/api/factures/${f.id}/validation`, { entrerEnReserve: true })).statut).toBe(400);
    expect((await appel("POST", `/api/factures/${f.id}/validation`, { entrerEnReserve: true, alertesVerifiees: true })).statut).toBe(200);
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'facture_validee' AND details->>'numero' = 'F-2'", [lieuId]);
    expect(rows[0].details.alertes_verifiees).toHaveLength(2);
  });

  it("correspondance corrigée puis retirée (§15.174) : journalisée ; [F] inconnue : 404", async () => {
    const c = { fournisseur: "boissons du nord", cle: "code:can33" };
    const r = await serveur.inject({ method: "PUT", url: "/api/factures/correspondances", headers: { ...EN_TETES, cookie }, payload: { ...c, produitId: canette.id, unitesParColis: 12 } });
    expect(r.statusCode).toBe(200);
    expect((r.json() as CorrespondanceArticle[]).find((x) => x.cle === c.cle)).toMatchObject({ unitesParColis: 12 });
    const d = await serveur.inject({ method: "DELETE", url: `/api/factures/correspondances?fournisseur=${encodeURIComponent(c.fournisseur)}&cle=${encodeURIComponent(c.cle)}`, headers: { ...EN_TETES, cookie }, payload: {} });
    expect(d.statusCode).toBe(200);
    // Reste celle apprise par son libellé (facture F-2 sans code article).
    expect((d.json() as CorrespondanceArticle[]).map((x) => x.cle)).toEqual(["lib:canette 33 cl x24"]);
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'correspondance_fournisseur_modifiee'", [lieuId]);
    expect(rows).toHaveLength(2);
    expect(rows.map((x) => x.details.retiree ?? false)).toContain(true);
    const inconnue = await serveur.inject({ method: "PUT", url: "/api/factures/correspondances", headers: { ...EN_TETES, cookie }, payload: { ...c, produitId: null, unitesParColis: 1 } });
    expect(inconnue.statusCode).toBe(404);
  });

  it("audit §15.175 — produit retiré sur une facture : la correspondance apprise suit ; [F] quantité × colis au-delà d'un mouvement : refusée clairement", async () => {
    await appel("POST", "/api/factures", {
      fournisseur: "Boissons du Nord",
      numero: "F-3",
      dateFacture: "2026-10-23",
      echeance: null,
      lignes: [{ produitId: null, libelle: "Canette 33 cl x24", quantite: 1, prixUnitaire: 1_440 }],
    });
    const corr = (await appel<CorrespondanceArticle[]>("GET", "/api/factures/correspondances")).corps;
    expect(corr.find((x) => x.cle === "lib:canette 33 cl x24")).toMatchObject({ produitId: null, unitesParColis: 1 });

    const r = await appel<EtatFactures>("POST", "/api/factures", {
      fournisseur: "Boissons du Nord",
      numero: "F-4",
      dateFacture: "2026-10-24",
      echeance: null,
      lignes: [{ produitId: canette.id, libelle: "Canette 33 cl x24", codeArticle: "CAN33", quantite: 5_000, prixUnitaire: 1_440, unitesParColis: 24 }],
    });
    const f = r.corps.factures.find((x) => x.numero === "F-4")!;
    const v = await appel<{ erreur: string }>("POST", `/api/factures/${f.id}/validation`, { entrerEnReserve: true, alertesVerifiees: true });
    expect(v.statut).toBe(400);
    expect(v.corps.erreur).toContain("120000 unités");
  });
});

