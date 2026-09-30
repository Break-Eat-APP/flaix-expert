import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  comptageCloturable,
  erreurCoupures,
  especesAttendues,
  formaterMontant,
  MOTIF_ECART_MIN,
  normaliserCoupures,
  totalCoupures,
  type ClotureMatch,
  type ComptageEspeces,
  type SessionACloturer,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Clôtures → Clôture du match (dossier §15.102) : l'assistant en 4 étapes des modules 7 et 10.
 * Ventes (lues dans le journal), restes (attend le module Stock), espèces (comptage par coupure,
 * Z définitif, rectification signée), clôture définitive du match (routes/evenements.ts).
 */

const Comptage = z.object({
  coupures: z.record(z.string(), z.number()),
  motif: z.string().trim().max(500).nullish().transform((v) => (v ? v : null)),
});
const Rectification = z.object({
  compte: z.number().int().min(0).max(100_000_000),
  motif: z.string().trim().min(MOTIF_ECART_MIN, "Motif obligatoire (5 caractères au moins).").max(500),
  signature: z.string().trim().min(3, "Signe en toutes lettres (prénom et nom).").max(120),
});
const ParEvenement = z.object({ evenementId: Uuid });

interface LigneComptage {
  id: string;
  session_id: string;
  type: "comptage" | "rectification";
  ref_comptage: string | null;
  coupures: Record<string, number>;
  fond_centimes: number;
  especes_centimes: number;
  sorties_centimes: number;
  attendu_centimes: number;
  compte_centimes: number;
  ecart_centimes: number;
  seuil_centimes: number;
  motif: string | null;
  signature: string | null;
  par: string;
  le: Date;
}

const versComptage = (r: LigneComptage): ComptageEspeces => ({
  id: r.id,
  type: r.type,
  refComptage: r.ref_comptage,
  coupures: r.coupures,
  fond: r.fond_centimes,
  especes: r.especes_centimes,
  sorties: r.sorties_centimes,
  attendu: r.attendu_centimes,
  compte: r.compte_centimes,
  ecart: r.ecart_centimes,
  seuil: r.seuil_centimes,
  motif: r.motif,
  signature: r.signature,
  par: r.par,
  le: r.le.toISOString(),
});

async function seuilDuLieu(c: Client, lieuId: string): Promise<number> {
  const { rows } = await c.query<{ seuil: number }>("SELECT seuil_ecart_especes_centimes AS seuil FROM lieu WHERE id = $1", [lieuId]);
  return rows[0]?.seuil ?? 500;
}

