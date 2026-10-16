/**
 * Décors du lieu en 3D (dossier §15.164) — place automatique des buvettes dans chaque décor, place posée à la main,
 * comptoir tourné vers le centre, buvette bornée à l'esplanade.
 */
import { describe, expect, it } from "vitest";
import { MODELES_LIEU, type Tribune } from "@flaix/domain";
import { GEOMETRIES, RAYON_POSE, borner, placeStand, versLeCentre } from "./modeles-plan.ts";

const COTES: Tribune[] = ["nord", "est", "sud", "ouest"];

describe("décors du lieu", () => {
  it("stade : les buvettes d'une tribune se partagent sa longueur, derrière les gradins (comme avant le choix du décor)", () => {
    expect(GEOMETRIES.stade.placeAuto("nord", 0, 2)).toEqual({ x: -14, z: -43 });
    expect(GEOMETRIES.stade.placeAuto("nord", 1, 2)).toEqual({ x: 14, z: -43 });
    expect(GEOMETRIES.stade.placeAuto("est", 0, 1)).toEqual({ x: 53, z: 0 });
  });

  it("chaque décor : place sur le bon côté, hors de l'aire de jeu, dans le cadre, et distincte pour deux voisines", () => {
    for (const { code } of MODELES_LIEU) {
      const g = GEOMETRIES[code];
      for (const cote of COTES) {
        const a = g.placeAuto(cote, 0, 2);
        const b = g.placeAuto(cote, 1, 2);
        expect(Math.hypot(a.x - b.x, a.z - b.z), `${code} ${cote}`).toBeGreaterThan(8);
        // Du bon côté : Nord vers −z, Est vers +x…
        const sens = { nord: -a.z, sud: a.z, est: a.x, ouest: -a.x }[cote];
        expect(sens, `${code} ${cote}`).toBeGreaterThan(25);
        expect(Math.abs(a.x)).toBeLessThanOrEqual(g.demiLargeur);
        expect(Math.hypot(a.x, a.z)).toBeLessThan(RAYON_POSE);
      }
    }
    // Arène ronde : toutes sur le même cercle.
    const r = (p: { x: number; z: number }) => Math.round(Math.hypot(p.x, p.z) * 100) / 100;
    expect(new Set(COTES.flatMap((c) => [0, 1, 2].map((i) => r(GEOMETRIES.arene.placeAuto(c, i, 3))))).size).toBe(1);
  });

  it("posé à la main : la position l'emporte sur la tribune ; comptoir vers le centre ; bornée à l'esplanade", () => {
    expect(placeStand("patinoire", { position: { x: 7, z: -60 }, tribune: "sud", rang: 0, surTribune: 1 })).toEqual({ x: 7, z: -60 });
    expect(placeStand("patinoire", { position: null, tribune: "sud", rang: 0, surTribune: 1 })).toEqual(GEOMETRIES.patinoire.placeAuto("sud", 0, 1));
    // Au nord (−z), le comptoir (+z local) regarde le centre sans tourner ; à l'est, quart de tour.
    expect(versLeCentre({ x: 0, z: -40 })).toBeCloseTo(0);
    expect(versLeCentre({ x: 40, z: 0 })).toBeCloseTo(-Math.PI / 2);
    expect(borner({ x: 300, z: 0 })).toEqual({ x: RAYON_POSE, z: 0 });
    expect(borner({ x: 10, z: 10 })).toEqual({ x: 10, z: 10 });
  });
});

describe("ordre des buvettes sur un côté", () => {
  it("de gauche à droite vu du sud, comme au stade : au nord et au sud d'ouest en est ; à l'est et à l'ouest du nord au sud", () => {
    for (const modele of ["stade", "patinoire", "arene", "salle"] as const) {
      const g = GEOMETRIES[modele];
      expect(g.placeAuto("nord", 0, 2).x, modele).toBeLessThan(g.placeAuto("nord", 1, 2).x);
      expect(g.placeAuto("sud", 0, 2).x, modele).toBeLessThan(g.placeAuto("sud", 1, 2).x);
      expect(g.placeAuto("est", 0, 2).z, modele).toBeLessThan(g.placeAuto("est", 1, 2).z);
      expect(g.placeAuto("ouest", 0, 2).z, modele).toBeLessThan(g.placeAuto("ouest", 1, 2).z);
    }
  });
});
