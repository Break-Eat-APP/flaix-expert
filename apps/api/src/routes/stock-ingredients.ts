import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  alerteStock,
  cump,
  formaterMontant,
  formaterQuantiteStock,
  motifEcartStockRequis,
  prixUnitaireLivraison,
  seuilAlerte,
  suggestionMiseEnPlace,
  valeurQuantiteStock,
  type EtatReserveIngredients,
  type Evenement,
  type IngredientReserve,
  type InventaireIngredients,
  type LigneStockIngredient,
  type MouvementIngredient,
  type StockIngredientsMatch,
  type UniteIngredient,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { Uuid, contexte, corps } from "./outils.ts";
import { recalculerCoutsRecettes } from "./recettes.ts";

/*
 * Stock des ingrédients suivis (décision de Rémi, dossier §15.124) : le même cycle que les produits
 * (stock.ts), en millièmes de l'unité d'achat. Le « consommé » d'un stand vient des recettes des
 * produits vendus ; il est figé à la clôture du match (ingredient_consommation).
 */

const MAX = 1_000_000_000;
const QuantiteMilli = z.number().int().min(0, "Quantité invalide.").max(MAX, "Quantité trop élevée.");
const Ligne = z.object({ evenementId: Uuid, standId: Uuid, ingredientId: Uuid });
const MiseEnPlace = Ligne.extend({ quantiteMilli: QuantiteMilli });
const Reassort = Ligne.extend({ quantiteMilli: z.number().int().min(-MAX).max(MAX).refine((q) => q !== 0, "Quantité nulle.") });
const Comptage = Ligne.extend({ quantiteMilli: QuantiteMilli, motif: z.string().trim().max(300).nullish().transform((v) => (v ? v : null)) });
const Livraison = z.object({
  ingredientId: Uuid,
  quantiteMilli: z.number().int().min(1, "Quantité livrée invalide.").max(MAX),
  prixTotal: z.number().int().min(0).max(100_000_000),
  fournisseur: z.string().trim().max(120).nullish().transform((v) => (v ? v : null)),
  dateLivraison: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de livraison invalide."),
});
const Inventaire = z.object({
  dateInventaire: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'inventaire invalide."),
  lignes: z.array(z.object({ ingredientId: Uuid, compteMilli: QuantiteMilli })).min(1, "Compte au moins un ingrédient.").max(2000),
});
const ParEvenement = z.object({ evenementId: Uuid.optional() });

const jouerLe = (e: Evenement) => Date.parse(e.ouvertLe ?? e.debut);
const cle = (s: string, i: string) => `${s}|${i}`;
type Somme = { stand_id: string; ingredient_id: string; q: number };
const somme = (liste: Somme[]) => new Map(liste.map((x) => [cle(x.stand_id, x.ingredient_id), x.q]));

/** Consommation théorique d'un match, en direct : Σ quantités vendues × recette, par stand et ingrédient. */
const CONSOMMATION_EN_DIRECT = `
  SELECT j.stand_id, r.ingredient_id, sum(l.quantite::bigint * r.quantite_milli)::float8 AS q
    FROM ligne_ticket l
    JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
    JOIN recette_ligne r ON r.lieu_id = l.lieu_id AND r.produit_id = l.produit_id
   WHERE l.lieu_id = $1 AND j.evenement_id = $2
   GROUP BY 1, 2`;

/** À la clôture du match : la consommation est figée, une recette changée ensuite ne réécrit pas le passé. */
export async function figerConsommationIngredients(c: Client, lieuId: string, evenementId: string): Promise<void> {
  await c.query(
    `INSERT INTO ingredient_consommation (lieu_id, evenement_id, stand_id, ingredient_id, quantite_milli)
     SELECT $1, $2, x.stand_id, x.ingredient_id, x.q::bigint FROM (${CONSOMMATION_EN_DIRECT}) x
     ON CONFLICT DO NOTHING`,
    [lieuId, evenementId],
  );
}

async function consommation(c: Client, lieuId: string, e: Evenement): Promise<Somme[]> {
  if (e.etat === "clos") {
    return (
      await c.query<Somme>("SELECT stand_id, ingredient_id, quantite_milli::float8 AS q FROM ingredient_consommation WHERE lieu_id = $1 AND evenement_id = $2", [lieuId, e.id])
    ).rows;
  }
  return (await c.query<Somme>(CONSOMMATION_EN_DIRECT, [lieuId, e.id])).rows;
}

