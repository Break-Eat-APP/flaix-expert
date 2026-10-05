/**
 * Prévision du prochain événement (dossier §15.134 étape 3, §15.143). Statistique simple, sans IA :
 *
 *   comparables      = les 8 derniers événements clos qui ont des ventes
 *   avec l'affluence = taux par spectateur de chaque comparable × affluence prévue (3 comparables au moins avec affluence)
 *   sans l'affluence = valeurs des comparables telles quelles
 *   fourchette       = 1er au 3e quartile dès 4 comparables, du plus bas au plus haut avec 2 ou 3 ; médiane au centre
 *   moins de 2 comparables : pas de prévision
 *
 * Une prévision se vérifie : pour un événement joué, elle se recalcule avec les seuls événements d'avant lui.
 */
import { mediane } from "./resultats.ts";

export const PREVISION = {
  comparables: 8,
  minimum: 2,
  quartilesDes: 4,
  minimumAvecAffluence: 3,
} as const;

export interface VenteComparable {
  standId: string;
  stand: string;
  produitId: string;
  produit: string;
  quantite: number;
}

export interface EvenementComparable {
  id: string;
  libelle: string;
  debut: string;
  spectateurs: number | null;
  caTtc: number;
  tickets: number;
  ventes: VenteComparable[];
  /** Tickets de l'heure la plus chargée, par stand. */
  picParStand: Record<string, number>;
}

export interface Fourchette {
  bas: number;
  median: number;
  haut: number;
}

/** Quantile d'une liste triée (interpolation linéaire). */
export function quantile(tries: readonly number[], q: number): number {
  if (tries.length === 0) return NaN;
  const pos = (tries.length - 1) * q;
  const i = Math.floor(pos);
  const reste = pos - i;
  return tries[i]! + (i + 1 < tries.length ? (tries[i + 1]! - tries[i]!) * reste : 0);
}

/** Fourchette de valeurs (déjà ramenées à l'événement prévu) : quartiles dès 4, extrêmes sinon. */
export function fourchette(valeurs: readonly number[]): Fourchette | null {
  if (valeurs.length < PREVISION.minimum) return null;
  const t = [...valeurs].sort((a, b) => a - b);
  const quartiles = t.length >= PREVISION.quartilesDes;
  return { bas: quartiles ? quantile(t, 0.25) : t[0]!, median: mediane(t)!, haut: quartiles ? quantile(t, 0.75) : t.at(-1)! };
}

const arrondie = (f: Fourchette | null, entier = true): Fourchette | null =>
  f && (entier ? { bas: Math.floor(f.bas + 1e-9), median: Math.round(f.median), haut: Math.ceil(f.haut - 1e-9) } : { bas: Math.round(f.bas), median: Math.round(f.median), haut: Math.round(f.haut) });

export interface LignePrevision {
  standId: string;
  stand: string;
  produitId: string;
  produit: string;
  ventes: Fourchette;
}

export interface Prevision {
  /** « affluence » : taux par spectateur × affluence prévue ; « evenements » : valeurs des comparables. */
  base: "affluence" | "evenements";
  affluencePrevue: number | null;
  comparables: { id: string; libelle: string; debut: string; spectateurs: number | null }[];
  ca: Fourchette | null;
  tickets: Fourchette | null;
  produits: LignePrevision[];
  /** Tickets de l'heure de pointe, par stand. */
  pics: { standId: string; stand: string; tickets: Fourchette }[];
}

/**
 * Prévision d'un événement à partir de comparables (les plus récents d'abord, déjà limités aux événements
 * joués AVANT lui). null : moins de 2 comparables.
 */
