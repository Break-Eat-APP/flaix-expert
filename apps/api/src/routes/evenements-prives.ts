import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  bilanPrive,
  construireFacture,
  empreinteFacture,
  estTauxTva,
  formaterMontant,
  formaterQuantiteStock,
  numeroFacture,
  type ClientPrive,
  type EvenementPrive,
  type FactureVente,
  type FraisPrive,
  type LignePrivee,
  type ModeReglementPrive,
  type ResumePrive,
  type TauxTvaPb,
  type UniteIngredient,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Événements privés (dossier §15.160) : de la gestion tenue par le directeur (fiche, consommations, frais, bilan,
 * clôture, règlement, facture). Rien ne passe par la caisse. Clôturé, tout est figé (verrou dans la base) ; la
 * facture est numérotée en série continue par lieu et par année, scellée par son empreinte, jamais modifiée.
 */

const Texte = (max: number) => z.string().trim().min(1).max(max).nullable();
/** Champs de la fiche, sans valeur par défaut : une modification ne touche que les champs envoyés. */
const CHAMPS = {
  nom: z.string().trim().min(1, "Le nom est obligatoire.").max(120),
  debut: z.string().datetime({ offset: true, message: "Date et heure invalides." }),
  salon: Texte(120),
  invites: z.number().int().min(1).max(100_000).nullable(),
  budget: z.number().int().min(0).max(100_000_000).nullable(),
  clientNom: Texte(120),
  clientContact: Texte(200),
  societe: Texte(200),
  adresse: Texte(300),
  siret: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{14}$/.test(v), "Le SIRET compte 14 chiffres.")
    .nullable(),
  tvaIntracom: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine((v) => /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(v), "N° de TVA intracommunautaire invalide (ex. FR12345678901).")
    .nullable(),
  notes: z.string().max(2000).nullable(),
};
const Fiche = z.object({
  ...CHAMPS,
  salon: CHAMPS.salon.default(null),
  invites: CHAMPS.invites.default(null),
  budget: CHAMPS.budget.default(null),
  clientNom: CHAMPS.clientNom.default(null),
  clientContact: CHAMPS.clientContact.default(null),
  societe: CHAMPS.societe.default(null),
  adresse: CHAMPS.adresse.default(null),
  siret: CHAMPS.siret.default(null),
  tvaIntracom: CHAMPS.tvaIntracom.default(null),
  notes: CHAMPS.notes.default(null),
});
const ModifFiche = z.object(CHAMPS).partial();
const NouvelleLigne = z.union([
  z.object({ produitId: Uuid, quantite: z.number().int().min(1).max(100_000).default(1) }),
  z.object({
    libelle: z.string().trim().min(1).max(120),
    quantite: z.number().int().min(1).max(100_000).default(1),
    prixTtc: z.number().int().min(0).max(10_000_000),
    tauxTva: z.number().refine(estTauxTva, "Taux de TVA inconnu."),
    coutUnitaire: z.number().int().min(0).max(10_000_000).nullable().default(null),
  }),
]);
const ModifLigne = z.object({ quantite: z.number().int().min(0).max(100_000).optional(), prixTtc: z.number().int().min(0).max(10_000_000).optional() });
const NouveauFrais = z.object({ libelle: z.string().trim().min(1).max(120), montant: z.number().int().min(0).max(100_000_000) });
const Reglement = z.object({ mode: z.enum(["virement", "carte", "especes", "cheque"]).nullable(), le: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() });
const ParLigne = z.object({ id: Uuid, ligneId: Uuid });
const ParFrais = z.object({ id: Uuid, fraisId: Uuid });

type LigneFiche = {
  id: string;
  nom: string;
  debut: Date;
  salon: string | null;
  invites: number | null;
  budget_centimes: number | null;
  client_nom: string | null;
  client_contact: string | null;
  societe: string | null;
  adresse: string | null;
  siret: string | null;
  tva_intracom: string | null;
  notes: string | null;
  etat: "prevu" | "cloture";
  cloture_le: Date | null;
  cloture_par: string | null;
  reglement: ModeReglementPrive | null;
  regle_le: string | null;
};

