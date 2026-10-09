import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  CHAMPS_EXPORT,
  SYSTEMES_CAISSE,
  correspondanceExacte,
  lireExportCaisse,
  suggererCorrespondance,
  type CaisseExterne,
  type ChampExport,
  type ColonnesExport,
  type ImportVentesExternes,
  type LigneSynthese,
  type PointDeVenteExterne,
  type ProduitExterne,
  type ResultatLecture,
  type SuggestionCorrespondance,
  type SyntheseVentesExternes,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Caisses connectées (dossier §15.150) : ventes d'une caisse externe (Digifood, Weezevent, L'Addition…) importées pour la
 * gestion, à partir du fichier d'export de la caisse. Rangées à part des tickets scellés : jamais dans le journal de caisse,
 * les Z, les clôtures ni l'export comptable. Correspondances produit → produit de FlaiX Expert (coût, marge) et point de
 * vente → stand ; résultats du module : chiffre d'affaires, marge estimée, par produit, stand, événement et heure.
 */

const Systeme = z.enum(SYSTEMES_CAISSE.map((s) => s.cle) as [string, ...string[]], { message: "Système de caisse inconnu." });
const Nom = z.string().trim().min(1, "Le nom est obligatoire.").max(80);
const Colonnes = z
  .object(Object.fromEntries(CHAMPS_EXPORT.map((c) => [c.champ, z.number().int().min(0).max(200).optional()])) as Record<ChampExport, z.ZodOptional<z.ZodNumber>>)
  .strict();
/** 8 Mo de texte : un export de saison entière d'une buvette tient largement. */
const TAILLE_MAX = 8 * 1024 * 1024;
const LOT_INSERTION = 500;

async function exigerCaisse(c: Client, lieuId: string, id: string): Promise<{ nom: string; colonnes: ColonnesExport | null }> {
  const { rows } = await c.query<{ nom: string; colonnes: ColonnesExport | null }>("SELECT nom, colonnes FROM caisse_externe WHERE lieu_id = $1 AND id = $2", [lieuId, id]);
  if (!rows[0]) throw introuvable("Caisse connectée");
  return rows[0];
}

async function exigerHorsFormation(c: Client, lieuId: string): Promise<void> {
  const { rows } = await c.query<{ formation: boolean }>("SELECT formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1", [lieuId]);
  if (rows[0]?.formation) throw new ErreurMetier(409, "Mode formation : les ventes d'une caisse connectée ne s'importent que dans le vrai lieu.");
}

async function listerCaisses(c: Client, lieuId: string): Promise<CaisseExterne[]> {
  const { rows } = await c.query<{
    id: string;
    nom: string;
    systeme: CaisseExterne["systeme"];
    colonnes: ColonnesExport | null;
    ventes: number;
    premiere: Date | null;
    derniere: Date | null;
    imp_id: string | null;
    imp_le: Date | null;
    imp_par: string | null;
    imp_fichier: string | null;
    imp_lues: number | null;
    imp_ajoutees: number | null;
    imp_deja: number | null;
    imp_erreurs: number | null;
  }>(
    `SELECT k.id, k.nom, k.systeme, k.colonnes,
            (SELECT count(*)::int FROM vente_externe v WHERE v.lieu_id = k.lieu_id AND v.caisse_externe_id = k.id) AS ventes,
            (SELECT min(v.horodatage) FROM vente_externe v WHERE v.lieu_id = k.lieu_id AND v.caisse_externe_id = k.id) AS premiere,
            (SELECT max(v.horodatage) FROM vente_externe v WHERE v.lieu_id = k.lieu_id AND v.caisse_externe_id = k.id) AS derniere,
            i.id AS imp_id, i.le AS imp_le, u.nom AS imp_par, i.fichier AS imp_fichier, i.lignes_lues AS imp_lues, i.ventes_ajoutees AS imp_ajoutees,
            i.ventes_deja AS imp_deja, jsonb_array_length(i.erreurs) AS imp_erreurs
       FROM caisse_externe k
       LEFT JOIN LATERAL (SELECT * FROM import_ventes_externes x WHERE x.lieu_id = k.lieu_id AND x.caisse_externe_id = k.id ORDER BY x.le DESC LIMIT 1) i ON true
       LEFT JOIN utilisateur u ON u.id = i.par
      WHERE k.lieu_id = $1 ORDER BY k.cree_le`,
    [lieuId],
  );
  return rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    systeme: r.systeme,
    colonnes: r.colonnes,
    ventes: r.ventes,
    premiereVente: r.premiere?.toISOString() ?? null,
    derniereVente: r.derniere?.toISOString() ?? null,
    dernierImport: r.imp_id
      ? { id: r.imp_id, le: r.imp_le!.toISOString(), par: r.imp_par ?? "", fichier: r.imp_fichier!, lignesLues: r.imp_lues!, ventesAjoutees: r.imp_ajoutees!, ventesDeja: r.imp_deja!, erreurs: r.imp_erreurs! }
      : null,
  }));
}

