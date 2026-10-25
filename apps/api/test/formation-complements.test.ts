/**
 * Mode formation et configuration ajoutée aux §15.171 et §15.173 (audit du 2026-10-25, §15.175), contre la vraie base :
 * la famille d'une catégorie et les correspondances apprises des factures sont recopiées dans le lieu de formation
 * (produit de la formation, pas celui du vrai lieu) ; [F] corriger une correspondance y est refusé, comme toute
 * configuration.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Categorie, CorrespondanceArticle, Produit, SessionInfo } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let snacking: Categorie;
let croque: Produit;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  // La session de formation remplace le cookie de session.
  const nouveau = r.cookies.find((k) => k.name === "fx_session");
  if (nouveau) cookie = `fx_session=${nouveau.value}`;
  return { statut: r.statusCode, corps: r.json() as T };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  snacking = (await appel<Categorie[]>("POST", "/api/categories", { nom: "Spécialités" })).corps.find((c) => c.nom === "Spécialités")!;
  await appel("PATCH", `/api/categories/${snacking.id}`, { famille: "nourriture" });
  croque = (await appel<Produit[]>("POST", "/api/produits", { nom: "Croque", prixTtc: 600, tauxTva: 1000, coutMatiere: 150, categorieId: snacking.id })).corps[0]!;
  // Une facture enregistrée apprend « CRQ chez Metro = Croque, colis de 12 ».
  await appel("POST", "/api/factures", {
    fournisseur: "Metro",
    numero: "M-1",
    dateFacture: "2026-10-20",
    echeance: null,
    lignes: [{ produitId: croque.id, libelle: "Croque x12", codeArticle: "CRQ", quantite: 2, prixUnitaire: 1_800, unitesParColis: 12 }],
  });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("mode formation : famille et correspondances recopiées", () => {
  it("dans le lieu de formation : la famille de la catégorie, la correspondance vers le produit de la formation", async () => {
    const s = await appel<SessionInfo>("POST", "/api/formation/entree");
    expect(s.statut).toBe(200);
    expect(s.corps.formation).toBe(true);
    const cats = (await appel<Categorie[]>("GET", "/api/categories")).corps;
    expect(cats.find((c) => c.nom === "Spécialités")!.famille).toBe("nourriture");
    const produits = (await appel<Produit[]>("GET", "/api/produits")).corps;
    const croqueFormation = produits.find((p) => p.nom === "Croque")!;
    expect(croqueFormation.id).not.toBe(croque.id);
    const corr = (await appel<CorrespondanceArticle[]>("GET", "/api/factures/correspondances")).corps;
    expect(corr).toEqual([{ fournisseur: "metro", cle: "code:crq", libelle: "Croque x12", produitId: croqueFormation.id, unitesParColis: 12 }]);
  });

  it("[F] corriger une correspondance en formation : refusé, comme toute configuration", async () => {
    const r = await appel<{ erreur: string }>("PUT", "/api/factures/correspondances", { fournisseur: "metro", cle: "code:crq", produitId: null, unitesParColis: 6 });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("Mode formation");
  });
});
