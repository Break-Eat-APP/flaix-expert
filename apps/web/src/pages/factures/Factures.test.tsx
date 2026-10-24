/**
 * Factures automatisées à l'écran (§15.173) : un export CSV remplit la saisie, avec le produit et le colis appris pour
 * ce fournisseur, le produit du même nom, ou un produit proposé à vérifier ; les alertes se cochent avant de valider.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { EtatFactures, FactureVue } from "@flaix/domain";
import { Factures } from "./Factures.tsx";

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const PRODUITS = [
  { id: "coca", nom: "Coca-Cola 33 cl", actif: true },
  { id: "evian", nom: "Evian 50 cl", actif: true },
  { id: "ora", nom: "Orangina", actif: true },
];
const avecAlerte: FactureVue = {
  id: "f1",
  fournisseur: "Metro",
  numero: "F-9",
  dateFacture: "2026-10-20",
  echeance: null,
  totalHt: 2_880,
  totalAnnonce: null,
  statut: "recue",
  lignes: [{ id: "l1", produitId: "coca", libelle: "Coca x24", quantite: 2, prixUnitaire: 1_440, unitesParColis: 1, codeArticle: null, livraison: null, livraisonChoisie: false, ecart: null, candidates: [] }],
  alertes: [{ ligneId: "l1", type: "colis", titre: "« Coca x24 » : colis de 24 ?", detail: "2 entreraient en réserve au lieu de 48." }],
  fichier: null,
  validation: null,
  paiement: null,
  creePar: "Rémi",
  creeLe: "2026-10-20T10:00:00.000Z",
} as unknown as FactureVue;

function monter(factures: FactureVue[]) {
  const serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/produits") return reponse(PRODUITS);
    if (url === "/api/factures/correspondances") return reponse([{ fournisseur: "metro", cle: "code:coc33", libelle: "Coca 33cl x24", produitId: "coca", unitesParColis: 24 }]);
    if (init?.method === "POST") return reponse({ factures, fournisseurs: [] } satisfies EtatFactures);
    return reponse({ factures, fournisseurs: ["Metro"] } satisfies EtatFactures);
  });
  vi.stubGlobal("fetch", serveur);
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Factures />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return serveur;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("factures automatisées à l'écran", () => {
  it("import CSV : produit et colis appris, même nom, proposé à vérifier ; enregistré avec les colis", async () => {
    const serveur = monter([]);
    fireEvent.click(await screen.findByRole("button", { name: /Saisir une facture/ }));
    fireEvent.change(screen.getByLabelText("Fournisseur"), { target: { value: "Metro" } });
    fireEvent.change(screen.getByLabelText("N° de facture"), { target: { value: "F-10" } });
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/factures/correspondances")).toBe(true));
    await new Promise((fin) => setTimeout(fin, 50)); // réponse des correspondances lue
    const csv = ["Réf.;Désignation;Qté;P.U. HT", "COC33;Coca 33cl x24;5;14,40", "EV;Evian 50 cl;10;0,45", "OR;Orangina 25cl x12;2;9,60"].join("\n");
    const entree = document.querySelector<HTMLInputElement>('.import-facture input[type="file"]')!;
    fireEvent.change(entree, { target: { files: [new File([csv], "facture.csv", { type: "text/csv" })] } });
    expect(await screen.findByText(/3 lignes lues, 3 reliées à un produit/)).toBeTruthy();
    expect((screen.getByLabelText("Produit de la ligne 1") as HTMLSelectElement).value).toBe("coca");
    expect((screen.getByLabelText("Unités par colis de la ligne 1") as HTMLInputElement).value).toBe("24");
    expect(screen.getByText("déjà relié pour ce fournisseur")).toBeTruthy();
    expect(screen.getByText("même nom")).toBeTruthy();
    // Orangina inconnu : le produit le plus ressemblant est proposé, à vérifier ; colis deviné dans le libellé.
    expect(screen.getByText("proposé : à vérifier")).toBeTruthy();
    expect((screen.getByLabelText("Unités par colis de la ligne 3") as HTMLInputElement).value).toBe("12");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => u === "/api/factures" && i?.method === "POST")).toBe(true));
    const [, init] = serveur.mock.calls.find(([u, i]) => u === "/api/factures" && i?.method === "POST")!;
    const corps = JSON.parse(init!.body as string);
    expect(corps.lignes[0]).toMatchObject({ produitId: "coca", codeArticle: "COC33", quantite: 5, prixUnitaire: 1_440, unitesParColis: 24 });
  });

  it("alertes : la validation attend « J'ai vérifié »", async () => {
    const serveur = monter([avecAlerte]);
    fireEvent.click(await screen.findByText("F-9", { exact: false }));
    expect(await screen.findByText(/1 point à vérifier avant de valider/)).toBeTruthy();
    const valider = screen.getByRole("button", { name: "Valider la facture" }) as HTMLButtonElement;
    expect(valider.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/J'ai vérifié/));
    expect(valider.disabled).toBe(false);
    fireEvent.click(valider);
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/factures/f1/validation")).toBe(true));
    const [, init] = serveur.mock.calls.find(([u]) => u === "/api/factures/f1/validation")!;
    expect(JSON.parse(init!.body as string)).toMatchObject({ alertesVerifiees: true, entrerEnReserve: true });
  });
});
