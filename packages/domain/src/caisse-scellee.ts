import { jsonCanonique } from "./chaine.ts";
import { empreinteCaisse, type EvenementCaisse } from "./journal-caisse.ts";
import {
  calculerTicket,
  erreurAjustement,
  numeroJustificatif,
  type Ajustement,
  type LigneCalculee,
  type LigneTarifee,
  type MotifAjustement,
  type ModeReglement,
  type VentilationTva,
} from "./ticket.ts";
import { estTauxTva } from "./tva.ts";

/**
 * Vente sans réseau (dossier §15.97) : la caisse scelle, le serveur vérifie.
 *
 * Pendant une session, la tablette est seule à écrire la chaîne de sa caisse. Elle numérote,
 * horodate, calcule et scelle chaque vente ou annulation avec les fonctions ci-dessous, puis
 * l'envoie. Le serveur rejoue exactement les mêmes calculs (`controlerEvenementTablette`)
 * avant d'inscrire : un seul code pour les deux côtés, aucun écart possible entre eux.
 */

/** Ce qui identifie la chaîne où la tablette écrit : remis par le serveur à l'ouverture ou à la reprise. */
export interface ContexteScellement {
  lieuId: string;
  caisseId: string;
  numeroCaisse: number;
  standId: string;
  evenementId: string;
  sessionId: string;
  utilisateurId: string;
}

/** Tête de la chaîne d'une caisse : tout ce qu'il faut pour sceller l'événement suivant. */
export interface TeteChaine {
  sequence: number;
  empreinte: string;
  /** Dernier numéro de ticket (ventes et annulations), jamais remis à zéro. */
  dernierTicket: number;
  /** Heure du dernier événement : l'heure des tickets suivants ne recule jamais. */
  horodatage: string | null;
}

export interface DetailsVente {
  lignes: LigneCalculee[];
  brut: number;
  remise: number;
  offert: number;
  ventilation: VentilationTva[];
  ajustement: { remisePb: number; offertDemande: number; motif: MotifAjustement | null; motifTexte: string | null; reference: string | null };
  paiement: { montantDonne: number | null; rendu: number | null };
}

export interface DetailsAnnulation {
  ticketAnnule: string;
  motifAnnulation: string;
  lignes: LigneCalculee[];
  brut: number;
  remise: number;
  offert: number;
  ventilation: VentilationTva[];
}

/** Un ticket scellé par la tablette, tel qu'il est gardé en mémoire et envoyé au serveur. */
export interface EvenementTablette {
  id: string;
  /**
   * Personne connectée sur la tablette au moment de la vente (§15.100) ; absente, c'est celle
   * qui a ouvert la caisse (tickets scellés avant les comptes des caissières).
   */
  utilisateurId?: string;
  sequence: number;
  numeroTicket: number;
  numeroJustificatif: string;
  horodatage: string;
  type: "vente" | "annulation";
  refEvenement: string | null;
  modeReglement: ModeReglement;
  totalTtc: number;
  details: DetailsVente | DetailsAnnulation;
  empreintePrecedente: string;
  empreinte: string;
}

const formatAnnee = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "Europe/Paris" });

/** Année civile à Paris : c'est elle qui figure dans le numéro de justificatif. */
export function anneeParis(date: Date): number {
  return Number(formatAnnee.format(date));
}

/** L'événement de chaîne correspondant (mêmes champs scellés que ceux écrits par le serveur). */
export function versEvenementCaisse(ctx: ContexteScellement, e: Omit<EvenementTablette, "empreinte" | "empreintePrecedente">): EvenementCaisse {
  return {
    id: e.id,
    sequence: e.sequence,
    numeroJustificatif: e.numeroJustificatif,
    horodatage: new Date(e.horodatage),
    type: e.type,
    lieuId: ctx.lieuId,
    standId: ctx.standId,
    caisseId: ctx.caisseId,
    evenementId: ctx.evenementId,
    utilisateurId: e.utilisateurId ?? ctx.utilisateurId,
    refEvenement: e.refEvenement,
    modeReglement: e.modeReglement,
    totalTtc: e.totalTtc,
    details: e.details as unknown as Record<string, unknown>,
  };
}

