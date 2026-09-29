import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  MOTIFS_AJUSTEMENT,
  calculerTicket,
  erreurAjustement,
  estTauxTva,
  formaterMontant,
  type Ajustement,
  type EcranCaisse,
  type LigneCalculee,
  type LigneTicketVue,
  type MotifAjustement,
  type StatsCaisse,
  type TauxTvaPb,
  type TicketVue,
} from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { inscrireCaisse, verifierCaisses } from "../journal-caisse.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Ma caisse, Mes caisses, journal des tickets (modules 1 et 3, dossier §14, §15.26, §15.62,
 * §15.73, §15.94). En version test, c'est le directeur qui ouvre les caisses et tape les
 * ventes (décision 9) ; les comptes opérateurs viendront avec la tablette enregistrée.
 */

const Centimes = z.number().int().min(0).max(10_000_000);
const Ouverture = z.object({ fond: Centimes.nullable().default(null) });
const Vente = z.object({
  id: Uuid,
  lignes: z
    .array(z.object({ produitId: Uuid, quantite: z.number().int().min(1).max(999) }))
    .min(1, "Le ticket est vide.")
    .max(100),
  ajustement: z
    .object({
      remisePb: z.number().int().min(0).max(10_000),
      offert: Centimes,
      motif: z.enum(Object.keys(MOTIFS_AJUSTEMENT) as [MotifAjustement, ...MotifAjustement[]]).nullable(),
      motifTexte: z.string().trim().max(200).nullable(),
      reference: z.string().trim().max(60).nullable(),
    })
    .default({ remisePb: 0, offert: 0, motif: null, motifTexte: null, reference: null }),
  modeReglement: z.enum(["especes", "carte"]),
  montantDonne: Centimes.nullable().default(null),
});
const Annulation = z.object({ motif: z.string().trim().min(3, "Motif d'annulation obligatoire (3 caractères au moins).").max(200) });
const ParEvenement = z.object({ evenementId: Uuid });

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
}

async function sessionOuverte(c: Client, caisseId: string): Promise<SessionOuverte | null> {
  const { rows } = await c.query<SessionOuverte>(
    `SELECT s.id, s.evenement_id, e.libelle AS evenement_libelle, e.etat AS evenement_etat, s.stand_id, s.ouverte_le,
            u.nom AS ouverte_par, s.fond_centimes
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
}

const SELECT_TICKET = `
  SELECT j.id, j.type, j.numero_justificatif, j.horodatage, j.evenement_id, j.caisse_id, k.numero AS caisse_numero,
         j.stand_id, s.nom AS stand_nom, u.nom AS operateur, j.mode_reglement, j.total_ttc_centimes, j.details, j.empreinte,
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
  };
}

