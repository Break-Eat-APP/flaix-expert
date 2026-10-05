import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  COULEUR_CARTE_DEFAUT,
  classeGoogle,
  couleurValide,
  emailLienCarte,
  idObjetGoogle,
  objetGoogle,
  passApple,
  type CarteAbonne,
  type CartePublique,
  type DonneesCarte,
  type EmailEnvoye,
  type EtatWallet,
} from "@flaix/domain";
import type { Base, Client, Contexte } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { lireOptions } from "../options.ts";
import { inscrireJet } from "../journal-technique.ts";
import { notifierApple, pkpass, reglageApple } from "../wallet/apple.ts";
import { pngUni } from "../wallet/fichiers.ts";
import { lienGoogle, mettreAJourGoogle, reglageGoogle } from "../wallet/google.ts";
import { envoyerEtTracer } from "./emails.ts";
import { soldePoints } from "./fidelite-caisse.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §14 module 20, §15.147).
 *   - Directeur : lien personnel de l'abonné (créé ou renouvelé), envoi par e-mail, couleur de la carte.
 *   - Abonné, sans connexion : page /carte/<jeton>, carte Apple (.pkpass), lien Google, logo pour Google.
 *   - Apple : service web PassKit (inscription des téléphones, carte à jour), notification quand le solde change.
 * Les pages publiques ne lisent la base qu'au travers de carte_par_jeton / carte_par_serie (migration 0035).
 */

const adresseSite = () => (config.originesAutorisees[0]?.startsWith("https://") ? config.originesAutorisees[0] : "https://flaixexpert.flaixlabs.com");
const jetonAleatoire = () => randomBytes(32).toString("base64url"); // 43 caractères
const JetonCarte = z.object({ jeton: z.string().regex(/^[A-Za-z0-9_-]{40,64}$/, "Lien de carte invalide.") });

/** Ce que montre la carte d'un abonné : lieu, couleur, nom, numéro, solde (lu comme le lit la caisse). */
export async function donneesCarte(c: Client, lieuId: string, abonneId: string): Promise<DonneesCarte & { auth: string | null; jeton: string | null; maj: Date | null; email: string | null }> {
  const { rows } = await c.query<{ lieu: string; couleur: string | null; p: number | null; nom: string; numero: string; auth: string | null; jeton: string | null; maj: Date | null; email: string | null }>(
    `SELECT l.nom AS lieu, l.carte_couleur AS couleur, l.fid_points_par_euro AS p, a.nom, a.numero, a.carte_auth AS auth, a.carte_jeton AS jeton, a.carte_maj_le AS maj, a.email
       FROM abonne_fidelite a JOIN lieu l ON l.id = a.lieu_id WHERE a.lieu_id = $1 AND a.id = $2`,
    [lieuId, abonneId],
  );
  const r = rows[0];
  if (!r) throw introuvable("Abonné");
  const points = r.p === null ? null : Math.max(0, (await soldePoints(c, lieuId, abonneId, r.numero, r.p)).solde);
  return { lieuId, lieu: r.lieu, couleur: r.couleur ?? COULEUR_CARTE_DEFAUT, abonneId, nom: r.nom, numero: r.numero, points, auth: r.auth, jeton: r.jeton, maj: r.maj, email: r.email };
}

/** Abonnés du lieu qui ont une carte (changement de couleur, de règle de points). */
export async function abonnesAvecCarte(c: Client, lieuId: string): Promise<string[]> {
  return (await c.query<{ id: string }>("SELECT id FROM abonne_fidelite WHERE lieu_id = $1 AND carte_jeton IS NOT NULL", [lieuId])).rows.map((r) => r.id);
}

async function carteAbonne(c: Client, lieuId: string, abonneId: string): Promise<CarteAbonne> {
  const d = await donneesCarte(c, lieuId, abonneId);
  const { rows } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2", [lieuId, abonneId]);
  return { lien: d.jeton ? `${adresseSite()}/carte/${d.jeton}` : null, email: d.email, apple: !!reglageApple(), google: !!reglageGoogle(), appareilsApple: rows[0]!.n };
}

