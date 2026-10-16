import type { EtatStand, ModeleLieu, PositionPlan, Tribune } from "@flaix/domain";

/**
 * Décors du lieu en 3D (dossier §15.164) : dimensions de chaque décor (en unités de la scène, centre en 0,0 ; Nord vers
 * −z, Est vers +x) et place automatique des buvettes. Sans three.js, pour être testé et partagé avec la scène.
 */

export interface GeometriePlan {
  /** Demi-largeur (x) et demi-profondeur (z) du lieu avec ses buvettes, pour cadrer la caméra. */
  demiLargeur: number;
  demiProfondeur: number;
  /** Nom de chaque côté, écrit au bord de l'aire de jeu. */
  cotes: Record<Tribune, string>;
  /** Où écrire le nom du côté. */
  etiquetteCote(cote: Tribune): PositionPlan;
  /** Place automatique d'une buvette : sur l'allée derrière les gradins de son côté, répartie avec ses voisines. */
  placeAuto(cote: Tribune, rang: number, sur: number): PositionPlan;
}

/** Stade : terrain 60 × 40, tribunes droites. */
export const STADE = { long: 60, large: 40, recul: 3, profondeur: 13, allee: 7 } as const;
/** Patinoire : glace 60 × 26 aux coins arrondis, bandes, gradins tout autour. */
export const PATINOIRE = { long: 60, large: 26, coin: 8.5, couloir: 2.5, profondeur: 12, allee: 6 } as const;
/** Arène ronde : parquet de 22 de rayon, gradins circulaires. */
export const ARENE = { rayon: 22, couloir: 2, profondeur: 14, allee: 6 } as const;
/** Salle de spectacle : fosse 52 × 34, scène au nord, gradins à l'est, au sud et à l'ouest. */
export const SALLE = { long: 52, large: 34, scene: 10, recul: 2, profondeur: 9, allee: 6 } as const;

const NOMS: Record<Tribune, string> = { nord: "Nord", est: "Est", sud: "Sud", ouest: "Ouest" };
const SENS: Record<Tribune, { nx: number; nz: number }> = { nord: { nx: 0, nz: -1 }, sud: { nx: 0, nz: 1 }, est: { nx: 1, nz: 0 }, ouest: { nx: -1, nz: 0 } };
const ANGLE: Record<Tribune, number> = { est: 0, sud: Math.PI / 2, ouest: Math.PI, nord: -Math.PI / 2 };

/** Côtés droits : distance de l'allée et longueur utile de chaque côté (le long de x pour Nord/Sud, de z pour Est/Ouest). */
function cotesDroits(allee: Record<Tribune, number>, utile: Record<Tribune, number>) {
  return (cote: Tribune, rang: number, sur: number): PositionPlan => {
    const { nx, nz } = SENS[cote];
    const u = utile[cote];
    const le_long = -u / 2 + ((rang + 0.5) * u) / Math.max(1, sur);
    return nz !== 0 ? { x: le_long, z: nz * allee[cote] } : { x: nx * allee[cote], z: le_long };
  };
}
const surCote = (cote: Tribune, distance: Record<Tribune, number>): PositionPlan => ({ x: SENS[cote].nx * distance[cote], z: SENS[cote].nz * distance[cote] });

const stadeAllee = { nord: STADE.large / 2 + STADE.recul + STADE.profondeur + STADE.allee, sud: STADE.large / 2 + STADE.recul + STADE.profondeur + STADE.allee, est: STADE.long / 2 + STADE.recul + STADE.profondeur + STADE.allee, ouest: STADE.long / 2 + STADE.recul + STADE.profondeur + STADE.allee };
const patinoireAllee = { nord: PATINOIRE.large / 2 + PATINOIRE.couloir + PATINOIRE.profondeur + PATINOIRE.allee, sud: PATINOIRE.large / 2 + PATINOIRE.couloir + PATINOIRE.profondeur + PATINOIRE.allee, est: PATINOIRE.long / 2 + PATINOIRE.couloir + PATINOIRE.profondeur + PATINOIRE.allee, ouest: PATINOIRE.long / 2 + PATINOIRE.couloir + PATINOIRE.profondeur + PATINOIRE.allee };
const areneAllee = ARENE.rayon + ARENE.couloir + ARENE.profondeur + ARENE.allee;
const salleAllee = { nord: SALLE.large / 2 + SALLE.scene + SALLE.allee, sud: SALLE.large / 2 + SALLE.recul + SALLE.profondeur + SALLE.allee, est: SALLE.long / 2 + SALLE.recul + SALLE.profondeur + SALLE.allee, ouest: SALLE.long / 2 + SALLE.recul + SALLE.profondeur + SALLE.allee };