/** Tout ce que montre l'assistant de clôture pour un match. */
export async function lireClotureMatch(c: Client, lieuId: string, evenementId: string): Promise<ClotureMatch> {
  const evenement = (await listerEvenements(c, lieuId)).find((e) => e.id === evenementId);
  if (!evenement) throw introuvable("Match");
  const { rows: sessions } = await c.query<{
    id: string;
    caisse_id: string;
    numero: number;
    caisse_nom: string | null;
    stand_nom: string;
    ouverte_par: string;
    ouverte_le: Date;
    fermee_le: Date | null;
    fond_centimes: number | null;
    nb_ventes: number;
    nb_annulations: number;
    net: number;
    especes: number;
    carte: number;
  }>(
    `SELECT s.id, s.caisse_id, k.numero, k.nom AS caisse_nom, st.nom AS stand_nom, u.nom AS ouverte_par, s.ouverte_le, s.fermee_le, s.fond_centimes,
            count(j.id) FILTER (WHERE j.type = 'vente')::int AS nb_ventes,
            count(j.id) FILTER (WHERE j.type = 'annulation')::int AS nb_annulations,
            coalesce(sum(j.total_ttc_centimes), 0)::int AS net,
            coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'especes'), 0)::int AS especes,
            coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'carte'), 0)::int AS carte
       FROM session_caisse s
       JOIN caisse k ON k.lieu_id = s.lieu_id AND k.id = s.caisse_id
       JOIN stand st ON st.lieu_id = s.lieu_id AND st.id = s.stand_id
       JOIN utilisateur u ON u.id = s.ouverte_par
       LEFT JOIN journal_caisse j ON j.session_id = s.id AND j.type IN ('vente', 'annulation')
      WHERE s.lieu_id = $1 AND s.evenement_id = $2
      GROUP BY s.id, k.numero, k.nom, st.nom, u.nom
      ORDER BY k.numero, s.ouverte_le`,
    [lieuId, evenementId],
  );
  const { rows: comptages } = await c.query<LigneComptage>(
    `SELECT ce.*, u.nom AS par FROM comptage_especes ce JOIN utilisateur u ON u.id = ce.par
      WHERE ce.lieu_id = $1 AND ce.evenement_id = $2 ORDER BY ce.le`,
    [lieuId, evenementId],
  );
  const vues: SessionACloturer[] = sessions.map((s) => {
    const siens = comptages.filter((x) => x.session_id === s.id);
    const z = siens.find((x) => x.type === "comptage");
    return {
      sessionId: s.id,
      caisseId: s.caisse_id,
      caisseNumero: s.numero,
      caisseNom: s.caisse_nom,
      standNom: s.stand_nom,
      ouvertePar: s.ouverte_par,
      ouverteLe: s.ouverte_le.toISOString(),
      fermeeLe: s.fermee_le ? s.fermee_le.toISOString() : null,
      nbVentes: s.nb_ventes,
      nbAnnulations: s.nb_annulations,
      net: s.net,
      especes: s.especes,
      carte: s.carte,
      fond: s.fond_centimes,
      attendu: s.fond_centimes === null ? null : especesAttendues(s.fond_centimes, s.especes),
      comptage: z ? versComptage(z) : null,
      rectifications: siens.filter((x) => x.type === "rectification").map(versComptage),
    };
  });
  const ventes = vues.length > 0 && vues.every((s) => s.fermeeLe !== null);
  const especes = vues.every((s) => s.fond === null || s.comptage !== null);
  return {
    evenement,
    seuilEcartEspeces: await seuilDuLieu(c, lieuId),
    sessions: vues,
    etapes: { ventes, restes: "a_venir", especes, cloturable: evenement.etat === "ouvert" && ventes && especes },
  };
}

