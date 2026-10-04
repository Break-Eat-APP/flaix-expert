/**
 * Bilan sur une période « du … au … » (dossier §15.133), contre la vraie base : Résultats et Finances
 * additionnent les événements de la période et la comparent à la période précédente de même durée.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, FinancesSoiree, PosteDepense, Produit, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let caisse: string;
let biere: Produit;
let sept5: Evenement;
let sept20: Evenement;
let securite: PosteDepense;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

/** Joue un événement en carte uniquement : ouverture, ventes, clôture de caisse puis de l'événement. */
async function jouer(libelle: string, debut: string, spectateurs: number | null, bieres: number): Promise<Evenement> {
  const e = (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut, spectateurs })).corps.find((x) => x.libelle === libelle)!;
  await appel("POST", `/api/evenements/${e.id}/ouverture`);
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(biere, bieres)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
  return e;
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  // Bière 7,00 € TTC à 20 % (5,83 € HT), coût 1,20 €.
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  await jouer("Août", "2026-08-20T18:00:00Z", 1_500, 1);
  sept5 = await jouer("Gap", "2026-09-05T18:00:00Z", 2_000, 2);
  sept20 = await jouer("Rouen", "2026-09-20T18:00:00Z", null, 3);
  // 0 h 30 le 1er octobre à Paris : hors de septembre.
  await jouer("Minuit", "2026-09-30T22:30:00Z", 500, 4);
  securite = (await appel<PosteDepense[]>("POST", "/api/postes-depense", { nom: "Sécurité" })).corps[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("Résultats sur une période", () => {
  it("septembre : les deux événements de la période additionnés, comparés à la période précédente de même durée", async () => {
    const r = (await appel<Resultats>("GET", "/api/resultats?du=2026-09-01&au=2026-09-30")).corps;
    expect(r.periode).toMatchObject({ du: "2026-09-01", au: "2026-09-30", precedente: { du: "2026-08-02", au: "2026-08-31", evenements: 1 } });
    expect(r.periode!.evenements.map((e) => e.libelle).sort()).toEqual(["Gap", "Rouen"]);
    expect(r.evenement).toMatchObject({ libelle: "du 1er au 30 septembre 2026", etat: "clos" });
    expect(r.actuel).toMatchObject({ caTtc: 3_500, tickets: 2, panierMoyen: 1_750, coutMatiere: 600 });
    expect(r.actuel!.produits).toEqual([expect.objectContaining({ nom: "Bière", quantite: 5, caTtc: 3_500 })]);
    expect(r.comparaison!.libelle).toBe("du 2 au 31 août 2026");
    expect(r.precedent).toMatchObject({ caTtc: 700, tickets: 1 });
  });

  it("affluence incomplète : pas de CA par spectateur, et « À surveiller » le dit", async () => {
    const r = (await appel<Resultats>("GET", "/api/resultats?du=2026-09-01&au=2026-09-30")).corps;
    expect(r.actuel).toMatchObject({ spectateurs: null, caParSpectateur: null });
    expect(r.alertes.map((a) => a.titre)).toContain("Affluence non saisie sur 1 événement");
  });

  it("une période sans événement : rien à additionner, sans erreur", async () => {
    const r = (await appel<Resultats>("GET", "/api/resultats?du=2026-07-01&au=2026-07-31")).corps;
    expect(r.periode!.evenements).toEqual([]);
    expect(r.actuel).toMatchObject({ caTtc: 0, tickets: 0 });
    expect(r.comparaison).toBeNull();
  });

  it("[F] période incomplète, à l'envers ou date impossible : refusée", async () => {
    expect((await appel("GET", "/api/resultats?du=2026-09-01")).statut).toBe(400);
    expect((await appel("GET", "/api/resultats?du=2026-09-30&au=2026-09-01")).statut).toBe(400);
    expect((await appel("GET", "/api/resultats?du=2026-02-30&au=2026-03-01")).statut).toBe(400);
  });
});

describe("Finances sur une période", () => {
  it("dépenses et marge nette additionnées, soirée par soirée ; la cible n'est jugée que si chaque soirée en a une", async () => {
    await appel("PUT", `/api/finances/${sept5.id}/depenses/${securite.id}`, { mode: "euros", valeur: 100 });
    await appel("PUT", `/api/finances/${sept20.id}/depenses/${securite.id}`, { mode: "pourcent", valeur: 1_000 });
    let f = (await appel<FinancesSoiree>("GET", "/api/finances?du=2026-09-01&au=2026-09-30")).corps;
    const [gap, rouen] = f.periode!.soirees;
    expect(f.periode!.soirees.map((s) => s.libelle)).toEqual(["Gap", "Rouen"]);
    expect(f.encaisseTtc).toBe(3_500);
    expect(f.depenses).toEqual([expect.objectContaining({ nom: "Sécurité", montant: 100 + Math.round(rouen!.caHt / 10), mode: null })]);
    expect(f.margeNette).toBe(gap!.margeNette! + rouen!.margeNette!);
    expect(f.etatCible).toBeNull();

    expect((await appel("PUT", "/api/finances/cible", { cible: 4_000 })).statut).toBe(200);
    f = (await appel<FinancesSoiree>("GET", "/api/finances?du=2026-09-01&au=2026-09-30")).corps;
    const cibles = f.periode!.soirees.reduce((t, s) => t + s.etatCible!.cible, 0);
    expect(f.etatCible).toMatchObject({ cible: cibles, ecart: f.margeNette! - cibles });
  });

  it("[F] ni événement ni période complète : refusé", async () => {
    expect((await appel("GET", "/api/finances")).statut).toBe(400);
    expect((await appel("GET", "/api/finances?du=2026-09-01")).statut).toBe(400);
  });
});
