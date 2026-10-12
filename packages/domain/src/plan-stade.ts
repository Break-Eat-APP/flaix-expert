/**
 * Le stade en direct (dossier §15.162) : chaque stand placé autour d'un stade en 3D, en couleur selon son état du
 * moment ; un clic montre ses alertes. Seule la couleur se calcule ici : les chiffres viennent de Caisses, Stock,
 * Hygiène et du temps de prise de commande (§15.139).
 *
 *   rouge  = rupture d'un produit · file d'attente sur 80 % des commandes ou plus (15 dernières minutes)
 *   orange = stock faible · file sur 50 % des commandes ou plus · tablette sans nouvelles depuis plus de 2 min ou
 *            tickets encore à envoyer · température hors limite d'un équipement du stand (7 jours) ·
 *            températures d'ouverture à relever pendant l'événement
 *   vert   = au moins une caisse ouverte, rien à signaler
 *   gris   = aucune caisse ouverte, rien à signaler
 *
 * La file : part des commandes servies alors que le client suivant attendait déjà (même mesure qu'au §15.139),
 * à partir de 5 commandes mesurées sur la fenêtre.
 */
import { formaterMontant, type Centimes } from "./argent.ts";
import { DELAI_NOUVELLES_TABLETTE_MS } from "./caisse-auto.ts";
import type { AlerteStock } from "./stock.ts";

export type Tribune = "nord" | "est" | "sud" | "ouest";

export const TRIBUNES: readonly { code: Tribune; libelle: string }[] = [
  { code: "nord", libelle: "Tribune Nord" },
  { code: "est", libelle: "Tribune Est" },
  { code: "sud", libelle: "Tribune Sud" },
  { code: "ouest", libelle: "Tribune Ouest" },
];

export const SEUILS_STADE = {
  fenetreMinutes: 15,
  fileOrangePct: 50,
  fileRougePct: 80,
  fileMinCommandes: 5,
} as const;

export type CouleurStand = "rouge" | "orange" | "vert" | "gris";

export interface SignalStand {
  couleur: "rouge" | "orange";
  titre: string;
  detail: string;
  lien: string;
}

/** Ce que le serveur lit pour un stand actif. */
export interface DonneesStand {
  id: string;
  nom: string;
  tribune: Tribune | null;
  caisses: {
    numero: number;
    ouverte: boolean;
    /** Dernières nouvelles de la tablette d'une caisse ouverte. */
    vueLe: string | null;
    /** Tickets que la tablette a encore à envoyer ; null : inconnu. */
    aEnvoyer: number | null;
    caNet: Centimes;
    tickets: number;
  }[];
  /** Lignes de stock du stand pendant l'événement ouvert (vide sans suivi). */
  stock: { nom: string; alerte: AlerteStock; restant: number; sur: number; vendu: number }[];
  /** File d'attente sur la fenêtre (15 dernières minutes). */
  file: { enFile: number; mesurables: number };
  hygiene: { nonConformes: number; ouvertureARelever: string[] };
}

export interface EtatStand {
  id: string;
  nom: string;
  /** Tribune où il est dessiné (choisie, devinée du nom, ou répartie) et sa place sur cette tribune. */
  tribune: Tribune;
  tribuneChoisie: boolean;
  rang: number;
  surTribune: number;
  couleur: CouleurStand;
  resume: string;
  signaux: SignalStand[];
  chiffres: { caNet: Centimes; tickets: number; caissesOuvertes: number; caisses: number; filePct: number | null };
}

/** Réponse de GET /api/plan-stade. */
export interface PlanStade {
  evenement: { id: string; libelle: string } | null;
  stands: EtatStand[];
  seuils: typeof SEUILS_STADE;
}

const sansAccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** « Buvette Nord » → nord ; « Bar du Sud-Est » → sud (le premier mot de côté trouvé) ; sinon null. */
export function tribuneDuNom(nom: string): Tribune | null {
  for (const mot of sansAccent(nom).split(/[^a-z]+/)) if (mot === "nord" || mot === "sud" || mot === "est" || mot === "ouest") return mot;
  return null;
}

/**
 * Place chaque stand sur une tribune : celle choisie dans les paramètres, sinon celle de son nom, sinon la tribune la
 * moins garnie (dans l'ordre Nord, Est, Sud, Ouest). Sur une tribune, les stands se suivent par nom.
 */
