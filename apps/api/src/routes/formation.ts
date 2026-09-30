import type { FastifyInstance } from "fastify";
import type { EtatFormation, SessionInfo } from "@flaix/domain";
import { changerLieu, type Base, type Client } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur, type Authentification } from "../auth/contexte.ts";
import { infoSession, nomDuLieu, poserCookieSession } from "../auth/routes.ts";
import { nouveauJetonSession } from "../auth/secrets.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { contexte } from "./outils.ts";

/**
 * Mode formation « FACTICE » (BOFiP §150, tests B3/B4 ; dossier §15.109).
 *
 * Le directeur entre dans le LIEU DE FORMATION jumeau de son lieu : un lieu à part entière,
 * isolé par la base comme n'importe quel autre, où la configuration du vrai lieu est recopiée
 * à chaque entrée. Tout ce qui s'y fait (ventes, clôtures, comptages) y reste : aucun compteur
 * du vrai lieu ne peut en être touché. Entrées, sorties et remises à zéro sont inscrites au
 * journal technique du vrai lieu. Les tablettes se mettent en formation depuis Équipe → Tablettes.
 */
async function ouvrirSession(c: Client, auth: Authentification, lieuId: string): Promise<{ jeton: string; expire: Date }> {
  const { jeton, empreinte } = nouveauJetonSession();
  const expire = new Date(Date.now() + config.dureeSessionHeures * 3_600_000);
  // L'ancienne session est fermée : une seule session par navigateur, dans un seul mode.
  await c.query("UPDATE session SET revoquee_le = now() WHERE jeton_hash = $1", [auth.jetonEmpreinte]);
  await c.query("INSERT INTO session (jeton_hash, utilisateur_id, lieu_id, role, expire_le) VALUES ($1, $2, $3, 'directeur', $4)", [
    empreinte,
    auth.utilisateurId,
    lieuId,
    expire,
  ]);
  return { jeton, expire };
}

export async function routesFormation(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/formation", async (req): Promise<EtatFormation> => {
    const auth = await exigerDirecteur(req, base);
    if (auth.formation) {
      return base.transaction(contexte(auth), async (c) => {
        const { rows } = await c.query<{ cree_le: Date }>("SELECT cree_le FROM lieu WHERE id = $1", [auth.lieuId]);
        return { enFormation: true, lieuFormation: { creeLe: rows[0]!.cree_le.toISOString() }, tablettesEnFormation: 0 };
      });
    }
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ cree_le: Date }>("SELECT cree_le FROM formation_du_lieu()");
      const { rows: t } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM appareil_caisse WHERE lieu_id = $1 AND formation AND retire_le IS NULL", [
        auth.lieuId,
      ]);
      return { enFormation: false, lieuFormation: rows[0] ? { creeLe: rows[0].cree_le.toISOString() } : null, tablettesEnFormation: t[0]!.n };
    });
  });

  app.post("/api/formation/entree", async (req, rep): Promise<SessionInfo> => {
    const auth = await exigerDirecteur(req, base);
    if (auth.formation) throw new ErreurMetier(409, "Tu es déjà en mode formation.");
    const { lieuId, session } = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ o_lieu: string; o_nouveau: boolean }>("SELECT * FROM entrer_formation()");
      const f = rows[0]!;
      const session = await ouvrirSession(c, auth, f.o_lieu);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "formation_entree", utilisateurId: auth.utilisateurId });
      await changerLieu(c, f.o_lieu);
      if (f.o_nouveau) await inscrireJet(c, { lieuId: f.o_lieu, type: "formation_ouverte", utilisateurId: auth.utilisateurId });
      await inscrireJet(c, { lieuId: f.o_lieu, type: "formation_entree", utilisateurId: auth.utilisateurId });
      return { lieuId: f.o_lieu, session };
    });
    poserCookieSession(rep, session.jeton, session.expire);
    return infoSession({ ...auth, lieuId, formation: true, appareilId: null, appareilCaisseId: null }, await nomDuLieu(base, lieuId, auth.utilisateurId));
  });

  app.post("/api/formation/sortie", async (req, rep): Promise<SessionInfo> => {
    const auth = await exigerDirecteur(req, base);
    if (!auth.formation) throw new ErreurMetier(409, "Tu n'es pas en mode formation.");
    const { lieuId, session } = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ formation_de: string }>("SELECT formation_de FROM lieu WHERE id = $1", [auth.lieuId]);
      const reel = rows[0]!.formation_de;
      // Ses propres fiches de membre sont visibles de partout : le rôle dans le vrai lieu est relu.
      const { rows: m } = await c.query("SELECT 1 FROM membre WHERE lieu_id = $1 AND utilisateur_id = $2 AND role = 'directeur' AND actif", [reel, auth.utilisateurId]);
      if (!m[0]) throw new ErreurMetier(403, "Tu n'es plus directeur de ce lieu.");
      await inscrireJet(c, { lieuId: auth.lieuId, type: "formation_sortie", utilisateurId: auth.utilisateurId });
      const session = await ouvrirSession(c, auth, reel);
      await changerLieu(c, reel);
      await inscrireJet(c, { lieuId: reel, type: "formation_sortie", utilisateurId: auth.utilisateurId });
      return { lieuId: reel, session };
    });
    poserCookieSession(rep, session.jeton, session.expire);
    return infoSession({ ...auth, lieuId, formation: false, appareilId: null, appareilCaisseId: null }, await nomDuLieu(base, lieuId, auth.utilisateurId));
  });

  // Recommencer : le lieu de formation est retiré (rien n'est effacé) ; la prochaine entrée en crée un neuf.
  app.post("/api/formation/remise-a-zero", async (req): Promise<EtatFormation> => {
    const auth = await exigerDirecteur(req, base);
    if (auth.formation) throw new ErreurMetier(409, "Quitte d'abord la formation pour la recommencer.");
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ ancien: string | null }>("SELECT recommencer_formation() AS ancien");
      if (!rows[0]!.ancien) throw new ErreurMetier(409, "Aucune formation à recommencer : elle est déjà vierge.");
      await inscrireJet(c, { lieuId: auth.lieuId, type: "formation_recommencee", utilisateurId: auth.utilisateurId, details: { lieu_formation: rows[0]!.ancien } });
      const { rows: t } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM appareil_caisse WHERE lieu_id = $1 AND formation AND retire_le IS NULL", [
        auth.lieuId,
      ]);
      return { enFormation: false, lieuFormation: null, tablettesEnFormation: t[0]!.n };
    });
  });
}
