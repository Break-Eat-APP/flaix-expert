import { describe, expect, it } from "vitest";
import { cascadeSoiree, ecartEvenement, ecartsDeStock, empreinteRapport, especesDuRapport, topProduits, type RapportSoiree } from "./rapport-soiree.ts";
import type { ClotureMatch, ComptageEspeces, ProduitVendu, StockMatch } from "./modele.ts";
import type { StockIngredientsMatch } from "./stock-ingredients.ts";

describe("rapport de soirée : cascade du résultat", () => {
  it("exemple du dossier (12/09) : 18 640 € encaissés − 2 034 € de TVA = 16 606 € HT ; − 3 062 € de matière = 13 544 € ; − 4 013 € de personnel = 9 531 €", () => {
    const c = cascadeSoiree({ encaisseTtc: 1_864_000, tva: 203_400, coutMatiere: 306_200, personnel: 401_300, depenses: 0 });
    expect(c).toMatchObject({ caHt: 1_660_600, margeBrute: 1_354_400, margeNette: 953_100 });
    expect(c.lignes.map((l) => l.sorte)).toEqual(["depart", "retire", "total", "retire", "total", "retire", "retire", "total"]);
    // Avec les dépenses de la soirée du dossier (commission 318 €, frais 89 €, autres 348 €) : 8 776 €.
    expect(cascadeSoiree({ encaisseTtc: 1_864_000, tva: 203_400, coutMatiere: 306_200, personnel: 401_300, depenses: 75_500 }).margeNette).toBe(877_600);
  });

  it("une donnée manquante ne s'estime pas : la suite de la cascade reste vide, avec la raison", () => {
    const sansCout = cascadeSoiree({ encaisseTtc: 10_000, tva: 1_000, coutMatiere: null, personnel: 2_000, depenses: 0 });
    expect(sansCout).toMatchObject({ caHt: 9_000, margeBrute: null, margeNette: null });
    expect(sansCout.lignes[3]!.note).toContain("coût manquant");
    const sansPersonnel = cascadeSoiree({ encaisseTtc: 10_000, tva: 1_000, coutMatiere: 3_000, personnel: null, depenses: 0 });
    expect(sansPersonnel).toMatchObject({ margeBrute: 6_000, margeNette: null });
  });
});

describe("rapport de soirée : comparaison avec l'événement précédent", () => {
  it("écart et pourcentage ; sans événement précédent, pas de comparaison (jamais une baisse de 100 %)", () => {
    expect(ecartEvenement(1_200, 1_000)).toEqual({ actuel: 1_200, precedent: 1_000, ecart: 200, ecartPct: 20 });
    expect(ecartEvenement(900, 1_200)).toMatchObject({ ecart: -300, ecartPct: -25 });
    expect(ecartEvenement(1_200, null)).toEqual({ actuel: 1_200, precedent: null, ecart: null, ecartPct: null });
    expect(ecartEvenement(1_200, 0)).toMatchObject({ ecart: 1_200, ecartPct: null });
  });
});

describe("rapport de soirée : top produits", () => {
  const p = (nom: string, quantite: number, marge: number | null, caTtc = 0): ProduitVendu => ({ produitId: nom, nom, categorie: null, quantite, caTtc, caHt: 0, coutUnitaire: marge === null ? null : 1, marge });
  it("trois par marge (sans les coûts manquants), trois par volume", () => {
    const t = topProduits([p("Bière", 300, 90_000), p("Hot-dog", 120, 40_000), p("Eau", 200, null), p("Café", 50, 5_000), p("Frites", 80, 20_000)]);
    expect(t.parMarge.map((x) => x.nom)).toEqual(["Bière", "Hot-dog", "Frites"]);
    expect(t.parVolume.map((x) => x.nom)).toEqual(["Bière", "Eau", "Hot-dog"]);
  });
});

