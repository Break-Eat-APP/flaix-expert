/**
 * Back-office éditeur, niveau 1 (module 17 ; dossier §15.13, §15.116), contre la vraie base.
 * Tests B6 et B7 du §15.19 : un compte Break Eat n'écrit ni ne lit les données d'un lieu.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, ParcEditeur, SessionInfo, VerificationEditeur } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let directeur = "";
let editeur = "";
let editeurId = "";
const EMAIL_EDITEUR = `editeur-${Date.now()}@breakeat.test`;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function requete<T = unknown>(cookies: string, method: "GET" | "POST", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies, brut: r.body };
}
const valeurCookie = (cookies: { name: string; value: string }[], nom: string) => cookies.find((k) => k.name === nom)!.value;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  directeur = `fx_session=${valeurCookie(r.cookies, "fx_session")}`;
  // Compte éditeur créé comme le fait l'outil d'administration (pnpm cli creer-editeur).
  const { rows } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Support Break Eat', $2) RETURNING id", [
    EMAIL_EDITEUR,
    await hacherMotDePasse(MOT_DE_PASSE_TEST),
  ]);
  editeurId = rows[0]!.id;
  await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [editeurId]);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("connexion éditeur", () => {
  it("cookie distinct ; un compte de lieu ne se connecte pas au back-office", async () => {
    expect((await requete("", "POST", "/api/editeur/connexion", { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST })).statut).toBe(401);
    const r = await requete("", "POST", "/api/editeur/connexion", { email: EMAIL_EDITEUR, motDePasse: MOT_DE_PASSE_TEST });
    expect(r.statut).toBe(200);
    const c = r.cookies.find((k) => k.name === "fx_editeur")!;
    expect(c.httpOnly).toBe(true);
    expect(c.path).toBe("/api/editeur");
    editeur = `fx_editeur=${c.value}`;
    expect((await requete(editeur, "GET", "/api/editeur/session")).corps).toEqual({ nom: "Support Break Eat", email: EMAIL_EDITEUR });
  });

  it("un compte éditeur ne se connecte pas comme un lieu (aucun lieu)", async () => {
    const r = await requete("", "POST", "/api/auth/connexion", { email: EMAIL_EDITEUR, motDePasse: MOT_DE_PASSE_TEST });
    expect(r.statut).toBe(403);
  });
});

describe("vue du parc", () => {
  it("le lieu y figure, sans aucun montant ; jamais son lieu de formation", async () => {
    // Le directeur crée son lieu d'entraînement : il ne doit pas apparaître au parc.
    const f = await requete<SessionInfo>(directeur, "POST", "/api/formation/entree");
    directeur = `fx_session=${valeurCookie(f.cookies, "fx_session")}`;
    const s = await requete<SessionInfo>(directeur, "POST", "/api/formation/sortie");
    directeur = `fx_session=${valeurCookie(s.cookies, "fx_session")}`;
    const r = await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc");
    expect(r.statut).toBe(200);
    const miens = r.corps.lieux.filter((l) => l.lieuId === lieu.lieuId);
    expect(miens).toHaveLength(1);
    const { rows } = await proprietaire.pool.query<{ id: string }>("SELECT id FROM lieu WHERE formation_de = $1", [lieu.lieuId]);
    expect(r.corps.lieux.some((l) => l.lieuId === rows[0]!.id)).toBe(false);
    expect(miens[0]).toMatchObject({ matchsJoues: 0, moisACloturer: 0, exerciceRegle: false, derniereVerification: null });
    expect(r.brut).not.toMatch(/ttc|montant|centimes|ticket|perpetuel/i);
  });

  it("[F] sans session éditeur : refusé ; une session de directeur n'ouvre pas le back-office", async () => {
    expect((await requete("", "GET", "/api/editeur/parc")).statut).toBe(401);
    expect((await requete(`fx_editeur=${directeur.split("=")[1]}`, "GET", "/api/editeur/parc")).statut).toBe(401);
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("SELECT * FROM vue_parc()")))).toBe("42501");
  });
});

describe("B6 / B7 — un compte Break Eat ne lit ni n'écrit les données d'un lieu", () => {
  it("[F] sa session n'ouvre aucun écran d'un lieu", async () => {
    expect((await requete(`fx_session=${editeur.split("=")[1]}`, "GET", "/api/evenements")).statut).toBe(401);
    expect((await requete(`fx_session=${editeur.split("=")[1]}`, "GET", "/api/auth/session")).statut).toBe(401);
  });

  it("[F] au niveau de la base : sans lieu, il ne voit aucune ligne et ne peut rien écrire", async () => {
    const ctx = { utilisateurId: editeurId };
    const lu = await app.transaction(ctx, (c) => c.query<{ n: number }>("SELECT (SELECT count(*) FROM journal_technique)::int + (SELECT count(*) FROM lieu)::int AS n"));
    expect(lu.rows[0]!.n).toBe(0);
    const ecrire = app.transaction(ctx, (c) =>
      c.query(
        "INSERT INTO journal_technique (lieu_id, numero, horodatage, type, details, empreinte_precedente, empreinte) VALUES ($1, 999, now(), 'bidon', '{}', $2, $2)",
        [lieu.lieuId, "0".repeat(64)],
      ),
    );
    expect(await codeErreur(ecrire)).toBe("42501");
  });
});

describe("vérification d'intégrité", () => {
  it("le serveur relit les chaînes du lieu, ne renvoie que des états, et l'inscrit au journal du lieu", async () => {
    const r = await requete<VerificationEditeur>(editeur, "POST", `/api/editeur/lieux/${lieu.lieuId}/verification`);
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ ok: true, caisses: { ok: true, nombre: 0, ruptures: [] }, journalTechnique: { ok: true }, clotures: { ok: true, maillons: 0 } });
    const jet = (await requete<EntreeJournalTechnique[]>(directeur, "GET", "/api/journal-technique?limite=20")).corps.find((e) => e.type === "verification_editeur")!;
    expect(jet.details).toMatchObject({ ok: true, par: "Break Eat — Support Break Eat" });
    expect((await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc")).corps.lieux.find((l) => l.lieuId === lieu.lieuId)!.derniereVerification).toMatchObject({ ok: true });
  });

  it("[F] un lieu inconnu ou de formation est refusé", async () => {
    const { rows } = await proprietaire.pool.query<{ id: string }>("SELECT id FROM lieu WHERE formation_de = $1", [lieu.lieuId]);
    expect((await requete(editeur, "POST", `/api/editeur/lieux/${rows[0]!.id}/verification`)).statut).toBe(404);
  });
});

describe("mot de passe et déconnexion", () => {
  it("changement de mot de passe (l'actuel est exigé), puis déconnexion", async () => {
    expect((await requete(editeur, "POST", "/api/editeur/mot-de-passe", { actuel: "faux-mot-de-passe", nouveau: "un-nouveau-mot-de-passe-solide" })).statut).toBe(400);
    expect((await requete(editeur, "POST", "/api/editeur/mot-de-passe", { actuel: MOT_DE_PASSE_TEST, nouveau: "un-nouveau-mot-de-passe-solide" })).statut).toBe(200);
    expect((await requete(editeur, "POST", "/api/editeur/deconnexion")).statut).toBe(200);
    expect((await requete(editeur, "GET", "/api/editeur/session")).statut).toBe(401);
  });
});
