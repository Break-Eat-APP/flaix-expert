/**
 * Modèle canonique (dossier §5) — formes échangées entre le serveur et les écrans.
 * Les montants sont en centimes, les taux de TVA en points de base.
 */
import type { Centimes } from "./argent.ts";
import type { TauxTvaPb } from "./tva.ts";
import type { TypeJet } from "./journal-technique.ts";
import type { ContexteScellement, TeteChaine } from "./caisse-scellee.ts";

export type Role = "directeur" | "operateur" | "verificateur";

export interface SessionInfo {
  /** E-mail absent pour une caissière, qui se connecte avec un code (dossier §15.100). */
  utilisateur: { id: string; nom: string; email: string | null };
  lieu: { id: string; nom: string };
  role: Role;
  /** Caissière : la tablette enregistrée où elle s'est connectée, et la seule caisse qu'elle peut utiliser. */
  appareil: { id: string; caisseId: string } | null;
  /** Hors production, l'écran affiche un bandeau permanent (aucune vente réelle). */
  environnement: "developpement" | "test" | "production";
}

export interface Lieu {
  id: string;
  nom: string;
  raisonSociale: string | null;
  siret: string | null;
  tvaIntracom: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  /** Remise contractuelle des abonnés, en points de base (1 500 = 15 %) ; null tant que non réglée. */
  remiseAbonnePb: number | null;
  /** Tolérance d'écart d'espèces au comptage du tiroir, en centimes (module 7) ; au-delà, motif obligatoire. */
  seuilEcartEspeces: Centimes;
}

export type IdentiteLieu = Omit<Lieu, "id" | "remiseAbonnePb" | "seuilEcartEspeces">;

export interface Caisse {
  id: string;
  standId: string;
  numero: number;
  nom: string | null;
  especesAutorisees: boolean;
  actif: boolean;
}

export interface Stand {
  id: string;
  nom: string;
  pointRetraitCc: boolean;
  actif: boolean;
  caisses: Caisse[];
}

export interface Categorie {
  id: string;
  nom: string;
  actif: boolean;
}

export interface Tarif {
  id: string;
  prixTtc: Centimes;
  tauxTva: TauxTvaPb;
  valideDu: string; // ISO 8601
  saisiPar: string; // nom de la personne
  saisiLe: string; // ISO 8601
}

export interface Produit {
  id: string;
  nom: string;
  categorieId: string | null;
  coutMatiere: Centimes | null;
  actif: boolean;
  standIds: string[];
  /** Tarif en vigueur maintenant ; null seulement si le seul tarif saisi prend effet plus tard. */
  tarifEnVigueur: Tarif | null;
  /** Prochain tarif déjà programmé, s'il y en a un. */
  tarifAVenir: Tarif | null;
}

export interface EntreeJournalTechnique {
  numero: number;
  horodatage: string;
  type: TypeJet;
  libelle: string;
  auteur: string | null;
  standId: string | null;
  caisseId: string | null;
  details: Record<string, unknown>;
  empreinte: string;
}

// ---------------------------------------------------------------------------
// Matchs, caisses, tickets (étape 1, dossier §15.94)
// ---------------------------------------------------------------------------

export type EtatEvenement = "a_venir" | "ouvert" | "clos";

export interface Evenement {
  id: string;
  libelle: string;
  debut: string; // ISO 8601
  spectateurs: number | null;
  etat: EtatEvenement;
  ouvertLe: string | null;
  closLe: string | null;
  caissesOuvertes: number;
}

export interface SessionCaisseVue {
  id: string;
  evenementId: string;
  evenementLibelle: string;
  ouverteLe: string;
  ouvertePar: string;
  fond: Centimes | null;
}

export interface ProduitCaisse {
  id: string;
  nom: string;
  categorieId: string | null;
  categorie: string | null;
  prixTtc: Centimes;
  tauxTva: TauxTvaPb;
}

export interface EcranCaisse {
  caisse: { id: string; numero: number; nom: string | null; standId: string; standNom: string; especesAutorisees: boolean; actif: boolean };
  standActif: boolean;
  session: SessionCaisseVue | null;
  evenementOuvert: { id: string; libelle: string } | null;
  produits: ProduitCaisse[];
  remiseAbonnePb: number | null;
  environnementTest: boolean;
}

export interface LigneTicketVue {
  produitId: string;
  libelle: string;
  quantite: number;
  prixUnitaire: Centimes;
  tauxTva: TauxTvaPb;
  brut: Centimes;
  remise: Centimes;
  offert: Centimes;
  net: Centimes;
  ht: Centimes;
  tva: Centimes;
}

