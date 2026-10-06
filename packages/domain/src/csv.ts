/**
 * Lecture des fichiers CSV exportés par un tableur ou un logiciel (abonnés §15.114, ventes d'une caisse externe §15.150) :
 * séparateur point-virgule, tabulation ou virgule (détecté sur la première ligne), champs entre guillemets, « "" » pour un
 * guillemet. La première ligne porte les en-têtes. Un champ ne peut pas contenir de retour à la ligne.
 */

/** « Numéro d'abonné » → « numero d abonne » : pour reconnaître un en-tête quelle que soit son écriture. */
export const sansAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function decouperCsv(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let cour = "",
    guillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const ch = ligne[i]!;
    if (guillemets) {
      if (ch === '"' && ligne[i + 1] === '"') {
        cour += '"';
        i++;
      } else if (ch === '"') guillemets = false;
      else cour += ch;
    } else if (ch === '"') guillemets = true;
    else if (ch === sep) {
      champs.push(cour);
      cour = "";
    } else cour += ch;
  }
  champs.push(cour);
  return champs.map((c) => c.trim());
}

export interface FichierCsv {
  separateur: string;
  entetes: string[];
  /** Lignes non vides après les en-têtes, avec leur numéro dans le fichier (les en-têtes sont la ligne 1). */
  lignes: { numero: number; champs: string[] }[];
}

export function lireCsv(texte: string): FichierCsv {
  const brutes = texte.replace(/^﻿/, "").split(/\r\n|\n|\r/);
  const numeros = brutes.map((l, i) => ({ l, numero: i + 1 })).filter((x) => x.l.trim() !== "");
  if (numeros.length === 0) return { separateur: ";", entetes: [], lignes: [] };
  const premiere = numeros[0]!.l;
  const separateur = [";", "\t", ","].sort((a, b) => premiere.split(b).length - premiere.split(a).length)[0]!;
  return {
    separateur,
    entetes: decouperCsv(premiere, separateur),
    lignes: numeros.slice(1).map((x) => ({ numero: x.numero, champs: decouperCsv(x.l, separateur) })),
  };
}
