import { describe, expect, it } from "vitest";
import { briefDeSoiree, chiffresDe, reformulationFidele, texteNotification } from "./brief.ts";
import { cascadeSoiree, ecartEvenement, type RapportSoiree } from "./rapport-soiree.ts";
import { etatCibleSoiree } from "./finances.ts";

/** Espaces des milliers ramenées à des espaces simples, pour comparer. */
const n = (texte: string) => texte.replace(/[  ]/g, " ");

function rapport(modif: Partial<RapportSoiree> = {}): RapportSoiree {
  const c = cascadeSoiree({ encaisseTtc: 1_864_000, tva: 203_400, coutMatiere: 306_200, personnel: 401_300, depenses: 75_500 });
  return {
    evenement: { id: "rouen", libelle: "Spartiates – Rouen", debut: "2026-11-14T19:00:00Z", closLe: "2026-11-14T23:30:00Z", spectateurs: 4_800 },
    lieu: { nom: "Palais", raisonSociale: null, formation: false },
    ventes: {
      encaisseTtc: 1_864_000,
      caHt: c.caHt,
      tva: 203_400,
      parTaux: [],
      tickets: 2_510,
      panierMoyen: 743,
      caParSpectateur: 388,
      parMode: { especes: 0, carte: 1_864_000 },
      parStand: [],
      parCategorie: [],
      annulations: { nombre: 0, montant: 0 },
      reductions: { remises: 0, offerts: 0, fidelite: 0 },
    },
    cascade: c.lignes,
    margeBrute: c.margeBrute,
    margeNette: c.margeNette,
    personnel: { montant: 401_300, affectations: 32, tauxManquants: 0 },
    depenses: [],
    cibleMargeNette: etatCibleSoiree(c.margeNette, c.caHt, 5_000),
    produitsSansCout: [],
    especes: { tiroirs: [{ caisse: 3, stand: "Bar", attendu: 50_000, compte: 48_760, ecart: -1_240, motif: null, rectifie: false }], coffre: null, ecartTotal: -1_240, seuil: 500 },
    stock: { produits: [], ingredients: [], valeurTotale: -2_040, suivi: true },
    comparaison: {
      evenement: { libelle: "Grenoble", debut: "2026-11-07T19:00:00Z" },
      encaisseTtc: ecartEvenement(1_864_000, 2_026_000),
      tickets: ecartEvenement(2_510, 2_690),
      panierMoyen: ecartEvenement(743, 753),
      spectateurs: ecartEvenement(4_800, 5_100),
      margeBrute: ecartEvenement(c.margeBrute, 1_500_000),
      margeNette: ecartEvenement(c.margeNette, 870_000),
    },
    top: { parMarge: [{ produitId: "h", nom: "Hot-dog", categorie: null, quantite: 264, caTtc: 0, caHt: 0, coutUnitaire: 100, marge: 124_678 }], parVolume: [] },
    alertes: [],
    z: null,
    ...modif,
  };
}

describe("brief de fin de soirée", () => {
  it("exemple du dossier : cible tenue, encaissé en baisse, écart d'espèces, écart de stock — au plus quatre points, dans l'ordre", () => {
    const b = briefDeSoiree(rapport());
    expect(n(b.titre)).toBe("Spartiates – Rouen : 18 640,00 € encaissés");
    expect(n(b.resume)).toBe("2 510 tickets · panier moyen 7,43 € · marge nette 8 776,00 €.");
    expect(b.points.map((p) => p.niveau)).toEqual(["bon", "attention", "attention", "attention"]);
    expect(b.points[0]!.texte).toContain("Cible de marge nette tenue (50 %)");
    expect(b.points[1]!.texte).toContain("−8,0 % par rapport à « Grenoble »");
    expect(b.points[2]!.texte).toContain("Caisse 3 : écart d'espèces");
    expect(b.points[3]!.texte).toContain("Écarts de stock");
    expect(b.lien).toBe("/rapport-soiree/rouen");
  });

  it("[F] marge incalculable : dite comme telle, jamais un chiffre à la place", () => {
    const c = cascadeSoiree({ encaisseTtc: 10_000, tva: 1_000, coutMatiere: null, personnel: 0, depenses: 0 });
    const b = briefDeSoiree(rapport({ cascade: c.lignes, margeBrute: null, margeNette: null, cibleMargeNette: null }));
    expect(b.points[0]).toEqual({ niveau: "attention", texte: "Marge non calculable : coût d'achat manquant sur un produit." });
    expect(b.resume).not.toContain("marge nette");
  });

  it("premier événement, rien d'anormal : l'évolution n'est pas inventée, le meilleur produit apparaît", () => {
    const sansPrecedent = { ...rapport().comparaison, evenement: null, encaisseTtc: ecartEvenement(1_864_000, null) };
    const b = briefDeSoiree(
      rapport({ comparaison: sansPrecedent, cibleMargeNette: null, especes: { tiroirs: [], coffre: null, ecartTotal: 0, seuil: 500 }, stock: { produits: [], ingredients: [], valeurTotale: 0, suivi: false } }),
    );
    expect(b.points).toEqual([{ niveau: "info", texte: expect.stringContaining("Meilleure marge : Hot-dog") }]);
  });

  it("la notification reprend le titre, la ligne de résumé et les deux premiers points", () => {
    const notif = texteNotification(briefDeSoiree(rapport()));
    expect(n(notif.titre)).toContain("18 640,00 €");
    expect(notif.corps.split("\n")).toHaveLength(3);
  });
});

describe("garde-fou des reformulations par l'IA", () => {
  it("les nombres se lisent quel que soit l'espace des milliers", () => {
    expect(chiffresDe("18 640,00 € et −8,0 % pour 2 510 tickets")).toEqual(["18640,00", "8,0", "2510"]);
  });

  it("[F] une reformulation qui ajoute ou change un chiffre est refusée ; une reformulation fidèle est acceptée", () => {
    const b = briefDeSoiree(rapport());
    const fidele = `Belle soirée face à Grenoble : ${b.titre.split(": ")[1]}, cible tenue.`;
    expect(reformulationFidele(b, fidele)).toBe(true);
    expect(reformulationFidele(b, "Soirée record : 25 000,00 € encaissés.")).toBe(false);
    expect(reformulationFidele(b, "Encaissé en hausse de 12 %.")).toBe(false);
  });
});
