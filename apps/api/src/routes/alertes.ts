import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  SEUILS_ALERTES,
  alerteMargeConfiguree,
  alerteMercuriale,
  alerteVariation,
  ecartMercuriale,
  etatCible,
  formaterMontant,
  margeConfiguree,
  niveauAPousser,
  prixUnitaireLivraison,
  tauxMargePb,
  texteAlerteStock,
  trierAlertes,
  variationsFournisseur,
  verdictPrixApp,
  type AlerteCentre,
  type CentreAlertes,
  type LigneMercuriale,
  type ReglagesAlertesPoussees,
  type TauxTvaPb,
  type UniteIngredient,
  evenementTermine,
} from "@flaix/domain";
import { verrouiller, type Base, type Client, type Contexte } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { introuvable } from "../erreurs.ts";
import { inscrireJet } from "../journal-technique.ts";
import { lireOptions } from "../options.ts";
import { etatClickCollect } from "./click-collect.ts";
import { listerEvenements } from "./evenements.ts";
import { notifierDirecteurs } from "./notifications.ts";
import { analysePertes } from "./pertes.ts";
import { resumeMatchs, statsMatch } from "./resultats.ts";
import { stockDuMatch } from "./stock.ts";
import { Uuid, contexte, corps } from "./outils.ts";

/*
 * Centre d'alertes (module 18 ; dossier §14 module 18, §15.23, §15.140) et rupture de stock poussée sur le
 * téléphone. Il lit les autres modules (Stock, Résultats, Revenue Engine, Click & Collect) et ne calcule
 * que trois comparaisons : marge configurée, variation d'un prix fournisseur, écart à la mercuriale.
 */

const Mercuriale = z
  .object({
    produitId: Uuid.optional(),
    ingredientId: Uuid.optional(),
    /** Prix de référence HT (centimes) ; null : retirer la référence. */
    prix: z.number().int().min(1, "Prix de référence invalide.").max(10_000_000).nullable(),
  })
  .refine((x) => !!x.produitId !== !!x.ingredientId, "Indique un produit ou un ingrédient.");
const Reglages = z.object({ rupture: z.boolean(), faible: z.boolean() });

async function lireReglagesAlertes(c: Client, lieuId: string): Promise<ReglagesAlertesPoussees> {
  const { rows } = await c.query<{ rupture: boolean; faible: boolean }>("SELECT alerte_rupture AS rupture, alerte_stock_faible AS faible FROM lieu WHERE id = $1", [lieuId]);
  return { rupture: rows[0]?.rupture ?? true, faible: rows[0]?.faible ?? true };
}

/** Mercuriale : chaque produit actif et chaque ingrédient actif, coût actuel et prix de référence. */
async function lireMercuriale(c: Client, lieuId: string): Promise<LigneMercuriale[]> {
  const { rows } = await c.query<{ type: "produit" | "ingredient"; id: string; nom: string; unite: UniteIngredient | null; cout: number | null; reference: number | null; par: string | null; le: Date | null }>(
    `SELECT 'produit' AS type, p.id, p.nom, NULL AS unite, p.cout_matiere_centimes AS cout, r.prix_centimes AS reference, u.nom AS par, r.saisi_le AS le
       FROM produit p LEFT JOIN prix_reference r ON r.lieu_id = p.lieu_id AND r.produit_id = p.id LEFT JOIN utilisateur u ON u.id = r.saisi_par
      WHERE p.lieu_id = $1 AND p.actif
     UNION ALL
     SELECT 'ingredient', i.id, i.nom, i.unite, i.prix_centimes, r.prix_centimes, u.nom, r.saisi_le
       FROM ingredient i LEFT JOIN prix_reference r ON r.lieu_id = i.lieu_id AND r.ingredient_id = i.id LEFT JOIN utilisateur u ON u.id = r.saisi_par
      WHERE i.lieu_id = $1 AND i.actif
      ORDER BY 1 DESC, 3`,
    [lieuId],
  );
  return rows.map((r) => ({
    cle: `${r.type === "produit" ? "p" : "i"}:${r.id}`,
    type: r.type,
    id: r.id,
    nom: r.nom,
    unite: r.unite,
    coutActuel: r.cout,
    reference: r.reference,
    ecartPb: ecartMercuriale(r.cout, r.reference),
    saisiPar: r.par,
    saisiLe: r.le?.toISOString() ?? null,
  }));
}

