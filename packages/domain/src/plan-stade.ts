/**
 * Le stade en direct (dossier §15.162, revu au §15.163) : chaque stand placé autour d'un stade en 3D, en couleur selon
 * ce qu'il faut savoir pendant les ventes ; un clic montre ses alertes. Seule la couleur se calcule ici : les chiffres
 * viennent de Caisses, Stock et Hygiène. Pas de file d'attente (décision de Rémi du 2026-10-12 : rien ne la mesure).
 *
 * Pendant l'événement ouvert :
 *   stock    rupture → rouge ; stock faible → orange ; rupture prévue dans 15 min ou moins au rythme des 15 dernières
 *            minutes → orange ; la réserve, quand elle en a, est rappelée (réassort possible)
 *   réseau   tablette sans nouvelles depuis plus de 2 min ou tickets à envoyer → orange ; plus de 15 min → rouge
 *   caisses  caisse ouverte sans vente depuis 15 min alors que le stade vend (une vente ailleurs dans les 5 dernières
 *            minutes) → orange ; ventes à un prix différent du tarif → orange ; 5 annulations ou plus et 5 % des
 *            tickets de la caisse ou plus → orange
 * Toujours :
 *   hygiène  température hors limite d'un équipement du stand (7 jours) → orange ; pendant l'événement, températures
 *            d'ouverture à relever → orange
 *   vert = au moins une caisse ouverte, rien à signaler ; gris = aucune caisse ouverte, rien à signaler
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

/** Décor du lieu en 3D (§15.164). */
export type ModeleLieu = "stade" | "patinoire" | "arene" | "salle";

export const MODELES_LIEU: readonly { code: ModeleLieu; libelle: string; detail: string }[] = [
  { code: "stade", libelle: "Stade", detail: "Football, rugby : terrain et quatre tribunes" },
  { code: "patinoire", libelle: "Patinoire", detail: "Hockey sur glace : piste, bandes et gradins" },
  { code: "arene", libelle: "Arène ronde", detail: "Basket, hand, volley, spectacles : gradins tout autour" },
  { code: "salle", libelle: "Salle de spectacle", detail: "Concert, festival : scène, fosse et gradins" },
];

/** Position d'un stand posé à la main sur le plan (unités de la scène, centre du lieu en 0,0). */
export interface PositionPlan {
  x: number;
  z: number;
}

/** Une position posée à la main reste dans ce rayon autour du centre. */
export const RAYON_PLAN = 120;

export const SEUILS_STADE = {
  /** Rythme de vente d'un produit : les 15 dernières minutes. */
  rythmeMinutes: 15,
  /** Rupture prévue dans 15 minutes ou moins à ce rythme. */
  rupturePrevueMinutes: 15,
  /** Tablette sans nouvelles : orange au-delà de 2 min, rouge au-delà de 15. */
  silenceRougeMinutes: 15,
  /** Caisse ouverte sans vente depuis 15 min, alors que le stade vend (une vente ailleurs dans les 5 dernières minutes). */
  sansVenteMinutes: 15,
  stadeVendMinutes: 5,
  /** Annulations : 5 au moins, et au moins 5 % des tickets de la caisse. */
  annulationsMin: 5,
  annulationsPct: 5,
  /** En direct (§15.166) : ventes des 10 dernières minutes ; rythme comparé à la moyenne de la soirée, dès 15 min d'ouverture. */
  recentesMinutes: 10,
  rythmeOuvertMinutes: 15,
  rythmeCalme: 0.6,
  rythmeSoutenu: 1.4,
} as const;

export type CouleurStand = "rouge" | "orange" | "vert" | "gris";

export interface SignalStand {
  couleur: "rouge" | "orange";
  titre: string;
  detail: string;
  lien: string;
  /** Alerte de stock : le produit, pour le réassort en deux gestes depuis l'écran. */
  produitId?: string;
}

export interface VentesRecentes {
  minutes: number;
  tickets: number;
  caNet: Centimes;
}

