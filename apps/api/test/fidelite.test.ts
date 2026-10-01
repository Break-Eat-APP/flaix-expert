/**
 * Fidélité, partie gestion (module 19 ; dossier §15.114), contre la vraie base : abonnés, points lus
 * dans les tickets scellés (remise abonné), ajustements, import, codes promo.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EntreeJournalTechnique, EtatFidelite, Evenement, HistoriqueAbonne, Produit, RepriseCaisse, SessionInfo, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let karim = "";

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
async function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  const r = await serveur.inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) });
  return { statut: r.statusCode, corps: r.json() as T, cookies: r.cookies };
}
const etat = async () => (await appel<EtatFidelite>("GET", "/api/fidelite")).corps;
const fiche = async (numero: string) => (await etat()).abonnes.find((a) => a.numero === numero)!;
const jet = async () => (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=60")).corps.map((e) => e.type);

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  const lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  await appel("PUT", "/api/lieu/reglages-caisse", { remiseAbonnePb: 1000 });
  let s = (await appel<Stand[]>("POST", "/api/stands", { nom: "Bar" })).corps[0]!;
  s = (await appel<Stand[]>("POST", `/api/stands/${s.id}/caisses`, {})).corps[0]!;
  const biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, standIds: [s.id] })).corps[0]!;
  const m = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Spartiates – Rouen", debut: new Date().toISOString() })).corps[0]!;
  await appel("POST", `/api/evenements/${m.id}/ouverture`);
  const caisse = s.caisses[0]!.id;
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  const abonne = { remisePb: 1000, motif: "abonne" as const };
  // 5 bières à −10 % = 31,50 € ; 2 bières = 12,60 € (annulé ensuite) ; 1 bière n° inconnu ; 1 bière sans remise.
  vendreHorsLigne(t, [ligne(biere, 5)], { ajustement: { ...abonne, reference: " ab-20482 " } });
  const annule = vendreHorsLigne(t, [ligne(biere, 2)], { ajustement: { ...abonne, reference: "AB-20482" } });
  vendreHorsLigne(t, [ligne(biere)], { ajustement: { ...abonne, reference: "ZZ-1" } });
  vendreHorsLigne(t, [ligne(biere)]);
  annulerHorsLigne(t, annule, "Erreur de caisse");
  await envoyer(appel, t);
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("abonnés et points", () => {
  it("lieu neuf : aucune règle de points supposée ; le n° inconnu de la caisse est signalé", async () => {
    const e = await etat();
    expect(e.reglages).toBeNull();
    expect(e.abonnes).toEqual([]);
    expect(e.numerosSansFiche).toEqual([
      { numero: "AB-20482", tickets: 1 },
      { numero: "ZZ-1", tickets: 1 },
    ]);
  });

  it("une fiche rattache les tickets du n° (casse et espaces ignorés), annulation exclue ; points nuls tant que non réglés", async () => {
    expect((await appel("POST", "/api/fidelite/abonnes", { numero: "ab-20482", nom: "Karim Belaïd", email: "karim@exemple.fr" })).statut).toBe(200);
    expect((await appel("POST", "/api/fidelite/abonnes", { numero: "AB-20482", nom: "Doublon" })).statut).toBe(409);
    const k = await fiche("AB-20482");
    karim = k.id;
    expect(k).toMatchObject({ nom: "Karim Belaïd", source: "saisie", tickets: 1, depense: 3150, points: null });
    expect((await etat()).numerosSansFiche).toEqual([{ numero: "ZZ-1", tickets: 1 }]);
  });

  it("règles réglées : 1 point par euro entier → 31 points", async () => {
    const r = await appel<EtatFidelite>("PUT", "/api/fidelite/reglages", { pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 });
    expect(r.corps.reglages).toEqual({ pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 });
    expect((await fiche("AB-20482")).points).toBe(31);
  });

  it("ajustement : motif obligatoire, journalisé, compté dans le solde", async () => {
    expect((await appel("POST", `/api/fidelite/abonnes/${karim}/points`, { points: 20 })).statut).toBe(400);
    expect((await appel("POST", `/api/fidelite/abonnes/${karim}/points`, { points: 20, commentaire: "Geste après erreur de caisse" })).statut).toBe(200);
    expect((await fiche("AB-20482")).points).toBe(51);
    expect(await jet()).toContain("points_ajustes");
  });

  it("historique : tickets (annulé marqué, sans points) et mouvements", async () => {
    const h = (await appel<HistoriqueAbonne>("GET", `/api/fidelite/abonnes/${karim}`)).corps;
    expect(h.tickets.map((t) => [t.total, t.annule, t.points])).toEqual(
      expect.arrayContaining([
        [3150, false, 31],
        [1260, true, 0],
      ]),
    );
    expect(h.mouvements).toEqual([expect.objectContaining({ motif: "ajustement", points: 20, commentaire: "Geste après erreur de caisse" })]);
  });

  it("modification et désactivation journalisées sans recopier les données personnelles", async () => {
    await appel("PATCH", `/api/fidelite/abonnes/${karim}`, { telephone: "06 12 34 56 78", actif: false });
    expect(await fiche("AB-20482")).toMatchObject({ telephone: "06 12 34 56 78", actif: false });
    const e = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=60")).corps.find((x) => x.type === "abonne_modifie")!;
    expect(e.details).toEqual({ abonne: karim, numero: "AB-20482", champs: ["telephone", "actif"] });
  });
});

describe("import de la base existante", () => {
  it("crée les nouveaux abonnés avec leurs points de départ ; un n° déjà présent est signalé, pas écrasé", async () => {
    const r = await appel<{ crees: number; dejaPresents: string[]; etat: EtatFidelite }>("POST", "/api/fidelite/import", {
      lignes: [
        { numero: "AB-20482", nom: "Karim (ancien fichier)", points: 999 },
        { numero: "ZZ-1", nom: "Zoé Z.", email: "zoe@exemple.fr", points: 340 },
      ],
    });
    expect(r.corps).toMatchObject({ crees: 1, dejaPresents: ["AB-20482"] });
    // 340 points repris + 6 points du ticket ZZ-1 (6,30 €, 6 euros entiers).
    expect((await fiche("ZZ-1")).points).toBe(346);
    expect((await fiche("AB-20482")).nom).toBe("Karim Belaïd");
    expect(await jet()).toContain("abonnes_importes");
  });

  it("[F] une ligne invalide fait refuser tout l'envoi", async () => {
    expect((await appel("POST", "/api/fidelite/import", { lignes: [{ numero: "X1", nom: "", points: 0 }] })).statut).toBe(400);
  });
});

describe("codes promo", () => {
  it("créé, unique, désactivable ; son état est calculé", async () => {
    const r = await appel<EtatFidelite>("POST", "/api/fidelite/codes", { code: "match50", type: "pourcentage", valeur: 5000, debut: "2026-01-01", fin: "2099-12-31", usageMax: 200 });
    expect(r.statut).toBe(200);
    expect(r.corps.codes[0]).toMatchObject({ code: "MATCH50", etat: "valide", usages: 0 });
    expect((await appel("POST", "/api/fidelite/codes", { code: "MATCH50", type: "montant", valeur: 100, debut: "2026-01-01", fin: "2026-12-31", usageMax: null })).statut).toBe(409);
    expect((await appel("POST", "/api/fidelite/codes", { code: "TROP", type: "pourcentage", valeur: 12000, debut: "2026-01-01", fin: "2026-12-31", usageMax: null })).statut).toBe(400);
    const id = r.corps.codes[0]!.id;
    expect((await appel<EtatFidelite>("PATCH", `/api/fidelite/codes/${id}`, { actif: false })).corps.codes[0]!.etat).toBe("desactive");
  });
});

describe("mode formation", () => {
  it("le registre des abonnés n'est pas recopié dans le lieu d'entraînement, et ne s'y modifie pas", async () => {
    const entree = await appel<SessionInfo>("POST", "/api/formation/entree");
    cookie = `fx_session=${entree.cookies.find((k) => k.name === "fx_session")!.value}`;
    expect((await etat()).abonnes).toEqual([]);
    expect((await appel("POST", "/api/fidelite/abonnes", { numero: "F-1", nom: "Essai" })).statut).toBe(409);
    const sortie = await appel<SessionInfo>("POST", "/api/formation/sortie");
    cookie = `fx_session=${sortie.cookies.find((k) => k.name === "fx_session")!.value}`;
  });
});
