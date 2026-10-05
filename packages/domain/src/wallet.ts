/**
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §14 module 20, §15.147, design §15.148). Ce module décrit
 * le contenu et l'apparence de la carte, sans rien calculer d'autre que la réduction disponible : nom, couleurs,
 * logo et bannière du lieu (pas la marque FlaiX Expert), numéro d'abonné en QR code (le même numéro que celui saisi
 * à la caisse), solde de points lu comme le lit la caisse. La signature (Apple) et les jetons (Google) sont faits
 * par le serveur.
 */
import { formaterMontant, type Centimes } from "./argent.ts";

/** Violet neutre, quand le lieu n'a pas choisi de couleur. */
export const COULEUR_CARTE_DEFAUT = "#4d04f4";

export const couleurValide = (c: string) => /^#[0-9a-f]{6}$/.test(c);

/** « #4d04f4 » → « rgb(77, 4, 244) » (format attendu par Apple). */
export function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** Texte clair ou foncé selon la couleur de fond (contraste lisible). */
export function couleurTexte(hex: string): "#ffffff" | "#1c1730" {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1c1730" : "#ffffff";
}

// ---------- Design de la carte (§15.148) ----------

/**
 * Ce que le lieu personnalise, au-delà de la couleur de fond. Une valeur null reprend le réglage par défaut.
 * Apple et Google imposent la mise en page : seuls le logo, la bannière, les couleurs et les textes changent.
 */
export interface DesignCarte {
  /** Nom du programme (« Carte Supporter ») ; null : « Carte abonné ». */
  titre: string | null;
  /** Nom du lieu à côté du logo (Apple) ; à décocher quand le logo contient déjà le nom. */
  afficherNomLieu: boolean;
  /** Couleur du texte ; null : automatique (clair ou foncé selon le fond). */
  couleurTexte: string | null;
  /** Couleur des intitulés (« Points », « Abonné »…) ; null : celle du texte. Apple seulement. */
  couleurLibelles: string | null;
  /** Nom des points (« Spartapoints ») ; null : « Points ». */
  libellePoints: string | null;
  /** Message libre au dos de la carte (avantages, conditions). */
  message: string | null;
  /** Remise abonné du lieu (réglage de la caisse) sur la carte. */
  afficherRemise: boolean;
  /** Réduction disponible (paliers de points atteints × valeur du palier) sur la carte. */
  afficherReduction: boolean;
  siteWeb: string | null;
  telephone: string | null;
  email: string | null;
  /** Lien vers une application (par exemple la page du store), au dos de la carte. */
  lienApp: string | null;
}

export const DESIGN_CARTE_DEFAUT: DesignCarte = {
  titre: null,
  afficherNomLieu: true,
  couleurTexte: null,
  couleurLibelles: null,
  libellePoints: null,
  message: null,
  afficherRemise: true,
  afficherReduction: true,
  siteWeb: null,
  telephone: null,
  email: null,
  lienApp: null,
};

/** Longueurs maximales des textes du design (contrôlées aussi par le serveur). */
export const LIMITES_DESIGN = { titre: 40, libellePoints: 20, message: 500, lien: 300, telephone: 30, email: 200 } as const;

/** Design enregistré (JSON de la base) complété par les valeurs par défaut ; un champ illisible est ignoré. */
export function lireDesign(brut: unknown): DesignCarte {
  const d: Partial<Record<keyof DesignCarte, unknown>> = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : {};
  const texte = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null);
  const couleur = (v: unknown) => (typeof v === "string" && couleurValide(v) ? v : null);
  const bool = (v: unknown, defaut: boolean) => (typeof v === "boolean" ? v : defaut);
  return {
    titre: texte(d.titre),
    afficherNomLieu: bool(d.afficherNomLieu, DESIGN_CARTE_DEFAUT.afficherNomLieu),
    couleurTexte: couleur(d.couleurTexte),
    couleurLibelles: couleur(d.couleurLibelles),
    libellePoints: texte(d.libellePoints),
    message: texte(d.message),
    afficherRemise: bool(d.afficherRemise, DESIGN_CARTE_DEFAUT.afficherRemise),
    afficherReduction: bool(d.afficherReduction, DESIGN_CARTE_DEFAUT.afficherReduction),
    siteWeb: texte(d.siteWeb),
    telephone: texte(d.telephone),
    email: texte(d.email),
    lienApp: texte(d.lienApp),
  };
}