/** Ce que le serveur lit pour un stand actif. */
export interface DonneesStand {
  id: string;
  nom: string;
  tribune: Tribune | null;
  /** Posé à la main ; null : placé tout seul sur sa tribune. */
  position: PositionPlan | null;
  caisses: {
    numero: number;
    ouverte: boolean;
    /** Ouverture de la session en cours. */
    ouverteLe: string | null;
    /** Dernières nouvelles de la tablette d'une caisse ouverte. */
    vueLe: string | null;
    /** Tickets que la tablette a encore à envoyer ; null : inconnu. */
    aEnvoyer: number | null;
    /** Pendant l'événement ouvert : CA net, tickets nets (ventes − annulations), annulations, ventes hors tarif, dernière vente. */
    caNet: Centimes;
    tickets: number;
    annulations: number;
    horsTarif: number;
    derniereVente: string | null;
  }[];
  /** Ventes des 10 dernières minutes (tickets de vente, CA TTC). */
  recentes: { tickets: number; caNet: Centimes };
  /** Produits suivis en stock au stand pendant l'événement ouvert (vide sans suivi). */
  stock: { produitId: string; nom: string; alerte: AlerteStock; restant: number; sur: number; vendu: number; venduRecent: number; reserve: number | null }[];
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
  /** Posé à la main ; null : placé tout seul (tribune et rang). */
  position: PositionPlan | null;
  couleur: CouleurStand;
  resume: string;
  signaux: SignalStand[];
  chiffres: { caNet: Centimes; tickets: number; caissesOuvertes: number; caisses: number; derniereVente: string | null };
  /** En direct : ventes des 10 dernières minutes ; produits suivis, du plus entamé au moins entamé. */
  recentes: VentesRecentes;
  produits: { produitId: string; nom: string; restant: number; sur: number; alerte: AlerteStock }[];
}

/** Ce que le serveur ajoute pendant un événement ouvert : son ouverture, et le match précédent au même moment. */
export interface EntreeDirect {
  ouvertLe: string;
  comparaison: { libelle: string; caNet: Centimes } | null;
}

/** Le tableau En direct (§15.166) : chiffres de la soirée, rythme, comparaison, caisses. */
export interface Direct {
  ouvertLe: string;
  caNet: Centimes;
  tickets: number;
  recentes: VentesRecentes;
  /** CA par minute sur les 10 dernières minutes. */
  caParMinute: Centimes;
  /** Rythme des 10 dernières minutes rapporté à la moyenne de la soirée ; null avant 15 min d'ouverture ou sans vente. */
  rythme: "calme" | "normal" | "soutenu" | null;
  /** Le match précédent au même moment de sa soirée ; écart en points de base. */
  comparaison: { libelle: string; caNet: Centimes; ecartPb: number | null } | null;
  caisses: { ouvertes: number; total: number; sansNouvelles: number };
}

