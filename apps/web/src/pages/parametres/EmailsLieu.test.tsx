/**
 * E-mails du lieu (dossier §15.146) — test de l'écran : sans Brevo réglé, l'écran le dit et l'essai est
 * impossible ; une adresse ajoutée part au serveur en minuscules ; une adresse mal formée bloque l'enregistrement.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { EtatEmails } from "@flaix/domain";
import { EmailsLieu } from "./EmailsLieu.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
let etat: EtatEmails;
let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  etat = { service: false, expediteur: null, reglages: { rapport: true, rectification: true, supplementaires: [] }, directeurs: [{ nom: "Directeur Essai", email: "directeur@lieu.fr" }], derniers: [] };
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/emails/reglages" && init?.method === "PUT") {
      etat = { ...etat, reglages: JSON.parse(init.body as string) };
      return reponse(200, etat);
    }
    if (url === "/api/emails") return reponse(200, etat);
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
        <EmailsLieu />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("e-mails du lieu", () => {
  it("Brevo pas encore réglé : l'écran le dit, l'essai est impossible ; le directeur est destinataire", async () => {
    monter();
    expect(await screen.findByText(/n'est pas encore réglé sur le serveur/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /e-mail d'essai/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Directeur Essai <directeur@lieu.fr>/)).toBeTruthy();
  });

  it("une adresse ajoutée part en minuscules ; une adresse mal formée bloque l'enregistrement", async () => {
    monter();
    const champ = await screen.findByPlaceholderText("cabinet@exemple.fr");
    fireEvent.change(champ, { target: { value: "pas-une-adresse" } });
    expect(screen.getByText("Adresse à vérifier")).toBeTruthy();
    fireEvent.change(champ, { target: { value: "Expert@Cabinet.fr" } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer les adresses/ }));
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => u === "/api/emails/reglages" && (i as RequestInit | undefined)?.method === "PUT")).toBe(true));
    const envoi = serveur.mock.calls.find(([u, i]) => u === "/api/emails/reglages" && (i as RequestInit | undefined)?.method === "PUT")!;
    expect(JSON.parse((envoi[1] as RequestInit).body as string)).toEqual({ rapport: true, rectification: true, supplementaires: ["expert@cabinet.fr"] });
  });
});
