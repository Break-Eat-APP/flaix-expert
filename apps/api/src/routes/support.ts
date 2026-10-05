import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { DUREES_SUPPORT, ecranConsulte, type AutorisationSupport, type EtatSupport } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur, type Authentification } from "../auth/contexte.ts";
import { poserCookieSession } from "../auth/routes.ts";
import { empreinteJeton } from "../auth/secrets.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { exigerEditeur } from "./editeur.ts";
import { ParamId, contexte, corps } from "./outils.ts";

/*
 * Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.13, §15.142).
 * Le lieu autorise (1 h, 4 h ou 24 h) et retire quand il veut ; FlaiX Expert ouvre une session « support »
 * seulement pendant une autorisation en cours (vérifié par la base) ; la session lit, n'écrit jamais
 * (transactions READ ONLY, écritures refusées avant la route) ; chaque écran consulté va au journal du lieu.
 */

const METHODES_LECTURE = new Set(["GET", "HEAD"]);
/** Adresses lues sans trace : la session elle-même (chargée à chaque écran). */
const SANS_TRACE = new Set(["/api/auth/session"]);

const Autorisation = z.object({
  heures: z.number().int().refine((h) => (DUREES_SUPPORT as readonly number[]).includes(h), "Durée : 1, 4 ou 24 heures."),
  motif: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => (v ? v : null)),
});

/**
 * Contrôle de chaque requête d'une session support, avant la route : une écriture est refusée et journalisée
 * (seule la déconnexion passe) ; une lecture est inscrite au journal du lieu, une fois par adresse et par session.
 */
export async function controlerSupport(req: FastifyRequest, base: Base, auth: Authentification): Promise<void> {
  const route = req.routeOptions.url ?? req.url;
  const ctx = { lieuId: auth.lieuId, utilisateurId: auth.utilisateurId };
  const { rows } = await base.transaction(ctx, (c) =>
    c.query<{ autorisation_id: string; expire_le: Date }>("SELECT autorisation_id, expire_le FROM session WHERE jeton_hash = $1", [auth.jetonEmpreinte]),
  );
  auth.supportJusqua = rows[0]?.expire_le.toISOString() ?? null;
  if (!METHODES_LECTURE.has(req.method)) {
    if (route === "/api/auth/deconnexion") return;
    await base.transaction(ctx, (c) =>
      inscrireJet(c, { lieuId: auth.lieuId, type: "acces_refuse", utilisateurId: auth.utilisateurId, details: { role: "support", methode: req.method, route, par: `FlaiX Expert — ${auth.nom}` } }),
    );
    throw new ErreurMetier(403, "Support FlaiX Expert : accès en lecture seule, rien ne peut être modifié.");
  }
  if (SANS_TRACE.has(route) || !rows[0]) return;
  await base.transaction(ctx, async (c) => {
    const { rows: nouvelle } = await c.query(
      "INSERT INTO consultation_support (lieu_id, autorisation_id, session_hash, route, editeur_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING 1",
      [auth.lieuId, rows[0]!.autorisation_id, auth.jetonEmpreinte, route.slice(0, 200), auth.utilisateurId],
    );
    if (nouvelle[0]) {
      await inscrireJet(c, { lieuId: auth.lieuId, type: "support_consultation", utilisateurId: auth.utilisateurId, details: { ecran: ecranConsulte(route), adresse: route, par: `FlaiX Expert — ${auth.nom}` } });
    }
  });
}