/** Mise à jour des cartes après un enregistrement : journalisée en cas d'échec, jamais bloquante. */
export async function suivreCartes(base: Base, req: FastifyRequest, ctx: Contexte, lieuId: string, abonneIds: readonly string[]): Promise<void> {
  await mettreAJourCartes(base, ctx, lieuId, abonneIds).catch((erreur) => req.log.error({ err: erreur }, "cartes wallet non mises à jour"));
}

/** La carte Apple d'un abonné (le jeton d'authentification PassKit est créé au premier besoin). */
async function fichierApple(c: Client, lieuId: string, abonneId: string): Promise<Buffer> {
  const r = reglageApple();
  if (!r) throw new ErreurMetier(404, "La carte Apple Wallet n'est pas encore disponible.");
  const d = await donneesCarte(c, lieuId, abonneId);
  let auth = d.auth;
  if (!auth) {
    auth = jetonAleatoire();
    await c.query("UPDATE abonne_fidelite SET carte_auth = $3 WHERE lieu_id = $1 AND id = $2", [lieuId, abonneId, auth]);
  }
  return pkpass(passApple(d, { passTypeId: r.passTypeId, teamId: r.teamId, webServiceURL: `${adresseSite()}/api/passkit`, authenticationToken: auth }), d.couleur, r);
}

/** Lieu et abonné d'un lien public ; 404 si le lien n'existe pas ou n'est plus valable. */
async function parJeton(base: Base, jeton: string): Promise<{ lieuId: string; abonneId: string }> {
  const { rows } = await base.transaction({}, (c) => c.query<{ lieu_id: string; abonne_id: string }>("SELECT * FROM carte_par_jeton($1)", [jeton]));
  // Option Fidélité retirée au lieu (§15.118) : les cartes ne s'ouvrent plus.
  if (rows[0] && !(await base.transaction({ lieuId: rows[0].lieu_id }, (c) => lireOptions(c, rows[0]!.lieu_id))).fidelite) throw new ErreurMetier(404, "Ce lieu ne propose plus la carte abonné.");
  if (!rows[0]) throw new ErreurMetier(404, "Ce lien de carte n'existe pas ou n'est plus valable : demande-en un nouveau au lieu.");
  return { lieuId: rows[0].lieu_id, abonneId: rows[0].abonne_id };
}

/** Service web PassKit : « Authorization: ApplePass <jeton> » et numéro de série valables. */
async function parSerie(base: Base, req: FastifyRequest, serie: string): Promise<{ lieuId: string; abonneId: string } | null> {
  const auth = /^ApplePass (\S{20,80})$/.exec(req.headers.authorization ?? "")?.[1];
  if (!auth || !Uuid.safeParse(serie).success) return null;
  const { rows } = await base.transaction({}, (c) => c.query<{ lieu_id: string; abonne_id: string }>("SELECT * FROM carte_par_serie($1, $2)", [serie, auth]));
  return rows[0] ? { lieuId: rows[0].lieu_id, abonneId: rows[0].abonne_id } : null;
}

function envoyerPkpass(rep: FastifyReply, fichier: Buffer, maj: Date | null) {
  rep.header("content-type", "application/vnd.apple.pkpass").header("content-disposition", 'attachment; filename="carte.pkpass"').header("cache-control", "no-store");
  if (maj) rep.header("last-modified", maj.toUTCString());
  return rep.send(fichier);
}

/**
 * Ce que montre la carte a changé (points, nom) : date de mise à jour, notification aux téléphones Apple inscrits,
 * modification de la carte Google. Appelé après l'enregistrement ; un échec ne remet jamais rien en cause.
 */
