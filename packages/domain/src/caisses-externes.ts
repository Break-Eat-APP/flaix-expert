/**
 * Caisses connectées (dossier §15.150) : ventes d'une caisse externe (L'Addition, Digifood, Weezevent…) importées dans
 * FlaiX Expert pour la gestion. Elles restent à part des tickets scellés : jamais dans les Z, les clôtures, l'export
 * comptable ni le journal de caisse de FlaiX Expert.
 *
 * Première porte : le fichier d'export de la caisse (CSV, une ligne par article vendu). Les colonnes sont reconnues
 * d'après leurs en-têtes et corrigeables ; les dates sans fuseau sont des heures de Paris.
 */
import type { Centimes } from "./argent.ts";
import { lireCsv, sansAccents } from "./csv.ts";

export const SYSTEMES_CAISSE = [
  { cle: "digifood", libelle: "Digifood" },
  { cle: "weezevent", libelle: "Weezevent (WeezPay)" },
  { cle: "laddition", libelle: "L'Addition" },
  { cle: "autre", libelle: "Autre caisse" },
] as const;
export type SystemeCaisse = (typeof SYSTEMES_CAISSE)[number]["cle"];

export type ChampExport = "vente" | "date" | "heure" | "pointDeVente" | "produit" | "code" | "quantite" | "prixUnitaire" | "montant" | "tva" | "paiement" | "statut";
/** Colonne du fichier (à partir de 0) de chaque champ reconnu. */
export type ColonnesExport = Partial<Record<ChampExport, number>>;

export const CHAMPS_EXPORT: { champ: ChampExport; libelle: string; aide: string }[] = [
  { champ: "vente", libelle: "N° de vente (ticket)", aide: "Obligatoire : relie les articles d'une même vente et évite de l'importer deux fois." },
  { champ: "date", libelle: "Date (et heure)", aide: "Obligatoire. Heure de Paris si le fichier n'indique pas de fuseau." },
  { champ: "heure", libelle: "Heure", aide: "Si l'heure est dans une colonne à part." },
  { champ: "pointDeVente", libelle: "Point de vente", aide: "Bar, terminal ou caisse : correspond à un stand." },
  { champ: "produit", libelle: "Produit", aide: "Libellé de l'article (le produit ou son code est obligatoire)." },
  { champ: "code", libelle: "Code produit", aide: "Référence de l'article dans la caisse." },
  { champ: "quantite", libelle: "Quantité", aide: "Obligatoire. Négative pour un remboursement." },
  { champ: "prixUnitaire", libelle: "Prix unitaire TTC", aide: "Le prix unitaire ou le montant de la ligne est obligatoire." },
  { champ: "montant", libelle: "Montant TTC de la ligne", aide: "Quantité × prix, remise comprise." },
  { champ: "tva", libelle: "Taux de TVA", aide: "20, 10, 5,5…" },
  { champ: "paiement", libelle: "Moyen de paiement", aide: "Carte, espèces, cashless…" },
  { champ: "statut", libelle: "Statut", aide: "Une valeur « annulé » ou « remboursé » retire la vente." },
];

