/**
 * Conditionnement de chaque produit (dossier §15.155, demande de Rémi du 2026-10-10) : les emballages du lieu
 * (gobelet, barquette, serviette, pique…) ont un prix à l'unité en millièmes d'euro ; chaque produit dit lesquels il
 * utilise et combien.
 *   conditionnement d'une portion = Σ quantité × prix de l'emballage
 *   coût de revient d'une portion = coût matière + conditionnement (marges, cibles, « ce qu'il te reste »)
 * Les totaux se calculent au millième puis s'arrondissent au centime.
 */
import type { Centimes } from "./argent.ts";

/** Millièmes d'euro : 0,008 € = 8 ; 0,12 € = 120. */
export type Millimes = number;

export interface Emballage {
  id: string;
  nom: string;
  prixMillimes: Millimes;
  /** Produits qui l'utilisent. */
  produits: number;
}

export interface EmballageDuProduit {
  emballageId: string;
  nom: string;
  quantite: number;
  prixMillimes: Millimes;
}

/** Conditionnement d'une portion, en millièmes d'euro. */
export const conditionnementMillimes = (emballages: readonly { quantite: number; prixMillimes: Millimes }[]): Millimes =>
  emballages.reduce((t, e) => t + e.quantite * e.prixMillimes, 0);

/** Coût de revient d'une portion en centimes (peut avoir des décimales) ; null si le coût matière manque. */
export const coutDeRevient = (coutMatiere: Centimes | null, conditionnement: Millimes): number | null => (coutMatiere === null ? null : coutMatiere + conditionnement / 10);

/** Conditionnement de quantités vendues, arrondi au centime : Σ quantité × conditionnement d'une portion. */
export const conditionnementVendu = (lignes: readonly { quantite: number; conditionnementMillimes?: Millimes }[]): Centimes =>
  Math.round(lignes.reduce((t, l) => t + l.quantite * (l.conditionnementMillimes ?? 0), 0) / 10);

/** 8 → « 0,008 € » ; 120 → « 0,12 € » ; 1 500 → « 1,50 € ». */
export function formaterMillimes(m: Millimes): string {
  return `${(m / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} €`;
}

/** « 0,008 » → 8 ; « 0,12 € » → 120 ; illisible, négatif ou au-delà de 100 € : null. */
export function lireMillimes(texte: string): Millimes | null {
  const t = texte.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(t)) return null;
  const m = Math.round(Number(t) * 1000);
  return m > 100_000 ? null : m;
}

/** Pour remplir un champ : 8 → « 0,008 » ; 120 → « 0,12 ». */
export const millimesPourSaisie = (m: Millimes): string => (m / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3, useGrouping: false });
