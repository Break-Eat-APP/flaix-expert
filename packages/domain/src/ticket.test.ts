import { describe, expect, it } from "vitest";
import { AUCUN_AJUSTEMENT, calculerTicket, erreurAjustement, numeroJustificatif, repartirProrata, type LigneTarifee } from "./ticket.ts";

const hotDog = (q: number): LigneTarifee => ({ produitId: "hd", libelle: "Hot dog", quantite: q, prixUnitaire: 700, tauxTva: 1000 });
const biere = (q: number): LigneTarifee => ({ produitId: "bi", libelle: "Bière 50cl", quantite: q, prixUnitaire: 700, tauxTva: 2000 });
const soda = (q: number): LigneTarifee => ({ produitId: "so", libelle: "Soda", quantite: q, prixUnitaire: 400, tauxTva: 550 });

describe("calculerTicket", () => {
  it("sans ajustement : total = somme des lignes, TVA ventilée par taux", () => {
    const t = calculerTicket([hotDog(2), biere(1), soda(1)]);
    expect(t.total).toBe(2500);
    expect(t.ventilation).toEqual([
      { tauxTva: 550, ht: 379, tva: 21, ttc: 400 },
      { tauxTva: 1000, ht: 1273, tva: 127, ttc: 1400 },
      { tauxTva: 2000, ht: 583, tva: 117, ttc: 700 },
    ]);
  });

  it("exemple du dossier (§15.26) : 2 hot-dogs à 6,00 € + 1 soda à 3,50 €, remise abonné 10 % → 13,95 €", () => {
    const t = calculerTicket(
      [
        { ...hotDog(2), prixUnitaire: 600 },
        { ...soda(1), prixUnitaire: 350 },
      ],
      { ...AUCUN_AJUSTEMENT, remisePb: 1000, motif: "abonne", reference: "AB-1" },
    );
    expect(t.brut).toBe(1550);
    expect(t.total).toBe(1395);
  });

  it("remise abonné 15 % sur 7,00 € → 5,95 € (vérifié dans le prototype, §15.39)", () => {
    expect(calculerTicket([hotDog(1)], { ...AUCUN_AJUSTEMENT, remisePb: 1500, motif: "abonne", reference: "AB" }).total).toBe(595);
  });

  it("l'offert est réparti au prorata, la somme reste exacte au centime", () => {
    const t = calculerTicket([hotDog(1), biere(1), soda(1)], { ...AUCUN_AJUSTEMENT, offert: 100, motif: "geste" });
    expect(t.offert).toBe(100);
    expect(t.total).toBe(1700);
    expect(t.lignes.reduce((s, l) => s + l.offert, 0)).toBe(100);
    expect(t.ventilation.reduce((s, v) => s + v.ttc, 0)).toBe(1700);
  });

  it("un offert supérieur au montant est plafonné : le total ne descend jamais sous 0", () => {
    const t = calculerTicket([soda(1)], { ...AUCUN_AJUSTEMENT, offert: 5000, motif: "staff" });
    expect(t.offert).toBe(400);
    expect(t.total).toBe(0);
  });

  it("remise ET offert se cumulent et restent tous deux visibles", () => {
    const t = calculerTicket([hotDog(2)], { ...AUCUN_AJUSTEMENT, remisePb: 1000, offert: 60, motif: "client" });
    expect(t.remise).toBe(140);
    expect(t.offert).toBe(60);
    expect(t.total).toBe(1200);
  });

  it("HT + TVA = TTC pour chaque taux, quel que soit l'ajustement", () => {
    for (const remisePb of [0, 500, 1500, 5000]) {
      for (const offert of [0, 1, 37, 333]) {
        const t = calculerTicket([hotDog(3), biere(2), soda(5)], { ...AUCUN_AJUSTEMENT, remisePb, offert, motif: "autre", motifTexte: "x" });
        for (const v of t.ventilation) expect(v.ht + v.tva).toBe(v.ttc);
        expect(t.total).toBe(t.brut - t.remise - t.offert);
      }
    }
  });
});

describe("repartirProrata", () => {
  it("répartit exactement, sans centime perdu ni créé", () => {
    expect(repartirProrata(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(repartirProrata(0, [5, 5])).toEqual([0, 0]);
    expect(repartirProrata(10, [0, 0])).toEqual([0, 0]);
  });
});

describe("erreurAjustement", () => {
  it("aucun ajustement : rien à justifier", () => {
    expect(erreurAjustement(AUCUN_AJUSTEMENT, 1500)).toBeNull();
  });
  it("remise sans motif : refusée", () => {
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 1000 }, null)).toContain("Motif obligatoire");
  });
  it("abonné : n° obligatoire, et au taux du lieu seulement", () => {
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 1500, motif: "abonne" }, 1500)).toContain("abonné");
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 1500, motif: "abonne", reference: "AB-20482" }, 1500)).toBeNull();
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 5000, motif: "abonne", reference: "AB" }, 1500)).toContain("taux du lieu");
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 1500, motif: "abonne", reference: "AB" }, null)).toContain("pas réglé");
  });
  it("« Autre » exige un texte ; un palier hors liste est refusé", () => {
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, offert: 100, motif: "autre" }, null)).toContain("Précise");
    expect(erreurAjustement({ ...AUCUN_AJUSTEMENT, remisePb: 3300, motif: "geste" }, null)).toContain("non autorisé");
  });
});

describe("numeroJustificatif", () => {
  it("format 2026-C3-000125 (§15.12)", () => {
    expect(numeroJustificatif(2026, 3, 125)).toBe("2026-C3-000125");
  });
});
