import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Evenement } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { restesDuMatch } from "./stock.ts";
import { figerConsommationIngredients } from "./stock-ingredients.ts";
import { figerRapportSoiree } from "./rapport-soiree.ts";
import { exigerMoisOuvert, zDuMatch } from "./periodes.ts";
import { ParamId, contexte, corps, differences, texte } from "./outils.ts";

// Calendrier des événements (dossier §15.94) : une seule liste pour tout le lieu.
const Spectateurs = z.number().int().min(0, "Nombre de spectateurs invalide.").max(500_000).nullable();
const NouvelEvenement = z.object({
  libelle: texte(120, "Le libellé de l'événement"),
  debut: z.string().datetime({ offset: true, message: "Date et heure de l'événement invalides." }),
  spectateurs: Spectateurs.default(null),
});
const ModifEvenement = z.object({
  libelle: texte(120, "Le libellé de l'événement").optional(),
  debut: z.string().datetime({ offset: true, message: "Date et heure de l'événement invalides." }).optional(),
  spectateurs: Spectateurs.optional(),
});

interface LigneEvenement {
  id: string;
  libelle: string;
  debut: Date;
  spectateurs: number | null;
  etat: Evenement["etat"];
  ouvert_le: Date | null;
  clos_le: Date | null;
  caisses_ouvertes: number;
}

const versEvenement = (e: LigneEvenement): Evenement => ({
  id: e.id,
  libelle: e.libelle,
  debut: e.debut.toISOString(),
  spectateurs: e.spectateurs,
  etat: e.etat,
  ouvertLe: e.ouvert_le?.toISOString() ?? null,
  closLe: e.clos_le?.toISOString() ?? null,
  caissesOuvertes: e.caisses_ouvertes,
});

const SELECT_EVENEMENT = `
  SELECT e.id, e.libelle, e.debut, e.spectateurs, e.etat, e.ouvert_le, e.clos_le,
         (SELECT count(*)::int FROM session_caisse s WHERE s.evenement_id = e.id AND s.fermee_le IS NULL) AS caisses_ouvertes
    FROM evenement e`;

export async function listerEvenements(c: Client, lieuId: string): Promise<Evenement[]> {
  const { rows } = await c.query<LigneEvenement>(`${SELECT_EVENEMENT} WHERE e.lieu_id = $1 ORDER BY e.debut DESC`, [lieuId]);
  return rows.map(versEvenement);
}

/** Lit un événement en le verrouillant d'abord : deux ouvertures ou clôtures simultanées ne peuvent pas se croiser. */
async function lireEvenement(c: Client, lieuId: string, id: string): Promise<LigneEvenement> {
  await c.query("SELECT 1 FROM evenement WHERE lieu_id = $1 AND id = $2 FOR UPDATE", [lieuId, id]);
  const { rows } = await c.query<LigneEvenement>(`${SELECT_EVENEMENT} WHERE e.lieu_id = $1 AND e.id = $2`, [lieuId, id]);
  if (!rows[0]) throw introuvable("Événement");
  return rows[0];
}

