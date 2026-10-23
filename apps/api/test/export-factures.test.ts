/**
 * Export des factures pour le comptable (dossier §15.172), contre la vraie base : un zip par période avec la pièce
 * jointe de chaque facture fournisseur de la période, la facture de l'événement privé en PDF et le récapitulatif
 * (statut, payée ou non) ; une facture hors période n'y est pas ; journalisé ; [F] période à l'envers refusée.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { strFromU8, unzipSync } from "fflate";
import type { EtatFactures, EvenementPrive, Produit } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieuId = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const aujourdhui = () => new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  lieuId = lieu.lieuId;
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("PUT", "/api/lieu", { nom: "Buvette du stade", raisonSociale: "Break Eat SAS", siret: "12345678900011", tvaIntracom: "FR12123456789", adresse: "1 rue du Stade", codePostal: "76000", ville: "Rouen" });
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120 })).corps[0]!;
  // Deux factures fournisseurs : une dans la période (avec sa pièce jointe), une avant.
  const saisir = (numero: string, dateFacture: string) =>
    appel<EtatFactures>("POST", "/api/factures", { fournisseur: "Brasseur du Nord", numero, dateFacture, echeance: null, lignes: [{ produitId: null, libelle: "Fûts", quantite: 2, prixUnitaire: 9_000 }] });
  const f = (await saisir("BN-12", aujourdhui())).corps.factures.find((x) => x.numero === "BN-12")!;
  await saisir("BN-01", "2025-01-15");
  const pdf = Buffer.from("%PDF-1.4\n% facture du brasseur\n").toString("base64");
  expect((await appel("POST", `/api/factures/${f.id}/fichier`, { nom: "facture BN-12.pdf", type: "application/pdf", contenu: pdf })).statut).toBe(200);
  // Un événement privé facturé et réglé.
  const soiree = (await appel<EvenementPrive>("POST", "/api/evenements-prives", { nom: "Séminaire", debut: new Date().toISOString(), clientNom: "Paul", societe: "Société Durand", adresse: "2 rue des Arts, 76000 Rouen" })).corps;
  await appel("POST", `/api/evenements-prives/${soiree.id}/lignes`, { produitId: biere.id, quantite: 10 });
  await appel("POST", `/api/evenements-prives/${soiree.id}/cloture`);
  await appel("PUT", `/api/evenements-prives/${soiree.id}/reglement`, { mode: "virement", le: aujourdhui() });
  expect((await appel("POST", `/api/evenements-prives/${soiree.id}/facture`)).statut).toBe(201);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("export des factures pour le comptable", () => {
  it("un zip : pièce du fournisseur, facture de vente en PDF, récapitulatif ; hors période absente ; journalisé", async () => {
    const du = `${aujourdhui().slice(0, 8)}01`;
    const r = await serveur.inject({ method: "GET", url: `/api/factures/export?du=${du}&au=${aujourdhui()}`, headers: { cookie } });
    expect(r.statusCode).toBe(200);
    expect(r.headers["content-type"]).toBe("application/zip");
    const zip = unzipSync(new Uint8Array(r.rawPayload));
    const noms = Object.keys(zip).sort();
    expect(noms).toHaveLength(3);
    expect(noms[0]).toMatch(/^achats\/\d{4}-\d{2}-\d{2} Brasseur du Nord BN-12\.pdf$/);
    expect(noms[1]).toBe("recapitulatif.csv");
    expect(noms[2]).toMatch(/^ventes\/FP-\d{4}-0001\.pdf$/);
    expect(strFromU8(zip[noms[2]!]!.subarray(0, 5))).toBe("%PDF-");
    // BOM UTF-8 en tête, pour qu'Excel lise les accents ; le décodage le retire.
    expect([...zip["recapitulatif.csv"]!.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const csv = strFromU8(zip["recapitulatif.csv"]!).replace(/^﻿/, "");
    const lignes = csv.trim().split("\r\n");
    expect(lignes[0]).toBe("Type;Date;Numéro;Fournisseur ou client;HT;TVA;TTC;Statut;Payée le;Pièce");
    // Facture sans produit (des frais seulement) : rien à rapprocher, pas encore validée ni payée.
    expect(lignes[1]).toMatch(/^Achat;\d{2}\/\d{2}\/\d{4};BN-12;Brasseur du Nord;180,00;;;Rapprochée;;achats\//);
    // 10 bières à 7,00 € TTC (20 %) : 58,33 € HT, 11,67 € de TVA, 70,00 € TTC ; réglée.
    expect(lignes[2]).toMatch(/^Vente;\d{2}\/\d{2}\/\d{4};FP-\d{4}-0001;Société Durand;58,33;11,67;70,00;Payée;\d{2}\/\d{2}\/\d{4};ventes\//);
    expect(csv).not.toContain("BN-01");
    const { rows } = await proprietaire.pool.query("SELECT details FROM journal_technique WHERE lieu_id = $1 AND type = 'factures_exportees'", [lieuId]);
    expect(rows[0].details).toMatchObject({ achats: 1, ventes: 1 });
  });

  it("[F] période à l'envers : refusée", async () => {
    const r = await serveur.inject({ method: "GET", url: "/api/factures/export?du=2026-10-31&au=2026-10-01", headers: { cookie } });
    expect(r.statusCode).toBe(400);
  });
});