export async function centreAlertes(c: Client, lieuId: string): Promise<CentreAlertes> {
  const options = await lireOptions(c, lieuId);
  const evenements = await listerEvenements(c, lieuId);
  const alertes: AlerteCentre[] = [];

  // 1. En ce moment : ruptures et stocks faibles de l'événement ouvert (Stock, même règle).
  const enCours = evenements.find((e) => e.etat === "ouvert") ?? null;
  if (enCours && options.stock) {
    const s = await stockDuMatch(c, lieuId, enCours);
    for (const st of s.stands) {
      for (const l of st.lignes) {
        if (!l.alerte) continue;
        alertes.push({
          id: `${l.alerte === "rupture" ? "rupture" : "stock_faible"}:${st.standId}:${l.produitId}`,
          type: l.alerte === "rupture" ? "rupture" : "stock_faible",
          source: "en_direct",
          niveau: l.alerte === "rupture" ? "forte" : "normale",
          titre: `${l.alerte === "rupture" ? "Rupture" : "Stock faible"} : ${l.nom} à ${st.nom}`,
          detail: `Reste ${Math.max(0, l.restant)} sur ${l.depart + l.reassort} · vendu ${l.vendu}. Réassort en deux gestes depuis « En direct ».`,
          impact: null,
          lien: "/direct",
        });
      }
    }
  }

  // 2. Lues dans les autres modules, sur le dernier événement clos qui a des ventes.
  const joues = await resumeMatchs(c, lieuId);
  const dernierResume = joues.find((m) => evenementTermine(m, true)) ?? null;
  const dernier = dernierResume ? (evenements.find((e) => e.id === dernierResume.id) ?? null) : null;
  const ventes = new Map<string, number>();
  if (dernier) {
    const stats = await statsMatch(c, lieuId, dernier);
    for (const p of stats.produits) ventes.set(p.produitId, p.quantite);
    for (const p of stats.produits) {
      const etat = etatCible(tauxMargePb(p.marge, p.caHt), p.cibleMarge ?? null);
      if (etat.statut !== "sous" || p.marge === null) continue;
      const manque = Math.round((etat.ciblePb! * p.caHt) / 10_000) - p.marge;
      alertes.push({
        id: `marge_realisee:${p.produitId}`,
        type: "marge_realisee",
        source: "lue",
        niveau: "normale",
        titre: `${p.nom} : marge réalisée sous sa cible (${dernier.libelle})`,
        detail: `${(etat.tauxPb! / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % pour une cible de ${(etat.ciblePb! / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % : ${formaterMontant(manque)} de marge manquante sur ${p.quantite} ventes.`,
        impact: manque > 0 ? manque : null,
        lien: "/parametres/produits",
      });
    }
    // Pertes constatées du Revenue Engine (§15.138) : stock, espèces, prix non respecté.
    const pertes = await analysePertes(c, lieuId, [dernier], dernier.id);
    for (const p of pertes.analyse.perdu) {
      if (p.nature !== "constate") continue;
      const type = p.famille === "stock" ? "perte_stock" : p.famille === "especes" ? "especes" : "prix_ticket";
      alertes.push({ id: `${type}:${p.titre}`, type, source: "lue", niveau: p.famille === "stock" ? "normale" : "forte", titre: p.titre, detail: `${dernier.libelle} — ${p.detail}`, impact: p.montantConnu ? p.haut : null, lien: p.lien });
    }
  }

  // Prix de l'application de commande qui ne couvre pas la marge du comptoir (Click & Collect).
  if (options.click_collect) {
    const cc = await etatClickCollect(c, lieuId);
    if (cc.reglages) {
      for (const p of cc.produits) {
        if (p.prixApp === null) continue;
        const v = verdictPrixApp(p.prixApp, p.prixBuvette, p.tauxTva, cc.reglages);
        if (v.couvre) continue;
        alertes.push({
          id: `prix_app:${p.id}`,
          type: "prix_app",
          source: "lue",
          niveau: "normale",
          titre: `${p.nom} : le prix de l'application de commande ne couvre pas la marge du comptoir`,
          detail: `Il manque ${formaterMontant(Math.round(-v.ecartParVente))} par vente sur l'application (${formaterMontant(p.prixApp)} contre ${formaterMontant(p.prixBuvette)} au comptoir).`,
          impact: null,
          lien: "/parametres/click-collect",
        });
      }
    }
  }

  // 3. Calculées ici (module 18) : marge configurée sous la cible, au prix et au coût actuels.
  const { rows: produits } = await c.query<{ id: string; nom: string; prix: number; tva: TauxTvaPb; cout: number | null; cible: number | null }>(
    `SELECT p.id, p.nom, t.prix_ttc_centimes AS prix, t.taux_tva_pb AS tva, p.cout_matiere_centimes AS cout, coalesce(p.cible_marge_pb, cat.cible_marge_pb) AS cible
       FROM produit p LEFT JOIN categorie cat ON cat.lieu_id = p.lieu_id AND cat.id = p.categorie_id
       JOIN LATERAL (SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif WHERE lieu_id = p.lieu_id AND produit_id = p.id AND valide_du <= now() ORDER BY valide_du DESC LIMIT 1) t ON true
      WHERE p.lieu_id = $1 AND p.actif`,
    [lieuId],
  );
  for (const p of produits) {
    const m = margeConfiguree(p.prix, p.tva, p.cout, p.cible);
    if (!m || m.etat.statut !== "sous" || m.ecartParVente === null) continue;
    alertes.push(alerteMargeConfiguree({ id: p.id, nom: p.nom, tauxPb: m.etat.tauxPb!, ciblePb: m.etat.ciblePb!, ecartParVente: m.ecartParVente, ventesDernierEvenement: ventes.get(p.id) ?? null }));
  }

  // Variation du prix d'un fournisseur, livraison à livraison (produits et ingrédients).
  const { rows: livraisons } = await c.query<{ cle: string; nom: string; fournisseur: string | null; prix: number; quantite: number; unite: UniteIngredient | null; le: Date }>(
    `SELECT 'p:' || m.produit_id AS cle, p.nom, m.fournisseur, m.prix_unitaire_centimes AS prix, m.quantite::float8 AS quantite, NULL AS unite, m.le
       FROM stock_mouvement m JOIN produit p ON p.lieu_id = m.lieu_id AND p.id = m.produit_id
      WHERE m.lieu_id = $1 AND m.type = 'livraison' AND m.prix_unitaire_centimes IS NOT NULL
     UNION ALL
     SELECT 'i:' || m.ingredient_id, i.nom, m.fournisseur, m.prix_total_centimes, m.quantite_milli::float8, i.unite, m.le
       FROM ingredient_mouvement m JOIN ingredient i ON i.lieu_id = m.lieu_id AND i.id = m.ingredient_id
      WHERE m.lieu_id = $1 AND m.type = 'livraison' AND m.prix_total_centimes IS NOT NULL AND m.quantite_milli > 0`,
    [lieuId],
  );
  const variations = variationsFournisseur(
    livraisons.map((l) =>
      l.cle.startsWith("i:")
        ? { cle: l.cle, nom: l.nom, fournisseur: l.fournisseur, prix: prixUnitaireLivraison(l.prix, l.quantite), quantite: l.quantite / 1000, unite: l.unite, le: l.le.toISOString() }
        : { cle: l.cle, nom: l.nom, fournisseur: l.fournisseur, prix: l.prix, quantite: l.quantite, unite: null, le: l.le.toISOString() },
    ),
  );
  alertes.push(...variations.map(alerteVariation));

  // Écart à la mercuriale (prix de référence saisi par le lieu).
  const mercuriale = await lireMercuriale(c, lieuId);
  for (const l of mercuriale) {
    const a = alerteMercuriale(l, l.type === "produit" ? (ventes.get(l.id) ?? null) : null);
    if (a) alertes.push(a);
  }

  return {
    evenementEnCours: enCours ? { id: enCours.id, libelle: enCours.libelle } : null,
    dernierEvenement: dernier ? { id: dernier.id, libelle: dernier.libelle, debut: dernier.debut } : null,
    alertes: trierAlertes(alertes),
    mercuriale,
    reglages: await lireReglagesAlertes(c, lieuId),
    seuils: SEUILS_ALERTES,
  };
}

