import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { CouleurStand, EtatStand, ModeleLieu, PositionPlan, Tribune } from "@flaix/domain";
import { construireDecor } from "./decors3d.ts";
import { GEOMETRIES, borner, placeStand, versLeCentre } from "./modeles-plan.ts";

/**
 * Le lieu en 3D (dossier §15.162, §15.164) : le décor choisi (stade, patinoire, arène, salle) et ses buvettes, toit et
 * pastille à la couleur de leur état. On tourne et zoome au doigt ou à la souris ; un clic sur une buvette (ou son nom)
 * la choisit. En mode « Placer les stands », on attrape une buvette et on la pose où l'on veut sur l'esplanade.
 * Chargé à part (three.js) : la page s'affiche avant lui.
 */

export const COULEURS_STADE: Record<CouleurStand, string> = { vert: "#0ba678", orange: "#f59f00", rouge: "#e5484d", gris: "#b8b3c7" };

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

interface Rappels {
  choisir(id: string): void;
  deplacer(id: string, p: PositionPlan): void;
}

interface Monde {
  majModele(modele: ModeleLieu): void;
  majStands(stands: readonly EtatStand[]): void;
  majSelection(id: string | null): void;
  majEdition(edition: boolean): void;
  detruire(): void;
}

function creerMonde(conteneur: HTMLDivElement, rappels: Rappels): Monde {
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
  const camera = new THREE.PerspectiveCamera(34, largeur() / hauteur(), 1, 900);
  camera.position.set(0, 86, 80);
  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.rotateSpeed = 0.6;
  controles.minPolarAngle = 0.12 * Math.PI;
  controles.maxPolarAngle = 0.42 * Math.PI;
  controles.target.set(0, 0, 0);

  let modele: ModeleLieu = "stade";
  /** Recule ou avance la caméra (même direction) pour que le lieu et ses buvettes tiennent dans le cadre. */
  function cadrer() {
    const g = GEOMETRIES[modele];
    const demiV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const demiH = demiV * camera.aspect;
    // Cadre étroit (téléphone) : les étiquettes ne gardent que leur pastille (le nom pour la buvette choisie).
    const etroit = largeur() < 560;
    conteneur.classList.toggle("stade-etroit", etroit);
    // Marge en pixels pour les étiquettes des buvettes du bord.
    const utileH = 1 - Math.min(0.45, (etroit ? 30 : 150) / largeur());
    const utileV = 1 - Math.min(0.3, 50 / hauteur());
    const distance = Math.max(g.demiLargeur / (demiH * utileH), g.demiProfondeur / (demiV * utileV));
    // Zoom permis autour du cadrage : jusqu'à trois fois plus près, deux fois plus loin.
    controles.minDistance = distance / 3;
    controles.maxDistance = distance * 2;
    const direction = camera.position.clone().sub(controles.target).setLength(distance);
    camera.position.copy(controles.target).add(direction);
    controles.update();
  }

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2ee, 2.1));
  const soleil = new THREE.DirectionalLight(0xffffff, 2.2);
  soleil.position.set(-60, 120, 70);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -115, right: 115, top: 115, bottom: -115, near: 10, far: 400 });
  soleil.shadow.bias = -0.0005;
  scene.add(soleil);

  const aJeter: { dispose(): void }[] = [];
  const matiere = <M extends THREE.Material>(m: M) => (aJeter.push(m), m);

  // Esplanade claire commune à tous les décors.
  const esplanade = new THREE.Mesh(new THREE.CircleGeometry(118, 96), matiere(new THREE.MeshStandardMaterial({ color: 0xece8f6, roughness: 1 })));
  esplanade.rotation.x = -Math.PI / 2;
  esplanade.receiveShadow = true;
  scene.add(esplanade);

  // Décor : rebâti quand le lieu change de type ; noms des côtés au bord de l'aire de jeu.
  let decor: { groupe: THREE.Group; jeter(): void } | null = null;
  const nomsCotes: CSS2DObject[] = [];
  function majModele(m: ModeleLieu) {
    if (decor && m === modele) return;
    modele = m;
    if (decor) {
      scene.remove(decor.groupe);
      decor.jeter();
    }
    decor = construireDecor(m);
    scene.add(decor.groupe);
    for (const o of nomsCotes.splice(0)) {
      scene.remove(o);
      o.element.remove();
    }
    for (const cote of ["nord", "est", "sud", "ouest"] as Tribune[]) {
      const nom = document.createElement("div");
      nom.className = "stade-tribune";
      nom.textContent = GEOMETRIES[m].cotes[cote];
      const objet = new CSS2DObject(nom);
      const p = GEOMETRIES[m].etiquetteCote(cote);
      objet.position.set(p.x, 0.4, p.z);
      scene.add(objet);
      nomsCotes.push(objet);
    }
    cadrer();
    if (derniers) placer(derniers);
  }

  // Buvettes : rebâties quand la liste change, replacées et recolorées à chaque mise à jour.
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
  let edition = false;
  let derniers: readonly EtatStand[] | null = null;
  /** Buvette en train d'être déplacée : sa position suit le doigt, la mise à jour des données ne la replace pas. */
  let saisie: { id: string; depart: { x: number; y: number }; bouge: boolean } | null = null;

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
      groupe.userData.echelle = 1.35;
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
      etiquette.addEventListener("pointerdown", (e) => saisir(s.id, e));
      etiquette.addEventListener("click", () => {
        if (!edition) rappels.choisir(s.id);
      });
      const objet = new CSS2DObject(etiquette);
      objet.position.set(0, 10.2, 0);
      groupe.add(objet);
      scene.add(groupe);
      buvettes.set(s.id, { groupe, toit: toitMatiere, pastille: pastilleMatiere, pastilleMesh: pastille, onde, ondeMatiere, socle, etiquette, couleur: s.couleur });
    }
  }

  function poser(b: Buvette, p: PositionPlan) {
    b.groupe.position.set(p.x, 0, p.z);
    // Le comptoir regarde le centre du lieu.
    b.groupe.rotation.y = versLeCentre(p);
  }

  function placer(stands: readonly EtatStand[]) {
    for (const s of stands) if (saisie?.id !== s.id) poser(buvettes.get(s.id)!, placeStand(modele, s));
  }

  function majStands(stands: readonly EtatStand[]) {
    derniers = stands;
    const e = stands.map((s) => s.id).join("|");
    if (e !== empreinte) {
      empreinte = e;
      batir(stands);
    }
    placer(stands);
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
      const nom = document.createElement("span");
      nom.className = "stade-nom";
      nom.textContent = s.nom;
      // Pendant l'événement, les petits chiffres du stand sous son nom, et le nombre d'alertes (§15.167).
      const texte = document.createElement("span");
      texte.className = "stade-texte";
      texte.append(nom);
      if (s.chiffres.caNet > 0 || s.chiffres.caissesOuvertes > 0) {
        const mini = document.createElement("span");
        mini.className = "stade-mini";
        mini.textContent = `${Math.round(s.chiffres.caNet / 100).toLocaleString("fr-FR")} € · ${s.chiffres.tickets} tickets`;
        texte.append(mini);
      }
      b.etiquette.append(point, texte);
      if (s.signaux.length) {
        const n = document.createElement("span");
        n.className = `stade-alertes ${s.signaux.some((x) => x.couleur === "rouge") ? "rouge" : "orange"}`;
        n.textContent = String(s.signaux.length);
        b.etiquette.append(n);
      }
      b.etiquette.setAttribute("aria-label", `${s.nom} : ${s.resume}`);
    }
    majSelection(selection);
  }

  function majSelection(id: string | null) {
    selection = id;
    for (const [sid, b] of buvettes) {
      const choisie = sid === id;
      b.socle.visible = choisie;
      b.groupe.scale.setScalar((b.groupe.userData.echelle as number) * (choisie ? 1.18 : 1));
      b.etiquette.classList.toggle("choisie", choisie);
    }
  }

  function majEdition(e: boolean) {
    edition = e;
    conteneur.classList.toggle("stade-edition", e);
    rendu.domElement.style.cursor = e ? "grab" : "";
  }

  // ── Pointeur : un clic choisit une buvette ; en mode édition, un glisser la déplace sur l'esplanade. ──
  const rayon = new THREE.Raycaster();
  const solPlan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function viser(e: PointerEvent) {
    const r = rendu.domElement.getBoundingClientRect();
    rayon.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  }
  function buvetteSous(e: PointerEvent): string | null {
    viser(e);
    const touche = rayon.intersectObjects([...buvettes.values()].map((b) => b.groupe), true).find((i) => i.object.userData.standId);
    return touche ? (touche.object.userData.standId as string) : null;
  }
  function pointAuSol(e: PointerEvent): PositionPlan | null {
    viser(e);
    const p = rayon.ray.intersectPlane(solPlan, new THREE.Vector3());
    return p ? borner({ x: p.x, z: p.z }) : null;
  }

  function saisir(id: string, e: PointerEvent) {
    if (!edition) return;
    e.preventDefault();
    saisie = { id, depart: { x: e.clientX, y: e.clientY }, bouge: false };
    controles.enabled = false;
    window.addEventListener("pointermove", glisser);
    window.addEventListener("pointerup", lacher);
    window.addEventListener("pointercancel", lacher);
  }
  function glisser(e: PointerEvent) {
    if (!saisie) return;
    if (!saisie.bouge && Math.hypot(e.clientX - saisie.depart.x, e.clientY - saisie.depart.y) < 5) return;
    saisie.bouge = true;
    rendu.domElement.style.cursor = "grabbing";
    const p = pointAuSol(e);
    if (p) poser(buvettes.get(saisie.id)!, p);
  }
  function lacher(e: PointerEvent) {
    window.removeEventListener("pointermove", glisser);
    window.removeEventListener("pointerup", lacher);
    window.removeEventListener("pointercancel", lacher);
    controles.enabled = true;
    rendu.domElement.style.cursor = edition ? "grab" : "";
    const s = saisie;
    saisie = null;
    if (!s) return;
    if (!s.bouge) return rappels.choisir(s.id);
    const p = pointAuSol(e);
    const g = buvettes.get(s.id)?.groupe;
    rappels.deplacer(s.id, p ?? { x: g?.position.x ?? 0, z: g?.position.z ?? 0 });
  }

  let appui: { x: number; y: number } | null = null;
  const surAppui = (e: PointerEvent) => {
    appui = { x: e.clientX, y: e.clientY };
    const id = edition ? buvetteSous(e) : null;
    if (id) saisir(id, e);
  };
  const surRelache = (e: PointerEvent) => {
    if (edition || !appui || Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 6) return;
    const id = buvetteSous(e);
    if (id) rappels.choisir(id);
  };
  const surSurvol = (e: PointerEvent) => {
    if (e.buttons || saisie) return;
    rendu.domElement.style.cursor = buvetteSous(e) ? (edition ? "grab" : "pointer") : edition ? "default" : "grab";
  };
  // En capture : la saisie d'une buvette passe avant la rotation de la caméra.
  rendu.domElement.addEventListener("pointerdown", surAppui, { capture: true });
  rendu.domElement.addEventListener("pointerup", surRelache);
  rendu.domElement.addEventListener("pointermove", surSurvol);

  const redimension = new ResizeObserver(() => {
    camera.aspect = largeur() / hauteur();
    camera.updateProjectionMatrix();
    rendu.setSize(largeur(), hauteur());
    etiquettes.setSize(largeur(), hauteur());
    cadrer();
  });
  redimension.observe(conteneur);

  // Les stands en rouge battent doucement : une onde au sol et la pastille qui respire.
  const depart = performance.now();
  rendu.setAnimationLoop(() => {
    const t = (performance.now() - depart) / 1000;
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
    majModele,
    majStands,
    majSelection,
    majEdition,
    detruire() {
      rendu.setAnimationLoop(null);
      redimension.disconnect();
      window.removeEventListener("pointermove", glisser);
      window.removeEventListener("pointerup", lacher);
      window.removeEventListener("pointercancel", lacher);
      rendu.domElement.removeEventListener("pointerdown", surAppui, { capture: true });
      rendu.domElement.removeEventListener("pointerup", surRelache);
      rendu.domElement.removeEventListener("pointermove", surSurvol);
      controles.dispose();
      viderBuvettes();
      decor?.jeter();
      esplanade.geometry.dispose();
      for (const x of aJeter) x.dispose();
      rendu.dispose();
      rendu.domElement.remove();
      etiquettes.domElement.remove();
    },
  };
}

