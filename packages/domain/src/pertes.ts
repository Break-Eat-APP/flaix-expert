/**
 * Revenue Engine — « Où je perds de l'argent » (module 6 Optimisation du prototype ; dossier §14 module 6,
 * §15.22, §15.138). Règles fixes, aucune IA.
 *
 * Il ne recalcule aucun chiffre qui vit ailleurs : il lit les ventes, les marges et les cibles (Résultats),
 * le stock (mise en place, comptages), les Z (Clôtures) et l'heure de chaque ticket, puis il chiffre ce que
 * chaque écart coûte et le classe par montant. Quatre familles, jamais additionnées entre elles :
 *   - argent perdu : constaté (écarts de stock, manques d'espèces, ventes sous le tarif) ou estimé en
 *     fourchette (ventes manquées par rupture) ;
 *   - pistes de gain : ordres de grandeur (sous la cible, volume × marge, écarts entre stands) ;
 *   - accordé : offerts, remises, fidélité (choix du lieu, pas des pertes) ;
 *   - signes sans chiffrage : caisse à plein régime, rupture trop tôt pour être chiffrée.
 */
import { formaterMontant, type Centimes } from "./argent.ts";
import type { Evenement, ProduitVendu } from "./modele.ts";
import { etatCible, tauxMargePb } from "./finances.ts";
import { formaterQuantiteStock } from "./stock-ingredients.ts";
import type { UniteIngredient } from "./recettes.ts";

const MINUTE = 60_000;

/** Seuils du §15.138 : écrits une fois, ici. */
export const REGLES_PERTES = {
  /** Tickets du stand avant la rupture pour pouvoir la chiffrer. */
  ruptureTicketsAvant: 20,
  /** En dessous, la rupture est arrivée en toute fin : rien à signaler. */
  ruptureTicketsApres: 5,
  ruptureFenetreMinutes: 30,
  ruptureTicketsFenetre: 10,
  /** Volume × marge : écart de part minimal (points) et nombre de produits avec coût. */
  volumeMargeEcartPoints: 1,
  volumeMargeProduits: 3,
  /** Écarts entre stands : moins de la moitié du taux du meilleur stand. */
  standsRapport: 0.5,
  standsTicketsMin: 30,
  standsVentesMeilleur: 10,
  /** Caisse à plein régime : tranches de 5 min, 85 % du maximum, 3 tranches de suite, maximum ≥ 10 tickets. */
  saturationTrancheMinutes: 5,
  saturationPart: 0.85,
  saturationTranches: 3,
  saturationMaxMin: 10,
  pistesMax: 3,
  signesMax: 5,
} as const;

const heureFr = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
/** 21:12 → « 21 h 12 ». */
export const heureParis = (ms: number) => heureFr.format(new Date(ms)).replace(":", " h ");
const pct = (pb: number) => `${(pb / 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const part = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const pluriel = (n: number, mot: string, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`;
const surEvenements = (n: number) => (n > 1 ? ` sur ${n} événements` : "");

// ───────────────────────────── Ruptures ─────────────────────────────

export interface EstimationRupture {
  /** Heure de la dernière vente du produit au stand (ms). */
  ruptureA: number;
  /** Heure du dernier ticket du stand (ms). */
  finStand: number;
  minutesSans: number;
  ticketsAvant: number;
  ticketsApres: number;
  /** Ventes manquées, en fourchette ; null : trop peu de ventes avant la rupture pour chiffrer. */
  ventes: { bas: number; haut: number } | null;
}

/**
 * Ventes manquées par une rupture, au rythme du stand (§15.138) :
 *   taux = unités du produit ÷ tickets du stand, (a) depuis le début jusqu'à la rupture, (b) sur les 30 min avant ;
 *   ventes manquées = taux × tickets du stand après la rupture, du plus petit au plus grand des deux taux.
 * null si le stand a fait moins de 5 tickets après la rupture (rupture en toute fin : rien à signaler).
 */
