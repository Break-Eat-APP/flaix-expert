/**
 * Caisse automatique selon la date (décision de Rémi, dossier §15.130), contre la vraie base :
 * la caissière n'a rien à choisir, la caisse s'ouvre sur l'événement du jour avec le fond prévu par
 * le directeur ; seul le directeur clôture, à distance si la tablette a tout envoyé, sinon en forçant.
 * Les tests [F] provoquent l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CodeCaissiere, EcranCaisse, EntreeJournalTechnique, Evenement, NouvellesCaisse, Produit, RepriseCaisse, SessionInfo, Stand, StatsCaisse } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Appel, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let directeur = "";
let stand: Stand;
let caisse1: string;
let caisse2: string;
let biere: Produit;
let julie: CodeCaissiere;
/** Tablette enregistrée comme caisse 1, avec Julie connectée. */
let tabletteJulie = "";
let rouen: Evenement;
let t: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
const JOUR = 86_400_000;

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
const parJulie = <T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) => requete<T>(tabletteJulie, method, url, payload);
const appelAvec =
  (cookies: string): Appel =>
  (method, url, payload) =>
    requete(cookies, method, url, payload);
const jet = async () => (await parDirecteur<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps;
const tableau = async (evenementId: string) => (await parDirecteur<StatsCaisse[]>("GET", `/api/caisses/tableau?evenementId=${evenementId}`)).corps;
const nouvelles = (tab: Tablette, attente = tab.attente.length) =>
  parJulie<NouvellesCaisse>("POST", `/api/caisses/${tab.caisseId}/nouvelles`, { sessionId: tab.reprise.contexte.sessionId, jeton: tab.reprise.jeton, sequence: tab.tete.sequence, attente });

/** Enregistre la tablette de la caisse et y connecte une nouvelle caissière : cookies de la tablette. */
async function tabletteAvecCaissiere(cookieDirecteur: string, caisseId: string, nom: string) {
  const code = (await requete<CodeCaissiere>(cookieDirecteur, "POST", "/api/equipe/caissieres", { nom })).corps;
  const enregistrement = await requete(cookieDirecteur, "POST", `/api/caisses/${caisseId}/appareil`);
  const appareil = `fx_appareil=${enregistrement.cookies.find((k) => k.name === "fx_appareil")!.value}`;
  const connexion = await requete<SessionInfo>(appareil, "POST", "/api/auth/code", { caissiereId: code.caissiere.id, code: code.code });
  return { code, cookies: `${appareil}; fx_session=${connexion.cookies.find((k) => k.name === "fx_session")!.value}` };
}

async function connecterDirecteur(email: string) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  directeur = await connecterDirecteur(lieu.email);

  await parDirecteur("POST", "/api/stands", { nom: "La Buvette" });
  stand = (await parDirecteur<Stand[]>("GET", "/api/stands")).corps[0]!;
  await parDirecteur("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true });
  stand = (await parDirecteur<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!;
  [caisse1, caisse2] = stand.caisses.map((k) => k.id) as [string, string];
  biere = (await parDirecteur<Produit[]>("POST", "/api/produits", { nom: "Bière 25cl", prixTtc: 400, tauxTva: 2000, standIds: [stand.id] })).corps[0]!;

  // Julie, connectée par son code sur la tablette enregistrée comme caisse 1.
  ({ code: julie, cookies: tabletteJulie } = await tabletteAvecCaissiere(directeur, caisse1, "Julie M."));
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("ouverture selon la date : la caissière n'a rien à faire", () => {
  it("rien de prévu aujourd'hui : la tablette attend et annonce le prochain événement ; la caisse ne s'ouvre pas", async () => {
    await parDirecteur("POST", "/api/evenements", { libelle: "Gap", debut: new Date(Date.now() + 7 * JOUR).toISOString() });
    const ecran = (await parJulie<EcranCaisse>("GET", `/api/caisses/${caisse1}/ecran`)).corps;
    expect(ecran.ouverture.evenement).toBeNull();
    expect(ecran.ouverture.blocage).toContain("Aucun événement prévu aujourd'hui");
    expect(ecran.ouverture.prochain?.libelle).toBe("Gap");
    const r = await parJulie<{ erreur: string }>("POST", `/api/caisses/${caisse1}/ouverture`, {});
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("« Gap »");
  });

  it("le directeur prévoit le fond de la caisse ; la modification est journalisée", async () => {
    const r = await parDirecteur<Stand[]>("PATCH", `/api/caisses/${caisse1}`, { fondPrevu: 15000 });
    expect(r.statut).toBe(200);
    expect(r.corps[0]!.caisses.find((k) => k.id === caisse1)!.fondPrevu).toBe(15000);
    const modif = (await jet()).find((e) => e.type === "caisse_modifiee")!;
    expect(modif.details).toMatchObject({ modifications: { fondPrevu: { avant: null, apres: 15000 } } });
  });

  it("jour J : à la première connexion, la caisse s'ouvre seule sur l'événement du jour, qui s'ouvre avec elle, avec le fond prévu", async () => {
    rouen = (await parDirecteur<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString() })).corps.find((e) => e.libelle === "Rouen")!;
    const ecran = (await parJulie<EcranCaisse>("GET", `/api/caisses/${caisse1}/ecran`)).corps;
    expect(ecran.ouverture).toMatchObject({ evenement: { id: rouen.id, aOuvrir: true }, blocage: null, dejaCloturee: null });
    expect(ecran.caisse.fondPrevu).toBe(15000);

    const o = await parJulie<RepriseCaisse>("POST", `/api/caisses/${caisse1}/ouverture`, {});
    expect(o.statut).toBe(200);
    expect(o.corps.contexte.evenementId).toBe(rouen.id);
    t = tablette(caisse1, o.corps);
    const apres = (await parJulie<EcranCaisse>("GET", `/api/caisses/${caisse1}/ecran`)).corps;
    expect(apres.session).toMatchObject({ evenementId: rouen.id, fond: 15000 });
    expect((await parDirecteur<Evenement[]>("GET", "/api/evenements")).corps.find((e) => e.id === rouen.id)!.etat).toBe("ouvert");

    const journal = await jet();
    expect(journal.find((e) => e.type === "evenement_ouvert")!.details).toMatchObject({ evenementId: rouen.id, automatique: true });
    expect(journal.find((e) => e.type === "caisse_ouverte")!.details).toMatchObject({ fond: 15000, fondPrevu: true });
  });

  it("la caisse suivante s'ouvre sur le même événement, sans l'ouvrir une deuxième fois", async () => {
    const o = await parDirecteur<RepriseCaisse>("POST", `/api/caisses/${caisse2}/ouverture`, {});
    expect(o.statut).toBe(200);
    expect(o.corps.contexte.evenementId).toBe(rouen.id);
    expect((await jet()).filter((e) => e.type === "evenement_ouvert")).toHaveLength(1);
    // Depuis la tablette qui tient la caisse, le directeur clôture comme avant (jeton et dernier rang).
    const cl = await parDirecteur("POST", `/api/caisses/${caisse2}/cloture`, { jeton: o.corps.jeton, derniereSequence: o.corps.tete.sequence });
    expect(cl.statut).toBe(200);
  });
});

describe("clôture : le directeur seul", () => {
  it("[F] la caissière ne clôture pas sa caisse", async () => {
    const r = await parJulie("POST", `/api/caisses/${caisse1}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
    expect(r.statut).toBe(403);
  });

  it("[F] à distance, refusée tant que la tablette a des tickets à envoyer ; faite dès qu'ils sont arrivés", async () => {
    vendreHorsLigne(t, [ligne(biere, 2)], { utilisateurId: julie.caissiere.id });
    vendreHorsLigne(t, [ligne(biere)], { utilisateurId: julie.caissiere.id });
    expect((await nouvelles(t)).corps).toEqual({ etat: "ouverte", sequenceServeur: 1 });

    const k = (await tableau(rouen.id)).find((s) => s.caisseId === caisse1)!;
    expect(k.ouverteMaintenant!.tablette).toMatchObject({ aEnvoyer: 2, cloturable: false });
    const refus = await parDirecteur<{ erreur: string }>("POST", `/api/caisses/${caisse1}/cloture`, {});
    expect(refus.statut).toBe(409);
    expect(refus.corps.erreur).toContain("2 tickets à envoyer");

    expect((await envoyer(appelAvec(tabletteJulie), t)).statut).toBe(200);
    await nouvelles(t);
    expect((await tableau(rouen.id)).find((s) => s.caisseId === caisse1)!.ouverteMaintenant!.tablette).toMatchObject({ aEnvoyer: 0, cloturable: true, raison: null });
    const cl = await parDirecteur<{ nbVentes: number; net: number; especesAttendues: number }>("POST", `/api/caisses/${caisse1}/cloture`, {});
    expect(cl.statut).toBe(200);
    expect(cl.corps).toMatchObject({ nbVentes: 2, net: 1200, especesAttendues: 15000 });
    expect((await jet()).find((e) => e.type === "caisse_cloturee")!.details).toMatchObject({ aDistance: true });
    // La tablette apprend que sa caisse est clôturée.
    expect((await nouvelles(t)).corps.etat).toBe("cloturee");
  });

  it("après la clôture, la caisse ne se rouvre pas seule : elle attend le prochain événement ; seul le directeur la rouvre", async () => {
    const ecran = (await parJulie<EcranCaisse>("GET", `/api/caisses/${caisse1}/ecran`)).corps;
    expect(ecran.session).toBeNull();
    expect(ecran.ouverture.dejaCloturee).toContain("Caisse clôturée pour « Rouen »");
    expect(ecran.ouverture.dejaCloturee).toContain("« Gap »");
    expect((await parJulie("POST", `/api/caisses/${caisse1}/ouverture`, {})).statut).toBe(409);
    const o = await parDirecteur<RepriseCaisse>("POST", `/api/caisses/${caisse1}/ouverture`, { fond: 5000 });
    expect(o.statut).toBe(200);
    t = tablette(caisse1, o.corps);
  });

  it("[F] tablette muette : clôture à distance refusée, sauf forçage avec motif et signature, inscrit au journal", async () => {
    const refus = await parDirecteur<{ erreur: string }>("POST", `/api/caisses/${caisse1}/cloture`, {});
    expect(refus.statut).toBe(409);
    expect(refus.corps.erreur).toContain("aucune nouvelle");
    expect((await parDirecteur("POST", `/api/caisses/${caisse1}/cloture`, { forcage: { motif: "Tablette cassée", signature: "" } })).statut).toBe(400);
    const cl = await parDirecteur("POST", `/api/caisses/${caisse1}/cloture`, { forcage: { motif: "Tablette tombée en panne", signature: "Rémi Notta" } });
    expect(cl.statut).toBe(200);
    expect((await jet()).find((e) => e.type === "caisse_cloturee")!.details).toMatchObject({
      aDistance: true,
      forcee: { motif: "Tablette tombée en panne", signature: "Rémi Notta", ticketsAEnvoyer: null, derniereNouvelle: null },
    });
  });
});

describe("garde-fou de date", () => {
  it("[F] l'événement d'hier est resté ouvert alors qu'un autre est prévu aujourd'hui : la caisse de la caissière ne s'ouvre pas ; le directeur, averti, garde la main", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    const d = await connecterDirecteur(autre.email);
    const par = <T = unknown>(method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) => requete<T>(d, method, url, payload);
    const s = (await par<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps[0]!;
    const caisse = (await par<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
    const hier = (await par<Evenement[]>("POST", "/api/evenements", { libelle: "Hier", debut: new Date(Date.now() - JOUR).toISOString() })).corps[0]!;
    expect((await par("POST", `/api/evenements/${hier.id}/ouverture`)).statut).toBe(200);
    await par("POST", "/api/evenements", { libelle: "Ce soir", debut: new Date().toISOString() });

    const { cookies: tab } = await tabletteAvecCaissiere(d, caisse, "Léa P.");
    const ecran = (await requete<EcranCaisse>(tab, "GET", `/api/caisses/${caisse}/ecran`)).corps;
    expect(ecran.ouverture.blocage).toContain("« Hier »");
    const r = await requete<{ erreur: string }>(tab, "POST", `/api/caisses/${caisse}/ouverture`, {});
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("le directeur doit d'abord le clôturer");
    const parLui = await par<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {});
    expect(parLui.statut).toBe(200);
    expect(parLui.corps.contexte.evenementId).toBe(hier.id);
  });
});