export async function routesClotures(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/clotures", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), (c) => lireClotureMatch(c, auth.lieuId, evenementId));
  });

  // ---------- Z d'un tiroir : comptage par coupure, définitif ----------
  app.post("/api/sessions-caisse/:id/comptage", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { coupures, motif } = corps(Comptage, req);
    const erreur = erreurCoupures(coupures);
    if (erreur) throw new ErreurMetier(400, erreur);
    return base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `comptage:${id}`);
      const { rows } = await c.query<{ caisse_id: string; evenement_id: string; fermee_le: Date | null; fond_centimes: number | null; numero: number; etat: string; libelle: string }>(
        `SELECT s.caisse_id, s.evenement_id, s.fermee_le, s.fond_centimes, k.numero, e.etat, e.libelle
           FROM session_caisse s
           JOIN caisse k ON k.lieu_id = s.lieu_id AND k.id = s.caisse_id
           JOIN evenement e ON e.lieu_id = s.lieu_id AND e.id = s.evenement_id
          WHERE s.lieu_id = $1 AND s.id = $2`,
        [auth.lieuId, id],
      );
      const s = rows[0];
      if (!s) throw introuvable("Session de caisse");
      // Même verrou que la clôture du match : un Z et la clôture du match ne se croisent jamais.
      await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [auth.lieuId, s.evenement_id]);
      const { rows: etat } = await c.query<{ etat: string }>("SELECT etat FROM evenement WHERE lieu_id = $1 AND id = $2", [auth.lieuId, s.evenement_id]);
      s.etat = etat[0]!.etat;
      if (!s.fermee_le) throw new ErreurMetier(409, `La caisse ${s.numero} est encore ouverte : clôture-la depuis sa tablette avant de compter le tiroir.`);
      if (s.fond_centimes === null) throw new ErreurMetier(409, `La caisse ${s.numero} n'accepte pas les espèces : pas de tiroir à compter.`);
      if (s.etat === "clos") throw new ErreurMetier(409, "Ce match est clos : un Z oublié ne se saisit plus, il se corrige par une rectification tracée.");
      const { rows: deja } = await c.query("SELECT 1 FROM comptage_especes WHERE session_id = $1 AND type = 'comptage'", [id]);
      if (deja[0]) throw new ErreurMetier(409, "Ce tiroir a déjà son Z : pour le corriger, enregistre une rectification.");

      const { rows: ventes } = await c.query<{ especes: number }>(
        "SELECT coalesce(sum(total_ttc_centimes), 0)::int AS especes FROM journal_caisse WHERE session_id = $1 AND type IN ('vente', 'annulation') AND mode_reglement = 'especes'",
        [id],
      );
      const especes = ventes[0]!.especes;
      const seuil = await seuilDuLieu(c, auth.lieuId);
      const propres = normaliserCoupures(coupures);
      const compte = totalCoupures(propres);
      const attendu = especesAttendues(s.fond_centimes, especes);
      const ecart = compte - attendu;
      if (!comptageCloturable(ecart, seuil, motif)) {
        throw new ErreurMetier(400, `Écart de ${formaterMontant(Math.abs(ecart))}, au-delà de la tolérance de ${formaterMontant(seuil)} : un motif est obligatoire (5 caractères au moins).`);
      }
      await c.query(
        `INSERT INTO comptage_especes (lieu_id, session_id, caisse_id, evenement_id, type, coupures, fond_centimes, especes_centimes, sorties_centimes,
                                       attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, par)
         VALUES ($1, $2, $3, $4, 'comptage', $5, $6, $7, 0, $8, $9, $10, $11, $12, $13)`,
        [auth.lieuId, id, s.caisse_id, s.evenement_id, JSON.stringify(propres), s.fond_centimes, especes, attendu, compte, ecart, seuil, motif, auth.utilisateurId],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "z_caisse_clos",
        utilisateurId: auth.utilisateurId,
        caisseId: s.caisse_id,
        details: { sessionId: id, caisse: s.numero, match: s.libelle, coupures: propres, fond: s.fond_centimes, especes, attendu, compte, ecart, seuil, motif },
      });
      return lireClotureMatch(c, auth.lieuId, s.evenement_id);
    });
  });

  // ---------- Rectification d'un Z : s'ajoute, ne remplace rien ----------
  app.post("/api/comptages/:id/rectification", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { compte, motif, signature } = corps(Rectification, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<LigneComptage & { caisse_id: string; evenement_id: string; numero: number }>(
        `SELECT ce.*, u.nom AS par, k.numero FROM comptage_especes ce
           JOIN utilisateur u ON u.id = ce.par
           JOIN caisse k ON k.lieu_id = ce.lieu_id AND k.id = ce.caisse_id
          WHERE ce.lieu_id = $1 AND ce.id = $2 AND ce.type = 'comptage'`,
        [auth.lieuId, id],
      );
      const z = rows[0];
      if (!z) throw introuvable("Z de caisse");
      const ecart = compte - z.attendu_centimes;
      await c.query(
        `INSERT INTO comptage_especes (lieu_id, session_id, caisse_id, evenement_id, type, ref_comptage, coupures, fond_centimes, especes_centimes,
                                       sorties_centimes, attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, signature, par)
         VALUES ($1, $2, $3, $4, 'rectification', $5, '{}'::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [auth.lieuId, z.session_id, z.caisse_id, z.evenement_id, id, z.fond_centimes, z.especes_centimes, z.sorties_centimes, z.attendu_centimes, compte, ecart, z.seuil_centimes, motif, signature, auth.utilisateurId],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "z_caisse_rectifie",
        utilisateurId: auth.utilisateurId,
        caisseId: z.caisse_id,
        details: { comptage: id, caisse: z.numero, compteAvant: z.compte_centimes, ecartAvant: z.ecart_centimes, compte, ecart, motif, signature },
      });
      return lireClotureMatch(c, auth.lieuId, z.evenement_id);
    });
  });
}
