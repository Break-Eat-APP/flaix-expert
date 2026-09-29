import { reinitialiser } from "../src/outils/migrations.ts";
import { MOT_DE_PASSE_APP_TEST, URL_PROPRIETAIRE_TEST } from "./aide.ts";

/** Avant toute la suite : base de test vidée puis recréée depuis les migrations. */
export default async function () {
  await reinitialiser(URL_PROPRIETAIRE_TEST, MOT_DE_PASSE_APP_TEST, () => undefined);
}
