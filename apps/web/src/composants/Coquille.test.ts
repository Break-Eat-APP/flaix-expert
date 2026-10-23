/** Menu et options du lieu (dossier §15.118) — test des écrans demandé par l'audit Codex (P2-004). */
import { describe, expect, it } from "vitest";
import { OPTIONS_PAR_DEFAUT } from "@flaix/domain";
import { menuDuLieu } from "./Coquille.tsx";

describe("menu selon les options activées par FlaiX Expert", () => {
  it("toutes les options actives : les huit entrées", () => {
    expect(menuDuLieu(OPTIONS_PAR_DEFAUT).map((e) => e.libelle)).toEqual(["Résultats", "En direct", "Caisses", "Événements privés", "Stock", "Ingrédients", "Hygiène", "Équipe", "Clôtures", "Fidélité", "Achats", "Paramètres"]);
  });

  it("assistant IA activé par FlaiX Expert : l'entrée Assistant apparaît juste après Résultats et En direct", () => {
    expect(menuDuLieu({ ...OPTIONS_PAR_DEFAUT, assistant: true }).map((e) => e.libelle).slice(0, 4)).toEqual(["Résultats", "En direct", "Assistant", "Caisses"]);
  });

  it("Achats (§15.172) : présent avec les factures seules ou le stock seul", () => {
    expect(menuDuLieu({ ...OPTIONS_PAR_DEFAUT, stock: false }).map((e) => e.libelle)).toContain("Achats");
    expect(menuDuLieu({ ...OPTIONS_PAR_DEFAUT, factures: false }).map((e) => e.libelle)).toContain("Achats");
  });

  it("Stock, Fidélité et Factures désactivées : leurs entrées disparaissent, la base reste", () => {
    const menu = menuDuLieu({ ...OPTIONS_PAR_DEFAUT, stock: false, fidelite: false, factures: false, hygiene: false, evenements_prives: false }).map((e) => e.libelle);
    expect(menu).toEqual(["Résultats", "En direct", "Caisses", "Équipe", "Clôtures", "Paramètres"]);
  });
});
