import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { formaterMontant, rangHeure, type AlerteResultat, type Evenement, type MatchResume, type ProduitVendu, type Resultats, type StatsMatch, type TauxTvaPb } from "@flaix/domain";
import type { Base, Client } from "../base.ts";
import { exigerDirecteur } from "../auth/contexte.ts";
import { listerEvenements } from "./evenements.ts";
import { Uuid, contexte } from "./outils.ts";

/*
 * Résultats (dossier §15.103) : tout est calculé sur le journal de caisse et ses lignes
 * (ventes moins annulations). Une donnée manquante reste null — jamais estimée.
 */

const Choix = z.object({ evenementId: Uuid.optional(), comparaison: Uuid.optional() });

async function resumeMatchs(c: Client, lieuId: string): Promise<MatchResume[]> {
  const { rows } = await c.query<{ id: string; libelle: string; debut: Date; etat: MatchResume["etat"]; spectateurs: number | null; ca: number; tickets: number }>(
    `SELECT e.id, e.libelle, e.debut, e.etat, e.spectateurs,
            sum(j.total_ttc_centimes)::int AS ca,
            (count(*) FILTER (WHERE j.type = 'vente') - count(*) FILTER (WHERE j.type = 'annulation'))::int AS tickets
       FROM evenement e JOIN journal_caisse j ON j.lieu_id = e.lieu_id AND j.evenement_id = e.id AND j.type IN ('vente', 'annulation')
      WHERE e.lieu_id = $1
      GROUP BY e.id
      ORDER BY e.debut DESC`,
    [lieuId],
  );
  return rows.map((r) => ({ id: r.id, libelle: r.libelle, debut: r.debut.toISOString(), etat: r.etat, caTtc: r.ca, tickets: r.tickets, spectateurs: r.spectateurs }));
}

