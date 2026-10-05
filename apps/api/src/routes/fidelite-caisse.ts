import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  FORMAT_CODE_PROMO,
  etatCodePromo,
  jourParis,
  normaliserNumeroAbonne,
  type CodePromo,
  type CodePromoCaisse,
  type PointsAbonneCaisse,
  type ReservationCaisse,
  type TypeCodePromo,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerAccesCaisse } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { lireOptions, optionInactive } from "../options.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/**
 * Fidélité à la caisse (dossier §15.127, option A de Rémi) : la tablette demande au serveur le solde
 * d'un abonné et réserve ses points, ou réserve un usage d'un code promo plafonné, AVANT d'encaisser.
 * Le ticket scellé porte la réservation ; le serveur la consomme en recevant le ticket (caisse.ts).
 * Une réservation abandonnée expire seule au bout de deux heures.
 */
export const DUREE_RESERVATION_H = 2;

/** Réservations encore actives : ni consommées, ni libérées, ni expirées. */
const ACTIVE = "r.consommee_par IS NULL AND r.liberee_le IS NULL AND r.expire_le > now()";

interface Regles {
  pointsParEuro: number;
  palierPoints: number;
  valeurPalier: number;
}

async function regles(c: Client, lieuId: string): Promise<Regles | null> {
  const { rows } = await c.query<{ p: number | null; palier: number | null; valeur: number | null }>(
    "SELECT fid_points_par_euro AS p, fid_palier_points AS palier, fid_valeur_palier_centimes AS valeur FROM lieu WHERE id = $1",
    [lieuId],
  );
  const r = rows[0]!;
  return r.p === null || r.palier === null || r.valeur === null ? null : { pointsParEuro: r.p, palierPoints: r.palier, valeurPalier: r.valeur };
}

/**
 * Solde de points d'un abonné, lu dans les tickets non annulés : gagnés (euros entiers × points par
 * euro) − dépensés à la caisse + mouvements hors caisse (départ, ajustements).
 */
export async function soldePoints(c: Client, lieuId: string, abonneId: string, numero: string, pointsParEuro: number): Promise<{ solde: number; reserves: number }> {
  const { rows } = await c.query<{ euros: number; depenses: number; mouvements: number; reserves: number }>(
    `WITH t AS (
       SELECT v.total_ttc_centimes AS ttc, coalesce((v.details->'fidelite'->'points'->>'points')::int, 0) AS depense,
              EXISTS (SELECT 1 FROM journal_caisse a WHERE a.lieu_id = v.lieu_id AND a.ref_evenement = v.id AND a.type = 'annulation') AS annule
         FROM journal_caisse v
        WHERE v.lieu_id = $1 AND v.type = 'vente' AND v.details->'ajustement'->>'motif' = 'abonne'
          AND upper(btrim(v.details->'ajustement'->>'reference')) = $3)
     SELECT coalesce((SELECT sum(floor(ttc / 100.0)) FROM t WHERE NOT annule AND ttc > 0), 0)::int AS euros,
            coalesce((SELECT sum(depense) FROM t WHERE NOT annule), 0)::int AS depenses,
            coalesce((SELECT sum(m.points) FROM mouvement_points m WHERE m.lieu_id = $1 AND m.abonne_id = $2), 0)::int AS mouvements,
            coalesce((SELECT sum(r.points) FROM reservation_fidelite r WHERE r.lieu_id = $1 AND r.abonne_id = $2 AND r.type = 'points' AND ${ACTIVE}), 0)::int AS reserves`,
    [lieuId, abonneId, numero],
  );
  const r = rows[0]!;
  return { solde: r.euros * pointsParEuro - r.depenses + r.mouvements, reserves: r.reserves };
}

/**
 * Soldes de plusieurs abonnés en une lecture (cartes wallet mises à jour par lots, audit du 2026-10-05, P2-3) : même
 * calcul que `soldePoints`, sans les réservations. Un test vérifie que les deux donnent le même solde.
 */
