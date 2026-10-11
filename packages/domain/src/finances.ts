/**
 * Cibles de marge (module 5 ; dossier §15.78) et gestion financière de la soirée (module 11 ; §15.79, §15.132).
 *
 * Cible de marge brute d'un produit = sa cible propre si elle est saisie, sinon celle de sa catégorie,
 * sinon aucune (jamais une valeur inventée). Taux et cibles en points de base du CA HT (7 000 = 70 %).
 *   marge configurée (prix du moment) = HT du prix − coût matière ; taux = marge ÷ HT
 *   marge réalisée (ventes)           = CA HT − quantité × coût ; taux = marge ÷ CA HT
 *   écart en points = taux − cible ; écart en € par vente = marge − cible × HT
 * Entre deux canaux de prix différents, on compare des euros par vente, jamais des taux (§14 module 5).
 *
 * Dépense de la soirée : montant en euros, pourcentage du CA HT de la soirée, ou pourcentage des paiements par carte
 * (frais bancaires), arrondi au centime. Un poste peut avoir un montant habituel, appliqué à chaque soirée qui n'a
 * pas de saisie propre (§15.154).
 *   ce qu'il te reste = marge brute ± écarts de stock − personnel − dépenses de la soirée − part des frais du mois
 *   cible de marge nette (€) = cible × CA HT ; écart = marge nette − cible (€)
 */
import type { Centimes } from "./argent.ts";
import { htExact, type TauxTvaPb } from "./tva.ts";

/** La règle unique : cible du produit si elle est saisie, sinon celle de sa catégorie, sinon aucune. */
export function cibleEffective(cibleProduit: number | null | undefined, cibleCategorie: number | null | undefined): number | null {
  return cibleProduit ?? cibleCategorie ?? null;
}

export interface EtatCible {
  /** « sans_cible » : aucune cible saisie ; « inconnu » : coût manquant ou rien de vendu. */
  statut: "sans_cible" | "inconnu" | "tenue" | "sous";
  /** Taux de marge, en points de base ; null si incalculable. */
  tauxPb: number | null;
  ciblePb: number | null;
  /** Écart taux − cible, en points de base. */
  ecartPb: number | null;
}

export function etatCible(tauxPb: number | null, ciblePb: number | null): EtatCible {
  if (ciblePb === null) return { statut: "sans_cible", tauxPb, ciblePb, ecartPb: null };
  if (tauxPb === null) return { statut: "inconnu", tauxPb, ciblePb, ecartPb: null };
  const ecartPb = tauxPb - ciblePb;
  return { statut: ecartPb >= 0 ? "tenue" : "sous", tauxPb, ciblePb, ecartPb };
}

/** Taux de marge en points de base, arrondi ; null si le CA HT est nul ou la marge inconnue. */
export function tauxMargePb(marge: number | null, caHt: number): number | null {
  return marge === null || caHt <= 0 ? null : Math.round((marge / caHt) * 10_000);
}

export interface MargeConfiguree {
  /** Prix HT d'une vente (exact, non arrondi). */
  ht: number;
  /** Marge par vente, en centimes (exacte). */
  marge: number;
  etat: EtatCible;
  /** Ce qu'il manque (négatif) ou ce qui dépasse (positif) par vente pour tenir la cible, en centimes. */
  ecartParVente: number | null;
}

/** Marge du produit au prix et au coût du moment, comparée à sa cible : l'alerte se voit dès la saisie du prix. */
export function margeConfiguree(prixTtc: Centimes, tauxTva: TauxTvaPb, cout: Centimes | null, ciblePb: number | null): MargeConfiguree | null {
  if (cout === null || prixTtc <= 0) return null;
  const ht = htExact(prixTtc, tauxTva);
  const marge = ht - cout;
  const etat = etatCible(Math.round((marge / ht) * 10_000), ciblePb);
  return { ht, marge, etat, ecartParVente: ciblePb === null ? null : marge - (ciblePb / 10_000) * ht };
}

export type ModeDepense = "euros" | "pourcent" | "pourcent_carte";

export const UNITES_DEPENSE: { mode: ModeDepense; libelle: string }[] = [
  { mode: "euros", libelle: "€" },
  { mode: "pourcent", libelle: "% du CA HT" },
  { mode: "pourcent_carte", libelle: "% des paiements par carte" },
];

/** Montant d'une dépense de la soirée : en euros tel quel, en % du CA HT, ou en % des paiements par carte TTC (jamais négatif). */
export function montantDepense(mode: ModeDepense, valeur: number, caHt: Centimes, carteTtc: Centimes = 0): Centimes {
  if (mode === "euros") return valeur;
  const base = mode === "pourcent" ? caHt : carteTtc;
  return Math.round((Math.max(base, 0) * valeur) / 10_000);
}

