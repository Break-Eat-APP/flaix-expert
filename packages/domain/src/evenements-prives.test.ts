import { describe, expect, it } from "vitest";
import { bilanPrive, construireFacture, coutPersonnel, empreinteFacture, niveauBudget, numeroFacture, type LignePrivee } from "./evenements-prives.ts";

const ligne = (x: Partial<LignePrivee>): LignePrivee => ({ id: "l", produitId: "p", libelle: "Bière", quantite: 1, prixTtc: 700, tauxTva: 2000, coutUnitaire: 120, ...x });

describe("événements privés (§15.160)", () => {
  it("bilan : TVA ventilée par ligne (HT + TVA = TTC), marchandise, frais, ce qu'il te reste ; ligne libre = service", () => {
    const b = bilanPrive(
      [
        ligne({ quantite: 30 }), // 210 € TTC à 20 %
        ligne({ id: "h", produitId: "hd", libelle: "Hot-dog", quantite: 15, prixTtc: 600, tauxTva: 1000, coutUnitaire: 150.5 }), // 90 € à 10 %
        ligne({ id: "s", produitId: null, libelle: "Location du salon", quantite: 1, prixTtc: 24_000, tauxTva: 2000, coutUnitaire: null }),
      ],
      [{ id: "f", libelle: "Personnel", montant: 9_000 }],
      40_000,
    );
    expect(b.totalTtc).toBe(54_000);
    expect(b.parTaux).toEqual([
      { taux: 1000, ht: 8_182, tva: 818, ttc: 9_000 },
      { taux: 2000, ht: 37_500, tva: 7_500, ttc: 45_000 },
    ]);
    expect(b.caHt + b.tva).toBe(b.totalTtc);
    // 30 × 1,20 € + 15 × 1,505 € = 58,58 € (arrondi) ; la location ne coûte pas de marchandise.
    expect(b.coutMarchandise).toBe(5_858);
    expect(b.reste).toBe(b.caHt - 5_858 - 9_000);
    expect(b).toMatchObject({ budget: 40_000, budgetPb: 13_500, niveauBudget: "depasse" });
  });

  it("produit sans coût : marchandise inconnue, rien d'inventé ; jauge du budget ; coût du personnel", () => {
    const b = bilanPrive([ligne({ coutUnitaire: null })], [], null);
    expect(b).toMatchObject({ coutMarchandise: null, reste: null, produitsSansCout: ["Bière"], niveauBudget: "sans" });
    expect(niveauBudget(7_900, 10_000).niveau).toBe("ok");
    expect(niveauBudget(8_000, 10_000).niveau).toBe("attention");
    expect(niveauBudget(10_000, 10_000).niveau).toBe("attention");
    expect(niveauBudget(10_001, 10_000).niveau).toBe("depasse");
    expect(coutPersonnel(2, 300, 1_800)).toBe(18_000); // 2 personnes × 5 h × 18 €
  });

  it("facture : numéro de série, lignes HT, totaux par taux, mentions d'un professionnel, échéance ou acquit ; empreinte", () => {
    expect(numeroFacture(2026, 7)).toBe("FP-2026-0007");
    const vendeur = { nom: "Buvette du stade", raisonSociale: "Break Eat SAS", adresse: "1 rue du Stade, 76000 Rouen", siret: "12345678900011", tvaIntracom: "FR12123456789" };
    const f = construireFacture({
      numero: "FP-2026-0001",
      emiseLe: "2026-10-12T09:00:00.000Z",
      vendeur,
      client: { nom: "Paul", contact: null, societe: "Le Bar clandestin SARL", adresse: "5 rue X, Rouen", siret: null, tvaIntracom: null },
      objet: "Soirée privée du 11/10/2026",
      lignes: [ligne({ quantite: 30 })],
      reglement: null,
    });
    expect(f.client).toMatchObject({ nom: "Le Bar clandestin SARL", professionnel: true });
    expect(f.lignes[0]).toEqual({ libelle: "Bière", quantite: 30, prixUnitaireHt: 583, tauxTva: 2000, totalHt: 17_500, totalTtc: 21_000 });
    expect(f).toMatchObject({ totalHt: 17_500, totalTva: 3_500, totalTtc: 21_000, echeance: "2026-11-11" });
    expect(f.mentions.join(" ")).toContain("indemnité forfaitaire de 40 €");
    expect(f.mentions.at(-1)).toBe("À régler au plus tard le 11/11/2026.");
    const acquittee = construireFacture({ ...{ numero: "FP-2026-0002", emiseLe: "2026-10-12T09:00:00.000Z", vendeur, objet: "x", lignes: [] }, client: { nom: "Paul", contact: null, societe: null, adresse: null, siret: null, tvaIntracom: null }, reglement: { mode: "virement", le: "2026-10-12" } });
    expect(acquittee.client.professionnel).toBe(false);
    expect(acquittee.mentions).toEqual(["Pas d'escompte pour paiement anticipé.", "Facture acquittée le 12/10/2026 par virement."]);
    expect(empreinteFacture("id", f)).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinteFacture("id", { ...f, totalTtc: 1 })).not.toBe(empreinteFacture("id", f));
  });
});
