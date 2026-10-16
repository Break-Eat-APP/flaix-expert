/**
 * Le stade en direct (dossier §15.162) — test de l'écran : légende comptée par couleur, stands listés du plus urgent
 * au fermé, fiche d'un stand avec ses chiffres et ses alertes, retour à la liste. La 3D (three.js) est remplacée par un
 * simple bouton : jsdom n'a pas de WebGL. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { SEUILS_STADE, type EtatStand, type PlanStade as Plan } from "@flaix/domain";
import { PlanStade } from "./PlanStade.tsx";

vi.mock("./Stade3D.tsx", () => ({
  Stade3D: ({ stands, onChoisir }: { stands: EtatStand[]; onChoisir: (id: string) => void }) => (
    <button onClick={() => onChoisir(stands[0]!.id)}>Buvette dans la 3D</button>
  ),
}));

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const etat = (x: Partial<EtatStand>): EtatStand => ({
  id: "x",
  nom: "Stand",
  tribune: "nord",
  tribuneChoisie: true,
  rang: 0,
  surTribune: 1,
  couleur: "vert",
  resume: "Tout va bien",
  signaux: [],
  chiffres: { caNet: 0, tickets: 0, caissesOuvertes: 1, caisses: 1, derniereVente: null },
  ...x,
});
const plan: Plan = {
  evenement: { id: "e", libelle: "Rouen – Caen" },
  stands: [
    etat({ id: "n", nom: "Buvette Nord", tribuneChoisie: false, couleur: "rouge", resume: "Rupture : Frites (+1)", chiffres: { caNet: 152_000, tickets: 230, caissesOuvertes: 2, caisses: 2, derniereVente: new Date(Date.now() - 4 * 60_000).toISOString() }, signaux: [
      { couleur: "rouge", titre: "Rupture : Frites", detail: "Reste 0 sur 120 · vendu 120.", lien: "/direct" },
      { couleur: "orange", titre: "Stock faible : Bière", detail: "Reste 12 sur 200 · vendu 188.", lien: "/direct" },
    ] }),
    etat({ id: "s", nom: "Buvette Sud", tribune: "sud", couleur: "vert", resume: "Tout va bien · 900,00 €" }),
    etat({ id: "o", nom: "Kiosque Ouest", tribune: "ouest", couleur: "gris", resume: "Fermé : aucune caisse ouverte", chiffres: { caNet: 0, tickets: 0, caissesOuvertes: 0, caisses: 1, derniereVente: null } }),
  ],
  seuils: SEUILS_STADE,
};

beforeEach(() => vi.stubGlobal("fetch", vi.fn(async () => reponse(plan))));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const monter = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <PlanStade />
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe("le stade en direct à l'écran", () => {
  it("légende comptée, stands du plus urgent au fermé ; un clic ouvre la fiche avec chiffres et alertes ; retour à la liste", async () => {
    monter();
    expect(await screen.findByText("Le stade en direct")).toBeTruthy();
    expect(screen.getByText(/Rouen – Caen · mis à jour à/)).toBeTruthy();
    const legende = screen.getByLabelText("Légende");
    expect(legende.textContent).toBe(" Urgent 1 À surveiller 0 Tout va bien 1 Fermé 1");
    expect(screen.getAllByRole("listitem").map((li) => li.querySelector("strong")!.textContent)).toEqual(["Buvette Nord", "Buvette Sud", "Kiosque Ouest"]);

    fireEvent.click(screen.getByText("Buvette Nord"));
    expect(screen.getByRole("heading", { name: "Buvette Nord" })).toBeTruthy();
    expect(screen.getByText("Urgent", { selector: ".puce" })).toBeTruthy();
    expect(screen.getByText(/placée d'après le nom/)).toBeTruthy();
    expect(screen.getByText("il y a 4 min")).toBeTruthy();
    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect(screen.getByText("Alertes du stand (2)")).toBeTruthy();
    const alertes = screen.getAllByRole("listitem");
    expect(within(alertes[0]!).getByText("Rupture : Frites")).toBeTruthy();
    expect(within(alertes[0]!).getByRole("link", { name: "Y aller" }).getAttribute("href")).toBe("/direct");

    fireEvent.click(screen.getByText("Tous les stands"));
    expect(screen.getByText("Kiosque Ouest")).toBeTruthy();
  });

  it("un clic dans la 3D ouvre aussi la fiche ; un stand sans alerte : « Rien à signaler »", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reponse({ ...plan, stands: [plan.stands[1]!] })));
    monter();
    fireEvent.click(await screen.findByText("Buvette dans la 3D"));
    expect(screen.getByRole("heading", { name: "Buvette Sud" })).toBeTruthy();
    expect(screen.getByText(/Rien à signaler/)).toBeTruthy();
  });
});
