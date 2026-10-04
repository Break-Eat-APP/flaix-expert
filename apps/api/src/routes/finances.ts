import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  cascadeSoiree,
  dansPeriode,
  estJour,
  etatCibleSoiree,
  idPeriode,
  libellePeriode,
  tauxMargePb,
  type Periode,
  formaterMontant,
  formaterPourcentage,
  montantDepense,
  type Evenement,
  type FinancesSoiree,
  type LigneDepense,
  type ModeDepense,
  type PosteDepense,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { statsMatch } from "./resultats.ts";
import { ParamId, Uuid, contexte, corps, texte } from "./outils.ts";

/*
 * Gestion financière de la soirée (module 11 ; dossier §14 module 11, §15.79, §15.132) : ce qui est entré,
 * ce qui est sorti, ce qu'il reste. Les chiffres calculés (ventes, TVA, coût matière, personnel) sont lus
 * dans les modules existants et ne se saisissent pas ; seules les dépenses de la soirée se saisissent,
 * poste par poste, en euros ou en pourcentage du CA HT. Postes nommés par le lieu : un poste se
 * désactive, il ne se supprime jamais (les soirées passées gardent leurs montants). Cible de marge nette :
 * gabarit du lieu, ajustable par événement. Chaque saisie est journalisée.
 */

const Jour = z.string().refine(estJour, "Date invalide (AAAA-MM-JJ).");
const Choix = z
  .object({ evenementId: Uuid.optional(), du: Jour.optional(), au: Jour.optional() })
  .refine((x) => !!x.evenementId !== !!(x.du && x.au), "Choisis un événement, ou le premier et le dernier jour d'une période.")
  .refine((x) => !x.du || !x.au || x.du <= x.au, "Le premier jour doit précéder le dernier.");
const ParPoste = z.object({ id: Uuid, posteId: Uuid });
const NouveauPoste = z.object({ nom: texte(60, "Le nom du poste") });
const ModifPoste = z.object({ nom: texte(60, "Le nom du poste").optional(), actif: z.boolean().optional() });
const Depense = z.object({
  mode: z.enum(["euros", "pourcent"]),
  /** Centimes en euros ; points de base du CA HT en pourcentage. null : retirer la dépense de la soirée. */
  valeur: z.number().int().min(0).nullable(),
});
/** Cible de marge nette en points de base du CA HT (−100 % à 100 %) ; null : l'effacer. */
const Cible = z.object({ cible: z.number().int().min(-10_000, "Cible entre −100 et 100 %.").max(10_000, "Cible entre −100 et 100 %.").nullable() });

export async function listerPostes(c: Client, lieuId: string): Promise<PosteDepense[]> {
  const { rows } = await c.query<PosteDepense>("SELECT id, nom, actif FROM poste_depense WHERE lieu_id = $1 ORDER BY actif DESC, lower(nom)", [lieuId]);
  return rows;
}

async function evenementPour(c: Client, lieuId: string, id: string): Promise<Evenement> {
  const e = (await listerEvenements(c, lieuId)).find((x) => x.id === id);
  if (!e) throw introuvable("Événement");
  return e;
}

/** Les postes actifs, plus les postes désactivés qui portent une dépense sur cet événement. */
async function depensesDe(c: Client, lieuId: string, evenementId: string, caHt: number): Promise<LigneDepense[]> {
  const { rows } = await c.query<{ id: string; nom: string; actif: boolean; mode: ModeDepense | null; valeur: number | null; saisi_par: string | null; saisi_le: Date | null }>(
    `SELECT p.id, p.nom, p.actif, d.mode, d.valeur, u.nom AS saisi_par, d.saisi_le
       FROM poste_depense p
       LEFT JOIN depense_evenement d ON d.lieu_id = p.lieu_id AND d.poste_id = p.id AND d.evenement_id = $2
       LEFT JOIN utilisateur u ON u.id = d.saisi_par
      WHERE p.lieu_id = $1 AND (p.actif OR d.poste_id IS NOT NULL)
      ORDER BY p.actif DESC, lower(p.nom)`,
    [lieuId, evenementId],
  );
  return rows.map((r) => ({
    posteId: r.id,
    nom: r.nom,
    actif: r.actif,
    mode: r.mode,
    valeur: r.valeur,
    montant: r.mode === null || r.valeur === null ? 0 : montantDepense(r.mode, r.valeur, caHt),
    saisiPar: r.saisi_par,
    saisiLe: r.saisi_le ? r.saisi_le.toISOString() : null,
  }));
}

