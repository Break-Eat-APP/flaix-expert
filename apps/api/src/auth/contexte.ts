import type { FastifyRequest } from "fastify";
import type { Role } from "@flaix/domain";
import type { Base } from "../base.ts";
import { interdit, nonAutorise } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";

export interface Authentification {
  utilisateurId: string;
  nom: string;
  /** Absent pour une caissière (connexion par code, dossier §15.100). */
  email: string | null;
  lieuId: string;
  role: Role;
  jetonEmpreinte: string;
  /** Caissière : tablette enregistrée où elle s'est connectée, et la caisse de cette tablette. */
  appareilId: string | null;
  appareilCaisseId: string | null;
  /** Session dans le lieu de formation jumeau (dossier §15.109). */
  formation: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    auth: Authentification | null;
  }
}

export const NOM_COOKIE = "fx_session";
/** Jeton d'une tablette enregistrée comme caisse (§15.100) : cookie protégé, illisible par la page. */
export const NOM_COOKIE_APPAREIL = "fx_appareil";

export function exigerSession(req: FastifyRequest): Authentification {
  if (!req.auth) throw nonAutorise();
  return req.auth;
}

async function refuser(req: FastifyRequest, base: Base, auth: Authentification): Promise<never> {
  await base.transaction({ lieuId: auth.lieuId, utilisateurId: auth.utilisateurId }, (c) =>
    inscrireJet(c, {
      lieuId: auth.lieuId,
      type: "acces_refuse",
      utilisateurId: auth.utilisateurId,
      details: { role: auth.role, methode: req.method, route: req.routeOptions.url ?? req.url },
    }),
  );
  throw interdit();
}

/**
 * Écran de caisse : le directeur, ou une caissière connectée sur la tablette enregistrée
 * comme CETTE caisse (§15.100). Un refus est inscrit au journal technique.
 */
export async function exigerAccesCaisse(req: FastifyRequest, base: Base, caisseId: string): Promise<Authentification> {
  const auth = exigerSession(req);
  if (auth.role === "directeur") return auth;
  if (auth.role === "operateur" && auth.appareilCaisseId === caisseId) return auth;
  return refuser(req, base, auth);
}

/**
 * Réservé au directeur du lieu. Un refus est inscrit au journal technique
 * (test de conformité B2 : la tentative d'accès est tracée, pas seulement bloquée).
 */
export async function exigerDirecteur(req: FastifyRequest, base: Base): Promise<Authentification> {
  const auth = exigerSession(req);
  if (auth.role !== "directeur") return refuser(req, base, auth);
  return auth;
}
