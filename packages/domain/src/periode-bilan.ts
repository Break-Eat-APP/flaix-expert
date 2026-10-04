/**
 * Bilan sur une période choisie « du … au … » (demande de Rémi du 2026-10-04, dossier §15.133).
 *
 * Une période regroupe les événements dont la date de début (jour de Paris) tombe entre le premier
 * et le dernier jour, inclus — la même règle que les clôtures mensuelles (§15.107). Elle se compare
 * à la période précédente de même durée, qui se termine la veille de son premier jour.
 */
import { jourParis } from "./cloture-periode.ts";

export interface Periode {
  /** Premier jour, « AAAA-MM-JJ » (inclus). */
  du: string;
  /** Dernier jour, « AAAA-MM-JJ » (inclus). */
  au: string;
}

const JOUR_MS = 86_400_000;
const enJour = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const versIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const estJour = (texte: string) => /^\d{4}-\d{2}-\d{2}$/.test(texte) && versIso(enJour(texte)) === texte;

/** Nombre de jours de la période, bornes comprises. */
export function joursPeriode(p: Periode): number {
  return Math.round((enJour(p.au) - enJour(p.du)) / JOUR_MS) + 1;
}

/** La période de même durée qui se termine la veille. */
export function periodePrecedente(p: Periode): Periode {
  const au = enJour(p.du) - JOUR_MS;
  return { du: versIso(au - (joursPeriode(p) - 1) * JOUR_MS), au: versIso(au) };
}

/** L'événement (sa date de début, heure de Paris) tombe-t-il dans la période ? */
export function dansPeriode(debut: string | Date, p: Periode): boolean {
  const j = jourParis(debut);
  return j >= p.du && j <= p.au;
}

const jourMois = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
const jourMoisAn = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const premier = (texte: string) => texte.replace(/^1 /, "1er ");

/** « du 1er au 30 septembre 2026 », « du 15 août au 3 octobre 2026 », « le 14 novembre 2026 ». */
export function libellePeriode(p: Periode): string {
  const d = new Date(enJour(p.du)), a = new Date(enJour(p.au));
  if (p.du === p.au) return `le ${premier(jourMoisAn.format(d))}`;
  const memeAn = p.du.slice(0, 4) === p.au.slice(0, 4);
  const memeMois = memeAn && p.du.slice(5, 7) === p.au.slice(5, 7);
  const debut = memeMois ? (d.getUTCDate() === 1 ? "1er" : String(d.getUTCDate())) : premier(memeAn ? jourMois.format(d) : jourMoisAn.format(d));
  return `du ${debut} au ${premier(jourMoisAn.format(a))}`;
}

/** Identifiant d'une période, utilisé là où l'écran attend un identifiant d'événement. */
export const idPeriode = (p: Periode) => `periode:${p.du}:${p.au}`;
export const estIdPeriode = (id: string) => id.startsWith("periode:");

/** Raccourcis proposés à l'écran, calculés à partir d'aujourd'hui (jour de Paris). */
export function raccourcisPeriode(aujourdhui: Date = new Date()): { libelle: string; periode: Periode }[] {
  const j = jourParis(aujourdhui);
  const [an, mois] = [Number(j.slice(0, 4)), Number(j.slice(5, 7))];
  const debutMois = `${j.slice(0, 7)}-01`;
  const finMoisPrecedent = versIso(enJour(debutMois) - JOUR_MS);
  const debutSaison = mois >= 8 ? `${an}-08-01` : `${an - 1}-08-01`;
  return [
    { libelle: "Ce mois-ci", periode: { du: debutMois, au: j } },
    { libelle: "Le mois dernier", periode: { du: `${finMoisPrecedent.slice(0, 7)}-01`, au: finMoisPrecedent } },
    { libelle: "30 derniers jours", periode: { du: versIso(enJour(j) - 29 * JOUR_MS), au: j } },
    { libelle: "Depuis le 1er août", periode: { du: debutSaison, au: j } },
  ];
}
