import { describe, expect, it } from "vitest";
import { lignesDuPdf, lireFacturePdf, montantPdf, type TextePdf } from "./factures-pdf.ts";

/** Une ligne de texte du PDF : morceaux posés aux abscisses données, à la hauteur y. */
const ligne = (page: number, y: number, ...morceaux: [number, string][]): TextePdf[] => morceaux.map(([x, texte]) => ({ page, x, y, texte }));

// Facture fictive, mise en page Relais d'Or (positions relevées sur une vraie facture).
const RELAIS: TextePdf[] = [
  ...ligne(1, 821, [239, "Relais d'Or Provence"]),
  ...ligne(1, 709, [16, "FACTURE"], [98, "N°420000001"]),
  ...ligne(1, 693, [16, "Date:08/10/26"]),
  ...ligne(1, 567, [15, "Référence"], [78, "Désignation"], [301, "Quantité"], [444, "Prix Net"], [483, "T.Px"], [515, "Montant"], [558, "TVA"]),
  ...ligne(1, 544, [15, "08/10/2026 COMMANDE N° 5000001 06/10/2026"]),
  ...ligne(1, 498, [16, "939504"], [59, "S Box hotdog maxi porc 32x160g"], [298, "18,000"], [332, "CRT"], [454, "54,15"], [521, "974,70"], [573, "1"]),
  ...ligne(1, 486, [16, "970554"], [59, "S Frites 9/9 bi-température"], [298, "60,000"], [332, "KG"], [458, "1,49"], [526, "89,40"], [573, "1"]),
  // Au poids : 4,800 kg.
  ...ligne(1, 474, [16, "939338"], [59, "F Steak haché VBF bou. 8x150g"], [302, "4,800"], [332, "KG"], [454, "15,40"], [526, "73,92"], [573, "1"]),
  ...ligne(1, 462, [16, "946200"], [59, "Serviette papier blc 30x30cm x500"], [302, "9,000"], [332, "SHT"], [458, "3,74"], [526, "33,66"], [573, "2"]),
  ...ligne(1, 450, [100, "TOTAL H.T"], [521, "1171,68"]),
  ...ligne(2, 120, [470, "TOTAL H.T"], [560, "1.171,68"], [600, "EUR"]),
];

// Facture fictive, mise en page Montaner Pietrini – CDB : fût, produits offerts, consigne, vide rendu, frais de gestion.
const CDB: TextePdf[] = [
  ...ligne(1, 479, [12, "N° Accises:"], [73, "FR"], [89, "011615E0085"]),
  ...ligne(1, 463, [13, "FACTURE/AVOIR"], [89, "N°"], [104, "6100000001"]),
  ...ligne(1, 451, [39, "01/10/26"], [112, "Client:"]),
  ...ligne(1, 374, [47, "cas/fut"], [67, "Col/Pack"], [701, "TAUX"], [728, "MONTANT"]),
  ...ligne(1, 361, [10, "200306"], [52, "13"], [73, "390"], [91, "FUT"], [112, "FADA"], [139, "BLONDE"], [177, "30"], [193, "L"], [297, "100"], [370, "4.839"], [463, "2"], [495, "4.026"], [530, "0.227"], [569, "1658.67"], [694, "30.00"], [732, "390.00"]),
  ...ligne(1, 338, [10, "253313"], [57, "8"], [73, "160"], [91, "FUT"], [112, "FADA"], [139, "RADLER/CHILL"], [209, "20L"], [297, "100"], [575, "732.80"]),
  ...ligne(1, 326, [91, "CHILL"], [123, "LEMON"]),
  ...ligne(1, 317, [52, "-2"], [73, "-40"], [91, "GRATUITE"], [139, "FOURNISSEUR"], [463, "2"], [569, "-178.76"]),
  ...ligne(1, 295, [10, "181013"], [57, "2"], [78, "24"], [91, "FADA"], [118, "BLANCHE"], [161, "12X33CL"], [302, "33"], [580, "47.47"]),
  ...ligne(1, 236, [10, "1259"], [57, "2"], [78, "12"], [91, "MAXI"], [118, "EAU"], [302, "150"], [585, "6.62"]),
  ...ligne(1, 224, [52, "-2"], [73, "-12"], [91, "GRATUITE"], [139, "FOURNISSEUR"], [580, "-6.62"]),
  ...ligne(1, 214, [10, "130255"], [78, "3"], [91, "PET"], [112, "TAIGA"], [139, "GRENADINE"], [585, "11.37"]),
  ...ligne(1, 200, [14, "-- REPRISE"], [73, "DE"], [89, "VIDE"], [116, "------"]),
  ...ligne(1, 190, [10, "503000"], [52, "25"], [78, "25"], [91, "VIDE"], [118, "- FUT"], [297, "100"], [694, "30.00"], [728, "-750.00"]),
  ...ligne(1, 180, [91, "EMBALLAGE"]),
  ...ligne(1, 172, [22, "(1"], [37, "PNR) Pour info"]),
  ...ligne(1, 171, [73, "F G : 5.95"], [137, "Euros"]),
  ...ligne(1, 47, [168, "TOTAL"], [416, "NET"]),
  ...ligne(1, 44, [224, "2277.50"], [292, "175.50"], [473, "2000.00"]),
  // Conditions générales au verso : ignorées.
  ...ligne(2, 500, [10, "CONDITIONS GENERALES DE VENTE"]),
];

