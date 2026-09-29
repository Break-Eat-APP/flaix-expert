import { describe, expect, it } from "vitest";
import { diviserArrondi, formaterMontant, lireMontant, montantPourSaisie } from "./argent.ts";

describe("lireMontant", () => {
  it.each([
    ["7", 700],
    ["7,5", 750],
    ["7,50", 750],
    ["7.50", 750],
    [" 7,50 € ", 750],
    ["0,05", 5],
    ["13", 1300],
  ])("« %s » → %i centimes", (saisie, attendu) => {
    expect(lireMontant(saisie)).toBe(attendu);
  });

  it.each(["", "abc", "-3", "7,555", "7,", ",5", "1 000,00x"])("refuse « %s »", (saisie) => {
    expect(lireMontant(saisie)).toBeNull();
  });
});

describe("formatage", () => {
  it("affiche au format français", () => {
    expect(formaterMontant(750).replace(/\s/g, " ")).toBe("7,50 €");
    expect(montantPourSaisie(1300)).toBe("13,00");
  });
});

describe("diviserArrondi", () => {
  it("arrondit au plus proche, demi vers l'extérieur, symétriquement", () => {
    expect(diviserArrondi(15, 10)).toBe(2);
    expect(diviserArrondi(14, 10)).toBe(1);
    expect(diviserArrondi(-15, 10)).toBe(-2);
    expect(diviserArrondi(-14, 10)).toBe(-1);
  });
});
