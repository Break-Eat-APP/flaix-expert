/**
 * Hygiène et HACCP (dossier §15.156), contre la vraie base : réglages (équipements, tâches) journalisés, relevé conforme
 * ou hors limite (action corrective exigée), relevé rattaché au match en cours, tâche faite, contrôle à réception et de
 * l'huile, registre d'une période, registre en écriture seule pour l'application, rappels du centre d'alertes, option.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CentreAlertes, CodeCaissiere, EntreeJournalTechnique, Evenement, Hygiene, RegistreHygiene, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let frigo: string;
let friteuse: string;
let match: Evenement;
let stand: Stand;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PATCH", url: string, payload?: unknown, avec = cookie) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie: avec }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  const json = String(r.headers["content-type"] ?? "").startsWith("application/json");
  return { statut: r.statusCode, corps: (json ? r.json() : null) as T, entetes: r.headers, cookies: r.cookies, octets: r.rawPayload };
}
/** Un JPEG de test : ses octets de début et de fin suffisent au contrôle du serveur. */
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300, 7), Buffer.from([0xff, 0xd9])]);
const jour = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar Nord" })).corps[0]!;
  const h = (await appel<Hygiene>("POST", "/api/hygiene/equipements", { nom: "Frigo bar", standId: stand.id, sorte: "froid" })).corps;
  frigo = h.equipements[0]!.id;
  friteuse = (await appel<Hygiene>("POST", "/api/hygiene/equipements", { nom: "Friteuse", sorte: "friteuse" })).corps.equipements.find((e) => e.nom === "Friteuse")!.id;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("hygiène et HACCP", () => {
  it("réglages : équipements et tâche, journalisés ; nom en double, limites inversées refusés", async () => {
    const h = (await appel<Hygiene>("POST", "/api/hygiene/taches", { nom: "Nettoyer la tireuse", moment: "fermeture" })).corps;
    expect(h.taches).toMatchObject([{ nom: "Nettoyer la tireuse", moment: "fermeture", actif: true }]);
    expect(h.equipements.map((e) => e.nom)).toEqual(["Frigo bar", "Friteuse"]);
    expect((await appel("POST", "/api/hygiene/equipements", { nom: "frigo BAR", sorte: "froid" })).statut).toBe(409);
    expect((await appel("POST", "/api/hygiene/equipements", { nom: "Vitrine", sorte: "froid", minDixiemes: 60, maxDixiemes: 20 })).statut).toBe(400);
    const types = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=20")).corps.filter((e) => e.type === "hygiene_reglage");
    expect(types).toHaveLength(3);
  });

  it("relevé conforme rattaché au match ; hors limite sans action refusé, avec action enregistré ; friteuse refusée", async () => {
    let h = (await appel<Hygiene>("POST", "/api/hygiene/releves", { equipementId: frigo, moment: "ouverture", temperatureDixiemes: 35 })).corps;
    expect(h.relevesDuJour[0]).toMatchObject({ equipement: "Frigo bar", temperatureDixiemes: 35, conforme: true, actionCorrective: null });
    expect(h.evenement).toMatchObject({ id: match.id });
    const { rows } = await proprietaire.pool.query("SELECT evenement_id FROM hygiene_releve WHERE lieu_id = $1", [lieu.lieuId]);
    expect(rows[0].evenement_id).toBe(match.id);
    const refus = await appel<{ erreur: string }>("POST", "/api/hygiene/releves", { equipementId: frigo, moment: "fermeture", temperatureDixiemes: 72 });
    expect(refus.statut).toBe(400);
    expect(refus.corps.erreur).toContain("7,2 °C : hors limite (≤ 4 °C)");
    h = (await appel<Hygiene>("POST", "/api/hygiene/releves", { equipementId: frigo, moment: "fermeture", temperatureDixiemes: 72, actionCorrective: "Produits jetés, frigo réglé" })).corps;
    expect(h.relevesDuJour[0]).toMatchObject({ conforme: false, actionCorrective: "Produits jetés, frigo réglé" });
    expect(h.nonConformes7j).toBe(1);
    expect((await appel("POST", "/api/hygiene/releves", { equipementId: friteuse, moment: "ouverture", temperatureDixiemes: 100 })).statut).toBe(400);
  });

  it("tâche faite ; réception non conforme avec action ; huile contrôlée puis à changer", async () => {
    const tache = (await appel<Hygiene>("GET", "/api/hygiene")).corps.taches[0]!;
    let h = (await appel<Hygiene>("POST", `/api/hygiene/taches/${tache.id}/fait`, {})).corps;
    expect(h.tachesFaites[0]).toMatchObject({ tacheId: tache.id, tache: "Nettoyer la tireuse" });
    expect((await appel("POST", "/api/hygiene/receptions", { fournisseur: "Metro", produits: "Saucisses", type: "frais", temperatureDixiemes: 80, dlcOk: true, emballageOk: true })).statut).toBe(400);
    h = (await appel<Hygiene>("POST", "/api/hygiene/receptions", { fournisseur: "Metro", produits: "Saucisses", type: "frais", temperatureDixiemes: 80, dlcOk: true, emballageOk: true, actionCorrective: "Livraison refusée" })).corps;
    expect(h.receptions[0]).toMatchObject({ conforme: false, actionCorrective: "Livraison refusée" });
    h = (await appel<Hygiene>("POST", "/api/hygiene/huiles", { equipementId: friteuse, action: "controle", polairesDixiemes: 180 })).corps;
    expect(h.huiles[0]).toMatchObject({ conforme: true, polairesDixiemes: 180 });
    expect((await appel("POST", "/api/hygiene/huiles", { equipementId: friteuse, action: "controle", polairesDixiemes: 270 })).statut).toBe(400);
    expect((await appel("POST", "/api/hygiene/huiles", { equipementId: frigo, action: "changement" })).statut).toBe(400);
    h = (await appel<Hygiene>("POST", "/api/hygiene/huiles", { equipementId: friteuse, action: "changement" })).corps;
    expect(h.huiles[0]).toMatchObject({ action: "changement", conforme: true });
    expect(h.nonConformes7j).toBe(2);
  });

  it("registre de la période ; l'application ne peut ni modifier ni effacer un relevé", async () => {
    const r = (await appel<RegistreHygiene>("GET", `/api/hygiene/registre?du=${jour()}&au=${jour()}`)).corps;
    expect(r).toMatchObject({ releves: [{}, {}], taches: [{}], receptions: [{}], huiles: [{}, {}] });
    await expect(app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) => c.query("UPDATE hygiene_releve SET conforme = true"))).rejects.toThrow(/permission/);
    await expect(app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) => c.query("DELETE FROM hygiene_releve"))).rejects.toThrow(/permission/);
  });

  it("centre d'alertes : non-conformités de la semaine ; équipement sans relevé d'ouverture pendant le match", async () => {
    await appel("POST", "/api/hygiene/equipements", { nom: "Congélateur", sorte: "surgele" });
    const alertes = (await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes;
    expect(alertes.find((a) => a.id === "hygiene:non_conformes")).toMatchObject({ niveau: "forte", titre: "Hygiène : 2 non-conformités en 7 jours" });
    expect(alertes.find((a) => a.id === "hygiene:ouverture")).toMatchObject({ detail: "Rouen — Congélateur." });
  });

  it("caissière sur la tablette de sa caisse (§15.159) : relevé et réception avec photo ; ni réglages ni registre", async () => {
    const caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
    const julie = (await appel<CodeCaissiere>("POST", "/api/equipe/caissieres", { nom: "Julie" })).corps;
    const tablette = (await appel("POST", `/api/caisses/${caisse}/appareil`)).cookies.find((k) => k.name === "fx_appareil")!;
    const appareil = `fx_appareil=${tablette.value}`;
    const connexion = await appel("POST", "/api/auth/code", { caissiereId: julie.caissiere.id, code: julie.code }, appareil);
    const sienne = `${appareil}; fx_session=${connexion.cookies.find((k) => k.name === "fx_session")!.value}`;
    expect((await appel("GET", "/api/hygiene", undefined, sienne)).statut).toBe(200);
    let h = (await appel<Hygiene>("POST", "/api/hygiene/releves", { equipementId: frigo, moment: "autre", temperatureDixiemes: 30 }, sienne)).corps;
    expect(h.relevesDuJour[0]).toMatchObject({ par: "Julie", conforme: true });
    h = (await appel<Hygiene>("POST", "/api/hygiene/receptions", { fournisseur: "Metro", produits: "Pain", type: "sec", dlcOk: true, emballageOk: true, photo: JPEG.toString("base64") }, sienne)).corps;
    const photoId = h.receptions[0]!.photoId!;
    expect(photoId).toBeTruthy();
    const photo = await appel("GET", `/api/hygiene/photos/${photoId}`, undefined, sienne);
    expect(photo.statut).toBe(200);
    expect(photo.entetes["content-type"]).toBe("image/jpeg");
    expect(Buffer.compare(photo.octets, JPEG)).toBe(0);
    expect((await appel("POST", "/api/hygiene/receptions", { fournisseur: "Metro", produits: "Pain", type: "sec", dlcOk: true, emballageOk: true, photo: Buffer.alloc(300, 1).toString("base64") })).statut).toBe(400);
    expect((await appel("POST", "/api/hygiene/equipements", { nom: "Frigo 2", sorte: "froid" }, sienne)).statut).toBe(403);
    expect((await appel("GET", `/api/hygiene/registre?du=${jour()}&au=${jour()}`, undefined, sienne)).statut).toBe(403);
  });

  it("[F] option désactivée par FlaiX Expert : module fermé", async () => {
    await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'hygiene', false, $2)", [lieu.lieuId, lieu.utilisateurId]);
    expect((await appel("GET", "/api/hygiene")).statut).toBe(403);
    expect((await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes.some((a) => a.type === "hygiene")).toBe(false);
  });
});
