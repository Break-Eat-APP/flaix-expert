/**
 * Le stade en direct (dossier §15.162), contre la vraie base : tribune choisie ou devinée du nom, stands gris hors
 * événement ; pendant l'événement, la rupture d'un produit met le stand en rouge avec son alerte, un stand sans caisse
 * ouverte reste gris.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, PlanStade, Produit, RepriseCaisse, Stand, TableauDirect } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { travauxTermines } from "../src/arriere-plan.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let nord: Stand;
let comptoir: Stand;
let caisse = "";
let frites: Produit;
let t: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const plan = async () => (await appel<PlanStade>("GET", "/api/plan-stade")).corps;
const du = (p: PlanStade, s: Stand) => p.stands.find((x) => x.id === s.id)!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("POST", "/api/stands", { nom: "Buvette Nord" });
  const stands = (await appel<Stand[]>("POST", "/api/stands", { nom: "Le Comptoir" })).corps;
  nord = stands.find((s) => s.nom === "Buvette Nord")!;
  comptoir = stands.find((s) => s.nom === "Le Comptoir")!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${nord.id}/caisses`, {})).corps.find((s) => s.id === nord.id)!.caisses[0]!.id;
  await appel("POST", `/api/stands/${comptoir.id}/caisses`, {});
  frites = (await appel<Produit[]>("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [nord.id] })).corps[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("le stade en direct", () => {
  it("hors événement : tribune devinée du nom ou répartie, stands gris ; tribune choisie dans les paramètres ; valeur inconnue refusée", async () => {
    let p = await plan();
    expect(p.evenement).toBeNull();
    expect((await appel("GET", "/api/direct")).corps).toBeNull();
    expect(du(p, nord)).toMatchObject({ tribune: "nord", tribuneChoisie: false, couleur: "gris", resume: "Hors événement", signaux: [] });
    expect(du(p, comptoir)).toMatchObject({ tribune: "est", tribuneChoisie: false, couleur: "gris" });

    const r = await appel<Stand[]>("PATCH", `/api/stands/${comptoir.id}`, { tribune: "sud" });
    expect(r.statut).toBe(200);
    expect(r.corps.find((s) => s.id === comptoir.id)!.tribune).toBe("sud");
    p = await plan();
    expect(du(p, comptoir)).toMatchObject({ tribune: "sud", tribuneChoisie: true });
    expect((await appel("PATCH", `/api/stands/${comptoir.id}`, { tribune: "centre" })).statut).toBe(400);
  });

  it("décor et place des stands : patinoire, Comptoir posé à la main puis remis en automatique ; valeurs hors limites refusées", async () => {
    let r = await appel<PlanStade>("PUT", "/api/plan-stade", { modele: "patinoire", positions: [{ standId: comptoir.id, position: { x: 12.34, z: -48.06 } }] });
    expect(r.statut).toBe(200);
    expect(r.corps.modele).toBe("patinoire");
    expect(du(r.corps, comptoir).position).toEqual({ x: 12.3, z: -48.1 });
    expect(du(r.corps, nord).position).toBeNull();
    expect((await plan()).modele).toBe("patinoire");

    expect((await appel("PUT", "/api/plan-stade", { modele: "velodrome" })).statut).toBe(400);
    expect((await appel("PUT", "/api/plan-stade", { positions: [{ standId: comptoir.id, position: { x: 500, z: 0 } }] })).statut).toBe(400);
    expect((await appel("PUT", "/api/plan-stade", { positions: [{ standId: "00000000-0000-4000-8000-000000000000", position: null }] })).statut).toBe(404);

    r = await appel<PlanStade>("PUT", "/api/plan-stade", { modele: "stade", positions: [{ standId: comptoir.id, position: null }] });
    expect(r.corps.modele).toBe("stade");
    expect(du(r.corps, comptoir).position).toBeNull();
  });

  it("pendant l'événement : rupture des frites → Buvette Nord en rouge avec l'alerte ; le Comptoir sans caisse ouverte reste gris", async () => {
    const ev = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen – Caen", debut: new Date().toISOString() })).corps[0]!;
    expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: ev.id, standId: nord.id, produitId: frites.id, quantite: 10 })).statut).toBe(200);
    await appel("POST", `/api/evenements/${ev.id}/ouverture`);
    const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: null });
    t = tablette(caisse, o.corps);
    for (let i = 0; i < 10; i++) vendreHorsLigne(t, [ligne(frites)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    await travauxTermines();

    const p = await plan();
    expect(p.evenement).toMatchObject({ id: ev.id, libelle: "Rouen – Caen" });
    const n = du(p, nord);
    expect(n).toMatchObject({ couleur: "rouge", chiffres: { caNet: 5_000, tickets: 10, caissesOuvertes: 1, caisses: 1 } });
    expect(n.signaux[0]).toMatchObject({ couleur: "rouge", titre: "Rupture : Frites", lien: "/direct" });
    expect(n.signaux[0]!.detail).toContain("Reste 0 sur 10 · vendu 10");
    expect(du(p, comptoir)).toMatchObject({ couleur: "gris", resume: "Fermé : aucune caisse ouverte" });
    expect(n.chiffres.derniereVente).not.toBeNull();
    // En direct (§15.166) : chiffres de la soirée, ventes des 10 dernières minutes, caisses ; pas de match précédent.
    expect(p.direct).toMatchObject({ caNet: 5_000, tickets: 10, recentes: { minutes: 10, tickets: 10, caNet: 5_000 }, comparaison: null, caisses: { ouvertes: 1, total: 2 } });
    expect(n.recentes).toEqual({ minutes: 10, tickets: 10, caNet: 5_000 });
    expect(n.produits).toEqual([{ produitId: frites.id, nom: "Frites", restant: 0, sur: 10, alerte: "rupture" }]);
    expect(n.signaux[0]!.produitId).toBe(frites.id);
    // Tableau En direct (§15.167) : chiffres de la soirée, courbe par quart d'heure ; pas de match précédent.
    const tab = (await appel<TableauDirect>("GET", "/api/direct")).corps;
    expect(tab).toMatchObject({ evenement: { id: ev.id }, precedent: null, ca: { valeur: 5_000, auMemeMoment: null }, tickets: { valeur: 10 }, panier: { valeur: 500 } });
    expect(tab.courbe.actuel.reduce((x, y) => x + y, 0)).toBe(5_000);
    expect(tab.meilleurs[0]).toEqual({ nom: "Frites", caTtc: 5_000, quantite: 10 });
  });

  it("ventes à vérifier : un prix différent du tarif, 5 annulations sur 16 ventes → alertes de la caisse", async () => {
    vendreHorsLigne(t, [{ ...ligne(frites), prixUnitaire: 450 }]); // la tablette avait encore l'ancien prix
    for (const v of Array.from({ length: 5 }, () => vendreHorsLigne(t, [ligne(frites)]))) annulerHorsLigne(t, v, "Erreur de saisie");
    expect((await envoyer(appel, t)).statut).toBe(200);
    await travauxTermines();
    const titres = du(await plan(), nord).signaux.map((s) => s.titre);
    expect(titres).toContain("Caisse 1 : 1 vente à un prix différent du tarif");
    expect(titres).toContain("Caisse 1 : 5 annulations ce soir");
  });
});
