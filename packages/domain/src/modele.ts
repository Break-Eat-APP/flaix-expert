/**
 * Modèle canonique (dossier §5) — formes échangées entre le serveur et les écrans.
 * Les montants sont en centimes, les taux de TVA en points de base.
 */
import type { Centimes } from "./argent.ts";
import type { TauxTvaPb } from "./tva.ts";
import type { TypeJet } from "./journal-technique.ts";

export type Role = "directeur" | "operateur" | "verificateur";

export interface SessionInfo {
  utilisateur: { id: string; nom: string; email: string };
  lieu: { id: string; nom: string };
  role: Role;
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
}

export type IdentiteLieu = Omit<Lieu, "id" | "remiseAbonnePb">;

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

export interface VerificationCaisses {
  ok: boolean;
  caisses: { caisseId: string; numero: number; ok: boolean; maillons: number; rupture: { sequence: number; raison: string } | null }[];
}
