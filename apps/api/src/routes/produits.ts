import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { estTauxTva, formaterMontant, libelleTauxTva, type Categorie, type Produit, type Tarif, type TauxTvaPb } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps, differences, texte } from "./outils.ts";
import { aUneRecette } from "./recettes.ts";

const Montant = z.number().int("Montant en centimes attendu.").min(0, "Un montant ne peut pas être négatif.").max(1_000_000);
const TauxTva = z.number().refine(estTauxTva, "Taux de TVA non reconnu.") as unknown as z.ZodType<TauxTvaPb>;

const NouvelleCategorie = z.object({ nom: texte(60, "Le nom de la catégorie") });
const ModifCategorie = z.object({ nom: texte(60, "Le nom de la catégorie").optional(), actif: z.boolean().optional() });

const NouveauProduit = z.object({
  nom: texte(80, "Le nom du produit"),
  categorieId: Uuid.nullable().default(null),
  coutMatiere: Montant.nullable().default(null),
  prixTtc: Montant,
  tauxTva: TauxTva,
  standIds: z.array(Uuid).max(200).default([]),
});
const ModifProduit = z.object({
  nom: texte(80, "Le nom du produit").optional(),
  categorieId: Uuid.nullable().optional(),
  coutMatiere: Montant.nullable().optional(),
  actif: z.boolean().optional(),
});
const StandsProduit = z.object({ standIds: z.array(Uuid).max(200) });
const NouveauTarif = z.object({
  prixTtc: Montant,
  tauxTva: TauxTva,
  /** Date d'effet ; absente = tout de suite. Jamais dans le passé : un tarif ne se pose pas rétroactivement. */
  valideDu: z.string().datetime({ offset: true }).optional(),
});

interface LigneTarif {
  id: string;
  produit_id: string;
  prix_ttc_centimes: number;
  taux_tva_pb: TauxTvaPb;
  valide_du: Date;
  saisi_le: Date;
  saisi_par_nom: string;
}

const versTarif = (t: LigneTarif): Tarif => ({
  id: t.id,
  prixTtc: t.prix_ttc_centimes,
  tauxTva: t.taux_tva_pb,
  valideDu: t.valide_du.toISOString(),
  saisiPar: t.saisi_par_nom,
  saisiLe: t.saisi_le.toISOString(),
});

const SELECT_TARIF = `SELECT t.id, t.produit_id, t.prix_ttc_centimes, t.taux_tva_pb, t.valide_du, t.saisi_le, u.nom AS saisi_par_nom
                        FROM produit_tarif t JOIN utilisateur u ON u.id = t.saisi_par`;

export async function listerProduits(c: Client, lieuId: string): Promise<Produit[]> {
  const produits = await c.query<{
    id: string;
    nom: string;
    categorie_id: string | null;
    cout_matiere_centimes: number | null;
    actif: boolean;
    stand_ids: string[];
    a_recette: boolean;
  }>(
    `SELECT p.id, p.nom, p.categorie_id, p.cout_matiere_centimes, p.actif,
            EXISTS (SELECT 1 FROM recette_ligne r WHERE r.lieu_id = p.lieu_id AND r.produit_id = p.id) AS a_recette,
            coalesce(array_agg(ps.stand_id) FILTER (WHERE ps.stand_id IS NOT NULL), '{}') AS stand_ids
       FROM produit p
       LEFT JOIN produit_stand ps ON ps.lieu_id = p.lieu_id AND ps.produit_id = p.id
      WHERE p.lieu_id = $1
      GROUP BY p.id
      ORDER BY p.actif DESC, lower(p.nom)`,
    [lieuId],
  );
  // Tarif en vigueur = date d'effet la plus récente déjà atteinte ; à venir = la plus proche pas encore atteinte.
  const enVigueur = await c.query<LigneTarif>(
    `SELECT DISTINCT ON (t.produit_id) * FROM (${SELECT_TARIF} WHERE t.lieu_id = $1 AND t.valide_du <= now()) t
      ORDER BY t.produit_id, t.valide_du DESC`,
    [lieuId],
  );
  const aVenir = await c.query<LigneTarif>(
    `SELECT DISTINCT ON (t.produit_id) * FROM (${SELECT_TARIF} WHERE t.lieu_id = $1 AND t.valide_du > now()) t
      ORDER BY t.produit_id, t.valide_du ASC`,
    [lieuId],
  );
  const parProduit = (lignes: LigneTarif[]) => new Map(lignes.map((t) => [t.produit_id, versTarif(t)]));
  const vigueur = parProduit(enVigueur.rows);
  const futur = parProduit(aVenir.rows);
  return produits.rows.map((p) => ({
    id: p.id,
    nom: p.nom,
    categorieId: p.categorie_id,
    coutMatiere: p.cout_matiere_centimes,
    aRecette: p.a_recette,
    actif: p.actif,
    standIds: p.stand_ids,
    tarifEnVigueur: vigueur.get(p.id) ?? null,
    tarifAVenir: futur.get(p.id) ?? null,
  }));
}

