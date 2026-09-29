import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Role, SessionInfo } from "@flaix/domain";
import type { Base } from "../base.ts";
import { config } from "../config.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { NOM_COOKIE, exigerSession } from "./contexte.ts";
import {
  LONGUEUR_MIN_MOT_DE_PASSE,
  empreinteLeurre,
  hacherMotDePasse,
  nouveauJetonSession,
  verifierMotDePasse,
} from "./secrets.ts";

const Connexion = z.object({
  email: z.string().trim().max(200),
  motDePasse: z.string().min(1).max(200),
});

const ChangementMotDePasse = z.object({
  actuel: z.string().min(1).max(200),
  nouveau: z
    .string()
    .min(LONGUEUR_MIN_MOT_DE_PASSE, `Le nouveau mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`)
    .max(200),
});

const identifiantsIncorrects = () => new ErreurMetier(401, "E-mail ou mot de passe incorrect.");

async function nomDuLieu(base: Base, lieuId: string, utilisateurId: string): Promise<string> {
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
          `SELECT lieu_id, role FROM membre
            WHERE utilisateur_id = $1 AND actif
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
      const membre = membres[0];
      if (!membre) throw new ErreurMetier(403, "Ce compte n'est rattaché à aucun lieu actif.");

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

      rep.setCookie(NOM_COOKIE, jeton, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: config.cookieSecurise,
        expires: expire,
      });
      return {
        utilisateur: { id: compte.id, nom: compte.nom, email: compte.email },
        lieu: { id: membre.lieu_id, nom: await nomDuLieu(base, membre.lieu_id, compte.id) },
        role: membre.role,
      };
    },
  );

  app.get("/api/auth/session", async (req): Promise<SessionInfo> => {
    const auth = exigerSession(req);
    return {
      utilisateur: { id: auth.utilisateurId, nom: auth.nom, email: auth.email },
      lieu: { id: auth.lieuId, nom: await nomDuLieu(base, auth.lieuId, auth.utilisateurId) },
      role: auth.role,
    };
  });

  app.post("/api/auth/deconnexion", async (req, rep) => {
    const auth = req.auth;
    if (auth) {
      await base.transaction({ lieuId: auth.lieuId, utilisateurId: auth.utilisateurId }, async (c) => {
        await c.query("UPDATE session SET revoquee_le = now() WHERE jeton_hash = $1", [auth.jetonEmpreinte]);
        await inscrireJet(c, { lieuId: auth.lieuId, type: "deconnexion", utilisateurId: auth.utilisateurId });
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