export function placerStands<T extends { id: string; nom: string; tribune: Tribune | null }>(
  stands: readonly T[],
): Map<string, { tribune: Tribune; choisie: boolean; rang: number; surTribune: number }> {
  const tries = [...stands].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const parTribune = new Map<Tribune, { id: string; choisie: boolean }[]>(TRIBUNES.map((t) => [t.code, []]));
  const restants: T[] = [];
  for (const s of tries) {
    const t = s.tribune ?? tribuneDuNom(s.nom);
    if (t) parTribune.get(t)!.push({ id: s.id, choisie: s.tribune !== null });
    else restants.push(s);
  }
  for (const s of restants) {
    const moins = TRIBUNES.map((t) => t.code).reduce((a, b) => (parTribune.get(b)!.length < parTribune.get(a)!.length ? b : a));
    parTribune.get(moins)!.push({ id: s.id, choisie: false });
  }
  const places = new Map<string, { tribune: Tribune; choisie: boolean; rang: number; surTribune: number }>();
  for (const [tribune, liste] of parTribune) liste.forEach((s, rang) => places.set(s.id, { tribune, choisie: s.choisie, rang, surTribune: liste.length }));
  return places;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Part des commandes servies avec une file, en % ; null sous 5 commandes mesurées. */
export function partEnFile(file: { enFile: number; mesurables: number }): number | null {
  return file.mesurables >= SEUILS_STADE.fileMinCommandes ? Math.round((file.enFile / file.mesurables) * 100) : null;
}

/** Signaux d'un stand, les rouges d'abord. `enDirect` : un événement est ouvert. */
export function signauxStand(d: DonneesStand, enDirect: boolean, maintenant: number): SignalStand[] {
  const signaux: SignalStand[] = [];
  if (enDirect) {
    for (const l of d.stock.filter((x) => x.alerte === "rupture"))
      signaux.push({ couleur: "rouge", titre: `Rupture : ${l.nom}`, detail: `Reste ${Math.max(0, l.restant)} sur ${l.sur} · vendu ${l.vendu}. Réassort en deux gestes depuis « En direct ».`, lien: "/direct" });
    const pct = partEnFile(d.file);
    if (pct !== null && pct >= SEUILS_STADE.fileOrangePct) {
      const sature = pct >= SEUILS_STADE.fileRougePct;
      signaux.push({
        couleur: sature ? "rouge" : "orange",
        titre: `${sature ? "Saturé" : "Affluence"} : file d'attente sur ${pct} % des commandes`,
        detail: `Sur les ${SEUILS_STADE.fenetreMinutes} dernières minutes, ${d.file.enFile} commandes sur ${d.file.mesurables} servies avec un client qui attendait déjà.${sature ? " Ouvre une caisse de plus ou renforce le stand." : ""}`,
        lien: "/equipe",
      });
    }
    for (const l of d.stock.filter((x) => x.alerte === "faible"))
      signaux.push({ couleur: "orange", titre: `Stock faible : ${l.nom}`, detail: `Reste ${l.restant} sur ${l.sur} · vendu ${l.vendu}.`, lien: "/direct" });
  }
  for (const k of d.caisses.filter((x) => x.ouverte)) {
    if (k.aEnvoyer !== null && k.aEnvoyer > 0) {
      signaux.push({ couleur: "orange", titre: `Caisse ${k.numero} : ${pluriel(k.aEnvoyer, "ticket")} à envoyer`, detail: "La tablette n'a pas encore tout envoyé : vérifie son réseau (wifi ou 4G).", lien: "/caisses" });
      continue;
    }
    const silence = k.vueLe ? maintenant - Date.parse(k.vueLe) : null;
    if (silence === null || silence > DELAI_NOUVELLES_TABLETTE_MS)
      signaux.push({
        couleur: "orange",
        titre: `Caisse ${k.numero} : ${silence === null ? "aucune nouvelle de la tablette" : `pas de nouvelles de la tablette depuis ${Math.round(silence / 60_000)} min`}`,
        detail: "Les ventes faites sans réseau arriveront à son retour : vérifie qu'elle est allumée, avec du réseau.",
        lien: "/caisses",
      });
  }
  if (d.hygiene.nonConformes > 0)
    signaux.push({
      couleur: "orange",
      titre: `Hygiène : ${pluriel(d.hygiene.nonConformes, "température")} hors limite en 7 jours`,
      detail: "Un équipement du stand est sorti de ses limites : vérifie que l'action corrective a bien été faite.",
      lien: "/hygiene",
    });
  if (enDirect && d.hygiene.ouvertureARelever.length)
    signaux.push({ couleur: "orange", titre: `Hygiène : températures d'ouverture à relever (${d.hygiene.ouvertureARelever.length})`, detail: d.hygiene.ouvertureARelever.join(", ") + ".", lien: "/hygiene" });
  return signaux.sort((a, b) => (a.couleur === b.couleur ? 0 : a.couleur === "rouge" ? -1 : 1));
}

/** Couleur et état du stade, stand par stand. */
export function planStade(donnees: readonly DonneesStand[], evenement: { id: string; libelle: string } | null, maintenant: number): PlanStade {
  const places = placerStands(donnees);
  const stands = donnees.map((d): EtatStand => {
    const signaux = signauxStand(d, evenement !== null, maintenant);
    const ouvertes = d.caisses.filter((k) => k.ouverte).length;
    const couleur: CouleurStand = signaux.some((s) => s.couleur === "rouge") ? "rouge" : signaux.length ? "orange" : ouvertes > 0 ? "vert" : "gris";
    const caNet = d.caisses.reduce((s, k) => s + k.caNet, 0);
    const tickets = d.caisses.reduce((s, k) => s + k.tickets, 0);
    const p = places.get(d.id)!;
    return {
      id: d.id,
      nom: d.nom,
      tribune: p.tribune,
      tribuneChoisie: p.choisie,
      rang: p.rang,
      surTribune: p.surTribune,
      couleur,
      resume:
        couleur === "rouge" || couleur === "orange"
          ? signaux[0]!.titre + (signaux.length > 1 ? ` (+${signaux.length - 1})` : "")
          : couleur === "vert"
            ? evenement ? `Tout va bien · ${formaterMontant(caNet)}` : "Caisse ouverte, rien à signaler"
            : evenement ? "Fermé : aucune caisse ouverte" : "Hors événement",
      signaux,
      chiffres: { caNet, tickets, caissesOuvertes: ouvertes, caisses: d.caisses.length, filePct: evenement ? partEnFile(d.file) : null },
    };
  });
  const ordre = TRIBUNES.map((t) => t.code);
  stands.sort((a, b) => ordre.indexOf(a.tribune) - ordre.indexOf(b.tribune) || a.rang - b.rang);
  return { evenement, stands, seuils: SEUILS_STADE };
}
