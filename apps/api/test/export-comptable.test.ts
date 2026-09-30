/**
 * Export pour l'expert-comptable (dossier §15.110), contre la vraie base : journal des ventes et
 * récapitulatif bâtis sur les Z de match scellés, écart de tiroir compris.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ApercuExport, ClotureMatch, EntreeJournalTechnique, Evenement, PlanComptes, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let match: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
async function fichier(mois: string, type: "ecritures" | "recapitulatif") {
  const r = await serveur.inject({ method: "POST", url: "/api/export-comptable/fichier", headers: { ...EN_TETES, cookie }, payload: { mois, fichier: type } });
  return { statut: r.statusCode, type: r.headers["content-type"], nom: String(r.headers["content-disposition"] ?? ""), texte: r.body };
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  let stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  await appel("POST", `/api/stands/${stand.id}/caisses`, { especesAutorisees: true });
  stand = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!;
  const [especes, carte] = stand.caisses.map((k) => k.id) as [string, string];
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [stand.id] })).corps.find((p) => p.nom === "Bière")!;
  const eau = (await appel<Produit[]>("POST", "/api/produits", { nom: "Eau", prixTtc: 200, tauxTva: 550, standIds: [stand.id] })).corps.find((p) => p.nom === "Eau")!;

  // Match de mars 2025 : 2 bières en espèces (14,00 €), 1 eau par carte (2,00 €) ; tiroir compté 2,00 € court.
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Spartiates – Rouen", debut: "2025-03-15T19:00:00+01:00" })).corps[0]!;
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  const tEsp = tablette(especes, (await appel<RepriseCaisse>("POST", `/api/caisses/${especes}/ouverture`, { fond: 10000 })).corps);
  const tCarte = tablette(carte, (await appel<RepriseCaisse>("POST", `/api/caisses/${carte}/ouverture`, {})).corps);
  vendreHorsLigne(tEsp, [ligne(biere, 2)], { modeReglement: "especes", montantDonne: 1400 });
  vendreHorsLigne(tCarte, [ligne(eau)]);
  await envoyer(appel, tEsp);
  await envoyer(appel, tCarte);
  await appel("POST", `/api/caisses/${especes}/cloture`, { jeton: tEsp.reprise.jeton, derniereSequence: tEsp.tete.sequence });
  await appel("POST", `/api/caisses/${carte}/cloture`, { jeton: tCarte.reprise.jeton, derniereSequence: tCarte.tete.sequence });
  const session = (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match.id}`)).corps.sessions.find((s) => s.caisseId === especes)!;
  expect((await appel("POST", `/api/sessions-caisse/${session.sessionId}/comptage`, { coupures: { "5000": 2, "1000": 1, "200": 1 } })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("aperçu du mois", () => {
  it("le mois du match est proposé ; le Z porte les ventes, la TVA par taux et l'écart du tiroir", async () => {
    const a = (await appel<ApercuExport>("GET", "/api/export-comptable")).corps;
    expect(a.moisDisponibles).toEqual([{ cle: "2025-03", libelle: "Mars 2025", zs: 1, clos: false }]);
    expect(a.cle).toBe("2025-03");
    expect(a.clos).toBe(false);
    expect(a.zs).toHaveLength(1);
    expect(a.zs[0]).toMatchObject({ date: "2025-03-15", libelle: "Spartiates – Rouen", totalTtc: 1600, especes: 1400, carte: 200, ecartTiroirs: -200, ecartCoffre: 0 });
    expect(a.taux).toEqual([550, 2000]);
    // 14,00 + 2,00 d'encaissements + 2,00 de manquant = 18,00 € de chaque côté.
    expect(a.journal).toEqual({ lignes: 8, totalDebit: 1800, totalCredit: 1800, desequilibres: [] });
    expect(a.planPersonnalise).toBe(false);
  });
});

describe("fichiers", () => {
  it("écritures : CSV équilibré, provisoire tant que le mois n'est pas clôturé, téléchargement journalisé", async () => {
    const f = await fichier("2025-03", "ecritures");
    expect(f.statut).toBe(200);
    expect(f.type).toContain("text/csv");
    expect(f.nom).toContain("flaix-ecritures-ventes-2025-03-provisoire.csv");
    expect(f.texte).toContain("VT;15/03/2025;Z000001;530000;Ventes en espèces — Spartiates – Rouen;14,00;");
    expect(f.texte).toContain("VT;15/03/2025;Z000001;511500;Ventes par carte — Spartiates – Rouen;2,00;");
    expect(f.texte).toContain(";707055;Ventes HT TVA 5,5 % — Spartiates – Rouen;;1,90");
    expect(f.texte).toContain(";445713;TVA collectée 5,5 % — Spartiates – Rouen;;0,10");
    expect(f.texte).toContain(";658000;Écart de caisse (manquant) — Spartiates – Rouen;2,00;");
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps.find((e) => e.type === "export_comptable")!;
    expect(jet.details).toMatchObject({ mois: "2025-03", fichier: "ecritures", definitif: false, zs: 1, total_ttc: 1600 });
  });

  it("récapitulatif : une ligne par match et le total ; définitif une fois le mois clôturé", async () => {
    expect((await appel("POST", "/api/clotures/mois", { mois: "2025-03" })).statut).toBe(200);
    const f = await fichier("2025-03", "recapitulatif");
    expect(f.nom).toContain("flaix-recapitulatif-ventes-2025-03.csv");
    const lignes = f.texte.slice(1).trimEnd().split("\r\n");
    expect(lignes[0]).toBe("Date;Match;Z;Tickets;Annulations;CA TTC;HT 5,5 %;TVA 5,5 %;HT 20 %;TVA 20 %;Espèces;Carte;Écart tiroirs;Écart coffre;Empreinte du Z");
    expect(lignes[1]!.startsWith("15/03/2025;Spartiates – Rouen;Z000001;2;0;16,00;1,90;0,10;11,67;2,33;14,00;2,00;-2,00;0,00;")).toBe(true);
    expect((await appel<ApercuExport>("GET", "/api/export-comptable?mois=2025-03")).corps.clos).toBe(true);
  });

  it("un mois sans match clos n'a rien à exporter", async () => {
    const r = await fichier("2025-04", "ecritures");
    expect(r.statut).toBe(409);
    expect(JSON.parse(r.texte).erreur).toContain("Avril 2025");
  });
});

describe("plan de comptes", () => {
  it("[F] un numéro de compte invalide est refusé", async () => {
    const p = (await appel<{ plan: PlanComptes }>("GET", "/api/lieu/plan-comptes")).corps.plan;
    expect((await appel("PUT", "/api/lieu/plan-comptes", { plan: { ...p, caisseEspeces: "53 00" } })).statut).toBe(400);
  });

  it("le plan réglé par le lieu sert à l'export ; le remettre à zéro revient aux valeurs proposées", async () => {
    const p = (await appel<{ plan: PlanComptes }>("GET", "/api/lieu/plan-comptes")).corps.plan;
    const r = await appel<{ plan: PlanComptes; personnalise: boolean }>("PUT", "/api/lieu/plan-comptes", { plan: { ...p, journal: "ve", caisseEspeces: "531000" } });
    expect(r.corps).toMatchObject({ personnalise: true, plan: { journal: "VE", caisseEspeces: "531000" } });
    expect((await fichier("2025-03", "ecritures")).texte).toContain("VE;15/03/2025;Z000001;531000;");
    const remis = await appel<{ plan: PlanComptes; personnalise: boolean }>("PUT", "/api/lieu/plan-comptes", { plan: null });
    expect(remis.corps).toMatchObject({ personnalise: false, plan: { journal: "VT", caisseEspeces: "530000" } });
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps.filter((e) => e.type === "plan_comptes_modifie");
    expect(jet).toHaveLength(2);
  });
});
