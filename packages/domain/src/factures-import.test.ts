import { describe, expect, it } from "vitest";
import { alertesFacture, cleArticle, colisDevine, enUnites, lireFactureExport, proposerPourArticle } from "./factures-import.ts";

describe("factures automatisées (§15.173)", () => {
  it("export Excel d'un grossiste : titre au-dessus, PCB, prix déduit du montant, total ignoré, ligne au poids écartée", () => {
    const csv = [
      "Facture n° F-2026-118 ;;;;;",
      "Réf.;Désignation;PCB;Qté;P.U. HT;Montant HT",
      "COC33;Coca-Cola 33 cl x24;24;5;14,40;72,00",
      "EVI50;Evian 50 cl;;10;;4,50",
      "FRO;Frites surgelées (kg);;12,5;2,10;26,25",
      ";Total HT;;;;102,75",
    ].join("\n");
    const l = lireFactureExport(csv);
    expect(l.manquants).toEqual([]);
    expect(l.lignes).toEqual([
      { codeArticle: "COC33", libelle: "Coca-Cola 33 cl x24", quantite: 5, prixUnitaire: 1_440, unitesParColis: 24 },
      { codeArticle: "EVI50", libelle: "Evian 50 cl", quantite: 10, prixUnitaire: 45, unitesParColis: null },
    ]);
    expect(l.erreurs).toHaveLength(1);
    expect(l.erreurs[0]!.message).toContain("non entière");
  });

  it("en-têtes avec ponctuation (« P.U. HT », « Qté. ») sans colonne de montant", () => {
    const l = lireFactureExport("Réf.;Désignation;Qté.;P.U. HT\nEV;Evian 50 cl;10;0,45");
    expect(l.manquants).toEqual([]);
    expect(l.lignes[0]).toMatchObject({ codeArticle: "EV", quantite: 10, prixUnitaire: 45 });
  });

  it("[F] colonnes introuvables : dites, rien n'est lu", () => {
    expect(lireFactureExport("A;B\n1;2").manquants).toEqual(["désignation", "quantité", "prix unitaire ou montant"]);
  });

  it("colis devinés dans un libellé ; clé d'article ; conversion à l'unité", () => {
    expect(["Coca 33cl x24", "24x33cl Heineken", "Pack de 6 Evian", "Carton 12 btl vin", "Bière 50 cl", "Fût 30 L"].map(colisDevine)).toEqual([24, 24, 6, 12, null, null]);
    expect(cleArticle("COC-33", "x")).toBe("code:coc 33");
    expect(cleArticle(null, "Coca-Cola 33 cl")).toBe("lib:coca cola 33 cl");
    expect(enUnites({ quantite: 5, prixUnitaire: 1_440, unitesParColis: 24 })).toEqual({ quantite: 120, prixUnitaire: 60 });
  });

  it("alertes : total, colis oublié, prix et quantité inhabituels ; rien quand tout est normal", () => {
    const historique = (id: string) => (id === "coca" ? [{ quantite: 96, prixUnitaire: 58 }, { quantite: 120, prixUnitaire: 57 }] : []);
    const ok = { id: "l1", produitId: "coca", libelle: "Coca 33 cl x24", quantite: 5, prixUnitaire: 1_440, unitesParColis: 24 };
    expect(alertesFacture({ totalAnnonce: 7_200, lignes: [ok] }, historique)).toEqual([]);
    const a = alertesFacture({ totalAnnonce: 9_000, lignes: [{ ...ok, unitesParColis: 1 }, { ...ok, id: "l2", quantite: 20 }] }, historique);
    expect(a.map((x) => [x.type, x.ligneId ?? null])).toEqual([
      ["total", null],
      ["colis", "l1"],
      ["prix", "l1"], // 14,40 € l'unité au lieu de 0,58 €
      ["quantite", "l2"], // 480 unités contre 108 d'habitude
    ]);
  });

  it("proposition pour un article : ressemblance, sinon tous les mots du nom dans le libellé ; [F] rien d'approchant : null", () => {
    const c = [
      { id: "f", nom: "Frites" },
      { id: "s", nom: "Steak haché VBF" },
      { id: "b", nom: "Bière" },
    ];
    expect(proposerPourArticle("Frites 9/9 bi-température", c)?.id).toBe("f");
    expect(proposerPourArticle("Steak haché VBF bou. 8x150g (4,8 kg)", c)?.id).toBe("s");
    expect(proposerPourArticle("Sac poubelle noir 20x130L x5", c)).toBeNull();
  });

  it("total HT du fichier lu (le dernier, après les sous-totaux) ; absent : null ; colonne « Col/Pack » reconnue (BUG-2026-012, BUG-2026-019)", () => {
    const avecTotal = [
      "Désignation;Qté;Col/Pack;Prix unitaire HT;Montant HT",
      "Coca 33 cl x24;2;24;14,40;28,80",
      "Eau 50 cl;10;;0,45;4,50",
      "Sous-total HT;;;;33,30",
      "Total HT;;;;33,30",
      "TVA 5,5 %;;;;1,83",
      "Total TTC;;;;35,13",
    ].join("\n");
    const lu = lireFactureExport(avecTotal);
    expect(lu.totalHt).toBe(3_330);
    expect(lu.lignes.map((l) => [l.libelle, l.quantite, l.unitesParColis])).toEqual([
      ["Coca 33 cl x24", 2, 24],
      ["Eau 50 cl", 10, null],
    ]);
    // [F] Un total TTC n'est jamais pris pour le total HT.
    expect(lireFactureExport(avecTotal.replace("Total HT;;;;33,30\n", "").replace("Sous-total HT;;;;33,30\n", "")).totalHt).toBeNull();
  });
});
