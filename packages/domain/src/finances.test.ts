import { describe, expect, it } from "vitest";
import { cibleEffective, etatCible, etatCibleSoiree, formaterPourcentage, lirePourcentage, margeConfiguree, montantDepense, tauxMargePb } from "./finances.ts";

describe("cibles de marge (module 5)", () => {
  it("la cible du produit prime sur celle de sa catégorie ; sans aucune, pas de cible (jamais inventée)", () => {
    expect(cibleEffective(6_500, 7_000)).toBe(6_500);
    expect(cibleEffective(null, 7_000)).toBe(7_000);
    expect(cibleEffective(null, null)).toBeNull();
    expect(cibleEffective(0, 7_000)).toBe(0); // une cible de 0 % est une vraie cible
  });

  it("exemple du dossier : frites 4,50 € TTC à 5,5 %, coût 1,35 €, cible 70 % → 68,3 %, sous la cible de 1,7 point, −0,07 € par vente", () => {
    const m = margeConfiguree(450, 550, 135, 7_000)!;
    expect(m.ht).toBeCloseTo(426.54, 2);
    expect(m.etat).toEqual({ statut: "sous", tauxPb: 6_835, ciblePb: 7_000, ecartPb: -165 });
    expect(Math.round(m.ecartParVente!)).toBe(-7);
  });

  it("bière pression 25 cl, 5,00 € à 20 %, coût 1,217 € : tient tout juste sa cible de 70 % (70,8 %)", () => {
    expect(margeConfiguree(500, 2000, 121.7, 7_000)!.etat).toMatchObject({ statut: "tenue", tauxPb: 7_079 });
  });

  it("[F] coût manquant : pas de marge configurée (jamais 100 %) ; sans cible, le taux s'affiche sans être jugé", () => {
    expect(margeConfiguree(450, 550, null, 7_000)).toBeNull();
    expect(margeConfiguree(450, 550, 135, null)!.etat.statut).toBe("sans_cible");
    expect(etatCible(null, 7_000).statut).toBe("inconnu");
    expect(tauxMargePb(500, 0)).toBeNull();
  });
});

describe("dépenses de la soirée et cible de marge nette (module 11)", () => {
  it("une dépense en euros reste telle quelle ; en pourcentage, elle porte sur le CA HT de la soirée", () => {
    expect(montantDepense("euros", 34_800, 1_660_600)).toBe(34_800);
    expect(montantDepense("pourcent", 250, 1_660_600)).toBe(41_515); // 2,5 % de 16 606 €
    expect(montantDepense("pourcent", 250, -100)).toBe(0);
  });

  it("marge nette comparée à sa cible : 8 776 € pour 16 606 € HT, cible 50 % → tenue de 473 €", () => {
    expect(etatCibleSoiree(877_600, 1_660_600, 5_000)).toEqual({ ciblePb: 5_000, cible: 830_300, tauxPb: 5_285, ecart: 47_300, ecartPb: 285, tenue: true });
    expect(etatCibleSoiree(877_600, 1_660_600, 6_000)).toMatchObject({ ecart: -118_760, tenue: false });
  });

  it("sans cible : rien n'est jugé ; marge nette incalculable : la cible s'affiche, l'écart non", () => {
    expect(etatCibleSoiree(877_600, 1_660_600, null)).toBeNull();
    expect(etatCibleSoiree(null, 1_660_600, 5_000)).toMatchObject({ cible: 830_300, ecart: null, tenue: null });
  });

  it("saisie d'un pourcentage : virgule acceptée, bornes respectées", () => {
    expect(lirePourcentage("70")).toBe(7_000);
    expect(lirePourcentage(" 52,5 % ")).toBe(5_250);
    expect(lirePourcentage("101")).toBeNull();
    expect(lirePourcentage("-5")).toBeNull();
    expect(lirePourcentage("-5", { min: -100 })).toBe(-500);
    expect(lirePourcentage("abc")).toBeNull();
    expect(formaterPourcentage(5_250)).toBe("52,5 %");
  });
});
