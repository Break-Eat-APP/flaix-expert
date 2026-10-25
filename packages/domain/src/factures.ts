/**
 * Factures fournisseurs (module 12b validé ; dossier §14 module 12b, §15.115).
 *
 * Chaque ligne de facture se confronte à une livraison DÉJÀ saisie dans le Stock (même produit, même
 * fournisseur, date proche) — aucune ressaisie. Les écarts sont signalés, jamais corrigés : une
 * facture peut avoir raison contre une livraison mal saisie, ou l'inverse ; c'est un humain qui tranche.
 *
 *   écart de quantité     = quantité facturée − quantité livrée
 *   impact de l'écart prix = (prix facturé − prix de la livraison) × quantité livrée     (en euros, pas l'écart brut)
 *   seuil                 = max(0,50 €, 1 % du montant livré)    ← validée par Rémi le 2026-10-01 (§15.117)
 *   ligne rapprochée      = |impact prix| ≤ seuil ET écart de quantité = 0
 */
import type { Centimes } from "./argent.ts";

export const SEUIL_MINIMUM_ECART: Centimes = 50;
export const SEUIL_RELATIF_ECART = 0.01;
/** Fenêtre de recherche d'une livraison autour de la date de facture (jours). */
export const JOURS_AVANT_FACTURE = 45;
export const JOURS_APRES_FACTURE = 7;

export interface LivraisonCandidate {
  id: string;
  produitId: string;
  fournisseur: string | null;
  /** AAAA-MM-JJ */
  date: string;
  quantite: number;
  /** Prix unitaire HT saisi à la livraison. */
  prixUnitaire: Centimes;
}

export interface LigneFactureSaisie {
  produitId: string | null;
  quantite: number;
  prixUnitaire: Centimes;
}

