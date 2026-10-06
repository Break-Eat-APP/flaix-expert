import { describe, expect, it } from "vitest";
import { devinerColonnes, instantDepuisHeureDeParis, lireDateExport, lireExportCaisse, lireMontantExport } from "./caisses-externes.ts";

describe("caisses connectées : lecture d'un export (§15.150)", () => {
  it("colonnes reconnues d'après des en-têtes variés", () => {
    expect(devinerColonnes(["N° ticket", "Date", "Point de vente", "Article", "Qté", "Prix unitaire TTC", "Taux TVA", "Moyen de paiement"])).toEqual({
      vente: 0,
      date: 1,
      pointDeVente: 2,
      produit: 3,
      quantite: 4,
      prixUnitaire: 5,
      tva: 6,
      paiement: 7,
    });
    expect(devinerColonnes(["Transaction ID", "Created at", "Terminal", "Product name", "SKU", "Quantity", "Line total", "Status"])).toEqual({
      vente: 0,
      date: 1,
      pointDeVente: 2,
      produit: 3,
      code: 4,
      quantite: 5,
      montant: 6,
      statut: 7,
    });
  });

  it("dates : heure de Paris (été et hiver), fuseau explicite gardé, illisible refusé", () => {
    expect(lireDateExport("05/10/2026 21:34")).toBe("2026-10-05T19:34:00.000Z");
    expect(lireDateExport("05/01/2026 21:34:10")).toBe("2026-01-05T20:34:10.000Z");
    expect(lireDateExport("2026-10-05 21:34:56")).toBe("2026-10-05T19:34:56.000Z");
    expect(lireDateExport("05/10/2026", "21h34")).toBe("2026-10-05T19:34:00.000Z");
    expect(lireDateExport("2026-10-05T19:34:56Z")).toBe("2026-10-05T19:34:56.000Z");
    expect(lireDateExport("32/10/2026 21:34")).toBeNull();
    expect(lireDateExport("hier soir")).toBeNull();
    // Passage à l'heure d'hiver (25/10/2026, 3 h → 2 h) : 12 h à Paris = 11 h UTC.
    expect(instantDepuisHeureDeParis(2026, 10, 25, 12)).toBe("2026-10-25T11:00:00.000Z");
  });

  it("montants à la française ou non, négatifs, illisibles", () => {
    expect(lireMontantExport("3,50")).toBe(350);
    expect(lireMontantExport("3.5")).toBe(350);
    expect(lireMontantExport("1 234,50 €")).toBe(123_450);
    expect(lireMontantExport("1.234,50")).toBe(123_450);
    expect(lireMontantExport("-2,00")).toBe(-200);
    expect(lireMontantExport("(2,00)")).toBe(-200);
    expect(lireMontantExport("gratuit")).toBeNull();
  });

  it("articles regroupés par vente ; prix ou montant ; TVA ; remboursement ; ligne fautive écartée et signalée", () => {
    const csv = [
      "N° ticket;Date;Bar;Article;Code;Qté;Prix unitaire TTC;Montant TTC;TVA;Paiement;Statut",
      "T-001;05/10/2026 20:15;Bar Nord;Bière 50 cl;BIE50;2;7,00;14,00;20 %;Cashless;",
      "T-001;05/10/2026 20:15;Bar Nord;Frites;;1;3,50;;10;Cashless;",
      "T-002;05/10/2026 20:16;Bar Sud;Bière 50 cl;BIE50;1;;7,00;20;Carte;Annulée",
      "T-003;demain;Bar Sud;Eau;EAU;1;2,00;2,00;5,5;Carte;",
      "T-004;05/10/2026 22:01;Bar Sud;Bière 50 cl;BIE50;-1;7,00;-7,00;20;Carte;",
    ].join("\n");
    const r = lireExportCaisse(csv);
    expect(r.manquants).toEqual([]);
    expect(r.lignesLues).toBe(5);
    expect(r.erreurs).toEqual([{ ligne: 5, message: "Date illisible : « demain »." }]);
    expect(r.ventes.map((v) => v.idExterne)).toEqual(["T-001", "T-002", "T-004"]);
    const [t1, t2, t4] = r.ventes as [(typeof r.ventes)[0], (typeof r.ventes)[0], (typeof r.ventes)[0]];
    expect(t1).toMatchObject({ horodatage: "2026-10-05T18:15:00.000Z", pointDeVente: "Bar Nord", paiement: "Cashless", annulee: false, total: 1_750 });
    expect(t1.lignes).toEqual([
      { cle: "BIE50", libelle: "Bière 50 cl", code: "BIE50", quantite: 2, prixUnitaire: 700, montant: 1_400, tvaPb: 2000 },
      { cle: "Frites", libelle: "Frites", code: null, quantite: 1, prixUnitaire: 350, montant: 350, tvaPb: 1000 },
    ]);
    expect(t2).toMatchObject({ annulee: true, total: 700, lignes: [{ prixUnitaire: 700, montant: 700 }] });
    expect(t4).toMatchObject({ annulee: false, total: -700, lignes: [{ quantite: -1, montant: -700 }] });
  });

  it("colonnes obligatoires manquantes : rien n'est lu ; colonnes données par l'écran : utilisées telles quelles", () => {
    const csv = "Ref;Quand;Quoi;Combien;Prix\nA1;05/10/2026 20:00;Coca;1;3,00";
    const devine = lireExportCaisse(csv);
    expect(devine.manquants).toEqual(["vente", "date", "quantite"]);
    expect(devine.ventes).toEqual([]);
    const choisi = lireExportCaisse(csv, { vente: 0, date: 1, produit: 2, quantite: 3, prixUnitaire: 4 });
    expect(choisi.manquants).toEqual([]);
    expect(choisi.ventes).toEqual([
      { idExterne: "A1", horodatage: "2026-10-05T18:00:00.000Z", pointDeVente: null, paiement: null, annulee: false, total: 300, lignes: [{ cle: "Coca", libelle: "Coca", code: null, quantite: 1, prixUnitaire: 300, montant: 300, tvaPb: null }] },
    ]);
  });
});
