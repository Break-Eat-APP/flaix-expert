import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionInfo } from "@flaix/domain";
import { api, ErreurApi } from "./api.ts";

/**
 * Dernière session connue, gardée sur l'appareil : sans réseau, l'application s'ouvre encore et
 * l'écran de caisse continue à vendre avec sa mémoire (§15.97). Ce n'est pas un secret : le cookie
 * de session, lui, reste inaccessible au navigateur (httpOnly) et c'est lui que le serveur vérifie.
 */
const CLE_SESSION = "flaix.session";

function lireSessionConnue(): SessionInfo | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    return brut ? (JSON.parse(brut) as SessionInfo) : null;
  } catch {
    return null;
  }
}

function oublierSession() {
  try {
    localStorage.removeItem(CLE_SESSION);
  } catch {
    /* rien à oublier */
  }
}

/** Absence de réseau (et non refus du serveur) : fetch impossible, ou serveur injoignable derrière le relais. */
const horsLigne = (e: unknown) => !(e instanceof ErreurApi) || e.statut === 502 || e.statut === 504;

/** Session courante ; `null` quand personne n'est connecté. */
export function useSession() {
  const requete = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api.get<SessionInfo>("/auth/session");
      } catch (e) {
        if (e instanceof ErreurApi && e.statut === 401) {
          oublierSession();
          return null;
        }
        // Pas de réseau : on continue avec la dernière session connue, sans attendre.
        const connue = horsLigne(e) ? lireSessionConnue() : null;
        if (connue) return connue;
        throw e;
      }
    },
    retry: (n, e) => !horsLigne(e) && !(e instanceof ErreurApi && e.statut < 500) && n < 2,
    staleTime: 60_000,
  });

  // Gardée à chaque changement, d'où qu'elle vienne (lecture au serveur ou écran de connexion).
  const session = requete.data;
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(CLE_SESSION, JSON.stringify(session));
    } catch {
      /* appareil sans mémoire disponible : l'application marche, sans mode hors ligne */
    }
  }, [session]);

  return requete;
}

export function useDeconnexion() {
  const client = useQueryClient();
  return async () => {
    await api.post("/auth/deconnexion").catch(() => undefined);
    oublierSession();
    client.clear();
    client.setQueryData(["session"], null);
  };
}
