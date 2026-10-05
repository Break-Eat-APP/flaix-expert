import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { cleFournisseur, comparerFournisseurs, formaterQuantiteStock, moyenneParEvenement, type ComparaisonFournisseurs, type Conditionnement, type LivraisonFournisseur, type UniteIngredient } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { resumeMatchs } from "./resultats.ts";
import { Uuid, contexte, corps } from "./outils.ts";

/*
 * Comparaison des prix entre fournisseurs (module 5 ; dossier §15.141) : prix unitaire de la dernière livraison
 * chez chaque fournisseur, écoulement d'un colis, alerte de sur-conditionnement. Lit Stock, ne modifie rien
 * d'autre que le conditionnement déclaré d'un fournisseur.
 */

/** Événements servant à la consommation moyenne. */
const EVENEMENTS_CONSOMMATION = 5;

const Conditionnement = z
  .object({
    produitId: Uuid.optional(),
    ingredientId: Uuid.optional(),
    fournisseur: z.string().trim().min(1, "Fournisseur obligatoire.").max(120),
    libelle: z.string().trim().min(1).max(60).nullable(),
    /** Portions (produit) ou millièmes d'unité d'achat (ingrédient) ; null : retirer le conditionnement. */
    contenance: z.number().int().min(1, "Contenance invalide.").max(1_000_000_000).nullable(),
  })
  .refine((x) => !!x.produitId !== !!x.ingredientId, "Indique un produit ou un ingrédient.")
  .refine((x) => (x.libelle === null) === (x.contenance === null), "Indique le colis et sa contenance, ou ni l'un ni l'autre.");

export async function comparaisonFournisseurs(c: Client, lieuId: string): Promise<ComparaisonFournisseurs> {
  const { rows } = await c.query<{ cle: string; nom: string; unite: UniteIngredient | null; fournisseur: string | null; prix: number; quantite: number; date: string; le: Date }>(
    `SELECT 'p:' || m.produit_id AS cle, p.nom, NULL AS unite, m.fournisseur, m.prix_unitaire_centimes::float8 AS prix, m.quantite::float8 AS quantite,
            to_char(coalesce(m.date_livraison, m.le::date), 'YYYY-MM-DD') AS date, m.le
       FROM stock_mouvement m JOIN produit p ON p.lieu_id = m.lieu_id AND p.id = m.produit_id
      WHERE m.lieu_id = $1 AND m.type = 'livraison' AND m.prix_unitaire_centimes IS NOT NULL AND p.actif
     UNION ALL
     SELECT 'i:' || m.ingredient_id, i.nom, i.unite, m.fournisseur, m.prix_total_centimes::float8 * 1000 / m.quantite_milli, m.quantite_milli::float8 / 1000,
            to_char(coalesce(m.date_livraison, m.le::date), 'YYYY-MM-DD'), m.le
       FROM ingredient_mouvement m JOIN ingredient i ON i.lieu_id = m.lieu_id AND i.id = m.ingredient_id
      WHERE m.lieu_id = $1 AND m.type = 'livraison' AND m.prix_total_centimes IS NOT NULL AND m.quantite_milli > 0 AND i.actif`,
    [lieuId],
  );
  const livraisons: LivraisonFournisseur[] = rows.map((r) => ({ cle: r.cle, nom: r.nom, unite: r.unite, fournisseur: r.fournisseur, prixUnitaire: r.prix, quantite: r.quantite, date: r.date, le: r.le.toISOString() }));

  // Consommation moyenne sur les derniers événements clos qui ont des ventes (un article non vendu compte 0).
  const evenements = (await resumeMatchs(c, lieuId)).filter((m) => m.etat === "clos").slice(0, EVENEMENTS_CONSOMMATION).map((m) => m.id);
  const consommation = new Map<string, number>();
  if (evenements.length) {
    const { rows: produits } = await c.query<{ cle: string; q: number }>(
      `SELECT 'p:' || l.produit_id AS cle, sum(l.quantite)::float8 AS q FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
        WHERE l.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[]) GROUP BY l.produit_id`,
      [lieuId, evenements],
    );
    const { rows: ingredients } = await c.query<{ cle: string; q: number }>(
      `SELECT 'i:' || ingredient_id AS cle, sum(quantite_milli)::float8 / 1000 AS q FROM ingredient_consommation
        WHERE lieu_id = $1 AND evenement_id = ANY($2::uuid[]) GROUP BY ingredient_id`,
      [lieuId, evenements],
    );
    for (const x of [...produits, ...ingredients]) {
      const m = moyenneParEvenement([x.q], evenements.length);
      if (m !== null && m > 0) consommation.set(x.cle, m);
    }
  }

  const { rows: conds } = await c.query<{ produit_id: string | null; ingredient_id: string | null; fournisseur: string; libelle: string; contenance: string }>(
    "SELECT produit_id, ingredient_id, fournisseur, libelle, contenance FROM conditionnement_fournisseur WHERE lieu_id = $1",
    [lieuId],
  );
  const conditionnements: Conditionnement[] = conds.map((x) => ({
    cle: x.produit_id ? `p:${x.produit_id}` : `i:${x.ingredient_id}`,
    fournisseur: x.fournisseur,
    libelle: x.libelle,
    contenance: x.produit_id ? Number(x.contenance) : Number(x.contenance) / 1000,
  }));
  return { articles: comparerFournisseurs(livraisons, consommation, conditionnements), evenementsConsommation: evenements.length };
}

