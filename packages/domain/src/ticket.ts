import { diviserArrondi, type Centimes } from "./argent.ts";
import { ventilerTtc, type TauxTvaPb } from "./tva.ts";

/**
 * Calcul d'un ticket de caisse (module Ma caisse, dossier §14 module 1 et §15.26).
 *
 *   total = max(0, brut − remise − offert − code promo − points)
 *
 * Code promo et points de fidélité (§15.127) sont des réductions en euros consenties au client,
 * appliquées après la remise et l'offert et réparties sur les lignes comme l'offert.
 *
 * Tout est en centimes. La remise en % s'applique ligne par ligne ; l'offert en euros
 * est réparti sur les lignes au prorata de leur montant après remise. C'est ce qui
 * permet de ventiler la TVA par taux au centime près : une remise consentie au client
 * réduit la base imposable (CGI art. 267, II-1°). ⚠ Traitement de l'offert à faire
 * confirmer par l'expert-comptable (question 8 de docs/questions-expert-comptable.md).
 */

/** Paliers de remise proposés à la caisse (§14 module 1) : 0, 5, 10, 15, 20, 50 %. */
export const PALIERS_REMISE_PB = [0, 500, 1000, 1500, 2000, 5000] as const;

export const MOTIFS_AJUSTEMENT = {
  abonne: { libelle: "Abonné", exige: "reference" },
  staff: { libelle: "Staff", exige: null },
  geste: { libelle: "Geste commercial", exige: null },
  remb: { libelle: "Remboursement", exige: null },
  client: { libelle: "Client mécontent", exige: null },
  autre: { libelle: "Autre", exige: "texte" },
} as const;
export type MotifAjustement = keyof typeof MOTIFS_AJUSTEMENT;

export type ModeReglement = "especes" | "carte";

export interface LigneTarifee {
  produitId: string;
  libelle: string;
  quantite: number;
  prixUnitaire: Centimes; // TTC, lu sur le tarif en vigueur à l'instant de la vente
  tauxTva: TauxTvaPb;
}

export interface Ajustement {
  remisePb: number; // 0 à 10 000 (1 500 = 15 %)
  offert: Centimes;
  motif: MotifAjustement | null;
  motifTexte: string | null;
  reference: string | null; // n° d'abonné ou de carte
}

export const AUCUN_AJUSTEMENT: Ajustement = { remisePb: 0, offert: 0, motif: null, motifTexte: null, reference: null };

export interface LigneCalculee extends LigneTarifee {
  brut: Centimes;
  remise: Centimes;
  offert: Centimes;
  /** Part de la réduction fidélité (code promo + points) ; absente quand le ticket n'en a pas. */
  fidelite?: Centimes;
  net: Centimes;
  ht: Centimes;
  tva: Centimes;
}

export interface VentilationTva {
  tauxTva: TauxTvaPb;
  ht: Centimes;
  tva: Centimes;
  ttc: Centimes;
}

export interface TicketCalcule {
  lignes: LigneCalculee[];
  brut: Centimes;
  remise: Centimes;
  offert: Centimes; // offert réellement appliqué (plafonné au montant restant)
  promo: Centimes; // réduction du code promo réellement appliquée
  points: Centimes; // réduction payée en points réellement appliquée
  total: Centimes;
  ventilation: VentilationTva[];
}

/** Répartit `montant` au prorata de `poids`, en centimes entiers, somme exacte (plus forts restes). */
export function repartirProrata(montant: Centimes, poids: readonly Centimes[]): Centimes[] {
  const totalPoids = poids.reduce((a, b) => a + b, 0);
  if (montant === 0 || totalPoids === 0) return poids.map(() => 0);
  const parts = poids.map((p) => Math.floor((montant * p) / totalPoids));
  let reste = montant - parts.reduce((a, b) => a + b, 0);
  const ordre = poids
    .map((p, i) => ({ i, fraction: (montant * p) / totalPoids - parts[i]! }))
    .sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (const { i } of ordre) {
    if (reste === 0) break;
    parts[i]! += 1;
    reste -= 1;
  }
  return parts;
}

