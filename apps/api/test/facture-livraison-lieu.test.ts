/**
 * Rapprochement d'une ligne de facture (audit Codex du 2026-10-26, P1-1, dossier §15.176), contre la vraie base : une ligne
 * ne se relie qu'à une livraison de son lieu et de son produit. [F] Livraison d'un autre lieu, mouvement qui n'est pas une
 * livraison, autre produit : refusés par la route ; livraison d'un autre lieu écrite directement : refusée par la base.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EtatFactures, EtatReserve, Evenement, Produit, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookieA = "";
let cookieB = "";
let chezA: { facture: string; ligne: string; produit: Produit; autre: Produit };
let livraisonA = "";
let livraisonAutreProduit = "";
let miseEnPlaceA = "";
let livraisonB = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function connecter(email: string) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}
async function appel<T = unknown>(cookie: string, method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const livrer = (cookie: string, produitId: string, quantite: number) =>
  appel<EtatReserve>(cookie, "POST", "/api/stock/livraisons", { produitId, quantite, prixUnitaire: 60, fournisseur: "Metro", dateLivraison: "2026-10-20" });
const relier = (livraisonId: string | null) => appel<{ erreur?: string }>(cookieA, "PUT", `/api/factures/${chezA.facture}/lignes/${chezA.ligne}/livraison`, { livraisonId });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  cookieA = await connecter(lieu.email);
  cookieB = await connecter((await creerLieuDeTest(proprietaire)).email);

  // Lieu A : deux produits, une livraison de chacun, une mise en place, une facture du premier produit.
  const stand = (await appel<Stand[]>(cookieA, "POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  await appel(cookieA, "POST", "/api/produits", { nom: "Canette", prixTtc: 400, tauxTva: 1000, coutMatiere: 60, standIds: [stand.id] });
  const produits = (await appel<Produit[]>(cookieA, "POST", "/api/produits", { nom: "Eau", prixTtc: 200, tauxTva: 550, coutMatiere: 30, standIds: [stand.id] })).corps;
  const produit = produits.find((p) => p.nom === "Canette")!;
  const autre = produits.find((p) => p.nom === "Eau")!;
  livraisonAutreProduit = (await livrer(cookieA, autre.id, 24)).corps.mouvements[0]!.id;
  livraisonA = (await livrer(cookieA, produit.id, 24)).corps.mouvements[0]!.id;
  const e = (await appel<Evenement[]>(cookieA, "POST", "/api/evenements", { libelle: "Rouen", debut: new Date(Date.now() + 86_400_000).toISOString() })).corps[0]!;
  await appel(cookieA, "PUT", "/api/stock/mise-en-place", { evenementId: e.id, standId: stand.id, produitId: produit.id, quantite: 6 });
  miseEnPlaceA = (await appel<EtatReserve>(cookieA, "GET", "/api/stock/reserve")).corps.mouvements.find((m) => m.type === "mise_en_place")!.id;
  // Fournisseur différent : aucune livraison n'est proposée d'office, le choix se fait à la main.
  const f = (
    await appel<EtatFactures>(cookieA, "POST", "/api/factures", {
      fournisseur: "Autre grossiste",
      numero: "F-1",
      dateFacture: "2026-10-20",
      echeance: null,
      lignes: [{ produitId: produit.id, libelle: "Canette", quantite: 24, prixUnitaire: 60 }],
    })
  ).corps.factures[0]!;
  chezA = { facture: f.id, ligne: f.lignes[0]!.id, produit, autre };

  // Lieu B : sa propre livraison.
  const deB = (await appel<Produit[]>(cookieB, "POST", "/api/produits", { nom: "Canette", prixTtc: 400, tauxTva: 1000, coutMatiere: 60 })).corps[0]!;
  livraisonB = (await livrer(cookieB, deB.id, 24)).corps.mouvements[0]!.id;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("rapprochement d'une ligne de facture", () => {
  it("[F] livraison d'un autre lieu, mouvement qui n'est pas une livraison, autre produit : refusés, rien n'est écrit", async () => {
    for (const interdite of [livraisonB, miseEnPlaceA, livraisonAutreProduit]) {
      const r = await relier(interdite);
      expect(r.statut, interdite).toBe(404);
      expect(r.corps.erreur).toContain("Livraison introuvable");
    }
    const { rows } = await proprietaire.pool.query("SELECT livraison_id FROM ligne_facture_fournisseur WHERE id = $1", [chezA.ligne]);
    expect(rows[0].livraison_id).toBeNull();
  });

  it("[F] même écrite directement par l'application, la livraison d'un autre lieu est refusée par la base", async () => {
    await expect(
      app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) => c.query("UPDATE ligne_facture_fournisseur SET livraison_id = $2 WHERE id = $1", [chezA.ligne, livraisonB])),
    ).rejects.toThrow(/ligne_facture_livraison_du_lieu/);
  });

  it("une livraison du lieu et du même produit se relie ; le retour à l'automatique reste possible", async () => {
    expect((await relier(livraisonA)).statut).toBe(200);
    const { rows } = await proprietaire.pool.query("SELECT livraison_id FROM ligne_facture_fournisseur WHERE id = $1", [chezA.ligne]);
    expect(rows[0].livraison_id).toBe(livraisonA);
    expect((await relier(null)).statut).toBe(200);
  });
});