type Candidat = { id: string; nom: string };

/** Produits ou stands actifs du lieu, candidats à une correspondance. */
async function candidats(c: Client, lieuId: string, table: "produit" | "stand"): Promise<Candidat[]> {
  const { rows } = await c.query<Candidat>(`SELECT id, nom FROM ${table} WHERE lieu_id = $1 AND actif ORDER BY nom, id`, [lieuId]);
  return rows;
}

function suggestion(nom: string, liste: Candidat[]): SuggestionCorrespondance | null {
  const s = suggererCorrespondance(nom, liste);
  return s && { id: s.id, nom: s.nom, memeNom: s.score === 1 };
}

async function produitsExternes(c: Client, lieuId: string, caisseId: string): Promise<ProduitExterne[]> {
  const { rows } = await c.query<{ cle: string; libelle: string; code: string | null; quantite: string; montant: number; produit_id: string | null; ignore: boolean | null; automatique: boolean | null; decide: boolean }>(
    `SELECT l.cle, max(l.libelle) AS libelle, max(l.code) AS code, sum(l.quantite) AS quantite, sum(l.montant_centimes)::int AS montant,
            m.produit_id, m.ignore, m.automatique, m.cle IS NOT NULL AS decide
       FROM ligne_vente_externe l
       JOIN vente_externe v ON v.lieu_id = l.lieu_id AND v.caisse_externe_id = l.caisse_externe_id AND v.id_externe = l.id_externe AND NOT v.annulee
       LEFT JOIN correspondance_produit_externe m ON m.lieu_id = l.lieu_id AND m.caisse_externe_id = l.caisse_externe_id AND m.cle = l.cle
      WHERE l.lieu_id = $1 AND l.caisse_externe_id = $2
      GROUP BY l.cle, m.cle, m.produit_id, m.ignore, m.automatique
      ORDER BY sum(l.montant_centimes) DESC, l.cle`,
    [lieuId, caisseId],
  );
  // Suggestion pour un produit jamais décidé ; « aucun » choisi à la main est une décision.
  const produits = rows.some((r) => !r.decide) ? await candidats(c, lieuId, "produit") : [];
  return rows.map((r) => ({
    cle: r.cle,
    libelle: r.libelle,
    code: r.code,
    quantite: Number(r.quantite),
    montant: r.montant,
    produitId: r.produit_id,
    ignore: r.ignore ?? false,
    automatique: r.automatique ?? false,
    suggestion: r.decide ? null : suggestion(r.libelle, produits),
  }));
}

async function pointsDeVente(c: Client, lieuId: string, caisseId: string): Promise<PointDeVenteExterne[]> {
  const { rows } = await c.query<{ nom: string; ventes: number; montant: number; stand_id: string | null; automatique: boolean | null; decide: boolean }>(
    `SELECT v.point_de_vente AS nom, count(*)::int AS ventes, sum(v.total_centimes)::int AS montant, m.stand_id, m.automatique,
            m.nom IS NOT NULL AS decide
       FROM vente_externe v
       LEFT JOIN correspondance_point_de_vente m ON m.lieu_id = v.lieu_id AND m.caisse_externe_id = v.caisse_externe_id AND m.nom = v.point_de_vente
      WHERE v.lieu_id = $1 AND v.caisse_externe_id = $2 AND v.point_de_vente IS NOT NULL AND NOT v.annulee
      GROUP BY v.point_de_vente, m.nom, m.stand_id, m.automatique ORDER BY sum(v.total_centimes) DESC, v.point_de_vente`,
    [lieuId, caisseId],
  );
  const stands = rows.some((r) => !r.decide) ? await candidats(c, lieuId, "stand") : [];
  return rows.map((r) => ({
    nom: r.nom,
    ventes: r.ventes,
    montant: r.montant,
    standId: r.stand_id,
    automatique: r.automatique ?? false,
    suggestion: r.decide ? null : suggestion(r.nom, stands),
  }));
}

