/**
 * Coûts par buvette (module 8 ; dossier §15.113), contre la vraie base : frais datés par stand,
 * consolidation du mois avec le coût matière et la masse salariale, recopie en formation.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CoutsBuvette, EmployeCree, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, SessionInfo, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let bar: Stand;
let cafe: Stand;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const couts = async (mois?: string) => (await appel<CoutsBuvette>("GET", `/api/couts-buvette${mois ? `?mois=${mois}` : ""}`)).corps;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  bar = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps.find((s) => s.nom === "Bar")!;
  bar = (await appel<Stand[]>("POST", `/api/stands/${bar.id}/caisses`, {})).corps.find((s) => s.nom === "Bar")!;
  cafe = (await appel<Stand[]>("POST", "/api/stands", { nom: "Café" })).corps.find((s) => s.nom === "Café")!;
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 90, standIds: [bar.id] })).corps.find((p) => p.nom === "Bière")!;
  const eau = (await appel<Produit[]>("POST", "/api/produits", { nom: "Eau", prixTtc: 200, tauxTva: 550, standIds: [bar.id] })).corps.find((p) => p.nom === "Eau")!;
  const karim = (await appel<EmployeCree>("POST", "/api/equipe/employes", { nom: "Karim T.", tauxHoraire: 2000 })).corps.employe;
  const lea = (await appel<EmployeCree>("POST", "/api/equipe/employes", { nom: "Léa B.", tauxHoraire: 1500 })).corps.employe;

  // Match d'octobre 2025 : 3 bières et 1 eau par carte au Bar ; Karim 4 h au Bar, Léa 2 h sans stand.
  const m = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Octobre", debut: "2025-10-11T19:00:00+02:00" })).corps[0]!;
  await appel("POST", "/api/planning/affectations", { evenementId: m.id, employeId: karim.id, standId: bar.id, debutPrevu: "18:00", finPrevu: "22:00" });
  await appel("POST", "/api/planning/affectations", { evenementId: m.id, employeId: lea.id, debutPrevu: "19:00", finPrevu: "21:00" });
  await appel("POST", `/api/evenements/${m.id}/ouverture`);
  const caisse = bar.caisses[0]!.id;
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(biere, 3), ligne(eau)]);
  await envoyer(appel, t);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("consolidation du mois", () => {
  it("sans frais saisis : coût matière et masse salariale lus, produit sans coût signalé", async () => {
    const c = await couts();
    expect(c.moisDisponibles).toEqual([{ cle: "2025-10", libelle: "Octobre 2025", matchs: 1 }]);
    const b = c.stands.find((s) => s.nom === "Bar")!;
    // CA HT : 3 × 5,83 + 1,90 = 19,40 € ; matière 3 × 0,90 € ; Karim 4 h × 20,00 €.
    expect(b).toMatchObject({ caHt: 1940, coutMatiere: 270, produitsSansCout: ["Eau"], masseSalariale: 8000, frais: { loyer: 0, logiciel: 0, abonnement: 0, tpe: 0 } });
    expect(b.total).toBe(8270);
    expect(b.reste).toBe(1940 - 8270);
    expect(c.horsStand).toEqual({ masseSalariale: 3000, affectations: 1 });
    expect(c.stands.find((s) => s.nom === "Café")).toMatchObject({ caHt: 0, total: 0 });
  });
});

describe("frais par stand, datés", () => {
  it("saisis à partir d'un mois : ils comptent ce mois-là ; un frais inchangé n'est pas réinscrit", async () => {
    const r = await appel<CoutsBuvette>("PUT", "/api/couts-buvette/frais", {
      aPartirDe: "2025-10",
      frais: [
        { standId: bar.id, poste: "loyer", montant: 50000 },
        { standId: bar.id, poste: "tpe", montant: 2500 },
        { standId: cafe.id, poste: "loyer", montant: 0 },
      ],
    });
    expect(r.statut).toBe(200);
    expect(r.corps.stands.find((s) => s.nom === "Bar")).toMatchObject({ frais: { loyer: 50000, tpe: 2500 }, total: 8270 + 52500 });
    expect(r.corps.frais).toHaveLength(2);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=30")).corps.find((e) => e.type === "frais_stand_modifies")!;
    expect((jet.details as { changes: unknown[] }).changes).toHaveLength(2);
  });

  it("un nouveau loyer à partir de novembre ne réécrit pas octobre", async () => {
    await appel("PUT", "/api/couts-buvette/frais", { aPartirDe: "2025-11", frais: [{ standId: bar.id, poste: "loyer", montant: 60000 }] });
    expect((await couts("2025-10")).stands.find((s) => s.nom === "Bar")!.frais.loyer).toBe(50000);
    expect((await couts("2025-11")).stands.find((s) => s.nom === "Bar")!.frais.loyer).toBe(60000);
  });

  it("[F] montant négatif ou poste inconnu refusés", async () => {
    expect((await appel("PUT", "/api/couts-buvette/frais", { aPartirDe: "2025-10", frais: [{ standId: bar.id, poste: "loyer", montant: -1 }] })).statut).toBe(400);
    expect((await appel("PUT", "/api/couts-buvette/frais", { aPartirDe: "2025-10", frais: [{ standId: bar.id, poste: "electricite", montant: 1 }] })).statut).toBe(400);
  });
});

describe("mode formation", () => {
  it("frais recopiés sur les stands jumeaux, en lecture seule", async () => {
    const entree = await appel<SessionInfo>("POST", "/api/formation/entree");
    cookie = `fx_session=${entree.cookies.find((k) => k.name === "fx_session")!.value}`;
    const c = await appel<CoutsBuvette>("GET", "/api/couts-buvette");
    expect(c.corps.frais.map((f) => [f.poste, f.aPartirDe, f.montant]).sort()).toEqual([
      ["loyer", "2025-10", 50000],
      ["loyer", "2025-11", 60000],
      ["tpe", "2025-10", 2500],
    ]);
    const standF = (await appel<Stand[]>("GET", "/api/stands")).corps.find((s) => s.nom === "Bar")!;
    expect((await appel("PUT", "/api/couts-buvette/frais", { aPartirDe: "2025-10", frais: [{ standId: standF.id, poste: "loyer", montant: 1 }] })).statut).toBe(409);
    const sortie = await appel<SessionInfo>("POST", "/api/formation/sortie");
    cookie = `fx_session=${sortie.cookies.find((k) => k.name === "fx_session")!.value}`;
  });
});
