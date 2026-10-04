/**
 * Étape 1 de la version test (dossier §15.94) et vente sans réseau (§15.97) : événements, Ma caisse,
 * journal des tickets. Contre la vraie base PostgreSQL ; les tests [F] provoquent la fraude
 * qu'ils doivent détecter. Les ventes passent par une tablette simulée qui scelle elle-même.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import type { ClotureMatch, EntreeJournalTechnique, Evenement, Produit, RepriseCaisse, StatsCaisse, Stand, TicketVue, VerificationCaisses } from "@flaix/domain";
import type { Base } from "../src/base.ts";
import { construireServeur } from "../src/serveur.ts";
import { MOT_DE_PASSE_TEST, basesDeTest, codeErreur, creerLieuDeTest } from "./aide.ts";
import { annulerHorsLigne, envoyer, ligne, tablette, vendreHorsLigne, type Tablette } from "./tablette.ts";

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
let tSnack: Tablette;
let tBar: Tablette;

const EN_TETES = { "content-type": "application/json", origin: "http://localhost:5173" };

function appel<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH", url: string, payload?: unknown) {
  return serveur
    .inject({ method, url, headers: { ...(method === "GET" ? {} : EN_TETES), cookie }, payload: method === "GET" ? undefined : ((payload ?? {}) as object) })
    .then((r) => ({ statut: r.statusCode, corps: r.json() as T }));
}

const tickets = async () => (await appel<TicketVue[]>("GET", `/api/tickets?evenementId=${match1.id}`)).corps;
const ticket = async (id: string) => (await tickets()).find((t) => t.id === id)!;
const cloturer = (t: Tablette, derniereSequence = t.tete.sequence) =>
  appel<{ net: number; especesAttendues: number; nbVentes: number; erreur?: string }>("POST", `/api/caisses/${t.caisseId}/cloture`, { jeton: t.reprise.jeton, derniereSequence });

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

  // Prévu demain : aujourd'hui, rien n'est prévu, la caisse ne s'ouvre donc pas seule (caisse automatique : caisse-auto.test.ts).
  const evts = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Événement 1 — test", debut: new Date(Date.now() + 86_400_000).toISOString(), spectateurs: 3000 })).corps;
  match1 = evts[0]!;
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await serveur.close();
  await proprietaire.fermer();
  await app.fermer();
});

const caisseSnack = () => snack.caisses[0]!.id;
const caisseBar = () => bar.caisses[0]!.id;

/** Fait « passer » cinq minutes pour le serveur : les tickets scellés maintenant arriveront en retard. */
function plusTard(minutes: number) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + minutes * 60_000);
}

describe("cycle d'un événement", () => {
  it("une caisse ne s'ouvre pas sans événement ouvert ni prévu aujourd'hui", async () => {
    const r = await appel<{ erreur: string }>("POST", `/api/caisses/${caisseBar()}/ouverture`, {});
    expect(r.statut).toBe(409);
    expect(r.corps.erreur).toContain("Aucun événement prévu aujourd'hui");
  });

  it("ouvre l'événement ; un second match ne peut pas être ouvert en même temps", async () => {
    expect((await appel("POST", `/api/evenements/${match1.id}/ouverture`)).statut).toBe(200);
    const autre = (await appel<Evenement[]>("POST", "/api/evenements", { libelle: "Événement 2", debut: new Date(Date.now() + 7 * 86_400_000).toISOString() })).corps.find(
      (e) => e.libelle === "Événement 2",
    )!;
    expect((await appel("POST", `/api/evenements/${autre.id}/ouverture`)).statut).toBe(409);
  });

  it("le libellé d'un événement ouvert ne se modifie plus, mais les spectateurs oui", async () => {
    expect((await appel("PATCH", `/api/evenements/${match1.id}`, { libelle: "Renommé" })).statut).toBe(409);
    expect((await appel("PATCH", `/api/evenements/${match1.id}`, { spectateurs: 3200 })).statut).toBe(200);
  });
});

