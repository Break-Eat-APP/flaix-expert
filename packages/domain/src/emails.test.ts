import { describe, expect, it } from "vitest";
import { formaterMontant } from "./argent.ts";
import type { BriefSoiree } from "./brief.ts";
import { emailEssai, emailRapportSoiree, emailRectification, emailValide } from "./emails.ts";

const brief: BriefSoiree = {
  evenementId: "rouen",
  titre: "Spartiates – Rouen : 18 640,00 € encaissés",
  resume: "1 210 tickets, panier moyen 15,40 €, marge nette 6 420,00 €.",
  points: [{ niveau: "info", texte: "Marge nette tenue : 6 420,00 € pour une cible de 6 000,00 €." }] as BriefSoiree["points"],
  lien: "/rapport-soiree/rouen",
};

describe("e-mails (§15.146)", () => {
  it("rapport de soirée : le brief tel quel et le lien vers le rapport complet, sans autre chiffre", () => {
    const e = emailRapportSoiree(brief, "https://flaixexpert.flaixlabs.com", "Les Spartiates");
    expect(e.sujet).toBe("Rapport de soirée — Spartiates – Rouen : 18 640,00 € encaissés");
    expect(e.texte).toContain("1 210 tickets, panier moyen 15,40 €, marge nette 6 420,00 €.");
    expect(e.texte).toContain("Rapport complet : https://flaixexpert.flaixlabs.com/rapport-soiree/rouen");
    expect(e.html).toContain('href="https://flaixexpert.flaixlabs.com/rapport-soiree/rouen"');
    expect(emailRapportSoiree(brief, "https://x", "L", true).sujet).toMatch(/^\[FORMATION — FACTICE\]/);
  });

  it("[F] le contenu est échappé : un motif avec du code ne devient jamais du HTML", () => {
    const e = emailRectification(
      { lieu: "Les Spartiates", objet: "Caisse 3 (Buvette Nord)", evenement: "Rouen", compteAvant: 31_000, ecartAvant: -1_200, compte: 32_200, ecart: 0, motif: '<script>alert("x")</script> billet retrouvé', signature: "Rémi Notta", par: "Rémi Notta", le: "2026-10-05T20:15:00Z" },
      "https://flaixexpert.flaixlabs.com",
    );
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.texte).toContain(`Compté : ${formaterMontant(31_000)} → ${formaterMontant(32_200)}.`);
    expect(e.texte).toContain(`Écart : −${formaterMontant(1_200)} → ${formaterMontant(0)}.`);
    expect(e.sujet).toBe("Rectification du Z — Caisse 3 (Buvette Nord), Rouen");
  });

  it("adresses : forme contrôlée ; e-mail d'essai", () => {
    expect(emailValide("expert.comptable@cabinet.fr")).toBe(true);
    expect(emailValide("pas une adresse")).toBe(false);
    expect(emailValide("a@b")).toBe(false);
    expect(emailEssai("Les Spartiates", "https://flaixexpert.flaixlabs.com").sujet).toBe("FlaiX Expert — E-mail d'essai");
  });
});
