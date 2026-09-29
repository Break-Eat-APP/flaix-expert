import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, Produit, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, ajouterMembre, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie: string;

const JSON_ORIGINE = { "content-type": "application/json", origin: "http://localhost:5173" };

async function connecter(email: string, motDePasse = MOT_DE_PASSE_TEST) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: JSON_ORIGINE, payload: { email, motDePasse } });
  const c = r.cookies.find((k) => k.name === "fx_session");
  return { r, cookie: c ? `fx_session=${c.value}` : "" };
}

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown, avecCookie = cookie) {
  return serveur
    .inject({
      method,
      url,
      headers: { ...(method === "GET" ? {} : JSON_ORIGINE), cookie: avecCookie },
      // Comme l'application web : toute requête de modification porte un corps JSON, au minimum {}.
      payload: method === "GET" ? undefined : ((payload ?? {}) as object),
    })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  cookie = (await connecter(lieu.email)).cookie;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("connexion et session", () => {
  it("refuse un mauvais mot de passe, sans dire si le compte existe, et le trace au journal", async () => {
    const inconnu = await connecter("personne@test.local", "x");
    const mauvais = await connecter(lieu.email, "mauvais mot de passe");
    expect(inconnu.r.statusCode).toBe(401);
    expect(mauvais.r.statusCode).toBe(401);
    expect(inconnu.r.json().erreur).toBe(mauvais.r.json().erreur);
    const { corps } = await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique");
    expect(corps.some((e) => e.type === "connexion_refusee")).toBe(true);
  });

  it("ouvre une session : cookie httpOnly, session lisible, connexion journalisée", async () => {
    expect(cookie).toMatch(/^fx_session=/);
    const { statut, corps } = await appel<{ role: string; lieu: { id: string } }>("GET", "/api/auth/session");
    expect(statut).toBe(200);
    expect(corps).toMatchObject({ role: "directeur", lieu: { id: lieu.lieuId } });
  });

  it("sans session : 401", async () => {
    expect((await appel("GET", "/api/stands", undefined, "")).statut).toBe(401);
  });

  it("[F] requête intersite : format non JSON refusé (415), origine étrangère refusée (403)", async () => {
    const formulaire = await serveur.inject({
      method: "POST",
      url: "/api/stands",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie },
      payload: "nom=Pirate",
    });
    expect(formulaire.statusCode).toBe(415);
    const etrangere = await serveur.inject({
      method: "POST",
      url: "/api/stands",
      headers: { "content-type": "application/json", origin: "https://site-malveillant.example", cookie },
      payload: { nom: "Pirate" },
    });
    expect(etrangere.statusCode).toBe(403);
  });
});

describe("identité du lieu", () => {
  it("refuse un SIRET mal formé, enregistre une identité valide et trace l'avant/après", async () => {
    const identite = { nom: "Lieu renommé", raisonSociale: "Exploitant Test SAS", siret: "123", tvaIntracom: "", adresse: "1 rue du Test", codePostal: "13000", ville: "Marseille" };
    expect((await appel("PUT", "/api/lieu", identite)).statut).toBe(400);
    const ok = await appel<{ siret: string; tvaIntracom: string | null }>("PUT", "/api/lieu", { ...identite, siret: "123 456 789 00012" });
    expect(ok.statut).toBe(200);
    expect(ok.corps).toMatchObject({ siret: "12345678900012", tvaIntracom: null });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    const modif = jet.find((e) => e.type === "lieu_identite_modifiee")!;
    expect(modif.details).toMatchObject({ modifications: { siret: { avant: null, apres: "12345678900012" } } });
  });
});

