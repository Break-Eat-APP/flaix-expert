/**
 * Allergènes (dossier §15.157) — test de l'écran : case cochée envoyée aussitôt, tableau à afficher avec ses
 * marques et l'avertissement des produits sans allergène déclaré.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Produit } from "@flaix/domain";
import { AllergenesProduit, TableauAllergenes } from "./Allergenes.tsx";

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const BURGER = { id: "b", nom: "Burger", actif: true, allergenes: ["gluten"] } as unknown as Produit;
const EAU = { id: "e", nom: "Eau", actif: true, allergenes: [] } as unknown as Produit;
let serveur: ReturnType<typeof vi.fn>;

beforeEach(() => {
  serveur = vi.fn(async () => reponse([BURGER]));
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const monter = (enfant: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{enfant}</QueryClientProvider>);

describe("allergènes à l'écran", () => {
  it("cocher « Lait » envoie la liste complète", async () => {
    monter(<AllergenesProduit produit={BURGER} majProduits={() => undefined} />);
    expect((screen.getByLabelText("Gluten") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText("Lait"));
    await waitFor(() => expect(serveur).toHaveBeenCalled());
    const [url, init] = serveur.mock.calls[0]!;
    expect(url).toBe("/api/produits/b/allergenes");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ allergenes: ["gluten", "lait"] });
  });

  it("tableau : marques par produit, avertissement pour un produit sans allergène déclaré", () => {
    monter(<TableauAllergenes produits={[EAU, BURGER]} />);
    expect(screen.getByLabelText("Burger : Gluten oui").textContent).toBe("●");
    expect(screen.getByLabelText("Eau : Gluten non").textContent).toBe("");
    expect(screen.getByText(/1 produit sans aucun allergène déclaré/)).toBeTruthy();
  });
});
