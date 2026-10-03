import { describe, expect, it } from "vitest";
import { empreinteCaisse } from "./journal-caisse.ts";
import {
  apercuFidelite,
  controlerEvenementTablette,
  scellerAnnulation,
  scellerVente,
  versEvenementCaisse,
  type ContexteScellement,
  type DetailsVente,
  type EvenementTablette,
  type FideliteVente,
  type TeteChaine,
} from "./caisse-scellee.ts";
import { AUCUN_AJUSTEMENT, calculerTicket, type Ajustement, type LigneTarifee } from "./ticket.ts";

/** Fidélité à la caisse (§15.127) : code promo et points dans le ticket scellé. */
const ctx: ContexteScellement = {
  lieuId: "11111111-1111-4111-8111-111111111111",
  caisseId: "22222222-2222-4222-8222-222222222222",
  numeroCaisse: 1,
  standId: "33333333-3333-4333-8333-333333333333",
  evenementId: "44444444-4444-4444-8444-444444444444",
  sessionId: "55555555-5555-4555-8555-555555555555",
  utilisateurId: "66666666-6666-4666-8666-666666666666",
};
const ouverture: TeteChaine = { sequence: 1, empreinte: "a".repeat(64), dernierTicket: 0, horodatage: "2026-10-03T18:30:00.000Z" };
const biere: LigneTarifee = { produitId: "77777777-7777-4777-8777-777777777777", libelle: "Bière 50 cl", quantite: 2, prixUnitaire: 700, tauxTva: 2000 };
const hotdog: LigneTarifee = { produitId: "88888888-8888-4888-8888-888888888888", libelle: "Hot-dog", quantite: 1, prixUnitaire: 600, tauxTva: 1000 };
const abonne: Ajustement = { remisePb: 1000, offert: 0, motif: "abonne", motifTexte: null, reference: " a123 " };
const RESA = "99999999-9999-4999-8999-999999999999";

function vendre(fidelite: FideliteVente | null, ajustement: Ajustement = abonne) {
  return scellerVente(ctx, ouverture, {
    id: "00000000-0000-4000-8000-000000000001",
    lignes: [biere, hotdog],
    ajustement,
    modeReglement: "carte",
    montantDonne: null,
    horodatage: new Date("2026-10-03T19:00:00.000Z"),
    fidelite,
  });
}
const controler = (e: EvenementTablette) => controlerEvenementTablette(ctx, ouverture, e, null);
/** Rescelle un ticket altéré : l'empreinte suit le contenu, seule la vérification métier peut le refuser. */
function rescelle(x: EvenementTablette): string {
  const { empreinte: _e, empreintePrecedente: _p, ...sans } = x;
  return empreinteCaisse(versEvenementCaisse(ctx, sans), x.empreintePrecedente);
}

describe("calcul : code promo et points après la remise et l'offert", () => {
  it("20,00 € − 10 % abonné = 18,00 € ; code −10 % = 1,80 € ; 2 paliers de points = 5,00 € → 11,20 €, TVA ventilée au centime", () => {
    const sans = calculerTicket([biere, hotdog], abonne);
    expect(sans.total).toBe(1800);
    const t = calculerTicket([biere, hotdog], abonne, { promo: 180, points: 500 });
    expect(t).toMatchObject({ remise: 200, promo: 180, points: 500, total: 1120 });
    expect(t.lignes.reduce((s, l) => s + (l.fidelite ?? 0), 0)).toBe(680);
    expect(t.ventilation.reduce((s, v) => s + v.ttc, 0)).toBe(1120);
    expect(t.lignes.every((l) => l.net === l.brut - l.remise - l.offert - (l.fidelite ?? 0))).toBe(true);
  });

  it("les points ne dépassent jamais ce qui reste à payer", () => {
    expect(calculerTicket([hotdog], AUCUN_AJUSTEMENT, { promo: 0, points: 5000 })).toMatchObject({ points: 600, total: 0 });
  });

  it("un ticket sans fidélité garde exactement sa forme d'avant (tablettes déjà en service)", () => {
    const t = calculerTicket([biere, hotdog], abonne);
    expect(t.lignes.some((l) => "fidelite" in l)).toBe(false);
    const { evenement } = vendre(null);
    expect("fidelite" in (evenement.details as DetailsVente)).toBe(false);
    expect(controler(evenement)).toBeNull();
  });
});

