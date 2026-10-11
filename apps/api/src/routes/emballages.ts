import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { formaterMillimes, stockEstime, type Emballage, type Produit, type StockEmballage } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerProduits } from "./produits.ts";
import { ParamId, Uuid, contexte, corps, texte } from "./outils.ts";

/*
 * Conditionnement (dossier §15.155) : les emballages du lieu et leur prix à l'unité (millièmes d'euro), puis les
 * emballages de chaque produit. Le coût s'ajoute au coût matière dans les marges et « ce qu'il te reste ». Un
 * emballage se supprime avec ses liens ; tout est journalisé.
 */

const Prix = z.number().int().min(0, "Prix négatif.").max(100_000, "Prix au-delà de 100 €.");
const NouvelEmballage = z.object({ nom: texte(60, "Le nom de l'emballage"), prixMillimes: Prix });
const ModifEmballage = z.object({ nom: texte(60, "Le nom de l'emballage").optional(), prixMillimes: Prix.optional(), seuil: z.number().int().min(0).max(10_000_000).nullable().optional() });
const Quantite = z.object({ quantite: z.number().int().min(0, "Quantité négative.").max(10_000_000) });
const DuProduit = z.object({
  emballages: z
    .array(z.object({ emballageId: Uuid, quantite: z.number().int().min(1, "Au moins 1.").max(50, "50 au plus.") }))
    .max(30)
    .refine((l) => new Set(l.map((e) => e.emballageId)).size === l.length, "Un emballage est en double."),
});

/**
 * Stock de chaque emballage suivi (§15.158) : dernier comptage + livraisons depuis − portions vendues depuis (ventes
 * de gestion : caisse et caisses connectées) × emballages du produit ; consommation moyenne des 3 derniers matchs.
 */
async function stocks(c: Client, lieuId: string): Promise<Map<string, StockEmballage>> {
  const { rows } = await c.query<{ emballage_id: string; quantite: number; le: Date; livre: number; consomme: number }>(
    `WITH dernier AS (
       SELECT DISTINCT ON (m.emballage_id) m.emballage_id, m.quantite, m.saisi_le
         FROM emballage_mouvement m WHERE m.lieu_id = $1 AND m.sorte = 'comptage'
        ORDER BY m.emballage_id, m.saisi_le DESC)
     SELECT d.emballage_id, d.quantite, d.saisi_le AS le,
            coalesce((SELECT sum(x.quantite) FROM emballage_mouvement x
                       WHERE x.lieu_id = $1 AND x.emballage_id = d.emballage_id AND x.sorte = 'livraison' AND x.saisi_le > d.saisi_le), 0)::int AS livre,
            coalesce((SELECT sum(l.quantite * pe.quantite) FROM ligne_gestion l
                        JOIN vente_gestion j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
                        JOIN produit_emballage pe ON pe.lieu_id = l.lieu_id AND pe.produit_id = l.produit_id AND pe.emballage_id = d.emballage_id
                       WHERE l.lieu_id = $1 AND j.horodatage > d.saisi_le), 0)::int AS consomme
       FROM dernier d`,
    [lieuId],
  );
  const { rows: parMatch } = await c.query<{ emballage_id: string; n: number }>(
    `SELECT pe.emballage_id, j.evenement_id, max(e.debut) AS debut, sum(l.quantite * pe.quantite)::int AS n
       FROM ligne_gestion l
       JOIN vente_gestion j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
       JOIN evenement e ON e.lieu_id = j.lieu_id AND e.id = j.evenement_id
       JOIN produit_emballage pe ON pe.lieu_id = l.lieu_id AND pe.produit_id = l.produit_id
      WHERE l.lieu_id = $1 AND e.debut > now() - interval '365 days'
      GROUP BY pe.emballage_id, j.evenement_id
     HAVING sum(l.quantite * pe.quantite) > 0
      ORDER BY pe.emballage_id, max(e.debut) DESC`,
    [lieuId],
  );
  const moyenne = (id: string) => {
    const n = parMatch.filter((x) => x.emballage_id === id).slice(0, 3);
    return n.length ? Math.round(n.reduce((t, x) => t + x.n, 0) / n.length) : null;
  };
  return new Map(
    rows.map((r) => [
      r.emballage_id,
      { estime: stockEstime(r.quantite, r.livre, r.consomme), dernierComptage: { quantite: r.quantite, le: r.le.toISOString() }, livreDepuis: r.livre, consommeDepuis: r.consomme, parMatch: moyenne(r.emballage_id) },
    ]),
  );
}

