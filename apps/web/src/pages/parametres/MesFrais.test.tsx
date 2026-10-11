/**
 * Mes frais (dossier §15.154) — test de l'écran : avancement, frais de soirée ajouté avec son montant habituel (en
 * points de base), « pas concerné », frais du mois ajouté en centimes à partir du mois en cours, loyer saisi stand par
 * stand quand Coûts par buvette est activé, montant illisible jamais envoyé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { OPTIONS_PAR_DEFAUT, type LigneMesFrais, type MesFrais as Donnees } from "@flaix/domain";
import { MesFrais } from "./MesFrais.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const vide = { posteId: null, fraisId: null, modeHabituel: null, valeurHabituelle: null, montantMois: null, parStand: null, modeSuggere: null, aide: null };
const DONNEES: Donnees = {
  mois: "2026-10",
  verifies: 1,
  proposes: 3,
  totalMois: 20_000,
  lignes: [
    { ...vide, cle: "commission_club", libelle: "Commission du club ou du stade", frequence: "soiree", statut: "a_verifier", modeSuggere: "pourcent" },
    { ...vide, cle: "assurance", libelle: "Assurance", frequence: "mois", statut: "a_verifier" },
    { ...vide, cle: "loyer", libelle: "Loyer ou redevance des stands", frequence: "mois", statut: "renseigne", parStand: "loyer", montantMois: 20_000 },
  ] satisfies LigneMesFrais[],
};
let serveur: ReturnType<typeof vi.fn>;
const corpsDe = (url: string) => JSON.parse((serveur.mock.calls.find(([u]) => u === url)![1] as RequestInit).body as string);

beforeEach(() => {
  serveur = vi.fn(async (url: string) => {
    if (url === "/api/lieu/options") return reponse(200, OPTIONS_PAR_DEFAUT);
    if (url.startsWith("/api/mes-frais")) return reponse(200, DONNEES);
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
        <MesFrais />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("mes frais à l'écran", () => {
  it("avancement ; frais de soirée ajouté avec 10 % du CA HT ; « pas concerné »", async () => {
    monter();
    expect(await screen.findByText("1 frais vérifiés sur 3")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Montant habituel : Commission du club ou du stade"), { target: { value: "10" } });
    expect((screen.getByLabelText("Unité : Commission du club ou du stade") as HTMLSelectElement).value).toBe("pourcent");
    fireEvent.click(screen.getAllByRole("button", { name: "J'ai ce frais" })[0]!);
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/mes-frais/soiree")).toBe(true));
    expect(corpsDe("/api/mes-frais/soiree")).toEqual({ cle: "commission_club", modeHabituel: "pourcent", valeurHabituelle: 1_000 });
    fireEvent.click(screen.getAllByRole("button", { name: "Pas concerné" })[1]!);
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/mes-frais/pas-concerne/assurance")).toBe(true));
    expect(corpsDe("/api/mes-frais/pas-concerne/assurance")).toEqual({ pasConcerne: true });
  });

  it("frais du mois ajouté en centimes à partir du mois en cours ; loyer saisi stand par stand ; montant illisible bloqué", async () => {
    monter();
    const champ = await screen.findByLabelText("Montant par mois : Assurance");
    fireEvent.change(champ, { target: { value: "douze" } });
    const boutons = screen.getAllByRole("button", { name: "J'ai ce frais" });
    expect((boutons[1] as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(champ, { target: { value: "40,50" } });
    fireEvent.click(boutons[1]!);
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/mes-frais/mois")).toBe(true));
    expect(corpsDe("/api/mes-frais/mois")).toEqual({ cle: "assurance", montant: 4_050, aPartirDe: "2026-10" });
    expect(screen.getByRole("link", { name: "Stand par stand" }).getAttribute("href")).toBe("/parametres/couts");
    expect(screen.getByText(/200,00\s€ par mois/)).toBeTruthy();
  });
});
