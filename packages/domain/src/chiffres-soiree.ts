import type { Centimes } from "./argent.ts";

/**
 * Les chiffres de la soirée (dossier §15.171, demande de Rémi du 2026-10-21) : ce que les ventes disent du public et
 * du service, au-delà du chiffre d'affaires. Rien n'est supposé : un chiffre dont la donnée manque (affluence, heures
 * du personnel, ventes Click & Collect) vaut null, et l'écran dit ce qui manque.
 */

export type FamilleCategorie = "boisson" | "nourriture" | "autre";

export const FAMILLES_CATEGORIE: ReadonlyArray<{ cle: FamilleCategorie; libelle: string }> = [
  { cle: "boisson", libelle: "Boissons" },
  { cle: "nourriture", libelle: "Nourriture" },
  { cle: "autre", libelle: "Autre" },
];

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const BOISSON = /(boisson|biere|soda|soft|vin\b|vins\b|eau\b|eaux\b|cafe|the\b|jus\b|cocktail|alcool|champagne|cidre|spiritueux|pression|aperitif|drink|limonade|coca|sirop|chocolat chaud|whisky|rhum|vodka|pinte|demi\b)/;
const NOURRITURE = /(snack|food|nourriture|manger|sandwich|hot.?dog|frite|burger|pizza|sale|sucre|dessert|glace|crepe|gaufre|plat|restauration|chips|confiserie|bonbon|viennoiserie|menu|panini|kebab|croque|saucisse|merguez|tacos|nachos|popcorn|pop-corn|bretzel|cookie|muffin|beignet|box)/;

/** Famille devinée d'après un nom de catégorie (ou de produit, sans catégorie) ; « autre » si rien ne la désigne. */
export function devinerFamille(nom: string): FamilleCategorie {
  const n = sansAccents(nom);
  if (BOISSON.test(n)) return "boisson";
  if (NOURRITURE.test(n)) return "nourriture";
  return "autre";
}

export interface EntreeChiffresSoiree {
  caTtc: Centimes;
  caHt: Centimes;
  tickets: number;
  spectateurs: number | null;
  /** Produits vendus : quantité nette, CA, marge (null : coût manquant), famille de leur catégorie. */
  produits: readonly { quantite: number; caTtc: Centimes; caHt: Centimes; marge: Centimes | null; famille: FamilleCategorie }[];
  /** CA par quart d'heure (« 20:45 ») et par minute (« 21:02 »), heure de Paris. */
  quarts: readonly { debut: string; ca: Centimes }[];
  minutes: readonly { debut: string; ca: Centimes }[];
  /** Personnel du planning : minutes réelles et coût (null : taux manquant). */
  personnel: { minutes: number; cout: Centimes | null };
  /** Tickets de la caisse FlaiX Expert (hors ventes importées) et ceux d'un abonné à la carte de fidélité. */
  caisse: { tickets: number; ca: Centimes };
  abonnes: { tickets: number; ca: Centimes };
  /** Ventes Click & Collect importées (application Break Eat) ; null : aucune source Click & Collect déclarée. */
  clickCollect: { commandes: number; ca: Centimes } | null;
}

export interface ChiffresSoiree {
  /** Tickets ÷ spectateurs, en points de base. */
  conversion: number | null;
  articles: number;
  articlesParTicket: number | null;
  /** Le quart d'heure le plus fort et sa part du CA (points de base) ; la meilleure minute. */
  pic: { debut: string; fin: string; ca: Centimes; part: number } | null;
  meilleureMinute: { heure: string; ca: Centimes } | null;
  personnel: { heures: number; caHtParHeure: Centimes | null; partCa: number | null };
  fidelite: { tickets: number; part: number | null; panierAbonnes: Centimes | null; panierAutres: Centimes | null };
  familles: { famille: FamilleCategorie; caTtc: Centimes; partCa: number; marge: Centimes | null; partMarge: number | null }[];
  clickCollect: {
    commandes: number;
    ca: Centimes;
    partCa: number | null;
    partTickets: number | null;
    conversion: number | null;
    panier: Centimes | null;
    panierComptoir: Centimes | null;
  } | null;
}

const pb = (a: number, b: number | null) => (b && b > 0 ? Math.round((a / b) * 10_000) : null);
const panier = (ca: number, n: number) => (n > 0 ? Math.round(ca / n) : null);
const finQuart = (debut: string) => {
  const [h, m] = debut.split(":").map(Number) as [number, number];
  const t = (h * 60 + m + 15) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

export function chiffresSoiree(e: EntreeChiffresSoiree): ChiffresSoiree {
  const articles = e.produits.reduce((s, p) => s + p.quantite, 0);
  const meilleur = <T extends { ca: number }>(l: readonly T[]) => l.reduce<T | null>((m, x) => (x.ca > 0 && (!m || x.ca > m.ca) ? x : m), null);
  const q = meilleur(e.quarts);
  const mn = meilleur(e.minutes);
  const heures = e.personnel.minutes / 60;
  const autres = { tickets: e.caisse.tickets - e.abonnes.tickets, ca: e.caisse.ca - e.abonnes.ca };

  const parFamille = new Map<FamilleCategorie, { caTtc: number; marge: number | null }>();
  for (const p of e.produits) {
    const f = parFamille.get(p.famille) ?? { caTtc: 0, marge: 0 };
    f.caTtc += p.caTtc;
    if (p.marge === null) f.marge = null;
    else if (f.marge !== null) f.marge += p.marge;
    parFamille.set(p.famille, f);
  }
  const margeTotale = [...parFamille.values()].every((f) => f.marge !== null) ? [...parFamille.values()].reduce((s, f) => s + f.marge!, 0) : null;
  const familles = (["boisson", "nourriture", "autre"] as const)
    .filter((f) => parFamille.has(f) && parFamille.get(f)!.caTtc !== 0)
    .map((famille) => {
      const f = parFamille.get(famille)!;
      return { famille, caTtc: f.caTtc, partCa: pb(f.caTtc, e.caTtc) ?? 0, marge: f.marge, partMarge: f.marge === null || margeTotale === null ? null : pb(f.marge, margeTotale) };
    });

  const cc = e.clickCollect;
  return {
    conversion: e.spectateurs ? pb(e.tickets, e.spectateurs) : null,
    articles,
    articlesParTicket: e.tickets > 0 ? Math.round((articles / e.tickets) * 10) / 10 : null,
    pic: q ? { debut: q.debut, fin: finQuart(q.debut), ca: q.ca, part: pb(q.ca, e.caTtc) ?? 0 } : null,
    meilleureMinute: mn ? { heure: mn.debut, ca: mn.ca } : null,
    personnel: {
      heures: Math.round(heures * 10) / 10,
      caHtParHeure: heures > 0 ? Math.round(e.caHt / heures) : null,
      partCa: e.personnel.cout === null || e.personnel.minutes === 0 ? null : pb(e.personnel.cout, e.caHt),
    },
    fidelite: { tickets: e.abonnes.tickets, part: pb(e.abonnes.tickets, e.caisse.tickets), panierAbonnes: panier(e.abonnes.ca, e.abonnes.tickets), panierAutres: panier(autres.ca, autres.tickets) },
    familles,
    clickCollect: cc && {
      commandes: cc.commandes,
      ca: cc.ca,
      partCa: pb(cc.ca, e.caTtc),
      partTickets: pb(cc.commandes, e.tickets),
      conversion: e.spectateurs ? pb(cc.commandes, e.spectateurs) : null,
      panier: panier(cc.ca, cc.commandes),
      panierComptoir: panier(e.caTtc - cc.ca, e.tickets - cc.commandes),
    },
  };
}
