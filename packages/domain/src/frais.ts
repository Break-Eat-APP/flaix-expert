/**
 * « Ce qu'il te reste » et « Mes frais » (dossier §15.154, demande de Rémi du 2026-10-10) : savoir ce que l'on gagne
 * net, une fois TOUS les frais déduits — marchandise, personnel, frais de la soirée, et la part des frais du mois.
 *
 * Frais du mois = frais mensuels de chaque stand (Coûts par buvette : loyer, logiciel, abonnement, TPE) + frais
 * mensuels du lieu (Mes frais : assurance, énergie, salaires hors soirée…), datés : un montant vaut à partir de son
 * mois et jusqu'au suivant. Répartis sur les soirées du mois AU PRORATA DE LEUR CA HT (choix de Rémi, 2026-10-11) :
 *   part de la soirée = frais du mois × CA HT de la soirée ÷ CA HT de toutes les soirées du mois (arrondi au centime).
 * Un mois sans chiffre d'affaires ne se répartit sur aucune soirée : ses frais comptent dans le bilan d'une période
 * qui le contient en entier (jamais perdus, jamais comptés deux fois).
 *
 * « Mes frais » propose une liste de frais courants d'une buvette, pour n'en oublier aucun : chacun est renseigné,
 * déclaré « pas concerné », ou reste à vérifier (rappel dans le centre d'alertes).
 */
import type { Centimes } from "./argent.ts";
import type { ModeDepense } from "./finances.ts";

export type FrequenceFrais = "soiree" | "mois";

export interface FraisSuggere {
  cle: string;
  libelle: string;
  frequence: FrequenceFrais;
  /** Unité habituelle d'un frais de soirée. */
  mode?: ModeDepense;
  /** Frais mensuel saisi stand par stand dans Coûts par buvette (et non dans Mes frais). */
  parStand?: "loyer" | "logiciel" | "abonnement" | "tpe";
  aide: string;
}

export const FRAIS_SUGGERES: readonly FraisSuggere[] = [
  // Chaque soirée
  { cle: "commission_club", libelle: "Commission du club ou du stade", frequence: "soiree", mode: "pourcent", aide: "Souvent un pourcentage du chiffre d'affaires reversé au club ou au propriétaire du stade." },
  { cle: "frais_carte", libelle: "Frais de carte bancaire", frequence: "soiree", mode: "pourcent_carte", aide: "Commission de la banque sur chaque paiement par carte, souvent entre 0,3 et 1,5 %." },
  { cle: "cashless", libelle: "Commission cashless", frequence: "soiree", mode: "pourcent", aide: "Si les ventes passent par un système cashless (Weezevent, bracelets, cartes prépayées)." },
  { cle: "gobelets_perdus", libelle: "Gobelets non rendus", frequence: "soiree", mode: "euros", aide: "Gobelets consignés partis avec les supporters, à racheter." },
  { cle: "glace_gaz", libelle: "Glace, gaz et CO2 de la tireuse", frequence: "soiree", mode: "euros", aide: "Consommables qui ne sont pas dans le coût d'un produit." },
  { cle: "securite", libelle: "Sécurité", frequence: "soiree", mode: "euros", aide: "Agents de sécurité payés par la buvette." },
  { cle: "nettoyage_soiree", libelle: "Nettoyage après le match", frequence: "soiree", mode: "euros", aide: "Prestataire ou heures de nettoyage hors planning." },
  { cle: "location_soiree", libelle: "Location de matériel pour le match", frequence: "soiree", mode: "euros", aide: "Frigo, tireuse ou barnum loués pour un match." },
  { cle: "transport", libelle: "Transport et livraison", frequence: "soiree", mode: "euros", aide: "Camion, carburant, frais de livraison." },
  // Chaque mois, stand par stand (Coûts par buvette)
  { cle: "loyer", libelle: "Loyer ou redevance des stands", frequence: "mois", parStand: "loyer", aide: "Se saisit stand par stand dans Coûts par buvette." },
  { cle: "logiciel", libelle: "Abonnement FlaiX Expert et logiciels", frequence: "mois", parStand: "logiciel", aide: "Se saisit stand par stand dans Coûts par buvette." },
  { cle: "abonnement", libelle: "Autres abonnements des stands", frequence: "mois", parStand: "abonnement", aide: "Se saisit stand par stand dans Coûts par buvette." },
  { cle: "tpe", libelle: "Location des terminaux de carte (TPE)", frequence: "mois", parStand: "tpe", aide: "Se saisit stand par stand dans Coûts par buvette." },
  // Chaque mois, pour tout le lieu
  { cle: "salaires_fixes", libelle: "Salaires hors soirée (gérant, administratif)", frequence: "mois", aide: "Coût chargé des salariés qui ne sont pas au planning des soirées : un oubli fréquent." },
  { cle: "assurance", libelle: "Assurance", frequence: "mois", aide: "Responsabilité civile, multirisque : montant annuel divisé par 12." },
  { cle: "energie", libelle: "Électricité, eau, gaz", frequence: "mois", aide: "Si la buvette les paie (et non le club)." },
  { cle: "telephone", libelle: "Téléphone et internet", frequence: "mois", aide: "Box, forfaits, connexion des caisses." },
  { cle: "comptable", libelle: "Expert-comptable", frequence: "mois", aide: "Honoraires annuels divisés par 12." },
  { cle: "banque", libelle: "Frais bancaires (tenue de compte)", frequence: "mois", aide: "Hors commission sur les paiements par carte, comptée à chaque soirée." },
  { cle: "hygiene", libelle: "Hygiène : produits d'entretien, désinsectisation, analyses", frequence: "mois", aide: "Tout ce que demande l'hygiène et le HACCP." },
  { cle: "tenues", libelle: "Tenues et blanchisserie", frequence: "mois", aide: "Tabliers, t-shirts, lavage." },
  { cle: "entretien", libelle: "Entretien et réparation du matériel", frequence: "mois", aide: "Tireuses, frigos, friteuses, caisses." },
  { cle: "materiel", libelle: "Achat de matériel, étalé sur sa durée", frequence: "mois", aide: "Prix d'achat divisé par le nombre de mois d'utilisation : une tireuse à 3 000 € sur 3 ans = 83 € par mois." },
  { cle: "taxes", libelle: "Taxes (CFE…)", frequence: "mois", aide: "Montant annuel divisé par 12." },
  { cle: "sacem", libelle: "Musique (SACEM)", frequence: "mois", aide: "Si de la musique est diffusée à la buvette." },
];

