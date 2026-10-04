/**
 * Export pour l'expert-comptable (dossier §15.110) : le journal des ventes du mois, bâti sur les
 * Z d'événement scellés — jamais sur des chiffres provisoires recalculés.
 *
 * Chaque Z donne une pièce équilibrée :
 *   débit  caisse espèces (ventes en espèces)      + débit  cartes à encaisser (ventes carte)
 *   crédit ventes HT, par taux de TVA              + crédit TVA collectée, par taux
 * puis, s'il y en a, l'écart de caisse constaté au comptage (tiroirs et coffre) :
 *   manquant : débit charge / crédit caisse ; excédent : débit caisse / crédit produit.
 *
 * Les numéros de comptes sont une PROPOSITION par défaut, réglable par lieu : c'est à
 * l'expert-comptable du lieu de les valider (docs/questions-expert-comptable.md, G.20).
 */
import { TAUX_TVA, libelleTauxTva, type TauxTvaPb } from "./tva.ts";
import type { Centimes } from "./argent.ts";

export interface PlanComptes {
  /** Code du journal des ventes dans le logiciel du comptable. */
  journal: string;
  caisseEspeces: string;
  cartesAEncaisser: string;
  /** Compte de ventes, par taux de TVA. */
  ventes: Record<TauxTvaPb, string>;
  /** Compte de TVA collectée, par taux de TVA. */
  tva: Record<TauxTvaPb, string>;
  ecartManquant: string;
  ecartExcedent: string;
}

export const PLAN_COMPTES_DEFAUT: PlanComptes = {
  journal: "VT",
  caisseEspeces: "530000",
  cartesAEncaisser: "511500",
  ventes: { 550: "707055", 1000: "707100", 2000: "707200", 210: "707021" },
  tva: { 550: "445713", 1000: "445712", 2000: "445711", 210: "445714" },
  ecartManquant: "658000",
  ecartExcedent: "758000",
};

/** Un numéro de compte : chiffres et lettres majuscules, 3 à 20 caractères. */
export const FORMAT_COMPTE = /^[0-9A-Z]{3,20}$/;
/** Un code journal : 1 à 6 caractères. */
export const FORMAT_JOURNAL = /^[0-9A-Z]{1,6}$/;

