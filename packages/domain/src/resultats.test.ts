import { describe, expect, it } from "vitest";
import type { ProduitVendu } from "./modele.ts";
import { aRevoir, mediane, pistesMarges, rangHeure, regrouperParts, reperesMarges, variation } from "./resultats.ts";
import { formaterMontant } from "./argent.ts";

const produit = (nom: string, quantite: number, prix: number, cout: number | null, taux = 1.2): ProduitVendu => {
  const caTtc = quantite * prix;
  const caHt = Math.round(caTtc / taux);
  return { produitId: nom, nom, categorie: null, quantite, caTtc, caHt, coutUnitaire: cout, marge: cout === null ? null : caHt - quantite * cout };
};

describe("Résultats — calculs de présentation (§15.103)", () => {
  it("évolution : null quand la comparaison manque ou vaut zéro, jamais un chiffre inventé", () => {
    expect(variation(18640, 17890)).toBeCloseTo(4.19, 2);
    expect(variation(100, 0)).toBeNull();
    expect(variation(100, null)).toBeNull();
    expect(variation(null, 100)).toBeNull();
  });

  it("médiane, heures d'une soirée qui passe minuit", () => {
    expect(mediane([3, 1, 2])).toBe(2);
    expect(mediane([4, 1, 2, 3])).toBe(2.5);
    expect(mediane([])).toBeNull();
    expect([23, 0, 1, 22].sort((a, b) => rangHeure(a) - rangHeure(b))).toEqual([22, 23, 0, 1]);
  });

  it("camembert : 5 parts nommées au plus, le reste en « Autres » ; jamais une part « Autres » d'un seul élément", () => {
    const parts = ["A", "B", "C", "D", "E", "F", "G"].map((nom, i) => ({ nom, ca: 700 - i * 100 }));
    const r = regrouperParts(parts);
    expect(r.map((p) => p.nom)).toEqual(["A", "B", "C", "D", "E", "Autres"]);
    expect(r.at(-1)!.ca).toBe(200 + 100);
    expect(regrouperParts(parts.slice(0, 6)).map((p) => p.nom)).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("nuage des marges : repères = médianes des produits dont le coût est connu ; « à revoir » = beaucoup vendu, peu de marge", () => {
    const produits = [produit("Bière 25 cl", 312, 400, 130), produit("Burger", 118, 1300, 280), produit("Hot-dog", 264, 700, 130), produit("Nachos", 96, 500, 110), produit("Soda", 226, 400, null)];
    const r = reperesMarges(produits)!;
    expect(r.quantite).toBe((264 + 118) / 2);
    const biere = produits[0]!;
    expect(aRevoir(biere, r)).toBe(true);
    expect(aRevoir(produits[1]!, r)).toBe(false);
    // Le soda n'a pas de coût : il n'entre ni dans les repères ni dans les pistes.
    const pistes = pistesMarges(produits, formaterMontant);
    expect(pistes.map((p) => p.produit)).toEqual(["Bière 25 cl"]);
    // +0,50 € TTC à 20 % de TVA = +0,4167 € HT par vente × 312 = +130 €.
    expect(pistes[0]!.calcul).toContain("130,00");
  });
});
