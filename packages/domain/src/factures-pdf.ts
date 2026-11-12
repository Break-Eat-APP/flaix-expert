import type { Centimes } from "./argent.ts";
import type { LigneFactureLue } from "./factures-import.ts";

/*
 * Factures PDF fabriquées par le logiciel du fournisseur (dossier §15.178, demande de Rémi du 2026-11-12) : le texte du
 * PDF est lu dans le navigateur (pdf.js), sans IA et sans que la facture quitte le poste, puis reconnu ici selon la
 * mise en page du fournisseur. Deux mises en page connues : Relais d'Or (alimentaire) et Montaner Pietrini – CDB
 * (boissons). Contrôle : la somme des lignes doit retomber sur le total HT imprimé, sinon la lecture est signalée.
 * Une facture scannée (sans texte) ou d'une autre mise en page n'est pas devinée : elle se saisit à la main.
 */

/** Un morceau de texte du PDF, avec sa position (origine en bas à gauche de la page, en points). */
export interface TextePdf {
  page: number;
  x: number;
  y: number;
  texte: string;
}

export interface LignePdf {
  page: number;
  y: number;
  elements: { x: number; texte: string }[];
  /** Les morceaux de la ligne, de gauche à droite, séparés d'une espace. */
  texte: string;
}

/** Regroupe les morceaux en lignes (même hauteur à 2 points près), de haut en bas puis de gauche à droite. */
export function lignesDuPdf(morceaux: readonly TextePdf[]): LignePdf[] {
  const tries = morceaux.filter((m) => m.texte.trim()).sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lignes: LignePdf[] = [];
  for (const m of tries) {
    const l = lignes.find((k) => k.page === m.page && Math.abs(k.y - m.y) <= 2);
    if (l) l.elements.push({ x: m.x, texte: m.texte.trim() });
    else lignes.push({ page: m.page, y: m.y, elements: [{ x: m.x, texte: m.texte.trim() }], texte: "" });
  }
  for (const l of lignes) {
    l.elements.sort((a, b) => a.x - b.x);
    l.texte = l.elements.map((e) => e.texte).join(" ");
  }
  return lignes;
}

export type ModeleFacturePdf = "relais-d-or" | "cdb";

export interface FacturePdfLue {
  modele: ModeleFacturePdf;
  fournisseur: string;
  numero: string | null;
  /** AAAA-MM-JJ. */
  date: string | null;
  /** Total HT imprimé sur la facture. */
  totalHt: Centimes | null;
  lignes: LigneFactureLue[];
  /** Ce que la lecture a arrangé et que le directeur doit savoir (poids, produits offerts, consignes, arrondis). */
  remarques: string[];
  /**
   * Document que la lecture automatique refuse (un avoir, BUG-2026-016) : la raison, à montrer telle quelle ; les lignes
   * sont alors vides et rien ne doit être rempli. null : document lu.
   */
  refus: string | null;
}

