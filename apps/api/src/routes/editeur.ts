import { realpathSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  OPTIONS_LIEU,
  OPTIONS_PAR_DEFAUT,
  type DirecteurParc,
  type DirecteurRemis,
  type LieuCree,
  type LieuParc,
  type OptionLieu,
  type ParcEditeur,
  type VerificationEditeur,
} from "@flaix/domain";
import { changerLieu, type Base, type Client } from "../base.ts";
import { config } from "../config.ts";
import { ErreurMetier, nonAutorise } from "../erreurs.ts";
import { verifierCaisses } from "../journal-caisse.ts";
import { inscrireJet, verifierJet } from "../journal-technique.ts";
import { empreinteJeton, empreinteLeurre, genererMotDePasseProvisoire, hacherMotDePasse, nouveauJetonSession, verifierMotDePasse } from "../auth/secrets.ts";
import { NouveauMotDePasse } from "../auth/routes.ts";
import { verifierClotures } from "./periodes.ts";
import { ParamId, Uuid, corps, texte } from "./outils.ts";

/**
 * Back-office éditeur, niveau 1 : supervision technique (module 17 ; dossier §15.13, §15.116).
 *
 * Comptes FlaiX Expert distincts des comptes des lieux, cookie distinct. Une session éditeur n'a pas de
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

export async function exigerEditeur(base: Base, req: FastifyRequest): Promise<Editeur> {
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

const NouveauDirecteur = z.object({
  nom: texte(120, "Le nom du directeur"),
  email: z.string().trim().toLowerCase().max(200).email("Adresse e-mail invalide."),
});

/** Les refus écrits par les fonctions du back-office (sans contrainte nommée) deviennent des messages lisibles. */
function refusLisible(erreur: unknown): never {
  const e = erreur as { code?: string; constraint?: string; message?: string };
  if (e.code === "P0002") throw new ErreurMetier(404, "Lieu ou directeur introuvable.");
  if (!e.constraint && (e.code === "23505" || e.code === "23514") && e.message) throw new ErreurMetier(e.code === "23505" ? 409 : 400, e.message);
  throw erreur;
}

/**
 * Ajoute un directeur au lieu (transaction déjà placée sur ce lieu) et l'inscrit à son journal.
 * Le mot de passe provisoire n'est tiré que pour un nouveau compte ; il n'est jamais stocké en clair.
 */
