/**
 * Fidélité (module 19 validé ; dossier §14 module 19, §15.114) — abonnés seulement.
 *
 *   points d'un ticket   = euros entiers du ticket TTC × points par euro      (1 point / € : valeur de test)
 *   solde                = Σ points des tickets non annulés + points de départ + ajustements
 *   valeur convertible   = paliers entiers du solde × valeur d'un palier       (100 points = 5 € : valeur de test)
 *   code promo valide    = actif ET jour ∈ [début, fin] ET usages < plafond
 *   remise d'un code     = pourcentage du panier, ou montant plafonné au panier
 *
 * Les valeurs de test du dossier ne sont PAS appliquées : chaque lieu règle les siennes.
 */
import type { Centimes } from "./argent.ts";

export interface ReglagesFidelite {
  pointsParEuro: number;
  palierPoints: number;
  valeurPalier: Centimes;
}

/** N° d'abonné tel que le rapprochent caisse et fiche : majuscules, sans espaces autour. */
export const normaliserNumeroAbonne = (s: string) => s.trim().toUpperCase();

export const pointsDuTicket = (ttc: Centimes, pointsParEuro: number) => (ttc > 0 ? Math.floor(ttc / 100) * pointsParEuro : 0);

/** Ce que vaut un solde en réduction : paliers entiers seulement ; le reste attend le palier suivant. */
export function valeurConvertible(solde: number, r: Pick<ReglagesFidelite, "palierPoints" | "valeurPalier">): { paliers: number; valeur: Centimes; reste: number } {
  const paliers = solde > 0 ? Math.floor(solde / r.palierPoints) : 0;
  return { paliers, valeur: paliers * r.valeurPalier, reste: solde - paliers * r.palierPoints };
}

export type TypeCodePromo = "pourcentage" | "montant";
export interface CodePromo {
  code: string;
  type: TypeCodePromo;
  /** Pourcentage en points de base (5000 = 50 %) ; montant en centimes. */
  valeur: number;
  /** AAAA-MM-JJ, inclus. */
  debut: string;
  fin: string;
  usageMax: number | null;
  actif: boolean;
}
export type EtatCodePromo = "valide" | "a_venir" | "expire" | "epuise" | "desactive";

export function etatCodePromo(c: CodePromo, jour: string, usages: number): EtatCodePromo {
  if (!c.actif) return "desactive";
  if (jour < c.debut) return "a_venir";
  if (jour > c.fin) return "expire";
  if (c.usageMax !== null && usages >= c.usageMax) return "epuise";
  return "valide";
}

export function remiseCodePromo(c: Pick<CodePromo, "type" | "valeur">, panier: Centimes): Centimes {
  if (panier <= 0) return 0;
  return c.type === "pourcentage" ? Math.round((panier * c.valeur) / 10_000) : Math.min(c.valeur, panier);
}

export const FORMAT_CODE_PROMO = /^[A-Z0-9_-]{3,30}$/;

// ---------------------------------------------------------------------------
// À la caisse (§15.127, option A) : solde lu et points ou usage réservés par le serveur avant d'encaisser.
// ---------------------------------------------------------------------------

export interface CodePromoCaisse {
  code: string;
  type: TypeCodePromo;
  valeur: number;
}

export interface PointsAbonneCaisse {
  numero: string;
  nom: string;
  solde: number;
  /** Solde moins les points réservés par d'autres caisses et pas encore encaissés. */
  disponibles: number;
  palierPoints: number;
  valeurPalier: Centimes;
  paliersMax: number;
}

export interface ReservationCaisse {
  /** null : code sans plafond, aucune réservation nécessaire. */
  reservation: string | null;
  expireLe: string | null;
  points: { numero: string; points: number; montant: Centimes } | null;
  codePromo: CodePromoCaisse | null;
}

// ---------------------------------------------------------------------------
// Import tolérant de la base d'abonnés existante (fichier CSV exporté d'un tableur).
// ---------------------------------------------------------------------------

export interface LigneImportAbonne {
  numero: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  points: number;
}
export type ChampImport = keyof LigneImportAbonne;

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** En-têtes reconnus, du plus précis au plus large. */
const ALIAS: [ChampImport, RegExp][] = [
  ["numero", /^(n|no|num|numero|n abonne|numero abonne|numero d abonne|n d abonne|abonne|id abonne|carte|n carte|numero de carte|code abonne)$/],
  ["email", /^(e ?mail|mail|courriel|adresse e ?mail|adresse mail)$/],
  ["telephone", /^(tel|telephone|portable|mobile|gsm|n tel|numero de telephone)$/],
  ["points", /^(points|solde|solde points|points fidelite|pts)$/],
  ["nom", /^(nom|nom prenom|prenom nom|nom complet|client|abonne nom|name)$/],
];

function decouper(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let cour = "", guillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const ch = ligne[i]!;
    if (guillemets) {
      if (ch === '"' && ligne[i + 1] === '"') { cour += '"'; i++; }
      else if (ch === '"') guillemets = false;
      else cour += ch;
    } else if (ch === '"') guillemets = true;
    else if (ch === sep) { champs.push(cour); cour = ""; }
    else cour += ch;
  }
  champs.push(cour);
  return champs.map((c) => c.trim());
}

