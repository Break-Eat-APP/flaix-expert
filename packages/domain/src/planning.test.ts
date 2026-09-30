import { describe, expect, it } from "vitest";
import { coutPlage, dureeMinutes, formaterDuree, minutesHeure } from "./planning.ts";

describe("planning — module 14 (§14, §15.104)", () => {
  it("exemple chiffré validé : Julie B., 17,40 €/h, prévu 18:00→00:00 (104,40 €), réel 18:00→00:15 (108,75 €)", () => {
    expect(dureeMinutes("18:00", "00:00")).toBe(360);
    expect(coutPlage("18:00", "00:00", 1740)).toBe(10440);
    expect(dureeMinutes("18:00", "00:15")).toBe(375);
    expect(coutPlage("18:00", "00:15", 1740)).toBe(10875);
  });

  it("Karim T., 22,80 €/h, 17:30→00:30 = 159,60 € ; Sophie L., intérimaire 26,00 €/h, 18:00→23:00 = 130,00 € ; total 398,35 €", () => {
    const karim = coutPlage("17:30", "00:30", 2280)!;
    const sophie = coutPlage("18:00", "23:00", 2600)!;
    expect(karim).toBe(15960);
    expect(sophie).toBe(13000);
    expect(10875 + karim + sophie).toBe(39835);
  });

  it("taux manquant : pas de coût, jamais zéro ; heure illisible refusée", () => {
    expect(coutPlage("18:00", "23:00", null)).toBeNull();
    expect(minutesHeure("24:00")).toBeNull();
    expect(minutesHeure("7:30")).toBeNull();
    expect(minutesHeure("07:30")).toBe(450);
    expect(formaterDuree(375)).toBe("6 h 15");
    expect(formaterDuree(360)).toBe("6 h");
  });
});
