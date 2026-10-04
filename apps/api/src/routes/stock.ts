import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  alerteStock,
  cump,
  formaterMontant,
  motifEcartStockRequis,
  seuilAlerte,
  suggestionMiseEnPlace,
  type EtatReserve,
  type Evenement,
  type InventaireReserve,
  type LigneStock,
  type MouvementStock,
  type ProduitReserve,
  type StockMatch,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { Uuid, contexte, corps } from "./outils.ts";
import { aUneRecette } from "./recettes.ts";
import { stockIngredientsDuMatch } from "./stock-ingredients.ts";

/*
 * Stock suivi à l'unité (dossier §15.105, module 4) : réserve centrale, mise en place et
 * réassort par événement et par stand, comptage de fin d'événement, livraisons (CUMP), inventaires
 * de la réserve. Chaque mouvement est inscrit, attribué et horodaté, jamais modifié.
 */

const Quantite = z.number().int().min(0, "Quantité invalide.").max(100_000, "Quantité trop élevée.");
const Ligne = z.object({ evenementId: Uuid, standId: Uuid, produitId: Uuid });
const MiseEnPlace = Ligne.extend({ quantite: Quantite });
const Reassort = Ligne.extend({ quantite: z.number().int().min(-100_000).max(100_000).refine((q) => q !== 0, "Quantité nulle.") });
const Comptage = Ligne.extend({ quantite: Quantite, motif: z.string().trim().max(300).nullish().transform((v) => (v ? v : null)) });
const Livraison = z.object({
  produitId: Uuid,
  quantite: z.number().int().min(1, "Quantité livrée invalide.").max(100_000),
  prixUnitaire: z.number().int().min(0).max(10_000_000),
  fournisseur: z.string().trim().max(120).nullish().transform((v) => (v ? v : null)),
  dateLivraison: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de livraison invalide."),
});
const Inventaire = z.object({
  dateInventaire: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date d'inventaire invalide."),
  lignes: z.array(z.object({ produitId: Uuid, compte: z.number().int().min(0).max(1_000_000) })).min(1, "Compte au moins un produit.").max(2000),
});
const ParEvenement = z.object({ evenementId: Uuid.optional() });

/** Ordre dans lequel les événements ont été joués : heure d'ouverture, sinon date prévue. */
const jouerLe = (e: Evenement) => Date.parse(e.ouvertLe ?? e.debut);

/** Solde calculé de la réserve centrale, par produit : dernier inventaire + livraisons − sorties depuis. */
async function reserveParProduit(c: Client, lieuId: string): Promise<ProduitReserve[]> {
  const { rows } = await c.query<{ id: string; nom: string; cout: number | null; compte: number | null; date_inventaire: string | null; livre: number; sorti: number }>(
    `WITH dernier AS (
       SELECT DISTINCT ON (l.produit_id) l.produit_id, l.compte, i.le, to_char(i.date_inventaire, 'YYYY-MM-DD') AS date_inventaire
         FROM inventaire_reserve_ligne l JOIN inventaire_reserve i ON i.lieu_id = l.lieu_id AND i.id = l.inventaire_id
        WHERE l.lieu_id = $1
        ORDER BY l.produit_id, i.le DESC)
     SELECT p.id, p.nom, p.cout_matiere_centimes AS cout, d.compte, d.date_inventaire,
            coalesce((SELECT sum(m.quantite) FROM stock_mouvement m WHERE m.lieu_id = $1 AND m.produit_id = p.id AND m.type = 'livraison' AND (d.le IS NULL OR m.le > d.le)), 0)::int AS livre,
            coalesce((SELECT sum(m.quantite) FROM stock_mouvement m WHERE m.lieu_id = $1 AND m.produit_id = p.id AND m.type <> 'livraison' AND (d.le IS NULL OR m.le > d.le)), 0)::int AS sorti
       FROM produit p LEFT JOIN dernier d ON d.produit_id = p.id
      WHERE p.lieu_id = $1 AND p.actif
      ORDER BY lower(p.nom)`,
    [lieuId],
  );
  return rows.map((r) => ({
    produitId: r.id,
    nom: r.nom,
    coutUnitaire: r.cout,
    inventaire: r.compte === null ? null : { date: r.date_inventaire!, compte: r.compte },
    livreDepuis: r.livre,
    sortiDepuis: r.sorti,
    solde: (r.compte ?? 0) + r.livre - r.sorti,
  }));
}

