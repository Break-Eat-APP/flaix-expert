import { describe, expect, it } from "vitest";
import { placerStands, planStade, tribuneDuNom, type DonneesStand } from "./plan-stade.ts";

const MAINTENANT = Date.parse("2026-10-12T19:00:00.000Z");
const ilYa = (min: number) => new Date(MAINTENANT - min * 60_000).toISOString();
const stand = (x: Partial<DonneesStand>): DonneesStand => ({
  id: "a",
  nom: "Buvette",
  tribune: null,
  caisses: [{ numero: 1, ouverte: true, vueLe: ilYa(0), aEnvoyer: 0, caNet: 12_000, tickets: 20 }],
  stock: [],
  file: { enFile: 0, mesurables: 0 },
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
      [
        stand({ id: "r", nom: "Buvette Nord", stock: [{ nom: "Frites", alerte: "rupture", restant: -2, sur: 120, vendu: 122 }, { nom: "Bière", alerte: "faible", restant: 10, sur: 200, vendu: 190 }] }),
        stand({ id: "o", nom: "Buvette Est", stock: [{ nom: "Bière", alerte: "faible", restant: 10, sur: 200, vendu: 190 }] }),
        stand({ id: "v", nom: "Buvette Sud" }),
        stand({ id: "g", nom: "Buvette Ouest", caisses: [{ numero: 4, ouverte: false, vueLe: null, aEnvoyer: null, caNet: 0, tickets: 0 }] }),
      ],
      EV,
      MAINTENANT,
    );
    const par = Object.fromEntries(plan.stands.map((s) => [s.id, s]));
    expect(par.r).toMatchObject({ couleur: "rouge", resume: "Rupture : Frites (+1)" });
    expect(par.r!.signaux.map((s) => s.titre)).toEqual(["Rupture : Frites", "Stock faible : Bière"]);
    expect(par.r!.signaux[0]!.detail).toContain("Reste 0 sur 120");
    expect(par.o!.couleur).toBe("orange");
    expect(par.v!.resume).toMatch(/^Tout va bien · 120,00\s€$/);
    expect(par.v).toMatchObject({ couleur: "vert", chiffres: { caNet: 12_000, tickets: 20, caissesOuvertes: 1, caisses: 1 } });
    expect(par.g).toMatchObject({ couleur: "gris", resume: "Fermé : aucune caisse ouverte" });
    expect(plan.stands.map((s) => s.tribune)).toEqual(["nord", "est", "sud", "ouest"]);
  });

  it("file d'attente : orange dès 50 %, rouge dès 80 %, rien sous 5 commandes mesurées", () => {
    const couleur = (enFile: number, mesurables: number) => planStade([stand({ file: { enFile, mesurables } })], EV, MAINTENANT).stands[0]!;
    expect(couleur(4, 4).couleur).toBe("vert");
    expect(couleur(4, 10).couleur).toBe("vert");
    expect(couleur(5, 10)).toMatchObject({ couleur: "orange", resume: "Affluence : file d'attente sur 50 % des commandes" });
    expect(couleur(8, 10)).toMatchObject({ couleur: "rouge", resume: "Saturé : file d'attente sur 80 % des commandes", chiffres: { filePct: 80 } });
  });

  it("tablette muette ou tickets à envoyer, hygiène du stand → orange ; hors événement, le stock et la file ne comptent pas", () => {
    const muette = planStade([stand({ caisses: [{ numero: 3, ouverte: true, vueLe: ilYa(6), aEnvoyer: 0, caNet: 0, tickets: 0 }] })], EV, MAINTENANT).stands[0]!;
    expect(muette).toMatchObject({ couleur: "orange", resume: "Caisse 3 : pas de nouvelles de la tablette depuis 6 min" });
    const enAttente = planStade([stand({ caisses: [{ numero: 3, ouverte: true, vueLe: ilYa(0), aEnvoyer: 4, caNet: 0, tickets: 0 }] })], EV, MAINTENANT).stands[0]!;
    expect(enAttente.resume).toBe("Caisse 3 : 4 tickets à envoyer");
    const hygiene = planStade([stand({ hygiene: { nonConformes: 2, ouvertureARelever: ["Frigo bar"] } })], EV, MAINTENANT).stands[0]!;
    expect(hygiene.signaux.map((s) => s.titre)).toEqual(["Hygiène : 2 températures hors limite en 7 jours", "Hygiène : températures d'ouverture à relever (1)"]);
    const horsEvenement = planStade(
      [stand({ caisses: [], stock: [{ nom: "Frites", alerte: "rupture", restant: 0, sur: 1, vendu: 1 }], file: { enFile: 9, mesurables: 10 }, hygiene: { nonConformes: 0, ouvertureARelever: ["Frigo"] } })],
      null,
      MAINTENANT,
    ).stands[0]!;
    expect(horsEvenement).toMatchObject({ couleur: "gris", resume: "Hors événement", signaux: [], chiffres: { filePct: null } });
  });
});
