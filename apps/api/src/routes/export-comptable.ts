import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  FORMAT_COMPTE,
  FORMAT_JOURNAL,
  TAUX_TVA,
  ecrituresCsv,
  journalDuMois,
  libelleMois,
  planComplet,
  recapitulatifCsv,
  tauxDuMois,
  type ApercuExport,
  type PlanComptes,
  type ZPourExport,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { contexte, corps } from "./outils.ts";

/**
 * Export pour l'expert-comptable (dossier §15.110) : journal des ventes du mois et récapitulatif
 * par match, bâtis sur les Z de match scellés. Chaque téléchargement est inscrit au journal technique.
 */
const Mois = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mois attendu au format AAAA-MM.");
const Compte = z.string().trim().toUpperCase().regex(FORMAT_COMPTE, "Un numéro de compte a 3 à 20 chiffres ou lettres, sans espace.");
const parTaux = z.object(Object.fromEntries(TAUX_TVA.map((t) => [String(t.pb), Compte])) as Record<string, typeof Compte>);
const PlanSaisi = z.object({
  journal: z.string().trim().toUpperCase().regex(FORMAT_JOURNAL, "Le code journal a 1 à 6 chiffres ou lettres."),
  caisseEspeces: Compte,
  cartesAEncaisser: Compte,
  ventes: parTaux,
  tva: parTaux,
  ecartManquant: Compte,
  ecartExcedent: Compte,
});

interface LigneZ {
  sequence: number;
  debut: string;
  evenement_id: string;
  total_ttc_centimes: number;
  details: { libelle: string; tickets: number; annulations: number; especes: number; carte: number; ventilation: ZPourExport["ventilation"] };
  empreinte: string;
}

async function lirePlan(c: Client, lieuId: string): Promise<{ plan: PlanComptes; personnalise: boolean }> {
  const { rows } = await c.query<{ plan_comptes: Partial<PlanComptes> | null }>("SELECT plan_comptes FROM lieu WHERE id = $1", [lieuId]);
  const enregistre = rows[0]?.plan_comptes ?? null;
  return { plan: planComplet(enregistre), personnalise: enregistre !== null };
}

/** Z de match du lieu, avec les écarts constatés (dernière rectification comprise) par match. */
async function lireZ(c: Client, lieuId: string, mois?: string): Promise<ZPourExport[]> {
  const { rows } = await c.query<LigneZ>(
    `SELECT cp.sequence, to_char(cp.debut, 'YYYY-MM-DD') AS debut, cp.evenement_id, cp.total_ttc_centimes, cp.details, cp.empreinte
       FROM cloture_periode cp
      WHERE cp.lieu_id = $1 AND cp.niveau = 'match' AND ($2::text IS NULL OR to_char(cp.debut, 'YYYY-MM') = $2)
      ORDER BY cp.debut, cp.sequence`,
    [lieuId, mois ?? null],
  );
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.evenement_id);
  const ecarts = async (table: "comptage_especes" | "comptage_coffre") => {
    const { rows: e } = await c.query<{ evenement_id: string; ecart: number }>(
      `SELECT evenement_id, sum(ecart_centimes)::int AS ecart FROM (
         SELECT DISTINCT ON (coalesce(ref_comptage, id)) evenement_id, ecart_centimes
           FROM ${table} WHERE lieu_id = $1 AND evenement_id = ANY($2::uuid[])
          ORDER BY coalesce(ref_comptage, id), le DESC
       ) effectifs GROUP BY evenement_id`,
      [lieuId, ids],
    );
    return new Map(e.map((x) => [x.evenement_id, x.ecart]));
  };
  const tiroirs = await ecarts("comptage_especes");
  const coffre = await ecarts("comptage_coffre");
  return rows.map((r) => ({
    date: r.debut,
    libelle: r.details.libelle,
    sequence: r.sequence,
    tickets: r.details.tickets,
    annulations: r.details.annulations,
    totalTtc: r.total_ttc_centimes,
    especes: r.details.especes,
    carte: r.details.carte,
    ventilation: r.details.ventilation,
    ecartTiroirs: tiroirs.get(r.evenement_id) ?? 0,
    ecartCoffre: coffre.get(r.evenement_id) ?? 0,
    empreinte: r.empreinte,
  }));
}

async function moisClos(c: Client, lieuId: string, mois: string): Promise<boolean> {
  const { rows } = await c.query("SELECT 1 FROM cloture_periode WHERE lieu_id = $1 AND niveau = 'mois' AND to_char(debut, 'YYYY-MM') = $2", [lieuId, mois]);
  return rows.length > 0;
}

