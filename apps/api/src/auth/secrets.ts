import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

/** Paramètres argon2id recommandés par l'OWASP (19 Mio de mémoire, 2 passes). */
const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const LONGUEUR_MIN_MOT_DE_PASSE = 12;

export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return hash(motDePasse, ARGON2);
}

export async function verifierMotDePasse(empreinte: string, motDePasse: string): Promise<boolean> {
  try {
    return await verify(empreinte, motDePasse);
  } catch {
    return false;
  }
}

// Empreinte factice : quand l'e-mail est inconnu, on vérifie quand même un mot de passe
// pour que le temps de réponse ne révèle pas si un compte existe.
let empreinteFactice: Promise<string> | null = null;
export function empreinteLeurre(): Promise<string> {
  empreinteFactice ??= hacherMotDePasse(randomBytes(16).toString("hex"));
  return empreinteFactice;
}

/** Mot de passe provisoire lisible, remis une seule fois par l'outil d'administration. */
export function genererMotDePasseProvisoire(): string {
  return randomBytes(15).toString("base64url");
}

export function nouveauJetonSession(): { jeton: string; empreinte: string } {
  const jeton = randomBytes(32).toString("base64url");
  return { jeton, empreinte: empreinteJeton(jeton) };
}

export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton, "utf8").digest("hex");
}