function sceller(
  ctx: ContexteScellement,
  tete: TeteChaine,
  partiel: Pick<EvenementTablette, "id" | "type" | "refEvenement" | "modeReglement" | "totalTtc" | "details"> & { horodatage: Date; utilisateurId?: string },
): { evenement: EvenementTablette; tete: TeteChaine } {
  // L'heure d'un ticket ne précède jamais celle du ticket précédent de la même caisse.
  const avant = tete.horodatage ? Date.parse(tete.horodatage) : 0;
  const horodatage = new Date(Math.max(partiel.horodatage.getTime(), avant));
  const numeroTicket = tete.dernierTicket + 1;
  const sansEmpreinte = {
    id: partiel.id,
    ...(partiel.utilisateurId ? { utilisateurId: partiel.utilisateurId } : {}),
    sequence: tete.sequence + 1,
    numeroTicket,
    numeroJustificatif: numeroJustificatif(anneeParis(horodatage), ctx.numeroCaisse, numeroTicket),
    horodatage: horodatage.toISOString(),
    type: partiel.type,
    refEvenement: partiel.refEvenement,
    modeReglement: partiel.modeReglement,
    totalTtc: partiel.totalTtc,
    details: partiel.details,
  };
  const empreinte = empreinteCaisse(versEvenementCaisse(ctx, sansEmpreinte), tete.empreinte);
  const evenement: EvenementTablette = { ...sansEmpreinte, empreintePrecedente: tete.empreinte, empreinte };
  return {
    evenement,
    tete: { sequence: evenement.sequence, empreinte, dernierTicket: numeroTicket, horodatage: evenement.horodatage },
  };
}

export interface EntreeVente {
  id: string;
  /** Personne connectée qui encaisse (§15.100). */
  utilisateurId?: string;
  lignes: LigneTarifee[];
  ajustement: Ajustement;
  modeReglement: ModeReglement;
  montantDonne: number | null;
  horodatage: Date;
}

/** Détail scellé d'une vente — exactement celui qu'écrivait le serveur avant le §15.97. */
function detailsDeVente(v: Omit<EntreeVente, "id" | "horodatage">): { details: DetailsVente; total: number } {
  const ticket = calculerTicket(v.lignes, v.ajustement);
  const especes = v.modeReglement === "especes";
  return {
    total: ticket.total,
    details: {
      lignes: ticket.lignes,
      brut: ticket.brut,
      remise: ticket.remise,
      offert: ticket.offert,
      ventilation: ticket.ventilation,
      ajustement: {
        remisePb: v.ajustement.remisePb,
        offertDemande: v.ajustement.offert,
        motif: v.ajustement.motif,
        motifTexte: v.ajustement.motifTexte || null,
        reference: v.ajustement.reference || null,
      },
      paiement: { montantDonne: especes ? v.montantDonne : null, rendu: especes ? (v.montantDonne ?? 0) - ticket.total : null },
    },
  };
}

/** Scelle une vente sur la tablette. Les contrôles de saisie (motif, espèces suffisantes…) sont faits avant, à l'écran. */
export function scellerVente(ctx: ContexteScellement, tete: TeteChaine, v: EntreeVente): { evenement: EvenementTablette; tete: TeteChaine } {
  const { details, total } = detailsDeVente(v);
  return sceller(ctx, tete, { id: v.id, utilisateurId: v.utilisateurId, type: "vente", refEvenement: null, modeReglement: v.modeReglement, totalTtc: total, details, horodatage: v.horodatage });
}

function detailsInverses(origine: EvenementTablette, motif: string): DetailsAnnulation {
  const d = origine.details;
  return {
    ticketAnnule: origine.numeroJustificatif,
    motifAnnulation: motif,
    lignes: d.lignes.map((l) => ({ ...l, quantite: -l.quantite, brut: -l.brut, remise: -l.remise, offert: -l.offert, net: -l.net, ht: -l.ht, tva: -l.tva })),
    brut: -d.brut,
    remise: -d.remise,
    offert: -d.offert,
    ventilation: d.ventilation.map((x) => ({ tauxTva: x.tauxTva, ht: -x.ht, tva: -x.tva, ttc: -x.ttc })),
  };
}

/** Scelle l'annulation d'une vente de la session : un événement inverse qui la référence (§15.2, test A6). */
export function scellerAnnulation(
  ctx: ContexteScellement,
  tete: TeteChaine,
  origine: EvenementTablette,
  a: { id: string; motif: string; horodatage: Date; utilisateurId?: string },
): { evenement: EvenementTablette; tete: TeteChaine } {
  return sceller(ctx, tete, {
    id: a.id,
    utilisateurId: a.utilisateurId,
    type: "annulation",
    refEvenement: origine.id,
    modeReglement: origine.modeReglement,
    totalTtc: -origine.totalTtc,
    details: detailsInverses(origine, a.motif.trim()),
    horodatage: a.horodatage,
  });
}

