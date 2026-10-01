import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ecartLigne,
  livraisonsCandidates,
  rapprocherFacture,
  statutRapprochement,
  totalHtFacture,
  type EtatFactures,
  type FactureVue,
  type LivraisonCandidate,
  type StatutFacture,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps } from "./outils.ts";

/**
 * Factures fournisseurs (module 12b ; dossier §15.115) : saisie, pièce jointe, rapprochement avec
 * les livraisons du Stock, validation (motif si écart), paiement. Écarts signalés, jamais corrigés.
 */
const Jour = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");
const Saisie = z
  .object({
    fournisseur: z.string().trim().min(1, "Le fournisseur est obligatoire.").max(120),
    numero: z.string().trim().min(1, "Le n° de facture est obligatoire.").max(60),
    dateFacture: Jour,
    echeance: Jour.nullable(),
    lignes: z
      .array(
        z.object({
          produitId: z.string().uuid().nullable(),
          libelle: z.string().trim().min(1, "Chaque ligne a un libellé.").max(160),
          quantite: z.number().int().min(1, "Quantité invalide.").max(1_000_000),
          prixUnitaire: z.number().int().min(0).max(10_000_000),
        }),
      )
      .min(1, "Une facture a au moins une ligne.")
      .max(300),
  })
  .refine((f) => f.echeance === null || f.echeance >= f.dateFacture, "L'échéance ne peut pas précéder la date de la facture.");
const TYPES_FICHIER = ["application/pdf", "image/jpeg", "image/png"] as const;
const Fichier = z.object({ nom: z.string().trim().min(1).max(200), type: z.enum(TYPES_FICHIER), contenu: z.string().min(1).max(14_500_000) });
const ParamLigne = z.object({ id: z.string().uuid(), ligneId: z.string().uuid() });

interface LigneFacture {
  facture_id: string;
  id: string;
  ordre: number;
  produit_id: string | null;
  libelle: string;
  quantite: number;
  prix_unitaire_centimes: number;
  livraison_id: string | null;
}

async function lireLivraisons(c: Client, lieuId: string): Promise<LivraisonCandidate[]> {
  const { rows } = await c.query<{ id: string; produit_id: string; fournisseur: string | null; date: string; quantite: number; prix: number }>(
    `SELECT id, produit_id, fournisseur, to_char(date_livraison, 'YYYY-MM-DD') AS date, quantite, prix_unitaire_centimes AS prix
       FROM stock_mouvement WHERE lieu_id = $1 AND type = 'livraison' ORDER BY date_livraison, le`,
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, produitId: r.produit_id, fournisseur: r.fournisseur, date: r.date, quantite: r.quantite, prixUnitaire: r.prix }));
}

