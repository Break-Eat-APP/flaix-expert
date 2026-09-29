import { ouvrirBase } from "./base.ts";
import { config } from "./config.ts";
import { construireServeur } from "./serveur.ts";

const base = ouvrirBase(config.databaseUrl);
const app = await construireServeur(base);

try {
  await app.listen({ port: config.port, host: config.production ? "0.0.0.0" : "127.0.0.1" });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await base.fermer();
    process.exit(0);
  });
}
