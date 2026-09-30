/**
 * Stock suivi à l'unité (module 4, dossier §14 et §15.105).
 *
 *   départ    = reste du match précédent + mise en place
 *   restant   = départ + réassort − vendu              (vendu : journal de caisse, jamais saisi)
 *   seuil     = arrondi(départ × 15 %) ; alerte « rupture » si restant ≤ 0, « faible » si restant ≤ seuil
 *   écart     = compté − restant (l'attendu), valorisé au coût matière, jamais au prix de vente
 *   motif obligatoire si |écart| > 3 % du départ (module 10)
 *   CUMP      = (solde réserve × coût actuel + quantité livrée × prix) ÷ (solde réserve + quantité livrée)
 */

export const SEUIL_ALERTE = 0.15;
export const SEUIL_MOTIF_ECART = 0.03;

export type AlerteStock = "rupture" | "faible" | null;

export function seuilAlerte(depart: number): number {
  return Math.round(depart * SEUIL_ALERTE);
}

export function alerteStock(depart: number, reassort: number, restant: number): AlerteStock {
  if (depart + reassort <= 0) return null;
  if (restant <= 0) return "rupture";
  return restant <= seuilAlerte(depart) ? "faible" : null;
}

export function motifEcartStockRequis(ecart: number, depart: number): boolean {
  return Math.abs(ecart) > depart * SEUIL_MOTIF_ECART;
}

/** Coût unitaire moyen pondéré après une livraison ; le prix de la livraison si la réserve est vide ou sans coût connu. */
export function cump(soldeReserve: number, coutActuel: number | null, quantiteLivree: number, prixUnitaire: number): number {
  if (soldeReserve <= 0 || coutActuel === null) return prixUnitaire;
  return Math.round((soldeReserve * coutActuel + quantiteLivree * prixUnitaire) / (soldeReserve + quantiteLivree));
}

/** Suggestion de mise en place : moyenne des ventes des matchs précédents − reste, plancher 0 ; null sans historique. */
export function suggestionMiseEnPlace(ventesPrecedentes: readonly number[], reste: number): number | null {
  if (ventesPrecedentes.length === 0) return null;
  const moyenne = ventesPrecedentes.reduce((s, v) => s + v, 0) / ventesPrecedentes.length;
  return Math.max(0, Math.round(moyenne) - reste);
}
