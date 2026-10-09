import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PREVISION, evenementTermine, prevoir, tempsDeService, verdict, type Evenement, type EvenementComparable, type ReponsePrevision } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { lireOptions } from "../options.ts";
import { listerEvenements } from "./evenements.ts";
import { resumeMatchs } from "./resultats.ts";
import { stockDuMatch } from "./stock.ts";
import { Uuid, contexte } from "./outils.ts";

/*
 * Prévision du prochain événement (dossier §15.143) : statistique simple sur les derniers événements clos,
 * ramenée à l'affluence prévue quand elle est saisie. La route lit ; le calcul est dans packages/domain/src/prevision.ts.
 */

const Choix = z.object({ evenementId: Uuid.optional() });
/** Événements joués dont la prévision est vérifiée (fiabilité affichée). */
const VERIFIES = 5;

const jouerLe = (e: Evenement) => Date.parse(e.ouvertLe ?? e.debut);

/** Ventes par stand et produit, CA, tickets et tickets de l'heure de pointe de chaque événement joué. */
async function comparables(c: Client, lieuId: string, evs: readonly Evenement[]): Promise<Map<string, EvenementComparable>> {
  const ids = evs.map((e) => e.id);
  const resultat = new Map<string, EvenementComparable>();
  if (ids.length === 0) return resultat;
  const resume = new Map((await resumeMatchs(c, lieuId)).map((m) => [m.id, m]));
  for (const e of evs) {
    const r = resume.get(e.id);
    resultat.set(e.id, { id: e.id, libelle: e.libelle, debut: e.debut, spectateurs: e.spectateurs, caTtc: r?.caTtc ?? 0, tickets: r?.tickets ?? 0, ventes: [], picParStand: {} });
  }
  // Les lignes des annulations portent des quantités négatives : les sommes sont nettes.
  const { rows: ventes } = await c.query<{ evenement_id: string; stand_id: string; stand: string; produit_id: string; produit: string; q: number }>(
    `SELECT j.evenement_id, j.stand_id, s.nom AS stand, l.produit_id, p.nom AS produit, sum(l.quantite)::int AS q
       FROM ligne_gestion l JOIN vente_gestion j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
       JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
      WHERE l.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[])
      GROUP BY 1, 2, 3, 4, 5`,
    [lieuId, ids],
  );
  for (const v of ventes) resultat.get(v.evenement_id)!.ventes.push({ standId: v.stand_id, stand: v.stand, produitId: v.produit_id, produit: v.produit, quantite: v.q });
  const { rows: pics } = await c.query<{ evenement_id: string; stand_id: string; pic: number }>(
    `SELECT evenement_id, stand_id, max(n)::int AS pic FROM (
       SELECT evenement_id, stand_id, date_trunc('hour', horodatage) AS h,
              count(*) FILTER (WHERE type = 'vente') - count(*) FILTER (WHERE type = 'annulation') AS n
         FROM vente_gestion WHERE lieu_id = $1 AND evenement_id = ANY($2::uuid[]) AND type IN ('vente', 'annulation') AND stand_id IS NOT NULL
        GROUP BY 1, 2, 3) x
      GROUP BY 1, 2`,
    [lieuId, ids],
  );
  for (const p of pics) resultat.get(p.evenement_id)!.picParStand[p.stand_id] = p.pic;
  return resultat;
}

