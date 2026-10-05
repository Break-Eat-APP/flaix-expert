/**
 * Support FlaiX Expert (back-office niveau 2 ; dossier §15.142) — test de l'écran du lieu : autoriser pour une
 * durée choisie, voir ce qui a été consulté, retirer. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { AutorisationSupport, EtatSupport } from "@flaix/domain";
import { SupportFlaix } from "./SupportFlaix.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const active: AutorisationSupport = {
  id: "a1",
  debut: "2026-10-05T14:00:00Z",
  fin: "2026-10-05T18:00:00Z",
  motif: "Problème de clôture",
  accordeePar: "Directeur Essai",
  retireeLe: null,
  retireePar: null,
  active: true,
  consultations: [{ route: "/api/clotures", ecran: "Clôtures et événements", le: "2026-10-05T14:05:00Z", par: "FlaiX Expert — Camille Support" }],
};
let etat: EtatSupport;
let serveur: ReturnType<typeof vi.fn>;

beforeEach(() => {
  etat = { active: null, historique: [] };
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/support" && (init?.method ?? "GET") === "GET") return reponse(200, etat);
    if (url === "/api/support/autorisation") {
      etat = { active, historique: [active] };
      return reponse(200, etat);
    }
    if (url === "/api/support/retrait") {
      const passee = { ...active, active: false, retireeLe: "2026-10-05T14:30:00Z", retireePar: "Directeur Essai" };
      etat = { active: null, historique: [passee] };
      return reponse(200, etat);
    }
    if (url === "/api/auth/session") return reponse(200, { utilisateur: { id: "d", nom: "Directeur Essai" }, formation: false });
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
        <SupportFlaix />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("support FlaiX Expert, côté lieu", () => {
  it("autoriser 1 heure avec un motif : la durée et le motif partent au serveur ; ce qui a été consulté s'affiche", async () => {
    monter();
    fireEvent.click(await screen.findByRole("button", { name: "1 heure" }));
    fireEvent.change(screen.getByPlaceholderText("Ex. problème de clôture"), { target: { value: "Problème de clôture" } });
    fireEvent.click(screen.getByRole("button", { name: /Autoriser le support pour 1 heure/ }));
    await screen.findByText("Le support est autorisé");
    const envoi = serveur.mock.calls.find(([u]) => u === "/api/support/autorisation")!;
    expect(JSON.parse((envoi[1] as RequestInit).body as string)).toEqual({ heures: 1, motif: "Problème de clôture" });
    expect(screen.getByText("Clôtures et événements")).toBeTruthy();
  });

  it("retirer : l'autorisation passe dans l'historique, avec qui l'a retirée", async () => {
    etat = { active, historique: [active] };
    monter();
    fireEvent.click(await screen.findByRole("button", { name: /Retirer l'autorisation maintenant/ }));
    await waitFor(() => expect(screen.getByText("Autoriser le support")).toBeTruthy());
    expect(screen.getByText(/retirée .* par Directeur Essai/)).toBeTruthy();
  });
});
