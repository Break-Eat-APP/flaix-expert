import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  FORMAT_CODE_PROMO,
  etatCodePromo,
  jourParis,
  normaliserNumeroAbonne,
  type AbonneVue,
  type CodePromoVue,
  type EtatFidelite,
  type HistoriqueAbonne,
  type ReglagesFidelite,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps, differences, texteFacultatif } from "./outils.ts";

/**
 * Fidélité, partie gestion (module 19 ; dossier §15.114) : registre des abonnés, points, codes promo.
 * Les points gagnés se lisent dans les tickets scellés portant le n° d'abonné (remise abonné) :
 * rien n'est recopié, un ticket annulé ne compte plus.
 */
const Numero = z.string().trim().min(1, "Le n° d'abonné est obligatoire.").max(40).transform(normaliserNumeroAbonne);
const Nom = z.string().trim().min(1, "Le nom est obligatoire.").max(120);
const Email = z
  .string()
  .trim()
  .max(200)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "E-mail illisible.");
const Telephone = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || (v.length >= 6 && v.length <= 30), "Téléphone illisible.");
const NouvelAbonne = z.object({ numero: Numero, nom: Nom, email: Email, telephone: Telephone });
const ModifAbonne = z.object({ nom: Nom.optional(), email: Email.optional(), telephone: Telephone.optional(), actif: z.boolean().optional() });
const Reglages = z.object({
  pointsParEuro: z.number().int().min(1).max(100),
  palierPoints: z.number().int().min(1).max(1_000_000),
  valeurPalier: z.number().int().min(1).max(100_000),
});
const Jour = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");
const NouveauCode = z
  .object({
    code: z.string().trim().toUpperCase().regex(FORMAT_CODE_PROMO, "Le code a 3 à 30 lettres, chiffres, tirets ou soulignés, sans espace."),
    type: z.enum(["pourcentage", "montant"]),
    valeur: z.number().int().min(1),
    debut: Jour,
    fin: Jour,
    usageMax: z.number().int().min(1).max(1_000_000).nullable(),
  })
  .refine((c) => c.fin >= c.debut, "La fin ne peut pas précéder le début.")
  .refine((c) => c.type !== "pourcentage" || c.valeur <= 10_000, "Un pourcentage ne dépasse pas 100 %.")
  .refine((c) => c.type !== "montant" || c.valeur <= 100_000, "Un montant ne dépasse pas 1 000 €.");
const ModifCode = z.object({ fin: Jour.optional(), usageMax: z.number().int().min(1).max(1_000_000).nullable().optional(), actif: z.boolean().optional() });
const Import = z.object({
  lignes: z
    .array(z.object({ numero: Numero, nom: Nom, email: Email, telephone: Telephone, points: z.number().int().min(0).max(10_000_000) }))
    .min(1, "Aucune ligne à importer.")
    .max(20_000),
});

async function lireReglages(c: Client, lieuId: string): Promise<ReglagesFidelite | null> {
  const { rows } = await c.query<{ p: number | null; palier: number | null; valeur: number | null }>(
    "SELECT fid_points_par_euro AS p, fid_palier_points AS palier, fid_valeur_palier_centimes AS valeur FROM lieu WHERE id = $1",
    [lieuId],
  );
  const r = rows[0]!;
  return r.p === null || r.palier === null || r.valeur === null ? null : { pointsParEuro: r.p, palierPoints: r.palier, valeurPalier: r.valeur };
}

/** Tickets « remise abonné » par n° normalisé : nombre, dépense et euros entiers des tickets non annulés. */
const TICKETS_ABONNES = `
  SELECT upper(btrim(v.details->'ajustement'->>'reference')) AS numero, v.id, v.numero_justificatif, v.horodatage, v.total_ttc_centimes AS ttc,
         coalesce((v.details->'fidelite'->'points'->>'points')::int, 0) AS depense,
         v.evenement_id, EXISTS (SELECT 1 FROM journal_caisse a WHERE a.lieu_id = v.lieu_id AND a.ref_evenement = v.id AND a.type = 'annulation') AS annule
    FROM journal_caisse v
   WHERE v.lieu_id = $1 AND v.type = 'vente' AND v.details->'ajustement'->>'motif' = 'abonne'
     AND coalesce(btrim(v.details->'ajustement'->>'reference'), '') <> ''`;

