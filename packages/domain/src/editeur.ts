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
  /** Ouverture du plus ancien événement encore ouvert : un événement oublié se voit ici. */
  plusAncienOuvert: string | null;
  dernierZ: string | null;
  /** Dernier jour du dernier mois clôturé. */
  dernierMoisCloture: string | null;
  /** Mois terminés, avec des événements, pas encore clôturés. */
  moisACloturer: number;
  derniereActivite: string | null;
  derniereVerification: { le: string; ok: boolean } | null;
  options: OptionsLieu;
  directeurs: DirecteurParc[];
  /** Support autorisé par le lieu en ce moment (niveau 2, §15.142) ; null : pas d'autorisation. */
  support: { jusqua: string; motif: string | null } | null;
}

/** Durées d'autorisation du support proposées au lieu (heures). */
export const DUREES_SUPPORT = [1, 4, 24] as const;

/** Paramètres → Support FlaiX Expert (§15.142). */
export interface AutorisationSupport {
  id: string;
  debut: string;
  fin: string;
  motif: string | null;
  accordeePar: string;
  retireeLe: string | null;
  retireePar: string | null;
  /** En cours : ni retirée ni échue. */
  active: boolean;
  /** Ce que le support a consulté pendant cette autorisation. */
  consultations: { route: string; ecran: string; le: string; par: string }[];
}

export interface EtatSupport {
  active: AutorisationSupport | null;
  historique: AutorisationSupport[];
}

/** Écran lisible d'une adresse consultée (« /api/resultats » → « Résultats »). */
export function ecranConsulte(route: string): string {
  const ECRANS: [RegExp, string][] = [
    [/^\/api\/(resultats|finances|pertes|rapports-soiree|periodes)/, "Résultats"],
    [/^\/api\/alertes/, "Centre d'alertes"],
    [/^\/api\/journal-technique/, "Journal technique"],
    [/^\/api\/(caisses|journal|sessions-caisse)/, "Caisses et tickets"],
    [/^\/api\/stock/, "Stock"],
    [/^\/api\/(equipe|planning)/, "Équipe"],
    [/^\/api\/(clotures|evenements|export-comptable)/, "Clôtures et événements"],
    [/^\/api\/(fidelite|wallet)/, "Fidélité"],
    [/^\/api\/factures/, "Factures"],
    [/^\/api\/(lieu|stands|produits|categories|ingredients|recettes|click-collect|couts-buvette|notifications|support|options)/, "Paramètres"],
    [/^\/api\/assistant/, "Assistant"],
  ];
  return ECRANS.find(([r]) => r.test(route))?.[1] ?? route;
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

/** Un événement ouvert depuis plus de 24 h a probablement été oublié. */
export const MATCH_OUBLIE_HEURES = 24;

/** Ce qui mérite l'attention de l'éditeur pour un lieu, en phrases. */
export function alertesLieuParc(l: LieuParc, maintenant: number): string[] {
  const a: string[] = [];
  if (l.plusAncienOuvert && maintenant - Date.parse(l.plusAncienOuvert) > MATCH_OUBLIE_HEURES * 3_600_000) a.push("événement ouvert depuis plus de 24 h");
  if (l.moisACloturer > 0) a.push(`${l.moisACloturer} mois à clôturer`);
  if (l.derniereVerification && !l.derniereVerification.ok) a.push("rupture d'intégrité à la dernière vérification");
  if (!l.exerciceRegle && l.matchsJoues > 0) a.push("exercice comptable non réglé");
  return a;
}

// ---------------------------------------------------------------------------
// Options par lieu, activées par FlaiX Expert (dossier §15.117, §15.118). La base (caisse, clôtures,
// résultats, paramètres, formation) est toujours là ; une option absente des réglages est active.
// ---------------------------------------------------------------------------

export type OptionLieu = "stock" | "equipe" | "fidelite" | "click_collect" | "factures" | "couts_buvette" | "assistant";
export type OptionsLieu = Record<OptionLieu, boolean>;

export const OPTIONS_LIEU: { cle: OptionLieu; libelle: string; aide: string }[] = [
  { cle: "stock", libelle: "Stock", aide: "Mise en place, comptages, réserve, livraisons, ruptures" },
  { cle: "equipe", libelle: "Planning & masse salariale", aide: "Affectations par événement, coût du personnel (les fiches et l'accès caisse restent dans la base)" },
  { cle: "fidelite", libelle: "Fidélité", aide: "Abonnés, points, codes promo" },
  { cle: "click_collect", libelle: "Click & Collect", aide: "Prix sur l'application de commande" },
  { cle: "factures", libelle: "Factures fournisseurs", aide: "Saisie, rapprochement avec les livraisons" },
  { cle: "couts_buvette", libelle: "Coûts par buvette", aide: "Frais et coûts par stand" },
  { cle: "assistant", libelle: "Assistant IA", aide: "Questions en langage courant et brief reformulé par l'IA, hébergée par OVHcloud (payant à l'usage, désactivé par défaut)" },
];

/** Toutes les options sont actives sans réglage, sauf l'assistant IA : chaque question coûte (§15.136). */
export const OPTIONS_PAR_DEFAUT: OptionsLieu = { stock: true, equipe: true, fidelite: true, click_collect: true, factures: true, couts_buvette: true, assistant: false };

/** Option dont dépend une adresse du serveur (null : la base, toujours ouverte). */
export function optionDeLaRoute(url: string): OptionLieu | null {
  if (/^\/api\/stock(\/|$)/.test(url)) return "stock";
  // « Planning & masse salariale » : le planning et la masse salariale. Les fiches employés, l'accès
  // caisse des caissières et les tablettes restent dans la base : la caisse en a besoin (audit P2-002).
  if (/^\/api\/planning(\/|$)/.test(url) || /^\/api\/equipe\/masse-salariale(\/|$)/.test(url)) return "equipe";
  if (/^\/api\/(fidelite|wallet)(\/|$)/.test(url)) return "fidelite";
  if (/^\/api\/click-collect(\/|$)/.test(url)) return "click_collect";
  if (/^\/api\/factures(\/|$)/.test(url)) return "factures";
  if (/^\/api\/couts-buvette(\/|$)/.test(url)) return "couts_buvette";
  if (/^\/api\/assistant(\/|$)/.test(url)) return "assistant";
  return null;
}
