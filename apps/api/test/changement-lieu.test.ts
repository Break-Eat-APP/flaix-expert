/**
 * Changer de lieu (dossier §15.183), contre la vraie base : un directeur de deux lieux voit ses lieux et passe de l'un à
 * l'autre ; l'ancienne session est fermée, la nouvelle ne voit que le lieu choisi ; le passage est inscrit au journal des
 * deux lieux. [F] Lieu dont il n'est pas membre, ou plus membre : refusé, session inchangée ; en mode formation : refusé.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { LieuDuCompte, Produit, SessionInfo } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let premier: { lieuId: string; utilisateurId: string; email: string };
let second: { lieuId: string; utilisateurId: string; email: string };
let ailleurs: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST", url: string, payload?: unknown, qui = cookie) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: qui }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  const nouveau = r.cookies.find((k) => k.name === "fx_session");
  return { statut: r.statusCode, corps: r.json() as T, cookie: nouveau ? `fx_session=${nouveau.value}` : null };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  premier = await creerLieuDeTest(proprietaire);
  second = await creerLieuDeTest(proprietaire);
  ailleurs = await creerLieuDeTest(proprietaire);
  // Le directeur du premier lieu dirige aussi le second.
  await proprietaire.pool.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, 'directeur')", [second.lieuId, premier.utilisateurId]);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: premier.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  // Un produit dans chaque lieu, pour voir lequel on regarde.
  await appel("POST", "/api/produits", { nom: "Produit du premier", prixTtc: 500, tauxTva: 1000 });
  const autre = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: second.email, motDePasse: MOT_DE_PASSE_TEST } });
  await appel("POST", "/api/produits", { nom: "Produit du second", prixTtc: 500, tauxTva: 1000 }, `fx_session=${autre.cookies.find((k) => k.name === "fx_session")!.value}`);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("changer de lieu", () => {
  it("le directeur voit ses deux lieux, pas celui d'un autre client", async () => {
    const r = await appel<LieuDuCompte[]>("GET", "/api/auth/lieux");
    expect(r.corps.map((l) => l.id).sort()).toEqual([premier.lieuId, second.lieuId].sort());
    expect(r.corps.every((l) => l.role === "directeur" && l.nom)).toBe(true);
  });

  it("[F] lieu d'un autre client : refusé ; la session reste dans son lieu", async () => {
    const r = await appel<{ erreur: string }>("POST", "/api/auth/lieu", { lieuId: ailleurs.lieuId });
    expect(r.statut).toBe(404);
    expect(r.cookie).toBeNull();
    expect((await appel<SessionInfo>("GET", "/api/auth/session")).corps.lieu.id).toBe(premier.lieuId);
  });

  it("passage au second lieu : nouvelle session, ancienne fermée, on ne voit que le second lieu ; journal des deux lieux", async () => {
    const ancien = cookie;
    const r = await appel<SessionInfo>("POST", "/api/auth/lieu", { lieuId: second.lieuId });
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    expect(r.corps.lieu.id).toBe(second.lieuId);
    expect(r.cookie).not.toBeNull();
    cookie = r.cookie!;
    expect((await appel("GET", "/api/auth/session", undefined, ancien)).statut).toBe(401);
    const produits = (await appel<Produit[]>("GET", "/api/produits")).corps.map((p) => p.nom);
    expect(produits).toEqual(["Produit du second"]);
    const { rows } = await proprietaire.pool.query(
      "SELECT lieu_id, type, details FROM journal_technique WHERE utilisateur_id = $1 AND ((type = 'changement_lieu' AND lieu_id = $2) OR (type = 'connexion' AND lieu_id = $3))",
      [premier.utilisateurId, premier.lieuId, second.lieuId],
    );
    expect(rows.find((x) => x.type === "changement_lieu")?.details).toMatchObject({ vers: expect.any(String) });
    expect(rows.find((x) => x.type === "connexion")?.details).toMatchObject({ role: "directeur", depuis: expect.any(String) });
  });

  it("[F] retiré du lieu choisi entre-temps : refusé", async () => {
    await proprietaire.pool.query("UPDATE membre SET actif = false WHERE lieu_id = $1 AND utilisateur_id = $2", [premier.lieuId, premier.utilisateurId]);
    const r = await appel<{ erreur: string }>("POST", "/api/auth/lieu", { lieuId: premier.lieuId });
    expect(r.statut).toBe(404);
    await proprietaire.pool.query("UPDATE membre SET actif = true WHERE lieu_id = $1 AND utilisateur_id = $2", [premier.lieuId, premier.utilisateurId]);
  });

  it("[F] en mode formation : refusé, il faut d'abord en sortir", async () => {
    const entree = await appel<SessionInfo>("POST", "/api/formation/entree");
    expect(entree.corps.formation).toBe(true);
    cookie = entree.cookie!;
    expect((await appel<LieuDuCompte[]>("GET", "/api/auth/lieux")).corps).toEqual([]);
    const r = await appel<{ erreur: string }>("POST", "/api/auth/lieu", { lieuId: premier.lieuId });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("mode formation");
  });
});
