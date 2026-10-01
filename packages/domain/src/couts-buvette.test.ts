import { describe, expect, it } from "vitest";
import { coutsDuStand, fraisDuMois, repartitionCouts, type FraisDate } from "./couts-buvette.ts";

const frais: FraisDate[] = [
  { standId: "bar", poste: "loyer", aPartirDe: "2026-09", montant: 50000 },
  { standId: "bar", poste: "loyer", aPartirDe: "2026-11", montant: 60000 },
  { standId: "bar", poste: "tpe", aPartirDe: "2026-09", montant: 2500 },
  { standId: "cafe", poste: "loyer", aPartirDe: "2026-10", montant: 20000 },
];

describe("frais en vigueur pour un mois", () => {
  it("la ligne la plus récente déjà commencée ; un changement ne réécrit pas les mois passés", () => {
    expect(fraisDuMois(frais, "bar", "2026-10")).toEqual({ loyer: 50000, logiciel: 0, abonnement: 0, tpe: 2500 });
    expect(fraisDuMois(frais, "bar", "2026-11")).toEqual({ loyer: 60000, logiciel: 0, abonnement: 0, tpe: 2500 });
    expect(fraisDuMois(frais, "bar", "2027-03").loyer).toBe(60000);
  });

  it("avant le premier mois saisi, ou sans saisie : 0", () => {
    expect(fraisDuMois(frais, "cafe", "2026-09")).toEqual({ loyer: 0, logiciel: 0, abonnement: 0, tpe: 0 });
    expect(fraisDuMois(frais, "inconnu", "2026-12").loyer).toBe(0);
  });
});

describe("coûts d'un stand et répartition", () => {
  const bar = coutsDuStand({
    standId: "bar",
    nom: "Bar",
    actif: true,
    caHt: 300000,
    frais: { loyer: 50000, logiciel: 3000, abonnement: 0, tpe: 2500 },
    coutMatiere: 90000,
    produitsSansCout: [],
    masseSalariale: 64000,
    affectationsSansTaux: 0,
  });

  it("total = frais + coût matière + masse salariale ; reste = CA HT − total", () => {
    expect(bar.total).toBe(209500);
    expect(bar.reste).toBe(90500);
  });

  it("camembert : matière, masse salariale (personnel hors stand compris), puis chaque poste", () => {
    expect(repartitionCouts([bar], 8000)).toEqual([
      { libelle: "Coût matière", montant: 90000 },
      { libelle: "Masse salariale", montant: 72000 },
      { libelle: "Loyer", montant: 50000 },
      { libelle: "Logiciel", montant: 3000 },
      { libelle: "Abonnement", montant: 0 },
      { libelle: "TPE", montant: 2500 },
    ]);
  });
});
