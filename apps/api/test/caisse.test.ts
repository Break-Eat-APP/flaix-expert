/**
 * Étape 1 de la version test (dossier §15.94) : matchs, Ma caisse, journal des tickets.
 * Contre la vraie base PostgreSQL ; les tests [F] provoquent la fraude qu'ils doivent détecter.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Evenement, Produit, StatsCaisse, Stand, TicketVue, VerificationCaisses } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";

let proprietaire: Base;
let app: Base;
let serveur: FastifyInstance;
let lieu: { lieuId: string; utilisateurId: string; email: string };
let cookie = "";
let snack: Stand;
let bar: Stand;
let hotDog: Produit;
let biere: Produit;
let match1: Evenement;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

const vente = (caisseId: string, lignes: { produitId: string; quantite: number }[], extra: Record<string, unknown> = {}) =>
  appel<TicketVue & { erreur?: string }>("POST", `/api/caisses/${caisseId}/ventes`, {
    id: randomUUID(),
    lignes,
    modeReglement: "carte",
    ...extra,
  });

beforeAll(async () => {
  ({ proprietaire, app } = basesDeTest());
  serveur = await construireServeur(app, { journaliser: false });
  lieu = await creerLieuDeTest(proprietaire);
  const r = await serveur.inject({ method: "POST", url: "/api/auth/connexion", headers: EN_TETES, payload: { email: lieu.email, motDePasse: MOT_DE_PASSE_TEST } });
  cookie = `fx_session=${r.cookies.find((k) => k.name === "fx_session")!.value}`;

  await appel("POST", "/api/stands", { nom: "Le Snack" });
  let stands = (await appel<Stand[]>("POST", "/api/stands", { nom: "Le Bar" })).corps;
  snack = stands.find((s) => s.nom === "Le Snack")!;
  bar = stands.find((s) => s.nom === "Le Bar")!;
  await appel("POST", `/api/stands/${snack.id}/caisses`, { especesAutorisees: true });
  stands = (await appel<Stand[]>("POST", `/api/stands/${bar.id}/caisses`, {})).corps;
  snack = stands.find((s) => s.id === snack.id)!;
  bar = stands.find((s) => s.id === bar.id)!;

  await appel("POST", "/api/produits", { nom: "Hot dog", prixTtc: 700, tauxTva: 1000, standIds: [snack.id, bar.id] });
  const produits = (await appel<Produit[]>("POST", "/api/produits", { nom: "Bière 50cl", prixTtc: 700, tauxTva: 2000, standIds: [bar.id] })).corps;
  hotDog = produits.find((p) => p.nom === "Hot dog")!;
  biere = produits.find((p) => p.nom === "Bière 50cl")!;

  const evts = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match 1 — test", debut: new Date().toISOString(), spectateurs: 3000 })).corps;
  match1 = evts[0]!;
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

const caisseSnack = () => snack.caisses[0]!.id;
const caisseBar = () => bar.caisses[0]!.id;

describe("cycle d'un match", () => {
  it("une caisse ne s'ouvre pas sans match ouvert", async () => {
    const r = await appel<{ erreur: string }>("POST", `/api/caisses/${caisseBar()}/ouverture`, {});
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("Aucun match");
  });

  it("ouvre le match ; un second match ne peut pas être ouvert en même temps", async () => {
    expect((await appel("POST", `/api/evenements/${match1.id}/ouverture`)).statut).toBe(200);
    const autre = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Match 2", debut: new Date(Date.now() + 7 * 86_400_000).toISOString() })).corps.find(
      (e) => e.libelle === "Match 2",
    )!;
    const r = await appel<{ erreur: string }>("POST", `/api/evenements/${autre.id}/ouverture`);
    expect(r.statut).toBe(409);
  });

  it("le libellé d'un match ouvert ne se modifie plus, mais les spectateurs oui", async () => {
    expect((await appel("PATCH", `/api/evenements/${match1.id}`, { libelle: "Renommé" })).statut).toBe(409);
    expect((await appel("PATCH", `/api/evenements/${match1.id}`, { spectateurs: 3200 })).statut).toBe(200);
  });
});

describe("Ma caisse", () => {
  it("ouverture : fond obligatoire si la caisse accepte les espèces, inutile sinon", async () => {
    expect((await appel("POST", `/api/caisses/${caisseSnack()}/ouverture`, {})).statut).toBe(400);
    expect((await appel("POST", `/api/caisses/${caisseSnack()}/ouverture`, { fond: 15000 })).statut).toBe(200);
    expect((await appel("POST", `/api/caisses/${caisseBar()}/ouverture`, {})).statut).toBe(200);
    expect((await appel("POST", `/api/caisses/${caisseBar()}/ouverture`, {})).statut).toBe(409);
  });

  it("l'écran de caisse ne propose que les produits du stand, au prix en vigueur", async () => {
    const { corps } = await appel<{ produits: { nom: string; prixTtc: number }[]; session: unknown }>("GET", `/api/caisses/${caisseSnack()}/ecran`);
    expect(corps.produits.map((p) => p.nom)).toEqual(["Hot dog"]);
    expect(corps.session).not.toBeNull();
  });

  it("vend un ticket : numéro par caisse, prix pris sur le serveur, TVA ventilée", async () => {
    const r = await vente(caisseBar(), [
      { produitId: hotDog.id, quantite: 2 },
      { produitId: biere.id, quantite: 1 },
    ]);
    expect(r.statut).toBe(201);
    expect(r.corps.numeroJustificatif).toMatch(/^\d{4}-C2-000001$/);
    expect(r.corps.totalTtc).toBe(2100);
    expect(r.corps.ventilation).toEqual([
      { tauxTva: 1000, ht: 1273, tva: 127, ttc: 1400 },
      { tauxTva: 2000, ht: 583, tva: 117, ttc: 700 },
    ]);
  });

  it("refuse un produit non vendu à ce stand", async () => {
    expect((await vente(caisseSnack(), [{ produitId: biere.id, quantite: 1 }])).statut).toBe(409);
  });

  it("espèces : refusées sur une caisse carte uniquement ; montant donné insuffisant refusé ; rendu calculé", async () => {
    expect((await vente(caisseBar(), [{ produitId: hotDog.id, quantite: 1 }], { modeReglement: "especes", montantDonne: 1000 })).statut).toBe(409);
    expect((await vente(caisseSnack(), [{ produitId: hotDog.id, quantite: 1 }], { modeReglement: "especes", montantDonne: 500 })).statut).toBe(400);
    const ok = await vente(caisseSnack(), [{ produitId: hotDog.id, quantite: 1 }], { modeReglement: "especes", montantDonne: 1000 });
    expect(ok.corps).toMatchObject({ totalTtc: 700, montantDonne: 1000, rendu: 300 });
  });

  it("remise sans motif refusée ; remise abonné impossible tant que le taux du lieu n'est pas réglé", async () => {
    const aj = (a: Record<string, unknown>) => ({ ajustement: { remisePb: 0, offert: 0, motif: null, motifTexte: null, reference: null, ...a } });
    expect((await vente(caisseBar(), [{ produitId: hotDog.id, quantite: 1 }], aj({ remisePb: 1000 }))).statut).toBe(400);
    expect((await vente(caisseBar(), [{ produitId: hotDog.id, quantite: 1 }], aj({ remisePb: 1500, motif: "abonne", reference: "AB-1" }))).statut).toBe(400);
    await appel("PUT", "/api/lieu/reglages-caisse", { remiseAbonnePb: 1500 });
    const abo = await vente(caisseBar(), [{ produitId: hotDog.id, quantite: 1 }], aj({ remisePb: 1500, motif: "abonne", reference: "AB-20482" }));
    expect(abo.statut).toBe(201);
    expect(abo.corps).toMatchObject({ totalTtc: 595, motif: "abonne", reference: "AB-20482" });
  });

  it("un envoi répété avec le même identifiant ne crée jamais deux ventes", async () => {
    const id = randomUUID();
    const corps = { id, lignes: [{ produitId: hotDog.id, quantite: 1 }], modeReglement: "carte" };
    const a = await appel<TicketVue>("POST", `/api/caisses/${caisseBar()}/ventes`, corps);
    const b = await appel<TicketVue>("POST", `/api/caisses/${caisseBar()}/ventes`, corps);
    expect(a.corps.numeroJustificatif).toBe(b.corps.numeroJustificatif);
  });

  it("vingt ventes simultanées sur une caisse : numéros continus, sans trou ni doublon", async () => {
    await Promise.all(Array.from({ length: 20 }, () => vente(caisseBar(), [{ produitId: hotDog.id, quantite: 1 }])));
    const tickets = (await appel<TicketVue[]>("GET", `/api/tickets?evenementId=${match1.id}`)).corps.filter((t) => t.caisseNumero === 2);
    const numeros = tickets.map((t) => Number(t.numeroJustificatif.slice(-6))).sort((x, y) => x - y);
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
  });

  it("A6 — annulation : le ticket d'origine demeure, une opération inverse le référence, une seule fois", async () => {
    const t = (await vente(caisseBar(), [{ produitId: hotDog.id, quantite: 3 }])).corps;
    expect((await appel("POST", `/api/tickets/${t.id}/annulation`, { motif: "" })).statut).toBe(400);
    const a = await appel<TicketVue>("POST", `/api/tickets/${t.id}/annulation`, { motif: "Erreur de saisie" });
    expect(a.statut).toBe(201);
    expect(a.corps).toMatchObject({ type: "annulation", totalTtc: -2100, lie: { id: t.id } });
    expect((await appel("POST", `/api/tickets/${t.id}/annulation`, { motif: "Encore" })).statut).toBe(409);
    const liste = (await appel<TicketVue[]>("GET", `/api/tickets?evenementId=${match1.id}`)).corps;
    const origine = liste.find((x) => x.id === t.id)!;
    expect(origine.totalTtc).toBe(2100);
    expect(origine.lie?.numeroJustificatif).toBe(a.corps.numeroJustificatif);
  });

  it("Mes caisses : état ouvert en direct et chiffres du match par caisse", async () => {
    const stats = (await appel<StatsCaisse[]>("GET", `/api/caisses/tableau?evenementId=${match1.id}`)).corps;
    const s1 = stats.find((s) => s.numero === 1)!;
    expect(s1.ouverteMaintenant).not.toBeNull();
    expect(s1).toMatchObject({ nbVentes: 1, caNet: 700, especes: 700, carte: 0 });
  });

  it("clôture de caisse : totaux de la session, espèces attendues = fond + espèces", async () => {
    const r = await appel<{ net: number; especesAttendues: number; nbVentes: number }>("POST", `/api/caisses/${caisseSnack()}/cloture`);
    expect(r.corps).toMatchObject({ nbVentes: 1, net: 700, especesAttendues: 15700 });
    expect((await vente(caisseSnack(), [{ produitId: hotDog.id, quantite: 1 }])).statut).toBe(409);
  });

  it("un match ne se clôt pas tant qu'une caisse est ouverte, puis se clôt définitivement", async () => {
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(409);
    await appel("POST", `/api/caisses/${caisseBar()}/cloture`);
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(200);
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE evenement SET etat = 'ouvert' WHERE id = $1", [match1.id])))).toBe("23514");
  });

  it("la chaîne de chaque caisse est intacte", async () => {
    const v = await appel<VerificationCaisses>("POST", "/api/caisses/verification");
    expect(v.corps.ok).toBe(true);
    expect(v.corps.caisses.every((k) => k.maillons > 0)).toBe(true);
  });
});

describe("Groupe A — journal de caisse inaltérable [F]", () => {
  const ctx = () => ({ lieuId: lieu.lieuId, utilisateurId: lieu.utilisateurId });

  it("A1/A2 [F] — ni le serveur ni le propriétaire ne peuvent modifier ou supprimer un ticket ou une ligne", async () => {
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE journal_caisse SET total_ttc_centimes = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("DELETE FROM journal_caisse WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(app.transaction(ctx(), (c) => c.query("UPDATE ligne_ticket SET net_ttc_centimes = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE journal_caisse SET total_ttc_centimes = 1 WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("DELETE FROM ligne_ticket WHERE lieu_id = $1", [lieu.lieuId])))).toBe("42501");
  });

  it("A8 [F] — un numéro de justificatif ne peut pas être émis deux fois", async () => {
    const { rows } = await proprietaire.transaction({}, (c) =>
      c.query("SELECT * FROM journal_caisse WHERE lieu_id = $1 AND type = 'vente' ORDER BY sequence LIMIT 1", [lieu.lieuId]),
    );
    const t = rows[0];
    const code = await codeErreur(
      app.transaction(ctx(), (c) =>
        c.query(
          `INSERT INTO journal_caisse (id, lieu_id, caisse_id, sequence, type, numero_ticket, numero_justificatif, horodatage, stand_id,
             evenement_id, utilisateur_id, mode_reglement, total_ttc_centimes, empreinte_precedente, empreinte)
           VALUES (gen_random_uuid(), $1, $2, 9999, 'vente', 9999, $3, now(), $4, $5, $6, 'carte', 1, repeat('0', 64), repeat('a', 64))`,
          [lieu.lieuId, t.caisse_id, t.numero_justificatif, t.stand_id, t.evenement_id, lieu.utilisateurId],
        ),
      ),
    );
    expect(code).toBe("23505");
  });

  it("A3 [F] — une ligne insérée en contournant l'application (fausse empreinte) est détectée à la vérification", async () => {
    // Un fraudeur qui aurait l'accès du serveur insère un faux ticket en bout de chaîne, sans connaître la bonne empreinte.
    const { rows } = await proprietaire.transaction({}, (c) =>
      c.query("SELECT caisse_id, stand_id, evenement_id, max(sequence) AS s, max(numero_ticket) AS n FROM journal_caisse WHERE lieu_id = $1 GROUP BY caisse_id, stand_id, evenement_id LIMIT 1", [lieu.lieuId]),
    );
    const k = rows[0];
    await app.transaction(ctx(), (c) =>
      c.query(
        `INSERT INTO journal_caisse (id, lieu_id, caisse_id, sequence, type, horodatage, stand_id, evenement_id, utilisateur_id, empreinte_precedente, empreinte)
         VALUES (gen_random_uuid(), $1, $2, $3, 'ouverture_caisse', now(), $4, $5, $6, repeat('0', 64), repeat('b', 64))`,
        [lieu.lieuId, k.caisse_id, Number(k.s) + 1, k.stand_id, k.evenement_id, lieu.utilisateurId],
      ),
    );
    const v = await appel<VerificationCaisses>("POST", "/api/caisses/verification");
    expect(v.corps.ok).toBe(false);
    const fautive = v.corps.caisses.find((c) => !c.ok)!;
    expect(fautive.rupture).toMatchObject({ sequence: Number(k.s) + 1, raison: "chainage_rompu" });
  });
});
