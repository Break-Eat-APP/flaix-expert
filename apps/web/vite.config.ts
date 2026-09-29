import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En développement, /api est relayé vers le serveur (apps/api, port 3001) :
// l'écran et le serveur partagent la même origine, le cookie de session reste « strict ».
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:3001" },
    },
  },
});
