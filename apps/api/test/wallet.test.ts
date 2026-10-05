/**
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §15.147), contre la vraie base : lien personnel créé
 * par le directeur, page publique, carte Apple signée, service web PassKit (inscription, liste, carte à jour),
 * notification au téléphone et mise à jour Google quand le solde change (vente, ajustement, nom), lien renouvelé.
 * Certificats et clés fabriqués pour le test ; Apple et Google remplacés par des enregistreurs.
 */
import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import forge from "node-forge";
import type { CarteAbonne, CartePublique, EtatFidelite, EtatWallet, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirEnvoyeurEmail } from "../src/routes/emails.ts";
import { travauxTermines } from "../src/arriere-plan.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { relancerCartes } from "../src/routes/wallet.ts";
import { soldePoints, soldesPoints } from "../src/routes/fidelite-caisse.ts";
import { pngUni } from "../src/wallet/fichiers.ts";
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
const google: { ressource: string; id: string; contenu: Record<string, unknown> }[] = [];
const emails: string[][] = [];
let reponseApple = 200;

const PASS_TYPE = "pass.com.flaixlabs.abonne";
const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: unknown) {
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
  return { der: Buffer.from(forge.asn1.toDer(forge.pki.certificateToAsn1(c)).getBytes(), "binary"), cle: createPrivateKey(forge.pki.privateKeyToPem(cles.privateKey)) };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const carte = certificat(`Pass Type ID: ${PASS_TYPE}`);
  definirReglageApple({ teamId: "ABCDE12345", passTypeId: PASS_TYPE, cle: carte.cle, certificat: carte.der, wwdr: certificat("WWDR").der, clePem: "", certificatPem: "" });
  definirNotifieurApple(async (pushToken) => {
    notifies.push(pushToken);
    return reponseApple;
  });
  definirReglageGoogle({ issuerId: "3388000000012345678", email: "flaix@projet.iam.gserviceaccount.com", cle: generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey });
  definirMiseAJourGoogle(async (ressource, id, contenu) => {
    google.push({ ressource, id, contenu });
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
    const { design } = (await appel<EtatWallet>("GET", "/api/wallet")).corps;
    expect((await appel("PUT", "/api/wallet/design", { couleur: "rouge", design })).statut).toBe(400);
    const r = await appel<EtatWallet>("PUT", "/api/wallet/design", { couleur: "#C8102E", design });
    expect(r.corps).toMatchObject({ apple: true, google: true, couleur: "#c8102e", cartes: 1, images: { logo: null, banniere: null } });
    await travauxTermines();
  });
});

