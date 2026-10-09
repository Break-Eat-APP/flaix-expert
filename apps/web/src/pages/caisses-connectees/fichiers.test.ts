/**
 * Fichiers d'export d'une caisse (dossier §15.150) : CSV en UTF-8 ou Windows-1252 ; classeurs Excel récents (.xlsx) et
 * anciens (.xls), feuille choisie, dates Excel relues sans décalage horaire, heure seule, montants. Classeurs fabriqués
 * pour le test avec la même bibliothèque que l'écran.
 */
import { describe, expect, it } from "vitest";
import * as X from "xlsx";
import { lireExportCaisse } from "@flaix/domain";
import { lireFichierTexte, lireFichierVentes } from "./fichiers.ts";

/** Série Excel d'une date « murale » (jours depuis le 30/12/1899). */
const serie = (a: number, m: number, j: number, h = 0, min = 0) => (Date.UTC(a, m - 1, j, h, min) - Date.UTC(1899, 11, 30)) / 86_400_000;

function classeur(format: "xlsx" | "biff8", feuilles: Record<string, X.WorkSheet>): File {
  const wb = X.utils.book_new();
  for (const [nom, ws] of Object.entries(feuilles)) X.utils.book_append_sheet(wb, ws, nom);
  const octets = X.write(wb, { type: "array", bookType: format }) as ArrayBuffer;
  return new File([octets], format === "xlsx" ? "ventes.xlsx" : "ventes.xls");
}

/** Feuille d'un export de caisse : titre, en-têtes, ventes avec date Excel, ligne de total. */
function feuilleVentes(): X.WorkSheet {
  const ws = X.utils.aoa_to_sheet([
    ["Rapport des ventes du 05/10/2026"],
    [],
    ["N° ticket", "Date", "Heure", "Article", "Qté", "Montant TTC", "TVA"],
    ["T-1", 0, 0, "Bière 50 cl", 2, 14, 20],
    ["T-2", 0, 0, "Frites", 1, 3.5, 10],
    ["Total", "", "", "", 3, 17.5, ""],
  ]);
  for (const [ligne, h, min] of [
    [4, 20, 15],
    [5, 21, 5],
  ] as const) {
    ws[`B${ligne}`] = { t: "n", v: serie(2026, 10, 5), z: "dd/mm/yyyy" };
    ws[`C${ligne}`] = { t: "n", v: serie(1899, 12, 30, h, min), z: "hh:mm" };
  }
  return ws;
}

describe("fichiers d'export", () => {
  it("CSV lu en UTF-8, ou en Windows-1252 (export Excel français)", async () => {
    expect(await lireFichierTexte(new Blob([new TextEncoder().encode("Bière;3,50")]))).toBe("Bière;3,50");
    expect(await lireFichierTexte(new Blob([new Uint8Array([0x42, 0x69, 0xe8, 0x72, 0x65])]))).toBe("Bière");
    expect(await lireFichierVentes(new File(["a;b"], "ventes.csv"))).toEqual({ contenu: "a;b", feuilles: [], feuille: null });
  });

  it("classeur Excel (.xlsx) : dates et heures relues telles qu'affichées, puis lues comme un export de caisse", async () => {
    const lu = await lireFichierVentes(classeur("xlsx", { Ventes: feuilleVentes() }));
    expect(lu.feuille).toBe("Ventes");
    expect(lu.contenu.split("\n")[3]).toBe("T-1;2026-10-05;20:15:00;Bière 50 cl;2;14;20");
    const r = lireExportCaisse(lu.contenu);
    expect(r.erreurs).toEqual([]);
    expect(r.ventes.map((v) => [v.idExterne, v.horodatage, v.total])).toEqual([
      ["T-1", "2026-10-05T18:15:00.000Z", 1_400],
      ["T-2", "2026-10-05T19:05:00.000Z", 350],
    ]);
  });

  it("ancien format Excel (.xls) ; plusieurs feuilles : la première avec des données, ou celle demandée", async () => {
    const f = classeur("biff8", { Notes: X.utils.aoa_to_sheet([["Export du 06/10/2026"]]), Ventes: feuilleVentes() });
    const lu = await lireFichierVentes(f);
    expect(lu).toMatchObject({ feuilles: ["Notes", "Ventes"], feuille: "Ventes" });
    expect(lireExportCaisse(lu.contenu).ventes).toHaveLength(2);
    expect((await lireFichierVentes(f, "Notes")).contenu).toBe("Export du 06/10/2026");
  });

  it("fichier illisible : message clair", async () => {
    await expect(lireFichierVentes(new File([new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3])], "abime.xlsx"))).rejects.toThrow(/ne s'ouvre pas/);
  });
});
