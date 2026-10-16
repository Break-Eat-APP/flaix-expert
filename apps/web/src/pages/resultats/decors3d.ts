import * as THREE from "three";
import type { ModeleLieu, Tribune } from "@flaix/domain";
import { ARENE, PATINOIRE, SALLE, STADE } from "./modeles-plan.ts";

/**
 * Décors 3D du lieu (dossier §15.164) : stade, patinoire, arène ronde, salle de spectacle. Chacun est un groupe posé sur
 * l'esplanade commune ; ses buvettes sont ajoutées à part (Stade3D). Teintes claires, comme le reste de l'application.
 */

const GRADIN = 0xf7f5fc;
const SIEGE = 0xd9cefb;

const SENS: Record<Tribune, { nx: number; nz: number }> = { nord: { nx: 0, nz: -1 }, sud: { nx: 0, nz: 1 }, est: { nx: 1, nz: 0 }, ouest: { nx: -1, nz: 0 } };

function toile(l: number, h: number, dessin: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  dessin(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const standard = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });

function maillage(geo: THREE.BufferGeometry, mat: THREE.Material, ombre = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = ombre;
  m.receiveShadow = true;
  return m;
}

/** Sol plat (plan horizontal) centré. */
function sol(l: number, p: number, mat: THREE.Material, y: number): THREE.Mesh {
  const m = maillage(new THREE.PlaneGeometry(l, p), mat, false);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

/** Contour d'un rectangle aux coins arrondis, centré (demi-largeur, demi-profondeur, rayon). */
function rectangleArrondi(forme: THREE.Shape | THREE.Path, dl: number, dp: number, r: number): void {
  forme.moveTo(-dl + r, -dp);
  forme.lineTo(dl - r, -dp);
  forme.absarc(dl - r, -dp + r, r, -Math.PI / 2, 0, false);
  forme.lineTo(dl, dp - r);
  forme.absarc(dl - r, dp - r, r, 0, Math.PI / 2, false);
  forme.lineTo(-dl + r, dp);
  forme.absarc(-dl + r, dp - r, r, Math.PI / 2, Math.PI, false);
  forme.lineTo(-dl, -dp + r);
  forme.absarc(-dl + r, -dp + r, r, Math.PI, 1.5 * Math.PI, false);
}

/** Anneau extrudé vers le haut, entre deux contours (gradins, bandes). */
function anneau(dessinExterieur: (f: THREE.Shape) => void, dessinInterieur: (p: THREE.Path) => void, hauteur: number, mat: THREE.Material, y = 0): THREE.Mesh {
  const forme = new THREE.Shape();
  dessinExterieur(forme);
  const trou = new THREE.Path();
  dessinInterieur(trou);
  forme.holes.push(trou);
  const m = maillage(new THREE.ExtrudeGeometry(forme, { depth: hauteur, bevelEnabled: false, curveSegments: 48 }), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

/** Gradins droits d'un côté : `rangs` marches montant vers l'extérieur, construits côté +z puis tournés. */
function gradinsDroits(cote: Tribune, longueur: number, pied: number, profondeur: number, rangs: number, toit: boolean): THREE.Group {
  const g = new THREE.Group();
  const rang = profondeur / rangs;
  const mats = [standard(GRADIN), standard(SIEGE)];
  for (let i = 0; i < rangs; i++) {
    const h = 1.4 + i * 1.6;
    const b = maillage(new THREE.BoxGeometry(longueur - i * 1.5, h, rang), mats[i % 2]!);
    b.position.set(0, h / 2, pied + rang * (i + 0.5));
    g.add(b);
  }
  if (toit) {
    const t = maillage(new THREE.BoxGeometry(longueur - 2, 0.35, profondeur * 0.75), standard(0xffffff, { roughness: 0.6, transparent: true, opacity: 0.82 }));
    t.position.set(0, 8.2, pied + profondeur * 0.62);
    t.rotation.x = -0.12;
    g.add(t);
    for (const x of [-longueur / 2 + 3, 0, longueur / 2 - 3]) {
      const pilier = maillage(new THREE.CylinderGeometry(0.22, 0.22, 8, 8), mats[0]!, false);
      pilier.position.set(x, 4, pied + profondeur - 0.6);
      g.add(pilier);
    }
  }
  g.rotation.y = Math.atan2(SENS[cote].nx, SENS[cote].nz);
  return g;
}

// ───────────────────────── Stade ─────────────────────────

function stade(): THREE.Group {
  const g = new THREE.Group();
  const S = STADE;
  g.add(sol(S.long + 2 * S.recul, S.large + 2 * S.recul, standard(0x3f9a5c, { roughness: 1 }), 0.02));
  const pelouse = toile(1200, 800, (c) => {
    for (let i = 0; i < 12; i++) {
      c.fillStyle = i % 2 ? "#4fae6c" : "#58b875";
      c.fillRect(i * 100, 0, 100, 800);
    }
    c.strokeStyle = "rgba(255,255,255,0.92)";
    c.lineWidth = 6;
    c.strokeRect(30, 30, 1140, 740);
    c.beginPath();
    c.moveTo(600, 30);
    c.lineTo(600, 770);
    c.stroke();
    c.beginPath();
    c.arc(600, 400, 90, 0, Math.PI * 2);
    c.stroke();
    for (const [x, sens] of [[30, 1], [1170, -1]] as const) {
      c.strokeRect(Math.min(x, x + sens * 180), 180, 180, 440);
      c.strokeRect(Math.min(x, x + sens * 60), 300, 60, 200);
    }
  });
  g.add(sol(S.long, S.large, standard(0xffffff, { map: pelouse, roughness: 1 }), 0.04));
  g.add(gradinsDroits("nord", S.long + 4, S.large / 2 + S.recul, S.profondeur, 3, true));
  g.add(gradinsDroits("sud", S.long + 4, S.large / 2 + S.recul, S.profondeur, 3, true));
  g.add(gradinsDroits("est", S.large + 4, S.long / 2 + S.recul, S.profondeur, 3, true));
  g.add(gradinsDroits("ouest", S.large + 4, S.long / 2 + S.recul, S.profondeur, 3, true));
  return g;
}

// ───────────────────────── Patinoire ─────────────────────────

function patinoire(): THREE.Group {
  const g = new THREE.Group();
  const P = PATINOIRE;
  const dl = P.long / 2;
  const dp = P.large / 2;
  // Glace : lignes rouges et bleues d'une patinoire de hockey (proportions d'une piste de 60 × 26 m).
  const glace = toile(1200, 520, (c) => {
    c.fillStyle = "#f3f8fd";
    c.fillRect(0, 0, 1200, 520);
    const ligne = (x: number, couleur: string, epaisseur: number) => {
      c.fillStyle = couleur;
      c.fillRect(x - epaisseur / 2, 0, epaisseur, 520);
    };
    ligne(600, "#d8383d", 12);
    ligne(600 - 229, "#2f6fd1", 12);
    ligne(600 + 229, "#2f6fd1", 12);
    ligne(80, "#d8383d", 4);
    ligne(1120, "#d8383d", 4);
    c.lineWidth = 4;
    c.strokeStyle = "#2f6fd1";
    c.beginPath();
    c.arc(600, 260, 90, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#d8383d";
    for (const x of [200, 1000])
      for (const y of [120, 400]) {
        c.beginPath();
        c.arc(x, y, 90, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#d8383d";
        c.beginPath();
        c.arc(x, y, 7, 0, Math.PI * 2);
        c.fill();
      }
    c.fillStyle = "rgba(47,111,209,0.35)";
    for (const [x, sens] of [[80, 1], [1120, -1]] as const) {
      c.beginPath();
      c.arc(x, 260, 36, -Math.PI / 2, Math.PI / 2, sens < 0);
      c.fill();
    }
  });
  const forme = new THREE.Shape();
  rectangleArrondi(forme, dl, dp, P.coin);
  const geo = new THREE.ShapeGeometry(forme, 48);
  // Coordonnées de texture : la forme (−dl…dl, −dp…dp) sur l'image entière.
  const pos = geo.attributes.position!;
  const uv = geo.attributes.uv!;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / P.long + 0.5, pos.getY(i) / P.large + 0.5);
  const piste = maillage(geo, standard(0xffffff, { map: glace, roughness: 0.25, metalness: 0.05 }), false);
  piste.rotation.x = -Math.PI / 2;
  piste.position.y = 0.05;
  g.add(piste);
  // Bandes blanches et vitres.
  g.add(anneau((f) => rectangleArrondi(f, dl + 0.5, dp + 0.5, P.coin + 0.5), (t) => rectangleArrondi(t, dl, dp, P.coin), 1.1, standard(0xffffff, { roughness: 0.5 })));
  g.add(anneau((f) => rectangleArrondi(f, dl + 0.5, dp + 0.5, P.coin + 0.5), (t) => rectangleArrondi(t, dl + 0.35, dp + 0.35, P.coin + 0.35), 2, new THREE.MeshStandardMaterial({ color: 0xcfe3f7, transparent: true, opacity: 0.35, roughness: 0.1 }), 1.1));
  // Buts.
  for (const x of [-dl + 4, dl - 4]) {
    const but = maillage(new THREE.BoxGeometry(1.2, 1.2, 1.8), standard(0xd8383d, { roughness: 0.5 }));
    but.position.set(x + Math.sign(x) * 0.6, 0.6, 0);
    g.add(but);
  }
  // Gradins tout autour, en trois rangs.
  const rang = P.profondeur / 3;
  for (let i = 0; i < 3; i++) {
    const a = P.couloir + i * rang;
    const b = a + rang;
    g.add(anneau((f) => rectangleArrondi(f, dl + b, dp + b, P.coin + b), (t) => rectangleArrondi(t, dl + a, dp + a, P.coin + a), 1.2 + i * 1.5, standard(i % 2 ? SIEGE : GRADIN)));
  }
  return g;
}

// ───────────────────────── Arène ronde ─────────────────────────

function arene(): THREE.Group {
  const g = new THREE.Group();
  const A = ARENE;
  // Parquet et terrain de basket (28 × 15 m), raquettes aux couleurs de l'application.
  const parquet = toile(1024, 1024, (c) => {
    c.fillStyle = "#e9c895";
    c.fillRect(0, 0, 1024, 1024);
    c.strokeStyle = "rgba(160,110,50,0.18)";
    c.lineWidth = 2;
    for (let y = 0; y < 1024; y += 22) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(1024, y);
      c.stroke();
    }
    const l = 680;
    const h = 364;
    const x0 = 512 - l / 2;
    const y0 = 512 - h / 2;
    c.fillStyle = "rgba(77,4,244,0.75)";
    c.fillRect(x0, 512 - 59, 140, 118);
    c.fillRect(x0 + l - 140, 512 - 59, 140, 118);
    c.strokeStyle = "#ffffff";
    c.lineWidth = 5;
    c.strokeRect(x0, y0, l, h);
    c.beginPath();
    c.moveTo(512, y0);
    c.lineTo(512, y0 + h);
    c.stroke();
    c.beginPath();
    c.arc(512, 512, 44, 0, Math.PI * 2);
    c.stroke();
    for (const [x, sens] of [[x0 + 39, 1], [x0 + l - 39, -1]] as const) {
      c.beginPath();
      c.arc(x, 512, 165, -Math.PI / 2, Math.PI / 2, sens < 0);
      c.stroke();
    }
  });
  const disque = maillage(new THREE.CircleGeometry(A.rayon, 96), standard(0xffffff, { map: parquet, roughness: 0.6 }), false);
  disque.rotation.x = -Math.PI / 2;
  disque.position.y = 0.04;
  g.add(disque);
  const rang = A.profondeur / 3;
  for (let i = 0; i < 3; i++) {
    const a = A.rayon + A.couloir + i * rang;
    const b = a + rang;
    g.add(anneau((f) => f.absarc(0, 0, b, 0, Math.PI * 2, false), (t) => t.absarc(0, 0, a, 0, Math.PI * 2, true), 1.2 + i * 1.6, standard(i % 2 ? SIEGE : GRADIN)));
  }
  // Tableau d'affichage suspendu au-dessus du parquet.
  const cube = maillage(new THREE.BoxGeometry(5, 3, 5), standard(0xffffff, { roughness: 0.4, emissive: 0x4d04f4, emissiveIntensity: 0.12 }));
  cube.position.y = 15;
  g.add(cube);
  return g;
}

// ───────────────────────── Salle de spectacle ─────────────────────────

function salle(): THREE.Group {
  const g = new THREE.Group();
  const S = SALLE;
  g.add(sol(S.long, S.large, standard(0xd6cfe8, { roughness: 1 }), 0.03));
  const devant = -S.large / 2;
  // Scène, écran et enceintes au nord.
  const scene = maillage(new THREE.BoxGeometry(S.long - 8, 1.6, S.scene), standard(0x2b2540, { roughness: 0.7 }));
  scene.position.set(0, 0.8, devant - S.scene / 2);
  g.add(scene);
  const ecran = toile(512, 160, (c) => {
    const d = c.createLinearGradient(0, 0, 512, 160);
    d.addColorStop(0, "#4d04f4");
    d.addColorStop(1, "#ff5fa2");
    c.fillStyle = d;
    c.fillRect(0, 0, 512, 160);
  });
  const panneau = maillage(new THREE.BoxGeometry(S.long - 16, 9, 0.5), standard(0xffffff, { map: ecran, emissive: 0xffffff, emissiveMap: ecran, emissiveIntensity: 0.6 }));
  panneau.position.set(0, 7.2, devant - S.scene + 0.6);
  g.add(panneau);
  for (const x of [-(S.long / 2 - 6), S.long / 2 - 6]) {
    const enceinte = maillage(new THREE.BoxGeometry(3, 6, 2.5), standard(0x2b2540, { roughness: 0.6 }));
    enceinte.position.set(x, 4.6, devant - 2);
    g.add(enceinte);
  }
  const portique = maillage(new THREE.BoxGeometry(S.long - 6, 0.5, 0.5), standard(0xbdb7cc, { roughness: 0.5 }));
  portique.position.set(0, 12.5, devant - 2);
  g.add(portique);
  const barriere = maillage(new THREE.BoxGeometry(S.long - 10, 1, 0.3), standard(0xffffff, { roughness: 0.5 }));
  barriere.position.set(0, 0.5, devant + 2.5);
  g.add(barriere);
  // Gradins à l'est, au sud et à l'ouest.
  g.add(gradinsDroits("sud", S.long + 4, S.large / 2 + S.recul, S.profondeur, 3, false));
  g.add(gradinsDroits("est", S.large + 4, S.long / 2 + S.recul, S.profondeur, 3, false));
  g.add(gradinsDroits("ouest", S.large + 4, S.long / 2 + S.recul, S.profondeur, 3, false));
  return g;
}

const CONSTRUCTEURS: Record<ModeleLieu, () => THREE.Group> = { stade, patinoire, arene, salle };

/** Le décor d'un lieu, et de quoi libérer sa mémoire (géométries, matières, textures) quand on en change. */
export function construireDecor(modele: ModeleLieu): { groupe: THREE.Group; jeter(): void } {
  const groupe = CONSTRUCTEURS[modele]();
  return {
    groupe,
    jeter() {
      groupe.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          (m as THREE.MeshStandardMaterial).emissiveMap?.dispose();
          m.dispose();
        }
      });
    },
  };
}