/**
 * Rupture et stock faible poussés sur le téléphone (§15.140), appelé après l'enregistrement de tickets reçus
 * d'une tablette : seuls les produits de ces tickets, au stand de la caisse. Une seule notification par
 * niveau, stand et produit jusqu'au prochain réassort. Une erreur ici n'annule jamais les tickets.
 */
export async function pousserAlertesStock(base: Base, ctx: Contexte, lieuId: string, evenementId: string, standId: string, produitIds: readonly string[]): Promise<number> {
  if (produitIds.length === 0) return 0;
  return base.transaction(ctx, async (c) => {
    const { rows: lieu } = await c.query<{ formation: boolean }>("SELECT formation_de IS NOT NULL AS formation FROM lieu WHERE id = $1", [lieuId]);
    if (lieu[0]?.formation) return 0; // le mode formation n'envoie aucune notification
    const reglages = await lireReglagesAlertes(c, lieuId);
    if (!reglages.rupture && !reglages.faible) return 0;
    if (!(await lireOptions(c, lieuId)).stock) return 0;
    // Stock suivi pour ces produits à ce stand pendant cet événement ? Sinon, rien à calculer.
    const { rows: suivi } = await c.query(
      "SELECT 1 FROM stock_mouvement WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND produit_id = ANY($4::uuid[]) LIMIT 1",
      [lieuId, evenementId, standId, produitIds],
    );
    if (!suivi[0]) return 0;
    const e = (await listerEvenements(c, lieuId)).find((x) => x.id === evenementId);
    if (!e) throw introuvable("Événement");
    const stand = (await stockDuMatch(c, lieuId, e)).stands.find((s) => s.standId === standId);
    let envoyees = 0;
    for (const l of stand?.lignes ?? []) {
      if (!produitIds.includes(l.produitId)) continue;
      const niveau = niveauAPousser(l.alerte, reglages);
      if (!niveau) continue;
      await verrouiller(c, `alerte-stock:${evenementId}:${standId}:${l.produitId}`);
      // Déjà poussé à ce niveau (ou en rupture, pour un stock faible) depuis le dernier réassort ?
      const { rows: deja } = await c.query(
        "SELECT 1 FROM alerte_stock_poussee WHERE lieu_id = $1 AND evenement_id = $2 AND stand_id = $3 AND produit_id = $4 AND reassort = $5 AND (niveau = $6 OR niveau = 'rupture')",
        [lieuId, evenementId, standId, l.produitId, l.reassort, niveau],
      );
      if (deja[0]) continue;
      const texte = texteAlerteStock({ niveau, produit: l.nom, stand: stand!.nom, restant: l.restant, depart: l.depart, reassort: l.reassort, vendu: l.vendu });
      const { envoyees: n } = await notifierDirecteurs(c, lieuId, { titre: texte.titre, corps: texte.corps, url: "/direct" });
      await c.query(
        "INSERT INTO alerte_stock_poussee (lieu_id, evenement_id, stand_id, produit_id, niveau, reassort, depart, restant, envoye_a) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [lieuId, evenementId, standId, l.produitId, niveau, l.reassort, l.depart, l.restant, n],
      );
      envoyees += n;
    }
    return envoyees;
  });
}

