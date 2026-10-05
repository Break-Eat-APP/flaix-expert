/**
 * Centre d'alertes et rupture de stock poussée sur le téléphone (module 18 ; dossier §15.140), contre la
 * vraie base. Le service de notification est simulé. Les tests [F] provoquent l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CentreAlertes, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirEnvoyeurPush } from "../src/routes/notifications.ts";
import { travauxTermines } from "../src/arriere-plan.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieuId = "";
let stand: Stand;
let caisse: string;
let frites: Produit;
let biere: Produit;
let rouen: Evenement;
let t: Tablette;
const recus: { titre: string; corps: string; url: string }[] = [];

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const jour = (decalage = 0) => new Date(Date.now() + decalage * 86_400_000).toISOString().slice(0, 10);
/** Vend des frites (une par ticket) et envoie au serveur. */
async function vendreFrites(n: number) {
  for (let i = 0; i < n; i++) vendreHorsLigne(t, [ligne(frites)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
  await travauxTermines();
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  definirEnvoyeurPush(async (_d, charge) => {
    recus.push(JSON.parse(charge));
    return 201;
  });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  expect((await appel("POST", "/api/notifications/abonnement", { endpoint: "https://push.exemple.test/directeur", keys: { p256dh: "cle", auth: "auth" }, appareil: "iPhone" })).statut).toBeLessThan(300);

  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette Nord" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  // Frites 5,00 € à 10 %, coût 1,20 € (73,6 % de marge) ; bière 7,00 € à 20 %, coût 1,25 €.
  await appel("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 125, standIds: [stand.id] })).corps;
  frites = produits.find((p) => p.nom === "Frites")!;
  biere = produits.find((p) => p.nom === "Bière")!;
  // Deux livraisons de bière chez le même fournisseur : 1,25 € puis 1,32 € (+5,6 %).
  for (const [prix, date] of [[125, jour(-10)], [132, jour(-1)]] as const) {
    expect((await appel("POST", "/api/stock/livraisons", { produitId: biere.id, quantite: 300, prixUnitaire: prix, fournisseur: "Brasserie du Port", dateLivraison: date })).statut).toBe(201);
  }
  expect((await appel("POST", "/api/stock/livraisons", { produitId: frites.id, quantite: 200, prixUnitaire: 120, dateLivraison: jour(-1) })).statut).toBe(201);

  rouen = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString() })).corps.find((e) => e.libelle === "Rouen")!;
  // 10 frites mises en place : stock faible à 2 (15 %), rupture à 0.
  expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: rouen.id, standId: stand.id, produitId: frites.id, quantite: 10 })).statut).toBe(200);
  await appel("POST", `/api/evenements/${rouen.id}/ouverture`);
  const o = await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, { fond: null });
  t = tablette(caisse, o.corps);
});