describe("lieu vide → stands et caisses", () => {
  it("un nouveau lieu démarre vide : aucun stand, aucun produit", async () => {
    expect((await appel<Stand[]>("GET", "/api/stands")).corps).toEqual([]);
    expect((await appel<Produit[]>("GET", "/api/produits")).corps).toEqual([]);
  });

  it("crée des stands ; un doublon de nom est refusé avec un message clair", async () => {
    expect((await appel("POST", "/api/stands", { nom: "Le Snack" })).statut).toBe(201);
    const { statut, corps } = await appel<Stand[]>("POST", "/api/stands", { nom: "Le Bar", pointRetraitCc: true });
    expect(statut).toBe(201);
    expect(corps.map((s) => s.nom).sort()).toEqual(["Le Bar", "Le Snack"]);
    const doublon = await appel<{ erreur: string }>("POST", "/api/stands", { nom: "  le snack " });
    expect(doublon.statut).toBe(409);
    expect(doublon.corps.erreur).toContain("déjà");
  });

  it("numérote les caisses sur tout le lieu, dans l'ordre de création", async () => {
    const stands = (await appel<Stand[]>("GET", "/api/stands")).corps;
    const snack = stands.find((s) => s.nom === "Le Snack")!;
    const bar = stands.find((s) => s.nom === "Le Bar")!;
    await appel("POST", `/api/stands/${snack.id}/caisses`, {});
    await appel("POST", `/api/stands/${bar.id}/caisses`, { especesAutorisees: true });
    const { corps } = await appel<Stand[]>("POST", `/api/stands/${snack.id}/caisses`, { nom: "Comptoir gauche" });
    const numeros = (nom: string) => corps.find((s) => s.nom === nom)!.caisses.map((c) => c.numero);
    expect(numeros("Le Snack")).toEqual([1, 3]);
    expect(numeros("Le Bar")).toEqual([2]);
  });

  it("refuse de désactiver un stand qui a encore des caisses actives", async () => {
    const snack = (await appel<Stand[]>("GET", "/api/stands")).corps.find((s) => s.nom === "Le Snack")!;
    const r = await appel<{ erreur: string }>("PATCH", `/api/stands/${snack.id}`, { actif: false });
    expect(r.statut).toBe(409);
  });

  it("déplace une caisse vers un autre stand sans changer son numéro", async () => {
    const stands = (await appel<Stand[]>("GET", "/api/stands")).corps;
    const bar = stands.find((s) => s.nom === "Le Bar")!;
    const caisse3 = stands.flatMap((s) => s.caisses).find((c) => c.numero === 3)!;
    const { corps } = await appel<Stand[]>("PATCH", `/api/caisses/${caisse3.id}`, { standId: bar.id });
    expect(corps.find((s) => s.nom === "Le Bar")!.caisses.map((c) => c.numero)).toEqual([2, 3]);
  });
});

