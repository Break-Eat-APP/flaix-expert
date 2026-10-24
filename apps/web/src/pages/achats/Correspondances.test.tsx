/**
 * Achats › Correspondances à l'écran (§15.174) : les articles appris, par fournisseur ; produit et colis corrigés,
 * article retiré.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { Correspondances } from "./Correspondances.tsx";

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const APPRIS = [
  { fournisseur: "metro", cle: "code:coc33", libelle: "Coca 33cl x24", produitId: "coca", unitesParColis: 24 },
  { fournisseur: "metro", cle: "lib:frais de port", libelle: "Frais de port", produitId: null, unitesParColis: 1 },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("correspondances fournisseurs à l'écran", () => {
  it("par fournisseur ; colis corrigé ; article retiré", async () => {
    const serveur = vi.fn(async (url: string) => (url === "/api/produits" ? reponse([{ id: "coca", nom: "Coca 33 cl", actif: true }]) : reponse(APPRIS)));
    vi.stubGlobal("fetch", serveur);
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <Correspondances />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText("METRO")).toBeTruthy();
    expect(screen.getByText("COC33")).toBeTruthy();
    const colis = screen.getByLabelText("Unités par colis de Coca 33cl x24") as HTMLInputElement;
    fireEvent.change(colis, { target: { value: "12" } });
    fireEvent.blur(colis);
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => u === "/api/factures/correspondances" && i?.method === "PUT")).toBe(true));
    const [, init] = serveur.mock.calls.find(([u, i]) => u === "/api/factures/correspondances" && i?.method === "PUT")!;
    expect(JSON.parse(init!.body as string)).toMatchObject({ fournisseur: "metro", cle: "code:coc33", produitId: "coca", unitesParColis: 12 });
    fireEvent.click(screen.getByLabelText("Retirer Frais de port"));
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => String(u).startsWith("/api/factures/correspondances?") && i?.method === "DELETE")).toBe(true));
  });
});