/**
 * Produits et points de vente de la caisse jamais rapprochés (une correspondance retirée à la main reste retirée), au même
 * nom — majuscules, accents et espaces près — qu'un seul produit ou stand actif : reliés sans demander, marqués
 * « automatique » (§15.152).
 */
async function relierAutomatiquement(c: Client, lieuId: string, caisseId: string): Promise<{ produits: number; pointsDeVente: number }> {
  const { rows: libres } = await c.query<{ cle: string; libelle: string }>(
    `SELECT l.cle, max(l.libelle) AS libelle FROM ligne_vente_externe l
      WHERE l.lieu_id = $1 AND l.caisse_externe_id = $2
        AND NOT EXISTS (SELECT 1 FROM correspondance_produit_externe m WHERE m.lieu_id = l.lieu_id AND m.caisse_externe_id = l.caisse_externe_id AND m.cle = l.cle)
      GROUP BY l.cle`,
    [lieuId, caisseId],
  );
  const produits = libres.length ? await candidats(c, lieuId, "produit") : [];
  const liensProduits = libres.flatMap((r) => {
    const p = correspondanceExacte(r.libelle, produits);
    return p ? [{ cle: r.cle, produit_id: p.id }] : [];
  });
  const { rows: pdv } = await c.query<{ nom: string }>(
    `SELECT DISTINCT v.point_de_vente AS nom FROM vente_externe v
      WHERE v.lieu_id = $1 AND v.caisse_externe_id = $2 AND v.point_de_vente IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM correspondance_point_de_vente m WHERE m.lieu_id = v.lieu_id AND m.caisse_externe_id = v.caisse_externe_id AND m.nom = v.point_de_vente)`,
    [lieuId, caisseId],
  );
  const stands = pdv.length ? await candidats(c, lieuId, "stand") : [];
  const liensStands = pdv.flatMap((r) => {
    const s = correspondanceExacte(r.nom, stands);
    return s ? [{ nom: r.nom, stand_id: s.id }] : [];
  });
  let nbProduits = 0;
  let nbPointsDeVente = 0;
  if (liensProduits.length)
    nbProduits =
      (
        await c.query(
          `INSERT INTO correspondance_produit_externe (lieu_id, caisse_externe_id, cle, produit_id, automatique)
           SELECT $1, $2, x.cle, x.produit_id, true FROM jsonb_to_recordset($3::jsonb) AS x(cle text, produit_id uuid)
           ON CONFLICT DO NOTHING`,
          [lieuId, caisseId, JSON.stringify(liensProduits)],
        )
      ).rowCount ?? 0;
  if (liensStands.length)
    nbPointsDeVente =
      (
        await c.query(
          `INSERT INTO correspondance_point_de_vente (lieu_id, caisse_externe_id, nom, stand_id, automatique)
           SELECT $1, $2, x.nom, x.stand_id, true FROM jsonb_to_recordset($3::jsonb) AS x(nom text, stand_id uuid)
           ON CONFLICT DO NOTHING`,
          [lieuId, caisseId, JSON.stringify(liensStands)],
        )
      ).rowCount ?? 0;
  return { produits: nbProduits, pointsDeVente: nbPointsDeVente };
}

/** Aperçu d'un fichier : ce qui serait importé, sans rien enregistrer. */
function apercu(r: ResultatLecture) {
  return {
    entetes: r.entetes,
    colonnes: r.colonnes,
    manquants: r.manquants,
    lignesLues: r.lignesLues,
    ventes: r.ventes.length,
    montant: r.ventes.filter((v) => !v.annulee).reduce((s, v) => s + v.total, 0),
    premieres: r.ventes.slice(0, 5),
    erreurs: r.erreurs,
  };
}
export type ApercuImport = ReturnType<typeof apercu>;