/** Réponse de GET /api/plan-stade. */
export interface PlanStade {
  modele: ModeleLieu;
  evenement: { id: string; libelle: string } | null;
  stands: EtatStand[];
  /** Pendant un événement ouvert seulement. */
  direct: Direct | null;
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

/** Minutes avant la rupture au rythme des 15 dernières minutes ; null sans vente récente ou déjà en rupture. */
export function minutesAvantRupture(restant: number, venduRecent: number): number | null {
  if (restant <= 0 || venduRecent <= 0) return null;
  return Math.max(1, Math.round(restant / (venduRecent / SEUILS_STADE.rythmeMinutes)));
}

/**
 * Signaux d'un stand, les rouges d'abord. `enDirect` : un événement est ouvert ; `stadeVend` : une vente a eu lieu
 * ailleurs dans les 5 dernières minutes.
 */
export function signauxStand(d: DonneesStand, contexte: { enDirect: boolean; stadeVend: boolean }, maintenant: number): SignalStand[] {
  const S = SEUILS_STADE;
  const depuis = (iso: string) => Math.max(0, Math.round((maintenant - Date.parse(iso)) / 60_000));
  const signaux: SignalStand[] = [];

  if (contexte.enDirect) {
    // Stock du stand.
    for (const l of d.stock) {
      const reserve = l.reserve !== null && l.reserve > 0 ? ` ${l.reserve} en réserve : réassort en deux gestes depuis « En direct ».` : "";
      if (l.alerte === "rupture") {
        signaux.push({ couleur: "rouge", titre: `Rupture : ${l.nom}`, detail: `Reste 0 sur ${l.sur} · vendu ${l.vendu}.${reserve || " Réassort en deux gestes depuis « En direct »."}`, lien: "/direct", produitId: l.produitId });
        continue;
      }
      const dans = minutesAvantRupture(l.restant, l.venduRecent);
      const prevue = dans !== null && dans <= S.rupturePrevueMinutes;
      if (l.alerte === "faible")
        signaux.push({ couleur: "orange", titre: `Stock faible : ${l.nom}`, detail: `Reste ${l.restant} sur ${l.sur} · vendu ${l.vendu}.${prevue ? ` Au rythme actuel, rupture dans ${dans} min environ.` : ""}${reserve}`, lien: "/direct", produitId: l.produitId });
      else if (prevue)
        signaux.push({ couleur: "orange", titre: `Rupture prévue : ${l.nom} dans ${dans} min environ`, detail: `Reste ${l.restant}, ${l.venduRecent} vendus ces ${S.rythmeMinutes} dernières minutes.${reserve}`, lien: "/direct", produitId: l.produitId });
    }
  }

  // Réseau des tablettes, et caisse ouverte qui ne vend plus.
  for (const k of d.caisses.filter((x) => x.ouverte)) {
    if (k.aEnvoyer !== null && k.aEnvoyer > 0) {
      signaux.push({ couleur: "orange", titre: `Caisse ${k.numero} : ${pluriel(k.aEnvoyer, "ticket")} à envoyer`, detail: "La tablette n'a pas encore tout envoyé : vérifie son réseau (wifi ou 4G).", lien: "/caisses" });
      continue;
    }
    const silence = k.vueLe ? maintenant - Date.parse(k.vueLe) : null;
    if (silence === null || silence > DELAI_NOUVELLES_TABLETTE_MS) {
      const minutes = silence === null ? null : Math.round(silence / 60_000);
      signaux.push({
        couleur: minutes !== null && minutes > S.silenceRougeMinutes ? "rouge" : "orange",
        titre: `Caisse ${k.numero} : ${minutes === null ? "aucune nouvelle de la tablette" : `pas de nouvelles de la tablette depuis ${minutes} min`}`,
        detail: "Les ventes faites sans réseau arriveront à son retour : vérifie qu'elle est allumée, chargée, avec du réseau.",
        lien: "/caisses",
      });
      continue;
    }
    if (contexte.enDirect && contexte.stadeVend && k.ouverteLe && depuis(k.ouverteLe) >= S.sansVenteMinutes) {
      const calme = k.derniereVente ? depuis(k.derniereVente) : null;
      if (calme === null || calme >= S.sansVenteMinutes)
        signaux.push({
          couleur: "orange",
          titre: `Caisse ${k.numero} : ${calme === null ? `aucune vente depuis l'ouverture (${depuis(k.ouverteLe)} min)` : `aucune vente depuis ${calme} min`}`,
          detail: "Le reste du stade vend : terminal de paiement, caissière absente ou stand bloqué ? Un coup d'œil s'impose.",
          lien: "/caisses",
        });
    }
  }

  // Ventes à vérifier pendant l'événement.
  if (contexte.enDirect)
    for (const k of d.caisses) {
      if (k.horsTarif > 0)
        signaux.push({
          couleur: "orange",
          titre: `Caisse ${k.numero} : ${pluriel(k.horsTarif, "vente")} à un prix différent du tarif`,
          detail: "La tablette n'a sans doute pas les derniers prix : relance-la avec du réseau. Le détail est dans le journal des tickets.",
          lien: "/caisses",
        });
      const total = k.tickets + k.annulations; // ventes enregistrées = tickets nets + ventes annulées
      if (k.annulations >= S.annulationsMin && k.annulations * 100 >= S.annulationsPct * total)
        signaux.push({
          couleur: "orange",
          titre: `Caisse ${k.numero} : ${k.annulations} annulations ce soir`,
          detail: `${Math.round((k.annulations * 100) / total)} % des tickets de la caisse : erreurs de saisie ou ventes à vérifier dans le journal des tickets.`,
          lien: "/caisses",
        });
    }

  // Hygiène des équipements du stand.
  if (d.hygiene.nonConformes > 0)
    signaux.push({
      couleur: "orange",
      titre: `Hygiène : ${pluriel(d.hygiene.nonConformes, "température")} hors limite en 7 jours`,
      detail: "Un équipement du stand est sorti de ses limites : vérifie que l'action corrective a bien été faite.",
      lien: "/hygiene",
    });
  if (contexte.enDirect && d.hygiene.ouvertureARelever.length)
    signaux.push({ couleur: "orange", titre: `Hygiène : températures d'ouverture à relever (${d.hygiene.ouvertureARelever.length})`, detail: d.hygiene.ouvertureARelever.join(", ") + ".", lien: "/hygiene" });

  return signaux.sort((a, b) => (a.couleur === b.couleur ? 0 : a.couleur === "rouge" ? -1 : 1));
}

/** Rythme des ventes récentes rapporté à la moyenne de la soirée. */
export function rythmeVentes(recentesCa: Centimes, caNet: Centimes, minutesOuvert: number): Direct["rythme"] {
  const S = SEUILS_STADE;
  if (minutesOuvert < S.rythmeOuvertMinutes || caNet <= 0) return null;
  const ratio = recentesCa / S.recentesMinutes / (caNet / minutesOuvert);
  return ratio < S.rythmeCalme ? "calme" : ratio > S.rythmeSoutenu ? "soutenu" : "normal";
}

/**
 * Couleur et état du lieu, stand par stand ; pendant un événement ouvert, les chiffres du tableau En direct.
 * Le stade « vend » s'il y a eu une vente dans les 5 dernières minutes, tous stands confondus.
 */
export function planStade(
  modele: ModeleLieu,
  donnees: readonly DonneesStand[],
  evenement: { id: string; libelle: string } | null,
  maintenant: number,
  entreeDirect: EntreeDirect | null = null,
): PlanStade {
  const stadeVend = donnees.some((d) => d.caisses.some((k) => k.derniereVente && maintenant - Date.parse(k.derniereVente) <= SEUILS_STADE.stadeVendMinutes * 60_000));
  const recentes = (d: DonneesStand): VentesRecentes => ({ minutes: SEUILS_STADE.recentesMinutes, tickets: evenement ? d.recentes.tickets : 0, caNet: evenement ? d.recentes.caNet : 0 });
  const places = placerStands(donnees);
  const stands = donnees.map((d): EtatStand => {
    const signaux = signauxStand(d, { enDirect: evenement !== null, stadeVend }, maintenant);
    const ouvertes = d.caisses.filter((k) => k.ouverte).length;
    const couleur: CouleurStand = signaux.some((s) => s.couleur === "rouge") ? "rouge" : signaux.length ? "orange" : ouvertes > 0 ? "vert" : "gris";
    const caNet = d.caisses.reduce((s, k) => s + k.caNet, 0);
    const tickets = d.caisses.reduce((s, k) => s + k.tickets, 0);
    const derniereVente = d.caisses.map((k) => k.derniereVente).filter((x): x is string => x !== null).sort().at(-1) ?? null;
    const p = places.get(d.id)!;
    return {
      id: d.id,
      nom: d.nom,
      tribune: p.tribune,
      tribuneChoisie: p.choisie,
      rang: p.rang,
      surTribune: p.surTribune,
      position: d.position,
      couleur,
      resume:
        couleur === "rouge" || couleur === "orange"
          ? signaux[0]!.titre + (signaux.length > 1 ? ` (+${signaux.length - 1})` : "")
          : couleur === "vert"
            ? evenement ? `Tout va bien · ${formaterMontant(caNet)}` : "Caisse ouverte, rien à signaler"
            : evenement ? "Fermé : aucune caisse ouverte" : "Hors événement",
      signaux,
      chiffres: { caNet, tickets, caissesOuvertes: ouvertes, caisses: d.caisses.length, derniereVente: evenement ? derniereVente : null },
      recentes: recentes(d),
      produits: evenement
        ? d.stock
            .filter((l) => l.sur > 0)
            .map((l) => ({ produitId: l.produitId, nom: l.nom, restant: Math.max(0, l.restant), sur: l.sur, alerte: l.alerte }))
            .sort((a, b) => a.restant / a.sur - b.restant / b.sur || a.nom.localeCompare(b.nom, "fr"))
        : [],
    };
  });
  const ordre = TRIBUNES.map((t) => t.code);
  stands.sort((a, b) => ordre.indexOf(a.tribune) - ordre.indexOf(b.tribune) || a.rang - b.rang);

  let direct: Direct | null = null;
  if (evenement && entreeDirect) {
    const caNet = stands.reduce((s, x) => s + x.chiffres.caNet, 0);
    const tickets = stands.reduce((s, x) => s + x.chiffres.tickets, 0);
    const rec: VentesRecentes = { minutes: SEUILS_STADE.recentesMinutes, tickets: stands.reduce((s, x) => s + x.recentes.tickets, 0), caNet: stands.reduce((s, x) => s + x.recentes.caNet, 0) };
    const caisses = donnees.flatMap((d) => d.caisses);
    const ouvertes = caisses.filter((k) => k.ouverte);
    const c = entreeDirect.comparaison;
    direct = {
      ouvertLe: entreeDirect.ouvertLe,
      caNet,
      tickets,
      recentes: rec,
      caParMinute: Math.round(rec.caNet / SEUILS_STADE.recentesMinutes),
      rythme: rythmeVentes(rec.caNet, caNet, (maintenant - Date.parse(entreeDirect.ouvertLe)) / 60_000),
      comparaison: c ? { ...c, ecartPb: c.caNet > 0 ? Math.round(((caNet - c.caNet) / c.caNet) * 10_000) : null } : null,
      caisses: {
        ouvertes: ouvertes.length,
        total: caisses.length,
        sansNouvelles: ouvertes.filter((k) => !k.vueLe || maintenant - Date.parse(k.vueLe) > DELAI_NOUVELLES_TABLETTE_MS).length,
      },
    };
  }
  return { modele, evenement, stands, direct, seuils: SEUILS_STADE };
}
