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
}

export type IdentiteLieu = Omit<Lieu, "id">;

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
