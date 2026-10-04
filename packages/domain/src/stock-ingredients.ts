/**
 * Stock des ingrédients, au choix ingrédient par ingrédient (décision de Rémi, dossier §15.124).
 *
 * Mêmes règles que le stock des produits (stock.ts), en millièmes de l'unité d'achat :
 *   départ    = reste de l'événement précédent + mise en place
 *   restant   = départ + réassort − consommé      (consommé = Σ produits vendus × leur recette)
 *   écart     = compté − restant, valorisé au prix de l'ingrédient
 *   prix      = coût moyen pondéré après chaque livraison (prix total ÷ quantité livrée)
 *
 * Exemple : fût de bière blonde de 30 L, pinte de 50 cl = 0,5 L. 52 pintes vendues → 26 L consommés ;
 * 0 L compté au fût → écart de −4 L (mousse, verres offerts non saisis…).
 */
import type { Centimes } from "./argent.ts";
import type { Evenement } from "./modele.ts";
import type { AlerteStock } from "./stock.ts";
import type { UniteIngredient } from "./recettes.ts";

const LIBELLE_UNITE: Record<UniteIngredient, [string, string]> = { kg: ["kg", "kg"], l: ["L", "L"], piece: ["pièce", "pièces"] };

/** « 12,5 » → 12 500 millièmes. null si illisible ; 0 seulement si `zero` (un comptage peut être nul). */
export function quantiteStockVersMilli(texte: string, { zero = false }: { zero?: boolean } = {}): number | null {
  const propre = texte.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(propre)) return null;
  const milli = Math.round(Number(propre) * 1000);
  if (!Number.isSafeInteger(milli) || milli > 1_000_000_000) return null;
  return milli > 0 || (zero && milli === 0) ? milli : null;
}

/** 12 500 (l) → « 12,5 » : la valeur à remettre dans un champ de saisie. */
export const milliVersSaisieStock = (milli: number) => (milli / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 3, useGrouping: false });

/** 12 500 (l) → « 12,5 L » ; 14 000 (pièce) → « 14 pièces » ; −4 000 (l) → « −4 L ». */
export function formaterQuantiteStock(milli: number, unite: UniteIngredient): string {
  const n = milli / 1000;
  const texte = Math.abs(n).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
  const [un, plusieurs] = LIBELLE_UNITE[unite];
  return `${n < 0 ? "−" : ""}${texte} ${Math.abs(n) >= 2 ? plusieurs : un}`;
}

/** Valeur (centimes, non arrondie) d'une quantité au prix par unité d'achat. */
export const valeurQuantiteStock = (milli: number, prixParUnite: Centimes) => (milli * prixParUnite) / 1000;

/** Prix par unité d'achat d'une livraison : prix total HT ÷ quantité (fût de 30 L à 90 € → 3,00 €/L). */
export const prixUnitaireLivraison = (prixTotal: Centimes, quantiteMilli: number) => Math.round((prixTotal * 1000) / quantiteMilli);

export interface LigneStockIngredient {
  ingredientId: string;
  nom: string;
  unite: UniteIngredient;
  /** Prix HT par unité d'achat (coût moyen pondéré après livraisons). */
  prix: Centimes;
  reste: number;
  premierMatch: boolean;
  miseEnPlace: number;
  miseEnPlaceDerniere: { par: string; le: string } | null;
  reassort: number;
  /** Consommation théorique : produits vendus × recette (figée à la clôture de l'événement). */
  consomme: number;
  depart: number;
  restant: number;
  seuil: number;
  alerte: AlerteStock;
  compte: number | null;
  comptage: { par: string; le: string; motif: string | null } | null;
  ecart: number | null;
  ecartValeur: number | null;
  motifRequis: boolean;
  suggestion: number | null;
}

export interface StockIngredientsMatch {
  evenement: Evenement;
  stands: { standId: string; nom: string; lignes: LigneStockIngredient[] }[];
  /** Solde calculé de la réserve, par ingrédient suivi (millièmes). */
  reserve: Record<string, number>;
  restes: { requis: boolean; manquants: number };
}

export interface IngredientReserve {
  ingredientId: string;
  nom: string;
  unite: UniteIngredient;
  prix: Centimes;
  inventaire: { date: string; compte: number } | null;
  livreDepuis: number;
  sortiDepuis: number;
  solde: number;
}

export interface MouvementIngredient {
  id: string;
  type: "livraison" | "mise_en_place" | "reassort";
  ingredient: string;
  unite: UniteIngredient;
  stand: string | null;
  match: string | null;
  quantite: number;
  prixTotal: Centimes | null;
  fournisseur: string | null;
  dateLivraison: string | null;
  prixAvant: Centimes | null;
  prixApres: Centimes | null;
  par: string;
  le: string;
}

export interface InventaireIngredients {
  id: string;
  date: string;
  par: string;
  le: string;
  lignes: { ingredient: string; unite: UniteIngredient; calcule: number | null; compte: number; ecart: number | null; valeur: number | null }[];
}

export interface EtatReserveIngredients {
  ingredients: IngredientReserve[];
  inventaires: InventaireIngredients[];
  mouvements: MouvementIngredient[];
}
