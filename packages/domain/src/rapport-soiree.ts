/**
 * Rapport de soirée (module 9, validé par Rémi le 2026-09-12 ; dossier §14 module 9, §15.131).
 *
 * Il ne recalcule rien : chaque chiffre vient d'un module existant (ventes, clôtures, stock, équipe),
 * lu une fois l'événement clos, puis figé. Deux calculs seulement lui sont propres :
 *   - la cascade du résultat de la soirée, ligne à ligne :
 *       encaissé TTC − TVA collectée = CA HT ; − coût matière = marge brute ; ± écarts de stock − personnel
 *       − dépenses de la soirée − part des frais du mois = ce qu'il te reste (§15.154)
 *     (null dès qu'une donnée manque : jamais un chiffre estimé) ;
 *   - la comparaison avec l'événement joué juste avant (jamais une moyenne) :
 *       écart = actuel − précédent ; écart % = écart ÷ précédent × 100 (null sans événement précédent ou à 0).
 * Depuis le §15.154, les frais du mois (loyer, salaires hors soirée, assurance…) y sont déduits au prorata du CA
 * HT de la soirée, pour ceux que le lieu a renseignés ; l'impôt sur les bénéfices reste exclu.
 *
 * Figé : le rapport est établi une seule fois, à la clôture de l'événement (ou à la première lecture
 * pour un événement clos avant que le rapport existe), puis scellé par son empreinte.
 */
import type { Centimes } from "./argent.ts";
import { EMPREINTE_INITIALE, calculerEmpreinte, jsonCanonique } from "./chaine.ts";
import type { AlerteResultat, ClotureMatch, ComptageCoffre, ComptageEspeces, ProduitVendu, StockMatch } from "./modele.ts";
import { formaterQuantiteStock, valeurQuantiteStock, type StockIngredientsMatch } from "./stock-ingredients.ts";
import type { EtatCibleSoiree } from "./finances.ts";
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
  /** Dépenses de la soirée saisies dans Gestion financière (0 s'il n'y en a pas). */
  depenses: Centimes;
  /** Conditionnement des portions vendues (gobelets, barquettes… §15.155) ; absent ou 0 : aucun. */
  conditionnement?: Centimes;
  /** Écarts de stock valorisés (négatif : perte) ; absent ou null si le stock n'était pas suivi. */
  ecartStock?: Centimes | null;
  /** Part des frais du mois portée par la soirée (0 ou absent : aucun frais du mois). */
  fraisMois?: Centimes;
}

export const LIBELLE_RESTE = "Ce qu'il te reste (avant impôt)";

export function cascadeSoiree(e: EntreeCascade): { lignes: LigneCascade[]; caHt: Centimes; margeBrute: Centimes | null; margeNette: Centimes | null } {
  const caHt = e.encaisseTtc - e.tva;
  const conditionnement = e.conditionnement ?? 0;
  const margeBrute = e.coutMatiere === null ? null : caHt - e.coutMatiere - conditionnement;
  const ecartStock = e.ecartStock ?? 0;
  const fraisMois = e.fraisMois ?? 0;
  const margeNette = margeBrute === null || e.personnel === null ? null : margeBrute + ecartStock - e.personnel - e.depenses - fraisMois;
  const lignes: LigneCascade[] = [
    { libelle: "Encaissé TTC", montant: e.encaisseTtc, sorte: "depart" },
    { libelle: "TVA collectée (reversée à l'État)", montant: e.tva, sorte: "retire" },
    { libelle: "Chiffre d'affaires HT", montant: caHt, sorte: "total" },
    { libelle: "Coût matière (prix d'achat de ce qui a été vendu)", montant: e.coutMatiere, sorte: "retire", note: e.coutMatiere === null ? "coût manquant sur au moins un produit" : undefined },
  ];
  if (conditionnement) lignes.push({ libelle: "Conditionnement (gobelets, barquettes, serviettes…)", montant: conditionnement, sorte: "retire" });
  lignes.push({ libelle: "Marge brute", montant: margeBrute, sorte: "total" });
  // Écart compté : une perte se retire, un surplus s'ajoute (montant négatif d'une ligne « retire »).
  if (e.ecartStock) lignes.push({ libelle: "Écarts de stock comptés (casse, pertes)", montant: -e.ecartStock, sorte: "retire" });
  lignes.push(
    { libelle: "Personnel de la soirée", montant: e.personnel, sorte: "retire", note: e.personnel === null ? "taux horaire manquant dans Équipe" : undefined },
    { libelle: "Dépenses de la soirée", montant: e.depenses, sorte: "retire" },
  );
  if (fraisMois) lignes.push({ libelle: "Part des frais du mois (loyer, abonnements, salaires hors soirée…)", montant: fraisMois, sorte: "retire" });
  lignes.push({ libelle: LIBELLE_RESTE, montant: margeNette, sorte: "total" });
  return { caHt, margeBrute, margeNette, lignes };
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
  /**
   * Ce qui est parti de la réserve centrale, stand par stand (§15.170) : déjà au stand (reste de l'événement précédent),
   * sorti de la réserve (mise en place + réassort), vendu, restant compté ; valeur de la sortie au coût d'achat.
   * Absent des rapports établis avant le 2026-10-21.
   */
  bilan?: LigneBilanStock[];
}

export interface LigneBilanStock {
  stand: string;
  nom: string;
  avant: string;
  sorti: string;
  vendu: string;
  compte: string | null;
  valeurSortie: Centimes | null;
}

/** Bilan de stock de l'événement (§15.170) : les articles sortis de la réserve ou vendus, stand par stand. */
export function bilanDeStock(stock: StockMatch | null, ingredients: StockIngredientsMatch | null): LigneBilanStock[] {
  const nombre = (n: number) => n.toLocaleString("fr-FR");
  const produits = (stock?.stands ?? []).flatMap((s) =>
    s.lignes
      .filter((l) => l.miseEnPlace + l.reassort !== 0 || l.vendu !== 0)
      .map((l) => {
        const sorti = l.miseEnPlace + l.reassort;
        return {
          stand: s.nom,
          nom: l.nom,
          avant: nombre(l.reste),
          sorti: nombre(sorti),
          vendu: nombre(l.vendu),
          compte: l.compte === null ? null : nombre(l.compte),
          valeurSortie: l.coutUnitaire === null ? null : sorti * l.coutUnitaire,
        };
      }),
  );
  const ingr = (ingredients?.stands ?? []).flatMap((s) =>
    s.lignes
      .filter((l) => l.miseEnPlace + l.reassort !== 0 || l.consomme !== 0)
      .map((l) => {
        const sorti = l.miseEnPlace + l.reassort;
        return {
          stand: s.nom,
          nom: l.nom,
          avant: formaterQuantiteStock(l.reste, l.unite),
          sorti: formaterQuantiteStock(sorti, l.unite),
          vendu: formaterQuantiteStock(Math.round(l.consomme), l.unite),
          compte: l.compte === null ? null : formaterQuantiteStock(l.compte, l.unite),
          valeurSortie: Math.round(valeurQuantiteStock(sorti, l.prix)),
        };
      }),
  );
  return [...produits, ...ingr].sort((a, b) => a.stand.localeCompare(b.stand, "fr") || a.nom.localeCompare(b.nom, "fr"));
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
  /** Dépenses de la soirée saisies au moment de la clôture (absent des rapports établis avant le 2026-10-04). */
  depenses?: { nom: string; montant: Centimes; pourcentPb: number | null }[];
  /** Marge nette comparée à sa cible ; null sans cible (absent des rapports établis avant le 2026-10-04). */
  cibleMargeNette?: EtatCibleSoiree | null;
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
