import { realpathSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { OPTIONS_LIEU, OPTIONS_PAR_DEFAUT, type LieuParc, type OptionLieu, type ParcEditeur, type VerificationEditeur } from "@flaix/domain";
import type { Base } from "../base.ts";
import { config } from "../config.ts";
import { ErreurMetier, nonAutorise } from "../erreurs.ts";
import { verifierCaisses } from "../journal-caisse.ts";
import { inscrireJet, verifierJet } from "../journal-technique.ts";
import { LONGUEUR_MIN_MOT_DE_PASSE, empreinteJeton, empreinteLeurre, hacherMotDePasse, nouveauJetonSession, verifierMotDePasse } from "../auth/secrets.ts";
import { verifierClotures } from "./periodes.ts";
import { ParamId, corps } from "./outils.ts";

/**
 * Back-office éditeur, niveau 1 : supervision technique (module 17 ; dossier §15.13, §15.116).
 *
 * Comptes Break Eat distincts des comptes des lieux, cookie distinct. Une session éditeur n'a pas de
 * lieu : la base ne lui montre aucune donnée d'un lieu ; la vue du parc ne contient ni montant, ni
 * ticket, ni nom de salarié. Seule action sur un lieu : vérifier l'intégrité de ses chaînes — le
 * serveur relit, ne renvoie que des états, et l'inscrit au journal technique du lieu (visible par lui).
 */
const NOM_COOKIE_EDITEUR = "fx_editeur";
const DUREE_SESSION_EDITEUR_H = 8;

interface Editeur {
  utilisateurId: string;
  nom: string;
  email: string;
  jetonEmpreinte: string;
}

/** Version en service : le dossier de la version déployée (/srv/flaix/versions/AAAAMMJJ-HHMMSS). */
function versionEnService(): string {
  try {
    const dossier = basename(realpathSync(resolve(process.cwd(), "../..")));
    return /^\d{8}-\d{6}$/.test(dossier) ? dossier : "développement";
  } catch {
    return "inconnue";
  }
}

async function exigerEditeur(base: Base, req: FastifyRequest): Promise<Editeur> {
  const jeton = req.cookies[NOM_COOKIE_EDITEUR];
  if (!jeton || jeton.length > 200) throw nonAutorise();
  const empreinte = empreinteJeton(jeton);
  const r = await base.transaction({}, async (c) => {
    const { rows } = await c.query<{ utilisateur_id: string; nom: string; email: string }>("SELECT * FROM session_editeur_valide($1)", [empreinte]);
    return rows[0] ?? null;
  });
  if (!r) throw nonAutorise();
  return { utilisateurId: r.utilisateur_id, nom: r.nom, email: r.email, jetonEmpreinte: empreinte };
}

function poserCookie(rep: FastifyReply, jeton: string, expire: Date) {
  rep.setCookie(NOM_COOKIE_EDITEUR, jeton, { path: "/api/editeur", httpOnly: true, sameSite: "strict", secure: config.cookieSecurise, expires: expire });
}

export async function routesEditeur(app: FastifyInstance, { base }: { base: Base }) {
  app.post(
    "/api/editeur/connexion",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, rep) => {
      const { email, motDePasse } = corps(z.object({ email: z.string().trim().max(200), motDePasse: z.string().min(1).max(200) }), req);
      const compte = await base.transaction({}, async (c) => {
        const { rows } = await c.query<{ id: string; nom: string; email: string; mot_de_passe_hash: string; actif: boolean }>("SELECT * FROM compte_editeur_pour_connexion($1)", [email]);
        return rows[0] ?? null;
      });
      const valide = compte ? compte.actif && (await verifierMotDePasse(compte.mot_de_passe_hash, motDePasse)) : await verifierMotDePasse(await empreinteLeurre(), motDePasse);
      if (!compte || !valide) {
        req.log.warn({ email }, "connexion éditeur refusée");
        throw new ErreurMetier(401, "E-mail ou mot de passe incorrect.");
      }
      const { jeton, empreinte } = nouveauJetonSession();
      const expire = new Date(Date.now() + DUREE_SESSION_EDITEUR_H * 3_600_000);
      await base.transaction({ utilisateurId: compte.id }, (c) =>
        c.query("INSERT INTO session (jeton_hash, utilisateur_id, lieu_id, role, expire_le) VALUES ($1, $2, NULL, 'editeur', $3)", [empreinte, compte.id, expire]),
      );
      req.log.info({ editeur: compte.id }, "connexion éditeur");
      poserCookie(rep, jeton, expire);
      return { nom: compte.nom, email: compte.email };
    },
  );

  app.get("/api/editeur/session", async (req) => {
    const e = await exigerEditeur(base, req);
    return { nom: e.nom, email: e.email };
  });

  app.post("/api/editeur/deconnexion", async (req, rep) => {
    const jeton = req.cookies[NOM_COOKIE_EDITEUR];
    if (jeton) {
      await base.transaction({}, (c) => c.query("UPDATE session SET revoquee_le = now() WHERE jeton_hash = $1 AND role = 'editeur'", [empreinteJeton(jeton)]));
    }
    rep.clearCookie(NOM_COOKIE_EDITEUR, { path: "/api/editeur" });
    return { ok: true };
  });

  app.post("/api/editeur/mot-de-passe", { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } }, async (req) => {
    const e = await exigerEditeur(base, req);
    const { actuel, nouveau } = corps(
      z.object({
        actuel: z.string().min(1).max(200),
        nouveau: z.string().min(LONGUEUR_MIN_MOT_DE_PASSE, `Le nouveau mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`).max(200),
      }),
      req,
    );
    const ctx = { utilisateurId: e.utilisateurId };
    const hash = await base.transaction(ctx, async (c) => (await c.query<{ h: string | null }>("SELECT hash_mot_de_passe_editeur() AS h")).rows[0]?.h ?? "");
    if (!(await verifierMotDePasse(hash, actuel))) throw new ErreurMetier(400, "Le mot de passe actuel est incorrect.");
    const nouvelle = await hacherMotDePasse(nouveau);
    await base.transaction(ctx, (c) => c.query("SELECT changer_mot_de_passe_editeur($1, $2)", [nouvelle, e.jetonEmpreinte]));
    return { ok: true };
  });

  app.get("/api/editeur/parc", async (req): Promise<ParcEditeur> => {
    const e = await exigerEditeur(base, req);
    const lieux = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => {
      const { rows } = await c.query<{
        lieu_id: string;
        nom: string;
        raison_sociale: string | null;
        cree_le: Date;
        stands_actifs: number;
        caisses_actives: number;
        tablettes: number;
        exercice_regle: boolean;
        matchs_joues: number;
        matchs_ouverts: number;
        plus_ancien_ouvert: Date | null;
        dernier_z: Date | null;
        dernier_mois_cloture: string | null;
        mois_a_cloturer: number;
        derniere_activite: Date | null;
        derniere_verification: Date | null;
        verification_ok: boolean | null;
      }>("SELECT *, to_char(dernier_mois_cloture, 'YYYY-MM-DD') AS dernier_mois_cloture FROM vue_parc()");
      return rows.map(
        (r): LieuParc => ({
          lieuId: r.lieu_id,
          nom: r.nom,
          raisonSociale: r.raison_sociale,
          creeLe: r.cree_le.toISOString(),
          standsActifs: r.stands_actifs,
          caissesActives: r.caisses_actives,
          tablettes: r.tablettes,
          exerciceRegle: r.exercice_regle,
          matchsJoues: r.matchs_joues,
          matchsOuverts: r.matchs_ouverts,
          plusAncienOuvert: r.plus_ancien_ouvert?.toISOString() ?? null,
          dernierZ: r.dernier_z?.toISOString() ?? null,
          dernierMoisCloture: r.dernier_mois_cloture,
          moisACloturer: r.mois_a_cloturer,
          derniereActivite: r.derniere_activite?.toISOString() ?? null,
          derniereVerification: r.derniere_verification ? { le: r.derniere_verification.toISOString(), ok: r.verification_ok === true } : null,
          options: { ...OPTIONS_PAR_DEFAUT },
        }),
      );
    });
    const reglees = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query<{ lieu_id: string; option: OptionLieu; active: boolean }>("SELECT * FROM options_du_parc()")).rows);
    for (const o of reglees) {
      const l = lieux.find((x) => x.lieuId === o.lieu_id);
      if (l) l.options[o.option] = o.active;
    }
    return { version: versionEnService(), environnement: config.environnement, lieux };
  });

  // Activer ou désactiver une option d'un lieu (§15.118) : configuration du contrat, inscrite au journal du lieu.
  app.put("/api/editeur/lieux/:id/options", async (req) => {
    const e = await exigerEditeur(base, req);
    const { id } = ParamId.parse(req.params);
    const { option, active } = corps(z.object({ option: z.enum(OPTIONS_LIEU.map((o) => o.cle) as [OptionLieu, ...OptionLieu[]]), active: z.boolean() }), req);
    const connu = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query("SELECT 1 FROM vue_parc() WHERE lieu_id = $1", [id])).rows.length > 0);
    if (!connu) throw new ErreurMetier(404, "Lieu introuvable.");
    await base.transaction({ lieuId: id, utilisateurId: e.utilisateurId }, async (c) => {
      await c.query("SELECT definir_option_lieu($1, $2, $3)", [id, option, active]);
      await inscrireJet(c, { lieuId: id, type: "option_modifiee", utilisateurId: e.utilisateurId, details: { option, active, par: `Break Eat — ${e.nom}` } });
    });
    return { ok: true };
  });

  app.post("/api/editeur/lieux/:id/verification", async (req): Promise<VerificationEditeur> => {
    const e = await exigerEditeur(base, req);
    const { id } = ParamId.parse(req.params);
    // Le lieu doit figurer au parc (jamais un lieu de formation) : vérifié avec les droits de l'éditeur.
    const connu = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query("SELECT 1 FROM vue_parc() WHERE lieu_id = $1", [id])).rows.length > 0);
    if (!connu) throw new ErreurMetier(404, "Lieu introuvable.");
    return base.transaction({ lieuId: id, utilisateurId: e.utilisateurId }, async (c) => {
      const caisses = await verifierCaisses(c, id);
      const jet = await verifierJet(c, id);
      const clotures = await verifierClotures(c, id);
      const resultat: VerificationEditeur = {
        ok: caisses.ok && jet.ok && jet.numerotationContinue && clotures.ok,
        caisses: { ok: caisses.ok, nombre: caisses.caisses.length, ruptures: caisses.caisses.filter((k) => !k.ok).map((k) => k.numero) },
        journalTechnique: { ok: jet.ok && jet.numerotationContinue, maillons: jet.maillons },
        clotures: { ok: clotures.ok, maillons: clotures.maillons },
      };
      // Inscrit au journal du lieu, qui voit qui a vérifié quoi et quand.
      await inscrireJet(c, { lieuId: id, type: "verification_editeur", utilisateurId: e.utilisateurId, details: { ...resultat, par: `Break Eat — ${e.nom}` } });
      return resultat;
    });
  });
}
