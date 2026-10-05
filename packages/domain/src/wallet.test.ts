import { describe, expect, it } from "vitest";
import {
  DESIGN_CARTE_DEFAUT,
  VARIANTES_IMAGE,
  cadrage,
  classeGoogle,
  couleurTexte,
  formaterRemise,
  idObjetGoogle,
  lienValide,
  lireDesign,
  objetGoogle,
  passApple,
  reductionDisponible,
  rgb,
  tailleAcceptable,
  telephoneValide,
  texteRegles,
  type DonneesCarte,
} from "./wallet.ts";

const regles = { pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 };
const carte: DonneesCarte = {
  lieuId: "11111111-2222-3333-4444-555555555555",
  lieu: "Les Spartiates",
  couleur: "#c8102e",
  design: DESIGN_CARTE_DEFAUT,
  abonneId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  nom: "Karim Belaïd",
  numero: "AB-20482",
  actif: true,
  points: 340,
  regles,
  remisePb: 1000,
};
const apple = { passTypeId: "pass.com.flaixlabs.abonne", teamId: "ABCDE12345", webServiceURL: "https://flaixexpert.flaixlabs.com/api/passkit", authenticationToken: "x".repeat(40) };
const champs = (p: Record<string, unknown>, quoi: string) => (p.storeCard as Record<string, { key: string; label?: string; value: unknown; currencyCode?: string }[]>)[quoi]!;
const variante = (nom: string) => VARIANTES_IMAGE.find((x) => x.nom === nom)!;
/** Les montants sont formatés avec des espaces insécables. */
const espaces = (s: unknown) => String(s).replace(/[  ]/g, " ");

describe("carte abonné (§15.147)", () => {
  it("Apple : nom et couleur du lieu, numéro en QR, solde de points, service de mise à jour", () => {
    const p = passApple(carte, apple);
    expect(p).toMatchObject({
      passTypeIdentifier: "pass.com.flaixlabs.abonne",
      teamIdentifier: "ABCDE12345",
      serialNumber: carte.abonneId,
      organizationName: "Les Spartiates",
      description: "Carte abonné — Les Spartiates",
      logoText: "Les Spartiates",
      backgroundColor: "rgb(200, 16, 46)",
      foregroundColor: "rgb(255, 255, 255)",
      barcodes: [{ format: "PKBarcodeFormatQR", message: "AB-20482" }],
    });
    expect(champs(p, "primaryFields")).toEqual([expect.objectContaining({ key: "points", label: "Points", value: 340 })]);
    expect(JSON.stringify(p)).not.toContain("FlaiX");
  });

  it("sans programme de points : la carte montre le nom, aucun solde ni réduction inventés", () => {
    const sans = { ...carte, points: null, regles: null };
    const p = passApple(sans, apple);
    expect(JSON.stringify(p)).not.toContain('"points"');
    expect(JSON.stringify(p)).not.toContain("reduction");
    expect(objetGoogle(sans, "3388000000012345678")).not.toHaveProperty("loyaltyPoints");
    expect(objetGoogle(sans, "3388000000012345678")).not.toHaveProperty("secondaryLoyaltyPoints");
  });

  it("Google : identifiants sans tirets, même QR, solde ; classe aux couleurs du lieu", () => {
    expect(idObjetGoogle("3388000000012345678", carte.abonneId)).toBe("3388000000012345678.abonne_aaaaaaaabbbbccccddddeeeeeeeeeeee");
    expect(objetGoogle(carte, "3388000000012345678")).toMatchObject({ accountId: "AB-20482", barcode: { type: "QR_CODE", value: "AB-20482" }, loyaltyPoints: { balance: { int: 340 } } });
    const classe = classeGoogle(carte, "3388000000012345678", { logo: "https://x/logo.png", banniere: null });
    expect(classe).toMatchObject({ issuerName: "Les Spartiates", programName: "Carte abonné", hexBackgroundColor: "#c8102e", reviewStatus: "UNDER_REVIEW" });
    expect(classe).not.toHaveProperty("heroImage");
    expect(classe).not.toHaveProperty("linksModuleData");
  });

  it("abonné désactivé : carte Apple barrée, carte Google inactive (audit P2-2)", () => {
    expect(passApple({ ...carte, actif: false }, apple)).toMatchObject({ voided: true });
    expect(passApple(carte, apple)).not.toHaveProperty("voided");
    expect(objetGoogle({ ...carte, actif: false }, "338")).toMatchObject({ state: "INACTIVE" });
    expect(objetGoogle(carte, "338")).toMatchObject({ state: "ACTIVE" });
  });

  it("couleurs : rgb, texte lisible sur fond clair ou foncé", () => {
    expect(rgb("#4d04f4")).toBe("rgb(77, 4, 244)");
    expect(couleurTexte("#4d04f4")).toBe("#ffffff");
    expect(couleurTexte("#ffd400")).toBe("#1c1730");
  });
});

