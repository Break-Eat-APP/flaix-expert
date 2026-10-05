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

describe("carte Apple (.pkpass)", () => {
  it("contient pass.json, les images, un manifeste exact et une signature PKCS #7 qui porte le certificat de la carte et l'intermédiaire", () => {
    const carte = certificat("Pass Type ID: pass.com.flaixlabs.abonne");
    const wwdr = certificat("Apple WWDR (test)");
    const r: ReglageApple = { teamId: "ABCDE12345", passTypeId: "pass.com.flaixlabs.abonne", cle: carte.cle, certificat: carte.c, wwdr: wwdr.c, clePem: "", certificatPem: "" };
    const fichiers = dezip(pkpass({ formatVersion: 1, serialNumber: "x" }, "#c8102e", r));
    expect(Object.keys(fichiers).sort()).toEqual(["icon.png", "icon@2x.png", "logo.png", "logo@2x.png", "manifest.json", "pass.json", "signature"]);
    const manifeste = JSON.parse(fichiers["manifest.json"]!.toString("utf8")) as Record<string, string>;
    for (const [nom, empreinte] of Object.entries(manifeste)) expect(createHash("sha1").update(fichiers[nom]!).digest("hex")).toBe(empreinte);
    const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(fichiers.signature!.toString("binary"))) as forge.pkcs7.PkcsSignedData;
    expect(p7.certificates.map((c) => c.subject.getField("CN").value)).toEqual(["Pass Type ID: pass.com.flaixlabs.abonne", "Apple WWDR (test)"]);
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
