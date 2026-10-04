/**
 * Fidélité à la caisse (dossier §15.127, option A de Rémi), contre la vraie base : points réservés
 * par le serveur puis dépensés dans le ticket scellé, code promo plafonné réservé, code sans plafond
 * utilisable hors ligne, annulation qui rend les points, anomalies signalées sans refus.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EtatFidelite, Evenement, PointsAbonneCaisse, Produit, RepriseCaisse, ReservationCaisse, Stand, TicketVue } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let caisse = "";
let biere: Produit;
let match: Evenement;
let t: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const points = async () => (await appel<PointsAbonneCaisse>("GET", `/api/caisses/${caisse}/fidelite/abonnes/ab-1`)).corps;
const tickets = async () => (await appel<TicketVue[]>("GET", `/api/tickets?evenementId=${match.id}`)).corps;
const abonne = { remisePb: 1000, motif: "abonne" as const, reference: "AB-1" };

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("PUT", "/api/lieu/reglages-caisse", { remiseAbonnePb: 1000 });
  let s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps[0]!;
  s = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!;
  caisse = s.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [s.id] })).corps[0]!;
  await appel("PUT", "/api/fidelite/reglages", { pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 });
  const e = (await appel<EtatFidelite>("POST", "/api/fidelite/abonnes", { numero: "AB-1", nom: "Karim" })).corps;
  const id = e.abonnes.find((a) => a.numero === "AB-1")!.id;
  await appel("POST", `/api/fidelite/abonnes/${id}/points`, { points: 300, commentaire: "Solde de départ" });
  await appel("POST", "/api/fidelite/codes", { code: "SANSPLAFOND", type: "pourcentage", valeur: 1000, debut: "2026-01-01", fin: "2099-12-31", usageMax: null });
  await appel("POST", "/api/fidelite/codes", { code: "UNSEUL", type: "montant", valeur: 200, debut: "2026-01-01", fin: "2099-12-31", usageMax: 1 });
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Spartiates – Rouen", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("points de l'abonné à la caisse", () => {
  it("solde lu au serveur : 300 points = 3 paliers de 5,00 € ; un n° sans fiche est refusé clairement", async () => {
    expect(await points()).toMatchObject({ numero: "AB-1", nom: "Karim", solde: 300, disponibles: 300, palierPoints: 100, valeurPalier: 500, paliersMax: 3 });
    const r = await appel<{ erreur: string }>("GET", `/api/caisses/${caisse}/fidelite/abonnes/ZZ-9`);
    expect(r.statut).toBe(404);
    expect(r.corps.erreur).toContain("Aucune fiche");
  });

  it("réserver 2 paliers bloque 200 points pour les autres caisses ; on ne peut pas réserver plus que le disponible", async () => {
    const r = await appel<ReservationCaisse>("POST", `/api/caisses/${caisse}/fidelite/points`, { numero: "ab-1", paliers: 2 });
    expect(r.statut).toBe(200);
    expect(r.corps.points).toEqual({ numero: "AB-1", points: 200, montant: 1000 });
    expect(await points()).toMatchObject({ solde: 300, disponibles: 100, paliersMax: 1 });
    expect((await appel("POST", `/api/caisses/${caisse}/fidelite/points`, { numero: "AB-1", paliers: 2 })).statut).toBe(409);

    // 3 bières à 21,00 € − 10 % abonné = 18,90 € − 10,00 € de points = 8,90 €.
    const v = vendreHorsLigne(t, [ligne(biere, 3)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 200, montant: 1000, reservation: r.corps.reservation! } } });
    expect(v.totalTtc).toBe(890);
    expect((await envoyer(appel, t)).statut).toBe(200);
    const ticket = (await tickets()).find((x) => x.id === v.id)!;
    expect(ticket).toMatchObject({ totalTtc: 890, fidelite: { codePromo: null, points: { points: 200, montant: 1000 } }, controle: null });
    // Gagnés : 8 points (8,90 €) ; dépensés : 200 → 300 − 200 + 8 = 108 ; plus rien de réservé.
    expect(await points()).toMatchObject({ solde: 108, disponibles: 108, paliersMax: 1 });
  });

  it("annulation du ticket : les points dépensés reviennent d'eux-mêmes", async () => {
    const v = (await tickets()).find((x) => x.type === "vente" && x.fidelite?.points)!;
    annulerHorsLigne(t, t.tickets.find((x) => x.id === v.id)!, "Erreur de saisie");
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect((await points()).solde).toBe(300);
    const fid = (await appel<EtatFidelite>("GET", "/api/fidelite")).corps;
    expect(fid.abonnes.find((a) => a.numero === "AB-1")!.points).toBe(300);
  });

  it("points rendus par la caissière avant d'encaisser : disponibles à nouveau tout de suite", async () => {
    const r = (await appel<ReservationCaisse>("POST", `/api/caisses/${caisse}/fidelite/points`, { numero: "AB-1", paliers: 1 })).corps;
    expect((await points()).disponibles).toBe(200);
    expect((await appel("POST", `/api/caisses/${caisse}/fidelite/reservations/${r.reservation}/liberation`)).statut).toBe(200);
    expect((await points()).disponibles).toBe(300);
    expect((await appel("POST", `/api/caisses/${caisse}/fidelite/reservations/${r.reservation}/liberation`)).statut).toBe(404);
  });
});

describe("codes promo à la caisse", () => {
  it("code sans plafond : aucune réservation, et gardé par la tablette pour servir sans réseau", async () => {
    const r = await appel<ReservationCaisse>("POST", `/api/caisses/${caisse}/fidelite/codes`, { code: " sansplafond " });
    expect(r.corps).toMatchObject({ reservation: null, codePromo: { code: "SANSPLAFOND", type: "pourcentage", valeur: 1000 } });
    const horsLigne = (await appel<{ code: string }[]>("GET", `/api/caisses/${caisse}/fidelite/codes-hors-ligne`)).corps.map((k) => k.code);
    expect(horsLigne).toEqual(["SANSPLAFOND"]);
    const v = vendreHorsLigne(t, [ligne(biere, 2)], { fidelite: { codePromo: { code: "SANSPLAFOND", type: "pourcentage", valeur: 1000, reservation: null }, points: null } });
    expect(v.totalTtc).toBe(1260);
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect((await tickets()).find((x) => x.id === v.id)!.controle).toBeNull();
  });

  it("code plafonné à 1 usage : la réservation prend l'usage, une seconde caisse le trouve épuisé", async () => {
    const r = await appel<ReservationCaisse>("POST", `/api/caisses/${caisse}/fidelite/codes`, { code: "UNSEUL" });
    expect(r.corps.reservation).not.toBeNull();
    const second = await appel<{ erreur: string }>("POST", `/api/caisses/${caisse}/fidelite/codes`, { code: "UNSEUL" });
    expect(second.statut).toBe(409);
    expect(second.corps.erreur).toContain("épuisé");
    const v = vendreHorsLigne(t, [ligne(biere)], { fidelite: { codePromo: { code: "UNSEUL", type: "montant", valeur: 200, reservation: r.corps.reservation }, points: null } });
    expect(v.totalTtc).toBe(500);
    expect((await envoyer(appel, t)).statut).toBe(200);
    const code = (await appel<EtatFidelite>("GET", "/api/fidelite")).corps.codes.find((k) => k.code === "UNSEUL")!;
    expect(code).toMatchObject({ usages: 1, etat: "epuise" });
  });

  it("[F] tablette trafiquée : points sans réservation, code plafonné sans réseau → encaissés (la vente a eu lieu) mais signalés", async () => {
    const faux = "11111111-2222-4333-8444-555555555555";
    const v1 = vendreHorsLigne(t, [ligne(biere, 2)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 100, montant: 500, reservation: faux } } });
    const v2 = vendreHorsLigne(t, [ligne(biere)], { fidelite: { codePromo: { code: "UNSEUL", type: "montant", valeur: 200, reservation: null }, points: null } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    const liste = await tickets();
    expect(liste.find((x) => x.id === v1.id)!.controle?.fidelite).toEqual(["points sans réservation connue du serveur (100 pts)"]);
    expect(liste.find((x) => x.id === v2.id)!.controle?.fidelite).toEqual(["code plafonné UNSEUL utilisé sans réservation du serveur"]);
  });

  it("[F] la base refuse de supprimer une réservation ou d'en changer le ticket", async () => {
    const { rows } = await proprietaire.pool.query<{ id: string }>("SELECT id FROM reservation_fidelite WHERE consommee_par IS NOT NULL LIMIT 1");
    await expect(proprietaire.pool.query("DELETE FROM reservation_fidelite WHERE id = $1", [rows[0]!.id])).rejects.toMatchObject({ code: "42501" });
    await expect(proprietaire.pool.query("UPDATE reservation_fidelite SET consommee_par = gen_random_uuid() WHERE id = $1", [rows[0]!.id])).rejects.toMatchObject({ code: "23514" });
  });
});

describe("audit Codex P1-001 : une réservation n'est consommée que si tout concorde", () => {
  beforeAll(async () => {
    // Les tests précédents ont dépensé ses points : de quoi réserver dans chacun des cas ci-dessous.
    const id = (await appel<EtatFidelite>("GET", "/api/fidelite")).corps.abonnes.find((x) => x.numero === "AB-1")!.id;
    await appel("POST", `/api/fidelite/abonnes/${id}/points`, { points: 1000, commentaire: "Recharge pour les tests d'audit" });
  });
  const consommee = async (reservation: string) =>
    (await proprietaire.pool.query<{ c: string | null }>("SELECT consommee_par AS c FROM reservation_fidelite WHERE id = $1", [reservation])).rows[0]!.c;
  const reserverPoints = async (caisseId: string, paliers: number) =>
    (await appel<ReservationCaisse>("POST", `/api/caisses/${caisseId}/fidelite/points`, { numero: "AB-1", paliers })).corps;
  const anomalies = async (id: string) => (await tickets()).find((x) => x.id === id)!.controle?.fidelite ?? [];

  it("200 points réservés, ticket à 100 points : signalé, réservation NON consommée", async () => {
    const r = await reserverPoints(caisse, 2);
    const v = vendreHorsLigne(t, [ligne(biere, 3)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 100, montant: 500, reservation: r.reservation! } } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(await anomalies(v.id)).toEqual(["réservation de points points différents de ceux réservés"]);
    expect(await consommee(r.reservation!)).toBeNull();
    await appel("POST", `/api/caisses/${caisse}/fidelite/reservations/${r.reservation}/liberation`);
  });

  it("réservation du code A utilisée avec le code B : signalé, l'usage de A n'est pas pris", async () => {
    await appel("POST", "/api/fidelite/codes", { code: "CODEA", type: "montant", valeur: 100, debut: "2026-01-01", fin: "2099-12-31", usageMax: 5 });
    await appel("POST", "/api/fidelite/codes", { code: "CODEB", type: "montant", valeur: 100, debut: "2026-01-01", fin: "2099-12-31", usageMax: 5 });
    const a = (await appel<ReservationCaisse>("POST", `/api/caisses/${caisse}/fidelite/codes`, { code: "CODEA" })).corps;
    const v = vendreHorsLigne(t, [ligne(biere)], { fidelite: { codePromo: { code: "CODEB", type: "montant", valeur: 100, reservation: a.reservation }, points: null } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(await anomalies(v.id)).toEqual(["code plafonné CODEB utilisé sans réservation du serveur"]);
    expect(await consommee(a.reservation!)).toBeNull();
  });

  it("réservation faite sur une autre caisse : signalé, non consommée", async () => {
    let nord = (await appel<Stand[]>("POST", "/api/stands", { nom: "Nord" })).corps.find((x) => x.nom === "Nord")!;
    nord = (await appel<Stand[]>("POST", `/api/stands/${nord.id}/caisses`, {})).corps.find((x) => x.nom === "Nord")!;
    const r = await reserverPoints(nord.caisses[0]!.id, 1);
    const v = vendreHorsLigne(t, [ligne(biere, 2)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 100, montant: 500, reservation: r.reservation! } } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(await anomalies(v.id)).toEqual(["réservation de points faite sur une autre caisse"]);
    expect(await consommee(r.reservation!)).toBeNull();
  });

  it("réservation expirée avant l'heure de la vente : signalé, non consommée", async () => {
    const r = await reserverPoints(caisse, 1);
    await proprietaire.pool.query("UPDATE reservation_fidelite SET expire_le = now() - interval '1 minute' WHERE id = $1", [r.reservation]);
    const v = vendreHorsLigne(t, [ligne(biere, 2)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 100, montant: 500, reservation: r.reservation! } } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(await anomalies(v.id)).toEqual(["réservation de points expirée avant la vente"]);
    expect(await consommee(r.reservation!)).toBeNull();
  });

  it("tout concorde : la réservation est consommée par ce ticket", async () => {
    const r = await reserverPoints(caisse, 1);
    const v = vendreHorsLigne(t, [ligne(biere, 2)], { ajustement: abonne, fidelite: { codePromo: null, points: { numero: "AB-1", points: 100, montant: 500, reservation: r.reservation! } } });
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect(await anomalies(v.id)).toEqual([]);
    expect(await consommee(r.reservation!)).toBe(v.id);
  });
});