export function estimerRupture(ticketsStand: readonly number[], ventesProduit: readonly { t: number; q: number }[]): EstimationRupture | null {
  const ventes = ventesProduit.filter((v) => v.q > 0);
  if (ventes.length === 0 || ticketsStand.length === 0) return null;
  const R = REGLES_PERTES;
  const ruptureA = Math.max(...ventes.map((v) => v.t));
  const finStand = Math.max(...ticketsStand);
  const ticketsAvant = ticketsStand.filter((t) => t <= ruptureA).length;
  const ticketsApres = ticketsStand.filter((t) => t > ruptureA).length;
  if (ticketsApres < R.ruptureTicketsApres) return null;
  const base = { ruptureA, finStand, minutesSans: Math.round((finStand - ruptureA) / MINUTE), ticketsAvant, ticketsApres };
  if (ticketsAvant < R.ruptureTicketsAvant) return { ...base, ventes: null };
  const unites = ventes.reduce((s, v) => s + v.q, 0);
  const tauxGlobal = unites / ticketsAvant;
  const debutFenetre = ruptureA - R.ruptureFenetreMinutes * MINUTE;
  const ticketsFenetre = ticketsStand.filter((t) => t > debutFenetre && t <= ruptureA).length;
  const unitesFenetre = ventes.filter((v) => v.t > debutFenetre).reduce((s, v) => s + v.q, 0);
  const tauxRecent = ticketsFenetre >= R.ruptureTicketsFenetre ? unitesFenetre / ticketsFenetre : tauxGlobal;
  return {
    ...base,
    ventes: {
      bas: Math.floor(Math.min(tauxGlobal, tauxRecent) * ticketsApres + 1e-9),
      haut: Math.ceil(Math.max(tauxGlobal, tauxRecent) * ticketsApres - 1e-9),
    },
  };
}

export interface EntreeRupture {
  evenement: string;
  standId: string;
  stand: string;
  produitId: string;
  produit: string;
  /** Heures des tickets non annulés du stand. */
  ticketsStand: number[];
  /** Ventes non annulées du produit au stand. */
  ventesProduit: { t: number; q: number }[];
  /** CA HT et quantité du produit à ce stand (pour la marge par vente). */
  caHt: Centimes;
  quantite: number;
  coutUnitaire: Centimes | null;
}

// ───────────────────────────── Postes ─────────────────────────────

export type FamillePerte = "rupture" | "stock" | "especes" | "tarif" | "cible" | "volume_marge" | "stands";

export interface PostePerte {
  famille: FamillePerte;
  /** constaté (argent réellement perdu), estimé (fourchette), piste (ordre de grandeur). */
  nature: "constate" | "estime" | "piste";
  /** Phrase de décision : quoi regarder. */
  titre: string;
  /** Le calcul, en clair. */
  detail: string;
  /** Montant en centimes ; bas = haut quand il est exact. */
  bas: Centimes;
  haut: Centimes;
  /** false : écart compté en unités, sans valeur (coût manquant). */
  montantConnu: boolean;
  /** Montant en CA HT faute de coût d'achat. */
  coutManquant?: boolean;
  /** Écran où agir. */
  lien: string;
}

export interface SignePerte {
  titre: string;
  detail: string;
}

export interface LigneEcartStock {
  evenement: string;
  /** Identifiant du produit ou de l'ingrédient (les écarts d'une même clé se compensent entre stands). */
  cle: string;
  nom: string;
  stand: string;
  /** Écart compté − théorique (unités, ou millièmes pour un ingrédient). */
  ecart: number;
  /** Valeur de l'écart au coût d'achat ; null : coût manquant. */
  valeur: Centimes | null;
  /** Ingrédient : unité de la quantité ; null pour un produit à l'unité. */
  unite: UniteIngredient | null;
}

export interface LigneEspeces {
  evenement: string;
  /** « Caisse 3 (Buvette Nord) » ou « Coffre ». */
  libelle: string;
  ecart: Centimes | null;
}

export interface LigneSousTarif {
  produit: string;
  quantite: number;
  prixVendu: Centimes;
  prixTarif: Centimes;
  tauxTarif: number;
}

export interface LigneProduitStand {
  produitId: string;
  produit: string;
  standId: string;
  stand: string;
  quantite: number;
  caHt: Centimes;
}

export interface CaisseHoraire {
  evenement: string;
  caisse: number;
  stand: string;
  /** Heures des tickets non annulés de la caisse. */
  tickets: number[];
}