async function etat(c: Client, lieuId: string): Promise<EtatFactures> {
  const { rows: factures } = await c.query<{
    id: string;
    fournisseur: string;
    numero: string;
    date_facture: string;
    echeance: string | null;
    validee_le: Date | null;
    valideur: string | null;
    motif_validation: string | null;
    payee_le: Date | null;
    payeur: string | null;
    date_paiement: string | null;
    createur: string;
    cree_le: Date;
    fichier_nom: string | null;
    fichier_type: string | null;
    fichier_taille: number | null;
  }>(
    `SELECT f.id, f.fournisseur, f.numero, to_char(f.date_facture, 'YYYY-MM-DD') AS date_facture, to_char(f.echeance, 'YYYY-MM-DD') AS echeance,
            f.validee_le, uv.nom AS valideur, f.motif_validation, f.payee_le, up.nom AS payeur, to_char(f.date_paiement, 'YYYY-MM-DD') AS date_paiement,
            uc.nom AS createur, f.cree_le, ff.nom AS fichier_nom, ff.type AS fichier_type, ff.taille AS fichier_taille
       FROM facture_fournisseur f
       JOIN utilisateur uc ON uc.id = f.cree_par
       LEFT JOIN utilisateur uv ON uv.id = f.validee_par
       LEFT JOIN utilisateur up ON up.id = f.payee_par
       LEFT JOIN fichier_facture ff ON ff.lieu_id = f.lieu_id AND ff.facture_id = f.id
      WHERE f.lieu_id = $1 ORDER BY f.cree_le`,
    [lieuId],
  );
  const { rows: lignes } = await c.query<LigneFacture>(
    "SELECT facture_id, id, ordre, produit_id, libelle, quantite, prix_unitaire_centimes, livraison_id FROM ligne_facture_fournisseur WHERE lieu_id = $1 ORDER BY ordre",
    [lieuId],
  );
  const livraisons = await lireLivraisons(c, lieuId);
  const { rows: noms } = await c.query<{ nom: string }>(
    `SELECT DISTINCT btrim(fournisseur) AS nom FROM stock_mouvement WHERE lieu_id = $1 AND type = 'livraison' AND fournisseur IS NOT NULL
     UNION SELECT DISTINCT btrim(fournisseur) FROM facture_fournisseur WHERE lieu_id = $1 ORDER BY 1`,
    [lieuId],
  );

  // Livraisons déjà tenues par un choix enregistré (toutes factures) ; puis l'automatique dans l'ordre de saisie.
  const prises = new Set(lignes.map((l) => l.livraison_id).filter((x): x is string => !!x));
  const vues: FactureVue[] = factures.map((f) => {
    const ls = lignes.filter((l) => l.facture_id === f.id);
    const saisies = ls.map((l) => ({ produitId: l.produit_id, quantite: l.quantite, prixUnitaire: l.prix_unitaire_centimes }));
    const propres = new Set(ls.map((l) => l.livraison_id).filter((x): x is string => !!x));
    const autres = new Set([...prises].filter((x) => !propres.has(x)));
    const rapproche = f.validee_le
      ? ls.map((l) => livraisons.find((x) => x.id === l.livraison_id) ?? null)
      : rapprocherFacture(saisies, f.fournisseur, f.date_facture, livraisons, ls.map((l) => l.livraison_id), autres);
    rapproche.forEach((x) => x && prises.add(x.id));
    const vueLignes = ls.map((l, i) => {
      const livraison = rapproche[i] ?? null;
      return {
        id: l.id,
        produitId: l.produit_id,
        libelle: l.libelle,
        quantite: l.quantite,
        prixUnitaire: l.prix_unitaire_centimes,
        livraison,
        livraisonChoisie: !!l.livraison_id,
        ecart: livraison ? ecartLigne(saisies[i]!, livraison) : null,
        candidates: f.validee_le ? [] : livraisonsCandidates(saisies[i]!, f.fournisseur, f.date_facture, livraisons).filter((x) => !autres.has(x.id) || x.id === livraison?.id),
      };
    });
    const statut: StatutFacture = f.payee_le ? "payee" : f.validee_le ? "validee" : statutRapprochement(vueLignes);
    return {
      id: f.id,
      fournisseur: f.fournisseur,
      numero: f.numero,
      dateFacture: f.date_facture,
      echeance: f.echeance,
      totalHt: totalHtFacture(saisies),
      statut,
      lignes: vueLignes,
      fichier: f.fichier_nom ? { nom: f.fichier_nom, type: f.fichier_type!, taille: f.fichier_taille! } : null,
      validation: f.validee_le ? { par: f.valideur!, le: f.validee_le.toISOString(), motif: f.motif_validation } : null,
      paiement: f.payee_le ? { par: f.payeur!, le: f.payee_le.toISOString(), date: f.date_paiement! } : null,
      creePar: f.createur,
      creeLe: f.cree_le.toISOString(),
    };
  });
  return { factures: vues.reverse(), fournisseurs: noms.map((n) => n.nom) };
}

async function factureModifiable(c: Client, lieuId: string, id: string) {
  const { rows } = await c.query<{ validee_le: Date | null; fournisseur: string; numero: string }>(
    "SELECT validee_le, fournisseur, numero FROM facture_fournisseur WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
    [lieuId, id],
  );
  const f = rows[0];
  if (!f) throw introuvable("Facture");
  if (f.validee_le) throw new ErreurMetier(409, "Facture validée : elle ne se modifie plus.");
  return f;
}

async function verifierProduits(c: Client, lieuId: string, ids: (string | null)[]) {
  const voulus = [...new Set(ids.filter((x): x is string => !!x))];
  if (!voulus.length) return;
  const { rows } = await c.query("SELECT id FROM produit WHERE lieu_id = $1 AND id = ANY($2::uuid[])", [lieuId, voulus]);
  if (rows.length !== voulus.length) throw new ErreurMetier(404, "Produit introuvable.");
}

async function ecrireLignes(c: Client, lieuId: string, factureId: string, lignes: z.infer<typeof Saisie>["lignes"]) {
  for (const [i, l] of lignes.entries()) {
    await c.query(
      "INSERT INTO ligne_facture_fournisseur (lieu_id, facture_id, ordre, produit_id, libelle, quantite, prix_unitaire_centimes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [lieuId, factureId, i, l.produitId, l.libelle, l.quantite, l.prixUnitaire],
    );
  }
}

