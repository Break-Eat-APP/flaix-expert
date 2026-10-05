/**
 * E-mails par Brevo (dossier §15.146), contre la vraie base ; Brevo est simulé. Le rapport part une fois à la
 * clôture de l'événement, chaque rectification de Z est notifiée, un échec n'annule rien, tout est tracé.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, Email, EntreeJournalTechnique, EtatEmails, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirEnvoyeurEmail, envoyerRapportParEmail } from "../src/routes/emails.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let rouen: Evenement;
let comptageId = "";
const envoyes: { a: string[]; email: Email }[] = [];
let enPanne = false;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  definirEnvoyeurEmail(async (a, email) => {
    if (enPanne) return { ok: false, erreur: "Brevo a répondu 503" };
    envoyes.push({ a, email });
    return { ok: true, messageId: `<message-${envoyes.length}@brevo>` };
  });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  const caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true })).corps[0]!.caisses[0]!.id;
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  rouen = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString(), spectateurs: 3_000 })).corps[0]!;
  await appel("POST", `/api/evenements/${rouen.id}/ouverture`);
  const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: 10_000 });
  const t = tablette(caisse, o.corps);
  vendreHorsLigne(t, [ligne(biere, 2)], { modeReglement: "especes", montantDonne: 1_400 });
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  // 114,00 € attendus (fond 100 € + 14 € d'espèces), 100,00 € comptés : écart de −14,00 €, motif donné.
  expect((await appel("POST", `/api/sessions-caisse/${o.corps.contexte.sessionId}/comptage`, { coupures: { "5000": 2 }, motif: "Billet introuvable" })).statut).toBe(200);
  comptageId = (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${rouen.id}`)).corps.sessions[0]!.comptage!.id;
});

afterAll(async () => {
  definirEnvoyeurEmail(null);
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("e-mails du lieu (§15.146)", () => {
  it("réglages : rapport et rectifications actifs par défaut ; le directeur est destinataire", async () => {
    const e = (await appel<EtatEmails>("GET", "/api/emails")).corps;
    expect(e).toMatchObject({ service: true, reglages: { rapport: true, rectification: true, supplementaires: [] } });
    expect(e.directeurs.map((d) => d.email)).toEqual([lieu.email]);
  });

  it("une adresse en plus (l'expert-comptable) ; [F] une adresse mal formée ou plus de 5 adresses sont refusées ; journalisé", async () => {
    expect((await appel("PUT", "/api/emails/reglages", { rapport: true, rectification: true, supplementaires: ["pas une adresse"] })).statut).toBe(400);
    expect((await appel("PUT", "/api/emails/reglages", { rapport: true, rectification: true, supplementaires: Array.from({ length: 6 }, (_, i) => `c${i}@cabinet.fr`) })).statut).toBe(400);
    const e = (await appel<EtatEmails>("PUT", "/api/emails/reglages", { rapport: true, rectification: true, supplementaires: ["Expert@Cabinet.fr"] })).corps;
    expect(e.reglages.supplementaires).toEqual(["expert@cabinet.fr"]);
    const jets = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    expect(jets.some((j) => j.type === "emails_reglages_modifies")).toBe(true);
  });

  it("clôture de l'événement : le rapport part une fois, au directeur et à l'expert-comptable, avec le lien du rapport", async () => {
    expect((await appel("POST", `/api/evenements/${rouen.id}/cloture`)).statut).toBe(200);
    const rapports = envoyes.filter((x) => x.email.sujet.startsWith("Rapport de soirée"));
    expect(rapports).toHaveLength(1);
    expect(rapports[0]!.a).toEqual([lieu.email, "expert@cabinet.fr"]);
    expect(rapports[0]!.email.texte).toContain(`/rapport-soiree/${rouen.id}`);
    // Une seconde demande ne renvoie rien.
    await envoyerRapportParEmail(app, { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, lieu.lieuId, rouen.id);
    expect(envoyes.filter((x) => x.email.sujet.startsWith("Rapport de soirée"))).toHaveLength(1);
  });

  it("rectification du Z : notifiée aussitôt, avec le motif et la signature", async () => {
    const avant = envoyes.length;
    expect((await appel("POST", `/api/comptages/${comptageId}/rectification`, { compte: 11_400, motif: "Billet de 14 € retrouvé dans la réserve", signature: "Rémi Notta" })).statut).toBe(200);
    expect(envoyes).toHaveLength(avant + 1);
    const m = envoyes.at(-1)!.email;
    expect(m.sujet).toBe("Rectification du Z — Caisse 1 (Buvette Nord), Rouen");
    expect(m.texte).toContain("Motif : Billet de 14 € retrouvé dans la réserve");
    expect(m.texte).toContain("Signé « Rémi Notta »");
  });

  it("[F] Brevo en panne : la rectification est enregistrée quand même, l'échec est tracé et visible", async () => {
    enPanne = true;
    expect((await appel("POST", `/api/comptages/${comptageId}/rectification`, { compte: 11_400, motif: "Seconde vérification du comptage", signature: "Rémi Notta" })).statut).toBe(200);
    enPanne = false;
    const e = (await appel<EtatEmails>("GET", "/api/emails")).corps;
    expect(e.derniers[0]).toMatchObject({ type: "rectification", statut: "echec", erreur: "Brevo a répondu 503" });
  });

  it("e-mail d'essai : à la seule personne connectée", async () => {
    const avant = envoyes.length;
    const e = (await appel<EtatEmails>("POST", "/api/emails/essai")).corps;
    expect(envoyes).toHaveLength(avant + 1);
    expect(envoyes.at(-1)!.a).toEqual([lieu.email]);
    expect(e.derniers[0]).toMatchObject({ type: "essai", statut: "envoye", destinataires: 1 });
  });

  it("[F] la trace des envois ne se modifie ni ne se supprime", async () => {
    await expect(app.transaction({ lieuId: lieu.lieuId }, (c) => c.query("UPDATE email_envoye SET statut = 'envoye'"))).rejects.toThrow();
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM email_envoye WHERE lieu_id = $1", [lieu.lieuId]))).rejects.toThrow();
  });
});
