import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  analyserPertes,
  dansPeriode,
  especesDuRapport,
  estJour,
  idPeriode,
  tempsDeService,
  type ControleTicket,
  type EntreePertes,
  type Evenement,
  type LigneProduitStand,
  type ReponsePertes,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { lireClotureMatch } from "./clotures.ts";
import { listerEvenements } from "./evenements.ts";
import { statsEvenements } from "./resultats.ts";
import { stockDuMatch } from "./stock.ts";
import { stockIngredientsDuMatch } from "./stock-ingredients.ts";
import { Uuid, contexte } from "./outils.ts";

/*
 * Revenue Engine — « Où je perds de l'argent » (dossier §15.138). La route ne calcule rien : elle lit
 * Résultats, Stock, Clôtures et l'heure des tickets, puis confie tout au moteur (packages/domain/src/pertes.ts).
 * Un ticket annulé ne compte jamais : ni dans les ventes, ni dans le rythme d'un stand.
 */

const Jour = z.string().refine(estJour, "Date invalide (AAAA-MM-JJ).");
const Choix = z
  .object({ evenementId: Uuid.optional(), du: Jour.optional(), au: Jour.optional() })
  .refine((x) => (x.du === undefined) === (x.au === undefined), "Indique le premier et le dernier jour de la période.")
  .refine((x) => !x.du || !x.au || x.du <= x.au, "Le premier jour doit précéder le dernier.")
  .refine((x) => !!x.evenementId !== !!x.du, "Choisis un événement ou une période.");

/** Ventes de l'événement qui n'ont pas été annulées. */
const NON_ANNULEE = `j.type = 'vente' AND NOT EXISTS (SELECT 1 FROM journal_caisse a WHERE a.lieu_id = j.lieu_id AND a.ref_evenement = j.id)`;

/** Ce que le moteur lit pour un événement : ruptures, écarts de stock, espèces et rythme des caisses. */
async function lireEvenement(c: Client, lieuId: string, e: Evenement, entree: EntreePertes, cumul: { parStand: Map<string, LigneProduitStand>; suivi: { stock: boolean; especes: boolean } }) {
  const { rows: tickets } = await c.query<{ stand_id: string; numero: number; stand: string; le: Date }>(
    `SELECT j.stand_id, k.numero, s.nom AS stand, j.horodatage AS le
       FROM journal_caisse j JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id
      WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND ${NON_ANNULEE}`,
    [lieuId, e.id],
  );
  const { rows: lignes } = await c.query<{ stand_id: string; stand: string; produit_id: string; produit: string; le: Date; q: number; ht: number }>(
    `SELECT j.stand_id, s.nom AS stand, l.produit_id, p.nom AS produit, j.horodatage AS le, l.quantite AS q, l.ht_centimes AS ht
       FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
       JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2 AND ${NON_ANNULEE}`,
    [lieuId, e.id],
  );

  const ticketsParStand = new Map<string, number[]>();
  const ticketsParCaisse = new Map<number, { stand: string; tickets: number[] }>();
  for (const t of tickets) {
    ticketsParStand.set(t.stand_id, [...(ticketsParStand.get(t.stand_id) ?? []), t.le.getTime()]);
    const k = ticketsParCaisse.get(t.numero) ?? { stand: t.stand, tickets: [] };
    k.tickets.push(t.le.getTime());
    ticketsParCaisse.set(t.numero, k);
    entree.ticketsParStand[t.stand_id] = (entree.ticketsParStand[t.stand_id] ?? 0) + 1;
  }
  for (const [caisse, k] of ticketsParCaisse) entree.caisses.push({ evenement: e.libelle, caisse, stand: k.stand, tickets: k.tickets });
  const ventes = new Map<string, { t: number; q: number }[]>();
  for (const l of lignes) {
    const cle = `${l.stand_id}|${l.produit_id}`;
    ventes.set(cle, [...(ventes.get(cle) ?? []), { t: l.le.getTime(), q: l.q }]);
    const cumule = cumul.parStand.get(cle) ?? { produitId: l.produit_id, produit: l.produit, standId: l.stand_id, stand: l.stand, quantite: 0, caHt: 0 };
    cumule.quantite += l.q;
    cumule.caHt += l.ht;
    cumul.parStand.set(cle, cumule);
  }

  // Stock : ruptures (stock suivi tombé à zéro) et écarts de comptage.
  const stock = await stockDuMatch(c, lieuId, e);
  const ingredients = await stockIngredientsDuMatch(c, lieuId, e);
  cumul.suivi.stock ||= stock.restes.requis || ingredients.restes.requis;
  for (const s of stock.stands) {
    for (const l of s.lignes) {
      if (l.ecart !== null && l.ecart !== 0) entree.stock.push({ evenement: e.libelle, cle: `p:${l.produitId}`, nom: l.nom, stand: s.nom, ecart: l.ecart, valeur: l.ecartValeur, unite: null });
      if (l.alerte !== "rupture") continue;
      const cle = `${s.standId}|${l.produitId}`;
      const v = ventes.get(cle) ?? [];
      entree.ruptures.push({
        evenement: e.libelle,
        standId: s.standId,
        stand: s.nom,
        produitId: l.produitId,
        produit: l.nom,
        ticketsStand: ticketsParStand.get(s.standId) ?? [],
        ventesProduit: v,
        caHt: lignes.filter((x) => x.stand_id === s.standId && x.produit_id === l.produitId).reduce((t, x) => t + x.ht, 0),
        quantite: v.reduce((t, x) => t + x.q, 0),
        coutUnitaire: l.coutUnitaire,
      });
    }
  }
  for (const s of ingredients.stands) {
    for (const l of s.lignes) {
      if (l.ecart !== null && l.ecart !== 0) entree.stock.push({ evenement: e.libelle, cle: `i:${l.ingredientId}`, nom: l.nom, stand: s.nom, ecart: l.ecart, valeur: l.ecartValeur, unite: l.unite });
    }
  }

  // Espèces : le comptage qui fait foi, tiroir par tiroir, et le coffre.
  const especes = especesDuRapport(await lireClotureMatch(c, lieuId, e.id));
  cumul.suivi.especes ||= especes.tiroirs.some((t) => t.ecart !== null) || especes.coffre?.ecart != null;
  for (const t of especes.tiroirs) entree.especes.push({ evenement: e.libelle, libelle: `Caisse ${t.caisse} (${t.stand})`, ecart: t.ecart });
  if (especes.coffre) entree.especes.push({ evenement: e.libelle, libelle: "Coffre", ecart: especes.coffre.ecart });
}