export interface EtatCibleSoiree {
  ciblePb: number;
  /** Cible en euros pour cette soirée : cible × CA HT. */
  cible: Centimes;
  tauxPb: number | null;
  /** Marge nette − cible (€) ; null si la marge nette n'est pas calculable. */
  ecart: Centimes | null;
  ecartPb: number | null;
  tenue: boolean | null;
}

/** Marge nette de la soirée comparée à sa cible ; null tant qu'aucune cible n'est saisie. */
export function etatCibleSoiree(margeNette: Centimes | null, caHt: Centimes, ciblePb: number | null): EtatCibleSoiree | null {
  if (ciblePb === null) return null;
  const cible = Math.round((Math.max(caHt, 0) * ciblePb) / 10_000);
  const tauxPb = tauxMargePb(margeNette, caHt);
  const ecart = margeNette === null ? null : margeNette - cible;
  return { ciblePb, cible, tauxPb, ecart, ecartPb: tauxPb === null ? null : tauxPb - ciblePb, tenue: ecart === null ? null : ecart >= 0 };
}

/** « 70 » → 7 000 points de base ; « 52,5 » → 5 250. Accepte une virgule ; null si illisible ou hors bornes. */
export function lirePourcentage(texte: string, { min = 0, max = 100 }: { min?: number; max?: number } = {}): number | null {
  const t = texte.trim().replace(/\s|%/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const v = Number(t);
  return v < min || v > max ? null : Math.round(v * 100);
}

/** 7 000 → « 70 % » ; 5 250 → « 52,5 % ». */
export function formaterPourcentage(pb: number): string {
  return `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export interface PosteDepense {
  id: string;
  nom: string;
  actif: boolean;
  /** Frais proposé dans « Mes frais » dont ce poste est la réponse (§15.154). */
  cle: string | null;
  /** Montant habituel : appliqué à chaque soirée qui n'a pas de saisie propre ; null : saisi soirée par soirée. */
  modeHabituel: ModeDepense | null;
  valeurHabituelle: number | null;
}

export interface LigneDepense {
  posteId: string;
  nom: string;
  actif: boolean;
  /** Saisie de la soirée, ou le montant habituel du poste ; null si ni l'un ni l'autre. */
  mode: ModeDepense | null;
  valeur: number | null;
  /** Montant habituel du poste, faute de saisie propre à la soirée. */
  habituel: boolean;
  montant: Centimes;
  saisiPar: string | null;
  saisiLe: string | null;
}

/** Gestion financière d'un événement (Résultats → Finances). */
export interface FinancesSoiree {
  evenement: { id: string; libelle: string; debut: string; etat: "a_venir" | "ouvert" | "clos"; spectateurs: number | null };
  encaisseTtc: Centimes;
  tva: Centimes;
  caHt: Centimes;
  tickets: number;
  coutMatiere: Centimes | null;
  /** Conditionnement des portions vendues (§15.155). */
  conditionnement: Centimes;
  produitsSansCout: string[];
  personnel: { reel: Centimes | null; affectations: number; tauxManquants: number };
  depenses: LigneDepense[];
  totalDepenses: Centimes;
  /** Écarts de stock comptés en fin de soirée, valorisés (négatif : marchandise perdue) ; null si le stock n'était pas suivi. */
  ecartStock: Centimes | null;
  /** Part des frais du mois portée par la soirée, ou par la période mois par mois (§15.154). */
  fraisMois: import("./frais.ts").FraisDuMoisPorte[];
  totalFraisMois: Centimes;
  /** Frais proposés dans « Mes frais » encore à vérifier : le résultat peut en manquer. */
  fraisAVerifier: number;
  margeBrute: Centimes | null;
  margeNette: Centimes | null;
  cascade: import("./rapport-soiree.ts").LigneCascade[];
  cible: { lieu: number | null; evenement: number | null; effective: number | null };
  etatCible: EtatCibleSoiree | null;
  /** Bilan d'une période (§15.133) : les soirées qui la composent ; les dépenses s'y lisent, elles se saisissent soirée par soirée. */
  periode?: {
    du: string;
    au: string;
    soirees: {
      id: string;
      libelle: string;
      debut: string;
      encaisseTtc: Centimes;
      caHt: Centimes;
      margeBrute: Centimes | null;
      margeNette: Centimes | null;
      etatCible: EtatCibleSoiree | null;
    }[];
  };
}