export function Stade3D({
  modele,
  stands,
  selection,
  edition = false,
  onChoisir,
  onDeplacer,
}: {
  modele: ModeleLieu;
  stands: readonly EtatStand[];
  selection: string | null;
  edition?: boolean;
  onChoisir: (id: string) => void;
  onDeplacer?: (id: string, p: PositionPlan) => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const monde = useRef<Monde | null>(null);
  const rappels = useRef<Rappels>({ choisir: onChoisir, deplacer: () => undefined });
  rappels.current = { choisir: onChoisir, deplacer: onDeplacer ?? (() => undefined) };
  const [indisponible, setIndisponible] = useState(false);

  useEffect(() => {
    try {
      monde.current = creerMonde(conteneur.current!, { choisir: (id) => rappels.current.choisir(id), deplacer: (id, p) => rappels.current.deplacer(id, p) });
    } catch {
      setIndisponible(true);
    }
    return () => {
      monde.current?.detruire();
      monde.current = null;
    };
  }, []);
  useEffect(() => monde.current?.majModele(modele), [modele]);
  useEffect(() => monde.current?.majStands(stands), [stands]);
  useEffect(() => monde.current?.majSelection(selection), [selection]);
  useEffect(() => monde.current?.majEdition(edition), [edition]);

  return (
    <div ref={conteneur} className="stade-3d">
      {indisponible && <p className="stade-indisponible">La 3D n'est pas disponible sur cet appareil : les stands sont listés à côté.</p>}
    </div>
  );
}
