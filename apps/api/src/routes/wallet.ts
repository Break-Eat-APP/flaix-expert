import type { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  COULEUR_CARTE_DEFAUT,
  LIMITES_DESIGN,
  VARIANTES_IMAGE,
  classeGoogle,
  contenuCarte,
  couleurValide,
  emailLienCarte,
  emailValide,
  idClasseGoogle,
  idObjetGoogle,
  lienValide,
  lireDesign,
  objetGoogle,
  passApple,
  telephoneValide,
  type CarteAbonne,
  type CartePublique,
  type DesignCarte,
  type DonneesCarte,
  type EmailEnvoye,
  type EtatWallet,
  type SorteImage,
} from "@flaix/domain";
import { enArrierePlan } from "../arriere-plan.ts";
import type { Base, Client, Contexte } from "../base.ts";
import { config } from "../config.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { ErreurMetier, introuvable } from "../erreurs.ts";
import { lireOptions } from "../options.ts";
import { inscrireJet } from "../journal-technique.ts";
import { notifierApple, pkpass, reglageApple } from "../wallet/apple.ts";
import { pngUni } from "../wallet/fichiers.ts";
import { lienGoogle, mettreAJourGoogle, reglageGoogle } from "../wallet/google.ts";
import { controlerImages, imageCarte, imagesApple, versionsImages } from "../wallet/images.ts";
import { envoyerEtTracer } from "./emails.ts";
import { soldesPoints } from "./fidelite-caisse.ts";
import { ParamId, Uuid, contexte, corps } from "./outils.ts";

/*
 * Carte abonné dans Apple Wallet et Google Wallet (dossier §14 module 20, §15.147, design §15.148).
 *   - Directeur : lien personnel de l'abonné (créé ou renouvelé), envoi par e-mail ; design des cartes du lieu
 *     (couleurs, textes, liens, logo et bannière).
 *   - Abonné, sans connexion : page /carte/<jeton>, carte Apple (.pkpass), lien Google, logo et bannière pour Google.
 *   - Apple : service web PassKit (inscription des téléphones, carte à jour), notification quand la carte change.
 *   - Google : modèle de carte du lieu (classe) et carte de chaque abonné, remplacés quand ils changent.
 * Les pages publiques ne lisent la base qu'au travers de carte_par_jeton / carte_par_serie (migration 0035).
 */

const adresseSite = () => (config.originesAutorisees[0]?.startsWith("https://") ? config.originesAutorisees[0] : "https://flaixexpert.flaixlabs.com");
const jetonAleatoire = () => randomBytes(32).toString("base64url"); // 43 caractères
const JetonCarte = z.object({ jeton: z.string().regex(/^[A-Za-z0-9_-]{40,64}$/, "Lien de carte invalide.") });
const Sorte = z.object({ sorte: z.enum(["logo", "banniere"], { message: "Image inconnue." }) });

type Carte = DonneesCarte & { auth: string | null; jeton: string | null; maj: Date | null; email: string | null };

/**
 * Ce que montrent les cartes de plusieurs abonnés : lieu, design, nom, numéro, solde (lu comme le lit la caisse),
 * règle, remise, abonné actif ou non. Une seule lecture pour tout le lot (audit du 2026-10-05, P2-3).
 */
