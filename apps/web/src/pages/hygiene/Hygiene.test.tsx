/**
 * Hygiène et HACCP (dossier §15.156) — test de l'écran : relevé hors limite qui exige son action corrective avant de
 * partir, tâche faite, contrôle à réception conforme, registre avec la non-conformité en évidence.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Hygiene as Donnees, RegistreHygiene } from "@flaix/domain";
import { Hygiene } from "./Hygiene.tsx";

// La réduction de la photo passe par le canevas du navigateur, absent des tests.
vi.mock("./photo.ts", () => ({ preparerPhoto: async () => "UEhPVE8=" }));

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const DONNEES: Donnees = {
  jour: "2026-10-11",
  evenement: { id: "ev", libelle: "Rouen" },
  equipements: [
    { id: "frigo", nom: "Frigo bar", standId: null, sorte: "froid", minDixiemes: null, maxDixiemes: null, actif: true },
    { id: "frit", nom: "Friteuse", standId: null, sorte: "friteuse", minDixiemes: null, maxDixiemes: null, actif: true },
  ],
  taches: [{ id: "t1", nom: "Nettoyer la tireuse", standId: null, moment: "fermeture", actif: true }],
  relevesDuJour: [],
  tachesFaites: [],
  receptions: [],
  huiles: [],
  nonConformes7j: 0,
};
const REGISTRE: RegistreHygiene = {
  du: "2026-10-01",
  au: "2026-10-11",
  lieu: "Stade",
  releves: [{ id: "r", equipementId: "frigo", equipement: "Frigo bar", moment: "fermeture", temperatureDixiemes: 72, conforme: false, actionCorrective: "Produits jetés", par: "Rémi", le: "2026-10-05T21:00:00Z" }],
  taches: [],
  receptions: [],
  huiles: [],
};
let serveur: ReturnType<typeof vi.fn>;
const envois = (url: string) => serveur.mock.calls.filter(([u, i]) => u === url && (i as RequestInit | undefined)?.method === "POST").map(([, i]) => JSON.parse((i as RequestInit).body as string));

beforeEach(() => {
  serveur = vi.fn(async (url: string) => {
    if (url.startsWith("/api/hygiene/registre")) return reponse(200, REGISTRE);
    if (url.startsWith("/api/hygiene")) return reponse(200, DONNEES);
    if (url === "/api/stands") return reponse(200, []);
    return reponse(404, { erreur: "Inconnu" });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter(equipe = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Hygiene equipe={equipe} />
    </QueryClientProvider>,
  );
}

describe("hygiène à l'écran", () => {
  it("sur la tablette d'une caisse (§15.159) : journée, réceptions et huile, sans réglages ni registre ; photo de l'étiquette envoyée", async () => {
    monter(true);
    fireEvent.click(await screen.findByRole("button", { name: "Réceptions" }));
    expect(screen.queryByRole("button", { name: "Registre" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Réglages" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Fournisseur"), { target: { value: "Metro" } });
    fireEvent.change(screen.getByLabelText("Produits reçus"), { target: { value: "Pain" } });
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "sec" } });
    fireEvent.change(screen.getByLabelText("Photo de l'étiquette"), { target: { files: [new File(["x"], "etiquette.jpg", { type: "image/jpeg" })] } });
    expect(await screen.findByAltText("Étiquette photographiée")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le contrôle" }));
    await waitFor(() => expect(envois("/api/hygiene/receptions")[0]).toMatchObject({ type: "sec", temperatureDixiemes: null, photo: "UEhPVE8=" }));
  });


  it("relevé hors limite : l'action corrective est exigée avant l'envoi ; tâche faite", async () => {
    monter();
    expect(await screen.findByText(/Match en cours/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Ouverture : Frigo bar (°C)"), { target: { value: "7,2" } });
    const action = screen.getByLabelText("Action corrective : Frigo bar");
    const relever = screen.getAllByRole("button", { name: "Relever" })[0] as HTMLButtonElement;
    expect(relever.disabled).toBe(true);
    fireEvent.change(action, { target: { value: "Produits jetés" } });
    fireEvent.click(relever);
    await waitFor(() => expect(envois("/api/hygiene/releves")).toEqual([{ equipementId: "frigo", moment: "ouverture", temperatureDixiemes: 72, actionCorrective: "Produits jetés" }]));
    fireEvent.click(screen.getByRole("button", { name: "Fait" }));
    await waitFor(() => expect(envois("/api/hygiene/taches/t1/fait")).toHaveLength(1));
  });

  it("contrôle à réception conforme ; registre avec la non-conformité", async () => {
    monter();
    fireEvent.click(await screen.findByRole("button", { name: "Réceptions" }));
    fireEvent.change(screen.getByLabelText("Fournisseur"), { target: { value: "Metro" } });
    fireEvent.change(screen.getByLabelText("Produits reçus"), { target: { value: "Saucisses" } });
    fireEvent.change(screen.getByLabelText("Température relevée (°C)"), { target: { value: "3" } });
    expect(screen.getByText("conforme")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le contrôle" }));
    await waitFor(() =>
      expect(envois("/api/hygiene/receptions")).toEqual([{ fournisseur: "Metro", produits: "Saucisses", type: "frais", temperatureDixiemes: 30, dlcOk: true, emballageOk: true, actionCorrective: null, photo: null }]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Registre" }));
    expect(await screen.findByText("HORS LIMITE — Produits jetés")).toBeTruthy();
  });
});
