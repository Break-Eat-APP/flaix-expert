import { describe, expect, it } from "vitest";
import { coutLigneRecette, coutRecette, quantiteMilliVersSaisie, quantiteSaisieVersMilli } from "./recettes.ts";

describe("coût de fabrication — l'exemple du burger de Rémi", () => {
  it("100 g de tomates à 2,50 €/kg = 0,25 €", () => {
    expect(coutLigneRecette(250, 100)).toBeCloseTo(25, 9);
  });

  it("tomates 0,25 + salade 0,10 + steak 1,20 + pain 0,45 = 2,00 €", () => {
    expect(
      coutRecette([
        { prix: 250, quantiteMilli: 100 }, // tomates 2,50 €/kg, 100 g
        { prix: 400, quantiteMilli: 25 }, // salade 4,00 €/kg, 25 g
        { prix: 1000, quantiteMilli: 120 }, // steak 10,00 €/kg, 120 g
        { prix: 45, quantiteMilli: 1000 }, // pain 0,45 € la pièce
      ]),
    ).toBe(200);
  });

  it("liquides au litre, saisis en cl ; pièces fractionnées", () => {
    expect(coutLigneRecette(300, quantiteSaisieVersMilli("25", "l")!)).toBeCloseTo(75, 9); // 25 cl d'un sirop à 3,00 €/L
    expect(coutLigneRecette(120, quantiteSaisieVersMilli("0,5", "piece")!)).toBeCloseTo(60, 9); // une demi-baguette à 1,20 €
  });

  it("le coût se calcule exact puis s'arrondit une fois, au total", () => {
    // Trois lignes à un tiers de centime chacune : 0,333 + 0,333 + 0,334 = 1 centime (chacune arrondie seule donnerait 0).
    expect(coutRecette([{ prix: 1, quantiteMilli: 333 }, { prix: 1, quantiteMilli: 333 }, { prix: 1, quantiteMilli: 334 }])).toBe(1);
  });
});

describe("saisie des quantités", () => {
  it("g, cl et pièces → millièmes, et retour", () => {
    expect(quantiteSaisieVersMilli("100", "kg")).toBe(100);
    expect(quantiteSaisieVersMilli("2,5", "l")).toBe(25);
    expect(quantiteSaisieVersMilli("0,5", "piece")).toBe(500);
    expect(quantiteMilliVersSaisie(25, "l")).toBe("2,5");
    expect(quantiteMilliVersSaisie(500, "piece")).toBe("0,5");
    expect(quantiteMilliVersSaisie(120, "kg")).toBe("120");
  });

  it("vide, nul ou illisible : refusé", () => {
    expect(quantiteSaisieVersMilli("", "kg")).toBeNull();
    expect(quantiteSaisieVersMilli("0", "kg")).toBeNull();
    expect(quantiteSaisieVersMilli("abc", "kg")).toBeNull();
    expect(quantiteSaisieVersMilli("-5", "kg")).toBeNull();
  });
});