export async function soldesPoints(c: Client, lieuId: string, abonneIds: readonly string[], pointsParEuro: number): Promise<Map<string, number>> {
  const { rows } = await c.query<{ id: string; euros: number; depenses: number; mouvements: number }>(
    `WITH a AS (SELECT id, numero FROM abonne_fidelite WHERE lieu_id = $1 AND id = ANY($2::uuid[])),
          t AS (
            SELECT upper(btrim(v.details->'ajustement'->>'reference')) AS numero, v.total_ttc_centimes AS ttc,
                   coalesce((v.details->'fidelite'->'points'->>'points')::int, 0) AS depense,
                   EXISTS (SELECT 1 FROM journal_caisse x WHERE x.lieu_id = v.lieu_id AND x.ref_evenement = v.id AND x.type = 'annulation') AS annule
              FROM journal_caisse v
             WHERE v.lieu_id = $1 AND v.type = 'vente' AND v.details->'ajustement'->>'motif' = 'abonne'
               AND upper(btrim(v.details->'ajustement'->>'reference')) IN (SELECT numero FROM a)),
          parNumero AS (
            SELECT numero, coalesce(sum(floor(ttc / 100.0)) FILTER (WHERE NOT annule AND ttc > 0), 0)::int AS euros,
                   coalesce(sum(depense) FILTER (WHERE NOT annule), 0)::int AS depenses
              FROM t GROUP BY numero)
     SELECT a.id, coalesce(p.euros, 0) AS euros, coalesce(p.depenses, 0) AS depenses,
            coalesce((SELECT sum(m.points) FROM mouvement_points m WHERE m.lieu_id = $1 AND m.abonne_id = a.id), 0)::int AS mouvements
       FROM a LEFT JOIN parNumero p ON p.numero = a.numero`,
    [lieuId, abonneIds],
  );
  return new Map(rows.map((r) => [r.id, r.euros * pointsParEuro - r.depenses + r.mouvements]));
}

/** Usages d'un code : tickets non annulés qui l'ont utilisé, et réservations encore actives. */
export async function usagesCode(c: Client, lieuId: string, codeId: string, code: string): Promise<{ usages: number; reserves: number }> {
  const { rows } = await c.query<{ usages: number; reserves: number }>(
    `SELECT (SELECT count(*) FROM journal_caisse v
              WHERE v.lieu_id = $1 AND v.type = 'vente' AND v.details->'fidelite'->'codePromo'->>'code' = $3
                AND NOT EXISTS (SELECT 1 FROM journal_caisse a WHERE a.lieu_id = v.lieu_id AND a.ref_evenement = v.id AND a.type = 'annulation'))::int AS usages,
            (SELECT count(*) FROM reservation_fidelite r WHERE r.lieu_id = $1 AND r.code_promo_id = $2 AND r.type = 'code_promo' AND ${ACTIVE})::int AS reserves`,
    [lieuId, codeId, code],
  );
  return rows[0]!;
}

async function exigerFidelite(c: Client, lieuId: string) {
  if (!(await lireOptions(c, lieuId)).fidelite) throw optionInactive("fidelite");
}

async function abonneParNumero(c: Client, lieuId: string, numero: string) {
  const { rows } = await c.query<{ id: string; numero: string; nom: string; actif: boolean }>("SELECT id, numero, nom, actif FROM abonne_fidelite WHERE lieu_id = $1 AND numero = $2", [
    lieuId,
    normaliserNumeroAbonne(numero),
  ]);
  const a = rows[0];
  if (!a) throw new ErreurMetier(404, `Aucune fiche d'abonné pour le n° ${normaliserNumeroAbonne(numero)} : crée-la dans Fidélité.`);
  if (!a.actif) throw new ErreurMetier(409, `La fiche de l'abonné ${a.numero} est désactivée.`);
  return a;
}

async function etatPoints(c: Client, lieuId: string, numero: string): Promise<PointsAbonneCaisse> {
  const r = await regles(c, lieuId);
  if (!r) throw new ErreurMetier(409, "Les règles des points ne sont pas réglées pour ce lieu (Fidélité → Règles des points).");
  const a = await abonneParNumero(c, lieuId, numero);
  const { solde, reserves } = await soldePoints(c, lieuId, a.id, a.numero, r.pointsParEuro);
  const disponibles = Math.max(0, solde - reserves);
  return { numero: a.numero, nom: a.nom, solde, disponibles, palierPoints: r.palierPoints, valeurPalier: r.valeurPalier, paliersMax: Math.floor(disponibles / r.palierPoints) };
}

