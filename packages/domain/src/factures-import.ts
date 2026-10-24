import type { Centimes } from "./argent.ts";
import { lireMontantExport } from "./caisses-externes.ts";
import { lireCsv, sansAccents } from "./csv.ts";
import { normaliserFournisseur } from "./factures.ts";

/*
 * Factures fournisseurs automatisées (dossier §15.173, demande de Rémi du 2026-10-24) : lire un export Excel ou CSV de
 * facture, ramener chaque ligne à l'unité vendue (une ligne « Coca 33 cl x24, quantité 5 » fait 120 canettes),
 * retrouver le produit d'après les correspondances déjà faites pour ce fournisseur, et signaler ce qui paraît faux
 * (colis oublié, prix ou quantité inhabituels, total qui ne tombe pas juste). FlaiX Expert signale, le directeur tranche :
 * rien n'est corrigé tout seul.
 */

// ---------- Lecture d'un export de facture ----------

export type ChampFacture = "code" | "libelle" | "quantite" | "prixUnitaire" | "montant" | "colis";

const ALIAS_FACTURE: [ChampFacture, RegExp][] = [
  ["code", /^(code|code article|ref|ref\.|reference|ref article|reference article|article n|n article|ean|gencod|code ean|sku|code produit)$/],
  ["libelle", /^(designation|libelle|article|produit|description|libelle article|nom|intitule|denomination)$/],
  ["quantite", /^(qte|qte\.|quantite|quantites|qty|quantity|nb|nombre|nb colis|qte colis|qte cde|qte livree|quantite livree|quantite facturee|qte facturee)$/],
  ["prixUnitaire", /^(pu|p\.u\.|pu ht|p\.u\. ht|prix|prix ht|prix unitaire|prix unitaire ht|prix u\. ht|prix net|prix net ht|tarif|tarif ht|unit price)$/],
  ["montant", /^(montant|montant ht|total|total ht|total ligne|montant net|montant net ht|net ht|amount)$/],
  ["colis", /^(pcb|colisage|conditionnement|uvc|uvc par colis|unites par colis|nb unites|unites|par colis|contenance colis)$/],
];

export type ColonnesFacture = Partial<Record<ChampFacture, number>>;

export function devinerColonnesFacture(entetes: readonly string[]): ColonnesFacture {
  const c: ColonnesFacture = {};
  entetes.forEach((e, i) => {
    const n = sansAccents(e).replace(/\s+/g, " ").trim();
    for (const [champ, re] of ALIAS_FACTURE) if (c[champ] === undefined && re.test(n)) c[champ] = i;
  });
  return c;
}

export interface LigneFactureLue {
  codeArticle: string | null;
  libelle: string;
  /** Quantité facturée, dans l'unité de la facture (colis, carton, pièce…). */
  quantite: number;
  /** Prix HT d'une unité de la facture (d'un colis s'il est vendu au colis). */
  prixUnitaire: Centimes;
  /** Unités par colis lues dans le fichier (colonne PCB, colisage) ; null : non dites. */
  unitesParColis: number | null;
}

export interface LectureFacture {
  entetes: string[];
  colonnes: ColonnesFacture;
  lignes: LigneFactureLue[];
  erreurs: { ligne: number; message: string }[];
  /** Il faut au moins un libellé, une quantité et un prix ou un montant. */
  manquants: string[];
}

const TOTAL = /^(sous[ -]?)?totaux?\b|^total\b|^net a payer|^tva\b|^remise globale/;

/**
 * Lit un export de facture (une ligne par article) : en-têtes cherchés dans les 20 premières lignes, prix unitaire
 * déduit du montant s'il manque, lignes de total ignorées, lignes illisibles listées et écartées.
 */