export async function routesFournisseurs(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/stock/fournisseurs", async (req): Promise<ComparaisonFournisseurs> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => comparaisonFournisseurs(c, auth.lieuId));
  });

  app.put("/api/stock/fournisseurs/conditionnement", async (req): Promise<ComparaisonFournisseurs> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Conditionnement, req);
    return base.transaction(contexte(auth), async (c) => {
      const colonne = d.produitId ? "produit_id" : "ingredient_id";
      const id = d.produitId ?? d.ingredientId!;
      const { rows: objet } = await c.query<{ nom: string; unite: UniteIngredient | null }>(
        d.produitId ? "SELECT nom, NULL AS unite FROM produit WHERE lieu_id = $1 AND id = $2" : "SELECT nom, unite FROM ingredient WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      if (!objet[0]) throw introuvable(d.produitId ? "Produit" : "Ingrédient");
      const { rows: existants } = await c.query<{ id: string; fournisseur: string; libelle: string; contenance: string }>(
        `SELECT id, fournisseur, libelle, contenance FROM conditionnement_fournisseur WHERE lieu_id = $1 AND ${colonne} = $2`,
        [auth.lieuId, id],
      );
      const avant = existants.find((x) => cleFournisseur(x.fournisseur) === cleFournisseur(d.fournisseur)) ?? null;
      const texte = (libelle: string, contenance: number) => `${libelle} de ${objet[0]!.unite ? formaterQuantiteStock(contenance, objet[0]!.unite) : `${contenance} portion${contenance > 1 ? "s" : ""}`}`;
      const ancien = avant ? texte(avant.libelle, Number(avant.contenance)) : null;
      const nouveau = d.libelle !== null && d.contenance !== null ? texte(d.libelle, d.contenance) : null;
      if (ancien === nouveau) return comparaisonFournisseurs(c, auth.lieuId);
      if (avant && nouveau === null) await c.query("DELETE FROM conditionnement_fournisseur WHERE lieu_id = $1 AND id = $2", [auth.lieuId, avant.id]);
      else if (avant) await c.query("UPDATE conditionnement_fournisseur SET libelle = $3, contenance = $4, saisi_par = $5, saisi_le = now() WHERE lieu_id = $1 AND id = $2", [auth.lieuId, avant.id, d.libelle, d.contenance, auth.utilisateurId]);
      else await c.query(`INSERT INTO conditionnement_fournisseur (lieu_id, ${colonne}, fournisseur, libelle, contenance, saisi_par) VALUES ($1, $2, $3, $4, $5, $6)`, [auth.lieuId, id, d.fournisseur, d.libelle, d.contenance, auth.utilisateurId]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "conditionnement_modifie", utilisateurId: auth.utilisateurId, details: { article: objet[0].nom, fournisseur: d.fournisseur, avant: ancien, apres: nouveau } });
      return comparaisonFournisseurs(c, auth.lieuId);
    });
  });
}
