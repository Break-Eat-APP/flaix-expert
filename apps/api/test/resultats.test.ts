/**
 * Résultats (dossier §15.103) : chiffres calculés sur le journal de caisse, contre la vraie base.
 * Chaque attendu est recalculé à la main dans le commentaire du test.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, Produit, RepriseCaisse, Resultats, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let biere: Produit;
let hotDog: Produit;
let match1: Evenement;
let match2: Evenement;
let caisse: string;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const resultats = async (q = "") => (await appel<Resultats>("GET", `/api/resultats${q}`)).corps;

/** Joue un match : ouverture, ventes scellées par la tablette, clôture de caisse et du match. */
async function jouer(match: Evenement, ventes: (t: ReturnType<typeof tablette>) => void) {
  await appel("POST", `/api/evenements/${match.id}/ouverture`);
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  ventes(t);
  expect((await envoyer(appel, t)).statut).toBe(200);
  await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence });
  expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  // Bière 7,00 € TTC à 20 % (coût 1,20 €), hot-dog 6,00 € à 10 % (coût non saisi).
  await appel("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Hot-dog", prixTtc: 600, tauxTva: 1000, standIds: [stand.id] })).corps;
  biere = produits.find((p) => p.nom === "Bière")!;
  hotDog = produits.find((p) => p.nom === "Hot-dog")!;
  const evts = async (libelle: string, jours: number, spectateurs: number | null) =>
    (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut: new Date(Date.now() - jours * 86_400_000).toISOString(), spectateurs })).corps.find((e) => e.libelle === libelle)!;
  match1 = await evts("Match 1", 7, 1000);
  match2 = await evts("Match 2", 0, null);
  // Match 1 : 2 bières → 14,00 €.
  await jouer(match1, (t) => {
    vendreHorsLigne(t, [ligne(biere, 2)]);
  });
  // Match 2 : 3 bières (21,00 €) + 2 hot-dogs (12,00 €), puis 1 hot-dog vendu et annulé.
  await jouer(match2, (t) => {
    vendreHorsLigne(t, [ligne(biere, 3)]);
    vendreHorsLigne(t, [ligne(hotDog, 2)]);
    const v = vendreHorsLigne(t, [ligne(hotDog)]);
    annulerHorsLigne(t, v, "Erreur de saisie");
  });
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("Résultats — le dernier match, comparé au précédent", () => {
  it("par défaut : le match le plus récent, comparé au précédent qui a des ventes", async () => {
    const r = await resultats();
    expect(r.evenement!.id).toBe(match2.id);
    expect(r.comparaison!.id).toBe(match1.id);
    expect(r.matchs.map((m) => m.libelle)).toEqual(["Match 2", "Match 1"]);
  });

  it("chiffres clés : les annulations sont déduites, jamais comptées comme des ventes", async () => {
    const a = (await resultats()).actuel!;
    // 21,00 + 12,00 + 6,00 − 6,00 = 33,00 € ; tickets : 3 ventes − 1 annulation = 2.
    expect(a).toMatchObject({ caTtc: 3300, tickets: 2, panierMoyen: 1650, annulations: { nombre: 1, montant: 600 } });
    // Pas d'affluence saisie : pas de CA par spectateur.
    expect(a.caParSpectateur).toBeNull();
    // HT : bière 2100 / 1,2 = 1750 ; hot-dog 1200 / 1,1 = 1090,9 → 1091. TVA = 350 + 109.
    expect(a.caHt).toBe(1750 + 1091);
    expect(a.tva).toBe(350 + 109);
    expect(a.parTaux.map((t) => t.tauxTva)).toEqual([1000, 2000]);
    const hd = a.produits.find((p) => p.nom === "Hot-dog")!;
    expect(hd.quantite).toBe(2);
  });

  it("coût manquant : pas de marge brute tant qu'un produit vendu n'a pas de coût, et l'alerte le dit", async () => {
    const r = await resultats();
    expect(r.actuel!.coutMatiere).toBeNull();
    expect(r.actuel!.margeBrute).toBeNull();
    expect(r.actuel!.produitsSansCout).toEqual(["Hot-dog"]);
    expect(r.actuel!.produits.find((p) => p.nom === "Hot-dog")!.marge).toBeNull();
    // Marge de la bière : 1750 − 3 × 120 = 1390.
    expect(r.actuel!.produits.find((p) => p.nom === "Bière")!.marge).toBe(1390);
    expect(r.alertes.map((x) => x.titre)).toEqual(expect.arrayContaining(["Coût manquant sur 1 produit", "Affluence non saisie", "1 annulation"]));
  });

  it("une fois le coût saisi, la marge brute est calculée", async () => {
    await appel("PATCH", `/api/produits/${hotDog.id}`, { coutMatiere: 150 });
    const a = (await resultats()).actuel!;
    // Coût matière : 3 × 120 + 2 × 150 = 660 ; marge brute = 2841 − 660 = 2181.
    expect(a.coutMatiere).toBe(660);
    expect(a.margeBrute).toBe(2841 - 660);
  });

  it("le match précédent se choisit ; ses chiffres et son CA par spectateur", async () => {
    const r = await resultats(`?evenementId=${match1.id}&comparaison=${match2.id}`);
    expect(r.evenement!.id).toBe(match1.id);
    expect(r.comparaison!.id).toBe(match2.id);
    // 14,00 € pour 1 000 spectateurs = 0,014 € → arrondi à 1 centime.
    expect(r.actuel).toMatchObject({ caTtc: 1400, tickets: 1, caParSpectateur: 1 });
    expect(r.precedent!.caTtc).toBe(3300);
  });

  it("CA par heure : la somme des heures égale le CA", async () => {
    const a = (await resultats()).actuel!;
    expect(a.parHeure.reduce((s, h) => s + h.ca, 0)).toBe(a.caTtc);
    expect(a.parStand).toEqual([expect.objectContaining({ nom: "Buvette", ca: 3300 })]);
  });
});