/** Solde calculé de la réserve par ingrédient suivi : dernier inventaire + livraisons − sorties depuis. */
async function reserveParIngredient(c: Client, lieuId: string): Promise<IngredientReserve[]> {
  const { rows } = await c.query<{ id: string; nom: string; unite: UniteIngredient; prix: number; compte: number | null; date_inventaire: string | null; livre: number; sorti: number }>(
    `WITH dernier AS (
       SELECT DISTINCT ON (l.ingredient_id) l.ingredient_id, l.compte_milli, i.le, to_char(i.date_inventaire, 'YYYY-MM-DD') AS date_inventaire
         FROM inventaire_reserve_ingredient l JOIN inventaire_reserve i ON i.lieu_id = l.lieu_id AND i.id = l.inventaire_id
        WHERE l.lieu_id = $1
        ORDER BY l.ingredient_id, i.le DESC)
     SELECT g.id, g.nom, g.unite, g.prix_centimes AS prix, d.compte_milli::float8 AS compte, d.date_inventaire,
            coalesce((SELECT sum(m.quantite_milli) FROM ingredient_mouvement m WHERE m.lieu_id = $1 AND m.ingredient_id = g.id AND m.type = 'livraison' AND (d.le IS NULL OR m.le > d.le)), 0)::float8 AS livre,
            coalesce((SELECT sum(m.quantite_milli) FROM ingredient_mouvement m WHERE m.lieu_id = $1 AND m.ingredient_id = g.id AND m.type <> 'livraison' AND (d.le IS NULL OR m.le > d.le)), 0)::float8 AS sorti
       FROM ingredient g LEFT JOIN dernier d ON d.ingredient_id = g.id
      WHERE g.lieu_id = $1 AND g.actif AND g.suivi_stock
      ORDER BY lower(g.nom)`,
    [lieuId],
  );
  return rows.map((r) => ({
    ingredientId: r.id,
    nom: r.nom,
    unite: r.unite,
    prix: r.prix,
    inventaire: r.compte === null ? null : { date: r.date_inventaire!, compte: r.compte },
    livreDepuis: r.livre,
    sortiDepuis: r.sorti,
    solde: (r.compte ?? 0) + r.livre - r.sorti,
  }));
}

