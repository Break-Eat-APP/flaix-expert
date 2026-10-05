/**
 * Prévision du prochain événement (dossier §15.143), contre la vraie base : quatre événements joués, un à venir
 * avec son affluence prévue ; la prévision se ramène à l'affluence et se vérifie sur les événements joués.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, Produit, ReponsePrevision, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let stand: Stand;
let frites: Produit;
const joues: Evenement[] = [];
let prochain: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
const JOUR = 86_400_000;
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  const caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  frites = (await appel<Produit[]>("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  // Quatre événements joués : 0,01 frite par spectateur à chaque fois.
  for (const [libelle, jours, spectateurs, quantite] of [["Gap", 4, 2_000, 20], ["Rouen", 3, 2_500, 25], ["Brest", 2, 3_000, 30], ["Anglet", 1, 2_000, 20]] as const) {
    const e = (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() - jours * JOUR).toISOString(), spectateurs })).corps.find((x) => x.libelle === libelle)!;
    await appel("POST", `/api/evenements/${e.id}/ouverture`);
    const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: null });
    const t = tablette(caisse, o.corps);
    vendreHorsLigne(t, [ligne(frites, quantite)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
    joues.push(e);
  }
  prochain = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Dunkerque", debut: new Date(Date.now() + JOUR).toISOString(), spectateurs: 3_000 })).corps.find((x) => x.libelle === "Dunkerque")!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("prévision du prochain événement (§15.143)", () => {
  it("par défaut, le prochain événement : 3 000 spectateurs prévus × 0,01 frite par spectateur → 30 frites, 150 € de CA", async () => {
    const r = (await appel<ReponsePrevision>("GET", "/api/prevision")).corps;
    expect(r.evenement).toMatchObject({ id: prochain.id, etat: "a_venir", spectateurs: 3_000 });
    expect(r.prevision!.base).toBe("affluence");
    expect(r.prevision!.comparables.map((c) => c.libelle)).toEqual(["Anglet", "Brest", "Rouen", "Gap"]);
    expect(r.prevision!.produits).toEqual([expect.objectContaining({ stand: "Buvette Nord", produit: "Frites", ventes: { bas: 30, median: 30, haut: 30 } })]);
    expect(r.prevision!.ca).toEqual({ bas: 15_000, median: 15_000, haut: 15_000 });
    expect(r.realise).toBeNull();
  });

  it("la prévision se vérifie : Anglet (dans la fourchette, d'après les 3 d'avant), Brest (au-dessus, d'après 2 sans affluence) → 1 sur 2", async () => {
    const r = (await appel<ReponsePrevision>("GET", "/api/prevision")).corps;
    expect(r.fiabilite).toEqual({ evenements: 2, dansLaFourchette: 1 });
  });

  it("un événement joué : la prévision recalculée avec les seuls événements d'avant lui, et le réalisé", async () => {
    const anglet = joues[3]!;
    const r = (await appel<ReponsePrevision>("GET", `/api/prevision?evenementId=${anglet.id}`)).corps;
    expect(r.prevision!.comparables.map((c) => c.libelle)).toEqual(["Brest", "Rouen", "Gap"]);
    expect(r.prevision!.ca).toEqual({ bas: 10_000, median: 10_000, haut: 10_000 });
    expect(r.realise).toEqual({ ca: 10_000, tickets: 1, produits: { [`${stand.id}|${frites.id}`]: 20 } });
  });

  it("un lieu qui n'a encore aucun événement : réponse vide (l'écran invite à créer la saison), jamais une erreur", async () => {
    const vide = await creerLieuDeTest(proprietaire);
    const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: vide.email, motDePasse: MOT_DE_PASSE_TEST } });
    const autre = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
    const p = await serveur.inject({ method: "GET", url: "/api/prevision", headers: { cookie: autre } });
    expect(p.statusCode).toBe(200);
    expect(p.json()).toMatchObject({ evenement: null, prevision: null, choix: [] });
  });

  it("[F] le premier événement joué n'a pas d'historique : pas de prévision inventée ; un événement inconnu est refusé", async () => {
    expect((await appel<ReponsePrevision>("GET", `/api/prevision?evenementId=${joues[0]!.id}`)).corps.prevision).toBeNull();
    expect((await appel("GET", "/api/prevision?evenementId=00000000-0000-4000-8000-000000000000")).statut).toBe(404);
  });
});
