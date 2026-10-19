import { describe, expect, it } from "vitest";
import { cumulJusque, libelleQuart, parQuartDHeure, tableauDirect, type TicketHorodate } from "./direct.ts";

const OUVERT = Date.parse("2026-10-19T17:00:00.000Z"); // 19 h 00 à Paris
const min = (m: number) => OUVERT + m * 60_000;
const vente = (m: number, ca: number): TicketHorodate => ({ le: min(m), ca, vente: true });

describe("tableau En direct (§15.167)", () => {
  it("quarts d'heure et cumul jusqu'au même temps écoulé ; une annulation retire son ticket", () => {
    const t = [vente(2, 1_000), vente(14, 500), vente(16, 700), { le: min(20), ca: -700, vente: false }, vente(40, 300)];
    expect(parQuartDHeure(t, OUVERT, 3)).toEqual([
      { ca: 1_500, tickets: 2 },
      { ca: 0, tickets: 0 },
      { ca: 300, tickets: 1 },
    ]);
    expect(cumulJusque(t, OUVERT, 20 * 60_000)).toEqual({ ca: 1_500, tickets: 2 });
    expect(libelleQuart(OUVERT)).toBe("19 h 00");
  });

  it("CA, tickets et panier comparés au match précédent au même moment ; marge, prévision, spectateurs, catégories, meilleurs", () => {
    const precedentOuvert = "2026-10-12T17:00:00.000Z";
    const p = Date.parse(precedentOuvert);
    const t = tableauDirect({
      evenement: { id: "e", libelle: "Rouen – Le Mans", ouvertLe: new Date(OUVERT).toISOString(), spectateurs: 4_000 },
      maintenant: min(30),
      tickets: [vente(5, 6_000), vente(10, 4_000), vente(25, 2_000)],
      precedent: { libelle: "Rouen – Orléans", ouvertLe: precedentOuvert, tickets: [{ le: p + 5 * 60_000, ca: 5_000, vente: true }, { le: p + 20 * 60_000, ca: 5_000, vente: true }, { le: p + 50 * 60_000, ca: 9_000, vente: true }] },
      stats: { caHt: 10_000, margeBrute: 6_500, produitsSansCout: 1, parCategorie: [{ nom: "Softs", ca: 2_000 }, { nom: "Bières", ca: 10_000 }, { nom: "Autres", ca: 0 }], produits: [{ nom: "Frites", caTtc: 2_000, quantite: 4 }, { nom: "Bière", caTtc: 10_000, quantite: 14 }] },
      prevision: { bas: 40_000, median: 48_000, haut: 60_000 },
    });
    expect(t.ca).toMatchObject({ valeur: 12_000, auMemeMoment: 10_000, ecartPb: 2_000 });
    expect(t.tickets).toMatchObject({ valeur: 3, auMemeMoment: 2, ecartPb: 5_000 });
    expect(t.panier).toMatchObject({ valeur: 4_000, auMemeMoment: 5_000, ecartPb: -2_000 });
    expect(t.ca.serie).toEqual([10_000, 2_000, 0]);
    expect(t.courbe).toEqual({ libelles: ["19 h 00", "19 h 15", "19 h 30"], actuel: [10_000, 2_000, 0], precedent: [5_000, 5_000, 0] });
    expect(t.marge).toEqual({ valeur: 6_500, tauxPb: 6_500, produitsSansCout: 1 });
    expect(t.prevision).toEqual({ bas: 40_000, median: 48_000, haut: 60_000, avancementPb: 2_500 });
    expect(t.caParSpectateur).toBe(3);
    expect(t.parCategorie.map((c) => c.nom)).toEqual(["Bières", "Softs"]);
    expect(t.meilleurs.map((x) => x.nom)).toEqual(["Bière", "Frites"]);
  });

  it("sans match précédent ni prévision ni spectateurs : pas de comparaison, rien d'inventé", () => {
    const t = tableauDirect({
      evenement: { id: "e", libelle: "Premier match", ouvertLe: new Date(OUVERT).toISOString(), spectateurs: null },
      maintenant: min(10),
      tickets: [],
      precedent: null,
      stats: { caHt: 0, margeBrute: null, produitsSansCout: 0, parCategorie: [], produits: [] },
      prevision: null,
    });
    expect(t).toMatchObject({ precedent: null, prevision: null, caParSpectateur: null, panier: { valeur: null, ecartPb: null }, ca: { valeur: 0, auMemeMoment: null, ecartPb: null }, marge: { valeur: null, tauxPb: null } });
    expect(t.courbe.precedent).toBeNull();
  });
});
