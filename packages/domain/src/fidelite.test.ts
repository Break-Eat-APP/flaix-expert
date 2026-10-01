import { describe, expect, it } from "vitest";
import { etatCodePromo, lireImportAbonnes, pointsDuTicket, remiseCodePromo, valeurConvertible, type CodePromo } from "./fidelite.ts";

describe("points et conversion (exemple du dossier, valeurs de test)", () => {
  it("32,40 € TTC à 1 point par euro → 32 points ; un ticket annulé ou nul n'en donne pas", () => {
    expect(pointsDuTicket(3240, 1)).toBe(32);
    expect(pointsDuTicket(3240, 2)).toBe(64);
    expect(pointsDuTicket(0, 1)).toBe(0);
    expect(pointsDuTicket(-700, 1)).toBe(0);
  });

  it("340 points, palier de 100 = 5 € → 3 paliers, 15 €, 40 points restent", () => {
    expect(valeurConvertible(340, { palierPoints: 100, valeurPalier: 500 })).toEqual({ paliers: 3, valeur: 1500, reste: 40 });
    expect(valeurConvertible(-10, { palierPoints: 100, valeurPalier: 500 })).toEqual({ paliers: 0, valeur: 0, reste: -10 });
  });
});

describe("codes promo", () => {
  const match50: CodePromo = { code: "MATCH50", type: "pourcentage", valeur: 5000, debut: "2026-09-01", fin: "2026-09-30", usageMax: 200, actif: true };
  it("valide dans ses dates et sous son plafond ; sinon à venir, expiré, épuisé ou désactivé", () => {
    expect(etatCodePromo(match50, "2026-09-12", 118)).toBe("valide");
    expect(etatCodePromo(match50, "2026-08-31", 0)).toBe("a_venir");
    expect(etatCodePromo(match50, "2026-10-01", 0)).toBe("expire");
    expect(etatCodePromo(match50, "2026-09-12", 200)).toBe("epuise");
    expect(etatCodePromo({ ...match50, actif: false }, "2026-09-12", 0)).toBe("desactive");
    expect(etatCodePromo({ ...match50, usageMax: null }, "2026-09-30", 99999)).toBe("valide");
  });

  it("−50 % sur 12,00 € → 6,00 € ; un montant ne dépasse jamais le panier", () => {
    expect(remiseCodePromo(match50, 1200)).toBe(600);
    expect(remiseCodePromo({ type: "montant", valeur: 500 }, 1200)).toBe(500);
    expect(remiseCodePromo({ type: "montant", valeur: 500 }, 300)).toBe(300);
  });
});

describe("import tolérant de la base d'abonnés", () => {
  it("reconnaît les en-têtes usuels, le point-virgule, les guillemets ; normalise le n°", () => {
    const r = lireImportAbonnes('﻿N° abonné;Nom;E-mail;Téléphone;Points\r\n ab-20482 ;"Belaïd, Karim";karim@exemple.fr;06 12 34 56 78;340\r\nAB-31001;Léa Martin;;;\r\n');
    expect(r.colonnes).toEqual({ numero: 0, nom: 1, email: 2, telephone: 3, points: 4 });
    expect(r.erreurs).toEqual([]);
    expect(r.lignes).toEqual([
      { numero: "AB-20482", nom: "Belaïd, Karim", email: "karim@exemple.fr", telephone: "06 12 34 56 78", points: 340 },
      { numero: "AB-31001", nom: "Léa Martin", email: null, telephone: null, points: 0 },
    ]);
  });

  it("virgule comme séparateur, colonnes dans un autre ordre, colonnes en trop ignorées", () => {
    const r = lireImportAbonnes("Client,Carte,Ville,Mail\nJean Dupont,C-77,Marseille,jean@exemple.fr\n");
    expect(r.lignes).toEqual([{ numero: "C-77", nom: "Jean Dupont", email: "jean@exemple.fr", telephone: null, points: 0 }]);
  });

  it("lignes fautives listées avec leur numéro de ligne ; doublon pris une seule fois", () => {
    const r = lireImportAbonnes("numero;nom;email;points\nA1;Ana;pas-un-mail;\nA2;;;\nA3;Zoé;;12x\nA4;Max;;\nA4;Max bis;;\n");
    expect(r.lignes.map((l) => l.numero)).toEqual(["A4"]);
    expect(r.erreurs.map((e) => e.ligne)).toEqual([2, 3, 4, 6]);
  });

  it("sans colonne n° d'abonné ou nom : rien n'est importé, l'erreur le dit", () => {
    const r = lireImportAbonnes("prénom;ville\nAna;Nice\n");
    expect(r.lignes).toEqual([]);
    expect(r.erreurs[0]!.message).toContain("n° d'abonné et un nom");
  });
});
