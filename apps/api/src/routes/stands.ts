import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Caisse, Stand } from "@flaix/domain";
import { verrouiller, type Base, type Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { ParamId, Uuid, contexte, corps, differences, texte, texteFacultatif } from "./outils.ts";

const NouveauStand = z.object({
  nom: texte(80, "Le nom du stand"),
  pointRetraitCc: z.boolean().default(false),
});
const ModifStand = z.object({
  nom: texte(80, "Le nom du stand").optional(),
  pointRetraitCc: z.boolean().optional(),
  actif: z.boolean().optional(),
});
const NouvelleCaisse = z.object({
  nom: texteFacultatif(60),
  especesAutorisees: z.boolean().default(false),
});
const ModifCaisse = z.object({
  nom: texteFacultatif(60).optional(),
  especesAutorisees: z.boolean().optional(),
  actif: z.boolean().optional(),
  standId: Uuid.optional(),
});

interface LigneStand {
  id: string;
  nom: string;
  point_retrait_cc: boolean;
  actif: boolean;
}
interface LigneCaisse {
  id: string;
  stand_id: string;
  numero: number;
  nom: string | null;
  especes_autorisees: boolean;
  actif: boolean;
}

const versCaisse = (l: LigneCaisse): Caisse => ({
  id: l.id,
  standId: l.stand_id,
  numero: l.numero,
  nom: l.nom,
  especesAutorisees: l.especes_autorisees,
  actif: l.actif,
});

export async function listerStands(c: Client, lieuId: string): Promise<Stand[]> {
  const stands = await c.query<LigneStand>(
    "SELECT id, nom, point_retrait_cc, actif FROM stand WHERE lieu_id = $1 ORDER BY actif DESC, lower(nom)",
    [lieuId],
  );
  const caisses = await c.query<LigneCaisse>(
    "SELECT id, stand_id, numero, nom, especes_autorisees, actif FROM caisse WHERE lieu_id = $1 ORDER BY numero",
    [lieuId],
  );
  return stands.rows.map((s) => ({
    id: s.id,
    nom: s.nom,
    pointRetraitCc: s.point_retrait_cc,
    actif: s.actif,
    caisses: caisses.rows.filter((k) => k.stand_id === s.id).map(versCaisse),
  }));
}

async function lireStand(c: Client, lieuId: string, id: string): Promise<LigneStand> {
  const { rows } = await c.query<LigneStand>(
    "SELECT id, nom, point_retrait_cc, actif FROM stand WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
    [lieuId, id],
  );
  if (!rows[0]) throw introuvable("Stand");
  return rows[0];
}

export async function routesStands(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/stands", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => listerStands(c, auth.lieuId));
  });

  app.post("/api/stands", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { nom, pointRetraitCc } = corps(NouveauStand, req);
    const stands = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO stand (lieu_id, nom, point_retrait_cc) VALUES ($1, $2, $3) RETURNING id",
        [auth.lieuId, nom, pointRetraitCc],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "stand_cree",
        utilisateurId: auth.utilisateurId,
        standId: rows[0]!.id,
        details: { nom, pointRetraitCc },
      });
      return listerStands(c, auth.lieuId);
    });
    rep.code(201);
    return stands;
  });

  app.patch("/api/stands/:id", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifStand, req);
    return base.transaction(contexte(auth), async (c) => {
      const s = await lireStand(c, auth.lieuId, id);
      const avant = { nom: s.nom, pointRetraitCc: s.point_retrait_cc, actif: s.actif };
      const modifications = differences(avant, demande);
      if (Object.keys(modifications).length === 0) return listerStands(c, auth.lieuId);
      if (demande.actif === false) {
        const { rows } = await c.query<{ n: number }>(
          "SELECT count(*)::int AS n FROM caisse WHERE lieu_id = $1 AND stand_id = $2 AND actif",
          [auth.lieuId, id],
        );
        if ((rows[0]?.n ?? 0) > 0) {
          throw new ErreurMetier(409, "Ce stand a encore des caisses actives : désactive-les ou déplace-les d'abord.");
        }
      }
      const apres = { ...avant, ...Object.fromEntries(Object.entries(demande).filter(([, v]) => v !== undefined)) };
      await c.query("UPDATE stand SET nom = $3, point_retrait_cc = $4, actif = $5 WHERE lieu_id = $1 AND id = $2", [
        auth.lieuId,
        id,
        apres.nom,
        apres.pointRetraitCc,
        apres.actif,
      ]);
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "stand_modifie",
        utilisateurId: auth.utilisateurId,
        standId: id,
        details: { stand: s.nom, modifications },
      });
      return listerStands(c, auth.lieuId);
    });
  });

  app.post("/api/stands/:id/caisses", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { id: standId } = ParamId.parse(req.params);
    const { nom, especesAutorisees } = corps(NouvelleCaisse, req);
    const stands = await base.transaction(contexte(auth), async (c) => {
      const s = await lireStand(c, auth.lieuId, standId);
      if (!s.actif) throw new ErreurMetier(409, "Ce stand est désactivé : réactive-le avant d'y ajouter une caisse.");
      // Numéro unique sur tout le lieu, attribué sous verrou (jamais deux caisses n° 5).
      await verrouiller(c, `caisses:${auth.lieuId}`);
      const { rows: max } = await c.query<{ n: number }>(
        "SELECT coalesce(max(numero), 0)::int AS n FROM caisse WHERE lieu_id = $1",
        [auth.lieuId],
      );
      const numero = (max[0]?.n ?? 0) + 1;
      const { rows } = await c.query<{ id: string }>(
        "INSERT INTO caisse (lieu_id, stand_id, numero, nom, especes_autorisees) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [auth.lieuId, standId, numero, nom, especesAutorisees],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_creee",
        utilisateurId: auth.utilisateurId,
        standId,
        caisseId: rows[0]!.id,
        details: { numero, stand: s.nom, nom, especesAutorisees },
      });
      return listerStands(c, auth.lieuId);
    });
    rep.code(201);
    return stands;
  });

  app.patch("/api/caisses/:id", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    const demande = corps(ModifCaisse, req);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<LigneCaisse>(
        "SELECT id, stand_id, numero, nom, especes_autorisees, actif FROM caisse WHERE lieu_id = $1 AND id = $2 FOR UPDATE",
        [auth.lieuId, id],
      );
      const k = rows[0];
      if (!k) throw introuvable("Caisse");
      const avant = { nom: k.nom, especesAutorisees: k.especes_autorisees, actif: k.actif, standId: k.stand_id };
      const modifications = differences(avant, demande);
      if (Object.keys(modifications).length === 0) return listerStands(c, auth.lieuId);
      const apres = { ...avant, ...Object.fromEntries(Object.entries(demande).filter(([, v]) => v !== undefined)) };
      const cible = await lireStand(c, auth.lieuId, apres.standId);
      if (apres.actif && !cible.actif) {
        throw new ErreurMetier(409, "Une caisse active ne peut pas être rattachée à un stand désactivé.");
      }
      await c.query(
        "UPDATE caisse SET nom = $3, especes_autorisees = $4, actif = $5, stand_id = $6 WHERE lieu_id = $1 AND id = $2",
        [auth.lieuId, id, apres.nom, apres.especesAutorisees, apres.actif, apres.standId],
      );
      await inscrireJet(c, {
        lieuId: auth.lieuId,
        type: "caisse_modifiee",
        utilisateurId: auth.utilisateurId,
        standId: apres.standId,
        caisseId: id,
        details: { numero: k.numero, modifications },
      });
      return listerStands(c, auth.lieuId);
    });
  });
}