export interface EntreePertes {
  /** Nombre d'événements analysés (1 pour un événement). */
  evenements: number;
  ruptures: EntreeRupture[];
  stock: LigneEcartStock[];
  especes: LigneEspeces[];
  sousTarif: LigneSousTarif[];
  /** Produits vendus sur la portée (événement ou période), avec coût et cible. */
  produits: ProduitVendu[];
  produitsParStand: LigneProduitStand[];
  /** Tickets non annulés par stand, sur la portée. */
  ticketsParStand: Record<string, number>;
  reductions: { remises: Centimes; offerts: Centimes; fidelite: Centimes };
  caisses: CaisseHoraire[];
}

/** Réponse de GET /api/pertes : les événements analysés, ce qui était suivi, l'analyse. */
export interface ReponsePertes {
  evenements: { id: string; libelle: string; debut: string; etat: Evenement["etat"] }[];
  /** Sans stock suivi, ni rupture ni écart de stock ne peut être vu ; sans comptage, ni manque d'espèces. */
  suivi: { stock: boolean; especes: boolean };
  analyse: AnalysePertes;
}

export interface AnalysePertes {
  perdu: PostePerte[];
  pistes: PostePerte[];
  accorde: { remises: Centimes; offerts: Centimes; fidelite: Centimes };
  signes: SignePerte[];
  totaux: { constate: Centimes; estimeBas: Centimes; estimeHaut: Centimes };
}

const parMontant = (a: PostePerte, b: PostePerte) => b.haut - a.haut || b.bas - a.bas || a.titre.localeCompare(b.titre, "fr");

function postesRuptures(entrees: readonly EntreeRupture[], signes: SignePerte[], nbEvenements: number): PostePerte[] {
  const groupes = new Map<string, { e: EntreeRupture; est: EstimationRupture; ventes: { bas: number; haut: number }; montant: { bas: number; haut: number }; nb: number; coutManquant: boolean }>();
  for (const e of entrees) {
    const est = estimerRupture(e.ticketsStand, e.ventesProduit);
    if (!est) continue;
    if (!est.ventes) {
      signes.push({
        titre: `Rupture de ${e.produit} à ${e.stand}${nbEvenements > 1 ? ` (${e.evenement})` : ""}, à ${heureParis(est.ruptureA)}`,
        detail: `Le stand n'avait fait que ${pluriel(est.ticketsAvant, "ticket")} avant : trop peu pour chiffrer les ventes manquées. ${pluriel(est.ticketsApres, "ticket")} ensuite.`,
      });
      continue;
    }
    const coutManquant = e.coutUnitaire === null;
    // Marge par vente à ce stand (prix HT moyen réalisé − coût) ; sans coût, le CA HT par vente.
    const parVente = e.quantite > 0 ? Math.max(0, e.caHt / e.quantite - (e.coutUnitaire ?? 0)) : 0;
    const cle = `${e.standId}|${e.produitId}`;
    const g = groupes.get(cle);
    const montant = { bas: Math.round(est.ventes.bas * parVente), haut: Math.round(est.ventes.haut * parVente) };
    if (!g) groupes.set(cle, { e, est, ventes: { ...est.ventes }, montant, nb: 1, coutManquant });
    else {
      g.ventes.bas += est.ventes.bas;
      g.ventes.haut += est.ventes.haut;
      g.montant.bas += montant.bas;
      g.montant.haut += montant.haut;
      g.nb += 1;
      g.coutManquant ||= coutManquant;
      if (est.ruptureA >= g.est.ruptureA) {
        g.e = e;
        g.est = est;
      }
    }
  }
  return [...groupes.values()].map(({ e, est, ventes, montant, nb, coutManquant }) => {
    const quand = nb > 1 ? `rupture${surEvenements(nb)} (dernière : ${e.evenement}, à ${heureParis(est.ruptureA)})` : `rupture à ${heureParis(est.ruptureA)}, ${est.minutesSans} min avant la fin des ventes du stand`;
    const fourchette = ventes.bas === ventes.haut ? `${ventes.bas}` : `entre ${ventes.bas} et ${ventes.haut}`;
    const argent = montant.bas === montant.haut ? formaterMontant(montant.haut) : `${formaterMontant(montant.bas)} à ${formaterMontant(montant.haut)}`;
    return {
      famille: "rupture",
      nature: "estime",
      titre: `Mettre plus de ${e.produit} à ${e.stand} : ${quand}`,
      detail: `${fourchette} ventes manquées, d'après le rythme du stand avant la rupture et ses tickets après : ${argent} ${coutManquant ? "de CA HT (coût manquant)" : "de marge"}. Les clients partis sans rien acheter ne sont pas comptés.`,
      bas: montant.bas,
      haut: montant.haut,
      montantConnu: true,
      coutManquant,
      lien: "/stock",
    } satisfies PostePerte;
  });
}