export async function donneesCartes(c: Client, lieuId: string, abonneIds: readonly string[]): Promise<Carte[]> {
  if (abonneIds.length === 0) return [];
  const { rows } = await c.query<{
    id: string;
    lieu: string;
    couleur: string | null;
    design: unknown;
    p: number | null;
    palier: number | null;
    valeur: number | null;
    remise: number | null;
    nom: string;
    numero: string;
    actif: boolean;
    auth: string | null;
    jeton: string | null;
    maj: Date | null;
    email: string | null;
  }>(
    `SELECT a.id, l.nom AS lieu, l.carte_couleur AS couleur, l.carte_design AS design, l.fid_points_par_euro AS p, l.fid_palier_points AS palier,
            l.fid_valeur_palier_centimes AS valeur, l.remise_abonne_pb AS remise,
            a.nom, a.numero, a.actif, a.carte_auth AS auth, a.carte_jeton AS jeton, a.carte_maj_le AS maj, a.email
       FROM abonne_fidelite a JOIN lieu l ON l.id = a.lieu_id WHERE a.lieu_id = $1 AND a.id = ANY($2::uuid[])`,
    [lieuId, abonneIds],
  );
  const p = rows[0]?.p ?? null;
  const soldes = p === null ? null : await soldesPoints(c, lieuId, rows.map((r) => r.id), p);
  // Option Fidélité retirée au lieu (§15.118) : toutes ses cartes sont révoquées (audit Codex du 2026-10-05, P1).
  const fidelite = (await lireOptions(c, lieuId)).fidelite;
  return rows.map((r) => ({
    lieuId,
    lieu: r.lieu,
    couleur: r.couleur ?? COULEUR_CARTE_DEFAUT,
    design: lireDesign(r.design),
    abonneId: r.id,
    nom: r.nom,
    numero: r.numero,
    actif: r.actif && fidelite,
    points: soldes ? Math.max(0, soldes.get(r.id) ?? 0) : null,
    regles: r.p !== null && r.palier && r.valeur ? { pointsParEuro: r.p, palierPoints: r.palier, valeurPalier: r.valeur } : null,
    remisePb: r.remise,
    auth: r.auth,
    jeton: r.jeton,
    maj: r.maj,
    email: r.email,
  }));
}

/** La carte d'un abonné ; 404 s'il n'existe pas dans ce lieu. */
export async function donneesCarte(c: Client, lieuId: string, abonneId: string): Promise<Carte> {
  const [d] = await donneesCartes(c, lieuId, [abonneId]);
  if (!d) throw introuvable("Abonné");
  return d;
}

/** Abonnés du lieu qui ont une carte (changement de design, de règle de points, de remise). */
export async function abonnesAvecCarte(c: Client, lieuId: string): Promise<string[]> {
  return (await c.query<{ id: string }>("SELECT id FROM abonne_fidelite WHERE lieu_id = $1 AND carte_jeton IS NOT NULL", [lieuId])).rows.map((r) => r.id);
}

async function carteAbonne(c: Client, lieuId: string, abonneId: string): Promise<CarteAbonne> {
  const d = await donneesCarte(c, lieuId, abonneId);
  const { rows } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2", [lieuId, abonneId]);
  return { lien: d.jeton ? `${adresseSite()}/carte/${d.jeton}` : null, email: d.email, apple: !!reglageApple(), google: !!reglageGoogle(), appareilsApple: rows[0]!.n };
}

/**
 * Adresses publiques du logo et de la bannière (Google va les chercher). La version change à chaque dépôt (et,
 * pour le logo uni par défaut, avec la couleur) : Google reprend alors l'image au lieu de garder l'ancienne.
 */
async function imagesGoogle(c: Client, lieuId: string, couleur: string): Promise<{ logo: string; banniere: string | null }> {
  const v = await versionsImages(c, lieuId);
  return {
    logo: `${adresseSite()}/api/carte-logo/${lieuId}.png?v=${v.logo ?? couleur.slice(1)}`,
    banniere: v.banniere ? `${adresseSite()}/api/carte-banniere/${lieuId}.png?v=${v.banniere}` : null,
  };
}

