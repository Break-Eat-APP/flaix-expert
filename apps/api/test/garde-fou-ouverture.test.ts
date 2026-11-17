/**
 * Garde-fou avant l'ouverture d'un événement (dossier §15.187), contre la vraie base : les stands sans mise en place
 * sont signalés (écran du directeur, Centre d'alertes le matin même) ; rien n'est bloqué. Les tests [F] provoquent
 * l'erreur qu'ils doivent empêcher.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CentreAlertes, Evenement, Ingredient, Produit, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieuId = "";
let nord: Stand;
let sud: Stand;
let frites: Produit;
let fut: Ingredient;
let ceSoir: Evenement;
let demain: Evenement;

interface Preparation {
  stockSuivi: boolean;
  standsSansMiseEnPlace: { id: string; nom: string }[];
}

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const preparation = async (e: Evenement) => (await appel<Preparation>("GET", `/api/evenements/${e.id}/preparation`)).corps;
const alertesMiseEnPlace = async () => (await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes.filter((a) => a.type === "mise_en_place");

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("POST", "/api/stands", { nom: "Buvette Nord" });
  await appel("POST", "/api/stands", { nom: "Buvette Sud" });
  // Un stand sans aucun produit : il n'a rien à mettre en place, il n'est jamais signalé.
  const stands = (await appel<Stand[]>("POST", "/api/stands", { nom: "Stand vide" })).corps;
  nord = stands.find((s) => s.nom === "Buvette Nord")!;
  sud = stands.find((s) => s.nom === "Buvette Sud")!;
  frites = (await appel<Produit[]>("POST", "/api/produits", { nom: "Frites", prixTtc: 500, tauxTva: 1000, coutMatiere: 120, standIds: [nord.id] })).corps.find((p) => p.nom === "Frites")!;
  // Buvette Sud ne vend qu'une pinte tirée d'un fût : sa mise en place est celle de l'ingrédient.
  fut = (await appel<Ingredient[]>("POST", "/api/ingredients", { nom: "Fût blonde", unite: "l", prix: 300 })).corps.find((i) => i.nom === "Fût blonde")!;
  const pinte = (await appel<Produit[]>("POST", "/api/produits", { nom: "Pinte", prixTtc: 650, tauxTva: 2000, coutMatiere: null, standIds: [sud.id] })).corps.find((p) => p.nom === "Pinte")!;
  await appel("PUT", `/api/produits/${pinte.id}/recette`, { lignes: [{ ingredientId: fut.id, quantiteMilli: 500 }] });
  await appel("PATCH", `/api/ingredients/${fut.id}`, { suiviStock: true });
  const evt = async (libelle: string, jours: number) =>
    (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() + jours * 86_400_000).toISOString() })).corps.find((e) => e.libelle === libelle)!;
  ceSoir = await evt("Match de ce soir", 0);
  demain = await evt("Match de demain", 1);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("garde-fou avant l'ouverture d'un événement", () => {
  it("aucune mise en place : les deux stands qui vendent sont signalés, pas le stand vide", async () => {
    expect(await preparation(ceSoir)).toEqual({ stockSuivi: true, standsSansMiseEnPlace: [{ id: nord.id, nom: "Buvette Nord" }, { id: sud.id, nom: "Buvette Sud" }] });
  });

  it("le matin même, le Centre d'alertes prévient (la première caisse peut ouvrir l'événement) ; pas pour l'événement de demain", async () => {
    const a = await alertesMiseEnPlace();
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ id: `mise_en_place:${ceSoir.id}`, niveau: "forte", lien: `/stock?onglet=mep&evenement=${ceSoir.id}` });
    expect(a[0]!.titre).toContain("Match de ce soir : 2 stands");
    expect(a[0]!.detail).toContain("Buvette Nord, Buvette Sud");
    // Demain aussi est sans mise en place, mais l'alerte n'arrive que le jour même.
    expect((await preparation(demain)).standsSansMiseEnPlace).toHaveLength(2);
  });

  it("une mise en place de produit, puis d'ingrédient : le stand n'est plus signalé, l'alerte disparaît", async () => {
    expect((await appel("PUT", "/api/stock/mise-en-place", { evenementId: ceSoir.id, standId: nord.id, produitId: frites.id, quantite: 40 })).statut).toBe(200);
    expect((await preparation(ceSoir)).standsSansMiseEnPlace.map((s) => s.nom)).toEqual(["Buvette Sud"]);
    expect((await alertesMiseEnPlace())[0]!.titre).toContain("1 stand");
    expect((await appel("PUT", "/api/stock/ingredients/mise-en-place", { evenementId: ceSoir.id, standId: sud.id, ingredientId: fut.id, quantiteMilli: 30_000 })).statut).toBe(200);
    expect((await preparation(ceSoir)).standsSansMiseEnPlace).toEqual([]);
    expect(await alertesMiseEnPlace()).toEqual([]);
  });

  it("[F] le garde-fou ne bloque jamais : un événement sans mise en place s'ouvre quand même", async () => {
    expect((await appel("POST", `/api/evenements/${demain.id}/ouverture`)).statut).toBe(200);
    // Ouvert : la mise en place est figée, il n'y a plus rien à signaler.
    expect((await preparation(demain)).standsSansMiseEnPlace).toEqual([]);
  });

  it("[F] sans l'option Stock : rien à vérifier, aucune alerte", async () => {
    const plusTard = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match sans stock", debut: new Date().toISOString() })).corps.find((e) => e.libelle === "Match sans stock")!;
    expect((await preparation(plusTard)).standsSansMiseEnPlace).toHaveLength(2);
    // L'option se règle depuis l'espace éditeur (testé dans options.test.ts) ; ici, écrite directement.
    await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) SELECT $1, 'stock', false, (SELECT id FROM utilisateur LIMIT 1)", [lieuId]);
    expect(await preparation(plusTard)).toEqual({ stockSuivi: false, standsSansMiseEnPlace: [] });
    expect(await alertesMiseEnPlace()).toEqual([]);
  });
});