/** Écarts de stock : par événement, les stands se compensent (déplacés, pas perdus) ; seule la perte nette compte. */
function postesStock(lignes: readonly LigneEcartStock[]): PostePerte[] {
  const parEvenement = new Map<string, LigneEcartStock[]>();
  for (const l of lignes) {
    const k = `${l.evenement}|${l.cle}`;
    parEvenement.set(k, [...(parEvenement.get(k) ?? []), l]);
  }
  const parCle = new Map<string, { nom: string; unite: UniteIngredient | null; perte: number; valeur: number; valeurInconnue: boolean; compense: number; nb: number; stands: Map<string, number> }>();
  for (const groupe of parEvenement.values()) {
    const net = groupe.reduce((s, l) => s + l.ecart, 0);
    if (net >= 0) continue;
    const manquant = -groupe.filter((l) => l.ecart < 0).reduce((s, l) => s + l.ecart, 0);
    const surplus = groupe.filter((l) => l.ecart > 0).reduce((s, l) => s + l.ecart, 0);
    const valeurs = groupe.map((l) => l.valeur);
    const inconnue = valeurs.some((v) => v === null);
    const l0 = groupe[0]!;
    const g = parCle.get(l0.cle) ?? { nom: l0.nom, unite: l0.unite, perte: 0, valeur: 0, valeurInconnue: false, compense: 0, nb: 0, stands: new Map<string, number>() };
    g.perte += -net;
    g.valeur += inconnue ? 0 : -valeurs.reduce((s: number, v) => s + v!, 0);
    g.valeurInconnue ||= inconnue;
    g.compense += Math.min(manquant, surplus);
    g.nb += 1;
    for (const l of groupe) g.stands.set(l.stand, (g.stands.get(l.stand) ?? 0) + l.ecart);
    parCle.set(l0.cle, g);
  }
  const qte = (n: number, u: UniteIngredient | null) => (u ? formaterQuantiteStock(Math.abs(n), u) : `${Math.abs(n)}`);
  return [...parCle.values()].map((g) => {
    const detailStands = [...g.stands].filter(([, e]) => e !== 0).map(([s, e]) => `${s} ${e > 0 ? "+" : "−"}${qte(e, g.unite)}`).join(", ");
    const s = g.unite || g.compense > 1 ? "s" : "";
    const compense = g.compense > 0 ? ` ; ${qte(g.compense, g.unite)} compensé${s} d'un stand à l'autre (déplacé${s}, pas perdu${s})` : "";
    const valeur = Math.round(g.valeur);
    return {
      famille: "stock",
      nature: "constate",
      titre: `Contrôler le stock de ${g.nom} : ${qte(g.perte, g.unite)} manque${g.unite || g.perte > 1 ? "nt" : ""} au comptage${surEvenements(g.nb)}`,
      detail: `${detailStands}${compense}. ${g.valeurInconnue ? "Valeur inconnue : coût d'achat manquant." : `Valeur au coût d'achat : ${formaterMontant(valeur)}.`}`,
      bas: valeur,
      haut: valeur,
      montantConnu: !g.valeurInconnue,
      lien: "/stock",
    } satisfies PostePerte;
  });
}