describe("page publique et cartes", () => {
  it("le lien montre la carte sans connexion : nom, numéro, solde ; un faux lien est refusé", async () => {
    const r = await publique(`/api/carte/${jeton}`);
    expect(r.statusCode).toBe(200);
    expect(r.json<CartePublique>()).toEqual({
      lieu: expect.any(String),
      couleur: "#c8102e",
      couleurTexte: "#ffffff",
      couleurLibelles: "#ffffff",
      titre: "Carte abonné",
      afficherNomLieu: true,
      libellePoints: "Points",
      nom: "Karim",
      numero: "AB-7",
      points: 40,
      reduction: 0,
      remise: "10 %",
      logo: null,
      banniere: null,
      apple: true,
      google: true,
    });
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
    await travauxTermines();
    expect(notifies).toEqual(["jeton-push-1"]);
    expect(google).toEqual([
      { ressource: "loyaltyObject", id: `3388000000012345678.abonne_${abonneId.replace(/-/g, "")}`, contenu: expect.objectContaining({ loyaltyPoints: expect.objectContaining({ balance: { int: 58 } }) }) },
    ]);

    const liste = await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(avant)}`);
    expect(liste.json()).toMatchObject({ serialNumbers: [abonneId] });
    const carte = await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`);
    expect(carte.statusCode).toBe(200);
    expect(JSON.parse(dezip(carte.rawPayload)["pass.json"]!.toString("utf8")).storeCard.primaryFields[0].value).toBe(58);
    expect((await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(new Date().toISOString())}`)).statusCode).toBe(204);
  });

  it("la date rendue au téléphone ne lui fait pas retélécharger une carte inchangée (audit P3-3)", async () => {
    const liste = await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}`);
    const { lastUpdated } = liste.json() as { lastUpdated: string };
    expect((await telephone("GET", `/api/passkit/v1/devices/iphone-1/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(lastUpdated)}`)).statusCode).toBe(204);
  });

  it("la caisse n'attend ni Apple ni Google : réponse d'abord, notification ensuite (audit P2-1)", async () => {
    let liberer!: () => void;
    const bloque = new Promise<void>((r) => (liberer = r));
    definirNotifieurApple(async (pushToken) => {
      await bloque;
      notifies.push(pushToken);
      return 200;
    });
    notifies.length = 0;
    vendreHorsLigne(t, [ligne(biere, 1)], { ajustement: { remisePb: 1000, motif: "abonne", reference: "AB-7" } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(notifies).toEqual([]);
    liberer();
    await travauxTermines();
    expect(notifies).toEqual(["jeton-push-1"]);
    definirNotifieurApple(async (pushToken) => {
      notifies.push(pushToken);
      return reponseApple;
    });
  });

  it("une vente sans abonné ne prévient personne", async () => {
    notifies.length = 0;
    vendreHorsLigne(t, [ligne(biere, 1)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    await travauxTermines();
    expect(notifies).toEqual([]);
  });

  it("ajustement de points et changement de nom prévenus ; téléphone qui a retiré la carte (410) oublié", async () => {
    notifies.length = 0;
    await appel("POST", `/api/fidelite/abonnes/${abonneId}/points`, { points: 10, commentaire: "Geste commercial" });
    await travauxTermines();
    expect(notifies).toEqual(["jeton-push-1"]);
    reponseApple = 410;
    await appel("PATCH", `/api/fidelite/abonnes/${abonneId}`, { nom: "Karim B." });
    await travauxTermines();
    reponseApple = 200;
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.appareilsApple).toBe(0);
  });

  it("désinscription sans corps ni JSON acceptée ; journal du téléphone accepté", async () => {
    expect((await telephone("POST", inscription(), { pushToken: "jeton-push-2" })).statusCode).toBe(201);
    expect((await telephone("DELETE", inscription())).statusCode).toBe(200);
    expect((await appel<CarteAbonne>("GET", `/api/fidelite/abonnes/${abonneId}/carte`)).corps.appareilsApple).toBe(0);
    expect((await telephone("POST", "/api/passkit/v1/log", { logs: ["essai"] })).statusCode).toBe(200);
  });

  it("journal du téléphone limité à 10 envois par minute (audit P2-5)", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) codes.push((await telephone("POST", "/api/passkit/v1/log", { logs: ["essai"] })).statusCode);
    expect(codes[0]).toBe(200);
    expect(codes.at(-1)).toBe(429);
  });
});