describe("ticket scellé avec fidélité : la tablette et le serveur calculent pareil", () => {
  const f: FideliteVente = {
    codePromo: { code: "MATCH10", type: "pourcentage", valeur: 1000, reservation: null },
    points: { numero: "A123", points: 200, montant: 500, reservation: RESA },
  };

  it("code −10 % et 200 points (5,00 €) : 11,20 € ; accepté par le serveur ; détail lisible", () => {
    const { evenement } = vendre(f);
    expect(evenement.totalTtc).toBe(1120);
    expect((evenement.details as DetailsVente).fidelite).toEqual({
      codePromo: { code: "MATCH10", type: "pourcentage", valeur: 1000, reservation: null, montant: 180 },
      points: { numero: "A123", points: 200, montant: 500, reservation: RESA },
    });
    expect(controler(evenement)).toBeNull();
  });

  it("aperçu à la caisse : réductions, total, et points trop élevés signalés avant d'encaisser", () => {
    expect(apercuFidelite([biere, hotdog], abonne, f)).toEqual({ promo: 180, points: 500, total: 1120, pointsTropEleves: false });
    const trop = { ...f, points: { ...f.points!, points: 2000, montant: 5000 } };
    expect(apercuFidelite([hotdog], abonne, trop).pointsTropEleves).toBe(true);
  });

  it("[F] montant du code gonflé, points sans réservation, points d'un autre abonné, points sans abonné : refusés", () => {
    const { evenement } = vendre(f);
    const gonfle = { ...evenement, details: { ...(evenement.details as DetailsVente), fidelite: { ...(evenement.details as DetailsVente).fidelite!, codePromo: { ...(evenement.details as DetailsVente).fidelite!.codePromo!, montant: 900 } } } };
    expect(controler({ ...gonfle, empreinte: rescelle(gonfle) })).toMatch(/incohérents/);

    const sansResa = vendre({ ...f, points: { ...f.points!, reservation: "" } }).evenement;
    expect(controler(sansResa)).toMatch(/réservation/);
    const autre = vendre({ ...f, points: { ...f.points!, numero: "B999" } }).evenement;
    expect(controler(autre)).toMatch(/abonné du ticket/);
    const sansAbonne = vendre(f, AUCUN_AJUSTEMENT).evenement;
    expect(controler(sansAbonne)).toMatch(/abonné du ticket/);
  });

  it("[F] des points qui dépassent le ticket sont refusés", () => {
    const trop = scellerVente(ctx, ouverture, {
      id: "00000000-0000-4000-8000-000000000002",
      lignes: [hotdog],
      ajustement: abonne,
      modeReglement: "carte",
      montantDonne: null,
      horodatage: new Date("2026-10-03T19:00:00.000Z"),
      fidelite: { codePromo: null, points: { numero: "A123", points: 2000, montant: 5000, reservation: RESA } },
    }).evenement;
    expect(controler(trop)).toMatch(/dépassent/);
  });

  it("annulation : les parts de fidélité sont inversées avec le reste, le serveur l'accepte", () => {
    const v = vendre(f);
    const a = scellerAnnulation(ctx, v.tete, v.evenement, { id: "00000000-0000-4000-8000-000000000003", motif: "Erreur de saisie", horodatage: new Date("2026-10-03T19:05:00.000Z") });
    const lignes = (a.evenement.details as { lignes: { fidelite?: number }[] }).lignes;
    expect(lignes.reduce((s, l) => s + (l.fidelite ?? 0), 0)).toBe(-680);
    expect(controlerEvenementTablette(ctx, v.tete, a.evenement, v.evenement)).toBeNull();
  });
});