describe("design de la carte (§15.148)", () => {
  const design = {
    ...DESIGN_CARTE_DEFAUT,
    titre: "Carte Supporter",
    afficherNomLieu: false,
    couleurTexte: "#ffd400",
    couleurLibelles: "#ffffff",
    libellePoints: "Spartapoints",
    message: "Une boisson offerte à ton anniversaire.",
    siteWeb: "https://spartiates.fr",
    telephone: "+33 4 91 00 00 00",
    email: "contact@spartiates.fr",
    lienApp: "https://apps.apple.com/app/break-eat",
  };
  const perso = { ...carte, design };

  it("Apple : titre, nom des points, couleurs choisies, pas de nom à côté du logo, réduction en euros, remise, dos complet", () => {
    const p = passApple(perso, apple);
    expect(p).toMatchObject({ description: "Carte Supporter — Les Spartiates", foregroundColor: "rgb(255, 212, 0)", labelColor: "rgb(255, 255, 255)" });
    expect(p).not.toHaveProperty("logoText");
    expect(champs(p, "headerFields")).toEqual([{ key: "titre", value: "Carte Supporter" }]);
    expect(champs(p, "primaryFields")[0]).toMatchObject({ label: "Spartapoints", value: 340 });
    // 340 points, palier de 100 à 5,00 € : 3 paliers atteints = 15,00 €.
    expect(champs(p, "secondaryFields")).toContainEqual(expect.objectContaining({ key: "reduction", value: 15, currencyCode: "EUR" }));
    expect(champs(p, "auxiliaryFields")).toContainEqual({ key: "remise", label: "Remise abonné", value: "10 %" });
    const dos = champs(p, "backFields");
    expect(dos.map((x) => x.key)).toEqual(["aide", "message", "regles", "site", "telephone", "email", "app"]);
    expect(espaces(dos.find((x) => x.key === "regles")!.value)).toBe("1 spartapoint par euro dépensé · 100 spartapoints = 5,00 € de réduction");
  });

  it("remise et réduction se masquent ; sans remise réglée, rien n'est affiché", () => {
    const p = passApple({ ...carte, design: { ...DESIGN_CARTE_DEFAUT, afficherRemise: false, afficherReduction: false } }, apple);
    expect(JSON.stringify(p)).not.toContain("remise\"");
    expect(JSON.stringify(p)).not.toContain("reduction");
    expect(JSON.stringify(passApple({ ...carte, remisePb: null }, apple))).not.toContain("Remise abonné");
  });

  it("Google : nom du programme, bannière, textes et liens au dos, points renommés, réduction en euros", () => {
    const classe = classeGoogle(perso, "338", { logo: "https://x/logo.png?v=1", banniere: "https://x/banniere.png?v=2" });
    expect(classe).toMatchObject({ programName: "Carte Supporter", heroImage: { sourceUri: { uri: "https://x/banniere.png?v=2" } } });
    expect((classe.linksModuleData as { uris: { uri: string }[] }).uris.map((x) => x.uri)).toEqual([
      "https://spartiates.fr",
      "tel:+33491000000",
      "mailto:contact@spartiates.fr",
      "https://apps.apple.com/app/break-eat",
    ]);
    expect((classe.textModulesData as { id: string }[]).map((x) => x.id)).toEqual(["aide", "message", "regles", "remise"]);
    expect(objetGoogle(perso, "338")).toMatchObject({
      loyaltyPoints: { label: "Spartapoints", balance: { int: 340 } },
      secondaryLoyaltyPoints: { label: "Réduction", balance: { money: { micros: "15000000", currencyCode: "EUR" } } },
    });
  });

  it("design enregistré : valeurs par défaut, champ illisible ignoré", () => {
    expect(lireDesign(null)).toEqual(DESIGN_CARTE_DEFAUT);
    expect(lireDesign({ titre: "  ", couleurTexte: "rouge", afficherRemise: "oui", libellePoints: "Pts" })).toEqual({ ...DESIGN_CARTE_DEFAUT, libellePoints: "Pts" });
  });

  it("réduction, remise, règle, liens et téléphone", () => {
    expect(reductionDisponible(99, regles)).toBe(0);
    expect(reductionDisponible(250, regles)).toBe(1000);
    expect(reductionDisponible(-5, regles)).toBe(0);
    expect(reductionDisponible(250, null)).toBeNull();
    expect(formaterRemise(1250)).toBe("12,5 %");
    expect(espaces(texteRegles({ pointsParEuro: 2, palierPoints: 50, valeurPalier: 300 }, "Points"))).toBe("2 points par euro dépensé · 50 points = 3,00 € de réduction");
    expect(lienValide("https://spartiates.fr/boutique")).toBe(true);
    expect(lienValide("http://spartiates.fr")).toBe(false);
    expect(lienValide('https://x.fr/"><script>')).toBe(false);
    expect(telephoneValide("04 91 00 00 00")).toBe(true);
    expect(telephoneValide("appelle-moi")).toBe(false);
  });
});

