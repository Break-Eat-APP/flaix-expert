import type { FastifyInstance } from "fastify";
import {
  briefDeSoiree,
  ecartEvenement,
  ecartsDeStock,
  empreinteRapport,
  especesDuRapport,
  topProduits,
  type Evenement,
  type RapportSoiree,
  type BriefSoiree,
  type RapportSoireeFige,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { lireClotureMatch } from "./clotures.ts";
import { listerEvenements } from "./evenements.ts";
import { alertes, resumeMatchs, statsMatch } from "./resultats.ts";
import { financesSoiree } from "./finances.ts";
import { stockDuMatch } from "./stock.ts";
import { stockIngredientsDuMatch } from "./stock-ingredients.ts";
import { ParamId, contexte } from "./outils.ts";

/*
 * Rapport de soirée (module 9 ; dossier §14 module 9, §15.131). Il lit les modules existants une fois
 * l'événement clos — Résultats, Clôtures, Stock, Équipe, Z — sans rien recalculer, puis il est figé :
 * une ligne en écriture seule, scellée par son empreinte. Établi en clôturant l'événement ; pour un
 * événement clos avant que le rapport existe, à la première lecture (« a posteriori »).
 */

/** Rassemble le rapport d'un événement clos, à partir des modules existants. */
async function etablirRapport(c: Client, lieuId: string, e: Evenement): Promise<RapportSoiree> {
  const stats = await statsMatch(c, lieuId, e);
  // Résultat de la soirée tel que le montre Gestion financière à cet instant (dépenses et cible comprises).
  const finances = await financesSoiree(c, lieuId, e);
  const cascade = { caHt: finances.caHt, margeBrute: finances.margeBrute, margeNette: finances.margeNette, lignes: finances.cascade };

  // Comparaison : l'événement joué juste avant qui a des ventes (jamais une moyenne).
  const joues = await resumeMatchs(c, lieuId);
  const rang = joues.findIndex((m) => m.id === e.id);
  const anterieur = rang >= 0 ? joues[rang + 1] : undefined;
  const evenementPrecedent = anterieur ? (await listerEvenements(c, lieuId)).find((x) => x.id === anterieur.id) : undefined;
  const precedent = evenementPrecedent ? await statsMatch(c, lieuId, evenementPrecedent) : null;
  const cascadePrecedente = evenementPrecedent ? await financesSoiree(c, lieuId, evenementPrecedent) : null;

  const { rows: reductions } = await c.query<{ remises: number; offerts: number; fidelite: number }>(
    `SELECT coalesce(sum(l.remise_centimes), 0)::int AS remises, coalesce(sum(l.offert_centimes), 0)::int AS offerts, coalesce(sum(l.fidelite_centimes), 0)::int AS fidelite
       FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2`,
    [lieuId, e.id],
  );
  const { rows: lieu } = await c.query<{ nom: string; raison_sociale: string | null; formation: boolean }>(
    "SELECT nom, raison_sociale, formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1",
    [lieuId],
  );
  const { rows: z } = await c.query<{ sequence: number; total: string; perpetuel: string }>(
    "SELECT sequence, total_ttc_centimes AS total, perpetuel_apres_centimes AS perpetuel FROM cloture_periode WHERE lieu_id = $1 AND evenement_id = $2 AND niveau = 'match'",
    [lieuId, e.id],
  );

  return {
    evenement: { id: e.id, libelle: e.libelle, debut: e.debut, closLe: e.closLe, spectateurs: e.spectateurs },
    lieu: { nom: lieu[0]!.nom, raisonSociale: lieu[0]!.raison_sociale, formation: lieu[0]!.formation },
    ventes: {
      encaisseTtc: stats.caTtc,
      caHt: cascade.caHt,
      tva: stats.tva,
      parTaux: stats.parTaux,
      tickets: stats.tickets,
      panierMoyen: stats.panierMoyen,
      caParSpectateur: stats.caParSpectateur,
      parMode: stats.parMode,
      parStand: stats.parStand.map((s) => ({ nom: s.nom, ca: s.ca })),
      parCategorie: stats.parCategorie,
      annulations: stats.annulations,
      reductions: reductions[0]!,
    },
    cascade: cascade.lignes,
    margeBrute: cascade.margeBrute,
    margeNette: cascade.margeNette,
    personnel: { montant: stats.personnel.reel, affectations: stats.personnel.affectations, tauxManquants: stats.personnel.tauxManquants },
    depenses: finances.depenses.filter((d) => d.mode !== null).map((d) => ({ nom: d.nom, montant: d.montant, pourcentPb: d.mode === "pourcent" ? d.valeur : null })),
    cibleMargeNette: finances.etatCible,
    produitsSansCout: stats.produitsSansCout,
    especes: especesDuRapport(await lireClotureMatch(c, lieuId, e.id)),
    stock: ecartsDeStock(await stockDuMatch(c, lieuId, e), await stockIngredientsDuMatch(c, lieuId, e)),
    comparaison: {
      evenement: evenementPrecedent ? { libelle: evenementPrecedent.libelle, debut: evenementPrecedent.debut } : null,
      encaisseTtc: ecartEvenement(stats.caTtc, precedent?.caTtc),
      tickets: ecartEvenement(stats.tickets, precedent?.tickets),
      panierMoyen: ecartEvenement(stats.panierMoyen, precedent?.panierMoyen),
      spectateurs: ecartEvenement(e.spectateurs, evenementPrecedent?.spectateurs),
      margeBrute: ecartEvenement(cascade.margeBrute, cascadePrecedente?.margeBrute),
      margeNette: ecartEvenement(cascade.margeNette, cascadePrecedente?.margeNette),
    },
    top: topProduits(stats.produits),
    alertes: await alertes(c, lieuId, e, stats),
    z: z[0] ? { sequence: z[0].sequence, totalTtc: Number(z[0].total), perpetuel: Number(z[0].perpetuel) } : null,
  };
}

interface LigneRapport {
  contenu: RapportSoiree;
  etabli_le: Date;
  etabli_a: RapportSoireeFige["etabliA"];
  etabli_par: string;
  empreinte: string;
}

export async function lireRapport(c: Client, lieuId: string, evenementId: string): Promise<RapportSoireeFige | null> {
  const { rows } = await c.query<LigneRapport>(
    `SELECT r.contenu, r.etabli_le, r.etabli_a, u.nom AS etabli_par, r.empreinte
       FROM rapport_soiree r JOIN utilisateur u ON u.id = r.etabli_par
      WHERE r.lieu_id = $1 AND r.evenement_id = $2`,
    [lieuId, evenementId],
  );
  const r = rows[0];
  return r ? { rapport: r.contenu, etabliLe: r.etabli_le.toISOString(), etabliA: r.etabli_a, etabliPar: r.etabli_par, empreinte: r.empreinte } : null;
}

/** Établit et fige le rapport d'un événement clos ; sans effet s'il existe déjà. */
export async function figerRapportSoiree(c: Client, lieuId: string, utilisateurId: string, evenementId: string, etabliA: RapportSoireeFige["etabliA"]): Promise<void> {
  const e = (await listerEvenements(c, lieuId)).find((x) => x.id === evenementId);
  if (!e) throw introuvable("Événement");
  if (e.etat !== "clos") throw new ErreurMetier(409, "Le rapport de soirée s'établit à la clôture de l'événement : clos-le d'abord dans Clôtures.");
  if (await lireRapport(c, lieuId, evenementId)) return;
  const rapport = await etablirRapport(c, lieuId, e);
  // Précision à la milliseconde, gardée telle quelle par la base : l'empreinte se recalcule à l'identique.
  const etabliLe = new Date();
  const empreinte = empreinteRapport(evenementId, etabliLe.toISOString(), etabliA, rapport);
  const { rowCount } = await c.query(
    `INSERT INTO rapport_soiree (lieu_id, evenement_id, contenu, etabli_le, etabli_a, etabli_par, empreinte)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (evenement_id) DO NOTHING`,
    [lieuId, evenementId, JSON.stringify(rapport), etabliLe, etabliA, utilisateurId, empreinte],
  );
  if (rowCount === 1) {
    await inscrireJet(c, { lieuId, type: "rapport_soiree_etabli", utilisateurId, details: { evenementId, match: e.libelle, etabliA, empreinte } });
  }
}

export async function routesRapportSoiree(app: FastifyInstance, { base }: { base: Base }) {
  // Lecture du rapport figé ; un événement clos avant l'existence du rapport reçoit le sien à la première lecture.
  app.get("/api/rapports-soiree/:id", async (req): Promise<RapportSoireeFige & { integre: boolean; brief: BriefSoiree }> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await figerRapportSoiree(c, auth.lieuId, auth.utilisateurId, id, "a_posteriori");
      const r = (await lireRapport(c, auth.lieuId, id))!;
      // Contrôle à chaque lecture : le contenu relu donne-t-il toujours la même empreinte ?
      // Le brief de fin de soirée se déduit du rapport figé (§15.135) : le même que celui envoyé sur le téléphone.
      return { ...r, integre: empreinteRapport(id, r.etabliLe, r.etabliA, r.rapport) === r.empreinte, brief: briefDeSoiree(r.rapport) };
    });
  });
}
