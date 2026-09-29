import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionInfo } from "@flaix/domain";
import { api, ErreurApi } from "./api.ts";

/** Session courante ; `null` quand personne n'est connecté. */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api.get<SessionInfo>("/auth/session");
      } catch (e) {
        if (e instanceof ErreurApi && e.statut === 401) return null;
        throw e;
      }
    },
    staleTime: 60_000,
  });
}

export function useDeconnexion() {
  const client = useQueryClient();
  return async () => {
    await api.post("/auth/deconnexion").catch(() => undefined);
    client.clear();
    client.setQueryData(["session"], null);
  };
}
