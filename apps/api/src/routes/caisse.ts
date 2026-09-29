import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  controlerEvenementTablette,
  formaterMontant,
  type ContexteScellement,
  type ControleTicket,
  type DetailsAnnulation,
  type DetailsVente,
  type EcranCaisse,
  type EvenementTablette,
  type LigneCalculee,
  type LigneTicketVue,
  type ReponseSynchro,
  type RepriseCaisse,
  type StatsCaisse,
  type TauxTvaPb,
  type TicketVue,
} from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur, type Authentification } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { inscrireCaisse, inscrireEvenementTablette, teteChaine, verifierCaisses } from "../journal-caisse.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Ma caisse, Mes caisses, journal des tickets (modules 1 et 3, dossier §14, §15.26, §15.62,
 * §15.73, §15.94). En version test, c'est le directeur qui ouvre les caisses et tape les
 * ventes (décision 9) ; les comptes opérateurs viendront avec la tablette enregistrée.
 *
 * Vente sans réseau (§15.97) : pendant une session, la tablette scelle elle-même ses ventes et
 * ses annulations ; le serveur les vérifie à la réception (/journal) avant de les inscrire.
 * Le serveur n'écrit dans la chaîne de la caisse qu'à l'ouverture et à la clôture.
 */

const Centimes = z.number().int().min(0).max(10_000_000);
const Empreinte = z.string().regex(/^[0-9a-f]{64}$/, "Empreinte invalide.");
const Jeton = z.string().min(20).max(200);
const Ouverture = z.object({ fond: Centimes.nullable().default(null) });
const EvenementRecu = z.object({
  id: Uuid,
  sequence: z.number().int().min(1),
  numeroTicket: z.number().int().min(1),
  numeroJustificatif: z.string().max(40),
  horodatage: z.string().max(40),
  type: z.enum(["vente", "annulation"]),
  refEvenement: Uuid.nullable(),
  modeReglement: z.enum(["especes", "carte"]),
  totalTtc: z.number().int().min(-10_000_000).max(10_000_000),
  details: z.record(z.string(), z.unknown()),
  empreintePrecedente: Empreinte,
  empreinte: Empreinte,
});
const Synchro = z.object({
  sessionId: Uuid,
  jeton: Jeton,
  /** Personne qui a scellé les tickets sur la tablette. */
  utilisateurId: Uuid,
  evenements: z.array(EvenementRecu).min(1).max(500),
});
const ClotureCaisse = z.object({ jeton: Jeton, derniereSequence: z.number().int().min(1) });
const ParEvenement = z.object({ evenementId: Uuid });

