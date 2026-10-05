import { createHash, sign, type KeyObject } from "node:crypto";

/*
 * Signature de la carte Apple (dossier §15.147) sans bibliothèque extérieure (audit Codex du 2026-10-05 : node-forge
 * retiré du serveur). Apple demande une signature PKCS #7 / CMS « détachée » du manifeste : SignedData qui porte le
 * certificat de la carte et l'intermédiaire d'Apple (WWDR), et les attributs signés usuels (type de contenu, date de
 * signature, empreinte SHA-256 du manifeste), comme `openssl smime -sign -binary -outform DER`. Le codage DER est fait
 * ici, la signature RSA par node:crypto. Vérifiée dans les tests et par `openssl smime -verify`.
 */

const OID = {
  donnees: "1.2.840.113549.1.7.1",
  donneesSignees: "1.2.840.113549.1.7.2",
  typeDeContenu: "1.2.840.113549.1.9.3",
  empreinte: "1.2.840.113549.1.9.4",
  dateDeSignature: "1.2.840.113549.1.9.5",
  sha256: "2.16.840.1.101.3.4.2.1",
  rsa: "1.2.840.113549.1.1.1",
} as const;

function longueur(n: number): Buffer {
  if (n < 0x80) return Buffer.from([n]);
  const octets: number[] = [];
  for (let v = n; v > 0; v = Math.floor(v / 256)) octets.unshift(v % 256);
  return Buffer.from([0x80 | octets.length, ...octets]);
}

const tlv = (etiquette: number, contenu: Buffer) => Buffer.concat([Buffer.from([etiquette]), longueur(contenu.length), contenu]);
const sequence = (...elements: Buffer[]) => tlv(0x30, Buffer.concat(elements));
/** SET OF en DER : éléments rangés par ordre de leur codage. */
const ensembleDe = (...elements: Buffer[]) => tlv(0x31, Buffer.concat([...elements].sort(Buffer.compare)));
const entier = (n: number) => tlv(0x02, Buffer.from([n]));
const chaineOctets = (b: Buffer) => tlv(0x04, b);
const NUL = Buffer.from([0x05, 0x00]);

function oid(texte: string): Buffer {
  const p = texte.split(".").map(Number);
  const octets = [40 * p[0]! + p[1]!];
  for (const n of p.slice(2)) {
    const groupe = [n & 0x7f];
    for (let v = Math.floor(n / 128); v > 0; v = Math.floor(v / 128)) groupe.unshift((v & 0x7f) | 0x80);
    octets.push(...groupe);
  }
  return tlv(0x06, Buffer.from(octets));
}

/** Date en UTCTime (AAMMJJHHMMSSZ), comme OpenSSL pour les dates avant 2050. */
function dateUtc(d: Date): Buffer {
  const deux = (n: number) => String(n).padStart(2, "0");
  const texte = `${deux(d.getUTCFullYear() % 100)}${deux(d.getUTCMonth() + 1)}${deux(d.getUTCDate())}${deux(d.getUTCHours())}${deux(d.getUTCMinutes())}${deux(d.getUTCSeconds())}Z`;
  return tlv(0x17, Buffer.from(texte, "ascii"));
}

/** Un élément DER à la position `i` : début de l'étiquette, début et fin du contenu. */
function element(b: Buffer, i: number): { etiquette: number; tete: number; debut: number; fin: number } {
  const etiquette = b[i]!;
  let l = b[i + 1]!;
  let debut = i + 2;
  if (l & 0x80) {
    const n = l & 0x7f;
    l = 0;
    for (let k = 0; k < n; k++) l = l * 256 + b[i + 2 + k]!;
    debut = i + 2 + n;
  }
  return { etiquette, tete: i, debut, fin: debut + l };
}

/** Émetteur (Name) et numéro de série d'un certificat X.509, tels quels en DER. */
export function emetteurEtNumero(certificat: Buffer): { emetteur: Buffer; numero: Buffer } {
  const cert = element(certificat, 0);
  const tbs = element(certificat, cert.debut);
  let champ = element(certificat, tbs.debut);
  if (champ.etiquette === 0xa0) champ = element(certificat, champ.fin); // version, facultative
  const numero = champ;
  const algorithme = element(certificat, numero.fin);
  const emetteur = element(certificat, algorithme.fin);
  if (numero.etiquette !== 0x02 || emetteur.etiquette !== 0x30) throw new Error("Certificat illisible.");
  return { emetteur: certificat.subarray(emetteur.tete, emetteur.fin), numero: certificat.subarray(numero.tete, numero.fin) };
}

/**
 * Signature CMS détachée (DER) de `contenu` par la clé et le certificat donnés ; `chaine` : certificats joints après
 * celui du signataire (l'intermédiaire d'Apple).
 */
export function signerDetache(contenu: Buffer, cle: KeyObject, certificat: Buffer, chaine: Buffer[], le = new Date()): Buffer {
  const sha256 = sequence(oid(OID.sha256), NUL);
  const attribut = (type: string, valeur: Buffer) => sequence(oid(type), ensembleDe(valeur));
  const attributs = [
    attribut(OID.typeDeContenu, oid(OID.donnees)),
    attribut(OID.dateDeSignature, dateUtc(le)),
    attribut(OID.empreinte, chaineOctets(createHash("sha256").update(contenu).digest())),
  ];
  // La signature porte sur les attributs codés en SET ; dans SignerInfo, le même contenu est étiqueté [0].
  const ensembleAttributs = ensembleDe(...attributs);
  const signature = sign("sha256", ensembleAttributs, cle);
  const { emetteur, numero } = emetteurEtNumero(certificat);
  const signataire = sequence(
    entier(1),
    sequence(emetteur, numero),
    sha256,
    Buffer.concat([Buffer.from([0xa0]), ensembleAttributs.subarray(1)]),
    sequence(oid(OID.rsa), NUL),
    chaineOctets(signature),
  );
  const donneesSignees = sequence(
    entier(1),
    ensembleDe(sha256),
    sequence(oid(OID.donnees)),
    tlv(0xa0, Buffer.concat([certificat, ...chaine])),
    ensembleDe(signataire),
  );
  return sequence(oid(OID.donneesSignees), tlv(0xa0, donneesSignees));
}
