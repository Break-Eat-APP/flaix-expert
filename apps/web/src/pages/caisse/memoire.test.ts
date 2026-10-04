/**
 * Mémoire de la tablette et envoi des tickets (vente sans réseau, dossier §15.97) — tests des écrans
 * demandés par l'audit Codex du 2026-10-04 (P2-004). Le serveur est simulé : on contrôle ce qu'il
 * répond (succès, refus, coupure) et on vérifie que la tablette ne perd jamais un ticket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EcranCaisse, EvenementTablette, RepriseCaisse } from "@flaix/domain";
import { donnerNouvelles, effacerEtat, envoyer, initialiserEtat, lireEtat, lireNonEnvoyes, memoriserTicket, statutEnvoi } from "./memoire.ts";

const CAISSE = "caisse-test";
const reprise = {
  heureServeur: new Date().toISOString(),
  jeton: "jeton",
  tete: { sequence: 1, empreinte: "a".repeat(64), dernierTicket: 0, horodatage: null },
  contexte: { sessionId: "session", utilisateurId: "directeur" },
} as unknown as RepriseCaisse;
const ecran = {} as EcranCaisse;
const ticket = (n: number) => ({ id: `t${n}`, sequence: n + 1, numeroTicket: n }) as unknown as EvenementTablette;
const vendre = (n: number) => memoriserTicket(lireEtat(CAISSE)!, ticket(n), { sequence: n + 1, empreinte: "b".repeat(64), dernierTicket: n, horodatage: null });
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const envoyes = (f: ReturnType<typeof vi.fn>) => f.mock.calls.map(([, init]) => (JSON.parse((init as RequestInit).body as string) as { evenements: { id: string }[] }).evenements.map((e) => e.id));

let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  localStorage.clear();
  effacerEtat(CAISSE);
  serveur = vi.fn(async () => reponse(200, { recus: 1, deja: 0 }));
  vi.stubGlobal("fetch", serveur);
  initialiserEtat(CAISSE, reprise, ecran);
});
afterEach(() => vi.unstubAllGlobals());

describe("la tablette garde chaque ticket avant de l'afficher encaissé", () => {
  it("trois ventes : mémorisées dans l'ordre, en attente d'envoi", () => {
    vendre(1);
    vendre(2);
    vendre(3);
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1", "t2", "t3"]);
    expect(lireEtat(CAISSE)).toBe(lireEtat(CAISSE)); // même objet tant que rien ne change : l'écran ne se redessine pas pour rien
  });

  it("[F] mémoire de la tablette pleine ou refusée : l'enregistrement échoue, la vente n'est PAS comptée encaissée", () => {
    const ecrire = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("plein", "QuotaExceededError");
    });
    expect(() => vendre(1)).toThrow();
    ecrire.mockRestore();
    expect(lireEtat(CAISSE)!.attente).toEqual([]);
  });
});

describe("envoi au serveur", () => {
  it("le serveur confirme : la file se vide, dans l'ordre", async () => {
    vendre(1);
    vendre(2);
    await envoyer(CAISSE);
    expect(envoyes(serveur)).toEqual([["t1", "t2"]]);
    expect(lireEtat(CAISSE)!.attente).toEqual([]);
    expect(statutEnvoi(CAISSE)).toEqual({ etat: "a_jour" });
  });

  it("réseau coupé : rien n'est retiré de la mémoire, la tablette se dit hors ligne", async () => {
    serveur.mockRejectedValue(new TypeError("Failed to fetch"));
    vendre(1);
    await envoyer(CAISSE);
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
    expect(statutEnvoi(CAISSE)).toEqual({ etat: "hors_ligne" });
  });

  it("serveur injoignable derrière le relais (502) : traité comme une coupure", async () => {
    serveur.mockResolvedValue(reponse(502, {}));
    vendre(1);
    await envoyer(CAISSE);
    expect(statutEnvoi(CAISSE).etat).toBe("hors_ligne");
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
  });

  it("refus du serveur : le message s'affiche, le ticket reste en mémoire", async () => {
    serveur.mockResolvedValue(reponse(409, { erreur: "Ticket refusé : empreinte invalide." }));
    vendre(1);
    await envoyer(CAISSE);
    expect(statutEnvoi(CAISSE)).toEqual({ etat: "refus", message: "Ticket refusé : empreinte invalide." });
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
  });

  it("session expirée (401) : la tablette demande une reconnexion, rien n'est perdu", async () => {
    serveur.mockResolvedValue(reponse(401, { erreur: "Session expirée" }));
    vendre(1);
    await envoyer(CAISSE);
    expect(statutEnvoi(CAISSE).etat).toBe("reconnexion");
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
  });

  it("une vente faite pendant l'envoi part au tour suivant, sans doublon", async () => {
    vendre(1);
    serveur.mockImplementationOnce(async () => {
      vendre(2); // la caissière encaisse pendant que le lot précédent est en route
      return reponse(200, { recus: 1, deja: 0 });
    });
    await envoyer(CAISSE);
    expect(envoyes(serveur)).toEqual([["t1"], ["t2"]]);
    expect(lireEtat(CAISSE)!.attente).toEqual([]);
  });

  it("deux envois demandés en même temps : un seul part", async () => {
    vendre(1);
    await Promise.all([envoyer(CAISSE), envoyer(CAISSE)]);
    expect(serveur).toHaveBeenCalledTimes(1);
  });

  it("250 tickets après une longue coupure : envoyés par lots de 200, dans l'ordre", async () => {
    for (let n = 1; n <= 250; n++) vendre(n);
    await envoyer(CAISSE);
    const lots = envoyes(serveur);
    expect(lots.map((l) => l.length)).toEqual([200, 50]);
    expect(lots.flat()[0]).toBe("t1");
    expect(lots.flat()[249]).toBe("t250");
    expect(lireEtat(CAISSE)!.attente).toEqual([]);
  });
});

describe("nouvelles de la tablette au serveur (caisse automatique, §15.130)", () => {
  const corps = (f: ReturnType<typeof vi.fn>, i = 0) => JSON.parse((f.mock.calls[i]![1] as RequestInit).body as string) as Record<string, unknown>;

  it("caisse ouverte : la tablette dit son dernier ticket et ce qui attend ; pas de nouvelles redonnées avant 30 s si rien n'a bougé", async () => {
    serveur.mockImplementation(async () => reponse(200, { etat: "ouverte", sequenceServeur: 1 }));
    vendre(1);
    expect(await donnerNouvelles(CAISSE)).toBe("ouverte");
    expect(serveur.mock.calls[0]![0]).toBe("/api/caisses/caisse-test/nouvelles");
    expect(corps(serveur)).toEqual({ sessionId: "session", jeton: "jeton", sequence: 2, attente: 1 });
    expect(await donnerNouvelles(CAISSE)).toBeNull();
    vendre(2); // une nouvelle vente : les nouvelles repartent tout de suite
    expect(await donnerNouvelles(CAISSE)).toBe("ouverte");
    expect(serveur).toHaveBeenCalledTimes(2);
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1", "t2"]);
  });

  it("le directeur a clôturé la caisse, tout était envoyé : la tablette se libère pour le prochain événement", async () => {
    serveur.mockResolvedValue(reponse(200, { etat: "cloturee", sequenceServeur: 1 }));
    expect(await donnerNouvelles(CAISSE)).toBe("cloturee");
    expect(lireEtat(CAISSE)).toBeNull();
    expect(lireNonEnvoyes(CAISSE)).toEqual([]);
  });

  it("[F] clôture forcée avec 2 tickets pas envoyés : la caisse se libère, les 2 tickets restent sur la tablette, mis de côté", async () => {
    vendre(1);
    vendre(2);
    serveur.mockResolvedValue(reponse(200, { etat: "cloturee", sequenceServeur: 1 }));
    await donnerNouvelles(CAISSE);
    expect(lireEtat(CAISSE)).toBeNull();
    const lots = lireNonEnvoyes(CAISSE);
    expect(lots).toHaveLength(1);
    expect(lots[0]).toMatchObject({ sessionId: "session", raison: "cloturee" });
    expect(lots[0]!.tickets.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("[F] mémoire pleine au moment de mettre les tickets de côté : la caisse reste affichée, avec ses tickets", async () => {
    vendre(1);
    serveur.mockResolvedValue(reponse(200, { etat: "reprise", sequenceServeur: 1 }));
    const ecrire = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("plein", "QuotaExceededError");
    });
    await donnerNouvelles(CAISSE);
    ecrire.mockRestore();
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
  });

  it("réseau coupé : rien ne change sur la tablette", async () => {
    vendre(1);
    serveur.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await donnerNouvelles(CAISSE)).toBeNull();
    expect(lireEtat(CAISSE)!.attente).toEqual(["t1"]);
  });
});
