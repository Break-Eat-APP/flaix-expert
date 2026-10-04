/**
 * Gestion financière de la soirée (dossier §15.132) — test de l'écran : une dépense se saisit en euros ou
 * en % du CA HT et part au serveur sous la bonne forme ; la marge nette est jugée par rapport à sa cible.
 * Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { cascadeSoiree, etatCibleSoiree, type FinancesSoiree, type StatsMatch } from "@flaix/domain";
import { VueFinances } from "./Finances.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

function finances(depense: { mode: "euros" | "pourcent"; valeur: number } | null, ciblePb: number | null): FinancesSoiree {
  const montant = depense === null ? 0 : depense.mode === "euros" ? depense.valeur : Math.round((2_295 * depense.valeur) / 10_000);
  const c = cascadeSoiree({ encaisseTtc: 2_700, tva: 405, coutMatiere: 510, personnel: 0, depenses: montant });
  return {
    evenement: { id: "rouen", libelle: "Rouen", debut: "2026-11-14T19:00:00Z", etat: "clos", spectateurs: 3_000 },
    encaisseTtc: 2_700,
    tva: 405,
    caHt: 2_295,
    tickets: 2,
    coutMatiere: 510,
    produitsSansCout: [],
    personnel: { reel: 0, affectations: 0, tauxManquants: 0 },
    depenses: [{ posteId: "secu", nom: "Sécurité", actif: true, mode: depense?.mode ?? null, valeur: depense?.valeur ?? null, montant, saisiPar: null, saisiLe: null }],
    totalDepenses: montant,
    margeBrute: c.margeBrute,
    margeNette: c.margeNette,
    cascade: c.lignes,
    cible: { lieu: ciblePb, evenement: null, effective: ciblePb },
    etatCible: etatCibleSoiree(c.margeNette, 2_295, ciblePb),
  };
}
const stats = { caTtc: 2_700, caHt: 2_295, tva: 405, parTaux: [], parMode: { especes: 0, carte: 2_700 } } as unknown as StatsMatch;

let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/finances?evenementId=rouen") return reponse(200, finances(null, 9_000));
    if (url === "/api/finances?du=2026-09-01&au=2026-09-30") {
      const f = finances({ mode: "euros", valeur: 300 }, null);
      return reponse(200, { ...f, evenement: { ...f.evenement, id: "periode:2026-09-01:2026-09-30", libelle: "du 1er au 30 septembre 2026" }, depenses: [{ ...f.depenses[0], mode: null, valeur: null }], periode: { du: "2026-09-01", au: "2026-09-30", soirees: [{ id: "gap", libelle: "Gap", debut: "2026-09-05T18:00:00Z", encaisseTtc: 1_200, caHt: 1_000, margeBrute: 700, margeNette: 600, etatCible: null }, { id: "rouen", libelle: "Rouen", debut: "2026-09-20T18:00:00Z", encaisseTtc: 1_500, caHt: 1_295, margeBrute: 1_085, margeNette: 885, etatCible: null }] } });
    }
    if (url === "/api/finances/rouen/depenses/secu" && init?.method === "PUT") return reponse(200, finances(JSON.parse(init.body as string), 9_000));
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
        <VueFinances evenementId="rouen" s={stats} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("gestion financière de la soirée à l'écran", () => {
  it("marge nette jugée par rapport à sa cible ; rappel que ce n'est pas le bénéfice du lieu", async () => {
    monter();
    await screen.findByText(/Tout cet écran porte sur la seule soirée/);
    expect(screen.getAllByText(/sous la cible/).length).toBeGreaterThan(0);
    expect(screen.getByText(/n'est pas le bénéfice du lieu/)).toBeTruthy();
  });

  it("une dépense de 10 % du CA HT part au serveur en points de base, et la marge nette se recalcule", async () => {
    monter();
    const champ = await screen.findByLabelText("Montant Sécurité");
    fireEvent.change(screen.getByLabelText("Unité Sécurité"), { target: { value: "pourcent" } });
    fireEvent.change(champ, { target: { value: "10" } });
    fireEvent.blur(champ);
    await waitFor(() => expect(serveur.mock.calls.some(([url]) => url === "/api/finances/rouen/depenses/secu")).toBe(true));
    const [, init] = serveur.mock.calls.find(([url]) => url === "/api/finances/rouen/depenses/secu")!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ mode: "pourcent", valeur: 1_000 });
    await screen.findByText("2,30 €", { selector: "td" });
  });

  it("[F] un montant illisible ne part pas au serveur", async () => {
    monter();
    const champ = await screen.findByLabelText("Montant Sécurité");
    fireEvent.change(champ, { target: { value: "douze" } });
    fireEvent.blur(champ);
    expect(serveur.mock.calls.some(([url]) => url === "/api/finances/rouen/depenses/secu")).toBe(false);
  });

  it("bilan d'une période : les soirées une par une, les dépenses en lecture (elles se saisissent soirée par soirée)", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <VueFinances periode={{ du: "2026-09-01", au: "2026-09-30" }} s={stats} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByText(/Tout cet écran porte sur la période/);
    expect(screen.getByText("Soirée par soirée")).toBeTruthy();
    expect(screen.getByText("Dépenses de la période")).toBeTruthy();
    expect(screen.queryByLabelText("Montant Sécurité")).toBeNull();
    expect(screen.getByText(/n'est jugée que si chaque soirée a une cible/)).toBeTruthy();
  });
});