export interface ResultatImport {
  colonnes: Partial<Record<ChampImport, number>>;
  /** En-têtes du fichier, pour montrer ce qui a été reconnu. */
  entetes: string[];
  lignes: LigneImportAbonne[];
  erreurs: { ligne: number; message: string }[];
}

/**
 * Lit un fichier CSV (point-virgule, virgule ou tabulation, détectés) dont la première ligne porte
 * les en-têtes. Colonnes obligatoires : n° d'abonné et nom. Les lignes fautives sont listées, pas
 * importées ; un n° présent deux fois dans le fichier n'est pris qu'une fois.
 */
export function lireImportAbonnes(texte: string): ResultatImport {
  const lignes = texte.replace(/^﻿/, "").split(/\r\n|\n|\r/).filter((l) => l.trim() !== "");
  if (lignes.length === 0) return { colonnes: {}, entetes: [], lignes: [], erreurs: [{ ligne: 1, message: "Fichier vide." }] };
  const premiere = lignes[0]!;
  const sep = [";", "\t", ","].sort((a, b) => premiere.split(b).length - premiere.split(a).length)[0]!;
  const entetes = decouper(premiere, sep);
  const colonnes: Partial<Record<ChampImport, number>> = {};
  entetes.forEach((e, i) => {
    const n = sansAccents(e);
    const trouve = ALIAS.find(([champ, motif]) => colonnes[champ] === undefined && motif.test(n));
    if (trouve) colonnes[trouve[0]] = i;
  });
  const erreurs: ResultatImport["erreurs"] = [];
  if (colonnes.numero === undefined || colonnes.nom === undefined) {
    erreurs.push({ ligne: 1, message: "Colonnes obligatoires introuvables : il faut un n° d'abonné et un nom (en-têtes de la première ligne)." });
    return { colonnes, entetes, lignes: [], erreurs };
  }
  const vus = new Set<string>();
  const sortie: LigneImportAbonne[] = [];
  lignes.slice(1).forEach((brute, k) => {
    const n = k + 2;
    const c = decouper(brute, sep);
    const champ = (f: ChampImport) => (colonnes[f] === undefined ? "" : (c[colonnes[f]!] ?? "").trim());
    const numero = normaliserNumeroAbonne(champ("numero"));
    const nom = champ("nom");
    const email = champ("email") || null;
    const telephone = champ("telephone") || null;
    const pointsTexte = champ("points").replace(/\s/g, "");
    if (!numero) return erreurs.push({ ligne: n, message: "N° d'abonné vide." });
    if (numero.length > 40) return erreurs.push({ ligne: n, message: "N° d'abonné trop long." });
    if (!nom) return erreurs.push({ ligne: n, message: `Nom vide (abonné ${numero}).` });
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erreurs.push({ ligne: n, message: `E-mail illisible (abonné ${numero}).` });
    if (telephone && (telephone.length < 6 || telephone.length > 30)) return erreurs.push({ ligne: n, message: `Téléphone illisible (abonné ${numero}).` });
    if (pointsTexte && !/^\d{1,7}$/.test(pointsTexte)) return erreurs.push({ ligne: n, message: `Points illisibles (abonné ${numero}).` });
    if (vus.has(numero)) return erreurs.push({ ligne: n, message: `N° ${numero} déjà présent plus haut dans le fichier.` });
    vus.add(numero);
    sortie.push({ numero, nom: nom.slice(0, 120), email, telephone, points: pointsTexte ? Number(pointsTexte) : 0 });
    return undefined;
  });
  return { colonnes, entetes, lignes: sortie, erreurs };
}

// ---------------------------------------------------------------------------
// Écrans
// ---------------------------------------------------------------------------

export interface AbonneVue {
  id: string;
  numero: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  source: "import" | "saisie";
  actif: boolean;
  /** Tickets non annulés portant ce n° (remise abonné à la caisse). */
  tickets: number;
  depense: Centimes;
  derniereVisite: string | null;
  /** null tant que les règles de points ne sont pas réglées. */
  points: number | null;
}

export interface CodePromoVue extends CodePromo {
  id: string;
  /** Tickets qui ont utilisé ce code (dès que la caisse l'accepte). */
  usages: number;
  etat: EtatCodePromo;
}

export interface EtatFidelite {
  reglages: ReglagesFidelite | null;
  abonnes: AbonneVue[];
  /** N° saisis à la caisse (remise abonné) qui n'ont pas de fiche. */
  numerosSansFiche: { numero: string; tickets: number }[];
  codes: CodePromoVue[];
}

export interface HistoriqueAbonne {
  abonne: AbonneVue;
  tickets: { id: string; numeroJustificatif: string; horodatage: string; match: string; total: Centimes; annule: boolean; points: number | null; pointsDepenses: number }[];
  mouvements: { motif: "depart" | "ajustement"; points: number; commentaire: string | null; par: string; le: string }[];
}