/** Lien https (site, application) ; rien d'autre n'est accepté sur la carte. */
export const lienValide = (s: string) => /^https:\/\/[^\s<>"']{3,}$/i.test(s) && s.length <= LIMITES_DESIGN.lien;
/** Numéro de téléphone : chiffres, espaces, « + », « . », « - », parenthèses. */
export const telephoneValide = (s: string) => /^\+?[0-9 ().-]{6,30}$/.test(s);

/** Couleurs effectives de la carte. */
export function couleursCarte(fond: string, design: DesignCarte): { fond: string; texte: string; libelles: string } {
  const texte = design.couleurTexte ?? couleurTexte(fond);
  return { fond, texte, libelles: design.couleurLibelles ?? texte };
}

export const titreCarte = (design: DesignCarte) => design.titre ?? "Carte abonné";
export const libellePointsCarte = (design: DesignCarte) => design.libellePoints ?? "Points";

/** Règle des points du lieu (Fidélité → Règles des points). */
export interface ReglesPoints {
  pointsParEuro: number;
  palierPoints: number;
  valeurPalier: Centimes;
}

/** Réduction disponible : paliers entiers atteints × valeur du palier (le reste attend le palier suivant, §15.114). */
export function reductionDisponible(points: number | null, regles: ReglesPoints | null): Centimes | null {
  if (points === null || !regles) return null;
  return Math.floor(Math.max(0, points) / regles.palierPoints) * regles.valeurPalier;
}

/** 1000 points de base → « 10 % » ; 1250 → « 12,5 % ». */
export const formaterRemise = (pb: number) => `${(pb / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** « 1 point par euro dépensé · 100 points = 5,00 € de réduction ». */
export function texteRegles(regles: ReglesPoints, libellePoints: string): string {
  const nom = libellePoints.toLowerCase();
  return `${regles.pointsParEuro} ${regles.pointsParEuro > 1 ? nom : nom.replace(/s$/, "")} par euro dépensé · ${regles.palierPoints} ${nom} = ${formaterMontant(regles.valeurPalier)} de réduction`;
}

// ---------- Images de la carte (§15.148) ----------

export type SorteImage = "logo" | "banniere";

/**
 * Une image de la carte à une taille donnée. Le directeur dépose une seule image par sorte ; l'écran la retaille à
 * toutes ces tailles (Apple : 1x, 2x, 3x ; Google : une taille), le serveur contrôle chaque fichier reçu.
 *   - « contenir » : l'image entière, sans déformation ; « exacte » : dans un cadre de la taille donnée, centrée.
 *   - « couvrir » : remplit tout le cadre, recadrée au centre (bannière).
 */
export interface VarianteImage {
  nom: string;
  sorte: SorteImage;
  largeur: number;
  hauteur: number;
  cadrage: "contenir" | "couvrir";
  /** Taille exacte ; sinon, l'image tient dans le cadre (logo Apple, plus ou moins large). */
  exacte: boolean;
  /** Marge autour de l'image (fraction du côté) et fond, pour un logo masqué en cercle (Google). */
  marge: number;
  fond: "transparent" | "blanc";
}

const variante = (
  nom: string,
  sorte: SorteImage,
  largeur: number,
  hauteur: number,
  cadrage: VarianteImage["cadrage"],
  exacte: boolean,
  marge = 0,
  fond: VarianteImage["fond"] = "transparent",
): VarianteImage => ({ nom, sorte, largeur, hauteur, cadrage, exacte, marge, fond });

export const VARIANTES_IMAGE: readonly VarianteImage[] = [
  // Apple : logo en haut à gauche (cadre 160 × 50 points), icône des notifications (29 × 29), bande sous le logo (375 × 123).
  variante("logo", "logo", 160, 50, "contenir", false),
  variante("logo@2x", "logo", 320, 100, "contenir", false),
  variante("logo@3x", "logo", 480, 150, "contenir", false),
  variante("icon", "logo", 29, 29, "contenir", true),
  variante("icon@2x", "logo", 58, 58, "contenir", true),
  variante("icon@3x", "logo", 87, 87, "contenir", true),
  // Google : logo du programme, affiché dans un cercle (660 × 660), et image principale en bas de la carte (1032 × 336).
  variante("google-logo", "logo", 660, 660, "contenir", true, 0.15, "blanc"),
  variante("strip", "banniere", 375, 123, "couvrir", true),
  variante("strip@2x", "banniere", 750, 246, "couvrir", true),
  variante("strip@3x", "banniere", 1125, 369, "couvrir", true),
  variante("google-hero", "banniere", 1032, 336, "couvrir", true),
];

export const variantesDe = (sorte: SorteImage) => VARIANTES_IMAGE.filter((x) => x.sorte === sorte);

/** Taille conseillée de l'image déposée (la plus grande variante) : en dessous, l'image sera agrandie, donc floue. */
export const TAILLE_CONSEILLEE: Record<SorteImage, { largeur: number; hauteur: number }> = { logo: { largeur: 660, hauteur: 660 }, banniere: { largeur: 1125, hauteur: 369 } };

/** Où dessiner l'image source dans une variante : taille du fichier, partie de la source prise, place dans le fichier. */
export interface Cadrage {
  largeur: number;
  hauteur: number;
  source: { x: number; y: number; l: number; h: number };
  cible: { x: number; y: number; l: number; h: number };
}

export function cadrage(srcL: number, srcH: number, x: VarianteImage): Cadrage {
  const toute = { x: 0, y: 0, l: srcL, h: srcH };
  if (x.cadrage === "couvrir") {
    const echelle = Math.max(x.largeur / srcL, x.hauteur / srcH);
    const l = x.largeur / echelle;
    const h = x.hauteur / echelle;
    return { largeur: x.largeur, hauteur: x.hauteur, source: { x: (srcL - l) / 2, y: (srcH - h) / 2, l, h }, cible: { x: 0, y: 0, l: x.largeur, h: x.hauteur } };
  }
  if (!x.exacte) {
    const echelle = Math.min(x.largeur / srcL, x.hauteur / srcH);
    const largeur = Math.min(x.largeur, Math.max(1, Math.round(srcL * echelle)));
    const hauteur = Math.min(x.hauteur, Math.max(1, Math.round(srcH * echelle)));
    return { largeur, hauteur, source: toute, cible: { x: 0, y: 0, l: largeur, h: hauteur } };
  }
  const echelle = Math.min((x.largeur * (1 - 2 * x.marge)) / srcL, (x.hauteur * (1 - 2 * x.marge)) / srcH);
  const l = srcL * echelle;
  const h = srcH * echelle;
  return { largeur: x.largeur, hauteur: x.hauteur, source: toute, cible: { x: (x.largeur - l) / 2, y: (x.hauteur - h) / 2, l, h } };
}

/** Taille d'un fichier reçu acceptable pour la variante (à un pixel près pour un logo Apple). */
export function tailleAcceptable(x: VarianteImage, largeur: number, hauteur: number): boolean {
  if (x.exacte || x.cadrage === "couvrir") return largeur === x.largeur && hauteur === x.hauteur;
  const tient = largeur >= 1 && hauteur >= 1 && largeur <= x.largeur && hauteur <= x.hauteur;
  return tient && (largeur >= x.largeur - 1 || hauteur >= x.hauteur - 1);
}

// ---------- Contenu de la carte ----------

export interface DonneesCarte {
  lieuId: string;
  lieu: string;
  couleur: string;
  design: DesignCarte;
  abonneId: string;
  nom: string;
  numero: string;
  /** Solde de points ; null si le programme de points n'est pas réglé. */
  points: number | null;
  regles: ReglesPoints | null;
  /** Remise abonné du lieu, en points de base (1000 = 10 %) ; null si elle n'est pas réglée. */
  remisePb: number | null;
}

/** Réponse de GET /api/carte/:jeton (page publique de l'abonné). */
export interface CartePublique {
  lieu: string;
  couleur: string;
  couleurTexte: string;
  couleurLibelles: string;
  titre: string;
  afficherNomLieu: boolean;
  libellePoints: string;
  nom: string;
  numero: string;
  points: number | null;
  reduction: Centimes | null;
  remise: string | null;
  /** Adresses des images déposées par le lieu (null : pas d'image). */
  logo: string | null;
  banniere: string | null;
  apple: boolean;
  google: boolean;
}

/** Réponse de GET /api/wallet : services réglés sur le serveur, design des cartes du lieu. */
export interface EtatWallet {
  apple: boolean;
  google: boolean;
  lieu: string;
  couleur: string;
  design: DesignCarte;
  /** Images déposées : adresses des aperçus Apple (logo@3x, strip@3x) et Google, avec leur version. */
  images: Record<SorteImage, { apple: string; google: string } | null>;
  regles: ReglesPoints | null;
  remisePb: number | null;
  /** Abonnés qui ont un lien de carte (ils reçoivent les changements de design). */
  cartes: number;
}

/** Carte d'un abonné, côté directeur (GET et POST /api/fidelite/abonnes/:id/carte). */
export interface CarteAbonne {
  /** Lien personnel à transmettre à l'abonné ; null tant qu'il n'a pas été créé. */
  lien: string | null;
  email: string | null;
  apple: boolean;
  google: boolean;
  /** Téléphones Apple qui ont la carte et reçoivent ses mises à jour. */
  appareilsApple: number;
}

/** Ce que montre la carte, commun à Apple, Google et la page publique. */
export function contenuCarte(d: DonneesCarte) {
  const couleurs = couleursCarte(d.couleur, d.design);
  const reduction = d.design.afficherReduction ? reductionDisponible(d.points, d.regles) : null;
  const remise = d.design.afficherRemise && d.remisePb ? formaterRemise(d.remisePb) : null;
  return { couleurs, titre: titreCarte(d.design), libellePoints: libellePointsCarte(d.design), reduction, remise };
}

/** Champs « au dos » : aide, message du lieu, règle des points, liens. */
function dos(d: DonneesCarte, libellePoints: string, remise: string | null) {
  const champs: { key: string; label: string; value: string; attributedValue?: string }[] = [
    { key: "aide", label: "À la buvette", value: `Présente le QR code à la caissière : il donne ton numéro d'abonné${remise ? ", ta remise" : ""}${d.points !== null ? " et tes points" : ""}.` },
  ];
  if (d.design.message) champs.push({ key: "message", label: d.lieu, value: d.design.message });
  if (d.regles) champs.push({ key: "regles", label: `Règle des ${libellePoints.toLowerCase()}`, value: texteRegles(d.regles, libellePoints) });
  if (d.design.siteWeb) champs.push({ key: "site", label: "Site", value: d.design.siteWeb });
  if (d.design.telephone) champs.push({ key: "telephone", label: "Téléphone", value: d.design.telephone });
  if (d.design.email) champs.push({ key: "email", label: "Contact", value: d.design.email });
  if (d.design.lienApp) champs.push({ key: "app", label: "Application", value: d.design.lienApp, attributedValue: `<a href="${d.design.lienApp}">Ouvrir l'application</a>` });
  return champs;
}

