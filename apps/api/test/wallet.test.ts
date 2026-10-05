/**
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §15.147), contre la vraie base : lien personnel créé
 * par le directeur, page publique, carte Apple signée, service web PassKit (inscription, liste, carte à jour),
 * notification au téléphone et mise à jour Google quand le solde change (vente, ajustement, nom), lien renouvelé.
 * Certificats et clés fabriqués pour le test ; Apple et Google remplacés par des enregistreurs.
 */
import { generateKeyPairSync } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import forge from "node-forge";
import type { CarteAbonne, CartePublique, EtatFidelite, EtatWallet, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirEnvoyeurEmail } from "../src/routes/emails.ts";
import { definirNotifieurApple, definirReglageApple } from "../src/wallet/apple.ts";
import { dezip } from "../src/wallet/fichiers.ts";
import { definirMiseAJourGoogle, definirReglageGoogle } from "../src/wallet/google.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let caisse = "";
let biere: Produit;
let t: Tablette;
let abonneId = "";
let jeton = "";
let auth = "";
const notifies: string[] = [];
const google: { id: string; modification: Record<string, unknown> }[] = [];
const emails: string[][] = [];
let reponseApple = 200;

const PASS_TYPE = "pass.com.flaixlabs.abonne";
const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: (r.headers["content-type"]?.toString().startsWith("application/json") ? r.json() : null) as T, brut: r };
}
/** Appel d'un téléphone Apple : ni cookie ni origine, jeton de la carte dans l'en-tête. */
function telephone(method: "GET" | "POST" | "DELETE", url: string, payload?: unknown, jetonCarte = auth) {
  return serveur.inject({ method, url, headers: { authorization: `ApplePass ${jetonCarte}`, ...(payload ? { "content-type": "application/json" } : {}) }, payload: payload as object | undefined });
}
const publique = (u: string) => serveur.inject({ method: "GET", url: u });

function certificat(nom: string) {
  const cles = forge.pki.rsa.generateKeyPair(1024);
  const c = forge.pki.createCertificate();
  c.publicKey = cles.publicKey;
  c.serialNumber = "01";
  c.validity.notBefore = new Date(Date.now() - 86_400_000);
  c.validity.notAfter = new Date(Date.now() + 86_400_000);
  c.setSubject([{ name: "commonName", value: nom }]);
  c.setIssuer([{ name: "commonName", value: nom }]);
  c.sign(cles.privateKey, forge.md.sha256.create());
  return { c, cle: cles.privateKey };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const carte = certificat(`Pass Type ID: ${PASS_TYPE}`);
  definirReglageApple({ teamId: "ABCDE12345", passTypeId: PASS_TYPE, cle: carte.cle, certificat: carte.c, wwdr: certificat("WWDR").c, clePem: "", certificatPem: "" });
  definirNotifieurApple(async (pushToken) => {
    notifies.push(pushToken);
    return reponseApple;
  });
  definirReglageGoogle({ issuerId: "3388000000012345678", email: "flaix@projet.iam.gserviceaccount.com", cle: generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey });
  definirMiseAJourGoogle(async (id, modification) => {
    google.push({ id, modification });
    return 200;
  });
  definirEnvoyeurEmail(async (a) => {
    emails.push(a);
    return { ok: true, messageId: "<carte@brevo>" };
  });

  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("PUT", "/api/lieu/reglages-caisse", { remiseAbonnePb: 1000 });
  let s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps[0]!;
  s = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!;
  caisse = s.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [s.id] })).corps[0]!;
  await appel("PUT", "/api/fidelite/reglages", { pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 });
  const e = (await appel<EtatFidelite>("POST", "/api/fidelite/abonnes", { numero: "AB-7", nom: "Karim", email: "karim@exemple.fr" })).corps;
  abonneId = e.abonnes.find((a) => a.numero === "AB-7")!.id;
  await appel("POST", `/api/fidelite/abonnes/${abonneId}/points`, { points: 40, commentaire: "Solde de départ" });
  const match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Spartiates – Rouen", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
});