/** La carte Apple d'un abonné (le jeton d'authentification PassKit est créé au premier besoin). */
async function fichierApple(c: Client, lieuId: string, abonneId: string): Promise<{ fichier: Buffer; maj: Date | null }> {
  const r = reglageApple();
  if (!r) throw new ErreurMetier(404, "La carte Apple Wallet n'est pas encore disponible.");
  const d = await donneesCarte(c, lieuId, abonneId);
  let auth = d.auth;
  if (!auth) {
    auth = jetonAleatoire();
    await c.query("UPDATE abonne_fidelite SET carte_auth = $3 WHERE lieu_id = $1 AND id = $2", [lieuId, abonneId, auth]);
  }
  const pass = passApple(d, { passTypeId: r.passTypeId, teamId: r.teamId, webServiceURL: `${adresseSite()}/api/passkit`, authenticationToken: auth });
  return { fichier: pkpass(pass, await imagesApple(c, lieuId), d.couleur, r), maj: d.maj };
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

/** Taille des lots de cartes mises à jour ensemble : transaction courte, une lecture des soldes par lot. */
const LOT_CARTES = 100;

/**
 * Réponse d'Apple ou de Google qui vaut d'être retentée plus tard : pas de réponse (0), délai, trop de requêtes, panne.
 * Les autres refus (requête invalide…) ne guériraient pas en réessayant : ils restent visibles dans le journal du serveur.
 */
const passager = (statut: number) => statut === 0 || statut === 408 || statut === 429 || statut >= 500;
/** Après 12 essais (environ un jour et demi), la relance est abandonnée et journalisée. */
export const ESSAIS_RELANCE_MAX = 12;

/** Note les envois à retenter et efface les relances devenues inutiles (audit Codex du 2026-10-05). */
async function noterRelances(c: Client, lieuId: string, echecs: Map<string, string>, reussis: readonly string[]): Promise<void> {
  if (reussis.length) await c.query("DELETE FROM wallet_relance WHERE lieu_id = $1 AND cible = ANY($2::text[])", [lieuId, reussis]);
  for (const [cible, cause] of echecs) {
    // Délai croissant : 5 min, 10, 20, 40… jusqu'à 6 h entre deux essais.
    await c.query(
      `INSERT INTO wallet_relance (lieu_id, cible, essais, prochain_essai, cause) VALUES ($1, $2, 1, now() + interval '5 minutes', $3)
       ON CONFLICT (lieu_id, cible) DO UPDATE SET essais = least(wallet_relance.essais + 1, 100), cause = excluded.cause,
              prochain_essai = now() + least(interval '5 minutes' * power(2, wallet_relance.essais), interval '6 hours')`,
      [lieuId, cible, cause.slice(0, 200)],
    );
  }
}

/**
 * Ce que montre la carte a changé (points, nom, design, abonné désactivé) : date de mise à jour, notification aux
 * téléphones Apple inscrits, carte Google remplacée ; avec `classe`, le modèle de carte Google du lieu aussi (design,
 * règle, remise). Par lots de 100, chacun dans sa transaction. Appelé après l'enregistrement, en arrière-plan.
 */
export async function mettreAJourCartes(base: Base, ctx: Contexte, lieuId: string, abonneIds: readonly string[], options: { classe?: boolean } = {}): Promise<void> {
  const apple = reglageApple();
  const google = reglageGoogle();
  let classeAFaire = !!(google && options.classe);
  for (let debut = 0; debut < abonneIds.length; debut += LOT_CARTES) {
    const lot = abonneIds.slice(debut, debut + LOT_CARTES);
    const { cartes, images } = await base.transaction(ctx, async (c) => {
      const { rows } = await c.query<{ id: string }>(
        "UPDATE abonne_fidelite SET carte_maj_le = now() WHERE lieu_id = $1 AND id = ANY($2::uuid[]) AND carte_jeton IS NOT NULL RETURNING id",
        [lieuId, lot],
      );
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) return { cartes: [], images: null };
      const { rows: appareils } = await c.query<{ abonne_id: string; appareil: string; push_token: string }>("SELECT abonne_id, appareil, push_token FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = ANY($2::uuid[])", [lieuId, ids]);
      const donnees = google ? await donneesCartes(c, lieuId, ids) : [];
      const cartes = ids.map((id) => ({ id, donnees: donnees.find((d) => d.abonneId === id) ?? null, appareils: appareils.filter((a) => a.abonne_id === id) }));
      const premiere = donnees[0];
      return { cartes, images: classeAFaire && premiere ? await imagesGoogle(c, lieuId, premiere.couleur) : null };
    });
    // Envois qui échouent passagèrement : notés pour être retentés (relancerCartes), sinon la carte resterait périmée.
    const echecs = new Map<string, string>();
    const reussis: string[] = [];
    // 404 : le modèle n'existe pas encore chez Google (aucun abonné n'a ajouté sa carte) ; il sera créé au premier ajout.
    const premiere = cartes.find((x) => x.donnees)?.donnees;
    if (google && images && premiere) {
      const statut = await mettreAJourGoogle("loyaltyClass", idClasseGoogle(google.issuerId, lieuId), classeGoogle(premiere, google.issuerId, images), google);
      if (passager(statut)) echecs.set("classe", `google ${statut}`);
      else reussis.push("classe");
      classeAFaire = false;
    }
    for (const carte of cartes) {
      if (apple) {
        for (const a of carte.appareils) {
          const statut = await notifierApple(a.push_token, apple);
          // 410 : la carte a été retirée du téléphone ; on cesse de le prévenir.
          if (statut === 410) await base.transaction(ctx, (c) => c.query("DELETE FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2 AND appareil = $3", [lieuId, carte.id, a.appareil]));
          else if (passager(statut)) echecs.set(carte.id, `apple ${statut}`);
        }
      }
      // 404 : l'abonné n'a pas (encore) ajouté sa carte dans Google Wallet ; rien à mettre à jour.
      if (google && carte.donnees) {
        const statut = await mettreAJourGoogle("loyaltyObject", idObjetGoogle(google.issuerId, carte.id), objetGoogle(carte.donnees, google.issuerId), google);
        if (passager(statut)) echecs.set(carte.id, `google ${statut}`);
      }
    }
    // Abonnés du lot sans échec (y compris ceux qui n'ont plus de carte) : plus rien à retenter pour eux.
    reussis.push(...lot.filter((id) => !echecs.has(id)));
    await base.transaction(ctx, (c) => noterRelances(c, lieuId, echecs, reussis));
  }
}

