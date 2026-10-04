import { calculerEmpreinte, jsonCanonique, type ChampScelle } from "./chaine.ts";

/**
 * Journal de caisse : une chaîne par caisse (§15.12), écriture seule.
 * Champs scellés : ceux du §15.16 (numéro de justificatif, horodatage, type, lieu, stand,
 * caisse, opérateur, mode de règlement, montant TTC), plus le rang dans la chaîne, l'événement,
 * l'événement visé par une annulation et le détail complet (lignes, remise, offert, motif,
 * ventilation de TVA) — voir docs/decisions-architecture-production.md § 12.
 * Ne jamais changer cet ordre sans version majeure (§15.5).
 */
export type TypeEvenementCaisse = "ouverture_caisse" | "vente" | "annulation" | "cloture_caisse";

export interface EvenementCaisse {
  id: string;
  sequence: number;
  numeroJustificatif: string | null;
  horodatage: Date;
  type: TypeEvenementCaisse;
  lieuId: string;
  standId: string;
  caisseId: string;
  evenementId: string;
  utilisateurId: string;
  refEvenement: string | null;
  modeReglement: "especes" | "carte" | null;
  totalTtc: number | null;
  details: Record<string, unknown>;
}

export function champsScellesCaisse(e: EvenementCaisse): ChampScelle[] {
  return [
    e.sequence,
    e.id,
    e.numeroJustificatif,
    e.horodatage.toISOString(),
    e.type,
    e.lieuId,
    e.standId,
    e.caisseId,
    e.evenementId,
    e.utilisateurId,
    e.refEvenement,
    e.modeReglement,
    e.totalTtc,
    jsonCanonique(e.details),
  ];
}

export function empreinteCaisse(e: EvenementCaisse, empreintePrecedente: string): string {
  return calculerEmpreinte(champsScellesCaisse(e), empreintePrecedente);
}