async function lireAbonnes(c: Client, lieuId: string, r: ReglagesFidelite | null, seul?: string): Promise<AbonneVue[]> {
  const { rows } = await c.query<{
    id: string;
    numero: string;
    nom: string;
    email: string | null;
    telephone: string | null;
    source: "import" | "saisie";
    actif: boolean;
    tickets: number;
    depense: number;
    euros: number;
    derniere: Date | null;
    mouvements: number;
    depenses: number;
  }>(
    `WITH t AS (${TICKETS_ABONNES}),
          parNumero AS (
            SELECT numero, count(*) FILTER (WHERE NOT annule)::int AS tickets, coalesce(sum(ttc) FILTER (WHERE NOT annule), 0)::int AS depense,
                   coalesce(sum(floor(ttc / 100.0)) FILTER (WHERE NOT annule AND ttc > 0), 0)::int AS euros, max(horodatage) FILTER (WHERE NOT annule) AS derniere,
                   coalesce(sum(depense) FILTER (WHERE NOT annule), 0)::int AS depenses
              FROM t GROUP BY numero)
     SELECT a.id, a.numero, a.nom, a.email, a.telephone, a.source, a.actif,
            coalesce(p.tickets, 0) AS tickets, coalesce(p.depense, 0) AS depense, coalesce(p.euros, 0) AS euros, p.derniere, coalesce(p.depenses, 0) AS depenses,
            coalesce((SELECT sum(m.points) FROM mouvement_points m WHERE m.lieu_id = a.lieu_id AND m.abonne_id = a.id), 0)::int AS mouvements
       FROM abonne_fidelite a LEFT JOIN parNumero p ON p.numero = a.numero
      WHERE a.lieu_id = $1 AND ($2::uuid IS NULL OR a.id = $2)
      ORDER BY a.actif DESC, lower(a.nom)`,
    [lieuId, seul ?? null],
  );
  return rows.map((a) => ({
    id: a.id,
    numero: a.numero,
    nom: a.nom,
    email: a.email,
    telephone: a.telephone,
    source: a.source,
    actif: a.actif,
    tickets: a.tickets,
    depense: a.depense,
    derniereVisite: a.derniere ? a.derniere.toISOString() : null,
    // Points dépensés à la caisse (§15.127) : lus dans les tickets non annulés, comme les points gagnés.
    points: r ? a.euros * r.pointsParEuro + a.mouvements - a.depenses : null,
  }));
}

async function etat(c: Client, lieuId: string): Promise<EtatFidelite> {
  const reglages = await lireReglages(c, lieuId);
  const abonnes = await lireAbonnes(c, lieuId, reglages);
  const { rows: sansFiche } = await c.query<{ numero: string; tickets: number }>(
    `WITH t AS (${TICKETS_ABONNES})
     SELECT t.numero, count(*)::int AS tickets FROM t
      WHERE NOT t.annule AND NOT EXISTS (SELECT 1 FROM abonne_fidelite a WHERE a.lieu_id = $1 AND a.numero = t.numero)
      GROUP BY t.numero ORDER BY 2 DESC, 1 LIMIT 50`,
    [lieuId],
  );
  const { rows: codes } = await c.query<{
    id: string;
    code: string;
    type: "pourcentage" | "montant";
    valeur: number;
    debut: string;
    fin: string;
    usage_max: number | null;
    actif: boolean;
    usages: number;
  }>(
    `SELECT k.id, k.code, k.type, k.valeur, to_char(k.debut, 'YYYY-MM-DD') AS debut, to_char(k.fin, 'YYYY-MM-DD') AS fin, k.usage_max, k.actif,
            (SELECT count(*) FROM journal_caisse v
              WHERE v.lieu_id = k.lieu_id AND v.type = 'vente' AND v.details->'fidelite'->'codePromo'->>'code' = k.code
                AND NOT EXISTS (SELECT 1 FROM journal_caisse a WHERE a.lieu_id = v.lieu_id AND a.ref_evenement = v.id))::int AS usages
       FROM code_promo k WHERE k.lieu_id = $1 ORDER BY k.actif DESC, k.fin DESC, k.code`,
    [lieuId],
  );
  const jour = jourParis(new Date());
  return {
    reglages,
    abonnes,
    numerosSansFiche: sansFiche,
    codes: codes.map((k): CodePromoVue => {
      const code = { code: k.code, type: k.type, valeur: k.valeur, debut: k.debut, fin: k.fin, usageMax: k.usage_max, actif: k.actif };
      return { ...code, id: k.id, usages: k.usages, etat: etatCodePromo(code, jour, k.usages) };
    }),
  };
}