export async function statsMatch(c: Client, lieuId: string, e: Evenement): Promise<StatsMatch> {
  const p = [lieuId, e.id];
  const { rows: tot } = await c.query<{ ca: number; ventes: number; annulations: number; montant_annule: number; especes: number; carte: number }>(
    `SELECT coalesce(sum(total_ttc_centimes), 0)::int AS ca,
            count(*) FILTER (WHERE type = 'vente')::int AS ventes,
            count(*) FILTER (WHERE type = 'annulation')::int AS annulations,
            coalesce(-sum(total_ttc_centimes) FILTER (WHERE type = 'annulation'), 0)::int AS montant_annule,
            coalesce(sum(total_ttc_centimes) FILTER (WHERE mode_reglement = 'especes'), 0)::int AS especes,
            coalesce(sum(total_ttc_centimes) FILTER (WHERE mode_reglement = 'carte'), 0)::int AS carte
       FROM journal_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND type IN ('vente', 'annulation')`,
    p,
  );
  const { rows: heures } = await c.query<{ heure: number; ca: number }>(
    `SELECT extract(hour FROM horodatage AT TIME ZONE 'Europe/Paris')::int AS heure, sum(total_ttc_centimes)::int AS ca
       FROM journal_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND type IN ('vente', 'annulation')
      GROUP BY 1`,
    p,
  );
  const { rows: stands } = await c.query<{ stand_id: string; nom: string; ca: number }>(
    `SELECT j.stand_id, s.nom, sum(j.total_ttc_centimes)::int AS ca
       FROM journal_caisse j JOIN stand s ON s.lieu_id = j.lieu_id AND s.id = j.stand_id
      WHERE j.lieu_id = $1 AND j.evenement_id = $2 AND j.type IN ('vente', 'annulation')
      GROUP BY j.stand_id, s.nom ORDER BY 3 DESC`,
    p,
  );
  // Les lignes des annulations portent des quantités et montants négatifs : les sommes sont nettes.
  const { rows: lignes } = await c.query<{ produit_id: string; nom: string; categorie: string | null; cout: number | null; quantite: number; ttc: number; ht: number }>(
    `SELECT l.produit_id, p.nom, cat.nom AS categorie, p.cout_matiere_centimes AS cout,
            sum(l.quantite)::int AS quantite, sum(l.net_ttc_centimes)::int AS ttc, sum(l.ht_centimes)::int AS ht
       FROM ligne_ticket l
       JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
       JOIN produit p ON p.lieu_id = l.lieu_id AND p.id = l.produit_id
       LEFT JOIN categorie cat ON cat.lieu_id = p.lieu_id AND cat.id = p.categorie_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2
      GROUP BY l.produit_id, p.nom, cat.nom, p.cout_matiere_centimes
      ORDER BY 6 DESC`,
    p,
  );
  const { rows: taux } = await c.query<{ taux: TauxTvaPb; ht: number; tva: number; ttc: number }>(
    `SELECT l.taux_tva_pb AS taux, sum(l.ht_centimes)::int AS ht, sum(l.tva_centimes)::int AS tva, sum(l.net_ttc_centimes)::int AS ttc
       FROM ligne_ticket l JOIN journal_caisse j ON j.lieu_id = l.lieu_id AND j.id = l.journal_id
      WHERE l.lieu_id = $1 AND j.evenement_id = $2
      GROUP BY 1 ORDER BY 1`,
    p,
  );

  const t = tot[0]!;
  const tickets = t.ventes - t.annulations;
  const produits: ProduitVendu[] = lignes
    .filter((l) => l.quantite !== 0 || l.ttc !== 0)
    .map((l) => ({
      produitId: l.produit_id,
      nom: l.nom,
      categorie: l.categorie,
      quantite: l.quantite,
      caTtc: l.ttc,
      caHt: l.ht,
      coutUnitaire: l.cout,
      marge: l.cout === null ? null : l.ht - l.quantite * l.cout,
    }));
  const sansCout = produits.filter((x) => x.coutUnitaire === null && x.quantite > 0);
  const coutMatiere = sansCout.length ? null : produits.reduce((s, x) => s + x.quantite * (x.coutUnitaire ?? 0), 0);
  const caHt = taux.reduce((s, x) => s + x.ht, 0);
  const categories = new Map<string, number>();
  for (const x of produits) categories.set(x.categorie ?? "Sans catégorie", (categories.get(x.categorie ?? "Sans catégorie") ?? 0) + x.caTtc);

  return {
    evenementId: e.id,
    caTtc: t.ca,
    caHt,
    tva: taux.reduce((s, x) => s + x.tva, 0),
    tickets,
    annulations: { nombre: t.annulations, montant: t.montant_annule },
    panierMoyen: tickets > 0 ? Math.round(t.ca / tickets) : null,
    spectateurs: e.spectateurs,
    caParSpectateur: e.spectateurs ? Math.round(t.ca / e.spectateurs) : null,
    parHeure: heures.sort((a, b) => rangHeure(a.heure) - rangHeure(b.heure)).map((h) => ({ heure: h.heure, ca: h.ca })),
    parCategorie: [...categories].map(([nom, ca]) => ({ nom, ca })).sort((a, b) => b.ca - a.ca),
    parStand: stands.map((s) => ({ standId: s.stand_id, nom: s.nom, ca: s.ca })),
    parMode: { especes: t.especes, carte: t.carte },
    parTaux: taux.map((x) => ({ tauxTva: x.taux, ht: x.ht, tva: x.tva, ttc: x.ttc })),
    produits,
    coutMatiere,
    margeBrute: coutMatiere === null ? null : caHt - coutMatiere,
    produitsSansCout: sansCout.map((x) => x.nom),
    caHtSansCout: sansCout.reduce((s, x) => s + x.caHt, 0),
  };
}