/**
 * Relance des cartes dont l'envoi à Apple ou à Google a échoué passagèrement (audit Codex du 2026-10-05) : lancée
 * toutes les 5 minutes par le serveur. Abandon journalisé après 12 essais. Rend le nombre de relances traitées.
 */
export async function relancerCartes(base: Base, log: FastifyBaseLogger): Promise<number> {
  const { rows: dues } = await base.transaction({}, (c) => c.query<{ lieu_id: string; cible: string }>("SELECT * FROM relances_wallet_dues($1)", [500]));
  const parLieu = new Map<string, string[]>();
  for (const d of dues) parLieu.set(d.lieu_id, [...(parLieu.get(d.lieu_id) ?? []), d.cible]);
  for (const [lieuId, cibles] of parLieu) {
    const ctx = { lieuId };
    try {
      const abandons = await base.transaction(ctx, async (c) => {
        const { rows } = await c.query<{ cible: string; cause: string }>("DELETE FROM wallet_relance WHERE lieu_id = $1 AND cible = ANY($2::text[]) AND essais >= $3 RETURNING cible, cause", [lieuId, cibles, ESSAIS_RELANCE_MAX]);
        return rows;
      });
      for (const a of abandons) log.error({ lieuId, cible: a.cible, cause: a.cause }, `carte wallet abandonnée après ${ESSAIS_RELANCE_MAX} essais`);
      const restantes = cibles.filter((x) => !abandons.some((a) => a.cible === x));
      const classe = restantes.includes("classe");
      let ids = restantes.filter((x) => x !== "classe");
      // Seul le modèle est à renvoyer : il se fabrique avec les données d'une carte du lieu.
      if (classe && ids.length === 0) ids = (await base.transaction(ctx, (c) => abonnesAvecCarte(c, lieuId))).slice(0, 1);
      if (classe && ids.length === 0) {
        await base.transaction(ctx, (c) => c.query("DELETE FROM wallet_relance WHERE lieu_id = $1 AND cible = 'classe'", [lieuId]));
        continue;
      }
      if (ids.length) await mettreAJourCartes(base, ctx, lieuId, ids, { classe });
    } catch (erreur) {
      log.error({ err: erreur, lieuId }, "relance des cartes wallet impossible");
    }
  }
  return dues.length;
}

