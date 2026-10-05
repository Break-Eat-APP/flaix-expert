import { describe, expect, it } from "vitest";
import { classeGoogle, couleurTexte, idObjetGoogle, objetGoogle, passApple, rgb, type DonneesCarte } from "./wallet.ts";

const carte: DonneesCarte = { lieuId: "11111111-2222-3333-4444-555555555555", lieu: "Les Spartiates", couleur: "#c8102e", abonneId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", nom: "Karim Belaïd", numero: "AB-20482", points: 340 };

describe("carte abonné (§15.147)", () => {
  it("Apple : nom et couleur du lieu, numéro en QR, solde de points, service de mise à jour", () => {
    const p = passApple(carte, { passTypeId: "pass.com.flaixlabs.abonne", teamId: "ABCDE12345", webServiceURL: "https://flaixexpert.flaixlabs.com/api/passkit", authenticationToken: "x".repeat(40) });
    expect(p).toMatchObject({
      passTypeIdentifier: "pass.com.flaixlabs.abonne",
      teamIdentifier: "ABCDE12345",
      serialNumber: carte.abonneId,
      organizationName: "Les Spartiates",
      logoText: "Les Spartiates",
      backgroundColor: "rgb(200, 16, 46)",
      foregroundColor: "rgb(255, 255, 255)",
      barcodes: [{ format: "PKBarcodeFormatQR", message: "AB-20482" }],
    });
    expect((p.storeCard as { primaryFields: unknown[] }).primaryFields).toEqual([expect.objectContaining({ key: "points", value: 340 })]);
    expect(JSON.stringify(p)).not.toContain("FlaiX");
  });

  it("sans programme de points : la carte montre le nom, aucun solde inventé", () => {
    const p = passApple({ ...carte, points: null }, { passTypeId: "p", teamId: "t", webServiceURL: "u", authenticationToken: "a" });
    expect(JSON.stringify(p)).not.toContain("points\"");
    expect(objetGoogle({ ...carte, points: null }, "3388000000012345678")).not.toHaveProperty("loyaltyPoints");
  });

  it("Google : identifiants sans tirets, même QR, solde ; classe aux couleurs du lieu", () => {
    expect(idObjetGoogle("3388000000012345678", carte.abonneId)).toBe("3388000000012345678.abonne_aaaaaaaabbbbccccddddeeeeeeeeeeee");
    expect(objetGoogle(carte, "3388000000012345678")).toMatchObject({ accountId: "AB-20482", barcode: { type: "QR_CODE", value: "AB-20482" }, loyaltyPoints: { balance: { int: 340 } } });
    expect(classeGoogle(carte, "3388000000012345678", "https://x/logo.png")).toMatchObject({ issuerName: "Les Spartiates", hexBackgroundColor: "#c8102e" });
  });

  it("couleurs : rgb, texte lisible sur fond clair ou foncé", () => {
    expect(rgb("#4d04f4")).toBe("rgb(77, 4, 244)");
    expect(couleurTexte("#4d04f4")).toBe("#ffffff");
    expect(couleurTexte("#ffd400")).toBe("#1c1730");
  });
});