afterAll(async () => {
  definirEnvoyeurPush(null);
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("rupture de stock poussée sur le téléphone (§15.140)", () => {
  it("7 frites vendues sur 10 : rien ; la 8e (reste 2) : « stock faible », une seule fois", async () => {
    await vendreFrites(7);
    expect(recus).toHaveLength(0);
    await vendreFrites(1);
    expect(recus).toEqual([{ titre: "Stock faible : Frites à Buvette Nord", corps: "Reste 2 sur 10 · vendu 8. Touche pour un réassort depuis « En direct ».", url: "/direct" }]);
    vendreHorsLigne(t, [ligne(biere)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    await travauxTermines();
    expect(recus).toHaveLength(1); // une bière vendue ne réveille pas l'alerte des frites
  });

  it("les deux dernières : « rupture », une seule fois même si d'autres tickets arrivent", async () => {
    await vendreFrites(2);
    expect(recus.at(-1)).toMatchObject({ titre: "Rupture : Frites à Buvette Nord" });
    expect(recus).toHaveLength(2);
    await vendreFrites(1); // vendue malgré tout (stock théorique négatif) : pas de nouvelle notification
    expect(recus).toHaveLength(2);
  });

  it("un réassort réarme l'alerte : 5 frites remises, toutes vendues d'un coup → une nouvelle rupture (pas de « faible » au passage)", async () => {
    expect((await appel("POST", "/api/stock/reassort", { evenementId: rouen.id, standId: stand.id, produitId: frites.id, quantite: 6 })).statut).toBe(200);
    await vendreFrites(6);
    expect(recus).toHaveLength(3);
    expect(recus.at(-1)!.titre).toBe("Rupture : Frites à Buvette Nord");
    const { rows } = await app.transaction({ lieuId }, (c) => c.query<{ niveau: string; reassort: number; envoye_a: number }>("SELECT niveau, reassort, envoye_a FROM alerte_stock_poussee ORDER BY le"));
    expect(rows).toEqual([
      { niveau: "faible", reassort: 0, envoye_a: 1 },
      { niveau: "rupture", reassort: 0, envoye_a: 1 },
      { niveau: "rupture", reassort: 6, envoye_a: 1 },
    ]);
  });

  it("[F] la trace des notifications ne se modifie ni ne se supprime", async () => {
    await expect(app.transaction({ lieuId }, (c) => c.query("UPDATE alerte_stock_poussee SET envoye_a = 0"))).rejects.toThrow();
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM alerte_stock_poussee WHERE lieu_id = $1", [lieuId]))).rejects.toThrow();
  });

  it("réglages du lieu : ruptures coupées → plus rien ne part ; le changement est journalisé", async () => {
    expect((await appel("PUT", "/api/alertes/reglages", { rupture: false, faible: true })).corps).toEqual({ rupture: false, faible: true });
    expect((await appel("POST", "/api/stock/reassort", { evenementId: rouen.id, standId: stand.id, produitId: frites.id, quantite: 1 })).statut).toBe(200);
    await vendreFrites(1);
    expect(recus).toHaveLength(3);
    const jets = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    expect(jets.some((j) => j.type === "alertes_reglages_modifies")).toBe(true);
    await appel("PUT", "/api/alertes/reglages", { rupture: true, faible: true });
  });
});

describe("centre d'alertes (module 18)", () => {
  it("en direct : la rupture des frites ; calculée : la hausse du prix de la bière (+5,6 %, 21 € sur 300)", async () => {
    const c = (await appel<CentreAlertes>("GET", "/api/alertes")).corps;
    expect(c.evenementEnCours).toMatchObject({ libelle: "Rouen" });
    expect(c.alertes.find((a) => a.type === "rupture")).toMatchObject({ source: "en_direct", niveau: "forte", titre: "Rupture : Frites à Buvette Nord", lien: "/direct" });
    expect(c.alertes.find((a) => a.type === "variation_fournisseur")).toMatchObject({ source: "calculee", impact: 2_100, titre: "Hausse du prix de Bière chez Brasserie du Port : +5,6 %" });
    expect(c.reglages).toEqual({ rupture: true, faible: true });
  });

  it("mercuriale : référence des frites à 1,00 € pour un coût de 1,20 € → +20 %, alerte ; la saisie est journalisée", async () => {
    const c = (await appel<CentreAlertes>("PUT", "/api/alertes/mercuriale", { produitId: frites.id, prix: 100 })).corps;
    expect(c.mercuriale.find((l) => l.id === frites.id)).toMatchObject({ reference: 100, coutActuel: 120, ecartPb: 2_000 });
    expect(c.alertes.find((a) => a.type === "mercuriale")!.titre).toBe("Frites : coût +20,0 % au-dessus de ta référence");
    const jets = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique")).corps;
    expect(jets.some((j) => j.type === "mercuriale_modifiee")).toBe(true);
    // Retirer la référence retire l'alerte.
    const sans = (await appel<CentreAlertes>("PUT", "/api/alertes/mercuriale", { produitId: frites.id, prix: null })).corps;
    expect(sans.alertes.some((a) => a.type === "mercuriale")).toBe(false);
  });

  it("marge configurée : une cible de 80 % sur les frites (73,6 % au prix actuel) → alerte calculée", async () => {
    expect((await appel("PATCH", `/api/produits/${frites.id}`, { cibleMarge: 8_000 })).statut).toBe(200);
    const c = (await appel<CentreAlertes>("GET", "/api/alertes")).corps;
    const a = c.alertes.find((x) => x.type === "marge_configuree")!;
    expect(a.titre).toBe("Frites : marge de 73,6 % au prix actuel, pour une cible de 80,0 %");
    expect(a.source).toBe("calculee");
  });

  it("[F] mercuriale : un produit d'un autre lieu est introuvable ; un prix nul est refusé", async () => {
    expect((await appel("PUT", "/api/alertes/mercuriale", { produitId: "00000000-0000-4000-8000-000000000000", prix: 100 })).statut).toBe(404);
    expect((await appel("PUT", "/api/alertes/mercuriale", { produitId: frites.id, prix: 0 })).statut).toBe(400);
  });
});
