/**
 * Assistant « pose ta question » (décision de Rémi du 2026-10-04, dossier §15.136).
 *
 * L'IA (Mistral) ne voit que ce que lui renvoient des outils en lecture seule (Résultats, Finances,
 * rapports de soirée, marges). Ces outils écrivent les montants comme l'écran (« 18 640,00 € »), pour
 * que la réponse puisse être contrôlée : chaque nombre de la réponse doit figurer dans les données lues.
 * Sinon, la réponse est montrée avec la mention « chiffres à vérifier » — jamais présentée comme sûre.
 */
import { chiffresDe } from "./brief.ts";

/** Questions par lieu et par jour (chaque question coûte). */
export const LIMITE_QUESTIONS_JOUR = 60;

export interface SourceAssistant {
  /** Nom de l'outil consulté. */
  outil: string;
  /** Ce qui a été lu, en clair (« Résultats du 1er au 30 septembre 2026 »). */
  libelle: string;
}

export interface ReponseAssistant {
  reponse: string;
  sources: SourceAssistant[];
  modele: string;
  /** Tous les chiffres de la réponse figurent-ils dans les données lues ? */
  verifie: boolean;
  /** Questions restantes aujourd'hui pour le lieu. */
  restantes: number;
}

export interface EtatAssistant {
  /** La clé du fournisseur d'IA est-elle réglée sur le serveur ? */
  branche: boolean;
  modele: string | null;
  restantes: number;
  limite: number;
}

/**
 * Chaque nombre de la réponse figure-t-il dans les données lues ? Les petits entiers (jusqu'à 10 :
 * « 3 produits », « 2 soirées ») sont tolérés : ce sont des comptes, pas des montants.
 */
export function chiffresVerifies(reponse: string, donneesLues: readonly string[]): boolean {
  const permis = new Set(chiffresDe(donneesLues.join(" ")));
  return chiffresDe(reponse).every((n) => permis.has(n) || (/^\d+$/.test(n) && Number(n) <= 10));
}