describe("produits et tarifs datés", () => {
  let produitId: string;
  let standIds: string[];

  it("crée un produit unique vendu dans deux stands, avec son premier tarif", async () => {
    standIds = (await appel<Stand[]>("GET", "/api/stands")).corps.map((s) => s.id);
    const { statut, corps } = await appel<Produit[]>("POST", "/api/produits", {
      nom: "Hot dog",
      prixTtc: 700,
      tauxTva: 1000,
      coutMatiere: 190,
      standIds,
    });
    expect(statut).toBe(201);
    const p = corps.find((x) => x.nom === "Hot dog")!;
    produitId = p.id;
    expect(p.standIds.sort()).toEqual([...standIds].sort());
    expect(p.tarifEnVigueur).toMatchObject({ prixTtc: 700, tauxTva: 1000 });
    expect(p.tarifAVenir).toBeNull();
  });

  it("refuse un second produit du même nom et un taux de TVA inconnu", async () => {
    expect((await appel("POST", "/api/produits", { nom: "hot dog", prixTtc: 700, tauxTva: 1000 })).statut).toBe(409);
    expect((await appel("POST", "/api/produits", { nom: "Frites", prixTtc: 400, tauxTva: 1960 })).statut).toBe(400);
  });

  it("A9 — un nouveau tarif remplace le prix en vigueur sans effacer l'ancien", async () => {
    const r = await appel<Produit[]>("POST", `/api/produits/${produitId}/tarifs`, { prixTtc: 750, tauxTva: 1000 });
    expect(r.statut).toBe(201);
    expect(r.corps.find((p) => p.id === produitId)!.tarifEnVigueur!.prixTtc).toBe(750);
    const historique = (await appel<{ prixTtc: number }[]>("GET", `/api/produits/${produitId}/tarifs`)).corps;
    expect(historique.map((t) => t.prixTtc)).toEqual([750, 700]);
  });

  it("refuse de ressaisir le tarif déjà en vigueur", async () => {
    expect((await appel("POST", `/api/produits/${produitId}/tarifs`, { prixTtc: 750, tauxTva: 1000 })).statut).toBe(409);
  });

  it("programme un tarif futur sans toucher au prix en vigueur ; refuse un tarif rétroactif", async () => {
    const demain = new Date(Date.now() + 86_400_000).toISOString();
    const r = await appel<Produit[]>("POST", `/api/produits/${produitId}/tarifs`, { prixTtc: 800, tauxTva: 1000, valideDu: demain });
    const p = r.corps.find((x) => x.id === produitId)!;
    expect(p.tarifEnVigueur!.prixTtc).toBe(750);
    expect(p.tarifAVenir!.prixTtc).toBe(800);
    const hier = new Date(Date.now() - 86_400_000).toISOString();
    expect((await appel("POST", `/api/produits/${produitId}/tarifs`, { prixTtc: 600, tauxTva: 1000, valideDu: hier })).statut).toBe(400);
  });

  it("retire un stand d'un produit ; le changement est tracé", async () => {
    const r = await appel<Produit[]>("PUT", `/api/produits/${produitId}/stands`, { standIds: [standIds[0]] });
    expect(r.corps.find((p) => p.id === produitId)!.standIds).toEqual([standIds[0]]);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    expect(jet.some((e) => e.type === "produit_stands_modifies")).toBe(true);
  });

  it("le journal technique a tout tracé et sa chaîne est intacte", async () => {
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps;
    const types = new Set(jet.map((e) => e.type));
    for (const t of ["lieu_cree", "connexion", "stand_cree", "caisse_creee", "caisse_modifiee", "produit_cree", "tarif_cree"]) {
      expect(types, t).toContain(t);
    }
    const v = await appel<{ ok: boolean; numerotationContinue: boolean }>("POST", "/api/journal-technique/verification");
    expect(v.corps).toMatchObject({ ok: true, numerotationContinue: true });
  });
});

describe("droits", () => {
  it("B2 [F] — un opérateur n'accède pas à la configuration, et la tentative est journalisée", async () => {
    const op = await ajouterMembre(proprietaire, lieu.lieuId, "operateur");
    const { cookie: cookieOp } = await connecter(op.email);
    expect((await appel("GET", "/api/stands", undefined, cookieOp)).statut).toBe(403);
    expect((await appel("POST", "/api/stands", { nom: "Stand pirate" }, cookieOp)).statut).toBe(403);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    expect(jet.filter((e) => e.type === "acces_refuse").length).toBeGreaterThanOrEqual(2);
  });

  it("[F] — le directeur d'un autre lieu ne peut ni lire ni modifier ce lieu", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    const { cookie: cookieAutre } = await connecter(autre.email);
    const standDuLieu = (await appel<Stand[]>("GET", "/api/stands")).corps[0]!;
    expect((await appel<Stand[]>("GET", "/api/stands", undefined, cookieAutre)).corps).toEqual([]);
    expect((await appel("PATCH", `/api/stands/${standDuLieu.id}`, { nom: "Piraté" }, cookieAutre)).statut).toBe(404);
  });

  it("déconnexion : la session est révoquée côté serveur", async () => {
    const { cookie: c2 } = await connecter(lieu.email);
    await appel("POST", "/api/auth/deconnexion", {}, c2);
    expect((await appel("GET", "/api/auth/session", undefined, c2)).statut).toBe(401);
  });
});