/**
 * Contrôle, côté serveur, d'un événement reçu d'une tablette : tout ce qui se vérifie sans la
 * base de données. Renvoie la raison d'un refus, ou null. `origine` : la vente visée par une
 * annulation. Les contrôles qui demandent la base (jeton, tarif, stand, espèces autorisées)
 * sont faits par le serveur à côté.
 */
export function controlerEvenementTablette(ctx: ContexteScellement, tete: TeteChaine, e: EvenementTablette, origine: EvenementTablette | null): string | null {
  if (e.sequence !== tete.sequence + 1) return `rang ${e.sequence} reçu, ${tete.sequence + 1} attendu`;
  if (e.numeroTicket !== tete.dernierTicket + 1) return `ticket n° ${e.numeroTicket} reçu, ${tete.dernierTicket + 1} attendu`;
  if (e.empreintePrecedente !== tete.empreinte) return "le ticket ne suit pas le dernier ticket enregistré de cette caisse";
  const horodatage = new Date(e.horodatage);
  if (Number.isNaN(horodatage.getTime()) || horodatage.toISOString() !== e.horodatage) return "heure illisible";
  if (e.numeroJustificatif !== numeroJustificatif(anneeParis(horodatage), ctx.numeroCaisse, e.numeroTicket)) return "numéro de justificatif incohérent";
  const { empreinte: _e, empreintePrecedente: _p, ...sansEmpreinte } = e;
  if (empreinteCaisse(versEvenementCaisse(ctx, sansEmpreinte), e.empreintePrecedente) !== e.empreinte) return "empreinte invalide";

  if (e.type === "vente") {
    if (e.refEvenement !== null) return "une vente ne référence aucun ticket";
    const d = e.details as DetailsVente;
    if (!Array.isArray(d.lignes) || d.lignes.length === 0 || d.lignes.length > 100) return "ticket vide ou trop long";
    if (!d.lignes.every((l) => estTauxTva(l.tauxTva) && Number.isInteger(l.quantite) && l.quantite > 0 && Number.isInteger(l.prixUnitaire) && l.prixUnitaire >= 0)) {
      return "ligne de ticket invalide";
    }
    const ajustement: Ajustement = {
      remisePb: d.ajustement?.remisePb,
      offert: d.ajustement?.offertDemande,
      motif: d.ajustement?.motif ?? null,
      motifTexte: d.ajustement?.motifTexte ?? null,
      reference: d.ajustement?.reference ?? null,
    };
    // Le taux abonné est comparé à celui du lieu par le serveur (écart signalé, pas refusé).
    const erreur = erreurAjustement(ajustement, ajustement.motif === "abonne" ? ajustement.remisePb : null);
    if (erreur) return erreur;
    const lignes: LigneTarifee[] = d.lignes.map((l) => ({ produitId: l.produitId, libelle: l.libelle, quantite: l.quantite, prixUnitaire: l.prixUnitaire, tauxTva: l.tauxTva }));
    const attendu = detailsDeVente({ lignes, ajustement, modeReglement: e.modeReglement, montantDonne: d.paiement?.montantDonne ?? null });
    if (e.modeReglement === "especes" && (d.paiement?.montantDonne ?? -1) < attendu.total) return "montant donné insuffisant";
    if (e.totalTtc !== attendu.total || jsonCanonique(d) !== jsonCanonique(attendu.details)) return "montants du ticket incohérents";
    return null;
  }

  if (!origine || origine.type !== "vente" || e.refEvenement !== origine.id) return "l'annulation doit viser une vente de cette session";
  const d = e.details as DetailsAnnulation;
  if (typeof d.motifAnnulation !== "string" || d.motifAnnulation.trim().length < 3) return "motif d'annulation obligatoire";
  if (e.modeReglement !== origine.modeReglement || e.totalTtc !== -origine.totalTtc) return "annulation incohérente avec le ticket annulé";
  if (jsonCanonique(d) !== jsonCanonique(detailsInverses(origine, d.motifAnnulation))) return "annulation incohérente avec le ticket annulé";
  return null;
}
