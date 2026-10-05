/**
 * Prévision du prochain événement (dossier §15.143) — test de l'écran : fourchettes, mise en place proposée
 * (médiane − reste), caisses à l'heure de pointe, et verdict pour un événement joué. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { ReponsePrevision } from "@flaix/domain";
import { Prevision } from "./Prevision.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const prevision: ReponsePrevision["prevision"] = {
  base: "affluence",
  affluencePrevue: 3_000,
  comparables: [
    { id: "anglet", libelle: "Anglet", debut: "2026-10-03T18:00:00Z", spectateurs: 2_000 },
    { id: "brest", libelle: "Brest", debut: "2026-10-02T18:00:00Z", spectateurs: 3_000 },
  ],
  ca: { bas: 1_400_000, median: 1_500_000, haut: 1_600_000 },
  tickets: { bas: 900, median: 950, haut: 1_000 },
  produits: [{ standId: "N", stand: "Buvette Nord", produitId: "F", produit: "Frites", ventes: { bas: 280, median: 300, haut: 330 } }],
  pics: [{ standId: "N", stand: "Buvette Nord", tickets: { bas: 250, median: 280, haut: 300 } }],
};
const choix = [
  { id: "dunkerque", libelle: "Dunkerque", debut: "2026-10-10T18:00:00Z", etat: "a_venir" as const },
  { id: "anglet", libelle: "Anglet", debut: "2026-10-03T18:00:00Z", etat: "clos" as const },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/prevision")
        return reponse(200, { evenement: { id: "dunkerque", libelle: "Dunkerque", debut: "2026-10-10T18:00:00Z", etat: "a_venir", spectateurs: 3_000 }, choix, prevision, restes: { "N|F": 40 }, cadences: { "Buvette Nord": 95 }, realise: null, fiabilite: { evenements: 4, dansLaFourchette: 3 } } satisfies ReponsePrevision);
      if (url === "/api/prevision?evenementId=anglet")
        return reponse(200, { evenement: { id: "anglet", libelle: "Anglet", debut: "2026-10-03T18:00:00Z", etat: "clos", spectateurs: 2_000 }, choix, prevision, restes: {}, cadences: {}, realise: { ca: 1_700_000, tickets: 980, produits: { "N|F": 310 } }, fiabilite: null } satisfies ReponsePrevision);
      return reponse(404, { erreur: "Inconnu" });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Prevision />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("prévision du prochain événement", () => {
  it("à venir : 280 à 330 frites, 40 au stand → 260 proposées, 290 pour ne pas manquer ; 300 tickets au pic ÷ 95/h → 4 caisses", async () => {
    monter();
    expect(await screen.findByText("280 à 330")).toBeTruthy();
    expect(screen.getByText("260")).toBeTruthy();
    expect(screen.getByText("290")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("3 sur 4")).toBeTruthy();
  });

  it("un événement joué : le réalisé et son verdict (CA au-dessus, frites dans la fourchette)", async () => {
    monter();
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "anglet" } });
    await waitFor(() => expect(screen.getByText("310")).toBeTruthy());
    expect(screen.getByText("dans la fourchette")).toBeTruthy();
    expect(screen.getByText(/: au-dessus/)).toBeTruthy();
  });
});