async function ajouterDirecteur(c: Client, lieuId: string, d: z.infer<typeof NouveauDirecteur>, e: Editeur): Promise<DirecteurRemis> {
  const motDePasse = genererMotDePasseProvisoire();
  const { rows } = await c
    .query<{ utilisateur_id: string; nouveau_compte: boolean }>("SELECT * FROM ajouter_directeur_editeur($1, $2, $3, $4)", [lieuId, d.email, d.nom, await hacherMotDePasse(motDePasse)])
    .catch(refusLisible);
  const nouveauCompte = rows[0]!.nouveau_compte;
  await inscrireJet(c, { lieuId, type: "directeur_ajoute", utilisateurId: e.utilisateurId, details: { nom: d.nom, email: d.email, nouveauCompte, par: `FlaiX Expert — ${e.nom}` } });
  return { email: d.email, motDePasseProvisoire: nouveauCompte ? motDePasse : null };
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
        nouveau: NouveauMotDePasse,
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
          directeurs: [],
          support: null,
        }),
      );
    });
    const reglees = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query<{ lieu_id: string; option: OptionLieu; active: boolean }>("SELECT * FROM options_du_parc()")).rows);
    for (const o of reglees) {
      const l = lieux.find((x) => x.lieuId === o.lieu_id);
      if (l) l.options[o.option] = o.active;
    }
    const directeurs = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) =>
      (await c.query<{ lieu_id: string; utilisateur_id: string; nom: string; email: string; actif: boolean }>("SELECT * FROM directeurs_du_parc()")).rows,
    );
    for (const d of directeurs) {
      const directeur: DirecteurParc = { utilisateurId: d.utilisateur_id, nom: d.nom, email: d.email, actif: d.actif };
      lieux.find((x) => x.lieuId === d.lieu_id)?.directeurs.push(directeur);
    }
    // Support autorisé par le lieu en ce moment (niveau 2, §15.142).
    const supports = await base.transaction({ utilisateurId: e.utilisateurId }, async (c) => (await c.query<{ lieu_id: string; fin: Date; motif: string | null }>("SELECT * FROM supports_autorises()")).rows);
    for (const s of supports) {
      const l = lieux.find((x) => x.lieuId === s.lieu_id);
      if (l) l.support = { jusqua: s.fin.toISOString(), motif: s.motif };
    }
    return { version: versionEnService(), environnement: config.environnement, lieux };
  });

  // Créer un lieu, vide, avec son premier directeur (§15.122) : jusqu'ici réservé à l'outil du serveur.
  app.post("/api/editeur/lieux", async (req): Promise<LieuCree> => {
    const e = await exigerEditeur(base, req);
    const { nom, directeur } = corps(z.object({ nom: texte(120, "Le nom du lieu"), directeur: NouveauDirecteur }), req);
    return base.transaction({ utilisateurId: e.utilisateurId }, async (c) => {
      const lieuId = (await c.query<{ id: string }>("SELECT creer_lieu_editeur($1) AS id", [nom])).rows[0]!.id;
      await changerLieu(c, lieuId);
      await inscrireJet(c, { lieuId, type: "lieu_cree", utilisateurId: e.utilisateurId, details: { nom, par: `FlaiX Expert — ${e.nom}` } });
      return { lieuId, nom, directeur: await ajouterDirecteur(c, lieuId, directeur, e) };
    });
  });

  // Ajouter un directeur à un lieu existant ; une adresse déjà connue est rattachée avec son mot de passe actuel.
  app.post("/api/editeur/lieux/:id/directeurs", async (req): Promise<DirecteurRemis> => {
    const e = await exigerEditeur(base, req);
    const { id } = ParamId.parse(req.params);
    const directeur = corps(NouveauDirecteur, req);
    return base.transaction({ lieuId: id, utilisateurId: e.utilisateurId }, (c) => ajouterDirecteur(c, id, directeur, e));
  });

  // Nouveau mot de passe provisoire d'un directeur : ses sessions sont fermées, chaque lieu dont il est membre le voit au journal.
  app.post("/api/editeur/lieux/:id/directeurs/:utilisateurId/mot-de-passe", async (req): Promise<DirecteurRemis> => {
    const e = await exigerEditeur(base, req);
    const { id, utilisateurId } = z.object({ id: Uuid, utilisateurId: Uuid }).parse(req.params);
    const motDePasse = genererMotDePasseProvisoire();
    const hash = await hacherMotDePasse(motDePasse);
    return base.transaction({ lieuId: id, utilisateurId: e.utilisateurId }, async (c) => {
      const lieux = (await c.query<{ lieu: string }>("SELECT nouveau_mot_de_passe_directeur($1, $2, $3) AS lieu", [id, utilisateurId, hash]).catch(refusLisible)).rows.map((r) => r.lieu);
      const email = (await c.query<{ email: string }>("SELECT email FROM directeurs_du_parc() WHERE utilisateur_id = $1 LIMIT 1", [utilisateurId])).rows[0]!.email;
      for (const lieuId of lieux) {
        await changerLieu(c, lieuId);
        await inscrireJet(c, { lieuId, type: "mot_de_passe_provisoire", utilisateurId: e.utilisateurId, details: { email, par: `FlaiX Expert — ${e.nom}` } });
      }
      return { email, motDePasseProvisoire: motDePasse };
    });
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
      await inscrireJet(c, { lieuId: id, type: "option_modifiee", utilisateurId: e.utilisateurId, details: { option, active, par: `FlaiX Expert — ${e.nom}` } });
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
      await inscrireJet(c, { lieuId: id, type: "verification_editeur", utilisateurId: e.utilisateurId, details: { ...resultat, par: `FlaiX Expert — ${e.nom}` } });
      return resultat;
    });
  });
}