async function apercu(c: Client, lieuId: string, demande: string | undefined): Promise<ApercuExport> {
  const tous = await lireZ(c, lieuId);
  const { rows: closRows } = await c.query<{ cle: string }>("SELECT to_char(debut, 'YYYY-MM') AS cle FROM cloture_periode WHERE lieu_id = $1 AND niveau = 'mois'", [lieuId]);
  const clos = new Set(closRows.map((r) => r.cle));
  const parMois = new Map<string, number>();
  for (const z of tous) parMois.set(z.date.slice(0, 7), (parMois.get(z.date.slice(0, 7)) ?? 0) + 1);
  const moisDisponibles = [...parMois.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([cle, zs]) => ({ cle, libelle: libelleMois(cle), zs, clos: clos.has(cle) }));
  const cle = demande ?? moisDisponibles[0]?.cle ?? null;
  const { plan, personnalise } = await lirePlan(c, lieuId);
  if (!cle) {
    return { moisDisponibles, cle: null, libelle: "", clos: false, zs: [], horsExport: [], taux: [], journal: { lignes: 0, totalDebit: 0, totalCredit: 0, desequilibres: [] }, plan, planPersonnalise: personnalise };
  }
  const zs = tous.filter((z) => z.date.startsWith(cle));
  const { rows: hors } = await c.query<{ libelle: string; debut: Date; etat: "a_venir" | "ouvert" }>(
    `SELECT libelle, debut, etat FROM evenement
      WHERE lieu_id = $1 AND etat <> 'clos' AND to_char(debut AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $2 ORDER BY debut`,
    [lieuId, cle],
  );
  const j = journalDuMois(zs, plan);
  return {
    moisDisponibles,
    cle,
    libelle: libelleMois(cle),
    clos: clos.has(cle),
    zs,
    horsExport: hors.map((h) => ({ libelle: h.libelle, debut: h.debut.toISOString(), etat: h.etat })),
    taux: tauxDuMois(zs),
    journal: { lignes: j.ecritures.length, totalDebit: j.totalDebit, totalCredit: j.totalCredit, desequilibres: j.desequilibres },
    plan,
    planPersonnalise: personnalise,
  };
}

export async function routesExportComptable(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/export-comptable", async (req): Promise<ApercuExport> => {
    const auth = await exigerDirecteur(req, base);
    const { mois } = z.object({ mois: Mois.optional() }).parse(req.query);
    return base.transaction(contexte(auth), (c) => apercu(c, auth.lieuId, mois));
  });

  app.post("/api/export-comptable/fichier", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { mois, fichier } = corps(z.object({ mois: Mois, fichier: z.enum(["ecritures", "recapitulatif"]) }), req);
    const { contenu, nom } = await base.transaction(contexte(auth), async (c) => {
      // Mode formation (§15.109) : la mention FACTICE figure dans le fichier lui-même, pas seulement dans son nom.
      const zs = (await lireZ(c, auth.lieuId, mois)).map((z) => (auth.formation ? { ...z, libelle: `FACTICE — ${z.libelle}` } : z));
      if (zs.length === 0) throw new ErreurMetier(409, `Aucun match clos en ${libelleMois(mois)} : rien à exporter.`);
      const { plan } = await lirePlan(c, auth.lieuId);
      const journal = journalDuMois(zs, plan);
      if (journal.desequilibres.length) {
        throw new ErreurMetier(409, `Écritures déséquilibrées (${journal.desequilibres.join(", ")}) : export bloqué, signale-le à Break Eat.`);
      }
      const definitif = await moisClos(c, auth.lieuId, mois);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "export_comptable",
        utilisateurId: auth.utilisateurId,
        details: { mois, fichier, definitif, zs: zs.length, total_ttc: zs.reduce((s, x) => s + x.totalTtc, 0) },
      });
      return {
        contenu: fichier === "ecritures" ? ecrituresCsv(journal) : recapitulatifCsv(zs),
        nom: `flaix-${fichier === "ecritures" ? "ecritures-ventes" : "recapitulatif-ventes"}-${mois}${definitif ? "" : "-provisoire"}${auth.formation ? "-FACTICE" : ""}.csv`,
      };
    });
    return rep.header("content-type", "text/csv; charset=utf-8").header("content-disposition", `attachment; filename="${nom}"`).send(contenu);
  });

  app.get("/api/lieu/plan-comptes", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lirePlan(c, auth.lieuId));
  });

  app.put("/api/lieu/plan-comptes", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const saisi = corps(z.object({ plan: PlanSaisi.nullable() }), req).plan;
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lirePlan(c, auth.lieuId);
      const plan = saisi as PlanComptes | null;
      await c.query("UPDATE lieu SET plan_comptes = $2 WHERE id = $1", [auth.lieuId, plan]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "plan_comptes_modifie",
        utilisateurId: auth.utilisateurId,
        details: { avant: avant.personnalise ? avant.plan : "par défaut", apres: plan ?? "par défaut" },
      });
      return lirePlan(c, auth.lieuId);
    });
  });
}
