import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const DOSSIER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../db/migrations");

/**
 * Applique les migrations SQL de db/migrations dans l'ordre, chacune dans sa transaction.
 * Une migration déjà appliquée ne doit plus jamais changer : son empreinte est
 * enregistrée et comparée à chaque passage (le schéma fait partie du dossier de conformité).
 */
export async function migrer(urlProprietaire: string, motDePasseApp: string | null, journal = console.log): Promise<string[]> {
  const client = new pg.Client({ connectionString: urlProprietaire });
  await client.connect();
  const appliquees: string[] = [];
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      nom text PRIMARY KEY,
      empreinte text NOT NULL,
      appliquee_le timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query<{ nom: string; empreinte: string }>("SELECT nom, empreinte FROM schema_migrations");
    const deja = new Map(rows.map((r) => [r.nom, r.empreinte]));
    const fichiers = (await readdir(DOSSIER)).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();

    for (const fichier of fichiers) {
      const sql = await readFile(path.join(DOSSIER, fichier), "utf8");
      const empreinte = createHash("sha256").update(sql, "utf8").digest("hex");
      const connue = deja.get(fichier);
      if (connue) {
        if (connue !== empreinte) {
          throw new Error(`La migration ${fichier} a été modifiée après avoir été appliquée. Écris une nouvelle migration au lieu de modifier celle-ci.`);
        }
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (nom, empreinte) VALUES ($1, $2)", [fichier, empreinte]);
        await client.query("COMMIT");
      } catch (erreur) {
        await client.query("ROLLBACK");
        throw new Error(`Échec de la migration ${fichier} : ${(erreur as Error).message}`);
      }
      appliquees.push(fichier);
      journal(`✓ ${fichier}`);
    }

    if (motDePasseApp) {
      // Développement uniquement : en production le mot de passe du rôle est posé par l'hébergeur.
      await client.query(`ALTER ROLE flaix_app WITH LOGIN PASSWORD '${motDePasseApp.replace(/'/g, "''")}'`);
    }
  } finally {
    await client.end();
  }
  return appliquees;
}

/** Développement et tests uniquement : efface tout le schéma puis réapplique les migrations. */
export async function reinitialiser(urlProprietaire: string, motDePasseApp: string | null, journal = console.log): Promise<void> {
  const client = new pg.Client({ connectionString: urlProprietaire });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  } finally {
    await client.end();
  }
  await migrer(urlProprietaire, motDePasseApp, journal);
}
