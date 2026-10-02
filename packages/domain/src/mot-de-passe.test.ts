import { describe, expect, it } from "vitest";
import { refusMotDePasse } from "./mot-de-passe.ts";

describe("règle des mots de passe", () => {
  it("six caractères suffisent", () => {
    expect(refusMotDePasse("k7mq4x")).toBeNull();
    expect(refusMotDePasse("Bar2026")).toBeNull();
    expect(refusMotDePasse("k7mq4")).toMatch(/au moins 6/);
  });

  it("refuse les plus utilisés, les suites et les répétitions", () => {
    for (const m of ["123456", "654321", "abcdef", "000000", "aaaaaaa", "AZERTY", "motdepasse", "123123"]) {
      expect(refusMotDePasse(m), m).toMatch(/plus utilisés/);
    }
  });

  it("refuse au-delà de 200 caractères", () => {
    expect(refusMotDePasse("x".repeat(150) + "y".repeat(51))).toMatch(/200/);
  });
});
