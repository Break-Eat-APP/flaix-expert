import { describe, expect, it } from "vitest";
import { bornesMois, exerciceDe, libelleMois, moisDeLExercice, moisParis, moisTermine } from "./cloture-periode.ts";

describe("clôtures de période (§15.107)", () => {
  it("le mois d'un événement se lit à l'heure de Paris", () => {
    // 31 août 2026, 23 h 30 à Paris = 21 h 30 UTC : c'est encore août.
    expect(moisParis("2026-08-31T21:30:00Z")).toBe("2026-08");
    // 31 août 2026, 22 h 30 UTC = 1er septembre 0 h 30 à Paris.
    expect(moisParis("2026-08-31T22:30:00Z")).toBe("2026-09");
  });

  it("bornes et nom d'un mois, années bissextiles comprises", () => {
    expect(bornesMois("2026-09")).toEqual({ debut: "2026-09-01", fin: "2026-09-30" });
    expect(bornesMois("2028-02").fin).toBe("2028-02-29");
    expect(libelleMois("2026-08")).toBe("Août 2026");
  });

  it("un mois n'est terminé qu'à partir du mois suivant, à Paris", () => {
    expect(moisTermine("2026-09", new Date("2026-09-30T21:59:00Z"))).toBe(false);
    expect(moisTermine("2026-09", new Date("2026-09-30T22:01:00Z"))).toBe(true);
  });

  it("exercice civil par défaut ; exercice de juillet à juin", () => {
    expect(exerciceDe("2026-09", 1)).toMatchObject({ debut: "2026-01-01", fin: "2026-12-31", libelle: "Exercice 2026" });
    expect(exerciceDe("2026-09", 7)).toMatchObject({ debut: "2026-07-01", fin: "2027-06-30", libelle: "Exercice 2026-2027" });
    expect(exerciceDe("2027-03", 7).premierMois).toBe("2026-07");
    expect(moisDeLExercice("2026-07")).toHaveLength(12);
    expect(moisDeLExercice("2026-07").at(-1)).toBe("2027-06");
  });
});
