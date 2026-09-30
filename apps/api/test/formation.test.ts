/**
 * Mode formation « FACTICE » (dossier §15.109 ; BOFiP §150 ; tests B3 et B4 du §15.19), contre la vraie base.
 * Les tests [F] provoquent la fraude ou l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type {
  AccueilTablette,
  AppareilCaisse,
  CodeCaissiere,
  EntreeJournalTechnique,
  EtatClotures,
  EtatFormation,
  Evenement,
  Produit,
  RepriseCaisse,
  SessionInfo,
  Stand,
} from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Appel } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
/** Cookie de session du directeur : il change à chaque entrée et sortie de formation. */
let directeur = "";
let stand: Stand;
let caisse1: string;
let biere: Produit;
let julie: CodeCaissiere;
let tablette1 = "";
let appareil1 = "";
let lieuFormation = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

async function requete<T = unknown>(cookies: string, method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({
    method,
    url,
    headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies },
    payload: method === "GET" ? undefined : ((payload ?? {}) as object),
  });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const parDirecteur = <T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) => requete<T>(directeur, method, url, payload);
const appelAvec =
  (cookies: string): Appel =>
  (method, url, payload) =>
    requete(cookies, method, url, payload);
const sessionDe = (cookies: { name: string; value: string }[]) => `fx_session=${cookies.find((k) => k.name === "fx_session")!.value}`;

/** Le directeur entre (ou sort) de formation : son cookie de session est remplacé. */
async function basculer(sens: "entree" | "sortie") {
  const r = await parDirecteur<SessionInfo>("POST", `/api/formation/${sens}`);
  expect(r.statut).toBe(200);
  directeur = sessionDe(r.cookies);
  return r.corps;
}

/** Compteurs du vrai lieu, lus par le propriétaire de la base (hors de toute application). */
async function compteursReels() {
  const { rows } = await proprietaire.pool.query<{ tickets: number; evenements: number; sessions_caisse: number; clotures: number }>(
    `SELECT (SELECT count(*)::int FROM journal_caisse WHERE lieu_id = $1) AS tickets,
            (SELECT count(*)::int FROM evenement WHERE lieu_id = $1) AS evenements,
            (SELECT count(*)::int FROM session_caisse WHERE lieu_id = $1) AS sessions_caisse,
            (SELECT count(*)::int FROM cloture_periode WHERE lieu_id = $1) AS clotures`,
    [lieu.lieuId],
  );
  return rows[0]!;
}

