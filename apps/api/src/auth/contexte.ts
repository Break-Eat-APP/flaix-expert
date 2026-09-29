import type { FastifyRequest } from "fastify";
import type { Role } from "@flaix/domain";
import type { Base } from "../base.ts";
import { interdit, nonAutorise } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";

export interface Authentification {
  utilisateurId: string;
  nom: string;
  email: string;
  lieuId: string;
  role: Role;
  jetonEmpreinte: string;
}

declare module "fastify" {
  interface FastifyRequest {
    auth: Authentification | null;
  }
}

export const NOM_COOKIE = "fx_session";

export function exigerSession(req: FastifyRequest): Authentification {
  if (!req.auth) throw nonAutorise();
  return req.auth;
}

/**
 * Réservé au directeur du lieu. Un refus est inscrit au journal technique
 * (test de conformité B2 : la tentative d'accès est tracée, pas seulement bloquée).
 */
export async function exigerDirecteur(req: FastifyRequest, base: Base): Promise<Authentification> {
  const auth = exigerSession(req);
  if (auth.role !== "directeur") {
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
  return auth;
}