const SELECT_FICHE = `SELECT e.id, e.nom, e.debut, e.salon, e.invites, e.budget_centimes, e.client_nom, e.client_contact, e.societe, e.adresse, e.siret, e.tva_intracom,
                             e.notes, e.etat, e.cloture_le, u.nom AS cloture_par, e.reglement, to_char(e.regle_le, 'YYYY-MM-DD') AS regle_le
                        FROM evenement_prive e LEFT JOIN utilisateur u ON u.id = e.cloture_par`;

const clientDe = (f: LigneFiche): ClientPrive => ({ nom: f.client_nom, contact: f.client_contact, societe: f.societe, adresse: f.adresse, siret: f.siret, tvaIntracom: f.tva_intracom });

async function lignesDe(c: Client, lieuId: string, id: string, cloture: boolean): Promise<LignePrivee[]> {
  // Avant la clôture, le coût d'un produit est celui du moment (matière + conditionnement) ; après, celui figé.
  const { rows } = await c.query<{ id: string; produit_id: string | null; libelle: string; quantite: number; prix: number; taux: TauxTvaPb; fige: string | null; actuel: string | null }>(
    `SELECT l.id, l.produit_id, l.libelle, l.quantite, l.prix_ttc_centimes AS prix, l.taux_tva_pb AS taux, l.cout_unitaire AS fige,
            (p.cout_matiere_centimes + coalesce(pc.millimes, 0) / 10.0) AS actuel
       FROM evenement_prive_ligne l
       LEFT JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
       LEFT JOIN produit_conditionnement pc ON pc.lieu_id = p.lieu_id AND pc.produit_id = p.id
      WHERE l.lieu_id = $1 AND l.evenement_id = $2 ORDER BY l.cree_le, l.id`,
    [lieuId, id],
  );
  return rows.map((r) => {
    const cout = r.produit_id === null || cloture ? r.fige : r.actuel;
    return { id: r.id, produitId: r.produit_id, libelle: r.libelle, quantite: r.quantite, prixTtc: r.prix, tauxTva: r.taux, coutUnitaire: cout === null ? null : Number(cout) };
  });
}

async function fraisDe(c: Client, lieuId: string, id: string): Promise<FraisPrive[]> {
  const { rows } = await c.query<{ id: string; libelle: string; montant: number }>(
    "SELECT id, libelle, montant_centimes AS montant FROM evenement_prive_frais WHERE lieu_id = $1 AND evenement_id = $2 ORDER BY cree_le, id",
    [lieuId, id],
  );
  return rows;
}

/**
 * Clôture d'un événement privé : ses produits du catalogue sortent de la réserve centrale (§15.169). Un produit dont la
 * recette utilise un ingrédient suivi sort ses ingrédients (la pinte sort 0,5 L du fût), les autres sortent eux-mêmes ;
 * les lignes libres ne sortent rien. Renvoie le nombre de produits et d'ingrédients sortis.
 */
async function sortirDeLaReserve(c: Client, lieuId: string, id: string, par: string): Promise<{ produits: number; ingredients: number }> {
  const produits = await c.query(
    `INSERT INTO stock_mouvement (lieu_id, type, produit_id, evenement_prive_id, quantite, par)
     SELECT $1, 'evenement_prive', l.produit_id, $2, sum(l.quantite)::int, $3
       FROM evenement_prive_ligne l
      WHERE l.lieu_id = $1 AND l.evenement_id = $2 AND l.produit_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM recette_ligne r JOIN ingredient g ON g.lieu_id = r.lieu_id AND g.id = r.ingredient_id
                         WHERE r.lieu_id = $1 AND r.produit_id = l.produit_id AND g.suivi_stock)
      GROUP BY l.produit_id`,
    [lieuId, id, par],
  );
  const ingredients = await c.query(
    `INSERT INTO ingredient_mouvement (lieu_id, type, ingredient_id, evenement_prive_id, quantite_milli, par)
     SELECT $1, 'evenement_prive', r.ingredient_id, $2, sum(l.quantite::bigint * r.quantite_milli), $3
       FROM evenement_prive_ligne l
       JOIN recette_ligne r ON r.lieu_id = l.lieu_id AND r.produit_id = l.produit_id
       JOIN ingredient g ON g.lieu_id = r.lieu_id AND g.id = r.ingredient_id AND g.suivi_stock
      WHERE l.lieu_id = $1 AND l.evenement_id = $2
      GROUP BY r.ingredient_id
     HAVING sum(l.quantite::bigint * r.quantite_milli) > 0`,
    [lieuId, id, par],
  );
  return { produits: produits.rowCount ?? 0, ingredients: ingredients.rowCount ?? 0 };
}

