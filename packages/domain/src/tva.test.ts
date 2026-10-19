import { describe, expect, it } from "vitest";
import { estTauxTva, tauxTvaProposes } from "./tva.ts";

describe("taux de TVA proposés (§15.169)", () => {
  it("sans le 2,1 %, sauf pour le produit qui l'a déjà ; il reste un taux valable", () => {
    expect(tauxTvaProposes().map((t) => t.libelle)).toEqual(["5,5 %", "10 %", "20 %"]);
    expect(tauxTvaProposes(1000).map((t) => t.pb)).toEqual([550, 1000, 2000]);
    expect(tauxTvaProposes(210).map((t) => t.pb)).toEqual([550, 1000, 2000, 210]);
    expect(estTauxTva(210)).toBe(true);
  });
});
