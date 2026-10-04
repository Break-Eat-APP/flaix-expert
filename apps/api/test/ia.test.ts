/**
 * Passerelle vers les modèles d'IA (dossier §15.137) : Mistral d'abord, OVHcloud AI Endpoints en secours,
 * même interface pour les deux. Aucun appel réel : le réseau est simulé.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { fournisseurCompatible, passerelleIA, type FournisseurIA } from "../src/ia/fournisseur.ts";

afterEach(() => vi.unstubAllGlobals());

const repondeur = (texte: string): FournisseurIA => async () => ({ message: { content: texte }, modele: texte, jetons: null });
const enPanne: FournisseurIA = async () => {
  throw new Error("Mistral a répondu 503");
};

describe("passerelle vers les modèles d'IA", () => {
  it("Mistral répond : le secours n'est pas appelé", async () => {
    const secours = vi.fn(repondeur("ovh"));
    const r = await passerelleIA([repondeur("mistral"), secours])([{ role: "user", content: "?" }]);
    expect(r.modele).toBe("mistral");
    expect(secours).not.toHaveBeenCalled();
  });

  it("[F] Mistral ne répond pas : le secours OVHcloud prend le relais", async () => {
    const r = await passerelleIA([enPanne, repondeur("ovh")])([{ role: "user", content: "?" }]);
    expect(r.modele).toBe("ovh");
  });

  it("[F] tous en panne : l'erreur remonte (l'écran dira de réessayer)", async () => {
    await expect(passerelleIA([enPanne, enPanne])([{ role: "user", content: "?" }])).rejects.toThrow("503");
  });

  it("même interface pour Mistral et OVHcloud : adresse, jeton, modèle et outils envoyés ; modèle et fournisseur notés", async () => {
    const reseau = vi.fn(async () =>
      new Response(JSON.stringify({ model: "Mistral-Small-3.2-24B-Instruct-2506", choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: 10, completion_tokens: 2 } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", reseau);
    const f = fournisseurCompatible("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1", "jeton-de-test", "Mistral-Small-3.2-24B-Instruct-2506", "OVHcloud, secours");
    const r = await f([{ role: "user", content: "?" }], [{ type: "function", function: { name: "resultats", description: "d", parameters: {} } }]);
    const [url, init] = reseau.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer jeton-de-test");
    expect(JSON.parse(init.body as string)).toMatchObject({ model: "Mistral-Small-3.2-24B-Instruct-2506", tool_choice: "auto", tools: [{ function: { name: "resultats" } }] });
    expect(r).toEqual({ message: { content: "ok", tool_calls: undefined }, modele: "Mistral-Small-3.2-24B-Instruct-2506 (OVHcloud, secours)", jetons: { entree: 10, sortie: 2 } });
  });

  it("[F] réponse en erreur du fournisseur : levée, pour que la passerelle passe au suivant", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    await expect(fournisseurCompatible("https://api.mistral.ai/v1", "k", "m", "Mistral")([{ role: "user", content: "?" }])).rejects.toThrow("Mistral a répondu 429");
  });
});
