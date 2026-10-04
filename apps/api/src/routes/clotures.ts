import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  comptageCloturable,
  erreurCoupures,
  especesAttendues,
  formaterMontant,
  MOTIF_ECART_MIN,
  normaliserCoupures,
  totalCoupures,
  type ClotureMatch,
  type ComptageCoffre,
  type ComptageEspeces,
  type RemonteeCoffre,
  type SessionACloturer,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { listerEvenements } from "./evenements.ts";
import { restesDuMatch } from "./stock.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Clôtures → Clôture de l'événement (dossier §15.102) : l'assistant en 4 étapes des modules 7 et 10.
 * Ventes (lues dans le journal), restes (Stock, §15.105), espèces (remontées au coffre, Z de
 * chaque tiroir et du coffre par coupure, rectification signée, §15.106), clôture définitive
 * de l'événement (routes/evenements.ts).
 */

const Comptage = z.object({
  coupures: z.record(z.string(), z.number()),
  motif: z.string().trim().max(500).nullish().transform((v) => (v ? v : null)),
});
const Rectification = z.object({
  compte: z.number().int().min(0).max(100_000_000),
  motif: z.string().trim().min(MOTIF_ECART_MIN, "Motif obligatoire (5 caractères au moins).").max(500),
  signature: z.string().trim().min(3, "Signe en toutes lettres (prénom et nom).").max(120),
});
const ParEvenement = z.object({ evenementId: Uuid });
const Remontee = z.object({ montant: z.number().int().min(1, "Montant invalide.").max(10_000_000) });
const AnnulationRemontee = z.object({ motif: z.string().trim().min(MOTIF_ECART_MIN, "Motif obligatoire (5 caractères au moins).").max(300) });
const ComptageDuCoffre = Comptage.extend({ evenementId: Uuid });

interface LigneCoffre {
  id: string;
  type: "comptage" | "rectification";
  ref_comptage: string | null;
  coupures: Record<string, number>;
  attendu_centimes: number;
  compte_centimes: number;
  ecart_centimes: number;
  seuil_centimes: number;
  motif: string | null;
  signature: string | null;
  par: string;
  le: Date;
}

const versCoffre = (r: LigneCoffre): ComptageCoffre => ({
  id: r.id,
  type: r.type,
  refComptage: r.ref_comptage,
  coupures: r.coupures,
  attendu: r.attendu_centimes,
  compte: r.compte_centimes,
  ecart: r.ecart_centimes,
  seuil: r.seuil_centimes,
  motif: r.motif,
  signature: r.signature,
  par: r.par,
  le: r.le.toISOString(),
});

/** Remontées au coffre d'un événement, avec leur annulation éventuelle ; total net par session. */
async function remonteesDuMatch(c: Client, lieuId: string, evenementId: string) {
  const { rows } = await c.query<{ id: string; session_id: string; type: "remontee" | "annulation"; ref_sortie: string | null; montant_centimes: number; motif: string | null; par: string; le: Date }>(
    `SELECT se.id, se.session_id, se.type, se.ref_sortie, se.montant_centimes, se.motif, u.nom AS par, se.le
       FROM sortie_especes se JOIN utilisateur u ON u.id = se.par
      WHERE se.lieu_id = $1 AND se.evenement_id = $2 ORDER BY se.le`,
    [lieuId, evenementId],
  );
  const parSession = new Map<string, RemonteeCoffre[]>();
  const nets = new Map<string, number>();
  for (const r of rows) nets.set(r.session_id, (nets.get(r.session_id) ?? 0) + r.montant_centimes);
  for (const r of rows.filter((x) => x.type === "remontee")) {
    const a = rows.find((x) => x.type === "annulation" && x.ref_sortie === r.id);
    const liste = parSession.get(r.session_id) ?? [];
    liste.push({ id: r.id, montant: r.montant_centimes, par: r.par, le: r.le.toISOString(), annulee: a ? { motif: a.motif!, par: a.par, le: a.le.toISOString() } : null });
    parSession.set(r.session_id, liste);
  }
  return { parSession, nets, total: rows.reduce((s, r) => s + r.montant_centimes, 0) };
}

/** L'événement est-il encore modifiable côté espèces (ni clos, ni coffre déjà compté) ? Verrou pris sur l'événement. */
async function verrouillerMatch(c: Client, lieuId: string, evenementId: string): Promise<{ etat: string; libelle: string }> {
  await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, evenementId]);
  const { rows } = await c.query<{ etat: string; libelle: string }>("SELECT etat, libelle FROM evenement WHERE lieu_id = $1 AND id = $2", [lieuId, evenementId]);
  if (!rows[0]) throw introuvable("Événement");
  return rows[0];
}

