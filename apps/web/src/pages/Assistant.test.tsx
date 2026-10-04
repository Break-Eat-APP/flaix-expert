/**
 * Assistant « pose ta question » (dossier §15.136) — test de l'écran : la réponse dit qu'elle vient
 * d'une IA, montre ce qu'elle a lu, et signale un chiffre non retrouvé. Serveur simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { Assistant } from "./Assistant.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
let branche = true;
let serveur: ReturnType<typeof vi.fn>;

beforeEach(() => {
  branche = true;
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/assistant" && (!init || init.method === "GET" || !init.method)) return reponse(200, { branche, modele: "mistral-medium-latest", limite: 60, restantes: 60 });
    if (url === "/api/assistant" && init?.method === "POST") {
      return reponse(200, { reponse: "En octobre, tu as encaissé 999,99 €.", sources: [{ outil: "resultats", libelle: "Résultats du 1er au 4 octobre 2026" }], modele: "mistral-medium-latest", verifie: false, restantes: 59 });
    }
    return reponse(404, { erreur: "Inconnu" });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Assistant />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("assistant à l'écran", () => {
  it("une question suggérée : réponse « rédigée par une IA », sources lues, chiffre non retrouvé signalé", async () => {
    monter();
    fireEvent.click(await screen.findByRole("button", { name: "Combien ai-je encaissé ce mois-ci ?" }));
    await screen.findByText("En octobre, tu as encaissé 999,99 €.");
    expect(screen.getByText(/Rédigé par une IA/)).toBeTruthy();
    expect(screen.getByText(/Lu : Résultats du 1er au 4 octobre 2026/)).toBeTruthy();
    expect(screen.getByText(/je n'ai pas retrouvé dans tes données/)).toBeTruthy();
    expect(screen.getByText(/59 questions restantes/)).toBeTruthy();
  });

  it("clé Mistral pas encore réglée : l'écran le dit, sans champ de question", async () => {
    branche = false;
    monter();
    await screen.findByText(/n'est pas encore branché/);
    expect(screen.queryByLabelText("Ta question")).toBeNull();
  });
});