/** L'état du stock de chaque stand pour un événement. */
export async function stockDuMatch(c: Client, lieuId: string, e: Evenement): Promise<StockMatch> {
  const evenements = await listerEvenements(c, lieuId);
  const avant = evenements.filter((x) => x.id !== e.id && jouerLe(x) < jouerLe(e)).map((x) => x.id);
  const p = [lieuId, e.id];

  const { rows: stands } = await c.query<{ id: string; nom: string }>("SELECT id, nom FROM stand WHERE lieu_id = $1 AND actif ORDER BY lower(nom)", [lieuId]);
  const { rows: produits } = await c.query<{ id: string; nom: string; categorie: string | null; cout: number | null }>(
    `SELECT p.id, p.nom, cat.nom AS categorie, p.cout_matiere_centimes AS cout
       FROM produit p LEFT JOIN categorie cat ON cat.lieu_id = p.lieu_id AND cat.id = p.categorie_id WHERE p.lieu_id = $1`,
    [lieuId],
  );
  const { rows: vendus } = await c.query<{ stand_id: string; produit_id: string; q: number }>(
    `SELECT j.stand_id, l.produit_id, sum(l.quantite)::int AS q FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2 GROUP BY 1, 2`,
    p,
  );
  const { rows: mouvements } = await c.query<{ stand_id: string; produit_id: string; type: string; q: number }>(
    `SELECT stand_id, produit_id, type, sum(quantite)::int AS q FROM stock_mouvement WHERE lieu_id = $1 AND evenement_id = $2 GROUP BY 1, 2, 3`,
    p,
  );
  const { rows: derniersMep } = await c.query<{ stand_id: string; produit_id: string; par: string; le: Date }>(
    `SELECT DISTINCT ON (m.stand_id, m.produit_id) m.stand_id, m.produit_id, u.nom AS par, m.le
       FROM stock_mouvement m JOIN utilisateur u ON u.id = m.par
      WHERE m.lieu_id = $1 AND m.evenement_id = $2 AND m.type = 'mise_en_place'
      ORDER BY m.stand_id, m.produit_id, m.le DESC`,
    p,
  );
  const { rows: comptes } = await c.query<{ stand_id: string; produit_id: string; quantite: number; motif: string | null; par: string; le: Date }>(
    `SELECT c.stand_id, c.produit_id, c.quantite, c.motif, u.nom AS par, c.le FROM stock_comptage c JOIN utilisateur u ON u.id = c.par
      WHERE c.lieu_id = $1 AND c.evenement_id = $2`,
    p,
  );
  // Reste de l'événement précédent : le dernier comptage du même stand, sur un événement joué avant.
  const { rows: restes } = avant.length
    ? await c.query<{ stand_id: string; produit_id: string; quantite: number }>(
        `SELECT DISTINCT ON (c.stand_id, c.produit_id) c.stand_id, c.produit_id, c.quantite
           FROM stock_comptage c JOIN evenement e ON e.lieu_id = c.lieu_id AND e.id = c.evenement_id
          WHERE c.lieu_id = $1 AND c.evenement_id = ANY($2::uuid[])
          ORDER BY c.stand_id, c.produit_id, coalesce(e.ouvert_le, e.debut) DESC`,
        [lieuId, avant],
      )
    : { rows: [] };
  // Historique des ventes par stand, pour la suggestion de mise en place.
  const { rows: historique } = avant.length
    ? await c.query<{ evenement_id: string; stand_id: string; produit_id: string; q: number }>(
        `SELECT j.evenement_id, j.stand_id, l.produit_id, sum(l.quantite)::int AS q
           FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
          WHERE l.lieu_id = $1 AND j.evenement_id = ANY($2::uuid[]) GROUP BY 1, 2, 3`,
        [lieuId, avant],
      )
    : { rows: [] };
  const { rows: auStand } = await c.query<{ stand_id: string; produit_id: string }>(
    `SELECT ps.stand_id, ps.produit_id FROM produit_stand ps JOIN produit p ON p.lieu_id = ps.lieu_id AND p.id = ps.produit_id WHERE ps.lieu_id = $1 AND p.actif`,
    [lieuId],
  );

  const cle = (s: string, pr: string) => `${s}|${pr}`;
  const somme = (liste: { stand_id: string; produit_id: string; q: number }[]) => new Map(liste.map((x) => [cle(x.stand_id, x.produit_id), x.q]));
  const vendu = somme(vendus);
  const mep = somme(mouvements.filter((m) => m.type === "mise_en_place"));
  const reassort = somme(mouvements.filter((m) => m.type === "reassort"));
  const reste = new Map(restes.map((x) => [cle(x.stand_id, x.produit_id), x.quantite]));
  const compte = new Map(comptes.map((x) => [cle(x.stand_id, x.produit_id), x]));
  const derniere = new Map(derniersMep.map((x) => [cle(x.stand_id, x.produit_id), x]));
  const matchsAvecVentes = new Map<string, Set<string>>();
  for (const h of historique) {
    if (!matchsAvecVentes.has(h.stand_id)) matchsAvecVentes.set(h.stand_id, new Set());
    matchsAvecVentes.get(h.stand_id)!.add(h.evenement_id);
  }
  const produitParId = new Map(produits.map((x) => [x.id, x]));
  const reserve = Object.fromEntries((await reserveParProduit(c, lieuId)).map((r) => [r.produitId, r.solde]));

  const requis = mouvements.length > 0;
  let manquants = 0;
  const resultat = stands.map((s) => {
    // Produits de ce stand : ceux qui y sont vendus, plus tout ce qui y a bougé pendant cet événement.
    const ids = new Set(auStand.filter((x) => x.stand_id === s.id).map((x) => x.produit_id));
    for (const m of [...vendus, ...mouvements, ...comptes, ...restes]) if (m.stand_id === s.id) ids.add(m.produit_id);
    const lignes: LigneStock[] = [...ids]
      .map((id) => produitParId.get(id)!)
      .filter(Boolean)
      .sort((a, b) => (a.categorie ?? "~").localeCompare(b.categorie ?? "~", "fr") || a.nom.localeCompare(b.nom, "fr"))
      .map((pr) => {
        const k = cle(s.id, pr.id);
        const r = reste.get(k) ?? 0;
        const m = mep.get(k) ?? 0;
        const ra = reassort.get(k) ?? 0;
        const v = vendu.get(k) ?? 0;
        const depart = r + m;
        const restant = depart + ra - v;
        const ct = compte.get(k);
        const ecart = ct ? ct.quantite - restant : null;
        const matchs = [...(matchsAvecVentes.get(s.id) ?? [])];
        const ventes = matchs.map((ev) => historique.find((h) => h.evenement_id === ev && h.stand_id === s.id && h.produit_id === pr.id)?.q ?? 0);
        const mdp = derniere.get(k);
        return {
          produitId: pr.id,
          nom: pr.nom,
          categorie: pr.categorie,
          coutUnitaire: pr.cout,
          reste: r,
          premierMatch: !reste.has(k),
          miseEnPlace: m,
          miseEnPlaceDerniere: mdp ? { par: mdp.par, le: mdp.le.toISOString() } : null,
          reassort: ra,
          vendu: v,
          depart,
          restant,
          seuil: seuilAlerte(depart),
          alerte: alerteStock(depart, ra, restant),
          compte: ct ? ct.quantite : null,
          comptage: ct ? { par: ct.par, le: ct.le.toISOString(), motif: ct.motif } : null,
          ecart,
          ecartValeur: ecart === null || pr.cout === null ? null : ecart * pr.cout,
          motifRequis: ecart !== null && motifEcartStockRequis(ecart, depart),
          suggestion: suggestionMiseEnPlace(ventes, r),
        };
      });
    for (const l of lignes) if ((l.depart + l.reassort > 0 || l.vendu > 0) && l.compte === null) manquants++;
    return { standId: s.id, nom: s.nom, lignes };
  });
  if (!requis) manquants = 0;
  return { evenement: e, stands: resultat, reserve, restes: { requis, manquants } };
}

