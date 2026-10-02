/**
 * Création des lieux et des comptes directeur depuis le back-office FlaiX Expert (dossier §15.122),
 * et règle des mots de passe (6 caractères), contre la vraie base.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { DirecteurRemis, EntreeJournalTechnique, LieuCree, ParcEditeur } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let editeur = "";
let editeurId = "";
let autreLieu: { lieuId: string; utilisateurId: string; email: string };
let cree: LieuCree;
let directeur = "";
let motDePasseActuel = "";
const suffixe = Date.now();
const EMAIL_EDITEUR = `editeur-lieux-${suffixe}@flaixexpert.test`;
const EMAIL_DIRECTEUR = `Directrice-${suffixe}@Patinoire.test`;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function requete<T = unknown>(cookies: string, method: "GET" | "POST", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const valeurCookie = (cookies: { name: string; value: string }[], nom: string) => cookies.find((k) => k.name === nom)!.value;
async function connexionDirecteur(email: string, motDePasse: string) {
  const r = await requete("", "POST", "/api/auth/connexion", { email, motDePasse });
  return { statut: r.statut, cookie: r.statut === 200 ? `fx_session=${valeurCookie(r.cookies, "fx_session")}` : "" };
}
const parc = async () => (await requete<ParcEditeur>(editeur, "GET", "/api/editeur/parc")).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  autreLieu = await creerLieuDeTest(proprietaire);
  const { rows } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Rémi', $2) RETURNING id", [
    EMAIL_EDITEUR,
    await hacherMotDePasse(MOT_DE_PASSE_TEST),
  ]);
  editeurId = rows[0]!.id;
  await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [editeurId]);
  const r = await requete("", "POST", "/api/editeur/connexion", { email: EMAIL_EDITEUR, motDePasse: MOT_DE_PASSE_TEST });
  editeur = `fx_editeur=${valeurCookie(r.cookies, "fx_editeur")}`;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("nouveau lieu depuis le back-office", () => {
  it("le lieu est créé vide avec son directeur ; le mot de passe provisoire est lisible et ouvre la session", async () => {
    const r = await requete<LieuCree>(editeur, "POST", "/api/editeur/lieux", { nom: "  Patinoire du Nord ", directeur: { nom: "Claire Martin", email: EMAIL_DIRECTEUR } });
    expect(r.statut).toBe(200);
    cree = r.corps;
    expect(cree.nom).toBe("Patinoire du Nord");
    expect(cree.directeur.email).toBe(EMAIL_DIRECTEUR.toLowerCase());
    expect(cree.directeur.motDePasseProvisoire).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    const c = await connexionDirecteur(EMAIL_DIRECTEUR, cree.directeur.motDePasseProvisoire!);
    expect(c.statut).toBe(200);
    directeur = c.cookie;

    const l = (await parc()).lieux.find((x) => x.lieuId === cree.lieuId)!;
    expect(l).toMatchObject({ nom: "Patinoire du Nord", standsActifs: 0, caissesActives: 0, tablettes: 0, matchsJoues: 0 });
    expect(l.directeurs).toEqual([expect.objectContaining({ nom: "Claire Martin", email: EMAIL_DIRECTEUR.toLowerCase(), actif: true })]);
  });

  it("le lieu le voit dans son journal : création et compte directeur, par FlaiX Expert", async () => {
    const jet = (await requete<EntreeJournalTechnique[]>(directeur, "GET", "/api/journal-technique?limite=20")).corps;
    expect(jet.map((e) => e.type).reverse().slice(0, 2)).toEqual(["lieu_cree", "directeur_ajoute"]);
    expect(jet.find((e) => e.type === "directeur_ajoute")!.details).toMatchObject({ nouveauCompte: true, par: "FlaiX Expert — Rémi" });
    expect(JSON.stringify(jet)).not.toContain(cree.directeur.motDePasseProvisoire!);
  });

  it("[F] champs obligatoires et e-mail valide", async () => {
    expect((await requete(editeur, "POST", "/api/editeur/lieux", { nom: " ", directeur: { nom: "X", email: "x@y.fr" } })).statut).toBe(400);
    expect((await requete(editeur, "POST", "/api/editeur/lieux", { nom: "Stade", directeur: { nom: "X", email: "pas-une-adresse" } })).statut).toBe(400);
  });
});

describe("directeurs d'un lieu", () => {
  it("une adresse déjà connue est rattachée avec son mot de passe actuel", async () => {
    const r = await requete<DirecteurRemis>(editeur, "POST", `/api/editeur/lieux/${cree.lieuId}/directeurs`, { nom: "Ignoré", email: autreLieu.email });
    expect(r.statut).toBe(200);
    expect(r.corps.motDePasseProvisoire).toBeNull();
    expect((await parc()).lieux.find((x) => x.lieuId === cree.lieuId)!.directeurs).toHaveLength(2);
  });

  it("[F] doublon, compte FlaiX Expert, lieu inconnu", async () => {
    const doublon = await requete<{ erreur: string }>(editeur, "POST", `/api/editeur/lieux/${cree.lieuId}/directeurs`, { nom: "Claire", email: EMAIL_DIRECTEUR });
    expect(doublon.statut).toBe(409);
    expect(doublon.corps.erreur).toMatch(/déjà accès/);
    const editeurComme = await requete<{ erreur: string }>(editeur, "POST", `/api/editeur/lieux/${cree.lieuId}/directeurs`, { nom: "Rémi", email: EMAIL_EDITEUR });
    expect(editeurComme.statut).toBe(400);
    expect(editeurComme.corps.erreur).toMatch(/compte FlaiX Expert/);
    expect((await requete(editeur, "POST", "/api/editeur/lieux/00000000-0000-4000-8000-000000000000/directeurs", { nom: "X", email: "x@y.fr" })).statut).toBe(404);
  });

  it("nouveau mot de passe provisoire : l'ancien ne marche plus, ses sessions sont fermées, ses lieux le voient", async () => {
    const id = (await parc()).lieux.find((x) => x.lieuId === cree.lieuId)!.directeurs.find((d) => d.email === EMAIL_DIRECTEUR.toLowerCase())!.utilisateurId;
    const r = await requete<DirecteurRemis>(editeur, "POST", `/api/editeur/lieux/${cree.lieuId}/directeurs/${id}/mot-de-passe`);
    expect(r.statut).toBe(200);
    expect((await requete(directeur, "GET", "/api/auth/session")).statut).toBe(401);
    expect((await connexionDirecteur(EMAIL_DIRECTEUR, cree.directeur.motDePasseProvisoire!)).statut).toBe(401);
    motDePasseActuel = r.corps.motDePasseProvisoire!;
    const c = await connexionDirecteur(EMAIL_DIRECTEUR, motDePasseActuel);
    expect(c.statut).toBe(200);
    directeur = c.cookie;
    const jet = (await requete<EntreeJournalTechnique[]>(directeur, "GET", "/api/journal-technique?limite=20")).corps;
    expect(jet.some((e) => e.type === "mot_de_passe_provisoire")).toBe(true);
  });

  it("[F] un compte qui n'est pas directeur de ce lieu n'est pas touché", async () => {
    const r = await requete(editeur, "POST", `/api/editeur/lieux/${cree.lieuId}/directeurs/${editeurId}/mot-de-passe`);
    expect(r.statut).toBe(404);
  });
});

describe("[F] réservé au back-office", () => {
  it("une session de directeur ne crée ni lieu ni directeur, pas même directement dans la base", async () => {
    expect((await requete(directeur, "POST", "/api/editeur/lieux", { nom: "Pirate", directeur: { nom: "X", email: "x@y.fr" } })).statut).toBe(401);
    expect((await requete(`fx_editeur=${directeur.split("=")[1]}`, "POST", "/api/editeur/lieux", { nom: "Pirate", directeur: { nom: "X", email: "x@y.fr" } })).statut).toBe(401);
    const ctx = { lieuId: autreLieu.lieuId, utilisateurId: autreLieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("SELECT creer_lieu_editeur('Pirate')")))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("SELECT * FROM ajouter_directeur_editeur($1, 'x@y.fr', 'X', 'h')", [autreLieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("SELECT * FROM directeurs_du_parc()")))).toBe("42501");
  });
});

describe("mot de passe : 6 caractères suffisent, pas les plus utilisés", () => {
  it("refuse 123456 et 5 caractères, accepte 6 caractères", async () => {
    const court = await requete<{ erreur: string }>(directeur, "POST", "/api/auth/mot-de-passe", { actuel: "x", nouveau: "k7mq4" });
    expect(court.statut).toBe(400);
    expect(court.corps.erreur).toMatch(/au moins 6/);
    const commun = await requete<{ erreur: string }>(directeur, "POST", "/api/auth/mot-de-passe", { actuel: "x", nouveau: "123456" });
    expect(commun.corps.erreur).toMatch(/plus utilisés/);
    const ok = await requete(directeur, "POST", "/api/auth/mot-de-passe", { actuel: motDePasseActuel, nouveau: "Bar2026" });
    expect(ok.statut).toBe(200);
    expect((await connexionDirecteur(EMAIL_DIRECTEUR, "Bar2026")).statut).toBe(200);
  });
});
