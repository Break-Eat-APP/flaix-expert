/**
 * Back-office éditeur, niveau 1 (module 17 ; dossier §15.13, §15.116) : supervision technique du parc.
 * Aucun montant, aucun ticket, aucun nom de salarié : des dates, des compteurs et des états. Seule exception :
 * les directeurs (nom, e-mail), contact du client que FlaiX Expert crée lui-même (§15.122).
 */
export interface DirecteurParc {
  utilisateurId: string;
  nom: string;
  email: string;
  actif: boolean;
}

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
  options: OptionsLieu;
  directeurs: DirecteurParc[];
}

export interface ParcEditeur {
  version: string;
  environnement: "developpement" | "test" | "production";
  lieux: LieuParc[];
}

/** Compte directeur créé ou rattaché depuis le back-office : le mot de passe provisoire n'est donné qu'une fois. */
export interface DirecteurRemis {
  email: string;
  /** null : le compte existait déjà, il garde son mot de passe. */
  motDePasseProvisoire: string | null;
}

export interface LieuCree {
  lieuId: string;
  nom: string;
  directeur: DirecteurRemis;
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

// ---------------------------------------------------------------------------
// Options par lieu, activées par FlaiX Expert (dossier §15.117, §15.118). La base (caisse, clôtures,
// résultats, paramètres, formation) est toujours là ; une option absente des réglages est active.
// ---------------------------------------------------------------------------

export type OptionLieu = "stock" | "equipe" | "fidelite" | "click_collect" | "factures" | "export_comptable" | "couts_buvette";
export type OptionsLieu = Record<OptionLieu, boolean>;

export const OPTIONS_LIEU: { cle: OptionLieu; libelle: string; aide: string }[] = [
  { cle: "stock", libelle: "Stock", aide: "Mise en place, comptages, réserve, livraisons, ruptures" },
  { cle: "equipe", libelle: "Planning & masse salariale", aide: "Affectations par match, coût du personnel" },
  { cle: "fidelite", libelle: "Fidélité", aide: "Abonnés, points, codes promo" },
  { cle: "click_collect", libelle: "Click & Collect", aide: "Prix sur l'application Break Eat" },
  { cle: "factures", libelle: "Factures fournisseurs", aide: "Saisie, rapprochement avec les livraisons" },
  { cle: "export_comptable", libelle: "Export comptable", aide: "Fichiers pour l'expert-comptable" },
  { cle: "couts_buvette", libelle: "Coûts par buvette", aide: "Frais et coûts par stand" },
];

export const OPTIONS_PAR_DEFAUT: OptionsLieu = { stock: true, equipe: true, fidelite: true, click_collect: true, factures: true, export_comptable: true, couts_buvette: true };

/** Option dont dépend une adresse du serveur (null : la base, toujours ouverte). */
export function optionDeLaRoute(url: string): OptionLieu | null {
  if (/^\/api\/stock(\/|$)/.test(url)) return "stock";
  if (/^\/api\/planning(\/|$)/.test(url)) return "equipe";
  if (/^\/api\/fidelite(\/|$)/.test(url)) return "fidelite";
  if (/^\/api\/click-collect(\/|$)/.test(url)) return "click_collect";
  if (/^\/api\/factures(\/|$)/.test(url)) return "factures";
  if (/^\/api\/export-comptable(\/|$)/.test(url)) return "export_comptable";
  if (/^\/api\/couts-buvette(\/|$)/.test(url)) return "couts_buvette";
  return null;
}
