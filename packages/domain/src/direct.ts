/**
 * Le tableau En direct (dossier §15.167) : les chiffres de la soirée en cours, comparés au match précédent au même
 * moment de sa soirée (même temps écoulé depuis l'ouverture), courbes par quart d'heure, marge brute, prévision de fin de
 * soirée, ventes par catégorie, meilleurs produits. Calcul pur : le serveur lit les tickets et les statistiques.
 *
 *   au même moment  = tickets du match précédent dont l'heure − son ouverture ≤ temps écoulé ce soir
 *   écart           = (ce soir − au même moment) ÷ au même moment, en points de base
 *   panier moyen    = CA TTC ÷ tickets (ventes moins annulations)
 *   avancement      = CA ce soir ÷ CA prévu (médiane de la prévision)
 */
import type { Centimes } from "./argent.ts";

export const QUART_D_HEURE_MS = 15 * 60_000;

/** Un ticket de la soirée : une vente (CA positif) ou une annulation (CA négatif). */
export interface TicketHorodate {
  le: number;
  ca: Centimes;
  vente: boolean;
}

export interface Kpi {
  valeur: number | null;
  /** Le match précédent au même moment ; null sans match précédent. */
  auMemeMoment: number | null;
  ecartPb: number | null;
  /** Par quart d'heure depuis l'ouverture (petite courbe). */
  serie: number[];
}

export interface EntreeTableauDirect {
  evenement: { id: string; libelle: string; ouvertLe: string; spectateurs: number | null };
  maintenant: number;
  tickets: readonly TicketHorodate[];
  precedent: { libelle: string; ouvertLe: string; tickets: readonly TicketHorodate[] } | null;
  stats: {
    caHt: Centimes;
    margeBrute: Centimes | null;
    produitsSansCout: number;
    parCategorie: { nom: string; ca: Centimes }[];
    produits: { nom: string; caTtc: Centimes; quantite: number }[];
  };
  prevision: { bas: number; median: number; haut: number } | null;
}

/** Réponse de GET /api/direct. */
export interface TableauDirect {
  evenement: { id: string; libelle: string };
  precedent: string | null;
  ca: Kpi;
  tickets: Kpi;
  panier: Kpi;
  marge: { valeur: Centimes | null; tauxPb: number | null; produitsSansCout: number };
  prevision: { bas: number; median: number; haut: number; avancementPb: number | null } | null;
  spectateurs: number | null;
  caParSpectateur: Centimes | null;
  /** CA par quart d'heure : ce soir, et le match précédent sur les mêmes quarts d'heure de sa soirée. */
  courbe: { libelles: string[]; actuel: number[]; precedent: number[] | null };
  parCategorie: { nom: string; ca: Centimes }[];
  meilleurs: { nom: string; caTtc: Centimes; quantite: number }[];
}

const heureDeParis = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
/** « 19 h 15 ». */
export const libelleQuart = (ms: number) => heureDeParis.format(new Date(ms)).replace(":", " h ");

const ecart = (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : Math.round(((a - b) / b) * 10_000));

/** CA et tickets (ventes moins annulations) par quart d'heure depuis l'ouverture, jusqu'à `nombre` quarts d'heure. */
export function parQuartDHeure(tickets: readonly TicketHorodate[], ouvert: number, nombre: number): { ca: number; tickets: number }[] {
  const q = Array.from({ length: Math.max(1, nombre) }, () => ({ ca: 0, tickets: 0 }));
  for (const t of tickets) {
    const i = Math.floor((t.le - ouvert) / QUART_D_HEURE_MS);
    if (i < 0 || i >= q.length) continue;
    q[i]!.ca += t.ca;
    q[i]!.tickets += t.vente ? 1 : -1;
  }
  return q;
}

/** CA et tickets jusqu'à `ecoule` millisecondes après l'ouverture. */
export function cumulJusque(tickets: readonly TicketHorodate[], ouvert: number, ecoule: number): { ca: number; tickets: number } {
  let ca = 0;
  let n = 0;
  for (const t of tickets)
    if (t.le - ouvert <= ecoule) {
      ca += t.ca;
      n += t.vente ? 1 : -1;
    }
  return { ca, tickets: n };
}

export function tableauDirect(e: EntreeTableauDirect): TableauDirect {
  const ouvert = Date.parse(e.evenement.ouvertLe);
  const ecoule = Math.max(0, e.maintenant - ouvert);
  const nombre = Math.floor(ecoule / QUART_D_HEURE_MS) + 1;
  const quarts = parQuartDHeure(e.tickets, ouvert, nombre);
  const total = cumulJusque(e.tickets, ouvert, ecoule);
  const panier = total.tickets > 0 ? Math.round(total.ca / total.tickets) : null;

  let avant: { ca: number; tickets: number } | null = null;
  let quartsAvant: { ca: number; tickets: number }[] | null = null;
  if (e.precedent) {
    const o = Date.parse(e.precedent.ouvertLe);
    avant = cumulJusque(e.precedent.tickets, o, ecoule);
    quartsAvant = parQuartDHeure(e.precedent.tickets, o, nombre);
  }
  const panierAvant = avant && avant.tickets > 0 ? Math.round(avant.ca / avant.tickets) : null;
  const median = e.prevision?.median ?? null;

  return {
    evenement: { id: e.evenement.id, libelle: e.evenement.libelle },
    precedent: e.precedent?.libelle ?? null,
    ca: { valeur: total.ca, auMemeMoment: avant?.ca ?? null, ecartPb: ecart(total.ca, avant?.ca ?? null), serie: quarts.map((x) => x.ca) },
    tickets: { valeur: total.tickets, auMemeMoment: avant?.tickets ?? null, ecartPb: ecart(total.tickets, avant?.tickets ?? null), serie: quarts.map((x) => x.tickets) },
    panier: { valeur: panier, auMemeMoment: panierAvant, ecartPb: ecart(panier, panierAvant), serie: quarts.map((x) => (x.tickets > 0 ? Math.round(x.ca / x.tickets) : 0)) },
    marge: {
      valeur: e.stats.margeBrute,
      tauxPb: e.stats.margeBrute !== null && e.stats.caHt > 0 ? Math.round((e.stats.margeBrute / e.stats.caHt) * 10_000) : null,
      produitsSansCout: e.stats.produitsSansCout,
    },
    prevision: e.prevision ? { ...e.prevision, avancementPb: median && median > 0 ? Math.round((total.ca / median) * 10_000) : null } : null,
    spectateurs: e.evenement.spectateurs,
    caParSpectateur: e.evenement.spectateurs ? Math.round(total.ca / e.evenement.spectateurs) : null,
    courbe: {
      libelles: quarts.map((_, i) => libelleQuart(ouvert + i * QUART_D_HEURE_MS)),
      actuel: quarts.map((x) => x.ca),
      precedent: quartsAvant ? quartsAvant.map((x) => x.ca) : null,
    },
    parCategorie: [...e.stats.parCategorie].filter((c) => c.ca > 0).sort((a, b) => b.ca - a.ca),
    meilleurs: [...e.stats.produits].sort((a, b) => b.caTtc - a.caTtc).slice(0, 5),
  };
}