async function etatSupport(c: Client, lieuId: string): Promise<EtatSupport> {
  const { rows } = await c.query<{ id: string; debut: Date; fin: Date; motif: string | null; accordee_par: string; retiree_le: Date | null; retiree_par: string | null }>(
    `SELECT a.id, a.debut, a.fin, a.motif, ua.nom AS accordee_par, a.retiree_le, ur.nom AS retiree_par
       FROM autorisation_support a JOIN utilisateur ua ON ua.id = a.accordee_par LEFT JOIN utilisateur ur ON ur.id = a.retiree_par
      WHERE a.lieu_id = $1 ORDER BY a.debut DESC LIMIT 30`,
    [lieuId],
  );
  // Le nom de la personne de FlaiX Expert est celui inscrit au journal (un compte éditeur n'est membre d'aucun lieu).
  const { rows: vues } = await c.query<{ autorisation_id: string; route: string; le: Date; par: string | null }>(
    `SELECT cs.autorisation_id, cs.route, cs.le,
            (SELECT j.details->>'par' FROM journal_technique j WHERE j.lieu_id = cs.lieu_id AND j.type = 'support_ouvert' AND j.utilisateur_id = cs.editeur_id ORDER BY j.numero DESC LIMIT 1) AS par
       FROM consultation_support cs WHERE cs.lieu_id = $1 ORDER BY cs.le`,
    [lieuId],
  );
  const maintenant = Date.now();
  const liste: AutorisationSupport[] = rows.map((r) => ({
    id: r.id,
    debut: r.debut.toISOString(),
    fin: r.fin.toISOString(),
    motif: r.motif,
    accordeePar: r.accordee_par,
    retireeLe: r.retiree_le?.toISOString() ?? null,
    retireePar: r.retiree_par,
    active: r.retiree_le === null && r.fin.getTime() > maintenant && r.debut.getTime() <= maintenant,
    consultations: vues.filter((v) => v.autorisation_id === r.id).map((v) => ({ route: v.route, ecran: ecranConsulte(v.route), le: v.le.toISOString(), par: v.par ?? "FlaiX Expert" })),
  }));
  return { active: liste.find((a) => a.active) ?? null, historique: liste };
}

export async function routesSupport(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Côté lieu : Paramètres → Support FlaiX Expert ----------
  app.get("/api/support", async (req): Promise<EtatSupport> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etatSupport(c, auth.lieuId));
  });

  app.post("/api/support/autorisation", async (req): Promise<EtatSupport> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Autorisation, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows: lieu } = await c.query<{ formation: boolean }>("SELECT formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1", [auth.lieuId]);
      if (lieu[0]?.formation) throw new ErreurMetier(409, "Mode formation : le support s'autorise depuis le vrai lieu.");
      const avant = await etatSupport(c, auth.lieuId);
      if (avant.active) throw new ErreurMetier(409, "Le support est déjà autorisé : retire l'autorisation en cours pour en donner une nouvelle.");
      const { rows } = await c.query<{ fin: Date }>(
        "INSERT INTO autorisation_support (lieu_id, accordee_par, fin, motif) VALUES ($1, $2, now() + make_interval(hours => $3), $4) RETURNING fin",
        [auth.lieuId, auth.utilisateurId, d.heures, d.motif],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "support_autorise", utilisateurId: auth.utilisateurId, details: { heures: d.heures, jusqua: rows[0]!.fin.toISOString(), motif: d.motif } });
      return etatSupport(c, auth.lieuId);
    });
  });

  app.post("/api/support/retrait", async (req): Promise<EtatSupport> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await etatSupport(c, auth.lieuId);
      if (!avant.active) return avant;
      await c.query("UPDATE autorisation_support SET retiree_le = now(), retiree_par = $2 WHERE lieu_id = $1 AND id = $3", [auth.lieuId, auth.utilisateurId, avant.active.id]);
      // Les sessions ouvertes sur cette autorisation sont fermées (la base ne les validerait déjà plus).
      await c.query("UPDATE session SET revoquee_le = now() WHERE autorisation_id = $1 AND revoquee_le IS NULL", [avant.active.id]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "support_retire", utilisateurId: auth.utilisateurId, details: { autorisation: avant.active.id, consultations: avant.active.consultations.length } });
      return etatSupport(c, auth.lieuId);
    });
  });

  // ---------- Côté FlaiX Expert : ouvrir le lieu en lecture seule ----------
  app.post("/api/editeur/lieux/:id/support", async (req, rep: FastifyReply): Promise<{ jusqua: string }> => {
    const e = await exigerEditeur(base, req);
    const { id } = ParamId.parse(req.params);
    const jeton = randomBytes(32).toString("base64url");
    const ouverte = await base
      .transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query<{ autorisation_id: string; fin: Date }>("SELECT * FROM ouvrir_session_support($1, $2)", [id, empreinteJeton(jeton)])).rows[0]!)
      .catch((erreur: { code?: string; message?: string }) => {
        if (erreur.code === "42501") throw new ErreurMetier(403, erreur.message ?? "Support non autorisé par ce lieu.");
        throw erreur;
      });
    await base.transaction({ lieuId: id, utilisateurId: e.utilisateurId }, (c) =>
      inscrireJet(c, { lieuId: id, type: "support_ouvert", utilisateurId: e.utilisateurId, details: { par: `FlaiX Expert — ${e.nom}`, jusqua: ouverte.fin.toISOString() } }),
    );
    poserCookieSession(rep, jeton, ouverte.fin);
    return { jusqua: ouverte.fin.toISOString() };
  });
}
