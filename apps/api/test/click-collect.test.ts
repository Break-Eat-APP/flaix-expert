/**
 * Click & Collect (module 13 ; dossier §15.111), contre la vraie base : réglages du lieu, catalogue
 * des produits vendus en point de retrait, prix app et mode de stock, recopie en formation.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, EtatClickCollect, Produit, SessionInfo, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let hotdog: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const etat = async () => (await appel<EtatClickCollect>("GET", "/api/click-collect")).corps;
const jet = async () => (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps;
const REGLAGES = { commissionPb: 1000, commissionSurPrixApp: false, tvaCommissionRepercutee: true, stripeTauxPb: 150, stripeFixe: 25, panierMoyen: 2700 };

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("lieu neuf", () => {
  it("rien n'est supposé : pas de réglages, pas de point de retrait, catalogue vide", async () => {
    expect(await etat()).toEqual({ reglages: null, pointsRetrait: [], produits: [] });
  });
});

describe("catalogue C&C", () => {
  it("seuls les produits vendus dans un point de retrait y figurent, au prix buvette en vigueur", async () => {
    const bar = (await appel<Stand[]>("POST", "/api/stands", { nom: "Le Bar", pointRetraitCc: true })).corps.find((s) => s.nom === "Le Bar")!;
    const tribune = (await appel<Stand[]>("POST", "/api/stands", { nom: "Tribune" })).corps.find((s) => s.nom === "Tribune")!;
    hotdog = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 650, tauxTva: 1000, standIds: [bar.id, tribune.id] })).corps.find((p) => p.nom === "Hot-dog")!;
    await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [tribune.id] });
    const e = await etat();
    expect(e.pointsRetrait.map((p) => p.nom)).toEqual(["Le Bar"]);
    expect(e.produits).toEqual([{ id: hotdog.id, nom: "Hot-dog", categorie: null, prixBuvette: 650, tauxTva: 1000, prixApp: null, modeStock: null, stands: ["Le Bar"] }]);
  });
});

describe("réglages du lieu", () => {
  it("[F] une commission hors bornes est refusée", async () => {
    expect((await appel("PUT", "/api/click-collect/reglages", { ...REGLAGES, commissionPb: 6000 })).statut).toBe(400);
  });

  it("réglés par le directeur ; le changement est journalisé", async () => {
    const r = await appel<EtatClickCollect>("PUT", "/api/click-collect/reglages", REGLAGES);
    expect(r.corps.reglages).toEqual(REGLAGES);
    const e = (await jet()).find((x) => x.type === "click_collect_reglages_modifies")!;
    expect(e.details).toMatchObject({ commissionPb: { avant: null, apres: 1000 }, stripeFixe: { avant: null, apres: 25 } });
  });

  it("commission calculée sur le prix app (§15.124) : réglage enregistré et journalisé", async () => {
    const r = await appel<EtatClickCollect>("PUT", "/api/click-collect/reglages", { ...REGLAGES, commissionSurPrixApp: true });
    expect(r.corps.reglages?.commissionSurPrixApp).toBe(true);
    const e = (await jet()).find((x) => x.type === "click_collect_reglages_modifies")!;
    expect(e.details).toMatchObject({ commissionSurPrixApp: { avant: false, apres: true } });
    expect((await appel<EtatClickCollect>("PUT", "/api/click-collect/reglages", REGLAGES)).corps.reglages).toEqual(REGLAGES);
  });
});

describe("prix app d'un produit", () => {
  it("prix appliqué et mode de stock enregistrés, journalisés avec l'avant et l'après", async () => {
    const r = await appel<EtatClickCollect>("PUT", `/api/click-collect/produits/${hotdog.id}`, { prixApp: 750, modeStock: "partage" });
    expect(r.corps.produits[0]).toMatchObject({ prixApp: 750, modeStock: "partage" });
    const e = (await jet()).find((x) => x.type === "prix_app_modifie")!;
    expect(e.details).toMatchObject({ nom: "Hot-dog", prixApp: { avant: null, apres: 750 }, modeStock: { avant: null, apres: "partage" } });
  });

  it("[F] un mode de stock inconnu est refusé", async () => {
    expect((await appel("PUT", `/api/click-collect/produits/${hotdog.id}`, { prixApp: 750, modeStock: "magique" })).statut).toBe(400);
  });
});

describe("mode formation", () => {
  it("réglages et prix app recopiés dans le lieu d'entraînement, en lecture seule", async () => {
    const entree = await appel<SessionInfo>("POST", "/api/formation/entree");
    cookie = `fx_session=${entree.cookies.find((k) => k.name === "fx_session")!.value}`;
    const e = await etat();
    expect(e.reglages).toEqual(REGLAGES);
    expect(e.produits[0]).toMatchObject({ nom: "Hot-dog", prixApp: 750, modeStock: "partage" });
    expect((await appel("PUT", "/api/click-collect/reglages", REGLAGES)).statut).toBe(409);
    const sortie = await appel<SessionInfo>("POST", "/api/formation/sortie");
    cookie = `fx_session=${sortie.cookies.find((k) => k.name === "fx_session")!.value}`;
  });
});
