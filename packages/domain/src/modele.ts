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
  /** Espèces retirées du tiroir et portées au coffre pendant le match (§15.106). */
  remontees: RemonteeCoffre[];
  /** Total net des remontées (annulations déduites). */
  totalRemonte: Centimes;
  comptage: ComptageEspeces | null;
  rectifications: ComptageEspeces[];
}

export interface RemonteeCoffre {
  id: string;
  montant: Centimes;
  par: string;
  le: string;
  /** Remontée annulée par une écriture inverse (jamais effacée). */
  annulee: { motif: string; par: string; le: string } | null;
}

/** Z du coffre de la soirée (§15.106) : attendu = total des remontées du match. */
export interface ComptageCoffre {
  id: string;
  type: "comptage" | "rectification";
  refComptage: string | null;
  coupures: Record<string, number>;
  attendu: Centimes;
  compte: Centimes;
  ecart: Centimes;
  seuil: Centimes;
  motif: string | null;
  signature: string | null;
  par: string;
  le: string;
}

export interface ClotureMatch {
  evenement: Evenement;
  seuilEcartEspeces: Centimes;
  sessions: SessionACloturer[];
  /** Coffre de la soirée : à compter dès qu'il y a eu une remontée. */
  coffre: { requis: boolean; attendu: Centimes; comptage: ComptageCoffre | null; rectifications: ComptageCoffre[] };
  etapes: {
    /** Toutes les caisses du match sont clôturées. */
    ventes: boolean;
    /** Comptage des restes (§15.105) : obligatoire dès que le match a une mise en place ou un réassort. */
    restes: { requis: boolean; manquants: number };
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
  /** Heure de Paris (0-23) → CA TTC net et tickets (ventes moins annulations). */
  parHeure: { heure: number; ca: Centimes; tickets: number }[];
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
  /** Personnel du match lu dans le planning (§15.104) ; reel null si un taux manque. */
  personnel: { reel: Centimes | null; affectations: number; tauxManquants: number };
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

// ---------------------------------------------------------------------------
// Équipe : fiches, planning, masse salariale (dossier §15.104, module 14)
// ---------------------------------------------------------------------------

export interface Employe {
  id: string;
  nom: string;
  statut: "salarie" | "interimaire";
  agence: string | null;
  role: import("./planning.ts").RoleEquipe;
  /** Coût horaire chargé (salarié) ou taux facturé par l'agence (intérimaire), en centimes ; null = taux manquant. */
  tauxHoraire: Centimes | null;
  actif: boolean;
  /** Accès caisse (compte caissière du §15.100), s'il a été donné. */
  acces: { caissiereId: string; actif: boolean; bloqueeJusqua: string | null; derniereConnexion: string | null } | null;
}

export interface EmployeCree {
  employe: Employe;
  /** Code de caisse, remis une seule fois si l'accès caisse a été donné. */
  code: string | null;
}

export interface Affectation {
  id: string;
  employeId: string;
  employeNom: string;
  statut: "salarie" | "interimaire";
  agence: string | null;
  standId: string | null;
  standNom: string | null;
  caisseId: string | null;
  caisseNumero: number | null;
  role: import("./planning.ts").RoleEquipe;
  debutPrevu: string;
  finPrevu: string;
  debutReel: string;
  finReel: string;
  /** Heures réelles corrigées : par qui, quand. */
  correction: { par: string; le: string } | null;
  tauxHoraire: Centimes | null;
  minutesPrevues: number;
  minutesReelles: number;
  coutPrevu: Centimes | null;
  coutReel: Centimes | null;
}

export interface PlanningMatch {
  evenement: Evenement;
  affectations: Affectation[];
  /** Somme des coûts réels ; null si un taux manque. */
  masseReelle: Centimes | null;
  massePrevue: Centimes | null;
  salaries: Centimes;
  interimaires: Centimes;
  tauxManquants: number;
}

export interface MasseSalariale {
  parMatch: { evenement: Evenement; affectations: number; salaries: Centimes; interimaires: Centimes; total: Centimes; tauxManquants: number }[];
  parRole: { role: string; total: Centimes }[];
  total: Centimes;
  salaries: Centimes;
  interimaires: Centimes;
}

// ---------------------------------------------------------------------------
// Stock suivi à l'unité (dossier §15.105, module 4)
// ---------------------------------------------------------------------------

export interface LigneStock {
  produitId: string;
  nom: string;
  categorie: string | null;
  /** Coût matière de la fiche (CUMP après livraisons) ; null = coût manquant. */
  coutUnitaire: Centimes | null;
  /** Reste compté au même stand au match précédent (0 s'il n'y en a pas). */
  reste: number;
  premierMatch: boolean;
  miseEnPlace: number;
  miseEnPlaceDerniere: { par: string; le: string } | null;
  reassort: number;
  vendu: number;
  depart: number;
  restant: number;
  seuil: number;
  alerte: import("./stock.ts").AlerteStock;
  compte: number | null;
  comptage: { par: string; le: string; motif: string | null } | null;
  ecart: number | null;
  ecartValeur: Centimes | null;
  motifRequis: boolean;
  /** Quantité suggérée pour la mise en place ; null sans historique. */
  suggestion: number | null;
}

export interface StandStock {
  standId: string;
  nom: string;
  lignes: LigneStock[];
}

export interface StockMatch {
  evenement: Evenement;
  stands: StandStock[];
  /** Solde calculé de la réserve centrale, par produit. */
  reserve: Record<string, number>;
  /** Étape « Restes » de la clôture : obligatoire dès qu'il y a une mise en place ou un réassort. */
  restes: { requis: boolean; manquants: number };
}

export interface MouvementStock {
  id: string;
  type: "livraison" | "mise_en_place" | "reassort";
  produit: string;
  stand: string | null;
  match: string | null;
  quantite: number;
  prixUnitaire: Centimes | null;
  fournisseur: string | null;
  dateLivraison: string | null;
  coutAvant: Centimes | null;
  coutApres: Centimes | null;
  par: string;
  le: string;
}

export interface ProduitReserve {
  produitId: string;
  nom: string;
  coutUnitaire: Centimes | null;
  /** Dernier inventaire réserve validé de ce produit (point de départ du solde). */
  inventaire: { date: string; compte: number } | null;
  livreDepuis: number;
  sortiDepuis: number;
  /** Solde calculé : inventaire + livraisons − sorties vers les stands. */
  solde: number;
}

export interface InventaireReserve {
  id: string;
  date: string;
  par: string;
  le: string;
  lignes: { produit: string; calcule: number | null; compte: number; ecart: number | null; valeur: Centimes | null }[];
}

export interface EtatReserve {
  produits: ProduitReserve[];
  inventaires: InventaireReserve[];
  mouvements: MouvementStock[];
}

// ---------------------------------------------------------------------------
// Clôtures de période (dossier §15.107)
// ---------------------------------------------------------------------------

export interface ClotureVue {
  id: string;
  sequence: number;
  niveau: import("./cloture-periode.ts").NiveauCloture;
  libelle: string;
  evenementId: string | null;
  debut: string;
  fin: string;
  totalTtc: Centimes;
  perpetuelAvant: Centimes;
  perpetuelApres: Centimes;
  tickets: number;
  annulations: number;
  especes: Centimes;
  carte: Centimes;
  ventilation: { tauxTva: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  parCaisse: { caisseId: string; numero: number; total: Centimes; perpetuel: Centimes }[];
  par: string;
  le: string;
  empreinte: string;
}

export interface PeriodeACloturer {
  /** « 2026-09 » pour un mois, « 2026-01 » (premier mois) pour un exercice. */
  cle: string;
  libelle: string;
  debut: string;
  fin: string;
  matchs: { id: string; libelle: string; debut: string; etat: EtatEvenement; totalTtc: Centimes }[];
  totalTtc: Centimes;
  etat: "clos" | "cloturable" | "bloque";
  /** Pourquoi la période ne peut pas encore être clôturée. */
  raison: string | null;
  cloture: ClotureVue | null;
}

export interface EtatClotures {
  /** Premier mois de l'exercice (1 = janvier) ; null tant que le directeur ne l'a pas réglé. */
  moisDebutExercice: number | null;
  exerciceModifiable: boolean;
  perpetuel: Centimes;
  mois: PeriodeACloturer[];
  exercices: PeriodeACloturer[];
  historique: ClotureVue[];
}