export async function routesEvenements(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/evenements", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerEvenements(c, auth.lieuId));
  });

  app.post("/api/evenements", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const e = corps(NouvelEvenement, req);
    const liste = await base.transaction(contexte(auth), async (c) => {
      // Un mois clôturé ne reçoit plus d'événement (§15.107).
      await exigerMoisOuvert(c, auth.lieuId, new Date(e.debut).toISOString());
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO evenement (lieu_id, libelle, debut, spectateurs) VALUES ($1, $2, $3, $4) RETURNING id",
        [auth.lieuId, e.libelle, e.debut, e.spectateurs],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "evenement_cree",
        utilisateurId: auth.utilisateurId,
        details: { evenementId: rows[0]!.id, libelle: e.libelle, debut: new Date(e.debut).toISOString(), spectateurs: e.spectateurs },
      });
      return listerEvenements(c, auth.lieuId);
    });
    rep.code(201);
    return liste;
  });

  app.patch("/api/evenements/:id", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifEvenement, req);
    return base.transaction(contexte(auth), async (c) => {
      const e = await lireEvenement(c, auth.lieuId, id);
      const avant = { libelle: e.libelle, debut: e.debut.toISOString(), spectateurs: e.spectateurs };
      const voulu = { ...demande, ...(demande.debut ? { debut: new Date(demande.debut).toISOString() } : {}) };
      const modifications = differences(avant, voulu);
      if (Object.keys(modifications).length === 0) return listerEvenements(c, auth.lieuId);
      if (e.etat !== "a_venir" && ("libelle" in modifications || "debut" in modifications)) {
        throw new ErreurMetier(409, "Le libellé et la date ne se modifient plus une fois l'événement ouvert. Seul le nombre de spectateurs peut être complété.");
      }
      const apres = { ...avant, ...Object.fromEntries(Object.entries(voulu).filter(([, v]) => v !== undefined)) };
      if ("debut" in modifications) await exigerMoisOuvert(c, auth.lieuId, apres.debut as string);
      await c.query("UPDATE evenement SET libelle = $3, debut = $4, spectateurs = $5 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        apres.libelle,
        apres.debut,
        apres.spectateurs,
      ]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "evenement_modifie",
        utilisateurId: auth.utilisateurId,
        details: { evenementId: id, match: e.libelle, modifications },
      });
      return listerEvenements(c, auth.lieuId);
    });
  });

  app.post("/api/evenements/:id/ouverture", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const e = await lireEvenement(c, auth.lieuId, id);
      if (e.etat !== "a_venir") throw new ErreurMetier(409, "Cet événement n'est pas « à venir ».");
      await exigerMoisOuvert(c, auth.lieuId, e.debut.toISOString());
      const { rows } = await c.query<{ libelle: string }>("SELECT libelle FROM evenement WHERE lieu_id = $1 AND etat = 'ouvert'", [auth.lieuId]);
      if (rows[0]) throw new ErreurMetier(409, `L'événement « ${rows[0].libelle} » est encore ouvert : clos-le d'abord.`);
      await c.query("UPDATE evenement SET etat = 'ouvert', ouvert_le = now() WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "evenement_ouvert", utilisateurId: auth.utilisateurId, details: { evenementId: id, match: e.libelle } });
      return listerEvenements(c, auth.lieuId);
    });
  });

  app.post("/api/evenements/:id/cloture", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const e = await lireEvenement(c, auth.lieuId, id);
      if (e.etat !== "ouvert") throw new ErreurMetier(409, "Seul un événement ouvert peut être clos.");
      if (e.caisses_ouvertes > 0) {
        throw new ErreurMetier(409, `${e.caisses_ouvertes} caisse(s) encore ouverte(s) sur cet événement : clôture-les d'abord.`);
      }
      // Chaque tiroir (session qui accepte les espèces) doit avoir son Z avant la clôture de l'événement (§15.102).
      const { rows: sansZ } = await c.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM session_caisse s
          WHERE s.lieu_id = $1 AND s.evenement_id = $2 AND s.fond_centimes IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM comptage_especes ce WHERE ce.session_id = s.id AND ce.type = 'comptage')`,
        [auth.lieuId, id],
      );
      if (sansZ[0]!.n > 0) {
        throw new ErreurMetier(409, `${sansZ[0]!.n} tiroir(s) sans Z : compte les espèces dans Clôtures → Clôture de l'événement avant de clore l'événement.`);
      }
      // Espèces remontées au coffre pendant l'événement : le coffre doit avoir son Z (§15.106).
      const { rows: coffre } = await c.query<{ remonte: number; compte: boolean }>(
        `SELECT coalesce((SELECT sum(montant_centimes) FROM sortie_especes WHERE lieu_id = $1 AND evenement_id = $2), 0)::int AS remonte,
                EXISTS (SELECT 1 FROM comptage_coffre WHERE lieu_id = $1 AND evenement_id = $2 AND type = 'comptage') AS compte`,
        [auth.lieuId, id],
      );
      if (coffre[0]!.remonte !== 0 && !coffre[0]!.compte) {
        throw new ErreurMetier(409, "Des espèces ont été remontées au coffre : compte le coffre dans Clôtures → Clôture de l'événement avant de clore l'événement.");
      }
      // Événement avec une mise en place ou un réassort : chaque produit concerné doit être compté (§15.105).
      const restes = await restesDuMatch(c, auth.lieuId, (await listerEvenements(c, auth.lieuId)).find((x) => x.id === id)!);
      if (restes.requis && restes.manquants > 0) {
        throw new ErreurMetier(409, `${restes.manquants} produit(s) ou ingrédient(s) de stock pas encore compté(s) : fais le comptage dans Stock (Comptage, Ingrédients) avant de clore l'événement.`);
      }
      // Consommation des ingrédients figée avec les recettes du moment (§15.124).
      await figerConsommationIngredients(c, auth.lieuId, id);
      await c.query("UPDATE evenement SET etat = 'clos', clos_le = now() WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id]);
      // Z de l'événement (clôture journalière) : totaux, TVA par taux, grand total et total perpétuel scellés (§15.107).
      await zDuMatch(c, auth.lieuId, auth.utilisateurId, (await listerEvenements(c, auth.lieuId)).find((x) => x.id === id)!);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "evenement_clos", utilisateurId: auth.utilisateurId, details: { evenementId: id, match: e.libelle } });
      // Rapport de soirée établi et figé dans la même transaction (§15.131).
      await figerRapportSoiree(c, auth.lieuId, auth.utilisateurId, id, "cloture");
      return listerEvenements(c, auth.lieuId);
    });
  });
}
