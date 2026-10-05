import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { Authentification } from "../auth/contexte.ts";
import type { Contexte } from "../base.ts";

export const Uuid = z.string().uuid("Identifiant invalide.");
export const ParamId = z.object({ id: Uuid });

/** Texte obligatoire, espaces superflus retirés. */
export const texte = (max: number, libelle: string) =>
  z.string().trim().min(1, `${libelle} est obligatoire.`).max(max, `${libelle} : ${max} caractères au maximum.`);

/** Texte facultatif : une chaîne vide devient null. */
export const texteFacultatif = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export function contexte(auth: Authentification): Contexte {
  return { lieuId: auth.lieuId, utilisateurId: auth.utilisateurId, lectureSeule: auth.role === "support" };
}

/** Liste des champs réellement modifiés, avec valeur avant/après — c'est ce qui part au journal technique. */
export function differences<T extends Record<string, unknown>>(avant: T, demande: Partial<T>): Record<string, { avant: unknown; apres: unknown }> {
  const diff: Record<string, { avant: unknown; apres: unknown }> = {};
  for (const [cle, apres] of Object.entries(demande)) {
    if (apres === undefined) continue;
    const valeurAvant = avant[cle];
    if (JSON.stringify(valeurAvant) !== JSON.stringify(apres)) diff[cle] = { avant: valeurAvant ?? null, apres };
  }
  return diff;
}

export function corps<S extends z.ZodType>(schema: S, req: FastifyRequest): z.infer<S> {
  return schema.parse(req.body ?? {});
}
