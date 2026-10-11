import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  estJour,
  formaterTemperature,
  huileConforme,
  libelleLimites,
  limitesEquipement,
  receptionConforme,
  temperatureConforme,
  type ControleHuile,
  type ControleReception,
  type EquipementHygiene,
  type Hygiene,
  type RegistreHygiene,
  type ReleveTemperature,
  type SorteEquipement,
  type TacheFaite,
  type TacheHygiene,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur, exigerSession, refuserEcritureSupport, type Authentification } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps, texte } from "./outils.ts";

/*
 * Hygiène et HACCP (dossier §15.156) : réglages (équipements, tâches) et registre en écriture seule (relevés de
 * température, tâches faites, contrôles à réception, huile de friture). La conformité est calculée ici, jamais
 * déclarée ; une non-conformité exige son action corrective. Les réglages sont journalisés ; le registre est
 * lui-même la trace (qui, quand, quoi).
 * La journée (relevés, tâches, réceptions avec photo, huile) se remplit aussi depuis la tablette d'une caisse, par la
 * caissière connectée (§15.159) ; réglages et registre restent au directeur.
 */

/** Directeur, ou caissière connectée sur une tablette enregistrée ; le support FlaiX Expert lit seulement. */
async function exigerEquipe(req: FastifyRequest, base: Base): Promise<Authentification> {
  const auth = exigerSession(req);
  if (auth.role === "operateur" && auth.appareilId) return auth;
  if (auth.role === "support" && req.method !== "GET") return refuserEcritureSupport(req, base, auth);
  return exigerDirecteur(req, base);
}

/** Photo de l'étiquette : JPEG réduit par l'écran, 2 Mo au plus. */
function lirePhoto(base64: string | null): Buffer | null {
  if (base64 === null) return null;
  const octets = Buffer.from(base64, "base64");
  if (octets.length < 100 || octets.length > 2_000_000) throw new ErreurMetier(400, "Photo illisible ou trop lourde (2 Mo au plus).");
  if (octets[0] !== 0xff || octets[1] !== 0xd8 || octets[2] !== 0xff) throw new ErreurMetier(400, "La photo doit être une image JPEG.");
  return octets;
}

const Temperature = z.number().int().min(-500, "Température hors limites.").max(1500, "Température hors limites.");
const Action = z.string().trim().min(3, "Décris l'action corrective (3 caractères au moins).").max(500).nullable().default(null);
const NouvelEquipement = z.object({
  nom: texte(60, "Le nom de l'équipement"),
  standId: Uuid.nullable().default(null),
  sorte: z.enum(["froid", "surgele", "chaud", "friteuse"]),
  minDixiemes: Temperature.nullable().default(null),
  maxDixiemes: Temperature.nullable().default(null),
});
const ModifEquipement = z.object({
  nom: texte(60, "Le nom de l'équipement").optional(),
  standId: Uuid.nullable().optional(),
  minDixiemes: Temperature.nullable().optional(),
  maxDixiemes: Temperature.nullable().optional(),
  actif: z.boolean().optional(),
});
const NouvelleTache = z.object({ nom: texte(120, "La tâche"), standId: Uuid.nullable().default(null), moment: z.enum(["ouverture", "fermeture", "semaine"]) });
const ModifTache = z.object({ nom: texte(120, "La tâche").optional(), moment: z.enum(["ouverture", "fermeture", "semaine"]).optional(), actif: z.boolean().optional() });
const Releve = z.object({ equipementId: Uuid, moment: z.enum(["ouverture", "fermeture", "autre"]), temperatureDixiemes: Temperature, actionCorrective: Action });
const Fait = z.object({ commentaire: z.string().trim().min(1).max(500).nullable().default(null) });
const Reception = z.object({
  fournisseur: texte(120, "Le fournisseur"),
  produits: texte(300, "Les produits reçus"),
  type: z.enum(["frais", "surgele", "sec"]),
  temperatureDixiemes: Temperature.nullable().default(null),
  dlcOk: z.boolean(),
  emballageOk: z.boolean(),
  actionCorrective: Action,
  photo: z.string().max(2_800_000).nullable().default(null),
});
const Huile = z.object({ equipementId: Uuid, action: z.enum(["controle", "changement"]), polairesDixiemes: z.number().int().min(0).max(1000).nullable().default(null), actionCorrective: Action });
const Jour = z.string().refine(estJour, "Date invalide (AAAA-MM-JJ).");

