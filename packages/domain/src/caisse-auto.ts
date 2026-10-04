/**
 * Caisse automatique selon la date (décision de Rémi, dossier §15.130).
 *
 * - La caisse d'une caissière s'ouvre sur l'événement ouvert ; sans événement ouvert, sur l'événement
 *   prévu aujourd'hui (date de Paris), qui s'ouvre alors tout seul (le premier de la journée qui n'est
 *   pas clos).
 * - Garde-fou : un événement d'un jour précédent encore ouvert alors qu'un autre est prévu aujourd'hui
 *   bloque l'ouverture par la caissière (les ventes du jour iraient sur l'événement d'hier) ; le directeur
 *   doit clôturer. Lui seul peut encore ouvrir une caisse sur cet événement, averti.
 *   Sans autre événement prévu aujourd'hui, la caisse rouvre sur l'événement encore ouvert (événement
 *   sur plusieurs jours).
 * - Une caisse que le directeur a clôturée pour l'événement en cours ne se rouvre pas seule : elle
 *   attend le prochain événement (seul le directeur peut la rouvrir).
 * - Le directeur clôture : une caisse n'est clôturée à distance que si la tablette a tout envoyé et a
 *   donné des nouvelles récemment ; sinon, clôture forcée avec motif et signature.
 */
import { jourParis } from "./cloture-periode.ts";

export interface EvenementPlanifie {
  id: string;
  libelle: string;
  /** Début prévu, ISO. */
  debut: string;
  etat: "a_venir" | "ouvert" | "clos";
}

export interface OuvertureCaisse {
  /** Événement sur lequel la caisse s'ouvre maintenant ; `aOuvrir` : il s'ouvrira avec la caisse. */
  evenement: { id: string; libelle: string; debut: string; aOuvrir: boolean } | null;
  /** Pourquoi la caisse ne s'ouvre pas seule maintenant ; null si elle le peut. Avec un `evenement`, seul le directeur peut l'ouvrir. */
  blocage: string | null;
  /** Cette caisse a déjà été clôturée pour cet événement : elle attend le prochain ; seul le directeur la rouvre. */
  dejaCloturee: string | null;
  /** Prochain événement prévu après aujourd'hui, pour l'écran d'attente de la tablette. */
  prochain: { libelle: string; debut: string } | null;
}

const jourFr = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(iso));

/** `clotureesSur` : événements pour lesquels cette caisse a déjà été clôturée. */
export function ouvertureCaisse(evenements: readonly EvenementPlanifie[], maintenant: Date, clotureesSur: ReadonlySet<string> = new Set()): OuvertureCaisse {
  const aujourdhui = jourParis(maintenant);
  const parDebut = [...evenements].sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  const ouvert = parDebut.find((e) => e.etat === "ouvert") ?? null;
  const prevuAujourdhui = parDebut.find((e) => e.etat === "a_venir" && jourParis(e.debut) === aujourdhui) ?? null;
  const prochainApres = parDebut.find((e) => e.etat === "a_venir" && jourParis(e.debut) > aujourdhui) ?? null;
  const prochain = prochainApres ? { libelle: prochainApres.libelle, debut: prochainApres.debut } : null;

  if (ouvert) {
    if (jourParis(ouvert.debut) < aujourdhui && prevuAujourdhui) {
      return {
        evenement: { id: ouvert.id, libelle: ouvert.libelle, debut: ouvert.debut, aOuvrir: false },
        dejaCloturee: null,
        blocage: `L'événement « ${ouvert.libelle} » (${jourFr(ouvert.debut)}) est encore ouvert alors que « ${prevuAujourdhui.libelle} » est prévu aujourd'hui : le directeur doit d'abord le clôturer.`,
        prochain,
      };
    }
    const dejaCloturee = clotureesSur.has(ouvert.id)
      ? `Caisse clôturée pour « ${ouvert.libelle} ». Elle se rouvrira seule au prochain événement${prochain ? ` : « ${prochain.libelle} », ${jourFr(prochain.debut)}` : ""}.`
      : null;
    return { evenement: { id: ouvert.id, libelle: ouvert.libelle, debut: ouvert.debut, aOuvrir: false }, blocage: null, dejaCloturee, prochain };
  }
  if (prevuAujourdhui) return { evenement: { id: prevuAujourdhui.id, libelle: prevuAujourdhui.libelle, debut: prevuAujourdhui.debut, aOuvrir: true }, blocage: null, dejaCloturee: null, prochain };
  return {
    evenement: null,
    dejaCloturee: null,
    blocage: `Aucun événement prévu aujourd'hui.${prochain ? ` Prochain : « ${prochain.libelle} », ${jourFr(prochain.debut)}.` : " Le directeur l'ajoute dans Paramètres → Saison."}`,
    prochain,
  };
}

/** Réponse aux nouvelles de la tablette : où en est sa session côté serveur. */
export interface NouvellesCaisse {
  /** `cloturee` : le directeur a clôturé la caisse ; `reprise` : elle a été reprise sur un autre appareil. */
  etat: "ouverte" | "cloturee" | "reprise";
  /** Dernier rang inscrit au serveur dans la chaîne de la caisse. */
  sequenceServeur: number;
}

/** Au-delà, la tablette est considérée sans nouvelles (elle en donne toutes les 8 s quand la caisse est affichée). */
export const DELAI_NOUVELLES_TABLETTE_MS = 2 * 60_000;

export interface NouvellesTablette {
  /** Dernières nouvelles de la tablette ; null si elle n'en a jamais donné. */
  vueLe: string | null;
  /** Dernier ticket scellé sur la tablette (rang dans la chaîne de la caisse). */
  sequence: number | null;
  /** Tickets encore en mémoire sur la tablette, pas confirmés par le serveur. */
  attente: number | null;
}

/** La caisse peut-elle être clôturée à distance par le directeur sans rien perdre ? */
export function clotureADistance(t: NouvellesTablette, sequenceServeur: number, maintenant: Date): { possible: boolean; aEnvoyer: number | null; raison: string | null } {
  const aEnvoyer = t.sequence === null ? null : Math.max(t.attente ?? 0, t.sequence - sequenceServeur, 0);
  if (aEnvoyer !== null && aEnvoyer > 0) {
    return { possible: false, aEnvoyer, raison: `La tablette a encore ${aEnvoyer} ticket${aEnvoyer > 1 ? "s" : ""} à envoyer : attends qu'elle ait du réseau.` };
  }
  if (!t.vueLe) return { possible: false, aEnvoyer, raison: "La tablette n'a encore donné aucune nouvelle : allume-la avec du réseau, ou clôture en forçant." };
  const silence = maintenant.getTime() - Date.parse(t.vueLe);
  if (silence > DELAI_NOUVELLES_TABLETTE_MS) {
    const minutes = Math.round(silence / 60_000);
    return { possible: false, aEnvoyer, raison: `Pas de nouvelles de la tablette depuis ${minutes} min : elle a peut-être des ventes faites sans réseau. Allume-la avec du réseau, ou clôture en forçant.` };
  }
  return { possible: true, aEnvoyer: 0, raison: null };
}
