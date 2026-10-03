import { describe, expect, it } from "vitest";
import { cascadeEncaissement, prixAppConseille, prixAppExact, resteApp, resteComptoir, tauxStripeEffectif, verdictPrixApp, type ReglagesClickCollect } from "./click-collect.ts";

/** Exemple vérifié du dossier (§15.20 ter, §15.28) : commission 10 %, TVA répercutée, Stripe 2,5 % sans frais fixe. */
const r = (x: Partial<ReglagesClickCollect> = {}): ReglagesClickCollect => ({
  commissionPb: 1000,
  commissionSurPrixApp: false,
  tvaCommissionRepercutee: true,
  stripeTauxPb: 250,
  stripeFixe: 0,
  panierMoyen: 2700,
  ...x,
});

describe("prix app conseillé", () => {
  it("hot-dog 6,50 €, TVA 10 % → 7,5661 € (+16,4 %), arrondi au centime supérieur 7,57 €", () => {
    expect(prixAppExact(650, 1000, r())).toBeCloseTo(756.61, 1);
    expect(prixAppConseille(650, 1000, r())).toBe(757);
  });

  it("la marge HT du comptoir est préservée exactement au prix exact", () => {
    const a = prixAppExact(650, 1000, r())!;
    expect(resteApp(a, 650, 1000, r())).toBeCloseTo(resteComptoir(650, 1000), 6);
    expect(resteComptoir(650, 1000)).toBeCloseTo(590.91, 2);
  });

  it("la majoration dépend de la TVA du produit : 15,71 % / 16,40 % / 17,94 %", () => {
    const maj = (tva: number) => (prixAppExact(400, tva, r())! / 400 - 1) * 100;
    expect(maj(550)).toBeCloseTo(15.71, 1);
    expect(maj(1000)).toBeCloseTo(16.4, 1);
    expect(maj(2000)).toBeCloseTo(17.94, 1);
  });

  it("TVA sur commission non répercutée : 7,42 € au lieu de 7,57 €", () => {
    expect(prixAppConseille(650, 1000, r({ tvaCommissionRepercutee: false }))).toBe(742);
  });

  it("commission sur le prix app : hot-dog 6,50 € → 7,7335 € (+18,98 %), marge HT du comptoir préservée", () => {
    const x = r({ commissionSurPrixApp: true });
    const a = prixAppExact(650, 1000, x)!;
    expect(a).toBeCloseTo(773.35, 1);
    expect(resteApp(a, 650, 1000, x)).toBeCloseTo(resteComptoir(650, 1000), 6);
    expect(cascadeEncaissement(774, 650, 1000, x).commissionHt).toBeCloseTo(77.4, 6);
    expect(prixAppExact(650, 1000, r({ commissionSurPrixApp: true, commissionPb: 5000, stripeTauxPb: 3500 }))).toBeNull();
  });

  it("frais impossibles à couvrir (Stripe ≥ prix HT) : pas de prix", () => {
    expect(prixAppExact(650, 1000, r({ stripeTauxPb: 9500 }))).toBeNull();
  });
});

describe("Stripe : pourcentage + frais fixe sur le panier moyen", () => {
  it("1,5 % + 0,25 € à 27 € de panier = 2,43 % ; à 8 € = 4,63 %", () => {
    expect(tauxStripeEffectif(r({ stripeTauxPb: 150, stripeFixe: 25, panierMoyen: 2700 }))).toBeCloseTo(0.02426, 4);
    expect(tauxStripeEffectif(r({ stripeTauxPb: 150, stripeFixe: 25, panierMoyen: 800 }))).toBeCloseTo(0.04625, 4);
  });
});

describe("verdict sur le prix choisi par le directeur", () => {
  it("à 7,50 € il manque 0,06 € par vente ; au prix conseillé, rien ne manque", () => {
    const v = verdictPrixApp(750, 650, 1000, r());
    expect(v.couvre).toBe(false);
    expect(v.ecartParVente).toBeCloseTo(-5.8, 1);
    expect(v.majorationPct).toBeCloseTo(15.38, 2);
    expect(verdictPrixApp(757, 650, 1000, r()).couvre).toBe(true);
  });

  it("cascade : payé = TVA produit + Stripe + commission HT + TVA commission + reste", () => {
    const c = cascadeEncaissement(757, 650, 1000, r());
    expect(c.paye).toBe(757);
    expect(c.commissionHt).toBeCloseTo(65, 6);
    expect(c.tvaCommission).toBeCloseTo(13, 6);
    expect(c.tvaProduit + c.stripe + c.commissionHt + c.tvaCommission + c.reste).toBeCloseTo(757, 6);
  });
});
