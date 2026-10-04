/** Menu et options du lieu (dossier §15.118) — test des écrans demandé par l'audit Codex (P2-004). */
import { describe, expect, it } from "vitest";
import { OPTIONS_PAR_DEFAUT } from "@flaix/domain";
import { menuDuLieu } from "./Coquille.tsx";

describe("menu selon les options activées par FlaiX Expert", () => {
  it("toutes les options actives : les huit entrées", () => {
    expect(menuDuLieu(OPTIONS_PAR_DEFAUT).map((e) => e.libelle)).toEqual(["Résultats", "Caisses", "Stock", "Équipe", "Clôtures", "Fidélité", "Factures", "Paramètres"]);
  });

  it("Stock, Fidélité et Factures désactivées : leurs entrées disparaissent, la base reste", () => {
    const menu = menuDuLieu({ ...OPTIONS_PAR_DEFAUT, stock: false, fidelite: false, factures: false }).map((e) => e.libelle);
    expect(menu).toEqual(["Résultats", "Caisses", "Équipe", "Clôtures", "Paramètres"]);
  });
});