export const normaliserFournisseur = (s: string | null) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const jours = (a: string, b: string) => (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

/** Livraisons qui peuvent correspondre à une ligne : même produit, même fournisseur, date dans la fenêtre. */
export function livraisonsCandidates(ligne: LigneFactureSaisie, fournisseur: string, dateFacture: string, livraisons: LivraisonCandidate[]): LivraisonCandidate[] {
  if (!ligne.produitId) return [];
  const f = normaliserFournisseur(fournisseur);
  return livraisons.filter((l) => {
    const d = jours(l.date, dateFacture);
    return l.produitId === ligne.produitId && normaliserFournisseur(l.fournisseur) === f && d >= -JOURS_AVANT_FACTURE && d <= JOURS_APRES_FACTURE;
  });
}

/**
 * Rapprochement automatique de toutes les lignes d'une facture : chaque livraison sert au plus une fois ;
 * on préfère la même quantité, puis la date la plus proche. `imposees` : choix déjà faits par le directeur.
 */
export function rapprocherFacture(
  lignes: LigneFactureSaisie[],
  fournisseur: string,
  dateFacture: string,
  livraisons: LivraisonCandidate[],
  imposees: (string | null | undefined)[] = [],
  dejaPrises: Set<string> = new Set(),
): (LivraisonCandidate | null)[] {
  const prises = new Set(dejaPrises);
  imposees.forEach((id) => id && prises.add(id));
  return lignes.map((ligne, i) => {
    const imposee = imposees[i];
    if (imposee) return livraisons.find((l) => l.id === imposee) ?? null;
    const choix = livraisonsCandidates(ligne, fournisseur, dateFacture, livraisons)
      .filter((l) => !prises.has(l.id))
      .sort((a, b) => Number(a.quantite !== ligne.quantite) - Number(b.quantite !== ligne.quantite) || Math.abs(jours(a.date, dateFacture)) - Math.abs(jours(b.date, dateFacture)))[0];
    if (!choix) return null;
    prises.add(choix.id);
    return choix;
  });
}

export interface EcartLigne {
  ecartQuantite: number;
  /** Impact en euros de l'écart de prix, sur la quantité livrée. */
  impactPrix: Centimes;
  seuil: Centimes;
  rapprochee: boolean;
}

export function ecartLigne(ligne: LigneFactureSaisie, livraison: Pick<LivraisonCandidate, "quantite" | "prixUnitaire">): EcartLigne {
  const impactPrix = (ligne.prixUnitaire - livraison.prixUnitaire) * livraison.quantite;
  const seuil = Math.max(SEUIL_MINIMUM_ECART, Math.round(SEUIL_RELATIF_ECART * livraison.quantite * livraison.prixUnitaire));
  const ecartQuantite = ligne.quantite - livraison.quantite;
  return { ecartQuantite, impactPrix, seuil, rapprochee: Math.abs(impactPrix) <= seuil && ecartQuantite === 0 };
}

export type StatutFacture = "recue" | "rapprochee" | "ecart" | "validee" | "payee";
export const LIBELLES_STATUT_FACTURE: Record<StatutFacture, string> = {
  recue: "Reçue — à rapprocher",
  rapprochee: "Rapprochée",
  ecart: "En écart",
  validee: "Validée",
  payee: "Payée",
};

/** Statut tant que la facture n'est ni validée ni payée : les lignes sans produit (frais divers) ne bloquent pas. */
export function statutRapprochement(lignes: { produitId: string | null; ecart: EcartLigne | null }[]): "recue" | "rapprochee" | "ecart" {
  const produits = lignes.filter((l) => l.produitId);
  if (produits.some((l) => l.ecart === null)) return produits.some((l) => l.ecart && !l.ecart.rapprochee) ? "ecart" : "recue";
  return produits.some((l) => !l.ecart!.rapprochee) ? "ecart" : "rapprochee";
}

export const totalHtFacture = (lignes: Pick<LigneFactureSaisie, "quantite" | "prixUnitaire">[]) => lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

// ---------------------------------------------------------------------------
// Écrans
// ---------------------------------------------------------------------------

export interface LigneFactureVue {
  id: string;
  produitId: string | null;
  libelle: string;
  quantite: number;
  prixUnitaire: Centimes;
  /** Unités vendues par unité facturée (§15.173) : 24 pour un colis de 24 canettes. */
  unitesParColis: number;
  codeArticle: string | null;
  /** Produit fabriqué (il a une recette) : il ne se livre pas, la validation ne le fait pas entrer en réserve. */
  produitFabrique: boolean;
  livraison: LivraisonCandidate | null;
  /** Le rapprochement a été choisi par le directeur (sinon : proposé automatiquement). */
  livraisonChoisie: boolean;
  ecart: EcartLigne | null;
  /** Autres livraisons possibles pour cette ligne. */
  candidates: LivraisonCandidate[];
}

export interface FactureVue {
  id: string;
  fournisseur: string;
  numero: string;
  dateFacture: string;
  echeance: string | null;
  totalHt: Centimes;
  /** Total HT écrit sur la facture (§15.173) ; null : non saisi. */
  totalAnnonce: Centimes | null;
  statut: StatutFacture;
  lignes: LigneFactureVue[];
  /** Ce qui paraît faux avant validation (§15.173) ; vide une fois validée. */
  alertes: import("./factures-import.ts").AlerteFacture[];
  fichier: { nom: string; type: string; taille: number } | null;
  validation: { par: string; le: string; motif: string | null } | null;
  paiement: { par: string; le: string; date: string } | null;
  creePar: string;
  creeLe: string;
}

export interface EtatFactures {
  factures: FactureVue[];
  /** Fournisseurs déjà connus (livraisons et factures), pour la saisie. */
  fournisseurs: string[];
}

// ---------------------------------------------------------------------------
// Export pour le comptable (§15.172)
// ---------------------------------------------------------------------------

export interface LigneRecapFacture {
  type: "Achat" | "Vente";
  date: string;
  numero: string;
  tiers: string;
  ht: Centimes;
  /** Inconnus pour une facture fournisseur (saisie en HT). */
  tva: Centimes | null;
  ttc: Centimes | null;
  statut: string;
  payeeLe: string | null;
  /** Chemin de la pièce dans le zip ; null : aucune pièce jointe. */
  piece: string | null;
}

/** Nom de fichier sans caractère interdit par Windows ou macOS. */
export const nomDeFichier = (s: string) => s.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120);

/**
 * Récapitulatif des factures d'une période, au format CSV d'Excel en France : séparateur « ; », virgule décimale, BOM
 * UTF-8 pour les accents. Trié par date, achats puis ventes.
 */
export function csvRecapFactures(lignes: readonly LigneRecapFacture[]): string {
  const montant = (c: Centimes | null) => (c === null ? "" : (c / 100).toFixed(2).replace(".", ","));
  const champ = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // Un texte saisi qui commence par = + - @ serait lu par Excel comme une formule (injection) : précédé d'une apostrophe.
  const texte = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
  const date = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");
  const tri = [...lignes].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type) || a.numero.localeCompare(b.numero));
  const corps = tri.map((l) =>
    [l.type, date(l.date), texte(l.numero), texte(l.tiers), montant(l.ht), montant(l.tva), montant(l.ttc), l.statut, date(l.payeeLe), l.piece ?? "aucune pièce jointe"].map(champ).join(";"),
  );
  return "\uFEFF" + ["Type;Date;Numéro;Fournisseur ou client;HT;TVA;TTC;Statut;Payée le;Pièce", ...corps].join("\r\n") + "\r\n";
}