export async function analysePertes(c: Client, lieuId: string, evs: readonly Evenement[], id: string): Promise<ReponsePertes> {
  const entree: EntreePertes = {
    evenements: evs.length,
    ruptures: [],
    stock: [],
    especes: [],
    sousTarif: [],
    produits: [],
    produitsParStand: [],
    ticketsParStand: {},
    reductions: { remises: 0, offerts: 0, fidelite: 0 },
    caisses: [],
  };
  const cumul = { parStand: new Map<string, LigneProduitStand>(), suivi: { stock: false, especes: false } };
  const ordre = [...evs].sort((a, b) => Date.parse(a.ouvertLe ?? a.debut) - Date.parse(b.ouvertLe ?? b.debut));
  for (const e of ordre) await lireEvenement(c, lieuId, e, entree, cumul);
  entree.produitsParStand = [...cumul.parStand.values()];

  let service = tempsDeService([]);
  if (evs.length) {
    const ids = evs.map((e) => e.id);
    // Temps de prise de commande (§15.139) : toutes les ventes, même annulées ensuite (elles ont occupé la caisse).
    const { rows: mesures } = await c.query<{ numero: number; stand: string; debut: Date | null; fin: Date }>(
      `SELECT k.numero, s.nom AS stand, m.debut_saisie AS debut, j.horodatage AS fin
         FROM journal_caisse j JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id
         LEFT JOIN mesure_ticket m ON m.lieu_id = j.lieu_id AND m.journal_id = j.id
        WHERE j.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[]) AND j.type = 'vente'`,
      [lieuId, ids],
    );
    service = tempsDeService(mesures.map((m) => ({ caisse: m.numero, stand: m.stand, debut: m.debut?.getTime() ?? null, fin: m.fin.getTime() })));
    entree.produits = (await statsEvenements(c, lieuId, evs, id)).produits;
    // Ventes sous le tarif : quantité vendue du produit signalé, sur les tickets non annulés.
    const { rows: ecarts } = await c.query<{ id: string; controle: ControleTicket }>(
      `SELECT j.id, j.controle FROM journal_caisse j WHERE j.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[]) AND j.controle ? 'ecartTarif' AND ${NON_ANNULEE}`,
      [lieuId, ids],
    );
    if (ecarts.length) {
      const { rows: q } = await c.query<{ journal_id: string; produit_id: string; q: number }>(
        "SELECT journal_id, produit_id, sum(quantite)::int AS q FROM ligne_ticket WHERE lieu_id = $1 AND journal_id = ANY($2::uuid[]) GROUP BY 1, 2",
        [lieuId, ecarts.map((x) => x.id)],
      );
      for (const t of ecarts) {
        for (const x of t.controle.ecartTarif ?? []) {
          if (x.prixTarif === null || x.tauxTarif === null) continue;
          const quantite = q.find((l) => l.journal_id === t.id && l.produit_id === x.produitId)?.q ?? 0;
          entree.sousTarif.push({ produit: x.libelle, quantite, prixVendu: x.prixVendu, prixTarif: x.prixTarif, tauxTarif: x.tauxTarif });
        }
      }
    }
    // Accordé : offerts, remises et fidélité, nets des annulations (mêmes chiffres que le rapport de soirée).
    const { rows: r } = await c.query<{ remises: number; offerts: number; fidelite: number }>(
      `SELECT coalesce(sum(l.remise_centimes), 0)::int AS remises, coalesce(sum(l.offert_centimes), 0)::int AS offerts, coalesce(sum(l.fidelite_centimes), 0)::int AS fidelite
         FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
        WHERE l.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[])`,
      [lieuId, ids],
    );
    entree.reductions = r[0]!;
  }

  return {
    evenements: ordre.map((e) => ({ id: e.id, libelle: e.libelle, debut: e.debut, etat: e.etat })),
    suivi: cumul.suivi,
    analyse: analyserPertes(entree),
    service,
  };
}

export async function routesPertes(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/pertes", async (req): Promise<ReponsePertes> => {
    const auth = await exigerDirecteur(req, base);
    const choix = Choix.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const evenements = await listerEvenements(c, auth.lieuId);
      if (choix.du && choix.au) {
        const p = { du: choix.du, au: choix.au };
        return analysePertes(c, auth.lieuId, evenements.filter((e) => dansPeriode(e.debut, p)), idPeriode(p));
      }
      const e = evenements.find((x) => x.id === choix.evenementId);
      if (!e) throw introuvable("Événement");
      return analysePertes(c, auth.lieuId, [e], e.id);
    });
  });
}
