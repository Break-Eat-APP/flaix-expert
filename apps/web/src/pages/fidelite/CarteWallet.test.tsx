/**
 * Carte abonné dans le téléphone (dossier §15.147) — test des écrans : page publique de l'abonné (carte, boutons
 * Apple et Google selon ce qui est en service, lien abîmé), lien créé par le directeur puis envoyé par e-mail.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { CarteAbonne, CartePublique } from "@flaix/domain";
import { PageCarte, jetonDeLAdresse } from "../carte/PageCarte.tsx";
import { CarteAbonneBloc } from "./CarteWallet.tsx";

const JETON = "a".repeat(43);
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
let publique: CartePublique;
let carte: CarteAbonne;
let serveur: ReturnType<typeof vi.fn>;
beforeEach(() => {
  publique = {
    lieu: "Les Spartiates",
    couleur: "#c8102e",
    couleurTexte: "#ffffff",
    couleurLibelles: "#ffffff",
    titre: "Carte Supporter",
    afficherNomLieu: true,
    libellePoints: "Spartapoints",
    nom: "Karim",
    numero: "AB-7",
    points: 58,
    reduction: 0,
    remise: "10 %",
    logo: "/api/carte-logo/l.png?v=1",
    banniere: null,
    apple: true,
    google: false,
  };
  carte = { lien: null, email: "karim@exemple.fr", apple: true, google: true, appareilsApple: 0 };
  serveur = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === `/api/carte/${JETON}`) return reponse(200, publique);
    if (url === "/api/fidelite/abonnes/ab/carte" && init?.method === "POST") {
      carte = { ...carte, lien: `https://flaixexpert.flaixlabs.com/carte/${JETON}` };
      return reponse(200, carte);
    }
    if (url === "/api/fidelite/abonnes/ab/carte") return reponse(200, carte);
    if (url === "/api/fidelite/abonnes/ab/carte/email") return reponse(200, { statut: "envoye" });
    return reponse(404, { erreur: "Ce lien de carte n'existe pas ou n'est plus valable : demande-en un nouveau au lieu." });
  });
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function monter(enfant: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{enfant}</QueryClientProvider>);
}

describe("page de la carte (abonné)", () => {
  it("le jeton se lit dans l'adresse ; une adresse abîmée n'en donne pas", () => {
    expect(jetonDeLAdresse(`/carte/${JETON}`)).toBe(JETON);
    expect(jetonDeLAdresse(`/carte/${JETON}/`)).toBe(JETON);
    expect(jetonDeLAdresse("/carte/court")).toBe("");
  });

  it("montre la carte aux couleurs et aux textes du lieu (programme, nom des points, remise) et seulement le bouton du service en service", async () => {
    monter(<PageCarte jeton={JETON} />);
    expect(await screen.findByText("AB-7")).toBeTruthy();
    expect(screen.getByText("Karim")).toBeTruthy();
    expect(screen.getByText("58")).toBeTruthy();
    expect(screen.getByText("Carte Supporter")).toBeTruthy();
    expect(screen.getByText("Spartapoints")).toBeTruthy();
    expect(screen.getByText(/Ta remise abonné : 10 %/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ajouter à Apple Wallet" }).getAttribute("href")).toBe(`/api/carte/${JETON}/apple`);
    expect(screen.queryByRole("link", { name: "Ajouter à Google Wallet" })).toBeNull();
  });

  it("lien inconnu ou abîmé : un message clair, pas de carte", async () => {
    monter(<PageCarte jeton={"b".repeat(43)} />);
    expect(await screen.findByText(/n'existe pas ou n'est plus valable/)).toBeTruthy();
    cleanup();
    monter(<PageCarte jeton="" />);
    expect(screen.getByText(/pas complet/)).toBeTruthy();
  });
});

describe("carte d'un abonné (directeur)", () => {
  it("créer le lien l'affiche, puis l'envoi par e-mail est confirmé", async () => {
    monter(<CarteAbonneBloc id="ab" nom="Karim" actif />);
    fireEvent.click(await screen.findByRole("button", { name: "Créer le lien de sa carte" }));
    expect(((await screen.findByLabelText("Lien de la carte")) as HTMLInputElement).value).toBe(`https://flaixexpert.flaixlabs.com/carte/${JETON}`);
    expect(screen.getByText(/Ajout possible dans Apple Wallet et Google Wallet/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Envoyer par e-mail/ }));
    expect(await screen.findByText("E-mail envoyé à l'abonné.")).toBeTruthy();
    await waitFor(() => expect(serveur.mock.calls.some(([u, i]) => u === "/api/fidelite/abonnes/ab/carte/email" && (i as RequestInit).method === "POST")).toBe(true));
  });

  it("abonné désactivé : pas de lien proposé", async () => {
    monter(<CarteAbonneBloc id="ab" nom="Karim" actif={false} />);
    expect(await screen.findByText(/sa carte ne s'ouvre plus/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Créer le lien de sa carte" })).toBeNull();
  });
});
