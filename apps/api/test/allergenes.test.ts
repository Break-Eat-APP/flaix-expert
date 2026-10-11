/**
 * Allergènes de chaque produit (dossier §15.157), contre la vraie base : liste enregistrée dans l'ordre réglementaire,
 * allergène inconnu refusé, journal ; aucun allergène par défaut.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let burger: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  burger = (await appel<Produit[]>("POST", "/api/produits", { nom: "Burger", prixTtc: 900, tauxTva: 1000 })).corps[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("allergènes", () => {
  it("aucun par défaut ; liste rangée dans l'ordre réglementaire ; inconnu refusé ; journal", async () => {
    expect(burger.allergenes).toEqual([]);
    const r = await appel<Produit[]>("PUT", `/api/produits/${burger.id}/allergenes`, { allergenes: ["sesame", "lait", "gluten"] });
    expect(r.corps.find((p) => p.id === burger.id)!.allergenes).toEqual(["gluten", "lait", "sesame"]);
    expect((await appel("PUT", `/api/produits/${burger.id}/allergenes`, { allergenes: ["noisette"] })).statut).toBe(400);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=10")).corps.find((e) => e.type === "allergenes_modifies")!;
    expect(jet.details).toMatchObject({ produit: "Burger", avant: "aucun allergène déclaré", apres: "Gluten, Lait, Sésame" });
  });
});
