import { useEffect, useSyncExternalStore } from "react";
import type { EcranCaisse, EvenementTablette, NouvellesCaisse, ReponseSynchro, RepriseCaisse, TeteChaine } from "@flaix/domain";
import { api, ErreurApi } from "../../api.ts";

/**
 * Mémoire de la caisse sur la tablette (vente sans réseau, dossier §15.97).
 *
 * Pendant une session, chaque vente est scellée puis ÉCRITE ICI avant d'être affichée comme
 * encaissée ; elle part ensuite au serveur, tout de suite ou au retour du réseau. L'écriture
 * est synchrone (localStorage) : une vente est enregistrée entièrement ou pas du tout.
 */
export interface EtatCaisseLocale {
  version: 1;
  caisseId: string;
  reprise: RepriseCaisse;
  /** Écart entre l'horloge du serveur et celle de la tablette, mesuré à l'ouverture. */
  decalageMs: number;
  tete: TeteChaine;
  /** Dernier écran connu : caisse, catalogue et prix du stand, réglages. */
  ecran: EcranCaisse;
  /** Tous les tickets scellés sur cet appareil pendant la session. */
  tickets: EvenementTablette[];
  /** Identifiants des tickets pas encore confirmés par le serveur, dans l'ordre. */
  attente: string[];
  dernierEnvoi: string | null;
}

export type StatutEnvoi =
  | { etat: "a_jour" }
  | { etat: "envoi" }
  | { etat: "hors_ligne" }
  | { etat: "reconnexion" }
  | { etat: "refus"; message: string };

const cle = (caisseId: string) => `flaix.caisse.${caisseId}`;
const ecouteurs = new Set<() => void>();
const statuts = new Map<string, StatutEnvoi>();
const instantanes = new Map<string, { brut: string | null; etat: EtatCaisseLocale | null }>();

function prevenir() {
  for (const f of ecouteurs) f();
}

export function lireEtat(caisseId: string): EtatCaisseLocale | null {
  let brut: string | null = null;
  try {
    brut = localStorage.getItem(cle(caisseId));
  } catch {
    return null;
  }
  // Même objet tant que rien n'a changé : React ne redessine que si la mémoire a bougé.
  const cache = instantanes.get(caisseId);
  if (cache && cache.brut === brut) return cache.etat;
  const etat = brut ? (JSON.parse(brut) as EtatCaisseLocale) : null;
  instantanes.set(caisseId, { brut, etat });
  return etat;
}

/** Écrit la mémoire de la caisse. Lève une erreur si la tablette refuse l'écriture : la vente n'est alors PAS enregistrée. */
export function ecrireEtat(etat: EtatCaisseLocale): void {
  localStorage.setItem(cle(etat.caisseId), JSON.stringify(etat));
  prevenir();
}

export function effacerEtat(caisseId: string): void {
  try {
    localStorage.removeItem(cle(caisseId));
  } catch {
    /* rien à effacer */
  }
  statuts.delete(caisseId);
  dernieresNouvelles.delete(caisseId);
  prevenir();
}

/** Première mémoire d'une caisse, juste après son ouverture ou sa reprise sur cet appareil. */
export function initialiserEtat(caisseId: string, reprise: RepriseCaisse, ecran: EcranCaisse): EtatCaisseLocale {
  const etat: EtatCaisseLocale = {
    version: 1,
    caisseId,
    reprise,
    decalageMs: Date.parse(reprise.heureServeur) - Date.now(),
    tete: reprise.tete,
    ecran,
    tickets: [],
    attente: [],
    dernierEnvoi: new Date().toISOString(),
  };
  ecrireEtat(etat);
  // Demande au navigateur de ne pas effacer cette mémoire s'il manque de place (sans garantie).
  void navigator.storage?.persist?.().catch(() => undefined);
  return etat;
}

/** Heure de la caisse : celle de la tablette, recalée sur celle du serveur à l'ouverture. */
export function heureCaisse(etat: EtatCaisseLocale): Date {
  return new Date(Date.now() + etat.decalageMs);
}

