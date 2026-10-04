/**
 * Rapport de soirée (module 9, validé par Rémi le 2026-09-12 ; dossier §14 module 9, §15.131).
 *
 * Il ne recalcule rien : chaque chiffre vient d'un module existant (ventes, clôtures, stock, équipe),
 * lu une fois l'événement clos, puis figé. Deux calculs seulement lui sont propres :
 *   - la cascade du résultat de la soirée, ligne à ligne :
 *       encaissé TTC − TVA collectée = CA HT ; − coût matière = marge brute ; − personnel = marge nette
 *     (null dès qu'une donnée manque : jamais un chiffre estimé) ;
 *   - la comparaison avec l'événement joué juste avant (jamais une moyenne) :
 *       écart = actuel − précédent ; écart % = écart ÷ précédent × 100 (null sans événement précédent ou à 0).
 * La marge nette de la soirée n'est PAS le bénéfice du lieu (loyer, salaires permanents, assurance,
 * amortissements, impôt exclus) : le rapport l'écrit en toutes lettres.
 *
 * Figé : le rapport est établi une seule fois, à la clôture de l'événement (ou à la première lecture
 * pour un événement clos avant que le rapport existe), puis scellé par son empreinte.
 */
import type { Centimes } from "./argent.ts";
import { EMPREINTE_INITIALE, calculerEmpreinte, jsonCanonique } from "./chaine.ts";
import type { AlerteResultat, ClotureMatch, ComptageCoffre, ComptageEspeces, ProduitVendu, StockMatch } from "./modele.ts";
import { formaterQuantiteStock, type StockIngredientsMatch } from "./stock-ingredients.ts";
import type { TauxTvaPb } from "./tva.ts";

export interface LigneCascade {
  libelle: string;
  /** Montant de la ligne (positif) ; null si la donnée manque. */
  montant: Centimes | null;
  /** « retire » : soustrait à la ligne précédente ; « total » : résultat intermédiaire. */
  sorte: "depart" | "retire" | "total";
  note?: string;
}

export interface EntreeCascade {
  encaisseTtc: Centimes;
  tva: Centimes;
  coutMatiere: Centimes | null;
  personnel: Centimes | null;
}

export function cascadeSoiree(e: EntreeCascade): { lignes: LigneCascade[]; caHt: Centimes; margeBrute: Centimes | null; margeNette: Centimes | null } {
  const caHt = e.encaisseTtc - e.tva;
  const margeBrute = e.coutMatiere === null ? null : caHt - e.coutMatiere;
  const margeNette = margeBrute === null || e.personnel === null ? null : margeBrute - e.personnel;
  return {
    caHt,
    margeBrute,
    margeNette,
    lignes: [
      { libelle: "Encaissé TTC", montant: e.encaisseTtc, sorte: "depart" },
      { libelle: "TVA collectée (reversée à l'État)", montant: e.tva, sorte: "retire" },
      { libelle: "Chiffre d'affaires HT", montant: caHt, sorte: "total" },
      { libelle: "Coût matière (prix d'achat de ce qui a été vendu)", montant: e.coutMatiere, sorte: "retire", note: e.coutMatiere === null ? "coût manquant sur au moins un produit" : undefined },
      { libelle: "Marge brute", montant: margeBrute, sorte: "total" },
      { libelle: "Personnel de la soirée", montant: e.personnel, sorte: "retire", note: e.personnel === null ? "taux horaire manquant dans Équipe" : undefined },
      { libelle: "Marge nette de la soirée", montant: margeNette, sorte: "total" },
    ],
  };
}

export interface Ecart {
  actuel: number | null;
  precedent: number | null;
  ecart: number | null;
  /** En %, arrondi à 0,1 ; null si pas d'événement précédent ou s'il valait 0. */
  ecartPct: number | null;
}

export function ecartEvenement(actuel: number | null, precedent: number | null | undefined): Ecart {
  const p = precedent ?? null;
  if (actuel === null || p === null) return { actuel, precedent: p, ecart: null, ecartPct: null };
  const ecart = actuel - p;
  return { actuel, precedent: p, ecart, ecartPct: p === 0 ? null : Math.round((ecart / p) * 1000) / 10 };
}

/** Les trois meilleurs produits par marge € et par quantité vendue (lecture des produits de l'événement). */
export function topProduits(produits: readonly ProduitVendu[], n = 3): { parMarge: ProduitVendu[]; parVolume: ProduitVendu[] } {
  return {
    parMarge: produits.filter((p) => p.marge !== null && p.quantite > 0).sort((a, b) => b.marge! - a.marge!).slice(0, n),
    parVolume: produits.filter((p) => p.quantite > 0).sort((a, b) => b.quantite - a.quantite || b.caTtc - a.caTtc).slice(0, n),
  };
}

export interface TiroirRapport {
  caisse: number;
  stand: string;
  attendu: Centimes | null;
  compte: Centimes | null;
  ecart: Centimes | null;
  motif: string | null;
  rectifie: boolean;
}

export interface EspecesRapport {
  tiroirs: TiroirRapport[];
  coffre: { remonte: Centimes; compte: Centimes | null; ecart: Centimes | null; rectifie: boolean } | null;
  /** Somme des écarts comptés (tiroirs et coffre). */
  ecartTotal: Centimes;
  seuil: Centimes;
}

/** Le comptage qui fait foi : la dernière rectification signée, sinon le Z d'origine. */
function retenu<T extends ComptageEspeces | ComptageCoffre>(comptage: T | null, rectifications: readonly T[]): T | null {
  if (!comptage) return null;
  return [...rectifications].sort((a, b) => Date.parse(a.le) - Date.parse(b.le)).at(-1) ?? comptage;
}

