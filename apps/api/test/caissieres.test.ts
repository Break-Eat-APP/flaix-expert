/**
 * Comptes des caissières et tablettes enregistrées (dossier §15.100), contre la vraie base.
 * Les tests [F] provoquent la fraude ou l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AccueilTablette, AppareilCaisse, Caissiere, CodeCaissiere, EditionTicket, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, SessionInfo, Stand, TicketVue } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Appel, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let directeur = "";
let stand: Stand;
let caisse1: string;
let caisse2: string;
let biere: Produit;
let match: Evenement;
let julie: CodeCaissiere;
let marc: CodeCaissiere;
/** Cookie de la tablette enregistrée comme caisse 1. */
let tablette1 = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

/** Appel au serveur avec les cookies donnés (session, tablette), renvoie aussi les cookies posés. */
async function requete<T = unknown>(cookies: string, method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({
    method,
    url,
    headers: { ...(method === "GET" ? {} : EN_TETES), cookie: cookies },
    payload: method === "GET" ? undefined : ((payload ?? {}) as object),
  });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const joindre = (...c: string[]) => c.filter(Boolean).join("; ");
const parDirecteur = <T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) => requete<T>(directeur, method, url, payload);
const appelAvec =
  (cookies: string): Appel =>
  (method, url, payload) =>
    requete(cookies, method, url, payload);

/** Connexion d'une caissière par son code, depuis une tablette (cookie fx_appareil). */
async function connecterCaissiere(appareil: string, caissiereId: string, code: string) {
  const r = await requete<SessionInfo & { erreur?: string }>(appareil, "POST", "/api/auth/code", { caissiereId, code });
  const s = r.cookies.find((k) => k.name === "fx_session");
  return { ...r, session: s ? `fx_session=${s.value}` : "" };
}
const autreCode = (code: string) => String((Number(code) + 1) % 10_000).padStart(4, "0");
const jet = async () => (await parDirecteur<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=200")).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  directeur = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;

  await parDirecteur("POST", "/api/stands", { nom: "La Buvette" });
  stand = (await parDirecteur<Stand[]>("GET", "/api/stands")).corps[0]!;
  await parDirecteur("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true });
  stand = (await parDirecteur<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!;
  [caisse1, caisse2] = stand.caisses.map((k) => k.id) as [string, string];
  biere = (await parDirecteur<Produit[]>("POST", "/api/produits", { nom: "Bière 25cl", prixTtc: 400, tauxTva: 2000, coutMatiere: 90, standIds: [stand.id] })).corps[0]!;
  match = (await parDirecteur<Evenement[]>("POST", "/api/evenements", { libelle: "Événement des caissières", debut: new Date().toISOString() })).corps[0]!;
  await parDirecteur("POST", `/api/evenements/${match.id}/ouverture`);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("Équipe → Fiches : le directeur crée les caissières", () => {
  it("une fiche reçoit un code à 4 chiffres, remis une seule fois ; la création est journalisée", async () => {
    const r = await parDirecteur<CodeCaissiere>("POST", "/api/equipe/caissieres", { nom: "Julie M." });
    expect(r.statut).toBe(201);
    expect(r.corps.code).toMatch(/^[0-9]{4}$/);
    expect(r.corps.caissiere).toMatchObject({ nom: "Julie M.", actif: true, bloqueeJusqua: null });
    julie = r.corps;
    marc = (await parDirecteur<CodeCaissiere>("POST", "/api/equipe/caissieres", { nom: "Marc D." })).corps;
    const liste = (await parDirecteur<Caissiere[]>("GET", "/api/equipe/caissieres")).corps;
    expect(liste.map((c) => c.nom)).toEqual(["Julie M.", "Marc D."]);
    expect(JSON.stringify(liste)).not.toContain(julie.code);
    expect((await jet()).filter((e) => e.type === "caissiere_creee")).toHaveLength(2);
  });

  it("deux fiches ne portent pas le même nom (la caissière se reconnaît sur la tablette)", async () => {
    const r = await parDirecteur<{ erreur: string }>("POST", "/api/equipe/caissieres", { nom: "  julie m. " });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("déjà ce nom");
  });

  it("[F] le code n'est jamais stocké en clair : la base n'en garde que l'empreinte", async () => {
    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ code_hash: string }>("SELECT code_hash FROM membre WHERE utilisateur_id = $1", [julie.caissiere.id]));
    expect(rows[0]!.code_hash).toMatch(/^\$argon2id\$/);
    expect(rows[0]!.code_hash).not.toContain(julie.code);
  });
});

describe("tablette enregistrée comme caisse", () => {
  it("sans tablette enregistrée, le code ne sert à rien", async () => {
    const r = await connecterCaissiere("", julie.caissiere.id, julie.code);
    expect(r.statut).toBe(403);
    expect(r.session).toBe("");
    expect((await requete("", "GET", "/api/appareil")).statut).toBe(404);
  });

  it("le directeur enregistre la tablette : elle reçoit un cookie protégé et montre sa caisse et les caissières", async () => {
    const r = await parDirecteur<AppareilCaisse[]>("POST", `/api/caisses/${caisse1}/appareil`);
    expect(r.statut).toBe(200);
    const c = r.cookies.find((k) => k.name === "fx_appareil")!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite?.toLowerCase()).toBe("strict");
    tablette1 = `fx_appareil=${c.value}`;
    expect(r.corps.filter((a) => !a.retireLe)).toHaveLength(1);
    const accueil = await requete<AccueilTablette>(tablette1, "GET", "/api/appareil");
    expect(accueil.corps.caisse.id).toBe(caisse1);
    expect(accueil.corps.caissieres.map((c) => c.nom)).toEqual(["Julie M.", "Marc D."]);
    expect((await jet()).some((e) => e.type === "appareil_enregistre")).toBe(true);
  });

  it("la tablette enregistrée ne sert pas à un directeur d'un autre lieu", async () => {
    const autre = await creerLieuDeTest(proprietaire);
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: autre.email, motDePasse: MOT_DE_PASSE_TEST } });
    const autreDirecteur = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
    expect((await requete(autreDirecteur, "POST", `/api/caisses/${caisse1}/appareil`)).statut).toBe(404);
  });
});