describe("factures PDF fabriquées par un logiciel (§15.178)", () => {
  it("montants des deux écritures ; lignes regroupées par hauteur, de gauche à droite", () => {
    expect([montantPdf("4.511,74"), montantPdf("1658.67"), montantPdf(".90"), montantPdf("-178.76"), montantPdf("CRT")]).toEqual([451_174, 165_867, 90, -17_876, null]);
    const l = lignesDuPdf([
      { page: 1, x: 50, y: 100, texte: "b" },
      { page: 1, x: 10, y: 101, texte: "a" },
      { page: 1, x: 10, y: 200, texte: "haut" },
    ]);
    expect(l.map((x) => x.texte)).toEqual(["haut", "a b"]);
  });

  it("Relais d'Or : fournisseur, n°, date, lignes, total ; poids compté en lot ; les lignes retombent sur le total HT", () => {
    const f = lireFacturePdf(RELAIS)!;
    expect(f).toMatchObject({ modele: "relais-d-or", fournisseur: "Relais d'Or Provence", numero: "420000001", date: "2026-10-08", totalHt: 117_168 });
    expect(f.lignes.map((l) => [l.codeArticle, l.libelle, l.quantite, l.prixUnitaire])).toEqual([
      ["939504", "Box hotdog maxi porc 32x160g", 18, 5_415],
      ["970554", "Frites 9/9 bi-température", 60, 149],
      ["939338", "Steak haché VBF bou. 8x150g (4,8 kg)", 1, 7_392],
      ["946200", "Serviette papier blc 30x30cm x500", 9, 374],
    ]);
    expect(f.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)).toBe(117_168);
    expect(f.remarques).toEqual([expect.stringContaining("au poids")]);
  });

  it("Montaner Pietrini (CDB) : colis, produits offerts déduits, suite de désignation, consignes écartées, frais de gestion, arrondis ; total exact", () => {
    const f = lireFacturePdf(CDB)!;
    expect(f).toMatchObject({ modele: "cdb", fournisseur: "Montaner Pietrini (CDB)", numero: "6100000001", date: "2026-10-01", totalHt: 227_750 });
    expect(f.lignes.map((l) => [l.codeArticle, l.libelle, l.quantite, l.prixUnitaire, l.unitesParColis])).toEqual([
      ["200306", "FUT FADA BLONDE 30 L", 13, 12_759, 30],
      // 8 fûts livrés, 2 offerts : 732,80 − 178,76 = 554,04 €.
      ["253313", "FUT FADA RADLER/CHILL 20L CHILL LEMON", 8, 6_925, 20],
      ["181013", "FADA BLANCHE 12X33CL", 2, 2_373, 12],
      // Entièrement offert : livré, à 0 €.
      ["1259", "MAXI EAU", 2, 0, 6],
      ["130255", "PET TAIGA GRENADINE", 3, 379, null],
      [null, "Frais de gestion", 1, 595, null],
      [null, "Arrondis des prix unitaires (facture PDF)", 1, 5, null],
    ]);
    expect(f.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0)).toBe(227_750);
    expect(f.remarques.join(" ")).toMatch(/offerts.*Consignes.*arrondis/s);
  });

  it("[F] une ligne illisible ou absente : la lecture le signale au lieu de se taire", () => {
    const sansFrites = RELAIS.filter((m) => m.y !== 486 || m.page !== 1);
    const f = lireFacturePdf(sansFrites)!;
    expect(f.lignes).toHaveLength(3);
    expect(f.remarques[0]).toMatch(/^Attention : les lignes lues font 1082,28 € HT, la facture annonce 1171,68 €/);
  });

  it("[F] total introuvable : contrôle impossible, dit ; à défaut de « EUR », le dernier « TOTAL H.T » fait foi", () => {
    const sansTotal = RELAIS.filter((m) => !m.texte.startsWith("TOTAL") && !/^1\.?171,68$/.test(m.texte) && m.texte !== "EUR");
    expect(lireFacturePdf(sansTotal)!.remarques[0]).toMatch(/total HT introuvable/);
    const sansEur = RELAIS.filter((m) => m.texte !== "EUR");
    expect(lireFacturePdf(sansEur)!.totalHt).toBe(117_168);
  });

  it("[F] mise en page inconnue ou PDF scanné (sans texte) : pas de lecture devinée", () => {
    expect(lireFacturePdf([])).toBeNull();
    expect(lireFacturePdf(ligne(1, 700, [10, "FACTURE n° 12"], [200, "Total 10,00"]))).toBeNull();
  });
});
