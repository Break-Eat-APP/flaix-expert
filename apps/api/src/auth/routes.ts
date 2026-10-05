import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { FastifyReply } from "fastify";
import { refusMotDePasse, type AccueilTablette, type Role, type SessionInfo } from "@flaix/domain";
import { changerLieu, type Base } from "../base.ts";
import { config } from "../config.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { NOM_COOKIE, exigerSession, type Authentification } from "./contexte.ts";
import { BLOCAGE_CODE_MINUTES, ESSAIS_CODE_MAX, lireAppareil } from "./appareil.ts";
import {
  empreinteLeurre,
  hacherMotDePasse,
  nouveauJetonSession,
  verifierMotDePasse,
} from "./secrets.ts";

const Connexion = z.object({
  email: z.string().trim().max(200),
  motDePasse: z.string().min(1).max(200),
});

/** Nouveau mot de passe : 6 caractères au moins, pas un des plus utilisés (§15.122). */
export const NouveauMotDePasse = z.string().superRefine((v, ctx) => {
  const refus = refusMotDePasse(v);
  if (refus) ctx.addIssue({ code: "custom", message: refus });
});

const ChangementMotDePasse = z.object({
  actuel: z.string().min(1).max(200),
  nouveau: NouveauMotDePasse,
});

const ConnexionCode = z.object({
  caissiereId: z.string().uuid("Choisis ton nom dans la liste."),
  code: z.string().regex(/^[0-9]{4}$/, "Le code a 4 chiffres."),
});

const identifiantsIncorrects = () => new ErreurMetier(401, "E-mail ou mot de passe incorrect.");
const codeIncorrect = () => new ErreurMetier(401, "Code incorrect.");
const heureParis = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" });

export function infoSession(
  a: Pick<Authentification, "utilisateurId" | "nom" | "email" | "lieuId" | "role" | "appareilId" | "appareilCaisseId" | "formation"> & Partial<Pick<Authentification, "supportJusqua">>,
  lieuNom: string,
): SessionInfo {
  return {
    utilisateur: { id: a.utilisateurId, nom: a.nom, email: a.email },
    lieu: { id: a.lieuId, nom: lieuNom },
    role: a.role,
    appareil: a.appareilId && a.appareilCaisseId ? { id: a.appareilId, caisseId: a.appareilCaisseId } : null,
    environnement: config.environnement,
    formation: a.formation,
    support: a.role === "support" && a.supportJusqua ? { jusqua: a.supportJusqua } : null,
  };
}

export function poserCookieSession(rep: FastifyReply, jeton: string, expire: Date) {
  rep.setCookie(NOM_COOKIE, jeton, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: config.cookieSecurise,
    expires: expire,
  });
}

export async function nomDuLieu(base: Base, lieuId: string, utilisateurId: string): Promise<string> {
  return base.transaction({ lieuId, utilisateurId }, async (c) => {
    const { rows } = await c.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [lieuId]);
    return rows[0]?.nom ?? "";
  });
}

