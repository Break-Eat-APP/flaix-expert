import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { CouleurStand, EtatStand, Tribune } from "@flaix/domain";

/**
 * Le stade en 3D (dossier §15.162) : terrain, quatre tribunes et, derrière chacune, ses buvettes, toit et pastille à la
 * couleur de leur état. On tourne et zoome au doigt ou à la souris ; un clic sur une buvette (ou son nom) la choisit.
 * Chargé à part (three.js) : la page s'affiche avant lui.
 */

export const COULEURS_STADE: Record<CouleurStand, string> = { vert: "#0ba678", orange: "#f59f00", rouge: "#e5484d", gris: "#b8b3c7" };

// Terrain 60 × 40 au centre ; tribunes Nord et Sud le long du terrain, Est et Ouest derrière les buts.
const TERRAIN = { long: 60, large: 40 };
const RECUL = 3; // entre le terrain et la première marche
const PROFONDEUR = 13; // trois rangs de gradins
const ALLEE = 7; // entre le haut de la tribune et les buvettes

interface Cote {
  /** Direction vers l'extérieur. */
  nx: number;
  nz: number;
  /** Longueur de la tribune. */
  longueur: number;
  /** Distance du centre au pied de la tribune. */
  pied: number;
}
const COTES: Record<Tribune, Cote> = {
  nord: { nx: 0, nz: -1, longueur: TERRAIN.long + 4, pied: TERRAIN.large / 2 + RECUL },
  sud: { nx: 0, nz: 1, longueur: TERRAIN.long + 4, pied: TERRAIN.large / 2 + RECUL },
  est: { nx: 1, nz: 0, longueur: TERRAIN.large + 4, pied: TERRAIN.long / 2 + RECUL },
  ouest: { nx: -1, nz: 0, longueur: TERRAIN.large + 4, pied: TERRAIN.long / 2 + RECUL },
};
const NOMS_TRIBUNES: Record<Tribune, string> = { nord: "Nord", est: "Est", sud: "Sud", ouest: "Ouest" };

/** Position d'une buvette : derrière sa tribune, les buvettes d'une même tribune réparties sur sa longueur. */
function positionBuvette(s: EtatStand): THREE.Vector3 {
  const c = COTES[s.tribune];
  const distance = c.pied + PROFONDEUR + ALLEE;
  const utile = c.longueur - 8;
  const le_long = -utile / 2 + ((s.rang + 0.5) * utile) / Math.max(1, s.surTribune);
  // Le long de la tribune : x pour Nord/Sud, z pour Est/Ouest.
  return c.nz !== 0 ? new THREE.Vector3(le_long, 0, c.nz * distance) : new THREE.Vector3(c.nx * distance, 0, le_long);
}

function textureTerrain(): THREE.CanvasTexture {
  const l = 1200;
  const h = 800;
  const toile = document.createElement("canvas");
  toile.width = l;
  toile.height = h;
  const g = toile.getContext("2d")!;
  for (let i = 0; i < 12; i++) {
    g.fillStyle = i % 2 ? "#4fae6c" : "#58b875";
    g.fillRect((i * l) / 12, 0, l / 12, h);
  }
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = 6;
  const m = 30;
  g.strokeRect(m, m, l - 2 * m, h - 2 * m);
  g.beginPath();
  g.moveTo(l / 2, m);
  g.lineTo(l / 2, h - m);
  g.stroke();
  g.beginPath();
  g.arc(l / 2, h / 2, 90, 0, Math.PI * 2);
  g.stroke();
  for (const cote of [0, 1]) {
    const x = cote ? l - m : m;
    const sens = cote ? -1 : 1;
    g.strokeRect(Math.min(x, x + sens * 180), h / 2 - 220, 180, 440);
    g.strokeRect(Math.min(x, x + sens * 60), h / 2 - 100, 60, 200);
  }
  const t = new THREE.CanvasTexture(toile);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Trois rangs de gradins, du terrain vers l'extérieur, plus un toit léger. */
function tribune(code: Tribune, matieres: { gradin: THREE.Material; siege: THREE.Material; toit: THREE.Material }): THREE.Group {
  const c = COTES[code];
  const groupe = new THREE.Group();
  const rang = PROFONDEUR / 3;
  for (let i = 0; i < 3; i++) {
    const hauteur = 1.4 + i * 1.6;
    const boite = new THREE.Mesh(new THREE.BoxGeometry(c.longueur - i * 1.5, hauteur, rang), i % 2 ? matieres.siege : matieres.gradin);
    boite.position.set(0, hauteur / 2, c.pied + rang * (i + 0.5));
    boite.castShadow = true;
    boite.receiveShadow = true;
    groupe.add(boite);
  }
  const toit = new THREE.Mesh(new THREE.BoxGeometry(c.longueur - 2, 0.35, PROFONDEUR * 0.75), matieres.toit);
  toit.position.set(0, 8.2, c.pied + PROFONDEUR * 0.62);
  toit.rotation.x = -0.12;
  toit.castShadow = true;
  groupe.add(toit);
  for (const x of [-c.longueur / 2 + 3, 0, c.longueur / 2 - 3]) {
    const pilier = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 8, 8), matieres.gradin);
    pilier.position.set(x, 4, c.pied + PROFONDEUR - 0.6);
    groupe.add(pilier);
  }
  // Construit côté « +z », puis tourné vers son côté.
  groupe.rotation.y = Math.atan2(c.nx, c.nz);
  return groupe;
}