export interface TicketVue {
  id: string;
  type: "vente" | "annulation";
  numeroJustificatif: string;
  horodatage: string;
  evenementId: string;
  caisseId: string;
  caisseNumero: number;
  standId: string;
  standNom: string;
  operateur: string;
  modeReglement: "especes" | "carte";
  totalTtc: Centimes;
  brut: Centimes;
  remise: Centimes;
  offert: Centimes;
  motif: string | null;
  motifTexte: string | null;
  reference: string | null;
  montantDonne: Centimes | null;
  rendu: Centimes | null;
  lignes: LigneTicketVue[];
  ventilation: { tauxTva: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  /** Pour une vente annulée : le justificatif de l'annulation. Pour une annulation : le justificatif annulé. */
  lie: { id: string; numeroJustificatif: string } | null;
  empreinte: string;
  /** Heure de réception par le serveur (null : reçu à l'instant de la vente, avant le §15.97). */
  recuLe: string | null;
  /** Contrôles signalés à la réception, sans refus (§15.97 point 4). */
  controle: ControleTicket | null;
}

/** Ce que le serveur a remarqué en recevant un ticket scellé par la tablette — signalé, jamais refusé. */
export interface ControleTicket {
  /** Reçu plus d'une minute après sa création : enregistré pendant une coupure de réseau. */
  horsLigne?: boolean;
  delaiSecondes?: number;
  /** Prix ou taux de TVA différent du tarif en vigueur à l'heure de la vente. */
  ecartTarif?: { produitId: string; libelle: string; prixVendu: Centimes; tauxVendu: number; prixTarif: Centimes | null; tauxTarif: number | null }[];
  /** Produits qui ne sont plus vendus à ce stand. */
  horsStand?: string[];
  /** Remise abonné à un autre taux que celui du lieu. */
  remiseAbonneEcart?: { applique: number; lieu: number | null };
  /** Heure de vente antérieure à l'ouverture de la caisse ou postérieure à la réception. */
  horodatageIncoherent?: boolean;
}

/** Remis à la tablette à l'ouverture ou à la reprise d'une caisse : de quoi sceller seule (§15.97). */
export interface RepriseCaisse {
  contexte: ContexteScellement;
  tete: TeteChaine;
  /** Jeton d'appareil, remis une seule fois ; le serveur n'en garde que l'empreinte. */
  jeton: string;
  heureServeur: string;
}

export interface ReponseSynchro {
  tete: TeteChaine;
  recus: number;
  deja: number;
}

export interface StatsCaisse {
  caisseId: string;
  numero: number;
  nom: string | null;
  standId: string;
  standNom: string;
  actif: boolean;
  especesAutorisees: boolean;
  /** Session ouverte en ce moment, quel que soit le match affiché. */
  ouverteMaintenant: { par: string; depuis: string; evenementLibelle: string } | null;
  nbVentes: number;
  nbAnnulations: number;
  caNet: Centimes;
  panierMoyen: Centimes | null;
  especes: Centimes;
  carte: Centimes;
  dernierTicket: string | null;
}

// ---------------------------------------------------------------------------
// Clôture du match (dossier §15.102) : ventes, restes, espèces, clôture
// ---------------------------------------------------------------------------

/** Comptage du tiroir d'une session de caisse (le « Z »), ou rectification qui s'y ajoute. */
export interface ComptageEspeces {
  id: string;
  type: "comptage" | "rectification";
  refComptage: string | null;
  coupures: Record<string, number>;
  fond: Centimes;
  especes: Centimes;
  sorties: Centimes;
  attendu: Centimes;
  compte: Centimes;
  ecart: Centimes;
  seuil: Centimes;
  motif: string | null;
  signature: string | null;
  par: string;
  le: string;
}

/** Une session de caisse du match, vue depuis la clôture. */
export interface SessionACloturer {
  sessionId: string;
  caisseId: string;
  caisseNumero: number;
  caisseNom: string | null;
  standNom: string;
  ouvertePar: string;
  ouverteLe: string;
  fermeeLe: string | null;
  nbVentes: number;
  nbAnnulations: number;
  net: Centimes;
  especes: Centimes;
  carte: Centimes;
  /** null : caisse « carte uniquement », pas de tiroir à compter. */
  fond: Centimes | null;
  attendu: Centimes | null;
  comptage: ComptageEspeces | null;
  rectifications: ComptageEspeces[];
}

export interface ClotureMatch {
  evenement: Evenement;
  seuilEcartEspeces: Centimes;
  sessions: SessionACloturer[];
  etapes: {
    /** Toutes les caisses du match sont clôturées. */
    ventes: boolean;
    /** Comptage des restes : attend le module Stock (§15.102), ne bloque pas. */
    restes: "a_venir";
    /** Chaque tiroir (session avec espèces) a son Z. */
    especes: boolean;
    /** Le match peut être clos définitivement. */
    cloturable: boolean;
  };
}

/**
 * Ticket client produit par le directeur, à la demande du client (dossier §15.99) : aucune caisse
 * n'imprime de ticket. Chaque édition est inscrite au journal technique ; à partir de la
 * deuxième, le ticket porte « DUPLICATA n° N ».
 */
export interface EditionTicket {
  edition: number;
  editeLe: string;
  editePar: string;
  lieu: IdentiteLieu;
  ticket: TicketVue;
}

export interface VerificationCaisses {
  ok: boolean;
  caisses: { caisseId: string; numero: number; ok: boolean; maillons: number; rupture: { sequence: number; raison: string } | null }[];
}

// ---------------------------------------------------------------------------
// Caissières et tablettes enregistrées (dossier §15.100)
// ---------------------------------------------------------------------------

export interface Caissiere {
  id: string;
  nom: string;
  actif: boolean;
  /** Fiche bloquée après 5 codes erronés, jusqu'à cette heure (ou un nouveau code). */
  bloqueeJusqua: string | null;
  derniereConnexion: string | null;
}

/** Réponse à la création d'une fiche ou à un nouveau code : le code n'est remis qu'une seule fois. */
export interface CodeCaissiere {
  caissiere: Caissiere;
  code: string;
}

export interface AppareilCaisse {
  id: string;
  caisseId: string;
  caisseNumero: number;
  caisseNom: string | null;
  standNom: string;
  enregistrePar: string;
  enregistreLe: string;
  retireLe: string | null;
  derniereConnexion: string | null;
  /** C'est l'appareil d'où vient la requête. */
  cetAppareil: boolean;
}

/** Ce que montre une tablette enregistrée avant toute connexion : sa caisse et les caissières du lieu. */
export interface AccueilTablette {
  lieuNom: string;
  caisse: { id: string; numero: number; nom: string | null; standNom: string };
  caissieres: { id: string; nom: string }[];
}

// ---------------------------------------------------------------------------
// Résultats (dossier §15.103) : calculés sur les vraies ventes, jamais estimés
// ---------------------------------------------------------------------------

export interface ProduitVendu {
  produitId: string;
  nom: string;
  categorie: string | null;
  quantite: number;
  caTtc: Centimes;
  caHt: Centimes;
  /** Coût matière HT par portion saisi sur la fiche produit ; null = coût manquant. */
  coutUnitaire: Centimes | null;
  /** caHt − quantité × coût ; null si le coût manque. */
  marge: Centimes | null;
}

export interface StatsMatch {
  evenementId: string;
  caTtc: Centimes;
  caHt: Centimes;
  tva: Centimes;
  /** Ventes moins annulations. */
  tickets: number;
  annulations: { nombre: number; montant: Centimes };
  panierMoyen: Centimes | null;
  spectateurs: number | null;
  caParSpectateur: Centimes | null;
  /** Heure de Paris (0-23) → CA TTC net. */
  parHeure: { heure: number; ca: Centimes }[];
  parCategorie: { nom: string; ca: Centimes }[];
  parStand: { standId: string; nom: string; ca: Centimes }[];
  parMode: { especes: Centimes; carte: Centimes };
  parTaux: { tauxTva: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  produits: ProduitVendu[];
  /** null dès qu'un produit vendu n'a pas de coût. */
  coutMatiere: Centimes | null;
  margeBrute: Centimes | null;
  produitsSansCout: string[];
  caHtSansCout: Centimes;
}

export interface AlerteResultat {
  niveau: "forte" | "normale";
  titre: string;
  detail: string;
}

export interface MatchResume {
  id: string;
  libelle: string;
  debut: string;
  etat: EtatEvenement;
  caTtc: Centimes;
  tickets: number;
  spectateurs: number | null;
}

export interface Resultats {
  /** Tous les matchs qui ont des ventes, du plus récent au plus ancien. */
  matchs: MatchResume[];
  evenement: Evenement | null;
  comparaison: Evenement | null;
  actuel: StatsMatch | null;
  precedent: StatsMatch | null;
  alertes: AlerteResultat[];
  prochains: { id: string; libelle: string; debut: string }[];
}
