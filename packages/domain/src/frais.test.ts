import { describe, expect, it } from "vitest";
import { FRAIS_SUGGERES, moisComplets, montantDuMois, partDesFrais } from "./frais.ts";
import { montantDepense } from "./finances.ts";
import { cascadeSoiree, LIBELLE_RESTE } from "./rapport-soiree.ts";

describe("ce qu'il te reste et mes frais (§15.154)", () => {
  it("frais du mois répartis au prorata du CA HT des soirées du mois ; soirée sans CA : rien", () => {
    // 3 000 € de frais ; deux matchs à 12 000 € et 4 000 € HT : 2 250 € et 750 €.
    expect(partDesFrais(300_000, 1_200_000, 1_600_000)).toBe(225_000);
    expect(partDesFrais(300_000, 400_000, 1_600_000)).toBe(75_000);
    expect(partDesFrais(300_000, 0, 1_600_000)).toBe(0);
    expect(partDesFrais(300_000, -5_000, 1_600_000)).toBe(0);
    expect(partDesFrais(0, 400_000, 1_600_000)).toBe(0);
    expect(partDesFrais(100_000, 1, 3)).toBe(33_333);
  });

  it("montant mensuel daté : la ligne la plus récente déjà commencée ; mois complets d'une période", () => {
    const lignes = [
      { aPartirDe: "2026-09", montant: 20_000 },
      { aPartirDe: "2026-11", montant: 25_000 },
    ];
    expect(montantDuMois(lignes, "2026-08")).toBe(0);
    expect(montantDuMois(lignes, "2026-10")).toBe(20_000);
    expect(montantDuMois(lignes, "2026-12")).toBe(25_000);
    expect(moisComplets("2026-09-01", "2026-11-30")).toEqual(["2026-09", "2026-10", "2026-11"]);
    expect(moisComplets("2026-09-15", "2026-11-29")).toEqual(["2026-10"]);
    expect(moisComplets("2026-12-01", "2027-02-28")).toEqual(["2026-12", "2027-01", "2027-02"]);
    expect(moisComplets("2026-10-02", "2026-10-31")).toEqual([]);
  });

  it("frais bancaires en % des paiements par carte ; clés des frais proposés uniques", () => {
    expect(montantDepense("pourcent_carte", 80, 1_000_000, 750_000)).toBe(6_000); // 0,8 % de 7 500 € par carte
    expect(montantDepense("pourcent", 1_200, 1_000_000, 750_000)).toBe(120_000);
    expect(new Set(FRAIS_SUGGERES.map((f) => f.cle)).size).toBe(FRAIS_SUGGERES.length);
  });

  it("cascade : écarts de stock et part des frais du mois déduits jusqu'à « ce qu'il te reste »", () => {
    const c = cascadeSoiree({ encaisseTtc: 12_000, tva: 2_000, coutMatiere: 3_000, personnel: 1_500, depenses: 500, ecartStock: -200, fraisMois: 1_000 });
    // 10 000 HT − 3 000 = 7 000 ; − 200 de stock − 1 500 − 500 − 1 000 = 3 800.
    expect(c.margeNette).toBe(3_800);
    expect(c.lignes.map((l) => [l.libelle, l.montant])).toEqual([
      ["Encaissé TTC", 12_000],
      ["TVA collectée (reversée à l'État)", 2_000],
      ["Chiffre d'affaires HT", 10_000],
      ["Coût matière (prix d'achat de ce qui a été vendu)", 3_000],
      ["Marge brute", 7_000],
      ["Écarts de stock comptés (casse, pertes)", 200],
      ["Personnel de la soirée", 1_500],
      ["Dépenses de la soirée", 500],
      ["Part des frais du mois (loyer, abonnements, salaires hors soirée…)", 1_000],
      [LIBELLE_RESTE, 3_800],
    ]);
    // Sans stock suivi ni frais du mois : les deux lignes n'apparaissent pas.
    expect(cascadeSoiree({ encaisseTtc: 12_000, tva: 2_000, coutMatiere: 3_000, personnel: 1_500, depenses: 500 }).lignes).toHaveLength(8);
  });
});