/** En-têtes reconnus pour chaque champ. */
const ALIAS: [ChampExport, RegExp][] = [
  ["vente", /^(n ?ticket|ticket|no ticket|numero ticket|numero de ticket|n de ticket|id ticket|ticket id|id vente|n vente|numero vente|numero de vente|vente|transaction|id transaction|n transaction|numero transaction|transaction id|commande|n commande|numero commande|numero de commande|id commande|order|order id|receipt|receipt id|facture|n facture)$/],
  ["date", /^(date|date heure|date et heure|horodatage|date vente|date de vente|date transaction|date de la transaction|date commande|date ticket|created at|created|datetime|timestamp)$/],
  ["heure", /^(heure|heure vente|heure de vente|time)$/],
  ["pointDeVente", /^(point de vente|points de vente|pdv|bar|stand|buvette|terminal|caisse|poste|comptoir|lieu de vente|device|appareil|point of sale|pos|kiosque|borne)$/],
  ["produit", /^(produit|article|libelle|libelle article|libelle produit|designation|nom produit|nom article|nom du produit|item|item name|product|product name|nom)$/],
  ["code", /^(code|code produit|code article|reference|ref|sku|id produit|id article|product id|item id|plu)$/],
  ["quantite", /^(quantite|qte|qty|quantity|nombre|nb|quantite vendue)$/],
  ["prixUnitaire", /^(prix|prix unitaire|pu|prix ttc|prix unitaire ttc|pu ttc|unit price|prix de vente)$/],
  ["montant", /^(montant|montant ttc|total|total ttc|total ligne|montant ligne|ca|ca ttc|amount|line total|prix total|total article)$/],
  ["tva", /^(tva|taux tva|taux de tva|tx tva|vat|vat rate|tax rate|taxe)$/],
  ["paiement", /^(paiement|moyen de paiement|moyens de paiement|mode de paiement|mode reglement|mode de reglement|reglement|payment|payment method|type de paiement)$/],
  ["statut", /^(statut|etat|status|annule|annulation|type)$/],
];

/** Colonnes reconnues d'après les en-têtes (le premier en-tête qui convient l'emporte). */
export function devinerColonnes(entetes: readonly string[]): ColonnesExport {
  const colonnes: ColonnesExport = {};
  entetes.forEach((e, i) => {
    const n = sansAccents(e);
    const trouve = ALIAS.find(([champ, motif]) => colonnes[champ] === undefined && motif.test(n));
    if (trouve) colonnes[trouve[0]] = i;
  });
  return colonnes;
}

export interface LigneVenteExterne {
  /** Clé de correspondance du produit : son code s'il existe, sinon son libellé. */
  cle: string;
  libelle: string;
  code: string | null;
  quantite: number;
  prixUnitaire: Centimes;
  montant: Centimes;
  /** Taux de TVA en points de base (2000 = 20 %) ; null s'il n'est pas dans le fichier. */
  tvaPb: number | null;
}

export interface VenteExterneLue {
  idExterne: string;
  /** Instant de la vente (ISO, UTC). */
  horodatage: string;
  pointDeVente: string | null;
  paiement: string | null;
  annulee: boolean;
  total: Centimes;
  lignes: LigneVenteExterne[];
}

export interface ResultatLecture {
  entetes: string[];
  colonnes: ColonnesExport;
  lignesLues: number;
  ventes: VenteExterneLue[];
  erreurs: { ligne: number; message: string }[];
  /** Champs obligatoires sans colonne : rien n'est lu tant qu'ils manquent. */
  manquants: ChampExport[];
}

const ERREURS_MAX = 50;

/** Montant « 3,50 », « 3.50 », « 1 234,50 € », « -2,00 » → centimes ; null si illisible. */
export function lireMontantExport(texte: string): Centimes | null {
  let t = texte.replace(/[\s  €]/g, "").replace(/^\+/, "");
  if (t === "") return null;
  const negatif = /^-|^\(.*\)$/.test(t);
  t = t.replace(/^-|^\(|\)$/g, "");
  // « 1.234,50 » ou « 1,234.50 » : le dernier séparateur est la virgule décimale.
  const dernier = Math.max(t.lastIndexOf(","), t.lastIndexOf("."));
  if (dernier >= 0) t = t.slice(0, dernier).replace(/[.,]/g, "") + "." + t.slice(dernier + 1);
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const c = Math.round(Number(t) * 100);
  return Number.isSafeInteger(c) ? (negatif ? -c : c) : null;
}

/** Quantité « 2 », « 0,5 », « -1 » ; null si illisible. */
function lireQuantite(texte: string): number | null {
  const t = texte.replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,3})?$/.test(t)) return null;
  return Number(t);
}

