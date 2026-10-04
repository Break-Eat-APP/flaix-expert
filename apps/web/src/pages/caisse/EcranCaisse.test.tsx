/**
 * Caisse automatique selon la date (dossier §15.130) — tests de l'écran de caisse : sur la tablette
 * de la caissière, la caisse s'ouvre seule le jour J avec le fond prévu, attend sinon le prochain
 * événement, et n'offre jamais la clôture. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { EcranCaisse as Ecran, OuvertureCaisse, RepriseCaisse } from "@flaix/domain";
import { EcranCaisse } from "./EcranCaisse.tsx";
import { effacerEtat, lireEtat } from "./memoire.ts";

const CAISSE = "caisse-auto";
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const reprise = {
  heureServeur: new Date().toISOString(),
  jeton: "jeton",
  tete: { sequence: 1, empreinte: "a".repeat(64), dernierTicket: 0, horodatage: null },
  contexte: { lieuId: "lieu", caisseId: CAISSE, numeroCaisse: 3, standId: "stand", evenementId: "rouen", sessionId: "session", utilisateurId: "julie" },
} as RepriseCaisse;

function ecranDuServeur(ouverture: Partial<OuvertureCaisse>, caisse: Partial<Ecran["caisse"]> = {}): Ecran {
  return {
    caisse: { id: CAISSE, numero: 3, nom: null, standId: "stand", standNom: "La Buvette", especesAutorisees: true, actif: true, fondPrevu: 15000, ...caisse },
    standActif: true,
    session: null,
    evenementOuvert: null,
    ouverture: { evenement: null, blocage: null, dejaCloturee: null, prochain: null, ...ouverture },
    produits: [{ id: "biere", nom: "Bière", categorieId: null, categorie: null, prixTtc: 400, tauxTva: 2000 }],
    remiseAbonnePb: null,
    environnementTest: true,
  } as Ecran;
}

const JOUR_J = { evenement: { id: "rouen", libelle: "Rouen", debut: new Date().toISOString(), aOuvrir: true } };
let ecran: Ecran;
let serveur: ReturnType<typeof vi.fn>;
const ouvertures = () => serveur.mock.calls.filter(([url, init]) => url === `/api/caisses/${CAISSE}/ouverture` && (init as RequestInit | undefined)?.method === "POST");

beforeEach(() => {
  localStorage.clear();
  effacerEtat(CAISSE);
  serveur = vi.fn(async (url: string) => {
    if (url === `/api/caisses/${CAISSE}/ecran`) return reponse(200, ecran);
    if (url === `/api/caisses/${CAISSE}/ouverture`) return reponse(200, reprise);
    if (url === `/api/caisses/${CAISSE}/nouvelles`) return reponse(200, { etat: "ouverte", sequenceServeur: 1 });
    if (url === "/api/auth/session") return reponse(200, { utilisateur: { id: "julie", nom: "Julie M." } });
    return reponse(404, { erreur: "Inconnu" });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  effacerEtat(CAISSE);
  vi.unstubAllGlobals();
});

function monter(poste: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EcranCaisse caisseId={CAISSE} poste={poste} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("tablette de la caissière", () => {
  it("jour J : la caisse s'ouvre seule, sans rien saisir (fond prévu par le directeur) ; pas de bouton de clôture", async () => {
    ecran = ecranDuServeur(JOUR_J);
    monter(true);
    await screen.findByText(/La clôture de la caisse est faite par le directeur/);
    expect(ouvertures()).toHaveLength(1);
    expect(JSON.parse((ouvertures()[0]![1] as RequestInit).body as string)).toEqual({});
    expect(lireEtat(CAISSE)?.reprise.contexte.sessionId).toBe("session");
    expect(screen.queryByText(/Clôturer la caisse/)).toBeNull();
  });

  it("rien de prévu aujourd'hui : écran d'attente qui annonce le prochain événement, aucune ouverture tentée", async () => {
    ecran = ecranDuServeur({ blocage: "Aucun événement prévu aujourd'hui. Prochain : « Gap », samedi 21 novembre.", prochain: { libelle: "Gap", debut: "2026-11-21T19:00:00Z" } });
    monter(true);
    await screen.findByText("Caisse en attente");
    expect(screen.getByText(/Prochain : « Gap »/)).toBeTruthy();
    expect(screen.getByText(/la caisse s'ouvrira toute seule/)).toBeTruthy();
    expect(ouvertures()).toHaveLength(0);
  });

  it("caisse déjà clôturée par le directeur pour l'événement en cours : elle attend le prochain, sans se rouvrir", async () => {
    ecran = ecranDuServeur({ evenement: { id: "rouen", libelle: "Rouen", debut: new Date().toISOString(), aOuvrir: false }, dejaCloturee: "Caisse clôturée pour « Rouen ». Elle se rouvrira seule au prochain événement." });
    monter(true);
    await screen.findByText("Caisse clôturée");
    expect(ouvertures()).toHaveLength(0);
  });

  it("[F] l'événement d'hier est resté ouvert : la tablette attend et demande de prévenir le directeur", async () => {
    ecran = ecranDuServeur({ evenement: { id: "hier", libelle: "Hier", debut: new Date().toISOString(), aOuvrir: false }, blocage: "L'événement « Hier » est encore ouvert : le directeur doit d'abord le clôturer." });
    monter(true);
    await screen.findByText("Préviens le directeur.");
    expect(ouvertures()).toHaveLength(0);
  });

  it("fond non prévu sur une caisse qui accepte les espèces : la caissière le saisit (repli), pas d'ouverture automatique", async () => {
    ecran = ecranDuServeur(JOUR_J, { fondPrevu: null });
    monter(true);
    await screen.findByText(/Le directeur n'a pas prévu de fond/);
    expect(screen.getByLabelText("Fond de caisse déclaré")).toBeTruthy();
    expect(ouvertures()).toHaveLength(0);
  });
});

describe("directeur", () => {
  it("pas d'ouverture automatique : il ouvre d'un clic, fond prévu prérempli, prévenu que l'événement s'ouvrira avec la caisse", async () => {
    ecran = ecranDuServeur(JOUR_J);
    monter(false);
    const fond = (await screen.findByLabelText("Fond de caisse déclaré")) as HTMLInputElement;
    expect(fond.value).toBe("150,00");
    expect(screen.getByText(/il s'ouvrira avec cette caisse/)).toBeTruthy();
    expect(ouvertures()).toHaveLength(0);
  });
});