export async function routesCaissesExternes(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/caisses-externes", async (req): Promise<CaisseExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerCaisses(c, auth.lieuId));
  });

  app.post("/api/caisses-externes", async (req): Promise<CaisseExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(z.object({ nom: Nom, systeme: Systeme }), req);
    return base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      const { rows } = await c.query<{ id: string }>("INSERT INTO caisse_externe (lieu_id, nom, systeme) VALUES ($1, $2, $3) RETURNING id", [auth.lieuId, d.nom, d.systeme]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "caisse_externe_creee", utilisateurId: auth.utilisateurId, details: { caisse: rows[0]!.id, nom: d.nom, systeme: d.systeme } });
      return listerCaisses(c, auth.lieuId);
    });
  });

  app.patch("/api/caisses-externes/:id", async (req): Promise<CaisseExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { nom } = corps(z.object({ nom: Nom }), req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await exigerCaisse(c, auth.lieuId, id);
      if (avant.nom !== nom) {
        await c.query("UPDATE caisse_externe SET nom = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, nom]);
        await inscrireJet(c, { lieuId: auth.lieuId, type: "caisse_externe_modifiee", utilisateurId: auth.utilisateurId, details: { caisse: id, avant: avant.nom, apres: nom } });
      }
      return listerCaisses(c, auth.lieuId);
    });
  });

  // Import d'un export de la caisse : `apercu` lit sans rien enregistrer ; sinon les ventes nouvelles sont ajoutées.
  app.post("/api/caisses-externes/:id/import", { bodyLimit: TAILLE_MAX + 64 * 1024 }, async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(
      z.object({ fichier: z.string().trim().min(1).max(200), contenu: z.string().max(TAILLE_MAX, "Fichier trop gros (8 Mo au plus)."), colonnes: Colonnes.optional(), apercu: z.boolean().default(false) }),
      req,
    );
    const caisse = await base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      return exigerCaisse(c, auth.lieuId, id);
    });
    const lu = lireExportCaisse(d.contenu, d.colonnes ?? caisse.colonnes ?? undefined);
    if (d.apercu) return apercu(lu);
    if (lu.manquants.length) throw new ErreurMetier(400, `Colonnes à choisir : ${lu.manquants.map((m) => CHAMPS_EXPORT.find((x) => x.champ === m)!.libelle).join(", ")}.`);
    if (lu.ventes.length === 0) throw new ErreurMetier(400, "Aucune vente lisible dans ce fichier.");
    const resultat = await base.transaction(contexte(auth), async (c) => {
      // Ventes déjà là : jamais comptées deux fois ; seule une annulation est reportée.
      const { rows: deja } = await c.query<{ id_externe: string; annulee: boolean }>(
        "SELECT id_externe, annulee FROM vente_externe WHERE lieu_id = $1 AND caisse_externe_id = $2 AND id_externe = ANY($3::text[])",
        [auth.lieuId, id, lu.ventes.map((v) => v.idExterne)],
      );
      const connues = new Map(deja.map((r) => [r.id_externe, r.annulee]));
      const nouvelles = lu.ventes.filter((v) => !connues.has(v.idExterne));
      const annulees = lu.ventes.filter((v) => v.annulee && connues.get(v.idExterne) === false).map((v) => v.idExterne);
      // Relevé de l'import, avec ses chiffres définitifs (table en écriture seule).
      const { rows: imp } = await c.query<{ id: string }>(
        "INSERT INTO import_ventes_externes (lieu_id, caisse_externe_id, par, fichier, lignes_lues, ventes_ajoutees, ventes_deja, erreurs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [auth.lieuId, id, auth.utilisateurId, d.fichier, lu.lignesLues, nouvelles.length, lu.ventes.length - nouvelles.length, JSON.stringify(lu.erreurs)],
      );
      const importId = imp[0]!.id;
      if (annulees.length) await c.query("UPDATE vente_externe SET annulee = true WHERE lieu_id = $1 AND caisse_externe_id = $2 AND id_externe = ANY($3::text[])", [auth.lieuId, id, annulees]);
      for (let i = 0; i < nouvelles.length; i += LOT_INSERTION) {
        const lot = nouvelles.slice(i, i + LOT_INSERTION);
        // Rattachement à l'événement du même jour (heure de Paris), le plus proche du début.
        await c.query(
          `INSERT INTO vente_externe (lieu_id, caisse_externe_id, id_externe, horodatage, point_de_vente, paiement, annulee, total_centimes, evenement_id, import_id)
           SELECT $1, $2, v.id_externe, v.horodatage, v.point_de_vente, v.paiement, v.annulee, v.total, (
                    SELECT e.id FROM evenement e
                     WHERE e.lieu_id = $1 AND (e.debut AT TIME ZONE 'Europe/Paris')::date = (v.horodatage AT TIME ZONE 'Europe/Paris')::date
                     ORDER BY abs(extract(epoch FROM v.horodatage - e.debut)) LIMIT 1), $3
             FROM jsonb_to_recordset($4::jsonb) AS v(id_externe text, horodatage timestamptz, point_de_vente text, paiement text, annulee boolean, total integer)`,
          [auth.lieuId, id, importId, JSON.stringify(lot.map((v) => ({ id_externe: v.idExterne, horodatage: v.horodatage, point_de_vente: v.pointDeVente, paiement: v.paiement, annulee: v.annulee, total: v.total })))],
        );
        await c.query(
          `INSERT INTO ligne_vente_externe (lieu_id, caisse_externe_id, id_externe, rang, cle, libelle, code, quantite, prix_unitaire_centimes, montant_centimes, tva_pb)
           SELECT $1, $2, l.id_externe, l.rang, l.cle, l.libelle, l.code, l.quantite, l.prix_unitaire, l.montant, l.tva_pb
             FROM jsonb_to_recordset($3::jsonb) AS l(id_externe text, rang smallint, cle text, libelle text, code text, quantite numeric, prix_unitaire integer, montant integer, tva_pb integer)`,
          [
            auth.lieuId,
            id,
            JSON.stringify(
              lot.flatMap((v) => v.lignes.map((l, rang) => ({ id_externe: v.idExterne, rang, cle: l.cle, libelle: l.libelle, code: l.code, quantite: l.quantite, prix_unitaire: l.prixUnitaire, montant: l.montant, tva_pb: l.tvaPb }))),
            ),
          ],
        );
      }
      await c.query("UPDATE caisse_externe SET colonnes = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, JSON.stringify(lu.colonnes)]);
      const relies = await relierAutomatiquement(c, auth.lieuId, id);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_externe_import",
        utilisateurId: auth.utilisateurId,
        details: {
          caisse: id,
          fichier: d.fichier,
          lignes: lu.lignesLues,
          ajoutees: nouvelles.length,
          deja: lu.ventes.length - nouvelles.length,
          annulationsReportees: annulees.length,
          erreurs: lu.erreurs.length,
          reliesAutomatiquement: relies,
        },
      });
      return { importId, ajoutees: nouvelles.length, deja: lu.ventes.length - nouvelles.length, annulationsReportees: annulees.length, relies };
    });
    return { ...resultat, lignesLues: lu.lignesLues, erreurs: lu.erreurs, caisses: await base.transaction(contexte(auth), (c) => listerCaisses(c, auth.lieuId)) };
  });

  app.get("/api/caisses-externes/:id/produits", async (req): Promise<ProduitExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await exigerCaisse(c, auth.lieuId, id);
      return produitsExternes(c, auth.lieuId, id);
    });
  });

  app.put("/api/caisses-externes/:id/produits", async (req): Promise<ProduitExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(z.object({ cle: z.string().min(1).max(200), produitId: Uuid.nullable(), ignore: z.boolean() }), req);
    if (d.ignore && d.produitId) throw new ErreurMetier(400, "Un produit ignoré n'a pas de correspondance.");
    return base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      await exigerCaisse(c, auth.lieuId, id);
      // Choix à la main, jamais « automatique » ; « aucun » est retenu : le produit n'est plus relié sans demander.
      await c.query(
        `INSERT INTO correspondance_produit_externe (lieu_id, caisse_externe_id, cle, produit_id, ignore, automatique) VALUES ($1, $2, $3, $4, $5, false)
         ON CONFLICT (lieu_id, caisse_externe_id, cle) DO UPDATE SET produit_id = EXCLUDED.produit_id, ignore = EXCLUDED.ignore, automatique = false`,
        [auth.lieuId, id, d.cle, d.produitId, d.ignore],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "correspondance_externe_modifiee", utilisateurId: auth.utilisateurId, details: { caisse: id, produitExterne: d.cle, produit: d.produitId, ignore: d.ignore } });
      return produitsExternes(c, auth.lieuId, id);
    });
  });

  // Toutes les suggestions affichées acceptées d'un coup : choix du directeur, donc pas « automatique ».
  app.post("/api/caisses-externes/:id/produits/suggestions", async (req): Promise<ProduitExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      await exigerCaisse(c, auth.lieuId, id);
      const liens = (await produitsExternes(c, auth.lieuId, id)).flatMap((p) => (p.suggestion ? [{ cle: p.cle, produit_id: p.suggestion.id }] : []));
      if (liens.length) {
        await c.query(
          `INSERT INTO correspondance_produit_externe (lieu_id, caisse_externe_id, cle, produit_id, automatique)
           SELECT $1, $2, x.cle, x.produit_id, false FROM jsonb_to_recordset($3::jsonb) AS x(cle text, produit_id uuid)
           ON CONFLICT DO NOTHING`,
          [auth.lieuId, id, JSON.stringify(liens)],
        );
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "correspondances_suggerees_acceptees",
          utilisateurId: auth.utilisateurId,
          details: { caisse: id, produits: liens.map((l) => ({ produitExterne: l.cle, produit: l.produit_id })) },
        });
      }
      return produitsExternes(c, auth.lieuId, id);
    });
  });

  app.get("/api/caisses-externes/:id/points-de-vente", async (req): Promise<PointDeVenteExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await exigerCaisse(c, auth.lieuId, id);
      return pointsDeVente(c, auth.lieuId, id);
    });
  });

  app.put("/api/caisses-externes/:id/points-de-vente", async (req): Promise<PointDeVenteExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(z.object({ nom: z.string().min(1).max(120), standId: Uuid.nullable() }), req);
    return base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      await exigerCaisse(c, auth.lieuId, id);
      await c.query(
        `INSERT INTO correspondance_point_de_vente (lieu_id, caisse_externe_id, nom, stand_id, automatique) VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (lieu_id, caisse_externe_id, nom) DO UPDATE SET stand_id = EXCLUDED.stand_id, automatique = false`,
        [auth.lieuId, id, d.nom, d.standId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "correspondance_externe_modifiee", utilisateurId: auth.utilisateurId, details: { caisse: id, pointDeVente: d.nom, stand: d.standId } });
      return pointsDeVente(c, auth.lieuId, id);
    });
  });

  app.post("/api/caisses-externes/:id/points-de-vente/suggestions", async (req): Promise<PointDeVenteExterne[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await exigerHorsFormation(c, auth.lieuId);
      await exigerCaisse(c, auth.lieuId, id);
      const liens = (await pointsDeVente(c, auth.lieuId, id)).flatMap((p) => (p.suggestion ? [{ nom: p.nom, stand_id: p.suggestion.id }] : []));
      if (liens.length) {
        await c.query(
          `INSERT INTO correspondance_point_de_vente (lieu_id, caisse_externe_id, nom, stand_id, automatique)
           SELECT $1, $2, x.nom, x.stand_id, false FROM jsonb_to_recordset($3::jsonb) AS x(nom text, stand_id uuid)
           ON CONFLICT DO NOTHING`,
          [auth.lieuId, id, JSON.stringify(liens)],
        );
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "correspondances_suggerees_acceptees",
          utilisateurId: auth.utilisateurId,
          details: { caisse: id, pointsDeVente: liens.map((l) => ({ pointDeVente: l.nom, stand: l.stand_id })) },
        });
      }
      return pointsDeVente(c, auth.lieuId, id);
    });
  });

  // Résultats des ventes importées, toutes caisses connectées du lieu, du … au … (jours de Paris, bornes comprises).
  app.get("/api/caisses-externes/synthese", async (req): Promise<SyntheseVentesExternes> => {
    const auth = await exigerDirecteur(req, base);
    const Jour = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ).");
    const { du, au } = z.object({ du: Jour, au: Jour }).refine((p) => p.du <= p.au, "La fin précède le début.").parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const bornes = [auth.lieuId, du, au];
      const DANS = `v.lieu_id = $1 AND v.horodatage >= ($2::date)::timestamp AT TIME ZONE 'Europe/Paris' AND v.horodatage < ($3::date + 1)::timestamp AT TIME ZONE 'Europe/Paris'`;
      const { rows: t } = await c.query<{ ventes: number; annulees: number }>(
        `SELECT count(*) FILTER (WHERE NOT v.annulee)::int AS ventes, count(*) FILTER (WHERE v.annulee)::int AS annulees FROM vente_externe v WHERE ${DANS}`,
        bornes,
      );
      // Lignes des ventes non annulées, avec le produit rapproché (coût matière) et le stand du point de vente.
      const LIGNES = `
        SELECT v.id_externe, v.caisse_externe_id, v.horodatage, l.cle, l.libelle, l.quantite, l.montant_centimes AS montant,
               m.produit_id, p.nom AS produit, p.cout_matiere_centimes AS cout_unitaire,
               coalesce(s.nom, v.point_de_vente, 'Sans point de vente') AS stand,
               coalesce(e.libelle, 'Hors événement') AS evenement, e.id AS evenement_id
          FROM vente_externe v
          JOIN ligne_vente_externe l ON l.lieu_id = v.lieu_id AND l.caisse_externe_id = v.caisse_externe_id AND l.id_externe = v.id_externe
          LEFT JOIN correspondance_produit_externe m ON m.lieu_id = l.lieu_id AND m.caisse_externe_id = l.caisse_externe_id AND m.cle = l.cle
          LEFT JOIN produit p ON p.lieu_id = v.lieu_id AND p.id = m.produit_id
          LEFT JOIN correspondance_point_de_vente cp ON cp.lieu_id = v.lieu_id AND cp.caisse_externe_id = v.caisse_externe_id AND cp.nom = v.point_de_vente
          LEFT JOIN stand s ON s.lieu_id = v.lieu_id AND s.id = cp.stand_id
          LEFT JOIN evenement e ON e.lieu_id = v.lieu_id AND e.id = v.evenement_id
         WHERE ${DANS} AND NOT v.annulee AND NOT coalesce(m.ignore, false)`;
      const groupe = async (cle: string, libelle: string): Promise<LigneSynthese[]> => {
        const { rows } = await c.query<{ cle: string; libelle: string; ventes: number; quantite: string; montant: number; cout: number | null }>(
          `WITH l AS (${LIGNES})
           SELECT ${cle} AS cle, max(${libelle}) AS libelle, count(DISTINCT (l.caisse_externe_id, l.id_externe))::int AS ventes, sum(l.quantite) AS quantite,
                  sum(l.montant)::int AS montant, sum(round(l.quantite * l.cout_unitaire)) FILTER (WHERE l.cout_unitaire IS NOT NULL)::int AS cout
             FROM l GROUP BY 1 ORDER BY sum(l.montant) DESC, 1`,
          bornes,
        );
        return rows.map((r) => ({ cle: r.cle, libelle: r.libelle, ventes: r.ventes, quantite: Number(r.quantite), montant: r.montant, cout: r.cout }));
      };
      const parProduit = await groupe("coalesce(l.produit_id::text, 'externe:' || l.cle)", "coalesce(l.produit, l.libelle)");
      const parStand = await groupe("l.stand", "l.stand");
      const parEvenement = await groupe("coalesce(l.evenement_id::text, 'hors')", "l.evenement");
      const { rows: heures } = await c.query<{ heure: number; ventes: number; montant: number }>(
        `SELECT extract(hour FROM v.horodatage AT TIME ZONE 'Europe/Paris')::int AS heure, count(*)::int AS ventes, sum(v.total_centimes)::int AS montant
           FROM vente_externe v WHERE ${DANS} AND NOT v.annulee GROUP BY 1 ORDER BY 1`,
        bornes,
      );
      const montant = parProduit.reduce((s, x) => s + x.montant, 0);
      const avecCout = parProduit.filter((x) => x.cout !== null);
      return {
        du,
        au,
        ventes: t[0]!.ventes,
        annulees: t[0]!.annulees,
        montant,
        montantAvecCout: avecCout.reduce((s, x) => s + x.montant, 0),
        cout: avecCout.reduce((s, x) => s + x.cout!, 0),
        parProduit,
        parStand,
        parEvenement,
        parHeure: heures,
      };
    });
  });
}