describe("connexion d'une caissière par son code", () => {
  it("4 codes faux : refusés et journalisés ; le 5e bloque la fiche 15 minutes, même avec le bon code ensuite [F]", async () => {
    for (let i = 1; i <= 4; i++) {
      const r = await connecterCaissiere(tablette1, marc.caissiere.id, autreCode(marc.code));
      expect(r.statut).toBe(401);
    }
    const cinquieme = await connecterCaissiere(tablette1, marc.caissiere.id, autreCode(marc.code));
    expect(cinquieme.statut).toBe(403);
    expect(cinquieme.corps.erreur).toContain("bloquée");
    const bonCode = await connecterCaissiere(tablette1, marc.caissiere.id, marc.code);
    expect(bonCode.statut).toBe(403);
    expect(bonCode.session).toBe("");
    const j = await jet();
    expect(j.filter((e) => e.type === "connexion_refusee" && e.details.mode === "code")).toHaveLength(4);
    expect(j.filter((e) => e.type === "connexion_bloquee")).toHaveLength(1);
    expect((await parDirecteur<Caissiere[]>("GET", "/api/equipe/caissieres")).corps.find((c) => c.id === marc.caissiere.id)!.bloqueeJusqua).not.toBeNull();
  });

  it("un nouveau code donné par le directeur débloque la fiche ; l'ancien code ne marche plus", async () => {
    const ancien = marc.code;
    const r = await parDirecteur<CodeCaissiere>("POST", `/api/equipe/caissieres/${marc.caissiere.id}/code`);
    expect(r.corps.caissiere.bloqueeJusqua).toBeNull();
    marc = r.corps;
    if (ancien !== marc.code) expect((await connecterCaissiere(tablette1, marc.caissiere.id, ancien)).statut).toBe(401);
    const ok = await connecterCaissiere(tablette1, marc.caissiere.id, marc.code);
    expect(ok.statut).toBe(200);
    expect(ok.corps).toMatchObject({ role: "operateur", appareil: { caisseId: caisse1 }, utilisateur: { nom: "Marc D.", email: null } });
  });

  it("une caissière ne se connecte jamais par e-mail, et n'a pas de mot de passe à changer", async () => {
    const julieConnectee = await connecterCaissiere(tablette1, julie.caissiere.id, julie.code);
    expect(julieConnectee.statut).toBe(200);
    const r = await requete<{ erreur: string }>(julieConnectee.session, "POST", "/api/auth/mot-de-passe", { actuel: "x", nouveau: "un-mot-de-passe-long" });
    expect(r.statut).toBe(403);
  });
});