/** Pour Clôtures : l'étape « Restes » d'un événement (§15.105 point 6), produits et ingrédients suivis (§15.124). */
export async function restesDuMatch(c: Client, lieuId: string, e: Evenement) {
  const produits = (await stockDuMatch(c, lieuId, e)).restes;
  const ingredients = (await stockIngredientsDuMatch(c, lieuId, e)).restes;
  return { requis: produits.requis || ingredients.requis, manquants: produits.manquants + ingredients.manquants };
}

async function evenementPour(c: Client, lieuId: string, id: string): Promise<Evenement> {
  await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  const e = (await listerEvenements(c, lieuId)).find((x) => x.id === id);
  if (!e) throw introuvable("Événement");
  return e;
}

async function verifierLigne(c: Client, lieuId: string, standId: string, produitId: string) {
  const { rows } = await c.query(
    "SELECT 1 FROM stand s, produit p WHERE s.lieu_id = $1 AND s.id = $2 AND p.lieu_id = $1 AND p.id = $3",
    [lieuId, standId, produitId],
  );
  if (!rows[0]) throw introuvable("Stand ou produit");
}

async function lireMouvements(c: Client, lieuId: string): Promise<MouvementStock[]> {
  const { rows } = await c.query<{
    id: string;
    type: MouvementStock["type"];
    produit: string;
    stand: string | null;
    match: string | null;
    quantite: number;
    prix_unitaire_centimes: number | null;
    fournisseur: string | null;
    date_livraison: string | null;
    cout_avant_centimes: number | null;
    cout_apres_centimes: number | null;
    par: string;
    le: Date;
  }>(
    `SELECT m.id, m.type, p.nom AS produit, s.nom AS stand, e.libelle AS match, m.quantite, m.prix_unitaire_centimes, m.fournisseur,
            to_char(m.date_livraison, 'YYYY-MM-DD') AS date_livraison, m.cout_avant_centimes, m.cout_apres_centimes, u.nom AS par, m.le
       FROM stock_mouvement m
       JOIN produit p ON p.lieu_id = m.lieu_id AND p.id = m.produit_id
       LEFT JOIN stand s ON s.lieu_id = m.lieu_id AND s.id = m.stand_id
       LEFT JOIN evenement e ON e.lieu_id = m.lieu_id AND e.id = m.evenement_id
       JOIN utilisateur u ON u.id = m.par
      WHERE m.lieu_id = $1 ORDER BY m.le DESC LIMIT 300`,
    [lieuId],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    produit: r.produit,
    stand: r.stand,
    match: r.match,
    quantite: r.quantite,
    prixUnitaire: r.prix_unitaire_centimes,
    fournisseur: r.fournisseur,
    dateLivraison: r.date_livraison,
    coutAvant: r.cout_avant_centimes,
    coutApres: r.cout_apres_centimes,
    par: r.par,
    le: r.le.toISOString(),
  }));
}

