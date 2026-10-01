/**
 * Coûts par buvette (module 8 ; dossier §15.83, §15.84, §15.113).
 *
 * Pour un mois et pour chaque stand :
 *   frais de structure = frais mensuels du stand en vigueur ce mois-là (loyer, logiciel, abonnement, TPE)
 *   coût matière       = Σ quantités vendues × coût matière du produit (lu comme dans Résultats)
 *   masse salariale    = Σ coûts réels des affectations du stand (lu comme dans Équipe)
 *   total              = frais + coût matière + masse salariale
 *   reste              = CA HT − total   (avant commission Break Eat et charges du lieu non saisies ici)
 */
import type { Centimes } from "./argent.ts";

export type PosteStructure = "loyer" | "logiciel" | "abonnement" | "tpe";
export const POSTES_STRUCTURE: { cle: PosteStructure; libelle: string }[] = [
  { cle: "loyer", libelle: "Loyer" },
  { cle: "logiciel", libelle: "Logiciel" },
  { cle: "abonnement", libelle: "Abonnement" },
  { cle: "tpe", libelle: "TPE" },
];

export interface FraisDate {
  standId: string;
  poste: PosteStructure;
  /** « AAAA-MM » : premier mois où le montant s'applique. */
  aPartirDe: string;
  montant: Centimes;
}

/** Frais mensuels d'un stand en vigueur pour le mois `mois` : la ligne la plus récente qui a commencé au plus tard ce mois-là. */
export function fraisDuMois(frais: FraisDate[], standId: string, mois: string): Record<PosteStructure, Centimes> {
  const r: Record<PosteStructure, Centimes> = { loyer: 0, logiciel: 0, abonnement: 0, tpe: 0 };
  for (const p of POSTES_STRUCTURE) {
    const enVigueur = frais
      .filter((f) => f.standId === standId && f.poste === p.cle && f.aPartirDe <= mois)
      .sort((a, b) => b.aPartirDe.localeCompare(a.aPartirDe))[0];
    r[p.cle] = enVigueur?.montant ?? 0;
  }
  return r;
}

export interface CoutsStand {
  standId: string;
  nom: string;
  actif: boolean;
  caHt: Centimes;
  frais: Record<PosteStructure, Centimes>;
  coutMatiere: Centimes;
  /** Produits vendus sans coût matière : leur coût manque dans le total (jamais compté 0 en silence). */
  produitsSansCout: string[];
  masseSalariale: Centimes;
  /** Affectations sans taux horaire : leur coût manque dans le total. */
  affectationsSansTaux: number;
  total: Centimes;
  reste: Centimes;
}

export const totalFrais = (f: Record<PosteStructure, Centimes>) => f.loyer + f.logiciel + f.abonnement + f.tpe;

export function coutsDuStand(x: Omit<CoutsStand, "total" | "reste">): CoutsStand {
  const total = totalFrais(x.frais) + x.coutMatiere + x.masseSalariale;
  return { ...x, total, reste: x.caHt - total };
}

/** Parts du camembert, pour tout le lieu : coût matière, masse salariale, puis chaque poste de frais. */
export function repartitionCouts(stands: Pick<CoutsStand, "coutMatiere" | "masseSalariale" | "frais">[], masseHorsStand: Centimes): { libelle: string; montant: Centimes }[] {
  const somme = (f: (s: Pick<CoutsStand, "coutMatiere" | "masseSalariale" | "frais">) => number) => stands.reduce((t, s) => t + f(s), 0);
  return [
    { libelle: "Coût matière", montant: somme((s) => s.coutMatiere) },
    { libelle: "Masse salariale", montant: somme((s) => s.masseSalariale) + masseHorsStand },
    ...POSTES_STRUCTURE.map((p) => ({ libelle: p.libelle, montant: somme((s) => s.frais[p.cle]) })),
  ];
}

/** Paramètres → Coûts par buvette. */
export interface CoutsBuvette {
  /** Mois qui ont au moins un match, du plus récent au plus ancien. */
  moisDisponibles: { cle: string; libelle: string; matchs: number }[];
  cle: string | null;
  libelle: string;
  matchs: number;
  stands: CoutsStand[];
  /** Personnel affecté sans stand (Click & Collect, renfort général) : compté dans le total du lieu. */
  horsStand: { masseSalariale: Centimes; affectations: number };
  /** Tous les frais saisis, datés, pour la grille de saisie. */
  frais: FraisDate[];
}
