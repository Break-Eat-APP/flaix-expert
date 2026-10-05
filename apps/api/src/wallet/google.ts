import { createPrivateKey, createSign, type KeyObject } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { config } from "../config.ts";

/*
 * Google Wallet (dossier §15.147) : carte de fidélité émise par le compte émetteur de Break Eat App. Le lien
 * « Ajouter à Google Wallet » est un jeton signé (RS256) par la clé du compte de service, installée par
 * `flaix-admin wallet-google` ; la mise à jour du solde passe par l'API Google Wallet.
 */

export interface ReglageGoogle {
  issuerId: string;
  email: string;
  cle: KeyObject;
}

let reglage: ReglageGoogle | null | undefined;

export function reglageGoogle(): ReglageGoogle | null {
  if (reglage !== undefined) return reglage;
  const fichier = `${config.walletDossier}/google.json`;
  if (!config.walletGoogleIssuerId || !existsSync(fichier)) return (reglage = null);
  const compte = JSON.parse(readFileSync(fichier, "utf8")) as { client_email?: string; private_key?: string };
  if (!compte.client_email || !compte.private_key) return (reglage = null);
  reglage = { issuerId: config.walletGoogleIssuerId, email: compte.client_email, cle: createPrivateKey(compte.private_key) };
  return reglage;
}

export function definirReglageGoogle(r: ReglageGoogle | null): void {
  reglage = r ?? undefined;
}

const base64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function jwt(charge: Record<string, unknown>, cle: KeyObject): string {
  const tete = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = base64url(JSON.stringify(charge));
  const signature = createSign("RSA-SHA256").update(`${tete}.${corps}`).sign(cle);
  return `${tete}.${corps}.${base64url(signature)}`;
}

/** Lien « Ajouter à Google Wallet » : la classe et la carte sont créées chez Google à l'enregistrement. */
export function lienGoogle(classe: Record<string, unknown>, objet: Record<string, unknown>, origine: string, r: ReglageGoogle): string {
  const charge = { iss: r.email, aud: "google", typ: "savetowallet", iat: Math.floor(Date.now() / 1000), origins: [origine], payload: { loyaltyClasses: [classe], loyaltyObjects: [objet] } };
  return `https://pay.google.com/gp/v/save/${jwt(charge, r.cle)}`;
}

/**
 * Remplacement d'une classe (modèle de carte du lieu) ou d'une carte d'abonné chez Google (réponse HTTP ; 404 :
 * pas encore créée chez Google, aucun abonné ne l'a ajoutée). Remplaçable dans les tests.
 */
export type RessourceGoogle = "loyaltyClass" | "loyaltyObject";
export type MiseAJourGoogle = (ressource: RessourceGoogle, id: string, contenu: Record<string, unknown>, r: ReglageGoogle) => Promise<number>;

let jetonAcces: { valeur: string; expire: number } | null = null;
async function acces(r: ReglageGoogle): Promise<string | null> {
  if (jetonAcces && jetonAcces.expire > Date.now() + 60_000) return jetonAcces.valeur;
  const maintenant = Math.floor(Date.now() / 1000);
  const assertion = jwt({ iss: r.email, scope: "https://www.googleapis.com/auth/wallet_object.issuer", aud: "https://oauth2.googleapis.com/token", iat: maintenant, exp: maintenant + 3600 }, r.cle);
  const rep = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!rep?.ok) return null;
  const j = (await rep.json()) as { access_token: string; expires_in: number };
  jetonAcces = { valeur: j.access_token, expire: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

const miseAJourReelle: MiseAJourGoogle = async (ressource, id, contenu, r) => {
  const jeton = await acces(r);
  if (!jeton) return 0;
  const rep = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/${ressource}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${jeton}`, "content-type": "application/json" },
    body: JSON.stringify(contenu),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  return rep?.status ?? 0;
};
let miseAJour: MiseAJourGoogle = miseAJourReelle;
export function definirMiseAJourGoogle(f: MiseAJourGoogle | null): void {
  miseAJour = f ?? miseAJourReelle;
}
export const mettreAJourGoogle = (ressource: RessourceGoogle, id: string, contenu: Record<string, unknown>, r: ReglageGoogle) => miseAJour(ressource, id, contenu, r);