/** L'état des ingrédients suivis de chaque stand pour un match. */
export async function stockIngredientsDuMatch(c: Client, lieuId: string, e: Evenement): Promise<StockIngredientsMatch> {
  const evenements = await listerEvenements(c, lieuId);
  const avant = evenements.filter((x) => x.id !== e.id && jouerLe(x) < jouerLe(e)).map((x) => x.id);
  const p = [lieuId, e.id];

  const { rows: stands } = await c.query<{ id: string; nom: string }>("SELECT id, nom FROM stand WHERE lieu_id = $1 AND actif ORDER BY lower(nom)", [lieuId]);
  const { rows: ingredients } = await c.query<{ id: string; nom: string; unite: UniteIngredient; prix: number; suivi: boolean }>(
    "SELECT id, nom, unite, prix_centimes AS prix, suivi_stock AS suivi FROM ingredient WHERE lieu_id = $1",
    [lieuId],
  );
  const consommes = await consommation(c, lieuId, e);
  const { rows: mouvements } = await c.query<Somme & { type: string }>(
    "SELECT stand_id, ingredient_id, type, sum(quantite_milli)::float8 AS q FROM ingredient_mouvement WHERE lieu_id = $1 AND evenement_id = $2 GROUP BY 1, 2, 3",
    p,
  );
  const { rows: derniersMep } = await c.query<{ stand_id: string; ingredient_id: string; par: string; le: Date }>(
    `SELECT DISTINCT ON (m.stand_id, m.ingredient_id) m.stand_id, m.ingredient_id, u.nom AS par, m.le
       FROM ingredient_mouvement m JOIN utilisateur u ON u.id = m.par
      WHERE m.lieu_id = $1 AND m.evenement_id = $2 AND m.type = 'mise_en_place'
      ORDER BY m.stand_id, m.ingredient_id, m.le DESC`,
    p,
  );
  const { rows: comptes } = await c.query<{ stand_id: string; ingredient_id: string; quantite: number; motif: string | null; par: string; le: Date }>(
    `SELECT c.stand_id, c.ingredient_id, c.quantite_milli::float8 AS quantite, c.motif, u.nom AS par, c.le
       FROM ingredient_comptage c JOIN utilisateur u ON u.id = c.par
      WHERE c.lieu_id = $1 AND c.evenement_id = $2`,
    p,
  );
  const { rows: restes } = avant.length
    ? await c.query<{ stand_id: string; ingredient_id: string; quantite: number }>(
        `SELECT DISTINCT ON (c.stand_id, c.ingredient_id) c.stand_id, c.ingredient_id, c.quantite_milli::float8 AS quantite
           FROM ingredient_comptage c JOIN evenement e ON e.lieu_id = c.lieu_id AND e.id = c.evenement_id
          WHERE c.lieu_id = $1 AND c.evenement_id = ANY($2::uuid[])
          ORDER BY c.stand_id, c.ingredient_id, coalesce(e.ouvert_le, e.debut) DESC`,
        [lieuId, avant],
      )
    : { rows: [] };
  // Consommation des matchs précédents (figée), pour la suggestion de mise en place.
  const { rows: historique } = avant.length
    ? await c.query<Somme & { evenement_id: string }>(
        "SELECT evenement_id, stand_id, ingredient_id, quantite_milli::float8 AS q FROM ingredient_consommation WHERE lieu_id = $1 AND evenement_id = ANY($2::uuid[])",
        [lieuId, avant],
      )
    : { rows: [] };
  // Ingrédients suivis qu'utilisent les produits vendus à chaque stand.
  const { rows: auStand } = await c.query<{ stand_id: string; ingredient_id: string }>(
    `SELECT DISTINCT ps.stand_id, r.ingredient_id
       FROM produit_stand ps
       JOIN produit p ON p.lieu_id = ps.lieu_id AND p.id = ps.produit_id AND p.actif
       JOIN recette_ligne r ON r.lieu_id = ps.lieu_id AND r.produit_id = ps.produit_id
       JOIN ingredient g ON g.lieu_id = r.lieu_id AND g.id = r.ingredient_id AND g.suivi_stock AND g.actif
      WHERE ps.lieu_id = $1`,
    [lieuId],
  );

  const parId = new Map(ingredients.map((x) => [x.id, x]));
  const consomme = somme(consommes);
  const mep = somme(mouvements.filter((m) => m.type === "mise_en_place"));
  const reassort = somme(mouvements.filter((m) => m.type === "reassort"));
  const reste = new Map(restes.map((x) => [cle(x.stand_id, x.ingredient_id), x.quantite]));
  const compte = new Map(comptes.map((x) => [cle(x.stand_id, x.ingredient_id), x]));
  const derniere = new Map(derniersMep.map((x) => [cle(x.stand_id, x.ingredient_id), x]));
  const matchsDuStand = new Map<string, Set<string>>();
  for (const h of historique) {
    if (!matchsDuStand.has(h.stand_id)) matchsDuStand.set(h.stand_id, new Set());
    matchsDuStand.get(h.stand_id)!.add(h.evenement_id);
  }
  const reserve = Object.fromEntries((await reserveParIngredient(c, lieuId)).map((r) => [r.ingredientId, r.solde]));

  const requis = mouvements.length > 0;
  let manquants = 0;
  const resultat = stands.map((s) => {
    const ids = new Set(auStand.filter((x) => x.stand_id === s.id).map((x) => x.ingredient_id));
    // Tout ce qui a bougé ou a été compté à ce stand reste visible ; la consommation seule ne compte que pour un ingrédient suivi.
    for (const m of [...mouvements, ...comptes, ...restes]) if (m.stand_id === s.id) ids.add(m.ingredient_id);
    for (const m of consommes) if (m.stand_id === s.id && parId.get(m.ingredient_id)?.suivi) ids.add(m.ingredient_id);
    const lignes: LigneStockIngredient[] = [...ids]
      .map((id) => parId.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
      .map((g) => {
        const k = cle(s.id, g.id);
        const r = reste.get(k) ?? 0;
        const m = mep.get(k) ?? 0;
        const ra = reassort.get(k) ?? 0;
        const v = consomme.get(k) ?? 0;
        const depart = r + m;
        const restant = depart + ra - v;
        const ct = compte.get(k);
        const ecart = ct ? ct.quantite - restant : null;
        const ventes = [...(matchsDuStand.get(s.id) ?? [])].map((ev) => historique.find((h) => h.evenement_id === ev && h.stand_id === s.id && h.ingredient_id === g.id)?.q ?? 0);
        const mdp = derniere.get(k);
        return {
          ingredientId: g.id,
          nom: g.nom,
          unite: g.unite,
          prix: g.prix,
          reste: r,
          premierMatch: !reste.has(k),
          miseEnPlace: m,
          miseEnPlaceDerniere: mdp ? { par: mdp.par, le: mdp.le.toISOString() } : null,
          reassort: ra,
          consomme: v,
          depart,
          restant,
          seuil: seuilAlerte(depart),
          alerte: alerteStock(depart, ra, restant),
          compte: ct ? ct.quantite : null,
          comptage: ct ? { par: ct.par, le: ct.le.toISOString(), motif: ct.motif } : null,
          ecart,
          ecartValeur: ecart === null ? null : valeurQuantiteStock(ecart, g.prix),
          motifRequis: ecart !== null && motifEcartStockRequis(ecart, depart),
          suggestion: suggestionMiseEnPlace(ventes, r),
        };
      });
    for (const l of lignes) if ((l.depart + l.reassort > 0 || l.consomme > 0) && l.compte === null) manquants++;
    return { standId: s.id, nom: s.nom, lignes };
  });
  if (!requis) manquants = 0;
  return { evenement: e, stands: resultat, reserve, restes: { requis, manquants } };
}

async function evenementPour(c: Client, lieuId: string, id: string): Promise<Evenement> {
  await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  const e = (await listerEvenements(c, lieuId)).find((x) => x.id === id);
  if (!e) throw introuvable("Match");
  return e;
}

async function ingredientSuivi(c: Client, lieuId: string, ingredientId: string, standId?: string): Promise<{ nom: string; unite: UniteIngredient }> {
  const { rows } = await c.query<{ nom: string; unite: UniteIngredient; suivi: boolean }>("SELECT nom, unite, suivi_stock AS suivi FROM ingredient WHERE lieu_id = $1 AND id = $2", [lieuId, ingredientId]);
  if (!rows[0]) throw introuvable("Ingrédient");
  if (!rows[0].suivi) throw new ErreurMetier(409, `« ${rows[0].nom} » n'est pas suivi en stock : coche « suivre le stock » sur l'ingrédient (Produits → Ingrédients).`);
  if (standId && !(await c.query("SELECT 1 FROM stand WHERE lieu_id = $1 AND id = $2", [lieuId, standId])).rows[0]) throw introuvable("Stand");
  return rows[0];
}

async function lireMouvements(c: Client, lieuId: string): Promise<MouvementIngredient[]> {
  const { rows } = await c.query<{
    id: string;
    type: MouvementIngredient["type"];
    ingredient: string;
    unite: UniteIngredient;
    stand: string | null;
    match: string | null;
    quantite: number;
    prix_total_centimes: number | null;
    fournisseur: string | null;
    date_livraison: string | null;
    prix_avant_centimes: number | null;
    prix_apres_centimes: number | null;
    par: string;
    le: Date;
  }>(
    `SELECT m.id, m.type, g.nom AS ingredient, g.unite, s.nom AS stand, e.libelle AS match, m.quantite_milli::float8 AS quantite, m.prix_total_centimes,
            m.fournisseur, to_char(m.date_livraison, 'YYYY-MM-DD') AS date_livraison, m.prix_avant_centimes, m.prix_apres_centimes, u.nom AS par, m.le
       FROM ingredient_mouvement m
       JOIN ingredient g ON g.lieu_id = m.lieu_id AND g.id = m.ingredient_id
       LEFT JOIN stand s ON s.lieu_id = m.lieu_id AND s.id = m.stand_id
       LEFT JOIN evenement e ON e.lieu_id = m.lieu_id AND e.id = m.evenement_id
       JOIN utilisateur u ON u.id = m.par
      WHERE m.lieu_id = $1 ORDER BY m.le DESC LIMIT 300`,
    [lieuId],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    ingredient: r.ingredient,
    unite: r.unite,
    stand: r.stand,
    match: r.match,
    quantite: r.quantite,
    prixTotal: r.prix_total_centimes,
    fournisseur: r.fournisseur,
    dateLivraison: r.date_livraison,
    prixAvant: r.prix_avant_centimes,
    prixApres: r.prix_apres_centimes,
    par: r.par,
    le: r.le.toISOString(),
  }));
}

