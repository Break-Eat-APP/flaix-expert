/**
 * Hygiène et HACCP (dossier §15.156, demande de Rémi du 2026-10-10) : le contrôle sanitaire d'une buvette, sans
 * classeur. Un registre en écriture seule (un relevé ne se modifie ni ne s'efface), prêt pour un contrôle :
 *   - températures des équipements (froid, surgelé, maintien au chaud), à l'ouverture et à la fermeture ;
 *   - nettoyage et contrôles (listes d'ouverture, de fermeture, de la semaine) ;
 *   - contrôle à réception des livraisons (température, date limite, emballage) ;
 *   - huile de friture (contrôle des composés polaires, changement).
 * Toute non-conformité exige une action corrective écrite. Températures en dixièmes de degré (3,5 °C = 35).
 *
 * Limites par défaut (modifiables équipement par équipement) : froid positif ≤ 4 °C ; surgelé ≤ −18 °C ; maintien
 * au chaud ≥ 63 °C ; à réception, frais ≤ 4 °C et surgelé ≤ −15 °C ; huile ≤ 25 % de composés polaires.
 */

export type SorteEquipement = "froid" | "surgele" | "chaud" | "friteuse";

export const SORTES_EQUIPEMENT: { sorte: SorteEquipement; libelle: string; min: number | null; max: number | null }[] = [
  { sorte: "froid", libelle: "Froid : frigo, vitrine, chambre froide", min: null, max: 40 },
  { sorte: "surgele", libelle: "Surgelé : congélateur", min: null, max: -180 },
  { sorte: "chaud", libelle: "Maintien au chaud : vitrine, bain-marie", min: 630, max: null },
  { sorte: "friteuse", libelle: "Friteuse (huile)", min: null, max: null },
];

export interface Limites {
  min: number | null;
  max: number | null;
}

/** Limites d'un équipement : les siennes si elles sont saisies, sinon celles de sa sorte. */
export function limitesEquipement(e: { sorte: SorteEquipement; minDixiemes: number | null; maxDixiemes: number | null }): Limites {
  const d = SORTES_EQUIPEMENT.find((s) => s.sorte === e.sorte)!;
  return { min: e.minDixiemes ?? d.min, max: e.maxDixiemes ?? d.max };
}

export const temperatureConforme = (t: number, l: Limites): boolean => (l.min === null || t >= l.min) && (l.max === null || t <= l.max);

/** « 3,5 » → 35 ; « -18 » → −180 ; « 63 °C » → 630 ; illisible ou hors de −50 à +150 °C : null. */
export function lireTemperature(texte: string): number | null {
  const t = texte.trim().replace(/\s|°|c$|C$/g, "").replace(",", ".").replace("−", "-");
  if (!/^-?\d+(\.\d)?$/.test(t)) return null;
  const v = Math.round(Number(t) * 10);
  return v < -500 || v > 1500 ? null : v;
}