export function lireFactureExport(texte: string): LectureFacture {
  const brut = lireCsv(texte);
  const toutes = brut.entetes.length ? [{ numero: 1, champs: brut.entetes }, ...brut.lignes] : [];
  const k = Math.max(
    0,
    toutes.slice(0, 20).findIndex((l) => {
      const c = devinerColonnesFacture(l.champs);
      return c.libelle !== undefined && c.quantite !== undefined;
    }),
  );
  const entetes = toutes[k]?.champs ?? [];
  const colonnes = devinerColonnesFacture(entetes);
  const manquants = [
    ...(colonnes.libelle === undefined ? ["désignation"] : []),
    ...(colonnes.quantite === undefined ? ["quantité"] : []),
    ...(colonnes.prixUnitaire === undefined && colonnes.montant === undefined ? ["prix unitaire ou montant"] : []),
  ];
  const lecture: LectureFacture = { entetes, colonnes, lignes: [], erreurs: [], manquants };
  if (manquants.length) return lecture;
  for (const { numero, champs } of toutes.slice(k + 1)) {
    const champ = (f: ChampFacture) => (colonnes[f] === undefined ? "" : (champs[colonnes[f]!] ?? "").trim());
    const libelle = champ("libelle");
    if (!libelle && !champ("quantite")) continue; // ligne vide
    if (TOTAL.test(sansAccents(libelle))) continue;
    const quantiteBrute = Number(champ("quantite").replace(/\s/g, "").replace(",", "."));
    const montant = champ("montant") ? lireMontantExport(champ("montant")) : null;
    let prix = champ("prixUnitaire") ? lireMontantExport(champ("prixUnitaire")) : null;
    if (!libelle) {
      lecture.erreurs.push({ ligne: numero, message: "Ligne sans désignation." });
      continue;
    }
    if (!Number.isFinite(quantiteBrute) || quantiteBrute <= 0) {
      lecture.erreurs.push({ ligne: numero, message: `« ${libelle} » : quantité illisible.` });
      continue;
    }
    if (!Number.isInteger(quantiteBrute)) {
      lecture.erreurs.push({ ligne: numero, message: `« ${libelle} » : quantité ${champ("quantite")} non entière (au poids ?) — à saisir à la main.` });
      continue;
    }
    if (prix === null && montant !== null) prix = Math.round(montant / quantiteBrute);
    if (prix === null || prix < 0) {
      lecture.erreurs.push({ ligne: numero, message: `« ${libelle} » : prix illisible.` });
      continue;
    }
    const colis = Number(champ("colis").replace(",", "."));
    lecture.lignes.push({
      codeArticle: champ("code") || null,
      libelle: libelle.slice(0, 160),
      quantite: quantiteBrute,
      prixUnitaire: prix,
      unitesParColis: Number.isInteger(colis) && colis > 1 && colis <= 10_000 ? colis : null,
    });
  }
  return lecture;
}

// ---------- Colis et correspondances ----------

/**
 * Unités par colis devinées dans un libellé : « 24x33cl », « Coca 33 cl x24 », « pack de 6 », « carton 12 btl » ;
 * null si rien ne l'indique.
 */
export function colisDevine(libelle: string): number | null {
  const n = sansAccents(libelle);
  const essais = [
    /\b(\d{1,4})\s*[x×*]\s*\d+(?:[.,]\d+)?\s*(?:cl|ml|l|g|kg|cc)\b/, // 24x33cl
    /\b\d+(?:[.,]\d+)?\s*(?:cl|ml|l|g|kg|cc)\s*[x×*]\s*(\d{1,4})\b/, // 33cl x24
    /(?:^|\s)[x×*]\s*(\d{1,4})\b/, // … x24
    /\b(?:pack|carton|colis|lot|caisse|fardeau|barquette|boite|sachet)\s*(?:de\s*)?(\d{1,4})\b/, // pack de 6
    /\b(\d{1,4})\s*(?:btl|bouteilles|canettes|cans|pieces|pcs|unites|u)\b/, // 12 btl
  ];
  for (const re of essais) {
    const m = n.match(re);
    if (m) {
      const v = Number(m[1]);
      if (v > 1 && v <= 1_000) return v;
    }
  }
  return null;
}

/** Clé d'un article chez un fournisseur : son code s'il en a un, sinon son libellé sans accents ni ponctuation. */
export const cleArticle = (code: string | null, libelle: string) => (code && code.trim() ? `code:${normaliserFournisseur(code)}` : `lib:${normaliserFournisseur(libelle)}`);

