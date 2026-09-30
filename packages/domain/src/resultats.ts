import type { ProduitVendu } from "./modele.ts";

/**
 * Calculs de présentation des Résultats (dossier §15.103). Aucun chiffre n'est estimé :
 * une donnée manquante donne null, et l'écran l'écrit (« coût manquant », « affluence manquante »).
 */

/** Évolution en % par rapport au match de comparaison ; null si la base de comparaison est nulle ou absente. */
export function variation(actuel: number | null, avant: number | null | undefined): number | null {
  if (actuel === null || avant === null || avant === undefined || avant === 0) return null;
  return ((actuel - avant) / Math.abs(avant)) * 100;
}

export function mediane(valeurs: readonly number[]): number | null {
  if (valeurs.length === 0) return null;
  const t = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
}

/** Rang d'une heure dans une soirée : 0 h à 5 h viennent après 23 h (soirée qui passe minuit). */
export function rangHeure(heure: number): number {
  return heure < 6 ? heure + 24 : heure;
}

/** Au plus `max` parts nommées, le reste regroupé en « Autres » (règle des camemberts, §15.95). */
export function regrouperParts<T extends { nom: string; ca: number }>(parts: readonly T[], max = 5): { nom: string; ca: number; autres: boolean }[] {
  const tries = [...parts].filter((p) => p.ca > 0).sort((a, b) => b.ca - a.ca);
  if (tries.length <= max + 1) return tries.map((p) => ({ nom: p.nom, ca: p.ca, autres: false }));
  const tete = tries.slice(0, max).map((p) => ({ nom: p.nom, ca: p.ca, autres: false }));
  return [...tete, { nom: "Autres", ca: tries.slice(max).reduce((s, p) => s + p.ca, 0), autres: true }];
}

export const margeParVente = (p: ProduitVendu): number | null => (p.marge === null || p.quantite <= 0 ? null : p.marge / p.quantite);

export interface RepereMarges {
  quantite: number;
  margeParVente: number;
}

/** Repères du nuage « ventes × marge par vente » : médianes des produits dont le coût est connu. */
export function reperesMarges(produits: readonly ProduitVendu[]): RepereMarges | null {
  const connus = produits.filter((p) => p.quantite > 0 && p.marge !== null);
  const q = mediane(connus.map((p) => p.quantite));
  const m = mediane(connus.map((p) => margeParVente(p)!));
  return q === null || m === null ? null : { quantite: q, margeParVente: m };
}

/** « À revoir » : vendu plus que la médiane, pour une marge par vente sous la médiane. */
export function aRevoir(p: ProduitVendu, r: RepereMarges): boolean {
  const m = margeParVente(p);
  return m !== null && p.quantite > r.quantite && m < r.margeParVente;
}

export interface Piste {
  produit: string;
  constat: string;
  calcul: string;
}

/**
 * Pistes chiffrées « à volume égal » pour les produits à revoir : le gain de marge d'une hausse
 * de 0,50 € TTC. Un calcul, pas un conseil : le directeur décide (§15.103).
 */
export function pistesMarges(produits: readonly ProduitVendu[], formater: (centimes: number) => string, hausseTtc = 50): Piste[] {
  const r = reperesMarges(produits);
  if (!r) return [];
  return produits
    .filter((p) => aRevoir(p, r) && p.caTtc > 0)
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 3)
    .map((p) => {
      // La hausse TTC ne rapporte que sa part hors taxes, au taux de TVA du produit.
      const gainHtUnitaire = (hausseTtc * p.caHt) / p.caTtc;
      return {
        produit: p.nom,
        constat: `${p.quantite} vendus, ${formater(Math.round(margeParVente(p)!))} de marge par vente.`,
        calcul: `+${formater(hausseTtc)} sur le prix = +${formater(Math.round(gainHtUnitaire * p.quantite))} de marge sur un match comme celui-ci, à volume égal.`,
      };
    });
}