async function etatReserve(c: Client, lieuId: string): Promise<EtatReserveIngredients> {
  const ingredients = await reserveParIngredient(c, lieuId);
  const { rows } = await c.query<{ id: string; date: string; par: string; le: Date; ingredient: string; unite: UniteIngredient; calcule: number | null; compte: number; prix: number }>(
    `SELECT i.id, to_char(i.date_inventaire, 'YYYY-MM-DD') AS date, u.nom AS par, i.le, g.nom AS ingredient, g.unite,
            l.calcule_milli::float8 AS calcule, l.compte_milli::float8 AS compte, g.prix_centimes AS prix
       FROM inventaire_reserve i JOIN utilisateur u ON u.id = i.par
       JOIN inventaire_reserve_ingredient l ON l.lieu_id = i.lieu_id AND l.inventaire_id = i.id
       JOIN ingredient g ON g.lieu_id = l.lieu_id AND g.id = l.ingredient_id
      WHERE i.lieu_id = $1 ORDER BY i.le DESC, lower(g.nom)`,
    [lieuId],
  );
  const inventaires = new Map<string, InventaireIngredients>();
  for (const r of rows) {
    if (!inventaires.has(r.id)) inventaires.set(r.id, { id: r.id, date: r.date, par: r.par, le: r.le.toISOString(), lignes: [] });
    const ecart = r.calcule === null ? null : r.compte - r.calcule;
    inventaires.get(r.id)!.lignes.push({ ingredient: r.ingredient, unite: r.unite, calcule: r.calcule, compte: r.compte, ecart, valeur: ecart === null ? null : valeurQuantiteStock(ecart, r.prix) });
  }
  return { ingredients, inventaires: [...inventaires.values()], mouvements: await lireMouvements(c, lieuId) };
}

