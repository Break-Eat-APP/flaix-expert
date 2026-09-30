import { describe, expect, it } from "vitest";
import { PLAN_COMPTES_DEFAUT, ecrituresCsv, ecrituresDuZ, journalDuMois, planComplet, recapitulatifCsv, type ZPourExport } from "./export-comptable.ts";

/** Match type : 44,00 € de bière à 20 % et 11,00 € de sandwichs à 10 % ; 25,00 € en espèces, 30,00 € par carte. */
const z = (x: Partial<ZPourExport> = {}): ZPourExport => ({
  date: "2026-09-12",
  libelle: "Spartiates – Rouen",
  sequence: 3,
  tickets: 9,
  annulations: 1,
  totalTtc: 5500,
  especes: 2500,
  carte: 3000,
  ventilation: [
    { tauxTva: 2000, ht: 3667, tva: 733, ttc: 4400 },
    { tauxTva: 1000, ht: 1000, tva: 100, ttc: 1100 },
  ],
  ecartTiroirs: 0,
  ecartCoffre: 0,
  empreinte: "a".repeat(64),
  ...x,
});
const solde = (lignes: { debit: number; credit: number }[]) => lignes.reduce((s, l) => s + l.debit - l.credit, 0);

describe("écritures d'un Z", () => {
  it("encaissements au débit, ventes HT et TVA par taux au crédit : la pièce est équilibrée", () => {
    const e = ecrituresDuZ(z(), PLAN_COMPTES_DEFAUT);
    expect(e.map((l) => [l.compte, l.debit, l.credit])).toEqual([
      ["530000", 2500, 0],
      ["511500", 3000, 0],
      ["707100", 0, 1000],
      ["445712", 0, 100],
      ["707200", 0, 3667],
      ["445711", 0, 733],
    ]);
    expect(solde(e)).toBe(0);
    expect(new Set(e.map((l) => l.piece))).toEqual(new Set(["Z000003"]));
    expect(e[0]!.libelle).toBe("Ventes en espèces — Spartiates – Rouen");
  });

  it("un manquant de caisse : charge au débit, caisse au crédit ; un excédent : l'inverse", () => {
    const manquant = ecrituresDuZ(z({ ecartTiroirs: -300, ecartCoffre: -200 }), PLAN_COMPTES_DEFAUT);
    expect(manquant.slice(-2).map((l) => [l.compte, l.debit, l.credit])).toEqual([
      ["658000", 500, 0],
      ["530000", 0, 500],
    ]);
    expect(solde(manquant)).toBe(0);
    const excedent = ecrituresDuZ(z({ ecartTiroirs: 150 }), PLAN_COMPTES_DEFAUT);
    expect(excedent.slice(-2).map((l) => [l.compte, l.debit, l.credit])).toEqual([
      ["530000", 150, 0],
      ["758000", 0, 150],
    ]);
  });

  it("aucune ligne à zéro ; un montant négatif passe de l'autre côté, jamais en négatif", () => {
    const e = ecrituresDuZ(z({ totalTtc: -700, especes: -700, carte: 0, ventilation: [{ tauxTva: 2000, ht: -583, tva: -117, ttc: -700 }] }), PLAN_COMPTES_DEFAUT);
    expect(e.map((l) => [l.compte, l.debit, l.credit])).toEqual([
      ["530000", 0, 700],
      ["707200", 583, 0],
      ["445711", 117, 0],
    ]);
    expect(e.every((l) => l.debit >= 0 && l.credit >= 0)).toBe(true);
  });
});

describe("journal du mois et fichiers", () => {
  it("les pièces sont dans l'ordre des matchs ; débit total = crédit total", () => {
    const j = journalDuMois([z({ date: "2026-09-26", sequence: 5 }), z()], PLAN_COMPTES_DEFAUT);
    expect(j.ecritures[0]!.piece).toBe("Z000003");
    expect(j.totalDebit).toBe(11000);
    expect(j.totalCredit).toBe(11000);
    expect(j.desequilibres).toEqual([]);
  });

  it("un Z dont la ventilation ne tombe pas juste est signalé, pas corrigé en silence", () => {
    const j = journalDuMois([z({ carte: 3001 })], PLAN_COMPTES_DEFAUT);
    expect(j.desequilibres).toEqual(["Z000003"]);
  });

  it("CSV des écritures : BOM, point-virgule, date JJ/MM/AAAA, virgule décimale, CRLF", () => {
    const f = ecrituresCsv(journalDuMois([z()], PLAN_COMPTES_DEFAUT));
    expect(f.startsWith("﻿Journal;Date;Pièce;Compte;Libellé;Débit;Crédit\r\n")).toBe(true);
    expect(f).toContain("VT;12/09/2026;Z000003;530000;Ventes en espèces — Spartiates – Rouen;25,00;\r\n");
    expect(f).toContain("VT;12/09/2026;Z000003;707200;Ventes HT TVA 20 % — Spartiates – Rouen;;36,67\r\n");
  });

  it("un libellé qui contient un point-virgule ou un guillemet est protégé", () => {
    const f = ecrituresCsv(journalDuMois([z({ libelle: 'Match "amical"; gala' })], PLAN_COMPTES_DEFAUT));
    expect(f).toContain('"Ventes en espèces — Match ""amical""; gala"');
  });

  it("récapitulatif : une colonne HT et TVA par taux présent, une ligne par match, une ligne de total", () => {
    const f = recapitulatifCsv([z(), z({ date: "2026-09-26", sequence: 5, ecartTiroirs: -300 })]);
    const lignes = f.slice(1).trimEnd().split("\r\n");
    expect(lignes[0]).toBe("Date;Match;Z;Tickets;Annulations;CA TTC;HT 10 %;TVA 10 %;HT 20 %;TVA 20 %;Espèces;Carte;Écart tiroirs;Écart coffre;Empreinte du Z");
    expect(lignes).toHaveLength(4);
    expect(lignes[3]).toBe(";TOTAL;;18;2;110,00;20,00;2,00;73,34;14,66;50,00;60,00;-3,00;0,00;");
  });
});

describe("plan de comptes", () => {
  it("un plan enregistré partiellement est complété par les valeurs par défaut", () => {
    const p = planComplet({ journal: "VE", ventes: { 2000: "707000" } as never });
    expect(p.journal).toBe("VE");
    expect(p.ventes[2000]).toBe("707000");
    expect(p.ventes[550]).toBe("707055");
    expect(p.caisseEspeces).toBe("530000");
    expect(planComplet(null)).toEqual(PLAN_COMPTES_DEFAUT);
  });
});
