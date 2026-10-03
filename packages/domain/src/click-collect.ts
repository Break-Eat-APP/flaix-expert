/**
 * Moteur de prix Click & Collect (dossier §3, §15.20 ter et quater, §15.28, §15.76 ; module 13 validé).
 *
 * Objectif : une vente sur l'application laisse au lieu EXACTEMENT la marge hors taxes d'une vente au
 * comptoir, une fois payées la commission de la plateforme de commande (assise sur le prix buvette) et les frais de paiement
 * (supportés par le lieu, prélevés sur le prix app).
 *
 *   u              = 1 / (1 + TVA du produit)
 *   prix app       = prix buvette × (u + commission × k) ÷ (u − Stripe)
 *   reste comptoir = prix buvette × u
 *   reste app (A)  = A × u − prix buvette × commission × k − A × Stripe
 *
 * k = 1,2 si la TVA (20 %) facturée sur la commission est répercutée au client (réglage prudent par
 * défaut : il protège le lieu qui ne la récupère pas), 1,0 sinon. La majoration dépend donc du taux de
 * TVA du produit : il n'existe pas de pourcentage unique valable pour toute la carte.
 *
 * Stripe : taux + frais fixe par paiement ; le taux effectif se calcule sur le panier moyen de l'app.
 * Montants en centimes, calculs exacts (non arrondis) ; on n'arrondit qu'à l'affichage.
 */
import type { Centimes } from "./argent.ts";

export const TVA_COMMISSION = 0.2;

export interface ReglagesClickCollect {
  /** Commission de la plateforme de commande (0 pour l'application du lieu), en points de base du prix buvette (1000 = 10 %), unique pour le lieu. */
  commissionPb: number;
  /** La TVA facturée sur la commission est-elle répercutée dans le prix app ? */
  tvaCommissionRepercutee: boolean;
  /** Contrat Stripe : pourcentage (points de base) + frais fixe par paiement. */
  stripeTauxPb: number;
  stripeFixe: Centimes;
  /** Panier moyen d'une commande sur l'application (sert au taux Stripe effectif). */
  panierMoyen: Centimes;
}

export type ModeStockCC = "partage" | "dedie" | "app";
export const MODES_STOCK_CC: { valeur: ModeStockCC; libelle: string; aide: string }[] = [
  { valeur: "partage", libelle: "Partagé", aide: "Le stock du stand sert au comptoir et à l'application." },
  { valeur: "dedie", libelle: "Dédié", aide: "Une part du stock est réservée aux commandes de l'application." },
  { valeur: "app", libelle: "100 % app", aide: "Produit vendu uniquement sur l'application." },
];

export const coefficientCommission = (r: Pick<ReglagesClickCollect, "tvaCommissionRepercutee">) => (r.tvaCommissionRepercutee ? 1 + TVA_COMMISSION : 1);

/** Taux Stripe effectif (fraction) : pourcentage du contrat + frais fixe rapporté au panier moyen. */
export function tauxStripeEffectif(r: Pick<ReglagesClickCollect, "stripeTauxPb" | "stripeFixe" | "panierMoyen">): number {
  return r.stripeTauxPb / 10_000 + (r.panierMoyen > 0 ? r.stripeFixe / r.panierMoyen : 0);
}

const u = (tvaPb: number) => 1 / (1 + tvaPb / 10_000);

/** Prix app exact (centimes, non arrondi) qui préserve la marge HT du comptoir ; null si impossible (frais ≥ prix HT). */
export function prixAppExact(prixBuvette: Centimes, tvaPb: number, r: ReglagesClickCollect): number | null {
  const s = tauxStripeEffectif(r);
  const denominateur = u(tvaPb) - s;
  if (denominateur <= 0) return null;
  return (prixBuvette * (u(tvaPb) + (r.commissionPb / 10_000) * coefficientCommission(r))) / denominateur;
}

/** Prix app conseillé, arrondi au centime SUPÉRIEUR : il couvre toujours. */
export function prixAppConseille(prixBuvette: Centimes, tvaPb: number, r: ReglagesClickCollect): Centimes | null {
  const p = prixAppExact(prixBuvette, tvaPb, r);
  return p === null ? null : Math.ceil(p - 1e-9);
}

/** Ce qui reste au lieu, hors taxes, d'une vente au comptoir. */
export const resteComptoir = (prixBuvette: Centimes, tvaPb: number) => prixBuvette * u(tvaPb);

/** Ce qui reste au lieu, hors taxes, d'une vente sur l'application au prix `prixApp`. */
export function resteApp(prixApp: Centimes, prixBuvette: Centimes, tvaPb: number, r: ReglagesClickCollect): number {
  return prixApp * u(tvaPb) - prixBuvette * (r.commissionPb / 10_000) * coefficientCommission(r) - prixApp * tauxStripeEffectif(r);
}

export interface VerdictPrixApp {
  /** Reste app − reste comptoir, par vente (centimes, non arrondi) : négatif = il manque. */
  ecartParVente: number;
  couvre: boolean;
  /** Écart du prix app par rapport au prix buvette, en % (ce que voit le supporter). */
  majorationPct: number;
}

export function verdictPrixApp(prixApp: Centimes, prixBuvette: Centimes, tvaPb: number, r: ReglagesClickCollect): VerdictPrixApp {
  const ecart = resteApp(prixApp, prixBuvette, tvaPb, r) - resteComptoir(prixBuvette, tvaPb);
  return { ecartParVente: ecart, couvre: ecart > -0.5, majorationPct: prixBuvette > 0 ? ((prixApp - prixBuvette) / prixBuvette) * 100 : 0 };
}

export interface CascadeEncaissement {
  paye: number;
  tvaProduit: number;
  stripe: number;
  commissionHt: number;
  /** TVA facturée sur la commission ; « répercutée » = payée par le client dans le prix app. */
  tvaCommission: number;
  /** Reste hors taxes au lieu (TVA sur commission comptée comme un coût si elle est répercutée). */
  reste: number;
}

/** Où part l'argent d'une vente sur l'application : la cascade affichée au directeur. */
export function cascadeEncaissement(prixApp: Centimes, prixBuvette: Centimes, tvaPb: number, r: ReglagesClickCollect): CascadeEncaissement {
  const commissionHt = prixBuvette * (r.commissionPb / 10_000);
  return {
    paye: prixApp,
    tvaProduit: prixApp - prixApp * u(tvaPb),
    stripe: prixApp * tauxStripeEffectif(r),
    commissionHt,
    tvaCommission: r.tvaCommissionRepercutee ? commissionHt * TVA_COMMISSION : 0,
    reste: resteApp(prixApp, prixBuvette, tvaPb, r),
  };
}

/** Écran Click & Collect : réglages du lieu, points de retrait, catalogue vendable sur l'application. */
export interface EtatClickCollect {
  /** null tant que le directeur n'a pas réglé la commission et le contrat Stripe. */
  reglages: ReglagesClickCollect | null;
  pointsRetrait: { id: string; nom: string }[];
  produits: {
    id: string;
    nom: string;
    categorie: string | null;
    prixBuvette: Centimes;
    tauxTva: number;
    prixApp: Centimes | null;
    modeStock: ModeStockCC | null;
    /** Points de retrait (stands C&C) où le produit est vendu. */
    stands: string[];
  }[];
}
