/**
 * « Où je perds de l'argent » (dossier §15.138) — test de l'écran : les pertes sont classées par montant, une
 * estimation montre sa fourchette, les familles restent séparées, un stock non suivi est dit. Serveur simulé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { formaterMontant, type ReponsePertes } from "@flaix/domain";
import { VuePertes } from "./Pertes.tsx";

/** La bibliothèque de test normalise les espaces de la page (les espaces insécables de « 16,80 € » deviennent des espaces) : on fait de même. */
const texte = (t: string) => t.replace(/\s+/g, " ");
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });

const rouen: ReponsePertes = {
  evenements: [{ id: "rouen", libelle: "Rouen", debut: "2026-11-14T19:00:00Z", etat: "clos" }],
  suivi: { stock: true, especes: true },
  analyse: {
    perdu: [
      { famille: "rupture", nature: "estime", titre: "Mettre plus de Frites à Buvette Nord : rupture à 21 h 08, 21 min avant la fin des ventes du stand", detail: "entre 6 et 8 ventes manquées", bas: 1_680, haut: 2_240, montantConnu: true, coutManquant: false, lien: "/stock" },
      { famille: "especes", nature: "constate", titre: "Vérifier le tiroir de la caisse 3 (Buvette Nord) : 12,50 € manquent au comptage", detail: "Écart du comptage qui fait foi.", bas: 1_250, haut: 1_250, montantConnu: true, lien: "/clotures" },
    ],
    pistes: [{ famille: "cible", nature: "piste", titre: "Revoir le prix ou le coût de Frites : marge de 61,0 % pour une cible de 70,0 %", detail: "À la cible…", bas: 8_388, haut: 8_388, montantConnu: true, lien: "/parametres/produits" }],
    accorde: { remises: 1_200, offerts: 3_500, fidelite: 0 },
    signes: [{ titre: "Buvette Nord, caisse 3 : à plein régime de 21 h 00 à 21 h 20", detail: "Non chiffré." }],
    totaux: { constate: 1_250, estimeBas: 1_680, estimeHaut: 2_240 },
  },
};

let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  serveur = vi.fn(async (url: string) => {
    if (url === "/api/pertes?evenementId=rouen") return reponse(200, rouen);
    if (url === "/api/pertes?du=2026-09-01&au=2026-09-30")
      return reponse(200, { evenements: [], suivi: { stock: false, especes: false }, analyse: { perdu: [], pistes: [], accorde: { remises: 0, offerts: 0, fidelite: 0 }, signes: [], totaux: { constate: 0, estimeBas: 0, estimeHaut: 0 } } });
    return reponse(404, { erreur: "Inconnu" });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter(props: Parameters<typeof VuePertes>[0]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VuePertes {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("où je perds de l'argent", () => {
  it("un événement : perdu constaté, ventes manquées en fourchette, pistes et signes à part, accordé hors des pertes", async () => {
    monter({ evenementId: "rouen" });
    expect(await screen.findByText("Argent perdu, du plus gros au plus petit")).toBeTruthy();
    const titres = screen.getAllByText(/Mettre plus de Frites|Vérifier le tiroir/).map((n) => n.textContent);
    expect(titres[0]).toContain("Mettre plus de Frites"); // l'ordre du serveur (par montant) est gardé
    expect(screen.getAllByText(texte(`${formaterMontant(1_680)} à ${formaterMontant(2_240)}`)).length).toBe(2); // ligne et chiffre clé
    expect(screen.getByText("Estimation")).toBeTruthy();
    expect(screen.getByText("Constaté")).toBeTruthy();
    expect(screen.getByText("Pistes de gain")).toBeTruthy();
    expect(screen.getByText("Ordre de grandeur")).toBeTruthy();
    expect(screen.getByText("À regarder, sans montant")).toBeTruthy();
    expect(screen.getByText("Accordé : des choix, pas des pertes")).toBeTruthy();
    expect(screen.getByText(texte(formaterMontant(4_700)))).toBeTruthy(); // 35 € offerts + 12 € de remises
  });

  it("une période sans rien : « Rien à signaler », et le stock non suivi est dit (jamais un zéro qui rassure à tort)", async () => {
    monter({ periode: { du: "2026-09-01", au: "2026-09-30" } });
    expect(await screen.findByText("Rien à signaler")).toBeTruthy();
    expect(screen.getByText(/Stock non suivi/)).toBeTruthy();
    expect(screen.getByText(/Aucun comptage d'espèces/)).toBeTruthy();
  });
});
