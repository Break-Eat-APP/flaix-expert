/**
 * Les chiffres de la soirée à l'écran (§15.171) : conversion, articles par ticket, moment le plus fort, personnel,
 * pertes de stock, ventes manquées, abonnés, boissons / nourriture ; Click & Collect, ou comment le recevoir.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { chiffresSoiree, type EntreeChiffresSoiree, type Resultats } from "@flaix/domain";
import { ChiffresSoiree } from "./ChiffresSoiree.tsx";

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const entree: EntreeChiffresSoiree = {
  caTtc: 1_000_000,
  caHt: 850_000,
  tickets: 800,
  spectateurs: 4_000,
  produits: [
    { quantite: 1_200, caTtc: 700_000, caHt: 590_000, marge: 450_000, famille: "boisson" },
    { quantite: 500, caTtc: 300_000, caHt: 260_000, marge: 150_000, famille: "nourriture" },
  ],
  quarts: [{ debut: "20:45", ca: 250_000 }],
  minutes: [{ debut: "20:47", ca: 30_000 }],
  personnel: { minutes: 1_200, cout: 85_000 },
  caisse: { tickets: 700, ca: 820_000 },
  abonnes: { tickets: 70, ca: 105_000 },
  clickCollect: { commandes: 100, ca: 180_000 },
};
const resultats = (cc: boolean) =>
  ({ evenement: { id: "rouen" }, periode: null, actuel: { tickets: 800, spectateurs: 4_000, chiffres: chiffresSoiree({ ...entree, clickCollect: cc ? entree.clickCollect : null }) } }) as unknown as Resultats;

function monter(d: Resultats) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("/api/finances")) return reponse({ ecartStock: -8_500, caHt: 850_000 });
      return reponse({ analyse: { perdu: [{ famille: "rupture", bas: 12_000, haut: 18_000 }] } });
    }),
  );
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <ChiffresSoiree d={d} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("les chiffres de la soirée à l'écran", () => {
  it("chaque chiffre avec son explication ; pertes et ruptures lues dans Finances et « Où je perds »", async () => {
    monter(resultats(true));
    expect(screen.getByText("Spectateurs qui achètent").parentElement!.textContent).toContain("20 %");
    expect(screen.getByText("Articles par ticket").parentElement!.textContent).toContain("2,1");
    expect(screen.getByText("Le moment le plus fort").parentElement!.textContent).toContain("20 h 45 – 21 h 00");
    expect(screen.getByText("Boissons / nourriture").parentElement!.textContent).toContain("Boissons : 70 % du CA, 75 % de la marge");
    expect((await screen.findByText(/manquants au comptage/)).parentElement!.textContent).toContain("1 %");
    expect((await screen.findByText(/1 rupture chiffrée/)).parentElement!.textContent).toMatch(/120,00\s€ à 180,00\s€/);
    expect(screen.getByText("Panier Click & Collect").parentElement!.textContent).toMatch(/18,00\s€contre 11,71\s€ au comptoir/);
  });

  it("sans vente Click & Collect : comment la recevoir", () => {
    monter(resultats(false));
    expect(screen.getByText(/Aucune vente Click & Collect reçue/)).toBeTruthy();
  });
});
