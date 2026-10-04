/**
 * Fidélité à la caisse côté tablette (dossier §15.127, option A) — tests des écrans (audit Codex
 * P2-004) : code sans plafond accepté hors ligne, code plafonné et points refusés sans réseau,
 * refus du serveur affiché, points rendus quand la caissière les retire.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFideliteCaisse } from "./FideliteCaisse.tsx";

const CAISSE = "caisse-fid";
const reponse = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: { "content-type": "application/json" } });
const horsLigne = () => Promise.reject(new TypeError("Failed to fetch"));
let serveur: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  serveur = vi.fn(async (url: string) =>
    url.endsWith("/codes-hors-ligne") ? reponse(200, [{ code: "SANSPLAFOND", type: "pourcentage", valeur: 1000, debut: "2026-01-01", fin: "2099-12-31" }]) : reponse(200, {}),
  );
  vi.stubGlobal("fetch", serveur);
});
afterEach(() => vi.unstubAllGlobals());

async function monter() {
  const r = renderHook(() => useFideliteCaisse(CAISSE, true));
  await waitFor(() => expect(localStorage.getItem(`fx-codes-hors-ligne:${CAISSE}`)).toContain("SANSPLAFOND"));
  return r;
}

describe("codes promo à la caisse", () => {
  it("hors ligne, un code sans plafond déjà connu de la tablette s'applique quand même", async () => {
    const { result } = await monter();
    serveur.mockImplementation(horsLigne);
    let erreur: string | null = "?";
    await act(async () => {
      erreur = await result.current.appliquerCode(" sansplafond ");
    });
    expect(erreur).toBeNull();
    expect(result.current.code).toEqual({ code: "SANSPLAFOND", type: "pourcentage", valeur: 1000, reservation: null });
  });

  it("hors ligne, un code inconnu de la tablette (ou plafonné) est refusé avec une explication", async () => {
    const { result } = await monter();
    serveur.mockImplementation(horsLigne);
    let erreur: string | null = null;
    await act(async () => {
      erreur = await result.current.appliquerCode("UNSEUL");
    });
    expect(erreur).toContain("Pas de réseau");
    expect(result.current.code).toBeNull();
  });

  it("le serveur refuse (code épuisé) : son message est rendu, rien n'est appliqué", async () => {
    const { result } = await monter();
    serveur.mockResolvedValue(reponse(409, { erreur: "Code UNSEUL épuisé." }));
    let erreur: string | null = null;
    await act(async () => {
      erreur = await result.current.appliquerCode("UNSEUL");
    });
    expect(erreur).toBe("Code UNSEUL épuisé.");
    expect(result.current.vente).toBeNull();
  });
});

describe("points de l'abonné", () => {
  it("sans réseau : indisponibles, rien n'est réservé", async () => {
    const { result } = await monter();
    serveur.mockImplementation(horsLigne);
    let erreur: string | null = null;
    await act(async () => {
      erreur = await result.current.reserverPoints("AB-1", 1);
    });
    expect(erreur).toBe("Points indisponibles sans réseau.");
    expect(result.current.points).toBeNull();
  });

  it("réservés par le serveur puis retirés par la caissière : la réservation est rendue au serveur", async () => {
    const { result } = await monter();
    serveur.mockResolvedValue(reponse(200, { reservation: "resa-1", expireLe: null, points: { numero: "AB-1", points: 200, montant: 1000 }, codePromo: null }));
    await act(async () => {
      await result.current.reserverPoints("AB-1", 2);
    });
    expect(result.current.vente).toEqual({ codePromo: null, points: { numero: "AB-1", points: 200, montant: 1000, reservation: "resa-1" } });
    serveur.mockClear();
    act(() => result.current.retirerPoints());
    expect(result.current.points).toBeNull();
    expect(serveur.mock.calls[0]![0]).toBe(`/api/caisses/${CAISSE}/fidelite/reservations/resa-1/liberation`);
  });

  it("après l'encaissement, les réservations ne sont pas rendues (le ticket les a utilisées)", async () => {
    const { result } = await monter();
    serveur.mockResolvedValue(reponse(200, { reservation: "resa-2", expireLe: null, points: { numero: "AB-1", points: 100, montant: 500 }, codePromo: null }));
    await act(async () => {
      await result.current.reserverPoints("AB-1", 1);
    });
    serveur.mockClear();
    act(() => result.current.vider());
    expect(result.current.vente).toBeNull();
    expect(serveur).not.toHaveBeenCalled();
  });
});