export function prevoir(affluencePrevue: number | null, historique: readonly EvenementComparable[]): Prevision | null {
  const recents = historique.slice(0, PREVISION.comparables);
  const avecAffluence = recents.filter((e) => e.spectateurs !== null && e.spectateurs > 0);
  const parAffluence = affluencePrevue !== null && affluencePrevue > 0 && avecAffluence.length >= PREVISION.minimumAvecAffluence;
  const comparables = parAffluence ? avecAffluence : recents;
  if (comparables.length < PREVISION.minimum) return null;
  // Valeur d'un comparable ramenée à l'événement prévu.
  const ramener = (e: EvenementComparable, v: number) => (parAffluence ? (v / e.spectateurs!) * affluencePrevue! : v);

  const lignes = new Map<string, { l: VenteComparable; parEvenement: Map<string, number> }>();
  const stands = new Map<string, string>();
  for (const e of comparables) {
    for (const v of e.ventes) {
      stands.set(v.standId, v.stand);
      const cle = `${v.standId}|${v.produitId}`;
      const x = lignes.get(cle) ?? { l: v, parEvenement: new Map<string, number>() };
      x.parEvenement.set(e.id, (x.parEvenement.get(e.id) ?? 0) + v.quantite);
      lignes.set(cle, x);
    }
  }
  const produits: LignePrevision[] = [...lignes.values()]
    .map(({ l, parEvenement }) => ({
      standId: l.standId,
      stand: l.stand,
      produitId: l.produitId,
      produit: l.produit,
      // Un produit non vendu lors d'un comparable compte 0 pour ce comparable.
      ventes: arrondie(fourchette(comparables.map((e) => ramener(e, Math.max(0, parEvenement.get(e.id) ?? 0)))))!,
    }))
    .filter((p) => p.ventes.haut > 0)
    .sort((a, b) => a.stand.localeCompare(b.stand, "fr") || b.ventes.median - a.ventes.median || a.produit.localeCompare(b.produit, "fr"));

  const pics = [...stands].map(([standId, stand]) => ({ standId, stand, tickets: arrondie(fourchette(comparables.map((e) => ramener(e, e.picParStand[standId] ?? 0))))! }));

  return {
    base: parAffluence ? "affluence" : "evenements",
    affluencePrevue: parAffluence ? affluencePrevue : null,
    comparables: comparables.map((e) => ({ id: e.id, libelle: e.libelle, debut: e.debut, spectateurs: e.spectateurs })),
    ca: arrondie(fourchette(comparables.map((e) => ramener(e, e.caTtc))), false),
    tickets: arrondie(fourchette(comparables.map((e) => ramener(e, e.tickets)))),
    produits,
    pics: pics.sort((a, b) => a.stand.localeCompare(b.stand, "fr")),
  };
}

export type Verdict = "dans" | "au_dessus" | "en_dessous";
export const verdict = (realise: number, f: Fourchette): Verdict => (realise > f.haut ? "au_dessus" : realise < f.bas ? "en_dessous" : "dans");

/** Caisses nécessaires à l'heure de pointe : tickets de l'heure ÷ cadence en file (commandes par heure) ; null sans cadence. */
export function caissesAuPic(ticketsHeure: number, cadenceEnFile: number | null): number | null {
  if (!cadenceEnFile || cadenceEnFile <= 0) return null;
  return Math.max(1, Math.ceil(ticketsHeure / cadenceEnFile));
}

/** Réponse de GET /api/prevision. */
export interface ReponsePrevision {
  /** null : aucun événement dans la saison. */
  evenement: { id: string; libelle: string; debut: string; etat: "a_venir" | "ouvert" | "clos"; spectateurs: number | null } | null;
  /** Événements proposés au choix : à venir puis joués récemment. */
  choix: { id: string; libelle: string; debut: string; etat: "a_venir" | "ouvert" | "clos" }[];
  prevision: Prevision | null;
  /** Reste compté au stand à l'événement précédent (Stock), par « stand|produit ». */
  restes: Record<string, number>;
  /** Cadence en file mesurée par stand (commandes par heure, §15.139). */
  cadences: Record<string, number>;
  /** Pour un événement joué : ce qui s'est réellement vendu, et le verdict. */
  realise: {
    ca: number;
    tickets: number;
    produits: Record<string, number>;
  } | null;
  /** Sur les derniers événements joués : combien de fois le CA réel est tombé dans la fourchette. */
  fiabilite: { evenements: number; dansLaFourchette: number } | null;
}
