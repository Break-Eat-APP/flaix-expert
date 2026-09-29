import type { Centimes } from "./argent.ts";
import { htExact, type TauxTvaPb } from "./tva.ts";

/**
 * Marge unitaire au comptoir (fiche « Marge unitaire par canal », module 5) :
 *   marge = prix HT − coût matière HT ; taux = marge ÷ prix HT × 100.
 * Calcul d'analyse : on part du HT exact et on n'arrondit que le résultat, pour
 * ne pas cumuler deux arrondis. La marge brute est ce qui reste AVANT salaires,
 * loyer et charges — jamais « ce que tu as gagné » (dossier, module 5).
 *
 * Rappel de la règle transverse du 2026-09-11 : un taux ne se compare jamais
 * entre deux canaux dont les prix diffèrent (comptoir vs Click & Collect) ;
 * seuls les euros par vente se comparent.
 */
export function margeUnitaireComptoir(
  prixTtc: Centimes,
  taux: TauxTvaPb,
  coutMatiere: Centimes,
): { marge: Centimes; tauxMarge: number | null } {
  const ht = htExact(prixTtc, taux);
  const marge = ht - coutMatiere;
  return {
    marge: Math.round(marge),
    tauxMarge: ht > 0 ? (marge / ht) * 100 : null,
  };
}