/** Taux « 20 », « 20 % », « 5,5 », « 0,2 » → points de base ; null si vide ou illisible. */
function lireTva(texte: string): number | null {
  const t = texte.replace(/[\s%]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const v = Number(t);
  return Math.round((v <= 1 && v > 0 ? v * 100 : v) * 100);
}

const decalageParis = (instantMs: number): number => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instantMs));
  const v = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - instantMs;
};

/** Heure de Paris (« murale ») → instant ISO, heure d'été comprise. */
export function instantDepuisHeureDeParis(a: number, mois: number, j: number, h = 0, min = 0, s = 0): string {
  const naif = Date.UTC(a, mois - 1, j, h, min, s);
  let t = naif - decalageParis(naif);
  t = naif - decalageParis(t);
  return new Date(t).toISOString();
}

/**
 * Date d'un export : « 05/10/2026 21:34[:56] », « 2026-10-05 21:34:56 », « 2026-10-05T19:34:56Z » (avec fuseau : tel
 * quel), heure éventuellement dans une colonne à part. Sans fuseau : heure de Paris. null si illisible.
 */
export function lireDateExport(date: string, heure = ""): string | null {
  const d = date.trim();
  if (/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(d)) {
    const t = Date.parse(d);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
  }
  // Date « à minuit » d'un classeur suivie d'une heure dans une autre colonne : l'heure de la colonne fait foi.
  const texte = `${heure.trim() ? d.replace(/[ T]+00:00(:00)?(\.0+)?$/, "") : d} ${heure.trim()}`.trim();
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T]+(\d{1,2})[:h](\d{2})(?::(\d{2}))?)?$/.exec(texte);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(texte);
  let a: number, m: number, j: number, h: number, mi: number, s: number;
  if (fr) [a, m, j, h, mi, s] = [Number(fr[3]), Number(fr[2]), Number(fr[1]), Number(fr[4] ?? 0), Number(fr[5] ?? 0), Number(fr[6] ?? 0)];
  else if (iso) [a, m, j, h, mi, s] = [Number(iso[1]), Number(iso[2]), Number(iso[3]), Number(iso[4] ?? 0), Number(iso[5] ?? 0), Number(iso[6] ?? 0)];
  else return null;
  if (m < 1 || m > 12 || j < 1 || j > 31 || h > 23 || mi > 59 || s > 59 || a < 2000 || a > 2100) return null;
  return instantDepuisHeureDeParis(a, m, j, h, mi, s);
}

const ANNULEE = /(annul|rembours|cancel|refund|void|avoir)/;

/** Champs sans lesquels rien n'est lu. */
export function champsManquants(colonnes: ColonnesExport): ChampExport[] {
  const manquants: ChampExport[] = [];
  if (colonnes.vente === undefined) manquants.push("vente");
  if (colonnes.date === undefined) manquants.push("date");
  if (colonnes.produit === undefined && colonnes.code === undefined) manquants.push("produit");
  if (colonnes.quantite === undefined) manquants.push("quantite");
  if (colonnes.prixUnitaire === undefined && colonnes.montant === undefined) manquants.push("montant");
  return manquants;
}

/**
 * Lit un export de caisse (une ligne par article vendu). Les colonnes sont devinées d'après les en-têtes si elles ne sont
 * pas données. Les lignes fautives sont listées et écartées ; les articles d'une même vente sont regroupés.
 */
/** Lignes de titre lues au plus avant les en-têtes (« Rapport des ventes du… », filtres, date d'édition). */
const LIGNES_TITRE_MAX = 20;

/**
 * Ligne des en-têtes : la première des 20 premières qui en reconnaît au moins trois ; sinon la première ligne. Les
 * exports Excel portent souvent un titre au-dessus du tableau.
 */
function ligneEntetes(lignes: readonly { champs: string[] }[]): number {
  const k = lignes.slice(0, LIGNES_TITRE_MAX).findIndex((l) => Object.keys(devinerColonnes(l.champs)).length >= 3);
  return k < 0 ? 0 : k;
}

