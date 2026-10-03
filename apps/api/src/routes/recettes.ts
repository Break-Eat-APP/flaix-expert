import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { coutLigneRecette, coutRecette, type Ingredient, type Recette, type UniteIngredient } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps } from "./outils.ts";

/**
 * Recettes (dossier §15.117, §15.119) : ingrédients avec leur prix par kg, litre ou pièce ; recette
 * d'un produit = ingrédients et quantités ; le coût de fabrication devient le coût matière du produit
 * et suit chaque changement de prix d'un ingrédient.
 */
const Prix = z.number().int().min(0, "Un prix ne peut pas être négatif.").max(10_000_000);
const NouvelIngredient = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  unite: z.enum(["kg", "l", "piece"]),
  prix: Prix,
});
const ModifIngredient = z.object({ nom: z.string().trim().min(1).max(80).optional(), prix: Prix.optional(), actif: z.boolean().optional(), suiviStock: z.boolean().optional() });
const SaisieRecette = z.object({
  lignes: z
    .array(z.object({ ingredientId: z.string().uuid(), quantiteMilli: z.number().int().min(1, "Quantité nulle.").max(100_000_000) }))
    .max(60)
    .refine((l) => new Set(l.map((x) => x.ingredientId)).size === l.length, "Un ingrédient ne figure qu'une fois dans une recette."),
});

async function lireIngredients(c: Client, lieuId: string): Promise<Ingredient[]> {
  const { rows } = await c.query<{ id: string; nom: string; unite: UniteIngredient; prix_centimes: number; actif: boolean; suivi_stock: boolean; recettes: number }>(
    `SELECT i.id, i.nom, i.unite, i.prix_centimes, i.actif, i.suivi_stock,
            (SELECT count(*)::int FROM recette_ligne r WHERE r.lieu_id = i.lieu_id AND r.ingredient_id = i.id) AS recettes
       FROM ingredient i WHERE i.lieu_id = $1 ORDER BY i.actif DESC, lower(i.nom)`,
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, nom: r.nom, unite: r.unite, prix: r.prix_centimes, actif: r.actif, suiviStock: r.suivi_stock, recettes: r.recettes }));
}

async function lireRecette(c: Client, lieuId: string, produitId: string): Promise<Recette> {
  const { rows } = await c.query<{ ingredient_id: string; nom: string; unite: UniteIngredient; prix_centimes: number; quantite_milli: number }>(
    `SELECT r.ingredient_id, i.nom, i.unite, i.prix_centimes, r.quantite_milli
       FROM recette_ligne r JOIN ingredient i ON i.lieu_id = r.lieu_id AND i.id = r.ingredient_id
      WHERE r.lieu_id = $1 AND r.produit_id = $2 ORDER BY lower(i.nom)`,
    [lieuId, produitId],
  );
  const lignes = rows.map((r) => ({
    ingredientId: r.ingredient_id,
    nom: r.nom,
    unite: r.unite,
    prix: r.prix_centimes,
    quantiteMilli: r.quantite_milli,
    cout: coutLigneRecette(r.prix_centimes, r.quantite_milli),
  }));
  return { produitId, lignes, cout: lignes.length ? coutRecette(lignes) : null };
}

/**
 * Recalcule le coût matière des produits qui ont une recette (tous, ou ceux qui utilisent un ingrédient).
 * Renvoie ceux dont le coût a changé, pour le journal.
 */
export async function recalculerCoutsRecettes(c: Client, lieuId: string, ingredientId?: string): Promise<{ produit: string; avant: number | null; apres: number }[]> {
  const { rows } = await c.query<{ id: string; nom: string; avant: number | null }>(
    `SELECT DISTINCT p.id, p.nom, p.cout_matiere_centimes AS avant
       FROM produit p JOIN recette_ligne r ON r.lieu_id = p.lieu_id AND r.produit_id = p.id
      WHERE p.lieu_id = $1 AND ($2::uuid IS NULL OR p.id IN (SELECT produit_id FROM recette_ligne WHERE lieu_id = $1 AND ingredient_id = $2))`,
    [lieuId, ingredientId ?? null],
  );
  const changes = [];
  for (const p of rows) {
    const { cout } = await lireRecette(c, lieuId, p.id);
    if (cout !== null && cout !== p.avant) {
      await c.query("UPDATE produit SET cout_matiere_centimes = $3 WHERE lieu_id = $1 AND id = $2", [lieuId, p.id, cout]);
      changes.push({ produit: p.nom, avant: p.avant, apres: cout });
    }
  }
  return changes;
}

/** Un produit fabriqué (avec recette) : son coût vient de la recette, ni d'une saisie ni d'une livraison. */
export async function aUneRecette(c: Client, lieuId: string, produitId: string): Promise<boolean> {
  const { rows } = await c.query("SELECT 1 FROM recette_ligne WHERE lieu_id = $1 AND produit_id = $2 LIMIT 1", [lieuId, produitId]);
  return rows.length > 0;
}

