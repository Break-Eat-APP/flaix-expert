import type { CellObject, WorkSheet } from "xlsx";

/*
 * Fichiers d'export d'une caisse (dossier §15.150) : CSV, ou classeur Excel (.xlsx, .xlsm, l'ancien .xls) et OpenDocument
 * (.ods), lus dans le navigateur et remis en CSV pour le serveur. La bibliothèque des classeurs (SheetJS) n'est chargée
 * que lorsqu'un classeur est choisi. Les dates Excel sont relues telles qu'affichées dans le classeur (heure « murale »),
 * sans fuseau : le serveur les lit à l'heure de Paris.
 */

export const FICHIERS_ACCEPTES = ".csv,.txt,.xlsx,.xlsm,.xls,.ods,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
/** Au-delà, le classeur n'est pas un export de ventes d'un lieu (et le navigateur peinerait). */
const LIGNES_MAX = 200_000;

export interface FichierLu {
  /** Contenu remis en CSV (point-virgule). */
  contenu: string;
  /** Feuilles du classeur (vide pour un CSV) et feuille lue. */
  feuilles: string[];
  feuille: string | null;
}

/** Texte d'un fichier : UTF-8, sinon Windows-1252 (exports Excel français en CSV). */
export async function lireFichierTexte(f: Blob): Promise<string> {
  const octets = await f.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets);
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

const deux = (n: number) => String(n).padStart(2, "0");

function enCsv(lignes: string[][]): string {
  const champ = (v: string) => {
    const t = v.replace(/[\r\n]+/g, " ");
    return /[;"]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return lignes.map((l) => l.map(champ).join(";")).join("\n");
}

type Xlsx = typeof import("xlsx");

/** Valeur d'une cellule telle que l'export la donnerait en texte. */
function texteCellule(X: Xlsx, c: CellObject | undefined): string {
  if (!c || c.v === undefined || c.v === null) return "";
  if (c.t === "n" && typeof c.v === "number" && typeof c.z === "string" && X.SSF.is_date(c.z)) {
    const d = X.SSF.parse_date_code(c.v);
    const heure = `${deux(d.H)}:${deux(d.M)}:${deux(Math.floor(d.S))}`;
    // Heure seule (colonne « Heure ») : pas de date ; date seule (nombre entier de jours) : pas d'heure.
    if (c.v < 1) return heure;
    const date = `${d.y}-${deux(d.m)}-${deux(d.d)}`;
    return Number.isInteger(c.v) ? date : `${date} ${heure}`;
  }
  if (c.v instanceof Date) {
    const d = c.v;
    return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())} ${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}`;
  }
  if (c.t === "n" && typeof c.v === "number") return String(Math.round(c.v * 1e6) / 1e6);
  if (c.t === "b") return c.v ? "VRAI" : "FAUX";
  if (c.t === "e") return "";
  return String(c.v);
}

function lignesDeLaFeuille(X: Xlsx, ws: WorkSheet): string[][] {
  if (!ws["!ref"]) return [];
  const plage = X.utils.decode_range(ws["!ref"]);
  const dense = (ws as WorkSheet & { "!data"?: CellObject[][] })["!data"];
  const lignes: string[][] = [];
  for (let r = plage.s.r; r <= Math.min(plage.e.r, plage.s.r + LIGNES_MAX); r++) {
    const ligne: string[] = [];
    for (let c = plage.s.c; c <= plage.e.c; c++) ligne.push(texteCellule(X, dense ? dense[r]?.[c] : (ws[X.utils.encode_cell({ r, c })] as CellObject | undefined)));
    lignes.push(ligne);
  }
  while (lignes.length && lignes.at(-1)!.every((v) => v === "")) lignes.pop();
  return lignes;
}

/**
 * Lit le fichier choisi : un CSV tel quel ; un classeur, sa feuille demandée ou la première qui contient des données.
 */
export async function lireFichierVentes(f: File, feuille?: string): Promise<FichierLu> {
  if (/\.(csv|txt)$/i.test(f.name)) return { contenu: await lireFichierTexte(f), feuilles: [], feuille: null };
  // Un .xlsx est une archive zip (« PK ») : autre chose est un fichier abîmé ou mal nommé. Un « .xls » peut être du texte
  // ou du HTML (exports de nombreux logiciels) : la bibliothèque le lit tel quel, l'aperçu dira si les colonnes y sont.
  const debut = new Uint8Array(await f.slice(0, 2).arrayBuffer());
  if (/\.(xlsx|xlsm)$/i.test(f.name) && !(debut[0] === 0x50 && debut[1] === 0x4b)) {
    throw new Error("Ce fichier ne s'ouvre pas : choisis l'export de la caisse au format Excel (.xlsx, .xls) ou CSV.");
  }
  const X = await import("xlsx");
  let classeur;
  try {
    classeur = X.read(await f.arrayBuffer(), { type: "array", cellNF: true, dense: true });
  } catch {
    throw new Error("Ce fichier ne s'ouvre pas : choisis l'export de la caisse au format Excel (.xlsx, .xls) ou CSV.");
  }
  const feuilles = classeur.SheetNames;
  const lues = new Map<string, string[][]>();
  const lire = (nom: string) => lues.get(nom) ?? lues.set(nom, lignesDeLaFeuille(X, classeur.Sheets[nom]!)).get(nom)!;
  const choisie = feuille && feuilles.includes(feuille) ? feuille : (feuilles.find((n) => lire(n).length > 1) ?? feuilles[0]);
  if (!choisie) throw new Error("Ce classeur ne contient aucune feuille.");
  return { contenu: enCsv(lire(choisie)), feuilles, feuille: choisie };
}
