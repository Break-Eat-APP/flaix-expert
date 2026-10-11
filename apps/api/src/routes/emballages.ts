import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { formaterMillimes, type Emballage, type Produit } from "@flaix/domain";
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
const ModifEmballage = z.object({ nom: texte(60, "Le nom de l'emballage").optional(), prixMillimes: Prix.optional() });
const DuProduit = z.object({
  emballages: z
    .array(z.object({ emballageId: Uuid, quantite: z.number().int().min(1, "Au moins 1.").max(50, "50 au plus.") }))
    .max(30)
    .refine((l) => new Set(l.map((e) => e.emballageId)).size === l.length, "Un emballage est en double."),
});

export async function listerEmballages(c: Client, lieuId: string): Promise<Emballage[]> {
  const { rows } = await c.query<{ id: string; nom: string; prix_millimes: number; produits: number }>(
    `SELECT e.id, e.nom, e.prix_millimes, (SELECT count(*)::int FROM produit_emballage pe WHERE pe.lieu_id = e.lieu_id AND pe.emballage_id = e.id) AS produits
       FROM emballage e WHERE e.lieu_id = $1 ORDER BY lower(e.nom)`,
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, nom: r.nom, prixMillimes: r.prix_millimes, produits: r.produits }));
}

async function exigerEmballage(c: Client, lieuId: string, id: string): Promise<{ nom: string; prix_millimes: number }> {
  const { rows } = await c.query<{ nom: string; prix_millimes: number }>("SELECT nom, prix_millimes FROM emballage WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
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
      if (nom === avant.nom && prix === avant.prix_millimes) return listerEmballages(c, auth.lieuId);
      if (nom.toLowerCase() !== avant.nom.toLowerCase()) {
        const { rows } = await c.query("SELECT 1 FROM emballage WHERE lieu_id = $1 AND lower(nom) = lower($2) AND id <> $3", [auth.lieuId, nom, id]);
        if (rows[0]) throw new ErreurMetier(409, `Un emballage s'appelle déjà « ${nom} ».`);
      }
      await c.query("UPDATE emballage SET nom = $3, prix_millimes = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, nom, prix]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "emballage_modifie",
        utilisateurId: auth.utilisateurId,
        details: {
          emballage: avant.nom,
          ...(nom !== avant.nom ? { nom: { avant: avant.nom, apres: nom } } : {}),
          ...(prix !== avant.prix_millimes ? { prix: { avant: formaterMillimes(avant.prix_millimes), apres: formaterMillimes(prix) } } : {}),
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
      await c.query("DELETE FROM emballage WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "emballage_supprime", utilisateurId: auth.utilisateurId, details: { nom: avant.nom, produits: liens.rowCount ?? 0 } });
      return listerEmballages(c, auth.lieuId);
    });
  });

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