export async function routesRecettes(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/ingredients", async (req): Promise<Ingredient[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireIngredients(c, auth.lieuId));
  });

  app.post("/api/ingredients", async (req): Promise<Ingredient[]> => {
    const auth = await exigerDirecteur(req, base);
    const i = corps(NouvelIngredient, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows: existe } = await c.query("SELECT 1 FROM ingredient WHERE lieu_id = $1 AND lower(btrim(nom)) = lower($2)", [auth.lieuId, i.nom]);
      if (existe[0]) throw new ErreurMetier(409, `L'ingrédient « ${i.nom} » existe déjà.`);
      await c.query("INSERT INTO ingredient (lieu_id, nom, unite, prix_centimes, cree_par) VALUES ($1, $2, $3, $4, $5)", [auth.lieuId, i.nom, i.unite, i.prix, auth.utilisateurId]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "ingredient_cree", utilisateurId: auth.utilisateurId, details: i });
      return lireIngredients(c, auth.lieuId);
    });
  });

  app.patch("/api/ingredients/:id", async (req): Promise<Ingredient[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const m = corps(ModifIngredient, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; prix_centimes: number; actif: boolean; suivi_stock: boolean }>("SELECT nom, prix_centimes, actif, suivi_stock FROM ingredient WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [
        auth.lieuId,
        id,
      ]);
      const avant = rows[0];
      if (!avant) throw introuvable("Ingrédient");
      if (m.nom && m.nom.toLowerCase() !== avant.nom.toLowerCase()) {
        const { rows: existe } = await c.query("SELECT 1 FROM ingredient WHERE lieu_id = $1 AND id <> $2 AND lower(btrim(nom)) = lower($3)", [auth.lieuId, id, m.nom]);
        if (existe[0]) throw new ErreurMetier(409, `L'ingrédient « ${m.nom} » existe déjà.`);
      }
      const apres = { nom: m.nom ?? avant.nom, prix: m.prix ?? avant.prix_centimes, actif: m.actif ?? avant.actif, suiviStock: m.suiviStock ?? avant.suivi_stock };
      await c.query("UPDATE ingredient SET nom = $3, prix_centimes = $4, actif = $5, suivi_stock = $6 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, apres.nom, apres.prix, apres.actif, apres.suiviStock]);
      const recalcules = apres.prix !== avant.prix_centimes ? await recalculerCoutsRecettes(c, auth.lieuId, id) : [];
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "ingredient_modifie",
        utilisateurId: auth.utilisateurId,
        details: { ingredient: avant.nom, avant: { nom: avant.nom, prix: avant.prix_centimes, actif: avant.actif, suiviStock: avant.suivi_stock }, apres, produits_recalcules: recalcules },
      });
      return lireIngredients(c, auth.lieuId);
    });
  });

  app.get("/api/produits/:id/recette", async (req): Promise<Recette> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("SELECT 1 FROM produit WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      if (!rows[0]) throw introuvable("Produit");
      return lireRecette(c, auth.lieuId, id);
    });
  });

  app.put("/api/produits/:id/recette", async (req): Promise<Recette> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { lignes } = corps(SaisieRecette, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; cout: number | null }>("SELECT nom, cout_matiere_centimes AS cout FROM produit WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [
        auth.lieuId,
        id,
      ]);
      const p = rows[0];
      if (!p) throw introuvable("Produit");
      if (lignes.length) {
        const { rows: ok } = await c.query("SELECT id FROM ingredient WHERE lieu_id = $1 AND id = ANY($2::uuid[])", [auth.lieuId, lignes.map((l) => l.ingredientId)]);
        if (ok.length !== lignes.length) throw new ErreurMetier(404, "Ingrédient introuvable.");
      }
      await c.query("DELETE FROM recette_ligne WHERE lieu_id = $1 AND produit_id = $2", [auth.lieuId, id]);
      for (const l of lignes) {
        await c.query("INSERT INTO recette_ligne (lieu_id, produit_id, ingredient_id, quantite_milli) VALUES ($1, $2, $3, $4)", [auth.lieuId, id, l.ingredientId, l.quantiteMilli]);
      }
      const recette = await lireRecette(c, auth.lieuId, id);
      // Sans recette, le coût matière reste le dernier calculé et redevient modifiable à la main.
      if (recette.cout !== null && recette.cout !== p.cout) {
        await c.query("UPDATE produit SET cout_matiere_centimes = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, recette.cout]);
      }
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "recette_modifiee",
        utilisateurId: auth.utilisateurId,
        details: { produitId: id, produit: p.nom, ingredients: lignes.length, cout_avant: p.cout, cout_apres: recette.cout ?? p.cout },
      });
      return recette;
    });
  });
}