function postesEspeces(lignes: readonly LigneEspeces[], signes: SignePerte[]): PostePerte[] {
  const manques = new Map<string, { montant: number; nb: number }>();
  let excedent = 0;
  const excedents: string[] = [];
  for (const l of lignes) {
    if (l.ecart === null || l.ecart === 0) continue;
    if (l.ecart > 0) {
      excedent += l.ecart;
      if (!excedents.includes(l.libelle)) excedents.push(l.libelle);
      continue;
    }
    const g = manques.get(l.libelle) ?? { montant: 0, nb: 0 };
    g.montant += -l.ecart;
    g.nb += 1;
    manques.set(l.libelle, g);
  }
  if (excedent > 0) {
    signes.push({ titre: `Excédent d'espèces de ${formaterMontant(excedent)}`, detail: `${excedents.join(", ")} : plus d'argent que prévu au comptage. Ce n'est pas une perte, mais un rendu de monnaie ou une vente non enregistrée à expliquer.` });
  }
  return [...manques].map(([libelle, g]) => ({
    famille: "especes",
    nature: "constate",
    titre: libelle === "Coffre" ? `Vérifier le coffre : ${formaterMontant(g.montant)} manquent au comptage${surEvenements(g.nb)}` : `Vérifier le tiroir de la ${libelle.charAt(0).toLowerCase()}${libelle.slice(1)} : ${formaterMontant(g.montant)} manquent au comptage${surEvenements(g.nb)}`,
    detail: "Écart du comptage qui fait foi (la dernière rectification signée, sinon le Z).",
    bas: g.montant,
    haut: g.montant,
    montantConnu: true,
    lien: "/clotures",
  }));
}

/** Ventes sous le tarif : (tarif − vendu) × quantité, ramené en HT au taux du tarif. */
function postesSousTarif(lignes: readonly LigneSousTarif[]): PostePerte[] {
  const parProduit = new Map<string, { quantite: number; ttc: number; ht: number; dernier: LigneSousTarif }>();
  for (const l of lignes) {
    if (l.prixVendu >= l.prixTarif || l.quantite <= 0) continue;
    const ttc = (l.prixTarif - l.prixVendu) * l.quantite;
    const g = parProduit.get(l.produit) ?? { quantite: 0, ttc: 0, ht: 0, dernier: l };
    g.quantite += l.quantite;
    g.ttc += ttc;
    g.ht += (ttc * 10_000) / (10_000 + l.tauxTarif);
    g.dernier = l;
    parProduit.set(l.produit, g);
  }
  return [...parProduit].map(([produit, g]) => {
    const ht = Math.round(g.ht);
    return {
      famille: "tarif",
      nature: "constate",
      titre: `Vérifier le prix de ${produit} sur les tablettes : ${g.quantite} vendu${g.quantite > 1 ? "s" : ""} sous le tarif (${formaterMontant(g.dernier.prixVendu)} au lieu de ${formaterMontant(g.dernier.prixTarif)})`,
      detail: `Non encaissé : ${formaterMontant(g.ttc)} TTC, soit ${formaterMontant(ht)} HT. Une tablette restée sans réseau garde l'ancien prix jusqu'à sa reconnexion.`,
      bas: ht,
      haut: ht,
      montantConnu: true,
      lien: "/caisses",
    } satisfies PostePerte;
  });
}

/** Sous la cible de marge (§15.132) : cible × CA HT − marge réalisée. */
function pistesCible(produits: readonly ProduitVendu[]): PostePerte[] {
  return produits.flatMap((p) => {
    const etat = etatCible(tauxMargePb(p.marge, p.caHt), p.cibleMarge ?? null);
    if (etat.statut !== "sous" || p.marge === null) return [];
    const manque = Math.round((etat.ciblePb! * p.caHt) / 10_000) - p.marge;
    if (manque <= 0) return [];
    return [
      {
        famille: "cible",
        nature: "piste",
        titre: `Revoir le prix ou le coût de ${p.nom} : marge de ${pct(etat.tauxPb!)} pour une cible de ${pct(etat.ciblePb!)}`,
        detail: `À la cible, ${formaterMontant(manque)} de marge en plus sur ${formaterMontant(p.caHt)} de CA HT (${pluriel(p.quantite, "vente")}), à ventes égales.`,
        bas: manque,
        haut: manque,
        montantConnu: true,
        lien: "/parametres/produits",
      } satisfies PostePerte,
    ];
  });
}