export async function routesStockIngredients(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/stock/ingredients", async (req): Promise<StockIngredientsMatch | null> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const evts = await listerEvenements(c, auth.lieuId);
      const prochains = evts.filter((x) => x.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
      const joues = [...evts].sort((a, b) => jouerLe(b) - jouerLe(a));
      const e = evts.find((x) => x.id === evenementId) ?? evts.find((x) => x.etat === "ouvert") ?? prochains[0] ?? joues[0];
      return e ? stockIngredientsDuMatch(c, auth.lieuId, e) : null;
    });
  });

  app.put("/api/stock/ingredients/mise-en-place", async (req): Promise<StockIngredientsMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(MiseEnPlace, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "a_venir") throw new ErreurMetier(409, "La mise en place est figée à l'ouverture du match : utilise le réassort.");
      await ingredientSuivi(c, auth.lieuId, d.ingredientId, d.standId);
      await verrouiller(c, `stock-ingredient:${d.evenementId}:${d.standId}:${d.ingredientId}`);
      const { rows } = await c.query<{ q: number }>(
        "SELECT coalesce(sum(quantite_milli), 0)::float8 AS q FROM ingredient_mouvement WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND ingredient_id = $4 AND type = 'mise_en_place'",
        [auth.lieuId, d.evenementId, d.standId, d.ingredientId],
      );
      const delta = d.quantiteMilli - rows[0]!.q;
      if (delta !== 0) {
        await c.query(
          "INSERT INTO ingredient_mouvement (lieu_id, type, ingredient_id, evenement_id, stand_id, quantite_milli, par) VALUES ($1, 'mise_en_place', $2, $3, $4, $5, $6)",
          [auth.lieuId, d.ingredientId, d.evenementId, d.standId, delta, auth.utilisateurId],
        );
      }
      return stockIngredientsDuMatch(c, auth.lieuId, e);
    });
  });

  app.post("/api/stock/ingredients/mise-en-place/suggestions", async (req): Promise<StockIngredientsMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = corps(z.object({ evenementId: Uuid }), req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, evenementId);
      if (e.etat !== "a_venir") throw new ErreurMetier(409, "La mise en place est figée à l'ouverture du match.");
      const s = await stockIngredientsDuMatch(c, auth.lieuId, e);
      for (const st of s.stands) {
        for (const l of st.lignes) {
          if (l.suggestion === null || l.suggestion === l.miseEnPlace) continue;
          await c.query(
            "INSERT INTO ingredient_mouvement (lieu_id, type, ingredient_id, evenement_id, stand_id, quantite_milli, par) VALUES ($1, 'mise_en_place', $2, $3, $4, $5, $6)",
            [auth.lieuId, l.ingredientId, evenementId, st.standId, l.suggestion - l.miseEnPlace, auth.utilisateurId],
          );
        }
      }
      return stockIngredientsDuMatch(c, auth.lieuId, e);
    });
  });

  app.post("/api/stock/ingredients/reassort", async (req): Promise<StockIngredientsMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Reassort, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, "Le réassort n'existe que pendant le match.");
      const g = await ingredientSuivi(c, auth.lieuId, d.ingredientId, d.standId);
      await verrouiller(c, `stock-ingredient:${d.evenementId}:${d.standId}:${d.ingredientId}`);
      if (d.quantiteMilli < 0) {
        const { rows } = await c.query<{ q: number }>(
          "SELECT coalesce(sum(quantite_milli), 0)::float8 AS q FROM ingredient_mouvement WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND ingredient_id = $4 AND type = 'reassort'",
          [auth.lieuId, d.evenementId, d.standId, d.ingredientId],
        );
        if (rows[0]!.q + d.quantiteMilli < 0) throw new ErreurMetier(400, `Le retour dépasse le réassort de ce match (${formaterQuantiteStock(rows[0]!.q, g.unite)}).`);
      }
      await c.query(
        "INSERT INTO ingredient_mouvement (lieu_id, type, ingredient_id, evenement_id, stand_id, quantite_milli, par) VALUES ($1, 'reassort', $2, $3, $4, $5, $6)",
        [auth.lieuId, d.ingredientId, d.evenementId, d.standId, d.quantiteMilli, auth.utilisateurId],
      );
      return stockIngredientsDuMatch(c, auth.lieuId, e);
    });
  });

  app.put("/api/stock/ingredients/comptage", async (req): Promise<StockIngredientsMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Comptage, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, e.etat === "clos" ? "Ce match est clos : son comptage est figé." : "Le comptage se fait pendant le match, une fois ouvert.");
      const avant = (await stockIngredientsDuMatch(c, auth.lieuId, e)).stands.find((s) => s.standId === d.standId)?.lignes.find((l) => l.ingredientId === d.ingredientId);
      if (!avant) throw introuvable("Ingrédient de ce stand");
      const ecart = d.quantiteMilli - avant.restant;
      if (motifEcartStockRequis(ecart, avant.depart) && (d.motif ?? "").length < 5) {
        throw new ErreurMetier(400, `Écart de ${ecart > 0 ? "+" : ""}${formaterQuantiteStock(ecart, avant.unite)} sur ${avant.nom}, au-delà de 3 % du départ : un motif est obligatoire (5 caractères au moins).`);
      }
      await c.query(
        `INSERT INTO ingredient_comptage (lieu_id, evenement_id, stand_id, ingredient_id, quantite_milli, motif, par) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (evenement_id, stand_id, ingredient_id) DO UPDATE SET quantite_milli = EXCLUDED.quantite_milli, motif = EXCLUDED.motif, par = EXCLUDED.par, le = now()`,
        [auth.lieuId, d.evenementId, d.standId, d.ingredientId, d.quantiteMilli, d.motif, auth.utilisateurId],
      );
      if (avant.compte !== null && avant.compte !== d.quantiteMilli) {
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "comptage_ingredient_corrige",
          utilisateurId: auth.utilisateurId,
          standId: d.standId,
          details: { match: e.libelle, ingredient: avant.nom, avant: formaterQuantiteStock(avant.compte, avant.unite), apres: formaterQuantiteStock(d.quantiteMilli, avant.unite), motif: d.motif },
        });
      }
      return stockIngredientsDuMatch(c, auth.lieuId, e);
    });
  });

  app.get("/api/stock/ingredients/reserve", async (req): Promise<EtatReserveIngredients> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etatReserve(c, auth.lieuId));
  });

  app.post("/api/stock/ingredients/livraisons", async (req, rep): Promise<EtatReserveIngredients> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Livraison, req);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      await ingredientSuivi(c, auth.lieuId, d.ingredientId);
      await verrouiller(c, `reserve-ingredient:${d.ingredientId}`);
      const g = (await reserveParIngredient(c, auth.lieuId)).find((x) => x.ingredientId === d.ingredientId)!;
      // Le prix de l'ingrédient devient le coût moyen pondéré ; les recettes qui l'utilisent suivent.
      const nouveau = cump(g.solde, g.prix, d.quantiteMilli, prixUnitaireLivraison(d.prixTotal, d.quantiteMilli));
      await c.query(
        `INSERT INTO ingredient_mouvement (lieu_id, type, ingredient_id, quantite_milli, prix_total_centimes, fournisseur, date_livraison, prix_avant_centimes, prix_apres_centimes, par)
         VALUES ($1, 'livraison', $2, $3, $4, $5, $6, $7, $8, $9)`,
        [auth.lieuId, d.ingredientId, d.quantiteMilli, d.prixTotal, d.fournisseur, d.dateLivraison, g.prix, nouveau, auth.utilisateurId],
      );
      await c.query("UPDATE ingredient SET prix_centimes = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, d.ingredientId, nouveau]);
      const recalcules = nouveau !== g.prix ? await recalculerCoutsRecettes(c, auth.lieuId, d.ingredientId) : [];
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "ingredient_livre",
        utilisateurId: auth.utilisateurId,
        details: {
          ingredient: g.nom,
          quantite: formaterQuantiteStock(d.quantiteMilli, g.unite),
          prixTotal: formaterMontant(d.prixTotal),
          fournisseur: d.fournisseur,
          date: d.dateLivraison,
          soldeReserveAvant: formaterQuantiteStock(g.solde, g.unite),
          prixAvant: g.prix,
          prixApres: nouveau,
          produits_recalcules: recalcules,
        },
      });
      return etatReserve(c, auth.lieuId);
    });
    rep.code(201);
    return resultat;
  });

  app.post("/api/stock/ingredients/inventaires", async (req, rep): Promise<EtatReserveIngredients> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Inventaire, req);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `inventaire:${auth.lieuId}`);
      const reserve = new Map((await reserveParIngredient(c, auth.lieuId)).map((x) => [x.ingredientId, x]));
      const { rows } = await c.query<{ id: string }>("INSERT INTO inventaire_reserve (lieu_id, date_inventaire, par) VALUES ($1, $2, $3) RETURNING id", [
        auth.lieuId,
        d.dateInventaire,
        auth.utilisateurId,
      ]);
      const id = rows[0]!.id;
      const resume: Record<string, { calcule: string | null; compte: string }> = {};
      for (const l of d.lignes) {
        const r = reserve.get(l.ingredientId);
        if (!r) throw introuvable("Ingrédient suivi");
        // Premier inventaire d'un ingrédient : c'est la déclaration de départ, pas d'écart à constater.
        const calcule = r.inventaire === null && r.livreDepuis === 0 && r.sortiDepuis === 0 ? null : r.solde;
        await c.query("INSERT INTO inventaire_reserve_ingredient (lieu_id, inventaire_id, ingredient_id, calcule_milli, compte_milli) VALUES ($1, $2, $3, $4, $5)", [
          auth.lieuId,
          id,
          l.ingredientId,
          calcule,
          l.compteMilli,
        ]);
        resume[r.nom] = { calcule: calcule === null ? null : formaterQuantiteStock(calcule, r.unite), compte: formaterQuantiteStock(l.compteMilli, r.unite) };
      }
      await inscrireJet(c, { lieuId: auth.lieuId, type: "inventaire_ingredients_valide", utilisateurId: auth.utilisateurId, details: { inventaire: id, date: d.dateInventaire, lignes: resume } });
      return etatReserve(c, auth.lieuId);
    });
    rep.code(201);
    return resultat;
  });
}
