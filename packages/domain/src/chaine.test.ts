import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  EMPREINTE_INITIALE,
  calculerEmpreinte,
  jsonCanonique,
  serialiserChamps,
  verifierChaine,
  type Maillon,
} from "./chaine.ts";
import { champsScellesJet, empreinteJet, type EvenementJet } from "./journal-technique.ts";

function construireChaine(n: number): Maillon[] {
  const maillons: Maillon[] = [];
  let precedente = EMPREINTE_INITIALE;
  for (let i = 1; i <= n; i++) {
    const champs = [`2026-C3-${String(i).padStart(6, "0")}`, "2026-09-28T20:00:00.000Z", "VENTE", 700 * i];
    const empreinte = calculerEmpreinte(champs, precedente);
    maillons.push({ champs, empreintePrecedente: precedente, empreinte });
    precedente = empreinte;
  }
  return maillons;
}

describe("formule de scellement (§15.16)", () => {
  it("est exactement SHA256(champ1|…|champN|empreinte_precedente) quand aucun champ ne contient | ni \\", () => {
    const champs = ["2025-C1-000138", "2025-10-04T20:14:00", "VENTE", "L001", "S1", "C1", "OP3", "especes", "9.00"];
    const attendu = createHash("sha256").update(`${champs.join("|")}|${EMPREINTE_INITIALE}`, "utf8").digest("hex");
    expect(calculerEmpreinte(champs, EMPREINTE_INITIALE)).toBe(attendu);
  });

  it("échappe | et \\ pour que deux contenus différents ne se confondent jamais", () => {
    expect(serialiserChamps(["a|b", "c"])).not.toBe(serialiserChamps(["a", "b|c"]));
    expect(calculerEmpreinte(["a|b", "c"], EMPREINTE_INITIALE)).not.toBe(calculerEmpreinte(["a", "b|c"], EMPREINTE_INITIALE));
  });

  it("un champ vide (null) reste distinct d'un champ absent", () => {
    expect(serialiserChamps(["a", null, "b"])).toBe("a||b");
  });
});

describe("jsonCanonique", () => {
  it("donne le même texte quel que soit l'ordre des clés", () => {
    expect(jsonCanonique({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } })).toBe(
      jsonCanonique({ a: { c: [3, { e: 0, f: 1 }], d: 2 }, b: 1 }),
    );
    expect(jsonCanonique({ b: 1, a: "x" })).toBe('{"a":"x","b":1}');
  });
});

describe("verifierChaine — tests de falsification [F] (§15.19 A3, A4, A5)", () => {
  it("une chaîne intacte est reconnue", () => {
    expect(verifierChaine(construireChaine(20))).toEqual({ ok: true, maillons: 20 });
  });

  it("A3 — un montant modifié est détecté au maillon exact", () => {
    const chaine = construireChaine(20);
    const cible = chaine[7]!;
    chaine[7] = { ...cible, champs: [cible.champs[0]!, cible.champs[1]!, cible.champs[2]!, 100] };
    expect(verifierChaine(chaine)).toMatchObject({ ok: false, rupture: { index: 7, raison: "empreinte_invalide" } });
  });

  it("A4 — une ligne supprimée au milieu est détectée à la ligne suivante", () => {
    const chaine = construireChaine(20);
    chaine.splice(10, 1);
    expect(verifierChaine(chaine)).toMatchObject({ ok: false, rupture: { index: 10, raison: "chainage_rompu" } });
  });

  it("A5 — deux lignes interverties cassent la chaîne : l'ordre est scellé", () => {
    const chaine = construireChaine(20);
    [chaine[4], chaine[5]] = [chaine[5]!, chaine[4]!];
    expect(verifierChaine(chaine)).toMatchObject({ ok: false, rupture: { index: 4 } });
  });

  it("une chaîne entièrement recalculée par un fraudeur reste cohérente — d'où la signature prévue (§15.16, réserve)", () => {
    // Ce test documente une limite, il ne la corrige pas : le chaînage seul détecte
    // l'altération par un tiers, pas une réécriture complète par qui détient le code.
    const chaine = construireChaine(5);
    let precedente = EMPREINTE_INITIALE;
    const reecrite = chaine.map((m) => {
      const champs = [...m.champs.slice(0, 3), 1];
      const empreinte = calculerEmpreinte(champs, precedente);
      const nouveau = { champs, empreintePrecedente: precedente, empreinte };
      precedente = empreinte;
      return nouveau;
    });
    expect(verifierChaine(reecrite).ok).toBe(true);
  });
});

describe("journal technique", () => {
  const evt: EvenementJet = {
    numero: 1,
    horodatage: new Date("2026-09-28T19:42:00.000Z"),
    type: "tarif_cree",
    lieuId: "5b0c3c52-0000-4000-8000-000000000001",
    standId: null,
    caisseId: null,
    utilisateurId: "5b0c3c52-0000-4000-8000-000000000002",
    details: { prixTtc: 700, produit: "Hot dog", tauxTva: 1000 },
  };

  it("scelle le contenu détaillé : modifier un détail change l'empreinte", () => {
    const a = empreinteJet(evt, EMPREINTE_INITIALE);
    const b = empreinteJet({ ...evt, details: { ...evt.details, prixTtc: 650 } }, EMPREINTE_INITIALE);
    expect(a).not.toBe(b);
  });

  it("l'ordre des clés du détail n'a pas d'effet (relecture depuis la base)", () => {
    const relu = { ...evt, details: { tauxTva: 1000, produit: "Hot dog", prixTtc: 700 } };
    expect(champsScellesJet(relu)).toEqual(champsScellesJet(evt));
  });
});