const jourDeParis = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
/** Bornes d'une journée ou d'une période de Paris, en SQL. */
const ENTRE = (col: string) => `${col} >= ($2::date)::timestamp AT TIME ZONE 'Europe/Paris' AND ${col} < ($3::date + 1)::timestamp AT TIME ZONE 'Europe/Paris'`;

async function equipements(c: Client, lieuId: string): Promise<EquipementHygiene[]> {
  const { rows } = await c.query<{ id: string; nom: string; stand_id: string | null; sorte: SorteEquipement; min_dixiemes: number | null; max_dixiemes: number | null; actif: boolean }>(
    "SELECT id, nom, stand_id, sorte, min_dixiemes, max_dixiemes, actif FROM hygiene_equipement WHERE lieu_id = $1 ORDER BY actif DESC, lower(nom)",
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, nom: r.nom, standId: r.stand_id, sorte: r.sorte, minDixiemes: r.min_dixiemes, maxDixiemes: r.max_dixiemes, actif: r.actif }));
}

async function taches(c: Client, lieuId: string): Promise<TacheHygiene[]> {
  const { rows } = await c.query<{ id: string; nom: string; stand_id: string | null; moment: TacheHygiene["moment"]; actif: boolean }>(
    "SELECT id, nom, stand_id, moment, actif FROM hygiene_tache WHERE lieu_id = $1 ORDER BY actif DESC, moment, lower(nom)",
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, nom: r.nom, standId: r.stand_id, moment: r.moment, actif: r.actif }));
}

async function releves(c: Client, lieuId: string, du: string, au: string): Promise<ReleveTemperature[]> {
  const { rows } = await c.query<{ id: string; equipement_id: string; equipement: string; moment: ReleveTemperature["moment"]; t: number; conforme: boolean; action: string | null; par: string; le: Date }>(
    `SELECT r.id, r.equipement_id, e.nom AS equipement, r.moment, r.temperature_dixiemes AS t, r.conforme, r.action_corrective AS action, u.nom AS par, r.saisi_le AS le
       FROM hygiene_releve r JOIN hygiene_equipement e ON e.lieu_id = r.lieu_id AND e.id = r.equipement_id JOIN utilisateur u ON u.id = r.saisi_par
      WHERE r.lieu_id = $1 AND ${ENTRE("r.saisi_le")} ORDER BY r.saisi_le DESC`,
    [lieuId, du, au],
  );
  return rows.map((r) => ({ id: r.id, equipementId: r.equipement_id, equipement: r.equipement, moment: r.moment, temperatureDixiemes: r.t, conforme: r.conforme, actionCorrective: r.action, par: r.par, le: r.le.toISOString() }));
}

async function tachesFaites(c: Client, lieuId: string, du: string, au: string): Promise<TacheFaite[]> {
  const { rows } = await c.query<{ id: string; tache_id: string; tache: string; commentaire: string | null; par: string; le: Date }>(
    `SELECT f.id, f.tache_id, t.nom AS tache, f.commentaire, u.nom AS par, f.saisi_le AS le
       FROM hygiene_tache_faite f JOIN hygiene_tache t ON t.lieu_id = f.lieu_id AND t.id = f.tache_id JOIN utilisateur u ON u.id = f.saisi_par
      WHERE f.lieu_id = $1 AND ${ENTRE("f.saisi_le")} ORDER BY f.saisi_le DESC`,
    [lieuId, du, au],
  );
  return rows.map((r) => ({ id: r.id, tacheId: r.tache_id, tache: r.tache, commentaire: r.commentaire, par: r.par, le: r.le.toISOString() }));
}

