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
};

const formatDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
export function formaterDateHeure(iso: string): string {
  return formatDate.format(new Date(iso));
}