/** Réductions de fidélité en euros (§15.127) : code promo et points dépensés. */
export interface ReductionsFidelite {
  promo: Centimes;
  points: Centimes;
}

export function calculerTicket(lignes: readonly LigneTarifee[], ajustement: Ajustement = AUCUN_AJUSTEMENT, fidelite: ReductionsFidelite | null = null): TicketCalcule {
  const avecRemise = lignes.map((l) => {
    const brut = l.prixUnitaire * l.quantite;
    const remise = diviserArrondi(brut * ajustement.remisePb, 10_000);
    return { ...l, brut, remise, apresRemise: brut - remise };
  });
  const apresRemise = avecRemise.reduce((s, l) => s + l.apresRemise, 0);
  const offert = Math.min(Math.max(0, ajustement.offert), apresRemise);
  const partsOffert = repartirProrata(
    offert,
    avecRemise.map((l) => l.apresRemise),
  );

  const restes = avecRemise.map((l, i) => l.apresRemise - partsOffert[i]!);
  const reste = restes.reduce((s, x) => s + x, 0);
  const promo = fidelite ? Math.min(Math.max(0, fidelite.promo), reste) : 0;
  const points = fidelite ? Math.min(Math.max(0, fidelite.points), reste - promo) : 0;
  const partsFidelite = repartirProrata(promo + points, restes);

  const calculees: LigneCalculee[] = avecRemise.map(({ apresRemise: base, ...l }, i) => {
    const net = base - partsOffert[i]! - partsFidelite[i]!;
    const { ht, tva } = ventilerTtc(net, l.tauxTva);
    return { ...l, offert: partsOffert[i]!, ...(promo + points > 0 ? { fidelite: partsFidelite[i]! } : {}), net, ht, tva };
  });

  const parTaux = new Map<TauxTvaPb, VentilationTva>();
  for (const l of calculees) {
    const v = parTaux.get(l.tauxTva) ?? { tauxTva: l.tauxTva, ht: 0, tva: 0, ttc: 0 };
    v.ht += l.ht;
    v.tva += l.tva;
    v.ttc += l.net;
    parTaux.set(l.tauxTva, v);
  }

  return {
    lignes: calculees,
    brut: calculees.reduce((s, l) => s + l.brut, 0),
    remise: calculees.reduce((s, l) => s + l.remise, 0),
    offert,
    promo,
    points,
    total: calculees.reduce((s, l) => s + l.net, 0),
    ventilation: [...parTaux.values()].sort((a, b) => a.tauxTva - b.tauxTva),
  };
}

/**
 * Contrôle d'un ajustement avant encaissement. Renvoie le message à afficher, ou null si tout va bien.
 * Le même contrôle tourne à l'écran (bouton Encaisser grisé) et sur le serveur (qui a le dernier mot).
 */
export function erreurAjustement(a: Ajustement, remiseAbonnePb: number | null): string | null {
  const abonne = a.motif === "abonne";
  if (abonne) {
    if (remiseAbonnePb === null) return "Le taux de remise abonné n'est pas réglé pour ce lieu.";
    if (a.remisePb !== remiseAbonnePb) return "La remise abonné doit être au taux du lieu.";
  } else if (!(PALIERS_REMISE_PB as readonly number[]).includes(a.remisePb)) {
    return "Taux de remise non autorisé.";
  }
  if (a.offert < 0) return "Un offert ne peut pas être négatif.";
  const ajuste = a.remisePb > 0 || a.offert > 0;
  if (!ajuste) return null;
  if (!a.motif) return "Motif obligatoire pour une remise ou un offert.";
  const exige = MOTIFS_AJUSTEMENT[a.motif].exige;
  if (exige === "reference" && !a.reference?.trim()) return "N° d'abonné ou de carte obligatoire.";
  if (exige === "texte" && !a.motifTexte?.trim()) return "Précise le motif.";
  return null;
}

/** Numéro de justificatif : séquentiel par caisse, jamais remis à zéro (§15.12). Ex. 2026-C3-000125. */
export function numeroJustificatif(annee: number, numeroCaisse: number, numeroTicket: number): string {
  return `${annee}-C${numeroCaisse}-${String(numeroTicket).padStart(6, "0")}`;
}
