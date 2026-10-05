/**
 * Centre d'alertes (module 18, validé le 2026-09-12 ; dossier §14 module 18, §15.23, §15.140) et rupture de
 * stock poussée sur le téléphone.
 *
 * Il lit ce que les autres modules calculent et ne calcule lui-même que trois comparaisons :
 *   marge configurée   = marge du prix et du coût actuels de la fiche, comparée à sa cible (avant toute vente)
 *   variation          = (prix de la livraison − prix de la précédente, même produit, même fournisseur) ÷ précédente
 *                        alerte à 5 % d'écart ou plus (valeur de test du module 18)
 *   mercuriale         = (coût actuel − prix de référence saisi par le lieu) ÷ prix de référence
 *                        alerte à 10 % au-dessus ou plus (valeur de test du module 18)
 * Chaque alerte chiffre son impact en euros quand il existe ; aucune ne corrige quoi que ce soit.
 */
import { formaterMontant, type Centimes } from "./argent.ts";
import type { UniteIngredient } from "./recettes.ts";
import type { AlerteStock } from "./stock.ts";

export const SEUILS_ALERTES = {
  /** Variation de prix d'un fournisseur entre deux livraisons, en points de base (5 %). */
  variationFournisseurPb: 500,
  /** Coût actuel au-dessus du prix de référence (mercuriale), en points de base (10 %). */
  mercurialePb: 1_000,
} as const;

export type TypeAlerte =
  | "rupture"
  | "stock_faible"
  | "marge_realisee"
  | "perte_stock"
  | "especes"
  | "prix_ticket"
  | "prix_app"
  | "marge_configuree"
  | "variation_fournisseur"
  | "mercuriale";

export interface AlerteCentre {
  /** Clé stable (type et objet de l'alerte). */
  id: string;
  type: TypeAlerte;
  /** en direct (événement ouvert), lue dans un autre module, calculée ici (module 18). */
  source: "en_direct" | "lue" | "calculee";
  niveau: "forte" | "normale";
  titre: string;
  detail: string;
  /** Impact en euros (centimes) ; null quand il ne se chiffre pas. */
  impact: Centimes | null;
  lien: string;
}

