import { diviserArrondi, type Centimes } from "./argent.ts";

/**
 * Taux de TVA exprimés en points de base (1 % = 100) pour rester en entiers :
 * 5,5 % = 550. Le taux de chaque produit est choisi par le directeur ; le logiciel
 * ne décide pas à sa place (question 5 de docs/questions-expert-comptable.md).
 */
export type TauxTvaPb = 210 | 550 | 1000 | 2000;

export const TAUX_TVA: ReadonlyArray<{ pb: TauxTvaPb; libelle: string }> = [
  { pb: 550, libelle: "5,5 %" },
  { pb: 1000, libelle: "10 %" },
  { pb: 2000, libelle: "20 %" },
  { pb: 210, libelle: "2,1 %" },
];

export function estTauxTva(valeur: unknown): valeur is TauxTvaPb {
  return TAUX_TVA.some((t) => t.pb === valeur);
}

export function libelleTauxTva(pb: number): string {
  return TAUX_TVA.find((t) => t.pb === pb)?.libelle ?? `${(pb / 100).toLocaleString("fr-FR")} %`;
}

/**
 * Ventile un montant TTC en HT + TVA, au centime.
 * HT = TTC ÷ (1 + taux), arrondi au centime le plus proche ; TVA = TTC − HT,
 * de sorte que HT + TVA redonne toujours exactement le TTC encaissé.
 *
 * ⚠ Règle d'arrondi (par ligne) à faire confirmer par l'expert-comptable —
 * question 6 de docs/questions-expert-comptable.md.
 */
export function ventilerTtc(ttc: Centimes, taux: TauxTvaPb): { ht: Centimes; tva: Centimes } {
  const ht = diviserArrondi(ttc * 10_000, 10_000 + taux);
  return { ht, tva: ttc - ht };
}

/** HT exact (non arrondi, en centimes fractionnaires) — réservé aux calculs d'analyse, jamais aux montants encaissés. */
export function htExact(ttc: Centimes, taux: TauxTvaPb): number {
  return (ttc * 10_000) / (10_000 + taux);
}