interface LigneComptage {
  id: string;
  session_id: string;
  type: "comptage" | "rectification";
  ref_comptage: string | null;
  coupures: Record<string, number>;
  fond_centimes: number;
  especes_centimes: number;
  sorties_centimes: number;
  attendu_centimes: number;
  compte_centimes: number;
  ecart_centimes: number;
  seuil_centimes: number;
  motif: string | null;
  signature: string | null;
  par: string;
  le: Date;
}

const versComptage = (r: LigneComptage): ComptageEspeces => ({
  id: r.id,
  type: r.type,
  refComptage: r.ref_comptage,
  coupures: r.coupures,
  fond: r.fond_centimes,
  especes: r.especes_centimes,
  sorties: r.sorties_centimes,
  attendu: r.attendu_centimes,
  compte: r.compte_centimes,
  ecart: r.ecart_centimes,
  seuil: r.seuil_centimes,
  motif: r.motif,
  signature: r.signature,
  par: r.par,
  le: r.le.toISOString(),
});

async function seuilDuLieu(c: Client, lieuId: string): Promise<number> {
  const { rows } = await c.query<{ seuil: number }>("SELECT seuil_ecart_especes_centimes AS seuil FROM lieu WHERE id = $1", [lieuId]);
  return rows[0]?.seuil ?? 500;
}

/** Tout ce que montre l'assistant de clôture pour un événement. */
export async function lireClotureMatch(c: Client, lieuId: string, evenementId: string): Promise<ClotureMatch> {
  const evenement = (await listerEvenements(c, lieuId)).find((e) => e.id === evenementId);
  if (!evenement) throw introuvable("Événement");
  const { rows: sessions } = await c.query<{
    id: string;
    caisse_id: string;
    numero: number;
    caisse_nom: string | null;
    stand_nom: string;
    ouverte_par: string;
    ouverte_le: Date;
    fermee_le: Date | null;
    fond_centimes: number | null;
    nb_ventes: number;
    nb_annulations: number;
    net: number;
    especes: number;
    carte: number;
  }>(
    `SELECT s.id, s.caisse_id, k.numero, k.nom AS caisse_nom, st.nom AS stand_nom, u.nom AS ouverte_par, s.ouverte_le, s.fermee_le, s.fond_centimes,
            count(j.id) FILTER (WHERE j.type = 'vente')::int AS nb_ventes,
            count(j.id) FILTER (WHERE j.type = 'annulation')::int AS nb_annulations,
            coalesce(sum(j.total_ttc_centimes), 0)::int AS net,
            coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'especes'), 0)::int AS especes,
            coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'carte'), 0)::int AS carte
       FROM session_caisse s
       JOIN caisse k ON k.lieu_id = s.lieu_id AND k.id = s.caisse_id
       JOIN stand st ON st.lieu_id = s.lieu_id AND st.id = s.stand_id
       JOIN utilisateur u ON u.id = s.ouverte_par
       LEFT JOIN journal_caisse j ON j.session_id = s.id AND j.type IN ('vente', 'annulation')
      WHERE s.lieu_id = $1 AND s.evenement_id = $2
      GROUP BY s.id, k.numero, k.nom, st.nom, u.nom
      ORDER BY k.numero, s.ouverte_le`,
    [lieuId, evenementId],
  );
  const { rows: comptages } = await c.query<LigneComptage>(
    `SELECT ce.*, u.nom AS par FROM comptage_especes ce JOIN utilisateur u ON u.id = ce.par
      WHERE ce.lieu_id = $1 AND ce.evenement_id = $2 ORDER BY ce.le`,
    [lieuId, evenementId],
  );
  const remontees = await remonteesDuMatch(c, lieuId, evenementId);
  const vues: SessionACloturer[] = sessions.map((s) => {
    const siens = comptages.filter((x) => x.session_id === s.id);
    const z = siens.find((x) => x.type === "comptage");
    const totalRemonte = remontees.nets.get(s.id) ?? 0;
    return {
      sessionId: s.id,
      caisseId: s.caisse_id,
      caisseNumero: s.numero,
      caisseNom: s.caisse_nom,
      standNom: s.stand_nom,
      ouvertePar: s.ouverte_par,
      ouverteLe: s.ouverte_le.toISOString(),
      fermeeLe: s.fermee_le ? s.fermee_le.toISOString() : null,
      nbVentes: s.nb_ventes,
      nbAnnulations: s.nb_annulations,
      net: s.net,
      especes: s.especes,
      carte: s.carte,
      fond: s.fond_centimes,
      attendu: s.fond_centimes === null ? null : especesAttendues(s.fond_centimes, s.especes, totalRemonte),
      remontees: remontees.parSession.get(s.id) ?? [],
      totalRemonte,
      comptage: z ? versComptage(z) : null,
      rectifications: siens.filter((x) => x.type === "rectification").map(versComptage),
    };
  });
  // Sans aucune caisse ouverte sur l'événement (match annulé, essai), il n'y a rien à attendre.
  const ventes = vues.every((s) => s.fermeeLe !== null);
  const { rows: coffre } = await c.query<LigneCoffre>(
    `SELECT cc.id, cc.type, cc.ref_comptage, cc.coupures, cc.attendu_centimes, cc.compte_centimes, cc.ecart_centimes, cc.seuil_centimes, cc.motif, cc.signature, u.nom AS par, cc.le
       FROM comptage_coffre cc JOIN utilisateur u ON u.id = cc.par WHERE cc.lieu_id = $1 AND cc.evenement_id = $2 ORDER BY cc.le`,
    [lieuId, evenementId],
  );
  const zCoffre = coffre.find((x) => x.type === "comptage");
  // Le coffre se compte dès qu'une remontée a eu lieu pendant l'événement (§15.106).
  const coffreRequis = remontees.total !== 0 || !!zCoffre;
  const especes = vues.every((s) => s.fond === null || s.comptage !== null) && (!coffreRequis || !!zCoffre);
  const restes = await restesDuMatch(c, lieuId, evenement);
  return {
    evenement,
    seuilEcartEspeces: await seuilDuLieu(c, lieuId),
    sessions: vues,
    coffre: {
      requis: coffreRequis,
      attendu: remontees.total,
      comptage: zCoffre ? versCoffre(zCoffre) : null,
      rectifications: coffre.filter((x) => x.type === "rectification").map(versCoffre),
    },
    etapes: { ventes, restes, especes, cloturable: evenement.etat === "ouvert" && ventes && especes && (!restes.requis || restes.manquants === 0) },
  };
}

