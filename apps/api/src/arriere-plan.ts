import type { FastifyBaseLogger } from "fastify";

/*
 * Travaux lancés après un enregistrement (notifications aux téléphones, cartes wallet chez Apple et Google) : la
 * réponse ne les attend jamais — un service extérieur lent ne retarde ni la caisse ni l'écran (audit du 2026-10-05,
 * P2-1). Un échec est journalisé et ne remet rien en cause. Les tests attendent leur fin avec `travauxTermines`.
 */

const enCours = new Set<Promise<void>>();

export function enArrierePlan(log: FastifyBaseLogger, quoi: string, travail: () => Promise<unknown>): void {
  const p: Promise<void> = Promise.resolve()
    .then(travail)
    .then(
      () => undefined,
      (erreur: unknown) => log.error({ err: erreur }, quoi),
    )
    .finally(() => enCours.delete(p));
  enCours.add(p);
}

/** Fin de tous les travaux en cours, y compris ceux qu'ils ont lancés. */
export async function travauxTermines(): Promise<void> {
  while (enCours.size > 0) await Promise.all([...enCours]);
}
