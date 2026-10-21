/**
 * Les chiffres de la soirée (dossier §15.171), contre la vraie base : conversion des spectateurs, articles par ticket,
 * pic de la soirée, part boissons / nourriture (famille devinée puis choisie), Click & Collect importé de l'application
 * Break Eat (part du CA, des tickets, des spectateurs, panier comparé au comptoir).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CaisseExterne, Categorie, Evenement, Produit, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let caisse = "";
let match: Evenement;
let t: Tablette;
let snacking: Categorie;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const resultats = async () => (await appel<Resultats>("GET", `/api/resultats?evenementId=${match.id}`)).corps;
/** Date et heure de Paris, comme dans un export (« 21/10/2026 20:15 »). */
const maintenantParis = () => new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'caisses_connectees', true, $2)", [lieu.lieuId, lieu.utilisateurId]);
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  await appel("POST", "/api/categories", { nom: "Bières" });
  const cats = (await appel<Categorie[]>("POST", "/api/categories", { nom: "Spécialités" })).corps;
  snacking = cats.find((c) => c.nom === "Spécialités")!;
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, categorieId: cats.find((c) => c.nom === "Bières")!.id, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Croque du chef", prixTtc: 600, tauxTva: 1000, coutMatiere: 150, categorieId: snacking.id, standIds: [stand.id] })).corps;
  const biere = produits.find((p) => p.nom === "Bière")!;
  const croque = produits.find((p) => p.nom === "Croque du chef")!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Rouen", debut: new Date().toISOString(), spectateurs: 100 })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  // 4 tickets : 3 bières + 1 croque, puis 3 tickets d'une bière : 7 articles, 33,00 € TTC.
  vendreHorsLigne(t, [ligne(biere, 3), ligne(croque)]);
  vendreHorsLigne(t, [ligne(biere)]);
  vendreHorsLigne(t, [ligne(biere)]);
  vendreHorsLigne(t, [ligne(biere)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("les chiffres de la soirée", () => {
  it("sans source Click & Collect : conversion, articles par ticket, pic, familles devinées", async () => {
    expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
    const c = (await resultats()).actuel!.chiffres!;
    expect(c).toMatchObject({ conversion: 400, articles: 7, articlesParTicket: 1.8, clickCollect: null }); // 4 tickets ÷ 100 spectateurs
    expect(c.pic).toMatchObject({ ca: 4_800, part: 10_000 });
    // « Spécialités » ne dit rien : autre ; « Bières » : boisson.
    expect(c.familles.map((f) => [f.famille, f.caTtc])).toEqual([
      ["boisson", 4_200],
      ["autre", 600],
    ]);
  });

  it("famille choisie pour une catégorie : elle remplace la devinette ; journalisée", async () => {
    const cats = (await appel<Categorie[]>("PATCH", `/api/categories/${snacking.id}`, { famille: "nourriture" })).corps;
    expect(cats.find((c) => c.id === snacking.id)!.famille).toBe("nourriture");
    expect((await resultats()).actuel!.chiffres!.familles.map((f) => f.famille)).toEqual(["boisson", "nourriture"]);
    expect((await appel("PATCH", `/api/categories/${snacking.id}`, { famille: "dessert" })).statut).toBe(400);
  });

  it("Click & Collect de l'application Break Eat importé : part du CA, des tickets, des spectateurs, panier", async () => {
    const k = (await appel<CaisseExterne[]>("POST", "/api/caisses-externes", { nom: "Click & Collect", systeme: "breakeat" })).corps[0]!;
    const quand = maintenantParis();
    const fichier = ["Commande;Date;Produit;Quantité;Prix", `C-1;${quand};Bière;2;7,00`, `C-2;${quand};Bière;1;7,00`].join("\n");
    expect((await appel("POST", `/api/caisses-externes/${k.id}/import`, { fichier: "breakeat.csv", contenu: fichier })).statut).toBe(200);
    const c = (await resultats()).actuel!.chiffres!;
    // 2 commandes pour 21,00 € sur 6 tickets et 69,00 € : 30,4 % du CA, 33,3 % des tickets, 2 % des spectateurs ;
    // panier 10,50 € contre 48,00 € ÷ 4 = 12,00 € au comptoir.
    expect(c.clickCollect).toEqual({ commandes: 2, ca: 2_100, partCa: 3_043, partTickets: 3_333, conversion: 200, panier: 1_050, panierComptoir: 1_200 });
  });
});
