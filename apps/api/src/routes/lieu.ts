import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Lieu } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { contexte, corps, differences, texte, texteFacultatif } from "./outils.ts";

// Identité de l'exploitant : ces mentions figureront sur chaque ticket (BOFiP §50)
// et sur l'attestation de conformité.
const Identite = z.object({
  nom: texte(120, "Le nom du lieu"),
  raisonSociale: texteFacultatif(200),
  siret: texteFacultatif(20)
    .transform((v) => (v ? v.replace(/\s/g, "") : null))
    .refine((v) => v === null || /^\d{14}$/.test(v), "Le SIRET compte 14 chiffres."),
  tvaIntracom: texteFacultatif(20)
    .transform((v) => (v ? v.replace(/\s/g, "").toUpperCase() : null))
    .refine((v) => v === null || /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(v), "N° de TVA intracommunautaire invalide (ex. FR12345678901)."),
  adresse: texteFacultatif(300),
  codePostal: texteFacultatif(10),
  ville: texteFacultatif(120),
});

async function lireLieu(c: Client, lieuId: string): Promise<Lieu> {
  const { rows } = await c.query(
    `SELECT id, nom, raison_sociale, siret, tva_intracom, adresse, code_postal, ville FROM lieu WHERE id = $1`,
    [lieuId],
  );
  const l = rows[0];
  if (!l) throw introuvable("Lieu");
  return {
    id: l.id,
    nom: l.nom,
    raisonSociale: l.raison_sociale,
    siret: l.siret,
    tvaIntracom: l.tva_intracom,
    adresse: l.adresse,
    codePostal: l.code_postal,
    ville: l.ville,
  };
}

export async function routesLieu(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/lieu", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireLieu(c, auth.lieuId));
  });

  app.put("/api/lieu", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const identite = corps(Identite, req);
    return base.transaction(contexte(auth), async (c) => {
      const { id: _id, ...avant } = await lireLieu(c, auth.lieuId);
      const modifications = differences(avant, identite);
      if (Object.keys(modifications).length === 0) return lireLieu(c, auth.lieuId);
      await c.query(
        `UPDATE lieu SET nom = $2, raison_sociale = $3, siret = $4, tva_intracom = $5,
                         adresse = $6, code_postal = $7, ville = $8
          WHERE id = $1`,
        [auth.lieuId, identite.nom, identite.raisonSociale, identite.siret, identite.tvaIntracom, identite.adresse, identite.codePostal, identite.ville],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "lieu_identite_modifiee",
        utilisateurId: auth.utilisateurId,
        details: { modifications },
      });
      return lireLieu(c, auth.lieuId);
    });
  });
}
