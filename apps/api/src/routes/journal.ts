import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Base } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { inscrireJet, lireJet, verifierJet } from "../journal-technique.ts";
import { contexte } from "./outils.ts";

const Pagination = z.object({
  limite: z.coerce.number().int().min(1).max(200).default(50),
  avant: z.coerce.number().int().positive().optional(),
});

export async function routesJournal(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/journal-technique", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { limite, avant } = Pagination.parse(req.query);
    return base.transaction(contexte(auth), (c) => lireJet(c, auth.lieuId, limite, avant));
  });

  /** Relit toute la chaîne du lieu et inscrit le résultat de la vérification au journal lui-même. */
  app.post("/api/journal-technique/verification", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const resultat = await verifierJet(c, auth.lieuId);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "verification_integrite",
        utilisateurId: auth.utilisateurId,
        details: {
          ok: resultat.ok && resultat.numerotationContinue,
          maillons: resultat.maillons,
          ...(resultat.ok ? {} : { rupture: resultat.rupture }),
        },
      });
      return resultat;
    });
  });
}
