/**
 * Carte wallet (dossier §15.147) — briques techniques : archive .pkpass (zip, manifeste, signature PKCS #7 avec
 * le certificat de la carte et l'intermédiaire d'Apple), image PNG, jeton Google signé. Certificats fabriqués
 * pour le test : aucun vrai certificat ni aucune vraie clé.
 */
import { createHash, createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import forge from "node-forge";
import { dezip, pngUni, zip } from "../src/wallet/fichiers.ts";
import { pkpass, type ReglageApple } from "../src/wallet/apple.ts";
import { jwt, lienGoogle } from "../src/wallet/google.ts";
import { controlerImages, taillePng } from "../src/wallet/images.ts";

function certificat(nom: string, cleSignature?: forge.pki.rsa.PrivateKey) {
  const cles = forge.pki.rsa.generateKeyPair(1024);
  const c = forge.pki.createCertificate();
  c.publicKey = cles.publicKey;
  c.serialNumber = "01";
  c.validity.notBefore = new Date(Date.now() - 86_400_000);
  c.validity.notAfter = new Date(Date.now() + 86_400_000);
  c.setSubject([{ name: "commonName", value: nom }]);
  c.setIssuer([{ name: "commonName", value: nom }]);
  c.sign(cleSignature ?? cles.privateKey, forge.md.sha256.create());
  return { c, cle: cles.privateKey };
}

describe("archive zip et image", () => {
  it("le zip se relit à l'identique ; l'image est un PNG valide", () => {
    const fichiers = { "pass.json": Buffer.from('{"a":1}'), "icon.png": pngUni("#c8102e", 29, 29) };
    expect(dezip(zip(fichiers))).toEqual(fichiers);
    expect(fichiers["icon.png"].subarray(1, 4).toString("ascii")).toBe("PNG");
  });
});

describe("images de la carte (§15.148)", () => {
  const b = (l: number, h: number) => pngUni("#123456", l, h).toString("base64");
  const banniere = { strip: b(375, 123), "strip@2x": b(750, 246), "strip@3x": b(1125, 369), "google-hero": b(1032, 336) };

  it("taille d'un PNG lue dans son en-tête ; autre chose qu'un PNG est refusé", () => {
    expect(taillePng(pngUni("#000000", 1125, 369))).toEqual({ largeur: 1125, hauteur: 369 });
    expect(taillePng(Buffer.from("ceci n'est pas une image, vraiment pas"))).toBeNull();
    expect(() => controlerImages("banniere", { ...banniere, strip: Buffer.from("<svg onload=alert(1)>").toString("base64") })).toThrow(/pas une image PNG/);
  });

  it("tous les formats exigés, chacun à la bonne taille ; rien d'autre", () => {
    expect(controlerImages("banniere", banniere).map((f) => f.variante)).toEqual(["strip", "strip@2x", "strip@3x", "google-hero"]);
    expect(() => controlerImages("banniere", { ...banniere, "strip@3x": b(1125, 370) })).toThrow(/Taille d'image inattendue/);
    const { "google-hero": _, ...incomplet } = banniere;
    expect(() => controlerImages("banniere", incomplet)).toThrow(/il manque/);
    expect(() => controlerImages("banniere", { ...banniere, "logo@3x": b(150, 150) })).toThrow(/inconnu/);
  });
});

describe("carte Apple (.pkpass)", () => {
  it("contient pass.json, les images, un manifeste exact et une signature PKCS #7 qui porte le certificat de la carte et l'intermédiaire", () => {
    const carte = certificat("Pass Type ID: pass.com.flaixlabs.abonne");
    const wwdr = certificat("Apple WWDR (test)");
    const r: ReglageApple = { teamId: "ABCDE12345", passTypeId: "pass.com.flaixlabs.abonne", cle: carte.cle, certificat: carte.c, wwdr: wwdr.c, clePem: "", certificatPem: "" };
    const fichiers = dezip(pkpass({ formatVersion: 1, serialNumber: "x" }, {}, "#c8102e", r));
    // Sans image déposée : icônes unies (Apple les exige), pas de logo.
    expect(Object.keys(fichiers).sort()).toEqual(["icon.png", "icon@2x.png", "icon@3x.png", "manifest.json", "pass.json", "signature"]);
    const manifeste = JSON.parse(fichiers["manifest.json"]!.toString("utf8")) as Record<string, string>;
    for (const [nom, empreinte] of Object.entries(manifeste)) expect(createHash("sha1").update(fichiers[nom]!).digest("hex")).toBe(empreinte);
    const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(fichiers.signature!.toString("binary"))) as forge.pkcs7.PkcsSignedData;
    expect(p7.certificates.map((c) => c.subject.getField("CN").value)).toEqual(["Pass Type ID: pass.com.flaixlabs.abonne", "Apple WWDR (test)"]);

    // Images du lieu (§15.148) : reprises telles quelles, et l'icône déposée remplace l'icône unie.
    const logo = pngUni("#ffffff", 150, 150);
    const avecImages = dezip(pkpass({ formatVersion: 1 }, { "logo@3x": logo, icon: pngUni("#000000", 29, 29), "strip@3x": pngUni("#123456", 1125, 369) }, "#c8102e", r));
    expect(Object.keys(avecImages).sort()).toEqual(["icon.png", "logo@3x.png", "manifest.json", "pass.json", "signature", "strip@3x.png"]);
    expect(avecImages["logo@3x.png"]).toEqual(logo);
  });
});

describe("carte Google (lien signé)", () => {
  it("le jeton est signé RS256 par la clé du compte de service et contient la classe et la carte", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const lien = lienGoogle({ id: "338.lieu_x" }, { id: "338.abonne_y" }, "https://flaixexpert.flaixlabs.com", { issuerId: "338", email: "flaix@projet.iam.gserviceaccount.com", cle: privateKey });
    expect(lien.startsWith("https://pay.google.com/gp/v/save/")).toBe(true);
    const [tete, corps, signature] = lien.slice("https://pay.google.com/gp/v/save/".length).split(".") as [string, string, string];
    expect(createVerify("RSA-SHA256").update(`${tete}.${corps}`).verify(publicKey, Buffer.from(signature, "base64url"))).toBe(true);
    const charge = JSON.parse(Buffer.from(corps, "base64url").toString("utf8"));
    expect(charge).toMatchObject({ iss: "flaix@projet.iam.gserviceaccount.com", aud: "google", typ: "savetowallet", payload: { loyaltyClasses: [{ id: "338.lieu_x" }], loyaltyObjects: [{ id: "338.abonne_y" }] } });
    expect(jwt({ a: 1 }, privateKey).split(".")).toHaveLength(3);
  });
});
