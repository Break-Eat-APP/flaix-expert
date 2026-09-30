import { describe, expect, it } from "vitest";
import { alerteStock, cump, motifEcartStockRequis, seuilAlerte, suggestionMiseEnPlace } from "./stock.ts";

describe("stock — module 4 (§14, §15.105)", () => {
  it("exemple validé : Hot-dog, Buvette Sud — départ 160, entrées 30, vendu 160, compté 28 → attendu 30, écart −2, −3,80 € à 1,90 €", () => {
    const restant = 160 + 30 - 160;
    expect(restant).toBe(30);
    const ecart = 28 - restant;
    expect(ecart).toBe(-2);
    expect(ecart * 190).toBe(-380);
    // 2 sur 160 = 1,25 % : sous 3 %, aucun motif demandé.
    expect(motifEcartStockRequis(ecart, 160)).toBe(false);
  });

  it("exemple validé du module 10 : mise en place 260, vendu 238, compté 5 → écart −17, motif requis (17 > 7,8)", () => {
    expect(motifEcartStockRequis(5 - (260 - 238), 260)).toBe(true);
  });

  it("seuil d'alerte à 15 % du départ : faible puis rupture", () => {
    expect(seuilAlerte(160)).toBe(24);
    expect(alerteStock(160, 0, 25)).toBeNull();
    expect(alerteStock(160, 0, 24)).toBe("faible");
    expect(alerteStock(160, 30, 0)).toBe("rupture");
    expect(alerteStock(0, 0, 0)).toBeNull();
  });

  it("CUMP, exemple validé : bière 25 cl, 480 en réserve à 1,200 € + 240 livrées à 1,25 € → 1,217 € (arrondi au centime : 1,22 €)", () => {
    expect(cump(480, 120, 240, 125)).toBe(122);
    // Réserve vide ou coût inconnu : le prix de la livraison.
    expect(cump(0, 120, 200, 195)).toBe(195);
    expect(cump(50, null, 200, 195)).toBe(195);
  });

  it("suggestion : moyenne des ventes précédentes − reste, plancher 0 ; pas d'historique = pas de chiffre", () => {
    expect(suggestionMiseEnPlace([220, 180], 30)).toBe(170);
    expect(suggestionMiseEnPlace([20], 40)).toBe(0);
    expect(suggestionMiseEnPlace([], 0)).toBeNull();
  });
});
