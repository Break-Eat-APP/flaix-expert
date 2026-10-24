/**
 * Résultats sur une période « du … au … » (dossier §15.133) — test de l'écran : la bascule
 * « Une période » demande au serveur les bons jours et affiche le bilan sans planter. Serveur simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { Resultats, StatsMatch } from "@flaix/domain";
import { Tableaux } from "./Tableaux.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

const stats = (id: string, caTtc: number): StatsMatch => ({
  evenementId: id,
  caTtc,
  caHt: Math.round(caTtc / 1.2),
  tva: caTtc - Math.round(caTtc / 1.2),
  tickets: 2,
  annulations: { nombre: 0, montant: 0 },
  panierMoyen: caTtc / 2,
  spectateurs: null,
  caParSpectateur: null,
  parHeure: [{ heure: 20, ca: caTtc, tickets: 2 }],
  parCategorie: [{ nom: "Boissons", ca: caTtc }],
  parStand: [{ standId: "s", nom: "Buvette", ca: caTtc }],
  parMode: { especes: 0, carte: caTtc },
  parTaux: [{ tauxTva: 2000, ht: Math.round(caTtc / 1.2), tva: caTtc - Math.round(caTtc / 1.2), ttc: caTtc }],
  produits: [{ produitId: "b", nom: "Bière", categorie: "Boissons", quantite: 2, caTtc, caHt: Math.round(caTtc / 1.2), coutUnitaire: 120, marge: Math.round(caTtc / 1.2) - 240, cibleMarge: null }],
  coutMatiere: 240,
  margeBrute: Math.round(caTtc / 1.2) - 240,
  produitsSansCout: [],
  caHtSansCout: 0,
  personnel: { reel: 0, affectations: 0, tauxManquants: 0 },
});
const gap = { id: "gap", libelle: "Gap", debut: "2026-09-05T18:00:00Z", etat: "clos" as const, caTtc: 1_400, tickets: 2, spectateurs: null };
const evenement = (id: string, libelle: string, debut: string) => ({ id, libelle, debut, spectateurs: null, etat: "clos" as const, ouvertLe: null, closLe: null, caissesOuvertes: 0 });

let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  serveur = vi.fn(async (url: string) => {
    if (!url.startsWith("/api/resultats")) return reponse(404, { erreur: "Inconnu" });
    const q = new URLSearchParams(url.split("?")[1] ?? "");
    const enPeriode = q.has("du");
    const r: Resultats = {
      matchs: [gap],
      evenement: enPeriode ? evenement(`periode:${q.get("du")}:${q.get("au")}`, "du 1er au 30 septembre 2026", `${q.get("du")}T12:00:00.000Z`) : evenement("gap", "Gap", gap.debut),
      comparaison: enPeriode ? evenement("periode:2026-08-02:2026-08-31", "du 2 au 31 août 2026", "2026-08-02T12:00:00.000Z") : null,
      actuel: stats(enPeriode ? "periode" : "gap", 1_400),
      precedent: enPeriode ? stats("periode-avant", 700) : null,
      alertes: [],
      prochains: [],
      periode: enPeriode ? { du: q.get("du")!, au: q.get("au")!, evenements: [gap], precedente: { du: "2026-08-02", au: "2026-08-31", evenements: 1 } } : null,
    };
    return reponse(200, r);
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Résultats sur une période", () => {
  it("la bascule « Une période » demande les jours choisis et affiche le bilan comparé à la période précédente", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Tableaux />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Une période" }));
    fireEvent.click(await screen.findByRole("button", { name: "Le mois dernier" }));
    await screen.findByText(/Bilan du 1er au 30 septembre 2026/);
    await waitFor(() => expect(serveur.mock.calls.some(([url]) => /du=\d{4}-\d{2}-01&au=\d{4}-\d{2}-\d{2}/.test(url as string))).toBe(true));
    // Design de la 2e maquette (§15.174) : comparaison dite en pastille et sous chaque chiffre.
    expect(screen.getByRole("button", { name: "Comparé à la période précédente" })).toBeTruthy();
    expect(screen.getAllByText(/à la période précédente/).length).toBeGreaterThan(1);
    expect(screen.getByText("Ce qui se vend le mieux")).toBeTruthy();
  });
});

describe("Vue d'ensemble au design de la 2e maquette (§15.174)", () => {
  it("bilan, rapport de soirée, chiffres comparés, à surveiller, prochain match et sa prévision", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.startsWith("/api/prevision")) return reponse(200, { prevision: { ca: { bas: 1_700_000, median: 1_980_000, haut: 2_200_000 }, produits: [{ produit: "Bière", ventes: { bas: 300, median: 420, haut: 500 } }] } });
        if (!url.startsWith("/api/resultats")) return reponse(404, { erreur: "Inconnu" });
        const r: Resultats = {
          matchs: [gap],
          evenement: evenement("gap", "Gap", gap.debut),
          comparaison: evenement("rouen", "Rouen", "2026-08-29T18:00:00Z"),
          actuel: stats("gap", 1_400),
          precedent: stats("rouen", 700),
          alertes: [{ niveau: "forte", titre: "Rupture : bière blonde", detail: "Bar Nord, 21 h 12" }],
          prochains: [{ id: "orl", libelle: "FC Rouen – Orléans", debut: new Date(Date.now() + 8 * 86_400_000).toISOString() }],
          periode: null,
        };
        return reponse(200, r);
      }),
    );
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <Tableaux />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Gap", { selector: ".bilan-de strong" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Rapport de soirée/ }).getAttribute("href")).toBe("/rapport-soiree/gap");
    expect(screen.getByRole("button", { name: /Comparé à Rouen/ })).toBeTruthy();
    expect(screen.getAllByText("+100 %").length).toBeGreaterThan(0); // 14,00 € contre 7,00 €
    expect(screen.getByText("Rupture : bière blonde")).toBeTruthy();
    expect(screen.getByText("FC Rouen – Orléans")).toBeTruthy();
    expect(screen.getByText("dans 8 jours")).toBeTruthy();
    expect(await screen.findByText(/≈ 19\s800,00\s€/)).toBeTruthy();
    expect(screen.getByText("≈ 420")).toBeTruthy();
  });
});