async function listerCategories(c: Client, lieuId: string): Promise<Categorie[]> {
  const { rows } = await c.query<Categorie>(
    "SELECT id, nom, actif FROM categorie WHERE lieu_id = $1 ORDER BY actif DESC, lower(nom)",
    [lieuId],
  );
  return rows;
}

async function lireProduit(c: Client, lieuId: string, id: string) {
  const { rows } = await c.query<{ id: string; nom: string; categorie_id: string | null; cout_matiere_centimes: number | null; actif: boolean }>(
    "SELECT id, nom, categorie_id, cout_matiere_centimes, actif FROM produit WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
    [lieuId, id],
  );
  if (!rows[0]) throw introuvable("Produit");
  return rows[0];
}

/** Les stands cochés doivent exister dans ce lieu et être actifs. Renvoie leurs noms pour le journal. */
async function controlerStands(c: Client, lieuId: string, standIds: string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(standIds)];
  if (uniques.length === 0) return new Map();
  const { rows } = await c.query<{ id: string; nom: string; actif: boolean }>(
    "SELECT id, nom, actif FROM stand WHERE lieu_id = $1 AND id = ANY($2::uuid[])",
    [lieuId, uniques],
  );
  if (rows.length !== uniques.length) throw new ErreurMetier(400, "Un des stands cochés n'existe pas dans ce lieu.");
  const inactif = rows.find((s) => !s.actif);
  if (inactif) throw new ErreurMetier(409, `Le stand « ${inactif.nom} » est désactivé.`);
  return new Map(rows.map((s) => [s.id, s.nom]));
}

async function controlerCategorie(c: Client, lieuId: string, categorieId: string | null): Promise<void> {
  if (!categorieId) return;
  const { rows } = await c.query("SELECT 1 FROM categorie WHERE lieu_id = $1 AND id = $2 AND actif", [lieuId, categorieId]);
  if (!rows[0]) throw new ErreurMetier(400, "Catégorie inconnue ou désactivée.");
}

async function ajouterTarif(
  c: Client,
  lieuId: string,
  utilisateurId: string,
  produit: { id: string; nom: string },
  prixTtc: number,
  tauxTva: TauxTvaPb,
  valideDu: Date | null,
): Promise<void> {
  const { rows } = await c.query<{ valide_du: Date }>(
    `INSERT INTO produit_tarif (lieu_id, produit_id, prix_ttc_centimes, taux_tva_pb, valide_du, saisi_par)
     VALUES ($1, $2, $3, $4, coalesce($5, now()), $6) RETURNING valide_du`,
    [lieuId, produit.id, prixTtc, tauxTva, valideDu, utilisateurId],
  );
  await inscrireJet(c, {
    lieuId,
    type: "tarif_cree",
    utilisateurId,
    details: {
      produitId: produit.id,
      produit: produit.nom,
      prixTtc,
      prix: formaterMontant(prixTtc),
      tauxTva,
      tva: libelleTauxTva(tauxTva),
      valideDu: rows[0]!.valide_du.toISOString(),
    },
  });
}