export async function prevision(c: Client, lieuId: string, evenementId: string | undefined): Promise<ReponsePrevision> {
  const evenements = await listerEvenements(c, lieuId);
  const avecVentes = new Set((await resumeMatchs(c, lieuId)).map((m) => m.id));
  const joues = evenements.filter((e) => avecVentes.has(e.id) && evenementTermine(e, true)).sort((a, b) => jouerLe(b) - jouerLe(a));
  const maintenant = Date.now();
  const aVenir = evenements.filter((e) => e.etat === "a_venir" && Date.parse(e.debut) >= maintenant - 6 * 3_600_000).sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  const cible = evenementId
    ? evenements.find((e) => e.id === evenementId)
    : (aVenir[0] ?? evenements.find((e) => e.etat === "ouvert") ?? joues[0]);
  if (!cible && evenementId) throw introuvable("Événement");
  if (!cible) return { evenement: null, choix: [], prevision: null, restes: {}, cadences: {}, realise: null, fiabilite: null };

  // Données des événements joués nécessaires : les comparables de la cible et ceux des événements vérifiés.
  const avant = (e: Evenement) => joues.filter((x) => x.id !== e.id && jouerLe(x) < jouerLe(e));
  const verifies = joues.slice(0, VERIFIES);
  const utiles = new Set([...avant(cible).slice(0, PREVISION.comparables), ...verifies.flatMap((v) => [v, ...avant(v).slice(0, PREVISION.comparables)])].map((e) => e.id));
  const donnees = await comparables(c, lieuId, joues.filter((e) => utiles.has(e.id)));
  const historique = (e: Evenement) => avant(e).slice(0, PREVISION.comparables).map((x) => donnees.get(x.id)!);

  const prevue = prevoir(cible.spectateurs, historique(cible));

  // Fiabilité : sur les derniers événements joués, le CA réel tombe-t-il dans la fourchette prévue avec les seuls événements d'avant ?
  let dansLaFourchette = 0, verifiables = 0;
  for (const v of verifies) {
    const p = prevoir(v.spectateurs, historique(v));
    if (!p?.ca) continue;
    verifiables++;
    if (verdict(donnees.get(v.id)!.caTtc, p.ca) === "dans") dansLaFourchette++;
  }

  // Reste compté au stand (même reste que Stock) et cadence en file mesurée (§15.139) sur les comparables.
  const restes: Record<string, number> = {};
  if ((await lireOptions(c, lieuId)).stock && cible.etat !== "clos") {
    for (const s of (await stockDuMatch(c, lieuId, cible)).stands) for (const l of s.lignes) if (l.reste) restes[`${s.standId}|${l.produitId}`] = l.reste;
  }
  const cadences: Record<string, number> = {};
  const idsComparables = prevue?.comparables.map((x) => x.id) ?? [];
  if (idsComparables.length) {
    const { rows } = await c.query<{ numero: number; stand: string; debut: Date | null; fin: Date }>(
      `SELECT k.numero, s.nom AS stand, m.debut_saisie AS debut, j.horodatage AS fin
         FROM journal_caisse j JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id
         LEFT JOIN mesure_ticket m ON m.lieu_id = j.lieu_id AND m.journal_id = j.id
        WHERE j.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[]) AND j.type = 'vente'`,
      [lieuId, idsComparables],
    );
    for (const s of tempsDeService(rows.map((r) => ({ caisse: r.numero, stand: r.stand, debut: r.debut?.getTime() ?? null, fin: r.fin.getTime() }))).parCaisse) {
      // Cadence d'une caisse du stand (la meilleure mesurée) : le nombre de caisses se calcule par caisse.
      const stand = s.libelle.replace(/^Caisse \d+ \((.*)\)$/, "$1");
      if (s.cadenceEnFile !== null) cadences[stand] = Math.max(cadences[stand] ?? 0, s.cadenceEnFile);
    }
  }

  let realise: ReponsePrevision["realise"] = null;
  if (avecVentes.has(cible.id) && (cible.etat === "ouvert" || evenementTermine(cible, true))) {
    const d = (await comparables(c, lieuId, [cible])).get(cible.id)!;
    realise = { ca: d.caTtc, tickets: d.tickets, produits: Object.fromEntries(d.ventes.map((v) => [`${v.standId}|${v.produitId}`, v.quantite])) };
  }

  return {
    evenement: { id: cible.id, libelle: cible.libelle, debut: cible.debut, etat: cible.etat, spectateurs: cible.spectateurs },
    choix: [...aVenir.slice(0, 5), ...evenements.filter((e) => e.etat === "ouvert"), ...joues.slice(0, 8)].map((e) => ({ id: e.id, libelle: e.libelle, debut: e.debut, etat: e.etat })),
    prevision: prevue,
    restes,
    cadences,
    realise,
    fiabilite: verifiables ? { evenements: verifiables, dansLaFourchette } : null,
  };
}

export async function routesPrevision(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/prevision", async (req): Promise<ReponsePrevision> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = Choix.parse(req.query);
    return base.transaction(contexte(auth), (c) => prevision(c, auth.lieuId, evenementId));
  });
}
