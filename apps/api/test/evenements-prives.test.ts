/**
 * Événements privés (dossier §15.160), contre la vraie base : fiche, consommations du catalogue (même produit cumulé)
 * et ligne libre, jauge du budget, frais, ce qu'il te reste ; clôture qui fige (coûts compris, verrou de la base) ;
 * règlement ; facture refusée sans identité de l'exploitant, puis numérotée en série continue, scellée et relue.
 * Rien ne passe par la caisse.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EvenementPrive, FactureVente, Produit, ResumePrive } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let biere: Produit;
let hotDog: Produit;
let soiree: EvenementPrive;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const ligne = (nom: string) => soiree.lignes.find((l) => l.libelle === nom)!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120 });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 600, tauxTva: 1000, coutMatiere: 150 })).corps;
  biere = produits.find((p) => p.nom === "Bière")!;
  hotDog = produits.find((p) => p.nom === "Hot-dog")!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("événements privés", () => {
  it("fiche créée avec son budget et sa société ; SIRET invalide refusé", async () => {
    const r = await appel<EvenementPrive>("POST", "/api/evenements-prives", {
      nom: "Bar clandestin",
      debut: "2026-10-17T19:00:00.000Z",
      invites: 15,
      budget: 30_000,
      clientNom: "Paul",
      societe: "Le Bar clandestin SARL",
      adresse: "5 rue des Arts, 76000 Rouen",
    });
    expect(r.statut).toBe(201);
    soiree = r.corps;
    expect(soiree).toMatchObject({ etat: "prevu", budget: 30_000, client: { societe: "Le Bar clandestin SARL" }, bilan: { totalTtc: 0, niveauBudget: "ok" } });
    expect((await appel("POST", "/api/evenements-prives", { nom: "X", debut: "2026-10-17T19:00:00.000Z", siret: "123" })).statut).toBe(400);
  });

  it("consommations : même produit cumulé, ligne libre, quantité changée ou retirée ; jauge du budget", async () => {
    await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: biere.id, quantite: 20 });
    await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: biere.id, quantite: 10 });
    await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: hotDog.id, quantite: 15 });
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/lignes`, { libelle: "Location du salon", prixTtc: 24_000, tauxTva: 2000 })).corps;
    expect(soiree.lignes.map((l) => [l.libelle, l.quantite])).toEqual([
      ["Bière", 30],
      ["Hot-dog", 15],
      ["Location du salon", 1],
    ]);
    // 210 + 90 + 240 = 540 € pour 300 € de budget : dépassé.
    expect(soiree.bilan).toMatchObject({ totalTtc: 54_000, budgetPb: 18_000, niveauBudget: "depasse" });
    await appel("PATCH", `/api/evenements-prives/${soiree.id}/lignes/${ligne("Hot-dog").id}`, { quantite: 10 });
    soiree = (await appel<EvenementPrive>("PATCH", `/api/evenements-prives/${soiree.id}/lignes/${ligne("Location du salon").id}`, { quantite: 0 })).corps;
    expect(soiree.bilan).toMatchObject({ totalTtc: 27_000, budgetPb: 9_000, niveauBudget: "attention" });
  });

  it("frais et ce qu'il te reste ; facture avant la clôture refusée", async () => {
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/frais`, { libelle: "Personnel (2 × 5 h)", montant: 18_000 })).corps;
    // Marchandise : 30 × 1,20 € + 10 × 1,50 € = 51,00 €.
    expect(soiree.bilan).toMatchObject({ coutMarchandise: 5_100, frais: 18_000, reste: soiree.bilan.caHt - 5_100 - 18_000 });
    expect((await appel("POST", `/api/evenements-prives/${soiree.id}/facture`)).statut).toBe(409);
  });

  it("clôture : coûts figés même si un coût change ensuite ; plus de consommation, même directement en base", async () => {
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/cloture`)).corps;
    expect(soiree.etat).toBe("cloture");
    const reste = soiree.bilan.reste;
    await appel("PATCH", `/api/produits/${biere.id}`, { coutMatiere: 300 });
    expect((await appel<EvenementPrive>("GET", `/api/evenements-prives/${soiree.id}`)).corps.bilan.reste).toBe(reste);
    expect((await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: biere.id })).statut).toBe(409);
    expect((await appel("PATCH", `/api/evenements-prives/${soiree.id}`, { budget: 1 })).statut).toBe(409);
    await expect(
      app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) => c.query("UPDATE evenement_prive_ligne SET quantite = 1 WHERE evenement_id = $1", [soiree.id])),
    ).rejects.toThrow(/clôturé/);
  });

  it("facture : identité de l'exploitant exigée, puis série continue ; contenu scellé et relu ; règlement noté", async () => {
    expect((await appel<{ erreur: string }>("POST", `/api/evenements-prives/${soiree.id}/facture`)).corps.erreur).toContain("identité de l'exploitant");
    await appel("PUT", "/api/lieu", { nom: "Buvette du stade", raisonSociale: "Break Eat SAS", siret: "12345678900011", tvaIntracom: "FR12123456789", adresse: "1 rue du Stade", codePostal: "76000", ville: "Rouen" });
    soiree = (await appel<EvenementPrive>("PUT", `/api/evenements-prives/${soiree.id}/reglement`, { mode: "virement", le: "2026-10-18" })).corps;
    expect(soiree.reglement).toEqual({ mode: "virement", le: "2026-10-18" });
    const annee = new Date().getFullYear();
    soiree = (await appel<EvenementPrive>("POST", `/api/evenements-prives/${soiree.id}/facture`)).corps;
    expect(soiree.facture!.numero).toBe(`FP-${annee}-0001`);
    expect((await appel("POST", `/api/evenements-prives/${soiree.id}/facture`)).statut).toBe(409);
    const lue = (await appel<{ facture: FactureVente; integre: boolean }>("GET", `/api/factures-vente/${soiree.facture!.id}`)).corps;
    expect(lue.integre).toBe(true);
    expect(lue.facture).toMatchObject({ client: { nom: "Le Bar clandestin SARL", professionnel: true }, totalTtc: 27_000, vendeur: { siret: "12345678900011" } });
    expect(lue.facture.mentions.at(-1)).toBe("Facture acquittée le 18/10/2026 par virement.");

    // Deuxième événement : numéro suivant de la série.
    const autre = (await appel<EvenementPrive>("POST", "/api/evenements-prives", { nom: "Anniversaire", debut: "2026-10-20T19:00:00.000Z", clientNom: "Julie" })).corps;
    await appel("POST", `/api/evenements-prives/${autre.id}/lignes`, { produitId: hotDog.id, quantite: 4 });
    await appel("POST", `/api/evenements-prives/${autre.id}/cloture`);
    expect((await appel<EvenementPrive>("POST", `/api/evenements-prives/${autre.id}/facture`)).corps.facture!.numero).toBe(`FP-${annee}-0002`);

    // Contenu modifié en base (hors application) : la relecture le montre.
    await proprietaire.pool.query("UPDATE facture_vente SET contenu = jsonb_set(contenu, '{totalTtc}', '1') WHERE id = $1", [soiree.facture!.id]);
    expect((await appel<{ integre: boolean }>("GET", `/api/factures-vente/${soiree.facture!.id}`)).corps.integre).toBe(false);
    const liste = (await appel<ResumePrive[]>("GET", "/api/evenements-prives")).corps;
    expect(liste.map((e) => [e.nom, e.facture, e.regle])).toEqual([
      ["Anniversaire", `FP-${annee}-0002`, false],
      ["Bar clandestin", `FP-${annee}-0001`, true],
    ]);
  });

  it("rien ne passe par la caisse ; l'application ne peut ni modifier ni effacer une facture", async () => {
    const { rows } = await proprietaire.pool.query("SELECT count(*)::int AS n FROM journal_caisse WHERE lieu_id = $1", [lieu.lieuId]);
    expect(rows[0].n).toBe(0);
    await expect(app.transaction({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, (c) => c.query("DELETE FROM facture_vente"))).rejects.toThrow(/permission/);
  });
});
