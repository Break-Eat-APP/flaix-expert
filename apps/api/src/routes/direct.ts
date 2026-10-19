import type { FastifyInstance } from "fastify";
import { tableauDirect, type TableauDirect, type TicketHorodate } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { listerEvenements } from "./evenements.ts";
import { prevision } from "./prevision.ts";
import { statsMatch } from "./resultats.ts";
import { contexte } from "./outils.ts";

/** Tickets d'un événement (ventes et annulations), à leur heure. */
async function ticketsDe(c: Client, lieuId: string, evenementId: string): Promise<TicketHorodate[]> {
  const { rows } = await c.query<{ le: Date; ca: number; type: string }>(
    `SELECT horodatage AS le, total_ttc_centimes AS ca, type FROM journal_caisse
      WHERE lieu_id = $1 AND evenement_id = $2 AND type IN ('vente', 'annulation') ORDER BY horodatage`,
    [lieuId, evenementId],
  );
  return rows.map((r) => ({ le: r.le.getTime(), ca: r.ca, vente: r.type === "vente" }));
}

/**
 * Le tableau En direct (dossier §15.167) : chiffres de l'événement ouvert comparés au dernier événement clos qui a des
 * ventes, au même temps écoulé depuis l'ouverture ; marge, prévision, catégories, meilleurs produits. Null sans
 * événement ouvert. Lecture seule.
 */
export async function lireTableauDirect(c: Client, lieuId: string, maintenant = Date.now()): Promise<TableauDirect | null> {
  const evenements = await listerEvenements(c, lieuId);
  const e = evenements.find((x) => x.etat === "ouvert");
  if (!e?.ouvertLe) return null;
  const stats = await statsMatch(c, lieuId, e);
  const tickets = await ticketsDe(c, lieuId, e.id);

  let precedent: { libelle: string; ouvertLe: string; tickets: TicketHorodate[] } | null = null;
  const clos = evenements
    .filter((x) => x.etat === "clos" && x.ouvertLe && Date.parse(x.ouvertLe) < Date.parse(e.ouvertLe!))
    .sort((a, b) => Date.parse(b.ouvertLe!) - Date.parse(a.ouvertLe!))
    .slice(0, 5);
  for (const x of clos) {
    const t = await ticketsDe(c, lieuId, x.id);
    if (t.length) {
      precedent = { libelle: x.libelle, ouvertLe: x.ouvertLe!, tickets: t };
      break;
    }
  }
  const prevue = (await prevision(c, lieuId, e.id)).prevision?.ca ?? null;

  return tableauDirect({
    evenement: { id: e.id, libelle: e.libelle, ouvertLe: e.ouvertLe, spectateurs: e.spectateurs },
    maintenant,
    tickets,
    precedent,
    stats: {
      caHt: stats.caHt,
      margeBrute: stats.margeBrute,
      produitsSansCout: stats.produitsSansCout.length,
      parCategorie: stats.parCategorie,
      produits: stats.produits.map((p) => ({ nom: p.nom, caTtc: p.caTtc, quantite: p.quantite })),
    },
    prevision: prevue,
  });
}

export async function routesDirect(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/direct", async (req): Promise<TableauDirect | null> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireTableauDirect(c, auth.lieuId));
  });
}
