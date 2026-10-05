import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  EMAILS_SUPPLEMENTAIRES_MAX,
  briefDeSoiree,
  emailEssai,
  emailRapportSoiree,
  emailRectification,
  emailValide,
  type Email,
  type EmailEnvoye,
  type EtatEmails,
  type ReglagesEmails,
} from "@flaix/domain";
import type { Base, Client, Contexte } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { lireRapport } from "./rapport-soiree.ts";
import { contexte, corps } from "./outils.ts";

/*
 * E-mails par Brevo (dossier §15.146) : rapport de soirée à la clôture de l'événement, notification de chaque
 * rectification de Z, e-mail d'essai. Ils partent après l'enregistrement : un échec n'annule jamais rien.
 * Chaque envoi est tracé (email_envoye, écriture seule). Le mode formation n'envoie rien.
 */

/** Envoi d'un e-mail ; renvoie l'identifiant du message chez le service. Remplaçable dans les tests. */
export type EnvoyeurEmail = (a: string[], email: Email) => Promise<{ ok: true; messageId: string | null } | { ok: false; erreur: string }>;

const envoyeurBrevo: EnvoyeurEmail = async (a, email) => {
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": config.brevoCle!, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "FlaiX Expert", email: config.brevoExpediteur },
        to: a.map((email) => ({ email })),
        subject: email.sujet,
        htmlContent: email.html,
        textContent: email.texte,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) return { ok: false, erreur: `Brevo a répondu ${r.status}` };
    const json = (await r.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, messageId: json.messageId ?? null };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message.slice(0, 200) : "Brevo injoignable" };
  }
};
let envoyeur: EnvoyeurEmail | null = null;
/** Tests : remplacer l'envoi (null : revenir à Brevo, s'il est réglé). */
export function definirEnvoyeurEmail(f: EnvoyeurEmail | null): void {
  envoyeur = f;
}
const service = (): EnvoyeurEmail | null => envoyeur ?? (config.brevoCle && config.brevoExpediteur ? envoyeurBrevo : null);
/** Adresse du site, pour les liens des e-mails. */
const adresseSite = () => (config.originesAutorisees[0]?.startsWith("https://") ? config.originesAutorisees[0] : "https://flaixexpert.flaixlabs.com");

const Reglages = z.object({
  rapport: z.boolean(),
  rectification: z.boolean(),
  supplementaires: z
    .array(z.string().trim().toLowerCase().max(254))
    .max(EMAILS_SUPPLEMENTAIRES_MAX, `${EMAILS_SUPPLEMENTAIRES_MAX} adresses au plus.`)
    .refine((l) => l.every(emailValide), "Une adresse e-mail n'a pas la bonne forme.")
    .transform((l) => [...new Set(l)]),
});

async function lireReglages(c: Client, lieuId: string): Promise<ReglagesEmails & { formation: boolean; nom: string }> {
  const { rows } = await c.query<{ rapport: boolean; rectification: boolean; supplementaires: string[]; formation: boolean; nom: string }>(
    "SELECT email_rapport AS rapport, email_rectification AS rectification, emails_supplementaires AS supplementaires, formation_de IS NOT NULL AS formation, nom FROM lieu WHERE id = $1",
    [lieuId],
  );
  return rows[0]!;
}

async function directeurs(c: Client, lieuId: string): Promise<{ nom: string; email: string }[]> {
  const { rows } = await c.query<{ nom: string; email: string }>(
    `SELECT u.nom, u.email FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
      WHERE m.lieu_id = $1 AND m.role = 'directeur' AND m.actif AND u.actif AND u.email IS NOT NULL ORDER BY lower(u.nom)`,
    [lieuId],
  );
  return rows;
}

/** Envoie un e-mail et le trace ; « sans_service » si Brevo n'est pas réglé. Jamais d'exception. */
export async function envoyerEtTracer(c: Client, lieuId: string, type: EmailEnvoye["type"], objetId: string | null, a: string[], email: Email): Promise<EmailEnvoye["statut"]> {
  const f = service();
  const r = f && a.length ? await f(a, email) : null;
  const statut: EmailEnvoye["statut"] = !f ? "sans_service" : r?.ok ? "envoye" : "echec";
  await c.query("INSERT INTO email_envoye (lieu_id, type, objet_id, sujet, destinataires, statut, erreur, message_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
    lieuId,
    type,
    objetId,
    email.sujet.slice(0, 300),
    a.length,
    statut,
    r && !r.ok ? r.erreur.slice(0, 500) : null,
    r && r.ok ? r.messageId?.slice(0, 300) ?? null : null,
  ]);
  return statut;
}

