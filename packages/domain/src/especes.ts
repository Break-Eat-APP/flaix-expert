/**
 * Contrôle des espèces (module 7, dossier §14 et §15.102) : comptage du tiroir par coupure.
 *
 *   attendu = fond + ventes espèces nettes (journal de caisse) − sorties vers le coffre
 *   compté  = Σ coupure × nombre saisi
 *   écart   = compté − attendu        (négatif : il manque de l'argent ; positif : il y en a trop)
 *   motif obligatoire si |écart| > tolérance du lieu — la clôture n'est jamais bloquée.
 */

/** Coupures en euros, en centimes, de la plus grande à la plus petite. */
export const COUPURES_CENTIMES = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

/** Nombre de pièces ou de billets par coupure ; clé = valeur en centimes. */
export type Coupures = Record<string, number>;

export const MOTIF_ECART_MIN = 5;

export function libelleCoupure(centimes: number): string {
  return centimes >= 100 ? `${centimes / 100} €` : `${centimes} c`;
}

/** Raison d'un refus, ou null : seules les coupures connues, en nombres entiers raisonnables. */
export function erreurCoupures(c: Coupures): string | null {
  if (typeof c !== "object" || c === null || Array.isArray(c)) return "Comptage illisible.";
  for (const [cle, nombre] of Object.entries(c)) {
    if (!COUPURES_CENTIMES.includes(Number(cle) as (typeof COUPURES_CENTIMES)[number]) || String(Number(cle)) !== cle) return `Coupure inconnue : ${cle}.`;
    if (!Number.isInteger(nombre) || nombre < 0 || nombre > 100_000) return `Nombre invalide pour ${libelleCoupure(Number(cle))}.`;
  }
  return null;
}

/** Comptage nettoyé : sans les coupures à zéro, dans l'ordre des coupures. */
export function normaliserCoupures(c: Coupures): Coupures {
  const propre: Coupures = {};
  for (const v of COUPURES_CENTIMES) {
    const n = c[String(v)] ?? 0;
    if (n > 0) propre[String(v)] = n;
  }
  return propre;
}

export function totalCoupures(c: Coupures): number {
  return COUPURES_CENTIMES.reduce((s, v) => s + v * (c[String(v)] ?? 0), 0);
}

export function especesAttendues(fond: number, especes: number, sorties = 0): number {
  return fond + especes - sorties;
}

export function motifEcartRequis(ecart: number, seuil: number): boolean {
  return Math.abs(ecart) > seuil;
}

/** Le Z peut être clôturé : dans la tolérance, ou motif d'au moins 5 caractères. */
export function comptageCloturable(ecart: number, seuil: number, motif: string | null): boolean {
  return !motifEcartRequis(ecart, seuil) || (motif ?? "").trim().length >= MOTIF_ECART_MIN;
}
