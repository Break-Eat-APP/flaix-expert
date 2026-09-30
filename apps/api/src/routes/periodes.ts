import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  EMPREINTE_INITIALE,
  bornesMois,
  empreinteCloture,
  exerciceDe,
  formaterMontant,
  libelleMois,
  moisDeLExercice,
  moisParis,
  moisTermine,
  type ClotureVue,
  type EtatClotures,
  type Evenement,
  type NiveauCloture,
  type PeriodeACloturer,
  type TauxTvaPb,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { contexte, corps } from "./outils.ts";

/*
 * Clôtures de période (dossier §15.4, §15.27, §15.107) : Z du match (créé à la clôture du match),
 * clôture mensuelle, clôture de l'exercice. Chaque clôture est scellée et chaînée ; le total
 * perpétuel n'est jamais remis à zéro.
 */

const Mois = z.object({ mois: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mois invalide.") });
const Exercice = z.object({ premierMois: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Exercice invalide.") });
const ReglageExercice = z.object({ moisDebut: z.number().int().min(1).max(12) });

interface Totaux {
  tickets: number;
  annulations: number;
  totalTtc: number;
  especes: number;
  carte: number;
  ventilation: { tauxTva: TauxTvaPb; ht: number; tva: number; ttc: number }[];
  parCaisse: { caisseId: string; numero: number; total: number }[];
}

interface LigneCloture {
  id: string;
  sequence: number;
  niveau: NiveauCloture;
  evenement_id: string | null;
  debut: string;
  fin: string;
  total_ttc_centimes: number;
  perpetuel_avant_centimes: number;
  perpetuel_apres_centimes: number;
  details: Omit<Totaux, "parCaisse"> & { libelle: string; parCaisse: { caisseId: string; numero: number; total: number; perpetuel: number }[] };
  horodatage: Date;
  par: string;
  empreinte: string;
  empreinte_precedente: string;
}

const SELECT_CLOTURE = `
  SELECT cp.id, cp.sequence, cp.niveau, cp.evenement_id, to_char(cp.debut, 'YYYY-MM-DD') AS debut, to_char(cp.fin, 'YYYY-MM-DD') AS fin,
         cp.total_ttc_centimes, cp.perpetuel_avant_centimes, cp.perpetuel_apres_centimes, cp.details, cp.horodatage, u.nom AS par,
         cp.empreinte, cp.empreinte_precedente
    FROM cloture_periode cp JOIN utilisateur u ON u.id = cp.par`;

const versVue = (r: LigneCloture): ClotureVue => ({
  id: r.id,
  sequence: r.sequence,
  niveau: r.niveau,
  libelle: r.details.libelle,
  evenementId: r.evenement_id,
  debut: r.debut,
  fin: r.fin,
  totalTtc: r.total_ttc_centimes,
  perpetuelAvant: r.perpetuel_avant_centimes,
  perpetuelApres: r.perpetuel_apres_centimes,
  tickets: r.details.tickets,
  annulations: r.details.annulations,
  especes: r.details.especes,
  carte: r.details.carte,
  ventilation: r.details.ventilation,
  parCaisse: r.details.parCaisse,
  par: r.par,
  le: r.horodatage.toISOString(),
  empreinte: r.empreinte,
});

async function lireClotures(c: Client, lieuId: string): Promise<LigneCloture[]> {
  const { rows } = await c.query<LigneCloture>(`${SELECT_CLOTURE} WHERE cp.lieu_id = $1 ORDER BY cp.sequence`, [lieuId]);
  return rows;
}

/** Totaux d'un match lus dans le journal de caisse (ventes moins annulations) et ses lignes. */
async function totauxDuMatch(c: Client, lieuId: string, evenementId: string): Promise<Totaux> {
  const { rows: t } = await c.query<{ tickets: number; annulations: number; total: number; especes: number; carte: number }>(
    `SELECT count(*) FILTER (WHERE type = 'vente')::int AS tickets, count(*) FILTER (WHERE type = 'annulation')::int AS annulations,
            coalesce(sum(total_ttc_centimes), 0)::bigint AS total,
            coalesce(sum(total_ttc_centimes) FILTER (WHERE mode_reglement = 'especes'), 0)::bigint AS especes,
            coalesce(sum(total_ttc_centimes) FILTER (WHERE mode_reglement = 'carte'), 0)::bigint AS carte
       FROM journal_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND type IN ('vente', 'annulation')`,
    [lieuId, evenementId],
  );
  const { rows: taux } = await c.query<{ taux: TauxTvaPb; ht: number; tva: number; ttc: number }>(
    `SELECT l.taux_tva_pb AS taux, sum(l.ht_centimes)::bigint AS ht, sum(l.tva_centimes)::bigint AS tva, sum(l.net_ttc_centimes)::bigint AS ttc
       FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2 GROUP BY 1 ORDER BY 1`,
    [lieuId, evenementId],
  );
  const { rows: caisses } = await c.query<{ caisse_id: string; numero: number; total: number }>(
    `SELECT j.caisse_id, k.numero, sum(j.total_ttc_centimes)::bigint AS total
       FROM journal_caisse j JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id
      WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type IN ('vente', 'annulation') GROUP BY 1, 2 ORDER BY 2`,
    [lieuId, evenementId],
  );
  const r = t[0]!;
  return {
    tickets: r.tickets,
    annulations: r.annulations,
    totalTtc: r.total,
    especes: r.especes,
    carte: r.carte,
    ventilation: taux.map((x) => ({ tauxTva: x.taux, ht: x.ht, tva: x.tva, ttc: x.ttc })),
    parCaisse: caisses.map((x) => ({ caisseId: x.caisse_id, numero: x.numero, total: x.total })),
  };
}

/** Somme de plusieurs clôtures (les Z des matchs d'un mois, les mois d'un exercice). */
function additionner(liste: LigneCloture[]): Totaux {
  const taux = new Map<number, { tauxTva: TauxTvaPb; ht: number; tva: number; ttc: number }>();
  const caisses = new Map<string, { caisseId: string; numero: number; total: number }>();
  for (const l of liste) {
    for (const v of l.details.ventilation) {
      const x = taux.get(v.tauxTva) ?? { tauxTva: v.tauxTva, ht: 0, tva: 0, ttc: 0 };
      x.ht += v.ht;
      x.tva += v.tva;
      x.ttc += v.ttc;
      taux.set(v.tauxTva, x);
    }
    for (const k of l.details.parCaisse) {
      const x = caisses.get(k.caisseId) ?? { caisseId: k.caisseId, numero: k.numero, total: 0 };
      x.total += k.total;
      caisses.set(k.caisseId, x);
    }
  }
  return {
    tickets: liste.reduce((s, l) => s + l.details.tickets, 0),
    annulations: liste.reduce((s, l) => s + l.details.annulations, 0),
    totalTtc: liste.reduce((s, l) => s + l.total_ttc_centimes, 0),
    especes: liste.reduce((s, l) => s + l.details.especes, 0),
    carte: liste.reduce((s, l) => s + l.details.carte, 0),
    ventilation: [...taux.values()].sort((a, b) => a.tauxTva - b.tauxTva),
    parCaisse: [...caisses.values()].sort((a, b) => a.numero - b.numero),
  };
}

/**
 * Inscrit une clôture : perpétuel avant = celui de la dernière clôture du même niveau (0 sinon),
 * perpétuel de chaque caisse reporté et avancé, rang et empreinte chaînés sur la clôture précédente.
 */
async function inscrireCloture(
  c: Client,
  lieuId: string,
  utilisateurId: string,
  x: { niveau: NiveauCloture; evenementId: string | null; debut: string; fin: string; libelle: string; totaux: Totaux },
): Promise<void> {
  await verrouiller(c, `clotures:${lieuId}`);
  const toutes = await lireClotures(c, lieuId);
  const precedente = toutes.filter((l) => l.niveau === x.niveau).at(-1);
  const perpetuelAvant = precedente?.perpetuel_apres_centimes ?? 0;
  // Chaque caisse garde son propre perpétuel (C7) : une caisse ajoutée en cours de route part de zéro.
  type CaissePerpetuel = { caisseId: string; numero: number; total: number; perpetuel: number };
  const perpetuels = new Map<string, CaissePerpetuel>(((precedente?.details.parCaisse ?? []) as CaissePerpetuel[]).map((k) => [k.caisseId, { ...k, total: 0 }]));
  for (const k of x.totaux.parCaisse) {
    const avant = perpetuels.get(k.caisseId)?.perpetuel ?? 0;
    perpetuels.set(k.caisseId, { caisseId: k.caisseId, numero: k.numero, total: k.total, perpetuel: avant + k.total });
  }
  const details = { ...x.totaux, libelle: x.libelle, parCaisse: [...perpetuels.values()].sort((a, b) => a.numero - b.numero) };
  const derniere = toutes.at(-1);
  const sequence = (derniere?.sequence ?? 0) + 1;
  const horodatage = new Date();
  const perpetuelApres = perpetuelAvant + x.totaux.totalTtc;
  const empreintePrecedente = derniere?.empreinte ?? EMPREINTE_INITIALE;
  const empreinte = empreinteCloture(
    { sequence, niveau: x.niveau, lieuId, evenementId: x.evenementId, debut: x.debut, fin: x.fin, totalTtc: x.totaux.totalTtc, perpetuelAvant, perpetuelApres, details, horodatage },
    empreintePrecedente,
  );
  await c.query(
    `INSERT INTO cloture_periode (lieu_id, sequence, niveau, evenement_id, debut, fin, total_ttc_centimes, perpetuel_avant_centimes, perpetuel_apres_centimes,
                                  details, horodatage, par, empreinte_precedente, empreinte)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [lieuId, sequence, x.niveau, x.evenementId, x.debut, x.fin, x.totaux.totalTtc, perpetuelAvant, perpetuelApres, JSON.stringify(details), horodatage, utilisateurId, empreintePrecedente, empreinte],
  );
  await inscrireJet(c, {
    lieuId,
    type: x.niveau === "match" ? "z_match" : x.niveau === "mois" ? "cloture_mois" : "cloture_exercice",
    utilisateurId,
    details: { periode: x.libelle, grandTotal: formaterMontant(x.totaux.totalTtc), perpetuel: formaterMontant(perpetuelApres), empreinte },
  });
}

/** Z du match (clôture journalière), à la clôture définitive du match. Sans effet s'il existe déjà. */
export async function zDuMatch(c: Client, lieuId: string, utilisateurId: string, e: Evenement): Promise<void> {
  const { rows } = await c.query("SELECT 1 FROM cloture_periode WHERE lieu_id = $1 AND evenement_id = $2 AND niveau = 'match'", [lieuId, e.id]);
  if (rows[0]) return;
  const jour = e.debut.slice(0, 10);
  await inscrireCloture(c, lieuId, utilisateurId, { niveau: "match", evenementId: e.id, debut: jour, fin: jour, libelle: e.libelle, totaux: await totauxDuMatch(c, lieuId, e.id) });
}

/** Refuse un match daté dans un mois déjà clôturé (création, déplacement, ouverture). */
export async function exigerMoisOuvert(c: Client, lieuId: string, debutIso: string): Promise<void> {
  const mois = moisParis(debutIso);
  const { rows } = await c.query("SELECT 1 FROM cloture_periode WHERE lieu_id = $1 AND niveau = 'mois' AND debut = $2", [lieuId, bornesMois(mois).debut]);
  if (rows[0]) throw new ErreurMetier(409, `${libelleMois(mois)} est clôturé : aucun match ne peut plus y être ajouté ni ouvert.`);
}

async function moisDebutExercice(c: Client, lieuId: string): Promise<number> {
  const { rows } = await c.query<{ m: number }>("SELECT mois_debut_exercice AS m FROM lieu WHERE id = $1", [lieuId]);
  return rows[0]!.m;
}

/** L'état de toutes les périodes : mois et exercices qui ont des matchs, avec ce qui bloque leur clôture. */
async function etatClotures(c: Client, lieuId: string): Promise<EtatClotures> {
  const evts = await listerEvenements(c, lieuId);
  const clotures = await lireClotures(c, lieuId);
  const mDebut = await moisDebutExercice(c, lieuId);
  const { rows: totaux } = await c.query<{ evenement_id: string; total: number }>(
    "SELECT evenement_id, sum(total_ttc_centimes)::bigint AS total FROM journal_caisse WHERE lieu_id = $1 AND type IN ('vente', 'annulation') GROUP BY 1",
    [lieuId],
  );
  const totalDe = new Map(totaux.map((t) => [t.evenement_id, t.total]));
  const clotureDe = (niveau: NiveauCloture, debut: string) => clotures.find((l) => l.niveau === niveau && l.debut === debut) ?? null;

  const cles = [...new Set([...evts.map((e) => moisParis(e.debut)), moisParis(new Date())])].sort();
  const mois: PeriodeACloturer[] = cles.map((cle) => {
    const b = bornesMois(cle);
    const matchs = evts
      .filter((e) => moisParis(e.debut) === cle)
      .sort((a, b2) => Date.parse(a.debut) - Date.parse(b2.debut))
      .map((e) => ({ id: e.id, libelle: e.libelle, debut: e.debut, etat: e.etat, totalTtc: totalDe.get(e.id) ?? 0 }));
    const cloture = clotureDe("mois", b.debut);
    const nonClos = matchs.filter((m) => m.etat !== "clos").length;
    const precedentOuvert = cles.find((k) => k < cle && evts.some((e) => moisParis(e.debut) === k) && !clotureDe("mois", bornesMois(k).debut));
    const raison = cloture
      ? null
      : !moisTermine(cle)
        ? "Le mois n'est pas terminé."
        : nonClos
          ? `${nonClos} match${nonClos > 1 ? "s" : ""} pas encore clos.`
          : precedentOuvert
            ? `Clôture d'abord ${libelleMois(precedentOuvert)}.`
            : matchs.length === 0
              ? "Aucun match ce mois-ci."
              : null;
    return {
      cle,
      libelle: libelleMois(cle),
      debut: b.debut,
      fin: b.fin,
      matchs,
      totalTtc: cloture ? cloture.total_ttc_centimes : matchs.reduce((s, m) => s + m.totalTtc, 0),
      etat: cloture ? "clos" : raison ? "bloque" : "cloturable",
      raison,
      cloture: cloture ? versVue(cloture) : null,
    };
  });

  const clesExercices = [...new Set(mois.filter((m) => m.matchs.length > 0).map((m) => exerciceDe(m.cle, mDebut).premierMois))].sort();
  const exercices: PeriodeACloturer[] = clesExercices.map((premier) => {
    const ex = exerciceDe(premier, mDebut);
    const sesMois = mois.filter((m) => moisDeLExercice(ex.premierMois).includes(m.cle) && m.matchs.length > 0);
    const cloture = clotureDe("exercice", ex.debut);
    const moisOuverts = sesMois.filter((m) => m.etat !== "clos").length;
    const precedentOuvert = clesExercices.find((k) => k < premier && !clotureDe("exercice", exerciceDe(k, mDebut).debut));
    const raison = cloture
      ? null
      : !moisTermine(ex.dernierMois)
        ? "L'exercice n'est pas terminé."
        : moisOuverts
          ? `${moisOuverts} mois pas encore clôturé${moisOuverts > 1 ? "s" : ""}.`
          : precedentOuvert
            ? `Clôture d'abord ${exerciceDe(precedentOuvert, mDebut).libelle.toLowerCase()}.`
            : null;
    return {
      cle: ex.premierMois,
      libelle: ex.libelle,
      debut: ex.debut,
      fin: ex.fin,
      matchs: sesMois.flatMap((m) => m.matchs),
      totalTtc: cloture ? cloture.total_ttc_centimes : sesMois.reduce((s, m) => s + m.totalTtc, 0),
      etat: cloture ? "clos" : raison ? "bloque" : "cloturable",
      raison,
      cloture: cloture ? versVue(cloture) : null,
    };
  });

  const dernierZ = clotures.filter((l) => l.niveau === "match").at(-1);
  return {
    moisDebutExercice: mDebut,
    exerciceModifiable: !clotures.some((l) => l.niveau === "exercice"),
    perpetuel: dernierZ?.perpetuel_apres_centimes ?? 0,
    mois: mois.reverse(),
    exercices: exercices.reverse(),
    historique: clotures.map(versVue).reverse(),
  };
}

export async function routesPeriodes(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/clotures/periodes", async (req): Promise<EtatClotures> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etatClotures(c, auth.lieuId));
  });

  app.post("/api/clotures/mois", async (req): Promise<EtatClotures> => {
    const auth = await exigerDirecteur(req, base);
    const { mois } = corps(Mois, req);
    return base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `clotures:${auth.lieuId}`);
      const periode = (await etatClotures(c, auth.lieuId)).mois.find((m) => m.cle === mois);
      if (!periode) throw new ErreurMetier(404, "Aucun match ce mois-ci.");
      if (periode.etat === "clos") throw new ErreurMetier(409, `${periode.libelle} est déjà clôturé.`);
      if (periode.raison) throw new ErreurMetier(409, `${periode.libelle} ne peut pas encore être clôturé : ${periode.raison}`);
      // Chaque match du mois a son Z (ceux clos avant cette version le reçoivent maintenant, dans l'ordre).
      const evts = await listerEvenements(c, auth.lieuId);
      for (const m of periode.matchs) await zDuMatch(c, auth.lieuId, auth.utilisateurId, evts.find((e) => e.id === m.id)!);
      const ids = new Set(periode.matchs.map((m) => m.id));
      const zs = (await lireClotures(c, auth.lieuId)).filter((l) => l.niveau === "match" && l.evenement_id && ids.has(l.evenement_id));
      await inscrireCloture(c, auth.lieuId, auth.utilisateurId, { niveau: "mois", evenementId: null, debut: periode.debut, fin: periode.fin, libelle: periode.libelle, totaux: additionner(zs) });
      return etatClotures(c, auth.lieuId);
    });
  });

  app.post("/api/clotures/exercice", async (req): Promise<EtatClotures> => {
    const auth = await exigerDirecteur(req, base);
    const { premierMois } = corps(Exercice, req);
    return base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `clotures:${auth.lieuId}`);
      const etat = await etatClotures(c, auth.lieuId);
      const periode = etat.exercices.find((x) => x.cle === premierMois);
      if (!periode) throw new ErreurMetier(404, "Aucun match sur cet exercice.");
      if (periode.etat === "clos") throw new ErreurMetier(409, `${periode.libelle} est déjà clôturé.`);
      if (periode.raison) throw new ErreurMetier(409, `${periode.libelle} ne peut pas encore être clôturé : ${periode.raison}`);
      const lesMois = new Set(moisDeLExercice(premierMois).map((k) => bornesMois(k).debut));
      const clotures = (await lireClotures(c, auth.lieuId)).filter((l) => l.niveau === "mois" && lesMois.has(l.debut));
      await inscrireCloture(c, auth.lieuId, auth.utilisateurId, { niveau: "exercice", evenementId: null, debut: periode.debut, fin: periode.fin, libelle: periode.libelle, totaux: additionner(clotures) });
      return etatClotures(c, auth.lieuId);
    });
  });

  // Relit toute la chaîne des clôtures du lieu et inscrit le résultat au journal technique.
  app.post("/api/clotures/verification", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const lignes = await lireClotures(c, auth.lieuId);
      const { rows: lieu } = await c.query<{ id: string }>("SELECT id FROM lieu WHERE id = $1", [auth.lieuId]);
      let precedente = EMPREINTE_INITIALE;
      let rupture: { sequence: number; raison: string } | null = null;
      for (const [i, l] of lignes.entries()) {
        if (l.sequence !== i + 1) rupture ??= { sequence: l.sequence, raison: "numérotation discontinue" };
        if (l.empreinte_precedente !== precedente) rupture ??= { sequence: l.sequence, raison: "maillon précédent modifié ou retiré" };
        const recalculee = empreinteCloture(
          {
            sequence: l.sequence,
            niveau: l.niveau,
            lieuId: lieu[0]!.id,
            evenementId: l.evenement_id,
            debut: l.debut,
            fin: l.fin,
            totalTtc: l.total_ttc_centimes,
            perpetuelAvant: l.perpetuel_avant_centimes,
            perpetuelApres: l.perpetuel_apres_centimes,
            details: l.details as unknown as Record<string, unknown>,
            horodatage: l.horodatage,
          },
          l.empreinte_precedente,
        );
        if (recalculee !== l.empreinte) rupture ??= { sequence: l.sequence, raison: "contenu modifié" };
        precedente = l.empreinte;
      }
      const resultat = { ok: rupture === null, maillons: lignes.length, rupture };
      await inscrireJet(c, { lieuId: auth.lieuId, type: "verification_integrite", utilisateurId: auth.utilisateurId, details: { journal: "clotures", ...resultat } });
      return resultat;
    });
  });

  app.put("/api/lieu/exercice", async (req): Promise<EtatClotures> => {
    const auth = await exigerDirecteur(req, base);
    const { moisDebut } = corps(ReglageExercice, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await moisDebutExercice(c, auth.lieuId);
      if (avant !== moisDebut) {
        const { rows } = await c.query("SELECT 1 FROM cloture_periode WHERE lieu_id = $1 AND niveau = 'exercice'", [auth.lieuId]);
        if (rows[0]) throw new ErreurMetier(409, "Un exercice est déjà clôturé : le premier mois de l'exercice ne se change plus.");
        await c.query("UPDATE lieu SET mois_debut_exercice = $2 WHERE id = $1", [auth.lieuId, moisDebut]);
        await inscrireJet(c, { lieuId: auth.lieuId, type: "exercice_modifie", utilisateurId: auth.utilisateurId, details: { modifications: { moisDebutExercice: { avant, apres: moisDebut } } } });
      }
      return etatClotures(c, auth.lieuId);
    });
  });
}
