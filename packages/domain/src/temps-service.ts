/**
 * Temps de prise de commande, par caisse et par stand (décision de Rémi du 2026-10-04, dossier §15.139).
 *
 *   durée d'une commande = encaissement − premier produit tapé
 *   client suivant       = premier produit du ticket suivant de la même caisse − encaissement du précédent
 *                          ≤ 20 s : le client suivant attendait (commande « en file ») ;
 *                          au-delà, la caisse attendait un client : ce temps n'entre dans aucune moyenne
 *   cadence en file      = 3 600 ÷ médiane des écarts entre deux encaissements successifs en file (commandes par heure)
 *
 * La médiane plutôt que la moyenne : une commande restée ouverte (client parti chercher de la monnaie)
 * ne fausse pas le chiffre. Aucune donnée par personne : la caisse et le stand seulement.
 */
import { mediane } from "./resultats.ts";

export const REGLES_SERVICE = {
  /** En dessous, le client suivant attendait. */
  fileSecondes: 20,
  /** Au-delà, la commande est tenue pour aberrante (ticket oublié ouvert) et écartée. */
  commandeMaxSecondes: 15 * 60,
  /** En dessous, pas assez de commandes mesurées pour donner une médiane. */
  commandesMin: 5,
} as const;

export interface TicketMesure {
  caisse: number;
  stand: string;
  /** Premier produit tapé (ms) ; null pour un ticket sans mesure (tablette d'avant la mesure). */
  debut: number | null;
  /** Encaissement (ms). */
  fin: number;
}

export interface StatService {
  libelle: string;
  /** Commandes dont la durée est mesurée. */
  commandes: number;
  /** Durée médiane d'une commande, en secondes ; null sous 5 commandes mesurées. */
  dureeMediane: number | null;
  /** Commandes servies alors que le client suivant attendait, sur celles où l'écart est mesurable. */
  enFile: number;
  mesurables: number;
  /** Commandes par heure quand la file est là ; null sous 5 commandes en file. */
  cadenceEnFile: number | null;
}

export interface TempsService {
  parCaisse: StatService[];
  parStand: StatService[];
  /** Tickets de vente sans mesure (tablette pas encore à jour, ou ticket d'avant la mesure). */
  sansMesure: number;
}

interface Collecte {
  durees: number[];
  cycles: number[];
  enFile: number;
  mesurables: number;
}

const vide = (): Collecte => ({ durees: [], cycles: [], enFile: 0, mesurables: 0 });

function stat(libelle: string, c: Collecte): StatService {
  const R = REGLES_SERVICE;
  const d = c.durees.length >= R.commandesMin ? mediane(c.durees) : null;
  const cy = c.cycles.length >= R.commandesMin ? mediane(c.cycles) : null;
  return {
    libelle,
    commandes: c.durees.length,
    dureeMediane: d === null ? null : Math.round(d),
    enFile: c.enFile,
    mesurables: c.mesurables,
    cadenceEnFile: cy === null || cy <= 0 ? null : Math.round(3_600 / cy),
  };
}

export function tempsDeService(tickets: readonly TicketMesure[]): TempsService {
  const R = REGLES_SERVICE;
  const parCaisse = new Map<number, { stand: string; liste: TicketMesure[] }>();
  for (const t of tickets) {
    const k = parCaisse.get(t.caisse) ?? { stand: t.stand, liste: [] };
    k.liste.push(t);
    parCaisse.set(t.caisse, k);
  }
  const caisses = new Map<number, Collecte>();
  const stands = new Map<string, Collecte>();
  for (const [numero, { stand, liste }] of parCaisse) {
    const c = vide();
    const s = stands.get(stand) ?? vide();
    const tries = [...liste].sort((a, b) => a.fin - b.fin);
    tries.forEach((t, i) => {
      if (t.debut !== null) {
        const duree = (t.fin - t.debut) / 1_000;
        if (duree >= 0 && duree <= R.commandeMaxSecondes) {
          c.durees.push(duree);
          s.durees.push(duree);
        }
      }
      const avant = tries[i - 1];
      if (!avant || t.debut === null) return;
      c.mesurables++;
      s.mesurables++;
      // Une saisie commencée avant l'encaissement précédent (écart négatif) : le client attendait.
      if ((t.debut - avant.fin) / 1_000 <= R.fileSecondes) {
        c.enFile++;
        s.enFile++;
        const cycle = (t.fin - avant.fin) / 1_000;
        if (cycle > 0 && cycle <= R.commandeMaxSecondes) {
          c.cycles.push(cycle);
          s.cycles.push(cycle);
        }
      }
    });
    caisses.set(numero, c);
    stands.set(stand, s);
  }
  return {
    parCaisse: [...caisses].sort((a, b) => a[0] - b[0]).map(([n, c]) => stat(`Caisse ${n} (${parCaisse.get(n)!.stand})`, c)),
    parStand: [...stands].sort((a, b) => a[0].localeCompare(b[0], "fr")).map(([nom, c]) => stat(nom, c)),
    sansMesure: tickets.filter((t) => t.debut === null).length,
  };
}

/** 47 → « 47 s » ; 95 → « 1 min 35 s ». */
export function formaterSecondes(secondes: number): string {
  const s = Math.round(secondes);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} min ${String(r).padStart(2, "0")} s` : `${m} min`;
}
