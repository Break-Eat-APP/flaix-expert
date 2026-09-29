import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.tsx";
import { ErreurApi } from "./api.ts";
import "./styles.css";

const client: QueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: (n, e) => !(e instanceof ErreurApi && e.statut < 500) && n < 2, refetchOnWindowFocus: false },
  },
  // Session expirée pendant l'utilisation : retour à l'écran de connexion.
  queryCache: new QueryCache({
    onError: (e) => {
      if (e instanceof ErreurApi && e.statut === 401) client.setQueryData(["session"], null);
    },
  }),
});

createRoot(document.getElementById("racine")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