/** pass.json d'une carte Apple Wallet (type « storeCard »). */
export function passApple(d: DonneesCarte, r: { passTypeId: string; teamId: string; webServiceURL: string; authenticationToken: string }): Record<string, unknown> {
  const c = contenuCarte(d);
  return {
    formatVersion: 1,
    passTypeIdentifier: r.passTypeId,
    teamIdentifier: r.teamId,
    serialNumber: d.abonneId,
    organizationName: d.lieu,
    description: `${c.titre} — ${d.lieu}`,
    ...(d.design.afficherNomLieu ? { logoText: d.lieu } : {}),
    backgroundColor: rgb(c.couleurs.fond),
    foregroundColor: rgb(c.couleurs.texte),
    labelColor: rgb(c.couleurs.libelles),
    webServiceURL: r.webServiceURL,
    authenticationToken: r.authenticationToken,
    storeCard: {
      headerFields: [{ key: "titre", value: c.titre }],
      primaryFields:
        d.points === null
          ? [{ key: "nom", label: "Abonné", value: d.nom }]
          : [{ key: "points", label: c.libellePoints, value: d.points, changeMessage: `Ton solde est maintenant de %@ ${c.libellePoints.toLowerCase()}.` }],
      secondaryFields: [
        ...(d.points === null ? [] : [{ key: "nom", label: "Abonné", value: d.nom }]),
        ...(c.reduction === null ? [] : [{ key: "reduction", label: "Réduction disponible", value: c.reduction / 100, currencyCode: "EUR", changeMessage: "Réduction disponible : %@" }]),
      ],
      auxiliaryFields: [{ key: "numero", label: "N° d'abonné", value: d.numero }, ...(c.remise ? [{ key: "remise", label: "Remise abonné", value: c.remise }] : [])],
      backFields: dos(d, c.libellePoints, c.remise),
    },
    barcodes: [{ format: "PKBarcodeFormatQR", message: d.numero, messageEncoding: "iso-8859-1", altText: d.numero }],
  };
}

