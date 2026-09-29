import {
  EMPREINTE_INITIALE,
  champsScellesCaisse,
  empreinteCaisse,
  numeroJustificatif,
  verifierChaine,
  type EvenementCaisse,
  type TypeEvenementCaisse,
  type VerificationCaisses,
} from "@flaix/domain";
import { verrouiller, type Client } from "./base.ts";

const anneeParis = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" });

export interface NouvelEvenementCaisse {
  id: string;
  type: TypeEvenementCaisse;
  lieuId: string;
  caisseId: string;
  numeroCaisse: number;
  standId: string;
  evenementId: string;
  sessionId: string | null;
  utilisateurId: string;
  refEvenement?: string | null;
  modeReglement?: "especes" | "carte" | null;
  totalTtc?: number | null;
  details: Record<string, unknown>;
}

/**
 * Inscrit un événement dans la chaîne de SA caisse (§15.12) : rang suivant, numéro de
 * justificatif suivant pour une vente ou une annulation, empreinte chaînée à la précédente.
 * Verrou par caisse : deux ventes simultanées sur la même caisse ne peuvent jamais obtenir
 * le même numéro ni créer un embranchement ; deux caisses différentes ne s'attendent pas.
 */
export async function inscrireCaisse(
  client: Client,
  e: NouvelEvenementCaisse,
): Promise<{ sequence: number; numeroJustificatif: string | null; horodatage: Date; empreinte: string }> {
  await verrouiller(client, `caisse:${e.caisseId}`);
  const { rows } = await client.query<{ sequence: number; empreinte: string; dernier_ticket: number }>(
    `SELECT (SELECT sequence FROM journal_caisse WHERE caisse_id = $1 ORDER BY sequence DESC LIMIT 1) AS sequence,
            (SELECT empreinte FROM journal_caisse WHERE caisse_id = $1 ORDER BY sequence DESC LIMIT 1) AS empreinte,
            (SELECT coalesce(max(numero_ticket), 0) FROM journal_caisse WHERE caisse_id = $1)::int AS dernier_ticket`,
    [e.caisseId],
  );
  const etat = rows[0]!;
  const horodatage = new Date();
  const avecTicket = e.type === "vente" || e.type === "annulation";
  const numeroTicket = avecTicket ? etat.dernier_ticket + 1 : null;
  const justificatif = numeroTicket ? numeroJustificatif(Number(anneeParis.format(horodatage)), e.numeroCaisse, numeroTicket) : null;
  const evenement: EvenementCaisse = {
    id: e.id,
    sequence: (etat.sequence ?? 0) + 1,
    numeroJustificatif: justificatif,
    horodatage,
    type: e.type,
    lieuId: e.lieuId,
    standId: e.standId,
    caisseId: e.caisseId,
    evenementId: e.evenementId,
    utilisateurId: e.utilisateurId,
    refEvenement: e.refEvenement ?? null,
    modeReglement: e.modeReglement ?? null,
    totalTtc: e.totalTtc ?? null,
    details: e.details,
  };
  const precedente = etat.empreinte ?? EMPREINTE_INITIALE;
  const empreinte = empreinteCaisse(evenement, precedente);
  await client.query(
    `INSERT INTO journal_caisse
       (id, lieu_id, caisse_id, sequence, type, numero_ticket, numero_justificatif, horodatage, stand_id, evenement_id,
        session_id, utilisateur_id, ref_evenement, mode_reglement, total_ttc_centimes, details, empreinte_precedente, empreinte)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      evenement.id,
      e.lieuId,
      e.caisseId,
      evenement.sequence,
      e.type,
      numeroTicket,
      justificatif,
      horodatage,
      e.standId,
      e.evenementId,
      e.sessionId,
      e.utilisateurId,
      evenement.refEvenement,
      evenement.modeReglement,
      evenement.totalTtc,
      JSON.stringify(e.details),
      precedente,
      empreinte,
    ],
  );
  return { sequence: evenement.sequence, numeroJustificatif: justificatif, horodatage, empreinte };
}

interface LigneJournal {
  id: string;
  caisse_id: string;
  sequence: number;
  type: TypeEvenementCaisse;
  numero_justificatif: string | null;
  horodatage: Date;
  stand_id: string;
  evenement_id: string;
  utilisateur_id: string;
  ref_evenement: string | null;
  mode_reglement: "especes" | "carte" | null;
  total_ttc_centimes: number | null;
  details: Record<string, unknown>;
  empreinte_precedente: string;
  empreinte: string;
}

/**
 * Relit la chaîne de chaque caisse du lieu, dans l'ordre réel de scellement (jamais un
 * ordre d'affichage, leçon du §15.29), et contrôle que les lignes de ticket interrogeables
 * correspondent exactement au détail scellé.
 */
export async function verifierCaisses(client: Client, lieuId: string): Promise<VerificationCaisses> {
  const caisses = await client.query<{ id: string; numero: number }>("SELECT id, numero FROM caisse WHERE lieu_id = $1 ORDER BY numero", [lieuId]);
  const journal = await client.query<LigneJournal>(
    `SELECT id, caisse_id, sequence, type, numero_justificatif, horodatage, stand_id, evenement_id, utilisateur_id, ref_evenement,
            mode_reglement, total_ttc_centimes, details, empreinte_precedente, empreinte
       FROM journal_caisse WHERE lieu_id = $1 ORDER BY caisse_id, sequence`,
    [lieuId],
  );
  const lignes = await client.query<{ journal_id: string; n: number; net: number }>(
    "SELECT journal_id, count(*)::int AS n, sum(net_ttc_centimes)::int AS net FROM ligne_ticket WHERE lieu_id = $1 GROUP BY journal_id",
    [lieuId],
  );
  const lignesParTicket = new Map(lignes.rows.map((l) => [l.journal_id, l]));

  const resultat: VerificationCaisses["caisses"] = caisses.rows.map((k) => {
    const chaine = journal.rows.filter((j) => j.caisse_id === k.id);
    const verif = verifierChaine(
      chaine.map((j) => ({
        champs: champsScellesCaisse({
          id: j.id,
          sequence: j.sequence,
          numeroJustificatif: j.numero_justificatif,
          horodatage: j.horodatage,
          type: j.type,
          lieuId,
          standId: j.stand_id,
          caisseId: j.caisse_id,
          evenementId: j.evenement_id,
          utilisateurId: j.utilisateur_id,
          refEvenement: j.ref_evenement,
          modeReglement: j.mode_reglement,
          totalTtc: j.total_ttc_centimes,
          details: j.details,
        }),
        empreintePrecedente: j.empreinte_precedente,
        empreinte: j.empreinte,
      })),
    );
    if (!verif.ok) {
      const fautif = chaine[verif.rupture.index]!;
      return { caisseId: k.id, numero: k.numero, ok: false, maillons: chaine.length, rupture: { sequence: fautif.sequence, raison: verif.rupture.raison } };
    }
    const trou = chaine.findIndex((j, i) => j.sequence !== i + 1);
    if (trou >= 0) {
      return { caisseId: k.id, numero: k.numero, ok: false, maillons: chaine.length, rupture: { sequence: chaine[trou]!.sequence, raison: "numerotation_discontinue" } };
    }
    for (const j of chaine) {
      if (j.type !== "vente" && j.type !== "annulation") continue;
      const scellees = (j.details.lignes as { net: number }[] | undefined) ?? [];
      const copie = lignesParTicket.get(j.id);
      const netScelle = scellees.reduce((s, l) => s + l.net, 0);
      if (!copie || copie.n !== scellees.length || copie.net !== netScelle || netScelle !== j.total_ttc_centimes) {
        return { caisseId: k.id, numero: k.numero, ok: false, maillons: chaine.length, rupture: { sequence: j.sequence, raison: "lignes_incoherentes" } };
      }
    }
    return { caisseId: k.id, numero: k.numero, ok: true, maillons: chaine.length, rupture: null };
  });
  return { ok: resultat.every((r) => r.ok), caisses: resultat };
}
