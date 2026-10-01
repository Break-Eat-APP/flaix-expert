/**
 * Options par lieu activées par Break Eat (dossier §15.118), contre la vraie base.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, OptionsLieu, ParcEditeur, SessionInfo } from "@flaix/domain";
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

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function requete<T = unknown>(cookies: string, method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const session = (cookies: { name: string; value: string }[], nom: string) => `${nom}=${cookies.find((k) => k.name === nom)!.value}`;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  directeur = session(r.cookies, "fx_session");
  const email = `options-${Date.now()}@breakeat.test`;
  const { rows } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Rémi', $2) RETURNING id", [email, await hacherMotDePasse(MOT_DE_PASSE_TEST)]);
  await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [rows[0]!.id]);
  editeur = session((await requete("", "POST", "/api/editeur/connexion", { email, motDePasse: MOT_DE_PASSE_TEST })).cookies, "fx_editeur");
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("options d'un lieu", () => {
  it("sans réglage, toutes les options sont actives (rien ne change pour un lieu existant)", async () => {
    const o = (await requete<OptionsLieu>(directeur, "GET", "/api/lieu/options")).corps;
    expect(Object.values(o).every(Boolean)).toBe(true);
    expect((await requete(directeur, "GET", "/api/stock")).statut).toBe(200);
  });

  it("Break Eat désactive le Stock : ses adresses sont fermées, le lieu le voit dans son journal", async () => {
    expect((await requete(editeur, "PUT", `/api/editeur/lieux/${lieu.lieuId}/options`, { option: "stock", active: false })).statut).toBe(200);
    const r = await requete<{ erreur: string }>(directeur, "GET", "/api/stock");
    expect(r.statut).toBe(403);
    expect(r.corps.erreur).toContain("Stock");
    expect((await requete<OptionsLieu>(directeur, "GET", "/api/lieu/options")).corps.stock).toBe(false);
    // La base reste ouverte.
    expect((await requete(directeur, "GET", "/api/evenements")).statut).toBe(200);
    const jet = (await requete<EntreeJournalTechnique[]>(directeur, "GET", "/api/journal-technique?limite=10")).corps.find((e) => e.type === "option_modifiee")!;
    expect(jet.details).toMatchObject({ option: "stock", active: false, par: "Break Eat — Rémi" });
    const parc = (await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc")).corps.lieux.find((l) => l.lieuId === lieu.lieuId)!;
    expect(parc.options.stock).toBe(false);
    expect(parc.options.fidelite).toBe(true);
  });

  it("le lieu de formation suit les options du vrai lieu", async () => {
    const f = await requete<SessionInfo>(directeur, "POST", "/api/formation/entree");
    const enFormation = session(f.cookies, "fx_session");
    expect((await requete(enFormation, "GET", "/api/stock")).statut).toBe(403);
    directeur = session((await requete<SessionInfo>(enFormation, "POST", "/api/formation/sortie")).cookies, "fx_session");
  });

  it("réactivée, l'option rouvre ses adresses", async () => {
    await requete(editeur, "PUT", `/api/editeur/lieux/${lieu.lieuId}/options`, { option: "stock", active: true });
    expect((await requete(directeur, "GET", "/api/stock")).statut).toBe(200);
  });

  it("[F] seul un compte Break Eat change une option, jusque dans la base ; lieu inconnu refusé", async () => {
    expect((await requete(directeur, "PUT", `/api/editeur/lieux/${lieu.lieuId}/options`, { option: "stock", active: false })).statut).toBe(401);
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("SELECT definir_option_lieu($1, 'stock', false)", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'stock', false, $2)", [lieu.lieuId, lieu.utilisateurId])))).toBe("42501");
    expect((await requete(editeur, "PUT", "/api/editeur/lieux/00000000-0000-0000-0000-000000000000/options", { option: "stock", active: false })).statut).toBe(404);
  });
});
