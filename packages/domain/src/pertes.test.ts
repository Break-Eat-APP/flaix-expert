import { describe, expect, it } from "vitest";
import { formaterMontant } from "./argent.ts";
import type { ProduitVendu } from "./modele.ts";
import { analyserPertes, estimerRupture, pleinRegime, type EntreePertes, type EntreeRupture } from "./pertes.ts";

const MIN = 60_000;
/** 4 octobre 2026, 20 h 30 à Paris (heure d'été, UTC+2). */
const T0 = Date.UTC(2026, 9, 4, 18, 30);
const minute = (m: number) => T0 + m * MIN;

/** Un ticket par minute de 0 à 59 ; Frites dans les tickets 0 et 10, puis un sur deux de 20 à 38 (rush), puis rupture. */
const ticketsStand = Array.from({ length: 60 }, (_, m) => minute(m));
const ventesFrites = [0, 10, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38].map((m) => ({ t: minute(m), q: 1 }));

const vide: EntreePertes = {
  evenements: 1,
  ruptures: [],
  stock: [],
  especes: [],
  sousTarif: [],
  produits: [],
  produitsParStand: [],
  ticketsParStand: {},
  reductions: { remises: 0, offerts: 0, fidelite: 0 },
  caisses: [],
};

const produit = (nom: string, quantite: number, caHt: number, marge: number | null, cibleMarge: number | null = null): ProduitVendu => ({
  produitId: nom,
  nom,
  categorie: null,
  quantite,
  caTtc: caHt,
  caHt,
  coutUnitaire: marge === null ? null : Math.round((caHt - marge) / quantite),
  marge,
  cibleMarge,
});

describe("ruptures : ventes manquées au rythme du stand (§15.138)", () => {
  it("rupture à la 38e minute : 12 frites pour 39 tickets avant, 11 pour 30 dans la dernière demi-heure, 21 tickets après → entre 6 et 8 ventes manquées", () => {
    // taux global 12/39 = 0,308 ; taux récent 11/30 = 0,367 ; × 21 tickets après → 6,46 et 7,7.
    expect(estimerRupture(ticketsStand, ventesFrites)).toEqual({
      ruptureA: minute(38),
      finStand: minute(59),
      minutesSans: 21,
      ticketsAvant: 39,
      ticketsApres: 21,
      ventes: { bas: 6, haut: 8 },
    });
  });

  it("[F] trop peu de tickets avant la rupture : constatée, jamais chiffrée ; rupture en toute fin : rien à signaler", () => {
    expect(estimerRupture(ticketsStand.slice(0, 25), [{ t: minute(10), q: 3 }])!.ventes).toBeNull();
    expect(estimerRupture(ticketsStand, [{ t: minute(56), q: 40 }])).toBeNull(); // 3 tickets après
    expect(estimerRupture([], [])).toBeNull();
  });

  it("le montant est la marge par vente à ce stand ; la phrase dit quoi faire, quand, et combien", () => {
    const r: EntreeRupture = { evenement: "Rouen", standId: "N", stand: "Buvette Nord", produitId: "F", produit: "Frites", ticketsStand, ventesProduit: ventesFrites, caHt: 4_800, quantite: 12, coutUnitaire: 120 };
    const a = analyserPertes({ ...vide, ruptures: [r] });
    expect(a.perdu).toHaveLength(1);
    const p = a.perdu[0]!;
    // (4 800 / 12 − 120) = 280 de marge par vente → 6 × 2,80 € et 8 × 2,80 €.
    expect(p).toMatchObject({ famille: "rupture", nature: "estime", bas: 1_680, haut: 2_240, coutManquant: false });
    expect(p.titre).toBe("Mettre plus de Frites à Buvette Nord : rupture à 21 h 08, 21 min avant la fin des ventes du stand");
    expect(p.detail).toContain(`entre 6 et 8 ventes manquées`);
    expect(p.detail).toContain(`${formaterMontant(1_680)} à ${formaterMontant(2_240)} de marge`);
    expect(a.totaux).toEqual({ constate: 0, estimeBas: 1_680, estimeHaut: 2_240 });
  });

  it("sans coût d'achat : le CA HT manqué, dit comme tel ; sur une période, les ruptures d'un même produit au même stand s'additionnent", () => {
    const r: EntreeRupture = { evenement: "Gap", standId: "N", stand: "Buvette Nord", produitId: "F", produit: "Frites", ticketsStand, ventesProduit: ventesFrites, caHt: 4_800, quantite: 12, coutUnitaire: null };
    const a = analyserPertes({ ...vide, evenements: 2, ruptures: [r, { ...r, evenement: "Rouen" }] });
    expect(a.perdu).toHaveLength(1);
    expect(a.perdu[0]).toMatchObject({ bas: 4_800, haut: 6_400, coutManquant: true }); // 12 et 16 ventes × 4,00 € HT
    expect(a.perdu[0]!.titre).toContain("rupture sur 2 événements (dernière : Rouen, à 21 h 08)");
    expect(a.perdu[0]!.detail).toContain("de CA HT (coût manquant)");
  });
});

