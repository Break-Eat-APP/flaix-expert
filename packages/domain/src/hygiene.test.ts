import { describe, expect, it } from "vitest";
import { formaterTemperature, huileConforme, libelleLimites, limitesEquipement, lirePourcentDixiemes, lireTemperature, receptionConforme, temperatureConforme } from "./hygiene.ts";

describe("hygiène et HACCP (§15.156)", () => {
  it("températures : lecture, affichage, limites par défaut ou propres à l'équipement", () => {
    expect(lireTemperature("3,5")).toBe(35);
    expect(lireTemperature("-18 °C")).toBe(-180);
    expect(lireTemperature("−18")).toBe(-180);
    expect(lireTemperature("63")).toBe(630);
    expect(lireTemperature("froid")).toBeNull();
    expect(lireTemperature("200")).toBeNull();
    expect(formaterTemperature(35)).toBe("3,5 °C");
    expect(formaterTemperature(-180)).toBe("−18 °C");
    const frigo = limitesEquipement({ sorte: "froid", minDixiemes: null, maxDixiemes: null });
    expect(frigo).toEqual({ min: null, max: 40 });
    expect(temperatureConforme(40, frigo)).toBe(true);
    expect(temperatureConforme(41, frigo)).toBe(false);
    expect(temperatureConforme(-170, limitesEquipement({ sorte: "surgele", minDixiemes: null, maxDixiemes: null }))).toBe(false);
    expect(temperatureConforme(620, limitesEquipement({ sorte: "chaud", minDixiemes: null, maxDixiemes: null }))).toBe(false);
    const vitrine = limitesEquipement({ sorte: "froid", minDixiemes: 0, maxDixiemes: 60 });
    expect(libelleLimites(vitrine)).toBe("entre 0 °C et 6 °C");
    expect(temperatureConforme(55, vitrine)).toBe(true);
  });

  it("réception : date limite, emballage, température selon le type ; huile de friture", () => {
    expect(receptionConforme({ type: "frais", temperatureDixiemes: 35, dlcOk: true, emballageOk: true })).toBe(true);
    expect(receptionConforme({ type: "frais", temperatureDixiemes: 72, dlcOk: true, emballageOk: true })).toBe(false);
    expect(receptionConforme({ type: "frais", temperatureDixiemes: null, dlcOk: true, emballageOk: true })).toBe(false);
    expect(receptionConforme({ type: "surgele", temperatureDixiemes: -160, dlcOk: true, emballageOk: true })).toBe(true);
    expect(receptionConforme({ type: "sec", temperatureDixiemes: null, dlcOk: true, emballageOk: false })).toBe(false);
    expect(lirePourcentDixiemes("24,5 %")).toBe(245);
    expect(huileConforme("controle", 250)).toBe(true);
    expect(huileConforme("controle", 260)).toBe(false);
    expect(huileConforme("changement", null)).toBe(true);
  });
});
