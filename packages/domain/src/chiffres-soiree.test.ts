import { describe, expect, it } from "vitest";
import { chiffresSoiree, devinerFamille, type EntreeChiffresSoiree } from "./chiffres-soiree.ts";

describe("les chiffres de la soirée (§15.171)", () => {
  it("famille devinée d'après le nom", () => {
    expect(["Bières", "Softs", "Vins & champagne", "Café"].map(devinerFamille)).toEqual(["boisson", "boisson", "boisson", "boisson"]);
    expect(["Snacking", "Hot-dogs", "La Box", "Sucré"].map(devinerFamille)).toEqual(["nourriture", "nourriture", "nourriture", "nourriture"]);
    expect(devinerFamille("Goodies")).toBe("autre");
  });

  const entree: EntreeChiffresSoiree = {
    caTtc: 1_000_000,
    caHt: 850_000,
    tickets: 800,
    spectateurs: 4_000,
    produits: [
      { quantite: 1_200, caTtc: 700_000, caHt: 590_000, marge: 450_000, famille: "boisson" },
      { quantite: 500, caTtc: 300_000, caHt: 260_000, marge: 150_000, famille: "nourriture" },
    ],
    quarts: [
      { debut: "20:30", ca: 150_000 },
      { debut: "20:45", ca: 250_000 },
    ],
    minutes: [{ debut: "20:47", ca: 30_000 }],
    personnel: { minutes: 1_200, cout: 85_000 },
    caisse: { tickets: 700, ca: 820_000 },
    abonnes: { tickets: 70, ca: 105_000 },
    clickCollect: { commandes: 100, ca: 180_000 },
  };

  it("conversion, articles par ticket, pic, personnel, fidélité, familles, Click & Collect", () => {
    const c = chiffresSoiree(entree);
    expect(c.conversion).toBe(2_000); // 800 tickets ÷ 4 000 spectateurs = 20 %
    expect(c).toMatchObject({ articles: 1_700, articlesParTicket: 2.1 });
    expect(c.pic).toEqual({ debut: "20:45", fin: "21:00", ca: 250_000, part: 2_500 });
    expect(c.meilleureMinute).toEqual({ heure: "20:47", ca: 30_000 });
    // 20 h de personnel : 8 500 € HT ÷ 20 = 425 € par heure ; 850 € = 10 % du CA HT.
    expect(c.personnel).toEqual({ heures: 20, caHtParHeure: 42_500, partCa: 1_000 });
    // 70 tickets abonnés sur 700 : 10 % ; panier 15 € contre (8 200 − 1 050) ÷ 630 = 11,35 €.
    expect(c.fidelite).toEqual({ tickets: 70, part: 1_000, panierAbonnes: 1_500, panierAutres: 1_135 });
    expect(c.familles).toEqual([
      { famille: "boisson", caTtc: 700_000, partCa: 7_000, marge: 450_000, partMarge: 7_500 },
      { famille: "nourriture", caTtc: 300_000, partCa: 3_000, marge: 150_000, partMarge: 2_500 },
    ]);
    // 100 commandes à 18 € : 18 % du CA, 12,5 % des tickets, 2,5 % des spectateurs ; comptoir 8 200 € ÷ 700 = 11,71 €.
    expect(c.clickCollect).toEqual({ commandes: 100, ca: 180_000, partCa: 1_800, partTickets: 1_250, conversion: 250, panier: 1_800, panierComptoir: 1_171 });
  });

  it("[F] donnée manquante : jamais supposée", () => {
    const c = chiffresSoiree({ ...entree, spectateurs: null, personnel: { minutes: 0, cout: null }, clickCollect: null, produits: [{ ...entree.produits[0]!, marge: null }, entree.produits[1]!] });
    expect(c.conversion).toBeNull();
    expect(c.personnel).toEqual({ heures: 0, caHtParHeure: null, partCa: null });
    expect(c.clickCollect).toBeNull();
    expect(c.familles[0]).toMatchObject({ famille: "boisson", marge: null, partMarge: null });
    expect(c.familles[1]).toMatchObject({ famille: "nourriture", marge: 150_000, partMarge: null });
  });
});