async function etatReserve(c: Client, lieuId: string): Promise<EtatReserve> {
  const produits = await reserveParProduit(c, lieuId);
  const { rows } = await c.query<{ id: string; date: string; par: string; le: Date; produit: string; calcule: number | null; compte: number; cout: number | null }>(
    `SELECT i.id, to_char(i.date_inventaire, 'YYYY-MM-DD') AS date, u.nom AS par, i.le, p.nom AS produit, l.calcule, l.compte, p.cout_matiere_centimes AS cout
       FROM inventaire_reserve i JOIN utilisateur u ON u.id = i.par
       JOIN inventaire_reserve_ligne l ON l.lieu_id = i.lieu_id AND l.inventaire_id = i.id
       JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
      WHERE i.lieu_id = $1 ORDER BY i.le DESC, lower(p.nom)`,
    [lieuId],
  );
  const inventaires = new Map<string, InventaireReserve>();
  for (const r of rows) {
    if (!inventaires.has(r.id)) inventaires.set(r.id, { id: r.id, date: r.date, par: r.par, le: r.le.toISOString(), lignes: [] });
    const ecart = r.calcule === null ? null : r.compte - r.calcule;
    inventaires.get(r.id)!.lignes.push({ produit: r.produit, calcule: r.calcule, compte: r.compte, ecart, valeur: ecart === null || r.cout === null ? null : ecart * r.cout });
  }
  return { produits, inventaires: [...inventaires.values()], mouvements: await lireMouvements(c, lieuId) };
}