describe("pertes constatées : stock, espèces, prix", () => {
  it("écarts de stock : les stands se compensent (déplacés, pas perdus), seule la perte nette compte, au coût d'achat", () => {
    const a = analyserPertes({
      ...vide,
      stock: [
        { evenement: "Rouen", cle: "p:biere", nom: "Bière 50cl", stand: "Buvette Sud", ecart: -16, valeur: -1_920, unite: null },
        { evenement: "Rouen", cle: "p:biere", nom: "Bière 50cl", stand: "Buvette Nord", ecart: 2, valeur: 240, unite: null },
        { evenement: "Rouen", cle: "p:hotdog", nom: "Hot-dog", stand: "Buvette Sud", ecart: 3, valeur: 450, unite: null },
        { evenement: "Rouen", cle: "i:fut", nom: "Bière pression", stand: "Buvette Nord", ecart: -4_000, valeur: -1_200, unite: "l" },
        { evenement: "Rouen", cle: "p:cookie", nom: "Cookie", stand: "Buvette Nord", ecart: -5, valeur: null, unite: null },
      ],
    });
    const biere = a.perdu.find((p) => p.titre.includes("Bière 50cl"))!;
    expect(biere).toMatchObject({ famille: "stock", nature: "constate", bas: 1_680, haut: 1_680 });
    expect(biere.titre).toBe("Contrôler le stock de Bière 50cl : 14 manquent au comptage");
    expect(biere.detail).toContain("Buvette Sud −16, Buvette Nord +2 ; 2 compensés d'un stand à l'autre (déplacés, pas perdus)");
    expect(a.perdu.find((p) => p.titre.includes("Bière pression"))!.titre).toBe("Contrôler le stock de Bière pression : 4 L manquent au comptage");
    expect(a.perdu.some((p) => p.titre.includes("Hot-dog"))).toBe(false); // un surplus n'est pas une perte
    expect(a.perdu.find((p) => p.titre.includes("Cookie"))).toMatchObject({ montantConnu: false, bas: 0 });
    expect(a.totaux.constate).toBe(1_680 + 1_200);
  });

  it("espèces : le manque compte, l'excédent est signalé sans être une perte ; ventes sous le tarif ramenées en HT", () => {
    const a = analyserPertes({
      ...vide,
      especes: [
        { evenement: "Rouen", libelle: "Caisse 3 (Buvette Nord)", ecart: -1_250 },
        { evenement: "Rouen", libelle: "Coffre", ecart: -500 },
        { evenement: "Rouen", libelle: "Caisse 1 (Buvette Sud)", ecart: 400 },
        { evenement: "Rouen", libelle: "Caisse 2 (Buvette Sud)", ecart: null },
      ],
      sousTarif: [
        { produit: "Coca 33cl", quantite: 3, prixVendu: 300, prixTarif: 350, tauxTarif: 1_000 },
        { produit: "Eau", quantite: 2, prixVendu: 300, prixTarif: 250, tauxTarif: 550 }, // vendu plus cher : pas une perte
      ],
    });
    expect(a.perdu.map((p) => p.titre)).toEqual([
      `Vérifier le tiroir de la caisse 3 (Buvette Nord) : ${formaterMontant(1_250)} manquent au comptage`,
      `Vérifier le coffre : ${formaterMontant(500)} manquent au comptage`,
      `Vérifier le prix de Coca 33cl sur les tablettes : 3 vendus sous le tarif (${formaterMontant(300)} au lieu de ${formaterMontant(350)})`,
    ]);
    expect(a.perdu[2]).toMatchObject({ bas: 136, haut: 136 }); // 1,50 € TTC à 10 % = 1,36 € HT
    expect(a.signes[0]!.titre).toBe(`Excédent d'espèces de ${formaterMontant(400)}`);
    expect(a.totaux.constate).toBe(1_250 + 500 + 136);
  });
});