const doublon = () => new ErreurMetier(409, "Cette facture (même fournisseur, même n°) est déjà enregistrée.");

export async function routesFactures(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/factures", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etat(c, auth.lieuId));
  });

  app.post("/api/factures", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const f = corps(Saisie, req);
    return base.transaction(contexte(auth), async (c) => {
      await verifierProduits(c, auth.lieuId, f.lignes.map((l) => l.produitId));
      const { rows: existe } = await c.query("SELECT 1 FROM facture_fournisseur WHERE lieu_id = $1 AND lower(btrim(fournisseur)) = lower($2) AND btrim(numero) = $3", [
        auth.lieuId,
        f.fournisseur,
        f.numero,
      ]);
      if (existe[0]) throw doublon();
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO facture_fournisseur (lieu_id, fournisseur, numero, date_facture, echeance, cree_par) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [auth.lieuId, f.fournisseur, f.numero, f.dateFacture, f.echeance, auth.utilisateurId],
      );
      await ecrireLignes(c, auth.lieuId, rows[0]!.id, f.lignes);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "facture_saisie",
        utilisateurId: auth.utilisateurId,
        details: { facture: rows[0]!.id, fournisseur: f.fournisseur, numero: f.numero, total_ht: totalHtFacture(f.lignes) },
      });
      return etat(c, auth.lieuId);
    });
  });

  app.put("/api/factures/:id", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const f = corps(Saisie, req);
    return base.transaction(contexte(auth), async (c) => {
      await factureModifiable(c, auth.lieuId, id);
      await verifierProduits(c, auth.lieuId, f.lignes.map((l) => l.produitId));
      const { rows: existe } = await c.query(
        "SELECT 1 FROM facture_fournisseur WHERE lieu_id = $1 AND id <> $4 AND lower(btrim(fournisseur)) = lower($2) AND btrim(numero) = $3",
        [auth.lieuId, f.fournisseur, f.numero, id],
      );
      if (existe[0]) throw doublon();
      await c.query("UPDATE facture_fournisseur SET fournisseur = $3, numero = $4, date_facture = $5, echeance = $6 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        f.fournisseur,
        f.numero,
        f.dateFacture,
        f.echeance,
      ]);
      // Les lignes sont réécrites (une facture non validée n'a encore rien de figé) ; les choix de livraison repartent de zéro.
      await c.query("DELETE FROM ligne_facture_fournisseur WHERE lieu_id = $1 AND facture_id = $2", [auth.lieuId, id]);
      await ecrireLignes(c, auth.lieuId, id, f.lignes);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "facture_modifiee", utilisateurId: auth.utilisateurId, details: { facture: id, fournisseur: f.fournisseur, numero: f.numero } });
      return etat(c, auth.lieuId);
    });
  });

  // Choix d'une livraison pour une ligne (null : revenir au rapprochement automatique).
  app.put("/api/factures/:id/lignes/:ligneId/livraison", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const { id, ligneId } = ParamLigne.parse(req.params);
    const { livraisonId } = corps(z.object({ livraisonId: z.string().uuid().nullable() }), req);
    return base.transaction(contexte(auth), async (c) => {
      await factureModifiable(c, auth.lieuId, id);
      if (livraisonId) {
        const { rows } = await c.query("SELECT 1 FROM ligne_facture_fournisseur WHERE lieu_id = $1 AND livraison_id = $2 AND id <> $3", [auth.lieuId, livraisonId, ligneId]);
        if (rows[0]) throw new ErreurMetier(409, "Cette livraison est déjà rapprochée d'une autre ligne de facture.");
      }
      const r = await c.query("UPDATE ligne_facture_fournisseur SET livraison_id = $4 WHERE lieu_id = $1 AND facture_id = $2 AND id = $3", [auth.lieuId, id, ligneId, livraisonId]);
      if (!r.rowCount) throw introuvable("Ligne de facture");
      return etat(c, auth.lieuId);
    });
  });

  app.post("/api/factures/:id/fichier", { bodyLimit: 15 * 1024 * 1024 }, async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const f = corps(Fichier, req);
    const contenu = Buffer.from(f.contenu, "base64");
    if (contenu.length === 0 || contenu.length > 10 * 1024 * 1024) throw new ErreurMetier(400, "Fichier vide ou trop lourd (10 Mo au plus).");
    const signatures: Record<(typeof TYPES_FICHIER)[number], number[]> = { "application/pdf": [0x25, 0x50, 0x44, 0x46], "image/jpeg": [0xff, 0xd8, 0xff], "image/png": [0x89, 0x50, 0x4e, 0x47] };
    if (!signatures[f.type].every((o, i) => contenu[i] === o)) throw new ErreurMetier(400, "Le contenu du fichier ne correspond pas à son type (PDF, JPEG ou PNG attendu).");
    return base.transaction(contexte(auth), async (c) => {
      await factureModifiable(c, auth.lieuId, id);
      await c.query(
        `INSERT INTO fichier_facture (facture_id, lieu_id, nom, type, taille, contenu, depose_par) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (facture_id) DO UPDATE SET nom = EXCLUDED.nom, type = EXCLUDED.type, taille = EXCLUDED.taille, contenu = EXCLUDED.contenu,
                                                depose_par = EXCLUDED.depose_par, depose_le = now()`,
        [id, auth.lieuId, f.nom, f.type, contenu.length, contenu, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "facture_piece_jointe", utilisateurId: auth.utilisateurId, details: { facture: id, nom: f.nom, taille: contenu.length } });
      return etat(c, auth.lieuId);
    });
  });

  app.get("/api/factures/:id/fichier", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const f = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; type: string; contenu: Buffer }>("SELECT nom, type, contenu FROM fichier_facture WHERE lieu_id = $1 AND facture_id = $2", [
        auth.lieuId,
        id,
      ]);
      return rows[0] ?? null;
    });
    if (!f) throw introuvable("Pièce jointe");
    return rep
      .header("content-type", f.type)
      .header("content-disposition", `inline; filename="${f.nom.replace(/[^\w.\- ]/g, "_")}"`)
      .header("x-content-type-options", "nosniff")
      .send(f.contenu);
  });

  app.post("/api/factures/:id/validation", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { motif } = corps(z.object({ motif: z.string().trim().max(500).nullish().transform((v) => (v ? v : null)) }), req);
    return base.transaction(contexte(auth), async (c) => {
      await factureModifiable(c, auth.lieuId, id);
      const f = (await etat(c, auth.lieuId)).factures.find((x) => x.id === id)!;
      if (f.statut !== "rapprochee" && (!motif || motif.length < 5)) {
        throw new ErreurMetier(400, f.statut === "ecart" ? "Il reste un écart : écris pourquoi tu valides (5 caractères au moins)." : "Une ligne n'est rapprochée d'aucune livraison : écris pourquoi tu valides (5 caractères au moins).");
      }
      // Le rapprochement proposé est figé avec la validation.
      for (const l of f.lignes) {
        if (l.livraison && !l.livraisonChoisie) await c.query("UPDATE ligne_facture_fournisseur SET livraison_id = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, l.id, l.livraison.id]);
      }
      await c.query("UPDATE facture_fournisseur SET validee_par = $3, validee_le = now(), motif_validation = $4 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        auth.utilisateurId,
        motif,
      ]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "facture_validee",
        utilisateurId: auth.utilisateurId,
        details: { facture: id, fournisseur: f.fournisseur, numero: f.numero, statut_avant: f.statut, motif, total_ht: f.totalHt },
      });
      return etat(c, auth.lieuId);
    });
  });

  app.post("/api/factures/:id/paiement", async (req): Promise<EtatFactures> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { datePaiement } = corps(z.object({ datePaiement: Jour }), req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ validee_le: Date | null; payee_le: Date | null; fournisseur: string; numero: string; date_facture: string }>(
        "SELECT validee_le, payee_le, fournisseur, numero, to_char(date_facture, 'YYYY-MM-DD') AS date_facture FROM facture_fournisseur WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
        [auth.lieuId, id],
      );
      const f = rows[0];
      if (!f) throw introuvable("Facture");
      if (!f.validee_le) throw new ErreurMetier(409, "Valide d'abord la facture.");
      if (f.payee_le) throw new ErreurMetier(409, "Facture déjà marquée payée.");
      if (datePaiement < f.date_facture) throw new ErreurMetier(400, "La date de paiement ne peut pas précéder la facture.");
      await c.query("UPDATE facture_fournisseur SET payee_par = $3, payee_le = now(), date_paiement = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, auth.utilisateurId, datePaiement]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "facture_payee", utilisateurId: auth.utilisateurId, details: { facture: id, fournisseur: f.fournisseur, numero: f.numero, date: datePaiement } });
      return etat(c, auth.lieuId);
    });
  });
}
