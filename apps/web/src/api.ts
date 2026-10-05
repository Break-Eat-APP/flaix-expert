/** Appels au serveur. Toute erreur renvoie le message en français fourni par le serveur. */
export class ErreurApi extends Error {
  constructor(
    public readonly statut: number,
    message: string,
  ) {
    super(message);
  }
}

async function requete<T>(methode: string, chemin: string, corps?: unknown): Promise<T> {
  const reponse = await fetch(`/api${chemin}`, {
    method: methode,
    credentials: "same-origin",
    headers: methode === "GET" ? {} : { "Content-Type": "application/json" },
    body: methode === "GET" ? undefined : JSON.stringify(corps ?? {}),
  });
  const texte = await reponse.text();
  const donnees = texte ? JSON.parse(texte) : null;
  if (!reponse.ok) {
    const message = donnees?.erreur ?? (reponse.status === 502 || reponse.status === 504 ? "Le serveur ne répond pas." : `Erreur ${reponse.status}`);
    throw new ErreurApi(reponse.status, message);
  }
  return donnees as T;
}

export const api = {
  get: <T>(chemin: string) => requete<T>("GET", chemin),
  post: <T>(chemin: string, corps?: unknown) => requete<T>("POST", chemin, corps),
  put: <T>(chemin: string, corps?: unknown) => requete<T>("PUT", chemin, corps),
  patch: <T>(chemin: string, corps?: unknown) => requete<T>("PATCH", chemin, corps),
  supprimer: <T>(chemin: string) => requete<T>("DELETE", chemin),
};

/**
 * Fichier produit par le serveur (export comptable) : envoyé en POST, enregistré sous le nom donné
 * par le serveur. Une erreur renvoie le message en français, comme les autres appels.
 */
export async function telechargerFichier(chemin: string, corps: unknown): Promise<string> {
  const reponse = await fetch(`/api${chemin}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!reponse.ok) {
    const texte = await reponse.text();
    const message = (texte ? (JSON.parse(texte) as { erreur?: string }).erreur : null) ?? `Erreur ${reponse.status}`;
    throw new ErreurApi(reponse.status, message);
  }
  const nom = /filename="([^"]+)"/.exec(reponse.headers.get("content-disposition") ?? "")?.[1] ?? "export.csv";
  const url = URL.createObjectURL(await reponse.blob());
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return nom;
}

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
export function formaterDateHeure(iso: string): string {
  return formatDate.format(new Date(iso));
}
