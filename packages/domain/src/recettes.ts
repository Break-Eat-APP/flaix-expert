/**
 * Recettes (dossier §15.77, §15.86 ; spécification de Rémi §15.117 ; construction §15.119).
 *
 *   coût d'une ligne        = prix HT de l'ingrédient par unité d'achat × quantité ÷ 1000
 *                             (quantité en millièmes de l'unité : g pour le kg, ml pour le litre)
 *   coût de fabrication     = Σ coûts des lignes, arrondi au centime
 *
 * Exemple de Rémi : tomates à 2,50 €/kg, 100 g → 0,25 € ; salade 0,10 € ; + steak et pain → 2,00 €.
 */
import type { Centimes } from "./argent.ts";

export type UniteIngredient = "kg" | "l" | "piece";

/** Unité d'achat (prix) et unité de saisie dans la recette, avec le nombre de millièmes par unité de saisie. */
export const UNITES_INGREDIENT: Record<UniteIngredient, { achat: string; recette: string; milliParUnite: number }> = {
  kg: { achat: "kg", recette: "g", milliParUnite: 1 },
  l: { achat: "litre", recette: "cl", milliParUnite: 10 },
  piece: { achat: "pièce", recette: "pièce", milliParUnite: 1000 },
};

/** Coût exact (non arrondi) d'une quantité d'ingrédient. */
export const coutLigneRecette = (prixParUnite: Centimes, quantiteMilli: number) => (prixParUnite * quantiteMilli) / 1000;

export function coutRecette(lignes: { prix: Centimes; quantiteMilli: number }[]): Centimes {
  return Math.round(lignes.reduce((s, l) => s + coutLigneRecette(l.prix, l.quantiteMilli), 0));
}

/** « 100 » g → 100 ; « 2,5 » cl → 25 ; « 0,5 » pièce → 500. null si illisible ou nul. */
export function quantiteSaisieVersMilli(texte: string, unite: UniteIngredient): number | null {
  const propre = texte.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(propre)) return null;
  const milli = Math.round(Number(propre) * UNITES_INGREDIENT[unite].milliParUnite);
  return milli > 0 && Number.isSafeInteger(milli) ? milli : null;
}

/** 100 (kg) → « 100 » g ; 25 (l) → « 2,5 » cl ; 500 (pièce) → « 0,5 ». */
export function quantiteMilliVersSaisie(milli: number, unite: UniteIngredient): string {
  return (milli / UNITES_INGREDIENT[unite].milliParUnite).toLocaleString("fr-FR", { maximumFractionDigits: 3, useGrouping: false });
}

export interface Ingredient {
  id: string;
  nom: string;
  unite: UniteIngredient;
  /** Prix HT par unité d'achat (par kg, par litre, par pièce). */
  prix: Centimes;
  actif: boolean;
  /** Suivi en stock (livraisons, mise en place, comptage), au choix du directeur (§15.124). */
  suiviStock: boolean;
  /** Nombre de recettes qui l'utilisent. */
  recettes: number;
}

export interface LigneRecette {
  ingredientId: string;
  nom: string;
  unite: UniteIngredient;
  prix: Centimes;
  quantiteMilli: number;
  /** Coût exact de la ligne (non arrondi). */
  cout: number;
}

export interface Recette {
  produitId: string;
  lignes: LigneRecette[];
  /** Coût de fabrication arrondi ; null si le produit n'a pas de recette. */
  cout: Centimes | null;
}