/** 35 → « 3,5 °C » ; −180 → « −18 °C ». */
export function formaterTemperature(d: number): string {
  const v = (Math.abs(d) / 10).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${d < 0 ? "−" : ""}${v} °C`;
}

/** Limites lisibles : « ≤ 4 °C », « ≥ 63 °C », « entre 0 °C et 4 °C ». */
export function libelleLimites(l: Limites): string {
  if (l.min !== null && l.max !== null) return `entre ${formaterTemperature(l.min)} et ${formaterTemperature(l.max)}`;
  if (l.max !== null) return `≤ ${formaterTemperature(l.max)}`;
  if (l.min !== null) return `≥ ${formaterTemperature(l.min)}`;
  return "sans limite";
}

export type MomentReleve = "ouverture" | "fermeture" | "autre";
export type MomentTache = "ouverture" | "fermeture" | "semaine";

export const MOMENTS_TACHE: { moment: MomentTache; libelle: string }[] = [
  { moment: "ouverture", libelle: "À l'ouverture" },
  { moment: "fermeture", libelle: "À la fermeture" },
  { moment: "semaine", libelle: "Chaque semaine" },
];

export type TypeReception = "frais" | "surgele" | "sec";

export const TYPES_RECEPTION: { type: TypeReception; libelle: string; max: number | null }[] = [
  { type: "frais", libelle: "Produits frais", max: 40 },
  { type: "surgele", libelle: "Surgelés", max: -150 },
  { type: "sec", libelle: "Épicerie, boissons", max: null },
];

/** Réception conforme : date limite et emballage bons, température dans la limite de son type (si elle s'impose). */
export function receptionConforme(r: { type: TypeReception; temperatureDixiemes: number | null; dlcOk: boolean; emballageOk: boolean }): boolean {
  const max = TYPES_RECEPTION.find((t) => t.type === r.type)!.max;
  const temperatureOk = max === null || (r.temperatureDixiemes !== null && r.temperatureDixiemes <= max);
  return r.dlcOk && r.emballageOk && temperatureOk;
}

/** Huile de friture : au-delà de 25 % de composés polaires, elle doit être changée. */
export const SEUIL_POLAIRES = 250;
export const huileConforme = (action: "controle" | "changement", polairesDixiemes: number | null): boolean =>
  action === "changement" || (polairesDixiemes !== null && polairesDixiemes <= SEUIL_POLAIRES);

/** « 18 » → 180 ; « 24,5 % » → 245 ; hors de 0 à 100 % : null. */
export function lirePourcentDixiemes(texte: string): number | null {
  const t = texte.trim().replace(/\s|%/g, "").replace(",", ".");
  if (!/^\d+(\.\d)?$/.test(t)) return null;
  const v = Math.round(Number(t) * 10);
  return v > 1000 ? null : v;
}

// ---------- Écrans (réponses du serveur) ----------

export interface EquipementHygiene {
  id: string;
  nom: string;
  standId: string | null;
  sorte: SorteEquipement;
  minDixiemes: number | null;
  maxDixiemes: number | null;
  actif: boolean;
}

export interface TacheHygiene {
  id: string;
  nom: string;
  standId: string | null;
  moment: MomentTache;
  actif: boolean;
}

export interface ReleveTemperature {
  id: string;
  equipementId: string;
  equipement: string;
  moment: MomentReleve;
  temperatureDixiemes: number;
  conforme: boolean;
  actionCorrective: string | null;
  par: string;
  le: string;
}

export interface TacheFaite {
  id: string;
  tacheId: string;
  tache: string;
  commentaire: string | null;
  par: string;
  le: string;
}

export interface ControleReception {
  id: string;
  fournisseur: string;
  produits: string;
  type: TypeReception;
  temperatureDixiemes: number | null;
  dlcOk: boolean;
  emballageOk: boolean;
  conforme: boolean;
  actionCorrective: string | null;
  par: string;
  le: string;
}

export interface ControleHuile {
  id: string;
  equipementId: string;
  equipement: string;
  action: "controle" | "changement";
  polairesDixiemes: number | null;
  conforme: boolean;
  actionCorrective: string | null;
  par: string;
  le: string;
}

/** Module Hygiène : réglages et journée en cours (GET /api/hygiene). */
export interface Hygiene {
  jour: string;
  evenement: { id: string; libelle: string } | null;
  equipements: EquipementHygiene[];
  taches: TacheHygiene[];
  /** Relevés du jour, tâches faites aujourd'hui (et cette semaine pour les tâches de la semaine). */
  relevesDuJour: ReleveTemperature[];
  tachesFaites: TacheFaite[];
  receptions: ControleReception[];
  huiles: ControleHuile[];
  /** Non-conformités des 7 derniers jours (températures, réceptions, huile). */
  nonConformes7j: number;
}

/** Registre d'une période, pour un contrôle sanitaire (GET /api/hygiene/registre). */
export interface RegistreHygiene {
  du: string;
  au: string;
  lieu: string;
  releves: ReleveTemperature[];
  taches: TacheFaite[];
  receptions: ControleReception[];
  huiles: ControleHuile[];
}