afterAll(async () => {
  definirReglageApple(null);
  definirNotifieurApple(null);
  definirReglageGoogle(null);
  definirMiseAJourGoogle(null);
  definirEnvoyeurEmail(null);
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("lien de la carte (directeur)", () => {
  it("pas de lien tant que le directeur ne l'a pas créé ; le créer donne une adresse /carte/<jeton> et l'inscrit au journal", async () => {
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps).toMatchObject({ lien: null, apple: true, google: true, appareilsApple: 0 });
    const r = await appel<CarteAbonne>("POST", `/api/fidelite/abonnes/${abonneId}/carte`);
    expect(r.statut).toBe(200);
    expect(r.corps.lien).toMatch(/\/carte\/[A-Za-z0-9_-]{43}$/);
    jeton = r.corps.lien!.split("/carte/")[1]!;
    const { rows } = await proprietaire.pool.query("SELECT type FROM journal_technique WHERE type = 'carte_wallet_lien'");
    expect(rows).toHaveLength(1);
  });

  it("le lien part par e-mail à l'abonné, envoi tracé", async () => {
    const r = await appel<{ statut: string }>("POST", `/api/fidelite/abonnes/${abonneId}/carte/email`);
    expect(r.corps.statut).toBe("envoye");
    expect(emails.at(-1)).toEqual(["karim@exemple.fr"]);
    const { rows } = await proprietaire.pool.query("SELECT sujet FROM email_envoye WHERE type = 'carte_wallet'");
    expect(rows[0]!.sujet).toContain("Ta carte abonné");
  });

  it("couleur des cartes : contrôlée, enregistrée, journalisée", async () => {
    expect((await appel("PUT", "/api/wallet/couleur", { couleur: "rouge" })).statut).toBe(400);
    const r = await appel<EtatWallet>("PUT", "/api/wallet/couleur", { couleur: "#C8102E" });
    expect(r.corps).toEqual({ apple: true, google: true, couleur: "#c8102e" });
  });
});

describe("page publique et cartes", () => {
  it("le lien montre la carte sans connexion : nom, numéro, solde ; un faux lien est refusé", async () => {
    const r = await publique(`/api/carte/${jeton}`);
    expect(r.statusCode).toBe(200);
    expect(r.json<CartePublique>()).toEqual({ lieu: expect.any(String), couleur: "#c8102e", nom: "Karim", numero: "AB-7", points: 40, apple: true, google: true });
    expect((await publique(`/api/carte/${"x".repeat(43)}`)).statusCode).toBe(404);
  });

  it("carte Apple : .pkpass signé, QR code = n° d'abonné, service web et jeton propre à la carte", async () => {
    const r = await publique(`/api/carte/${jeton}/apple`);
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-type"]).toBe("application/vnd.apple.pkpass");
    const fichiers = dezip(r.rawPayload);
    const pass = JSON.parse(fichiers["pass.json"]!.toString("utf8"));
    expect(pass).toMatchObject({ passTypeIdentifier: PASS_TYPE, serialNumber: abonneId, barcodes: [{ message: "AB-7" }], webServiceURL: expect.stringMatching(/\/api\/passkit$/) });
    expect(pass.storeCard.primaryFields[0]).toMatchObject({ key: "points", value: 40 });
    auth = pass.authenticationToken;
    expect(auth).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("carte Google : redirection vers le lien signé « Ajouter à Google Wallet »", async () => {
    const r = await publique(`/api/carte/${jeton}/google`);
    expect(r.statusCode).toBe(302);
    expect(r.headers.location).toMatch(/^https:\/\/pay\.google\.com\/gp\/v\/save\/[\w-]+\.[\w-]+\.[\w-]+$/);
    const { rows } = await proprietaire.pool.query<{ lieu_id: string }>("SELECT lieu_id FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const logo = await publique(`/api/carte-logo/${rows[0]!.lieu_id}.png`);
    expect(logo.statusCode).toBe(200);
    expect(logo.headers["content-type"]).toBe("image/png");
  });
});

describe("service web PassKit", () => {
  const inscription = () => `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}/${abonneId}`;

  it("inscription du téléphone : 201 puis 200 ; sans le bon jeton, 401", async () => {
    expect((await telephone("POST", inscription(), { pushToken: "jeton-push-1" }, "mauvais-jeton-de-carte-0000")).statusCode).toBe(401);
    expect((await telephone("POST", inscription(), { pushToken: "jeton-push-1" })).statusCode).toBe(201);
    expect((await telephone("POST", inscription(), { pushToken: "jeton-push-1" })).statusCode).toBe(200);
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.appareilsApple).toBe(1);
  });

  it("une vente avec le n° d'abonné : le téléphone est prévenu, Google mis à jour, la carte a le nouveau solde", async () => {
    const avant = new Date().toISOString();
    notifies.length = 0;
    google.length = 0;
    // 3 bières à 21,00 € − 10 % abonné = 18,90 € → 18 points.
    vendreHorsLigne(t, [ligne(biere, 3)], { ajustement: { remisePb: 1000, motif: "abonne", reference: "AB-7" } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(notifies).toEqual(["jeton-push-1"]);
    expect(google).toEqual([{ id: `3388000000012345678.abonne_${abonneId.replace(/-/g, "")}`, modification: expect.objectContaining({ loyaltyPoints: expect.objectContaining({ balance: { int: 58 } }) }) }]);

    const liste = await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(avant)}`);
    expect(liste.json()).toMatchObject({ serialNumbers: [abonneId] });
    const carte = await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`);
    expect(carte.statusCode).toBe(200);
    expect(JSON.parse(dezip(carte.rawPayload)["pass.json"]!.toString("utf8")).storeCard.primaryFields[0].value).toBe(58);
    expect((await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(new Date().toISOString())}`)).statusCode).toBe(204);
  });

  it("une vente sans abonné ne prévient personne", async () => {
    notifies.length = 0;
    vendreHorsLigne(t, [ligne(biere, 1)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(notifies).toEqual([]);
  });

  it("ajustement de points et changement de nom prévenus ; téléphone qui a retiré la carte (410) oublié", async () => {
    notifies.length = 0;
    await appel("POST", `/api/fidelite/abonnes/${abonneId}/points`, { points: 10, commentaire: "Geste commercial" });
    expect(notifies).toEqual(["jeton-push-1"]);
    reponseApple = 410;
    await appel("PATCH", `/api/fidelite/abonnes/${abonneId}`, { nom: "Karim B." });
    reponseApple = 200;
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.appareilsApple).toBe(0);
  });

  it("désinscription sans corps ni JSON acceptée ; journal du téléphone accepté", async () => {
    expect((await telephone("POST", inscription(), { pushToken: "jeton-push-2" })).statusCode).toBe(201);
    expect((await telephone("DELETE", inscription())).statusCode).toBe(200);
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.appareilsApple).toBe(0);
    expect((await telephone("POST", "/api/passkit/v1/log", { logs: ["essai"] })).statusCode).toBe(200);
  });
});

describe("lien renouvelé et option", () => {
  it("renouveler le lien rend l'ancien inutilisable ; la carte Apple déjà installée reste à jour", async () => {
    const nouveau = (await appel<CarteAbonne>("POST", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.lien!.split("/carte/")[1]!;
    expect(nouveau).not.toBe(jeton);
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(404);
    expect((await publique(`/api/carte/${nouveau}`)).statusCode).toBe(200);
    expect((await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`)).statusCode).toBe(200);
    jeton = nouveau;
  });

  it("abonné désactivé : la page de la carte et le service web la refusent", async () => {
    await appel("PATCH", `/api/fidelite/abonnes/${abonneId}`, { actif: false });
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(404);
    expect((await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`)).statusCode).toBe(401);
  });
});
