import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { EtatClickCollect, ModeStockCC, ReglagesClickCollect } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps, differences } from "./outils.ts";

/**
 * Click & Collect (module 13 validé ; dossier §3, §15.20, §15.28, §15.76, §15.111) : réglages du lieu
 * pour le moteur de prix, et configuration par produit (prix app appliqué, mode de stock C&C).
 * Les commandes elles-mêmes passent par l'application de commande (plateforme ou application du lieu), pas par les caisses FlaiX.
 */
const Reglages = z.object({
  commissionPb: z.number().int().min(0).max(5000, "Commission de 50 % au plus."),
  tvaCommissionRepercutee: z.boolean(),
  stripeTauxPb: z.number().int().min(0).max(1000, "Taux Stripe de 10 % au plus."),
  stripeFixe: z.number().int().min(0).max(500, "Frais fixe de 5,00 € au plus."),
  panierMoyen: z.number().int().min(100, "Panier moyen d'au moins 1,00 €.").max(100_000),
});
const ProduitCC = z.object({
  prixApp: z.number().int().min(1).max(1_000_000).nullable(),
  modeStock: z.enum(["partage", "dedie", "app"]).nullable(),
});

interface LigneLieu {
  cc_commission_pb: number | null;
  cc_tva_commission_repercutee: boolean;
  cc_stripe_taux_pb: number | null;
  cc_stripe_fixe_centimes: number | null;
  cc_panier_moyen_centimes: number | null;
}

async function lireReglages(c: Client, lieuId: string): Promise<ReglagesClickCollect | null> {
  const { rows } = await c.query<LigneLieu>(
    "SELECT cc_commission_pb, cc_tva_commission_repercutee, cc_stripe_taux_pb, cc_stripe_fixe_centimes, cc_panier_moyen_centimes FROM lieu WHERE id = $1",
    [lieuId],
  );
  const l = rows[0]!;
  if (l.cc_commission_pb === null || l.cc_stripe_taux_pb === null || l.cc_panier_moyen_centimes === null) return null;
  return {
    commissionPb: l.cc_commission_pb,
    tvaCommissionRepercutee: l.cc_tva_commission_repercutee,
    stripeTauxPb: l.cc_stripe_taux_pb,
    stripeFixe: l.cc_stripe_fixe_centimes ?? 0,
    panierMoyen: l.cc_panier_moyen_centimes,
  };
}

async function etat(c: Client, lieuId: string): Promise<EtatClickCollect> {
  const { rows: points } = await c.query<{ id: string; nom: string }>(
    "SELECT id, nom FROM stand WHERE lieu_id = $1 AND actif AND point_retrait_cc ORDER BY lower(nom)",
    [lieuId],
  );
  // Catalogue C&C : les produits actifs vendus dans au moins un point de retrait, au prix buvette en vigueur.
  const { rows: produits } = await c.query<{
    id: string;
    nom: string;
    categorie: string | null;
    prix: number;
    tva: number;
    prix_app_centimes: number | null;
    mode_stock_cc: ModeStockCC | null;
    stands: string[];
  }>(
    `SELECT p.id, p.nom, cat.nom AS categorie, t.prix_ttc_centimes AS prix, t.taux_tva_pb AS tva, p.prix_app_centimes, p.mode_stock_cc,
            array_agg(s.nom ORDER BY lower(s.nom)) AS stands
       FROM produit p
       JOIN produit_stand ps ON ps.lieu_id = p.lieu_id AND ps.produit_id = p.id
       JOIN stand s ON s.lieu_id = ps.lieu_id AND s.id = ps.stand_id AND s.actif AND s.point_retrait_cc
       LEFT JOIN categorie cat ON cat.lieu_id = p.lieu_id AND cat.id = p.categorie_id
       JOIN LATERAL (
         SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif
          WHERE lieu_id = p.lieu_id AND produit_id = p.id AND valide_du <= now() ORDER BY valide_du DESC LIMIT 1
       ) t ON true
      WHERE p.lieu_id = $1 AND p.actif
      GROUP BY p.id, cat.nom, t.prix_ttc_centimes, t.taux_tva_pb
      ORDER BY lower(coalesce(cat.nom, '')), lower(p.nom)`,
    [lieuId],
  );
  return {
    reglages: await lireReglages(c, lieuId),
    pointsRetrait: points,
    produits: produits.map((p) => ({
      id: p.id,
      nom: p.nom,
      categorie: p.categorie,
      prixBuvette: p.prix,
      tauxTva: p.tva,
      prixApp: p.prix_app_centimes,
      modeStock: p.mode_stock_cc,
      stands: p.stands,
    })),
  };
}

export async function routesClickCollect(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/click-collect", async (req): Promise<EtatClickCollect> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etat(c, auth.lieuId));
  });

  app.put("/api/click-collect/reglages", async (req): Promise<EtatClickCollect> => {
    const auth = await exigerDirecteur(req, base);
    const r = corps(Reglages, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = (await lireReglages(c, auth.lieuId)) ?? { commissionPb: null, tvaCommissionRepercutee: true, stripeTauxPb: null, stripeFixe: null, panierMoyen: null };
      await c.query(
        `UPDATE lieu SET cc_commission_pb = $2, cc_tva_commission_repercutee = $3, cc_stripe_taux_pb = $4, cc_stripe_fixe_centimes = $5, cc_panier_moyen_centimes = $6
          WHERE id = $1`,
        [auth.lieuId, r.commissionPb, r.tvaCommissionRepercutee, r.stripeTauxPb, r.stripeFixe, r.panierMoyen],
      );
      const diff = differences(avant as Record<string, unknown>, r);
      if (Object.keys(diff).length) await inscrireJet(c, { lieuId: auth.lieuId, type: "click_collect_reglages_modifies", utilisateurId: auth.utilisateurId, details: diff });
      return etat(c, auth.lieuId);
    });
  });

  app.put("/api/click-collect/produits/:id", async (req): Promise<EtatClickCollect> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const p = corps(ProduitCC, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; prix_app_centimes: number | null; mode_stock_cc: ModeStockCC | null }>(
        "SELECT nom, prix_app_centimes, mode_stock_cc FROM produit WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      const avant = rows[0];
      if (!avant) throw introuvable("Produit");
      await c.query("UPDATE produit SET prix_app_centimes = $3, mode_stock_cc = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, p.prixApp, p.modeStock]);
      const diff = differences({ prixApp: avant.prix_app_centimes, modeStock: avant.mode_stock_cc }, p);
      if (Object.keys(diff).length) {
        await inscrireJet(c, { lieuId: auth.lieuId, type: "prix_app_modifie", utilisateurId: auth.utilisateurId, details: { produit: id, nom: avant.nom, ...diff } });
      }
      return etat(c, auth.lieuId);
    });
  });
}