describe("B2 [F] — une caissière ne voit que l'écran de SA caisse", () => {
  let julieSession = "";
  beforeAll(async () => {
    julieSession = joindre((await connecterCaissiere(tablette1, julie.caissiere.id, julie.code)).session, tablette1);
  });

  it("configuration, produits (coûts), tickets du lieu, équipe : refusés et journalisés", async () => {
    const avant = (await jet()).filter((e) => e.type === "acces_refuse").length;
    for (const url of ["/api/stands", "/api/produits", `/api/tickets?evenementId=${match.id}`, "/api/equipe/caissieres", "/api/appareils", "/api/journal-technique", "/api/evenements"]) {
      expect((await requete(julieSession, "GET", url)).statut, url).toBe(403);
    }
    expect((await requete(julieSession, "POST", "/api/equipe/caissieres", { nom: "Complice" })).statut).toBe(403);
    expect((await requete(julieSession, "POST", `/api/caisses/${caisse2}/appareil`)).statut).toBe(403);
    const apres = (await jet()).filter((e) => e.type === "acces_refuse").length;
    expect(apres - avant).toBe(9);
  });

  it("l'écran de sa caisse ne contient aucun coût ; l'écran d'une autre caisse est refusé", async () => {
    const ecran = await requete(julieSession, "GET", `/api/caisses/${caisse1}/ecran`);
    expect(ecran.statut).toBe(200);
    expect(JSON.stringify(ecran.corps)).not.toMatch(/cout|marge/i);
    expect((await requete(julieSession, "GET", `/api/caisses/${caisse2}/ecran`)).statut).toBe(403);
    expect((await requete(julieSession, "POST", `/api/caisses/${caisse2}/ouverture`, {})).statut).toBe(403);
  });

  let t: Tablette;
  it("elle ouvre sa caisse, vend ; chaque ticket porte son nom ; la reprise sur un autre appareil lui est refusée", async () => {
    const o = await requete<RepriseCaisse>(julieSession, "POST", `/api/caisses/${caisse1}/ouverture`, { fond: 10000 });
    expect(o.statut).toBe(200);
    t = tablette(caisse1, o.corps);
    vendreHorsLigne(t, [ligne(biere, 2)], { utilisateurId: julie.caissiere.id });
    expect((await envoyer(appelAvec(julieSession), t)).statut).toBe(200);
    expect((await requete(julieSession, "POST", `/api/caisses/${caisse1}/reprise`)).statut).toBe(403);
    const tickets = (await parDirecteur<TicketVue[]>("GET", `/api/tickets?evenementId=${match.id}`)).corps;
    expect(tickets.map((x) => x.operateur)).toEqual(["Julie M."]);
  });

  it("changement de caissière : Julie se déconnecte, Marc continue la même caisse ; chaque ticket garde sa vendeuse", async () => {
    // Julie vend encore, sans réseau, puis se déconnecte : son ticket attend sur la tablette.
    vendreHorsLigne(t, [ligne(biere)], { utilisateurId: julie.caissiere.id });
    await requete(julieSession, "POST", "/api/auth/deconnexion");
    expect((await requete(julieSession, "GET", `/api/caisses/${caisse1}/ecran`)).statut).toBe(401);
    const marcSession = joindre((await connecterCaissiere(tablette1, marc.caissiere.id, marc.code)).session, tablette1);
    vendreHorsLigne(t, [ligne(biere, 3)], { utilisateurId: marc.caissiere.id });
    // Marc envoie le lot : le ticket de Julie et le sien.
    expect((await envoyer(appelAvec(marcSession), t)).statut).toBe(200);
    const tickets = (await parDirecteur<TicketVue[]>("GET", `/api/tickets?evenementId=${match.id}`)).corps;
    expect(tickets.map((x) => x.operateur).sort()).toEqual(["Julie M.", "Julie M.", "Marc D."]);
    const v = await parDirecteur<{ ok: boolean }>("POST", "/api/caisses/verification");
    expect(v.corps.ok).toBe(true);
    // Il clôture la caisse.
    const cl = await requete<{ nbVentes: number; net: number }>(marcSession, "POST", `/api/caisses/${caisse1}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
    expect(cl.corps).toMatchObject({ nbVentes: 3, net: 2400 });
  });

  it("[F] un ticket attribué à une personne d'un autre lieu est refusé, lot entier", async () => {
    const o = await parDirecteur<RepriseCaisse>("POST", `/api/caisses/${caisse1}/ouverture`, { fond: 0 });
    const t2 = tablette(caisse1, o.corps);
    const etranger = await creerLieuDeTest(proprietaire);
    vendreHorsLigne(t2, [ligne(biere)], { utilisateurId: etranger.utilisateurId });
    const r = await envoyer(appelAvec(directeur), t2);
    expect(r.statut).toBe(409);
    expect((r.corps as { erreur: string }).erreur).toContain("personne inconnue");
    t2.attente = [];
    t2.tete = o.corps.tete;
    t2.tickets = [];
    const cl = await parDirecteur("POST", `/api/caisses/${caisse1}/cloture`, { jeton: t2.reprise.jeton, derniereSequence: t2.tete.sequence });
    expect(cl.statut).toBe(200);
  });
});

describe("retirer une tablette, désactiver une fiche", () => {
  it("fiche désactivée : ses connexions sont fermées, elle disparaît de la tablette", async () => {
    const s = joindre((await connecterCaissiere(tablette1, marc.caissiere.id, marc.code)).session, tablette1);
    expect((await requete(s, "GET", "/api/auth/session")).statut).toBe(200);
    expect((await parDirecteur("PATCH", `/api/equipe/caissieres/${marc.caissiere.id}`, { actif: false })).statut).toBe(200);
    expect((await requete(s, "GET", "/api/auth/session")).statut).toBe(401);
    expect((await requete<AccueilTablette>(tablette1, "GET", "/api/appareil")).corps.caissieres.map((c) => c.nom)).toEqual(["Julie M."]);
    expect((await connecterCaissiere(tablette1, marc.caissiere.id, marc.code)).statut).toBe(401);
    expect((await jet()).some((e) => e.type === "caissiere_modifiee")).toBe(true);
  });

  it("tablette retirée : les caissières qui y sont connectées sont déconnectées, le code n'y marche plus", async () => {
    const s = joindre((await connecterCaissiere(tablette1, julie.caissiere.id, julie.code)).session, tablette1);
    const appareils = (await parDirecteur<AppareilCaisse[]>("GET", "/api/appareils")).corps;
    const actif = appareils.find((a) => !a.retireLe)!;
    expect((await parDirecteur("POST", `/api/appareils/${actif.id}/retrait`)).statut).toBe(200);
    expect((await requete(s, "GET", "/api/auth/session")).statut).toBe(401);
    expect((await connecterCaissiere(tablette1, julie.caissiere.id, julie.code)).statut).toBe(403);
    expect((await requete(tablette1, "GET", "/api/appareil")).statut).toBe(404);
    expect((await jet()).some((e) => e.type === "appareil_retire")).toBe(true);
  });

  it("le journal technique reste intègre après tout cela", async () => {
    const v = await parDirecteur<{ ok: boolean; numerotationContinue: boolean }>("POST", "/api/journal-technique/verification");
    expect(v.corps).toMatchObject({ ok: true, numerotationContinue: true });
  });
});

describe("[F] la base elle-même refuse ce que le serveur ne doit pas faire", () => {
  const ctx = () => ({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId });

  it("le serveur ne peut ni créer un compte, ni un membre, ni changer un rôle directement", async () => {
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("INSERT INTO utilisateur (nom) VALUES ('Pirate')")))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, 'directeur')", [lieu.lieuId, julie.caissiere.id])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE membre SET role = 'directeur' WHERE utilisateur_id = $1", [julie.caissiere.id])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE membre SET code_hash = 'x' WHERE utilisateur_id = $1", [julie.caissiere.id])))).toBe("42501");
  });

  it("créer une caissière demande d'être directeur du lieu, même en appelant la base directement", async () => {
    const commeCaissiere = { lieuId: lieu.lieuId, utilisateurId: julie.caissiere.id };
    expect(await codeErreur(app.transaction(commeCaissiere, (c) => c.query("SELECT creer_caissiere('Complice', 'x')")))).toBe("42501");
    expect(await codeErreur(app.transaction(commeCaissiere, (c) => c.query("SELECT changer_code_caissiere($1, 'x')", [julie.caissiere.id])))).toBe("42501");
    // Un directeur ne peut pas, par ces fonctions, modifier un compte qui n'est pas une caissière de son lieu.
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("SELECT modifier_caissiere($1, 'Renommé', true)", [lieu.utilisateurId])))).toBe("42501");
  });

  it("une tablette retirée ne revient pas, et un enregistrement ne se supprime pas", async () => {
    const { rows } = await app.transaction(ctx(), (c) => c.query<{ id: string }>("SELECT id FROM appareil_caisse WHERE lieu_id = $1 AND retire_le IS NOT NULL LIMIT 1", [lieu.lieuId]));
    const id = rows[0]!.id;
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE appareil_caisse SET retire_le = NULL, retire_par = NULL WHERE id = $1", [id])))).toBe("23514");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("DELETE FROM appareil_caisse WHERE id = $1", [id])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM appareil_caisse WHERE id = $1", [id])))).toBe("42501");
  });
});

describe("ticket client sur demande (dossier §15.99)", () => {
  it("le directeur édite le ticket ; chaque édition est journalisée et numérotée, la 2e est un duplicata", async () => {
    const t = (await parDirecteur<TicketVue[]>("GET", `/api/tickets?evenementId=${match.id}`)).corps.find((x) => x.operateur === "Marc D.")!;
    const e1 = await parDirecteur<EditionTicket>("POST", `/api/tickets/${t.id}/edition`);
    expect(e1.statut).toBe(200);
    expect(e1.corps).toMatchObject({ edition: 1, ticket: { numeroJustificatif: t.numeroJustificatif, operateur: "Marc D.", totalTtc: 1200 } });
    expect(e1.corps.lieu.nom).toContain("Lieu de test");
    const e2 = await parDirecteur<EditionTicket>("POST", `/api/tickets/${t.id}/edition`);
    expect(e2.corps.edition).toBe(2);
    const editions = (await jet()).filter((e) => e.type === "ticket_edite");
    expect(editions.map((e) => e.details.edition).sort()).toEqual([1, 2]);
    expect(editions.find((e) => e.details.edition === 2)!.details.duplicata).toBe(true);
  });

  it("[F] une caissière ne peut pas éditer de ticket, et un ticket d'un autre lieu est introuvable", async () => {
    const t = (await parDirecteur<TicketVue[]>("GET", `/api/tickets?evenementId=${match.id}`)).corps[0]!;
    const julieSession = joindre((await connecterCaissiere(tablette1, julie.caissiere.id, julie.code)).session, tablette1);
    // La tablette a été retirée plus haut : la caissière ne peut même plus se connecter ; sans session, refus.
    expect((await requete(julieSession, "POST", `/api/tickets/${t.id}/edition`)).statut).toBe(401);
    const autre = await creerLieuDeTest(proprietaire);
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: autre.email, motDePasse: MOT_DE_PASSE_TEST } });
    const autreDirecteur = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
    expect((await requete(autreDirecteur, "POST", `/api/tickets/${t.id}/edition`)).statut).toBe(404);
  });
});
