import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  FRAIS_SUGGERES,
  formaterMontant,
  formaterPourcentage,
  fraisDuMois,
  fraisSuggere,
  montantDuMois,
  totalFrais,
  type FraisDate,
  type FraisMensuel,
  type LigneMesFrais,
  type MesFrais,
  type ModeDepense,
  type PosteStructure,
} from "@flaix/domain";
import type { Client, Base } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps, texte } from "./outils.ts";

/*
 * « Mes frais » (dossier §15.154) : tous les frais d'une buvette, pour savoir ce qu'il reste une fois tout déduit.
 * Frais de soirée = postes de dépense (montant habituel facultatif, appliqué à chaque soirée sans saisie propre) ;
 * frais du mois = frais mensuels du lieu, datés, et frais des stands (Coûts par buvette). Une liste de frais courants
 * est proposée : chacun est renseigné, déclaré « pas concerné », ou reste à vérifier. Tout est journalisé.
 */

const Mois = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mois attendu au format AAAA-MM.");
const Cle = z.string().min(1).max(40);
const Mode = z.enum(["euros", "pourcent", "pourcent_carte"]);
const Habituel = z
  .object({ modeHabituel: Mode.nullable(), valeurHabituelle: z.number().int().min(0).nullable() })
  .refine((h) => (h.modeHabituel === null) === (h.valeurHabituelle === null), "Montant habituel incomplet.")
  .refine((h) => h.valeurHabituelle === null || (h.modeHabituel === "euros" ? h.valeurHabituelle <= 100_000_000 : h.valeurHabituelle <= 10_000), "Montant habituel trop élevé (100 % au plus).");
const NouveauSoiree = z.object({ cle: Cle.optional(), nom: texte(60, "Le nom du frais").optional(), modeHabituel: Mode.nullable().default(null), valeurHabituelle: z.number().int().min(0).nullable().default(null) });
const NouveauMois = z.object({ cle: Cle.optional(), nom: texte(80, "Le nom du frais").optional(), montant: z.number().int().min(0).max(100_000_000), aPartirDe: Mois });
const MontantMois = z.object({ montant: z.number().int().min(0).max(100_000_000), aPartirDe: Mois });

const moisDeParis = (d: Date) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(d);
export const moisCourant = () => moisDeParis(new Date());
export const moisDe = (iso: string) => moisDeParis(new Date(iso));

const texteHabituel = (mode: ModeDepense | null, valeur: number | null) =>
  mode === null || valeur === null ? "saisi soirée par soirée" : mode === "euros" ? formaterMontant(valeur) : `${formaterPourcentage(valeur)} ${mode === "pourcent" ? "du CA HT" : "des paiements par carte"}`;

async function fraisDesStands(c: Client, lieuId: string): Promise<FraisDate[]> {
  const { rows } = await c.query<{ stand_id: string; poste: PosteStructure; mois: string; montant_centimes: number }>(
    "SELECT stand_id, poste, to_char(a_partir_de, 'YYYY-MM') AS mois, montant_centimes FROM frais_stand WHERE lieu_id = $1",
    [lieuId],
  );
  return rows.map((r) => ({ standId: r.stand_id, poste: r.poste, aPartirDe: r.mois, montant: r.montant_centimes }));
}

async function fraisMensuels(c: Client, lieuId: string, mois: string): Promise<FraisMensuel[]> {
  const { rows } = await c.query<{ id: string; nom: string; cle: string | null; montants: { aPartirDe: string; montant: number }[] | null }>(
    `SELECT f.id, f.nom, f.cle,
            (SELECT json_agg(json_build_object('aPartirDe', to_char(m.a_partir_de, 'YYYY-MM'), 'montant', m.montant_centimes) ORDER BY m.a_partir_de DESC)
               FROM frais_mensuel_montant m WHERE m.lieu_id = f.lieu_id AND m.frais_id = f.id) AS montants
       FROM frais_mensuel f WHERE f.lieu_id = $1 ORDER BY lower(f.nom)`,
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, nom: r.nom, cle: r.cle, montants: r.montants ?? [], montant: montantDuMois(r.montants ?? [], mois) }));
}

/** Frais du mois du lieu : frais de chaque stand en vigueur ce mois-là + frais mensuels du lieu. */
export async function totalFraisDuMois(c: Client, lieuId: string, mois: string): Promise<number> {
  const stands = await fraisDesStands(c, lieuId);
  const parStand = [...new Set(stands.map((f) => f.standId))].reduce((t, s) => t + totalFrais(fraisDuMois(stands, s, mois)), 0);
  const lieu = (await fraisMensuels(c, lieuId, mois)).reduce((t, f) => t + f.montant, 0);
  return parStand + lieu;
}

