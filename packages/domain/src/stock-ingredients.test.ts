import { describe, expect, it } from "vitest";
import { cump } from "./stock.ts";
import { formaterQuantiteStock, milliVersSaisieStock, prixUnitaireLivraison, quantiteStockVersMilli, valeurQuantiteStock } from "./stock-ingredients.ts";

describe("stock des ingrédients", () => {
  it("saisie en unité d'achat, stockée en millièmes", () => {
    expect(quantiteStockVersMilli("30")).toBe(30_000);
    expect(quantiteStockVersMilli("12,5")).toBe(12_500);
    expect(quantiteStockVersMilli("0,250")).toBe(250);
    expect(quantiteStockVersMilli("0")).toBeNull();
    expect(quantiteStockVersMilli("0", { zero: true })).toBe(0);
    expect(quantiteStockVersMilli("1,2345")).toBeNull();
    expect(quantiteStockVersMilli("abc")).toBeNull();
    expect(milliVersSaisieStock(12_500)).toBe("12,5");
  });

  it("affichage avec l'unité", () => {
    expect(formaterQuantiteStock(12_500, "l")).toBe("12,5 L");
    expect(formaterQuantiteStock(-4_000, "l")).toBe("−4 L");
    expect(formaterQuantiteStock(14_000, "piece")).toBe("14 pièces");
    expect(formaterQuantiteStock(1_000, "piece")).toBe("1 pièce");
    expect(formaterQuantiteStock(3_250, "kg")).toBe("3,25 kg");
  });

  it("fût de 30 L à 90 € : 3,00 €/L ; 4 L perdus valent 12 €", () => {
    expect(prixUnitaireLivraison(9_000, 30_000)).toBe(300);
    expect(valeurQuantiteStock(-4_000, 300)).toBe(-1_200);
  });

  it("le coût moyen pondéré marche en millièmes : 10 L à 3,00 € + 30 L à 3,40 € → 3,30 €/L", () => {
    expect(cump(10_000, 300, 30_000, 340)).toBe(330);
  });
});
