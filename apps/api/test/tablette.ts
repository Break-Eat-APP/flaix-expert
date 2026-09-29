import { randomUUID } from "node:crypto";
import {
  AUCUN_AJUSTEMENT,
  scellerAnnulation,
  scellerVente,
  type Ajustement,
  type EvenementTablette,
  type ModeReglement,
  type Produit,
  type ReponseSynchro,
  type RepriseCaisse,
  type TeteChaine,
} from "@flaix/domain";

/**
 * Tablette simulée pour les tests (§15.97) : elle scelle ses tickets avec le code partagé
 * (packages/domain), exactement comme l'écran de caisse, les garde en attente, puis les envoie.
 */
export interface Tablette {
  caisseId: string;
  reprise: RepriseCaisse;
  tete: TeteChaine;
  tickets: EvenementTablette[];
  attente: EvenementTablette[];
}

export type Appel = <T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) => Promise<{ statut: number; corps: T }>;

export function tablette(caisseId: string, reprise: RepriseCaisse): Tablette {
  return { caisseId, reprise, tete: reprise.tete, tickets: [], attente: [] };
}

/** Ligne de ticket au prix que la tablette a en mémoire (le tarif en vigueur quand le produit a été lu). */
export const ligne = (p: Produit, quantite = 1) => ({
  produitId: p.id,
  libelle: p.nom,
  quantite,
  prixUnitaire: p.tarifEnVigueur!.prixTtc,
  tauxTva: p.tarifEnVigueur!.tauxTva,
});

export function vendreHorsLigne(
  t: Tablette,
  lignes: ReturnType<typeof ligne>[],
  extra: { modeReglement?: ModeReglement; montantDonne?: number | null; ajustement?: Partial<Ajustement>; horodatage?: Date } = {},
): EvenementTablette {
  const { evenement, tete } = scellerVente(t.reprise.contexte, t.tete, {
    id: randomUUID(),
    lignes,
    ajustement: { ...AUCUN_AJUSTEMENT, ...extra.ajustement },
    modeReglement: extra.modeReglement ?? "carte",
    montantDonne: extra.montantDonne ?? null,
    horodatage: extra.horodatage ?? new Date(),
  });
  t.tete = tete;
  t.tickets.push(evenement);
  t.attente.push(evenement);
  return evenement;
}

export function annulerHorsLigne(t: Tablette, origine: EvenementTablette, motif: string): EvenementTablette {
  const { evenement, tete } = scellerAnnulation(t.reprise.contexte, t.tete, origine, { id: randomUUID(), motif, horodatage: new Date() });
  t.tete = tete;
  t.tickets.push(evenement);
  t.attente.push(evenement);
  return evenement;
}

/** Envoie tout ce qui attend. En cas de succès, la file se vide ; en cas de refus, rien ne bouge. */
export async function envoyer(appel: Appel, t: Tablette, evenements: EvenementTablette[] = t.attente) {
  const r = await appel<ReponseSynchro & { erreur?: string }>("POST", `/api/caisses/${t.caisseId}/journal`, {
    sessionId: t.reprise.contexte.sessionId,
    jeton: t.reprise.jeton,
    utilisateurId: t.reprise.contexte.utilisateurId,
    evenements,
  });
  if (r.statut === 200 && evenements === t.attente) t.attente = [];
  return r;
}
