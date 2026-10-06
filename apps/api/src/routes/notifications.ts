import type { FastifyInstance } from "fastify";
import { z } from "zod";
import webpush from "web-push";
import { briefDeSoiree, reformulationFidele, texteNotification } from "@flaix/domain";
import { verrouiller, type Base, type Client, type Contexte } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { fournisseurIA } from "../ia/fournisseur.ts";
import { lireOptions } from "../options.ts";
import { lireRapport } from "./rapport-soiree.ts";
import { contexte, corps } from "./outils.ts";

/*
 * Notifications sur le téléphone du directeur (Web Push de l'application installée) et brief de fin de
 * soirée (dossier §15.135). Le brief part à la clôture de l'événement, vers chaque téléphone abonné d'un
 * directeur du lieu. La paire de clés du serveur (VAPID) est créée au premier besoin, dans la base.
 */

const Abonnement = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  appareil: z.string().trim().max(120).optional(),
});
const Desabonnement = z.object({ endpoint: z.string().max(1000) });

interface Cles {
  publique: string;
  privee: string;
}
interface Destinataire {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}
/** Envoi d'une notification à un téléphone ; renvoie le code HTTP du service de notification. Remplaçable dans les tests. */
export type EnvoyeurPush = (destinataire: Destinataire, charge: string, cles: Cles) => Promise<number>;

const envoyeurReel: EnvoyeurPush = async (d, charge, cles) => {
  try {
    const r = await webpush.sendNotification({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }, charge, {
      vapidDetails: { subject: config.originesAutorisees[0]!.startsWith("https://") ? config.originesAutorisees[0]! : "https://flaixexpert.flaixlabs.com", publicKey: cles.publique, privateKey: cles.privee },
      TTL: 12 * 3600,
      timeout: 10_000,
    });
    return r.statusCode;
  } catch (e) {
    return (e as { statusCode?: number }).statusCode ?? 0;
  }
};
let envoyeur: EnvoyeurPush = envoyeurReel;
export function definirEnvoyeurPush(f: EnvoyeurPush | null): void {
  envoyeur = f ?? envoyeurReel;
}

/** La paire de clés VAPID du serveur, créée une seule fois. */
async function clesServeur(c: Client): Promise<Cles> {
  const lire = async () => {
    const { rows } = await c.query<{ nom: string; valeur: string }>("SELECT nom, valeur FROM cle_serveur WHERE nom IN ('vapid_publique', 'vapid_privee')");
    const m = new Map(rows.map((r) => [r.nom, r.valeur]));
    return m.size === 2 ? { publique: m.get("vapid_publique")!, privee: m.get("vapid_privee")! } : null;
  };
  const deja = await lire();
  if (deja) return deja;
  await verrouiller(c, "cles-vapid");
  const apresVerrou = await lire();
  if (apresVerrou) return apresVerrou;
  const k = webpush.generateVAPIDKeys();
  await c.query("INSERT INTO cle_serveur (nom, valeur) VALUES ('vapid_publique', $1), ('vapid_privee', $2) ON CONFLICT (nom) DO NOTHING", [k.publicKey, k.privateKey]);
  return (await lire())!;
}

/** Envoie une notification aux téléphones abonnés des directeurs du lieu ; retire les abonnements expirés. */
export async function notifierDirecteurs(c: Client, lieuId: string, charge: { titre: string; corps: string; url: string }, seulement?: string): Promise<{ envoyees: number; echecs: number }> {
  const { rows } = await c.query<Destinataire>(
    `SELECT a.id, a.endpoint, a.p256dh, a.auth FROM abonnement_push a
       JOIN membre m ON m.lieu_id = a.lieu_id AND m.utilisateur_id = a.utilisateur_id AND m.role = 'directeur'
      WHERE a.lieu_id = $1 AND a.retire_le IS NULL AND ($2::uuid IS NULL OR a.utilisateur_id = $2)`,
    [lieuId, seulement ?? null],
  );
  if (rows.length === 0) return { envoyees: 0, echecs: 0 };
  const cles = await clesServeur(c);
  let envoyees = 0, echecs = 0;
  for (const d of rows) {
    const statut = await envoyeur(d, JSON.stringify(charge), cles);
    if (statut >= 200 && statut < 300) envoyees++;
    else {
      echecs++;
      // 404 / 410 : le téléphone s'est désabonné ou l'application a été désinstallée.
      if (statut === 404 || statut === 410) await c.query("UPDATE abonnement_push SET retire_le = now() WHERE id = $1", [d.id]);
    }
  }
  return { envoyees, echecs };
}

/**
 * Brief de fin de soirée : établi à partir du rapport figé et envoyé une seule fois par événement.
 * Appelé après la clôture de l'événement ; une erreur ici n'annule jamais la clôture.
 */
