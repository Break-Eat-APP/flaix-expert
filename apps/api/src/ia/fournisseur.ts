import { config } from "../config.ts";

/*
 * Passerelle vers les modèles d'IA (dossier §15.136, §15.137). FlaiX garde l'agent — ses outils, ses
 * consignes, le contrôle des chiffres et la trace — et ne fait qu'emprunter un modèle pour rédiger :
 * Mistral d'abord (décision de Rémi du 2026-10-04), OVHcloud AI Endpoints en secours (hébergé en Europe,
 * même compte OVH que le serveur). Les deux parlent la même interface « chat/completions » avec outils :
 * changer de modèle, c'est changer une adresse, pas réécrire l'agent. Sans aucune clé réglée sur le
 * serveur, l'IA est simplement absente : rien ne casse.
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
  /** Modèle qui a répondu, avec son fournisseur (« mistral-medium-latest (Mistral) »). */
  modele: string;
  jetons: { entree: number; sortie: number } | null;
}

export type FournisseurIA = (messages: MessageIA[], outils?: OutilIA[]) => Promise<ReponseIA>;

/** Une API compatible « chat/completions » avec outils : Mistral, OVHcloud AI Endpoints, un serveur local plus tard. */
export function fournisseurCompatible(adresse: string, cle: string, modele: string, nom: string): FournisseurIA {
  return async (messages, outils) => {
    const r = await fetch(`${adresse}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({ model: modele, messages, ...(outils?.length ? { tools: outils, tool_choice: "auto" } : {}), temperature: 0.2, max_tokens: 900 }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) throw new Error(`${nom} a répondu ${r.status}`);
    const d = (await r.json()) as {
      model?: string;
      choices: { message: { content: string | null; tool_calls?: AppelOutil[] } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const m = d.choices[0]!.message;
    return {
      message: { content: m.content ?? "", tool_calls: m.tool_calls?.map((t) => ({ ...t, type: "function" as const })) },
      modele: `${d.model ?? modele} (${nom})`,
      jetons: d.usage ? { entree: d.usage.prompt_tokens, sortie: d.usage.completion_tokens } : null,
    };
  };
}

/** Essaie chaque fournisseur dans l'ordre : le suivant prend le relais si le précédent ne répond pas. */
export function passerelleIA(fournisseurs: readonly FournisseurIA[]): FournisseurIA {
  return async (messages, outils) => {
    let derniere: unknown = new Error("aucun fournisseur d'IA");
    for (const f of fournisseurs) {
      try {
        return await f(messages, outils);
      } catch (erreur) {
        derniere = erreur;
      }
    }
    throw derniere;
  };
}

function depuisConfig(): { passerelle: FournisseurIA | null; modeles: string[] } {
  const liste: { f: FournisseurIA; nom: string }[] = [];
  if (config.mistralCle) liste.push({ f: fournisseurCompatible("https://api.mistral.ai/v1", config.mistralCle, config.mistralModele, "Mistral"), nom: `${config.mistralModele} (Mistral)` });
  if (config.ovhIaJeton) liste.push({ f: fournisseurCompatible("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1", config.ovhIaJeton, config.ovhIaModele, "OVHcloud, secours"), nom: `${config.ovhIaModele} (OVHcloud, secours)` });
  return { passerelle: liste.length ? passerelleIA(liste.map((x) => x.f)) : null, modeles: liste.map((x) => x.nom) };
}

let reglage = depuisConfig();

/** La passerelle réglée, ou null si aucune clé n'est réglée sur le serveur. */
export const fournisseurIA = (): FournisseurIA | null => reglage.passerelle;
/** Les modèles branchés, dans l'ordre où ils sont essayés. */
export const modeleIA = (): string | null => (reglage.modeles.length ? reglage.modeles.join(", puis ") : null);

/** Tests : remplacer la passerelle (null : revenir à la configuration du serveur). */
export function definirFournisseurIA(f: FournisseurIA | null, modele = "modele-de-test"): void {
  reglage = f ? { passerelle: f, modeles: [modele] } : depuisConfig();
}
