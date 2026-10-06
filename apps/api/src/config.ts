/**
 * Configuration lue dans l'environnement. En développement, des valeurs par défaut
 * pointent vers la base Docker locale (infra/docker-compose.yml) — ce ne sont pas
 * des secrets. En production, chaque valeur doit être fournie explicitement.
 */
const production = process.env.NODE_ENV === "production";

function lire(nom: string, parDefautDev?: string): string {
  const valeur = process.env[nom];
  if (valeur) return valeur;
  if (!production && parDefautDev !== undefined) return parDefautDev;
  throw new Error(`Variable d'environnement manquante : ${nom}`);
}

const environnement = lire("FLAIX_ENVIRONNEMENT", "developpement");
if (!["developpement", "test", "production"].includes(environnement)) {
  throw new Error(`FLAIX_ENVIRONNEMENT invalide : ${environnement}`);
}
if (production && environnement === "developpement") {
  throw new Error("FLAIX_ENVIRONNEMENT doit valoir « test » ou « production » sur un serveur.");
}

export const config = {
  production,
  /** « test » : serveur de la version test (bandeau permanent, aucune vente réelle). */
  environnement: environnement as "developpement" | "test" | "production",
  port: Number(lire("PORT", "3001")),
  /** Connexion du serveur : rôle `flaix_app`, droits restreints (db/migrations/0001_socle.sql). */
  databaseUrl: lire("DATABASE_URL", "postgres://flaix_app:flaix_app_dev@localhost:5433/flaix"),
  /** Connexion propriétaire : migrations et outils d'administration uniquement, jamais le serveur. */
  databaseOwnerUrl: lire("DATABASE_OWNER_URL", "postgres://flaix_owner:flaix_owner_dev@localhost:5433/flaix"),
  /** Mot de passe posé sur le rôle `flaix_app` à chaque migration (développement uniquement). */
  appDbPasswordDev: production ? null : lire("APP_DB_PASSWORD", "flaix_app_dev"),
  /** Origines autorisées à envoyer des requêtes de modification (protection contre les requêtes intersites). */
  originesAutorisees: lire("ORIGINES_AUTORISEES", "http://localhost:5173,http://127.0.0.1:5173").split(","),
  dureeSessionHeures: Number(lire("DUREE_SESSION_HEURES", "12")),
  cookieSecurise: production,
  /**
   * Adresse du relais https de confiance (ex. « 127.0.0.1 » quand Caddy tourne sur le même serveur).
   * Seul ce relais peut indiquer l'adresse réelle du visiteur ; vide = aucun relais, on ne croit personne.
   */
  relaisDeConfiance: process.env.RELAIS_DE_CONFIANCE || null,
  /**
   * Clé de l'API Mistral (assistant et brief reformulé, §15.136), réglée par Rémi sur le serveur avec
   * `sudo flaix-admin cle-mistral` ; absente = pas d'IA, tout le reste fonctionne.
   */
  mistralCle: process.env.MISTRAL_API_KEY || null,
  mistralModele: process.env.MISTRAL_MODELE || "mistral-medium-latest",
  /** Secours si Mistral ne répond pas (§15.137) : OVHcloud AI Endpoints, réglé avec `sudo flaix-admin cle-ovh-ia`. */
  ovhIaJeton: process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN || null,
  ovhIaModele: process.env.OVH_AI_MODELE || "Mistral-Small-3.2-24B-Instruct-2506",
  /**
   * Prix de l'IA en euros hors taxes par million de jetons, pour le compteur de consommation du back-office (§15.149).
   * Par défaut, le tarif relevé le 2026-10-06 pour Mistral Small 3.2 chez OVHcloud (arrondi au-dessus) ; à corriger dans
   * /etc/flaix/flaix.env (IA_PRIX_ENTREE_MILLION, IA_PRIX_SORTIE_MILLION) si OVHcloud change ses prix.
   */
  iaPrixEntree: Number(process.env.IA_PRIX_ENTREE_MILLION || 0.1),
  iaPrixSortie: Number(process.env.IA_PRIX_SORTIE_MILLION || 0.31),
  /**
   * E-mails par Brevo (§15.146) : clé d'API et adresse d'expédition, réglées par Rémi avec
   * `sudo flaix-admin cle-brevo` ; absentes = aucun e-mail ne part, tout le reste fonctionne.
   */
  brevoCle: process.env.BREVO_API_KEY || null,
  brevoExpediteur: process.env.BREVO_EXPEDITEUR || null,
  /**
   * Carte abonné dans Apple Wallet et Google Wallet (§15.147) : identifiants (non secrets) posés par
   * `flaix-admin wallet-apple-certificat` et `flaix-admin wallet-google` ; clés et certificats dans ce dossier.
   */
  walletDossier: process.env.WALLET_DOSSIER || "/etc/flaix/wallet",
  walletAppleTeamId: process.env.WALLET_APPLE_TEAM_ID || null,
  walletApplePassTypeId: process.env.WALLET_APPLE_PASS_TYPE_ID || null,
  walletGoogleIssuerId: process.env.WALLET_GOOGLE_ISSUER_ID || null,
} as const;