async function sortieStockDe(c: Client, lieuId: string, id: string): Promise<EvenementPrive["sortieStock"]> {
  const { rows } = await c.query<{ nom: string; quantite: number; unite: UniteIngredient | null }>(
    `SELECT p.nom, m.quantite::float8 AS quantite, NULL AS unite
       FROM stock_mouvement m JOIN produit p ON p.lieu_id = m.lieu_id AND p.id = m.produit_id
      WHERE m.lieu_id = $1 AND m.evenement_prive_id = $2
     UNION ALL
     SELECT g.nom, m.quantite_milli::float8, g.unite
       FROM ingredient_mouvement m JOIN ingredient g ON g.lieu_id = m.lieu_id AND g.id = m.ingredient_id
      WHERE m.lieu_id = $1 AND m.evenement_prive_id = $2
     ORDER BY 1`,
    [lieuId, id],
  );
  return rows.map((r) => ({ nom: r.nom, quantite: r.unite ? formaterQuantiteStock(r.quantite, r.unite) : `${r.quantite} ×` }));
}

export async function evenementPrive(c: Client, lieuId: string, id: string): Promise<EvenementPrive> {
  const { rows } = await c.query<LigneFiche>(`${SELECT_FICHE} WHERE e.lieu_id = $1 AND e.id = $2`, [lieuId, id]);
  const f = rows[0];
  if (!f) throw introuvable("Événement privé");
  const lignes = await lignesDe(c, lieuId, id, f.etat === "cloture");
  const frais = await fraisDe(c, lieuId, id);
  const { rows: fact } = await c.query<{ id: string; numero: string; emise_le: Date }>("SELECT id, numero, emise_le FROM facture_vente WHERE lieu_id = $1 AND evenement_prive_id = $2", [lieuId, id]);
  return {
    id: f.id,
    nom: f.nom,
    debut: f.debut.toISOString(),
    salon: f.salon,
    invites: f.invites,
    budget: f.budget_centimes,
    client: clientDe(f),
    notes: f.notes,
    etat: f.etat,
    clotureLe: f.cloture_le?.toISOString() ?? null,
    cloturePar: f.cloture_par,
    reglement: f.reglement && f.regle_le ? { mode: f.reglement, le: f.regle_le } : null,
    lignes,
    frais,
    bilan: bilanPrive(lignes, frais, f.budget_centimes),
    facture: fact[0] ? { id: fact[0].id, numero: fact[0].numero, emiseLe: fact[0].emise_le.toISOString() } : null,
    sortieStock: f.etat === "cloture" ? await sortieStockDe(c, lieuId, id) : [],
  };
}

async function exigerPrevu(c: Client, lieuId: string, id: string): Promise<EvenementPrive> {
  const e = await evenementPrive(c, lieuId, id);
  if (e.etat === "cloture") throw new ErreurMetier(409, "Événement clôturé : ses consommations et sa fiche ne changent plus.");
  return e;
}