/** « À surveiller » : ce qui mérite un regard du directeur sur ce match, sans rien interpréter. */
async function alertes(c: Client, lieuId: string, e: Evenement, s: StatsMatch): Promise<AlerteResultat[]> {
  const liste: AlerteResultat[] = [];
  const { rows: signal } = await c.query<{ prix: number; heure: number; hors_ligne: number }>(
    `SELECT count(*) FILTER (WHERE controle ? 'ecartTarif')::int AS prix,
            count(*) FILTER (WHERE controle ? 'horodatageIncoherent')::int AS heure,
            count(*) FILTER (WHERE controle ? 'horsLigne')::int AS hors_ligne
       FROM journal_caisse WHERE lieu_id = $1 AND evenement_id = $2 AND controle IS NOT NULL`,
    [lieuId, e.id],
  );
  const g = signal[0]!;
  if (g.prix) liste.push({ niveau: "forte", titre: `${g.prix} ticket${g.prix > 1 ? "s" : ""} avec un écart de prix`, detail: "Vendu à un autre prix que le tarif en vigueur : Caisses → Tickets du match" });
  if (g.heure) liste.push({ niveau: "forte", titre: `${g.heure} ticket${g.heure > 1 ? "s" : ""} à l'heure incohérente`, detail: "Horloge d'une tablette à vérifier" });
  const { rows: ecarts } = await c.query<{ numero: number; ecart: number; seuil: number }>(
    `SELECT DISTINCT ON (ce.session_id) k.numero, ce.ecart_centimes AS ecart, ce.seuil_centimes AS seuil
       FROM comptage_especes ce JOIN caisse k ON k.lieu_id = ce.lieu_id AND k.id = ce.caisse_id
      WHERE ce.lieu_id = $1 AND ce.evenement_id = $2
      ORDER BY ce.session_id, ce.le DESC`,
    [lieuId, e.id],
  );
  for (const x of ecarts.filter((x) => Math.abs(x.ecart) > x.seuil)) {
    liste.push({ niveau: "forte", titre: `Caisse ${x.numero} : écart d'espèces de ${formaterMontant(x.ecart)}`, detail: `Au-delà de la tolérance de ${formaterMontant(x.seuil)} : Clôtures` });
  }
  if (e.etat === "ouvert" && e.caissesOuvertes > 0) liste.push({ niveau: "normale", titre: `${e.caissesOuvertes} caisse${e.caissesOuvertes > 1 ? "s" : ""} encore ouverte${e.caissesOuvertes > 1 ? "s" : ""}`, detail: "Les chiffres bougent encore" });
  if (s.annulations.nombre) liste.push({ niveau: "normale", titre: `${s.annulations.nombre} annulation${s.annulations.nombre > 1 ? "s" : ""}`, detail: `${formaterMontant(s.annulations.montant)} annulés : Caisses → Tickets du match` });
  if (s.produitsSansCout.length) {
    const part = s.caHt > 0 ? Math.round((s.caHtSansCout / s.caHt) * 100) : 0;
    liste.push({ niveau: "normale", titre: `Coût manquant sur ${s.produitsSansCout.length} produit${s.produitsSansCout.length > 1 ? "s" : ""}`, detail: `${part} % du CA HT sans marge calculable : Paramètres → Produits & prix` });
  }
  if (e.spectateurs === null) liste.push({ niveau: "normale", titre: "Affluence non saisie", detail: "Pour le CA par spectateur : Paramètres → Saison" });
  if (g.hors_ligne) liste.push({ niveau: "normale", titre: `${g.hors_ligne} ticket${g.hors_ligne > 1 ? "s" : ""} enregistré${g.hors_ligne > 1 ? "s" : ""} hors ligne`, detail: "Réseau coupé pendant le match : tickets reçus ensuite" });
  return liste;
}

export async function routesResultats(app: FastifyInstance, { base }: { base: Base }) {
  app.get("/api/resultats", async (req): Promise<Resultats> => {
    const auth = await exigerDirecteur(req, base);
    const choix = Choix.parse(req.query);
    return base.transaction(contexte(auth), async (c) => {
      const evenements = await listerEvenements(c, auth.lieuId);
      const matchs = await resumeMatchs(c, auth.lieuId);
      const avecVentes = new Set(matchs.map((m) => m.id));
      const maintenant = Date.now();
      const prochains = evenements
        .filter((e) => e.etat === "a_venir" && Date.parse(e.debut) >= maintenant - 6 * 3_600_000)
        .sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut))
        .slice(0, 3)
        .map((e) => ({ id: e.id, libelle: e.libelle, debut: e.debut }));

      // Match affiché : celui demandé ; sinon le match ouvert s'il a des ventes ; sinon le plus récent qui en a.
      const ouvert = evenements.find((e) => e.etat === "ouvert" && avecVentes.has(e.id));
      const evenement = evenements.find((e) => e.id === choix.evenementId) ?? ouvert ?? evenements.find((e) => e.id === matchs[0]?.id) ?? null;
      if (!evenement) return { matchs, evenement: null, comparaison: null, actuel: null, precedent: null, alertes: [], prochains };

      // Comparaison : celle demandée ; sinon le match précédent (dans le temps) qui a des ventes.
      const anterieur = matchs.find((m) => m.id !== evenement.id && Date.parse(m.debut) < Date.parse(evenement.debut));
      const comparaison = evenements.find((e) => e.id === choix.comparaison && e.id !== evenement.id) ?? evenements.find((e) => e.id === anterieur?.id) ?? null;
      const actuel = await statsMatch(c, auth.lieuId, evenement);
      const precedent = comparaison ? await statsMatch(c, auth.lieuId, comparaison) : null;
      return { matchs, evenement, comparaison, actuel, precedent, alertes: await alertes(c, auth.lieuId, evenement, actuel), prochains };
    });
  });
}