/** Volume × marge (formules du module 6, inchangées). */
function pistesVolumeMarge(produits: readonly ProduitVendu[]): PostePerte[] {
  const connus = produits.filter((p) => p.quantite > 0 && p.marge !== null);
  if (connus.length < REGLES_PERTES.volumeMargeProduits) return [];
  const volume = connus.reduce((s, p) => s + p.quantite, 0);
  const marge = connus.reduce((s, p) => s + p.marge!, 0);
  if (volume <= 0 || marge <= 0) return [];
  return connus
    .map((p) => {
      const partVolume = (p.quantite / volume) * 100;
      const partMarge = (p.marge! / marge) * 100;
      const resteVolume = volume - p.quantite;
      const margeReste = resteVolume > 0 ? (marge - p.marge!) / resteVolume : null;
      const parVente = p.marge! / p.quantite;
      const ecart = margeReste === null ? 0 : Math.round((margeReste - parVente) * p.quantite);
      return { p, partVolume, partMarge, margeReste, parVente, ecart };
    })
    .filter((x) => x.partVolume - x.partMarge > REGLES_PERTES.volumeMargeEcartPoints && x.ecart > 0)
    .sort((a, b) => b.ecart - a.ecart)
    .slice(0, REGLES_PERTES.pistesMax)
    .map(({ p, partVolume, partMarge, margeReste, parVente, ecart }) => ({
      famille: "volume_marge",
      nature: "piste",
      titre: `${p.nom} : ${part(partVolume)} des ventes pour ${part(partMarge)} de la marge`,
      detail: `${formaterMontant(Math.round(parVente))} de marge par vente, contre ${formaterMontant(Math.round(margeReste!))} pour le reste de la carte : sur ${pluriel(p.quantite, "vente")}, ${formaterMontant(ecart)} d'écart. Ordre de grandeur, pas une prévision : à toi de voir s'il faut le repositionner, le remplacer ou le garder.`,
      bas: ecart,
      haut: ecart,
      montantConnu: true,
      lien: "/parametres/produits",
    }));
}

/** Écarts entre stands, ramenés aux tickets de chaque stand (§15.138). */
function pistesStands(lignes: readonly LigneProduitStand[], tickets: Record<string, number>, produits: readonly ProduitVendu[], exclus: ReadonlySet<string>): PostePerte[] {
  const R = REGLES_PERTES;
  const parProduit = new Map<string, LigneProduitStand[]>();
  for (const l of lignes) if (l.quantite > 0 && (tickets[l.standId] ?? 0) > 0) parProduit.set(l.produitId, [...(parProduit.get(l.produitId) ?? []), l]);
  const fiche = new Map(produits.map((p) => [p.produitId, p]));
  const postes: PostePerte[] = [];
  for (const [produitId, liste] of parProduit) {
    const comparables = liste.filter((l) => !exclus.has(`${l.standId}|${produitId}`));
    if (comparables.length < 2) continue;
    const taux = (l: LigneProduitStand) => l.quantite / tickets[l.standId]!;
    const meilleur = [...comparables].sort((a, b) => taux(b) - taux(a))[0]!;
    if (meilleur.quantite < R.standsVentesMeilleur) continue;
    const p = fiche.get(produitId);
    const coutManquant = !p || p.marge === null;
    const parVente = p && p.quantite > 0 ? (coutManquant ? p.caHt / p.quantite : p.marge! / p.quantite) : 0;
    if (parVente <= 0) continue;
    for (const l of comparables) {
      if (l === meilleur || tickets[l.standId]! < R.standsTicketsMin || taux(l) >= taux(meilleur) * R.standsRapport) continue;
      const potentiel = Math.round((taux(meilleur) - taux(l)) * tickets[l.standId]!);
      if (potentiel <= 0) continue;
      const montant = Math.round(potentiel * parVente);
      const pour100 = (x: LigneProduitStand) => Math.round(taux(x) * 100);
      postes.push({
        famille: "stands",
        nature: "piste",
        titre: `${l.produit} à ${l.stand} : ${pour100(l)} pour 100 tickets, contre ${pour100(meilleur)} à ${meilleur.stand}`,
        detail: `Au rythme de ${meilleur.stand}, ${pluriel(potentiel, "vente")} de plus, ≈ ${formaterMontant(montant)} ${coutManquant ? "de CA HT (coût manquant)" : "de marge"}. Emplacement, affichage, équipe, public ? Ordre de grandeur, pas une prévision.`,
        bas: montant,
        haut: montant,
        montantConnu: true,
        coutManquant,
        lien: "/parametres/produits",
      });
    }
  }
  return postes.sort(parMontant).slice(0, R.pistesMax);
}

