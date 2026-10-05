import { describe, expect, it } from "vitest";
import { caissesAuPic, fourchette, prevoir, quantile, verdict, type EvenementComparable } from "./prevision.ts";

const evenement = (id: string, spectateurs: number | null, frites: number, caTtc: number, pic = 100): EvenementComparable => ({
  id,
  libelle: id,
  debut: "2026-09-01T18:00:00Z",
  spectateurs,
  caTtc,
  tickets: Math.round(caTtc / 1_000),
  ventes: [
    { standId: "N", stand: "Buvette Nord", produitId: "F", produit: "Frites", quantite: frites },
    ...(id === "e1" ? [{ standId: "N", stand: "Buvette Nord", produitId: "C", produit: "Cookie", quantite: 10 }] : []),
  ],
  picParStand: { N: pic },
});

describe("fourchette", () => {
  it("quartiles dès 4 valeurs, extrêmes avec 2 ou 3, rien en dessous de 2", () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75);
    expect(fourchette([10, 20, 30, 40])).toEqual({ bas: 17.5, median: 25, haut: 32.5 });
    expect(fourchette([10, 30])).toEqual({ bas: 10, median: 20, haut: 30 });
    expect(fourchette([10])).toBeNull();
  });
});

describe("prévision du prochain événement (§15.143)", () => {
  it("avec l'affluence : 3 000 spectateurs prévus, comparables à 0,10 frite par spectateur environ → autour de 300 frites", () => {
    const historique = [evenement("e4", 2_500, 250, 2_000_000, 120), evenement("e3", 2_000, 220, 1_800_000, 100), evenement("e2", 3_000, 270, 2_400_000, 150), evenement("e1", 2_000, 200, 1_600_000, 90)];
    const p = prevoir(3_000, historique)!;
    expect(p.base).toBe("affluence");
    // Taux : 0,100 ; 0,110 ; 0,090 ; 0,100 → × 3 000 = 300, 330, 270, 300 → quartiles 292,5 / 300 / 307,5.
    expect(p.produits.find((x) => x.produit === "Frites")!.ventes).toEqual({ bas: 292, median: 300, haut: 308 });
    // Le cookie, vendu une seule fois (10 pour 2 000 spectateurs), compte 0 les autres fois.
    expect(p.produits.find((x) => x.produit === "Cookie")!.ventes).toEqual({ bas: 0, median: 0, haut: 4 });
    expect(p.ca).toEqual({ bas: 2_400_000, median: 2_400_000, haut: 2_475_000 }); // 2,4 M ; 2,7 M ; 2,4 M ; 2,4 M ramenés à 3 000 spectateurs
    expect(p.pics[0]!.tickets.median).toBe(147); // 144, 150, 150, 135 tickets à l'heure de pointe
  });

  it("sans affluence prévue : les comparables tels quels, et c'est dit ; moins de 2 comparables : pas de prévision", () => {
    const p = prevoir(null, [evenement("e2", 3_000, 270, 2_400_000), evenement("e1", null, 200, 1_600_000)])!;
    expect(p.base).toBe("evenements");
    expect(p.affluencePrevue).toBeNull();
    expect(p.produits.find((x) => x.produit === "Frites")!.ventes).toEqual({ bas: 200, median: 235, haut: 270 });
    expect(prevoir(3_000, [evenement("e1", 2_000, 200, 1_600_000)])).toBeNull();
  });

  it("[F] affluence prévue mais trop peu de comparables avec leur affluence : on ne divise pas par une affluence inconnue", () => {
    const p = prevoir(3_000, [evenement("e3", null, 300, 2_000_000), evenement("e2", 2_000, 200, 1_600_000), evenement("e1", null, 250, 1_800_000)])!;
    expect(p.base).toBe("evenements");
  });

  it("vérification et caisses au pic", () => {
    expect(verdict(310, { bas: 292, median: 300, haut: 308 })).toBe("au_dessus");
    expect(verdict(300, { bas: 292, median: 300, haut: 308 })).toBe("dans");
    expect(caissesAuPic(300, 95)).toBe(4); // 300 tickets à l'heure, 95 commandes par heure et par caisse en file
    expect(caissesAuPic(300, null)).toBeNull();
  });
});
