/**
 * Remise à zéro du stock et suppression d'un événement à venir (dossier §15.165) — tests des écrans : motif exigé,
 * requête envoyée, résultat expliqué ; suppression confirmée d'un événement à venir, aucune pour un événement clos. Le
 * serveur est simulé.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { Evenement } from "@flaix/domain";
import { RemiseAZero } from "./RemiseAZero.tsx";
import { Saison } from "../parametres/Saison.tsx";

const reponse = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "content-type": "application/json" } });
const monter = (enfant: React.ReactNode) =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>{enfant}</QueryClientProvider>
    </MemoryRouter>,
  );
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("remettre le stock à zéro", () => {
  it("motif exigé (5 caractères), puis remise envoyée et résultat expliqué", async () => {
    const serveur = vi.fn(async () => reponse({ le: "2026-10-17T10:00:00.000Z", produits: 3, ingredients: 1 }));
    vi.stubGlobal("fetch", serveur);
    monter(<RemiseAZero fermer={() => undefined} />);
    const bouton = screen.getByRole("button", { name: /Remettre à zéro/ }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "abc" } });
    expect(bouton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Motif/), { target: { value: "Essais du 23 septembre" } });
    fireEvent.click(bouton);
    expect(await screen.findByText("Stock remis à zéro")).toBeTruthy();
    expect(screen.getByText(/la réserve est à 0 \(3 produits, 1 ingrédient\)/)).toBeTruthy();
    const [url, init] = serveur.mock.calls[0]! as unknown as [string, RequestInit];
    expect(url).toBe("/api/stock/remise-a-zero");
    expect(JSON.parse(init.body as string)).toEqual({ motif: "Essais du 23 septembre" });
  });
});

describe("supprimer un événement", () => {
  const evt = (x: Partial<Evenement>) => ({ id: "x", libelle: "Match", debut: "2026-10-23T18:00:00.000Z", spectateurs: null, etat: "a_venir", ouvertLe: null, closLe: null, caissesOuvertes: 0, ...x }) as Evenement;
  const essai = evt({ id: "e", libelle: "Essai du 23" });
  const clos = evt({ id: "c", libelle: "Match d'ouverture", etat: "clos", closLe: "2026-09-23T23:00:00.000Z" });

  it("à venir : confirmation puis suppression ; clos : pas de bouton", async () => {
    const serveur = vi.fn(async (_url: string, init?: RequestInit) => reponse(init?.method === "DELETE" ? [clos] : [essai, clos]));
    vi.stubGlobal("fetch", serveur);
    monter(<Saison />);
    expect(await screen.findByText("Essai du 23")).toBeTruthy();
    expect(screen.queryByLabelText("Supprimer Match d'ouverture")).toBeNull();
    fireEvent.click(screen.getByLabelText("Supprimer Essai du 23"));
    expect(screen.getByText("Supprimer « Essai du 23 » ?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(screen.queryByText("Essai du 23")).toBeNull());
    expect(serveur.mock.calls.find(([, i]) => i?.method === "DELETE")![0]).toBe("/api/evenements/e");
  });

  it("refus du serveur affiché tel quel", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => (init?.method === "DELETE" ? reponse({ erreur: "« Essai du 23 » est ouvert : il ne se supprime pas." }, 409) : reponse([essai]))));
    monter(<Saison />);
    fireEvent.click(await screen.findByLabelText("Supprimer Essai du 23"));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(await screen.findByText("« Essai du 23 » est ouvert : il ne se supprime pas.")).toBeTruthy();
  });
});