/** Un match d'entraînement ouvert, une caisse ouverte, deux bières vendues, la caisse clôturée, le match clos. */
async function jouerUnMatch(appel: Appel, caisseId: string, produit: Produit, libelle: string) {
  const e = (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date().toISOString() })).corps.find((x) => x.libelle === libelle)!;
  expect((await appel("POST", `/api/evenements/${e.id}/ouverture`)).statut).toBe(200);
  const t = tablette(caisseId, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisseId}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(produit, 2)]);
  await envoyer(appel, t);
  return { e, t };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  directeur = sessionDe(r.cookies);
  stand = (await parDirecteur<Stand[]>("POST", "/api/stands", { nom: "La Buvette" })).corps[0]!;
  stand = (await parDirecteur<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!;
  caisse1 = stand.caisses[0]!.id;
  biere = (await parDirecteur<Produit[]>("POST", "/api/produits", { nom: "Bière 25cl", prixTtc: 400, tauxTva: 2000, standIds: [stand.id] })).corps[0]!;
  julie = (await parDirecteur<CodeCaissiere>("POST", "/api/equipe/caissieres", { nom: "Julie M." })).corps;
  const t = await parDirecteur<AppareilCaisse[]>("POST", `/api/caisses/${caisse1}/appareil`);
  tablette1 = `fx_appareil=${t.cookies.find((k) => k.name === "fx_appareil")!.value}`;
  appareil1 = t.corps.find((a) => a.cetAppareil)!.id;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("le directeur entre en formation", () => {
  it("B3 — la session est marquée formation, dans un lieu à part où la configuration est recopiée", async () => {
    expect((await parDirecteur<EtatFormation>("GET", "/api/formation")).corps).toEqual({ enFormation: false, lieuFormation: null, tablettesEnFormation: 0 });
    const s = await basculer("entree");
    expect(s.formation).toBe(true);
    expect(s.lieu.id).not.toBe(lieu.lieuId);
    expect(s.lieu.nom).toBe(await nomReel());
    lieuFormation = s.lieu.id;
    expect((await parDirecteur<SessionInfo>("GET", "/api/auth/session")).corps.formation).toBe(true);
    // Configuration recopiée : stand, caisse (autre identifiant, même numéro), produit et son prix, caissière.
    const stands = (await parDirecteur<Stand[]>("GET", "/api/stands")).corps;
    expect(stands.map((x) => x.nom)).toEqual(["La Buvette"]);
    expect(stands[0]!.caisses[0]!.numero).toBe(stand.caisses[0]!.numero);
    expect(stands[0]!.caisses[0]!.id).not.toBe(caisse1);
    const produits = (await parDirecteur<Produit[]>("GET", "/api/produits")).corps;
    expect(produits.map((p) => [p.nom, p.tarifEnVigueur?.prixTtc])).toEqual([["Bière 25cl", 400]]);
    expect((await parDirecteur<{ nom: string }[]>("GET", "/api/equipe/caissieres")).corps.map((c) => c.nom)).toEqual(["Julie M."]);
  });

  it("[F] la configuration ne se modifie pas en formation", async () => {
    for (const [method, url, payload] of [
      ["POST", "/api/stands", { nom: "Stand fantôme" }],
      ["PUT", "/api/lieu", { nom: "Autre nom" }],
      ["POST", "/api/produits", { nom: "Soda", prixTtc: 300, tauxTva: 550, standIds: [] }],
      ["POST", "/api/equipe/caissieres", { nom: "Paul" }],
    ] as const) {
      const r = await parDirecteur<{ erreur: string }>(method, url, payload);
      expect(r.statut, url).toBe(409);
      expect(r.corps.erreur).toContain("Mode formation");
    }
  });

  it("B4 [F] — ventes, clôture de caisse et Z du match en formation : aucun effet sur le vrai lieu", async () => {
    const avant = await compteursReels();
    const caisseF = (await parDirecteur<Stand[]>("GET", "/api/stands")).corps[0]!.caisses[0]!.id;
    const produitF = (await parDirecteur<Produit[]>("GET", "/api/produits")).corps[0]!;
    const { e, t } = await jouerUnMatch(appelAvec(directeur), caisseF, produitF, "Entraînement 1");
    expect((await parDirecteur("POST", `/api/caisses/${caisseF}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await parDirecteur("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
    const zFormation = (await parDirecteur<EtatClotures>("GET", "/api/clotures/periodes")).corps;
    expect(zFormation.perpetuel).toBe(800);
    // Le vrai lieu n'a rien reçu : ni ticket, ni match, ni caisse ouverte, ni clôture, perpétuel à zéro.
    expect(await compteursReels()).toEqual(avant);
    await basculer("sortie");
    expect((await parDirecteur<EtatClotures>("GET", "/api/clotures/periodes")).corps.perpetuel).toBe(0);
    expect((await parDirecteur<Evenement[]>("GET", "/api/evenements")).corps.some((x) => x.libelle === "Entraînement 1")).toBe(false);
  });

  it("entrées et sorties sont inscrites au journal technique du vrai lieu", async () => {
    const jet = (await parDirecteur<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps.map((x) => x.type);
    expect(jet).toContain("formation_entree");
    expect(jet).toContain("formation_sortie");
  });

  it("la connexion par e-mail mène toujours au vrai lieu, jamais au lieu de formation", async () => {
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
    const s = r.json() as SessionInfo;
    expect(s.lieu.id).toBe(lieu.lieuId);
    expect(s.formation).toBe(false);
  });

  it("à la rentrée : même lieu de formation, entraînements gardés, configuration remise à jour", async () => {
    await parDirecteur("POST", `/api/produits/${biere.id}/tarifs`, { prixTtc: 450, tauxTva: 2000 });
    await parDirecteur("POST", "/api/produits", { nom: "Eau 50cl", prixTtc: 200, tauxTva: 550, standIds: [stand.id] });
    const s = await basculer("entree");
    expect(s.lieu.id).toBe(lieuFormation);
    expect((await parDirecteur<Evenement[]>("GET", "/api/evenements")).corps.map((x) => x.libelle)).toContain("Entraînement 1");
    const produits = (await parDirecteur<Produit[]>("GET", "/api/produits")).corps;
    expect(produits.map((p) => p.nom).sort()).toEqual(["Bière 25cl", "Eau 50cl"]);
    await basculer("sortie");
  });
});

describe("tablette en formation", () => {
  it("[F] une caissière ne peut pas mettre la formation ; le directeur le fait, c'est journalisé", async () => {
    const connexion = await requete<SessionInfo>(tablette1, "POST", "/api/auth/code", { caissiereId: julie.caissiere.id, code: julie.code });
    const julieSession = sessionDe(connexion.cookies);
    expect(connexion.corps.formation).toBe(false);
    expect((await requete(julieSession, "POST", "/api/formation/entree")).statut).toBe(403);
    expect((await requete(julieSession, "POST", `/api/appareils/${appareil1}/formation`, { formation: true })).statut).toBe(403);
    const r = await parDirecteur<AppareilCaisse[]>("POST", `/api/appareils/${appareil1}/formation`, { formation: true });
    expect(r.corps.find((a) => a.id === appareil1)!.formation).toBe(true);
    // La session réelle ouverte sur la tablette est fermée d'office.
    expect((await requete(julieSession, "GET", "/api/auth/session")).statut).toBe(401);
    const jet = (await parDirecteur<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps.map((x) => x.type);
    expect(jet).toContain("tablette_formation_activee");
    expect((await parDirecteur<EtatFormation>("GET", "/api/formation")).corps.tablettesEnFormation).toBe(1);
  });

  it("B3 / B4 — la caissière y vend sur la caisse jumelle ; le vrai lieu ne voit rien", async () => {
    expect((await requete<AccueilTablette>(tablette1, "GET", "/api/appareil")).corps.formation).toBe(true);
    const avant = await compteursReels();
    const c = await requete<SessionInfo>(tablette1, "POST", "/api/auth/code", { caissiereId: julie.caissiere.id, code: julie.code });
    expect(c.corps.formation).toBe(true);
    expect(c.corps.lieu.id).toBe(lieuFormation);
    const caisseF = c.corps.appareil!.caisseId;
    expect(caisseF).not.toBe(caisse1);
    const julieF = `${sessionDe(c.cookies)}; ${tablette1}`;
    // Le match d'entraînement est ouvert par le directeur, en formation.
    await basculer("entree");
    const e = (await parDirecteur<Evenement[]>("POST", "/api/evenements", { libelle: "Entraînement 2", debut: new Date().toISOString() })).corps.find(
      (x) => x.libelle === "Entraînement 2",
    )!;
    await parDirecteur("POST", `/api/evenements/${e.id}/ouverture`);
    const produitF = (await parDirecteur<Produit[]>("GET", "/api/produits")).corps.find((p) => p.nom === "Bière 25cl")!;
    const t = tablette(caisseF, (await requete<RepriseCaisse>(julieF, "POST", `/api/caisses/${caisseF}/ouverture`, {})).corps);
    vendreHorsLigne(t, [ligne(produitF, 1)]);
    await envoyer(appelAvec(julieF), t);
    // [F] depuis la tablette en formation, la vraie caisse est hors d'atteinte.
    expect((await requete(julieF, "POST", `/api/caisses/${caisse1}/ouverture`, {})).statut).toBe(403);
    expect(await compteursReels()).toEqual(avant);
    await basculer("sortie");
  });

  it("[F] une tablette dont la vraie caisse est ouverte ne passe pas en formation", async () => {
    await parDirecteur("POST", `/api/appareils/${appareil1}/formation`, { formation: false });
    const e = (await parDirecteur<Evenement[]>("POST", "/api/evenements", { libelle: "Vrai match", debut: new Date().toISOString() })).corps.find(
      (x) => x.libelle === "Vrai match",
    )!;
    await parDirecteur("POST", `/api/evenements/${e.id}/ouverture`);
    await parDirecteur("POST", `/api/caisses/${caisse1}/ouverture`, {});
    const r = await parDirecteur<{ erreur: string }>("POST", `/api/appareils/${appareil1}/formation`, { formation: true });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("est ouverte");
  });
});

describe("recommencer la formation", () => {
  it("le lieu de formation est retiré (rien n'est effacé) ; la rentrée suivante repart d'un lieu vierge", async () => {
    await basculer("entree");
    const ancienne = directeur;
    await basculer("sortie");
    const r = await parDirecteur<EtatFormation>("POST", "/api/formation/remise-a-zero");
    expect(r.statut).toBe(200);
    expect(r.corps.lieuFormation).toBeNull();
    expect((await requete(ancienne, "GET", "/api/auth/session")).statut).toBe(401);
    const s = await basculer("entree");
    expect(s.lieu.id).not.toBe(lieuFormation);
    expect((await parDirecteur<Evenement[]>("GET", "/api/evenements")).corps).toEqual([]);
    // L'ancien lieu de formation et ses tickets existent toujours.
    const { rows } = await proprietaire.pool.query<{ n: number }>("SELECT count(*)::int AS n FROM journal_caisse WHERE lieu_id = $1", [lieuFormation]);
    expect(rows[0]!.n).toBeGreaterThan(0);
    await basculer("sortie");
    expect((await parDirecteur<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps.map((x) => x.type)).toContain("formation_recommencee");
  });
});

async function nomReel(): Promise<string> {
  const { rows } = await proprietaire.pool.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [lieu.lieuId]);
  return rows[0]!.nom;
}
