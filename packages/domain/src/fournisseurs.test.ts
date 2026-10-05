import { describe, expect, it } from "vitest";
import { SANS_FOURNISSEUR, comparerFournisseurs, moyenneParEvenement, type LivraisonFournisseur } from "./fournisseurs.ts";

const biere = (fournisseur: string | null, prixUnitaire: number, date: string, quantite = 60): LivraisonFournisseur => ({
  cle: "i:blonde",
  nom: "Bière blonde (fût)",
  unite: "l",
  fournisseur,
  prixUnitaire,
  quantite,
  date,
  le: `${date}T10:00:00Z`,
});

describe("comparaison des prix entre fournisseurs (module 5)", () => {
  it("exemple du prototype : 4,500 €/L chez le moins cher, 5,050 €/L chez l'autre → +12,2 % ; au litre, jamais au fût", () => {
    const [a] = comparerFournisseurs([biere("Brasserie du Sud", 450, "2026-09-01"), biere("Grossiste Nord", 505, "2026-09-10")], new Map(), []);
    expect(a!.offres.map((o) => [o.fournisseur, o.prixUnitaire, o.ecartPct])).toEqual([
      ["Brasserie du Sud", 450, null],
      ["Grossiste Nord", 505, 12.2],
    ]);
    expect(a!.surConditionnement).toBe(false); // pas de conditionnement renseigné : aucune alerte devinée
  });

  it("le prix d'un fournisseur est celui de sa dernière livraison ; les noms se regroupent sans majuscules ni espaces", () => {
    const [a] = comparerFournisseurs([biere("Brasserie du Sud", 430, "2026-08-01"), biere(" brasserie  du sud ", 470, "2026-09-20"), biere("Grossiste Nord", 460, "2026-09-10")], new Map(), []);
    expect(a!.offres.map((o) => [o.fournisseur, o.prixUnitaire, o.livraisons])).toEqual([
      ["Grossiste Nord", 460, 1],
      ["brasserie  du sud", 470, 2],
    ]);
  });

  it("sur-conditionnement : le moins cher est un fût de 50 L pour 14 L bus par événement → couvre 3,6 événements, alerte", () => {
    const [a] = comparerFournisseurs(
      [biere("Brasserie du Sud", 450, "2026-09-01"), biere("Grossiste Nord", 505, "2026-09-10")],
      new Map([["i:blonde", 14]]),
      [
        { cle: "i:blonde", fournisseur: "brasserie du sud", libelle: "fût", contenance: 50 },
        { cle: "i:blonde", fournisseur: "Grossiste Nord", libelle: "fût", contenance: 20 },
      ],
    );
    expect(a!.offres[0]).toMatchObject({ conditionnement: { libelle: "fût", contenance: 50 }, couvre: 3.6 });
    expect(a!.offres[1]!.couvre).toBe(1.4);
    expect(a!.surConditionnement).toBe(true);
  });

  it("un seul fournisseur : rien à comparer, après les autres ; livraison sans fournisseur nommée comme telle", () => {
    const r = comparerFournisseurs(
      [{ ...biere(null, 300, "2026-09-01"), cle: "p:eau", nom: "Eau 50 cl", unite: null }, biere("A", 450, "2026-09-01"), biere("B", 460, "2026-09-02")],
      new Map(),
      [],
    );
    expect(r.map((x) => x.nom)).toEqual(["Bière blonde (fût)", "Eau 50 cl"]);
    expect(r[1]!.offres[0]!.fournisseur).toBe(SANS_FOURNISSEUR);
    expect(r[1]!.surConditionnement).toBe(false);
  });

  it("consommation moyenne : les événements sans vente comptent pour 0", () => {
    expect(moyenneParEvenement([20, 8], 4)).toBe(7);
    expect(moyenneParEvenement([], 0)).toBeNull();
  });
});