async function receptions(c: Client, lieuId: string, du: string, au: string, limite = 10_000): Promise<ControleReception[]> {
  const { rows } = await c.query<{ id: string; fournisseur: string; produits: string; type: ControleReception["type"]; t: number | null; dlc_ok: boolean; emballage_ok: boolean; conforme: boolean; action: string | null; photo_id: string | null; par: string; le: Date }>(
    `SELECT r.id, r.fournisseur, r.produits, r.type, r.temperature_dixiemes AS t, r.dlc_ok, r.emballage_ok, r.conforme, r.action_corrective AS action,
            (SELECT p.id FROM hygiene_photo p WHERE p.lieu_id = r.lieu_id AND p.reception_id = r.id LIMIT 1) AS photo_id, u.nom AS par, r.saisi_le AS le
       FROM hygiene_reception r JOIN utilisateur u ON u.id = r.saisi_par
      WHERE r.lieu_id = $1 AND ${ENTRE("r.saisi_le")} ORDER BY r.saisi_le DESC LIMIT ${limite}`,
    [lieuId, du, au],
  );
  return rows.map((r) => ({
    id: r.id,
    fournisseur: r.fournisseur,
    produits: r.produits,
    type: r.type,
    temperatureDixiemes: r.t,
    dlcOk: r.dlc_ok,
    emballageOk: r.emballage_ok,
    conforme: r.conforme,
    actionCorrective: r.action,
    photoId: r.photo_id,
    par: r.par,
    le: r.le.toISOString(),
  }));
}

async function huiles(c: Client, lieuId: string, du: string, au: string, limite = 10_000): Promise<ControleHuile[]> {
  const { rows } = await c.query<{ id: string; equipement_id: string; equipement: string; action: ControleHuile["action"]; p: number | null; conforme: boolean; corrective: string | null; par: string; le: Date }>(
    `SELECT h.id, h.equipement_id, e.nom AS equipement, h.action, h.polaires_dixiemes AS p, h.conforme, h.action_corrective AS corrective, u.nom AS par, h.saisi_le AS le
       FROM hygiene_huile h JOIN hygiene_equipement e ON e.lieu_id = h.lieu_id AND e.id = h.equipement_id JOIN utilisateur u ON u.id = h.saisi_par
      WHERE h.lieu_id = $1 AND ${ENTRE("h.saisi_le")} ORDER BY h.saisi_le DESC LIMIT ${limite}`,
    [lieuId, du, au],
  );
  return rows.map((r) => ({ id: r.id, equipementId: r.equipement_id, equipement: r.equipement, action: r.action, polairesDixiemes: r.p, conforme: r.conforme, actionCorrective: r.corrective, par: r.par, le: r.le.toISOString() }));
}

const ilYA = (jours: number) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() - jours * 86_400_000));

/** Non-conformités des 7 derniers jours (températures, réceptions, huile). */
export async function nonConformesRecents(c: Client, lieuId: string): Promise<number> {
  const { rows } = await c.query<{ n: number }>(
    `SELECT ((SELECT count(*) FROM hygiene_releve WHERE lieu_id = $1 AND NOT conforme AND saisi_le > now() - interval '7 days')
           + (SELECT count(*) FROM hygiene_reception WHERE lieu_id = $1 AND NOT conforme AND saisi_le > now() - interval '7 days')
           + (SELECT count(*) FROM hygiene_huile WHERE lieu_id = $1 AND NOT conforme AND saisi_le > now() - interval '7 days'))::int AS n`,
    [lieuId],
  );
  return rows[0]!.n;
}

/** Événement en cours (ouvert), auquel les relevés du moment se rattachent. */
export async function evenementEnCours(c: Client, lieuId: string): Promise<{ id: string; libelle: string } | null> {
  const { rows } = await c.query<{ id: string; libelle: string }>("SELECT id, libelle FROM evenement WHERE lieu_id = $1 AND etat = 'ouvert' ORDER BY debut DESC LIMIT 1", [lieuId]);
  return rows[0] ?? null;
}