export async function routesProduits(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Catégories ----------
  app.get("/api/categories", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerCategories(c, auth.lieuId));
  });

  app.post("/api/categories", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { nom } = corps(NouvelleCategorie, req);
    const liste = await base.transaction(contexte(auth), async (c) => {
      await c.query("INSERT INTO categorie (lieu_id, nom) VALUES ($1, $2)", [auth.lieuId, nom]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "categorie_creee", utilisateurId: auth.utilisateurId, details: { nom } });
      return listerCategories(c, auth.lieuId);
    });
    rep.code(201);
    return liste;
  });

  app.patch("/api/categories/:id", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifCategorie, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; actif: boolean }>(
        "SELECT nom, actif FROM categorie WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
        [auth.lieuId, id],
      );
      const cat = rows[0];
      if (!cat) throw introuvable("Catégorie");
      const modifications = differences(cat, demande);
      if (Object.keys(modifications).length > 0) {
        await c.query("UPDATE categorie SET nom = $3, actif = $4 WHERE lieu_id = $1 AND id = $2", [
          auth.lieuId,
          id,
          demande.nom ?? cat.nom,
          demande.actif ?? cat.actif,
        ]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "categorie_modifiee",
          utilisateurId: auth.utilisateurId,
          details: { categorie: cat.nom, modifications },
        });
      }
      return listerCategories(c, auth.lieuId);
    });
  });

  // ---------- Produits ----------
  app.get("/api/produits", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerProduits(c, auth.lieuId));
  });

  app.post("/api/produits", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const p = corps(NouveauProduit, req);
    const produits = await base.transaction(contexte(auth), async (c) => {
      await controlerCategorie(c, auth.lieuId, p.categorieId);
      const stands = await controlerStands(c, auth.lieuId, p.standIds);
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO produit (lieu_id, nom, categorie_id, cout_matiere_centimes) VALUES ($1, $2, $3, $4) RETURNING id",
        [auth.lieuId, p.nom, p.categorieId, p.coutMatiere],
      );
      const id = rows[0]!.id;
      for (const standId of stands.keys()) {
        await c.query("INSERT INTO produit_stand (lieu_id, produit_id, stand_id) VALUES ($1, $2, $3)", [auth.lieuId, id, standId]);
      }
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "produit_cree",
        utilisateurId: auth.utilisateurId,
        details: { produitId: id, nom: p.nom, categorieId: p.categorieId, coutMatiere: p.coutMatiere, stands: [...stands.values()] },
      });
      await ajouterTarif(c, auth.lieuId, auth.utilisateurId, { id, nom: p.nom }, p.prixTtc, p.tauxTva, null);
      return listerProduits(c, auth.lieuId);
    });
    rep.code(201);
    return produits;
  });

  app.patch("/api/produits/:id", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifProduit, req);
    return base.transaction(contexte(auth), async (c) => {
      const p = await lireProduit(c, auth.lieuId, id);
      const avant = { nom: p.nom, categorieId: p.categorie_id, coutMatiere: p.cout_matiere_centimes, actif: p.actif };
      const modifications = differences(avant, demande);
      if (modifications.coutMatiere && (await aUneRecette(c, auth.lieuId, id))) {
        throw new ErreurMetier(409, "Ce produit a une recette : son coût matière se calcule à partir de ses ingrédients.");
      }
      if (Object.keys(modifications).length > 0) {
        if (demande.categorieId !== undefined) await controlerCategorie(c, auth.lieuId, demande.categorieId);
        const apres = { ...avant, ...Object.fromEntries(Object.entries(demande).filter(([, v]) => v !== undefined)) };
        await c.query(
          "UPDATE produit SET nom = $3, categorie_id = $4, cout_matiere_centimes = $5, actif = $6 WHERE lieu_id = $1 AND id = $2",
          [auth.lieuId, id, apres.nom, apres.categorieId, apres.coutMatiere, apres.actif],
        );
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "produit_modifie",
          utilisateurId: auth.utilisateurId,
          details: { produitId: id, produit: p.nom, modifications },
        });
      }
      return listerProduits(c, auth.lieuId);
    });
  });

  app.put("/api/produits/:id/stands", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { standIds } = corps(StandsProduit, req);
    return base.transaction(contexte(auth), async (c) => {
      const p = await lireProduit(c, auth.lieuId, id);
      const { rows } = await c.query<{ stand_id: string; nom: string }>(
        `SELECT ps.stand_id, s.nom FROM produit_stand ps JOIN stand s ON s.lieu_id = ps.lieu_id AND s.id = ps.stand_id
          WHERE ps.lieu_id = $1 AND ps.produit_id = $2`,
        [auth.lieuId, id],
      );
      const actuels = new Map(rows.map((r) => [r.stand_id, r.nom]));
      const voulus = new Set(standIds);
      const ajouts = [...voulus].filter((s) => !actuels.has(s));
      const retraits = [...actuels.keys()].filter((s) => !voulus.has(s));
      if (ajouts.length === 0 && retraits.length === 0) return listerProduits(c, auth.lieuId);
      const nomsAjouts = await controlerStands(c, auth.lieuId, ajouts);
      for (const standId of ajouts) {
        await c.query("INSERT INTO produit_stand (lieu_id, produit_id, stand_id) VALUES ($1, $2, $3)", [auth.lieuId, id, standId]);
      }
      if (retraits.length > 0) {
        await c.query("DELETE FROM produit_stand WHERE lieu_id = $1 AND produit_id = $2 AND stand_id = ANY($3::uuid[])", [
          auth.lieuId,
          id,
          retraits,
        ]);
      }
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "produit_stands_modifies",
        utilisateurId: auth.utilisateurId,
        details: {
          produitId: id,
          produit: p.nom,
          ajoutes: [...nomsAjouts.values()],
          retires: retraits.map((s) => actuels.get(s)),
        },
      });
      return listerProduits(c, auth.lieuId);
    });
  });

  app.get("/api/produits/:id/tarifs", async (req): Promise<Tarif[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<LigneTarif>(`${SELECT_TARIF} WHERE t.lieu_id = $1 AND t.produit_id = $2 ORDER BY t.valide_du DESC`, [
        auth.lieuId,
        id,
      ]);
      return rows.map(versTarif);
    });
  });

  app.post("/api/produits/:id/tarifs", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const t = corps(NouveauTarif, req);
    const valideDu = t.valideDu ? new Date(t.valideDu) : null;
    // Une minute de tolérance pour l'écart d'horloge entre le poste et le serveur.
    if (valideDu && valideDu.getTime() < Date.now() - 60_000) {
      throw new ErreurMetier(400, "Un tarif ne peut pas prendre effet dans le passé : les ventes déjà faites gardent leur prix.");
    }
    const produits = await base.transaction(contexte(auth), async (c) => {
      const p = await lireProduit(c, auth.lieuId, id);
      if (!valideDu) {
        const { rows } = await c.query<{ prix_ttc_centimes: number; taux_tva_pb: number }>(
          `SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif
            WHERE lieu_id = $1 AND produit_id = $2 AND valide_du <= now() ORDER BY valide_du DESC LIMIT 1`,
          [auth.lieuId, id],
        );
        const actuel = rows[0];
        if (actuel && actuel.prix_ttc_centimes === t.prixTtc && actuel.taux_tva_pb === t.tauxTva) {
          throw new ErreurMetier(409, "C'est déjà le tarif en vigueur pour ce produit.");
        }
      }
      await ajouterTarif(c, auth.lieuId, auth.utilisateurId, p, t.prixTtc, t.tauxTva, valideDu);
      return listerProduits(c, auth.lieuId);
    });
    rep.code(201);
    return produits;
  });
}