export async function routesStock(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/stock", async (req): Promise<StockMatch | null> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const evts = await listerEvenements(c, auth.lieuId);
      const prochains = evts.filter((x) => x.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
      const joues = [...evts].sort((a, b) => jouerLe(b) - jouerLe(a));
      const e = evts.find((x) => x.id === evenementId) ?? evts.find((x) => x.etat === "ouvert") ?? prochains[0] ?? joues[0];
      return e ? stockDuMatch(c, auth.lieuId, e) : null;
    });
  });

  // ---------- Mise en place : la quantité voulue ; le mouvement inscrit est la différence ----------
  app.put("/api/stock/mise-en-place", async (req): Promise<StockMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(MiseEnPlace, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "a_venir") throw new ErreurMetier(409, "La mise en place est figée à l'ouverture de l'événement : utilise le réassort.");
      await verifierLigne(c, auth.lieuId, d.standId, d.produitId);
      await verrouiller(c, `stock:${d.evenementId}:${d.standId}:${d.produitId}`);
      const { rows } = await c.query<{ q: number }>(
        "SELECT coalesce(sum(quantite), 0)::int AS q FROM stock_mouvement WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND produit_id = $4 AND type = 'mise_en_place'",
        [auth.lieuId, d.evenementId, d.standId, d.produitId],
      );
      const delta = d.quantite - rows[0]!.q;
      if (delta !== 0) {
        await c.query(
          "INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_id, stand_id, quantite, par) VALUES ($1, 'mise_en_place', $2, $3, $4, $5, $6)",
          [auth.lieuId, d.produitId, d.evenementId, d.standId, delta, auth.utilisateurId],
        );
      }
      return stockDuMatch(c, auth.lieuId, e);
    });
  });

  app.post("/api/stock/mise-en-place/suggestions", async (req): Promise<StockMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = corps(z.object({ evenementId: Uuid }), req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, evenementId);
      if (e.etat !== "a_venir") throw new ErreurMetier(409, "La mise en place est figée à l'ouverture de l'événement.");
      const s = await stockDuMatch(c, auth.lieuId, e);
      for (const st of s.stands) {
        for (const l of st.lignes) {
          if (l.suggestion === null || l.suggestion === l.miseEnPlace) continue;
          await c.query(
            "INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_id, stand_id, quantite, par) VALUES ($1, 'mise_en_place', $2, $3, $4, $5, $6)",
            [auth.lieuId, l.produitId, evenementId, st.standId, l.suggestion - l.miseEnPlace, auth.utilisateurId],
          );
        }
      }
      return stockDuMatch(c, auth.lieuId, e);
    });
  });

  // ---------- Réassort pendant l'événement (« − » = retour en réserve d'un réassort saisi par erreur) ----------
  app.post("/api/stock/reassort", async (req): Promise<StockMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Reassort, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, "Le réassort n'existe que pendant l'événement.");
      await verifierLigne(c, auth.lieuId, d.standId, d.produitId);
      await verrouiller(c, `stock:${d.evenementId}:${d.standId}:${d.produitId}`);
      if (d.quantite < 0) {
        const { rows } = await c.query<{ q: number }>(
          "SELECT coalesce(sum(quantite), 0)::int AS q FROM stock_mouvement WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND produit_id = $4 AND type = 'reassort'",
          [auth.lieuId, d.evenementId, d.standId, d.produitId],
        );
        if (rows[0]!.q + d.quantite < 0) throw new ErreurMetier(400, `Le retour dépasse le réassort de cet événement (${rows[0]!.q}).`);
      }
      await c.query(
        "INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_id, stand_id, quantite, par) VALUES ($1, 'reassort', $2, $3, $4, $5, $6)",
        [auth.lieuId, d.produitId, d.evenementId, d.standId, d.quantite, auth.utilisateurId],
      );
      return stockDuMatch(c, auth.lieuId, e);
    });
  });

  // ---------- Comptage de fin d'événement ----------
  app.put("/api/stock/comptage", async (req): Promise<StockMatch> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Comptage, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, d.evenementId);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, e.etat === "clos" ? "Cet événement est clos : son comptage est figé." : "Le comptage se fait pendant l'événement, une fois ouvert.");
      await verifierLigne(c, auth.lieuId, d.standId, d.produitId);
      const avant = (await stockDuMatch(c, auth.lieuId, e)).stands.find((s) => s.standId === d.standId)?.lignes.find((l) => l.produitId === d.produitId);
      if (!avant) throw introuvable("Produit de ce stand");
      const ecart = d.quantite - avant.restant;
      if (motifEcartStockRequis(ecart, avant.depart) && (d.motif ?? "").length < 5) {
        throw new ErreurMetier(400, `Écart de ${ecart > 0 ? "+" : ""}${ecart} sur ${avant.nom}, au-delà de 3 % du départ : un motif est obligatoire (5 caractères au moins).`);
      }
      await c.query(
        `INSERT INTO stock_comptage (lieu_id, evenement_id, stand_id, produit_id, quantite, motif, par) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (evenement_id, stand_id, produit_id) DO UPDATE SET quantite = EXCLUDED.quantite, motif = EXCLUDED.motif, par = EXCLUDED.par, le = now()`,
        [auth.lieuId, d.evenementId, d.standId, d.produitId, d.quantite, d.motif, auth.utilisateurId],
      );
      if (avant.compte !== null && avant.compte !== d.quantite) {
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "comptage_stock_corrige",
          utilisateurId: auth.utilisateurId,
          standId: d.standId,
          details: { match: e.libelle, produit: avant.nom, avant: avant.compte, apres: d.quantite, motif: d.motif },
        });
      }
      return stockDuMatch(c, auth.lieuId, e);
    });
  });

  // ---------- Réserve centrale : livraisons et inventaires ----------
  app.get("/api/stock/reserve", async (req): Promise<EtatReserve> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etatReserve(c, auth.lieuId));
  });

  app.post("/api/stock/livraisons", async (req, rep): Promise<EtatReserve> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Livraison, req);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `reserve:${d.produitId}`);
      const produit = (await reserveParProduit(c, auth.lieuId)).find((x) => x.produitId === d.produitId);
      if (!produit) throw introuvable("Produit");
      if (await aUneRecette(c, auth.lieuId, d.produitId)) {
        throw new ErreurMetier(409, "Ce produit est fabriqué (il a une recette) : son coût vient de ses ingrédients, il ne se livre pas.");
      }
      // Le coût matière devient le coût moyen pondéré : source unique des valorisations et des marges.
      const nouveau = cump(produit.solde, produit.coutUnitaire, d.quantite, d.prixUnitaire);
      await c.query(
        `INSERT INTO stock_mouvement (lieu_id, type, produit_id, quantite, prix_unitaire_centimes, fournisseur, date_livraison, cout_avant_centimes, cout_apres_centimes, par)
         VALUES ($1, 'livraison', $2, $3, $4, $5, $6, $7, $8, $9)`,
        [auth.lieuId, d.produitId, d.quantite, d.prixUnitaire, d.fournisseur, d.dateLivraison, produit.coutUnitaire, nouveau, auth.utilisateurId],
      );
      await c.query("UPDATE produit SET cout_matiere_centimes = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, d.produitId, nouveau]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "livraison_recue",
        utilisateurId: auth.utilisateurId,
        details: {
          produit: produit.nom,
          quantite: d.quantite,
          prixUnitaire: formaterMontant(d.prixUnitaire),
          fournisseur: d.fournisseur,
          date: d.dateLivraison,
          soldeReserveAvant: produit.solde,
          coutAvant: produit.coutUnitaire,
          coutApres: nouveau,
        },
      });
      return etatReserve(c, auth.lieuId);
    });
    rep.code(201);
    return resultat;
  });

  app.post("/api/stock/inventaires", async (req, rep): Promise<EtatReserve> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Inventaire, req);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `inventaire:${auth.lieuId}`);
      const reserve = new Map((await reserveParProduit(c, auth.lieuId)).map((x) => [x.produitId, x]));
      const { rows } = await c.query<{ id: string }>("INSERT INTO inventaire_reserve (lieu_id, date_inventaire, par) VALUES ($1, $2, $3) RETURNING id", [
        auth.lieuId,
        d.dateInventaire,
        auth.utilisateurId,
      ]);
      const id = rows[0]!.id;
      const resume: Record<string, { calcule: number | null; compte: number }> = {};
      for (const l of d.lignes) {
        const r = reserve.get(l.produitId);
        if (!r) throw introuvable("Produit");
        // Premier inventaire d'un produit : c'est la déclaration de départ, pas d'écart à constater.
        const calcule = r.inventaire === null && r.livreDepuis === 0 && r.sortiDepuis === 0 ? null : r.solde;
        await c.query("INSERT INTO inventaire_reserve_ligne (lieu_id, inventaire_id, produit_id, calcule, compte) VALUES ($1, $2, $3, $4, $5)", [
          auth.lieuId,
          id,
          l.produitId,
          calcule,
          l.compte,
        ]);
        resume[r.nom] = { calcule, compte: l.compte };
      }
      await inscrireJet(c, { lieuId: auth.lieuId, type: "inventaire_reserve_valide", utilisateurId: auth.utilisateurId, details: { inventaire: id, date: d.dateInventaire, lignes: resume } });
      return etatReserve(c, auth.lieuId);
    });
    rep.code(201);
    return resultat;
  });
}
