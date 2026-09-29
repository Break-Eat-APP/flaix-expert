import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

/**
 * Chaînage des enregistrements (inaltérabilité, BOFiP §140 ; dossier §15.3 et §15.16).
 *
 *   empreinte = SHA256( champ1 | champ2 | … | champN | empreinte_precedente )
 *   premier maillon : empreinte_precedente = "0" × 64
 *
 * Retirer, modifier ou déplacer un enregistrement casse la chaîne à partir de lui,
 * et la vérification indique le maillon exact.
 *
 * Deux précisions par rapport à la formule figée du §15.16 (signalées dans
 * docs/decisions-architecture-production.md § 12) :
 * - un « | » ou un « \ » à l'intérieur d'un champ est échappé (« \| », « \\ »),
 *   sinon deux contenus différents pourraient produire la même chaîne scellée ;
 *   sans ces caractères, le résultat est identique à la formule du §15.16 ;
 * - le contenu détaillé d'un événement (sérialisé de façon canonique) fait partie
 *   des champs scellés : une chaîne qui ne couvre pas le contenu ne prouve pas
 *   que le contenu est intact.
 */

export const EMPREINTE_INITIALE = "0".repeat(64);

export type ChampScelle = string | number | null;

function echapper(valeur: string): string {
  return valeur.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

export function serialiserChamps(champs: readonly ChampScelle[]): string {
  return champs.map((c) => (c === null ? "" : echapper(String(c)))).join("|");
}

export function calculerEmpreinte(champs: readonly ChampScelle[], empreintePrecedente: string): string {
  const texte = `${serialiserChamps(champs)}|${empreintePrecedente}`;
  return bytesToHex(sha256(utf8ToBytes(texte)));
}

/**
 * JSON canonique : clés triées à tous les niveaux, sans espaces. Indispensable
 * parce que la base peut restituer les clés d'un objet dans un autre ordre que
 * celui de l'écriture — l'empreinte doit rester la même.
 */
export function jsonCanonique(valeur: unknown): string {
  if (valeur === null || typeof valeur !== "object") {
    if (typeof valeur === "number" && !Number.isFinite(valeur)) {
      throw new TypeError("jsonCanonique : nombre non fini interdit");
    }
    return JSON.stringify(valeur ?? null);
  }
  if (Array.isArray(valeur)) return `[${valeur.map(jsonCanonique).join(",")}]`;
  const entrees = Object.entries(valeur as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entrees.map(([k, v]) => `${JSON.stringify(k)}:${jsonCanonique(v)}`).join(",")}}`;
}

export interface Maillon {
  champs: readonly ChampScelle[];
  empreintePrecedente: string;
  empreinte: string;
}

export type ResultatVerification =
  | { ok: true; maillons: number }
  | { ok: false; maillons: number; rupture: { index: number; raison: "chainage_rompu" | "empreinte_invalide" } };

/**
 * Vérifie une chaîne dans son ORDRE DE SCELLEMENT — jamais dans un ordre
 * d'affichage (leçon du module Journal/Tickets, §15.29 : trier avant de vérifier
 * signale des ruptures qui n'existent pas).
 */
export function verifierChaine(maillons: readonly Maillon[], depart: string = EMPREINTE_INITIALE): ResultatVerification {
  let precedente = depart;
  for (let index = 0; index < maillons.length; index++) {
    const m = maillons[index]!;
    if (m.empreintePrecedente !== precedente) {
      return { ok: false, maillons: maillons.length, rupture: { index, raison: "chainage_rompu" } };
    }
    if (calculerEmpreinte(m.champs, m.empreintePrecedente) !== m.empreinte) {
      return { ok: false, maillons: maillons.length, rupture: { index, raison: "empreinte_invalide" } };
    }
    precedente = m.empreinte;
  }
  return { ok: true, maillons: maillons.length };
}
