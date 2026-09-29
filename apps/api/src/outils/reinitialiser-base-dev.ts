import { config } from "../config.ts";
import { reinitialiser } from "./migrations.ts";

// Garde-fou : cette commande efface toutes les données. Jamais en production.
if (config.production) {
  console.error("Refusé : la réinitialisation de la base est interdite en production.");
  process.exit(1);
}
const url = new URL(config.databaseOwnerUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
  console.error(`Refusé : la base ${url.hostname} n'est pas une base locale.`);
  process.exit(1);
}
await reinitialiser(config.databaseOwnerUrl, config.appDbPasswordDev);
console.log("Base de développement vidée et recréée : aucun lieu, aucun compte.");