/** CA HT de chaque événement du mois (heure de Paris), lu dans les ventes de gestion comme Coûts par buvette. */
export async function caHtDesSoireesDuMois(c: Client, lieuId: string, mois: string): Promise<Map<string, number>> {
  const { rows } = await c.query<{ id: string; ht: number }>(
    `SELECT e.id, coalesce(sum(l.ht_centimes), 0)::int AS ht
       FROM evenement e
       LEFT JOIN vente_gestion j ON j.lieu_id = e.lieu_id AND j.evenement_id = e.id
       LEFT JOIN ligne_gestion l ON l.lieu_id = j.lieu_id AND l.journal_id = j.id
      WHERE e.lieu_id = $1 AND to_char(e.debut AT TIME ZONE 'Europe/Paris', 'YYYY-MM') = $2
      GROUP BY e.id`,
    [lieuId, mois],
  );
  return new Map(rows.map((r) => [r.id, r.ht]));
}

/** L'écran « Mes frais » : frais proposés (avec leur état) puis frais ajoutés par le lieu. */
export async function mesFrais(c: Client, lieuId: string, mois = moisCourant()): Promise<MesFrais> {
  const { rows: postes } = await c.query<{ id: string; nom: string; actif: boolean; cle: string | null; mode_habituel: ModeDepense | null; valeur_habituelle: number | null }>(
    "SELECT id, nom, actif, cle, mode_habituel, valeur_habituelle FROM poste_depense WHERE lieu_id = $1 ORDER BY lower(nom)",
    [lieuId],
  );
  const mensuels = await fraisMensuels(c, lieuId, mois);
  const stands = await fraisDesStands(c, lieuId);
  const standIds = [...new Set(stands.map((f) => f.standId))];
  const parPoste = (p: PosteStructure) => standIds.reduce((t, s) => t + fraisDuMois(stands, s, mois)[p], 0);
  const { rows: pasConcernes } = await c.query<{ cle: string }>("SELECT cle FROM frais_pas_concerne WHERE lieu_id = $1", [lieuId]);
  const pas = new Set(pasConcernes.map((r) => r.cle));

  const vide = { posteId: null, fraisId: null, modeHabituel: null, valeurHabituelle: null, montantMois: null, parStand: null, modeSuggere: null };
  const lignes: LigneMesFrais[] = FRAIS_SUGGERES.map((s) => {
    const base = { ...vide, cle: s.cle, libelle: s.libelle, frequence: s.frequence, aide: s.aide, parStand: s.parStand ?? null, modeSuggere: s.mode ?? null };
    if (s.parStand) {
      // Saisi stand par stand (Coûts par buvette), ou pour tout le lieu quand ce module n'est pas activé.
      const f = mensuels.find((x) => x.cle === s.cle);
      const montant = parPoste(s.parStand) + (f?.montant ?? 0);
      return { ...base, fraisId: f?.id ?? null, montantMois: montant, statut: montant > 0 || f ? "renseigne" : pas.has(s.cle) ? "pas_concerne" : "a_verifier" };
    }
    if (s.frequence === "soiree") {
      const p = postes.find((x) => x.cle === s.cle && x.actif);
      return p
        ? { ...base, libelle: p.nom, posteId: p.id, modeHabituel: p.mode_habituel, valeurHabituelle: p.valeur_habituelle, statut: "renseigne" }
        : { ...base, statut: pas.has(s.cle) ? "pas_concerne" : "a_verifier" };
    }
    const f = mensuels.find((x) => x.cle === s.cle);
    return f ? { ...base, libelle: f.nom, fraisId: f.id, montantMois: f.montant, statut: "renseigne" } : { ...base, statut: pas.has(s.cle) ? "pas_concerne" : "a_verifier" };
  });
  for (const p of postes.filter((x) => x.actif && (!x.cle || !fraisSuggere(x.cle)))) {
    lignes.push({ ...vide, cle: null, libelle: p.nom, frequence: "soiree", aide: null, statut: "renseigne", posteId: p.id, modeHabituel: p.mode_habituel, valeurHabituelle: p.valeur_habituelle });
  }
  for (const f of mensuels.filter((x) => !x.cle || !fraisSuggere(x.cle))) {
    lignes.push({ ...vide, cle: null, libelle: f.nom, frequence: "mois", aide: null, statut: "renseigne", fraisId: f.id, montantMois: f.montant });
  }
  const proposes = lignes.filter((l) => l.cle !== null);
  return {
    mois,
    lignes,
    verifies: proposes.filter((l) => l.statut !== "a_verifier").length,
    proposes: proposes.length,
    totalMois: standIds.reduce((t, s) => t + totalFrais(fraisDuMois(stands, s, mois)), 0) + mensuels.reduce((t, f) => t + f.montant, 0),
  };
}

