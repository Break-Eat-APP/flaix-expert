import { describe, expect, it } from "vitest";
import { dansPeriode, estIdPeriode, estJour, idPeriode, joursPeriode, libellePeriode, periodePrecedente, raccourcisPeriode } from "./periode-bilan.ts";

describe("bilan sur une période", () => {
  it("durée bornes comprises et période précédente de même durée, qui finit la veille", () => {
    expect(joursPeriode({ du: "2026-09-01", au: "2026-09-30" })).toBe(30);
    expect(periodePrecedente({ du: "2026-09-01", au: "2026-09-30" })).toEqual({ du: "2026-08-02", au: "2026-08-31" });
    expect(periodePrecedente({ du: "2026-03-01", au: "2026-03-01" })).toEqual({ du: "2026-02-28", au: "2026-02-28" });
  });

  it("un événement compte pour le jour de Paris de son début : 23 h 30 à Paris le 30 septembre reste en septembre", () => {
    const p = { du: "2026-09-01", au: "2026-09-30" };
    expect(dansPeriode("2026-09-30T21:30:00Z", p)).toBe(true); // 23 h 30 à Paris
    expect(dansPeriode("2026-09-30T22:30:00Z", p)).toBe(false); // 0 h 30 le 1er octobre à Paris
    expect(dansPeriode("2026-08-31T22:30:00Z", p)).toBe(true); // 0 h 30 le 1er septembre à Paris
  });

  it("libellés lisibles", () => {
    expect(libellePeriode({ du: "2026-09-01", au: "2026-09-30" })).toBe("du 1er au 30 septembre 2026");
    expect(libellePeriode({ du: "2026-08-15", au: "2026-10-03" })).toBe("du 15 août au 3 octobre 2026");
    expect(libellePeriode({ du: "2025-12-20", au: "2026-01-04" })).toBe("du 20 décembre 2025 au 4 janvier 2026");
    expect(libellePeriode({ du: "2026-11-14", au: "2026-11-14" })).toBe("le 14 novembre 2026");
  });

  it("[F] une date impossible est refusée ; une période se reconnaît à son identifiant", () => {
    expect(estJour("2026-02-30")).toBe(false);
    expect(estJour("2026-02-28")).toBe(true);
    expect(estJour("28/02/2026")).toBe(false);
    expect(estIdPeriode(idPeriode({ du: "2026-09-01", au: "2026-09-30" }))).toBe(true);
    expect(estIdPeriode("3b1f6c1e-0000-4000-8000-000000000000")).toBe(false);
  });

  it("raccourcis à partir d'aujourd'hui (4 octobre 2026)", () => {
    const r = raccourcisPeriode(new Date("2026-10-04T10:00:00Z"));
    expect(r.map((x) => x.periode)).toEqual([
      { du: "2026-10-01", au: "2026-10-04" },
      { du: "2026-09-01", au: "2026-09-30" },
      { du: "2026-09-05", au: "2026-10-04" },
      { du: "2026-08-01", au: "2026-10-04" },
    ]);
  });
});