export const GEOMETRIES: Record<ModeleLieu, GeometriePlan> = {
  stade: {
    demiLargeur: stadeAllee.est + 6,
    demiProfondeur: 45,
    cotes: { nord: "Tribune Nord", est: "Tribune Est", sud: "Tribune Sud", ouest: "Tribune Ouest" },
    etiquetteCote: (c) => surCote(c, { nord: STADE.large / 2 + STADE.recul - 1.6, sud: STADE.large / 2 + STADE.recul - 1.6, est: STADE.long / 2 + STADE.recul - 1.6, ouest: STADE.long / 2 + STADE.recul - 1.6 }),
    placeAuto: cotesDroits(stadeAllee, { nord: STADE.long - 4, sud: STADE.long - 4, est: STADE.large - 4, ouest: STADE.large - 4 }),
  },
  patinoire: {
    demiLargeur: patinoireAllee.est + 6,
    demiProfondeur: 40,
    cotes: NOMS,
    etiquetteCote: (c) => surCote(c, { nord: PATINOIRE.large / 2 - 2.5, sud: PATINOIRE.large / 2 - 2.5, est: PATINOIRE.long / 2 - 4, ouest: PATINOIRE.long / 2 - 4 }),
    placeAuto: cotesDroits(patinoireAllee, { nord: PATINOIRE.long, sud: PATINOIRE.long, est: PATINOIRE.large + 8, ouest: PATINOIRE.large + 8 }),
  },
  arene: {
    demiLargeur: areneAllee + 6,
    demiProfondeur: 44,
    cotes: NOMS,
    etiquetteCote: (c) => surCote(c, { nord: ARENE.rayon - 3, sud: ARENE.rayon - 3, est: ARENE.rayon - 4, ouest: ARENE.rayon - 4 }),
    // Sur le cercle de l'allée, réparties sur un quart de tour autour de leur côté.
    placeAuto: (cote, rang, sur) => {
      const ecart = Math.min(Math.PI / 9, (Math.PI / 2.4) / Math.max(1, sur));
      const a = ANGLE[cote] + (rang - (sur - 1) / 2) * ecart;
      return { x: Math.cos(a) * areneAllee, z: Math.sin(a) * areneAllee };
    },
  },
  salle: {
    demiLargeur: salleAllee.est + 6,
    demiProfondeur: 42,
    cotes: { nord: "Scène", est: "Gradins Est", sud: "Gradins Sud", ouest: "Gradins Ouest" },
    etiquetteCote: (c) => (c === "nord" ? { x: 0, z: -(SALLE.large / 2 + SALLE.scene / 2) } : surCote(c, { nord: 0, sud: SALLE.large / 2 - 1.6, est: SALLE.long / 2 - 1.6, ouest: SALLE.long / 2 - 1.6 })),
    placeAuto: cotesDroits(salleAllee, { nord: SALLE.long - 8, sud: SALLE.long - 4, est: SALLE.large - 4, ouest: SALLE.large - 4 }),
  },
};

/** Où dessiner un stand : sa place posée à la main, sinon sa place automatique dans ce décor. */
export function placeStand(modele: ModeleLieu, s: Pick<EtatStand, "position" | "tribune" | "rang" | "surTribune">): PositionPlan {
  return s.position ?? GEOMETRIES[modele].placeAuto(s.tribune, s.rang, s.surTribune);
}

/** Rotation (autour de l'axe vertical) qui tourne le comptoir d'une buvette vers le centre du lieu. */
export const versLeCentre = (p: PositionPlan) => Math.atan2(-p.x, -p.z);

/** Une buvette posée à la main reste sur l'esplanade. */
export const RAYON_POSE = 108;
export function borner(p: PositionPlan): PositionPlan {
  const d = Math.hypot(p.x, p.z);
  return d <= RAYON_POSE ? p : { x: (p.x / d) * RAYON_POSE, z: (p.z / d) * RAYON_POSE };
}

export const TITRES_PLAN: Record<ModeleLieu, string> = { stade: "Le stade en direct", patinoire: "La patinoire en direct", arene: "L'arène en direct", salle: "La salle en direct" };
