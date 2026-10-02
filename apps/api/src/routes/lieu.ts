import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Lieu, OptionsLieu } from "@flaix/domain";
import { lireOptions } from "../options.ts";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur, exigerSession } from "../auth/contexte.ts";
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
    `SELECT id, nom, raison_sociale, siret, tva_intracom, adresse, code_postal, ville, remise_abonne_pb, seuil_ecart_especes_centimes FROM lieu WHERE id = $1`,
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
    remiseAbonnePb: l.remise_abonne_pb,
    seuilEcartEspeces: l.seuil_ecart_especes_centimes,
  };
}

// Tolérance d'écart au comptage du tiroir (module 7, §15.102) : au-delà, motif obligatoire.
const SeuilEspeces = z.object({ seuilCentimes: z.number().int().min(0, "Tolérance invalide.").max(100_000, "Tolérance trop élevée (1 000 € au plus).") });

// Réglage de caisse du lieu : la remise contractuelle des abonnés (§14 module 1, ajout du 11/09).
const ReglagesCaisse = z.object({
  remiseAbonnePb: z.number().int().min(1, "Taux de remise abonné invalide.").max(10_000).nullable(),
});

export async function routesLieu(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/lieu", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireLieu(c, auth.lieuId));
  });

  app.put("/api/lieu", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const identite = corps(Identite, req);
    return base.transaction(contexte(auth), async (c) => {
      const { id: _id, remiseAbonnePb: _r, seuilEcartEspeces: _s, ...avant } = await lireLieu(c, auth.lieuId);
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

  // Options activées par FlaiX Expert (§15.118) : l'écran n'affiche que celles-là.
  app.get("/api/lieu/options", async (req): Promise<OptionsLieu> => {
    const auth = exigerSession(req);
    return base.transaction(contexte(auth), (c) => lireOptions(c, auth.lieuId));
  });

  app.put("/api/lieu/reglages-caisse", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { remiseAbonnePb } = corps(ReglagesCaisse, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireLieu(c, auth.lieuId);
      if (avant.remiseAbonnePb !== remiseAbonnePb) {
        await c.query("UPDATE lieu SET remise_abonne_pb = $2 WHERE id = $1", [auth.lieuId, remiseAbonnePb]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "reglages_caisse_modifies",
          utilisateurId: auth.utilisateurId,
          details: { modifications: { remiseAbonnePb: { avant: avant.remiseAbonnePb, apres: remiseAbonnePb } } },
        });
      }
      return lireLieu(c, auth.lieuId);
    });
  });

  app.put("/api/lieu/seuil-especes", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { seuilCentimes } = corps(SeuilEspeces, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireLieu(c, auth.lieuId);
      if (avant.seuilEcartEspeces !== seuilCentimes) {
        await c.query("UPDATE lieu SET seuil_ecart_especes_centimes = $2 WHERE id = $1", [auth.lieuId, seuilCentimes]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "seuil_especes_modifie",
          utilisateurId: auth.utilisateurId,
          details: { modifications: { seuilEcartEspeces: { avant: avant.seuilEcartEspeces, apres: seuilCentimes } } },
        });
      }
      return lireLieu(c, auth.lieuId);
    });
  });
}