async function ciblesDe(c: Client, lieuId: string, evenementId: string): Promise<FinancesSoiree["cible"]> {
  const { rows } = await c.query<{ lieu: number | null; evenement: number | null }>(
    `SELECT l.cible_marge_nette_pb AS lieu, ce.cible_pb AS evenement
       FROM lieu l LEFT JOIN cible_evenement ce ON ce.lieu_id = l.id AND ce.evenement_id = $2
      WHERE l.id = $1`,
    [lieuId, evenementId],
  );
  const r = rows[0]!;
  return { lieu: r.lieu, evenement: r.evenement, effective: r.evenement ?? r.lieu };
}

/** Gestion financière d'un événement : lue par Résultats → Finances et par le rapport de soirée. */
export async function financesSoiree(c: Client, lieuId: string, e: Evenement): Promise<FinancesSoiree> {
  const s = await statsMatch(c, lieuId, e);
  const depenses = await depensesDe(c, lieuId, e.id, s.caHt);
  const totalDepenses = depenses.reduce((t, d) => t + d.montant, 0);
  const cascade = cascadeSoiree({ encaisseTtc: s.caTtc, tva: s.tva, coutMatiere: s.coutMatiere, personnel: s.personnel.reel, depenses: totalDepenses });
  const cible = await ciblesDe(c, lieuId, e.id);
  return {
    evenement: { id: e.id, libelle: e.libelle, debut: e.debut, etat: e.etat, spectateurs: e.spectateurs },
    encaisseTtc: s.caTtc,
    tva: s.tva,
    caHt: cascade.caHt,
    tickets: s.tickets,
    coutMatiere: s.coutMatiere,
    produitsSansCout: s.produitsSansCout,
    personnel: s.personnel,
    depenses,
    totalDepenses,
    margeBrute: cascade.margeBrute,
    margeNette: cascade.margeNette,
    cascade: cascade.lignes,
    cible,
    etatCible: etatCibleSoiree(cascade.margeNette, cascade.caHt, cible.effective),
  };
}

/**
 * Gestion financière d'une période « du … au … » (§15.133) : la somme des soirées qui la composent.
 * La marge nette n'existe que si elle existe pour chaque soirée ; la cible en euros est la somme des
 * cibles des soirées, et n'est jugée que si chaque soirée en a une.
 */
export async function financesPeriode(c: Client, lieuId: string, p: Periode): Promise<FinancesSoiree> {
  const evs = (await listerEvenements(c, lieuId)).filter((e) => dansPeriode(e.debut, p)).sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  const soirees: FinancesSoiree[] = [];
  for (const e of evs) soirees.push(await financesSoiree(c, lieuId, e));
  const somme = (f: (s: FinancesSoiree) => number) => soirees.reduce((t, s) => t + f(s), 0);
  const tous = <T,>(f: (s: FinancesSoiree) => T | null) => (soirees.some((s) => f(s) === null) ? null : soirees.reduce((t, s) => t + (f(s) as number), 0));

  const encaisseTtc = somme((s) => s.encaisseTtc);
  const tva = somme((s) => s.tva);
  const coutMatiere = tous((s) => s.coutMatiere);
  const personnel = { reel: tous((s) => s.personnel.reel), affectations: somme((s) => s.personnel.affectations), tauxManquants: somme((s) => s.personnel.tauxManquants) };
  const parPoste = new Map<string, LigneDepense>();
  for (const d of soirees.flatMap((s) => s.depenses)) {
    const x = parPoste.get(d.posteId) ?? { ...d, mode: null, valeur: null, montant: 0, saisiPar: null, saisiLe: null };
    x.montant += d.montant;
    parPoste.set(d.posteId, x);
  }
  const depenses = [...parPoste.values()].filter((d) => d.montant > 0);
  const totalDepenses = depenses.reduce((t, d) => t + d.montant, 0);
  const cascade = cascadeSoiree({ encaisseTtc, tva, coutMatiere, personnel: personnel.reel, depenses: totalDepenses });
  const { rows } = await c.query<{ cible: number | null }>("SELECT cible_marge_nette_pb AS cible FROM lieu WHERE id = $1", [lieuId]);

  let etatCible: FinancesSoiree["etatCible"] = null;
  if (soirees.length > 0 && soirees.every((s) => s.etatCible !== null)) {
    const cible = somme((s) => s.etatCible!.cible);
    const tauxPb = tauxMargePb(cascade.margeNette, cascade.caHt);
    const ciblePb = cascade.caHt > 0 ? Math.round((cible / cascade.caHt) * 10_000) : 0;
    const ecart = cascade.margeNette === null ? null : cascade.margeNette - cible;
    etatCible = { ciblePb, cible, tauxPb, ecart, ecartPb: tauxPb === null ? null : tauxPb - ciblePb, tenue: ecart === null ? null : ecart >= 0 };
  }

  return {
    evenement: {
      id: idPeriode(p),
      libelle: libellePeriode(p),
      debut: `${p.du}T12:00:00.000Z`,
      etat: evs.some((e) => e.etat === "ouvert") ? "ouvert" : "clos",
      spectateurs: evs.length > 0 && evs.every((e) => e.spectateurs !== null) ? evs.reduce((t, e) => t + e.spectateurs!, 0) : null,
    },
    encaisseTtc,
    tva,
    caHt: cascade.caHt,
    tickets: somme((s) => s.tickets),
    coutMatiere,
    produitsSansCout: [...new Set(soirees.flatMap((s) => s.produitsSansCout))],
    personnel,
    depenses,
    totalDepenses,
    margeBrute: cascade.margeBrute,
    margeNette: cascade.margeNette,
    cascade: cascade.lignes,
    cible: { lieu: rows[0]!.cible, evenement: null, effective: null },
    etatCible,
    periode: {
      ...p,
      soirees: soirees.map((s) => ({
        id: s.evenement.id,
        libelle: s.evenement.libelle,
        debut: s.evenement.debut,
        encaisseTtc: s.encaisseTtc,
        caHt: s.caHt,
        margeBrute: s.margeBrute,
        margeNette: s.margeNette,
        etatCible: s.etatCible,
      })),
    },
  };
}

