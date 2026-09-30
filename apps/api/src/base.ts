import pg from "pg";

// bigint → number : les compteurs et totaux restent très en deçà de 2^53 centimes.
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));

export type Client = pg.PoolClient;

export interface Contexte {
  lieuId?: string | null;
  utilisateurId?: string | null;
}

export interface Base {
  pool: pg.Pool;
  /**
   * Toute requête métier passe par une transaction qui pose d'abord le contexte
   * (lieu, utilisateur) : les politiques de sécurité par ligne de PostgreSQL ne
   * laissent alors voir et écrire que les lignes de ce lieu.
   */
  transaction<T>(contexte: Contexte, travail: (client: Client) => Promise<T>): Promise<T>;
  fermer(): Promise<void>;
}

export function ouvrirBase(connectionString: string, max = 10): Base {
  const pool = new pg.Pool({ connectionString, max });
  return {
    pool,
    async transaction(contexte, travail) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "SELECT set_config('app.lieu_id', $1, true), set_config('app.utilisateur_id', $2, true)",
          [contexte.lieuId ?? "", contexte.utilisateurId ?? ""],
        );
        const resultat = await travail(client);
        await client.query("COMMIT");
        return resultat;
      } catch (erreur) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw erreur;
      } finally {
        client.release();
      }
    },
    fermer: () => pool.end(),
  };
}

/**
 * Change le lieu courant jusqu'à la fin de la transaction : seul usage, écrire au journal du
 * lieu de formation et du vrai lieu dans la même transaction (dossier §15.109).
 */
export async function changerLieu(client: Client, lieuId: string): Promise<void> {
  await client.query("SELECT set_config('app.lieu_id', $1, true)", [lieuId]);
}

/** Verrou exclusif le temps de la transaction, sur une clé texte (ex. « jet:<lieu> »). */
export async function verrouiller(client: Client, cle: string): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [cle]);
}