export const fraisSuggere = (cle: string): FraisSuggere | undefined => FRAIS_SUGGERES.find((f) => f.cle === cle);

/** Part des frais du mois portée par une soirée : au prorata de son CA HT parmi les soirées du mois (0 sans CA). */
export function partDesFrais(fraisDuMois: Centimes, caHtSoiree: Centimes, caHtDuMois: Centimes): Centimes {
  if (fraisDuMois <= 0 || caHtSoiree <= 0 || caHtDuMois <= 0) return 0;
  return Math.round((fraisDuMois * Math.min(caHtSoiree, caHtDuMois)) / caHtDuMois);
}

/** Montant mensuel en vigueur pour le mois `mois` (« AAAA-MM ») : la ligne la plus récente qui a commencé au plus tard ce mois-là. */
export function montantDuMois(lignes: readonly { aPartirDe: string; montant: Centimes }[], mois: string): Centimes {
  let r: { aPartirDe: string; montant: Centimes } | null = null;
  for (const l of lignes) if (l.aPartirDe <= mois && (!r || l.aPartirDe > r.aPartirDe)) r = l;
  return r?.montant ?? 0;
}

/** Les mois « AAAA-MM » entièrement compris entre deux jours « AAAA-MM-JJ » (bornes comprises). */
export function moisComplets(du: string, au: string): string[] {
  const r: string[] = [];
  let [a, m] = [Number(du.slice(0, 4)), Number(du.slice(5, 7))];
  if (du.slice(8) !== "01") [a, m] = m === 12 ? [a + 1, 1] : [a, m + 1];
  for (;;) {
    const cle = `${a}-${String(m).padStart(2, "0")}`;
    const dernier = new Date(Date.UTC(a, m, 0)).getUTCDate();
    if (`${cle}-${String(dernier).padStart(2, "0")}` > au) break;
    r.push(cle);
    [a, m] = m === 12 ? [a + 1, 1] : [a, m + 1];
  }
  return r;
}

/** Frais du mois portés par une soirée ou une période (Résultats → Finances). */
export interface FraisDuMoisPorte {
  mois: string;
  /** Frais du mois : stands (Coûts par buvette) + frais mensuels du lieu (Mes frais). */
  fraisDuMois: Centimes;
  /** CA HT de toutes les soirées du mois. */
  caHtDuMois: Centimes;
  /** Ce que porte la soirée ou la période (tout le mois s'il n'a aucun chiffre d'affaires). */
  part: Centimes;
  /** Mois sans chiffre d'affaires, compté en entier dans la période. */
  sansSoiree: boolean;
}

// ---------- Écran « Mes frais » (réponses du serveur) ----------

export type StatutFrais = "renseigne" | "pas_concerne" | "a_verifier";

export interface FraisMensuel {
  id: string;
  nom: string;
  cle: string | null;
  /** Montant en vigueur ce mois-ci. */
  montant: Centimes;
  /** Historique daté, du plus récent au plus ancien. */
  montants: { aPartirDe: string; montant: Centimes }[];
}

export interface LigneMesFrais {
  /** Clé de la suggestion, ou null pour un frais ajouté par le lieu. */
  cle: string | null;
  libelle: string;
  frequence: FrequenceFrais;
  aide: string | null;
  statut: StatutFrais;
  /** Frais de soirée : le poste de dépense ; frais du mois : le frais mensuel du lieu. */
  posteId: string | null;
  fraisId: string | null;
  /** Frais de soirée : montant habituel (appliqué à chaque soirée sans saisie). */
  modeHabituel: ModeDepense | null;
  valeurHabituelle: number | null;
  /** Frais du mois : montant en vigueur (somme des stands pour un frais par stand). */
  montantMois: Centimes | null;
  parStand: FraisSuggere["parStand"] | null;
  modeSuggere: ModeDepense | null;
}

export interface MesFrais {
  mois: string;
  lignes: LigneMesFrais[];
  /** Frais vérifiés (renseignés ou « pas concerné ») sur le total des frais proposés. */
  verifies: number;
  proposes: number;
  /** Total des frais du mois en cours (stands + lieu). */
  totalMois: Centimes;
}
