/**
 * Rapport de soirée (dossier §15.131) — test de l'écran : la cascade se lit ligne à ligne, le résultat
 * est dit pour ce qu'il est (pas le bénéfice du lieu), une donnée manquante n'est jamais remplacée par
 * un chiffre, et une anomalie d'empreinte saute aux yeux. Le serveur est simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { cascadeSoiree, ecartEvenement, type RapportSoiree as Rapport, type RapportSoireeFige } from "@flaix/domain";
import { RapportSoiree } from "./RapportSoiree.tsx";

const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

function rapport(modif: Partial<Rapport> = {}): Rapport {
  const c = cascadeSoiree({ encaisseTtc: 2_700, tva: 405, coutMatiere: 510, personnel: 0, depenses: 0 });
  return {
    evenement: { id: "rouen", libelle: "Spartiates – Rouen", debut: "2026-11-14T19:00:00Z", closLe: "2026-11-14T23:30:00Z", spectateurs: 3_000 },
    lieu: { nom: "Palais des sports", raisonSociale: null, formation: false },
    ventes: {
      encaisseTtc: 2_700,
      caHt: c.caHt,
      tva: 405,
      parTaux: [{ tauxTva: 2000, ht: 1_750, tva: 350, ttc: 2_100 }],
      tickets: 2,
      panierMoyen: 1_350,
      caParSpectateur: 1,
      parMode: { especes: 2_100, carte: 600 },
      parStand: [{ nom: "Buvette", ca: 2_700 }],
      parCategorie: [{ nom: "Boissons", ca: 2_100 }],
      annulations: { nombre: 0, montant: 0 },
      reductions: { remises: 0, offerts: 0, fidelite: 0 },
    },
    cascade: c.lignes,
    margeBrute: c.margeBrute,
    margeNette: c.margeNette,
    personnel: { montant: 0, affectations: 0, tauxManquants: 0 },
    depenses: [],
    cibleMargeNette: null,
    produitsSansCout: [],
    especes: { tiroirs: [{ caisse: 1, stand: "Buvette", attendu: 12_100, compte: 12_000, ecart: -100, motif: null, rectifie: false }], coffre: null, ecartTotal: -100, seuil: 500 },
    stock: { produits: [], ingredients: [], valeurTotale: 0, suivi: false },
    comparaison: {
      evenement: { libelle: "Gap", debut: "2026-11-07T19:00:00Z" },
      encaisseTtc: ecartEvenement(2_700, 1_400),
      tickets: ecartEvenement(2, 1),
      panierMoyen: ecartEvenement(1_350, 1_400),
      spectateurs: ecartEvenement(3_000, 2_000),
      margeBrute: ecartEvenement(c.margeBrute, 927),
      margeNette: ecartEvenement(c.margeNette, 927),
    },
    top: { parMarge: [], parVolume: [] },
    alertes: [],
    z: { sequence: 2, totalTtc: 2_700, perpetuel: 4_100 },
    ...modif,
  };
}

let lu: RapportSoireeFige & { integre: boolean };
beforeEach(() => {
  lu = { rapport: rapport(), etabliLe: "2026-11-14T23:30:05Z", etabliA: "cloture", etabliPar: "Directeur Essai", empreinte: "a".repeat(64), integre: true };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "/api/rapports-soiree/rouen" ? reponse(200, lu) : reponse(404, { erreur: "Inconnu" }))));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/rapport-soiree/rouen"]}>
        <Routes>
          <Route path="rapport-soiree/:evenementId" element={<RapportSoiree />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("rapport de soirée à l'écran", () => {
  it("cascade ligne à ligne, résultat dit pour ce qu'il est, comparaison avec l'événement précédent, document figé et intègre", async () => {
    monter();
    await screen.findByText("Spartiates – Rouen");
    expect(screen.getByText("= Marge nette de la soirée")).toBeTruthy();
    expect(screen.getByText(/n'est pas le bénéfice du lieu/)).toBeTruthy();
    expect(screen.getByText(/Gap, /)).toBeTruthy();
    expect(screen.getByText("+92,9 %")).toBeTruthy();
    expect(screen.getByText(/Établi à la clôture de l'événement/)).toBeTruthy();
    expect(screen.getByText(/Intègre/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Imprimer ou enregistrer en PDF/ })).toBeTruthy();
  });

  it("[F] coût manquant : jamais un chiffre, la raison à la place ; premier événement : pas de comparaison", async () => {
    const c = cascadeSoiree({ encaisseTtc: 2_700, tva: 405, coutMatiere: null, personnel: 0, depenses: 0 });
    const sansPrecedent = { evenement: null, encaisseTtc: ecartEvenement(2_700, null), tickets: ecartEvenement(2, null), panierMoyen: ecartEvenement(1_350, null), spectateurs: ecartEvenement(3_000, null), margeBrute: ecartEvenement(null, null), margeNette: ecartEvenement(null, null) };
    lu.rapport = rapport({ cascade: c.lignes, margeBrute: null, margeNette: null, produitsSansCout: ["Hot-dog"], comparaison: sansPrecedent });
    monter();
    await screen.findByText(/coût manquant sur au moins un produit/);
    expect(screen.getAllByText("non calculable").length).toBeGreaterThan(0);
    expect(screen.getByText(/Coût d'achat manquant : Hot-dog/)).toBeTruthy();
    expect(screen.getByText(/pas de comparaison possible/)).toBeTruthy();
  });

  it("[F] contenu qui ne correspond plus à son empreinte : l'anomalie est affichée", async () => {
    lu.integre = false;
    monter();
    await screen.findByText(/ANOMALIE : le contenu ne correspond plus à son empreinte/);
  });

  it("mode formation : le rapport porte la mention FACTICE", async () => {
    lu.rapport = rapport({ lieu: { nom: "Palais des sports", raisonSociale: null, formation: true } });
    monter();
    await screen.findByText(/FACTICE/);
  });
});