const libelleCible = (pb: number | null) => (pb === null ? "aucune" : formaterPourcentage(pb));

export async function routesFinances(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/finances", async (req): Promise<FinancesSoiree> => {
    const auth = await exigerDirecteur(req, base);
    const choix = Choix.parse(req.query);
    return base.transaction(contexte(auth), async (c) =>
      choix.evenementId ? financesSoiree(c, auth.lieuId, await evenementPour(c, auth.lieuId, choix.evenementId)) : financesPeriode(c, auth.lieuId, { du: choix.du!, au: choix.au! }),
    );
  });

  // ---------- Dépense d'un poste pour un événement ----------
  app.put("/api/finances/:id/depenses/:posteId", async (req): Promise<FinancesSoiree> => {
    const auth = await exigerDirecteur(req, base);
    const { id, posteId } = ParPoste.parse(req.params);
    const d = corps(Depense, req);
    if (d.valeur !== null && d.mode === "pourcent" && d.valeur > 10_000) throw new ErreurMetier(400, "Un pourcentage du CA HT ne dépasse pas 100 %.");
    if (d.valeur !== null && d.mode === "euros" && d.valeur > 100_000_000) throw new ErreurMetier(400, "Montant trop élevé.");
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, id);
      const { rows: postes } = await c.query<{ nom: string; actif: boolean }>("SELECT nom, actif FROM poste_depense WHERE lieu_id = $1 AND id = $2", [auth.lieuId, posteId]);
      const poste = postes[0];
      if (!poste) throw introuvable("Poste de dépense");
      const { rows: avant } = await c.query<{ mode: ModeDepense; valeur: number }>(
        "SELECT mode, valeur FROM depense_evenement WHERE lieu_id = $1 AND evenement_id = $2 AND poste_id = $3 FOR UPDATE",
        [auth.lieuId, id, posteId],
      );
      if (d.valeur === null) {
        if (!avant[0]) return financesSoiree(c, auth.lieuId, e);
        await c.query("DELETE FROM depense_evenement WHERE lieu_id = $1 AND evenement_id = $2 AND poste_id = $3", [auth.lieuId, id, posteId]);
      } else {
        if (!poste.actif && !avant[0]) throw new ErreurMetier(409, `Le poste « ${poste.nom} » est désactivé : réactive-le dans Paramètres → Cibles & dépenses.`);
        if (avant[0]?.mode === d.mode && avant[0]?.valeur === d.valeur) return financesSoiree(c, auth.lieuId, e);
        await c.query(
          `INSERT INTO depense_evenement (lieu_id, evenement_id, poste_id, mode, valeur, saisi_par, saisi_le) VALUES ($1, $2, $3, $4, $5, $6, now())
           ON CONFLICT (lieu_id, evenement_id, poste_id) DO UPDATE SET mode = EXCLUDED.mode, valeur = EXCLUDED.valeur, saisi_par = EXCLUDED.saisi_par, saisi_le = now()`,
          [auth.lieuId, id, posteId, d.mode, d.valeur, auth.utilisateurId],
        );
      }
      const texteDe = (x: { mode: ModeDepense; valeur: number } | undefined | null) => (!x ? "aucune" : x.mode === "euros" ? formaterMontant(x.valeur) : `${formaterPourcentage(x.valeur)} du CA HT`);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "depense_soiree_saisie",
        utilisateurId: auth.utilisateurId,
        details: { evenementId: id, match: e.libelle, poste: poste.nom, avant: texteDe(avant[0]), apres: texteDe(d.valeur === null ? null : (d as { mode: ModeDepense; valeur: number })) },
      });
      return financesSoiree(c, auth.lieuId, e);
    });
  });

  // ---------- Cible de marge nette : gabarit du lieu, puis cible propre à un événement ----------
  app.put("/api/finances/cible", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { cible } = corps(Cible, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ cible: number | null }>("SELECT cible_marge_nette_pb AS cible FROM lieu WHERE id = $1 FOR UPDATE", [auth.lieuId]);
      const avant = rows[0]!.cible;
      if (avant !== cible) {
        await c.query("UPDATE lieu SET cible_marge_nette_pb = $2 WHERE id = $1", [auth.lieuId, cible]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "cible_marge_modifiee",
          utilisateurId: auth.utilisateurId,
          details: { portee: "marge nette de chaque soirée (gabarit du lieu)", avant: libelleCible(avant), apres: libelleCible(cible) },
        });
      }
      return { cible };
    });
  });

  app.put("/api/finances/:id/cible", async (req): Promise<FinancesSoiree> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { cible } = corps(Cible, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await evenementPour(c, auth.lieuId, id);
      const { rows } = await c.query<{ cible: number }>("SELECT cible_pb AS cible FROM cible_evenement WHERE lieu_id = $1 AND evenement_id = $2 FOR UPDATE", [auth.lieuId, id]);
      const avant = rows[0]?.cible ?? null;
      if (avant !== cible) {
        if (cible === null) await c.query("DELETE FROM cible_evenement WHERE lieu_id = $1 AND evenement_id = $2", [auth.lieuId, id]);
        else {
          await c.query(
            `INSERT INTO cible_evenement (lieu_id, evenement_id, cible_pb, saisi_par) VALUES ($1, $2, $3, $4)
             ON CONFLICT (lieu_id, evenement_id) DO UPDATE SET cible_pb = EXCLUDED.cible_pb, saisi_par = EXCLUDED.saisi_par, saisi_le = now()`,
            [auth.lieuId, id, cible, auth.utilisateurId],
          );
        }
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "cible_marge_modifiee",
          utilisateurId: auth.utilisateurId,
          details: { portee: `marge nette de « ${e.libelle} »`, evenementId: id, avant: libelleCible(avant), apres: cible === null ? "celle du lieu" : libelleCible(cible) },
        });
      }
      return financesSoiree(c, auth.lieuId, e);
    });
  });

  // ---------- Postes de dépense du lieu ----------
  app.get("/api/postes-depense", async (req): Promise<{ postes: PosteDepense[]; cibleLieu: number | null }> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ cible: number | null }>("SELECT cible_marge_nette_pb AS cible FROM lieu WHERE id = $1", [auth.lieuId]);
      return { postes: await listerPostes(c, auth.lieuId), cibleLieu: rows[0]!.cible };
    });
  });

  app.post("/api/postes-depense", async (req, rep): Promise<PosteDepense[]> => {
    const auth = await exigerDirecteur(req, base);
    const { nom } = corps(NouveauPoste, req);
    const postes = await base.transaction(contexte(auth), async (c) => {
      const { rows: deja } = await c.query("SELECT 1 FROM poste_depense WHERE lieu_id = $1 AND lower(nom) = lower($2)", [auth.lieuId, nom]);
      if (deja[0]) throw new ErreurMetier(409, `Un poste s'appelle déjà « ${nom} ».`);
      await c.query("INSERT INTO poste_depense (lieu_id, nom, cree_par) VALUES ($1, $2, $3)", [auth.lieuId, nom, auth.utilisateurId]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "poste_depense_cree", utilisateurId: auth.utilisateurId, details: { nom } });
      return listerPostes(c, auth.lieuId);
    });
    rep.code(201);
    return postes;
  });

  app.patch("/api/postes-depense/:id", async (req): Promise<PosteDepense[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifPoste, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; actif: boolean }>("SELECT nom, actif FROM poste_depense WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [auth.lieuId, id]);
      const p = rows[0];
      if (!p) throw introuvable("Poste de dépense");
      const nom = demande.nom ?? p.nom;
      const actif = demande.actif ?? p.actif;
      if (nom === p.nom && actif === p.actif) return listerPostes(c, auth.lieuId);
      if (nom.toLowerCase() !== p.nom.toLowerCase()) {
        const { rows: deja } = await c.query("SELECT 1 FROM poste_depense WHERE lieu_id = $1 AND lower(nom) = lower($2) AND id <> $3", [auth.lieuId, nom, id]);
        if (deja[0]) throw new ErreurMetier(409, `Un poste s'appelle déjà « ${nom} ».`);
      }
      await c.query("UPDATE poste_depense SET nom = $3, actif = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, nom, actif]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "poste_depense_modifie",
        utilisateurId: auth.utilisateurId,
        details: { poste: p.nom, ...(nom !== p.nom ? { nom: { avant: p.nom, apres: nom } } : {}), ...(actif !== p.actif ? { actif: { avant: p.actif, apres: actif } } : {}) },
      });
      return listerPostes(c, auth.lieuId);
    });
  });
}
