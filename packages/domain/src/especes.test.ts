import { describe, expect, it } from "vitest";
import { comptageCloturable, erreurCoupures, especesAttendues, libelleCoupure, motifEcartRequis, normaliserCoupures, totalCoupures } from "./especes.ts";

describe("contrôle des espèces — module 7 (§14, §15.102)", () => {
  it("compte le tiroir coupure par coupure", () => {
    // 2 × 50 € + 3 × 20 € + 7 × 2 € + 4 × 50 c = 176,00 €
    expect(totalCoupures({ "5000": 2, "2000": 3, "200": 7, "50": 4 })).toBe(17600);
    expect(totalCoupures({})).toBe(0);
  });

  it("exemple du prototype validé : C3, attendu 150 + 1 120 − 200 = 1 070 €, compté 1 038,80 € → écart −31,20 €, motif requis", () => {
    const attendu = especesAttendues(15000, 112000, 20000);
    expect(attendu).toBe(107000);
    const ecart = 103880 - attendu;
    expect(ecart).toBe(-3120);
    expect(motifEcartRequis(ecart, 500)).toBe(true);
    expect(comptageCloturable(ecart, 500, "")).toBe(false);
    expect(comptageCloturable(ecart, 500, "Erreur de rendu sur un billet de 20 €")).toBe(true);
  });

  it("dans la tolérance, aucun motif ; un écart positif est traité comme un négatif", () => {
    expect(motifEcartRequis(-240, 500)).toBe(false);
    expect(motifEcartRequis(500, 500)).toBe(false);
    expect(motifEcartRequis(501, 500)).toBe(true);
    expect(comptageCloturable(-240, 500, null)).toBe(true);
  });

  it("refuse une coupure inconnue ou un nombre invalide", () => {
    expect(erreurCoupures({ "300": 1 })).toContain("inconnue");
    expect(erreurCoupures({ "05": 1 })).toContain("inconnue");
    expect(erreurCoupures({ "2000": -1 })).toContain("invalide");
    expect(erreurCoupures({ "2000": 1.5 })).toContain("invalide");
    expect(erreurCoupures({ "2000": 3, "1": 12 })).toBeNull();
  });

  it("nettoie le comptage et nomme les coupures", () => {
    expect(normaliserCoupures({ "1": 3, "5000": 0, "2000": 2 })).toEqual({ "2000": 2, "1": 3 });
    expect(libelleCoupure(50000)).toBe("500 €");
    expect(libelleCoupure(50)).toBe("50 c");
  });
});
