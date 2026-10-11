import { describe, expect, it } from "vitest";
import { conditionnementMillimes, conditionnementVendu, coutDeRevient, formaterMillimes, lireMillimes, millimesPourSaisie } from "./emballages.ts";
import { cascadeSoiree } from "./rapport-soiree.ts";

describe("conditionnement (§15.155)", () => {
  it("prix au millième d'euro : lecture, affichage, saisie", () => {
    expect(lireMillimes("0,008")).toBe(8);
    expect(lireMillimes("0,12 €")).toBe(120);
    expect(lireMillimes("1.5")).toBe(1_500);
    expect(lireMillimes("0,0001")).toBeNull();
    expect(lireMillimes("-1")).toBeNull();
    expect(lireMillimes("101")).toBeNull();
    expect(formaterMillimes(8)).toMatch(/^0,008\s€$/);
    expect(formaterMillimes(120)).toMatch(/^0,12\s€$/);
    expect(millimesPourSaisie(1_500)).toBe("1,50");
  });

  it("conditionnement d'une portion, coût de revient, conditionnement vendu arrondi au centime", () => {
    const biere = conditionnementMillimes([{ quantite: 1, prixMillimes: 120 }, { quantite: 2, prixMillimes: 8 }]);
    expect(biere).toBe(136);
    expect(coutDeRevient(120, biere)).toBeCloseTo(133.6, 6);
    expect(coutDeRevient(null, biere)).toBeNull();
    expect(conditionnementVendu([{ quantite: 3, conditionnementMillimes: 136 }, { quantite: -1, conditionnementMillimes: 136 }, { quantite: 5 }])).toBe(27);
  });

  it("cascade : le conditionnement se retire avant la marge brute", () => {
    const c = cascadeSoiree({ encaisseTtc: 12_000, tva: 2_000, coutMatiere: 3_000, conditionnement: 400, personnel: 0, depenses: 0 });
    expect(c.margeBrute).toBe(6_600);
    expect(c.lignes.map((l) => l.libelle).slice(3, 6)).toEqual(["Coût matière (prix d'achat de ce qui a été vendu)", "Conditionnement (gobelets, barquettes, serviettes…)", "Marge brute"]);
  });
});
