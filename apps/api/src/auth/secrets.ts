import { createHash, randomBytes, randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

/** Paramètres argon2id recommandés par l'OWASP (19 Mio de mémoire, 2 passes). */
const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

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

// Sans caractères qui se confondent (0/o, 1/l/i) : le mot de passe provisoire se dicte au téléphone.
const ALPHABET_PROVISOIRE = "abcdefghjkmnpqrstuvwxyz23456789";

/** Mot de passe provisoire lisible (« k7mq-4xtp-9rwe », environ 59 bits), remis une seule fois. */
export function genererMotDePasseProvisoire(): string {
  const groupe = () => Array.from({ length: 4 }, () => ALPHABET_PROVISOIRE[randomInt(ALPHABET_PROVISOIRE.length)]).join("");
  return [groupe(), groupe(), groupe()].join("-");
}

export function nouveauJetonSession(): { jeton: string; empreinte: string } {
  const jeton = randomBytes(32).toString("base64url");
  return { jeton, empreinte: empreinteJeton(jeton) };
}

export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton, "utf8").digest("hex");
}