// Jeton d'appareil : une caisse ouverte appartient à un seul appareil (§15.97 point 9).
const nouveauJeton = () => randomBytes(32).toString("base64url");
const empreinteJeton = (jeton: string) => createHash("sha256").update(jeton).digest("hex");
function jetonValide(jeton: string, empreinte: string | null): boolean {
  if (!empreinte) return false;
  const a = Buffer.from(empreinteJeton(jeton), "hex");
  const b = Buffer.from(empreinte, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

interface LigneCaisse {
  id: string;
  numero: number;
  nom: string | null;
  stand_id: string;
  stand_nom: string;
  stand_actif: boolean;
  especes_autorisees: boolean;
  actif: boolean;
}

async function lireCaisse(c: Client, lieuId: string, id: string): Promise<LigneCaisse> {
  await c.query("SELECT 1 FROM caisse WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  const { rows } = await c.query<LigneCaisse>(
    `SELECT k.id, k.numero, k.nom, k.stand_id, s.nom AS stand_nom, s.actif AS stand_actif, k.especes_autorisees, k.actif
       FROM caisse k JOIN stand s ON s.lieu_id = k.lieu_id AND s.id = k.stand_id
      WHERE k.lieu_id = $1 AND k.id = $2`,
    [lieuId, id],
  );
  if (!rows[0]) throw introuvable("Caisse");
  return rows[0];
}

interface SessionOuverte {
  id: string;
  evenement_id: string;
  evenement_libelle: string;
  evenement_etat: string;
  stand_id: string;
  ouverte_le: Date;
  ouverte_par: string;
  fond_centimes: number | null;
  appareil_jeton_empreinte: string | null;
}

async function sessionOuverte(c: Client, caisseId: string): Promise<SessionOuverte | null> {
  const { rows } = await c.query<SessionOuverte>(
    `SELECT s.id, s.evenement_id, e.libelle AS evenement_libelle, e.etat AS evenement_etat, s.stand_id, s.ouverte_le,
            u.nom AS ouverte_par, s.fond_centimes, s.appareil_jeton_empreinte
       FROM session_caisse s
       JOIN evenement e ON e.id = s.evenement_id
       JOIN utilisateur u ON u.id = s.ouverte_par
      WHERE s.caisse_id = $1 AND s.fermee_le IS NULL`,
    [caisseId],
  );
  return rows[0] ?? null;
}

async function evenementOuvert(c: Client, lieuId: string): Promise<{ id: string; libelle: string } | null> {
  const { rows } = await c.query<{ id: string; libelle: string }>("SELECT id, libelle FROM evenement WHERE lieu_id = $1 AND etat = 'ouvert'", [lieuId]);
  return rows[0] ?? null;
}

/** Produits vendables à un stand, au prix en vigueur maintenant (jamais un prix envoyé par l'écran). */
async function produitsDuStand(c: Client, lieuId: string, standId: string) {
  const { rows } = await c.query<{
    id: string;
    nom: string;
    categorie_id: string | null;
    categorie: string | null;
    prix_ttc_centimes: number;
    taux_tva_pb: TauxTvaPb;
  }>(
    `SELECT p.id, p.nom, p.categorie_id, cat.nom AS categorie, t.prix_ttc_centimes, t.taux_tva_pb
       FROM produit p
       JOIN produit_stand ps ON ps.lieu_id = p.lieu_id AND ps.produit_id = p.id AND ps.stand_id = $2
       LEFT JOIN categorie cat ON cat.lieu_id = p.lieu_id AND cat.id = p.categorie_id
       JOIN LATERAL (
         SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif
          WHERE produit_id = p.id AND valide_du <= now() ORDER BY valide_du DESC LIMIT 1
       ) t ON true
      WHERE p.lieu_id = $1 AND p.actif
      ORDER BY cat.nom NULLS LAST, lower(p.nom)`,
    [lieuId, standId],
  );
  return rows;
}

interface LigneJournalVue {
  id: string;
  type: "vente" | "annulation";
  numero_justificatif: string;
  horodatage: Date;
  evenement_id: string;
  caisse_id: string;
  caisse_numero: number;
  stand_id: string;
  stand_nom: string;
  operateur: string;
  mode_reglement: "especes" | "carte";
  total_ttc_centimes: number;
  details: {
    lignes: LigneTicketVue[];
    brut: number;
    remise: number;
    offert: number;
    ventilation: TicketVue["ventilation"];
    ajustement?: { motif: string | null; motifTexte: string | null; reference: string | null };
    paiement?: { montantDonne: number | null; rendu: number | null };
    motifAnnulation?: string;
  };
  lie_id: string | null;
  lie_numero: string | null;
  empreinte: string;
  recu_le: Date | null;
  controle: ControleTicket | null;
}

const SELECT_TICKET = `
  SELECT j.id, j.type, j.numero_justificatif, j.horodatage, j.evenement_id, j.caisse_id, k.numero AS caisse_numero,
         j.stand_id, s.nom AS stand_nom, u.nom AS operateur, j.mode_reglement, j.total_ttc_centimes, j.details, j.empreinte,
         j.recu_le, j.controle,
         coalesce(a.id, r.id) AS lie_id, coalesce(a.numero_justificatif, r.numero_justificatif) AS lie_numero
    FROM journal_caisse j
    JOIN caisse k ON k.lieu_id = j.lieu_id AND k.id = j.caisse_id
    JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id
    JOIN utilisateur u ON u.id = j.utilisateur_id
    LEFT JOIN journal_caisse a ON a.ref_evenement = j.id AND a.type = 'annulation'
    LEFT JOIN journal_caisse r ON r.id = j.ref_evenement`;

function versTicket(j: LigneJournalVue): TicketVue {
  const d = j.details;
  return {
    id: j.id,
    type: j.type,
    numeroJustificatif: j.numero_justificatif,
    horodatage: j.horodatage.toISOString(),
    evenementId: j.evenement_id,
    caisseId: j.caisse_id,
    caisseNumero: j.caisse_numero,
    standId: j.stand_id,
    standNom: j.stand_nom,
    operateur: j.operateur,
    modeReglement: j.mode_reglement,
    totalTtc: j.total_ttc_centimes,
    brut: d.brut,
    remise: d.remise,
    offert: d.offert,
    motif: j.type === "annulation" ? "annulation" : (d.ajustement?.motif ?? null),
    motifTexte: j.type === "annulation" ? (d.motifAnnulation ?? null) : (d.ajustement?.motifTexte ?? null),
    reference: d.ajustement?.reference ?? null,
    montantDonne: d.paiement?.montantDonne ?? null,
    rendu: d.paiement?.rendu ?? null,
    lignes: d.lignes,
    ventilation: d.ventilation,
    lie: j.lie_id && j.lie_numero ? { id: j.lie_id, numeroJustificatif: j.lie_numero } : null,
    empreinte: j.empreinte,
    recuLe: j.recu_le ? j.recu_le.toISOString() : null,
    controle: j.controle,
  };
}

/** Ce que la tablette doit savoir pour sceller seule : contexte, tête de chaîne, jeton, heure du serveur. */
async function repriseCaisse(
  c: Client,
  auth: Authentification,
  k: LigneCaisse,
  session: { id: string; stand_id: string; evenement_id: string },
  jeton: string,
): Promise<RepriseCaisse> {
  return {
    contexte: {
      lieuId: auth.lieuId,
      caisseId: k.id,
      numeroCaisse: k.numero,
      standId: session.stand_id,
      evenementId: session.evenement_id,
      sessionId: session.id,
      utilisateurId: auth.utilisateurId,
    },
    tete: await teteChaine(c, k.id),
    jeton,
    heureServeur: new Date().toISOString(),
  };
}

async function insererLignes(c: Client, lieuId: string, journalId: string, lignes: readonly LigneCalculee[]): Promise<void> {
  let rang = 0;
  for (const l of lignes) {
    rang++;
    await c.query(
      `INSERT INTO ligne_ticket (lieu_id, journal_id, rang, produit_id, libelle, quantite, prix_unitaire_centimes, taux_tva_pb,
                                 brut_centimes, remise_centimes, offert_centimes, net_ttc_centimes, ht_centimes, tva_centimes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [lieuId, journalId, rang, l.produitId, l.libelle, l.quantite, l.prixUnitaire, l.tauxTva, l.brut, l.remise, l.offert, l.net, l.ht, l.tva],
    );
  }
}

export async function routesCaisse(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Mes caisses : tableau de bord par caisse (§15.73) ----------
  app.get("/api/caisses/tableau", async (req): Promise<StatsCaisse[]> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query(
        `SELECT k.id, k.numero, k.nom, k.stand_id, st.nom AS stand_nom, k.actif, k.especes_autorisees,
                so.ouverte_le, uo.nom AS ouverte_par, eo.libelle AS evenement_libelle,
                count(j.id) FILTER (WHERE j.type = 'vente')::int AS nb_ventes,
                count(j.id) FILTER (WHERE j.type = 'annulation')::int AS nb_annulations,
                coalesce(sum(j.total_ttc_centimes), 0)::int AS ca_net,
                coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'especes'), 0)::int AS especes,
                coalesce(sum(j.total_ttc_centimes) FILTER (WHERE j.mode_reglement = 'carte'), 0)::int AS carte,
                max(j.horodatage) AS dernier
           FROM caisse k
           JOIN stand st ON st.lieu_id = k.lieu_id AND st.id = k.stand_id
           LEFT JOIN session_caisse so ON so.caisse_id = k.id AND so.fermee_le IS NULL
           LEFT JOIN utilisateur uo ON uo.id = so.ouverte_par
           LEFT JOIN evenement eo ON eo.id = so.evenement_id
           LEFT JOIN journal_caisse j ON j.caisse_id = k.id AND j.evenement_id = $2 AND j.type IN ('vente', 'annulation')
          WHERE k.lieu_id = $1
          GROUP BY k.id, st.nom, so.ouverte_le, uo.nom, eo.libelle
          ORDER BY lower(st.nom), k.numero`,
        [auth.lieuId, evenementId],
      );
      return rows.map((r) => {
        const valides = r.nb_ventes - r.nb_annulations;
        return {
          caisseId: r.id,
          numero: r.numero,
          nom: r.nom,
          standId: r.stand_id,
          standNom: r.stand_nom,
          actif: r.actif,
          especesAutorisees: r.especes_autorisees,
          ouverteMaintenant: r.ouverte_le ? { par: r.ouverte_par, depuis: r.ouverte_le.toISOString(), evenementLibelle: r.evenement_libelle } : null,
          nbVentes: r.nb_ventes,
          nbAnnulations: r.nb_annulations,
          caNet: r.ca_net,
          panierMoyen: valides > 0 ? Math.round(r.ca_net / valides) : null,
          especes: r.especes,
          carte: r.carte,
          dernierTicket: r.dernier ? r.dernier.toISOString() : null,
        };
      });
    });
  });

  // ---------- Journal des tickets, toutes caisses (module 3) ----------
  app.get("/api/tickets", async (req): Promise<TicketVue[]> => {
    const auth = await exigerDirecteur(req, base);
    const { evenementId } = ParEvenement.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<LigneJournalVue>(
        `${SELECT_TICKET} WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type IN ('vente', 'annulation') ORDER BY j.horodatage DESC, j.sequence DESC`,
        [auth.lieuId, evenementId],
      );
      return rows.map(versTicket);
    });
  });

  app.post("/api/caisses/verification", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const resultat = await verifierCaisses(c, auth.lieuId);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "verification_integrite",
        utilisateurId: auth.utilisateurId,
        details: { journal: "caisses", ok: resultat.ok, caisses: resultat.caisses.length, ruptures: resultat.caisses.filter((k) => !k.ok).map((k) => k.numero) },
      });
      return resultat;
    });
  });

  // ---------- Écran de caisse ----------
  app.get("/api/caisses/:id/ecran", async (req): Promise<EcranCaisse> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      const session = await sessionOuverte(c, id);
      const { rows: lieu } = await c.query<{ remise_abonne_pb: number | null }>("SELECT remise_abonne_pb FROM lieu WHERE id = $1", [auth.lieuId]);
      // Pendant une session, on vend au stand où la caisse a été ouverte.
      const produits = await produitsDuStand(c, auth.lieuId, session?.stand_id ?? k.stand_id);
      return {
        caisse: { id: k.id, numero: k.numero, nom: k.nom, standId: k.stand_id, standNom: k.stand_nom, especesAutorisees: k.especes_autorisees, actif: k.actif },
        standActif: k.stand_actif,
        session: session
          ? {
              id: session.id,
              evenementId: session.evenement_id,
              evenementLibelle: session.evenement_libelle,
              ouverteLe: session.ouverte_le.toISOString(),
              ouvertePar: session.ouverte_par,
              fond: session.fond_centimes,
            }
          : null,
        evenementOuvert: await evenementOuvert(c, auth.lieuId),
        produits: produits.map((p) => ({ id: p.id, nom: p.nom, categorieId: p.categorie_id, categorie: p.categorie, prixTtc: p.prix_ttc_centimes, tauxTva: p.taux_tva_pb })),
        remiseAbonnePb: lieu[0]?.remise_abonne_pb ?? null,
        environnementTest: config.environnement !== "production",
      };
    });
  });

  // ---------- Ouverture de caisse (§15.26 point 3) ----------
  app.post("/api/caisses/:id/ouverture", async (req): Promise<RepriseCaisse> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { fond } = corps(Ouverture, req);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      if (!k.actif || !k.stand_actif) throw new ErreurMetier(409, "Cette caisse ou son stand est désactivé.");
      if (await sessionOuverte(c, id)) throw new ErreurMetier(409, "Cette caisse est déjà ouverte.");
      const evt = await evenementOuvert(c, auth.lieuId);
      if (!evt) throw new ErreurMetier(409, "Aucun match n'est ouvert : ouvre d'abord le match du jour dans Caisses.");
      // Le fond de caisse n'est demandé que si la caisse accepte les espèces (§15.26 point 2).
      if (k.especes_autorisees && fond === null) throw new ErreurMetier(400, "Saisis le fond de caisse (0 s'il n'y en a pas).");
      const fondRetenu = k.especes_autorisees ? fond : null;
      const jeton = nouveauJeton();
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO session_caisse (lieu_id, caisse_id, evenement_id, stand_id, ouverte_par, ouverte_le, fond_centimes, appareil_jeton_empreinte)
         VALUES ($1, $2, $3, $4, $5, now(), $6, $7) RETURNING id`,
        [auth.lieuId, id, evt.id, k.stand_id, auth.utilisateurId, fondRetenu, empreinteJeton(jeton)],
      );
      const sessionId = rows[0]!.id;
      await inscrireCaisse(c, {
        id: crypto.randomUUID(),
        type: "ouverture_caisse",
        lieuId: auth.lieuId,
        caisseId: id,
        numeroCaisse: k.numero,
        standId: k.stand_id,
        evenementId: evt.id,
        sessionId,
        utilisateurId: auth.utilisateurId,
        details: { sessionId, fond: fondRetenu, especesAutorisees: k.especes_autorisees },
      });
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_ouverte",
        utilisateurId: auth.utilisateurId,
        standId: k.stand_id,
        caisseId: id,
        details: { numero: k.numero, match: evt.libelle, fond: fondRetenu },
      });
      return repriseCaisse(c, auth, k, { id: sessionId, stand_id: k.stand_id, evenement_id: evt.id }, jeton);
    });
  });

  // ---------- Reprise d'une caisse ouverte sur un autre appareil (§15.97 point 9) ----------
  app.post("/api/caisses/:id/reprise", async (req): Promise<RepriseCaisse> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      await verrouiller(c, `caisse:${id}`);
      const session = await sessionOuverte(c, id);
      if (!session) throw new ErreurMetier(409, "Cette caisse n'est pas ouverte.");
      const jeton = nouveauJeton();
      await c.query("UPDATE session_caisse SET appareil_jeton_empreinte = $2 WHERE id = $1", [session.id, empreinteJeton(jeton)]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_reprise",
        utilisateurId: auth.utilisateurId,
        standId: session.stand_id,
        caisseId: id,
        details: { numero: k.numero, match: session.evenement_libelle },
      });
      return repriseCaisse(c, auth, k, session, jeton);
    });
  });

  // ---------- Réception des tickets scellés par la tablette (§15.97) ----------
  // Le lot est inscrit en entier ou pas du tout : au premier écart de structure, rien n'est inscrit.
  app.post("/api/caisses/:id/journal", async (req): Promise<ReponseSynchro> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const s = corps(Synchro, req);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      await verrouiller(c, `caisse:${id}`);
      const session = await sessionOuverte(c, id);
      if (!session || session.id !== s.sessionId) {
        throw new ErreurMetier(409, "La session de cette caisse n'est plus ouverte : les tickets en attente n'ont pas pu être inscrits.");
      }
      if (!jetonValide(s.jeton, session.appareil_jeton_empreinte)) {
        throw new ErreurMetier(409, "Cette caisse a été reprise sur un autre appareil : les tickets de cet appareil ne sont plus acceptés.");
      }
      const { rows: membre } = await c.query("SELECT 1 FROM membre WHERE lieu_id = $1 AND utilisateur_id = $2", [auth.lieuId, s.utilisateurId]);
      if (!membre[0]) throw new ErreurMetier(409, "Les tickets ont été enregistrés par une personne inconnue de ce lieu.");

      const ctx: ContexteScellement = {
        lieuId: auth.lieuId,
        caisseId: id,
        numeroCaisse: k.numero,
        standId: session.stand_id,
        evenementId: session.evenement_id,
        sessionId: session.id,
        utilisateurId: s.utilisateurId,
      };
      const { rows: lieu } = await c.query<{ remise_abonne_pb: number | null }>("SELECT remise_abonne_pb FROM lieu WHERE id = $1", [auth.lieuId]);
      const remiseAbonneLieu = lieu[0]?.remise_abonne_pb ?? null;
      const maintenant = new Date();
      let tete = await teteChaine(c, id);
      let recus = 0;
      let deja = 0;
      const horsLigne: EvenementTablette[] = [];

      for (const brut of s.evenements) {
        const e = brut as unknown as EvenementTablette;
        // Un envoi répété (réponse perdue) est reconnu et ignoré : jamais de doublon.
        const { rows: existant } = await c.query<{ empreinte: string }>("SELECT empreinte FROM journal_caisse WHERE lieu_id = $1 AND id = $2", [auth.lieuId, e.id]);
        if (existant[0]) {
          if (existant[0].empreinte !== e.empreinte) throw new ErreurMetier(409, `Le ticket ${e.numeroJustificatif} existe déjà avec un autre contenu.`);
          deja++;
          continue;
        }

        let origine: EvenementTablette | null = null;
        if (e.type === "annulation") {
          const { rows } = await c.query<{ id: string; type: string; session_id: string | null; numero_justificatif: string; mode_reglement: "especes" | "carte"; total_ttc_centimes: number; details: DetailsVente }>(
            "SELECT id, type, session_id, numero_justificatif, mode_reglement, total_ttc_centimes, details FROM journal_caisse WHERE lieu_id = $1 AND caisse_id = $2 AND id = $3",
            [auth.lieuId, id, e.refEvenement],
          );
          const r = rows[0];
          // Après la clôture de la caisse, une correction passe par une rectification tracée, pas par une annulation.
          if (!r || r.type !== "vente" || r.session_id !== session.id) throw new ErreurMetier(409, `Annulation ${e.numeroJustificatif} refusée : elle doit viser une vente de cette session.`);
          const { rows: annule } = await c.query("SELECT 1 FROM journal_caisse WHERE ref_evenement = $1 AND type = 'annulation'", [r.id]);
          if (annule[0]) throw new ErreurMetier(409, `Le ticket ${r.numero_justificatif} est déjà annulé.`);
          origine = {
            id: r.id,
            type: "vente",
            numeroJustificatif: r.numero_justificatif,
            modeReglement: r.mode_reglement,
            totalTtc: r.total_ttc_centimes,
            details: r.details,
            sequence: 0,
            numeroTicket: 0,
            horodatage: "",
            refEvenement: null,
            empreintePrecedente: "",
            empreinte: "",
          };
        }

        const raison = controlerEvenementTablette(ctx, tete, e, origine);
        if (raison) throw new ErreurMetier(409, `Ticket ${e.numeroJustificatif} refusé : ${raison}.`);
        if (e.modeReglement === "especes" && !k.especes_autorisees) throw new ErreurMetier(409, `Ticket ${e.numeroJustificatif} refusé : cette caisse n'accepte pas les espèces.`);

        // Contrôles signalés sans refus : la vente a eu lieu, l'argent est encaissé (§15.97 point 4).
        const controle: ControleTicket = {};
        const heureVente = Date.parse(e.horodatage);
        const delai = Math.round((maintenant.getTime() - heureVente) / 1000);
        if (delai > 60) {
          controle.horsLigne = true;
          controle.delaiSecondes = delai;
        }
        if (heureVente > maintenant.getTime() + 120_000 || heureVente < session.ouverte_le.getTime() - 120_000) controle.horodatageIncoherent = true;
        if (e.type === "vente") {
          const d = e.details as DetailsVente;
          const ecarts: NonNullable<ControleTicket["ecartTarif"]> = [];
          const horsStand: string[] = [];
          for (const l of d.lignes) {
            const { rows: produit } = await c.query("SELECT 1 FROM produit WHERE lieu_id = $1 AND id = $2", [auth.lieuId, l.produitId]);
            if (!produit[0]) throw new ErreurMetier(409, `Ticket ${e.numeroJustificatif} refusé : produit inconnu de ce lieu.`);
            const { rows: tarif } = await c.query<{ prix_ttc_centimes: number; taux_tva_pb: number }>(
              "SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif WHERE lieu_id = $1 AND produit_id = $2 AND valide_du <= $3 ORDER BY valide_du DESC LIMIT 1",
              [auth.lieuId, l.produitId, new Date(heureVente)],
            );
            const t = tarif[0];
            if (!t || t.prix_ttc_centimes !== l.prixUnitaire || t.taux_tva_pb !== l.tauxTva) {
              ecarts.push({ produitId: l.produitId, libelle: l.libelle, prixVendu: l.prixUnitaire, tauxVendu: l.tauxTva, prixTarif: t?.prix_ttc_centimes ?? null, tauxTarif: t?.taux_tva_pb ?? null });
            }
            const { rows: auStand } = await c.query("SELECT 1 FROM produit_stand WHERE lieu_id = $1 AND produit_id = $2 AND stand_id = $3", [auth.lieuId, l.produitId, session.stand_id]);
            if (!auStand[0]) horsStand.push(l.libelle);
          }
          if (ecarts.length) controle.ecartTarif = ecarts;
          if (horsStand.length) controle.horsStand = horsStand;
          if (d.ajustement.motif === "abonne" && d.ajustement.remisePb !== remiseAbonneLieu) controle.remiseAbonneEcart = { applique: d.ajustement.remisePb, lieu: remiseAbonneLieu };
        }

        await inscrireEvenementTablette(c, ctx, e, maintenant, Object.keys(controle).length ? controle : null);
        await insererLignes(c, auth.lieuId, e.id, e.details.lignes);
        if (e.type === "annulation") {
          const d = e.details as DetailsAnnulation;
          await inscrireJet(c, {
            lieuId: auth.lieuId,
            type: "ticket_annule",
            utilisateurId: s.utilisateurId,
            standId: session.stand_id,
            caisseId: id,
            details: { ticket: d.ticketAnnule, montant: formaterMontant(-e.totalTtc), motif: d.motifAnnulation },
          });
        }
        if (controle.horsLigne) horsLigne.push(e);
        tete = { sequence: e.sequence, empreinte: e.empreinte, dernierTicket: e.numeroTicket, horodatage: e.horodatage };
        recus++;
      }

      if (horsLigne.length) {
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "tickets_hors_ligne_recus",
          utilisateurId: auth.utilisateurId,
          standId: session.stand_id,
          caisseId: id,
          details: {
            numero: k.numero,
            tickets: horsLigne.length,
            du: horsLigne[0]!.numeroJustificatif,
            au: horsLigne.at(-1)!.numeroJustificatif,
            premiereVente: horsLigne[0]!.horodatage,
            retardMaxSecondes: Math.max(...horsLigne.map((e) => Math.round((maintenant.getTime() - Date.parse(e.horodatage)) / 1000))),
          },
        });
      }
      return { tete, recus, deja };
    });
  });

  // ---------- Clôture de caisse ----------
  // Réseau nécessaire. La tablette envoie d'abord tout ce qui attend et annonce son dernier rang :
  // la caisse n'est clôturée que si le serveur a bien tout reçu. Une seule transaction (test F4).
  app.post("/api/caisses/:id/cloture", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { jeton, derniereSequence } = corps(ClotureCaisse, req);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      await verrouiller(c, `caisse:${id}`);
      const session = await sessionOuverte(c, id);
      if (!session) throw new ErreurMetier(409, "Cette caisse n'est pas ouverte.");
      if (!jetonValide(jeton, session.appareil_jeton_empreinte)) throw new ErreurMetier(409, "Cette caisse a été reprise sur un autre appareil : clôture-la depuis celui-ci.");
      const tete = await teteChaine(c, id);
      if (tete.sequence !== derniereSequence) {
        throw new ErreurMetier(409, "Des tickets de cette caisse ne sont pas encore arrivés au serveur : attends leur envoi avant de clôturer.");
      }
      const { rows } = await c.query<{ type: string; mode_reglement: "especes" | "carte"; total_ttc_centimes: number; details: { ventilation: TicketVue["ventilation"] } }>(
        "SELECT type, mode_reglement, total_ttc_centimes, details FROM journal_caisse WHERE session_id = $1 AND type IN ('vente', 'annulation')",
        [session.id],
      );
      const ventes = rows.filter((r) => r.type === "vente");
      const annulations = rows.filter((r) => r.type === "annulation");
      const somme = (liste: typeof rows) => liste.reduce((s, r) => s + r.total_ttc_centimes, 0);
      const parTaux = new Map<number, { tauxTva: number; ht: number; tva: number; ttc: number }>();
      for (const r of rows) {
        for (const v of r.details.ventilation) {
          const t = parTaux.get(v.tauxTva) ?? { tauxTva: v.tauxTva, ht: 0, tva: 0, ttc: 0 };
          t.ht += v.ht;
          t.tva += v.tva;
          t.ttc += v.ttc;
          parTaux.set(v.tauxTva, t);
        }
      }
      const especes = somme(rows.filter((r) => r.mode_reglement === "especes"));
      const totaux = {
        sessionId: session.id,
        nbVentes: ventes.length,
        nbAnnulations: annulations.length,
        totalVentes: somme(ventes),
        totalAnnulations: somme(annulations),
        net: somme(rows),
        especes,
        carte: somme(rows.filter((r) => r.mode_reglement === "carte")),
        ventilation: [...parTaux.values()].sort((a, b) => a.tauxTva - b.tauxTva),
        fond: session.fond_centimes,
        // Ce que le tiroir devrait contenir ; le comptage réel est l'objet du module Écart de caisse.
        especesAttendues: k.especes_autorisees ? (session.fond_centimes ?? 0) + especes : null,
      };
      await inscrireCaisse(c, {
        id: crypto.randomUUID(),
        type: "cloture_caisse",
        lieuId: auth.lieuId,
        caisseId: id,
        numeroCaisse: k.numero,
        standId: session.stand_id,
        evenementId: session.evenement_id,
        sessionId: session.id,
        utilisateurId: auth.utilisateurId,
        details: totaux,
      });
      await c.query("UPDATE session_caisse SET fermee_le = now(), fermee_par = $2 WHERE id = $1", [session.id, auth.utilisateurId]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_cloturee",
        utilisateurId: auth.utilisateurId,
        standId: session.stand_id,
        caisseId: id,
        details: { numero: k.numero, match: session.evenement_libelle, net: formaterMontant(totaux.net), tickets: totaux.nbVentes },
      });
      return totaux;
    });
  });
}