/** Cartes de quelques abonnés à mettre à jour après un enregistrement : en arrière-plan, la réponse n'attend pas. */
export function suivreCartes(base: Base, req: FastifyRequest, ctx: Contexte, lieuId: string, abonneIds: readonly string[], options: { classe?: boolean } = {}): void {
  if (abonneIds.length === 0) return;
  enArrierePlan(req.log, "cartes wallet non mises à jour", () => mettreAJourCartes(base, ctx, lieuId, abonneIds, options));
}

/** Toutes les cartes du lieu changent (design, règle, remise, nom du lieu) : en arrière-plan, par lots. */
export function suivreToutesLesCartes(base: Base, log: FastifyRequest["log"], ctx: Contexte, lieuId: string): void {
  enArrierePlan(log, "cartes wallet non mises à jour", async () => mettreAJourCartes(base, ctx, lieuId, await base.transaction(ctx, (c) => abonnesAvecCarte(c, lieuId)), { classe: true }));
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

// ---------- Design (§15.148) ----------

const texteOuNull = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .transform((v) => (v ? v : null));
const couleurOuNull = z
  .string()
  .trim()
  .toLowerCase()
  .nullable()
  .refine((v) => v === null || couleurValide(v), "Couleur invalide (format #rrggbb).");
const lienOuNull = texteOuNull(LIMITES_DESIGN.lien, "Lien trop long.").refine((v) => v === null || lienValide(v), "Le lien doit commencer par https://.");

const Design = z.object({
  couleur: z.string().trim().toLowerCase().refine(couleurValide, "Couleur invalide (format #rrggbb)."),
  design: z.object({
    titre: texteOuNull(LIMITES_DESIGN.titre, `Nom du programme : ${LIMITES_DESIGN.titre} caractères au plus.`),
    afficherNomLieu: z.boolean(),
    couleurTexte: couleurOuNull,
    couleurLibelles: couleurOuNull,
    libellePoints: texteOuNull(LIMITES_DESIGN.libellePoints, `Nom des points : ${LIMITES_DESIGN.libellePoints} caractères au plus.`),
    message: texteOuNull(LIMITES_DESIGN.message, `Message : ${LIMITES_DESIGN.message} caractères au plus.`),
    afficherRemise: z.boolean(),
    afficherReduction: z.boolean(),
    siteWeb: lienOuNull,
    telephone: texteOuNull(LIMITES_DESIGN.telephone, "Téléphone trop long.").refine((v) => v === null || telephoneValide(v), "Numéro de téléphone invalide."),
    email: texteOuNull(LIMITES_DESIGN.email, "Adresse e-mail trop longue.").refine((v) => v === null || emailValide(v), "Adresse e-mail invalide."),
    lienApp: lienOuNull,
  }) satisfies z.ZodType<DesignCarte, unknown>,
});

async function etatWallet(c: Client, lieuId: string): Promise<EtatWallet> {
  const { rows } = await c.query<{ nom: string; couleur: string | null; design: unknown; p: number | null; palier: number | null; valeur: number | null; remise: number | null; cartes: number }>(
    `SELECT l.nom, l.carte_couleur AS couleur, l.carte_design AS design, l.fid_points_par_euro AS p, l.fid_palier_points AS palier,
            l.fid_valeur_palier_centimes AS valeur, l.remise_abonne_pb AS remise,
            (SELECT count(*)::int FROM abonne_fidelite a WHERE a.lieu_id = l.id AND a.carte_jeton IS NOT NULL) AS cartes
       FROM lieu l WHERE l.id = $1`,
    [lieuId],
  );
  const r = rows[0]!;
  const v = await versionsImages(c, lieuId);
  const apercu = (sorte: SorteImage, apple: string, google: string) =>
    v[sorte] ? { apple: `/api/wallet/image/${apple}?v=${v[sorte]}`, google: `/api/wallet/image/${google}?v=${v[sorte]}` } : null;
  return {
    apple: !!reglageApple(),
    google: !!reglageGoogle(),
    lieu: r.nom,
    couleur: r.couleur ?? COULEUR_CARTE_DEFAUT,
    design: lireDesign(r.design),
    images: { logo: apercu("logo", "logo@3x", "google-logo"), banniere: apercu("banniere", "strip@3x", "google-hero") },
    regles: r.p !== null && r.palier && r.valeur ? { pointsParEuro: r.p, palierPoints: r.palier, valeurPalier: r.valeur } : null,
    remisePb: r.remise,
    cartes: r.cartes,
  };
}

export async function routesWallet(app: FastifyInstance, { base }: { base: Base }) {
  // ---------- Directeur ----------
  app.get("/api/wallet", async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => etatWallet(c, auth.lieuId));
  });

  // Couleurs, textes, informations et liens de la carte : un seul enregistrement, inscrit au journal.
  app.put("/api/wallet/design", async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Design, req);
    const { etat, change } = await base.transaction(contexte(auth), async (c) => {
      const avant = await etatWallet(c, auth.lieuId);
      const champs = (Object.keys(d.design) as (keyof DesignCarte)[]).filter((k) => d.design[k] !== avant.design[k]);
      if (d.couleur !== avant.couleur) champs.unshift("couleur" as keyof DesignCarte);
      if (champs.length === 0) return { etat: avant, change: false };
      await c.query("UPDATE lieu SET carte_couleur = $2, carte_design = $3 WHERE id = $1", [auth.lieuId, d.couleur, JSON.stringify(d.design)]);
      await inscrireJet(c, { lieuId: auth.lieuId, type: "carte_wallet_design", utilisateurId: auth.utilisateurId, details: { champs } });
      return { etat: await etatWallet(c, auth.lieuId), change: true };
    });
    if (change) suivreToutesLesCartes(base, req.log, contexte(auth), auth.lieuId);
    return etat;
  });

  // Logo ou bannière : l'écran envoie l'image déjà retaillée à chaque format (PNG en base64).
  app.put("/api/wallet/images/:sorte", { bodyLimit: 12 * 1024 * 1024 }, async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    const { sorte } = Sorte.parse(req.params);
    const { variantes } = corps(z.object({ variantes: z.record(z.string(), z.string().max(4_000_000)) }), req);
    const fichiers = controlerImages(sorte, variantes);
    const etat = await base.transaction(contexte(auth), async (c) => {
      await c.query("DELETE FROM carte_image WHERE lieu_id = $1 AND sorte = $2", [auth.lieuId, sorte]);
      for (const f of fichiers) {
        await c.query("INSERT INTO carte_image (lieu_id, variante, sorte, contenu, largeur, hauteur) VALUES ($1, $2, $3, $4, $5, $6)", [auth.lieuId, f.variante, sorte, f.contenu, f.largeur, f.hauteur]);
      }
      await inscrireJet(c, { lieuId: auth.lieuId, type: "carte_wallet_image", utilisateurId: auth.utilisateurId, details: { sorte, action: "deposee", octets: fichiers.reduce((s, f) => s + f.contenu.length, 0) } });
      return etatWallet(c, auth.lieuId);
    });
    suivreToutesLesCartes(base, req.log, contexte(auth), auth.lieuId);
    return etat;
  });

  app.delete("/api/wallet/images/:sorte", async (req): Promise<EtatWallet> => {
    const auth = await exigerDirecteur(req, base);
    const { sorte } = Sorte.parse(req.params);
    const { etat, retiree } = await base.transaction(contexte(auth), async (c) => {
      const { rowCount } = await c.query("DELETE FROM carte_image WHERE lieu_id = $1 AND sorte = $2", [auth.lieuId, sorte]);
      if (rowCount) await inscrireJet(c, { lieuId: auth.lieuId, type: "carte_wallet_image", utilisateurId: auth.utilisateurId, details: { sorte, action: "retiree" } });
      return { etat: await etatWallet(c, auth.lieuId), retiree: !!rowCount };
    });
    if (retiree) suivreToutesLesCartes(base, req.log, contexte(auth), auth.lieuId);
    return etat;
  });

  // Aperçu des images déposées, pour l'écran du directeur.
  app.get("/api/wallet/image/:variante", async (req, rep) => {
    const auth = await exigerDirecteur(req, base);
    const { variante } = z.object({ variante: z.enum(VARIANTES_IMAGE.map((x) => x.nom) as [string, ...string[]]) }).parse(req.params);
    const image = await base.transaction(contexte(auth), (c) => imageCarte(c, auth.lieuId, variante));
    if (!image) throw introuvable("Image");
    return rep.header("content-type", "image/png").header("cache-control", "private, max-age=86400").send(image);
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
    // Lecture d'abord ; l'envoi par Brevo se fait ensuite, hors de la transaction (audit Codex du 2026-10-05).
    const { email, a } = await base.transaction(contexte(auth), async (c) => {
      const d = await donneesCarte(c, auth.lieuId, id);
      if (!d.jeton) throw new ErreurMetier(409, "Crée d'abord le lien de la carte.");
      if (!d.email) throw new ErreurMetier(409, "Cet abonné n'a pas d'adresse e-mail.");
      const { rows } = await c.query<{ formation: boolean }>("SELECT formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1", [auth.lieuId]);
      if (rows[0]?.formation) throw new ErreurMetier(409, "Mode formation : aucun e-mail ne part.");
      return { a: d.email, email: emailLienCarte(d.lieu, d.nom, `${adresseSite()}/carte/${d.jeton}`) };
    });
    return { statut: await envoyerEtTracer(base, contexte(auth), auth.lieuId, "carte_wallet", id, [a], email) };
  });

  // ---------- Abonné, sans connexion ----------
  const limite = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

  app.get("/api/carte/:jeton", limite, async (req): Promise<CartePublique> => {
    const { jeton } = JetonCarte.parse(req.params);
    const { lieuId, abonneId } = await parJeton(base, jeton);
    return base.transaction({ lieuId }, async (c) => {
      const d = await donneesCarte(c, lieuId, abonneId);
      const x = contenuCarte(d);
      const v = await versionsImages(c, lieuId);
      return {
        lieu: d.lieu,
        couleur: x.couleurs.fond,
        couleurTexte: x.couleurs.texte,
        couleurLibelles: x.couleurs.libelles,
        titre: x.titre,
        afficherNomLieu: d.design.afficherNomLieu,
        libellePoints: x.libellePoints,
        nom: d.nom,
        numero: d.numero,
        points: d.points,
        reduction: x.reduction,
        remise: x.remise,
        logo: v.logo ? `/api/carte-logo/${lieuId}.png?v=${v.logo}` : null,
        banniere: v.banniere ? `/api/carte-banniere/${lieuId}.png?v=${v.banniere}` : null,
        apple: !!reglageApple(),
        google: !!reglageGoogle(),
      };
    });
  });

  app.get("/api/carte/:jeton/apple", limite, async (req, rep) => {
    const { jeton } = JetonCarte.parse(req.params);
    const { lieuId, abonneId } = await parJeton(base, jeton);
    const { fichier } = await base.transaction({ lieuId }, (c) => fichierApple(c, lieuId, abonneId));
    return envoyerPkpass(rep, fichier, null);
  });

  app.get("/api/carte/:jeton/google", limite, async (req, rep) => {
    const { jeton } = JetonCarte.parse(req.params);
    const r = reglageGoogle();
    if (!r) throw new ErreurMetier(404, "La carte Google Wallet n'est pas encore disponible.");
    const { lieuId, abonneId } = await parJeton(base, jeton);
    const { d, images } = await base.transaction({ lieuId }, async (c) => {
      const d = await donneesCarte(c, lieuId, abonneId);
      return { d, images: await imagesGoogle(c, lieuId, d.couleur) };
    });
    return rep.redirect(lienGoogle(classeGoogle(d, r.issuerId, images), objetGoogle(d, r.issuerId), adresseSite(), r));
  });

  // Logo de la carte Google (Google l'exige) : celui déposé par le lieu, sinon un carré à sa couleur.
  app.get("/api/carte-logo/:lieu.png", limite, async (req, rep) => {
    const { lieu } = z.object({ lieu: Uuid }).parse(req.params);
    const image = await base.transaction({ lieuId: lieu }, async (c) => {
      const depose = await imageCarte(c, lieu, "google-logo");
      if (depose) return depose;
      const { rows } = await c.query<{ couleur: string | null }>("SELECT carte_couleur AS couleur FROM lieu WHERE id = $1", [lieu]);
      return rows[0] ? pngUni(rows[0].couleur ?? COULEUR_CARTE_DEFAUT, 660, 660) : null;
    });
    if (!image) throw introuvable("Lieu");
    return rep.header("content-type", "image/png").header("cache-control", "public, max-age=3600").send(image);
  });

  // Bannière de la carte Google (image principale), si le lieu en a déposé une.
  app.get("/api/carte-banniere/:lieu.png", limite, async (req, rep) => {
    const { lieu } = z.object({ lieu: Uuid }).parse(req.params);
    const image = await base.transaction({ lieuId: lieu }, (c) => imageCarte(c, lieu, "google-hero"));
    if (!image) throw introuvable("Image");
    return rep.header("content-type", "image/png").header("cache-control", "public, max-age=3600").send(image);
  });

  // ---------- Service web PassKit (Apple) ----------
  const typeValide = (t: string) => t === reglageApple()?.passTypeId;
  // Limites par adresse (audit du 2026-10-05, P2-5) : un téléphone n'appelle qu'à l'ajout, au retrait et après une notification.
  const limitePasskit = { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } };
  const limiteJournal = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

  app.post("/api/passkit/v1/devices/:appareil/registrations/:type/:serie", limitePasskit, async (req, rep) => {
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

  app.delete("/api/passkit/v1/devices/:appareil/registrations/:type/:serie", limitePasskit, async (req, rep) => {
    const { appareil, type, serie } = req.params as { appareil: string; type: string; serie: string };
    const carte = typeValide(type) ? await parSerie(base, req, serie) : null;
    if (!carte) return rep.code(401).send();
    await base.transaction({ lieuId: carte.lieuId }, (c) => c.query("DELETE FROM wallet_appareil WHERE lieu_id = $1 AND abonne_id = $2 AND appareil = $3", [carte.lieuId, carte.abonneId, appareil]));
    return rep.code(200).send();
  });

  app.get("/api/passkit/v1/devices/:appareil/registrations/:type", limitePasskit, async (req, rep) => {
    const { appareil, type } = req.params as { appareil: string; type: string };
    if (!typeValide(type)) return rep.code(404).send();
    const depuis = (req.query as { passesUpdatedSince?: string }).passesUpdatedSince;
    const date = depuis && !Number.isNaN(Date.parse(depuis)) ? new Date(depuis) : null;
    const { rows } = await base.transaction({}, (c) => c.query<{ abonne_id: string; maj_le: Date | null }>("SELECT * FROM cartes_appareil($1, $2)", [appareil, date]));
    if (rows.length === 0) return rep.code(204).send();
    const derniere = rows.reduce((m, r) => Math.max(m, r.maj_le?.getTime() ?? 0), 0);
    return { serialNumbers: rows.map((r) => r.abonne_id), lastUpdated: new Date(derniere || Date.now()).toISOString() };
  });

  app.get("/api/passkit/v1/passes/:type/:serie", limitePasskit, async (req, rep) => {
    const { type, serie } = req.params as { type: string; serie: string };
    const carte = typeValide(type) ? await parSerie(base, req, serie) : null;
    if (!carte) return rep.code(401).send();
    const { fichier, maj } = await base.transaction({ lieuId: carte.lieuId }, (c) => fichierApple(c, carte.lieuId, carte.abonneId));
    return envoyerPkpass(rep, fichier, maj);
  });

  app.post("/api/passkit/v1/log", limiteJournal, async (req, rep) => {
    const { logs } = z.object({ logs: z.array(z.string().max(1000)).max(50).default([]) }).parse(req.body ?? {});
    for (const l of logs) req.log.warn({ passkit: l }, "journal Apple Wallet");
    return rep.code(200).send();
  });
}
