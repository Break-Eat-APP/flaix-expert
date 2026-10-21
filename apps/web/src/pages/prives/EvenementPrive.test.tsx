/**
 * Événement privé (dossier §15.160) — test de l'écran : jauge du budget, quantité changée d'un clic, produit ajouté,
 * personnel calculé, clôture confirmée ; après clôture, règlement et facture.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { bilanPrive, type EvenementPrive as Donnees, type LignePrivee, type Produit } from "@flaix/domain";
import { EvenementPrive } from "./EvenementPrive.tsx";

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const BIERE: LignePrivee = { id: "l1", produitId: "biere", libelle: "Bière", quantite: 30, prixTtc: 700, tauxTva: 2000, coutUnitaire: 120 };
const evenement = (etat: "prevu" | "cloture"): Donnees => ({
  id: "e1",
  nom: "Bar clandestin",
  debut: "2026-10-17T19:00:00.000Z",
  salon: "Salon VIP",
  invites: 15,
  budget: 24_000,
  client: { nom: "Paul", contact: null, societe: null, adresse: null, siret: null, tvaIntracom: null },
  notes: null,
  etat,
  clotureLe: etat === "cloture" ? "2026-10-17T23:30:00.000Z" : null,
  cloturePar: null,
  reglement: null,
  lignes: [BIERE],
  frais: [],
  bilan: bilanPrive([BIERE], [], 24_000),
  facture: null,
  // Stock de l'événement (§15.170) : liste de préparation avant la clôture, sorti après.
  sortieStock: [{ nom: "Bière", quantite: "30 ×", valeur: 3_600 }, { nom: "Fût blonde", quantite: "15 L", valeur: null }],
});
let etat: "prevu" | "cloture";
let serveur: ReturnType<typeof vi.fn>;
const envois = (url: string, methode: string) =>
  serveur.mock.calls.filter(([u, i]) => u === url && (i as RequestInit | undefined)?.method === methode).map(([, i]) => JSON.parse((i as RequestInit).body as string));

beforeEach(() => {
  etat = "prevu";
  serveur = vi.fn(async (url: string) => {
    if (url === "/api/produits") return reponse([{ id: "biere", nom: "Bière", actif: true, tarifEnVigueur: { prixTtc: 700 } }, { id: "hd", nom: "Hot-dog", actif: true, tarifEnVigueur: { prixTtc: 600 } }] as unknown as Produit[]);
    return reponse(evenement(etat));
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
      <MemoryRouter initialEntries={["/prives/e1"]}>
        <Routes>
          <Route path="/prives/:id" element={<EvenementPrive />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("événement privé à l'écran", () => {
  it("jauge du budget ; +1 bière ; produit ajouté ; personnel calculé ; clôture confirmée", async () => {
    monter();
    // 210 € consommés sur 240 € : 87,5 %, attention.
    expect(await screen.findByText(/87,5 % · reste 30,00\s€/)).toBeTruthy();
    expect(screen.getByText("À sortir de la réserve centrale")).toBeTruthy();
    expect(screen.getByText(/36,00\s€ \(hors coûts manquants\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Un Bière de plus" }));
    await waitFor(() => expect(envois("/api/evenements-prives/e1/lignes/l1", "PATCH")).toEqual([{ quantite: 31 }]));
    fireEvent.change(await screen.findByLabelText("Produit"), { target: { value: "hd" } });
    fireEvent.change(screen.getByLabelText("Quantité"), { target: { value: "4" } });
    // Le premier « Ajouter » est celui des consommations.
    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]!);
    await waitFor(() => expect(envois("/api/evenements-prives/e1/lignes", "POST")).toEqual([{ produitId: "hd", quantite: 4 }]));
    fireEvent.change(screen.getByLabelText("Personnes"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Heures"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Taux horaire chargé"), { target: { value: "18" } });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter 180,00/ }));
    await waitFor(() => expect(envois("/api/evenements-prives/e1/frais", "POST")).toEqual([{ libelle: "Personnel (2 × 5 h)", montant: 18_000 }]));
    fireEvent.click(screen.getByRole("button", { name: "Clôturer l'événement" }));
    fireEvent.click(screen.getByRole("button", { name: "Oui, clôturer" }));
    await waitFor(() => expect(envois("/api/evenements-prives/e1/cloture", "POST")).toHaveLength(1));
  });

  it("clôturé : plus de saisie ; règlement noté ; facture émise", async () => {
    etat = "cloture";
    monter();
    fireEvent.click(await screen.findByRole("button", { name: "Noter le règlement" }));
    expect(screen.getByText("Sorti de la réserve centrale")).toBeTruthy();
    await waitFor(() => expect(envois("/api/evenements-prives/e1/reglement", "PUT")[0]).toMatchObject({ mode: "virement" }));
    expect(screen.queryByRole("button", { name: "Un Bière de plus" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Émettre la facture/ }));
    await waitFor(() => expect(envois("/api/evenements-prives/e1/facture", "POST")).toHaveLength(1));
  });
});