/** Frais proposés encore à vérifier (rappel du centre d'alertes, avertissement de Finances). */
export async function fraisAVerifier(c: Client, lieuId: string): Promise<number> {
  const m = await mesFrais(c, lieuId);
  return m.proposes - m.verifies;
}

async function exigerFraisMensuel(c: Client, lieuId: string, id: string): Promise<{ nom: string }> {
  const { rows } = await c.query<{ nom: string }>("SELECT nom FROM frais_mensuel WHERE lieu_id = $1 AND id = $2", [lieuId, id]);
  if (!rows[0]) throw introuvable("Frais");
  return rows[0];
}

async function enregistrerMontant(c: Client, lieuId: string, fraisId: string, aPartirDe: string, montant: number, par: string): Promise<number | null> {
  const { rows } = await c.query<{ montant: number }>(
    "SELECT montant_centimes AS montant FROM frais_mensuel_montant WHERE lieu_id = $1 AND frais_id = $2 AND a_partir_de = $3::date FOR UPDATE",
    [lieuId, fraisId, `${aPartirDe}-01`],
  );
  await c.query(
    `INSERT INTO frais_mensuel_montant (lieu_id, frais_id, a_partir_de, montant_centimes, saisi_par) VALUES ($1, $2, $3::date, $4, $5)
     ON CONFLICT (lieu_id, frais_id, a_partir_de) DO UPDATE SET montant_centimes = EXCLUDED.montant_centimes, saisi_par = EXCLUDED.saisi_par, saisi_le = now()`,
    [lieuId, fraisId, `${aPartirDe}-01`, montant, par],
  );
  return rows[0]?.montant ?? null;
}