async function lireTicket(c: Client, lieuId: string, id: string): Promise<TicketVue | null> {
  const { rows } = await c.query<LigneJournalVue>(`${SELECT_TICKET} WHERE j.lieu_id = $1 AND j.id = $2 AND j.type IN ('vente', 'annulation')`, [lieuId, id]);
  return rows[0] ? versTicket(rows[0]) : null;
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
  app.post("/api/caisses/:id/ouverture", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { fond } = corps(Ouverture, req);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      if (!k.actif || !k.stand_actif) throw new ErreurMetier(409, "Cette caisse ou son stand est désactivé.");
      if (await sessionOuverte(c, id)) throw new ErreurMetier(409, "Cette caisse est déjà ouverte.");
      const evt = await evenementOuvert(c, auth.lieuId);
      if (!evt) throw new ErreurMetier(409, "Aucun match n'est ouvert : ouvre d'abord le match dans le calendrier.");
      // Le fond de caisse n'est demandé que si la caisse accepte les espèces (§15.26 point 2).
      if (k.especes_autorisees && fond === null) throw new ErreurMetier(400, "Saisis le fond de caisse (0 s'il n'y en a pas).");
      const fondRetenu = k.especes_autorisees ? fond : null;
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO session_caisse (lieu_id, caisse_id, evenement_id, stand_id, ouverte_par, ouverte_le, fond_centimes)
         VALUES ($1, $2, $3, $4, $5, now(), $6) RETURNING id`,
        [auth.lieuId, id, evt.id, k.stand_id, auth.utilisateurId, fondRetenu],
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
      return { ok: true };
    });
  });

  // ---------- Vente ----------
  app.post("/api/caisses/:id/ventes", async (req, rep): Promise<TicketVue> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const v = corps(Vente, req);
    return base.transaction(contexte(auth), async (c) => {
      // Un envoi répété (réseau instable) avec le même identifiant renvoie le ticket déjà enregistré.
      const deja = await lireTicket(c, auth.lieuId, v.id);
      if (deja) return deja;

      const k = await lireCaisse(c, auth.lieuId, id);
      const session = await sessionOuverte(c, id);
      if (!session) throw new ErreurMetier(409, "Cette caisse n'est pas ouverte.");
      if (session.evenement_etat !== "ouvert") throw new ErreurMetier(409, "Le match de cette session n'est plus ouvert.");
      if (v.modeReglement === "especes" && !k.especes_autorisees) throw new ErreurMetier(409, "Cette caisse n'accepte pas les espèces.");

      const catalogue = new Map((await produitsDuStand(c, auth.lieuId, session.stand_id)).map((p) => [p.id, p]));
      const quantites = new Map<string, number>();
      for (const l of v.lignes) quantites.set(l.produitId, (quantites.get(l.produitId) ?? 0) + l.quantite);
      const lignes = [...quantites].map(([produitId, quantite]) => {
        const p = catalogue.get(produitId);
        if (!p) throw new ErreurMetier(409, "Un produit du ticket n'est plus vendu à ce stand : actualise l'écran.");
        if (!estTauxTva(p.taux_tva_pb)) throw new ErreurMetier(500, "Taux de TVA inconnu.");
        return { produitId, libelle: p.nom, quantite, prixUnitaire: p.prix_ttc_centimes, tauxTva: p.taux_tva_pb };
      });

      const { rows: lieu } = await c.query<{ remise_abonne_pb: number | null }>("SELECT remise_abonne_pb FROM lieu WHERE id = $1", [auth.lieuId]);
      const ajustement: Ajustement = v.ajustement;
      const erreur = erreurAjustement(ajustement, lieu[0]?.remise_abonne_pb ?? null);
      if (erreur) throw new ErreurMetier(400, erreur);

      const ticket = calculerTicket(lignes, ajustement);
      let rendu: number | null = null;
      if (v.modeReglement === "especes") {
        if (v.montantDonne === null || v.montantDonne < ticket.total) throw new ErreurMetier(400, "Montant donné insuffisant.");
        rendu = v.montantDonne - ticket.total;
      }

      await inscrireCaisse(c, {
        id: v.id,
        type: "vente",
        lieuId: auth.lieuId,
        caisseId: id,
        numeroCaisse: k.numero,
        standId: session.stand_id,
        evenementId: session.evenement_id,
        sessionId: session.id,
        utilisateurId: auth.utilisateurId,
        modeReglement: v.modeReglement,
        totalTtc: ticket.total,
        details: {
          lignes: ticket.lignes,
          brut: ticket.brut,
          remise: ticket.remise,
          offert: ticket.offert,
          ventilation: ticket.ventilation,
          ajustement: {
            remisePb: ajustement.remisePb,
            offertDemande: ajustement.offert,
            motif: ajustement.motif,
            motifTexte: ajustement.motifTexte || null,
            reference: ajustement.reference || null,
          },
          paiement: { montantDonne: v.modeReglement === "especes" ? v.montantDonne : null, rendu },
        },
      });
      await insererLignes(c, auth.lieuId, v.id, ticket.lignes);
      rep.code(201);
      return (await lireTicket(c, auth.lieuId, v.id))!;
    });
  });

  // ---------- Annulation d'un ticket (§15.2, test A6) ----------
  app.post("/api/tickets/:id/annulation", async (req, rep): Promise<TicketVue> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const { motif } = corps(Annulation, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ caisse_id: string; session_id: string | null; type: string; stand_id: string; evenement_id: string; mode_reglement: "especes" | "carte"; numero_justificatif: string }>(
        "SELECT caisse_id, session_id, type, stand_id, evenement_id, mode_reglement, numero_justificatif FROM journal_caisse WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id],
      );
      const origine = rows[0];
      if (!origine || origine.type !== "vente") throw introuvable("Ticket");
      const k = await lireCaisse(c, auth.lieuId, origine.caisse_id);
      const session = await sessionOuverte(c, origine.caisse_id);
      // Après la clôture de la caisse, une correction passe par une rectification tracée, pas par une annulation.
      if (!session || session.id !== origine.session_id) {
        throw new ErreurMetier(409, "La caisse de ce ticket est clôturée : il ne peut plus être annulé ici.");
      }
      const ticket = (await lireTicket(c, auth.lieuId, id))!;
      if (ticket.lie) throw new ErreurMetier(409, `Ce ticket est déjà annulé (${ticket.lie.numeroJustificatif}).`);

      const inverse = <T extends { brut: number; remise: number; offert: number; net: number; ht: number; tva: number; quantite: number }>(l: T): T => ({
        ...l,
        quantite: -l.quantite,
        brut: -l.brut,
        remise: -l.remise,
        offert: -l.offert,
        net: -l.net,
        ht: -l.ht,
        tva: -l.tva,
      });
      const lignes = ticket.lignes.map(inverse) as LigneCalculee[];
      const annulationId = crypto.randomUUID();
      await inscrireCaisse(c, {
        id: annulationId,
        type: "annulation",
        lieuId: auth.lieuId,
        caisseId: origine.caisse_id,
        numeroCaisse: k.numero,
        standId: origine.stand_id,
        evenementId: origine.evenement_id,
        sessionId: session.id,
        utilisateurId: auth.utilisateurId,
        refEvenement: id,
        modeReglement: origine.mode_reglement,
        totalTtc: -ticket.totalTtc,
        details: {
          ticketAnnule: origine.numero_justificatif,
          motifAnnulation: motif,
          lignes,
          brut: -ticket.brut,
          remise: -ticket.remise,
          offert: -ticket.offert,
          ventilation: ticket.ventilation.map((v) => ({ tauxTva: v.tauxTva, ht: -v.ht, tva: -v.tva, ttc: -v.ttc })),
        },
      });
      await insererLignes(c, auth.lieuId, annulationId, lignes);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "ticket_annule",
        utilisateurId: auth.utilisateurId,
        standId: origine.stand_id,
        caisseId: origine.caisse_id,
        details: { ticket: origine.numero_justificatif, montant: formaterMontant(ticket.totalTtc), motif },
      });
      rep.code(201);
      return (await lireTicket(c, auth.lieuId, annulationId))!;
    });
  });

  // ---------- Clôture de caisse ----------
  app.post("/api/caisses/:id/cloture", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const k = await lireCaisse(c, auth.lieuId, id);
      const session = await sessionOuverte(c, id);
      if (!session) throw new ErreurMetier(409, "Cette caisse n'est pas ouverte.");
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
