/**
 * Notifications sur ce téléphone (dossier §15.135, §15.140) — test de l'écran : sans prise en charge des
 * notifications (iPhone sans l'application sur l'écran d'accueil), le directeur sait quoi faire ; les
 * ruptures et stocks faibles poussés se règlent pour le lieu. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { Notifications } from "./Notifications.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/alertes/reglages" && init?.method === "PUT") return reponse(200, JSON.parse(init.body as string));
    if (url === "/api/alertes/reglages") return reponse(200, { rupture: true, faible: true });
    if (url === "/api/auth/session") return reponse(200, { utilisateur: { id: "d", nom: "Directeur" }, formation: false });
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
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("notifications sur ce téléphone", () => {
  it("navigateur sans notifications : l'écran explique comment installer l'application sur iPhone", async () => {
    monter();
    await screen.findByText(/Sur l'écran d'accueil/);
    expect(screen.queryByRole("button", { name: /Recevoir les notifications/ })).toBeNull();
  });

  it("stock en direct : ruptures et stocks faibles actifs par défaut ; décocher les stocks faibles part au serveur", async () => {
    monter();
    const faibles = await screen.findByLabelText(/Stocks faibles/);
    expect((screen.getByLabelText(/Ruptures/) as HTMLInputElement).checked).toBe(true);
    expect((faibles as HTMLInputElement).checked).toBe(true);
    fireEvent.click(faibles);
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => u === "/api/alertes/reglages" && (i as RequestInit | undefined)?.method === "PUT")).toBe(true));
    const envoi = serveur.mock.calls.find(([u, i]) => u === "/api/alertes/reglages" && (i as RequestInit | undefined)?.method === "PUT")!;
    expect(JSON.parse((envoi[1] as RequestInit).body as string)).toEqual({ rupture: true, faible: false });
  });
});
