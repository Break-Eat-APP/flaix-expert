/**
 * En direct (dossier §15.166, d'après la maquette de Rémi) — test de l'écran : chiffres de la soirée (CA comparé au
 * match précédent, tickets récents, rythme, caisses), cartes des stands (ventes des 10 dernières minutes, barres de
 * stock), « À traiter » avec le réassort en deux gestes, stand choisi dans la 3D, placement des stands ; hors
 * événement, le lieu à placer. La 3D (three.js) est remplacée par deux boutons : jsdom n'a pas de WebGL. Serveur simulé.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { SEUILS_STADE, type EtatStand, type Evenement, type ModeleLieu, type PlanStade, type PositionPlan, type SessionInfo, type TableauDirect } from "@flaix/domain";
import { EnDirect } from "./EnDirect.tsx";

vi.mock("../resultats/Stade3D.tsx", () => ({
  Stade3D: ({ modele, stands, onChoisir, onDeplacer }: { modele: ModeleLieu; stands: EtatStand[]; onChoisir: (id: string) => void; onDeplacer: (id: string, p: PositionPlan) => void }) => (
    <div data-modele={modele}>
      <button onClick={() => onChoisir(stands[0]!.id)}>Stand dans la 3D</button>
      <button onClick={() => onDeplacer(stands[0]!.id, { x: 10, z: -50 })}>Glisser la 1re buvette</button>
    </div>
  ),
}));

const reponse = (corps: unknown) => new Response(JSON.stringify(corps), { status: 200, headers: { "content-type": "application/json" } });
const ilYa = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const etat = (x: Partial<EtatStand>): EtatStand => ({
  id: "x",
  nom: "Stand",
  tribune: "nord",
  tribuneChoisie: true,
  rang: 0,
  surTribune: 1,
  position: null,
  couleur: "vert",
  resume: "Tout va bien",
  signaux: [],
  chiffres: { caNet: 0, tickets: 0, caissesOuvertes: 1, caisses: 1, derniereVente: null },
  recentes: { minutes: 10, tickets: 0, caNet: 0 },
  produits: [],
  ...x,
});
const nord = etat({
  id: "n",
  nom: "Bar Nord",
  couleur: "orange",
  chiffres: { caNet: 512_000, tickets: 604, caissesOuvertes: 2, caisses: 2, derniereVente: ilYa(1) },
  recentes: { minutes: 10, tickets: 26, caNet: 18_400 },
  produits: [
    { produitId: "p-biere", nom: "Bière blonde", restant: 36, sur: 200, alerte: "faible" },
    { produitId: "p-softs", nom: "Softs", restant: 150, sur: 200, alerte: null },
  ],
  signaux: [{ couleur: "orange", titre: "Stock faible : Bière blonde", detail: "Reste 36 sur 200 · vendu 164.", lien: "/direct", produitId: "p-biere" }],
});
const est = etat({
  id: "e",
  nom: "Tribune Est",
  tribune: "est",
  couleur: "rouge",
  produits: [{ produitId: "p-frites", nom: "Frites", restant: 0, sur: 120, alerte: "rupture" }],
  signaux: [{ couleur: "rouge", titre: "Rupture : Frites", detail: "Reste 0 sur 120 · vendu 120.", lien: "/direct", produitId: "p-frites" }],
});
const enDirect: PlanStade = {
  modele: "stade",
  evenement: { id: "ev", libelle: "FC Rouen – Le Mans" },
  stands: [nord, est],
  direct: {
    ouvertLe: ilYa(112),
    caNet: 1_498_000,
    tickets: 1_762,
    recentes: { minutes: 10, tickets: 260, caNet: 186_000 },
    caParMinute: 18_600,
    rythme: "soutenu",
    comparaison: { libelle: "FC Rouen – Orléans", caNet: 1_198_400, ecartPb: 2_500 },
    caisses: { ouvertes: 6, total: 7, sansNouvelles: 1 },
  },
  seuils: SEUILS_STADE,
};
const tableau: TableauDirect = {
  evenement: { id: "ev", libelle: "FC Rouen – Le Mans" },
  precedent: "FC Rouen – Orléans",
  ca: { valeur: 1_498_000, auMemeMoment: 1_198_400, ecartPb: 2_500, serie: [100_000, 300_000, 200_000] },
  tickets: { valeur: 1_762, auMemeMoment: 1_620, ecartPb: 876, serie: [80, 120, 90] },
  panier: { valeur: 850, auMemeMoment: 740, ecartPb: 1_486, serie: [800, 900, 850] },
  marge: { valeur: 812_000, tauxPb: 6_500, produitsSansCout: 0 },
  prevision: { bas: 1_700_000, median: 1_980_000, haut: 2_200_000, avancementPb: 7_566 },
  spectateurs: 7_980,
  caParSpectateur: 188,
  courbe: { libelles: ["19 h 00", "19 h 15", "19 h 30"], actuel: [100_000, 300_000, 200_000], precedent: [90_000, 250_000, 210_000] },
  parCategorie: [{ nom: "Bières", ca: 900_000 }, { nom: "Snacking", ca: 400_000 }],
  meilleurs: [{ nom: "Bière pression 50 cl", caTtc: 612_000, quantite: 1_020 }, { nom: "Hot-dog", caTtc: 248_000, quantite: 410 }],
};
const ouvert = { id: "ev", libelle: "FC Rouen – Le Mans", etat: "ouvert", debut: ilYa(130) } as Evenement;
const session = { support: false, formation: false } as unknown as SessionInfo;

const monter = (plan: PlanStade, evenements: Evenement[]) => {
  const serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/evenements") return reponse(evenements);
    if (url === "/api/direct") return reponse(plan.evenement ? tableau : null);
    if (init?.method === "PUT") return reponse({ ...plan, modele: "patinoire" });
    if (init?.method === "POST") return reponse({});
    return reponse(plan);
  });
  vi.stubGlobal("fetch", serveur);
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <EnDirect session={session} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return serveur;
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("En direct", () => {
  it("chiffres clés : CA, tickets, panier comparés au match précédent au même moment ; marge, prévision, spectateurs, rythme, caisses", async () => {
    monter(enDirect, [ouvert]);
    expect(await screen.findByRole("heading", { name: "FC Rouen – Le Mans" })).toBeTruthy();
    expect(screen.getByText("ouvert depuis 1 h 52")).toBeTruthy();
    expect(await screen.findByText("+25 %")).toBeTruthy();
    expect(screen.getByText("11 984 € au match précédent")).toBeTruthy();
    expect(screen.getByText("+9 %")).toBeTruthy();
    expect(screen.getByText("+15 %")).toBeTruthy();
    expect(screen.getByText(/^14\s980 €$/)).toBeTruthy();
    expect(screen.getByText("65 % du CA HT")).toBeTruthy();
    expect(screen.getByText(/déjà 76 % atteints/)).toBeTruthy();
    expect(screen.getByText("7 980 spectateurs")).toBeTruthy();
    expect(screen.getByText("Soutenu")).toBeTruthy();
    expect(screen.getByText("Chiffre d'affaires de la soirée")).toBeTruthy();
    expect(screen.getByText("Bière pression 50 cl")).toBeTruthy();
    expect(screen.getByText("6 / 7")).toBeTruthy();
    expect(screen.getByText("1 sans réseau")).toBeTruthy();
  });

  it("cartes des stands, du plus urgent : ventes des 10 dernières minutes, barres de stock ; un stand choisi dans la 3D s'ouvre en grand", async () => {
    monter(enDirect, [ouvert]);
    await screen.findByText("Les stands, maintenant");
    const cartes = document.querySelectorAll(".direct-stand-carte");
    expect([...cartes].map((c) => c.querySelector("h3")!.textContent)).toEqual(["Tribune Est", "Bar Nord"]);
    const carteNord = cartes[1] as HTMLElement;
    expect(within(carteNord).getByText("26 t.")).toBeTruthy();
    expect(within(carteNord).getByRole("meter", { name: "Bière blonde : 18 % restant" })).toBeTruthy();
    expect(within(cartes[0] as HTMLElement).getByText("Rupture", { selector: "strong" })).toBeTruthy();
    fireEvent.click(await screen.findByText("Stand dans la 3D"));
    expect(document.getElementById("stand-n")!.className).toContain("choisie");
    const fiche = document.querySelector(".direct-fiche") as HTMLElement;
    expect(within(fiche).getByRole("heading", { name: "Bar Nord" })).toBeTruthy();
    expect(within(fiche).getByText("Part du CA du lieu")).toBeTruthy();
    expect(within(fiche).getByText("34 %")).toBeTruthy(); // 5 120 € sur 14 980 €
    expect(within(fiche).getByText("Stock faible : Bière blonde")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Fermer le détail du stand"));
    expect(document.querySelector(".direct-fiche")).toBeNull();
  });

  it("À traiter : les alertes, rouges d'abord ; réassort en deux gestes envoyé au serveur", async () => {
    const serveur = monter(enDirect, [ouvert]);
    await screen.findByText("À traiter");
    const alertes = [...document.querySelectorAll(".direct-a-traiter")].map((li) => li.querySelector("strong")!.textContent);
    expect(alertes).toEqual(["Rupture : Frites", "Stock faible : Bière blonde"]);
    fireEvent.click(screen.getAllByText("Préparer un réassort")[0]!);
    fireEvent.change(screen.getByLabelText("Quantité apportée au stand Tribune Est"), { target: { value: "40" } });
    fireEvent.click(screen.getByText("Valider"));
    await waitFor(() => expect(serveur.mock.calls.some(([u]) => u === "/api/stock/reassort")).toBe(true));
    const [, init] = serveur.mock.calls.find(([u]) => u === "/api/stock/reassort")!;
    expect(JSON.parse(init!.body as string)).toEqual({ evenementId: "ev", standId: "e", produitId: "p-frites", quantite: 40 });
  });

  it("placer les stands : décor enregistré dès le clic, stand glissé, enregistré", async () => {
    const serveur = monter(enDirect, [ouvert]);
    fireEvent.click(await screen.findByText("Placer les stands"));
    fireEvent.click(screen.getByRole("radio", { name: /Patinoire/ }));
    expect(screen.getByText("La patinoire en direct")).toBeTruthy();
    // Le décor s'enregistre dès le clic, sans attendre « Enregistrer » (§15.169).
    const puts = () => serveur.mock.calls.filter(([, i]) => i?.method === "PUT").map(([, i]) => JSON.parse(i!.body as string));
    await waitFor(() => expect(puts()).toEqual([{ modele: "patinoire", positions: [] }]));
    expect(await screen.findByText(/Décor enregistré/)).toBeTruthy();
    fireEvent.click(screen.getByText("Glisser la 1re buvette"));
    fireEvent.click(screen.getByText("Enregistrer"));
    await waitFor(() => expect(puts()).toHaveLength(2));
    expect(puts()[1]).toEqual({ modele: "patinoire", positions: [{ standId: "n", position: { x: 10, z: -50 } }] });
  });

  it("hors événement : le lieu à placer, sans chiffres ni cartes", async () => {
    const prochain = { id: "p", libelle: "FC Rouen – Orléans", etat: "a_venir", debut: "2026-10-24T18:30:00.000Z" } as Evenement;
    monter({ ...enDirect, evenement: null, direct: null, stands: [etat({ id: "n", nom: "Bar Nord", couleur: "gris" })] }, [prochain]);
    expect(await screen.findByText("Aucun événement ouvert", { selector: "h3, h2, strong, p, div" })).toBeTruthy();
    expect(await screen.findByText(/Prochain événement : FC Rouen – Orléans/)).toBeTruthy();
    expect(screen.queryByText("Les stands, maintenant")).toBeNull();
    expect(screen.getByText("Placer les stands")).toBeTruthy();
  });
});
