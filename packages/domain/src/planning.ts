/**
 * Planning et masse salariale (module 14, dossier §14 et §15.104).
 *
 *   durée          = fin − début, en heures d'horloge ; une fin avant le début = après minuit
 *   coût prévu     = durée prévue × taux horaire de l'affectation
 *   coût réel      = durée réelle × taux horaire   ← c'est lui qui compte
 *   masse salariale(match) = Σ coûts réels des affectations du match
 */

export const ROLES_EQUIPE = ["Caissier", "Préparation / cuisine", "Responsable de stand", "Renfort ponctuel"] as const;
export type RoleEquipe = (typeof ROLES_EQUIPE)[number];

const HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** « 18:30 » → minutes depuis minuit ; null si l'heure est illisible. */
export function minutesHeure(h: string): number | null {
  const m = HEURE.exec(h);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Durée en minutes entre deux heures d'horloge ; une fin avant le début passe minuit. */
export function dureeMinutes(debut: string, fin: string): number {
  const d = minutesHeure(debut), f = minutesHeure(fin);
  if (d === null || f === null) return 0;
  return f >= d ? f - d : f + 1440 - d;
}

/** Coût en centimes d'une plage horaire à un taux horaire (centimes) ; null si le taux manque. */
export function coutPlage(debut: string, fin: string, tauxHoraire: number | null): number | null {
  return tauxHoraire === null ? null : Math.round((dureeMinutes(debut, fin) * tauxHoraire) / 60);
}

/** 375 minutes → « 6 h 15 ». */
export function formaterDuree(minutes: number): string {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