export function lireExportCaisse(texte: string, colonnesDonnees?: ColonnesExport): ResultatLecture {
  const brut = lireCsv(texte);
  const toutes = brut.entetes.length ? [{ numero: 1, champs: brut.entetes }, ...brut.lignes] : [];
  const k = ligneEntetes(toutes);
  const fichier = { entetes: toutes[k]?.champs ?? [], lignes: toutes.slice(k + 1) };
  const colonnes = colonnesDonnees ?? devinerColonnes(fichier.entetes);
  const manquants = champsManquants(colonnes);
  const resultat: ResultatLecture = { entetes: fichier.entetes, colonnes, lignesLues: fichier.lignes.length, ventes: [], erreurs: [], manquants };
  if (fichier.entetes.length === 0) {
    resultat.erreurs.push({ ligne: 1, message: "Fichier vide." });
    return resultat;
  }
  if (manquants.length) return resultat;
  const erreur = (ligne: number, message: string) => {
    if (resultat.erreurs.length < ERREURS_MAX) resultat.erreurs.push({ ligne, message });
  };
  const parVente = new Map<string, VenteExterneLue>();
  for (const { numero, champs } of fichier.lignes) {
    const champ = (f: ChampExport) => (colonnes[f] === undefined ? "" : (champs[colonnes[f]!] ?? "").trim());
    const idExterne = champ("vente");
    // Ligne de total ou de sous-total, sans date : ignorée sans bruit.
    if (!champ("date") && (!idExterne || /^(sous[ -]?)?totaux?|^total/i.test(sansAccents(idExterne)))) continue;
    if (!idExterne) {
      erreur(numero, "N° de vente vide.");
      continue;
    }
    if (idExterne.length > 120) {
      erreur(numero, "N° de vente trop long.");
      continue;
    }
    const horodatage = lireDateExport(champ("date"), champ("heure"));
    if (!horodatage) {
      erreur(numero, `Date illisible : « ${champ("date")}${champ("heure") ? ` ${champ("heure")}` : ""} ».`);
      continue;
    }
    const libelle = champ("produit");
    const code = champ("code") || null;
    if (!libelle && !code) {
      erreur(numero, "Produit vide.");
      continue;
    }
    const quantite = lireQuantite(champ("quantite"));
    if (quantite === null) {
      erreur(numero, `Quantité illisible : « ${champ("quantite")} ».`);
      continue;
    }
    const pu = champ("prixUnitaire") ? lireMontantExport(champ("prixUnitaire")) : null;
    const mt = champ("montant") ? lireMontantExport(champ("montant")) : null;
    if (pu === null && mt === null) {
      erreur(numero, "Prix et montant illisibles ou vides.");
      continue;
    }
    const montant = mt ?? Math.round(pu! * quantite);
    const prixUnitaire = pu ?? (quantite !== 0 ? Math.round(montant / quantite) : 0);
    const statut = sansAccents(champ("statut"));
    let vente = parVente.get(idExterne);
    if (!vente) {
      vente = { idExterne, horodatage, pointDeVente: champ("pointDeVente").slice(0, 120) || null, paiement: champ("paiement").slice(0, 60) || null, annulee: false, total: 0, lignes: [] };
      parVente.set(idExterne, vente);
    }
    if (statut && ANNULEE.test(statut)) vente.annulee = true;
    vente.lignes.push({
      cle: (code ?? libelle).slice(0, 200),
      libelle: (libelle || code!).slice(0, 200),
      code: code?.slice(0, 120) ?? null,
      quantite,
      prixUnitaire,
      montant,
      tvaPb: champ("tva") ? lireTva(champ("tva")) : null,
    });
    vente.total += montant;
  }
  resultat.ventes = [...parVente.values()];
  return resultat;
}

/**
 * Événement terminé, pour l'historique des écrans de gestion (prévision, prix fournisseurs, alertes) : clos dans la caisse
 * FlaiX Expert, ou — lieu dont les ventes viennent d'une caisse connectée, qui n'ouvre ni ne clôt ses événements dans
 * FlaiX Expert — déjà commencé et avec des ventes (§15.151).
 */
