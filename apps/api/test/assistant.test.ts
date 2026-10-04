/**
 * Assistant « pose ta question » et brief reformulé par Mistral (dossier §15.136), contre la vraie base.
 * Mistral est remplacé par un faux fournisseur piloté par le test : on vérifie ce que l'IA peut lire,
 * le contrôle des chiffres, la limite par jour, la trace de chaque échange et le garde-fou du brief.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { EtatAssistant, Evenement, Produit, RepriseCaisse, ReponseAssistant, Stand } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { definirFournisseurIA, type FournisseurIA, type MessageIA } from "../src/ia/fournisseur.ts";
import { definirEnvoyeurPush } from "../src/routes/notifications.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, creerLieuDeTest } from "./aide.ts";
import { envoyer, ligne, tablette, vendreHorsLigne } from "./tablette.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let cookie = "";
let lieu: { lieuId: string; utilisateurId: string; email: string };
let caisse: string;
let biere: Produit;
const notifications: string[] = [];

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };
function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}
const dernierOutil = (messages: MessageIA[]) => [...messages].reverse().find((x) => x.role === "tool") as Extract<MessageIA, { role: "tool" }> | undefined;

/** Faux Mistral : demande les résultats de septembre, puis répond en recopiant (ou non) le montant lu. */
function fauxMistral(reponse: (encaisse: string) => string, reformulation?: (texte: string) => string): FournisseurIA {
  return async (messages) => {
    const systeme = messages[0]!.content;
    if (systeme.startsWith("Tu reformules")) return { message: { content: reformulation ? reformulation((messages[1] as { content: string }).content) : "" }, modele: "faux-mistral", jetons: null };
    const lu = dernierOutil(messages);
    if (!lu) {
      return {
        message: { content: "", tool_calls: [{ id: "appel-1", type: "function", function: { name: "resultats", arguments: JSON.stringify({ du: "2026-09-01", au: "2026-09-30" }) } }] },
        modele: "faux-mistral",
        jetons: { entree: 800, sortie: 20 },
      };
    }
    const encaisse = (JSON.parse(lu.content) as { encaisseTtc: string }).encaisseTtc;
    return { message: { content: reponse(encaisse) }, modele: "faux-mistral", jetons: { entree: 1_200, sortie: 60 } };
  };
}

async function jouer(libelle: string, debut: string, bieres: number): Promise<Evenement> {
  const e = (await appel<Evenement[]>("POST", "/api/evenements", { libelle, debut })).corps.find((x) => x.libelle === libelle)!;
  await appel("POST", `/api/evenements/${e.id}/ouverture`);
  const t = tablette(caisse, (await appel<RepriseCaisse>("POST", `/api/caisses/${caisse}/ouverture`, {})).corps);
  vendreHorsLigne(t, [ligne(biere, bieres)]);
  expect((await envoyer(appel, t)).statut).toBe(200);
  expect((await appel("POST", `/api/caisses/${caisse}/cloture`, { jeton: t.reprise.jeton, derniereSequence: t.tete.sequence })).statut).toBe(200);
  expect((await appel("POST", `/api/evenements/${e.id}/cloture`)).statut).toBe(200);
  return e;
}

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  definirEnvoyeurPush(async (_d, charge) => {
    notifications.push((JSON.parse(charge) as { corps: string }).corps);
    return 201;
  });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;
  const stand = (await appel<Stand[]>("POST", "/api/stands", { nom: "Buvette" })).corps[0]!;
  caisse = (await appel<Stand[]>("POST", `/api/stands/${stand.id}/caisses`, {})).corps[0]!.caisses[0]!.id;
  biere = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière", prixTtc: 700, tauxTva: 2000, coutMatiere: 120, standIds: [stand.id] })).corps[0]!;
  await appel("POST", "/api/notifications/abonnement", { endpoint: "https://push.exemple.test/a", keys: { p256dh: "p", auth: "a" } });
});

