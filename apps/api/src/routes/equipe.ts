import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AppareilCaisse, Caissiere, CodeCaissiere } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { NOM_COOKIE_APPAREIL } from "../auth/contexte.ts";
import { genererCodeCaissiere, lireAppareil, nouveauJetonAppareil, poserCookieAppareil } from "../auth/appareil.ts";
import { hacherMotDePasse } from "../auth/secrets.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps, differences, texte } from "./outils.ts";

/*
 * Équipe → Fiches et Tablettes (dossier §15.100) : les caissières (nom + code personnel) et les
 * tablettes enregistrées comme caisse. Tout est réservé au directeur. Les fiches ne s'écrivent
 * qu'à travers les fonctions de la base (creer_caissiere…), qui ne savent créer et modifier que
 * des caissières : le serveur n'a aucun droit d'écriture libre sur les comptes.
 */

const NouvelleCaissiere = z.object({ nom: texte(60, "Le nom") });
const ModificationCaissiere = z.object({ nom: texte(60, "Le nom").optional(), actif: z.boolean().optional() });

async function lireCaissieres(c: Client, lieuId: string): Promise<Caissiere[]> {
  const { rows } = await c.query<{ id: string; nom: string; actif: boolean; code_bloque_jusqua: Date | null; derniere: Date | null }>(
    `SELECT u.id, u.nom, (m.actif AND u.actif) AS actif, m.code_bloque_jusqua,
            (SELECT max(s.cree_le) FROM session s WHERE s.utilisateur_id = u.id AND s.lieu_id = m.lieu_id) AS derniere
       FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
      WHERE m.lieu_id = $1 AND m.role = 'operateur'
      ORDER BY (m.actif AND u.actif) DESC, lower(u.nom)`,
    [lieuId],
  );
  const maintenant = Date.now();
  return rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    actif: r.actif,
    bloqueeJusqua: r.code_bloque_jusqua && r.code_bloque_jusqua.getTime() > maintenant ? r.code_bloque_jusqua.toISOString() : null,
    derniereConnexion: r.derniere ? r.derniere.toISOString() : null,
  }));
}

async function lireCaissiere(c: Client, lieuId: string, id: string): Promise<Caissiere> {
  const fiche = (await lireCaissieres(c, lieuId)).find((x) => x.id === id);
  if (!fiche) throw introuvable("Fiche de caissière");
  return fiche;
}

async function lireAppareils(c: Client, lieuId: string, cetAppareil: string | null): Promise<AppareilCaisse[]> {
  const { rows } = await c.query<{
    id: string;
    caisse_id: string;
    numero: number;
    caisse_nom: string | null;
    stand_nom: string;
    enregistre_par: string;
    enregistre_le: Date;
    retire_le: Date | null;
    derniere: Date | null;
  }>(
    `SELECT a.id, a.caisse_id, k.numero, k.nom AS caisse_nom, s.nom AS stand_nom, u.nom AS enregistre_par, a.enregistre_le, a.retire_le,
            (SELECT max(se.cree_le) FROM session se WHERE se.appareil_id = a.id) AS derniere
       FROM appareil_caisse a
       JOIN caisse k ON k.lieu_id = a.lieu_id AND k.id = a.caisse_id
       JOIN stand s ON s.lieu_id = k.lieu_id AND s.id = k.stand_id
       JOIN utilisateur u ON u.id = a.enregistre_par
      WHERE a.lieu_id = $1
      ORDER BY (a.retire_le IS NULL) DESC, k.numero, a.enregistre_le DESC
      LIMIT 100`,
    [lieuId],
  );
  return rows.map((r) => ({
    id: r.id,
    caisseId: r.caisse_id,
    caisseNumero: r.numero,
    caisseNom: r.caisse_nom,
    standNom: r.stand_nom,
    enregistrePar: r.enregistre_par,
    enregistreLe: r.enregistre_le.toISOString(),
    retireLe: r.retire_le ? r.retire_le.toISOString() : null,
    derniereConnexion: r.derniere ? r.derniere.toISOString() : null,
    cetAppareil: r.id === cetAppareil,
  }));
}

/** Retire une tablette et ferme aussitôt les connexions des caissières qui s'y trouvent. */
async function retirerAppareil(c: Client, lieuId: string, utilisateurId: string, appareilId: string, raison: string): Promise<void> {
  const { rows } = await c.query<{ numero: number; caisse_id: string }>(
    `UPDATE appareil_caisse a SET retire_le = now(), retire_par = $3
       FROM caisse k
      WHERE a.lieu_id = $1 AND a.id = $2 AND a.retire_le IS NULL AND k.lieu_id = a.lieu_id AND k.id = a.caisse_id
      RETURNING k.numero, a.caisse_id`,
    [lieuId, appareilId, utilisateurId],
  );
  const r = rows[0];
  if (!r) return;
  await c.query("UPDATE session SET revoquee_le = now() WHERE appareil_id = $1 AND revoquee_le IS NULL", [appareilId]);
  await inscrireJet(c, { lieuId, type: "appareil_retire", utilisateurId, caisseId: r.caisse_id, details: { caisse: r.numero, raison } });
}

const idAppareil = async (base: Base, req: FastifyRequest) => (await lireAppareil(base, req))?.id ?? null;

