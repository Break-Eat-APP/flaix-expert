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
  formation_entree: "Entrée en mode formation",
  formation_sortie: "Sortie du mode formation",
  formation_ouverte: "Lieu de formation créé (configuration recopiée)",
  formation_recommencee: "Formation recommencée à zéro",
  tablette_formation_activee: "Tablette mise en mode formation",
  tablette_formation_desactivee: "Tablette sortie du mode formation",
  export_comptable: "Export pour l'expert-comptable téléchargé",
  plan_comptes_modifie: "Plan de comptes de l'export modifié",
  click_collect_reglages_modifies: "Réglages Click & Collect modifiés",
  prix_app_modifie: "Prix ou stock Click & Collect d'un produit modifié",
  frais_stand_modifies: "Frais d'un stand modifiés (coûts par buvette)",
  fidelite_reglages_modifies: "Règles de points de fidélité modifiées",
  abonne_cree: "Fiche d'abonné créée",
  abonne_modifie: "Fiche d'abonné modifiée",
  abonnes_importes: "Base d'abonnés importée",
  points_ajustes: "Points de fidélité ajustés",
  code_promo_cree: "Code promo créé",
  code_promo_modifie: "Code promo modifié",
  facture_saisie: "Facture fournisseur saisie",
  facture_modifiee: "Facture fournisseur modifiée",
  facture_piece_jointe: "Pièce jointe d'une facture déposée",
  facture_validee: "Facture fournisseur validée",
  facture_payee: "Facture fournisseur marquée payée",
  verification_editeur: "Vérification d'intégrité par Break Eat (éditeur)",
  ticket_edite: "Ticket client édité (sur demande)",
  z_caisse_clos: "Z de caisse clôturé (espèces comptées)",
  z_caisse_rectifie: "Rectification d'un Z de caisse",
  seuil_especes_modifie: "Tolérance d'écart d'espèces modifiée",
  employe_cree: "Fiche employé créée",
  employe_modifie: "Fiche employé modifiée",
  acces_caisse_donne: "Accès caisse donné à un employé",
  acces_caisse_retire: "Accès caisse retiré à un employé",
  affectation_creee: "Affectation ajoutée au planning",
  affectation_modifiee: "Affectation modifiée",
  affectation_retiree: "Affectation retirée du planning",
  livraison_recue: "Livraison fournisseur (coût matière recalculé)",
  inventaire_reserve_valide: "Inventaire de la réserve validé",
  comptage_stock_corrige: "Comptage de stock corrigé",
  remontee_coffre: "Espèces remontées au coffre",
  remontee_coffre_annulee: "Remontée au coffre annulée",
  z_coffre_clos: "Z du coffre clôturé (coffre compté)",
  z_coffre_rectifie: "Rectification du Z du coffre",
  z_match: "Z du match (clôture journalière)",
  cloture_mois: "Clôture mensuelle",
  cloture_exercice: "Clôture de l'exercice",
  exercice_modifie: "Premier mois de l'exercice modifié",
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
