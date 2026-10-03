import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import type { Base } from "./base.ts";
import { config } from "./config.ts";
import { ErreurMetier, traduireErreurBase } from "./erreurs.ts";
import { NOM_COOKIE } from "./auth/contexte.ts";
import { empreinteJeton } from "./auth/secrets.ts";
import { routesAuth } from "./auth/routes.ts";
import { routesLieu } from "./routes/lieu.ts";
import { routesStands } from "./routes/stands.ts";
import { routesProduits } from "./routes/produits.ts";
import { routesJournal } from "./routes/journal.ts";
import { routesEvenements } from "./routes/evenements.ts";
import { routesCaisse } from "./routes/caisse.ts";
import { routesEquipe } from "./routes/equipe.ts";
import { routesClotures } from "./routes/clotures.ts";
import { routesResultats } from "./routes/resultats.ts";
import { routesPlanning } from "./routes/planning.ts";
import { routesStock } from "./routes/stock.ts";
import { routesStockIngredients } from "./routes/stock-ingredients.ts";
import { routesFideliteCaisse } from "./routes/fidelite-caisse.ts";
import { routesPeriodes } from "./routes/periodes.ts";
import { routesFormation } from "./routes/formation.ts";
import { routesExportComptable } from "./routes/export-comptable.ts";
import { routesClickCollect } from "./routes/click-collect.ts";
import { routesCoutsBuvette } from "./routes/couts-buvette.ts";
import { routesFidelite } from "./routes/fidelite.ts";
import { routesFactures } from "./routes/factures.ts";
import { routesEditeur } from "./routes/editeur.ts";
import { routesRecettes } from "./routes/recettes.ts";
import { lireOptions, optionInactive } from "./options.ts";
import { optionDeLaRoute } from "@flaix/domain";

const METHODES_MODIFIANTES = new Set(["POST", "PUT", "PATCH", "DELETE"]);
/** Routes de configuration, en lecture seule en mode formation. */
const CONFIGURATION = [/^\/api\/(stands|categories|produits|lieu|equipe|appareils|click-collect|couts-buvette|fidelite|ingredients)(\/|$)/, /^\/api\/caisses\/:id(\/appareil)?$/];

export async function construireServeur(base: Base, options: { journaliser?: boolean } = {}): Promise<FastifyInstance> {
  // Derrière le relais https du serveur (Caddy), l'adresse du visiteur est celle transmise par le
  // relais — sinon tout le monde partagerait la même limite de tentatives de connexion.
  const app = Fastify({ logger: options.journaliser ?? true, bodyLimit: 256 * 1024, trustProxy: config.relaisDeConfiance ?? false });

  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  app.decorateRequest("auth", null);

  // Protection contre les requêtes intersites : une modification n'est acceptée qu'en
  // JSON et, si le navigateur annonce son origine, depuis une origine autorisée.
  app.addHook("onRequest", async (req) => {
    if (!METHODES_MODIFIANTES.has(req.method)) return;
    const type = req.headers["content-type"] ?? "";
    if (!type.startsWith("application/json")) {
      throw new ErreurMetier(415, "Requête refusée : format JSON attendu.");
    }
    const origine = req.headers.origin;
    if (origine && !config.originesAutorisees.includes(origine)) {
      throw new ErreurMetier(403, "Requête refusée : origine non autorisée.");
    }
  });

  // Session : le cookie porte un jeton aléatoire ; la base n'en connaît que l'empreinte.
  app.addHook("preHandler", async (req) => {
    const jeton = req.cookies[NOM_COOKIE];
    if (!jeton) return;
    const session = await base.transaction({}, async (c) => {
      const { rows } = await c.query<{
        utilisateur_id: string;
        lieu_id: string;
        role: "directeur" | "operateur" | "verificateur";
        nom: string;
        email: string | null;
        appareil_id: string | null;
        appareil_caisse_id: string | null;
        formation: boolean;
      }>(
        "SELECT * FROM session_valide($1)",
        [empreinteJeton(jeton)],
      );
      return rows[0] ?? null;
    });
    if (session) {
      req.auth = {
        utilisateurId: session.utilisateur_id,
        lieuId: session.lieu_id,
        role: session.role,
        nom: session.nom,
        email: session.email,
        jetonEmpreinte: empreinteJeton(jeton),
        appareilId: session.appareil_id,
        appareilCaisseId: session.appareil_caisse_id,
        formation: session.formation,
      };
    }
    // Mode formation (dossier §15.109) : la configuration est celle du vrai lieu, recopiée à chaque
    // entrée ; elle ne se modifie pas dans le lieu de formation.
    // Options du lieu activées par FlaiX Expert (§15.118) : une option désactivée ferme ses adresses.
    const option = req.auth ? optionDeLaRoute(req.routeOptions.url ?? "") : null;
    if (req.auth && option) {
      const auth = req.auth;
      const options = await base.transaction({ lieuId: auth.lieuId, utilisateurId: auth.utilisateurId }, (c) => lireOptions(c, auth.lieuId));
      if (!options[option]) throw optionInactive(option);
    }
    if (req.auth?.formation && METHODES_MODIFIANTES.has(req.method) && CONFIGURATION.some((r) => r.test(req.routeOptions.url ?? ""))) {
      throw new ErreurMetier(409, "Mode formation : la configuration est celle du vrai lieu et ne se modifie pas ici. Quitte la formation pour la changer.");
    }
  });

  app.setErrorHandler((erreur, req, rep) => {
    if (erreur instanceof ErreurMetier) return rep.code(erreur.statut).send({ erreur: erreur.message });
    if (erreur instanceof ZodError) {
      const premier = erreur.issues[0];
      return rep.code(400).send({ erreur: premier?.message ?? "Données invalides.", champ: premier?.path.join(".") });
    }
    const traduite = traduireErreurBase(erreur);
    if (traduite) return rep.code(traduite.statut).send({ erreur: traduite.message });
    const statut = (erreur as { statusCode?: number }).statusCode;
    if (statut === 429) return rep.code(429).send({ erreur: "Trop de tentatives : réessaie dans quelques minutes." });
    if (statut && statut >= 400 && statut < 500) return rep.code(statut).send({ erreur: "Requête invalide." });
    req.log.error(erreur);
    return rep.code(500).send({ erreur: "Erreur interne du serveur." });
  });

  app.get("/api/sante", async () => ({ ok: true }));

  await app.register(routesAuth, { base });
  await app.register(routesLieu, { base });
  await app.register(routesStands, { base });
  await app.register(routesProduits, { base });
  await app.register(routesJournal, { base });
  await app.register(routesEvenements, { base });
  await app.register(routesCaisse, { base });
  await app.register(routesEquipe, { base });
  await app.register(routesClotures, { base });
  await app.register(routesResultats, { base });
  await app.register(routesPlanning, { base });
  await app.register(routesStock, { base });
  await app.register(routesStockIngredients, { base });
  await app.register(routesFideliteCaisse, { base });
  await app.register(routesPeriodes, { base });
  await app.register(routesFormation, { base });
  await app.register(routesExportComptable, { base });
  await app.register(routesClickCollect, { base });
  await app.register(routesCoutsBuvette, { base });
  await app.register(routesFidelite, { base });
  await app.register(routesFactures, { base });
  await app.register(routesEditeur, { base });
  await app.register(routesRecettes, { base });

  return app;
}
