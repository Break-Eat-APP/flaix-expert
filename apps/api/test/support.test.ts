/**
 * Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.13, §15.142), contre la
 * vraie base. Les tests [F] provoquent ce que l'architecture doit empêcher : s'ouvrir l'accès sans
 * autorisation, écrire pendant le support, garder l'accès après le retrait.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, EtatSupport, ParcEditeur, SessionInfo, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let directeur = "";
let editeur = "";
let support = "";
const EMAIL_EDITEUR = `support-${Date.now()}@flaixexpert.test`;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function requete<T = unknown>(cookies: string, method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const valeurCookie = (cookies: { name: string; value: string }[], nom: string) => cookies.find((k) => k.name === nom)?.value;
const journal = async () => (await requete<EntreeJournalTechnique[]>(directeur, "GET", "/api/journal-technique")).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  directeur = `fx_session=${valeurCookie(r.cookies, "fx_session")}`;
  await requete<Stand[]>(directeur, "POST", "/api/stands", { nom: "Buvette Nord" });
  const { rows } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Camille Support', $2) RETURNING id", [
    EMAIL_EDITEUR,
    await hacherMotDePasse(MOT_DE_PASSE_TEST),
  ]);
  await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [rows[0]!.id]);
  const e = await requete("", "POST", "/api/editeur/connexion", { email: EMAIL_EDITEUR, motDePasse: MOT_DE_PASSE_TEST });
  editeur = `fx_editeur=${valeurCookie(e.cookies, "fx_editeur")}`;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("sans autorisation du lieu", () => {
  it("[F] FlaiX Expert ne peut pas s'ouvrir l'accès : refus de la base, aucune session", async () => {
    const r = await requete<{ erreur: string }>(editeur, "POST", `/api/editeur/lieux/${lieu.lieuId}/support`);
    expect(r.statut).toBe(403);
    expect(r.corps.erreur).toContain("n'a pas autorisé le support");
    expect(valeurCookie(r.cookies, "fx_session")).toBeUndefined();
    const parc = (await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc")).corps;
    expect(parc.lieux.find((l) => l.lieuId === lieu.lieuId)!.support).toBeNull();
  });
});

describe("autorisation, consultation en lecture seule, retrait", () => {
  it("le directeur autorise 4 h avec un motif ; une seule autorisation à la fois ; journalisé", async () => {
    const r = await requete<EtatSupport>(directeur, "POST", "/api/support/autorisation", { heures: 4, motif: "Problème de clôture" });
    expect(r.statut).toBe(200);
    expect(r.corps.active).toMatchObject({ motif: "Problème de clôture", consultations: [] });
    const duree = Date.parse(r.corps.active!.fin) - Date.parse(r.corps.active!.debut);
    expect(Math.round(duree / 3_600_000)).toBe(4);
    expect((await requete(directeur, "POST", "/api/support/autorisation", { heures: 1 })).statut).toBe(409);
    expect((await requete(directeur, "POST", "/api/support/autorisation", { heures: 48 })).statut).toBe(400);
    expect((await journal()).some((j) => j.type === "support_autorise")).toBe(true);
    const parc = (await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc")).corps;
    expect(parc.lieux.find((l) => l.lieuId === lieu.lieuId)!.support).toMatchObject({ motif: "Problème de clôture" });
  });

  it("FlaiX Expert ouvre la session : il lit les écrans du directeur, avec un bandeau « jusqu'à » ; ouverture et écrans consultés au journal du lieu", async () => {
    const r = await requete<{ jusqua: string }>(editeur, "POST", `/api/editeur/lieux/${lieu.lieuId}/support`);
    expect(r.statut).toBe(200);
    support = `fx_session=${valeurCookie(r.cookies, "fx_session")}`;
    const s = (await requete<SessionInfo>(support, "GET", "/api/auth/session")).corps;
    expect(s).toMatchObject({ role: "support", lieu: { id: lieu.lieuId }, support: { jusqua: r.corps.jusqua } });
    expect((await requete<Stand[]>(support, "GET", "/api/stands")).corps.map((x) => x.nom)).toEqual(["Buvette Nord"]);
    await requete(support, "GET", "/api/stands"); // une seconde lecture du même écran n'est pas réinscrite
    const j = await journal();
    expect(j.filter((x) => x.type === "support_ouvert")).toHaveLength(1);
    const vues = j.filter((x) => x.type === "support_consultation");
    expect(vues).toHaveLength(1);
    expect(vues[0]!.details).toMatchObject({ ecran: "Paramètres", adresse: "/api/stands", par: "FlaiX Expert — Camille Support" });
    const etat = (await requete<EtatSupport>(directeur, "GET", "/api/support")).corps;
    expect(etat.active!.consultations).toEqual([expect.objectContaining({ route: "/api/stands", ecran: "Paramètres", par: "FlaiX Expert — Camille Support" })]);
  });

  it("[F] pendant le support, toute écriture est refusée avant la route, et la tentative va au journal du lieu", async () => {
    const r = await requete<{ erreur: string }>(support, "POST", "/api/stands", { nom: "Stand fantôme" });
    expect(r.statut).toBe(403);
    expect(r.corps.erreur).toContain("lecture seule");
    expect((await requete(support, "POST", "/api/support/retrait")).statut).toBe(403);
    expect((await requete<Stand[]>(directeur, "GET", "/api/stands")).corps.map((x) => x.nom)).toEqual(["Buvette Nord"]);
    expect((await journal()).some((x) => x.type === "acces_refuse" && (x.details as { role?: string }).role === "support")).toBe(true);
  });

  it("[F] même si le code d'une route écrivait, la base refuse : transaction en lecture seule", async () => {
    await expect(
      app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId, lectureSeule: true }, (c) => c.query("INSERT INTO stand (lieu_id, nom) VALUES ($1, 'Intrus')", [lieu.lieuId])),
    ).rejects.toThrow(/read-only/);
  });

  it("[F] le directeur retire l'autorisation : l'accès s'arrête à la requête suivante ; retrait journalisé", async () => {
    const r = await requete<EtatSupport>(directeur, "POST", "/api/support/retrait");
    expect(r.corps.active).toBeNull();
    expect(r.corps.historique[0]).toMatchObject({ retireePar: expect.any(String), active: false });
    expect((await requete(support, "GET", "/api/stands")).statut).toBe(401);
    expect((await journal()).some((x) => x.type === "support_retire")).toBe(true);
    expect((await requete(editeur, "POST", `/api/editeur/lieux/${lieu.lieuId}/support`)).statut).toBe(403);
  });

  it("[F] la trace des consultations ne se modifie ni ne se supprime", async () => {
    await expect(app.transaction({ lieuId: lieu.lieuId }, (c) => c.query("UPDATE consultation_support SET route = 'x'"))).rejects.toThrow();
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM consultation_support WHERE lieu_id = $1", [lieu.lieuId]))).rejects.toThrow();
  });
});
