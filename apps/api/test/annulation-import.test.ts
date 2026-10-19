/**
 * Annuler l'import d'une caisse connectée (dossier §15.168), contre la vraie base : un import fait avec de mauvaises
 * colonnes (produit « - », montant absurde) s'annule, ses ventes et articles sont retirés, le relevé et l'annulation
 * restent au journal ; le bon fichier se réimporte alors ; les colonnes reconnues dans le fichier l'emportent sur celles
 * du mauvais import ; une annulation ne se fait qu'une fois ; hors annulation, les articles restent en écriture seule.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CaisseExterne, ImportDeVentes, ProduitExterne } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let caisse = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
// Export de L'Addition (feuille SalesDocumentLines), simplifié.
const LADDITION = [
  "Timestamp;ID Ticket;ID Receipt;Menu parent;ID produit;Nom;Qte;Prix TTC;Remises TTC;Offerts TTC;Taux;TAG_Salle;Paiements",
  "2026-10-02 19:02:00;HT-1;R-1;-;HD-289;HOTDOG;2;6,9;0;0;10%;MANATHAN HOT DOG;CB",
  "2026-10-02 19:05:00;HT-2;R-2;-;HD-3060;BOX HOTDOG;1;9,9;0;0;10%;MANATHAN HOT DOG;CB",
].join("\n");

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'caisses_connectees', true, $2)", [lieu.lieuId, lieu.utilisateurId]);
  caisse = (await appel<CaisseExterne[]>("POST", "/api/caisses-externes", { nom: "L'Addition", systeme: "laddition" })).corps[0]!.id;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("annuler un import de caisse connectée", () => {
  it("mauvaises colonnes (produit « Paiements », prix « Qte », ticket « ID Receipt ») : import absurde, puis annulé", async () => {
    // Colonnes choisies de travers à l'écran : vente=ID Receipt, produit=Paiements (« CB »), prix=Qte.
    const mauvais = await appel<{ ajoutees: number }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "laddition.xlsx", contenu: LADDITION, colonnes: { vente: 2, date: 0, produit: 12, quantite: 6, prixUnitaire: 6 } });
    expect(mauvais.statut, JSON.stringify(mauvais.corps)).toBe(200);
    let liste = (await appel<ImportDeVentes[]>("GET", `/api/caisses-externes/${caisse}/imports`)).corps;
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ fichier: "laddition.xlsx", ventes: 2, annule: null });
    const id = liste[0]!.id;

    // [F] Hors annulation, les articles restent en écriture seule, même pour le propriétaire de la base.
    await expect(proprietaire.transaction({}, (c) => c.query("DELETE FROM ligne_vente_externe WHERE lieu_id = $1", [lieu.lieuId]))).rejects.toThrow(/écriture seule/);

    const r = await appel<ImportDeVentes[]>("POST", `/api/caisses-externes/${caisse}/imports/${id}/annulation`);
    expect(r.statut, JSON.stringify(r.corps)).toBe(200);
    expect(r.corps[0]).toMatchObject({ ventes: 0, montant: 0, annule: { ventes: 2 } });
    expect((await appel<ProduitExterne[]>("GET", `/api/caisses-externes/${caisse}/produits`)).corps).toEqual([]);
    expect((await appel("POST", `/api/caisses-externes/${caisse}/imports/${id}/annulation`)).statut).toBe(409);
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'caisse_externe_import_annule'", [lieu.lieuId]);
    expect(rows[0].details).toMatchObject({ fichier: "laddition.xlsx", ventesRetirees: 2 });
    liste = (await appel<ImportDeVentes[]>("GET", `/api/caisses-externes/${caisse}/imports`)).corps;
    expect(liste).toHaveLength(1); // le relevé de l'import reste
  });

  it("réimport du même fichier sans colonnes choisies : les colonnes reconnues l'emportent sur le mauvais choix gardé ; produits par leur nom", async () => {
    const r = await appel<{ ajoutees: number }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "laddition.xlsx", contenu: LADDITION });
    expect(r.corps.ajoutees).toBe(2);
    const produits = (await appel<ProduitExterne[]>("GET", `/api/caisses-externes/${caisse}/produits`)).corps;
    expect(produits.map((p) => [p.libelle, p.code, p.montant])).toEqual([
      ["HOTDOG", "HD-289", 1_380],
      ["BOX HOTDOG", "HD-3060", 990],
    ]);
  });
});