describe("design de la carte (§15.148)", () => {
  const png = (l: number, h: number, couleur = "#ffffff") => pngUni(couleur, l, h).toString("base64");
  const logo = { logo: png(50, 50), "logo@2x": png(100, 100), "logo@3x": png(150, 150), icon: png(29, 29), "icon@2x": png(58, 58), "icon@3x": png(87, 87), "google-logo": png(660, 660) };
  const banniere = { strip: png(375, 123, "#123456"), "strip@2x": png(750, 246, "#123456"), "strip@3x": png(1125, 369, "#123456"), "google-hero": png(1032, 336, "#123456") };
  const design = {
    titre: "Carte Supporter",
    afficherNomLieu: false,
    couleurTexte: "#ffd400",
    couleurLibelles: null,
    libellePoints: "Spartapoints",
    message: "Une boisson offerte à ton anniversaire.",
    afficherRemise: true,
    afficherReduction: true,
    siteWeb: "https://spartiates.fr",
    telephone: "04 91 00 00 00",
    email: "contact@spartiates.fr",
    lienApp: null,
  };
  const carteApple = async () => dezip((await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`)).rawPayload);

  it("contrôlé ; enregistré et journalisé ; téléphone prévenu, modèle et carte Google remplacés ; rien de changé, rien d'envoyé", async () => {
    expect((await telephone("POST", `/api/passkit/v1/devices/iphone-3/registrations/${PASS_TYPE}/${abonneId}`, { pushToken: "jeton-push-3" })).statusCode).toBe(201);
    expect((await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design: { ...design, siteWeb: "http://spartiates.fr" } })).statut).toBe(400);
    expect((await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design: { ...design, telephone: "appelle-moi" } })).statut).toBe(400);
    expect((await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design: { ...design, couleurTexte: "jaune" } })).statut).toBe(400);
    notifies.length = 0;
    google.length = 0;
    const r = await appel<EtatWallet>("PUT", "/api/wallet/design", { couleur: "#c8102e", design });
    expect(r.statut).toBe(200);
    expect(r.corps.design).toEqual(design);
    await travauxTermines();
    expect(notifies).toEqual(["jeton-push-3"]);
    expect(google.map((g) => g.ressource)).toEqual(["loyaltyClass", "loyaltyObject"]);
    expect(google[0]!.contenu).toMatchObject({ programName: "Carte Supporter", hexBackgroundColor: "#c8102e", reviewStatus: "UNDER_REVIEW" });
    expect(google[1]!.contenu).toMatchObject({ loyaltyPoints: { label: "Spartapoints" } });
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE type = 'carte_wallet_design' ORDER BY numero DESC LIMIT 1");
    expect(rows[0].details.champs).toEqual(expect.arrayContaining(["titre", "libellePoints", "siteWeb", "message"]));
    const pass = JSON.parse((await carteApple())["pass.json"]!.toString("utf8"));
    expect(pass).toMatchObject({ description: expect.stringMatching(/^Carte Supporter — /), foregroundColor: "rgb(255, 212, 0)" });
    expect(pass).not.toHaveProperty("logoText");

    notifies.length = 0;
    await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design });
    await travauxTermines();
    expect(notifies).toEqual([]);
  });

  it("logo et bannière : formats contrôlés, rangés, dans la carte Apple, la page de l'abonné et le modèle Google ; retirés", async () => {
    const { rows } = await proprietaire.pool.query<{ lieu_id: string }>("SELECT lieu_id FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const lieuId = rows[0]!.lieu_id;
    expect((await appel("PUT", "/api/wallet/images/banniere", { variantes: { ...banniere, "strip@3x": png(1125, 370) } })).statut).toBe(400);
    expect((await appel("PUT", "/api/wallet/images/photo", { variantes: banniere })).statut).toBe(400);
    google.length = 0;
    expect((await appel("PUT", "/api/wallet/images/logo", { variantes: logo })).statut).toBe(200);
    await travauxTermines();
    const r = await appel<EtatWallet>("PUT", "/api/wallet/images/banniere", { variantes: banniere });
    expect(r.statut).toBe(200);
    expect(r.corps.images.banniere?.apple).toMatch(/^\/api\/wallet\/image\/strip@3x\?v=\d+$/);
    expect(r.corps.images.logo?.google).toMatch(/^\/api\/wallet\/image\/google-logo\?v=\d+$/);
    await travauxTermines();
    expect(google.filter((g) => g.ressource === "loyaltyClass").at(-1)!.contenu).toMatchObject({
      programLogo: { sourceUri: { uri: expect.stringMatching(/\/api\/carte-logo\/[\w-]+\.png\?v=\d+$/) } },
      heroImage: { sourceUri: { uri: expect.stringMatching(/\/api\/carte-banniere\/[\w-]+\.png\?v=\d+$/) } },
    });

    const apercu = await serveur.inject({ method: "GET", url: r.corps.images.banniere!.apple, headers: { cookie } });
    expect(apercu.headers["content-type"]).toBe("image/png");
    const carte = (await publique(`/api/carte/${jeton}`)).json<CartePublique>();
    expect(carte).toMatchObject({ titre: "Carte Supporter", libellePoints: "Spartapoints", couleurTexte: "#ffd400", afficherNomLieu: false });
    expect((await publique(carte.banniere!)).headers["content-type"]).toBe("image/png");
    expect((await publique(carte.logo!)).rawPayload).toEqual(Buffer.from(logo["google-logo"], "base64"));

    const fichiers = Object.keys(await carteApple()).filter((n) => n.endsWith(".png"));
    expect(fichiers.sort()).toEqual(["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png", "strip.png", "strip@2x.png", "strip@3x.png"]);

    expect((await appel<EtatWallet>("DELETE", "/api/wallet/images/banniere")).corps.images.banniere).toBeNull();
    await travauxTermines();
    expect((await publique(`/api/carte-banniere/${lieuId}.png`)).statusCode).toBe(404);
    expect(Object.keys(await carteApple()).some((n) => n.startsWith("strip"))).toBe(false);
    const { rows: jets } = await proprietaire.pool.query("SELECT details->>'action' AS action FROM journal_technique WHERE type = 'carte_wallet_image' ORDER BY numero");
    expect(jets.map((j) => j.action)).toEqual(["deposee", "deposee", "retiree"]);
  });
});

describe("mise à jour de toutes les cartes par lots (audit P2-3)", () => {
  it("250 cartes de plus : modèle Google une fois, chaque carte une fois ; soldes identiques à ceux lus par la caisse", async () => {
    const { rows } = await proprietaire.pool.query<{ lieu_id: string; cree_par: string }>("SELECT lieu_id, cree_par FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const { lieu_id: lieuId, cree_par: par } = rows[0]!;
    await proprietaire.pool.query(
      `INSERT INTO abonne_fidelite (lieu_id, numero, nom, source, cree_par, carte_jeton)
       SELECT $1, 'LOT-' || n, 'Abonné ' || n, 'saisie', $2, rpad('lot' || n || 'x', 43, 'abcdefghij') FROM generate_series(1, 250) n`,
      [lieuId, par],
    );
    const { rows: cartes } = await proprietaire.pool.query<{ n: number }>("SELECT count(*)::int AS n FROM abonne_fidelite WHERE lieu_id = $1 AND carte_jeton IS NOT NULL", [lieuId]);
    google.length = 0;
    const { design } = (await appel<EtatWallet>("GET", "/api/wallet")).corps;
    expect((await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design: { ...design, titre: "Carte Kop" } })).statut).toBe(200);
    await travauxTermines();
    expect(google.filter((g) => g.ressource === "loyaltyClass")).toHaveLength(1);
    const objets = google.filter((g) => g.ressource === "loyaltyObject");
    expect(objets).toHaveLength(cartes[0]!.n);
    expect(new Set(objets.map((o) => o.id)).size).toBe(cartes[0]!.n);

    const ids = (await proprietaire.pool.query<{ id: string; numero: string }>("SELECT id, numero FROM abonne_fidelite WHERE lieu_id = $1 ORDER BY numero LIMIT 3", [lieuId])).rows;
    const tous = [...ids, { id: abonneId, numero: "AB-7" }];
    await app.transaction({ lieuId }, async (c) => {
      const lot = await soldesPoints(c, lieuId, tous.map((x) => x.id), 1);
      for (const x of tous) expect(lot.get(x.id)).toBe((await soldePoints(c, lieuId, x.id, x.numero, 1)).solde);
    });
  });
});

describe("relance des envois en échec (audit Codex du 2026-10-05)", () => {
  it("Google en panne : carte notée, renvoyée à l'heure prévue, relance effacée ; abandon après 12 essais", async () => {
    const { rows } = await proprietaire.pool.query<{ lieu_id: string }>("SELECT lieu_id FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const lieuId = rows[0]!.lieu_id;
    const relances = async () =>
      (await proprietaire.pool.query("SELECT cible, essais, cause, prochain_essai > now() AS plus_tard FROM wallet_relance WHERE lieu_id = $1", [lieuId])).rows;
    let statutGoogle = 503;
    definirMiseAJourGoogle(async (ressource, id, contenu) => {
      google.push({ ressource, id, contenu });
      return statutGoogle;
    });
    await appel("POST", `/api/fidelite/abonnes/${abonneId}/points`, { points: 5, commentaire: "Essai de relance" });
    await travauxTermines();
    expect(await relances()).toEqual([{ cible: abonneId, essais: 1, cause: "google 503", plus_tard: true }]);

    // Pas encore l'heure : rien n'est renvoyé.
    google.length = 0;
    expect(await relancerCartes(app, serveur.log)).toBe(0);
    expect(google).toEqual([]);

    // L'heure venue, Google répond de nouveau : la carte est renvoyée, la relance effacée.
    await proprietaire.pool.query("UPDATE wallet_relance SET prochain_essai = now() - interval '1 second' WHERE lieu_id = $1", [lieuId]);
    statutGoogle = 200;
    expect(await relancerCartes(app, serveur.log)).toBe(1);
    expect(google.map((g) => g.id)).toEqual([`3388000000012345678.abonne_${abonneId.replace(/-/g, "")}`]);
    expect(await relances()).toEqual([]);

    // Douzième essai : abandon (journalisé), plus de renvoi.
    await proprietaire.pool.query("INSERT INTO wallet_relance (lieu_id, cible, essais, prochain_essai, cause) VALUES ($1, $2, 12, now() - interval '1 second', 'google 503')", [lieuId, abonneId]);
    google.length = 0;
    expect(await relancerCartes(app, serveur.log)).toBe(1);
    expect(google).toEqual([]);
    expect(await relances()).toEqual([]);
    definirMiseAJourGoogle(async (ressource, id, contenu) => {
      google.push({ ressource, id, contenu });
      return 200;
    });
  });

  it("une panne du modèle de carte Google est aussi relancée", async () => {
    const { rows } = await proprietaire.pool.query<{ lieu_id: string }>("SELECT lieu_id FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const lieuId = rows[0]!.lieu_id;
    definirMiseAJourGoogle(async (ressource, id, contenu) => {
      google.push({ ressource, id, contenu });
      return ressource === "loyaltyClass" ? 0 : 200;
    });
    const { design } = (await appel<EtatWallet>("GET", "/api/wallet")).corps;
    await appel("PUT", "/api/wallet/design", { couleur: "#c8102e", design: { ...design, titre: "Carte Relance" } });
    await travauxTermines();
    const { rows: relances } = await proprietaire.pool.query("SELECT cible, cause FROM wallet_relance WHERE lieu_id = $1", [lieuId]);
    expect(relances).toEqual([{ cible: "classe", cause: "google 0" }]);
    definirMiseAJourGoogle(async (ressource, id, contenu) => {
      google.push({ ressource, id, contenu });
      return 200;
    });
    await proprietaire.pool.query("UPDATE wallet_relance SET prochain_essai = now() - interval '1 second' WHERE lieu_id = $1", [lieuId]);
    google.length = 0;
    await relancerCartes(app, serveur.log);
    expect(google.filter((g) => g.ressource === "loyaltyClass")).toHaveLength(1);
    expect(google.find((g) => g.ressource === "loyaltyClass")!.contenu).toMatchObject({ programName: "Carte Relance" });
    expect((await proprietaire.pool.query("SELECT 1 FROM wallet_relance WHERE lieu_id = $1", [lieuId])).rows).toEqual([]);
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

  it("option Fidélité retirée par FlaiX Expert : cartes barrées et inactives, page fermée ; rendue : cartes valables (audit Codex P1)", async () => {
    const { rows } = await proprietaire.pool.query<{ lieu_id: string }>("SELECT lieu_id FROM abonne_fidelite WHERE id = $1", [abonneId]);
    const lieuId = rows[0]!.lieu_id;
    const email = `editeur-wallet-${Date.now()}@flaixexpert.test`;
    const { rows: u } = await proprietaire.pool.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, 'Rémi', $2) RETURNING id", [email, await hacherMotDePasse(MOT_DE_PASSE_TEST)]);
    await proprietaire.pool.query("INSERT INTO compte_editeur (utilisateur_id) VALUES ($1)", [u[0]!.id]);
    const r = await serveur.inject({ method: "POST", url: "/api/editeur/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
    const editeur = `fx_editeur=${r.cookies.find((k) => k.name === "fx_editeur")!.value}`;
    const option = (active: boolean) => serveur.inject({ method: "PUT", url: `/api/editeur/lieux/${lieuId}/options`, headers: { ...EN_TETES, cookie: editeur }, payload: { option: "fidelite", active } });
    const objet = `3388000000012345678.abonne_${abonneId.replace(/-/g, "")}`;
    const passe = async () => JSON.parse(dezip((await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`)).rawPayload)["pass.json"]!.toString("utf8"));

    google.length = 0;
    expect((await option(false)).statusCode).toBe(200);
    await travauxTermines();
    expect(google.filter((g) => g.id === objet).at(-1)!.contenu).toMatchObject({ state: "INACTIVE" });
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(404);
    expect(await passe()).toMatchObject({ voided: true });

    google.length = 0;
    expect((await option(true)).statusCode).toBe(200);
    await travauxTermines();
    expect(google.filter((g) => g.id === objet).at(-1)!.contenu).toMatchObject({ state: "ACTIVE" });
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(200);
    expect(await passe()).not.toHaveProperty("voided");
  });

  it("abonné désactivé : page de la carte fermée ; téléphone prévenu, carte Apple barrée, carte Google inactive (audit P2-2)", async () => {
    const avant = new Date(Date.now() - 1000).toISOString();
    expect((await telephone("POST", `/api/passkit/v1/devices/iphone-9/registrations/${PASS_TYPE}/${abonneId}`, { pushToken: "jeton-push-9" })).statusCode).toBe(201);
    notifies.length = 0;
    google.length = 0;
    await appel("PATCH", `/api/fidelite/abonnes/${abonneId}`, { actif: false });
    await travauxTermines();
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(404);
    expect(notifies).toContain("jeton-push-9");
    expect(google.find((g) => g.ressource === "loyaltyObject")!.contenu).toMatchObject({ state: "INACTIVE" });
    const liste = await telephone("GET", `/api/passkit/v1/devices/iphone-9/registrations/${PASS_TYPE}?passesUpdatedSince=${encodeURIComponent(avant)}`);
    expect(liste.json()).toMatchObject({ serialNumbers: [abonneId] });
    const carte = await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`);
    expect(carte.statusCode).toBe(200);
    expect(JSON.parse(dezip(carte.rawPayload)["pass.json"]!.toString("utf8"))).toMatchObject({ voided: true });

    // §15.147 : ni lien créé ni lien envoyé pour un abonné désactivé (audit complémentaire du 2026-10-05).
    const refus = await appel<{ erreur: string }>("POST", `/api/fidelite/abonnes/${abonneId}/carte`);
    expect(refus.statut).toBe(409);
    expect(refus.corps.erreur).toContain("désactivé");
    expect((await appel("POST", `/api/fidelite/abonnes/${abonneId}/carte/email`)).statut).toBe(409);
    expect((await publique(`/api/carte/${jeton}`)).statusCode).toBe(404);

    // Réactivé : la carte redevient valable.
    await appel("PATCH", `/api/fidelite/abonnes/${abonneId}`, { actif: true });
    await travauxTermines();
    expect(JSON.parse(dezip((await telephone("GET", `/api/passkit/v1/passes/${PASS_TYPE}/${abonneId}`)).rawPayload)["pass.json"]!.toString("utf8"))).not.toHaveProperty("voided");
  });
});
