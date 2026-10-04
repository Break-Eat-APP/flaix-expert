import { config } from "../config.ts";

/*
 * Fournisseur d'IA (décision de Rémi du 2026-10-04 : Mistral, entreprise française, hébergement en
 * Europe ; dossier §15.136). Une seule porte d'entrée, remplaçable dans les tests. Sans clé réglée sur le
 * serveur (`sudo flaix-admin cle-mistral`), l'IA est simplement absente : rien ne casse.
 */

export interface AppelOutil {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type MessageIA =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: AppelOutil[] }
  | { role: "tool"; name: string; content: string; tool_call_id: string };

export interface OutilIA {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ReponseIA {
  message: { content: string; tool_calls?: AppelOutil[] };
  modele: string;
  jetons: { entree: number; sortie: number } | null;
}

export type FournisseurIA = (messages: MessageIA[], outils?: OutilIA[]) => Promise<ReponseIA>;

/** Appel à l'API de conversation de Mistral (avec outils). */
export function fournisseurMistral(cle: string, modele: string): FournisseurIA {
  return async (messages, outils) => {
    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({ model: modele, messages, ...(outils?.length ? { tools: outils, tool_choice: "auto" } : {}), temperature: 0.2, max_tokens: 900 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) throw new Error(`Mistral a répondu ${r.status}`);
    const d = (await r.json()) as {
      model?: string;
      choices: { message: { content: string | null; tool_calls?: AppelOutil[] } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const m = d.choices[0]!.message;
    return {
      message: { content: m.content ?? "", tool_calls: m.tool_calls?.map((t) => ({ ...t, type: "function" as const })) },
      modele: d.model ?? modele,
      jetons: d.usage ? { entree: d.usage.prompt_tokens, sortie: d.usage.completion_tokens } : null,
    };
  };
}

let fournisseur: FournisseurIA | null = config.mistralCle ? fournisseurMistral(config.mistralCle, config.mistralModele) : null;
let nomModele: string | null = config.mistralCle ? config.mistralModele : null;

/** Le fournisseur réglé, ou null si aucune clé n'est réglée sur le serveur. */
export const fournisseurIA = (): FournisseurIA | null => fournisseur;
export const modeleIA = (): string | null => nomModele;

/** Tests : remplacer le fournisseur (null : revenir à la configuration du serveur). */
export function definirFournisseurIA(f: FournisseurIA | null, modele = "modele-de-test"): void {
  fournisseur = f ?? (config.mistralCle ? fournisseurMistral(config.mistralCle, config.mistralModele) : null);
  nomModele = f ? modele : config.mistralCle ? config.mistralModele : null;
}