export interface CorrespondanceArticle {
  fournisseur: string;
  cle: string;
  libelle: string;
  produitId: string | null;
  unitesParColis: number;
}

/** Ligne de facture ramenée à l'unité vendue : quantité × colis, prix ÷ colis (arrondi au centime). */
export function enUnites(l: { quantite: number; prixUnitaire: Centimes; unitesParColis: number }): { quantite: number; prixUnitaire: Centimes } {
  const k = Math.max(1, l.unitesParColis);
  return { quantite: l.quantite * k, prixUnitaire: Math.round(l.prixUnitaire / k) };
}

// ---------- Alertes avant validation ----------

export interface AlerteFacture {
  /** Ligne concernée ; absent : la facture entière. */
  ligneId?: string;
  type: "total" | "colis" | "prix" | "quantite";
  titre: string;
  detail: string;
}

export const ECART_PRIX_ALERTE = 0.25;
export const MULTIPLE_QUANTITE_ALERTE = 3;

const euros = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;
const mediane = (v: readonly number[]) => {
  const t = [...v].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
};

/**
 * Ce qui paraît faux sur une facture, avant validation : total annoncé ≠ somme des lignes ; colis oublié (le libellé
 * dit « x24 » mais la ligne compte 1 unité par colis) ; prix à l'unité éloigné de plus de 25 % de la dernière livraison
 * du produit ; quantité plus de 3 fois supérieure à l'habitude (médiane des 5 dernières livraisons, 2 au moins).
 * `historique` : livraisons antérieures du produit, hors celles de cette facture, de la plus récente à la plus ancienne.
 */
export function alertesFacture(
  f: { totalAnnonce: Centimes | null; lignes: readonly { id: string; produitId: string | null; libelle: string; quantite: number; prixUnitaire: Centimes; unitesParColis: number }[] },
  historique: (produitId: string) => readonly { quantite: number; prixUnitaire: Centimes }[],
): AlerteFacture[] {
  const alertes: AlerteFacture[] = [];
  const somme = f.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  if (f.totalAnnonce !== null && Math.abs(f.totalAnnonce - somme) > 2) {
    alertes.push({ type: "total", titre: `Total des lignes ${euros(somme)} au lieu de ${euros(f.totalAnnonce)}`, detail: "Une ligne manque, est en double ou mal recopiée : compare avec la facture." });
  }
  for (const l of f.lignes) {
    const devine = colisDevine(l.libelle);
    if (l.unitesParColis === 1 && devine && devine > 1) {
      alertes.push({ ligneId: l.id, type: "colis", titre: `« ${l.libelle} » : colis de ${devine} ?`, detail: `Le libellé parle de ${devine} unités, la ligne en compte 1 par colis : ${l.quantite} entreraient en réserve au lieu de ${l.quantite * devine}.` });
    }
    if (!l.produitId) continue;
    const u = enUnites(l);
    const passe = historique(l.produitId);
    const dernier = passe[0];
    if (dernier && dernier.prixUnitaire > 0 && Math.abs(u.prixUnitaire - dernier.prixUnitaire) / dernier.prixUnitaire > ECART_PRIX_ALERTE) {
      alertes.push({
        ligneId: l.id,
        type: "prix",
        titre: `« ${l.libelle} » : ${euros(u.prixUnitaire)} l'unité, contre ${euros(dernier.prixUnitaire)} à la dernière livraison`,
        detail: "Hausse ou baisse de plus de 25 % : vérifie le prix, ou le nombre d'unités par colis.",
      });
    }
    const quantites = passe.slice(0, 5).map((x) => x.quantite);
    if (quantites.length >= 2 && u.quantite > MULTIPLE_QUANTITE_ALERTE * mediane(quantites)) {
      alertes.push({
        ligneId: l.id,
        type: "quantite",
        titre: `« ${l.libelle} » : ${u.quantite} unités, plus de 3 fois l'habitude (${Math.round(mediane(quantites))})`,
        detail: "Souci de comptage, colis compté en unités, ou vraie grosse commande : à vérifier avant d'entrer en réserve.",
      });
    }
  }
  return alertes;
}