/** Contrôle des espèces de la soirée, lu dans l'assistant de clôture : un tiroir par session qui acceptait les espèces. */
export function especesDuRapport(cloture: ClotureMatch): EspecesRapport {
  const tiroirs = cloture.sessions
    .filter((s) => s.fond !== null)
    .map((s): TiroirRapport => {
      const z = retenu(s.comptage, s.rectifications);
      return { caisse: s.caisseNumero, stand: s.standNom, attendu: s.attendu, compte: z?.compte ?? null, ecart: z?.ecart ?? null, motif: z?.motif ?? null, rectifie: s.rectifications.length > 0 };
    });
  const zCoffre = retenu(cloture.coffre.comptage, cloture.coffre.rectifications);
  const coffre = cloture.coffre.requis
    ? { remonte: cloture.coffre.attendu, compte: zCoffre?.compte ?? null, ecart: zCoffre?.ecart ?? null, rectifie: cloture.coffre.rectifications.length > 0 }
    : null;
  const ecartTotal = tiroirs.reduce((s, t) => s + (t.ecart ?? 0), 0) + (coffre?.ecart ?? 0);
  return { tiroirs, coffre, ecartTotal, seuil: cloture.seuilEcartEspeces };
}

export interface StockRapport {
  produits: { nom: string; stand: string; ecart: number; valeur: Centimes | null; motif: string | null }[];
  ingredients: { nom: string; stand: string; ecart: string; valeur: Centimes | null; motif: string | null }[];
  /** Somme des écarts valorisés (les écarts sans coût n'y entrent pas). */
  valeurTotale: Centimes;
  /** Le stock était-il suivi sur cet événement (mise en place ou réassort) ? */
  suivi: boolean;
}

/** Écarts de stock comptés à la fin de l'événement (produits, puis ingrédients au poids ou au volume). */
export function ecartsDeStock(stock: StockMatch | null, ingredients: StockIngredientsMatch | null): StockRapport {
  const produits = (stock?.stands ?? []).flatMap((s) =>
    s.lignes.filter((l) => l.ecart !== null && l.ecart !== 0).map((l) => ({ nom: l.nom, stand: s.nom, ecart: l.ecart!, valeur: l.ecartValeur, motif: l.comptage?.motif ?? null })),
  );
  const ingr = (ingredients?.stands ?? []).flatMap((s) =>
    s.lignes
      .filter((l) => l.ecart !== null && l.ecart !== 0)
      .map((l) => ({ nom: l.nom, stand: s.nom, ecart: `${l.ecart! > 0 ? "+" : "−"}${formaterQuantiteStock(Math.abs(l.ecart!), l.unite)}`, valeur: l.ecartValeur, motif: l.comptage?.motif ?? null })),
  );
  const valeurTotale = [...produits, ...ingr].reduce((s, x) => s + (x.valeur ?? 0), 0);
  return { produits, ingredients: ingr, valeurTotale, suivi: !!stock?.restes.requis || !!ingredients?.restes.requis };
}

/** Le rapport tel qu'il est figé à la clôture de l'événement (contenu scellé par son empreinte). */
export interface RapportSoiree {
  evenement: { id: string; libelle: string; debut: string; closLe: string | null; spectateurs: number | null };
  lieu: { nom: string; raisonSociale: string | null; formation: boolean };
  ventes: {
    encaisseTtc: Centimes;
    caHt: Centimes;
    tva: Centimes;
    parTaux: { tauxTva: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
    tickets: number;
    panierMoyen: Centimes | null;
    caParSpectateur: Centimes | null;
    parMode: { especes: Centimes; carte: Centimes };
    parStand: { nom: string; ca: Centimes }[];
    parCategorie: { nom: string; ca: Centimes }[];
    annulations: { nombre: number; montant: Centimes };
    /** Réductions accordées sur les tickets non annulés. */
    reductions: { remises: Centimes; offerts: Centimes; fidelite: Centimes };
  };
  cascade: LigneCascade[];
  margeBrute: Centimes | null;
  margeNette: Centimes | null;
  personnel: { montant: Centimes | null; affectations: number; tauxManquants: number };
  produitsSansCout: string[];
  especes: EspecesRapport;
  stock: StockRapport;
  comparaison: {
    evenement: { libelle: string; debut: string } | null;
    encaisseTtc: Ecart;
    tickets: Ecart;
    panierMoyen: Ecart;
    spectateurs: Ecart;
    margeBrute: Ecart;
    margeNette: Ecart;
  };
  top: { parMarge: ProduitVendu[]; parVolume: ProduitVendu[] };
  /** Instantané de « À surveiller » au moment où le rapport est établi. */
  alertes: AlerteResultat[];
  /** Z de l'événement (clôture journalière) : rang dans la chaîne des clôtures, total et total perpétuel. */
  z: { sequence: number; totalTtc: Centimes; perpetuel: Centimes } | null;
}

export interface RapportSoireeFige {
  rapport: RapportSoiree;
  etabliLe: string;
  /** « cloture » : établi en clôturant l'événement ; « a_posteriori » : événement clos avant l'existence du rapport. */
  etabliA: "cloture" | "a_posteriori";
  etabliPar: string;
  empreinte: string;
}

/** Empreinte du rapport figé : tout son contenu, sa date et sa façon d'être établi. Recalculable à tout moment. */
export function empreinteRapport(evenementId: string, etabliLe: string, etabliA: RapportSoireeFige["etabliA"], rapport: RapportSoiree): string {
  return calculerEmpreinte([evenementId, etabliLe, etabliA, jsonCanonique(rapport)], EMPREINTE_INITIALE);
}
