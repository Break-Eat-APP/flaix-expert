import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { coutPlage, dureeMinutes, ROLES_EQUIPE, type Affectation, type Evenement, type MasseSalariale, type PlanningMatch, type RoleEquipe } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Équipe → Planning et Masse salariale (dossier §15.104, module 14). Réservé au directeur :
 * taux et coûts ne sont jamais envoyés à une caissière. Une affectation se modifie et se
 * retire ; chaque changement est inscrit au journal technique avec son avant/après.
 */

const Heure = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (format 18:30).");
const Role = z.enum(ROLES_EQUIPE);
const NouvelleAffectation = z.object({
  evenementId: Uuid,
  employeId: Uuid,
  standId: Uuid.nullable().default(null),
  caisseId: Uuid.nullable().default(null),
  role: Role.optional(),
  debutPrevu: Heure,
  finPrevu: Heure,
});
const ModifAffectation = z.object({
  standId: Uuid.nullable().optional(),
  caisseId: Uuid.nullable().optional(),
  role: Role.optional(),
  debutPrevu: Heure.optional(),
  finPrevu: Heure.optional(),
  debutReel: Heure.optional(),
  finReel: Heure.optional(),
});
const ParEvenement = z.object({ evenementId: Uuid.optional() });

interface LigneAffectation {
  id: string;
  evenement_id: string;
  employe_id: string;
  employe_nom: string;
  statut: "salarie" | "interimaire";
  agence: string | null;
  stand_id: string | null;
  stand_nom: string | null;
  caisse_id: string | null;
  caisse_numero: number | null;
  role: RoleEquipe;
  debut_prevu: string;
  fin_prevu: string;
  debut_reel: string;
  fin_reel: string;
  corrige_par: string | null;
  reel_corrige_le: Date | null;
  taux_horaire_centimes: number | null;
}

const SELECT_AFFECTATION = `
  SELECT a.id, a.evenement_id, a.employe_id, e.nom AS employe_nom, e.statut, e.agence, a.stand_id, s.nom AS stand_nom,
         a.caisse_id, k.numero AS caisse_numero, a.role,
         to_char(a.debut_prevu, 'HH24:MI') AS debut_prevu, to_char(a.fin_prevu, 'HH24:MI') AS fin_prevu,
         to_char(a.debut_reel, 'HH24:MI') AS debut_reel, to_char(a.fin_reel, 'HH24:MI') AS fin_reel,
         u.nom AS corrige_par, a.reel_corrige_le, a.taux_horaire_centimes
    FROM affectation a
    JOIN employe e ON e.lieu_id = a.lieu_id AND e.id = a.employe_id
    LEFT JOIN stand s ON s.lieu_id = a.lieu_id AND s.id = a.stand_id
    LEFT JOIN caisse k ON k.lieu_id = a.lieu_id AND k.id = a.caisse_id
    LEFT JOIN utilisateur u ON u.id = a.reel_corrige_par`;

function versAffectation(r: LigneAffectation): Affectation {
  return {
    id: r.id,
    employeId: r.employe_id,
    employeNom: r.employe_nom,
    statut: r.statut,
    agence: r.agence,
    standId: r.stand_id,
    standNom: r.stand_nom,
    caisseId: r.caisse_id,
    caisseNumero: r.caisse_numero,
    role: r.role,
    debutPrevu: r.debut_prevu,
    finPrevu: r.fin_prevu,
    debutReel: r.debut_reel,
    finReel: r.fin_reel,
    correction: r.corrige_par && r.reel_corrige_le ? { par: r.corrige_par, le: r.reel_corrige_le.toISOString() } : null,
    tauxHoraire: r.taux_horaire_centimes,
    minutesPrevues: dureeMinutes(r.debut_prevu, r.fin_prevu),
    minutesReelles: dureeMinutes(r.debut_reel, r.fin_reel),
    coutPrevu: coutPlage(r.debut_prevu, r.fin_prevu, r.taux_horaire_centimes),
    coutReel: coutPlage(r.debut_reel, r.fin_reel, r.taux_horaire_centimes),
  };
}

async function affectationsDuMatch(c: Client, lieuId: string, evenementId: string): Promise<Affectation[]> {
  const { rows } = await c.query<LigneAffectation>(
    `${SELECT_AFFECTATION} WHERE a.lieu_id = $1 AND a.evenement_id = $2 ORDER BY s.nom NULLS LAST, a.debut_prevu, lower(e.nom)`,
    [lieuId, evenementId],
  );
  return rows.map(versAffectation);
}

/** Totaux d'une liste d'affectations : la masse réelle n'existe que si aucun taux ne manque. */
export function totauxAffectations(liste: Affectation[]) {
  const manquants = liste.filter((a) => a.coutReel === null).length;
  const somme = (f: (a: Affectation) => boolean) => liste.filter(f).reduce((s, a) => s + (a.coutReel ?? 0), 0);
  return {
    masseReelle: manquants ? null : somme(() => true),
    massePrevue: manquants ? null : liste.reduce((s, a) => s + (a.coutPrevu ?? 0), 0),
    salaries: somme((a) => a.statut === "salarie"),
    interimaires: somme((a) => a.statut === "interimaire"),
    tauxManquants: manquants,
  };
}

