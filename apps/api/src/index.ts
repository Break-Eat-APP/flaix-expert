import { ouvrirBase } from "./base.ts";
import { config } from "./config.ts";
import { construireServeur } from "./serveur.ts";
import { relancerCartes } from "./routes/wallet.ts";

const base = ouvrirBase(config.databaseUrl);
const app = await construireServeur(base);

try {
  // Écoute locale seulement, en production aussi : Caddy, sur la même machine, relaie vers 127.0.0.1:3001
  // (infra/vps/deployer.sh) ; rien d'autre n'a à joindre ce port (audit du 2026-10-05, P3-2).
  await app.listen({ port: config.port, host: "127.0.0.1" });
} catch (erreur) {
  app.log.error(erreur);
  process.exit(1);
}

// Cartes wallet dont l'envoi à Apple ou à Google a échoué passagèrement : renvoyées toutes les 5 minutes
// (audit Codex du 2026-10-05).
const relance = setInterval(() => {
  relancerCartes(base, app.log).catch((erreur) => app.log.error({ err: erreur }, "relance des cartes wallet impossible"));
}, 5 * 60_000);
relance.unref();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    clearInterval(relance);
    await app.close();
    await base.fermer();
    process.exit(0);
  });
}
