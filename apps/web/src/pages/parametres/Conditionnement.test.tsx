/**
 * Conditionnement (dossier §15.155) — test de l'écran : emballage ajouté au millième d'euro (idée d'un clic, prix
 * illisible bloqué), emballages d'un produit ajoutés, comptés et retirés, coût de revient affiché.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Emballage, Produit } from "@flaix/domain";
import { ConditionnementProduit, GestionEmballages } from "./Conditionnement.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const EMBALLAGES: Emballage[] = [
  { id: "gob", nom: "Gobelet 50 cl", prixMillimes: 120, produits: 1, seuil: 200, stock: { estime: 148, dernierComptage: { quantite: 100, le: "2026-10-11T12:00:00Z" }, livreDepuis: 50, consommeDepuis: 2, parMatch: 50 } },
  { id: "ser", nom: "Serviette", prixMillimes: 8, produits: 0, seuil: null, stock: null },
];
const BIERE = {
  id: "biere",
  nom: "Bière",
  coutMatiere: 120,
  emballages: [{ emballageId: "gob", nom: "Gobelet 50 cl", quantite: 1, prixMillimes: 120 }],
  conditionnementMillimes: 120,
} as unknown as Produit;
let serveur: ReturnType<typeof vi.fn>;
const envois = (url: string) => serveur.mock.calls.filter(([u, i]) => u === url && (i as RequestInit | undefined)?.method && (i as RequestInit).method !== "GET").map(([, i]) => JSON.parse((i as RequestInit).body as string));

beforeEach(() => {
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/emballages") return reponse(200, init?.method === "POST" ? [...EMBALLAGES, { id: "pai", nom: "Paille", prixMillimes: 15, produits: 0, seuil: null, stock: null }] : EMBALLAGES);
    if (url.startsWith("/api/emballages/")) return reponse(200, EMBALLAGES);
    if (url === "/api/produits/biere/emballages") return reponse(200, [BIERE]);
    return reponse(404, { erreur: "Inconnu" });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter(enfant: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{enfant}</QueryClientProvider>);
}

describe("conditionnement à l'écran", () => {
  it("emballage ajouté au millième d'euro ; idée d'un clic ; prix illisible bloqué", async () => {
    monter(<GestionEmballages />);
    expect(((await screen.findByLabelText("Prix : Serviette")) as HTMLInputElement).value).toBe("0,008");
    fireEvent.click(screen.getByRole("button", { name: "Paille" }));
    expect((screen.getByPlaceholderText("Ex. : gobelet 50 cl") as HTMLInputElement).value).toBe("Paille");
    const prix = screen.getByPlaceholderText("ex. 0,12");
    fireEvent.change(prix, { target: { value: "deux" } });
    expect((screen.getByRole("button", { name: /Ajouter/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(prix, { target: { value: "0,015" } });
    fireEvent.click(screen.getByRole("button", { name: /Ajouter/ }));
    await waitFor(() => expect(envois("/api/emballages")).toEqual([{ nom: "Paille", prixMillimes: 15 }]));
  });

  it("stock (§15.158) : estimé, matchs couverts, stock bas ; livraison envoyée ; suivi démarré par un comptage", async () => {
    monter(<GestionEmballages />);
    expect(await screen.findByText("148")).toBeTruthy();
    expect(screen.getByText(/≈ 2 matchs/)).toBeTruthy();
    expect(screen.getByText("stock bas")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Livraison : Gobelet 50 cl"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Livraison reçue" }));
    await waitFor(() => expect(envois("/api/emballages/gob/livraison")).toEqual([{ quantite: 500 }]));
    fireEvent.click(screen.getByRole("button", { name: "Suivre le stock" }));
    fireEvent.change(screen.getByLabelText("Combien de Serviette as-tu ?"), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Démarrer le suivi" }));
    await waitFor(() => expect(envois("/api/emballages/ser/comptage")).toEqual([{ quantite: 2000 }]));
  });

  it("emballages d'une bière : coût de revient, ajout, quantité, retrait", async () => {
    monter(<ConditionnementProduit produit={BIERE} majProduits={() => undefined} />);
    expect(await screen.findByText(/0,12\s€/, { selector: "strong" })).toBeTruthy();
    // 1,20 € de matière + 0,12 € de gobelet.
    expect(screen.getByText(/coût de revient 1,32\s€/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Emballage à ajouter"), { target: { value: "ser" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    const libre = async (n: number) => {
      await waitFor(() => expect(envois("/api/produits/biere/emballages")).toHaveLength(n));
      await waitFor(() => expect((screen.getByRole("button", { name: "Retirer Gobelet 50 cl" }) as HTMLButtonElement).disabled).toBe(false));
    };
    await libre(1);
    fireEvent.change(screen.getByLabelText("Quantité : Gobelet 50 cl"), { target: { value: "2" } });
    await libre(2);
    fireEvent.click(screen.getByRole("button", { name: "Retirer Gobelet 50 cl" }));
    await waitFor(() => expect(envois("/api/produits/biere/emballages")).toHaveLength(3));
    expect(envois("/api/produits/biere/emballages")).toEqual([
      { emballages: [{ emballageId: "gob", quantite: 1 }, { emballageId: "ser", quantite: 1 }] },
      { emballages: [{ emballageId: "gob", quantite: 2 }] },
      { emballages: [] },
    ]);
  });
});