export async function hygiene(c: Client, lieuId: string): Promise<Hygiene> {
  const jour = jourDeParis();
  return {
    jour,
    evenement: await evenementEnCours(c, lieuId),
    equipements: await equipements(c, lieuId),
    taches: await taches(c, lieuId),
    relevesDuJour: await releves(c, lieuId, jour, jour),
    // Tâches faites aujourd'hui, et sur 7 jours pour celles de la semaine.
    tachesFaites: await tachesFaites(c, lieuId, ilYA(6), jour),
    receptions: await receptions(c, lieuId, ilYA(30), jour, 20),
    huiles: await huiles(c, lieuId, ilYA(60), jour, 20),
    nonConformes7j: await nonConformesRecents(c, lieuId),
  };
}

async function exigerEquipement(c: Client, lieuId: string, id: string): Promise<EquipementHygiene> {
  const e = (await equipements(c, lieuId)).find((x) => x.id === id);
  if (!e) throw introuvable("Équipement");
  return e;
}

async function exigerStand(c: Client, lieuId: string, standId: string | null | undefined): Promise<void> {
  if (!standId) return;
  const { rows } = await c.query("SELECT 1 FROM stand WHERE lieu_id = $1 AND id = $2", [lieuId, standId]);
  if (!rows[0]) throw introuvable("Stand");
}

