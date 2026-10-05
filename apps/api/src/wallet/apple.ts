import { X509Certificate, createHash, createPrivateKey, type KeyObject } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { connect } from "node:http2";
import { config } from "../config.ts";
import { signerDetache } from "./cms.ts";
import { pngUni, zip } from "./fichiers.ts";

/*
 * Apple Wallet (dossier §15.147). Le .pkpass est une archive : pass.json, images, manifest.json (empreinte SHA-1
 * de chaque fichier) et signature (PKCS #7 détachée du manifeste, par le certificat « Pass Type ID » de
 * Break Eat App et le certificat intermédiaire d'Apple). La clé privée est fabriquée sur le serveur par
 * `flaix-admin wallet-apple-demande` et n'en sort jamais.
 */

export interface ReglageApple {
  teamId: string;
  passTypeId: string;
  cle: KeyObject;
  /** Certificat de la carte et intermédiaire d'Apple, en DER. */
  certificat: Buffer;
  wwdr: Buffer;
  /** Clé et certificat en PEM, pour la connexion au service de notification d'Apple. */
  clePem: string;
  certificatPem: string;
}

let reglage: ReglageApple | null | undefined;

/** Le réglage Apple du serveur, ou null tant que les fichiers ne sont pas installés. */
export function reglageApple(): ReglageApple | null {
  if (reglage !== undefined) return reglage;
  const d = config.walletDossier;
  const fichiers = [`${d}/apple-pass.key`, `${d}/apple-pass.pem`, `${d}/apple-wwdr.pem`];
  if (!config.walletAppleTeamId || !config.walletApplePassTypeId || !fichiers.every((f) => existsSync(f))) return (reglage = null);
  const [clePem, certificatPem, wwdrPem] = fichiers.map((f) => readFileSync(f, "utf8")) as [string, string, string];
  reglage = {
    teamId: config.walletAppleTeamId,
    passTypeId: config.walletApplePassTypeId,
    cle: createPrivateKey(clePem),
    certificat: new X509Certificate(certificatPem).raw,
    wwdr: new X509Certificate(wwdrPem).raw,
    clePem,
    certificatPem,
  };
  return reglage;
}

/** Tests : imposer un réglage (null : relire les fichiers du serveur). */
export function definirReglageApple(r: ReglageApple | null): void {
  reglage = r ?? undefined;
}

/** Signature PKCS #7 détachée (DER) du manifeste, par le certificat de la carte, avec l'intermédiaire d'Apple. */
const signer = (manifeste: Buffer, r: ReglageApple): Buffer => signerDetache(manifeste, r.cle, r.certificat, [r.wwdr]);

/**
 * Le fichier .pkpass d'une carte : pass.json, images (logo, icône, bande du lieu, §15.148 ; nom sans « .png »),
 * manifeste, signature. Sans icône déposée, une icône unie à la couleur du lieu (Apple l'exige).
 */
export function pkpass(pass: Record<string, unknown>, images: Record<string, Buffer>, couleur: string, r: ReglageApple): Buffer {
  const icones = images.icon ? {} : { icon: pngUni(couleur, 29, 29), "icon@2x": pngUni(couleur, 58, 58), "icon@3x": pngUni(couleur, 87, 87) };
  const fichiers: Record<string, Buffer> = {
    "pass.json": Buffer.from(JSON.stringify(pass), "utf8"),
    ...Object.fromEntries(Object.entries({ ...icones, ...images }).map(([nom, contenu]) => [`${nom}.png`, contenu])),
  };
  const manifeste = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(fichiers).map(([n, c]) => [n, createHash("sha1").update(c).digest("hex")]))), "utf8");
  return zip({ ...fichiers, "manifest.json": manifeste, signature: signer(manifeste, r) });
}

/** Notification « la carte a changé » à un téléphone (service de notification d'Apple). Remplaçable dans les tests. */
export type NotifieurApple = (pushToken: string, r: ReglageApple) => Promise<number>;

const notifieurReel: NotifieurApple = (pushToken, r) =>
  new Promise((resolve) => {
    const session = connect("https://api.push.apple.com", { key: r.clePem, cert: r.certificatPem });
    session.on("error", () => resolve(0));
    const requete = session.request({ ":method": "POST", ":path": `/3/device/${pushToken}`, "apns-topic": r.passTypeId, "content-type": "application/json" });
    requete.setTimeout(10_000, () => {
      requete.close();
      resolve(0);
    });
    requete.on("response", (h) => resolve(Number(h[":status"] ?? 0)));
    requete.on("error", () => resolve(0));
    requete.on("close", () => session.close());
    requete.end("{}");
  });
let notifieur: NotifieurApple = notifieurReel;
export function definirNotifieurApple(f: NotifieurApple | null): void {
  notifieur = f ?? notifieurReel;
}
export const notifierApple = (pushToken: string, r: ReglageApple) => notifieur(pushToken, r);