interface Buvette {
  groupe: THREE.Group;
  toit: THREE.MeshStandardMaterial;
  pastille: THREE.MeshStandardMaterial;
  pastilleMesh: THREE.Mesh;
  onde: THREE.Mesh;
  ondeMatiere: THREE.MeshBasicMaterial;
  socle: THREE.Mesh;
  etiquette: HTMLButtonElement;
  couleur: CouleurStand;
}

interface Monde {
  majStands(stands: readonly EtatStand[]): void;
  majSelection(id: string | null): void;
  detruire(): void;
}

function creerMonde(conteneur: HTMLDivElement, choisir: (id: string) => void): Monde {
  const largeur = () => Math.max(1, conteneur.clientWidth);
  const hauteur = () => Math.max(1, conteneur.clientHeight);
  const rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendu.setSize(largeur(), hauteur());
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFSoftShadowMap;
  rendu.setClearColor(0x000000, 0);
  conteneur.appendChild(rendu.domElement);
  const etiquettes = new CSS2DRenderer();
  etiquettes.setSize(largeur(), hauteur());
  etiquettes.domElement.className = "stade-etiquettes";
  conteneur.appendChild(etiquettes.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, largeur() / hauteur(), 1, 800);
  camera.position.set(0, 112, 128);
  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.rotateSpeed = 0.6;
  controles.minDistance = 70;
  controles.maxDistance = 260;
  controles.minPolarAngle = 0.12 * Math.PI;
  controles.maxPolarAngle = 0.42 * Math.PI;
  controles.target.set(0, 0, 0);
  controles.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2ee, 2.1));
  const soleil = new THREE.DirectionalLight(0xffffff, 2.2);
  soleil.position.set(-60, 120, 70);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 10, far: 400 });
  soleil.shadow.bias = -0.0005;
  scene.add(soleil);

  const aJeter: { dispose(): void }[] = [];
  const matiere = <M extends THREE.Material>(m: M) => (aJeter.push(m), m);

  // Esplanade claire, bord du terrain, terrain.
  const esplanade = new THREE.Mesh(new THREE.CircleGeometry(118, 96), matiere(new THREE.MeshStandardMaterial({ color: 0xece8f6, roughness: 1 })));
  esplanade.rotation.x = -Math.PI / 2;
  esplanade.receiveShadow = true;
  scene.add(esplanade);
  const bord = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN.long + 2 * RECUL, TERRAIN.large + 2 * RECUL), matiere(new THREE.MeshStandardMaterial({ color: 0x3f9a5c, roughness: 1 })));
  bord.rotation.x = -Math.PI / 2;
  bord.position.y = 0.02;
  bord.receiveShadow = true;
  scene.add(bord);
  const texture = textureTerrain();
  aJeter.push(texture);
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(TERRAIN.long, TERRAIN.large), matiere(new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })));
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0.04;
  terrain.receiveShadow = true;
  scene.add(terrain);

  const matieres = {
    gradin: matiere(new THREE.MeshStandardMaterial({ color: 0xf7f5fc, roughness: 0.9 })),
    siege: matiere(new THREE.MeshStandardMaterial({ color: 0xd9cefb, roughness: 0.9 })),
    toit: matiere(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.82 })),
  };
  for (const code of Object.keys(COTES) as Tribune[]) {
    scene.add(tribune(code, matieres));
    const nom = document.createElement("div");
    nom.className = "stade-tribune";
    nom.textContent = `Tribune ${NOMS_TRIBUNES[code]}`;
    const objet = new CSS2DObject(nom);
    const c = COTES[code];
    objet.position.set(c.nx * (c.pied + PROFONDEUR / 2), 10.5, c.nz * (c.pied + PROFONDEUR / 2));
    scene.add(objet);
  }

  // Buvettes : rebâties quand la liste ou les places changent, recolorées à chaque mise à jour.
  const geo = {
    corps: new THREE.BoxGeometry(6, 3.2, 4.4),
    toit: new THREE.BoxGeometry(7.2, 0.7, 5.6),
    comptoir: new THREE.BoxGeometry(6.2, 0.5, 0.9),
    pastille: new THREE.SphereGeometry(1.15, 24, 16),
    tige: new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6),
    onde: new THREE.RingGeometry(3.8, 5, 48),
    socle: new THREE.RingGeometry(5.6, 6.6, 48),
  };
  aJeter.push(...Object.values(geo));
  const blanc = matiere(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
  const violet = matiere(new THREE.MeshBasicMaterial({ color: 0x4d04f4, side: THREE.DoubleSide }));
  const buvettes = new Map<string, Buvette>();
  let empreinte = "";
  let selection: string | null = null;

  function viderBuvettes() {
    for (const b of buvettes.values()) {
      scene.remove(b.groupe);
      b.toit.dispose();
      b.pastille.dispose();
      b.ondeMatiere.dispose();
      b.groupe.traverse((o) => {
        if (o instanceof CSS2DObject) o.element.remove();
      });
    }
    buvettes.clear();
  }

  function batir(stands: readonly EtatStand[]) {
    viderBuvettes();
    for (const s of stands) {
      const groupe = new THREE.Group();
      groupe.position.copy(positionBuvette(s));
      const c = COTES[s.tribune];
      // Le comptoir regarde la tribune.
      groupe.rotation.y = Math.atan2(-c.nx, -c.nz);
      const corps = new THREE.Mesh(geo.corps, blanc);
      corps.position.y = 1.6;
      const toitMatiere = new THREE.MeshStandardMaterial({ color: COULEURS_STADE[s.couleur], roughness: 0.55 });
      const toit = new THREE.Mesh(geo.toit, toitMatiere);
      toit.position.y = 3.55;
      const comptoir = new THREE.Mesh(geo.comptoir, blanc);
      comptoir.position.set(0, 1.25, 2.6);
      const tige = new THREE.Mesh(geo.tige, blanc);
      tige.position.y = 5.5;
      const pastilleMatiere = new THREE.MeshStandardMaterial({ color: COULEURS_STADE[s.couleur], roughness: 0.35, emissive: COULEURS_STADE[s.couleur], emissiveIntensity: 0.25 });
      const pastille = new THREE.Mesh(geo.pastille, pastilleMatiere);
      pastille.position.y = 7.6;
      const ondeMatiere = new THREE.MeshBasicMaterial({ color: COULEURS_STADE.rouge, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      const onde = new THREE.Mesh(geo.onde, ondeMatiere);
      onde.rotation.x = -Math.PI / 2;
      onde.position.y = 0.08;
      const socle = new THREE.Mesh(geo.socle, violet);
      socle.rotation.x = -Math.PI / 2;
      socle.position.y = 0.06;
      socle.visible = false;
      for (const m of [corps, toit, comptoir, tige, pastille]) {
        m.castShadow = true;
        m.userData.standId = s.id;
      }
      groupe.add(corps, toit, comptoir, tige, pastille, onde, socle);

      const etiquette = document.createElement("button");
      etiquette.type = "button";
      etiquette.className = "stade-etiquette";
      etiquette.addEventListener("click", () => choisir(s.id));
      const objet = new CSS2DObject(etiquette);
      objet.position.set(0, 10.2, 0);
      groupe.add(objet);
      scene.add(groupe);
      buvettes.set(s.id, { groupe, toit: toitMatiere, pastille: pastilleMatiere, pastilleMesh: pastille, onde, ondeMatiere, socle, etiquette, couleur: s.couleur });
    }
  }

  function majStands(stands: readonly EtatStand[]) {
    const e = stands.map((s) => `${s.id}:${s.tribune}:${s.rang}:${s.surTribune}`).join("|");
    if (e !== empreinte) {
      empreinte = e;
      batir(stands);
    }
    for (const s of stands) {
      const b = buvettes.get(s.id)!;
      b.couleur = s.couleur;
      b.toit.color.set(COULEURS_STADE[s.couleur]);
      b.pastille.color.set(COULEURS_STADE[s.couleur]);
      b.pastille.emissive.set(COULEURS_STADE[s.couleur]);
      b.etiquette.innerHTML = "";
      const point = document.createElement("span");
      point.className = "stade-point";
      point.style.background = COULEURS_STADE[s.couleur];
      b.etiquette.append(point, document.createTextNode(s.nom));
      b.etiquette.setAttribute("aria-label", `${s.nom} : ${s.resume}`);
    }
    majSelection(selection);
  }

  function majSelection(id: string | null) {
    selection = id;
    for (const [sid, b] of buvettes) {
      const choisie = sid === id;
      b.socle.visible = choisie;
      b.groupe.scale.setScalar(choisie ? 1.18 : 1);
      b.etiquette.classList.toggle("choisie", choisie);
    }
  }

  // Un clic (sans glisser) sur une buvette la choisit.
  const rayon = new THREE.Raycaster();
  let appui: { x: number; y: number } | null = null;
  const surAppui = (e: PointerEvent) => (appui = { x: e.clientX, y: e.clientY });
  const surRelache = (e: PointerEvent) => {
    if (!appui || Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 6) return;
    const r = rendu.domElement.getBoundingClientRect();
    rayon.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const touche = rayon.intersectObjects([...buvettes.values()].map((b) => b.groupe), true).find((i) => i.object.userData.standId);
    if (touche) choisir(touche.object.userData.standId as string);
  };
  const surSurvol = (e: PointerEvent) => {
    if (e.buttons) return;
    const r = rendu.domElement.getBoundingClientRect();
    rayon.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const touche = rayon.intersectObjects([...buvettes.values()].map((b) => b.groupe), true).some((i) => i.object.userData.standId);
    rendu.domElement.style.cursor = touche ? "pointer" : "grab";
  };
  rendu.domElement.addEventListener("pointerdown", surAppui);
  rendu.domElement.addEventListener("pointerup", surRelache);
  rendu.domElement.addEventListener("pointermove", surSurvol);

  const redimension = new ResizeObserver(() => {
    camera.aspect = largeur() / hauteur();
    camera.updateProjectionMatrix();
    rendu.setSize(largeur(), hauteur());
    etiquettes.setSize(largeur(), hauteur());
  });
  redimension.observe(conteneur);

  // Les stands en rouge battent doucement : une onde au sol et la pastille qui respire.
  const horloge = new THREE.Clock();
  rendu.setAnimationLoop(() => {
    const t = horloge.getElapsedTime();
    for (const b of buvettes.values()) {
      const rouge = b.couleur === "rouge";
      const phase = (t % 1.6) / 1.6;
      b.onde.visible = rouge;
      if (rouge) {
        b.onde.scale.setScalar(1 + phase * 1.4);
        b.ondeMatiere.opacity = 0.55 * (1 - phase);
      }
      b.pastilleMesh.scale.setScalar(rouge ? 1 + 0.18 * Math.sin(t * 5) : 1);
    }
    controles.update();
    rendu.render(scene, camera);
    etiquettes.render(scene, camera);
  });

  return {
    majStands,
    majSelection,
    detruire() {
      rendu.setAnimationLoop(null);
      redimension.disconnect();
      rendu.domElement.removeEventListener("pointerdown", surAppui);
      rendu.domElement.removeEventListener("pointerup", surRelache);
      rendu.domElement.removeEventListener("pointermove", surSurvol);
      controles.dispose();
      viderBuvettes();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const x of aJeter) x.dispose();
      rendu.dispose();
      rendu.domElement.remove();
      etiquettes.domElement.remove();
    },
  };
}

export function Stade3D({ stands, selection, onChoisir }: { stands: readonly EtatStand[]; selection: string | null; onChoisir: (id: string) => void }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const monde = useRef<Monde | null>(null);
  const choisir = useRef(onChoisir);
  choisir.current = onChoisir;
  const [indisponible, setIndisponible] = useState(false);

  useEffect(() => {
    try {
      monde.current = creerMonde(conteneur.current!, (id) => choisir.current(id));
    } catch {
      setIndisponible(true);
    }
    return () => {
      monde.current?.detruire();
      monde.current = null;
    };
  }, []);
  useEffect(() => monde.current?.majStands(stands), [stands]);
  useEffect(() => monde.current?.majSelection(selection), [selection]);

  return (
    <div ref={conteneur} className="stade-3d">
      {indisponible && <p className="stade-indisponible">La 3D n'est pas disponible sur cet appareil : les stands sont listés à côté.</p>}
    </div>
  );
}
