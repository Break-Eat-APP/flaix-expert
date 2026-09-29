import { randomUUID } from "node:crypto";
import { ouvrirBase, type Base } from "../src/base.ts";
import { hacherMotDePasse } from "../src/auth/secrets.ts";
import { inscrireJet } from "../src/journal-technique.ts";

// Base dédiée aux tests (créée par infra/postgres/init) : jamais la base de développement.
export const URL_PROPRIETAIRE_TEST = process.env.DATABASE_OWNER_URL_TEST ?? "postgres://flaix_owner:flaix_owner_dev@localhost:5433/flaix_test";
export const URL_APP_TEST = process.env.DATABASE_URL_TEST ?? "postgres://flaix_app:flaix_app_dev@localhost:5433/flaix_test";
export const MOT_DE_PASSE_APP_TEST = "flaix_app_dev";
export const MOT_DE_PASSE_TEST = "mot-de-passe-de-test-local";

export function basesDeTest(): { proprietaire: Base; app: Base } {
  return { proprietaire: ouvrirBase(URL_PROPRIETAIRE_TEST, 2), app: ouvrirBase(URL_APP_TEST, 4) };
}

/** Crée un lieu vide et son directeur, comme le fait l'outil d'administration. */
export async function creerLieuDeTest(
  proprietaire: Base,
  role: "directeur" | "operateur" = "directeur",
): Promise<{ lieuId: string; utilisateurId: string; email: string }> {
  const suffixe = randomUUID().slice(0, 8);
  const email = `${role}-${suffixe}@test.local`;
  const hash = await hacherMotDePasse(MOT_DE_PASSE_TEST);
  return proprietaire.transaction({}, async (c) => {
    const { rows: l } = await c.query<{ id: string }>("INSERT INTO lieu (nom) VALUES ($1) RETURNING id", [`Lieu de test ${suffixe}`]);
    const lieuId = l[0]!.id;
    const { rows: u } = await c.query<{ id: string }>(
      "INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id",
      [email, `Personne test ${suffixe}`, hash],
    );
    const utilisateurId = u[0]!.id;
    await c.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, $3)", [lieuId, utilisateurId, role]);
    await inscrireJet(c, { lieuId, type: "lieu_cree", utilisateurId: null, details: { par: "test" } });
    return { lieuId, utilisateurId, email };
  });
}

/** Ajoute un compte à un lieu existant. */
export async function ajouterMembre(proprietaire: Base, lieuId: string, role: "directeur" | "operateur"): Promise<{ utilisateurId: string; email: string }> {
  const email = `${role}-${randomUUID().slice(0, 8)}@test.local`;
  const hash = await hacherMotDePasse(MOT_DE_PASSE_TEST);
  return proprietaire.transaction({}, async (c) => {
    const { rows } = await c.query<{ id: string }>("INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES ($1, $2, $3) RETURNING id", [
      email,
      `Membre ${role}`,
      hash,
    ]);
    await c.query("INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES ($1, $2, $3)", [lieuId, rows[0]!.id, role]);
    return { utilisateurId: rows[0]!.id, email };
  });
}

/** Code d'erreur PostgreSQL d'une promesse rejetée (42501 = droit refusé, 23505 = doublon…). */
export async function codeErreur(promesse: Promise<unknown>): Promise<string | undefined> {
  try {
    await promesse;
    return undefined;
  } catch (e) {
    return (e as { code?: string }).code ?? "inconnu";
  }
}