export interface PleinRegime {
  /** Début et fin (ms) de la plus longue suite de tranches à 85 % du maximum. */
  debut: number;
  fin: number;
  /** Maximum de tickets en une tranche de 5 minutes. */
  maximum: number;
  minutes: number;
}

/** Caisse à plein régime : au moins 85 % de son maximum pendant 3 tranches de 5 min de suite (§15.138). */
export function pleinRegime(tickets: readonly number[]): PleinRegime | null {
  const R = REGLES_PERTES;
  if (tickets.length === 0) return null;
  const largeur = R.saturationTrancheMinutes * MINUTE;
  const comptes = new Map<number, number>();
  for (const t of tickets) comptes.set(Math.floor(t / largeur), (comptes.get(Math.floor(t / largeur)) ?? 0) + 1);
  const maximum = Math.max(...comptes.values());
  if (maximum < R.saturationMaxMin) return null;
  const seuil = maximum * R.saturationPart;
  const premiere = Math.min(...comptes.keys());
  const derniere = Math.max(...comptes.keys());
  let meilleure: { de: number; a: number } | null = null;
  let de: number | null = null;
  for (let k = premiere; k <= derniere + 1; k++) {
    const plein = (comptes.get(k) ?? 0) >= seuil;
    if (plein && de === null) de = k;
    if (!plein && de !== null) {
      if (k - de >= R.saturationTranches && (!meilleure || k - de > meilleure.a - meilleure.de)) meilleure = { de, a: k };
      de = null;
    }
  }
  if (!meilleure) return null;
  return { debut: meilleure.de * largeur, fin: meilleure.a * largeur, maximum, minutes: (meilleure.a - meilleure.de) * R.saturationTrancheMinutes };
}

function signesPleinRegime(caisses: readonly CaisseHoraire[], nbEvenements: number): SignePerte[] {
  return caisses
    .flatMap((c) => {
      const p = pleinRegime(c.tickets);
      return p ? [{ c, p }] : [];
    })
    .sort((a, b) => b.p.minutes - a.p.minutes || b.p.maximum - a.p.maximum)
    .slice(0, REGLES_PERTES.signesMax)
    .map(({ c, p }) => ({
      titre: `${c.stand}, caisse ${c.caisse} : à plein régime de ${heureParis(p.debut)} à ${heureParis(p.fin)}${nbEvenements > 1 ? ` (${c.evenement})` : ""}`,
      detail: `Jusqu'à ${p.maximum} tickets en 5 minutes, son maximum, tenu ${p.minutes} minutes : signe probable d'une file d'attente. Une caisse de plus à ce moment-là ? Non chiffré : FlaiX ne voit pas les clients partis sans acheter.`,
    }));
}

/** Analyse complète d'un événement ou d'une période (§15.138). */
export function analyserPertes(e: EntreePertes): AnalysePertes {
  const signes: SignePerte[] = [];
  const ruptures = postesRuptures(e.ruptures, signes, e.evenements);
  const perdu = [...ruptures, ...postesStock(e.stock), ...postesEspeces(e.especes, signes), ...postesSousTarif(e.sousTarif)].sort(parMontant);
  const enRupture = new Set(e.ruptures.filter((r) => estimerRupture(r.ticketsStand, r.ventesProduit)).map((r) => `${r.standId}|${r.produitId}`));
  const pistes = [
    ...pistesCible(e.produits),
    ...pistesVolumeMarge(e.produits),
    ...pistesStands(e.produitsParStand, e.ticketsParStand, e.produits, enRupture),
  ].sort(parMontant);
  signes.push(...signesPleinRegime(e.caisses, e.evenements));
  const constates = perdu.filter((p) => p.nature === "constate");
  const estimes = perdu.filter((p) => p.nature === "estime");
  return {
    perdu,
    pistes,
    accorde: e.reductions,
    signes,
    totaux: {
      constate: constates.reduce((s, p) => s + p.haut, 0),
      estimeBas: estimes.reduce((s, p) => s + p.bas, 0),
      estimeHaut: estimes.reduce((s, p) => s + p.haut, 0),
    },
  };
}
