import { randomBytes, randomInt } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Base } from "../base.ts";
import { config } from "../config.ts";
import { NOM_COOKIE_APPAREIL } from "./contexte.ts";
import { empreinteJeton } from "./secrets.ts";

/**
 * Tablettes enregistrées comme caisse (dossier §15.100). Le jeton vit dans un cookie protégé
 * (httpOnly) : la page ne peut pas le lire, un script injecté non plus. La base n'en garde que
 * l'empreinte SHA-256.
 */
export interface AppareilConnu {
  id: string;
  lieuId: string;
  caisseId: string;
}

/** Durée maximale acceptée par les navigateurs pour un cookie (400 jours) : au-delà, réenregistrer la tablette. */
const DUREE_COOKIE_APPAREIL_S = 400 * 24 * 3600;

/** Tablette enregistrée d'où vient la requête, ou null (aucun cookie, jeton inconnu ou tablette retirée). */
export async function lireAppareil(base: Base, req: FastifyRequest): Promise<AppareilConnu | null> {
  const jeton = req.cookies[NOM_COOKIE_APPAREIL];
  if (!jeton || jeton.length > 200) return null;
  return base.transaction({}, async (c) => {
    const { rows } = await c.query<{ id: string; lieu_id: string; caisse_id: string }>("SELECT * FROM appareil_pour_connexion($1)", [empreinteJeton(jeton)]);
    const r = rows[0];
    return r ? { id: r.id, lieuId: r.lieu_id, caisseId: r.caisse_id } : null;
  });
}

export function nouveauJetonAppareil(): { jeton: string; empreinte: string } {
  const jeton = randomBytes(32).toString("base64url");
  return { jeton, empreinte: empreinteJeton(jeton) };
}

export function poserCookieAppareil(rep: FastifyReply, jeton: string): void {
  rep.setCookie(NOM_COOKIE_APPAREIL, jeton, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: config.cookieSecurise,
    maxAge: DUREE_COOKIE_APPAREIL_S,
  });
}

/** Code personnel de caissière : 4 chiffres tirés au hasard, remis une seule fois au directeur. */
export function genererCodeCaissiere(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

/** Essais de code : au 5e code erroné, la fiche est bloquée 15 minutes (ou jusqu'à un nouveau code). */
export const ESSAIS_CODE_MAX = 5;
export const BLOCAGE_CODE_MINUTES = 15;
