/**
 * « Ce qu'il te reste » et « Mes frais » (dossier §15.154), contre la vraie base : frais proposés (renseigné, pas
 * concerné, à vérifier), frais du mois du lieu et des stands répartis sur les soirées du mois au prorata de leur CA HT,
 * montant habituel d'un frais de soirée (en % du CA HT ou des paiements par carte), mois sans match compté en entier
 * dans une période, rappel dans le centre d'alertes, journal. Ventes déposées par une caisse connectée en septembre.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CaisseExterne, CentreAlertes, EntreeJournalTechnique, Evenement, FinancesSoiree, MesFrais, Produit, Stand } from "@flaix/domain";
import { FRAIS_SUGGERES, LIBELLE_RESTE } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let stand: Stand;
let matchA: Evenement;
let matchB: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T };
}
const finances = async (e: Evenement) => (await appel<FinancesSoiree>("GET", `/api/finances?evenementId=${e.id}`)).corps;
const ligneDe = (m: MesFrais, cle: string) => m.lignes.find((l) => l.cle === cle)!;

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await proprietaire.pool.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'caisses_connectees', true, $2)", [lieu.lieuId, lieu.utilisateurId]);
  stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  const evs = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match A", debut: "2026-09-05T18:00:00.000Z" })).corps;
  matchA = evs.find((e) => e.libelle === "Match A")!;
  matchB = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match B", debut: "2026-09-19T18:00:00.000Z" })).corps.find((e) => e.libelle === "Match B")!;
  // Match A : 10 bières payées par carte (70 €) ; match B : 30 bières en espèces (210 €).
  const caisse = (await appel<CaisseExterne[]>("POST", "/api/caisses-externes", { nom: "Stade", systeme: "autre" })).corps[0]!.id;
  const fichier = [
    "N° ticket;Date;Article;Code;Qté;Montant TTC;TVA;Paiement",
    "A-1;05/09/2026 20:00;Bière;BIE;10;70,00;20;Carte",
    "B-1;19/09/2026 20:00;Bière;BIE;30;210,00;20;Espèces",
  ].join("\n");
  expect((await appel<{ ajoutees: number }>("POST", `/api/caisses-externes/${caisse}/import`, { fichier: "ventes.csv", contenu: fichier })).corps.ajoutees).toBe(2);
  await appel("PUT", `/api/caisses-externes/${caisse}/produits`, { cle: "BIE", produitId: biere.id, ignore: false });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("mes frais et ce qu'il te reste", () => {
  it("au départ : tous les frais proposés sont à vérifier ; rappel dans le centre d'alertes", async () => {
    const m = (await appel<MesFrais>("GET", "/api/mes-frais")).corps;
    expect(m).toMatchObject({ proposes: FRAIS_SUGGERES.length, verifies: 0, totalMois: 0 });
    expect(m.lignes.every((l) => l.statut === "a_verifier")).toBe(true);
    const alertes = (await appel<CentreAlertes>("GET", "/api/alertes")).corps.alertes;
    expect(alertes.find((a) => a.id === "frais_a_verifier")).toMatchObject({ titre: `Mes frais : ${FRAIS_SUGGERES.length} frais à vérifier`, lien: "/parametres/frais" });
  });

  it("frais renseignés : du mois (proposé, libre, par stand), de soirée avec montant habituel ; « pas concerné » ; journal", async () => {
    await appel("POST", "/api/mes-frais/mois", { cle: "assurance", montant: 4_000, aPartirDe: "2026-09" });
    await appel("POST", "/api/mes-frais/mois", { nom: "Location du frigo", montant: 6_000, aPartirDe: "2026-09" });
    await appel("PUT", "/api/couts-buvette/frais", { aPartirDe: "2026-09", frais: [{ standId: stand.id, poste: "loyer", montant: 20_000 }] });
    await appel("POST", "/api/mes-frais/soiree", { cle: "commission_club", modeHabituel: "pourcent", valeurHabituelle: 1_000 });
    await appel("POST", "/api/mes-frais/soiree", { cle: "frais_carte", modeHabituel: "pourcent_carte", valeurHabituelle: 100 });
    const m = (await appel<MesFrais>("PUT", "/api/mes-frais/pas-concerne/sacem", { pasConcerne: true })).corps;
    expect(m.verifies).toBe(5);
    expect(ligneDe(m, "assurance")).toMatchObject({ statut: "renseigne", montantMois: 4_000 });
    expect(ligneDe(m, "loyer")).toMatchObject({ statut: "renseigne", montantMois: 20_000, parStand: "loyer" });
    expect(ligneDe(m, "commission_club")).toMatchObject({ statut: "renseigne", modeHabituel: "pourcent", valeurHabituelle: 1_000 });
    expect(ligneDe(m, "sacem").statut).toBe("pas_concerne");
    expect(m.lignes.find((l) => l.libelle === "Location du frigo")).toMatchObject({ cle: null, frequence: "mois", montantMois: 6_000 });
    const types = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=50")).corps.map((e) => e.type);
    expect(types).toEqual(expect.arrayContaining(["frais_mensuel_cree", "poste_depense_cree", "frais_pas_concerne"]));
  });

  it("[F] frais du mois proposé comme frais de soirée, doublon, pourcentage au-delà de 100 % : refusés", async () => {
    expect((await appel("POST", "/api/mes-frais/soiree", { cle: "assurance" })).statut).toBe(400);
    expect((await appel("POST", "/api/mes-frais/soiree", { cle: "commission_club" })).statut).toBe(409);
    expect((await appel("POST", "/api/mes-frais/mois", { nom: "location du frigo", montant: 1, aPartirDe: "2026-09" })).statut).toBe(409);
    expect((await appel("POST", "/api/mes-frais/soiree", { nom: "Divers", modeHabituel: "pourcent", valeurHabituelle: 12_000 })).statut).toBe(400);
  });

  it("frais du mois (300 €) répartis sur les deux matchs au prorata du CA HT ; montant habituel ; « ce qu'il te reste »", async () => {
    const [a, b] = [await finances(matchA), await finances(matchB)];
    expect(a.fraisMois).toHaveLength(1);
    expect(a.fraisMois[0]).toMatchObject({ mois: "2026-09", fraisDuMois: 30_000, sansSoiree: false });
    expect(a.totalFraisMois + b.totalFraisMois).toBe(30_000);
    expect(Math.abs(a.totalFraisMois - (30_000 * a.caHt) / (a.caHt + b.caHt))).toBeLessThanOrEqual(1);
    // Commission du club : 10 % du CA HT ; frais de carte : 1 % des paiements par carte (70 € au match A, rien au B).
    expect(a.depenses.find((d) => d.nom === "Commission du club ou du stade")).toMatchObject({ habituel: true, montant: Math.round(a.caHt / 10) });
    expect(a.depenses.find((d) => d.nom === "Frais de carte bancaire")).toMatchObject({ habituel: true, montant: 70 });
    expect(b.depenses.find((d) => d.nom === "Frais de carte bancaire")!.montant).toBe(0);
    expect(a.ecartStock).toBeNull();
    // Reste = CA HT − 10 × 1,20 € − dépenses − part des frais du mois.
    expect(a.margeNette).toBe(a.caHt - 1_200 - a.totalDepenses - a.totalFraisMois);
    expect(a.cascade.at(-2)).toMatchObject({ montant: a.totalFraisMois, sorte: "retire" });
    expect(a.cascade.at(-1)).toMatchObject({ libelle: LIBELLE_RESTE, montant: a.margeNette });
    expect(a.fraisAVerifier).toBe(FRAIS_SUGGERES.length - 5);
  });

  it("une saisie propre à la soirée remplace le montant habituel", async () => {
    const poste = (await finances(matchA)).depenses.find((d) => d.nom === "Commission du club ou du stade")!;
    const f = (await appel<FinancesSoiree>("PUT", `/api/finances/${matchA.id}/depenses/${poste.posteId}`, { mode: "euros", valeur: 500 })).corps;
    expect(f.depenses.find((d) => d.posteId === poste.posteId)).toMatchObject({ habituel: false, mode: "euros", montant: 500 });
  });

  it("période septembre–octobre : octobre sans match compte ses frais en entier ; un frais arrêté ne réécrit pas septembre", async () => {
    const frigo = (await appel<MesFrais>("GET", "/api/mes-frais")).corps.lignes.find((l) => l.libelle === "Location du frigo")!;
    await appel("PUT", `/api/mes-frais/mois/${frigo.fraisId}`, { montant: 0, aPartirDe: "2026-10" });
    const p = (await appel<FinancesSoiree>("GET", "/api/finances?du=2026-09-01&au=2026-10-31")).corps;
    expect(p.fraisMois).toEqual([
      { mois: "2026-09", fraisDuMois: 30_000, caHtDuMois: expect.any(Number), part: 30_000, sansSoiree: false },
      { mois: "2026-10", fraisDuMois: 24_000, caHtDuMois: 0, part: 24_000, sansSoiree: true },
    ]);
    expect(p.totalFraisMois).toBe(54_000);
    // Une période qui ne contient pas tout octobre ne lui prend rien.
    expect((await appel<FinancesSoiree>("GET", "/api/finances?du=2026-09-01&au=2026-10-15")).corps.totalFraisMois).toBe(30_000);
  });
});
