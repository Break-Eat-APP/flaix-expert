/**
 * Événements privés (dossier §15.160, demande de Rémi du 2026-10-11) : salons, privatisations, groupes (« le Bar
 * clandestin vient à 15, boit et mange, avec un budget pour la soirée »). C'est de la gestion, tenue par le directeur
 * lui-même : rien ne passe par la caisse ni ses tickets (Z, clôtures et TVA des buvettes ne sont pas touchés).
 *
 *   consommations = produits du catalogue (prix en vigueur, modifiable) ou lignes libres (location, service…)
 *   jauge du budget = total TTC ÷ budget : « attention » dès 80 %, « dépassé » au-delà de 100 %
 *   ce qu'il te reste = CA HT − marchandise (coût matière + conditionnement) − frais (personnel, location…)
 * À la clôture, tout est figé (coûts compris). Ensuite : le règlement, et une facture numérotée si le client la demande
 * (série continue par lieu et par année, contenu figé et scellé par son empreinte, jamais modifiée).
 * TVA ventilée ligne par ligne comme à la caisse : HT + TVA redonne toujours exactement le TTC.
 */
import type { Centimes } from "./argent.ts";
import { EMPREINTE_INITIALE, calculerEmpreinte, jsonCanonique } from "./chaine.ts";
import { ventilerTtc, type TauxTvaPb } from "./tva.ts";

export type EtatPrive = "prevu" | "cloture";
export type ModeReglementPrive = "virement" | "carte" | "especes" | "cheque";

export const MODES_REGLEMENT: { mode: ModeReglementPrive; libelle: string }[] = [
  { mode: "virement", libelle: "Virement" },
  { mode: "carte", libelle: "Carte bancaire" },
  { mode: "especes", libelle: "Espèces" },
  { mode: "cheque", libelle: "Chèque" },
];

export interface LignePrivee {
  id: string;
  /** Produit du catalogue ; null : ligne libre (location du salon, service, plateau…). */
  produitId: string | null;
  libelle: string;
  quantite: number;
  prixTtc: Centimes;
  tauxTva: TauxTvaPb;
  /** Coût d'une unité (matière + conditionnement, centimes, décimales possibles) ; null : inconnu. Figé à la clôture. */
  coutUnitaire: number | null;
}

export interface FraisPrive {
  id: string;
  libelle: string;
  montant: Centimes;
}

export interface ClientPrive {
  nom: string | null;
  contact: string | null;
  societe: string | null;
  adresse: string | null;
  siret: string | null;
  tvaIntracom: string | null;
}

export type NiveauBudget = "sans" | "ok" | "attention" | "depasse";