export function evenementTermine(e: { etat: string; debut: string }, avecVentes: boolean, maintenant: number = Date.now()): boolean {
  return e.etat === "clos" || (e.etat === "a_venir" && avecVentes && Date.parse(e.debut) <= maintenant);
}

// ---------- Correspondances suggérées (§15.152) ----------

/** Nom comparé sans majuscules, accents, espaces ni ponctuation : « BIERE 50CL » = « Bière 50 cl ». */
export const normaliserNom = (s: string) => sansAccents(s).replace(/ /g, "");

/** Unités de contenance : sans valeur pour comparer (les nombres départagent). */
const UNITES = new Set(["cl", "ml", "l", "cc", "g", "kg", "litre", "litres"]);
/** Mots du nom, chiffres et lettres séparés (« 50cl » → « 50 », « cl »), unités écartées. */
const mots = (s: string) =>
  new Set(
    sansAccents(s)
      .replace(/(\d)(?=[a-z])|([a-z])(?=\d)/g, "$1$2 ")
      .split(" ")
      .filter((m) => m && !UNITES.has(m)),
  );
const nombres = (s: string) => new Set(sansAccents(s).match(/\d+/g) ?? []);
function trigrammes(s: string): Set<string> {
  const t = ` ${normaliserNom(s)} `;
  const r = new Set<string>();
  for (let i = 0; i + 3 <= t.length; i++) r.add(t.slice(i, i + 3));
  return r;
}
/** Mots qui distinguent deux variantes d'un même produit ou stand : « Bar Nord » n'est pas « Bar Sud ». */
const VARIANTES: Record<string, string> = {
  nord: "direction:nord",
  sud: "direction:sud",
  est: "direction:est",
  ouest: "direction:ouest",
  haut: "niveau:haut",
  bas: "niveau:bas",
  gauche: "cote:gauche",
  droite: "cote:droite",
  blanc: "couleur:blanc",
  blanche: "couleur:blanc",
  rouge: "couleur:rouge",
  rose: "couleur:rose",
  blonde: "couleur:blonde",
  brune: "couleur:brune",
  ambree: "couleur:ambree",
  noir: "couleur:noir",
  noire: "couleur:noir",
  petit: "taille:petit",
  petite: "taille:petit",
  moyen: "taille:moyen",
  moyenne: "taille:moyen",
  grand: "taille:grand",
  grande: "taille:grand",
};
/** Une même sorte de variante des deux côtés, sans valeur commune (nord / sud, rouge / blanc, petite / grande). */
function variantesOpposees(a: Set<string>, b: Set<string>): boolean {
  const valeurs = (m: Set<string>) => [...m].flatMap((x) => (VARIANTES[x] ? [VARIANTES[x]] : []));
  const [va, vb] = [valeurs(a), valeurs(b)];
  const sorte = (v: string) => v.split(":")[0];
  return va.some((v) => vb.some((w) => sorte(w) === sorte(v)) && !vb.some((w) => sorte(w) === sorte(v) && va.includes(w)));
}
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let communs = 0;
  for (const x of a) if (b.has(x)) communs++;
  return (2 * communs) / (a.size + b.size);
}

/**
 * Ressemblance de deux noms, de 0 à 1 : 1 pour le même nom (majuscules, accents, espaces près) ; sinon moyenne des mots
 * communs et des groupes de trois lettres communs. Des nombres différents des deux côtés (« 33 cl » et « 50 cl ») ou des
 * variantes opposées (« nord » et « sud », « rouge » et « blanc ») : 0.
 */
export function ressemblance(a: string, b: string): number {
  const na = normaliserNom(a);
  if (!na) return 0;
  if (na === normaliserNom(b)) return 1;
  const [ca, cb] = [nombres(a), nombres(b)];
  if (ca.size && cb.size && ![...ca].some((n) => cb.has(n))) return 0;
  const [ma, mb] = [mots(a), mots(b)];
  if (variantesOpposees(ma, mb)) return 0;
  return (dice(ma, mb) + dice(trigrammes(a), trigrammes(b))) / 2;
}