/** « 4.511,74 », « 1658.67 », « .90 », « -178.76 » → centimes ; null si ce n'est pas un montant. */
export function montantPdf(t: string): Centimes | null {
  const s = t.replace(/\s/g, "");
  if (!/^-?[\d.,]*\d$/.test(s)) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** « 12,000 » → 12 ; « 4,800 » → 4.8. */
const nombrePdf = (t: string) => Number(t.replace(/\s/g, "").replace(",", "."));

const jourCourt = (j: string, m: string, a: string) => `${a.length === 2 ? `20${a}` : a}-${m}-${j}`;

/**
 * Une ligne de facture à partir de son montant : quantité et prix unitaire au centime près. Quand le montant ne se
 * divise pas exactement (prix à 3 décimales, produits offerts), le prix est arrondi au centime inférieur et le reste
 * revient dans `reste` : la facture garde une ligne d'arrondi, le total HT reste exact.
 */
function ligne(codeArticle: string | null, libelle: string, quantite: number, montant: Centimes, unitesParColis: number | null, reste: { centimes: number }): LigneFactureLue {
  const prix = Math.floor(montant / quantite);
  reste.centimes += montant - prix * quantite;
  return { codeArticle, libelle: libelle.replace(/\s+/g, " ").trim().slice(0, 160), quantite, prixUnitaire: prix, unitesParColis };
}

function terminer(f: Omit<FacturePdfLue, "remarques" | "refus">, remarques: string[], reste: { centimes: number }): FacturePdfLue {
  if (reste.centimes > 0) {
    f.lignes.push({ codeArticle: null, libelle: "Arrondis des prix unitaires (facture PDF)", quantite: 1, prixUnitaire: reste.centimes, unitesParColis: null });
    remarques.push(`Prix à plus de deux décimales : arrondis au centime, l'écart (${(reste.centimes / 100).toFixed(2).replace(".", ",")} €) figure sur une ligne à part.`);
  }
  const somme = f.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  if (f.totalHt !== null && Math.abs(somme - f.totalHt) > 2) {
    remarques.unshift(`Attention : les lignes lues font ${(somme / 100).toFixed(2).replace(".", ",")} € HT, la facture annonce ${(f.totalHt / 100).toFixed(2).replace(".", ",")} € : une ligne n'a pas été lue, compare avec le PDF.`);
  }
  if (f.totalHt === null) remarques.unshift("Attention : total HT introuvable dans le PDF, les lignes n'ont pas pu être contrôlées : compare avec la facture.");
  return { ...f, remarques, refus: null };
}

// ---------- Relais d'Or ----------

const QTE_RELAIS = /^\d+,\d{3}$/;
const UNITE_RELAIS = /^[A-Z]{2,4}$/;

function lireRelaisDor(lignes: readonly LignePdf[]): FacturePdfLue {
  const tout = lignes.map((l) => l.texte);
  const fournisseur = tout.map((t) => /^Relais d'Or [A-ZÉ][a-zé]+/.exec(t)?.[0]).find(Boolean) ?? "Relais d'Or";
  const numero = tout.map((t) => /FACTURE\s+N°\s*(\d+)/.exec(t)?.[1]).find(Boolean) ?? null;
  const d = tout.map((t) => /Date\s*:\s*(\d{2})\/(\d{2})\/(\d{2,4})/.exec(t)).find(Boolean);
  // Le total de la facture porte « EUR » ; à défaut, le dernier « TOTAL H.T » (chaque commande a le sien, avant).
  const enEuros = tout.map((t) => /TOTAL H\.T\s+([\d.]+,\d{2})\s+EUR/.exec(t)?.[1]).filter(Boolean);
  const totaux = enEuros.length ? enEuros : tout.map((t) => /TOTAL H\.T\s+([\d.]+,\d{2})/.exec(t)?.[1]).filter(Boolean);
  const reste = { centimes: 0 };
  const remarques: string[] = [];
  const lues: LigneFactureLue[] = [];
  for (const l of lignes) {
    const e = l.elements.map((x) => x.texte);
    // Référence, désignation…, quantité, unité, prix net, montant, code TVA.
    if (e.length < 7 || !/^\d{5,7}$/.test(e[0]!) || !/^[12]$/.test(e.at(-1)!)) continue;
    const [qte, unite, prix, montant] = [e.at(-5)!, e.at(-4)!, montantPdf(e.at(-3)!), montantPdf(e.at(-2)!)];
    if (!QTE_RELAIS.test(qte) || !UNITE_RELAIS.test(unite) || prix === null || montant === null) continue;
    // La lettre de tête dit la température (Glace, Surgelé, Frais) : elle n'aide pas à reconnaître l'article.
    const libelle = e.slice(1, -5).join(" ").replace(/^[GSF] (?=\S)/, "");
    const q = nombrePdf(qte);
    if (Number.isInteger(q) && q > 0) lues.push(ligne(e[0]!, libelle, q, montant, null, reste));
    else {
      // Au poids : un lot. Ses pièces se comptent quand le libellé donne le poids d'une pièce et que le compte tombe juste
      // (4,8 kg de steaks « 8x150g » : 32 steaks) ; sinon 1, à corriger à la main — jamais le « 8 » du carton.
      const piece = unite === "KG" ? /(\d+(?:,\d+)?)\s*(kg|g)\b(?!.*\d\s*(?:kg|g)\b)/i.exec(libelle) : null;
      const grammes = piece ? Number(piece[1]!.replace(",", ".")) * (piece[2]!.toLowerCase() === "kg" ? 1000 : 1) : 0;
      const pieces = grammes > 0 ? (q * 1000) / grammes : 0;
      const parLot = Number.isInteger(Math.round(pieces * 1e6) / 1e6) && pieces >= 1 ? Math.round(pieces) : 1;
      lues.push(ligne(e[0]!, `${libelle} (${qte.replace(/0+$/, "").replace(/,$/, "")} ${unite.toLowerCase()})`, 1, montant, parLot, reste));
      remarques.push(
        `« ${libelle} » : ${qte} ${unite}, au poids — compté en un lot de ${(montant / 100).toFixed(2).replace(".", ",")} €${parLot > 1 ? `, soit ${parLot} pièces` : " ; indique le nombre de pièces du lot"}.`,
      );
    }
  }
  return terminer(
    { modele: "relais-d-or", fournisseur, numero, date: d ? jourCourt(d[1]!, d[2]!, d[3]!) : null, totalHt: totaux.length ? montantPdf(totaux.at(-1)!) : null, lignes: lues },
    remarques,
    reste,
  );
}

// ---------- Montaner Pietrini – CDB (boissons, document d'accompagnement des droits d'accises) ----------

const ACCISES_CDB = "011615E0085";

/** Colonnes du tableau, d'après la position du texte (en points, page au format paysage du distributeur). */
const COLONNES_CDB = { code: [0, 45], cas: [45, 69], colis: [69, 89], designation: [89, 290], montant: [550, 620] } as const;
const dans = (x: number, [min, max]: readonly [number, number]) => x >= min && x < max;

function lireCdb(lignes: readonly LignePdf[]): FacturePdfLue {
  const tout = lignes.map((l) => l.texte);
  const numero = tout.map((t) => /FACTURE\/AVOIR\s+N°\s*(\d+)/.exec(t)?.[1]).find(Boolean) ?? null;
  const d = lignes.flatMap((l) => l.elements).map((e) => /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(e.texte)).find(Boolean);
  const reste = { centimes: 0 };
  const remarques: string[] = [];
  type Article = { code: string; cas: number; colis: number; libelle: string; montant: Centimes };
  const articles: Article[] = [];
  let offerts = 0;
  let consignes = false;
  let totalHt: Centimes | null = null;
  let fraisGestion: Centimes = 0;
  for (const page of [...new Set(lignes.map((l) => l.page))]) {
    const sur = lignes.filter((l) => l.page === page);
    const entete = sur.find((l) => l.texte.includes("cas/fut"));
    if (!entete) continue; // conditions générales au verso
    const pied = sur.find((l) => l.y < entete.y && /^\(1 PNR\)|^Vol\.|Cotis\./.test(l.texte))?.y ?? 0;
    for (const l of sur.filter((k) => k.y < entete.y && k.y > pied)) {
      const champ = (c: keyof typeof COLONNES_CDB) =>
        l.elements
          .filter((e) => dans(e.x, COLONNES_CDB[c]))
          .map((e) => e.texte)
          .join(" ");
      const code = champ("code");
      const libelle = champ("designation");
      const montant = champ("montant") ? montantPdf(champ("montant")) : null;
      if (/^\d{3,7}$/.test(code)) {
        if (montant === null) {
          consignes = true; // vide, palette : consigne seule, pas un achat
          continue;
        }
        const cas = Number(champ("cas") || "0");
        const colis = Number(champ("colis") || "0");
        articles.push({ code, cas, colis, libelle, montant });
      } else if (/GRATUITE/.test(libelle) && montant !== null && articles.length) {
        articles.at(-1)!.montant += montant; // produit offert : la ligne payée baisse d'autant
        offerts += -montant;
      } else if (libelle && montant === null && !/EMBALLAGE|REPRISE/.test(l.texte) && articles.length) {
        articles.at(-1)!.libelle += ` ${libelle}`; // suite de la désignation
      }
    }
    // Frais de gestion, imprimés sous le tableau (« F G : 5.95 Euros ») : compris dans le total HT.
    for (const l of sur) {
      const fg = /\bF G\s*:\s*([\d.,]+)/.exec(l.texte);
      if (fg) fraisGestion += montantPdf(fg[1]!) ?? 0;
    }
    const total = sur.find((l) => l.elements.some((e) => e.texte === "TOTAL" && e.x < 200) && l.y < 80);
    if (total) {
      const ht = sur.flatMap((l) => (l.y <= total.y + 1 && l.y >= total.y - 8 ? l.elements : [])).find((e) => e.x >= 200 && e.x < 270 && montantPdf(e.texte) !== null);
      if (ht) totalHt = montantPdf(ht.texte);
    }
  }
  // Un avoir (article négatif, total négatif) ne se lit pas comme une facture : refusé, à saisir à la main (BUG-2026-016).
  if (articles.some((a) => a.montant < 0) || (totalHt !== null && totalHt < 0)) {
    return {
      modele: "cdb",
      fournisseur: "Montaner Pietrini (CDB)",
      numero,
      date: d ? jourCourt(d[1]!, d[2]!, d[3]!) : null,
      totalHt,
      lignes: [],
      remarques: [],
      refus: `Ce document${numero ? ` n° ${numero}` : ""} est un avoir (montants négatifs) : la lecture automatique ne le prend pas. Saisis-le à la main, en accord avec ton comptable.`,
    };
  }
  const lues = articles.map((a) => {
    // Quantité en colis (cas, fût) avec les unités de chaque colis ; sans colis, en unités.
    const q = a.cas > 0 ? a.cas : Math.max(1, a.colis);
    const parColis = a.cas > 0 && a.colis > a.cas && a.colis % a.cas === 0 ? a.colis / a.cas : null;
    return ligne(a.code, a.libelle, q, a.montant, parColis, reste);
  });
  if (fraisGestion > 0) lues.push({ codeArticle: null, libelle: "Frais de gestion", quantite: 1, prixUnitaire: fraisGestion, unitesParColis: null });
  if (offerts > 0) remarques.push(`Produits offerts par le fournisseur (${(offerts / 100).toFixed(2).replace(".", ",")} €) : déduits du prix des lignes concernées, les quantités livrées restent entières.`);
  if (consignes) remarques.push("Consignes et vides rendus : hors achats, ils ne comptent ni dans les lignes ni dans le total HT.");
  return terminer({ modele: "cdb", fournisseur: "Montaner Pietrini (CDB)", numero, date: d ? jourCourt(d[1]!, d[2]!, d[3]!) : null, totalHt, lignes: lues }, remarques, reste);
}

/**
 * Lit une facture PDF d'après son texte positionné. Rend null quand la mise en page n'est pas connue (ou que le PDF
 * n'a pas de texte : facture scannée).
 */
export function lireFacturePdf(morceaux: readonly TextePdf[]): FacturePdfLue | null {
  const lignes = lignesDuPdf(morceaux);
  const tout = lignes.map((l) => l.texte).join("\n");
  if (/Relais d'Or/i.test(tout) && /Référence\s+Désignation\s+Quantité/.test(tout)) return lireRelaisDor(lignes);
  if (tout.includes(ACCISES_CDB) && tout.includes("cas/fut")) return lireCdb(lignes);
  return null;
}
