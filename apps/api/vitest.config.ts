import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./test/preparation-base.ts"],
    // Les fichiers de test partagent la même base de test : exécution l'un après l'autre.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