export async function routesAlertes(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/alertes", async (req): Promise<CentreAlertes> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => centreAlertes(c, auth.lieuId));
  });

  // Mercuriale : prix de référence saisi ici et nulle part ailleurs (module 18), journalisé.
  app.put("/api/alertes/mercuriale", async (req): Promise<CentreAlertes> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Mercuriale, req);
    return base.transaction(contexte(auth), async (c) => {
      const colonne = d.produitId ? "produit_id" : "ingredient_id";
      const id = d.produitId ?? d.ingredientId!;
      const { rows: objet } = await c.query<{ nom: string }>(`SELECT nom FROM ${d.produitId ? "produit" : "ingredient"} WHERE lieu_id = $1 AND id = $2`, [auth.lieuId, id]);
      if (!objet[0]) throw introuvable(d.produitId ? "Produit" : "Ingrédient");
      const { rows: avant } = await c.query<{ prix: number }>(`SELECT prix_centimes AS prix FROM prix_reference WHERE lieu_id = $1 AND ${colonne} = $2`, [auth.lieuId, id]);
      const ancien = avant[0]?.prix ?? null;
      if (ancien !== d.prix) {
        if (d.prix === null) await c.query(`DELETE FROM prix_reference WHERE lieu_id = $1 AND ${colonne} = $2`, [auth.lieuId, id]);
        else if (ancien === null) await c.query(`INSERT INTO prix_reference (lieu_id, ${colonne}, prix_centimes, saisi_par) VALUES ($1, $2, $3, $4)`, [auth.lieuId, id, d.prix, auth.utilisateurId]);
        else await c.query(`UPDATE prix_reference SET prix_centimes = $3, saisi_par = $4, saisi_le = now() WHERE lieu_id = $1 AND ${colonne} = $2`, [auth.lieuId, id, d.prix, auth.utilisateurId]);
        await inscrireJet(c, {
          lieuId: auth.lieuId,
          type: "mercuriale_modifiee",
          utilisateurId: auth.utilisateurId,
          details: { [d.produitId ? "produit" : "ingredient"]: objet[0].nom, avant: ancien === null ? null : formaterMontant(ancien), apres: d.prix === null ? null : formaterMontant(d.prix) },
        });
      }
      return centreAlertes(c, auth.lieuId);
    });
  });

  app.get("/api/alertes/reglages", async (req): Promise<ReglagesAlertesPoussees> => {
    const auth = await exigerDirecteur(req, base);
    return base.transaction(contexte(auth), (c) => lireReglagesAlertes(c, auth.lieuId));
  });

  app.put("/api/alertes/reglages", async (req): Promise<ReglagesAlertesPoussees> => {
    const auth = await exigerDirecteur(req, base);
    const d = corps(Reglages, req);
    return base.transaction(contexte(auth), async (c) => {
      const avant = await lireReglagesAlertes(c, auth.lieuId);
      if (avant.rupture !== d.rupture || avant.faible !== d.faible) {
        await c.query("UPDATE lieu SET alerte_rupture = $2, alerte_stock_faible = $3 WHERE id = $1", [auth.lieuId, d.rupture, d.faible]);
        await inscrireJet(c, { lieuId: auth.lieuId, type: "alertes_reglages_modifies", utilisateurId: auth.utilisateurId, details: { avant, apres: d } });
      }
      return lireReglagesAlertes(c, auth.lieuId);
    });
  });
}
