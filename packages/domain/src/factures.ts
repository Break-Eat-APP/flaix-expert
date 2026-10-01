/**
 * Factures fournisseurs (module 12b validé ; dossier §14 module 12b, §15.115).
 *
 * Chaque ligne de facture se confronte à une livraison DÉJÀ saisie dans le Stock (même produit, même
 * fournisseur, date proche) — aucune ressaisie. Les écarts sont signalés, jamais corrigés : une
 * facture peut avoir raison contre une livraison mal saisie, ou l'inverse ; c'est un humain qui tranche.
 *
 *   écart de quantité     = quantité facturée − quantité livrée
 *   impact de l'écart prix = (prix facturé − prix de la livraison) × quantité livrée     (en euros, pas l'écart brut)
 *   seuil                 = max(0,50 €, 1 % du montant livré)    ← recommandation du dossier, à confirmer
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
  statut: StatutFacture;
  lignes: LigneFactureVue[];
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
