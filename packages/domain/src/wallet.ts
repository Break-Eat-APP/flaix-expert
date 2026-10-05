/**
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §14 module 20, §15.147). Ce module décrit seulement le
 * contenu de la carte, sans rien calculer : nom et couleur du lieu (pas la marque FlaiX Expert), numéro d'abonné
 * en QR code (le même numéro que celui saisi à la caisse), solde de points lu comme le lit la caisse.
 * La signature (Apple) et les jetons (Google) sont faits par le serveur.
 */

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

export interface DonneesCarte {
  lieuId: string;
  lieu: string;
  couleur: string;
  abonneId: string;
  nom: string;
  numero: string;
  /** Solde de points ; null si le programme de points n'est pas réglé. */
  points: number | null;
}

/** Réponse de GET /api/carte/:jeton (page publique de l'abonné). */
export interface CartePublique {
  lieu: string;
  couleur: string;
  nom: string;
  numero: string;
  points: number | null;
  apple: boolean;
  google: boolean;
}

/** Réponse de GET /api/wallet : services réglés sur le serveur, couleur des cartes du lieu. */
export interface EtatWallet {
  apple: boolean;
  google: boolean;
  couleur: string;
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

/** pass.json d'une carte Apple Wallet (type « storeCard »). */
export function passApple(d: DonneesCarte, r: { passTypeId: string; teamId: string; webServiceURL: string; authenticationToken: string }): Record<string, unknown> {
  const texte = couleurTexte(d.couleur);
  return {
    formatVersion: 1,
    passTypeIdentifier: r.passTypeId,
    teamIdentifier: r.teamId,
    serialNumber: d.abonneId,
    organizationName: d.lieu,
    description: `Carte abonné — ${d.lieu}`,
    logoText: d.lieu,
    backgroundColor: rgb(d.couleur),
    foregroundColor: rgb(texte),
    labelColor: rgb(texte),
    webServiceURL: r.webServiceURL,
    authenticationToken: r.authenticationToken,
    storeCard: {
      primaryFields: d.points === null ? [{ key: "nom", label: "Abonné", value: d.nom }] : [{ key: "points", label: "Points", value: d.points, changeMessage: "Ton solde est maintenant de %@ points." }],
      secondaryFields: d.points === null ? [] : [{ key: "nom", label: "Abonné", value: d.nom }],
      auxiliaryFields: [{ key: "numero", label: "N° d'abonné", value: d.numero }],
      backFields: [{ key: "aide", label: "À la buvette", value: "Présente le QR code à la caissière : il donne ton numéro d'abonné, ta remise et tes points." }],
    },
    barcodes: [{ format: "PKBarcodeFormatQR", message: d.numero, messageEncoding: "iso-8859-1", altText: d.numero }],
  };
}

/** Identifiants Google : « <issuer>.<suffixe> », suffixe en lettres, chiffres, « _ » ou « - ». */
export const idClasseGoogle = (issuerId: string, lieuId: string) => `${issuerId}.lieu_${lieuId.replace(/-/g, "")}`;
export const idObjetGoogle = (issuerId: string, abonneId: string) => `${issuerId}.abonne_${abonneId.replace(/-/g, "")}`;

/** Classe de carte de fidélité Google (une par lieu). */
export function classeGoogle(d: DonneesCarte, issuerId: string, logoUrl: string): Record<string, unknown> {
  return {
    id: idClasseGoogle(issuerId, d.lieuId),
    issuerName: d.lieu,
    programName: `Carte abonné — ${d.lieu}`,
    programLogo: { sourceUri: { uri: logoUrl }, contentDescription: { defaultValue: { language: "fr-FR", value: d.lieu } } },
    hexBackgroundColor: d.couleur,
    reviewStatus: "UNDER_REVIEW",
  };
}

/** Carte de fidélité Google d'un abonné. */
export function objetGoogle(d: DonneesCarte, issuerId: string): Record<string, unknown> {
  return {
    id: idObjetGoogle(issuerId, d.abonneId),
    classId: idClasseGoogle(issuerId, d.lieuId),
    state: "ACTIVE",
    accountId: d.numero,
    accountName: d.nom,
    barcode: { type: "QR_CODE", value: d.numero, alternateText: d.numero },
    ...(d.points === null ? {} : { loyaltyPoints: { label: "Points", balance: { int: d.points } } }),
  };
}
