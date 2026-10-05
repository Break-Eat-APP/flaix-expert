/**
 * Design de la carte abonné (dossier §15.148) — test de l'écran : l'aperçu suit la saisie avant l'enregistrement ;
 * un lien non https bloque l'enregistrement ; le design part au serveur ; une image choisie est préparée puis
 * envoyée à tous les formats ; une image se retire.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DESIGN_CARTE_DEFAUT, type EtatWallet } from "@flaix/domain";
import { EditeurDesignCarte } from "./DesignCarte.tsx";

// Le retaillage se fait avec le canevas du navigateur, absent des tests : il est remplacé.
vi.mock("./imagesCarte.ts", () => ({
  TYPES_ACCEPTES: "image/png,image/jpeg",
  preparerImages: vi.fn(async () => ({ variantes: { strip: "AAA", "strip@2x": "BBB", "strip@3x": "CCC", "google-hero": "DDD" }, petite: true })),
}));

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
let etat: EtatWallet;
let serveur: ReturnType<typeof vi.fn>;
const envois = (url: string, methode: string) => serveur.mock.calls.filter(([u, i]) => u === url && (i as RequestInit | undefined)?.method === methode);

beforeEach(() => {
  etat = {
    apple: true,
    google: false,
    lieu: "Les Spartiates",
    couleur: "#c8102e",
    design: DESIGN_CARTE_DEFAUT,
    images: { logo: null, banniere: null },
    regles: { pointsParEuro: 1, palierPoints: 100, valeurPalier: 500 },
    remisePb: 1000,
    cartes: 12,
  };
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/wallet/design" && init?.method === "PUT") {
      etat = { ...etat, ...JSON.parse(init.body as string) };
      return reponse(200, etat);
    }
    if (url === "/api/wallet/images/banniere" && init?.method === "PUT") {
      etat = { ...etat, images: { ...etat.images, banniere: { apple: "/api/wallet/image/strip@3x?v=1", google: "/api/wallet/image/google-hero?v=1" } } };
      return reponse(200, etat);
    }
    if (url === "/api/wallet/images/banniere" && init?.method === "DELETE") {
      etat = { ...etat, images: { ...etat.images, banniere: null } };
      return reponse(200, etat);
    }
    if (url === "/api/wallet") return reponse(200, etat);
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
      <EditeurDesignCarte />
    </QueryClientProvider>,
  );
}

describe("design de la carte abonné", () => {
  it("l'aperçu suit la saisie : nom du programme, nom des points, remise, réduction ; Android aussi", async () => {
    monter();
    expect(await screen.findByText("Carte abonné")).toBeTruthy();
    // 240 points d'exemple, palier de 100 à 5,00 € : 10,00 € de réduction ; remise 10 %.
    expect(screen.getByText("10 %")).toBeTruthy();
    expect(screen.getByText(/10,00/)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Carte abonné"), { target: { value: "Carte Supporter" } });
    fireEvent.change(screen.getByPlaceholderText("Points"), { target: { value: "Spartapoints" } });
    expect(screen.getByText("Carte Supporter")).toBeTruthy();
    expect(screen.getByText("Spartapoints")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Remise abonné/));
    expect(screen.queryByText("10 %")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Android" }));
    expect(screen.getByLabelText("Aperçu Google Wallet")).toBeTruthy();
    expect(screen.getByText(/pas encore enregistrés/)).toBeTruthy();
  });

  it("un lien non https bloque l'enregistrement ; corrigé, le design part au serveur", async () => {
    monter();
    // Deux champs attendent un lien https : le site du club (le premier) et l'application.
    const site = (await screen.findAllByPlaceholderText("https://…"))[0]!;
    fireEvent.change(site, { target: { value: "http://spartiates.fr" } });
    expect(screen.getByText("Le lien doit commencer par https://")).toBeTruthy();
    const bouton = screen.getByRole("button", { name: "Enregistrer le design" }) as HTMLButtonElement;
    expect(bouton.disabled).toBe(true);
    fireEvent.change(site, { target: { value: "https://spartiates.fr" } });
    fireEvent.change(screen.getByPlaceholderText(/une boisson offerte/), { target: { value: "Une boisson offerte le jour de ton anniversaire." } });
    expect(bouton.disabled).toBe(false);
    fireEvent.click(bouton);
    await waitFor(() => expect(envois("/api/wallet/design", "PUT")).toHaveLength(1));
    const corps = JSON.parse((envois("/api/wallet/design", "PUT")[0]![1] as RequestInit).body as string);
    expect(corps).toEqual({ couleur: "#c8102e", design: { ...DESIGN_CARTE_DEFAUT, siteWeb: "https://spartiates.fr", message: "Une boisson offerte le jour de ton anniversaire." } });
    expect(await screen.findByText(/les 12 cartes déjà distribuées se mettent à jour/)).toBeTruthy();
  });

  it("bannière : l'image choisie est préparée puis envoyée à tous les formats ; petite image signalée ; retrait", async () => {
    monter();
    const champ = (await screen.findByLabelText("Choisir bannière")) as HTMLInputElement;
    fireEvent.change(champ, { target: { files: [new File(["x"], "stade.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByText(/Elle est petite/)).toBeTruthy();
    const envoi = JSON.parse((envois("/api/wallet/images/banniere", "PUT")[0]![1] as RequestInit).body as string);
    expect(Object.keys(envoi.variantes)).toEqual(["strip", "strip@2x", "strip@3x", "google-hero"]);
    expect(screen.getByAltText("Bannière actuel")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Retirer/ }));
    expect(await screen.findByText("Image retirée.")).toBeTruthy();
    expect(envois("/api/wallet/images/banniere", "DELETE")).toHaveLength(1);
  });
});