export async function routesFrais(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/mes-frais", async (req): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => mesFrais(c, auth.lieuId));
  });

  // Frais proposé : « pas concerné », ou retour à « à vérifier ».
  app.put("/api/mes-frais/pas-concerne/:cle", async (req): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    const { cle } = z.object({ cle: Cle }).parse(req.params);
    const { pasConcerne } = corps(z.object({ pasConcerne: z.boolean() }), req);
    const s = fraisSuggere(cle);
    if (!s) throw introuvable("Frais proposé");
    return base.transaction(contexte(auth), async (c) => {
      const r = pasConcerne
        ? await c.query("INSERT INTO frais_pas_concerne (lieu_id, cle, saisi_par) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [auth.lieuId, cle, auth.utilisateurId])
        : await c.query("DELETE FROM frais_pas_concerne WHERE lieu_id = $1 AND cle = $2", [auth.lieuId, cle]);
      if (r.rowCount) await inscrireJet(c, { lieuId: auth.lieuId, type: "frais_pas_concerne", utilisateurId: auth.utilisateurId, details: { frais: s.libelle, pasConcerne } });
      return mesFrais(c, auth.lieuId);
    });
  });

  // Nouveau frais de soirée (proposé ou libre) : un poste de dépense, avec ou sans montant habituel.
  app.post("/api/mes-frais/soiree", async (req, rep): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouveauSoiree, req);
    const s = d.cle ? fraisSuggere(d.cle) : undefined;
    if (d.cle && (!s || s.frequence !== "soiree" || s.parStand)) throw new ErreurMetier(400, "Ce frais ne se compte pas à chaque soirée.");
    const nom = d.nom ?? s?.libelle;
    if (!nom) throw new ErreurMetier(400, "Le nom du frais est obligatoire.");
    Habituel.parse({ modeHabituel: d.modeHabituel, valeurHabituelle: d.valeurHabituelle });
    const r = await base.transaction(contexte(auth), async (c) => {
      const { rows: deja } = await c.query<{ id: string; actif: boolean; cle: string | null }>(
        "SELECT id, actif, cle FROM poste_depense WHERE lieu_id = $1 AND (lower(nom) = lower($2) OR ($3::text IS NOT NULL AND cle = $3))",
        [auth.lieuId, nom, d.cle ?? null],
      );
      const existant = deja[0];
      if (existant?.actif) throw new ErreurMetier(409, `Le frais « ${nom} » existe déjà.`);
      if (existant) {
        // Un poste désactivé se réactive : ses soirées passées gardent leurs montants.
        await c.query("UPDATE poste_depense SET actif = true, mode_habituel = $3, valeur_habituelle = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, existant.id, d.modeHabituel, d.valeurHabituelle]);
      } else {
        await c.query("INSERT INTO poste_depense (lieu_id, nom, cle, mode_habituel, valeur_habituelle, cree_par) VALUES ($1, $2, $3, $4, $5, $6)", [
          auth.lieuId,
          nom,
          d.cle ?? null,
          d.modeHabituel,
          d.valeurHabituelle,
          auth.utilisateurId,
        ]);
      }
      if (d.cle) await c.query("DELETE FROM frais_pas_concerne WHERE lieu_id = $1 AND cle = $2", [auth.lieuId, d.cle]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "poste_depense_cree", utilisateurId: auth.utilisateurId, details: { nom, habituel: texteHabituel(d.modeHabituel, d.valeurHabituelle), ...(existant ? { reactive: true } : {}) } });
      return mesFrais(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  // Montant habituel d'un frais de soirée (null : saisi soirée par soirée).
  app.put("/api/mes-frais/soiree/:id", async (req): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(Habituel, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string; mode_habituel: ModeDepense | null; valeur_habituelle: number | null }>(
        "SELECT nom, mode_habituel, valeur_habituelle FROM poste_depense WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
        [auth.lieuId, id],
      );
      const p = rows[0];
      if (!p) throw introuvable("Frais");
      if (p.mode_habituel !== d.modeHabituel || p.valeur_habituelle !== d.valeurHabituelle) {
        await c.query("UPDATE poste_depense SET mode_habituel = $3, valeur_habituelle = $4 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, d.modeHabituel, d.valeurHabituelle]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "poste_depense_modifie",
          utilisateurId: auth.utilisateurId,
          details: { poste: p.nom, habituel: { avant: texteHabituel(p.mode_habituel, p.valeur_habituelle), apres: texteHabituel(d.modeHabituel, d.valeurHabituelle) } },
        });
      }
      return mesFrais(c, auth.lieuId);
    });
  });

  // Nouveau frais du mois (proposé ou libre), avec son premier montant.
  app.post("/api/mes-frais/mois", async (req, rep): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouveauMois, req);
    const s = d.cle ? fraisSuggere(d.cle) : undefined;
    if (d.cle && (!s || s.frequence !== "mois")) throw new ErreurMetier(400, "Ce frais ne se compte pas chaque mois.");
    const nom = d.nom ?? s?.libelle;
    if (!nom) throw new ErreurMetier(400, "Le nom du frais est obligatoire.");
    const r = await base.transaction(contexte(auth), async (c) => {
      const { rows: deja } = await c.query("SELECT 1 FROM frais_mensuel WHERE lieu_id = $1 AND (lower(nom) = lower($2) OR ($3::text IS NOT NULL AND cle = $3))", [auth.lieuId, nom, d.cle ?? null]);
      if (deja[0]) throw new ErreurMetier(409, `Le frais « ${nom} » existe déjà.`);
      const { rows } = await c.query<{ id: string }>("INSERT INTO frais_mensuel (lieu_id, nom, cle, cree_par) VALUES ($1, $2, $3, $4) RETURNING id", [auth.lieuId, nom, d.cle ?? null, auth.utilisateurId]);
      await enregistrerMontant(c, auth.lieuId, rows[0]!.id, d.aPartirDe, d.montant, auth.utilisateurId);
      if (d.cle) await c.query("DELETE FROM frais_pas_concerne WHERE lieu_id = $1 AND cle = $2", [auth.lieuId, d.cle]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "frais_mensuel_cree", utilisateurId: auth.utilisateurId, details: { nom, montant: formaterMontant(d.montant), aPartirDe: d.aPartirDe } });
      return mesFrais(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  // Nouveau montant d'un frais du mois, à partir d'un mois (0 : le frais s'arrête) ; les mois passés ne changent pas.
  app.put("/api/mes-frais/mois/:id", async (req): Promise<MesFrais> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = z.object({ id: Uuid }).parse(req.params);
    const d = corps(MontantMois, req);
    return base.transaction(contexte(auth), async (c) => {
      const f = await exigerFraisMensuel(c, auth.lieuId, id);
      const avant = await enregistrerMontant(c, auth.lieuId, id, d.aPartirDe, d.montant, auth.utilisateurId);
      if (avant !== d.montant) {
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "frais_mensuel_modifie",
          utilisateurId: auth.utilisateurId,
          details: { nom: f.nom, aPartirDe: d.aPartirDe, avant: avant === null ? "aucun" : formaterMontant(avant), apres: formaterMontant(d.montant) },
        });
      }
      return mesFrais(c, auth.lieuId);
    });
  });
}
