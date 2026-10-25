import { describe, expect, it } from "vitest";
import { csvRecapFactures, ecartLigne, nomDeFichier, rapprocherFacture, statutRapprochement, totalHtFacture, type LivraisonCandidate } from "./factures.ts";

const liv = (x: Partial<LivraisonCandidate>): LivraisonCandidate => ({ id: "l1", produitId: "biere", fournisseur: "Brasserie du Sud", date: "2026-09-10", quantite: 240, prixUnitaire: 125, ...x });

describe("écarts : les trois cas vérifiés du dossier (module 12b)", () => {
  it("Brasserie du Sud : 240 bières à 1,25 € comme livrées → rapprochée, écart nul", () => {
    expect(ecartLigne({ produitId: "biere", quantite: 240, prixUnitaire: 125 }, liv({}))).toEqual({ ecartQuantite: 0, impactPrix: 0, seuil: 300, rapprochee: true });
  });

  it("Boucherie : 500 saucisses à 0,99 € contre 0,95 € → 20 € d'impact, au-dessus du seuil de 4,75 € → en écart", () => {
    const e = ecartLigne({ produitId: "saucisse", quantite: 500, prixUnitaire: 99 }, { quantite: 500, prixUnitaire: 95 });
    expect(e).toEqual({ ecartQuantite: 0, impactPrix: 2000, seuil: 475, rapprochee: false });
  });

  it("le seuil porte sur l'impact en euros, pas sur l'écart unitaire (défaut corrigé au dossier)", () => {
    // 0,04 € d'écart unitaire est sous 0,50 €, mais pas 20 € sur 500 unités.
    expect(ecartLigne({ produitId: "s", quantite: 500, prixUnitaire: 99 }, { quantite: 500, prixUnitaire: 95 }).rapprochee).toBe(false);
    // Petit écart sur une petite livraison : sous le plancher de 0,50 € → rapprochée.
    expect(ecartLigne({ produitId: "s", quantite: 10, prixUnitaire: 102 }, { quantite: 10, prixUnitaire: 98 }).rapprochee).toBe(true);
  });

  it("Frigo Nord : 76 kg facturés contre 80 livrés → en écart, même à prix identique", () => {
    expect(ecartLigne({ produitId: "frites", quantite: 76, prixUnitaire: 200 }, { quantite: 80, prixUnitaire: 200 })).toMatchObject({ ecartQuantite: -4, rapprochee: false });
  });
});

describe("rapprochement automatique", () => {
  const livraisons = [
    liv({ id: "a", date: "2026-09-02", quantite: 120 }),
    liv({ id: "b", date: "2026-09-09", quantite: 240 }),
    liv({ id: "c", date: "2026-07-01", quantite: 240 }),
    liv({ id: "d", fournisseur: "Autre grossiste", quantite: 240 }),
    liv({ id: "e", produitId: "eau", quantite: 240 }),
  ];

  it("même produit et même fournisseur (casse et accents ignorés), dans la fenêtre de dates ; même quantité d'abord", () => {
    const r = rapprocherFacture([{ produitId: "biere", quantite: 240, prixUnitaire: 125 }], "BRASSERIE DU SUD", "2026-09-12", livraisons);
    expect(r.map((x) => x?.id)).toEqual(["b"]);
  });

  it("une livraison ne sert qu'une fois ; une ligne sans livraison possible reste non rapprochée", () => {
    const r = rapprocherFacture(
      [
        { produitId: "biere", quantite: 240, prixUnitaire: 125 },
        { produitId: "biere", quantite: 240, prixUnitaire: 125 },
        { produitId: "biere", quantite: 240, prixUnitaire: 125 },
        { produitId: "frites", quantite: 10, prixUnitaire: 200 },
        { produitId: null, quantite: 1, prixUnitaire: 1500 },
      ],
      "Brasserie du Sud",
      "2026-09-12",
      livraisons,
    );
    expect(r.map((x) => x?.id ?? null)).toEqual(["b", "a", null, null, null]);
  });

  it("le choix du directeur l'emporte et réserve la livraison", () => {
    const r = rapprocherFacture(
      [
        { produitId: "biere", quantite: 240, prixUnitaire: 125 },
        { produitId: "biere", quantite: 240, prixUnitaire: 125 },
      ],
      "Brasserie du Sud",
      "2026-09-12",
      livraisons,
      [null, "b"],
    );
    expect(r.map((x) => x?.id)).toEqual(["a", "b"]);
  });

  it("une livraison déjà rattachée à une autre facture n'est pas reprise", () => {
    const r = rapprocherFacture([{ produitId: "biere", quantite: 240, prixUnitaire: 125 }], "Brasserie du Sud", "2026-09-12", livraisons, [], new Set(["b"]));
    expect(r[0]?.id).toBe("a");
  });
});

describe("statut et total", () => {
  const ok = { ecartQuantite: 0, impactPrix: 0, seuil: 50, rapprochee: true };
  const ko = { ...ok, rapprochee: false };
  it("rapprochée seulement si chaque ligne produit l'est ; un écart l'emporte ; frais divers ignorés", () => {
    expect(statutRapprochement([{ produitId: "a", ecart: ok }, { produitId: null, ecart: null }])).toBe("rapprochee");
    expect(statutRapprochement([{ produitId: "a", ecart: ok }, { produitId: "b", ecart: null }])).toBe("recue");
    expect(statutRapprochement([{ produitId: "a", ecart: ko }, { produitId: "b", ecart: null }])).toBe("ecart");
    expect(statutRapprochement([])).toBe("rapprochee");
  });
  it("total HT = Σ quantité × prix unitaire", () => {
    expect(totalHtFacture([{ quantite: 240, prixUnitaire: 125 }, { quantite: 1, prixUnitaire: 1500 }])).toBe(31500);
  });
});

describe("récapitulatif pour le comptable (§15.172, audit §15.175)", () => {
  const ligne = { type: "Achat" as const, date: "2026-10-20", numero: "F-1", tiers: "Metro", ht: 123_456, tva: null, ttc: null, statut: "Payée", payeeLe: "2026-10-22", piece: "achats/x.pdf" };
  const lignesDe = (csv: string) => csv.slice(1).trim().split("\r\n");

  it("Excel français : « ; », virgule décimale, dates jj/mm/aaaa, BOM ; champ avec « ; » entre guillemets", () => {
    const csv = csvRecapFactures([ligne, { ...ligne, type: "Vente", tiers: "Durand; fils", ht: 5_000, tva: 1_000, ttc: 6_000, piece: null }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const l = lignesDe(csv);
    expect(l[1]).toBe("Achat;20/10/2026;F-1;Metro;1234,56;;;Payée;22/10/2026;achats/x.pdf");
    expect(l[2]).toBe('Vente;20/10/2026;F-1;"Durand; fils";50,00;10,00;60,00;Payée;22/10/2026;aucune pièce jointe');
  });

  it("[F] un fournisseur ou un n° qui commence par = + - @ n'est jamais une formule pour Excel", () => {
    const l = lignesDe(csvRecapFactures([{ ...ligne, tiers: '=HYPERLINK("http://x")', numero: "+33" }]))[1]!;
    expect(l).toContain(";'+33;");
    expect(l).toContain(`"'=HYPERLINK(""http://x"")"`);
  });

  it("nom de fichier sans caractère interdit", () => {
    expect(nomDeFichier('Metro: F/12 "x" ?')).toBe("Metro- F-12 -x- -");
  });
});