export async function mettreAJourCartes(base: Base, ctx: Contexte, lieuId: string, abonneIds: readonly string[]): Promise<void> {
  if (abonneIds.length === 0) return;
  const apple = reglageApple();
  const google = reglageGoogle();
  const aFaire = await base.transaction(ctx, async (c) => {
    const { rows } = await c.query<{ id: string }>(
      "UPDATE abonne_fidelite SET carte_maj_le = now() WHERE lieu_id = $1 AND id = ANY($2::uuid[]) AND carte_jeton IS NOT NULL RETURNING id",
      [lieuId, abonneIds],
    );
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return [];
    const { rows: appareils } = await c.query<{ abonne_id: string; appareil: string; push_token: string }>("SELECT abonne_id, appareil, push_token FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = ANY($2::uuid[])", [lieuId, ids]);
    const resultat = [];
    for (const id of ids) resultat.push({ id, donnees: google ? await donneesCarte(c, lieuId, id) : null, appareils: appareils.filter((a) => a.abonne_id === id) });
    return resultat;
  });
  for (const carte of aFaire) {
    if (apple) {
      for (const a of carte.appareils) {
        const statut = await notifierApple(a.push_token, apple);
        // 410 : la carte a été retirée du téléphone ; on cesse de le prévenir.
        if (statut === 410) await base.transaction(ctx, (c) => c.query("DELETE FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2 AND appareil = $3", [lieuId, carte.id, a.appareil]));
      }
    }
    if (google && carte.donnees) {
      const o = objetGoogle(carte.donnees, google.issuerId);
      // 404 : l'abonné n'a pas (encore) ajouté sa carte dans Google Wallet ; rien à mettre à jour.
      await mettreAJourGoogle(idObjetGoogle(google.issuerId, carte.id), { accountName: o.accountName, ...(o.loyaltyPoints ? { loyaltyPoints: o.loyaltyPoints } : {}) }, google);
    }
  }
}

/**
 * Abonnés dont la carte change après des tickets reçus : numéro d'abonné de la vente (remise abonné, points
 * utilisés) ou, pour une annulation, de la vente annulée. Seuls les abonnés qui ont une carte sont rendus.
 */
export async function abonnesDesTickets(base: Base, ctx: Contexte, lieuId: string, journalIds: readonly string[]): Promise<string[]> {
  if (journalIds.length === 0) return [];
  const { rows } = await base.transaction(ctx, (c) =>
    c.query<{ id: string }>(
      `SELECT DISTINCT a.id
         FROM journal_caisse j
         LEFT JOIN journal_caisse o ON j.type = 'annulation' AND o.lieu_id = j.lieu_id AND o.id = j.ref_evenement
         CROSS JOIN LATERAL (SELECT coalesce(o.details, j.details) AS d) t
         JOIN abonne_fidelite a ON a.lieu_id = j.lieu_id AND a.carte_jeton IS NOT NULL
          AND ((t.d->'ajustement'->>'motif' = 'abonne' AND upper(btrim(t.d->'ajustement'->>'reference')) = a.numero)
               OR upper(btrim(t.d->'fidelite'->'points'->>'numero')) = a.numero)
        WHERE j.lieu_id = $1 AND j.id = ANY($2::uuid[]) AND j.type IN ('vente', 'annulation')`,
      [lieuId, journalIds],
    ),
  );
  return rows.map((r) => r.id);
}

