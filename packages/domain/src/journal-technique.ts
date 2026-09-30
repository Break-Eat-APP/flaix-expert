import { calculerEmpreinte, jsonCanonique, type ChampScelle } from "./chaine.ts";

/**
 * Journal des événements techniques (JET, dossier §15.3) : connexions,
 * ouvertures/fermetures de caisse, changements de paramétrage et de tarif,
 * exports, etc. Une chaîne par lieu, en écriture seule.
 */
export const TYPES_JET = {
  lieu_cree: "Lieu créé",
  lieu_identite_modifiee: "Identité du lieu modifiée",
  connexion: "Connexion",
  connexion_refusee: "Connexion refusée (mot de passe ou code erroné)",
  deconnexion: "Déconnexion",
  mot_de_passe_modifie: "Mot de passe modifié",
  acces_refuse: "Accès refusé (droits insuffisants)",
  stand_cree: "Stand créé",
  stand_modifie: "Stand modifié",
  caisse_creee: "Caisse créée",
  caisse_modifiee: "Caisse modifiée",
  categorie_creee: "Catégorie créée",
  categorie_modifiee: "Catégorie modifiée",
  produit_cree: "Produit créé",
  produit_modifie: "Produit modifié",
  produit_stands_modifies: "Stands d'un produit modifiés",
  tarif_cree: "Nouveau tarif",
  reglages_caisse_modifies: "Réglages de caisse modifiés",
  evenement_cree: "Match créé",
  evenement_modifie: "Match modifié",
  evenement_ouvert: "Match ouvert",
  evenement_clos: "Match clos",
  caisse_ouverte: "Ouverture de caisse",
  caisse_cloturee: "Clôture de caisse",
  ticket_annule: "Ticket annulé",
  verification_integrite: "Vérification d'intégrité",
  caisse_reprise: "Caisse reprise sur un autre appareil",
  tickets_hors_ligne_recus: "Tickets enregistrés hors ligne reçus",
  caissiere_creee: "Fiche de caissière créée",
  caissiere_modifiee: "Fiche de caissière modifiée",
  code_caissiere_renouvele: "Nouveau code de caissière",
  connexion_bloquee: "Connexion bloquée (trop de codes erronés)",
  appareil_enregistre: "Tablette enregistrée comme caisse",
  appareil_retire: "Tablette retirée",
} as const;

export type TypeJet = keyof typeof TYPES_JET;

export interface EvenementJet {
  numero: number;
  horodatage: Date;
  type: TypeJet;
  lieuId: string;
  standId: string | null;
  caisseId: string | null;
  utilisateurId: string | null;
  details: Record<string, unknown>;
}

/** Ordre des champs scellés d'un événement technique — ne jamais le changer sans version majeure (§15.5). */
export function champsScellesJet(e: EvenementJet): ChampScelle[] {
  return [
    e.numero,
    e.horodatage.toISOString(),
    e.type,
    e.lieuId,
    e.standId,
    e.caisseId,
    e.utilisateurId,
    jsonCanonique(e.details),
  ];
}

export function empreinteJet(e: EvenementJet, empreintePrecedente: string): string {
  return calculerEmpreinte(champsScellesJet(e), empreintePrecedente);
}
