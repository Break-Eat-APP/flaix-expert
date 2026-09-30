import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { ROLES_EQUIPE, type AppareilCaisse, type Caissiere, type CodeCaissiere, type Employe, type EmployeCree } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { NOM_COOKIE_APPAREIL } from "../auth/contexte.ts";
import { genererCodeCaissiere, lireAppareil, nouveauJetonAppareil, poserCookieAppareil } from "../auth/appareil.ts";
import { hacherMotDePasse } from "../auth/secrets.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, contexte, corps, differences, texte, texteFacultatif } from "./outils.ts";

/*
 * Équipe → Fiches et Tablettes (dossier §15.100) : les caissières (nom + code personnel) et les
 * tablettes enregistrées comme caisse. Tout est réservé au directeur. Les fiches ne s'écrivent
 * qu'à travers les fonctions de la base (creer_caissiere…), qui ne savent créer et modifier que
 * des caissières : le serveur n'a aucun droit d'écriture libre sur les comptes.
 */

const NouvelleCaissiere = z.object({ nom: texte(60, "Le nom") });

// Fiches employés (§15.104, module 14). Taux horaire en centimes : coût chargé ou taux de l'agence.
const Statut = z.enum(["salarie", "interimaire"]);
const RoleEquipe = z.enum(ROLES_EQUIPE);
const TauxHoraire = z.number().int().min(0, "Taux horaire invalide.").max(100_000, "Taux horaire trop élevé.").nullable();
const NouvelEmploye = z.object({
  nom: texte(60, "Le nom"),
  statut: Statut.default("salarie"),
  agence: texteFacultatif(80),
  role: RoleEquipe.default("Caissier"),
  tauxHoraire: TauxHoraire.default(null),
  accesCaisse: z.boolean().default(false),
});
const ModifEmploye = z.object({
  nom: texte(60, "Le nom").optional(),
  statut: Statut.optional(),
  agence: texteFacultatif(80).optional(),
  role: RoleEquipe.optional(),
  tauxHoraire: TauxHoraire.optional(),
  actif: z.boolean().optional(),
});

interface LigneEmploye {
  id: string;
  nom: string;
  statut: "salarie" | "interimaire";
  agence: string | null;
  role: Employe["role"];
  taux_horaire_centimes: number | null;
  actif: boolean;
  utilisateur_id: string | null;
  acces_actif: boolean | null;
  code_bloque_jusqua: Date | null;
  derniere: Date | null;
}

async function lireEmployes(c: Client, lieuId: string): Promise<Employe[]> {
  const { rows } = await c.query<LigneEmploye>(
    `SELECT e.id, e.nom, e.statut, e.agence, e.role, e.taux_horaire_centimes, e.actif, e.utilisateur_id,
            (m.actif AND u.actif) AS acces_actif, m.code_bloque_jusqua,
            (SELECT max(s.cree_le) FROM session s WHERE s.utilisateur_id = e.utilisateur_id AND s.lieu_id = e.lieu_id) AS derniere
       FROM employe e
       LEFT JOIN membre m ON m.lieu_id = e.lieu_id AND m.utilisateur_id = e.utilisateur_id
       LEFT JOIN utilisateur u ON u.id = e.utilisateur_id
      WHERE e.lieu_id = $1
      ORDER BY e.actif DESC, lower(e.nom)`,
    [lieuId],
  );
  const maintenant = Date.now();
  return rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    statut: r.statut,
    agence: r.agence,
    role: r.role,
    tauxHoraire: r.taux_horaire_centimes,
    actif: r.actif,
    acces: r.utilisateur_id
      ? {
          caissiereId: r.utilisateur_id,
          actif: !!r.acces_actif,
          bloqueeJusqua: r.code_bloque_jusqua && r.code_bloque_jusqua.getTime() > maintenant ? r.code_bloque_jusqua.toISOString() : null,
          derniereConnexion: r.derniere ? r.derniere.toISOString() : null,
        }
      : null,
  }));
}

async function lireEmploye(c: Client, lieuId: string, id: string): Promise<Employe> {
  const e = (await lireEmployes(c, lieuId)).find((x) => x.id === id);
  if (!e) throw introuvable("Fiche employé");
  return e;
}

