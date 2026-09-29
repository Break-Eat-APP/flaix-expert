import {
  EMPREINTE_INITIALE,
  TYPES_JET,
  champsScellesJet,
  empreinteJet,
  verifierChaine,
  type EntreeJournalTechnique,
  type EvenementJet,
  type ResultatVerification,
  type TypeJet,
} from "@flaix/domain";
import { verrouiller, type Client } from "./base.ts";

export interface NouvelEvenementJet {
  lieuId: string;
  type: TypeJet;
  utilisateurId: string | null;
  standId?: string | null;
  caisseId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Inscrit un événement au journal technique du lieu, chaîné au précédent.
 * Le verrou par lieu garantit une numérotation continue et une chaîne sans
 * embranchement même si deux requêtes arrivent au même instant.
 * Doit être appelé dans la même transaction que la modification qu'il trace :
 * si l'une échoue, l'autre est annulée — jamais de modification sans trace.
 */
export async function inscrireJet(client: Client, e: NouvelEvenementJet): Promise<{ numero: number; empreinte: string }> {
  await verrouiller(client, `jet:${e.lieuId}`);
  const { rows } = await client.query<{ numero: number; empreinte: string }>(
    "SELECT numero, empreinte FROM journal_technique WHERE lieu_id = $1 ORDER BY numero DESC LIMIT 1",
    [e.lieuId],
  );
  const dernier = rows[0];
  const evenement: EvenementJet = {
    numero: (dernier?.numero ?? 0) + 1,
    horodatage: new Date(),
    type: e.type,
    lieuId: e.lieuId,
    standId: e.standId ?? null,
    caisseId: e.caisseId ?? null,
    utilisateurId: e.utilisateurId,
    details: e.details ?? {},
  };
  const precedente = dernier?.empreinte ?? EMPREINTE_INITIALE;
  const empreinte = empreinteJet(evenement, precedente);
  await client.query(
    `INSERT INTO journal_technique
       (lieu_id, numero, horodatage, type, stand_id, caisse_id, utilisateur_id, details, empreinte_precedente, empreinte)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      evenement.lieuId,
      evenement.numero,
      evenement.horodatage,
      evenement.type,
      evenement.standId,
      evenement.caisseId,
      evenement.utilisateurId,
      JSON.stringify(evenement.details),
      precedente,
      empreinte,
    ],
  );
  return { numero: evenement.numero, empreinte };
}

interface LigneJet {
  numero: number;
  horodatage: Date;
  type: TypeJet;
  lieu_id: string;
  stand_id: string | null;
  caisse_id: string | null;
  utilisateur_id: string | null;
  details: Record<string, unknown>;
  empreinte_precedente: string;
  empreinte: string;
  auteur: string | null;
}

function versEvenement(l: LigneJet): EvenementJet {
  return {
    numero: l.numero,
    horodatage: l.horodatage,
    type: l.type,
    lieuId: l.lieu_id,
    standId: l.stand_id,
    caisseId: l.caisse_id,
    utilisateurId: l.utilisateur_id,
    details: l.details,
  };
}

export type VerificationJet = ResultatVerification & { numerotationContinue: boolean };

/** Relit toute la chaîne du lieu dans l'ordre de scellement et la vérifie. */
export async function verifierJet(client: Client, lieuId: string): Promise<VerificationJet> {
  const { rows } = await client.query<LigneJet>(
    `SELECT numero, horodatage, type, lieu_id, stand_id, caisse_id, utilisateur_id, details,
            empreinte_precedente, empreinte, NULL AS auteur
       FROM journal_technique WHERE lieu_id = $1 ORDER BY numero`,
    [lieuId],
  );
  const resultat = verifierChaine(
    rows.map((l) => ({
      champs: champsScellesJet(versEvenement(l)),
      empreintePrecedente: l.empreinte_precedente,
      empreinte: l.empreinte,
    })),
  );
  const numerotationContinue = rows.every((l, i) => l.numero === i + 1);
  return { ...resultat, numerotationContinue };
}

export async function lireJet(client: Client, lieuId: string, limite: number, avantNumero?: number): Promise<EntreeJournalTechnique[]> {
  const { rows } = await client.query<LigneJet>(
    `SELECT j.numero, j.horodatage, j.type, j.lieu_id, j.stand_id, j.caisse_id, j.utilisateur_id, j.details,
            j.empreinte_precedente, j.empreinte, u.nom AS auteur
       FROM journal_technique j
       LEFT JOIN utilisateur u ON u.id = j.utilisateur_id
      WHERE j.lieu_id = $1 AND ($2::bigint IS NULL OR j.numero < $2)
      ORDER BY j.numero DESC
      LIMIT $3`,
    [lieuId, avantNumero ?? null, limite],
  );
  return rows.map((l) => ({
    numero: l.numero,
    horodatage: l.horodatage.toISOString(),
    type: l.type,
    libelle: TYPES_JET[l.type] ?? l.type,
    auteur: l.auteur,
    standId: l.stand_id,
    caisseId: l.caisse_id,
    details: l.details,
    empreinte: l.empreinte,
  }));
}