export async function routesHygiene(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/hygiene", async (req): Promise<Hygiene> => {
    const auth = await exigerEquipe(req, base);
    return base.transaction(contexte(auth), (c) => hygiene(c, auth.lieuId));
  });

  // ---------- Réglages ----------
  app.post("/api/hygiene/equipements", async (req, rep): Promise<Hygiene> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouvelEquipement, req);
    if (d.minDixiemes !== null && d.maxDixiemes !== null && d.minDixiemes > d.maxDixiemes) throw new ErreurMetier(400, "La limite basse dépasse la limite haute.");
    const r = await base.transaction(contexte(auth), async (c) => {
      await exigerStand(c, auth.lieuId, d.standId);
      const { rows } = await c.query("SELECT 1 FROM hygiene_equipement WHERE lieu_id = $1 AND lower(nom) = lower($2)", [auth.lieuId, d.nom]);
      if (rows[0]) throw new ErreurMetier(409, `Un équipement s'appelle déjà « ${d.nom} ».`);
      await c.query("INSERT INTO hygiene_equipement (lieu_id, nom, stand_id, sorte, min_dixiemes, max_dixiemes, cree_par) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
        auth.lieuId,
        d.nom,
        d.standId,
        d.sorte,
        d.minDixiemes,
        d.maxDixiemes,
        auth.utilisateurId,
      ]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "hygiene_reglage", utilisateurId: auth.utilisateurId, details: { equipement: d.nom, sorte: d.sorte, limites: libelleLimites(limitesEquipement(d)) } });
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  app.patch("/api/hygiene/equipements/:id", async (req): Promise<Hygiene> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(ModifEquipement, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await exigerEquipement(c, auth.lieuId, id);
      await exigerStand(c, auth.lieuId, d.standId);
      const apres = { nom: d.nom ?? e.nom, standId: d.standId === undefined ? e.standId : d.standId, minDixiemes: d.minDixiemes === undefined ? e.minDixiemes : d.minDixiemes, maxDixiemes: d.maxDixiemes === undefined ? e.maxDixiemes : d.maxDixiemes, actif: d.actif ?? e.actif };
      if (apres.minDixiemes !== null && apres.maxDixiemes !== null && apres.minDixiemes > apres.maxDixiemes) throw new ErreurMetier(400, "La limite basse dépasse la limite haute.");
      if (apres.nom.toLowerCase() !== e.nom.toLowerCase()) {
        const { rows } = await c.query("SELECT 1 FROM hygiene_equipement WHERE lieu_id = $1 AND lower(nom) = lower($2) AND id <> $3", [auth.lieuId, apres.nom, id]);
        if (rows[0]) throw new ErreurMetier(409, `Un équipement s'appelle déjà « ${apres.nom} ».`);
      }
      await c.query("UPDATE hygiene_equipement SET nom = $3, stand_id = $4, min_dixiemes = $5, max_dixiemes = $6, actif = $7 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        apres.nom,
        apres.standId,
        apres.minDixiemes,
        apres.maxDixiemes,
        apres.actif,
      ]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "hygiene_reglage",
        utilisateurId: auth.utilisateurId,
        details: { equipement: e.nom, avant: { nom: e.nom, limites: libelleLimites(limitesEquipement(e)), actif: e.actif }, apres: { nom: apres.nom, limites: libelleLimites(limitesEquipement({ sorte: e.sorte, ...apres })), actif: apres.actif } },
      });
      return hygiene(c, auth.lieuId);
    });
  });

  app.post("/api/hygiene/taches", async (req, rep): Promise<Hygiene> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(NouvelleTache, req);
    const r = await base.transaction(contexte(auth), async (c) => {
      await exigerStand(c, auth.lieuId, d.standId);
      await c.query("INSERT INTO hygiene_tache (lieu_id, nom, stand_id, moment, cree_par) VALUES ($1, $2, $3, $4, $5)", [auth.lieuId, d.nom, d.standId, d.moment, auth.utilisateurId]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "hygiene_reglage", utilisateurId: auth.utilisateurId, details: { tache: d.nom, moment: d.moment } });
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  app.patch("/api/hygiene/taches/:id", async (req): Promise<Hygiene> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(ModifTache, req);
    return base.transaction(contexte(auth), async (c) => {
      const t = (await taches(c, auth.lieuId)).find((x) => x.id === id);
      if (!t) throw introuvable("Tâche");
      const apres = { nom: d.nom ?? t.nom, moment: d.moment ?? t.moment, actif: d.actif ?? t.actif };
      await c.query("UPDATE hygiene_tache SET nom = $3, moment = $4, actif = $5 WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, apres.nom, apres.moment, apres.actif]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "hygiene_reglage", utilisateurId: auth.utilisateurId, details: { tache: t.nom, avant: { nom: t.nom, moment: t.moment, actif: t.actif }, apres } });
      return hygiene(c, auth.lieuId);
    });
  });

  // ---------- Registre (écriture seule) ----------
  app.post("/api/hygiene/releves", async (req, rep): Promise<Hygiene> => {
    const auth = await exigerEquipe(req, base);
    const d = corps(Releve, req);
    const r = await base.transaction(contexte(auth), async (c) => {
      const e = await exigerEquipement(c, auth.lieuId, d.equipementId);
      if (!e.actif) throw new ErreurMetier(409, `« ${e.nom} » est désactivé.`);
      if (e.sorte === "friteuse") throw new ErreurMetier(400, "Pour une friteuse, enregistre le contrôle de l'huile.");
      const limites = limitesEquipement(e);
      const conforme = temperatureConforme(d.temperatureDixiemes, limites);
      if (!conforme && !d.actionCorrective)
        throw new ErreurMetier(400, `${formaterTemperature(d.temperatureDixiemes)} : hors limite (${libelleLimites(limites)}). Indique l'action corrective (produits jetés, réglage, réparation…).`);
      const ev = await evenementEnCours(c, auth.lieuId);
      await c.query(
        "INSERT INTO hygiene_releve (lieu_id, equipement_id, evenement_id, moment, temperature_dixiemes, conforme, action_corrective, saisi_par) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [auth.lieuId, e.id, ev?.id ?? null, d.moment, d.temperatureDixiemes, conforme, d.actionCorrective, auth.utilisateurId],
      );
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  app.post("/api/hygiene/taches/:id/fait", async (req, rep): Promise<Hygiene> => {
    const auth = await exigerEquipe(req, base);
    const { id } = ParamId.parse(req.params);
    const d = corps(Fait, req);
    const r = await base.transaction(contexte(auth), async (c) => {
      const t = (await taches(c, auth.lieuId)).find((x) => x.id === id);
      if (!t) throw introuvable("Tâche");
      if (!t.actif) throw new ErreurMetier(409, `« ${t.nom} » est désactivée.`);
      const ev = await evenementEnCours(c, auth.lieuId);
      await c.query("INSERT INTO hygiene_tache_faite (lieu_id, tache_id, evenement_id, commentaire, saisi_par) VALUES ($1, $2, $3, $4, $5)", [auth.lieuId, id, ev?.id ?? null, d.commentaire, auth.utilisateurId]);
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  app.post("/api/hygiene/receptions", { bodyLimit: 3 * 1024 * 1024 }, async (req, rep): Promise<Hygiene> => {
    const auth = await exigerEquipe(req, base);
    const d = corps(Reception, req);
    const photo = lirePhoto(d.photo);
    const conforme = receptionConforme(d);
    if (!conforme && !d.actionCorrective) throw new ErreurMetier(400, "Réception non conforme : indique l'action corrective (livraison refusée, produit retourné…).");
    const r = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO hygiene_reception (lieu_id, fournisseur, produits, type, temperature_dixiemes, dlc_ok, emballage_ok, conforme, action_corrective, saisi_par) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
        [auth.lieuId, d.fournisseur, d.produits, d.type, d.temperatureDixiemes, d.dlcOk, d.emballageOk, conforme, d.actionCorrective, auth.utilisateurId],
      );
      if (photo) await c.query("INSERT INTO hygiene_photo (lieu_id, reception_id, contenu, saisi_par) VALUES ($1, $2, $3, $4)", [auth.lieuId, rows[0]!.id, photo, auth.utilisateurId]);
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  app.post("/api/hygiene/huiles", async (req, rep): Promise<Hygiene> => {
    const auth = await exigerEquipe(req, base);
    const d = corps(Huile, req);
    if (d.action === "controle" && d.polairesDixiemes === null) throw new ErreurMetier(400, "Indique le taux de composés polaires mesuré.");
    const conforme = huileConforme(d.action, d.polairesDixiemes);
    if (!conforme && !d.actionCorrective) throw new ErreurMetier(400, "Huile au-delà de 25 % de composés polaires : elle doit être changée. Indique l'action corrective.");
    const r = await base.transaction(contexte(auth), async (c) => {
      const e = await exigerEquipement(c, auth.lieuId, d.equipementId);
      if (e.sorte !== "friteuse") throw new ErreurMetier(400, `« ${e.nom} » n'est pas une friteuse.`);
      await c.query("INSERT INTO hygiene_huile (lieu_id, equipement_id, action, polaires_dixiemes, conforme, action_corrective, saisi_par) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
        auth.lieuId,
        e.id,
        d.action,
        d.polairesDixiemes,
        conforme,
        d.actionCorrective,
        auth.utilisateurId,
      ]);
      return hygiene(c, auth.lieuId);
    });
    rep.code(201);
    return r;
  });

  // Photo d'une étiquette (§15.159).
  app.get("/api/hygiene/photos/:id", async (req, rep) => {
    const auth = await exigerEquipe(req, base);
    const { id } = ParamId.parse(req.params);
    const { rows } = await base.transaction(contexte(auth), (c) => c.query<{ contenu: Buffer }>("SELECT contenu FROM hygiene_photo WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]));
    if (!rows[0]) throw introuvable("Photo");
    return rep.header("cache-control", "private, max-age=86400").type("image/jpeg").send(rows[0].contenu);
  });

  // Registre d'une période (jours de Paris, bornes comprises), pour un contrôle sanitaire.
  app.get("/api/hygiene/registre", async (req): Promise<RegistreHygiene> => {
    const auth = await exigerDirecteur(req, base);
    const { du, au } = z.object({ du: Jour, au: Jour }).refine((p) => p.du <= p.au, "La fin précède le début.").parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ nom: string }>("SELECT nom FROM lieu WHERE id = $1", [auth.lieuId]);
      return {
        du,
        au,
        lieu: rows[0]!.nom,
        releves: await releves(c, auth.lieuId, du, au),
        taches: await tachesFaites(c, auth.lieuId, du, au),
        receptions: await receptions(c, auth.lieuId, du, au),
        huiles: await huiles(c, auth.lieuId, du, au),
      };
    });
  });
}