export async function routesEvenementsPrives(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/evenements-prives", async (req): Promise<ResumePrive[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>("SELECT id FROM evenement_prive WHERE lieu_id = $1 ORDER BY debut DESC", [auth.lieuId]);
      const liste: ResumePrive[] = [];
      for (const r of rows) {
        const e = await evenementPrive(c, auth.lieuId, r.id);
        liste.push({
          id: e.id,
          nom: e.nom,
          debut: e.debut,
          client: e.client.societe ?? e.client.nom,
          invites: e.invites,
          budget: e.budget,
          totalTtc: e.bilan.totalTtc,
          reste: e.bilan.reste,
          niveauBudget: e.bilan.niveauBudget,
          etat: e.etat,
          facture: e.facture?.numero ?? null,
          regle: e.reglement !== null,
        });
      }
      return liste;
    });
  });

  app.post("/api/evenements-prives", async (req, rep): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Fiche, req);
    const e = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO evenement_prive (lieu_id, nom, debut, salon, invites, budget_centimes, client_nom, client_contact, societe, adresse, siret, tva_intracom, notes, cree_par)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [auth.lieuId, d.nom, d.debut, d.salon, d.invites, d.budget, d.clientNom, d.clientContact, d.societe, d.adresse, d.siret, d.tvaIntracom, d.notes, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "evenement_prive", utilisateurId: auth.utilisateurId, details: { action: "créé", nom: d.nom, debut: d.debut, budget: d.budget === null ? "aucun" : formaterMontant(d.budget) } });
      return evenementPrive(c, auth.lieuId, rows[0]!.id);
    });
    rep.code(201);
    return e;
  });

  app.get("/api/evenements-prives/:id", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), (c) => evenementPrive(c, auth.lieuId, id));
  });

  app.patch("/api/evenements-prives/:id", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(ModifFiche, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await evenementPrive(c, auth.lieuId, id);
      // Clôturé : les chiffres sont figés ; le client et les notes se complètent encore (pour la facture).
      const CLIENT: (keyof typeof d)[] = ["clientNom", "clientContact", "societe", "adresse", "siret", "tvaIntracom", "notes"];
      if (avant.etat === "cloture" && (Object.keys(d) as (keyof typeof d)[]).some((k) => d[k] !== undefined && !CLIENT.includes(k)))
        throw new ErreurMetier(409, "Événement clôturé : seuls le client et les notes se modifient encore.");
      const colonnes: [keyof typeof d, string][] = [
        ["nom", "nom"],
        ["debut", "debut"],
        ["salon", "salon"],
        ["invites", "invites"],
        ["budget", "budget_centimes"],
        ["clientNom", "client_nom"],
        ["clientContact", "client_contact"],
        ["societe", "societe"],
        ["adresse", "adresse"],
        ["siret", "siret"],
        ["tvaIntracom", "tva_intracom"],
        ["notes", "notes"],
      ];
      const changees = colonnes.filter(([k]) => d[k] !== undefined);
      if (changees.length === 0) return avant;
      await c.query(`UPDATE evenement_prive SET ${changees.map(([, col], i) => `${col} = $${i + 3}`).join(", ")} WHERE lieu_id = $1 AND id = $2`, [auth.lieuId, id, ...changees.map(([k]) => d[k])]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "evenement_prive", utilisateurId: auth.utilisateurId, details: { action: "modifié", nom: avant.nom, champs: changees.map(([k]) => k) } });
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  // ---------- Consommations ----------
  app.post("/api/evenements-prives/:id/lignes", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(NouvelleLigne, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await exigerPrevu(c, auth.lieuId, id);
      if ("produitId" in d) {
        const { rows } = await c.query<{ nom: string; actif: boolean; prix: number | null; taux: TauxTvaPb | null }>(
          `SELECT p.nom, p.actif, t.prix_ttc_centimes AS prix, t.taux_tva_pb AS taux FROM produit p
             LEFT JOIN LATERAL (SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif WHERE lieu_id = p.lieu_id AND produit_id = p.id AND valide_du <= now() ORDER BY valide_du DESC LIMIT 1) t ON true
            WHERE p.lieu_id = $1 AND p.id = $2`,
          [auth.lieuId, d.produitId],
        );
        const p = rows[0];
        if (!p) throw introuvable("Produit");
        if (p.prix === null || p.taux === null) throw new ErreurMetier(400, `« ${p.nom} » n'a pas de prix en vigueur.`);
        // Même produit au même prix : la quantité s'ajoute à la ligne existante.
        const deja = e.lignes.find((l) => l.produitId === d.produitId && l.prixTtc === p.prix);
        if (deja) await c.query("UPDATE evenement_prive_ligne SET quantite = quantite + $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, deja.id, d.quantite]);
        else
          await c.query("INSERT INTO evenement_prive_ligne (lieu_id, evenement_id, produit_id, libelle, quantite, prix_ttc_centimes, taux_tva_pb) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
            auth.lieuId,
            id,
            d.produitId,
            p.nom,
            d.quantite,
            p.prix,
            p.taux,
          ]);
      } else {
        await c.query(
          "INSERT INTO evenement_prive_ligne (lieu_id, evenement_id, libelle, quantite, prix_ttc_centimes, taux_tva_pb, cout_unitaire) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [auth.lieuId, id, d.libelle, d.quantite, d.prixTtc, d.tauxTva, d.coutUnitaire],
        );
      }
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  app.patch("/api/evenements-prives/:id/lignes/:ligneId", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id, ligneId } = ParLigne.parse(req.params);
    const d = corps(ModifLigne, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await exigerPrevu(c, auth.lieuId, id);
      const l = e.lignes.find((x) => x.id === ligneId);
      if (!l) throw introuvable("Ligne");
      if (d.quantite === 0) await c.query("DELETE FROM evenement_prive_ligne WHERE lieu_id = $1 AND id = $2", [auth.lieuId, ligneId]);
      else
        await c.query("UPDATE evenement_prive_ligne SET quantite = $3, prix_ttc_centimes = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, ligneId, d.quantite ?? l.quantite, d.prixTtc ?? l.prixTtc]);
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  // ---------- Frais ----------
  app.post("/api/evenements-prives/:id/frais", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(NouveauFrais, req);
    return base.transaction(contexte(auth), async (c) => {
      await exigerPrevu(c, auth.lieuId, id);
      await c.query("INSERT INTO evenement_prive_frais (lieu_id, evenement_id, libelle, montant_centimes) VALUES ($1, $2, $3, $4)", [auth.lieuId, id, d.libelle, d.montant]);
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  app.delete("/api/evenements-prives/:id/frais/:fraisId", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id, fraisId } = ParFrais.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      await exigerPrevu(c, auth.lieuId, id);
      await c.query("DELETE FROM evenement_prive_frais WHERE lieu_id = $1 AND evenement_id = $2 AND id = $3", [auth.lieuId, id, fraisId]);
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  // ---------- Clôture : coûts figés, plus rien ne change sauf le règlement ----------
  app.post("/api/evenements-prives/:id/cloture", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const e = await exigerPrevu(c, auth.lieuId, id);
      if (e.lignes.length === 0) throw new ErreurMetier(400, "Aucune consommation : rien à clôturer.");
      for (const l of e.lignes.filter((x) => x.produitId !== null)) {
        await c.query("UPDATE evenement_prive_ligne SET cout_unitaire = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, l.id, l.coutUnitaire]);
      }
      await c.query("UPDATE evenement_prive SET etat = 'cloture', cloture_le = now(), cloture_par = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, auth.utilisateurId]);
      const sortie = await sortirDeLaReserve(c, auth.lieuId, id, auth.utilisateurId);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "evenement_prive",
        utilisateurId: auth.utilisateurId,
        details: { action: "clôturé", nom: e.nom, total: formaterMontant(e.bilan.totalTtc), reste: e.bilan.reste === null ? "non calculable" : formaterMontant(e.bilan.reste), sortieStock: sortie },
      });
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  app.put("/api/evenements-prives/:id/reglement", async (req): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(Reglement, req);
    if ((d.mode === null) !== (d.le === null)) throw new ErreurMetier(400, "Indique le mode et la date du règlement.");
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPrive(c, auth.lieuId, id);
      await c.query("UPDATE evenement_prive SET reglement = $3, regle_le = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, d.mode, d.le]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "evenement_prive", utilisateurId: auth.utilisateurId, details: { action: d.mode ? "réglé" : "règlement retiré", nom: e.nom, mode: d.mode, le: d.le } });
      return evenementPrive(c, auth.lieuId, id);
    });
  });

  // ---------- Facture : série continue par lieu et par année, figée et scellée ----------
  app.post("/api/evenements-prives/:id/facture", async (req, rep): Promise<EvenementPrive> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const e = await base.transaction(contexte(auth), async (c) => {
      const e = await evenementPrive(c, auth.lieuId, id);
      if (e.etat !== "cloture") throw new ErreurMetier(409, "Clôture d'abord l'événement : la facture reprend ses chiffres figés.");
      if (e.facture) throw new ErreurMetier(409, `Facture déjà émise : ${e.facture.numero}.`);
      if (!e.client.societe && !e.client.nom) throw new ErreurMetier(400, "Indique le nom du client ou de sa société sur la fiche.");
      if (e.client.societe && !e.client.adresse) throw new ErreurMetier(400, "Pour une société, l'adresse est obligatoire sur la facture.");
      const { rows: lieu } = await c.query<{ nom: string; raison_sociale: string | null; adresse: string | null; code_postal: string | null; ville: string | null; siret: string | null; tva_intracom: string | null; formation: boolean }>(
        "SELECT nom, raison_sociale, adresse, code_postal, ville, siret, tva_intracom, formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1",
        [auth.lieuId],
      );
      const l = lieu[0]!;
      if (l.formation) throw new ErreurMetier(409, "Mode formation : aucune facture n'est émise.");
      if (!l.adresse || !l.code_postal || !l.ville || !l.siret || !l.tva_intracom)
        throw new ErreurMetier(409, "Complète l'identité de l'exploitant (adresse, SIRET, n° de TVA) dans Paramètres → Le lieu : elle figure sur la facture.");
      // Numéro suivant de la série, sans trou ni doublon même si deux factures partent en même temps.
      const annee = Number(new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric" }).format(new Date()));
      await c.query("SELECT pg_advisory_xact_lock(hashtext('facture_vente:' || $1::text))", [auth.lieuId]);
      const { rows: seq } = await c.query<{ n: number }>("SELECT coalesce(max(sequence), 0)::int + 1 AS n FROM facture_vente WHERE lieu_id = $1 AND annee = $2", [auth.lieuId, annee]);
      const sequence = seq[0]!.n;
      const emiseLe = new Date().toISOString();
      const facture = construireFacture({
        numero: numeroFacture(annee, sequence),
        emiseLe,
        vendeur: { nom: l.nom, raisonSociale: l.raison_sociale, adresse: `${l.adresse}, ${l.code_postal} ${l.ville}`, siret: l.siret, tvaIntracom: l.tva_intracom },
        client: e.client,
        objet: `${e.nom} — soirée du ${new Date(e.debut).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`,
        lignes: e.lignes,
        reglement: e.reglement,
      });
      const { rows: f } = await c.query<{ id: string }>("SELECT gen_random_uuid() AS id");
      const factureId = f[0]!.id;
      await c.query(
        "INSERT INTO facture_vente (id, lieu_id, evenement_prive_id, annee, sequence, numero, contenu, empreinte, emise_le, emise_par) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [factureId, auth.lieuId, id, annee, sequence, facture.numero, JSON.stringify(facture), empreinteFacture(factureId, facture), emiseLe, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "facture_vente_emise", utilisateurId: auth.utilisateurId, details: { numero: facture.numero, evenement: e.nom, totalTtc: formaterMontant(facture.totalTtc) } });
      return evenementPrive(c, auth.lieuId, id);
    });
    rep.code(201);
    return e;
  });

  app.get("/api/factures-vente/:id", async (req): Promise<{ facture: FactureVente; evenementId: string; integre: boolean }> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ contenu: FactureVente; evenement_prive_id: string; empreinte: string }>(
        "SELECT contenu, evenement_prive_id, empreinte FROM facture_vente WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      const r = rows[0];
      if (!r) throw introuvable("Facture");
      // Contrôle à chaque lecture : le contenu relu donne-t-il toujours la même empreinte ?
      return { facture: r.contenu, evenementId: r.evenement_prive_id, integre: empreinteFacture(id, r.contenu) === r.empreinte };
    });
  });
}
