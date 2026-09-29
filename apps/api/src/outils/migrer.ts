import { config } from "../config.ts";
import { migrer } from "./migrations.ts";

const appliquees = await migrer(config.databaseOwnerUrl, config.appDbPasswordDev);
console.log(appliquees.length ? `${appliquees.length} migration(s) appliquée(s).` : "Base déjà à jour.");
