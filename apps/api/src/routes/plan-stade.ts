import type { FastifyInstance } from "fastify";
import { SEUILS_STADE, clotureADistance, planStade, tempsDeService, type DonneesStand, type PlanStade, type Tribune } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { lireOptions } from "../options.ts";
import { listerEvenements } from "./evenements.ts";
import { stockDuMatch } from "./stock.ts";
import { contexte } from "./outils.ts";

/**
 * Le stade en direct (dossier §15.162) : pour chaque stand actif, ce que lisent déjà Caisses, Stock, Hygiène et le
 * temps de prise de commande ; la couleur se calcule dans le moteur (planStade). Lecture seule.
 */
export async function lirePlanStade(c: Client, lieuId: string, maintenant = new Date()): Promise<PlanStade> {
  const options = await lireOptions(c, lieuId);
  const enCours = (await listerEvenements(c, lieuId)).find((e) => e.etat === "ouvert") ?? null;

  const { rows: stands } = await c.query<{ id: string; nom: string; tribune: Tribune | null }>(
    "SELECT id, nom, tribune FROM stand WHERE lieu_id = $1 AND actif ORDER BY lower(nom)",
    [lieuId],
  );
  const donnees = new Map<string, DonneesStand>(
    stands.map((s) => [s.id, { ...s, caisses: [], stock: [], file: { enFile: 0, mesurables: 0 }, hygiene: { nonConformes: 0, ouvertureARelever: [] } }]),
  );

  // Caisses actives : ouverte ou non, nouvelles de la tablette, CA et tickets de l'événement ouvert (même calcul que Caisses).
  const { rows: caisses } = await c.query<{
    stand_id: string;
    numero: number;
    ouverte: boolean;
    vue_le: Date | null;
    tablette_sequence: number | null;
    tablette_attente: number | null;
    sequence_serveur: number;
    ca: number;
    tickets: number;
  }>(
    `SELECT k.stand_id, k.numero, so.ouverte_le IS NOT NULL AS ouverte, so.tablette_vue_le AS vue_le, so.tablette_sequence, so.tablette_attente,
            (SELECT coalesce(max(jc.sequence), 0) FROM journal_caisse jc WHERE jc.caisse_id = k.id)::int AS sequence_serveur,
            coalesce(sum(j.total_ttc_centimes), 0)::int AS ca,
            (count(j.id) FILTER (WHERE j.type = 'vente') - count(j.id) FILTER (WHERE j.type = 'annulation'))::int AS tickets
       FROM caisse k
       LEFT JOIN session_caisse so ON so.caisse_id = k.id AND so.fermee_le IS NULL
       LEFT JOIN journal_caisse j ON j.caisse_id = k.id AND j.evenement_id = $2::uuid AND j.type IN ('vente', 'annulation')
      WHERE k.lieu_id = $1 AND k.actif
      GROUP BY k.id, so.ouverte_le, so.tablette_vue_le, so.tablette_sequence, so.tablette_attente
      ORDER BY k.numero`,
    [lieuId, enCours?.id ?? null],
  );
  for (const k of caisses) {
    const vueLe = k.vue_le?.toISOString() ?? null;
    const distance = clotureADistance({ vueLe, sequence: k.tablette_sequence, attente: k.tablette_attente }, k.sequence_serveur, maintenant);
    donnees.get(k.stand_id)?.caisses.push({ numero: k.numero, ouverte: k.ouverte, vueLe, aEnvoyer: distance.aEnvoyer, caNet: k.ca, tickets: k.tickets });
  }

  if (enCours) {
    // Ruptures et stock faible du stand (Stock, même règle).
    if (options.stock)
      for (const st of (await stockDuMatch(c, lieuId, enCours)).stands)
        donnees.get(st.standId)?.stock.push(
          ...st.lignes.filter((l) => l.alerte).map((l) => ({ nom: l.nom, alerte: l.alerte, restant: l.restant, sur: l.depart + l.reassort, vendu: l.vendu })),
        );
    // File d'attente des 15 dernières minutes (temps de prise de commande, §15.139).
    const { rows: mesures } = await c.query<{ numero: number; stand_id: string; debut: Date | null; fin: Date }>(
      `SELECT k.numero, j.stand_id, m.debut_saisie AS debut, j.horodatage AS fin
         FROM journal_caisse j JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id
         LEFT JOIN mesure_ticket m ON m.lieu_id = j.lieu_id AND m.journal_id = j.id
        WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type = 'vente' AND j.horodatage > $3`,
      [lieuId, enCours.id, new Date(maintenant.getTime() - SEUILS_STADE.fenetreMinutes * 60_000)],
    );
    for (const s of tempsDeService(mesures.map((m) => ({ caisse: m.numero, stand: m.stand_id, debut: m.debut?.getTime() ?? null, fin: m.fin.getTime() }))).parStand) {
      const d = donnees.get(s.libelle);
      if (d) d.file = { enFile: s.enFile, mesurables: s.mesurables };
    }
  }

  // Hygiène des équipements rattachés au stand (§15.156).
  if (options.hygiene) {
    const { rows: nc } = await c.query<{ stand_id: string; n: number }>(
      `SELECT e.stand_id, count(*)::int AS n
         FROM hygiene_releve r JOIN hygiene_equipement e ON e.lieu_id = r.lieu_id AND e.id = r.equipement_id
        WHERE r.lieu_id = $1 AND NOT r.conforme AND r.saisi_le > $2::timestamptz - interval '7 days' AND e.stand_id IS NOT NULL
        GROUP BY e.stand_id`,
      [lieuId, maintenant],
    );
    for (const r of nc) {
      const d = donnees.get(r.stand_id);
      if (d) d.hygiene.nonConformes = r.n;
    }
    if (enCours) {
      const { rows: oublies } = await c.query<{ stand_id: string; nom: string }>(
        `SELECT e.stand_id, e.nom FROM hygiene_equipement e
          WHERE e.lieu_id = $1 AND e.actif AND e.sorte <> 'friteuse' AND e.stand_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM hygiene_releve r WHERE r.lieu_id = e.lieu_id AND r.equipement_id = e.id AND r.moment = 'ouverture' AND r.evenement_id = $2)
          ORDER BY lower(e.nom)`,
        [lieuId, enCours.id],
      );
      for (const o of oublies) donnees.get(o.stand_id)?.hygiene.ouvertureARelever.push(o.nom);
    }
  }

  return planStade([...donnees.values()], enCours ? { id: enCours.id, libelle: enCours.libelle } : null, maintenant.getTime());
}

export async function routesPlanStade(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/plan-stade", async (req): Promise<PlanStade> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lirePlanStade(c, auth.lieuId));
  });
}
