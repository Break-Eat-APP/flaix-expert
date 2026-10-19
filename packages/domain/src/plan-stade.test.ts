import { describe, expect, it } from "vitest";
import { minutesAvantRupture, placerStands, planStade, rythmeVentes, tribuneDuNom, type DonneesStand } from "./plan-stade.ts";

const MAINTENANT = Date.parse("2026-10-12T19:00:00.000Z");
const ilYa = (min: number) => new Date(MAINTENANT - min * 60_000).toISOString();
const stand = (x: Partial<DonneesStand>): DonneesStand => ({
  id: "a",
  nom: "Buvette",
  tribune: null,
  position: null,
  caisses: [{ numero: 1, ouverte: true, ouverteLe: ilYa(30), vueLe: ilYa(0), aEnvoyer: 0, caNet: 12_000, tickets: 20, annulations: 0, horsTarif: 0, derniereVente: ilYa(1) }],
  recentes: { tickets: 0, caNet: 0 },
  stock: [],
  hygiene: { nonConformes: 0, ouvertureARelever: [] },
  ...x,
});
const EV = { id: "e", libelle: "Rouen – Caen" };

describe("le stade en direct (§15.162)", () => {
  it("placement : tribune choisie, sinon devinée du nom, sinon la moins garnie ; par nom sur une tribune", () => {
    expect(tribuneDuNom("Buvette Nord")).toBe("nord");
    expect(tribuneDuNom("Bar du Sud-Est")).toBe("sud");
    expect(tribuneDuNom("BUVETTE OUEST")).toBe("ouest");
    expect(tribuneDuNom("Le Comptoir")).toBeNull();
    const p = placerStands([
      { id: "n2", nom: "Buvette Nord 2", tribune: null },
      { id: "n1", nom: "Buvette Nord 1", tribune: null },
      { id: "x", nom: "Le Comptoir", tribune: "sud" },
      { id: "y", nom: "Food truck", tribune: null },
      { id: "z", nom: "Kiosque", tribune: null },
    ]);
    expect(p.get("n1")).toEqual({ tribune: "nord", choisie: false, rang: 0, surTribune: 2 });
    expect(p.get("n2")).toMatchObject({ tribune: "nord", rang: 1 });
    expect(p.get("x")).toEqual({ tribune: "sud", choisie: true, rang: 0, surTribune: 1 });
    // Nord 2, Sud 1 : Food truck va à l'Est (vide), puis Kiosque à l'Ouest (vide).
    expect(p.get("y")!.tribune).toBe("est");
    expect(p.get("z")!.tribune).toBe("ouest");
  });

  it("couleurs : rupture → rouge ; stock faible → orange ; ouvert sans souci → vert ; fermé → gris", () => {
    const plan = planStade(
      "stade",
      [
        stand({ id: "r", nom: "Buvette Nord", stock: [{ produitId: "p-frites", nom: "Frites", alerte: "rupture", restant: -2, sur: 120, vendu: 122, venduRecent: 30, reserve: 48 }, { produitId: "p-biere", nom: "Bière", alerte: "faible", restant: 10, sur: 200, vendu: 190, venduRecent: 0, reserve: null }] }),
        stand({ id: "o", nom: "Buvette Est", stock: [{ produitId: "p-biere", nom: "Bière", alerte: "faible", restant: 10, sur: 200, vendu: 190, venduRecent: 0, reserve: null }] }),
        stand({ id: "v", nom: "Buvette Sud" }),
        stand({ id: "g", nom: "Buvette Ouest", caisses: [{ numero: 4, ouverte: false, ouverteLe: null, vueLe: null, aEnvoyer: null, caNet: 0, tickets: 0, annulations: 0, horsTarif: 0, derniereVente: null }] }),
      ],
      EV,
      MAINTENANT,
    );
    const par = Object.fromEntries(plan.stands.map((s) => [s.id, s]));
    expect(par.r).toMatchObject({ couleur: "rouge", resume: "Rupture : Frites (+1)" });
    expect(par.r!.signaux.map((s) => s.titre)).toEqual(["Rupture : Frites", "Stock faible : Bière"]);
    expect(par.r!.signaux[0]!.detail).toBe("Reste 0 sur 120 · vendu 122. 48 en réserve : réassort en deux gestes depuis « En direct ».");
    expect(par.o!.couleur).toBe("orange");
    expect(par.v!.resume).toMatch(/^Tout va bien · 120,00\s€$/);
    expect(par.v).toMatchObject({ couleur: "vert", chiffres: { caNet: 12_000, tickets: 20, caissesOuvertes: 1, caisses: 1 } });
    expect(par.g).toMatchObject({ couleur: "gris", resume: "Fermé : aucune caisse ouverte" });
    expect(plan.stands.map((s) => s.tribune)).toEqual(["nord", "est", "sud", "ouest"]);
  });

  it("stock : rupture prévue au rythme des 15 dernières minutes, réserve rappelée ; rien sans vente récente", () => {
    const etat = (l: Partial<DonneesStand["stock"][number]>) =>
      planStade("stade", [stand({ stock: [{ produitId: "p-frites", nom: "Frites", alerte: null, restant: 30, sur: 200, vendu: 170, venduRecent: 0, reserve: null, ...l }] })], EV, MAINTENANT).stands[0]!;
    expect(minutesAvantRupture(30, 45)).toBe(10);
    expect(minutesAvantRupture(0, 45)).toBeNull();
    expect(etat({ venduRecent: 0 }).couleur).toBe("vert");
    expect(etat({ venduRecent: 20 }).couleur).toBe("vert"); // 30 restants à 20 par quart d'heure : 23 min
    expect(etat({ venduRecent: 45, reserve: 48 })).toMatchObject({ couleur: "orange", resume: "Rupture prévue : Frites dans 10 min environ" });
    expect(etat({ venduRecent: 45, reserve: 48 }).signaux[0]!.detail).toBe("Reste 30, 45 vendus ces 15 dernières minutes. 48 en réserve : réassort en deux gestes depuis « En direct ».");
    const faible = etat({ alerte: "faible", venduRecent: 45 }).signaux;
    expect(faible.map((x) => x.titre)).toEqual(["Stock faible : Frites"]);
    expect(faible[0]!.detail).toBe("Reste 30 sur 200 · vendu 170. Au rythme actuel, rupture dans 10 min environ.");
  });

  it("caisses : aucune vente depuis 15 min alors que le stade vend ; ventes hors tarif ; annulations nombreuses", () => {
    const caisse = (x: Partial<DonneesStand["caisses"][number]>) => ({ numero: 2, ouverte: true, ouverteLe: ilYa(60), vueLe: ilYa(0), aEnvoyer: 0, caNet: 0, tickets: 0, annulations: 0, horsTarif: 0, derniereVente: null, ...x });
    const autre = stand({ id: "b", nom: "Bar", caisses: [caisse({ numero: 9, derniereVente: ilYa(1) })] });
    const calme = planStade("stade", [stand({ caisses: [caisse({ derniereVente: ilYa(18) })] }), autre], EV, MAINTENANT).stands.find((s) => s.id === "a")!;
    expect(calme).toMatchObject({ couleur: "orange", resume: "Caisse 2 : aucune vente depuis 18 min" });
    // Tout le stade est calme (mi-temps finie, fin de match) : pas d'alerte.
    expect(planStade("stade", [stand({ caisses: [caisse({ derniereVente: ilYa(18) })] })], EV, MAINTENANT).stands[0]!.couleur).toBe("vert");
    expect(planStade("stade", [stand({ caisses: [caisse({ ouverteLe: ilYa(40), derniereVente: null })] }), autre], EV, MAINTENANT).stands.find((s) => s.id === "a")!.resume).toBe("Caisse 2 : aucune vente depuis l'ouverture (40 min)");
    const ventes = planStade("stade", [stand({ caisses: [caisse({ derniereVente: ilYa(1), tickets: 90, annulations: 6, horsTarif: 3 })] })], EV, MAINTENANT).stands[0]!;
    expect(ventes.signaux.map((x) => x.titre)).toEqual(["Caisse 2 : 3 ventes à un prix différent du tarif", "Caisse 2 : 6 annulations ce soir"]);
    expect(ventes.signaux[1]!.detail).toMatch(/^6 % des tickets/);
    // 5 annulations sur 200 ventes : 2,5 %, normal.
    expect(planStade("stade", [stand({ caisses: [caisse({ derniereVente: ilYa(1), tickets: 195, annulations: 5 })] })], EV, MAINTENANT).stands[0]!.couleur).toBe("vert");
  });

  it("tablette muette (rouge après 15 min) ou tickets à envoyer, hygiène du stand → orange ; hors événement, le stock ne compte pas", () => {
    const k = { numero: 3, ouverte: true, ouverteLe: ilYa(60), aEnvoyer: 0, caNet: 0, tickets: 0, annulations: 0, horsTarif: 0, derniereVente: ilYa(1) };
    const muette = planStade("stade", [stand({ caisses: [{ ...k, vueLe: ilYa(6) }] })], EV, MAINTENANT).stands[0]!;
    expect(muette).toMatchObject({ couleur: "orange", resume: "Caisse 3 : pas de nouvelles de la tablette depuis 6 min" });
    expect(planStade("stade", [stand({ caisses: [{ ...k, vueLe: ilYa(22) }] })], EV, MAINTENANT).stands[0]!).toMatchObject({ couleur: "rouge", resume: "Caisse 3 : pas de nouvelles de la tablette depuis 22 min" });
    const enAttente = planStade("stade", [stand({ caisses: [{ ...k, vueLe: ilYa(0), aEnvoyer: 4 }] })], EV, MAINTENANT).stands[0]!;
    expect(enAttente.resume).toBe("Caisse 3 : 4 tickets à envoyer");
    const hygiene = planStade("stade", [stand({ hygiene: { nonConformes: 2, ouvertureARelever: ["Frigo bar"] } })], EV, MAINTENANT).stands[0]!;
    expect(hygiene.signaux.map((s) => s.titre)).toEqual(["Hygiène : 2 températures hors limite en 7 jours", "Hygiène : températures d'ouverture à relever (1)"]);
    const horsEvenement = planStade(
      "stade",
      [stand({ caisses: [], stock: [{ produitId: "p-frites", nom: "Frites", alerte: "rupture", restant: 0, sur: 1, vendu: 1, venduRecent: 1, reserve: null }], hygiene: { nonConformes: 0, ouvertureARelever: ["Frigo"] } })],
      null,
      MAINTENANT,
    ).stands[0]!;
    expect(horsEvenement).toMatchObject({ couleur: "gris", resume: "Hors événement", signaux: [], chiffres: { derniereVente: null } });
  });

  it("en direct : chiffres de la soirée, ventes des 10 dernières minutes, rythme, match précédent au même moment, caisses ; produits du plus entamé au moins entamé", () => {
    expect(rythmeVentes(10_000, 100_000, 10)).toBeNull(); // moins de 15 min d'ouverture
    expect(rythmeVentes(5_000, 100_000, 100)).toBe("calme"); // 500 €/min contre 1 000 €/min de moyenne
    expect(rythmeVentes(10_000, 100_000, 100)).toBe("normal");
    expect(rythmeVentes(20_000, 100_000, 100)).toBe("soutenu");
    const muette = { numero: 2, ouverte: true, ouverteLe: ilYa(60), vueLe: ilYa(9), aEnvoyer: 0, caNet: 8_000, tickets: 10, annulations: 0, horsTarif: 0, derniereVente: ilYa(9) };
    const plan = planStade(
      "stade",
      [
        stand({ id: "a", nom: "Buvette Nord", recentes: { tickets: 6, caNet: 3_000 }, stock: [
          { produitId: "p-biere", nom: "Bière", alerte: null, restant: 150, sur: 200, vendu: 50, venduRecent: 4, reserve: null },
          { produitId: "p-frites", nom: "Frites", alerte: "faible", restant: 10, sur: 100, vendu: 90, venduRecent: 4, reserve: null },
        ] }),
        stand({ id: "b", nom: "Buvette Sud", caisses: [muette], recentes: { tickets: 0, caNet: 0 } }),
      ],
      EV,
      MAINTENANT,
      { ouvertLe: ilYa(100), comparaison: { libelle: "Rouen – Lyon", caNet: 16_000 } },
    );
    expect(plan.direct).toEqual({
      ouvertLe: ilYa(100),
      caNet: 20_000,
      tickets: 30,
      recentes: { minutes: 10, tickets: 6, caNet: 3_000 },
      caParMinute: 300,
      rythme: "soutenu", // 300 €/min contre 200 €/min de moyenne
      comparaison: { libelle: "Rouen – Lyon", caNet: 16_000, ecartPb: 2_500 },
      caisses: { ouvertes: 2, total: 2, sansNouvelles: 1 },
    });
    const nord = plan.stands.find((x) => x.id === "a")!;
    expect(nord.recentes).toEqual({ minutes: 10, tickets: 6, caNet: 3_000 });
    expect(nord.produits.map((x) => x.nom)).toEqual(["Frites", "Bière"]);
    expect(nord.signaux.find((x) => x.titre === "Stock faible : Frites")!.produitId).toBe("p-frites");
    // Hors événement : ni chiffres du direct, ni produits, ni ventes récentes.
    const hors = planStade("stade", [stand({ recentes: { tickets: 6, caNet: 3_000 } })], null, MAINTENANT);
    expect(hors.direct).toBeNull();
    expect(hors.stands[0]!).toMatchObject({ produits: [], recentes: { tickets: 0, caNet: 0 } });
  });
});