export interface BilanPrive {
  totalTtc: Centimes;
  parTaux: { taux: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  caHt: Centimes;
  tva: Centimes;
  /** Marchandise consommée ; null si un produit n'a pas de coût (jamais un chiffre inventé). */
  coutMarchandise: Centimes | null;
  produitsSansCout: string[];
  frais: Centimes;
  /** Ce qu'il te reste : CA HT − marchandise − frais ; null si la marchandise est inconnue. */
  reste: Centimes | null;
  budget: Centimes | null;
  /** Part du budget consommée, en points de base. */
  budgetPb: number | null;
  niveauBudget: NiveauBudget;
}

/** Jauge du budget : « attention » dès 80 %, « dépassé » au-delà de 100 %. */
export function niveauBudget(totalTtc: Centimes, budget: Centimes | null): { pb: number | null; niveau: NiveauBudget } {
  if (budget === null || budget <= 0) return { pb: null, niveau: "sans" };
  const pb = Math.round((totalTtc / budget) * 10_000);
  return { pb, niveau: pb > 10_000 ? "depasse" : pb >= 8_000 ? "attention" : "ok" };
}

/** HT et TVA d'une ligne : ventilation de son TTC, arrondie par ligne comme à la caisse. */
export const ventilerLigne = (l: Pick<LignePrivee, "quantite" | "prixTtc" | "tauxTva">) => ventilerTtc(l.quantite * l.prixTtc, l.tauxTva);

export function bilanPrive(lignes: readonly LignePrivee[], frais: readonly FraisPrive[], budget: Centimes | null): BilanPrive {
  const parTaux = new Map<TauxTvaPb, { taux: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }>();
  for (const l of lignes) {
    const v = ventilerLigne(l);
    const x = parTaux.get(l.tauxTva) ?? { taux: l.tauxTva, ht: 0, tva: 0, ttc: 0 };
    x.ht += v.ht;
    x.tva += v.tva;
    x.ttc += l.quantite * l.prixTtc;
    parTaux.set(l.tauxTva, x);
  }
  const taux = [...parTaux.values()].sort((a, b) => a.taux - b.taux);
  const totalTtc = taux.reduce((t, x) => t + x.ttc, 0);
  const caHt = taux.reduce((t, x) => t + x.ht, 0);
  // Une ligne libre sans coût est un service (location, prestation) : elle ne coûte rien en marchandise.
  const sansCout = lignes.filter((l) => l.produitId !== null && l.coutUnitaire === null && l.quantite > 0);
  const coutMarchandise = sansCout.length ? null : Math.round(lignes.reduce((t, l) => t + l.quantite * (l.coutUnitaire ?? 0), 0));
  const totalFrais = frais.reduce((t, f) => t + f.montant, 0);
  const b = niveauBudget(totalTtc, budget);
  return {
    totalTtc,
    parTaux: taux,
    caHt,
    tva: totalTtc - caHt,
    coutMarchandise,
    produitsSansCout: [...new Set(sansCout.map((l) => l.libelle))],
    frais: totalFrais,
    reste: coutMarchandise === null ? null : caHt - coutMarchandise - totalFrais,
    budget,
    budgetPb: b.pb,
    niveauBudget: b.niveau,
  };
}

/** Coût d'un personnel : personnes × heures × taux horaire chargé (centimes). */
export const coutPersonnel = (personnes: number, minutes: number, tauxHoraire: Centimes): Centimes => Math.round((personnes * minutes * tauxHoraire) / 60);

export interface EvenementPrive {
  id: string;
  nom: string;
  debut: string;
  salon: string | null;
  invites: number | null;
  budget: Centimes | null;
  client: ClientPrive;
  notes: string | null;
  etat: EtatPrive;
  clotureLe: string | null;
  cloturePar: string | null;
  reglement: { mode: ModeReglementPrive; le: string } | null;
  lignes: LignePrivee[];
  frais: FraisPrive[];
  bilan: BilanPrive;
  facture: { id: string; numero: string; emiseLe: string } | null;
  /** Sorti de la réserve centrale à la clôture (§15.169) : « 30 × Bière », « 15 L · Fût blonde ». */
  sortieStock: { nom: string; quantite: string }[];
}

export interface ResumePrive {
  id: string;
  nom: string;
  debut: string;
  client: string | null;
  invites: number | null;
  budget: Centimes | null;
  totalTtc: Centimes;
  reste: Centimes | null;
  niveauBudget: NiveauBudget;
  etat: EtatPrive;
  facture: string | null;
  regle: boolean;
}

// ---------- Facture ----------

export interface FactureVente {
  numero: string;
  emiseLe: string;
  vendeur: { nom: string; raisonSociale: string | null; adresse: string; siret: string; tvaIntracom: string };
  client: { nom: string; adresse: string | null; siret: string | null; tvaIntracom: string | null; professionnel: boolean };
  objet: string;
  lignes: { libelle: string; quantite: number; prixUnitaireHt: Centimes; tauxTva: TauxTvaPb; totalHt: Centimes; totalTtc: Centimes }[];
  parTaux: { taux: TauxTvaPb; ht: Centimes; tva: Centimes; ttc: Centimes }[];
  totalHt: Centimes;
  totalTva: Centimes;
  totalTtc: Centimes;
  reglement: { mode: ModeReglementPrive; le: string } | null;
  /** Date limite de paiement (AAAA-MM-JJ) : 30 jours après l'émission. */
  echeance: string;
  mentions: string[];
}

/** Numéro de facture : série des événements privés, continue par lieu et par année (« FP-2026-0001 »). */
export const numeroFacture = (annee: number, sequence: number) => `FP-${annee}-${String(sequence).padStart(4, "0")}`;

/** Jour de Paris d'un instant (AAAA-MM-JJ) : une facture émise à 1 h du matin est datée du jour de Paris. */
const jourDeParis = (iso: string) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const jourPlus = (iso: string, jours: number) => new Date(Date.parse(`${jourDeParis(iso)}T12:00:00Z`) + jours * 86_400_000).toISOString().slice(0, 10);

export function construireFacture(x: {
  numero: string;
  emiseLe: string;
  vendeur: FactureVente["vendeur"];
  client: ClientPrive;
  objet: string;
  lignes: readonly LignePrivee[];
  reglement: FactureVente["reglement"];
}): FactureVente {
  const bilan = bilanPrive(x.lignes, [], null);
  const professionnel = !!x.client.societe;
  const mentions = ["Pas d'escompte pour paiement anticipé."];
  if (professionnel)
    mentions.push(
      "En cas de retard de paiement : pénalités au taux de refinancement de la BCE majoré de 10 points, et indemnité forfaitaire de 40 € pour frais de recouvrement (articles L441-10 et D441-5 du Code de commerce).",
    );
  const libelleMode = (m: ModeReglementPrive) => MODES_REGLEMENT.find((r) => r.mode === m)!.libelle.toLowerCase();
  mentions.push(x.reglement ? `Facture acquittée le ${x.reglement.le.split("-").reverse().join("/")} par ${libelleMode(x.reglement.mode)}.` : `À régler au plus tard le ${jourPlus(x.emiseLe, 30).split("-").reverse().join("/")}.`);
  return {
    numero: x.numero,
    emiseLe: x.emiseLe,
    vendeur: x.vendeur,
    client: { nom: x.client.societe ?? x.client.nom ?? "", adresse: x.client.adresse, siret: x.client.siret, tvaIntracom: x.client.tvaIntracom, professionnel },
    objet: x.objet,
    lignes: x.lignes.map((l) => {
      const v = ventilerLigne(l);
      return { libelle: l.libelle, quantite: l.quantite, prixUnitaireHt: Math.round(v.ht / (l.quantite || 1)), tauxTva: l.tauxTva, totalHt: v.ht, totalTtc: l.quantite * l.prixTtc };
    }),
    parTaux: bilan.parTaux,
    totalHt: bilan.caHt,
    totalTva: bilan.tva,
    totalTtc: bilan.totalTtc,
    reglement: x.reglement,
    echeance: jourPlus(x.emiseLe, 30),
    mentions,
  };
}

/** Empreinte d'une facture : son contenu figé ne peut changer sans que la relecture le montre. */
export const empreinteFacture = (id: string, f: FactureVente): string => calculerEmpreinte([id, f.numero, f.emiseLe, jsonCanonique(f)], EMPREINTE_INITIALE);