const destinataires = async (c: Client, lieuId: string, supplementaires: string[]) => [...new Set([...(await directeurs(c, lieuId)).map((d) => d.email.toLowerCase()), ...supplementaires])];

/** Rapport de soirée par e-mail, une seule fois par événement, après la clôture (§15.146). */
export async function envoyerRapportParEmail(base: Base, ctx: Contexte, lieuId: string, evenementId: string): Promise<void> {
  await base.transaction(ctx, async (c) => {
    const r = await lireReglages(c, lieuId);
    if (!r.rapport || r.formation) return;
    const { rows: deja } = await c.query("SELECT 1 FROM email_envoye WHERE lieu_id = $1 AND objet_id = $2 AND type = 'rapport_soiree' AND statut = 'envoye'", [lieuId, evenementId]);
    if (deja[0]) return;
    const rapport = await lireRapport(c, lieuId, evenementId);
    if (!rapport) return;
    await envoyerEtTracer(c, lieuId, "rapport_soiree", evenementId, await destinataires(c, lieuId, r.supplementaires), emailRapportSoiree(briefDeSoiree(rapport.rapport), adresseSite(), r.nom));
  });
}

/** Notification d'une rectification de Z, au moment de l'enregistrement (module 7, §15.146). */
export async function envoyerRectificationParEmail(base: Base, ctx: Contexte, lieuId: string, comptageId: string, d: { objet: string; evenement: string; compteAvant: number; ecartAvant: number; compte: number; ecart: number; motif: string; signature: string; par: string }): Promise<void> {
  await base.transaction(ctx, async (c) => {
    const r = await lireReglages(c, lieuId);
    if (!r.rectification || r.formation) return;
    await envoyerEtTracer(c, lieuId, "rectification", comptageId, await destinataires(c, lieuId, r.supplementaires), emailRectification({ ...d, lieu: r.nom, le: new Date().toISOString() }, adresseSite()));
  });
}

async function etat(c: Client, lieuId: string): Promise<EtatEmails> {
  const r = await lireReglages(c, lieuId);
  const { rows } = await c.query<{ type: EmailEnvoye["type"]; sujet: string; destinataires: number; statut: EmailEnvoye["statut"]; erreur: string | null; le: Date }>(
    "SELECT type, sujet, destinataires, statut, erreur, le FROM email_envoye WHERE lieu_id = $1 ORDER BY le DESC LIMIT 10",
    [lieuId],
  );
  return {
    service: !!service(),
    expediteur: config.brevoExpediteur,
    reglages: { rapport: r.rapport, rectification: r.rectification, supplementaires: r.supplementaires },
    directeurs: await directeurs(c, lieuId),
    derniers: rows.map((x) => ({ ...x, le: x.le.toISOString() })),
  };
}

export async function routesEmails(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/emails", async (req): Promise<EtatEmails> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etat(c, auth.lieuId));
  });

  app.put("/api/emails/reglages", async (req): Promise<EtatEmails> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Reglages, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireReglages(c, auth.lieuId);
      const change = avant.rapport !== d.rapport || avant.rectification !== d.rectification || JSON.stringify(avant.supplementaires) !== JSON.stringify(d.supplementaires);
      if (change) {
        await c.query("UPDATE lieu SET email_rapport = $2, email_rectification = $3, emails_supplementaires = $4 WHERE id = $1", [auth.lieuId, d.rapport, d.rectification, d.supplementaires]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "emails_reglages_modifies",
          utilisateurId: auth.utilisateurId,
          details: { avant: { rapport: avant.rapport, rectification: avant.rectification, supplementaires: avant.supplementaires }, apres: d },
        });
      }
      return etat(c, auth.lieuId);
    });
  });

  // E-mail d'essai, à la seule personne connectée : vérifie le réglage du service sans déranger les autres.
  app.post("/api/emails/essai", async (req): Promise<EtatEmails> => {
    const auth = await exigerDirecteur(req, base);
    if (!auth.email) throw new ErreurMetier(409, "Ton compte n'a pas d'adresse e-mail.");
    return base.transaction(contexte(auth), async (c) => {
      const r = await lireReglages(c, auth.lieuId);
      if (r.formation) throw new ErreurMetier(409, "Mode formation : aucun e-mail ne part.");
      await envoyerEtTracer(c, auth.lieuId, "essai", null, [auth.email!], emailEssai(r.nom, adresseSite()));
      return etat(c, auth.lieuId);
    });
  });
}