describe("pistes de gain : ordres de grandeur", () => {
  it("sous la cible : frites à 61 % pour une cible de 70 % → 83,88 € de marge en plus, à ventes égales", () => {
    const a = analyserPertes({ ...vide, produits: [produit("Frites", 200, 93_200, 56_852, 7_000), produit("Bière", 100, 50_000, 40_000, 7_000), produit("Cookie", 10, 2_000, 1_000)] });
    const cibles = a.pistes.filter((p) => p.famille === "cible");
    expect(cibles).toHaveLength(1); // le cookie n'a pas de cible : il n'est pas jugé
    expect(cibles[0]).toMatchObject({ nature: "piste", bas: 8_388 });
    expect(cibles[0]!.titre).toBe("Revoir le prix ou le coût de Frites : marge de 61,0 % pour une cible de 70,0 %");
  });

  it("volume × marge (exemple du module 6) : l'eau rapporte 2,44 € par vente contre 4,10 € pour le reste de la carte → ≈ 428 € sur 258 ventes", () => {
    const a = analyserPertes({ ...vide, produits: [produit("Eau 50cl", 258, 100_000, 62_952), produit("Bière", 1_000, 600_000, 410_000), produit("Hot-dog", 500, 300_000, 205_000)] });
    expect(a.pistes).toHaveLength(1);
    expect(a.pistes[0]).toMatchObject({ famille: "volume_marge", bas: 42_828 });
    expect(a.pistes[0]!.titre).toBe("Eau 50cl : 14,7 % des ventes pour 9,3 % de la marge");
    expect(a.pistes[0]!.detail).toContain("Ordre de grandeur, pas une prévision");
  });

  it("écarts entre stands ramenés aux tickets : 12 frites pour 100 tickets à Sud contre 31 à Nord → 152 ventes de plus ; un stand en rupture n'est pas comparé", () => {
    const entree: EntreePertes = {
      ...vide,
      produits: [produit("Frites", 406, 60_900, 40_600)],
      produitsParStand: [
        { produitId: "Frites", produit: "Frites", standId: "N", stand: "Buvette Nord", quantite: 310, caHt: 46_500 },
        { produitId: "Frites", produit: "Frites", standId: "S", stand: "Buvette Sud", quantite: 96, caHt: 14_400 },
      ],
      ticketsParStand: { N: 1_000, S: 800 },
    };
    const a = analyserPertes(entree);
    expect(a.pistes).toHaveLength(1);
    expect(a.pistes[0]).toMatchObject({ famille: "stands", bas: 15_200 }); // 152 × 1,00 € de marge par vente
    expect(a.pistes[0]!.titre).toBe("Frites à Buvette Sud : 12 pour 100 tickets, contre 31 à Buvette Nord");
    const enRupture: EntreeRupture = { evenement: "Rouen", standId: "S", stand: "Buvette Sud", produitId: "Frites", produit: "Frites", ticketsStand, ventesProduit: ventesFrites, caHt: 1_800, quantite: 12, coutUnitaire: 50 };
    expect(analyserPertes({ ...entree, ruptures: [enRupture] }).pistes.filter((p) => p.famille === "stands")).toHaveLength(0);
  });
});

describe("signes sans chiffrage : caisse à plein régime", () => {
  it("12 tickets par tranche de 5 min pendant 20 min, 3 avant et après : à plein régime de 21 h 00 à 21 h 20", () => {
    const tickets: number[] = [];
    const tranche = (debut: number, n: number) => {
      for (let i = 0; i < n; i++) tickets.push(minute(debut) + i * 20_000);
    };
    // 20 h 30 → 21 h 00 : calme ; 21 h 00 → 21 h 20 : mi-temps ; puis calme.
    for (const m of [0, 5, 10, 15, 20, 25]) tranche(m, 3);
    for (const m of [30, 35, 40, 45]) tranche(m, 12);
    for (const m of [50, 55]) tranche(m, 3);
    expect(pleinRegime(tickets)).toEqual({ debut: minute(30), fin: minute(50), maximum: 12, minutes: 20 });
    const a = analyserPertes({ ...vide, caisses: [{ evenement: "Rouen", caisse: 3, stand: "Buvette Nord", tickets }] });
    expect(a.signes[0]!.titre).toBe("Buvette Nord, caisse 3 : à plein régime de 21 h 00 à 21 h 20");
    expect(a.signes[0]!.detail).toContain("Non chiffré");
  });

  it("[F] une caisse calme (moins de 10 tickets en 5 min) ou un pic bref (moins de 15 min) n'est pas signalée", () => {
    expect(pleinRegime(Array.from({ length: 40 }, (_, i) => minute(i)))).toBeNull(); // 5 tickets par tranche au plus
    const pic = [...Array.from({ length: 12 }, (_, i) => minute(30) + i * 20_000), ...Array.from({ length: 12 }, (_, i) => minute(35) + i * 20_000)];
    expect(pleinRegime(pic)).toBeNull(); // 2 tranches seulement
  });
});

describe("familles jamais additionnées", () => {
  it("l'accordé (offerts, remises, fidélité) est rendu tel quel, hors des pertes ; rien à signaler sans données", () => {
    const a = analyserPertes({ ...vide, reductions: { remises: 1_200, offerts: 3_500, fidelite: 800 } });
    expect(a).toEqual({ perdu: [], pistes: [], accorde: { remises: 1_200, offerts: 3_500, fidelite: 800 }, signes: [], totaux: { constate: 0, estimeBas: 0, estimeHaut: 0 } });
  });
});
