/**
 * Caisses connectées (dossier §15.150) — test de l'écran : première caisse ajoutée ; fichier lu puis aperçu, colonne
 * corrigée (nouvel aperçu avec les colonnes choisies), import ; produit rapproché ; résultats.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CaisseExterne, ProduitExterne, SyntheseVentesExternes } from "@flaix/domain";
import { CaissesConnectees } from "./CaissesConnectees.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const CAISSE: CaisseExterne = { id: "k1", nom: "Digifood stade", systeme: "digifood", colonnes: null, ventes: 0, premiereVente: null, derniereVente: null, dernierImport: null };
let caisses: CaisseExterne[];
let serveur: ReturnType<typeof vi.fn>;
const appels = (url: string, methode: string) => serveur.mock.calls.filter(([u, i]) => String(u).startsWith(url) && ((i as RequestInit | undefined)?.method ?? "GET") === methode);
const corpsDe = (appel: unknown[]) => JSON.parse((appel[1] as RequestInit).body as string);

beforeEach(() => {
  caisses = [];
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    const methode = init?.method ?? "GET";
    if (url === "/api/caisses-externes" && methode === "POST") {
      caisses = [CAISSE];
      return reponse(200, caisses);
    }
    if (url === "/api/caisses-externes") return reponse(200, caisses);
    if (url === "/api/caisses-externes/k1/import") {
      const d = JSON.parse(init!.body as string);
      if (d.apercu)
        return reponse(200, {
          entetes: ["Ticket", "Date", "Article", "Qté", "Prix"],
          colonnes: d.colonnes ?? { vente: 0, date: 1, produit: 2, quantite: 3, prixUnitaire: 4 },
          manquants: [],
          lignesLues: 2,
          ventes: 2,
          montant: 1_050,
          premieres: [{ idExterne: "T-1", horodatage: "2026-10-05T18:15:00.000Z", pointDeVente: "Bar Nord", paiement: null, annulee: false, total: 700, lignes: [{ cle: "Bière", libelle: "Bière", code: null, quantite: 1, prixUnitaire: 700, montant: 700, tvaPb: null }] }],
          erreurs: [],
        });
      caisses = [{ ...CAISSE, ventes: 2 }];
      return reponse(200, { ajoutees: 2, deja: 0, annulationsReportees: 0, lignesLues: 2, erreurs: [], caisses });
    }
    if (url === "/api/caisses-externes/k1/produits" && methode === "PUT") return reponse(200, [{ cle: "Bière", libelle: "Bière", code: null, quantite: 3, montant: 2_100, produitId: "p1", ignore: false }] satisfies ProduitExterne[]);
    if (url === "/api/caisses-externes/k1/produits") return reponse(200, [{ cle: "Bière", libelle: "Bière", code: null, quantite: 3, montant: 2_100, produitId: null, ignore: false }] satisfies ProduitExterne[]);
    if (url === "/api/caisses-externes/k1/points-de-vente") return reponse(200, []);
    if (url === "/api/produits") return reponse(200, [{ id: "p1", nom: "Bière pression" }]);
    if (url === "/api/stands") return reponse(200, []);
    if (url.startsWith("/api/caisses-externes/synthese"))
      return reponse(200, {
        du: "2026-10-01",
        au: "2026-10-31",
        ventes: 4,
        annulees: 1,
        montant: 2_750,
        montantAvecCout: 2_100,
        cout: 360,
        parProduit: [{ cle: "p1", libelle: "Bière pression", ventes: 3, quantite: 3, montant: 2_100, cout: 360 }],
        parStand: [],
        parEvenement: [],
        parHeure: [{ heure: 20, ventes: 2, montant: 1_400 }],
      } satisfies SyntheseVentesExternes);
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
      <CaissesConnectees />
    </QueryClientProvider>,
  );
}

describe("caisses connectées", () => {
  it("première caisse ajoutée, puis aperçu du fichier, colonne corrigée, import", async () => {
    monter();
    fireEvent.change(await screen.findByPlaceholderText("Ex. : Digifood stade"), { target: { value: "Digifood stade" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    const entree = (await screen.findByLabelText("Choisir le fichier d'export")) as HTMLInputElement;
    fireEvent.change(entree, { target: { files: [new File(["Ticket;Date;Article;Qté;Prix\nT-1;05/10/2026 20:15;Bière;1;7,00"], "ventes.csv", { type: "text/csv" })] } });
    expect(await screen.findByText(/vente.* lue/)).toBeTruthy();
    expect(corpsDe(appels("/api/caisses-externes/k1/import", "POST")[0]!)).toMatchObject({ fichier: "ventes.csv", apercu: true });

    fireEvent.change(screen.getByLabelText("Colonne : Point de vente"), { target: { value: "2" } });
    await waitFor(() => expect(appels("/api/caisses-externes/k1/import", "POST")).toHaveLength(2));
    expect(corpsDe(appels("/api/caisses-externes/k1/import", "POST")[1]!)).toMatchObject({ apercu: true, colonnes: { vente: 0, pointDeVente: 2 } });

    fireEvent.click(await screen.findByRole("button", { name: /Importer 2 ventes/ }));
    expect(await screen.findByText("2 ventes ajoutées.")).toBeTruthy();
    const dernier = corpsDe(appels("/api/caisses-externes/k1/import", "POST").at(-1)!);
    expect(dernier.apercu).toBeUndefined();
    expect(dernier.colonnes).toMatchObject({ pointDeVente: 2 });
  });

  it("produit rapproché d'un produit FlaiX Expert ; résultats avec la marge estimée", async () => {
    caisses = [{ ...CAISSE, ventes: 4 }];
    monter();
    fireEvent.click(await screen.findByRole("button", { name: "Correspondances" }));
    fireEvent.change(await screen.findByLabelText("Correspondance : Bière"), { target: { value: "p1" } });
    await waitFor(() => expect(appels("/api/caisses-externes/k1/produits", "PUT")).toHaveLength(1));
    expect(corpsDe(appels("/api/caisses-externes/k1/produits", "PUT")[0]!)).toEqual({ cle: "Bière", produitId: "p1", ignore: false });

    fireEvent.click(screen.getByRole("button", { name: "Résultats" }));
    expect((await screen.findAllByText("Marge estimée")).length).toBeGreaterThan(0);
    // 21,00 € de bière rapprochée − 3,60 € de coût matière = 17,40 €.
    expect(screen.getAllByText(/17,40/).length).toBeGreaterThan(0);
    expect(screen.getByText(/76 % du chiffre d'affaires/)).toBeTruthy();
  });
});