describe("rapport de soirée : contrôle des espèces", () => {
  const z = (compte: number, ecart: number, le: string, type: ComptageEspeces["type"] = "comptage", motif: string | null = null) =>
    ({ type, compte, ecart, le, motif }) as ComptageEspeces;
  const cloture = {
    seuilEcartEspeces: 500,
    sessions: [
      { caisseNumero: 1, standNom: "Buvette", fond: 15_000, attendu: 65_000, comptage: z(64_000, -1_000, "2026-11-14T22:00:00Z"), rectifications: [z(64_800, -200, "2026-11-14T22:30:00Z", "rectification", "Billet de 10 € retrouvé")] },
      { caisseNumero: 2, standNom: "Bar", fond: null, attendu: null, comptage: null, rectifications: [] },
      { caisseNumero: 3, standNom: "Bar", fond: 10_000, attendu: 30_000, comptage: z(30_150, 150, "2026-11-14T22:05:00Z"), rectifications: [] },
    ],
    coffre: { requis: true, attendu: 40_000, comptage: { compte: 40_000, ecart: 0, le: "2026-11-14T23:00:00Z" }, rectifications: [] },
  } as unknown as ClotureMatch;

  it("un tiroir par caisse qui acceptait les espèces ; la rectification signée fait foi ; le coffre compte dans l'écart total", () => {
    const e = especesDuRapport(cloture);
    expect(e.tiroirs).toEqual([
      { caisse: 1, stand: "Buvette", attendu: 65_000, compte: 64_800, ecart: -200, motif: "Billet de 10 € retrouvé", rectifie: true },
      { caisse: 3, stand: "Bar", attendu: 30_000, compte: 30_150, ecart: 150, motif: null, rectifie: false },
    ]);
    expect(e.coffre).toEqual({ remonte: 40_000, compte: 40_000, ecart: 0, rectifie: false });
    expect(e).toMatchObject({ ecartTotal: -50, seuil: 500 });
  });

  it("sans remontée au coffre, pas de ligne coffre", () => {
    expect(especesDuRapport({ ...cloture, coffre: { requis: false, attendu: 0, comptage: null, rectifications: [] } }).coffre).toBeNull();
  });
});

describe("rapport de soirée : écarts de stock", () => {
  const stock = {
    restes: { requis: true, manquants: 0 },
    stands: [
      {
        nom: "Buvette",
        lignes: [
          { nom: "Bière 25cl", ecart: -3, ecartValeur: -270, comptage: { motif: "Casse" } },
          { nom: "Soda", ecart: 0, ecartValeur: 0, comptage: { motif: null } },
          { nom: "Hot-dog", ecart: null, ecartValeur: null, comptage: null },
        ],
      },
    ],
  } as unknown as StockMatch;
  const ingredients = {
    restes: { requis: true, manquants: 0 },
    stands: [{ nom: "Buvette", lignes: [{ nom: "Bière pression", unite: "l", ecart: -2_500, ecartValeur: -500, comptage: { motif: null } }] }],
  } as unknown as StockIngredientsMatch;

  it("seuls les écarts non nuls ; les ingrédients dans leur unité ; la valeur totale additionne ce qui est valorisé", () => {
    const s = ecartsDeStock(stock, ingredients);
    expect(s.produits).toEqual([{ nom: "Bière 25cl", stand: "Buvette", ecart: -3, valeur: -270, motif: "Casse" }]);
    expect(s.ingredients).toHaveLength(1);
    expect(s.ingredients[0]!.ecart).toMatch(/^−2,5/);
    expect(s).toMatchObject({ valeurTotale: -770, suivi: true });
  });

  it("stock non suivi sur l'événement : section vide, dite comme telle", () => {
    expect(ecartsDeStock(null, null)).toEqual({ produits: [], ingredients: [], valeurTotale: 0, suivi: false });
  });
});

describe("rapport de soirée : document figé", () => {
  const rapport = { evenement: { id: "e1", libelle: "Rouen" }, cascade: [{ libelle: "Encaissé TTC", montant: 100, sorte: "depart", note: undefined }] } as unknown as RapportSoiree;

  it("[F] l'empreinte change dès qu'un chiffre change ; l'ordre des clés relues de la base n'y change rien", () => {
    const a = empreinteRapport("e1", "2026-11-14T23:10:00.000Z", "cloture", rapport);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    const relu = JSON.parse(JSON.stringify({ cascade: rapport.cascade, evenement: rapport.evenement })) as RapportSoiree;
    expect(empreinteRapport("e1", "2026-11-14T23:10:00.000Z", "cloture", relu)).toBe(a);
    const triche = { ...rapport, cascade: [{ libelle: "Encaissé TTC", montant: 90, sorte: "depart" }] } as unknown as RapportSoiree;
    expect(empreinteRapport("e1", "2026-11-14T23:10:00.000Z", "cloture", triche)).not.toBe(a);
  });
});