export async function routesFidelite(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/fidelite", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etat(c, auth.lieuId));
  });

  app.put("/api/fidelite/reglages", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const r = corps(Reglages, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = (await lireReglages(c, auth.lieuId)) ?? { pointsParEuro: null, palierPoints: null, valeurPalier: null };
      await c.query("UPDATE lieu SET fid_points_par_euro = $2, fid_palier_points = $3, fid_valeur_palier_centimes = $4 WHERE id = $1", [
        auth.lieuId,
        r.pointsParEuro,
        r.palierPoints,
        r.valeurPalier,
      ]);
      const diff = differences(avant as Record<string, unknown>, r);
      if (Object.keys(diff).length) await inscrireJet(c, { lieuId: auth.lieuId, type: "fidelite_reglages_modifies", utilisateurId: auth.utilisateurId, details: diff });
      return etat(c, auth.lieuId);
    });
  });

  app.post("/api/fidelite/abonnes", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const a = corps(NouvelAbonne, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("SELECT 1 FROM abonne_fidelite WHERE lieu_id = $1 AND numero = $2", [auth.lieuId, a.numero]);
      if (rows[0]) throw new ErreurMetier(409, `Le n° ${a.numero} a déjà une fiche.`);
      const { rows: cree } = await c.query<{ id: string }>(
        "INSERT INTO abonne_fidelite (lieu_id, numero, nom, email, telephone, source, cree_par) VALUES ($1, $2, $3, $4, $5, 'saisie', $6) RETURNING id",
        [auth.lieuId, a.numero, a.nom, a.email, a.telephone, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "abonne_cree", utilisateurId: auth.utilisateurId, details: { abonne: cree[0]!.id, numero: a.numero } });
      return etat(c, auth.lieuId);
    });
  });

  app.patch("/api/fidelite/abonnes/:id", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const m = corps(ModifAbonne, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ numero: string; nom: string; email: string | null; telephone: string | null; actif: boolean }>(
        "SELECT numero, nom, email, telephone, actif FROM abonne_fidelite WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      const avant = rows[0];
      if (!avant) throw introuvable("Abonné");
      const apres = { nom: m.nom ?? avant.nom, email: m.email !== undefined ? m.email : avant.email, telephone: m.telephone !== undefined ? m.telephone : avant.telephone, actif: m.actif ?? avant.actif };
      await c.query("UPDATE abonne_fidelite SET nom = $3, email = $4, telephone = $5, actif = $6 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        apres.nom,
        apres.email,
        apres.telephone,
        apres.actif,
      ]);
      // Le journal note quels champs ont changé, sans recopier les données personnelles.
      const champs = Object.keys(differences({ nom: avant.nom, email: avant.email, telephone: avant.telephone, actif: avant.actif }, apres));
      if (champs.length) await inscrireJet(c, { lieuId: auth.lieuId, type: "abonne_modifie", utilisateurId: auth.utilisateurId, details: { abonne: id, numero: avant.numero, champs } });
      return etat(c, auth.lieuId);
    });
  });

  app.get("/api/fidelite/abonnes/:id", async (req): Promise<HistoriqueAbonne> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const r = await lireReglages(c, auth.lieuId);
      const abonne = (await lireAbonnes(c, auth.lieuId, r, id))[0];
      if (!abonne) throw introuvable("Abonné");
      const { rows: tickets } = await c.query<{ id: string; numero_justificatif: string; horodatage: Date; ttc: number; annule: boolean; match: string; depense: number }>(
        `WITH t AS (${TICKETS_ABONNES})
         SELECT t.id, t.numero_justificatif, t.horodatage, t.ttc, t.annule, t.depense, e.libelle AS match
           FROM t JOIN evenement e ON e.lieu_id = $1 AND e.id = t.evenement_id
          WHERE t.numero = $2 ORDER BY t.horodatage DESC LIMIT 500`,
        [auth.lieuId, abonne.numero],
      );
      const { rows: mouvements } = await c.query<{ motif: "depart" | "ajustement"; points: number; commentaire: string | null; par: string; le: Date }>(
        `SELECT m.motif, m.points, m.commentaire, u.nom AS par, m.le FROM mouvement_points m JOIN utilisateur u ON u.id = m.par
          WHERE m.lieu_id = $1 AND m.abonne_id = $2 ORDER BY m.le DESC`,
        [auth.lieuId, id],
      );
      return {
        abonne,
        tickets: tickets.map((t) => ({
          id: t.id,
          numeroJustificatif: t.numero_justificatif,
          horodatage: t.horodatage.toISOString(),
          match: t.match,
          total: t.ttc,
          annule: t.annule,
          points: r && !t.annule ? Math.floor(t.ttc / 100) * r.pointsParEuro : r ? 0 : null,
          pointsDepenses: t.annule ? 0 : t.depense,
        })),
        mouvements: mouvements.map((m) => ({ motif: m.motif, points: m.points, commentaire: m.commentaire, par: m.par, le: m.le.toISOString() })),
      };
    });
  });

  app.post("/api/fidelite/abonnes/:id/points", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const a = corps(
      z.object({
        points: z.number().int().min(-10_000_000).max(10_000_000).refine((p) => p !== 0, "Nombre de points nul."),
        commentaire: texteFacultatif(300).refine((v) => v !== null && v.length >= 3, "Le motif de l'ajustement est obligatoire."),
      }),
      req,
    );
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ numero: string }>("SELECT numero FROM abonne_fidelite WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      if (!rows[0]) throw introuvable("Abonné");
      await c.query("INSERT INTO mouvement_points (lieu_id, abonne_id, motif, points, commentaire, par) VALUES ($1, $2, 'ajustement', $3, $4, $5)", [
        auth.lieuId,
        id,
        a.points,
        a.commentaire,
        auth.utilisateurId,
      ]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "points_ajustes", utilisateurId: auth.utilisateurId, details: { abonne: id, numero: rows[0].numero, points: a.points, motif: a.commentaire } });
      return etat(c, auth.lieuId);
    });
  });

  // Import de la base existante : le fichier est lu sur l'écran (aperçu, lignes fautives), le serveur revérifie tout.
  app.post("/api/fidelite/import", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { lignes } = corps(Import, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ numero: string }>("SELECT numero FROM abonne_fidelite WHERE lieu_id = $1", [auth.lieuId]);
      const existants = new Set(rows.map((r) => r.numero));
      const dejaLa: string[] = [];
      let crees = 0, points = 0;
      for (const l of lignes) {
        if (existants.has(l.numero)) {
          dejaLa.push(l.numero);
          continue;
        }
        existants.add(l.numero);
        const { rows: cree } = await c.query<{ id: string }>(
          "INSERT INTO abonne_fidelite (lieu_id, numero, nom, email, telephone, source, cree_par) VALUES ($1, $2, $3, $4, $5, 'import', $6) RETURNING id",
          [auth.lieuId, l.numero, l.nom, l.email, l.telephone, auth.utilisateurId],
        );
        crees++;
        if (l.points > 0) {
          await c.query("INSERT INTO mouvement_points (lieu_id, abonne_id, motif, points, commentaire, par) VALUES ($1, $2, 'depart', $3, 'Solde repris à l''import', $4)", [
            auth.lieuId,
            cree[0]!.id,
            l.points,
            auth.utilisateurId,
          ]);
          points += l.points;
        }
      }
      await inscrireJet(c, { lieuId: auth.lieuId, type: "abonnes_importes", utilisateurId: auth.utilisateurId, details: { crees, deja_presents: dejaLa.length, points_de_depart: points } });
      return { crees, dejaPresents: dejaLa, etat: await etat(c, auth.lieuId) };
    });
  });

  app.post("/api/fidelite/codes", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const k = corps(NouveauCode, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("SELECT 1 FROM code_promo WHERE lieu_id = $1 AND code = $2", [auth.lieuId, k.code]);
      if (rows[0]) throw new ErreurMetier(409, `Le code ${k.code} existe déjà : un code ne se réutilise pas.`);
      await c.query("INSERT INTO code_promo (lieu_id, code, type, valeur, debut, fin, usage_max, cree_par) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
        auth.lieuId,
        k.code,
        k.type,
        k.valeur,
        k.debut,
        k.fin,
        k.usageMax,
        auth.utilisateurId,
      ]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "code_promo_cree", utilisateurId: auth.utilisateurId, details: k });
      return etat(c, auth.lieuId);
    });
  });

  app.patch("/api/fidelite/codes/:id", async (req): Promise<EtatFidelite> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const m = corps(ModifCode, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ code: string; debut: string; fin: string; usage_max: number | null; actif: boolean }>(
        "SELECT code, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin, usage_max, actif FROM code_promo WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      const avant = rows[0];
      if (!avant) throw introuvable("Code promo");
      if (m.fin !== undefined && m.fin < avant.debut) throw new ErreurMetier(400, "La fin ne peut pas précéder le début.");
      await c.query("UPDATE code_promo SET fin = $3, usage_max = $4, actif = $5 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        m.fin ?? avant.fin,
        m.usageMax !== undefined ? m.usageMax : avant.usage_max,
        m.actif ?? avant.actif,
      ]);
      const diff = differences({ fin: avant.fin, usageMax: avant.usage_max, actif: avant.actif }, m);
      if (Object.keys(diff).length) await inscrireJet(c, { lieuId: auth.lieuId, type: "code_promo_modifie", utilisateurId: auth.utilisateurId, details: { code: avant.code, ...diff } });
      return etat(c, auth.lieuId);
    });
  });
}
