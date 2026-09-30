import { calculerEmpreinte, jsonCanonique, type ChampScelle } from "./chaine.ts";

/**
 * Clôtures de période (dossier §15.4, §15.27, §15.107) : Z du match, mois, exercice.
 *
 *   grand total de la période = Σ des totaux TTC nets de ce qu'elle contient
 *   total perpétuel après     = total perpétuel avant + grand total de la période   (jamais remis à zéro)
 *
 * Les périodes se comptent à l'heure de Paris, selon la date du match.
 */

export type NiveauCloture = "match" | "mois" | "exercice";

const formatJour = new Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" });
const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** « 2026-09-30 » : le jour à Paris d'un instant. */
export function jourParis(instant: string | Date): string {
  return formatJour.format(typeof instant === "string" ? new Date(instant) : instant);
}

/** « 2026-09 » : le mois à Paris d'un instant. */
export function moisParis(instant: string | Date): string {
  return jourParis(instant).slice(0, 7);
}

const decaler = (mois: string, n: number): string => {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};

export function bornesMois(mois: string): { debut: string; fin: string } {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  const dernier = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { debut: `${mois}-01`, fin: `${mois}-${String(dernier).padStart(2, "0")}` };
}

export function libelleMois(mois: string): string {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  return `${NOMS_MOIS[m - 1]} ${a}`;
}

/** Un mois est terminé quand, à Paris, on est dans un mois suivant. */
export function moisTermine(mois: string, maintenant: Date = new Date()): boolean {
  return moisParis(maintenant) > mois;
}

/** L'exercice qui contient un mois, selon le premier mois de l'exercice du lieu (1 = janvier). */
export function exerciceDe(mois: string, moisDebut: number): { debut: string; fin: string; premierMois: string; dernierMois: string; libelle: string } {
  const [a, m] = mois.split("-").map(Number) as [number, number];
  const annee = m >= moisDebut ? a : a - 1;
  const premierMois = `${annee}-${String(moisDebut).padStart(2, "0")}`;
  const dernierMois = decaler(premierMois, 11);
  return {
    debut: `${premierMois}-01`,
    fin: bornesMois(dernierMois).fin,
    premierMois,
    dernierMois,
    libelle: moisDebut === 1 ? `Exercice ${annee}` : `Exercice ${annee}-${annee + 1}`,
  };
}

/** Les mois d'un exercice, dans l'ordre. */
export function moisDeLExercice(premierMois: string): string[] {
  return Array.from({ length: 12 }, (_, i) => decaler(premierMois, i));
}

export interface ClotureAScellier {
  sequence: number;
  niveau: NiveauCloture;
  lieuId: string;
  evenementId: string | null;
  debut: string;
  fin: string;
  totalTtc: number;
  perpetuelAvant: number;
  perpetuelApres: number;
  /** Tickets, annulations, espèces, carte, TVA par taux, totaux et perpétuels par caisse. */
  details: Record<string, unknown>;
  horodatage: Date;
}

/** Ordre des champs scellés d'une clôture — ne jamais le changer sans version majeure (§15.5). */
export function champsScellesCloture(c: ClotureAScellier): ChampScelle[] {
  return [c.sequence, c.niveau, c.lieuId, c.evenementId, c.debut, c.fin, c.totalTtc, c.perpetuelAvant, c.perpetuelApres, jsonCanonique(c.details), c.horodatage.toISOString()];
}

export function empreinteCloture(c: ClotureAScellier, empreintePrecedente: string): string {
  return calculerEmpreinte(champsScellesCloture(c), empreintePrecedente);
}
