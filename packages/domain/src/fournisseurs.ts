/**
 * Comparaison des prix entre fournisseurs (module 5, validé le 2026-09-11 ; dossier §14 module 5, §15.141).
 *
 *   prix unitaire   = prix de la dernière livraison chez ce fournisseur, ramené à la portion (produit) ou au
 *                     kg, litre ou pièce (ingrédient) — jamais au colis
 *   écart           = (prix unitaire − prix du moins cher) ÷ prix du moins cher
 *   écoulement      = contenance d'un colis ÷ consommation moyenne par événement (en événements)
 *   sur-conditionnement : le moins cher à l'unité est un colis qui couvre plus de 1,5 événement
 */
import type { UniteIngredient } from "./recettes.ts";

/** Au-delà, un colis couvre « trop » d'événements (règle du prototype validé). */
export const SEUIL_SUR_CONDITIONNEMENT = 1.5;
export const SANS_FOURNISSEUR = "Fournisseur non précisé";

export interface LivraisonFournisseur {
  /** « p:<produit> » ou « i:<ingrédient> ». */
  cle: string;
  nom: string;
  unite: UniteIngredient | null;
  fournisseur: string | null;
  /** Prix HT à l'unité (centimes, non arrondi). */
  prixUnitaire: number;
  /** Quantité livrée, en portions ou unités d'achat. */
  quantite: number;
  /** Date de livraison (AAAA-MM-JJ). */
  date: string;
  /** Heure d'enregistrement (départage deux livraisons du même jour). */
  le: string;
}

export interface Conditionnement {
  cle: string;
  fournisseur: string;
  libelle: string;
  /** Contenance d'un colis, en portions ou unités d'achat. */
  contenance: number;
}

export interface OffreFournisseur {
  fournisseur: string;
  prixUnitaire: number;
  /** Écart au moins cher, en % ; null pour le moins cher. */
  ecartPct: number | null;
  dernierAchat: string;
  livraisons: number;
  quantiteTotale: number;
  conditionnement: { libelle: string; contenance: number } | null;
  /** Événements de consommation couverts par un colis ; null sans conditionnement ou sans historique. */
  couvre: number | null;
}

export interface ComparaisonArticle {
  cle: string;
  nom: string;
  unite: UniteIngredient | null;
  /** Consommation moyenne par événement (portions ou unités d'achat) ; null sans historique. */
  consommationParEvenement: number | null;
  /** Du moins cher au plus cher. */
  offres: OffreFournisseur[];
  /** Le moins cher à l'unité couvre plus de 1,5 événement : risque de perte sur un produit frais ou un fût entamé. */
  surConditionnement: boolean;
}

/** Réponse de GET /api/stock/fournisseurs. */
export interface ComparaisonFournisseurs {
  articles: ComparaisonArticle[];
  /** Nombre d'événements clos servant à la consommation moyenne (5 au plus). */
  evenementsConsommation: number;
}

export const cleFournisseur = (f: string | null) => (f ?? "").trim().replace(/\s+/g, " ").toLowerCase();

export function comparerFournisseurs(
  livraisons: readonly LivraisonFournisseur[],
  consommation: ReadonlyMap<string, number>,
  conditionnements: readonly Conditionnement[],
): ComparaisonArticle[] {
  const parArticle = new Map<string, LivraisonFournisseur[]>();
  for (const l of livraisons) if (l.prixUnitaire > 0 && l.quantite > 0) parArticle.set(l.cle, [...(parArticle.get(l.cle) ?? []), l]);
  const articles: ComparaisonArticle[] = [];
  for (const [cle, liste] of parArticle) {
    const parFournisseur = new Map<string, LivraisonFournisseur[]>();
    for (const l of liste) parFournisseur.set(cleFournisseur(l.fournisseur), [...(parFournisseur.get(cleFournisseur(l.fournisseur)) ?? []), l]);
    const conso = consommation.get(cle) ?? null;
    const offres = [...parFournisseur.entries()].map(([k, achats]) => {
      const tries = [...achats].sort((a, b) => a.date.localeCompare(b.date) || Date.parse(a.le) - Date.parse(b.le));
      const derniere = tries.at(-1)!;
      const c = conditionnements.find((x) => x.cle === cle && cleFournisseur(x.fournisseur) === k);
      return {
        fournisseur: derniere.fournisseur?.trim() || SANS_FOURNISSEUR,
        prixUnitaire: derniere.prixUnitaire,
        ecartPct: null as number | null,
        dernierAchat: derniere.date,
        livraisons: achats.length,
        quantiteTotale: achats.reduce((s, a) => s + a.quantite, 0),
        conditionnement: c ? { libelle: c.libelle, contenance: c.contenance } : null,
        couvre: c && conso && conso > 0 ? Math.round((c.contenance / conso) * 10) / 10 : null,
      };
    });
    offres.sort((a, b) => a.prixUnitaire - b.prixUnitaire || a.fournisseur.localeCompare(b.fournisseur, "fr"));
    const meilleur = offres[0]!.prixUnitaire;
    offres.forEach((o, i) => (o.ecartPct = i === 0 ? null : Math.round(((o.prixUnitaire - meilleur) / meilleur) * 1000) / 10));
    const premier = liste[0]!;
    articles.push({
      cle,
      nom: premier.nom,
      unite: premier.unite,
      consommationParEvenement: conso,
      offres,
      surConditionnement: offres.length > 1 && offres[0]!.couvre !== null && offres[0]!.couvre > SEUIL_SUR_CONDITIONNEMENT,
    });
  }
  // Ceux qui ont de quoi comparer d'abord, puis par nom.
  return articles.sort((a, b) => Number(b.offres.length > 1) - Number(a.offres.length > 1) || a.nom.localeCompare(b.nom, "fr"));
}

/** Moyenne par événement, les événements sans vente du produit comptant pour 0 ; null sans événement. */
export function moyenneParEvenement(quantites: readonly number[], nbEvenements: number): number | null {
  if (nbEvenements <= 0) return null;
  return quantites.reduce((s, q) => s + q, 0) / nbEvenements;
}
