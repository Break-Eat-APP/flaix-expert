import { describe, expect, it } from "vitest";
import { ventilerTtc, libelleTauxTva, estTauxTva } from "./tva.ts";
import { margeUnitaireComptoir } from "./marge.ts";

describe("ventilerTtc", () => {
  it("HT + TVA redonne toujours exactement le TTC", () => {
    for (const taux of [210, 550, 1000, 2000] as const) {
      for (let ttc = 0; ttc <= 5000; ttc += 7) {
        const { ht, tva } = ventilerTtc(ttc, taux);
        expect(ht + tva).toBe(ttc);
      }
    }
  });

  it("hot-dog à 7,00 € (TVA 10 %) : 6,36 € HT + 0,64 € de TVA", () => {
    expect(ventilerTtc(700, 1000)).toEqual({ ht: 636, tva: 64 });
  });

  it("bière 50 cl à 7,00 € (TVA 20 %) : 5,83 € HT + 1,17 € de TVA", () => {
    expect(ventilerTtc(700, 2000)).toEqual({ ht: 583, tva: 117 });
  });

  it("soda à 4,00 € (TVA 5,5 %) : 3,79 € HT + 0,21 € de TVA", () => {
    expect(ventilerTtc(400, 550)).toEqual({ ht: 379, tva: 21 });
  });

  it("une annulation ventile exactement comme la vente qu'elle annule", () => {
    const vente = ventilerTtc(1300, 1000);
    const annulation = ventilerTtc(-1300, 1000);
    expect(annulation).toEqual({ ht: -vente.ht, tva: -vente.tva });
  });
});

describe("taux de TVA", () => {
  it("libellés au format français", () => {
    expect(libelleTauxTva(550)).toBe("5,5 %");
    expect(libelleTauxTva(2000)).toBe("20 %");
  });
  it("seuls les taux français connus sont acceptés", () => {
    expect(estTauxTva(1000)).toBe(true);
    expect(estTauxTva(1960)).toBe(false);
    expect(estTauxTva("1000")).toBe(false);
  });
});

describe("margeUnitaireComptoir — exemples vérifiés du dossier", () => {
  it("frites 4,50 € TVA 5,5 %, coût 1,35 € → marge 2,92 €, taux 68,35 % (module 18)", () => {
    const r = margeUnitaireComptoir(450, 550, 135);
    expect(r.marge).toBe(292);
    expect(r.tauxMarge).toBeCloseTo(68.35, 2);
  });

  it("hot-dog 6,50 € TVA 10 %, coût 1,20 € → marge 4,71 € par vente, taux 79,7 % (module 5)", () => {
    const r = margeUnitaireComptoir(650, 1000, 120);
    expect(r.marge).toBe(471);
    expect(r.tauxMarge).toBeCloseTo(79.69, 1);
  });

  it("prix nul : pas de taux (pas de division par zéro)", () => {
    expect(margeUnitaireComptoir(0, 1000, 0).tauxMarge).toBeNull();
  });
});