describe("images de la carte (§15.148)", () => {
  it("bannière : remplit le cadre, recadrée au centre", () => {
    // Photo 2000 × 1000 dans 1125 × 369 : on garde toute la largeur, une bande centrée de 656 px de haut.
    const c = cadrage(2000, 1000, variante("strip@3x"));
    expect(c.largeur).toBe(1125);
    expect(c.hauteur).toBe(369);
    expect(c.source.l).toBe(2000);
    expect(c.source.h).toBeCloseTo(656, 0);
    expect(c.source.y).toBeCloseTo(172, 0);
  });

  it("logo Apple : entier, dans le cadre 480 × 150, sans marge ; logo large : toute la largeur", () => {
    expect(cadrage(1000, 1000, variante("logo@3x"))).toMatchObject({ largeur: 150, hauteur: 150, cible: { x: 0, y: 0, l: 150, h: 150 } });
    expect(cadrage(1600, 400, variante("logo@3x"))).toMatchObject({ largeur: 480, hauteur: 120 });
  });

  it("logo Google : carré 660 × 660, centré avec une marge pour le cercle", () => {
    const c = cadrage(1600, 400, variante("google-logo"));
    expect(c).toMatchObject({ largeur: 660, hauteur: 660 });
    expect(c.cible.l).toBeCloseTo(462, 0);
    expect(c.cible.x).toBeCloseTo(99, 0);
    expect(c.cible.y).toBeCloseTo(272.25, 1);
  });

  it("taille des fichiers reçus contrôlée", () => {
    expect(tailleAcceptable(variante("strip@3x"), 1125, 369)).toBe(true);
    expect(tailleAcceptable(variante("strip@3x"), 1125, 370)).toBe(false);
    expect(tailleAcceptable(variante("logo@3x"), 150, 150)).toBe(true);
    expect(tailleAcceptable(variante("logo@3x"), 480, 120)).toBe(true);
    expect(tailleAcceptable(variante("logo@3x"), 100, 100)).toBe(false);
    expect(tailleAcceptable(variante("logo@3x"), 500, 150)).toBe(false);
  });
});