/** Identifiants Google : « <issuer>.<suffixe> », suffixe en lettres, chiffres, « _ » ou « - ». */
export const idClasseGoogle = (issuerId: string, lieuId: string) => `${issuerId}.lieu_${lieuId.replace(/-/g, "")}`;
export const idObjetGoogle = (issuerId: string, abonneId: string) => `${issuerId}.abonne_${abonneId.replace(/-/g, "")}`;

const texteFr = (value: string) => ({ defaultValue: { language: "fr-FR", value } });

/** Classe de carte de fidélité Google (une par lieu) : nom, logo, bannière, couleur, textes et liens au dos. */
export function classeGoogle(d: DonneesCarte, issuerId: string, images: { logo: string; banniere: string | null }): Record<string, unknown> {
  const c = contenuCarte(d);
  const textes = dos(d, c.libellePoints, c.remise)
    .filter((x) => !["site", "telephone", "email", "app"].includes(x.key))
    .map((x) => ({ id: x.key, header: x.label, body: x.value }));
  if (c.remise) textes.push({ id: "remise", header: "Remise abonné", body: `${c.remise} sur tes achats à la buvette` });
  const liens = [
    d.design.siteWeb && { id: "site", uri: d.design.siteWeb, description: "Site" },
    d.design.telephone && { id: "telephone", uri: `tel:${d.design.telephone.replace(/[^\d+]/g, "")}`, description: "Téléphone" },
    d.design.email && { id: "email", uri: `mailto:${d.design.email}`, description: "Contact" },
    d.design.lienApp && { id: "app", uri: d.design.lienApp, description: "Application" },
  ].filter((x): x is { id: string; uri: string; description: string } => !!x);
  return {
    id: idClasseGoogle(issuerId, d.lieuId),
    issuerName: d.lieu,
    programName: c.titre,
    programLogo: { sourceUri: { uri: images.logo }, contentDescription: texteFr(d.lieu) },
    ...(images.banniere ? { heroImage: { sourceUri: { uri: images.banniere }, contentDescription: texteFr(d.lieu) } } : {}),
    hexBackgroundColor: c.couleurs.fond,
    localizedAccountNameLabel: texteFr("Abonné"),
    localizedAccountIdLabel: texteFr("N° d'abonné"),
    textModulesData: textes,
    ...(liens.length ? { linksModuleData: { uris: liens } } : {}),
    reviewStatus: "UNDER_REVIEW",
  };
}

/** Carte de fidélité Google d'un abonné : nom, numéro en QR code, points, réduction disponible. */
export function objetGoogle(d: DonneesCarte, issuerId: string): Record<string, unknown> {
  const c = contenuCarte(d);
  return {
    id: idObjetGoogle(issuerId, d.abonneId),
    classId: idClasseGoogle(issuerId, d.lieuId),
    state: "ACTIVE",
    accountId: d.numero,
    accountName: d.nom,
    barcode: { type: "QR_CODE", value: d.numero, alternateText: d.numero },
    ...(d.points === null ? {} : { loyaltyPoints: { label: c.libellePoints, balance: { int: d.points } } }),
    ...(c.reduction === null ? {} : { secondaryLoyaltyPoints: { label: "Réduction", balance: { money: { micros: String(c.reduction * 10_000), currencyCode: "EUR" } } } }),
  };
}
