import { describe, expect, it } from "vitest";
import { chiffresVerifies } from "./assistant.ts";

describe("contrôle des chiffres de l'assistant", () => {
  const lues = ['{"encaisseTtc":"18 640,00 €","tickets":2510,"date":"2026-11-14"}'];

  it("montants recopiés, dates et comptes : vérifié, quel que soit l'espace des milliers", () => {
    expect(chiffresVerifies("Le 14 novembre 2026, tu as encaissé 18 640,00 € pour 2 510 tickets.", lues)).toBe(true);
  });

  it("les petits comptes (jusqu'à 10) ne bloquent pas : « 3 produits », « 2 soirées »", () => {
    expect(chiffresVerifies("Sur 2 soirées, 3 produits sont sous leur cible.", lues)).toBe(true);
  });

  it("[F] un montant absent des données lues, ou recalculé de tête : à vérifier", () => {
    expect(chiffresVerifies("Tu as encaissé 18 600,00 €.", lues)).toBe(false);
    expect(chiffresVerifies("Soit 7,43 € par ticket.", lues)).toBe(false);
    expect(chiffresVerifies("Tu as vendu 37 bières.", lues)).toBe(false);
  });
});