/** Lit un code tel qu'il est saisi à la caisse, et dit s'il est utilisable aujourd'hui. */
async function codeUtilisable(c: Client, lieuId: string, saisi: string) {
  const code = saisi.trim().toUpperCase();
  if (!FORMAT_CODE_PROMO.test(code)) throw new ErreurMetier(400, "Code promo invalide.");
  const { rows } = await c.query<{ id: string; code: string; type: TypeCodePromo; valeur: number; debut: string; fin: string; usage_max: number | null; actif: boolean }>(
    "SELECT id, code, type, valeur, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin, usage_max, actif FROM code_promo WHERE lieu_id = $1 AND code = $2",
    [lieuId, code],
  );
  const k = rows[0];
  if (!k) throw new ErreurMetier(404, `Code promo ${code} inconnu.`);
  const { usages, reserves } = await usagesCode(c, lieuId, k.id, k.code);
  const fiche: CodePromo = { code: k.code, type: k.type, valeur: k.valeur, debut: k.debut, fin: k.fin, usageMax: k.usage_max, actif: k.actif };
  const etat = etatCodePromo(fiche, jourParis(new Date()), usages + reserves);
  const raisons = { a_venir: `pas encore valable (à partir du ${k.debut.split("-").reverse().join("/")})`, expire: "expiré", epuise: "épuisé", desactive: "désactivé" } as const;
  if (etat !== "valide") throw new ErreurMetier(409, `Code ${k.code} ${raisons[etat]}.`);
  return k;
}