const pct = (pb: number) => `${pb > 0 ? "+" : pb < 0 ? "−" : ""}${(Math.abs(pb) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const prixUnite = (prix: Centimes, unite: UniteIngredient | null) => `${formaterMontant(prix)}${unite ? ` le ${unite === "piece" ? "pièce" : unite === "l" ? "litre" : "kilo"}` : ""}`;

/** Fortes d'abord, puis par impact, puis par titre. */
export function trierAlertes(alertes: readonly AlerteCentre[]): AlerteCentre[] {
  return [...alertes].sort((a, b) => (a.niveau === b.niveau ? 0 : a.niveau === "forte" ? -1 : 1) || (b.impact ?? -1) - (a.impact ?? -1) || a.titre.localeCompare(b.titre, "fr"));
}

// ───────────────────── Variation du prix d'un fournisseur ─────────────────────

export interface LivraisonPrix {
  /** « p:<produit> » ou « i:<ingrédient> ». */
  cle: string;
  nom: string;
  fournisseur: string | null;
  /** Prix HT par portion (produit) ou par unité d'achat (ingrédient). */
  prix: Centimes;
  /** Quantité livrée, en portions ou en unités d'achat. */
  quantite: number;
  unite: UniteIngredient | null;
  /** Heure d'enregistrement (ordre des livraisons). */
  le: string;
}

export interface VariationPrix {
  livraison: LivraisonPrix;
  precedente: LivraisonPrix;
  variationPb: number;
  /** Écart de prix × quantité livrée (centimes). */
  impact: Centimes;
}

const memeFournisseur = (a: string | null, b: string | null) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

/** Dernière livraison de chaque produit comparée à la précédente du même fournisseur ; seules celles au-delà du seuil. */
export function variationsFournisseur(livraisons: readonly LivraisonPrix[], seuilPb: number = SEUILS_ALERTES.variationFournisseurPb): VariationPrix[] {
  const parCle = new Map<string, LivraisonPrix[]>();
  for (const l of livraisons) parCle.set(l.cle, [...(parCle.get(l.cle) ?? []), l]);
  const resultat: VariationPrix[] = [];
  for (const liste of parCle.values()) {
    const tries = [...liste].sort((a, b) => Date.parse(a.le) - Date.parse(b.le));
    const derniere = tries.at(-1)!;
    const precedente = tries.slice(0, -1).reverse().find((l) => memeFournisseur(l.fournisseur, derniere.fournisseur));
    if (!precedente || precedente.prix <= 0) continue;
    const variationPb = Math.round(((derniere.prix - precedente.prix) / precedente.prix) * 10_000);
    if (Math.abs(variationPb) < seuilPb) continue;
    resultat.push({ livraison: derniere, precedente, variationPb, impact: Math.round((derniere.prix - precedente.prix) * derniere.quantite) });
  }
  return resultat;
}

export function alerteVariation(v: VariationPrix): AlerteCentre {
  const hausse = v.variationPb > 0;
  const chez = v.livraison.fournisseur ? ` chez ${v.livraison.fournisseur}` : "";
  return {
    id: `variation_fournisseur:${v.livraison.cle}`,
    type: "variation_fournisseur",
    source: "calculee",
    niveau: hausse ? "forte" : "normale",
    titre: `${hausse ? "Hausse" : "Baisse"} du prix de ${v.livraison.nom}${chez} : ${pct(v.variationPb)}`,
    detail: `${prixUnite(v.precedente.prix, v.livraison.unite)} à la livraison précédente, ${prixUnite(v.livraison.prix, v.livraison.unite)} à la dernière : ${hausse ? "+" : "−"}${formaterMontant(Math.abs(v.impact))} sur la quantité livrée.${hausse ? " Le coût matière et la marge de la fiche suivent : vérifie le prix de vente." : ""}`,
    impact: hausse ? v.impact : null,
    lien: "/stock",
  };
}

// ───────────────────── Mercuriale ─────────────────────

export interface LigneMercuriale {
  cle: string;
  type: "produit" | "ingredient";
  id: string;
  nom: string;
  unite: UniteIngredient | null;
  /** Coût actuel : CUMP de la fiche produit, ou prix de l'ingrédient ; null : coût manquant. */
  coutActuel: Centimes | null;
  /** Prix de référence saisi par le lieu ; null : pas de référence. */
  reference: Centimes | null;
  /** Écart du coût actuel à la référence, en points de base ; null sans l'un ou l'autre. */
  ecartPb: number | null;
  saisiPar: string | null;
  saisiLe: string | null;
}

export function ecartMercuriale(coutActuel: Centimes | null, reference: Centimes | null): number | null {
  if (coutActuel === null || reference === null || reference <= 0) return null;
  return Math.round(((coutActuel - reference) / reference) * 10_000);
}

/** Alerte de mercuriale : coût au moins 10 % au-dessus de la référence ; impact = écart × ventes du dernier événement (produit). */
export function alerteMercuriale(l: LigneMercuriale, ventesDernierEvenement: number | null, seuilPb: number = SEUILS_ALERTES.mercurialePb): AlerteCentre | null {
  if (l.ecartPb === null || l.ecartPb < seuilPb) return null;
  const ecart = l.coutActuel! - l.reference!;
  const impact = l.type === "produit" && ventesDernierEvenement ? ecart * ventesDernierEvenement : null;
  return {
    id: `mercuriale:${l.cle}`,
    type: "mercuriale",
    source: "calculee",
    niveau: "normale",
    titre: `${l.nom} : coût ${pct(l.ecartPb)} au-dessus de ta référence`,
    detail: `Coût actuel ${prixUnite(l.coutActuel!, l.unite)}, référence ${prixUnite(l.reference!, l.unite)} : ${formaterMontant(ecart)} de plus ${l.type === "produit" ? "par vente" : `par ${l.unite === "piece" ? "pièce" : l.unite === "l" ? "litre" : "kilo"}`}${impact ? `, soit ${formaterMontant(impact)} sur les ${ventesDernierEvenement} ventes du dernier événement` : ""}. Fournisseur à renégocier, ou référence à mettre à jour.`,
    impact,
    lien: "/alertes#mercuriale",
  };
}

// ───────────────────── Marge configurée ─────────────────────

export interface ProduitConfigure {
  id: string;
  nom: string;
  tauxPb: number;
  ciblePb: number;
  /** Écart de marge par vente au prix actuel (centimes, négatif = il manque). */
  ecartParVente: number;
  ventesDernierEvenement: number | null;
}

export function alerteMargeConfiguree(p: ProduitConfigure): AlerteCentre {
  const impact = p.ventesDernierEvenement ? Math.round(-p.ecartParVente * p.ventesDernierEvenement) : null;
  return {
    id: `marge_configuree:${p.id}`,
    type: "marge_configuree",
    source: "calculee",
    niveau: "normale",
    titre: `${p.nom} : marge de ${(p.tauxPb / 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % au prix actuel, pour une cible de ${(p.ciblePb / 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
    detail: `Il manque ${formaterMontant(Math.round(-p.ecartParVente))} par vente${impact ? `, soit ${formaterMontant(impact)} sur les ${p.ventesDernierEvenement} ventes du dernier événement` : ""}. Prix ou coût à revoir avant le prochain événement.`,
    impact,
    lien: "/parametres/produits",
  };
}

// ───────────────────── Rupture poussée sur le téléphone ─────────────────────

export interface ReglagesAlertesPoussees {
  rupture: boolean;
  faible: boolean;
}

/** Niveau à pousser pour une ligne de stock, selon les réglages du lieu ; null : rien à pousser. */
export function niveauAPousser(alerte: AlerteStock, reglages: ReglagesAlertesPoussees): "rupture" | "faible" | null {
  if (alerte === "rupture") return reglages.rupture ? "rupture" : null;
  if (alerte === "faible") return reglages.faible ? "faible" : null;
  return null;
}

/** Texte de la notification : « Rupture : Frites à Buvette Nord » — « reste 0 sur 120 · vendu 120 ». */
export function texteAlerteStock(a: { niveau: "rupture" | "faible"; produit: string; stand: string; restant: number; depart: number; reassort: number; vendu: number }): { titre: string; corps: string } {
  const sur = a.depart + a.reassort;
  return {
    titre: `${a.niveau === "rupture" ? "Rupture" : "Stock faible"} : ${a.produit} à ${a.stand}`,
    corps: `Reste ${Math.max(0, a.restant)} sur ${sur} · vendu ${a.vendu}. Touche pour un réassort depuis « En direct ».`,
  };
}

/** Réponse de GET /api/alertes. */
export interface CentreAlertes {
  evenementEnCours: { id: string; libelle: string } | null;
  dernierEvenement: { id: string; libelle: string; debut: string } | null;
  alertes: AlerteCentre[];
  mercuriale: LigneMercuriale[];
  reglages: ReglagesAlertesPoussees;
  seuils: typeof SEUILS_ALERTES;
}
