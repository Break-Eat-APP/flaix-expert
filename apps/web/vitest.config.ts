import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Tests des écrans (audit Codex du 2026-10-04, P2-004) : dans un navigateur simulé (jsdom).
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
});
