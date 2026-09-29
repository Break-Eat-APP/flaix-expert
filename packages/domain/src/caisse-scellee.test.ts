import { describe, expect, it } from "vitest";
import { verifierChaine } from "./chaine.ts";
import { champsScellesCaisse, empreinteCaisse } from "./journal-caisse.ts";
import {
  anneeParis,
  controlerEvenementTablette,
  scellerAnnulation,
  scellerVente,
  versEvenementCaisse,
  type ContexteScellement,
  type EvenementTablette,
  type TeteChaine,
} from "./caisse-scellee.ts";
import { AUCUN_AJUSTEMENT, type LigneTarifee } from "./ticket.ts";

const ctx: ContexteScellement = {
  lieuId: "11111111-1111-4111-8111-111111111111",
  caisseId: "22222222-2222-4222-8222-222222222222",
  numeroCaisse: 3,
  standId: "33333333-3333-4333-8333-333333333333",
  evenementId: "44444444-4444-4444-8444-444444444444",
  sessionId: "55555555-5555-4555-8555-555555555555",
  utilisateurId: "66666666-6666-4666-8666-666666666666",
};
// Tête après l'ouverture de caisse écrite par le serveur (rang 1, aucun ticket).
const ouverture: TeteChaine = { sequence: 1, empreinte: "a".repeat(64), dernierTicket: 0, horodatage: "2026-10-03T18:30:00.000Z" };
const biere: LigneTarifee = { produitId: "77777777-7777-4777-8777-777777777777", libelle: "Bière 50 cl", quantite: 2, prixUnitaire: 700, tauxTva: 2000 };
const heure = (minutes: number) => new Date(Date.parse("2026-10-03T19:00:00.000Z") + minutes * 60_000);

function vendre(tete: TeteChaine, n: number, extra: Partial<Parameters<typeof scellerVente>[2]> = {}) {
  return scellerVente(ctx, tete, {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    lignes: [biere],
    ajustement: AUCUN_AJUSTEMENT,
    modeReglement: "carte",
    montantDonne: null,
    horodatage: heure(n),
    ...extra,
  });
}

describe("vente sans réseau — la tablette scelle (§15.97)", () => {
  it("F1 — trois ventes hors ligne : numérotées, horodatées, chaînées à la suite de l'ouverture", () => {
    const a = vendre(ouverture, 1);
    const b = vendre(a.tete, 2);
    const c = vendre(b.tete, 3);
    expect([a, b, c].map((x) => x.evenement.numeroJustificatif)).toEqual(["2026-C3-000001", "2026-C3-000002", "2026-C3-000003"]);
    expect([a, b, c].map((x) => x.evenement.sequence)).toEqual([2, 3, 4]);
    expect(a.evenement.empreintePrecedente).toBe(ouverture.empreinte);
    expect(b.evenement.empreintePrecedente).toBe(a.evenement.empreinte);
    // La chaîne scellée par la tablette se vérifie avec la fonction du serveur, champ pour champ.
    const maillons = [a, b, c].map(({ evenement: e }) => ({
      champs: champsScellesCaisse(versEvenementCaisse(ctx, e)),
      empreintePrecedente: e.empreintePrecedente,
      empreinte: e.empreinte,
    }));
    expect(verifierChaine(maillons, ouverture.empreinte).ok).toBe(true);
  });

  it("l'heure d'un ticket ne recule jamais, même si l'horloge de la tablette recule", () => {
    const a = vendre(ouverture, 10);
    const b = vendre(a.tete, 11, { horodatage: heure(2) });
    expect(b.evenement.horodatage).toBe(a.evenement.horodatage);
  });

  it("le numéro porte l'année de Paris, pas celle de l'horloge universelle", () => {
    expect(anneeParis(new Date("2026-12-31T23:30:00.000Z"))).toBe(2027);
  });

  it("le serveur accepte ce que la tablette a scellé, dans l'ordre", () => {
    const a = vendre(ouverture, 1);
    const b = vendre(a.tete, 2, { modeReglement: "especes", montantDonne: 2000 });
    expect(controlerEvenementTablette(ctx, ouverture, a.evenement, null)).toBeNull();
    expect(controlerEvenementTablette(ctx, a.tete, b.evenement, null)).toBeNull();
    expect((b.evenement.details as { paiement: { rendu: number } }).paiement.rendu).toBe(600);
  });

  it("annulation scellée sur la tablette : inverse exacte de la vente, acceptée par le serveur", () => {
    const a = vendre(ouverture, 1);
    const x = scellerAnnulation(ctx, a.tete, a.evenement, { id: "99999999-9999-4999-8999-999999999999", motif: "Erreur de saisie", horodatage: heure(2) });
    expect(x.evenement).toMatchObject({ type: "annulation", totalTtc: -1400, refEvenement: a.evenement.id, numeroJustificatif: "2026-C3-000002" });
    expect(controlerEvenementTablette(ctx, a.tete, x.evenement, a.evenement)).toBeNull();
  });
});

describe("vente sans réseau — le serveur refuse ce qui a été trafiqué [F]", () => {
  const a = vendre(ouverture, 1);
  const refus = (e: EvenementTablette, tete: TeteChaine = ouverture) => controlerEvenementTablette(ctx, tete, e, null);

  it("un montant modifié après scellement", () => {
    expect(refus({ ...a.evenement, totalTtc: 700 })).toBe("empreinte invalide");
  });

  it("un montant modifié ET une empreinte recalculée : les montants ne correspondent plus au moteur de calcul", () => {
    const b = vendre(ouverture, 1, { lignes: [{ ...biere, prixUnitaire: 100 }] });
    const trafique = { ...b.evenement, details: { ...b.evenement.details, lignes: [{ ...b.evenement.details.lignes[0]!, net: 1400 }] } } as EvenementTablette;
    const { empreinte: _e, empreintePrecedente: _p, ...sans } = trafique;
    const reScelle = { ...trafique, empreinte: scellerRecalcule(sans) };
    expect(refus(reScelle)).toBe("montants du ticket incohérents");
  });

  it("un ticket qui saute un numéro ou qui ne suit pas le précédent", () => {
    const b = vendre(a.tete, 2);
    expect(refus(b.evenement)).toMatch(/rang 3 reçu, 2 attendu/);
    expect(controlerEvenementTablette(ctx, { ...a.tete, empreinte: "b".repeat(64) }, b.evenement, null)).toBe("le ticket ne suit pas le dernier ticket enregistré de cette caisse");
  });

  it("un ticket scellé pour une autre caisse", () => {
    expect(controlerEvenementTablette({ ...ctx, caisseId: "88888888-8888-4888-8888-888888888888" }, ouverture, a.evenement, null)).toBe("empreinte invalide");
  });

  it("une remise sans motif, même bien scellée", () => {
    const b = vendre(ouverture, 1, { ajustement: { ...AUCUN_AJUSTEMENT, remisePb: 1000 } });
    expect(refus(b.evenement)).toBe("Motif obligatoire pour une remise ou un offert.");
  });

  it("des espèces insuffisantes, même bien scellées", () => {
    const b = vendre(ouverture, 1, { modeReglement: "especes", montantDonne: 500 });
    expect(refus(b.evenement)).toBe("montant donné insuffisant");
  });
});

/** Recalcule l'empreinte d'un événement falsifié, comme le ferait un fraudeur qui connaît la formule. */
function scellerRecalcule(e: Omit<EvenementTablette, "empreinte" | "empreintePrecedente">): string {
  return empreinteCaisse(versEvenementCaisse(ctx, e), ouverture.empreinte);
}