/** Ajoute un ticket scellé à la mémoire, avant tout affichage « encaissé ». */
export function memoriserTicket(etat: EtatCaisseLocale, evenement: EvenementTablette, tete: TeteChaine): EtatCaisseLocale {
  const suivant: EtatCaisseLocale = { ...etat, tete, tickets: [...etat.tickets, evenement], attente: [...etat.attente, evenement.id] };
  ecrireEtat(suivant);
  return suivant;
}

const A_JOUR: StatutEnvoi = { etat: "a_jour" };

export function statutEnvoi(caisseId: string): StatutEnvoi {
  return statuts.get(caisseId) ?? A_JOUR;
}

function changerStatut(caisseId: string, statut: StatutEnvoi) {
  statuts.set(caisseId, statut);
  prevenir();
}

const enCours = new Map<string, Promise<void>>();

/**
 * Envoie au serveur tout ce qui attend, dans l'ordre, par lots. Un seul envoi à la fois par
 * caisse. Rien n'est jamais retiré de la mémoire avant que le serveur ait confirmé.
 */
export function envoyer(caisseId: string): Promise<void> {
  const deja = enCours.get(caisseId);
  if (deja) return deja;
  const p = envoyerMaintenant(caisseId).finally(() => enCours.delete(caisseId));
  enCours.set(caisseId, p);
  return p;
}

async function envoyerMaintenant(caisseId: string): Promise<void> {
  for (;;) {
    const etat = lireEtat(caisseId);
    if (!etat) return;
    if (etat.attente.length === 0) {
      changerStatut(caisseId, A_JOUR);
      return;
    }
    const lot = etat.attente.slice(0, 200).map((id) => etat.tickets.find((t) => t.id === id)!);
    changerStatut(caisseId, { etat: "envoi" });
    try {
      await api.post<ReponseSynchro>(`/caisses/${caisseId}/journal`, {
        sessionId: etat.reprise.contexte.sessionId,
        jeton: etat.reprise.jeton,
        utilisateurId: etat.reprise.contexte.utilisateurId,
        evenements: lot,
      });
    } catch (e) {
      if (e instanceof ErreurApi && e.statut === 401) changerStatut(caisseId, { etat: "reconnexion" });
      else if (e instanceof ErreurApi && e.statut < 500) changerStatut(caisseId, { etat: "refus", message: e.message });
      else changerStatut(caisseId, { etat: "hors_ligne" });
      return;
    }
    // Relire : d'autres ventes ont pu être ajoutées pendant l'envoi.
    const apres = lireEtat(caisseId);
    if (!apres) return;
    const confirmes = new Set(lot.map((t) => t.id));
    ecrireEtat({ ...apres, attente: apres.attente.filter((id) => !confirmes.has(id)), dernierEnvoi: new Date().toISOString() });
  }
}

/**
 * Tickets d'une session clôturée par le directeur (ou reprise sur un autre appareil) avant d'avoir pu
 * être envoyés (§15.130) : ils ne seront plus inscrits, mais restent sur la tablette pour le directeur,
 * et la caisse se libère pour le prochain événement.
 */
export interface TicketsNonEnvoyes {
  sessionId: string;
  evenementLibelle: string | null;
  le: string;
  raison: "cloturee" | "reprise";
  tickets: EvenementTablette[];
}

const cleNonEnvoyes = (caisseId: string) => `flaix.caisse-non-envoyes.${caisseId}`;

export function lireNonEnvoyes(caisseId: string): TicketsNonEnvoyes[] {
  try {
    const brut = localStorage.getItem(cleNonEnvoyes(caisseId));
    return brut ? (JSON.parse(brut) as TicketsNonEnvoyes[]) : [];
  } catch {
    return [];
  }
}