/** Ce que l'export lit d'un Z d'événement scellé, plus les écarts constatés au comptage. */
export interface ZPourExport {
  /** Jour de l'événement, AAAA-MM-JJ (heure de Paris). */
  date: string;
  libelle: string;
  /** Numéro du Z dans la chaîne des clôtures du lieu. */
  sequence: number;
  tickets: number;
  annulations: number;
  totalTtc: Centimes;
  especes: Centimes;
  carte: Centimes;
  ventilation: { tauxTva: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  /** Écart des tiroirs (compté − attendu), dernière rectification comprise. */
  ecartTiroirs: Centimes;
  /** Écart du coffre (compté − attendu), dernière rectification comprise. */
  ecartCoffre: Centimes;
  empreinte: string;
}

export interface Ecriture {
  journal: string;
  date: string;
  piece: string;
  compte: string;
  libelle: string;
  debit: Centimes;
  credit: Centimes;
}

export const pieceDuZ = (z: Pick<ZPourExport, "sequence">) => `Z${String(z.sequence).padStart(6, "0")}`;

/**
 * Écritures d'un Z. Un montant négatif (plus d'annulations que de ventes sur un moyen de paiement)
 * passe de l'autre côté du compte, jamais en montant négatif.
 */
export function ecrituresDuZ(z: ZPourExport, plan: PlanComptes): Ecriture[] {
  const piece = pieceDuZ(z);
  const lignes: Ecriture[] = [];
  const ajouter = (compte: string, libelle: string, debit: Centimes) => {
    if (debit === 0) return;
    lignes.push({ journal: plan.journal, date: z.date, piece, compte, libelle: `${libelle} — ${z.libelle}`, debit: Math.max(debit, 0), credit: Math.max(-debit, 0) });
  };
  ajouter(plan.caisseEspeces, "Ventes en espèces", z.especes);
  ajouter(plan.cartesAEncaisser, "Ventes par carte", z.carte);
  for (const v of [...z.ventilation].sort((a, b) => a.tauxTva - b.tauxTva)) {
    ajouter(plan.ventes[v.tauxTva], `Ventes HT TVA ${libelleTauxTva(v.tauxTva)}`, -v.ht);
    ajouter(plan.tva[v.tauxTva], `TVA collectée ${libelleTauxTva(v.tauxTva)}`, -v.tva);
  }
  const ecart = z.ecartTiroirs + z.ecartCoffre;
  if (ecart < 0) {
    ajouter(plan.ecartManquant, "Écart de caisse (manquant)", -ecart);
    ajouter(plan.caisseEspeces, "Écart de caisse (manquant)", ecart);
  } else if (ecart > 0) {
    ajouter(plan.caisseEspeces, "Écart de caisse (excédent)", ecart);
    ajouter(plan.ecartExcedent, "Écart de caisse (excédent)", -ecart);
  }
  return lignes;
}

export interface JournalDuMois {
  ecritures: Ecriture[];
  totalDebit: Centimes;
  totalCredit: Centimes;
  /** Pièces dont débit ≠ crédit (ne doit jamais arriver : un Z est équilibré par construction). */
  desequilibres: string[];
}

export function journalDuMois(zs: ZPourExport[], plan: PlanComptes): JournalDuMois {
  const ecritures: Ecriture[] = [];
  const desequilibres: string[] = [];
  for (const z of [...zs].sort((a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence)) {
    const e = ecrituresDuZ(z, plan);
    if (e.reduce((s, l) => s + l.debit - l.credit, 0) !== 0) desequilibres.push(pieceDuZ(z));
    ecritures.push(...e);
  }
  return {
    ecritures,
    totalDebit: ecritures.reduce((s, l) => s + l.debit, 0),
    totalCredit: ecritures.reduce((s, l) => s + l.credit, 0),
    desequilibres,
  };
}

// ---------------------------------------------------------------------------
// Fichiers CSV : point-virgule, virgule décimale, UTF-8 avec BOM (ouverture directe dans Excel),
// fins de ligne CRLF. Le format attendu par le logiciel du comptable reste à confirmer (G.20).
// ---------------------------------------------------------------------------

const montantCsv = (c: Centimes) => (c / 100).toFixed(2).replace(".", ",");
const dateCsv = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
function champ(valeur: string): string {
  return /[;"\r\n]/.test(valeur) ? `"${valeur.replace(/"/g, '""')}"` : valeur;
}
const csv = (lignes: string[][]) => "﻿" + lignes.map((l) => l.map(champ).join(";")).join("\r\n") + "\r\n";

export function ecrituresCsv(journal: JournalDuMois): string {
  return csv([
    ["Journal", "Date", "Pièce", "Compte", "Libellé", "Débit", "Crédit"],
    ...journal.ecritures.map((e) => [e.journal, dateCsv(e.date), e.piece, e.compte, e.libelle, e.debit ? montantCsv(e.debit) : "", e.credit ? montantCsv(e.credit) : ""]),
  ]);
}

/** Taux présents dans le mois, dans l'ordre habituel (5,5 %, 10 %, 20 %, 2,1 %). */
export function tauxDuMois(zs: ZPourExport[]): TauxTvaPb[] {
  const presents = new Set(zs.flatMap((z) => z.ventilation.map((v) => v.tauxTva)));
  return TAUX_TVA.map((t) => t.pb).filter((pb) => presents.has(pb));
}

export function recapitulatifCsv(zs: ZPourExport[]): string {
  const taux = tauxDuMois(zs);
  const tries = [...zs].sort((a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence);
  const colonnesTva = (z: Pick<ZPourExport, "ventilation">) =>
    taux.flatMap((pb) => {
      const v = z.ventilation.find((x) => x.tauxTva === pb);
      return [montantCsv(v?.ht ?? 0), montantCsv(v?.tva ?? 0)];
    });
  const somme = (f: (z: ZPourExport) => number) => tries.reduce((s, z) => s + f(z), 0);
  const total: Pick<ZPourExport, "ventilation"> = {
    ventilation: taux.map((pb) => ({
      tauxTva: pb,
      ht: somme((z) => z.ventilation.find((v) => v.tauxTva === pb)?.ht ?? 0),
      tva: somme((z) => z.ventilation.find((v) => v.tauxTva === pb)?.tva ?? 0),
      ttc: 0,
    })),
  };
  return csv([
    [
      "Date",
      "Événement",
      "Z",
      "Tickets",
      "Annulations",
      "CA TTC",
      ...taux.flatMap((pb) => [`HT ${libelleTauxTva(pb)}`, `TVA ${libelleTauxTva(pb)}`]),
      "Espèces",
      "Carte",
      "Écart tiroirs",
      "Écart coffre",
      "Empreinte du Z",
    ],
    ...tries.map((z) => [
      dateCsv(z.date),
      z.libelle,
      pieceDuZ(z),
      String(z.tickets),
      String(z.annulations),
      montantCsv(z.totalTtc),
      ...colonnesTva(z),
      montantCsv(z.especes),
      montantCsv(z.carte),
      montantCsv(z.ecartTiroirs),
      montantCsv(z.ecartCoffre),
      z.empreinte,
    ]),
    [
      "",
      "TOTAL",
      "",
      String(somme((z) => z.tickets)),
      String(somme((z) => z.annulations)),
      montantCsv(somme((z) => z.totalTtc)),
      ...colonnesTva(total),
      montantCsv(somme((z) => z.especes)),
      montantCsv(somme((z) => z.carte)),
      montantCsv(somme((z) => z.ecartTiroirs)),
      montantCsv(somme((z) => z.ecartCoffre)),
      "",
    ],
  ]);
}

/** Plan de comptes enregistré pour un lieu, complété par les valeurs par défaut. */
export function planComplet(enregistre: Partial<PlanComptes> | null | undefined): PlanComptes {
  const p = enregistre ?? {};
  return {
    ...PLAN_COMPTES_DEFAUT,
    ...p,
    ventes: { ...PLAN_COMPTES_DEFAUT.ventes, ...(p.ventes ?? {}) },
    tva: { ...PLAN_COMPTES_DEFAUT.tva, ...(p.tva ?? {}) },
  };
}

/** Clôtures → Export comptable : aperçu du mois choisi (dossier §15.110). */
export interface ApercuExport {
  /** Mois qui ont au moins un Z d'événement, du plus récent au plus ancien. */
  moisDisponibles: { cle: string; libelle: string; zs: number; clos: boolean }[];
  cle: string | null;
  libelle: string;
  /** Mois clôturé : l'export est définitif. Sinon il est provisoire (un événement peut encore s'ajouter). */
  clos: boolean;
  zs: ZPourExport[];
  /** Événements du mois sans Z (pas encore clos) : absents de l'export. */
  horsExport: { libelle: string; debut: string; etat: "a_venir" | "ouvert" }[];
  taux: TauxTvaPb[];
  journal: { lignes: number; totalDebit: Centimes; totalCredit: Centimes; desequilibres: string[] };
  plan: PlanComptes;
  planPersonnalise: boolean;
}