/** Personnel d'un match pour Résultats → Finances (§15.104 point 5). */
export async function personnelDuMatch(c: Client, lieuId: string, evenementId: string) {
  const liste = await affectationsDuMatch(c, lieuId, evenementId);
  const t = totauxAffectations(liste);
  return { reel: t.masseReelle, affectations: liste.length, tauxManquants: t.tauxManquants };
}

async function planning(c: Client, lieuId: string, evenement: Evenement): Promise<PlanningMatch> {
  const affectations = await affectationsDuMatch(c, lieuId, evenement.id);
  return { evenement, affectations, ...totauxAffectations(affectations) };
}

async function lireLigne(c: Client, lieuId: string, id: string): Promise<LigneAffectation> {
  await c.query("SELECT 1 FROM affectation WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  const { rows } = await c.query<LigneAffectation>(`${SELECT_AFFECTATION} WHERE a.lieu_id = $1 AND a.id = $2`, [lieuId, id]);
  if (!rows[0]) throw introuvable("Affectation");
  return rows[0];
}

/** Le stand et la caisse doivent être ceux du lieu, la caisse rattachée au stand choisi. */
async function verifierPoste(c: Client, lieuId: string, standId: string | null, caisseId: string | null): Promise<void> {
  if (caisseId && !standId) throw new ErreurMetier(400, "Choisis le stand avant la caisse.");
  if (standId) {
    const { rows } = await c.query("SELECT 1 FROM stand WHERE lieu_id = $1 AND id = $2", [lieuId, standId]);
    if (!rows[0]) throw introuvable("Stand");
  }
  if (caisseId) {
    const { rows } = await c.query("SELECT 1 FROM caisse WHERE lieu_id = $1 AND id = $2 AND stand_id = $3", [lieuId, caisseId, standId]);
    if (!rows[0]) throw new ErreurMetier(400, "Cette caisse n'appartient pas au stand choisi.");
  }
}

export async function routesPlanning(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/planning", async (req): Promise<PlanningMatch | null> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const evts = await listerEvenements(c, auth.lieuId);
      // Par défaut : le match ouvert, sinon le prochain à venir, sinon le plus récent.
      const prochains = evts.filter((e) => e.etat === "a_venir").sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
      const e = evts.find((x) => x.id === evenementId) ?? evts.find((x) => x.etat === "ouvert") ?? prochains[0] ?? evts[0];
      return e ? planning(c, auth.lieuId, e) : null;
    });
  });

  app.post("/api/planning/affectations", async (req, rep): Promise<PlanningMatch> => {
    const auth = await exigerDirecteur(req, base);
    const a = corps(NouvelleAffectation, req);
    const resultat = await base.transaction(contexte(auth), async (c) => {
      const evenement = (await listerEvenements(c, auth.lieuId)).find((e) => e.id === a.evenementId);
      if (!evenement) throw introuvable("Match");
      const { rows } = await c.query<{ nom: string; role: RoleEquipe; taux: number | null; actif: boolean }>(
        "SELECT nom, role, taux_horaire_centimes AS taux, actif FROM employe WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, a.employeId],
      );
      const emp = rows[0];
      if (!emp) throw introuvable("Employé");
      if (!emp.actif) throw new ErreurMetier(409, "Cet employé est inactif : réactive sa fiche avant de l'affecter.");
      await verifierPoste(c, auth.lieuId, a.standId, a.caisseId);
      const role = a.role ?? emp.role;
      const { rows: cree } = await c.query<{ id: string }>(
        `INSERT INTO affectation (lieu_id, evenement_id, employe_id, stand_id, caisse_id, role, debut_prevu, fin_prevu, debut_reel, fin_reel, taux_horaire_centimes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $7, $8, $9) RETURNING id`,
        [auth.lieuId, a.evenementId, a.employeId, a.standId, a.caisseId, role, a.debutPrevu, a.finPrevu, emp.taux],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "affectation_creee",
        utilisateurId: auth.utilisateurId,
        standId: a.standId,
        caisseId: a.caisseId,
        details: { affectation: cree[0]!.id, match: evenement.libelle, employe: emp.nom, role, prevu: `${a.debutPrevu}-${a.finPrevu}`, tauxHoraire: emp.taux },
      });
      return planning(c, auth.lieuId, evenement);
    });
    rep.code(201);
    return resultat;
  });

  app.patch("/api/planning/affectations/:id", async (req): Promise<PlanningMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const m = corps(ModifAffectation, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireLigne(c, auth.lieuId, id);
      const standId = m.standId !== undefined ? m.standId : avant.stand_id;
      // Changer de stand sans préciser la caisse la remet à « non précisée ».
      const caisseId = m.caisseId !== undefined ? m.caisseId : m.standId !== undefined && m.standId !== avant.stand_id ? null : avant.caisse_id;
      await verifierPoste(c, auth.lieuId, standId, caisseId);
      const apres = {
        role: m.role ?? avant.role,
        debut_prevu: m.debutPrevu ?? avant.debut_prevu,
        fin_prevu: m.finPrevu ?? avant.fin_prevu,
        debut_reel: m.debutReel ?? avant.debut_reel,
        fin_reel: m.finReel ?? avant.fin_reel,
      };
      // Tant que le réel n'a jamais été corrigé, il suit le prévu.
      const reelCorrige = m.debutReel !== undefined || m.finReel !== undefined;
      if (!reelCorrige && !avant.reel_corrige_le) {
        apres.debut_reel = apres.debut_prevu;
        apres.fin_reel = apres.fin_prevu;
      }
      const changements: Record<string, { avant: unknown; apres: unknown }> = {};
      const noter = (cle: string, x: unknown, y: unknown) => {
        if (x !== y) changements[cle] = { avant: x, apres: y };
      };
      noter("stand", avant.stand_id, standId);
      noter("caisse", avant.caisse_id, caisseId);
      noter("role", avant.role, apres.role);
      noter("prevu", `${avant.debut_prevu}-${avant.fin_prevu}`, `${apres.debut_prevu}-${apres.fin_prevu}`);
      noter("reel", `${avant.debut_reel}-${avant.fin_reel}`, `${apres.debut_reel}-${apres.fin_reel}`);
      if (Object.keys(changements).length) {
        const corrige = reelCorrige && (apres.debut_reel !== avant.debut_reel || apres.fin_reel !== avant.fin_reel);
        await c.query(
          `UPDATE affectation SET stand_id = $3, caisse_id = $4, role = $5, debut_prevu = $6, fin_prevu = $7, debut_reel = $8, fin_reel = $9,
                  reel_corrige_par = CASE WHEN $10 THEN $11::uuid ELSE reel_corrige_par END,
                  reel_corrige_le = CASE WHEN $10 THEN now() ELSE reel_corrige_le END
            WHERE lieu_id = $1 AND id = $2`,
          [auth.lieuId, id, standId, caisseId, apres.role, apres.debut_prevu, apres.fin_prevu, apres.debut_reel, apres.fin_reel, corrige, auth.utilisateurId],
        );
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "affectation_modifiee",
          utilisateurId: auth.utilisateurId,
          standId,
          caisseId,
          details: { affectation: id, employe: avant.employe_nom, changements },
        });
      }
      const evenement = (await listerEvenements(c, auth.lieuId)).find((e) => e.id === avant.evenement_id)!;
      return planning(c, auth.lieuId, evenement);
    });
  });

  app.post("/api/planning/affectations/:id/retrait", async (req): Promise<PlanningMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const a = versAffectation(await lireLigne(c, auth.lieuId, id));
      const { rows } = await c.query<{ evenement_id: string }>("DELETE FROM affectation WHERE lieu_id = $1 AND id = $2 RETURNING evenement_id", [auth.lieuId, id]);
      // Le planning n'est pas un journal fiscal : l'affectation se retire, son contenu reste au journal technique.
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "affectation_retiree",
        utilisateurId: auth.utilisateurId,
        standId: a.standId,
        caisseId: a.caisseId,
        details: { affectation: id, employe: a.employeNom, role: a.role, prevu: `${a.debutPrevu}-${a.finPrevu}`, reel: `${a.debutReel}-${a.finReel}`, coutReel: a.coutReel },
      });
      const evenement = (await listerEvenements(c, auth.lieuId)).find((e) => e.id === rows[0]!.evenement_id)!;
      return planning(c, auth.lieuId, evenement);
    });
  });

  app.get("/api/equipe/masse-salariale", async (req): Promise<MasseSalariale> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const evts = await listerEvenements(c, auth.lieuId);
      const { rows } = await c.query<LigneAffectation>(`${SELECT_AFFECTATION} WHERE a.lieu_id = $1`, [auth.lieuId]);
      const toutes = rows.map((r) => ({ ...versAffectation(r), evenementId: r.evenement_id }));
      const parMatch = evts
        .map((e) => {
          const liste = toutes.filter((a) => a.evenementId === e.id);
          const t = totauxAffectations(liste);
          return { evenement: e, affectations: liste.length, salaries: t.salaries, interimaires: t.interimaires, total: t.salaries + t.interimaires, tauxManquants: t.tauxManquants };
        })
        .filter((x) => x.affectations > 0);
      const roles = new Map<string, number>();
      for (const a of toutes) roles.set(a.role, (roles.get(a.role) ?? 0) + (a.coutReel ?? 0));
      const salaries = parMatch.reduce((s, x) => s + x.salaries, 0);
      const interimaires = parMatch.reduce((s, x) => s + x.interimaires, 0);
      return {
        parMatch,
        parRole: ROLES_EQUIPE.map((r) => ({ role: r, total: roles.get(r) ?? 0 })),
        total: salaries + interimaires,
        salaries,
        interimaires,
      };
    });
  });
}