export async function routesEquipe(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Fiches des caissières ----------
  app.get("/api/equipe/caissieres", async (req): Promise<Caissiere[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireCaissieres(c, auth.lieuId));
  });

  app.post("/api/equipe/caissieres", async (req, rep): Promise<CodeCaissiere> => {
    const auth = await exigerDirecteur(req, base);
    const { nom } = corps(NouvelleCaissiere, req);
    const code = genererCodeCaissiere();
    const empreinte = await hacherMotDePasse(code);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>("SELECT creer_caissiere($1, $2) AS id", [nom, empreinte]);
      const id = rows[0]!.id;
      await inscrireJet(c, { lieuId: auth.lieuId, type: "caissiere_creee", utilisateurId: auth.utilisateurId, details: { caissiere: id, nom } });
      return { caissiere: await lireCaissiere(c, auth.lieuId, id), code };
    });
    rep.code(201);
    return resultat;
  });

  app.patch("/api/equipe/caissieres/:id", async (req): Promise<Caissiere[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModificationCaissiere, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireCaissiere(c, auth.lieuId, id);
      const diff = differences({ nom: avant.nom, actif: avant.actif }, demande);
      if (Object.keys(diff).length === 0) return lireCaissieres(c, auth.lieuId);
      await c.query("SELECT modifier_caissiere($1, $2, $3)", [id, demande.nom ?? avant.nom, demande.actif ?? avant.actif]);
      // Fiche désactivée : ses connexions ouvertes sont fermées tout de suite.
      if (demande.actif === false) {
        await c.query("UPDATE session SET revoquee_le = now() WHERE utilisateur_id = $1 AND lieu_id = $2 AND revoquee_le IS NULL", [id, auth.lieuId]);
      }
      await inscrireJet(c, { lieuId: auth.lieuId, type: "caissiere_modifiee", utilisateurId: auth.utilisateurId, details: { caissiere: id, nom: avant.nom, changements: diff } });
      return lireCaissieres(c, auth.lieuId);
    });
  });

  app.post("/api/equipe/caissieres/:id/code", async (req): Promise<CodeCaissiere> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const code = genererCodeCaissiere();
    const empreinte = await hacherMotDePasse(code);
    return base.transaction(contexte(auth), async (c) => {
      const fiche = await lireCaissiere(c, auth.lieuId, id);
      await c.query("SELECT changer_code_caissiere($1, $2)", [id, empreinte]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "code_caissiere_renouvele", utilisateurId: auth.utilisateurId, details: { caissiere: id, nom: fiche.nom } });
      return { caissiere: await lireCaissiere(c, auth.lieuId, id), code };
    });
  });

  // ---------- Tablettes enregistrées comme caisse ----------
  app.get("/api/appareils", async (req): Promise<AppareilCaisse[]> => {
    const auth = await exigerDirecteur(req, base);
    const ici = await idAppareil(base, req);
    return base.transaction(contexte(auth), (c) => lireAppareils(c, auth.lieuId, ici));
  });

  // Se fait SUR la tablette : c'est elle qui reçoit le jeton, dans un cookie protégé.
  app.post("/api/caisses/:id/appareil", async (req, rep): Promise<AppareilCaisse[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const precedent = await lireAppareil(base, req);
    const { jeton, empreinte } = nouveauJetonAppareil();
    const resultat = await base.transaction(contexte(auth), async (c) => {
      const { rows: caisse } = await c.query<{ numero: number; actif: boolean; stand_actif: boolean }>(
        "SELECT k.numero, k.actif, s.actif AS stand_actif FROM caisse k JOIN stand s ON s.lieu_id = k.lieu_id AND s.id = k.stand_id WHERE k.lieu_id = $1 AND k.id = $2",
        [auth.lieuId, id],
      );
      const k = caisse[0];
      if (!k) throw introuvable("Caisse");
      if (!k.actif || !k.stand_actif) throw new ErreurMetier(409, "Cette caisse ou son stand est désactivé.");
      // Un appareil n'est la tablette que d'une seule caisse : l'ancien enregistrement est retiré.
      if (precedent && precedent.lieuId === auth.lieuId) await retirerAppareil(c, auth.lieuId, auth.utilisateurId, precedent.id, `remplacé par la caisse ${k.numero}`);
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO appareil_caisse (lieu_id, caisse_id, jeton_empreinte, enregistre_par) VALUES ($1, $2, $3, $4) RETURNING id",
        [auth.lieuId, id, empreinte, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "appareil_enregistre", utilisateurId: auth.utilisateurId, caisseId: id, details: { caisse: k.numero, appareil: rows[0]!.id } });
      return lireAppareils(c, auth.lieuId, rows[0]!.id);
    });
    poserCookieAppareil(rep, jeton);
    return resultat;
  });

  app.post("/api/appareils/:id/retrait", async (req, rep): Promise<AppareilCaisse[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const ici = await idAppareil(base, req);
    const liste = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query("SELECT 1 FROM appareil_caisse WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      if (!rows[0]) throw introuvable("Tablette");
      await retirerAppareil(c, auth.lieuId, auth.utilisateurId, id, "retirée par le directeur");
      return lireAppareils(c, auth.lieuId, ici === id ? null : ici);
    });
    if (ici === id) rep.clearCookie(NOM_COOKIE_APPAREIL, { path: "/" });
    return liste;
  });
}