/** Donne (ou redonne) l'accès caisse d'un employé : compte caissière relié, nouveau code remis une fois. */
async function donnerAcces(c: Client, lieuId: string, e: Employe, empreinte: string): Promise<void> {
  if (!e.acces) {
    const { rows } = await c.query<{ id: string }>("SELECT creer_caissiere($1, $2) AS id", [e.nom, empreinte]);
    await c.query("UPDATE employe SET utilisateur_id = $3 WHERE lieu_id = $1 AND id = $2", [lieuId, e.id, rows[0]!.id]);
  } else {
    await c.query("SELECT modifier_caissiere($1, $2, true)", [e.acces.caissiereId, e.nom]);
    await c.query("SELECT changer_code_caissiere($1, $2)", [e.acces.caissiereId, empreinte]);
  }
}

/** Coupe l'accès caisse : le compte reste (ses tickets le référencent), ses connexions sont fermées. */
async function couperAcces(c: Client, lieuId: string, e: Employe): Promise<void> {
  if (!e.acces) return;
  await c.query("SELECT modifier_caissiere($1, $2, false)", [e.acces.caissiereId, e.nom]);
  await c.query("UPDATE session SET revoquee_le = now() WHERE utilisateur_id = $1 AND lieu_id = $2 AND revoquee_le IS NULL", [e.acces.caissiereId, lieuId]);
}
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
    formation: boolean;
  }>(
    `SELECT a.id, a.caisse_id, k.numero, k.nom AS caisse_nom, s.nom AS stand_nom, u.nom AS enregistre_par, a.enregistre_le, a.retire_le, a.formation,
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
    formation: r.formation,
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
      await c.query("INSERT INTO employe (lieu_id, nom, role, utilisateur_id) VALUES ($1, $2, 'Caissier', $3)", [auth.lieuId, nom, id]);
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
      // La fiche employé reliée suit le nom (une seule identité par personne).
      if (demande.nom) await c.query("UPDATE employe SET nom = $3 WHERE lieu_id = $1 AND utilisateur_id = $2", [auth.lieuId, id, demande.nom]);
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

  // ---------- Fiches employés (§15.104) ----------
  app.get("/api/equipe/employes", async (req): Promise<Employe[]> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireEmployes(c, auth.lieuId));
  });

  app.post("/api/equipe/employes", async (req, rep): Promise<EmployeCree> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouvelEmploye, req);
    const agence = d.statut === "interimaire" ? d.agence : null;
    const code = d.accesCaisse ? genererCodeCaissiere() : null;
    const empreinte = code ? await hacherMotDePasse(code) : null;
    const resultat = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO employe (lieu_id, nom, statut, agence, role, taux_horaire_centimes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [auth.lieuId, d.nom, d.statut, agence, d.role, d.tauxHoraire],
      );
      const id = rows[0]!.id;
      if (empreinte) await donnerAcces(c, auth.lieuId, await lireEmploye(c, auth.lieuId, id), empreinte);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "employe_cree",
        utilisateurId: auth.utilisateurId,
        details: { employe: id, nom: d.nom, statut: d.statut, agence, role: d.role, tauxHoraire: d.tauxHoraire, accesCaisse: d.accesCaisse },
      });
      return { employe: await lireEmploye(c, auth.lieuId, id), code };
    });
    rep.code(201);
    return resultat;
  });

  app.patch("/api/equipe/employes/:id", async (req): Promise<Employe[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(ModifEmploye, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireEmploye(c, auth.lieuId, id);
      const statut = d.statut ?? avant.statut;
      const apres = {
        nom: d.nom ?? avant.nom,
        statut,
        agence: statut === "interimaire" ? (d.agence !== undefined ? d.agence : avant.agence) : null,
        role: d.role ?? avant.role,
        tauxHoraire: d.tauxHoraire !== undefined ? d.tauxHoraire : avant.tauxHoraire,
        actif: d.actif ?? avant.actif,
      };
      const diff = differences({ nom: avant.nom, statut: avant.statut, agence: avant.agence, role: avant.role, tauxHoraire: avant.tauxHoraire, actif: avant.actif }, apres);
      if (Object.keys(diff).length === 0) return lireEmployes(c, auth.lieuId);
      await c.query(
        "UPDATE employe SET nom = $3, statut = $4, agence = $5, role = $6, taux_horaire_centimes = $7, actif = $8 WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id, apres.nom, apres.statut, apres.agence, apres.role, apres.tauxHoraire, apres.actif],
      );
      // Le compte caissière relié suit le nom ; une fiche désactivée perd son accès caisse.
      if (avant.acces && apres.nom !== avant.nom) await c.query("SELECT modifier_caissiere($1, $2, $3)", [avant.acces.caissiereId, apres.nom, avant.acces.actif && apres.actif]);
      if (avant.acces?.actif && !apres.actif) await couperAcces(c, auth.lieuId, { ...avant, nom: apres.nom });
      await inscrireJet(c, { lieuId: auth.lieuId, type: "employe_modifie", utilisateurId: auth.utilisateurId, details: { employe: id, nom: avant.nom, changements: diff } });
      return lireEmployes(c, auth.lieuId);
    });
  });

  app.post("/api/equipe/employes/:id/acces", async (req): Promise<EmployeCree> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const code = genererCodeCaissiere();
    const empreinte = await hacherMotDePasse(code);
    return base.transaction(contexte(auth), async (c) => {
      const e = await lireEmploye(c, auth.lieuId, id);
      if (!e.actif) throw new ErreurMetier(409, "Cette fiche est inactive : réactive-la avant de donner un accès caisse.");
      await donnerAcces(c, auth.lieuId, e, empreinte);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "acces_caisse_donne", utilisateurId: auth.utilisateurId, details: { employe: id, nom: e.nom } });
      return { employe: await lireEmploye(c, auth.lieuId, id), code };
    });
  });

  app.post("/api/equipe/employes/:id/acces/retrait", async (req): Promise<Employe[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const e = await lireEmploye(c, auth.lieuId, id);
      if (!e.acces?.actif) return lireEmployes(c, auth.lieuId);
      await couperAcces(c, auth.lieuId, e);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "acces_caisse_retire", utilisateurId: auth.utilisateurId, details: { employe: id, nom: e.nom } });
      return lireEmployes(c, auth.lieuId);
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

  // Mode formation d'une tablette (§15.109) : la session en cours sur la tablette est fermée d'office
  // (la base n'accepte plus qu'une session du nouveau mode) ; la caissière se reconnecte.
  app.post("/api/appareils/:id/formation", async (req): Promise<AppareilCaisse[]> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { formation } = corps(z.object({ formation: z.boolean() }), req);
    const ici = await idAppareil(base, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ caisse_id: string; numero: number; formation: boolean; retire_le: Date | null; ouverte: boolean }>(
        `SELECT a.caisse_id, k.numero, a.formation, a.retire_le,
                EXISTS (SELECT 1 FROM session_caisse sc WHERE sc.lieu_id = a.lieu_id AND sc.caisse_id = a.caisse_id AND sc.fermee_le IS NULL) AS ouverte
           FROM appareil_caisse a JOIN caisse k ON k.lieu_id = a.lieu_id AND k.id = a.caisse_id
          WHERE a.lieu_id = $1 AND a.id = $2`,
        [auth.lieuId, id],
      );
      const a = rows[0];
      if (!a || a.retire_le) throw introuvable("Tablette");
      if (a.formation !== formation) {
        // Une caisse ouverte pour de vrai ne bascule pas en formation au milieu du service.
        if (formation && a.ouverte) throw new ErreurMetier(409, `La caisse ${a.numero} est ouverte : clôture-la avant de mettre sa tablette en formation.`);
        await c.query("UPDATE appareil_caisse SET formation = $3 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, formation]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: formation ? "tablette_formation_activee" : "tablette_formation_desactivee",
          utilisateurId: auth.utilisateurId,
          caisseId: a.caisse_id,
          details: { caisse: a.numero, appareil: id },
        });
      }
      return lireAppareils(c, auth.lieuId, ici);
    });
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