afterAll(async () => {
  definirFournisseurIA(null);
  definirEnvoyeurPush(null);
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

const activerOption = () =>
  proprietaire.transaction({}, (c) => c.query("INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES ($1, 'assistant', true, $2)", [lieu.lieuId, lieu.utilisateurId]));

describe("assistant « pose ta question »", () => {
  it("[F] option désactivée par défaut (chaque question coûte) : l'assistant est fermé", async () => {
    expect((await appel("GET", "/api/assistant")).statut).toBe(403);
    expect((await appel("POST", "/api/assistant", { question: "Combien ai-je encaissé ?" })).statut).toBe(403);
  });

  it("option active mais clé Mistral absente : l'écran le sait, la question est refusée proprement", async () => {
    await activerOption();
    definirFournisseurIA(null);
    expect((await appel<EtatAssistant>("GET", "/api/assistant")).corps).toMatchObject({ branche: false, limite: 60, restantes: 60 });
    const r = await appel<{ erreur: string }>("POST", "/api/assistant", { question: "Combien ai-je encaissé ?" });
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("clé Mistral");
  });

  it("l'IA lit les résultats par un outil en lecture seule, recopie le montant, cite sa source ; l'échange est gardé", async () => {
    await jouer("Gap", "2026-09-05T18:00:00Z", 3);
    definirFournisseurIA(fauxMistral((encaisse) => `Du 1er au 30 septembre 2026, tu as encaissé ${encaisse} sur une soirée.`), "faux-mistral");
    const r = await appel<ReponseAssistant>("POST", "/api/assistant", { question: "Combien ai-je encaissé en septembre ?" });
    expect(r.statut).toBe(200);
    expect(r.corps.reponse.replace(/[  ]/g, " ")).toContain("21,00 €");
    expect(r.corps).toMatchObject({ verifie: true, modele: "faux-mistral", restantes: 59, sources: [{ outil: "resultats", libelle: "Résultats du 1er au 30 septembre 2026" }] });
    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ question: string; verifie: boolean; jetons_entree: number }>("SELECT question, verifie, jetons_entree FROM assistant_echange WHERE lieu_id = $1", [lieu.lieuId]));
    expect(rows).toEqual([{ question: "Combien ai-je encaissé en septembre ?", verifie: true, jetons_entree: 2_000 }]);
  });

  it("[F] un chiffre que les données ne contiennent pas : la réponse est marquée « à vérifier »", async () => {
    definirFournisseurIA(fauxMistral(() => "En septembre, tu as encaissé 999,99 €."), "faux-mistral");
    const r = await appel<ReponseAssistant>("POST", "/api/assistant", { question: "Et en septembre ?" });
    expect(r.corps.verifie).toBe(false);
  });

  it("[F] limite par jour atteinte : la question est refusée", async () => {
    await proprietaire.transaction({}, async (c) => {
      for (let i = 0; i < 58; i++) {
        await c.query("INSERT INTO assistant_echange (lieu_id, utilisateur_id, question, reponse, sources, modele, verifie) VALUES ($1, $2, 'q', 'r', '[]', 'x', true)", [lieu.lieuId, lieu.utilisateurId]);
      }
    });
    const r = await appel<{ erreur: string }>("POST", "/api/assistant", { question: "Encore une ?" });
    expect(r.statut).toBe(429);
  });
});

describe("brief reformulé par Mistral", () => {
  it("reformulation fidèle : elle part sur le téléphone, et la trace dit « rédigé par Mistral »", async () => {
    definirFournisseurIA(fauxMistral(() => "", (texte) => `Bonne soirée : ${texte.split("\n")[0]!.split(" : ")[1]}.`), "faux-mistral");
    const e = await jouer("Rouen", "2026-09-20T18:00:00Z", 2);
    expect(notifications.at(-1)!.startsWith("Bonne soirée")).toBe(true);
    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ redige_par: string; modele: string }>("SELECT redige_par, modele FROM brief_soiree WHERE evenement_id = $1", [e.id]));
    expect(rows).toEqual([{ redige_par: "mistral", modele: "faux-mistral" }]);
  });

  it("[F] reformulation qui invente un chiffre : refusée, le brief par règles part à la place", async () => {
    definirFournisseurIA(fauxMistral(() => "", () => "Soirée record : 25 000,00 € encaissés !"), "faux-mistral");
    const e = await jouer("Gap retour", "2026-09-27T18:00:00Z", 1);
    expect(notifications.at(-1)).not.toContain("25 000");
    const { rows } = await proprietaire.transaction({}, (c) => c.query<{ redige_par: string }>("SELECT redige_par FROM brief_soiree WHERE evenement_id = $1", [e.id]));
    expect(rows).toEqual([{ redige_par: "regles" }]);
  });
});