export async function routesAuth(app: FastifyInstance, { base }: { base: Base }) {
  app.post(
    "/api/auth/connexion",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, rep): Promise<SessionInfo> => {
      const { email, motDePasse } = Connexion.parse(req.body);

      const compte = await base.transaction({}, async (c) => {
        const { rows } = await c.query<{ id: string; nom: string; email: string; mot_de_passe_hash: string; actif: boolean }>(
          "SELECT * FROM compte_pour_connexion($1)",
          [email],
        );
        return rows[0] ?? null;
      });
      if (!compte) {
        await verifierMotDePasse(await empreinteLeurre(), motDePasse);
        throw identifiantsIncorrects();
      }

      const motDePasseValide = compte.actif && (await verifierMotDePasse(compte.mot_de_passe_hash, motDePasse));
      const membres = await base.transaction({ utilisateurId: compte.id }, async (c) => {
        const { rows } = await c.query<{ lieu_id: string; role: Role }>(
          // Jamais un lieu de formation : on y entre depuis le vrai lieu (dossier §15.109).
          `SELECT lieu_id, role FROM membre
            WHERE utilisateur_id = $1 AND actif AND NOT est_lieu_formation(lieu_id)
            ORDER BY (role = 'directeur') DESC, cree_le`,
          [compte.id],
        );
        return rows;
      });

      if (!motDePasseValide) {
        for (const m of membres) {
          await base.transaction({ lieuId: m.lieu_id, utilisateurId: compte.id }, (c) =>
            inscrireJet(c, { lieuId: m.lieu_id, type: "connexion_refusee", utilisateurId: compte.id }),
          );
        }
        throw identifiantsIncorrects();
      }
      // La connexion par e-mail est réservée aux comptes à e-mail ; une caissière utilise son code (§15.100).
      const membre = membres.find((m) => m.role !== "operateur");
      if (!membre) {
        throw new ErreurMetier(403, membres.length ? "Les caissières se connectent avec leur code, sur une tablette de caisse." : "Ce compte n'est rattaché à aucun lieu actif.");
      }

      const { jeton, empreinte } = nouveauJetonSession();
      const expire = new Date(Date.now() + config.dureeSessionHeures * 3_600_000);
      await base.transaction({ lieuId: membre.lieu_id, utilisateurId: compte.id }, async (c) => {
        await c.query(
          "INSERT INTO session (jeton_hash, utilisateur_id, lieu_id, role, expire_le) VALUES ($1, $2, $3, $4, $5)",
          [empreinte, compte.id, membre.lieu_id, membre.role, expire],
        );
        await inscrireJet(c, {
          lieuId: membre.lieu_id,
          type: "connexion",
          utilisateurId: compte.id,
          details: { role: membre.role },
        });
      });

      poserCookieSession(rep, jeton, expire);
      return infoSession(
        { utilisateurId: compte.id, nom: compte.nom, email: compte.email, lieuId: membre.lieu_id, role: membre.role, appareilId: null, appareilCaisseId: null, formation: false },
        await nomDuLieu(base, membre.lieu_id, compte.id),
      );
    },
  );

  // ---------- Tablette enregistrée : accueil avant connexion (dossier §15.100) ----------
  app.get("/api/appareil", async (req): Promise<AccueilTablette> => {
    const appareil = await lireAppareil(base, req);
    if (!appareil) throw new ErreurMetier(404, "Cet appareil n'est pas une tablette de caisse enregistrée.");
    return base.transaction({ lieuId: appareil.lieuId }, async (c) => {
      const { rows: lieu } = await c.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [appareil.lieuId]);
      const { rows: caisse } = await c.query<{ id: string; numero: number; nom: string | null; stand_nom: string }>(
        "SELECT k.id, k.numero, k.nom, s.nom AS stand_nom FROM caisse k JOIN stand s ON s.lieu_id = k.lieu_id AND s.id = k.stand_id WHERE k.lieu_id = $1 AND k.id = $2",
        [appareil.lieuId, appareil.caisseId],
      );
      const { rows: caissieres } = await c.query<{ id: string; nom: string }>(
        `SELECT u.id, u.nom FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
          WHERE m.lieu_id = $1 AND m.role = 'operateur' AND m.actif AND u.actif
          ORDER BY lower(u.nom)`,
        [appareil.lieuId],
      );
      const k = caisse[0]!;
      return { lieuNom: lieu[0]?.nom ?? "", formation: appareil.formation, caisse: { id: k.id, numero: k.numero, nom: k.nom, standNom: k.stand_nom }, caissieres };
    });
  });

  // ---------- Connexion d'une caissière par son code, sur une tablette enregistrée ----------
  app.post(
    "/api/auth/code",
    { config: { rateLimit: { max: 60, timeWindow: "15 minutes" } } },
    async (req, rep): Promise<SessionInfo> => {
      const { caissiereId, code } = ConnexionCode.parse(req.body);
      const appareil = await lireAppareil(base, req);
      if (!appareil) throw new ErreurMetier(403, "Cet appareil n'est pas une tablette de caisse enregistrée : la connexion par code n'y est pas possible.");

      type Issue =
        | { ok: true; jeton: string; expire: Date; nom: string; lieuNom: string; lieuId: string; caisseId: string }
        | { ok: false; erreur: ErreurMetier };
      // Le refus est préparé DANS la transaction (compteur d'essais, journal) et levé APRÈS, pour qu'il soit bien enregistré.
      const issue = await base.transaction({ lieuId: appareil.lieuId, utilisateurId: caissiereId }, async (c): Promise<Issue> => {
        // Verrou sur la fiche : deux essais simultanés ne contournent pas le compteur.
        const { rows } = await c.query<{ nom: string; code_hash: string | null; code_echecs: number; code_bloque_jusqua: Date | null }>(
          `SELECT u.nom, m.code_hash, m.code_echecs, m.code_bloque_jusqua
             FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
            WHERE m.lieu_id = $1 AND m.utilisateur_id = $2 AND m.role = 'operateur' AND m.actif AND u.actif
            FOR UPDATE OF m`,
          [appareil.lieuId, caissiereId],
        );
        const fiche = rows[0];
        if (!fiche?.code_hash) {
          await verifierMotDePasse(await empreinteLeurre(), code);
          return { ok: false, erreur: codeIncorrect() };
        }
        if (fiche.code_bloque_jusqua && fiche.code_bloque_jusqua > new Date()) {
          return {
            ok: false,
            erreur: new ErreurMetier(403, `Trop de codes erronés : ta fiche est bloquée jusqu'à ${heureParis.format(fiche.code_bloque_jusqua)}. Le directeur peut te donner un nouveau code tout de suite.`),
          };
        }
        const { rows: caisse } = await c.query<{ numero: number }>("SELECT numero FROM caisse WHERE lieu_id = $1 AND id = $2", [appareil.lieuId, appareil.caisseId]);
        const numero = caisse[0]?.numero ?? null;

        if (!(await verifierMotDePasse(fiche.code_hash, code))) {
          const echecs = fiche.code_echecs + 1;
          if (echecs >= ESSAIS_CODE_MAX) {
            await c.query("UPDATE membre SET code_echecs = 0, code_bloque_jusqua = now() + make_interval(mins => $3) WHERE lieu_id = $1 AND utilisateur_id = $2", [
              appareil.lieuId,
              caissiereId,
              BLOCAGE_CODE_MINUTES,
            ]);
            await inscrireJet(c, {
              lieuId: appareil.lieuId,
              type: "connexion_bloquee",
              utilisateurId: caissiereId,
              caisseId: appareil.caisseId,
              details: { mode: "code", caisse: numero, minutes: BLOCAGE_CODE_MINUTES },
            });
            return {
              ok: false,
              erreur: new ErreurMetier(403, `Code incorrect ${ESSAIS_CODE_MAX} fois de suite : ta fiche est bloquée ${BLOCAGE_CODE_MINUTES} minutes. Le directeur peut te donner un nouveau code tout de suite.`),
            };
          }
          await c.query("UPDATE membre SET code_echecs = $3 WHERE lieu_id = $1 AND utilisateur_id = $2", [appareil.lieuId, caissiereId, echecs]);
          await inscrireJet(c, {
            lieuId: appareil.lieuId,
            type: "connexion_refusee",
            utilisateurId: caissiereId,
            caisseId: appareil.caisseId,
            details: { mode: "code", caisse: numero, essai: echecs },
          });
          return { ok: false, erreur: codeIncorrect() };
        }

        if (fiche.code_echecs > 0 || fiche.code_bloque_jusqua) {
          await c.query("UPDATE membre SET code_echecs = 0, code_bloque_jusqua = NULL WHERE lieu_id = $1 AND utilisateur_id = $2", [appareil.lieuId, caissiereId]);
        }
        const { jeton, empreinte } = nouveauJetonSession();
        const expire = new Date(Date.now() + config.dureeSessionHeures * 3_600_000);
        const { rows: lieu } = await c.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [appareil.lieuId]);
        // Tablette mise en formation (§15.109) : session dans le lieu de formation, sur la caisse jumelle.
        let cible = { lieuId: appareil.lieuId, caisseId: appareil.caisseId, nouveau: false };
        if (appareil.formation) {
          const { rows: f } = await c.query<{ o_lieu: string; o_nouveau: boolean; o_caisse: string }>("SELECT * FROM formation_pour_tablette($1)", [appareil.id]);
          cible = { lieuId: f[0]!.o_lieu, caisseId: f[0]!.o_caisse, nouveau: f[0]!.o_nouveau };
        }
        await c.query("INSERT INTO session (jeton_hash, utilisateur_id, lieu_id, role, expire_le, appareil_id) VALUES ($1, $2, $3, 'operateur', $4, $5)", [
          empreinte,
          caissiereId,
          cible.lieuId,
          expire,
          appareil.id,
        ]);
        await inscrireJet(c, {
          lieuId: appareil.lieuId,
          type: "connexion",
          utilisateurId: caissiereId,
          caisseId: appareil.caisseId,
          details: { role: "operateur", mode: "code", caisse: numero, ...(appareil.formation ? { formation: true } : {}) },
        });
        if (appareil.formation) {
          await changerLieu(c, cible.lieuId);
          if (cible.nouveau) await inscrireJet(c, { lieuId: cible.lieuId, type: "formation_ouverte", utilisateurId: caissiereId });
          await inscrireJet(c, {
            lieuId: cible.lieuId,
            type: "connexion",
            utilisateurId: caissiereId,
            caisseId: cible.caisseId,
            details: { role: "operateur", mode: "code", caisse: numero, formation: true },
          });
        }
        return { ok: true, jeton, expire, nom: fiche.nom, lieuNom: lieu[0]?.nom ?? "", lieuId: cible.lieuId, caisseId: cible.caisseId };
      });

      if (!issue.ok) throw issue.erreur;
      poserCookieSession(rep, issue.jeton, issue.expire);
      return infoSession(
        {
          utilisateurId: caissiereId,
          nom: issue.nom,
          email: null,
          lieuId: issue.lieuId,
          role: "operateur",
          appareilId: appareil.id,
          appareilCaisseId: issue.caisseId,
          formation: appareil.formation,
        },
        issue.lieuNom,
      );
    },
  );

  app.get("/api/auth/session", async (req): Promise<SessionInfo> => {
    const auth = exigerSession(req);
    return infoSession(auth, await nomDuLieu(base, auth.lieuId, auth.utilisateurId));
  });

  app.post("/api/auth/deconnexion", async (req, rep) => {
    const auth = req.auth;
    if (auth) {
      await base.transaction({ lieuId: auth.lieuId, utilisateurId: auth.utilisateurId }, async (c) => {
        await c.query("UPDATE session SET revoquee_le = now() WHERE jeton_hash = $1", [auth.jetonEmpreinte]);
        await inscrireJet(c, auth.role === "support"
          ? { lieuId: auth.lieuId, type: "support_ferme", utilisateurId: auth.utilisateurId, details: { par: `FlaiX Expert — ${auth.nom}` } }
          : { lieuId: auth.lieuId, type: "deconnexion", utilisateurId: auth.utilisateurId });
      });
    }
    rep.clearCookie(NOM_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.post(
    "/api/auth/mot-de-passe",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req) => {
      const auth = exigerSession(req);
      if (!auth.email) throw new ErreurMetier(403, "Une caissière n'a pas de mot de passe : son code lui est donné par le directeur.");
      const { actuel, nouveau } = ChangementMotDePasse.parse(req.body);
      const ctx = { lieuId: auth.lieuId, utilisateurId: auth.utilisateurId };
      const empreinteActuelle = await base.transaction(ctx, async (c) => {
        const { rows } = await c.query<{ mot_de_passe_hash: string }>(
          "SELECT mot_de_passe_hash FROM utilisateur WHERE id = $1",
          [auth.utilisateurId],
        );
        return rows[0]?.mot_de_passe_hash ?? "";
      });
      if (!(await verifierMotDePasse(empreinteActuelle, actuel))) {
        throw new ErreurMetier(400, "Le mot de passe actuel est incorrect.");
      }
      const nouvelle = await hacherMotDePasse(nouveau);
      await base.transaction(ctx, async (c) => {
        await c.query("UPDATE utilisateur SET mot_de_passe_hash = $1 WHERE id = $2", [nouvelle, auth.utilisateurId]);
        // Les autres sessions ouvertes avec l'ancien mot de passe sont fermées.
        await c.query(
          "UPDATE session SET revoquee_le = now() WHERE utilisateur_id = $1 AND jeton_hash <> $2 AND revoquee_le IS NULL",
          [auth.utilisateurId, auth.jetonEmpreinte],
        );
        await inscrireJet(c, { lieuId: auth.lieuId, type: "mot_de_passe_modifie", utilisateurId: auth.utilisateurId });
      });
      return { ok: true };
    },
  );
}