export async function routesWallet(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Directeur ----------
  app.get("/api/wallet", async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ couleur: string | null }>("SELECT carte_couleur AS couleur FROM lieu WHERE id = $1", [auth.lieuId]);
      return { apple: !!reglageApple(), google: !!reglageGoogle(), couleur: rows[0]?.couleur ?? COULEUR_CARTE_DEFAUT };
    });
  });

  app.put("/api/wallet/couleur", async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    const { couleur } = corps(z.object({ couleur: z.string().trim().toLowerCase().refine(couleurValide, "Couleur invalide (format #rrggbb).") }), req);
    const ids = await base.transaction(contexte(auth), async (c) => {
      const { rows } = await c.query<{ couleur: string | null }>("SELECT carte_couleur AS couleur FROM lieu WHERE id = $1", [auth.lieuId]);
      if (rows[0]?.couleur === couleur) return [];
      await c.query("UPDATE lieu SET carte_couleur = $2 WHERE id = $1", [auth.lieuId, couleur]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "carte_wallet_couleur", utilisateurId: auth.utilisateurId, details: { avant: rows[0]?.couleur ?? null, apres: couleur } });
      return abonnesAvecCarte(c, auth.lieuId);
    });
    await suivreCartes(base, req, contexte(auth), auth.lieuId, ids);
    return { apple: !!reglageApple(), google: !!reglageGoogle(), couleur };
  });

  app.get("/api/fidelite/abonnes/:id/carte", async (req): Promise<CarteAbonne> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => carteAbonne(c, auth.lieuId, id));
  });

  // Créer ou renouveler le lien : l'ancien lien cesse aussitôt de fonctionner.
  app.post("/api/fidelite/abonnes/:id/carte", async (req): Promise<CarteAbonne> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const d = await donneesCarte(c, auth.lieuId, id);
      const jeton = jetonAleatoire();
      await c.query("UPDATE abonne_fidelite SET carte_jeton = $3, carte_auth = coalesce(carte_auth, $4), carte_maj_le = now() WHERE lieu_id = $1 AND id = $2", [auth.lieuId, id, jeton, jetonAleatoire()]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "carte_wallet_lien", utilisateurId: auth.utilisateurId, details: { abonne: id, numero: d.numero, renouvele: d.jeton !== null } });
      return carteAbonne(c, auth.lieuId, id);
    });
  });

  // Envoi du lien à l'abonné par e-mail (Brevo), s'il a une adresse.
  app.post("/api/fidelite/abonnes/:id/carte/email", async (req): Promise<{ statut: EmailEnvoye["statut"] }> => {
    const auth = await exigerDirecteur(req, base);
    const { id } = ParamId.parse(req.params);
    return base.transaction(contexte(auth), async (c) => {
      const d = await donneesCarte(c, auth.lieuId, id);
      if (!d.jeton) throw new ErreurMetier(409, "Crée d'abord le lien de la carte.");
      if (!d.email) throw new ErreurMetier(409, "Cet abonné n'a pas d'adresse e-mail.");
      const { rows } = await c.query<{ formation: boolean }>("SELECT formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1", [auth.lieuId]);
      if (rows[0]?.formation) throw new ErreurMetier(409, "Mode formation : aucun e-mail ne part.");
      const statut = await envoyerEtTracer(c, auth.lieuId, "carte_wallet", id, [d.email], emailLienCarte(d.lieu, d.nom, `${adresseSite()}/carte/${d.jeton}`));
      return { statut };
    });
  });

  // ---------- Abonné, sans connexion ----------
  const limite = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

  app.get("/api/carte/:jeton", limite, async (req): Promise<CartePublique> => {
    const { jeton } = JetonCarte.parse(req.params);
    const { lieuId, abonneId } = await parJeton(base, jeton);
    return base.transaction({ lieuId }, async (c) => {
      const d = await donneesCarte(c, lieuId, abonneId);
      return { lieu: d.lieu, couleur: d.couleur, nom: d.nom, numero: d.numero, points: d.points, apple: !!reglageApple(), google: !!reglageGoogle() };
    });
  });

  app.get("/api/carte/:jeton/apple", limite, async (req, rep) => {
    const { jeton } = JetonCarte.parse(req.params);
    const { lieuId, abonneId } = await parJeton(base, jeton);
    const fichier = await base.transaction({ lieuId }, (c) => fichierApple(c, lieuId, abonneId));
    return envoyerPkpass(rep, fichier, null);
  });

  app.get("/api/carte/:jeton/google", limite, async (req, rep) => {
    const { jeton } = JetonCarte.parse(req.params);
    const r = reglageGoogle();
    if (!r) throw new ErreurMetier(404, "La carte Google Wallet n'est pas encore disponible.");
    const { lieuId, abonneId } = await parJeton(base, jeton);
    const d = await base.transaction({ lieuId }, (c) => donneesCarte(c, lieuId, abonneId));
    return rep.redirect(lienGoogle(classeGoogle(d, r.issuerId, `${adresseSite()}/api/carte-logo/${lieuId}.png`), objetGoogle(d, r.issuerId), adresseSite(), r));
  });

  // Logo de la carte Google (Google l'exige) : un carré aux couleurs du lieu.
  app.get("/api/carte-logo/:lieu.png", limite, async (req, rep) => {
    const { lieu } = z.object({ lieu: Uuid }).parse(req.params);
    const { rows } = await base.transaction({ lieuId: lieu }, (c) => c.query<{ couleur: string | null }>("SELECT carte_couleur AS couleur FROM lieu WHERE id = $1", [lieu]));
    if (!rows[0]) throw introuvable("Lieu");
    return rep.header("content-type", "image/png").header("cache-control", "public, max-age=3600").send(pngUni(rows[0].couleur ?? COULEUR_CARTE_DEFAUT, 660, 660));
  });

  // ---------- Service web PassKit (Apple) ----------
  const typeValide = (t: string) => t === reglageApple()?.passTypeId;

  app.post("/api/passkit/v1/devices/:appareil/registrations/:type/:serie", async (req, rep) => {
    const { appareil, type, serie } = req.params as { appareil: string; type: string; serie: string };
    const carte = typeValide(type) && appareil.length <= 200 ? await parSerie(base, req, serie) : null;
    if (!carte) return rep.code(401).send();
    const { pushToken } = z.object({ pushToken: z.string().min(1).max(300) }).parse(req.body);
    const nouveau = await base.transaction({ lieuId: carte.lieuId }, async (c) => {
      const { rowCount } = await c.query("UPDATE wallet_appareil SET push_token = $4 WHERE lieu_id = $1 AND abonne_id = $2 AND appareil = $3", [carte.lieuId, carte.abonneId, appareil, pushToken]);
      if (rowCount) return false;
      await c.query("INSERT INTO wallet_appareil (lieu_id, abonne_id, appareil, push_token) VALUES ($1, $2, $3, $4)", [carte.lieuId, carte.abonneId, appareil, pushToken]);
      return true;
    });
    return rep.code(nouveau ? 201 : 200).send();
  });

  app.delete("/api/passkit/v1/devices/:appareil/registrations/:type/:serie", async (req, rep) => {
    const { appareil, type, serie } = req.params as { appareil: string; type: string; serie: string };
    const carte = typeValide(type) ? await parSerie(base, req, serie) : null;
    if (!carte) return rep.code(401).send();
    await base.transaction({ lieuId: carte.lieuId }, (c) => c.query("DELETE FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2 AND appareil = $3", [carte.lieuId, carte.abonneId, appareil]));
    return rep.code(200).send();
  });

  app.get("/api/passkit/v1/devices/:appareil/registrations/:type", async (req, rep) => {
    const { appareil, type } = req.params as { appareil: string; type: string };
    if (!typeValide(type)) return rep.code(404).send();
    const depuis = (req.query as { passesUpdatedSince?: string }).passesUpdatedSince;
    const date = depuis && !Number.isNaN(Date.parse(depuis)) ? new Date(depuis) : null;
    const { rows } = await base.transaction({}, (c) => c.query<{ abonne_id: string; maj_le: Date | null }>("SELECT * FROM cartes_appareil($1, $2)", [appareil, date]));
    if (rows.length === 0) return rep.code(204).send();
    const derniere = rows.reduce((m, r) => Math.max(m, r.maj_le?.getTime() ?? 0), 0);
    return { serialNumbers: rows.map((r) => r.abonne_id), lastUpdated: new Date(derniere || Date.now()).toISOString() };
  });

  app.get("/api/passkit/v1/passes/:type/:serie", async (req, rep) => {
    const { type, serie } = req.params as { type: string; serie: string };
    const carte = typeValide(type) ? await parSerie(base, req, serie) : null;
    if (!carte) return rep.code(401).send();
    const { fichier, maj } = await base.transaction({ lieuId: carte.lieuId }, async (c) => ({ fichier: await fichierApple(c, carte.lieuId, carte.abonneId), maj: (await donneesCarte(c, carte.lieuId, carte.abonneId)).maj }));
    return envoyerPkpass(rep, fichier, maj);
  });

  app.post("/api/passkit/v1/log", async (req, rep) => {
    const { logs } = z.object({ logs: z.array(z.string().max(1000)).max(50).default([]) }).parse(req.body ?? {});
    for (const l of logs) req.log.warn({ passkit: l }, "journal Apple Wallet");
    return rep.code(200).send();
  });
}
