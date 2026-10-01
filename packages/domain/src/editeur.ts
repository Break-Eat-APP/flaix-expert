/**
 * Back-office éditeur, niveau 1 (module 17 ; dossier §15.13, §15.116) : supervision technique du parc.
 * Aucun montant, aucun ticket, aucun nom de salarié : des dates, des compteurs et des états.
 */
export interface LieuParc {
  lieuId: string;
  nom: string;
  raisonSociale: string | null;
  creeLe: string;
  standsActifs: number;
  caissesActives: number;
  tablettes: number;
  /** Premier mois de l'exercice réglé (sinon la clôture d'exercice est impossible). */
  exerciceRegle: boolean;
  matchsJoues: number;
  matchsOuverts: number;
  /** Ouverture du plus ancien match encore ouvert : un match oublié se voit ici. */
  plusAncienOuvert: string | null;
  dernierZ: string | null;
  /** Dernier jour du dernier mois clôturé. */
  dernierMoisCloture: string | null;
  /** Mois terminés, avec des matchs, pas encore clôturés. */
  moisACloturer: number;
  derniereActivite: string | null;
  derniereVerification: { le: string; ok: boolean } | null;
}

export interface ParcEditeur {
  version: string;
  environnement: "developpement" | "test" | "production";
  lieux: LieuParc[];
}

export interface VerificationEditeur {
  ok: boolean;
  caisses: { ok: boolean; nombre: number; ruptures: number[] };
  journalTechnique: { ok: boolean; maillons: number };
  clotures: { ok: boolean; maillons: number };
}

/** Un match ouvert depuis plus de 24 h a probablement été oublié. */
export const MATCH_OUBLIE_HEURES = 24;

/** Ce qui mérite l'attention de l'éditeur pour un lieu, en phrases. */
export function alertesLieuParc(l: LieuParc, maintenant: number): string[] {
  const a: string[] = [];
  if (l.plusAncienOuvert && maintenant - Date.parse(l.plusAncienOuvert) > MATCH_OUBLIE_HEURES * 3_600_000) a.push("match ouvert depuis plus de 24 h");
  if (l.moisACloturer > 0) a.push(`${l.moisACloturer} mois à clôturer`);
  if (l.derniereVerification && !l.derniereVerification.ok) a.push("rupture d'intégrité à la dernière vérification");
  if (!l.exerciceRegle && l.matchsJoues > 0) a.push("exercice comptable non réglé");
  return a;
}