export async function envoyerBriefSoiree(base: Base, ctx: Contexte, lieuId: string, evenementId: string): Promise<void> {
  // 1. Le brief par règles, à partir du rapport figé (rien à faire s'il est déjà parti).
  const prepare = await base.transaction(ctx, async (c) => {
    const { rows: deja } = await c.query("SELECT 1 FROM brief_soiree WHERE lieu_id = $1 AND evenement_id = $2", [lieuId, evenementId]);
    if (deja[0]) return null;
    const r = await lireRapport(c, lieuId, evenementId);
    return r ? { brief: briefDeSoiree(r.rapport), assistant: (await lireOptions(c, lieuId)).assistant } : null;
  });
  if (!prepare) return;
  const { brief } = prepare;
  const n = texteNotification(brief);
  let corps = n.corps;
  let redigePar: "regles" | "mistral" = "regles";
  let modele: string | null = null;
  // Jetons de l'appel à l'IA, comptés même si la reformulation est écartée : l'appel a coûté (§15.149).
  let jetons: { entree: number; sortie: number } | null = null;

  // 2. Reformulation par Mistral si l'option est active : retenue seulement si elle n'ajoute ni ne change
  //    aucun chiffre (§15.136) ; sinon, le brief par règles part tel quel. Hors transaction : l'IA peut être lente.
  const f = fournisseurIA();
  if (prepare.assistant && f) {
    try {
      const r = await f([
        {
          role: "system",
          content:
            "Tu reformules le brief de fin de soirée d'une buvette pour une notification de téléphone : 2 ou 3 phrases courtes, en français, en tutoyant le directeur. Recopie les chiffres exactement comme ils sont écrits ; n'en ajoute aucun, n'en calcule aucun. Pas de formule de politesse.",
        },
        { role: "user", content: [n.titre, brief.resume, ...brief.points.map((p) => p.texte)].join("\n") },
      ]);
      jetons = r.jetons;
      const texte = r.message.content.trim();
      if (texte && texte.length <= 400 && reformulationFidele(brief, texte)) {
        corps = texte;
        redigePar = "mistral";
        modele = r.modele;
      }
    } catch {
      /* Mistral injoignable : le brief par règles part quand même. */
    }
  }

  // 3. Envoi et trace, une seule fois même si deux clôtures se croisent.
  await base.transaction(ctx, async (c) => {
    await verrouiller(c, `brief:${evenementId}`);
    const { rows: deja } = await c.query("SELECT 1 FROM brief_soiree WHERE lieu_id = $1 AND evenement_id = $2", [lieuId, evenementId]);
    if (deja[0]) return;
    const { envoyees } = await notifierDirecteurs(c, lieuId, { titre: n.titre, corps, url: brief.lien });
    await c.query("INSERT INTO brief_soiree (lieu_id, evenement_id, contenu, redige_par, modele, envoye_a, jetons_entree, jetons_sortie) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
      lieuId,
      evenementId,
      JSON.stringify({ ...brief, ...(redigePar === "mistral" ? { reformulation: corps } : {}) }),
      redigePar,
      modele,
      envoyees,
      jetons?.entree ?? null,
      jetons?.sortie ?? null,
    ]);
  });
}

export async function routesNotifications(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/notifications", async (req): Promise<{ cle: string; abonnements: number }> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM abonnement_push WHERE lieu_id = $1 AND utilisateur_id = $2 AND retire_le IS NULL", [auth.lieuId, auth.utilisateurId]);
      return { cle: (await clesServeur(c)).publique, abonnements: rows[0]!.n };
    });
  });

  app.post("/api/notifications/abonnement", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const a = corps(Abonnement, req);
    return base.transaction(contexte(auth), async (c) => {
      // Un même téléphone ne s'abonne qu'une fois : l'ancien abonnement (autre directeur ou clés changées) est retiré.
      await c.query("UPDATE abonnement_push SET retire_le = now() WHERE lieu_id = $1 AND endpoint = $2 AND retire_le IS NULL", [auth.lieuId, a.endpoint]);
      await c.query("INSERT INTO abonnement_push (lieu_id, utilisateur_id, endpoint, p256dh, auth, appareil) VALUES ($1, $2, $3, $4, $5, $6)", [
        auth.lieuId,
        auth.utilisateurId,
        a.endpoint,
        a.keys.p256dh,
        a.keys.auth,
        a.appareil ?? null,
      ]);
      return { ok: true };
    });
  });

  app.post("/api/notifications/desabonnement", async (req) => {
    const auth = await exigerDirecteur(req, base);
    const { endpoint } = corps(Desabonnement, req);
    return base.transaction(contexte(auth), async (c) => {
      await c.query("UPDATE abonnement_push SET retire_le = now() WHERE lieu_id = $1 AND endpoint = $2 AND retire_le IS NULL", [auth.lieuId, endpoint]);
      return { ok: true };
    });
  });

  app.post("/api/notifications/essai", async (req) => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const r = await notifierDirecteurs(c, auth.lieuId, { titre: "FlaiX Expert", corps: "Notifications activées : le brief de fin de soirée arrivera ici à chaque clôture d'événement.", url: "/" }, auth.utilisateurId);
      if (r.envoyees === 0 && r.echecs === 0) throw new ErreurMetier(409, "Aucun téléphone abonné : active d'abord les notifications sur ce téléphone.");
      return r;
    });
  });
}