describe("Ma caisse — la tablette scelle, le serveur vérifie (§15.97)", () => {
  it("ouverture : fond obligatoire si la caisse accepte les espèces ; la tablette reçoit la tête de chaîne et son jeton", async () => {
    expect((await appel("POST", `/api/caisses/${caisseSnack()}/ouverture`, {})).statut).toBe(400);
    const s = await appel<RepriseCaisse>("POST", `/api/caisses/${caisseSnack()}/ouverture`, { fond: 15000 });
    expect(s.statut).toBe(200);
    expect(s.corps.tete).toMatchObject({ sequence: 1, dernierTicket: 0 });
    expect(s.corps.jeton.length).toBeGreaterThan(20);
    tSnack = tablette(caisseSnack(), s.corps);
    const b = await appel<RepriseCaisse>("POST", `/api/caisses/${caisseBar()}/ouverture`, {});
    expect(b.statut).toBe(200);
    tBar = tablette(caisseBar(), b.corps);
    expect((await appel("POST", `/api/caisses/${caisseBar()}/ouverture`, {})).statut).toBe(409);
  });

  it("l'écran de caisse ne propose que les produits du stand, au prix en vigueur", async () => {
    const { corps } = await appel<{ produits: { nom: string; prixTtc: number }[]; session: unknown }>("GET", `/api/caisses/${caisseSnack()}/ecran`);
    expect(corps.produits.map((p) => p.nom)).toEqual(["Hot dog"]);
    expect(corps.session).not.toBeNull();
  });

  it("vend un ticket : numéro par caisse, TVA ventilée, heure de réception notée, aucun signalement", async () => {
    const e = vendreHorsLigne(tBar, [ligne(hotDog, 2), ligne(biere)]);
    const r = await envoyer(appel, tBar);
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ recus: 1, deja: 0, tete: { sequence: e.sequence } });
    const t = await ticket(e.id);
    expect(t.numeroJustificatif).toMatch(/^\d{4}-C2-000001$/);
    expect(t.totalTtc).toBe(2100);
    expect(t.ventilation).toEqual([
      { tauxTva: 1000, ht: 1273, tva: 127, ttc: 1400 },
      { tauxTva: 2000, ht: 583, tva: 117, ttc: 700 },
    ]);
    expect(t.recuLe).not.toBeNull();
    expect(t.controle).toBeNull();
  });

  it("un envoi répété (réponse perdue) est reconnu : jamais deux fois le même ticket", async () => {
    const e = vendreHorsLigne(tBar, [ligne(hotDog)]);
    const lot = [...tBar.attente];
    expect((await envoyer(appel, tBar, lot)).corps).toMatchObject({ recus: 1, deja: 0 });
    expect((await envoyer(appel, tBar, lot)).corps).toMatchObject({ recus: 0, deja: 1 });
    tBar.attente = [];
    expect((await tickets()).filter((t) => t.id === e.id)).toHaveLength(1);
  });

  it("espèces : refusées sur une caisse carte uniquement ; montant insuffisant refusé ; rendu scellé", async () => {
    const carte = tablette(caisseBar(), { ...tBar.reprise, tete: tBar.tete });
    vendreHorsLigne(carte, [ligne(hotDog)], { modeReglement: "especes", montantDonne: 1000 });
    const r = await envoyer(appel, carte);
    expect(r.statut).toBe(409);
    expect((r.corps as { erreur?: string }).erreur).toContain("n'accepte pas les espèces");

    const court = tablette(caisseSnack(), { ...tSnack.reprise, tete: tSnack.tete });
    vendreHorsLigne(court, [ligne(hotDog)], { modeReglement: "especes", montantDonne: 500 });
    expect((await envoyer(appel, court)).statut).toBe(409);

    const e = vendreHorsLigne(tSnack, [ligne(hotDog)], { modeReglement: "especes", montantDonne: 1000 });
    expect((await envoyer(appel, tSnack)).statut).toBe(200);
    expect(await ticket(e.id)).toMatchObject({ totalTtc: 700, montantDonne: 1000, rendu: 300 });
  });

  it("remise sans motif refusée ; remise abonné acceptée et signalée tant que le taux du lieu diffère", async () => {
    const essai = tablette(caisseBar(), { ...tBar.reprise, tete: tBar.tete });
    vendreHorsLigne(essai, [ligne(hotDog)], { ajustement: { remisePb: 1000 } });
    expect((await envoyer(appel, essai)).statut).toBe(409);

    const a = vendreHorsLigne(tBar, [ligne(hotDog)], { ajustement: { remisePb: 1500, motif: "abonne", reference: "AB-1" } });
    expect((await envoyer(appel, tBar)).statut).toBe(200);
    expect((await ticket(a.id)).controle).toMatchObject({ remiseAbonneEcart: { applique: 1500, lieu: null } });

    await appel("PUT", "/api/lieu/reglages-caisse", { remiseAbonnePb: 1500 });
    const b = vendreHorsLigne(tBar, [ligne(hotDog)], { ajustement: { remisePb: 1500, motif: "abonne", reference: "AB-20482" } });
    expect((await envoyer(appel, tBar)).statut).toBe(200);
    expect(await ticket(b.id)).toMatchObject({ totalTtc: 595, motif: "abonne", reference: "AB-20482", controle: null });
  });

  it("un produit qui n'est pas vendu à ce stand est inscrit mais signalé", async () => {
    const e = vendreHorsLigne(tSnack, [ligne(biere)]);
    expect((await envoyer(appel, tSnack)).statut).toBe(200);
    expect((await ticket(e.id)).controle).toMatchObject({ horsStand: ["Bière 50cl"] });
  });

  it("F1/F2 — vingt ventes hors ligne, envoyées d'un coup au retour du réseau : numéros continus, marquées hors ligne", async () => {
    const lot = Array.from({ length: 20 }, () => vendreHorsLigne(tBar, [ligne(hotDog)]));
    plusTard(5);
    const r = await envoyer(appel, tBar);
    expect(r.corps).toMatchObject({ recus: 20, deja: 0 });
    const numeros = (await tickets()).filter((t) => t.caisseNumero === 2 && t.type === "vente").map((t) => Number(t.numeroJustificatif.slice(-6))).sort((x, y) => x - y);
    expect(numeros).toEqual(numeros.map((_, i) => i + 1));
    const dernier = await ticket(lot.at(-1)!.id);
    expect(dernier.controle).toMatchObject({ horsLigne: true });
    expect(dernier.controle!.delaiSecondes!).toBeGreaterThanOrEqual(290);
    const jet = (await appel<EntreeJournalTechnique[]>("GET", "/api/journal-technique?limite=20")).corps;
    expect(jet.find((j) => j.type === "tickets_hors_ligne_recus")?.details).toMatchObject({ tickets: 20 });
  });

  it("F3 [F] — deux caisses hors ligne en même temps, reprise en même temps : aucune collision, chaque chaîne intacte", async () => {
    const a = Array.from({ length: 5 }, () => vendreHorsLigne(tBar, [ligne(hotDog)]));
    const b = Array.from({ length: 5 }, () => vendreHorsLigne(tSnack, [ligne(hotDog)]));
    const [ra, rb] = await Promise.all([envoyer(appel, tBar), envoyer(appel, tSnack)]);
    expect([ra.statut, rb.statut]).toEqual([200, 200]);
    const tous = await tickets();
    const justificatifs = [...a, ...b].map((e) => tous.find((t) => t.id === e.id)!.numeroJustificatif);
    expect(new Set(justificatifs).size).toBe(10);
    expect(justificatifs.slice(0, 5).every((j) => j.includes("-C2-"))).toBe(true);
    expect(justificatifs.slice(5).every((j) => j.includes("-C1-"))).toBe(true);
    expect((await appel<VerificationCaisses>("POST", "/api/caisses/verification")).corps.ok).toBe(true);
  });

  it("le même lot envoyé deux fois en même temps n'inscrit chaque ticket qu'une fois", async () => {
    vendreHorsLigne(tBar, [ligne(hotDog)]);
    vendreHorsLigne(tBar, [ligne(hotDog)]);
    const lot = [...tBar.attente];
    const [r1, r2] = await Promise.all([envoyer(appel, tBar, lot), envoyer(appel, tBar, lot)]);
    expect(r1.corps.recus + r2.corps.recus).toBe(2);
    expect(r1.corps.deja + r2.corps.deja).toBe(2);
    tBar.attente = [];
  });

  it("A6 — annulation sur la tablette : le ticket d'origine demeure, une opération inverse le référence, une seule fois", async () => {
    const v = vendreHorsLigne(tBar, [ligne(hotDog, 3)]);
    expect((await envoyer(appel, tBar)).statut).toBe(200);
    const a = annulerHorsLigne(tBar, v, "Erreur de saisie");
    expect((await envoyer(appel, tBar)).statut).toBe(200);
    expect(await ticket(a.id)).toMatchObject({ type: "annulation", totalTtc: -2100, lie: { id: v.id } });
    const origine = await ticket(v.id);
    expect(origine.totalTtc).toBe(2100);
    expect(origine.lie?.numeroJustificatif).toBe(a.numeroJustificatif);

    const encore = tablette(caisseBar(), { ...tBar.reprise, tete: tBar.tete });
    annulerHorsLigne(encore, v, "Encore une fois");
    const r = await envoyer(appel, encore);
    expect(r.statut).toBe(409);
    expect((r.corps as { erreur?: string }).erreur).toContain("déjà annulé");
  });

  it("[F] un lot dont un ticket a été trafiqué est refusé en entier : rien n'est inscrit", async () => {
    const bon = vendreHorsLigne(tBar, [ligne(hotDog)]);
    const trafique = vendreHorsLigne(tBar, [ligne(hotDog)]);
    const lot = [bon, { ...trafique, totalTtc: 100 }];
    const r = await envoyer(appel, tBar, lot);
    expect(r.statut).toBe(409);
    expect((r.corps as { erreur?: string }).erreur).toContain("empreinte invalide");
    expect((await tickets()).some((t) => t.id === bon.id)).toBe(false);
    // Le lot intact, lui, passe : la tablette n'a rien perdu.
    expect((await envoyer(appel, tBar)).statut).toBe(200);
  });

  it("prix changé pendant une coupure : la vente au prix de la tablette est inscrite et l'écart signalé", async () => {
    await appel("POST", `/api/produits/${hotDog.id}/tarifs`, { prixTtc: 800, tauxTva: 1000 });
    const e = vendreHorsLigne(tBar, [ligne(hotDog)], { horodatage: new Date(Date.now() + 1000) });
    expect((await envoyer(appel, tBar)).statut).toBe(200);
    expect((await ticket(e.id)).controle).toMatchObject({ ecartTarif: [{ prixVendu: 700, prixTarif: 800 }] });
  });

  it("reprise sur un autre appareil : l'ancien jeton est refusé, le nouvel appareil continue la chaîne", async () => {
    const r = await appel<RepriseCaisse>("POST", `/api/caisses/${caisseBar()}/reprise`);
    expect(r.statut).toBe(200);
    expect(r.corps.tete.sequence).toBe(tBar.tete.sequence);
    const ancienne = tBar;
    vendreHorsLigne(ancienne, [ligne(hotDog)]);
    const refus = await envoyer(appel, ancienne);
    expect(refus.statut).toBe(409);
    expect((refus.corps as { erreur?: string }).erreur).toContain("reprise sur un autre appareil");

    tBar = tablette(caisseBar(), r.corps);
    vendreHorsLigne(tBar, [ligne(hotDog)]);
    expect((await envoyer(appel, tBar)).statut).toBe(200);
  });

  it("Mes caisses : état ouvert en direct et chiffres de l'événement par caisse", async () => {
    const stats = (await appel<StatsCaisse[]>("GET", `/api/caisses/tableau?evenementId=${match1.id}`)).corps;
    const s1 = stats.find((s) => s.numero === 1)!;
    expect(s1.ouverteMaintenant).not.toBeNull();
    // Snack : 1 vente en espèces (700), 1 bière hors stand (700), 5 ventes du test F3 (5 × 700).
    expect(s1).toMatchObject({ nbVentes: 7, caNet: 4900, especes: 700, carte: 4200 });
  });

  it("F4 — clôture : refusée tant qu'un ticket manque, puis faite en une fois ; une seconde clôture est refusée", async () => {
    expect((await cloturer(tSnack, tSnack.tete.sequence + 1)).statut).toBe(409);
    expect((await appel("POST", `/api/caisses/${caisseSnack()}/cloture`, { jeton: "x".repeat(40), derniereSequence: tSnack.tete.sequence })).statut).toBe(409);
    const r = await cloturer(tSnack);
    expect(r.statut).toBe(200);
    expect(r.corps).toMatchObject({ nbVentes: 7, net: 4900, especesAttendues: 15700 });
    expect((await cloturer(tSnack)).statut).toBe(409);
    vendreHorsLigne(tSnack, [ligne(hotDog)]);
    expect((await envoyer(appel, tSnack)).statut).toBe(409);
    const { rows } = await proprietaire.transaction({}, (c) =>
      c.query("SELECT count(*)::int AS n FROM journal_caisse WHERE caisse_id = $1 AND type = 'cloture_caisse'", [caisseSnack()]),
    );
    expect(rows[0].n).toBe(1);
  });

  it("un événement ne se clôt pas tant qu'une caisse est ouverte ni tant qu'un tiroir n'a pas son Z, puis se clôt définitivement", async () => {
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(409);
    expect((await cloturer(tBar)).statut).toBe(200);
    // Le tiroir de la caisse du Snack (espèces) doit être compté avant la clôture de l'événement (§15.102).
    const sansZ = await appel<{ erreur: string }>("POST", `/api/evenements/${match1.id}/cloture`);
    expect(sansZ.statut).toBe(409);
    expect(sansZ.corps.erreur).toContain("tiroir");
    const cl = (await appel<ClotureMatch>("GET", `/api/clotures?evenementId=${match1.id}`)).corps;
    const snackSession = cl.sessions.find((x) => x.caisseId === caisseSnack())!;
    expect(snackSession.attendu).toBe(15700);
    // 157,00 € : 3 billets de 50 €, 1 billet de 5 €, 1 pièce de 2 €.
    expect((await appel("POST", `/api/sessions-caisse/${snackSession.sessionId}/comptage`, { coupures: { "5000": 3, "500": 1, "200": 1 } })).statut).toBe(200);
    expect((await appel("POST", `/api/evenements/${match1.id}/cloture`)).statut).toBe(200);
    expect(await codeErreur(proprietaire.transaction({}, (c) => c.query("UPDATE evenement SET etat = 'ouvert' WHERE id = $1", [match1.id])))).toBe("23514");
  });

  it("la chaîne de chaque caisse est intacte, tickets scellés par la tablette compris", async () => {
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