/** En dessous : noms trop éloignés pour être proposés. */
export const SEUIL_SUGGESTION = 0.4;

/** Candidat au nom le plus proche, s'il l'est assez (le premier en cas d'égalité) ; null sinon. */
export function suggererCorrespondance<T extends { id: string; nom: string }>(nom: string, candidats: readonly T[]): (T & { score: number }) | null {
  let meilleur: (T & { score: number }) | null = null;
  for (const c of candidats) {
    const score = ressemblance(nom, c.nom);
    if (score >= SEUIL_SUGGESTION && (!meilleur || score > meilleur.score)) meilleur = { ...c, score };
  }
  return meilleur;
}

/** Seul candidat portant le même nom (majuscules, accents, espaces près) : relié sans demander ; aucun ou plusieurs : null. */
export function correspondanceExacte<T extends { id: string; nom: string }>(nom: string, candidats: readonly T[]): T | null {
  const n = normaliserNom(nom);
  const memes = n ? candidats.filter((c) => normaliserNom(c.nom) === n) : [];
  return memes.length === 1 ? memes[0]! : null;
}

// ---------- Écrans (réponses du serveur) ----------

export interface CaisseExterne {
  id: string;
  nom: string;
  systeme: SystemeCaisse;
  /** Colonnes retenues au dernier import : reprises à l'import suivant. */
  colonnes: ColonnesExport | null;
  ventes: number;
  premiereVente: string | null;
  derniereVente: string | null;
  dernierImport: ImportVentesExternes | null;
}

export interface ImportVentesExternes {
  id: string;
  le: string;
  par: string;
  fichier: string;
  lignesLues: number;
  ventesAjoutees: number;
  ventesDeja: number;
  erreurs: number;
}

/** Produit vu dans les ventes d'une caisse et sa correspondance dans FlaiX Expert. */
export interface ProduitExterne {
  cle: string;
  libelle: string;
  code: string | null;
  quantite: number;
  montant: Centimes;
  /** Produit de FlaiX Expert ; null : pas encore rapproché. */
  produitId: string | null;
  ignore: boolean;
  /** Relié sans demander, d'après le même nom (§15.152) : à vérifier, modifiable. */
  automatique: boolean;
  /** Pas encore rapproché : produit de FlaiX Expert au nom le plus proche, à confirmer. */
  suggestion: SuggestionCorrespondance | null;
}

export interface PointDeVenteExterne {
  nom: string;
  ventes: number;
  montant: Centimes;
  standId: string | null;
  automatique: boolean;
  /** Pas encore rapproché : stand au nom le plus proche, à confirmer. */
  suggestion: SuggestionCorrespondance | null;
}

/** Produit ou stand de FlaiX Expert proposé ; `memeNom` : même nom, majuscules, accents et espaces près. */
export interface SuggestionCorrespondance {
  id: string;
  nom: string;
  memeNom: boolean;
}

export interface LigneSynthese {
  cle: string;
  libelle: string;
  ventes: number;
  quantite: number;
  montant: Centimes;
  /** Coût matière des produits rapprochés ; null si aucun n'a de coût. */
  cout: Centimes | null;
}

/** Résultats des ventes importées sur une période (GET /api/caisses-externes/synthese). */
export interface SyntheseVentesExternes {
  du: string;
  au: string;
  ventes: number;
  annulees: number;
  montant: Centimes;
  /** Part du chiffre d'affaires dont le produit est rapproché et a un coût matière. */
  montantAvecCout: Centimes;
  cout: Centimes;
  parProduit: LigneSynthese[];
  parStand: LigneSynthese[];
  parEvenement: LigneSynthese[];
  /** Ventes par heure (heure de Paris, 0 à 23). */
  parHeure: { heure: number; ventes: number; montant: Centimes }[];
}
