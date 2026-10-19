import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RAYON_PLAN, SEUILS_STADE, clotureADistance, planStade, type DonneesStand, type EntreeDirect, type ModeleLieu, type PlanStade, type Tribune } from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { lireOptions } from "../options.ts";
import { listerEvenements } from "./evenements.ts";
import { stockDuMatch } from "./stock.ts";
import { Uuid, contexte, corps } from "./outils.ts";

const Coordonnee = z.number().finite().min(-RAYON_PLAN).max(RAYON_PLAN);
/** Ce que le directeur enregistre en sortant du mode « Placer les stands » : le décor, et les stands déplacés ou remis en automatique (null). */
const ModifPlan = z.object({
  modele: z.enum(["stade", "patinoire", "arene", "salle"]).optional(),
  positions: z
    .array(z.object({ standId: Uuid, position: z.object({ x: Coordonnee, z: Coordonnee }).nullable() }))
    .max(200)
    .default([]),
});

/**
 * Le stade en direct (dossier §15.162, revu au §15.163) : pour chaque stand actif, ce que lisent déjà Caisses, Stock et
 * Hygiène, plus le rythme de vente des 15 dernières minutes ; la couleur se calcule dans le moteur (planStade).
 * Lecture seule.
 */
export async function lirePlanStade(c: Client, lieuId: string, maintenant = new Date()): Promise<PlanStade> {
  const options = await lireOptions(c, lieuId);
  const evenements = await listerEvenements(c, lieuId);
  const enCours = evenements.find((e) => e.etat === "ouvert") ?? null;

  const { rows: lieu } = await c.query<{ plan_modele: ModeleLieu }>("SELECT plan_modele FROM lieu WHERE id = $1", [lieuId]);
  const { rows: stands } = await c.query<{ id: string; nom: string; tribune: Tribune | null; x: number | null; z: number | null }>(
    "SELECT id, nom, tribune, plan_x AS x, plan_z AS z FROM stand WHERE lieu_id = $1 AND actif ORDER BY lower(nom)",
    [lieuId],
  );
  const donnees = new Map<string, DonneesStand>(
    stands.map((s) => [
      s.id,
      { id: s.id, nom: s.nom, tribune: s.tribune, position: s.x === null || s.z === null ? null : { x: s.x, z: s.z }, caisses: [], recentes: { tickets: 0, caNet: 0 }, stock: [], hygiene: { nonConformes: 0, ouvertureARelever: [] } },
    ]),
  );

  // Caisses actives : ouverte ou non, nouvelles de la tablette ; pendant l'événement ouvert, CA et tickets (même calcul
  // que Caisses), annulations, ventes à un prix différent du tarif (contrôle à la réception) et dernière vente.
  const { rows: caisses } = await c.query<{
    stand_id: string;
    numero: number;
    ouverte_le: Date | null;
    vue_le: Date | null;
    tablette_sequence: number | null;
    tablette_attente: number | null;
    sequence_serveur: number;
    ca: number;
    tickets: number;
    annulations: number;
    hors_tarif: number;
    derniere: Date | null;
  }>(
    `SELECT k.stand_id, k.numero, so.ouverte_le, so.tablette_vue_le AS vue_le, so.tablette_sequence, so.tablette_attente,
            (SELECT coalesce(max(jc.sequence), 0) FROM journal_caisse jc WHERE jc.caisse_id = k.id)::int AS sequence_serveur,
            coalesce(sum(j.total_ttc_centimes), 0)::int AS ca,
            (count(j.id) FILTER (WHERE j.type = 'vente') - count(j.id) FILTER (WHERE j.type = 'annulation'))::int AS tickets,
            count(j.id) FILTER (WHERE j.type = 'annulation')::int AS annulations,
            count(j.id) FILTER (WHERE j.type = 'vente' AND j.controle ? 'ecartTarif')::int AS hors_tarif,
            max(j.horodatage) FILTER (WHERE j.type = 'vente') AS derniere
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
    donnees.get(k.stand_id)?.caisses.push({
      numero: k.numero,
      ouverte: k.ouverte_le !== null,
      ouverteLe: k.ouverte_le?.toISOString() ?? null,
      vueLe,
      aEnvoyer: distance.aEnvoyer,
      caNet: k.ca,
      tickets: k.tickets,
      annulations: k.annulations,
      horsTarif: k.hors_tarif,
      derniereVente: k.derniere?.toISOString() ?? null,
    });
  }

  if (enCours && options.stock) {
    // Produits suivis au stand (Stock, même règle), avec ce qui s'en est vendu ces 15 dernières minutes et la réserve.
    const { rows: recents } = await c.query<{ stand_id: string; produit_id: string; n: number }>(
      `SELECT j.stand_id, l.produit_id, sum(l.quantite)::int AS n
         FROM journal_caisse j JOIN ligne_ticket l ON l.lieu_id = j.lieu_id AND l.journal_id = j.id
        WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type = 'vente' AND j.horodatage > $3
        GROUP BY j.stand_id, l.produit_id`,
      [lieuId, enCours.id, new Date(maintenant.getTime() - SEUILS_STADE.rythmeMinutes * 60_000)],
    );
    const recent = new Map(recents.map((r) => [`${r.stand_id}:${r.produit_id}`, r.n]));
    const stock = await stockDuMatch(c, lieuId, enCours);
    for (const st of stock.stands)
      donnees.get(st.standId)?.stock.push(
        ...st.lignes
          .filter((l) => l.depart + l.reassort > 0)
          .map((l) => ({
            produitId: l.produitId,
            nom: l.nom,
            alerte: l.alerte,
            restant: l.restant,
            sur: l.depart + l.reassort,
            vendu: l.vendu,
            venduRecent: recent.get(`${st.standId}:${l.produitId}`) ?? 0,
            reserve: stock.reserve[l.produitId] ?? null,
          })),
      );
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

  // En direct (§15.166) : ventes des 10 dernières minutes par stand, et le match précédent au même moment de sa soirée.
  let entreeDirect: EntreeDirect | null = null;
  if (enCours?.ouvertLe) {
    const { rows: recentes } = await c.query<{ stand_id: string; tickets: number; ca: number }>(
      `SELECT j.stand_id, count(*) FILTER (WHERE j.type = 'vente')::int AS tickets, coalesce(sum(j.total_ttc_centimes), 0)::int AS ca
         FROM journal_caisse j
        WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type IN ('vente', 'annulation') AND j.horodatage > $3
        GROUP BY j.stand_id`,
      [lieuId, enCours.id, new Date(maintenant.getTime() - SEUILS_STADE.recentesMinutes * 60_000)],
    );
    for (const x of recentes) {
      const d = donnees.get(x.stand_id);
      if (d) d.recentes = { tickets: x.tickets, caNet: x.ca };
    }
    const ecoule = maintenant.getTime() - Date.parse(enCours.ouvertLe);
    const precedent = evenements
      .filter((e) => e.etat === "clos" && e.ouvertLe && Date.parse(e.ouvertLe) < Date.parse(enCours.ouvertLe!))
      .sort((a, b) => Date.parse(b.ouvertLe!) - Date.parse(a.ouvertLe!))[0];
    let comparaison: EntreeDirect["comparaison"] = null;
    if (precedent) {
      const { rows } = await c.query<{ ca: number; n: number }>(
        `SELECT coalesce(sum(total_ttc_centimes) FILTER (WHERE horodatage <= $3), 0)::int AS ca, count(*)::int AS n
           FROM journal_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND type IN ('vente', 'annulation')`,
        [lieuId, precedent.id, new Date(Date.parse(precedent.ouvertLe!) + ecoule)],
      );
      // Un match précédent sans aucune vente ne sert pas de repère.
      if (rows[0]!.n > 0) comparaison = { libelle: precedent.libelle, caNet: rows[0]!.ca };
    }
    entreeDirect = { ouvertLe: enCours.ouvertLe, comparaison };
  }

  return planStade(lieu[0]!.plan_modele, [...donnees.values()], enCours ? { id: enCours.id, libelle: enCours.libelle } : null, maintenant.getTime(), entreeDirect);
}

export async function routesPlanStade(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/plan-stade", async (req): Promise<PlanStade> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lirePlanStade(c, auth.lieuId));
  });

  // Décor du lieu et place des stands (§15.164), enregistrés d'un coup en sortant du mode « Placer les stands ».
  app.put("/api/plan-stade", async (req): Promise<PlanStade> => {
    const auth = await exigerDirecteur(req, base);
    const demande = corps(ModifPlan, req);
    return base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `plan-stade:${auth.lieuId}`);
      const { rows: lieu } = await c.query<{ plan_modele: ModeleLieu }>("SELECT plan_modele FROM lieu WHERE id = $1", [auth.lieuId]);
      const details: { modele?: { avant: ModeleLieu; apres: ModeleLieu }; stands?: { stand: string; position: { x: number; z: number } | null }[] } = {};
      if (demande.modele && demande.modele !== lieu[0]!.plan_modele) {
        await c.query("UPDATE lieu SET plan_modele = $2 WHERE id = $1", [auth.lieuId, demande.modele]);
        details.modele = { avant: lieu[0]!.plan_modele, apres: demande.modele };
      }
      for (const p of demande.positions) {
        const arrondi = p.position && { x: Math.round(p.position.x * 10) / 10, z: Math.round(p.position.z * 10) / 10 };
        const { rows } = await c.query<{ nom: string }>("UPDATE stand SET plan_x = $3, plan_z = $4 WHERE lieu_id = $1 AND id = $2 RETURNING nom", [
          auth.lieuId,
          p.standId,
          arrondi?.x ?? null,
          arrondi?.z ?? null,
        ]);
        if (!rows[0]) throw introuvable("Stand");
        (details.stands ??= []).push({ stand: rows[0].nom, position: arrondi });
      }
      if (details.modele || details.stands)
        await inscrireJet(c, { lieuId: auth.lieuId, type: "plan_stade_modifie", utilisateurId: auth.utilisateurId, details });
      return lirePlanStade(c, auth.lieuId);
    });
  });
}
