import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { coutPlage, coutsDuStand, fraisDuMois, libelleMois, type CoutsBuvette, type FraisDate, type PosteStructure } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { contexte, corps } from "./outils.ts";

/**
 * Coûts par buvette (module 8 ; dossier §15.83, §15.84, §15.113) : frais mensuels propres à chaque
 * stand, saisis par le directeur et datés ; consolidation du mois par stand avec le coût matière et
 * la masse salariale lus comme dans Résultats et Équipe (même requêtes, aucune autre règle).
 */
const Mois = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mois attendu au format AAAA-MM.");
const SaisieFrais = z.object({
  aPartirDe: Mois,
  frais: z
    .array(z.object({ standId: z.string().uuid(), poste: z.enum(["loyer", "logiciel", "abonnement", "tpe"]), montant: z.number().int().min(0).max(100_000_000) }))
    .min(1)
    .max(400),
});

async function lireFrais(c: Client, lieuId: string): Promise<FraisDate[]> {
  const { rows } = await c.query<{ stand_id: string; poste: PosteStructure; mois: string; montant_centimes: number }>(
    "SELECT stand_id, poste, to_char(a_partir_de, 'YYYY-MM') AS mois, montant_centimes FROM frais_stand WHERE lieu_id = $1 ORDER BY a_partir_de",
    [lieuId],
  );
  return rows.map((r) => ({ standId: r.stand_id, poste: r.poste, aPartirDe: r.mois, montant: r.montant_centimes }));
}

async function couts(c: Client, lieuId: string, demande: string | undefined): Promise<CoutsBuvette> {
  // Mois joués (match ouvert ou clos), heure de Paris.
  const { rows: mois } = await c.query<{ cle: string; matchs: number }>(
    `SELECT to_char(debut AT TIME ZONE 'Europe/Paris', 'YYYY-MM') AS cle, count(*)::int AS matchs
       FROM evenement WHERE lieu_id = $1 AND etat IN ('ouvert', 'clos') GROUP BY 1 ORDER BY 1 DESC`,
    [lieuId],
  );
  const frais = await lireFrais(c, lieuId);
  const { rows: stands } = await c.query<{ id: string; nom: string; actif: boolean }>("SELECT id, nom, actif FROM stand WHERE lieu_id = $1 ORDER BY actif DESC, lower(nom)", [lieuId]);
  const cle = demande ?? mois[0]?.cle ?? null;
  const moisDisponibles = mois.map((m) => ({ cle: m.cle, libelle: libelleMois(m.cle), matchs: m.matchs }));
  if (!cle) return { moisDisponibles, cle: null, libelle: "", matchs: 0, stands: [], horsStand: { masseSalariale: 0, affectations: 0 }, frais };

  const { rows: matchs } = await c.query<{ id: string }>(
    "SELECT id FROM evenement WHERE lieu_id = $1 AND etat IN ('ouvert', 'clos') AND to_char(debut AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $2",
    [lieuId, cle],
  );
  const ids = matchs.map((m) => m.id);
  // Lignes des annulations en négatif : sommes nettes, comme dans Résultats.
  const { rows: ventes } = await c.query<{ stand_id: string; nom: string; cout: number | null; quantite: number; ht: number }>(
    `SELECT j.stand_id, p.nom, p.cout_matiere_centimes AS cout, sum(l.quantite)::int AS quantite, sum(l.ht_centimes)::int AS ht
       FROM ligne_ticket l
       JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
       JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
      WHERE l.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[])
      GROUP BY j.stand_id, p.id, p.nom, p.cout_matiere_centimes`,
    [lieuId, ids],
  );
  const { rows: affectations } = await c.query<{ stand_id: string | null; debut: string; fin: string; taux: number | null }>(
    `SELECT stand_id, to_char(debut_reel, 'HH24:MI') AS debut, to_char(fin_reel, 'HH24:MI') AS fin, taux_horaire_centimes AS taux
       FROM affectation WHERE lieu_id = $1 AND evenement_id = ANY($2::uuid[])`,
    [lieuId, ids],
  );

  const resultat = stands.map((s) => {
    const v = ventes.filter((x) => x.stand_id === s.id);
    const a = affectations.filter((x) => x.stand_id === s.id);
    return coutsDuStand({
      standId: s.id,
      nom: s.nom,
      actif: s.actif,
      caHt: v.reduce((t, x) => t + x.ht, 0),
      frais: fraisDuMois(frais, s.id, cle),
      coutMatiere: v.reduce((t, x) => t + (x.cout ?? 0) * x.quantite, 0),
      produitsSansCout: v.filter((x) => x.cout === null && x.quantite > 0).map((x) => x.nom),
      masseSalariale: a.reduce((t, x) => t + (coutPlage(x.debut, x.fin, x.taux) ?? 0), 0),
      affectationsSansTaux: a.filter((x) => x.taux === null).length,
    });
  });
  const hors = affectations.filter((x) => x.stand_id === null);
  return {
    moisDisponibles,
    cle,
    libelle: libelleMois(cle),
    matchs: ids.length,
    // Un stand désactivé n'apparaît que s'il a quelque chose à montrer ce mois-là.
    stands: resultat.filter((s) => s.actif || s.total !== 0 || s.caHt !== 0),
    horsStand: { masseSalariale: hors.reduce((t, x) => t + (coutPlage(x.debut, x.fin, x.taux) ?? 0), 0), affectations: hors.length },
    frais,
  };
}

export async function routesCoutsBuvette(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/couts-buvette", async (req): Promise<CoutsBuvette> => {
    const auth = await exigerDirecteur(req, base);
    const { mois } = z.object({ mois: Mois.optional() }).parse(req.query);
    return base.transaction(contexte(auth), (c) => couts(c, auth.lieuId, mois));
  });

  app.put("/api/couts-buvette/frais", async (req): Promise<CoutsBuvette> => {
    const auth = await exigerDirecteur(req, base);
    const s = corps(SaisieFrais, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>("SELECT id FROM stand WHERE lieu_id = $1 AND id = ANY($2::uuid[])", [auth.lieuId, s.frais.map((f) => f.standId)]);
      if (new Set(rows.map((r) => r.id)).size !== new Set(s.frais.map((f) => f.standId)).size) throw new ErreurMetier(404, "Stand introuvable.");
      const avant = await lireFrais(c, auth.lieuId);
      const changes = [];
      for (const f of s.frais) {
        const ancien = fraisDuMois(avant, f.standId, s.aPartirDe)[f.poste];
        if (ancien === f.montant) continue;
        await c.query(
          `INSERT INTO frais_stand (lieu_id, stand_id, poste, a_partir_de, montant_centimes, saisi_par)
           VALUES ($1, $2, $3, to_date($4, 'YYYY-MM'), $5, $6)
           ON CONFLICT (lieu_id, stand_id, poste, a_partir_de) DO UPDATE SET montant_centimes = EXCLUDED.montant_centimes, saisi_par = EXCLUDED.saisi_par, saisi_le = now()`,
          [auth.lieuId, f.standId, f.poste, s.aPartirDe, f.montant, auth.utilisateurId],
        );
        changes.push({ stand: f.standId, poste: f.poste, avant: ancien, apres: f.montant });
      }
      if (changes.length) {
        await inscrireJet(c, { lieuId: auth.lieuId, type: "frais_stand_modifies", utilisateurId: auth.utilisateurId, details: { a_partir_de: s.aPartirDe, changes } });
      }
      return couts(c, auth.lieuId, s.aPartirDe);
    });
  });
}
