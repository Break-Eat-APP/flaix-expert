/**
 * Clôtures de période (dossier §15.107) — plan de tests C1 à C6 du §15.19, contre la vraie base.
 * Les événements sont datés dans des mois passés (2025) pour que les périodes soient terminées.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EtatClotures, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let caisse: string;
let biere: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const etat = async () => (await appel<EtatClotures>("GET", "/api/clotures/periodes")).corps;
const mois = async (cle: string) => (await etat()).mois.find((m) => m.cle === cle)!;

async function creer(libelle: string, debut: string) {
  return (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut })).corps.find((e) => e.libelle === libelle)!;
}
/** Ouvre l'événement, vend `n` bières (7,00 € à 20 %), clôture la caisse ; clôt l'événement si demandé. */
async function jouer(e: Evenement, n: number, clore = true) {
  await appel("POST", `/api/evenements/${e.id}/ouverture`);
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(biere, n)]);
  await envoyer(appel, t);
  await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
  if (clore) expect((await appel("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [s.id] })).corps[0]!;
});

describe("premier mois de l'exercice : à régler par le directeur (§15.108)", () => {
  it("vide sur un lieu neuf : aucun exercice proposé, clôture d'exercice refusée ; puis réglé à janvier", async () => {
    expect((await etat()).moisDebutExercice).toBeNull();
    expect((await etat()).exercices).toEqual([]);
    const r = await appel<{ erreur: string }>("POST", "/api/clotures/exercice", { premierMois: "2025-01" });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("Règle d'abord");
    expect((await appel<EtatClotures>("PUT", "/api/lieu/exercice", { moisDebut: 1 })).corps.moisDebutExercice).toBe(1);
  });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("C1 — Z de l'événement (clôture journalière)", () => {
  it("à la clôture de l'événement : totaux figés, TVA par taux exacte, perpétuel avancé, empreinte produite", async () => {
    await jouer(await creer("Mars 1", "2025-03-10T19:00:00+01:00"), 2);
    const z = (await etat()).historique.find((h) => h.niveau === "match")!;
    // 2 × 7,00 € = 14,00 € TTC ; HT 11,67 € ; TVA 2,33 €.
    expect(z).toMatchObject({ libelle: "Mars 1", debut: "2025-03-10", totalTtc: 1400, perpetuelAvant: 0, perpetuelApres: 1400, tickets: 1, carte: 1400 });
    expect(z.ventilation).toEqual([{ tauxTva: 2000, ht: 1167, tva: 233, ttc: 1400 }]);
    expect(z.parCaisse).toEqual([expect.objectContaining({ numero: 1, total: 1400, perpetuel: 1400 })]);
    expect(z.empreinte).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("clôture mensuelle", () => {
  it("bloquée tant qu'un événement du mois n'est pas clos", async () => {
    const m2 = await creer("Mars 2", "2025-03-24T19:00:00+01:00");
    await jouer(m2, 3, false);
    expect(await mois("2025-03")).toMatchObject({ etat: "bloque", raison: "1 événement pas encore clos." });
    expect((await appel("POST", "/api/clotures/mois", { mois: "2025-03" })).statut).toBe(409);
    await appel("POST", `/api/evenements/${m2.id}/cloture`);
    expect((await mois("2025-03")).etat).toBe("cloturable");
  });

  it("un mois ne se clôt pas avant le précédent qui a des événements ; le mois en cours n'est jamais clôturable", async () => {
    await jouer(await creer("Mai 1", "2025-05-12T19:00:00+02:00"), 1);
    expect(await mois("2025-05")).toMatchObject({ etat: "bloque", raison: "Clôture d'abord Mars 2025." });
    const courant = (await etat()).mois.find((m) => m.raison === "Le mois n'est pas terminé.");
    expect(courant).toBeDefined();
  });

  it("C3 / C4 — grand total du mois = somme de ses événements ; perpétuel après = avant + grand total", async () => {
    const r = await appel<EtatClotures>("POST", "/api/clotures/mois", { mois: "2025-03" });
    expect(r.statut).toBe(200);
    const mars = r.corps.mois.find((m) => m.cle === "2025-03")!.cloture!;
    // 14,00 € + 21,00 € = 35,00 €.
    expect(mars).toMatchObject({ niveau: "mois", libelle: "Mars 2025", debut: "2025-03-01", fin: "2025-03-31", totalTtc: 3500, perpetuelAvant: 0, perpetuelApres: 3500, tickets: 2 });
    expect(mars.ventilation[0]).toMatchObject({ ttc: 3500 });
    expect((await appel("POST", "/api/clotures/mois", { mois: "2025-03" })).statut).toBe(409);
    const mai = (await appel<EtatClotures>("POST", "/api/clotures/mois", { mois: "2025-05" })).corps.mois.find((m) => m.cle === "2025-05")!.cloture!;
    expect(mai).toMatchObject({ totalTtc: 700, perpetuelAvant: 3500, perpetuelApres: 4200 });
  });

  it("un mois clôturé ne reçoit plus d'événement, ni créé, ni déplacé, ni ouvert", async () => {
    const r = await appel<{ erreur: string }>("POST", "/api/evenements", { libelle: "Mars 3", debut: "2025-03-28T19:00:00+01:00" });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("Mars 2025 est clôturé");
    const juin = await creer("Juin 1", "2025-06-10T19:00:00+02:00");
    expect((await appel("PATCH", `/api/evenements/${juin.id}`, { debut: "2025-05-20T19:00:00+02:00" })).statut).toBe(409);
  });
});

describe("clôture de l'exercice", () => {
  it("C2 / C6 — exercice 2025 : somme de ses mois, perpétuel chaîné ; l'exercice en cours n'est pas terminé", async () => {
    // Juin 1 n'a pas été joué : son mois a un événement « à venir » qui bloque l'exercice.
    const ex = (await etat()).exercices.find((x) => x.cle === "2025-01")!;
    expect(ex).toMatchObject({ libelle: "Exercice 2025", etat: "bloque" });
    const juin = (await etat()).mois.find((m) => m.cle === "2025-06")!;
    await jouer((await appel<Evenement[]>("GET", "/api/evenements")).corps.find((e) => e.id === juin.matchs[0]!.id)!, 4);
    await appel("POST", "/api/clotures/mois", { mois: "2025-06" });
    const r = await appel<EtatClotures>("POST", "/api/clotures/exercice", { premierMois: "2025-01" });
    expect(r.statut).toBe(200);
    const c = r.corps.exercices.find((x) => x.cle === "2025-01")!.cloture!;
    // 35,00 + 7,00 + 28,00 = 70,00 €.
    expect(c).toMatchObject({ niveau: "exercice", debut: "2025-01-01", fin: "2025-12-31", totalTtc: 7000, perpetuelAvant: 0, perpetuelApres: 7000, tickets: 4 });
    // Le perpétuel des Z d'événement suit la même somme.
    expect(r.corps.perpetuel).toBe(7000);
    await jouer(await creer("Août 2026", "2026-08-15T19:00:00+02:00"), 1);
    expect(r.corps.exercices.length).toBe(1);
    expect((await etat()).exercices.find((x) => x.cle === "2026-01")).toMatchObject({ etat: "bloque", raison: "L'exercice n'est pas terminé." });
  });

  it("le premier mois de l'exercice ne se change plus une fois un exercice clôturé", async () => {
    const r = await appel<{ erreur: string }>("PUT", "/api/lieu/exercice", { moisDebut: 7 });
    expect(r.statut).toBe(409);
  });

  it("la chaîne des clôtures est intègre", async () => {
    const v = await appel<{ ok: boolean; maillons: number }>("POST", "/api/clotures/verification");
    // 5 Z d'événement + 3 mois + 1 exercice.
    expect(v.corps).toEqual({ ok: true, maillons: 9, rupture: null });
  });

  it("C5 [F] — le perpétuel ne se remet pas à zéro et une clôture ne se modifie pas, même en écrivant dans la base", async () => {
    const ctx = { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId };
    expect(await codeErreur(app.transaction(ctx, (c) => c.query("UPDATE cloture_periode SET perpetuel_apres_centimes = 0 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM cloture_periode WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    const inserer = app.transaction(ctx, (c) =>
      c.query(
        `INSERT INTO cloture_periode (lieu_id, sequence, niveau, debut, fin, total_ttc_centimes, perpetuel_avant_centimes, perpetuel_apres_centimes, details, horodatage, par, empreinte_precedente, empreinte)
         VALUES ($1, 99, 'mois', '2024-01-01', '2024-01-31', 100, 7000, 0, '{}', now(), $2, $3, $3)`,
        [lieu.lieuId, lieu.utilisateurId, "0".repeat(64)],
      ),
    );
    expect(await codeErreur(inserer)).toBe("23514");
  });
});
