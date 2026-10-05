import { describe, expect, it } from "vitest";
import { formaterMontant } from "./argent.ts";
import {
  alerteMargeConfiguree,
  alerteMercuriale,
  alerteVariation,
  ecartMercuriale,
  niveauAPousser,
  texteAlerteStock,
  trierAlertes,
  variationsFournisseur,
  type AlerteCentre,
  type LivraisonPrix,
  type LigneMercuriale,
} from "./alertes.ts";

const livraison = (prix: number, le: string, fournisseur: string | null = "Brasserie du Port", quantite = 300): LivraisonPrix => ({
  cle: "p:biere",
  nom: "Bière pression 25 cl",
  fournisseur,
  prix,
  quantite,
  unite: null,
  le,
});

describe("variation du prix d'un fournisseur (module 18)", () => {
  it("exemple du dossier : 1,25 € puis 1,32 € → +5,6 %, au-dessus du seuil de 5 % : alerte hausse, impact sur la quantité livrée", () => {
    const v = variationsFournisseur([livraison(125, "2026-09-01T10:00:00Z"), livraison(132, "2026-09-20T10:00:00Z")]);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ variationPb: 560, impact: 2_100 }); // 0,07 € × 300
    const a = alerteVariation(v[0]!);
    expect(a).toMatchObject({ type: "variation_fournisseur", source: "calculee", niveau: "forte", impact: 2_100 });
    expect(a.titre).toBe("Hausse du prix de Bière pression 25 cl chez Brasserie du Port : +5,6 %");
  });

  it("hot-dog +2,2 % : sous le seuil, pas d'alerte ; seule la dernière livraison est jugée ; un autre fournisseur ne compte pas comme « précédente »", () => {
    expect(variationsFournisseur([livraison(90, "2026-09-01T10:00:00Z"), livraison(92, "2026-09-20T10:00:00Z")])).toEqual([]);
    // Grosse hausse ancienne, puis prix stable : rien à signaler aujourd'hui.
    expect(variationsFournisseur([livraison(100, "2026-08-01T10:00:00Z"), livraison(150, "2026-09-01T10:00:00Z"), livraison(151, "2026-09-20T10:00:00Z")])).toEqual([]);
    // Nouveau fournisseur sans livraison précédente chez lui : pas de comparaison.
    expect(variationsFournisseur([livraison(100, "2026-09-01T10:00:00Z", "Grossiste A"), livraison(150, "2026-09-20T10:00:00Z", "Grossiste B")])).toEqual([]);
  });

  it("une baisse au-delà du seuil est signalée sans impact négatif présenté comme une perte", () => {
    const a = alerteVariation(variationsFournisseur([livraison(200, "2026-09-01T10:00:00Z"), livraison(170, "2026-09-20T10:00:00Z")])[0]!);
    expect(a).toMatchObject({ niveau: "normale", impact: null });
    expect(a.titre).toContain("Baisse du prix");
  });
});

describe("mercuriale (module 18)", () => {
  const ligne = (cout: number | null, reference: number | null): LigneMercuriale => ({ cle: "p:hotdog", type: "produit", id: "hotdog", nom: "Saucisse hot-dog", unite: null, coutActuel: cout, reference, ecartPb: ecartMercuriale(cout, reference), saisiPar: null, saisiLe: null });

  it("exemples du dossier : bière 1,217 € pour 1,20 € → +1,4 %, pas d'alerte ; saucisses 0,95 € pour 0,80 € → +18,8 %, alerte", () => {
    expect(ecartMercuriale(121.7, 120)).toBe(142);
    expect(alerteMercuriale(ligne(122, 120), 200)).toBeNull();
    const a = alerteMercuriale(ligne(95, 80), 200)!;
    expect(a).toMatchObject({ type: "mercuriale", impact: 3_000 }); // 0,15 € × 200 ventes
    expect(a.titre).toBe("Saucisse hot-dog : coût +18,8 % au-dessus de ta référence");
  });

  it("[F] sans référence ou sans coût : rien n'est jugé (jamais un écart inventé)", () => {
    expect(ecartMercuriale(null, 80)).toBeNull();
    expect(ecartMercuriale(95, null)).toBeNull();
    expect(alerteMercuriale(ligne(null, 80), 200)).toBeNull();
  });
});

describe("marge configurée, tri, rupture poussée", () => {
  it("frites 68,3 % pour 70 % : −0,07 € par vente, soit 14 € sur 200 ventes", () => {
    const a = alerteMargeConfiguree({ id: "frites", nom: "Frites", tauxPb: 6_835, ciblePb: 7_000, ecartParVente: -7.04, ventesDernierEvenement: 200 });
    expect(a.impact).toBe(1_408);
    expect(a.detail).toContain(`Il manque ${formaterMontant(7)} par vente`);
  });

  it("les fortes d'abord, puis par impact", () => {
    const a = (id: string, niveau: AlerteCentre["niveau"], impact: number | null) => ({ id, type: "perte_stock", source: "lue", niveau, titre: id, detail: "", impact, lien: "/" }) as AlerteCentre;
    expect(trierAlertes([a("b", "normale", 5_000), a("a", "forte", 100), a("c", "normale", null), a("d", "forte", 900)]).map((x) => x.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("rupture et stock faible poussés selon les réglages du lieu ; texte de la notification", () => {
    expect(niveauAPousser("rupture", { rupture: true, faible: false })).toBe("rupture");
    expect(niveauAPousser("faible", { rupture: true, faible: false })).toBeNull();
    expect(niveauAPousser(null, { rupture: true, faible: true })).toBeNull();
    expect(texteAlerteStock({ niveau: "rupture", produit: "Frites", stand: "Buvette Nord", restant: 0, depart: 100, reassort: 20, vendu: 120 })).toEqual({
      titre: "Rupture : Frites à Buvette Nord",
      corps: "Reste 0 sur 120 · vendu 120. Touche pour un réassort depuis « En direct ».",
    });
  });
});
