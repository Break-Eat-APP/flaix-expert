/**
 * Centre d'alertes (module 18 ; dossier §15.140) — test de l'écran : en direct à part, alertes lues et
 * calculées avec leur impact, mercuriale saisie ligne par ligne. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { SEUILS_ALERTES, formaterMontant, type CentreAlertes as Centre } from "@flaix/domain";
import { CentreAlertes } from "./CentreAlertes.tsx";

const texte = (t: string) => t.replace(/\s+/g, " ");
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

const centre: Centre = {
  evenementEnCours: { id: "rouen", libelle: "Rouen" },
  dernierEvenement: { id: "gap", libelle: "Gap", debut: "2026-09-27T18:00:00Z" },
  alertes: [
    { id: "rupture:n:frites", type: "rupture", source: "en_direct", niveau: "forte", titre: "Rupture : Frites à Buvette Nord", detail: "Reste 0 sur 120.", impact: null, lien: "/direct" },
    { id: "variation_fournisseur:p:biere", type: "variation_fournisseur", source: "calculee", niveau: "forte", titre: "Hausse du prix de Bière chez Brasserie du Port : +5,6 %", detail: "…", impact: 2_100, lien: "/stock" },
  ],
  mercuriale: [{ cle: "p:frites", type: "produit", id: "frites", nom: "Frites", unite: null, coutActuel: 120, reference: null, ecartPb: null, saisiPar: null, saisiLe: null }],
  reglages: { rupture: true, faible: true },
  seuils: SEUILS_ALERTES,
};

let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/alertes") return reponse(200, centre);
    if (url === "/api/alertes/mercuriale" && init?.method === "PUT") {
      const d = JSON.parse(init.body as string);
      return reponse(200, { ...centre, mercuriale: [{ ...centre.mercuriale[0], reference: d.prix, ecartPb: 2_000, saisiPar: "Directeur", saisiLe: "2026-10-05T08:00:00Z" }] });
    }
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
        <CentreAlertes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("centre d'alertes", () => {
  it("la rupture est « en ce moment », la hausse fournisseur « à regarder », avec son impact", async () => {
    monter();
    expect(await screen.findByText("En ce moment : Rouen")).toBeTruthy();
    expect(screen.getByText("Rupture : Frites à Buvette Nord")).toBeTruthy();
    expect(screen.getByText("Hausse du prix de Bière chez Brasserie du Port : +5,6 %")).toBeTruthy();
    expect(screen.getByText(texte(formaterMontant(2_100)))).toBeTruthy();
    expect(screen.getByText(/2 alertes, dont 2 fortes/)).toBeTruthy();
  });

  it("mercuriale : un prix de référence saisi part au serveur en centimes, l'écart s'affiche", async () => {
    monter();
    const champ = await screen.findByLabelText("Prix de référence de Frites");
    fireEvent.change(champ, { target: { value: "1,00" } });
    fireEvent.blur(champ);
    await waitFor(() => expect(screen.getByText("+20,0 %")).toBeTruthy());
    const envoi = serveur.mock.calls.find(([u, i]) => u === "/api/alertes/mercuriale" && (i as RequestInit | undefined)?.method === "PUT")!;
    expect(JSON.parse((envoi[1] as RequestInit).body as string)).toEqual({ produitId: "frites", prix: 100 });
  });
});