/** Libère la caisse sur cet appareil ; les tickets pas encore envoyés sont d'abord mis de côté (jamais effacés). */
export function mettreDeCote(caisseId: string, raison: TicketsNonEnvoyes["raison"]): void {
  const etat = lireEtat(caisseId);
  if (!etat) return;
  if (etat.attente.length > 0) {
    const tickets = etat.attente.map((id) => etat.tickets.find((t) => t.id === id)).filter((t): t is EvenementTablette => t !== undefined);
    const liste = [...lireNonEnvoyes(caisseId), { sessionId: etat.reprise.contexte.sessionId, evenementLibelle: etat.ecran.session?.evenementLibelle ?? null, le: new Date().toISOString(), raison, tickets }];
    // Lève une erreur si la tablette refuse l'écriture : la caisse reste alors affichée, avec ses tickets.
    localStorage.setItem(cleNonEnvoyes(caisseId), JSON.stringify(liste));
  }
  effacerEtat(caisseId);
}

const NOUVELLES_MS = 30_000;
const dernieresNouvelles = new Map<string, { le: number; attente: number; sequence: number }>();
const nouvellesEnCours = new Set<string>();

/**
 * Dit au serveur où en est la tablette : dernier ticket scellé, tickets pas encore envoyés (§15.130).
 * Le directeur sait ainsi s'il peut clôturer à distance. En retour, si la caisse a été clôturée ou
 * reprise ailleurs, la tablette se libère et attend le prochain événement. Toutes les 30 s au plus,
 * ou dès que quelque chose a changé.
 */
export async function donnerNouvelles(caisseId: string): Promise<NouvellesCaisse["etat"] | null> {
  const etat = lireEtat(caisseId);
  if (!etat) return null;
  const derniere = dernieresNouvelles.get(caisseId);
  const inchange = derniere && derniere.attente === etat.attente.length && derniere.sequence === etat.tete.sequence;
  if ((inchange && Date.now() - derniere.le < NOUVELLES_MS) || nouvellesEnCours.has(caisseId)) return null;
  nouvellesEnCours.add(caisseId);
  let r: NouvellesCaisse;
  try {
    r = await api.post<NouvellesCaisse>(`/caisses/${caisseId}/nouvelles`, {
      sessionId: etat.reprise.contexte.sessionId,
      jeton: etat.reprise.jeton,
      sequence: etat.tete.sequence,
      attente: etat.attente.length,
    });
  } catch {
    return null;
  } finally {
    nouvellesEnCours.delete(caisseId);
  }
  dernieresNouvelles.set(caisseId, { le: Date.now(), attente: etat.attente.length, sequence: etat.tete.sequence });
  if (r.etat !== "ouverte" && lireEtat(caisseId)?.reprise.contexte.sessionId === etat.reprise.contexte.sessionId) {
    try {
      mettreDeCote(caisseId, r.etat);
    } catch {
      /* mémoire pleine : la caisse reste affichée avec ses tickets */
    }
  }
  return r.etat;
}

function abonner(f: () => void) {
  ecouteurs.add(f);
  const surStockage = (e: StorageEvent) => {
    if (e.key?.startsWith("flaix.caisse.")) f();
  };
  window.addEventListener("storage", surStockage);
  return () => {
    ecouteurs.delete(f);
    window.removeEventListener("storage", surStockage);
  };
}

/** Mémoire et état d'envoi d'une caisse, tenus à jour à l'écran. */
export function useCaisseLocale(caisseId: string) {
  const etat = useSyncExternalStore(abonner, () => lireEtat(caisseId));
  const statut = useSyncExternalStore(abonner, () => statutEnvoi(caisseId));
  return { etat, statut };
}

/**
 * Tant que l'écran de caisse est affiché : renvoie ce qui attend toutes les 8 secondes et dès que le
 * réseau revient, puis donne des nouvelles au serveur (même après un refus : la caisse a pu être clôturée).
 */
export function useEnvoiAutomatique(caisseId: string, actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const relancer = () => {
      const s = statutEnvoi(caisseId);
      void (s.etat !== "refus" ? envoyer(caisseId) : Promise.resolve()).then(() => donnerNouvelles(caisseId));
    };
    relancer();
    const minuterie = window.setInterval(relancer, 8000);
    window.addEventListener("online", relancer);
    return () => {
      window.clearInterval(minuterie);
      window.removeEventListener("online", relancer);
    };
  }, [caisseId, actif]);
}
