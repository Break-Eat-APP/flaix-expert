/**
 * Brief de fin de soirée et notifications sur le téléphone du directeur (dossier §15.135), contre la
 * vraie base. L'envoi vers le service de notification du navigateur est simulé : on vérifie qui reçoit
 * quoi, une seule fois, et que les téléphones désabonnés sont retirés.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { BriefSoiree, Evenement, Produit, RepriseCaisse, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirEnvoyeurPush, envoyerBriefSoiree } from "../src/routes/notifications.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let caisse: string;
let biere: Produit;
let match: Evenement;
const recus: { endpoint: string; charge: { titre: string; corps: string; url: string } }[] = [];
let reponseService = 201;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const telephone = (n: number) => ({ endpoint: `https://push.exemple.test/abonnement-${n}`, keys: { p256dh: `cle-${n}`, auth: `auth-${n}` }, appareil: "iPhone de test" });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  definirEnvoyeurPush(async (d, charge) => {
    recus.push({ endpoint: d.endpoint, charge: JSON.parse(charge) });
    return reponseService;
  });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  match = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Spartiates – Rouen", debut: new Date().toISOString(), spectateurs: 3_000 })).corps[0]!;
});

afterAll(async () => {
  definirEnvoyeurPush(null);
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

describe("abonnement du téléphone", () => {
  it("la clé publique du serveur est créée une fois, puis toujours la même", async () => {
    const a = (await appel<{ cle: string; abonnements: number }>("GET", "/api/notifications")).corps;
    expect(a.cle).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    expect(a.abonnements).toBe(0);
    expect((await appel<{ cle: string }>("GET", "/api/notifications")).corps.cle).toBe(a.cle);
  });

  it("[F] une adresse d'abonnement qui n'est pas en https est refusée", async () => {
    expect((await appel("POST", "/api/notifications/abonnement", { ...telephone(0), endpoint: "http://push.exemple.test/x" })).statut).toBe(400);
  });

  it("le téléphone s'abonne ; s'abonner deux fois ne fait pas deux abonnements ; l'essai arrive", async () => {
    expect((await appel("POST", "/api/notifications/abonnement", telephone(1))).statut).toBe(200);
    expect((await appel("POST", "/api/notifications/abonnement", telephone(1))).statut).toBe(200);
    expect((await appel<{ abonnements: number }>("GET", "/api/notifications")).corps.abonnements).toBe(1);
    const essai = await appel<{ envoyees: number }>("POST", "/api/notifications/essai");
    expect(essai.corps.envoyees).toBe(1);
    expect(recus.at(-1)!.charge.corps).toContain("Notifications activées");
  });
});

describe("brief de fin de soirée", () => {
  it("à la clôture de l'événement, chaque téléphone abonné reçoit le brief, une seule fois", async () => {
    await appel("POST", "/api/notifications/abonnement", telephone(2));
    recus.length = 0;
    await appel("POST", `/api/evenements/${match.id}/ouverture`);
    const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
    vendreHorsLigne(t, [ligne(biere, 3)]);
    expect((await envoyer(appel, t)).statut).toBe(200);
    expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${match.id}/cloture`)).statut).toBe(200);

    expect(recus.map((r) => r.endpoint).sort()).toEqual([telephone(1).endpoint, telephone(2).endpoint]);
    expect(recus[0]!.charge.titre.replace(/[  ]/g, " ")).toBe("Spartiates – Rouen : 21,00 € encaissés");
    expect(recus[0]!.charge.url).toBe(`/rapport-soiree/${match.id}`);

    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ envoye_a: number; redige_par: string }>("SELECT envoye_a, redige_par FROM brief_soiree WHERE evenement_id = $1", [match.id]));
    expect(rows).toEqual([{ envoye_a: 2, redige_par: "regles" }]);
    // Un second déclenchement n'envoie rien de plus.
    await envoyerBriefSoiree(app, { lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId }, lieu.lieuId, match.id);
    expect(recus).toHaveLength(2);
  });

  it("le rapport de soirée montre le même brief", async () => {
    const r = (await appel<{ brief: BriefSoiree }>("GET", `/api/rapports-soiree/${match.id}`)).corps;
    expect(r.brief.titre).toBe(recus[0]!.charge.titre);
  });

  it("[F] un téléphone désabonné côté navigateur (410) est retiré ; la clôture n'échoue jamais pour une notification", async () => {
    reponseService = 410;
    const r = await appel<{ envoyees: number; echecs: number }>("POST", "/api/notifications/essai");
    expect(r.corps).toEqual({ envoyees: 0, echecs: 2 });
    expect((await appel<{ abonnements: number }>("GET", "/api/notifications")).corps.abonnements).toBe(0);
    expect((await appel<{ erreur: string }>("POST", "/api/notifications/essai")).statut).toBe(409);
    reponseService = 201;
  });
});