export async function routesClotures(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/clotures", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), (c) => lireClotureMatch(c, auth.lieuId, evenementId));
  });

  // ---------- Z d'un tiroir : comptage par coupure, définitif ----------
  app.post("/api/sessions-caisse/:id/comptage", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { coupures, motif } = corps(Comptage, req);
    const erreur = erreurCoupures(coupures);
    if (erreur) throw new ErreurMetier(400, erreur);
    return base.transaction(contexte(auth), async (c) => {
      await verrouiller(c, `comptage:${id}`);
      const { rows } = await c.query<{ caisse_id: string; evenement_id: string; fermee_le: Date | null; fond_centimes: number | null; numero: number; etat: string; libelle: string }>(
        `SELECT s.caisse_id, s.evenement_id, s.fermee_le, s.fond_centimes, k.numero, e.etat, e.libelle
           FROM session_caisse s
           JOIN caisse k ON k.lieu_id = s.lieu_id AND k.id = s.caisse_id
           JOIN evenement e ON e.lieu_id = s.lieu_id AND e.id = s.evenement_id
          WHERE s.lieu_id = $1 AND s.id = $2`,
        [auth.lieuId, id],
      );
      const s = rows[0];
      if (!s) throw introuvable("Session de caisse");
      // Même verrou que la clôture de l'événement : un Z et la clôture de l'événement ne se croisent jamais.
      await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [auth.lieuId, s.evenement_id]);
      const { rows: etat } = await c.query<{ etat: string }>("SELECT etat FROM evenement WHERE lieu_id = $1 AND id = $2", [auth.lieuId, s.evenement_id]);
      s.etat = etat[0]!.etat;
      if (!s.fermee_le) throw new ErreurMetier(409, `La caisse ${s.numero} est encore ouverte : clôture-la depuis sa tablette avant de compter le tiroir.`);
      if (s.fond_centimes === null) throw new ErreurMetier(409, `La caisse ${s.numero} n'accepte pas les espèces : pas de tiroir à compter.`);
      if (s.etat === "clos") throw new ErreurMetier(409, "Cet événement est clos : un Z oublié ne se saisit plus, il se corrige par une rectification tracée.");
      const { rows: deja } = await c.query("SELECT 1 FROM comptage_especes WHERE session_id = $1 AND type = 'comptage'", [id]);
      if (deja[0]) throw new ErreurMetier(409, "Ce tiroir a déjà son Z : pour le corriger, enregistre une rectification.");

      const { rows: ventes } = await c.query<{ especes: number }>(
        "SELECT coalesce(sum(total_ttc_centimes), 0)::int AS especes FROM journal_caisse WHERE session_id = $1 AND type IN ('vente', 'annulation') AND mode_reglement = 'especes'",
        [id],
      );
      const especes = ventes[0]!.especes;
      const { rows: sortiesRows } = await c.query<{ s: number }>("SELECT coalesce(sum(montant_centimes), 0)::int AS s FROM sortie_especes WHERE lieu_id = $1 AND session_id = $2", [auth.lieuId, id]);
      const sorties = sortiesRows[0]!.s;
      const seuil = await seuilDuLieu(c, auth.lieuId);
      const propres = normaliserCoupures(coupures);
      const compte = totalCoupures(propres);
      const attendu = especesAttendues(s.fond_centimes, especes, sorties);
      const ecart = compte - attendu;
      if (!comptageCloturable(ecart, seuil, motif)) {
        throw new ErreurMetier(400, `Écart de ${formaterMontant(Math.abs(ecart))}, au-delà de la tolérance de ${formaterMontant(seuil)} : un motif est obligatoire (5 caractères au moins).`);
      }
      await c.query(
        `INSERT INTO comptage_especes (lieu_id, session_id, caisse_id, evenement_id, type, coupures, fond_centimes, especes_centimes, sorties_centimes,
                                       attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, par)
         VALUES ($1, $2, $3, $4, 'comptage', $5, $6, $7, $14, $8, $9, $10, $11, $12, $13)`,
        [auth.lieuId, id, s.caisse_id, s.evenement_id, JSON.stringify(propres), s.fond_centimes, especes, attendu, compte, ecart, seuil, motif, auth.utilisateurId, sorties],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "z_caisse_clos",
        utilisateurId: auth.utilisateurId,
        caisseId: s.caisse_id,
        details: { sessionId: id, caisse: s.numero, match: s.libelle, coupures: propres, fond: s.fond_centimes, especes, remonteesAuCoffre: sorties, attendu, compte, ecart, seuil, motif },
      });
      return lireClotureMatch(c, auth.lieuId, s.evenement_id);
    });
  });

  // ---------- Remontée d'espèces au coffre pendant l'événement (§15.106) ----------
  app.post("/api/sessions-caisse/:id/remontees", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { montant } = corps(Remontee, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ caisse_id: string; evenement_id: string; fond_centimes: number | null; numero: number }>(
        "SELECT s.caisse_id, s.evenement_id, s.fond_centimes, k.numero FROM session_caisse s JOIN caisse k ON k.lieu_id = s.lieu_id AND k.id = s.caisse_id WHERE s.lieu_id = $1 AND s.id = $2",
        [auth.lieuId, id],
      );
      const s = rows[0];
      if (!s) throw introuvable("Session de caisse");
      const e = await verrouillerMatch(c, auth.lieuId, s.evenement_id);
      if (e.etat === "clos") throw new ErreurMetier(409, "Cet événement est clos.");
      if (s.fond_centimes === null) throw new ErreurMetier(409, `La caisse ${s.numero} n'accepte pas les espèces.`);
      const { rows: z } = await c.query("SELECT 1 FROM comptage_especes WHERE session_id = $1 AND type = 'comptage'", [id]);
      if (z[0]) throw new ErreurMetier(409, `Le tiroir de la caisse ${s.numero} est déjà compté : une remontée ne s'y ajoute plus.`);
      const { rows: zc } = await c.query("SELECT 1 FROM comptage_coffre WHERE lieu_id = $1 AND evenement_id = $2 AND type = 'comptage'", [auth.lieuId, s.evenement_id]);
      if (zc[0]) throw new ErreurMetier(409, "Le coffre de cet événement est déjà compté.");
      await c.query(
        "INSERT INTO sortie_especes (lieu_id, session_id, caisse_id, evenement_id, type, montant_centimes, par) VALUES ($1, $2, $3, $4, 'remontee', $5, $6)",
        [auth.lieuId, id, s.caisse_id, s.evenement_id, montant, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "remontee_coffre", utilisateurId: auth.utilisateurId, caisseId: s.caisse_id, details: { caisse: s.numero, match: e.libelle, montant: formaterMontant(montant) } });
      return lireClotureMatch(c, auth.lieuId, s.evenement_id);
    });
  });

  app.post("/api/remontees/:id/annulation", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { motif } = corps(AnnulationRemontee, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ session_id: string; caisse_id: string; evenement_id: string; montant_centimes: number; numero: number }>(
        `SELECT se.session_id, se.caisse_id, se.evenement_id, se.montant_centimes, k.numero FROM sortie_especes se JOIN caisse k ON k.lieu_id = se.lieu_id AND k.id = se.caisse_id
          WHERE se.lieu_id = $1 AND se.id = $2 AND se.type = 'remontee'`,
        [auth.lieuId, id],
      );
      const r = rows[0];
      if (!r) throw introuvable("Remontée");
      const e = await verrouillerMatch(c, auth.lieuId, r.evenement_id);
      if (e.etat === "clos") throw new ErreurMetier(409, "Cet événement est clos.");
      const { rows: deja } = await c.query("SELECT 1 FROM sortie_especes WHERE ref_sortie = $1 AND type = 'annulation'", [id]);
      if (deja[0]) throw new ErreurMetier(409, "Cette remontée est déjà annulée.");
      // La base refuse aussi l'annulation si le tiroir ou le coffre est déjà compté ; le message est donné ici.
      const { rows: comptes } = await c.query<{ tiroir: boolean; coffre: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM comptage_especes WHERE session_id = $2 AND type = 'comptage') AS tiroir,
                EXISTS (SELECT 1 FROM comptage_coffre WHERE lieu_id = $1 AND evenement_id = $3 AND type = 'comptage') AS coffre`,
        [auth.lieuId, r.session_id, r.evenement_id],
      );
      if (comptes[0]!.tiroir || comptes[0]!.coffre) {
        throw new ErreurMetier(409, `${comptes[0]!.tiroir ? `Le tiroir de la caisse ${r.numero}` : "Le coffre"} est déjà compté : l'erreur se corrige par une rectification du Z.`);
      }
      await c.query(
        "INSERT INTO sortie_especes (lieu_id, session_id, caisse_id, evenement_id, type, ref_sortie, montant_centimes, motif, par) VALUES ($1, $2, $3, $4, 'annulation', $5, $6, $7, $8)",
        [auth.lieuId, r.session_id, r.caisse_id, r.evenement_id, id, -r.montant_centimes, motif, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "remontee_coffre_annulee", utilisateurId: auth.utilisateurId, caisseId: r.caisse_id, details: { caisse: r.numero, match: e.libelle, montant: formaterMontant(r.montant_centimes), motif } });
      return lireClotureMatch(c, auth.lieuId, r.evenement_id);
    });
  });

  // ---------- Z du coffre de la soirée : comptage par coupure, définitif (§15.106) ----------
  app.post("/api/clotures/coffre", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId, coupures, motif } = corps(ComptageDuCoffre, req);
    const erreur = erreurCoupures(coupures);
    if (erreur) throw new ErreurMetier(400, erreur);
    return base.transaction(contexte(auth), async (c) => {
      const e = await verrouillerMatch(c, auth.lieuId, evenementId);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, e.etat === "clos" ? "Cet événement est clos : le coffre se corrige par une rectification." : "Cet événement n'est pas ouvert.");
      const { rows: ouvertes } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM session_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND fermee_le IS NULL", [auth.lieuId, evenementId]);
      if (ouvertes[0]!.n > 0) throw new ErreurMetier(409, "Des caisses sont encore ouvertes : le coffre se compte en fin de soirée, une fois toutes les caisses clôturées.");
      const { rows: deja } = await c.query("SELECT 1 FROM comptage_coffre WHERE lieu_id = $1 AND evenement_id = $2 AND type = 'comptage'", [auth.lieuId, evenementId]);
      if (deja[0]) throw new ErreurMetier(409, "Le coffre a déjà son Z : pour le corriger, enregistre une rectification.");
      const { rows: tot } = await c.query<{ s: number }>("SELECT coalesce(sum(montant_centimes), 0)::int AS s FROM sortie_especes WHERE lieu_id = $1 AND evenement_id = $2", [auth.lieuId, evenementId]);
      const attendu = tot[0]!.s;
      if (attendu === 0) throw new ErreurMetier(409, "Aucune remontée au coffre sur cet événement : il n'y a pas de coffre à compter.");
      const seuil = await seuilDuLieu(c, auth.lieuId);
      const propres = normaliserCoupures(coupures);
      const compte = totalCoupures(propres);
      const ecart = compte - attendu;
      if (!comptageCloturable(ecart, seuil, motif)) {
        throw new ErreurMetier(400, `Écart de ${formaterMontant(Math.abs(ecart))}, au-delà de la tolérance de ${formaterMontant(seuil)} : un motif est obligatoire (5 caractères au moins).`);
      }
      await c.query(
        `INSERT INTO comptage_coffre (lieu_id, evenement_id, type, coupures, attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, par)
         VALUES ($1, $2, 'comptage', $3, $4, $5, $6, $7, $8, $9)`,
        [auth.lieuId, evenementId, JSON.stringify(propres), attendu, compte, ecart, seuil, motif, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "z_coffre_clos", utilisateurId: auth.utilisateurId, details: { match: e.libelle, coupures: propres, attendu, compte, ecart, seuil, motif } });
      return lireClotureMatch(c, auth.lieuId, evenementId);
    });
  });

  app.post("/api/comptages-coffre/:id/rectification", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { compte, motif, signature } = corps(Rectification, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ evenement_id: string; attendu_centimes: number; compte_centimes: number; ecart_centimes: number; seuil_centimes: number }>(
        "SELECT evenement_id, attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes FROM comptage_coffre WHERE lieu_id = $1 AND id = $2 AND type = 'comptage'",
        [auth.lieuId, id],
      );
      const z = rows[0];
      if (!z) throw introuvable("Z du coffre");
      const ecart = compte - z.attendu_centimes;
      await c.query(
        `INSERT INTO comptage_coffre (lieu_id, evenement_id, type, ref_comptage, coupures, attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, signature, par)
         VALUES ($1, $2, 'rectification', $3, '{}'::jsonb, $4, $5, $6, $7, $8, $9, $10)`,
        [auth.lieuId, z.evenement_id, id, z.attendu_centimes, compte, ecart, z.seuil_centimes, motif, signature, auth.utilisateurId],
      );
      await inscrireJet(c, { lieuId: auth.lieuId, type: "z_coffre_rectifie", utilisateurId: auth.utilisateurId, details: { comptage: id, compteAvant: z.compte_centimes, ecartAvant: z.ecart_centimes, compte, ecart, motif, signature } });
      return lireClotureMatch(c, auth.lieuId, z.evenement_id);
    });
  });

  // ---------- Rectification d'un Z : s'ajoute, ne remplace rien ----------
  app.post("/api/comptages/:id/rectification", async (req): Promise<ClotureMatch> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { compte, motif, signature } = corps(Rectification, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<LigneComptage & { caisse_id: string; evenement_id: string; numero: number }>(
        `SELECT ce.*, u.nom AS par, k.numero FROM comptage_especes ce
           JOIN utilisateur u ON u.id = ce.par
           JOIN caisse k ON k.lieu_id = ce.lieu_id AND k.id = ce.caisse_id
          WHERE ce.lieu_id = $1 AND ce.id = $2 AND ce.type = 'comptage'`,
        [auth.lieuId, id],
      );
      const z = rows[0];
      if (!z) throw introuvable("Z de caisse");
      const ecart = compte - z.attendu_centimes;
      await c.query(
        `INSERT INTO comptage_especes (lieu_id, session_id, caisse_id, evenement_id, type, ref_comptage, coupures, fond_centimes, especes_centimes,
                                       sorties_centimes, attendu_centimes, compte_centimes, ecart_centimes, seuil_centimes, motif, signature, par)
         VALUES ($1, $2, $3, $4, 'rectification', $5, '{}'::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [auth.lieuId, z.session_id, z.caisse_id, z.evenement_id, id, z.fond_centimes, z.especes_centimes, z.sorties_centimes, z.attendu_centimes, compte, ecart, z.seuil_centimes, motif, signature, auth.utilisateurId],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "z_caisse_rectifie",
        utilisateurId: auth.utilisateurId,
        caisseId: z.caisse_id,
        details: { comptage: id, caisse: z.numero, compteAvant: z.compte_centimes, ecartAvant: z.ecart_centimes, compte, ecart, motif, signature },
      });
      return lireClotureMatch(c, auth.lieuId, z.evenement_id);
    });
  });
}
