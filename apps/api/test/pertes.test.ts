/**
 * Revenue Engine — « Où je perds de l'argent » (dossier §15.138), contre la vraie base : la route lit
 * ventes, stock, Z et heures des tickets, et le moteur chiffre ruptures, écarts, manques et ventes sous le tarif.
 * Les tests [F] provoquent l'erreur ou la fraude qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, Produit, ReponsePertes, RepriseCaisse, Stand, StockMatch } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let autreCookie = "";
let stand: Stand;
let caisse: string;
let biere: Produit;
let frites: Produit;
let rouen: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown, avec = cookie) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: avec }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

async function connecter(email: string) {
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email, motDePasse: MOT_DE_PASSE_TEST } });
  return `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  cookie = await connecter((await creerLieuDeTest(proprietaire)).email);
  autreCookie = await connecter((await creerLieuDeTest(proprietaire)).email);
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true })).corps[0]!.caisses[0]!.id;
  // Bière 7,00 € TTC à 20 % (coût 1,20 €) ; frites 5,00 € TTC à 10 % (coût 1,20 €).
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [stand.id] })).corps;
  biere = produits.find((p) => p.nom === "Bière")!;
  frites = produits.find((p) => p.nom === "Frites")!;
  rouen = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString(), spectateurs: 3_000 })).corps.find((e) => e.libelle === "Rouen")!;

  // Livraison en réserve au coût de la fiche, puis mise en place : 12 frites, 100 bières.
  const jour = new Date().toISOString().slice(0, 10);
  for (const p of [frites, biere]) expect((await appel("POST", "/api/stock/livraisons", { produitId: p.id, quantite: 200, prixUnitaire: 120, dateLivraison: jour })).statut).toBe(201);
  expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: rouen.id, standId: stand.id, produitId: frites.id, quantite: 12 })).statut).toBe(200);
  expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: rouen.id, standId: stand.id, produitId: biere.id, quantite: 100 })).statut).toBe(200);
  await appel("POST", `/api/evenements/${rouen.id}/ouverture`);

  const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: 10_000 });
  const t = tablette(caisse, o.corps);
  const debut = Date.now();
  const a = (i: number) => new Date(debut + i * 1_000);
  // 30 tickets de bière, dont un sur cinq avec 2 frites : les 12 frites partent au 30e ticket (rupture).
  for (let i = 1; i <= 30; i++) vendreHorsLigne(t, i % 5 === 0 ? [ligne(biere), ligne(frites, 2)] : [ligne(biere)], { horodatage: a(i) });
  // 10 tickets de bière après la rupture, dont un annulé : il ne compte pas dans le rythme du stand.
  const tickets = [];
  for (let i = 31; i <= 40; i++) tickets.push(vendreHorsLigne(t, [ligne(biere)], { horodatage: a(i) }));
  annulerHorsLigne(t, tickets[9]!, "Erreur de saisie");
  // Une bière vendue 6,00 € au lieu de 7,00 € (tablette restée sur un ancien prix).
  vendreHorsLigne(t, [{ ...ligne(biere), prixUnitaire: 600 }], { horodatage: a(41) });
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  // Tout en carte : 100,00 € attendus au tiroir, 90,00 € comptés.
  expect((await appel("POST", `/api/sessions-caisse/${o.corps.contexte.sessionId}/comptage`, { coupures: { "5000": 1, "2000": 2 }, motif: "Erreur de rendu" })).statut).toBe(200);
  // Comptage du stock : 5 bières de moins que l'attendu, frites à zéro.
  const s = (await appel<StockMatch>("GET", `/api/stock?evenementId=${rouen.id}`)).corps;
  const restant = s.stands[0]!.lignes.find((l) => l.produitId === biere.id)!.restant;
  expect((await appel("PUT", "/api/stock/comptage", { evenementId: rouen.id, standId: stand.id, produitId: biere.id, quantite: restant - 5, motif: "Casse au service" })).statut).toBe(200);
  expect((await appel("PUT", "/api/stock/comptage", { evenementId: rouen.id, standId: stand.id, produitId: frites.id, quantite: 0 })).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("où je perds de l'argent : un événement", () => {
  it("rupture de frites chiffrée au rythme du stand, sans le ticket annulé ; stock, espèces et prix constatés", async () => {
    const r = await appel<ReponsePertes>("GET", `/api/pertes?evenementId=${rouen.id}`);
    expect(r.statut).toBe(200);
    const { analyse, suivi, evenements } = r.corps;
    expect(evenements.map((e) => e.libelle)).toEqual(["Rouen"]);
    expect(suivi).toEqual({ stock: true, especes: true });

    // 12 frites pour 30 tickets (0,4 par ticket) ; après : 10 tickets de bière dont un annulé, plus celui vendu sous le tarif
    // → 10 tickets ; 0,4 × 10 = 4 tout rond. Si l'annulé comptait : 0,4 × 11 = 4,4 → « entre 4 et 5 ».
    const rupture = analyse.perdu.find((p) => p.famille === "rupture")!;
    expect(rupture.titre).toContain("Mettre plus de Frites à Buvette Nord : rupture à");
    expect(rupture.detail).toMatch(/^4 ventes manquées/);
    expect(rupture.bas).toBeGreaterThan(0);

    const stock = analyse.perdu.find((p) => p.famille === "stock")!;
    expect(stock).toMatchObject({ nature: "constate", bas: 600, titre: "Contrôler le stock de Bière : 5 manquent au comptage" }); // 5 × 1,20 €
    expect(analyse.perdu.find((p) => p.famille === "especes")).toMatchObject({ bas: 1_000 });
    expect(analyse.perdu.find((p) => p.famille === "tarif")).toMatchObject({ bas: 83 }); // 1,00 € TTC à 20 % = 0,83 € HT
    expect(analyse.totaux.constate).toBe(600 + 1_000 + 83);
    expect(analyse.totaux.estimeHaut).toBe(rupture.haut);
  });

  it("une période qui contient l'événement donne la même analyse", async () => {
    const jour = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date(rouen.debut));
    const p = await appel<ReponsePertes>("GET", `/api/pertes?du=${jour}&au=${jour}`);
    const e = await appel<ReponsePertes>("GET", `/api/pertes?evenementId=${rouen.id}`);
    expect(p.corps.evenements).toHaveLength(1);
    expect(p.corps.analyse.totaux).toEqual(e.corps.analyse.totaux);
  });

  it("[F] l'événement d'un autre lieu est introuvable ; sans événement ni période, la demande est refusée", async () => {
    expect((await appel("GET", `/api/pertes?evenementId=${rouen.id}`, undefined, autreCookie)).statut).toBe(404);
    expect((await appel("GET", "/api/pertes")).statut).toBe(400);
    expect((await appel("GET", "/api/pertes?du=2026-10-05&au=2026-10-01")).statut).toBe(400);
  });

  it("une période sans événement : rien à signaler, rien d'inventé", async () => {
    const r = await appel<ReponsePertes>("GET", "/api/pertes?du=2020-01-01&au=2020-01-31");
    expect(r.corps).toEqual({
      evenements: [],
      suivi: { stock: false, especes: false },
      analyse: { perdu: [], pistes: [], accorde: { remises: 0, offerts: 0, fidelite: 0 }, signes: [], totaux: { constate: 0, estimeBas: 0, estimeHaut: 0 } },
    });
  });
});