export async function routesFideliteCaisse(app: FastifyInstance, { base }: { base: Base }) {
  const Caisse = ParamId;

  app.get("/api/caisses/:id/fidelite/abonnes/:numero", async (req): Promise<PointsAbonneCaisse> => {
    const { id } = Caisse.parse(req.params);
    const { numero } = z.object({ numero: z.string().trim().min(1).max(40) }).parse(req.params);
    const auth = await exigerAccesCaisse(req, base, id);
    return base.transaction(contexte(auth), async (c) => {
      await exigerFidelite(c, auth.lieuId);
      return etatPoints(c, auth.lieuId, numero);
    });
  });

  // Réserver des points (par paliers entiers) avant d'encaisser.
  app.post("/api/caisses/:id/fidelite/points", async (req): Promise<ReservationCaisse> => {
    const { id } = Caisse.parse(req.params);
    const auth = await exigerAccesCaisse(req, base, id);
    const d = corps(z.object({ numero: z.string().trim().min(1).max(40), paliers: z.number().int().min(1).max(1000) }), req);
    return base.transaction(contexte(auth), async (c) => {
      await exigerFidelite(c, auth.lieuId);
      const a = await abonneParNumero(c, auth.lieuId, d.numero);
      // Deux caisses qui réservent pour le même abonné en même temps : l'une attend l'autre.
      await c.query("SELECT 1 FROM abonne_fidelite WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [auth.lieuId, a.id]);
      const p = await etatPoints(c, auth.lieuId, a.numero);
      if (d.paliers > p.paliersMax) throw new ErreurMetier(409, `Pas assez de points : ${p.disponibles} disponibles, ${d.paliers * p.palierPoints} demandés.`);
      const points = d.paliers * p.palierPoints;
      const montant = d.paliers * p.valeurPalier;
      const { rows } = await c.query<{ id: string; expire_le: Date }>(
        `INSERT INTO reservation_fidelite (lieu_id, type, abonne_id, points, montant_centimes, caisse_id, expire_le, par)
         VALUES ($1, 'points', $2, $3, $4, $5, now() + make_interval(hours => $6), $7) RETURNING id, expire_le`,
        [auth.lieuId, a.id, points, montant, id, DUREE_RESERVATION_H, auth.utilisateurId],
      );
      return { reservation: rows[0]!.id, expireLe: rows[0]!.expire_le.toISOString(), points: { numero: a.numero, points, montant }, codePromo: null };
    });
  });

  // Appliquer un code promo : un code plafonné réserve un usage ; un code sans plafond n'a pas besoin du serveur.
  app.post("/api/caisses/:id/fidelite/codes", async (req): Promise<ReservationCaisse> => {
    const { id } = Caisse.parse(req.params);
    const auth = await exigerAccesCaisse(req, base, id);
    const { code } = corps(z.object({ code: z.string().max(40) }), req);
    return base.transaction(contexte(auth), async (c) => {
      await exigerFidelite(c, auth.lieuId);
      const brut = code.trim().toUpperCase();
      // Le plafond se vérifie et se réserve sous verrou : deux caisses ne prennent pas le dernier usage.
      await c.query("SELECT 1 FROM code_promo WHERE lieu_id = $1 AND code = $2 FOR UPDATE", [auth.lieuId, brut]);
      const k = await codeUtilisable(c, auth.lieuId, code);
      const codePromo: CodePromoCaisse = { code: k.code, type: k.type, valeur: k.valeur };
      if (k.usage_max === null) return { reservation: null, expireLe: null, points: null, codePromo };
      const { rows } = await c.query<{ id: string; expire_le: Date }>(
        `INSERT INTO reservation_fidelite (lieu_id, type, code_promo_id, caisse_id, expire_le, par)
         VALUES ($1, 'code_promo', $2, $3, now() + make_interval(hours => $4), $5) RETURNING id, expire_le`,
        [auth.lieuId, k.id, id, DUREE_RESERVATION_H, auth.utilisateurId],
      );
      return { reservation: rows[0]!.id, expireLe: rows[0]!.expire_le.toISOString(), points: null, codePromo };
    });
  });

  // La caissière retire des points ou un code avant d'encaisser : la réservation est rendue tout de suite.
  app.post("/api/caisses/:id/fidelite/reservations/:reservation/liberation", async (req) => {
    const { id, reservation } = z.object({ id: Uuid, reservation: Uuid }).parse(req.params);
    const auth = await exigerAccesCaisse(req, base, id);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("UPDATE reservation_fidelite SET liberee_le = now() WHERE lieu_id = $1 AND id = $2 AND caisse_id = $3 AND consommee_par IS NULL AND liberee_le IS NULL RETURNING id", [
        auth.lieuId,
        reservation,
        id,
      ]);
      if (!rows[0]) throw introuvable("Réservation");
      return { ok: true };
    });
  });

  // Codes sans plafond valables, gardés par la tablette pour servir sans réseau (option A).
  app.get("/api/caisses/:id/fidelite/codes-hors-ligne", async (req): Promise<(CodePromoCaisse & { debut: string; fin: string })[]> => {
    const { id } = Caisse.parse(req.params);
    const auth = await exigerAccesCaisse(req, base, id);
    return base.transaction(contexte(auth), async (c) => {
      if (!(await lireOptions(c, auth.lieuId)).fidelite) return [];
      const { rows } = await c.query<{ code: string; type: TypeCodePromo; valeur: number; debut: string; fin: string }>(
        `SELECT code, type, valeur, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin
           FROM code_promo WHERE lieu_id = $1 AND actif AND usage_max IS NULL AND fin >= (now() AT TIME ZONE 'Europe/Paris')::date ORDER BY code`,
        [auth.lieuId],
      );
      return rows;
    });
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReservationLue {
  id: string;
  caisse_id: string;
  abonne: string | null;
  code: string | null;
  points: number | null;
  montant: number | null;
  expire_le: Date;
  liberee: boolean;
  consommee: boolean;
}

/**
 * À la réception d'un ticket (caisse.ts) : consomme les réservations qu'il porte. Ne refuse jamais un
 * ticket scellé — la vente a eu lieu — mais renvoie les anomalies à signaler au directeur.
 * Une réservation n'est consommée que si TOUT concorde (audit Codex du 2026-10-04, P1-001) : même
 * caisse, même abonné ou même code, mêmes points et même montant, ni utilisée, ni rendue, et pas
 * expirée à l'heure de la vente. Au moindre écart elle reste intacte (elle expirera seule).
 */
export async function consommerFidelite(
  c: Client,
  lieuId: string,
  caisseId: string,
  ticketId: string,
  heureVente: Date,
  f: { codePromo: { code: string; type: TypeCodePromo; valeur: number; reservation: string | null } | null; points: { numero: string; points: number; montant: number; reservation: string } | null },
): Promise<string[]> {
  const anomalies: string[] = [];
  const lire = async (reservation: string | null, type: "points" | "code_promo"): Promise<ReservationLue | null> => {
    if (!reservation || !UUID.test(reservation)) return null;
    const { rows } = await c.query<ReservationLue>(
      `SELECT r.id, r.caisse_id, a.numero AS abonne, k.code, r.points, r.montant_centimes AS montant, r.expire_le,
              r.liberee_le IS NOT NULL AS liberee, r.consommee_par IS NOT NULL AS consommee
         FROM reservation_fidelite r
         LEFT JOIN abonne_fidelite a ON a.lieu_id = r.lieu_id AND a.id = r.abonne_id
         LEFT JOIN code_promo k ON k.lieu_id = r.lieu_id AND k.id = r.code_promo_id
        WHERE r.lieu_id = $1 AND r.id = $2 AND r.type = $3 FOR UPDATE OF r`,
      [lieuId, reservation, type],
    );
    return rows[0] ?? null;
  };
  /** Ce qui empêche d'utiliser une réservation, quelle qu'elle soit. */
  const obstacles = (r: ReservationLue): string[] => [
    ...(r.consommee ? ["déjà utilisée par un autre ticket"] : []),
    ...(r.liberee ? ["rendue avant l'encaissement"] : []),
    ...(r.caisse_id !== caisseId ? ["faite sur une autre caisse"] : []),
    ...(heureVente.getTime() > r.expire_le.getTime() ? ["expirée avant la vente"] : []),
  ];
  const consommer = (r: ReservationLue) => c.query("UPDATE reservation_fidelite SET consommee_par = $3 WHERE lieu_id = $1 AND id = $2", [lieuId, r.id, ticketId]);

  if (f.points) {
    const r = await lire(f.points.reservation, "points");
    if (!r) anomalies.push(`points sans réservation connue du serveur (${f.points.points} pts)`);
    else {
      const probleme = obstacles(r);
      if (r.abonne !== f.points.numero || r.points !== f.points.points || r.montant !== f.points.montant) probleme.push("points différents de ceux réservés");
      if (probleme.length) anomalies.push(...probleme.map((x) => `réservation de points ${x}`));
      else await consommer(r);
    }
  }

  if (f.codePromo) {
    const { rows } = await c.query<{ id: string; type: TypeCodePromo; valeur: number; debut: string; fin: string; usage_max: number | null; actif: boolean }>(
      "SELECT id, type, valeur, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin, usage_max, actif FROM code_promo WHERE lieu_id = $1 AND code = $2",
      [lieuId, f.codePromo.code],
    );
    const k = rows[0];
    const jour = jourParis(heureVente);
    if (!k) anomalies.push(`code ${f.codePromo.code} inconnu`);
    else {
      const avant = anomalies.length;
      if (k.type !== f.codePromo.type || k.valeur !== f.codePromo.valeur) anomalies.push(`code ${f.codePromo.code} appliqué avec une autre valeur que la sienne`);
      if (!k.actif || jour < k.debut || jour > k.fin) anomalies.push(`code ${f.codePromo.code} pas valable le jour de la vente`);
      if (k.usage_max !== null) {
        const r = await lire(f.codePromo.reservation, "code_promo");
        if (!r || r.code !== f.codePromo.code) anomalies.push(`code plafonné ${f.codePromo.code} utilisé sans réservation du serveur`);
        else {
          const probleme = obstacles(r);
          if (probleme.length) anomalies.push(...probleme.map((x) => `réservation du code ${f.codePromo!.code} ${x}`));
          // L'usage n'est pris que si le code lui-même était valable pour cette vente.
          else if (anomalies.length === avant) await consommer(r);
        }
      }
    }
  }
  return anomalies;
}