export async function listerEmballages(c: Client, lieuId: string): Promise<Emballage[]> {
  const { rows } = await c.query<{ id: string; nom: string; prix_millimes: number; produits: number; seuil: number | null }>(
    `SELECT e.id, e.nom, e.prix_millimes, e.seuil, (SELECT count(*)::int FROM produit_emballage pe WHERE pe.lieu_id = e.lieu_id AND pe.emballage_id = e.id) AS produits
       FROM emballage e WHERE e.lieu_id = $1 ORDER BY lower(e.nom)`,
    [lieuId],
  );
  const s = await stocks(c, lieuId);
  return rows.map((r) => ({ id: r.id, nom: r.nom, prixMillimes: r.prix_millimes, produits: r.produits, seuil: r.seuil, stock: s.get(r.id) ?? null }));
}

async function exigerEmballage(c: Client, lieuId: string, id: string): Promise<{ nom: string; prix_millimes: number; seuil: number | null }> {
  const { rows } = await c.query<{ nom: string; prix_millimes: number; seuil: number | null }>("SELECT nom, prix_millimes, seuil FROM emballage WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  if (!rows[0]) throw introuvable("Emballage");
  return rows[0];
}

export async function routesEmballages(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/emballages", async (req): Promise<Emballage[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerEmballages(c, auth.lieuId));
  });

  app.post("/api/emballages", async (req, rep): Promise<Emballage[]> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouvelEmballage, req);
    const r = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("SELECT 1 FROM emballage WHERE lieu_id = $1 AND lower(nom) = lower($2)", [auth.lieuId, d.nom]);
      if (rows[0]) throw new ErreurMetier(409, `Un emballage s'appelle déjà « ${d.nom} ».`);
      await c.query("INSERT INTO emballage (lieu_id, nom, prix_millimes, cree_par) VALUES ($1, $2, $3, $4)", [auth.lieuId, d.nom, d.prixMillimes, auth.utilisateurId]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "emballage_cree", utilisateurId: auth.utilisateurId, details: { nom: d.nom, prix: formaterMillimes(d.prixMillimes) } });
      return listerEmballages(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  // Nom ou prix : un nouveau prix vaut pour tous les produits qui l'utilisent, et pour leurs ventes passées (comme un coût matière).
  app.patch("/api/emballages/:id", async (req): Promise<Emballage[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(ModifEmballage, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await exigerEmballage(c, auth.lieuId, id);
      const nom = d.nom ?? avant.nom;
      const prix = d.prixMillimes ?? avant.prix_millimes;
      const seuil = d.seuil === undefined ? avant.seuil : d.seuil;
      if (nom === avant.nom && prix === avant.prix_millimes && seuil === avant.seuil) return listerEmballages(c, auth.lieuId);
      if (nom.toLowerCase() !== avant.nom.toLowerCase()) {
        const { rows } = await c.query("SELECT 1 FROM emballage WHERE lieu_id = $1 AND lower(nom) = lower($2) AND id <> $3", [auth.lieuId, nom, id]);
        if (rows[0]) throw new ErreurMetier(409, `Un emballage s'appelle déjà « ${nom} ».`);
      }
      await c.query("UPDATE emballage SET nom = $3, prix_millimes = $4, seuil = $5 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, nom, prix, seuil]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "emballage_modifie",
        utilisateurId: auth.utilisateurId,
        details: {
          emballage: avant.nom,
          ...(nom !== avant.nom ? { nom: { avant: avant.nom, apres: nom } } : {}),
          ...(prix !== avant.prix_millimes ? { prix: { avant: formaterMillimes(avant.prix_millimes), apres: formaterMillimes(prix) } } : {}),
          ...(seuil !== avant.seuil ? { seuil: { avant: avant.seuil ?? "aucun", apres: seuil ?? "aucun" } } : {}),
        },
      });
      return listerEmballages(c, auth.lieuId);
    });
  });

  app.delete("/api/emballages/:id", async (req): Promise<Emballage[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await exigerEmballage(c, auth.lieuId, id);
      const liens = await c.query("DELETE FROM produit_emballage WHERE lieu_id = $1 AND emballage_id = $2", [auth.lieuId, id]);
      await c.query("DELETE FROM emballage_mouvement WHERE lieu_id = $1 AND emballage_id = $2", [auth.lieuId, id]);
      await c.query("DELETE FROM emballage WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "emballage_supprime", utilisateurId: auth.utilisateurId, details: { nom: avant.nom, produits: liens.rowCount ?? 0 } });
      return listerEmballages(c, auth.lieuId);
    });
  });

  // Stock (§15.158) : comptage (démarre ou recale le suivi) et livraison reçue.
  for (const sorte of ["comptage", "livraison"] as const) {
    app.post(`/api/emballages/:id/${sorte}`, async (req): Promise<Emballage[]> => {
      const auth = await exigerDirecteur(req, base);
      const { id } = ParamId.parse(req.params);
      const { quantite } = corps(Quantite, req);
      if (sorte === "livraison" && quantite === 0) throw new ErreurMetier(400, "Une livraison compte au moins une unité.");
      return base.transaction(contexte(auth), async (c) => {
        const e = await exigerEmballage(c, auth.lieuId, id);
        if (sorte === "livraison") {
          const { rows } = await c.query("SELECT 1 FROM emballage_mouvement WHERE lieu_id = $1 AND emballage_id = $2 AND sorte = 'comptage'", [auth.lieuId, id]);
          if (!rows[0]) throw new ErreurMetier(409, `Compte d'abord le stock de « ${e.nom} » : le suivi part d'un comptage.`);
        }
        await c.query("INSERT INTO emballage_mouvement (lieu_id, emballage_id, sorte, quantite, saisi_par) VALUES ($1, $2, $3, $4, $5)", [auth.lieuId, id, sorte, quantite, auth.utilisateurId]);
        await inscrireJet(c, { lieuId: auth.lieuId, type: "emballage_stock", utilisateurId: auth.utilisateurId, details: { emballage: e.nom, [sorte]: quantite } });
        return listerEmballages(c, auth.lieuId);
      });
    });
  }

  // Emballages d'une portion du produit : la liste remplace la précédente.
  app.put("/api/produits/:id/emballages", async (req): Promise<Produit[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(DuProduit, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows: produit } = await c.query<{ nom: string }>("SELECT nom FROM produit WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      if (!produit[0]) throw introuvable("Produit");
      const { rows: avant } = await c.query<{ nom: string; quantite: number; emballage_id: string }>(
        "SELECT e.nom, pe.quantite, pe.emballage_id FROM produit_emballage pe JOIN emballage e ON e.lieu_id = pe.lieu_id AND e.id = pe.emballage_id WHERE pe.lieu_id = $1 AND pe.produit_id = $2 ORDER BY lower(e.nom)",
        [auth.lieuId, id],
      );
      const { rows: connus } = await c.query<{ id: string; nom: string }>("SELECT id, nom FROM emballage WHERE lieu_id = $1 AND id = ANY($2::uuid[])", [auth.lieuId, d.emballages.map((e) => e.emballageId)]);
      if (connus.length !== d.emballages.length) throw introuvable("Emballage");
      const meme = avant.length === d.emballages.length && d.emballages.every((e) => avant.some((a) => a.emballage_id === e.emballageId && a.quantite === e.quantite));
      if (!meme) {
        await c.query("DELETE FROM produit_emballage WHERE lieu_id = $1 AND produit_id = $2", [auth.lieuId, id]);
        for (const e of d.emballages) {
          await c.query("INSERT INTO produit_emballage (lieu_id, produit_id, emballage_id, quantite) VALUES ($1, $2, $3, $4)", [auth.lieuId, id, e.emballageId, e.quantite]);
        }
        const texteDe = (l: { nom: string; quantite: number }[]) => (l.length ? l.map((x) => `${x.quantite} × ${x.nom}`).join(", ") : "aucun");
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "conditionnement_produit_modifie",
          utilisateurId: auth.utilisateurId,
          details: {
            produit: produit[0].nom,
            avant: texteDe(avant),
            apres: texteDe(d.emballages.map((e) => ({ nom: connus.find((x) => x.id === e.emballageId)!.nom, quantite: e.quantite }))),
          },
        });
      }
      return listerProduits(c, auth.lieuId);
    });
  });
}
