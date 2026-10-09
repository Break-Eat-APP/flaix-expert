-- =============================================================================
-- 0041 — Ventes de gestion : la caisse FlaiX Expert et les caisses connectées réunies (dossier §15.151).
--
-- Les écrans de gestion (résultats, marges, cibles, rapport de soirée, finances, stock, prévision, coûts par buvette,
-- prix fournisseurs) lisent ces deux vues au lieu du journal de caisse : elles ajoutent aux tickets scellés les ventes
-- importées d'une caisse connectée (§15.150), dans la même forme. Rien de fiscal ne les lit : Z, clôtures, export
-- comptable, fidélité et journal de caisse restent sur les seuls tickets scellés de FlaiX Expert.
--
-- Vente importée : comptée si elle n'est pas annulée ; lignes des produits « ignorés » (consigne, frais) écartées ;
-- stand d'après la correspondance du point de vente ; taux de TVA du fichier, sinon celui du produit rapproché, sinon
-- inconnu (montant hors taxes inconnu, jamais supposé).
-- =============================================================================

ALTER TABLE vente_externe ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE vente_externe ADD CONSTRAINT vente_externe_id_unique UNIQUE (id);

-- Les vues lisent avec les droits de celui qui interroge : la sécurité par lieu des tables s'applique.
CREATE VIEW vente_gestion WITH (security_invoker = true) AS
  SELECT j.lieu_id, j.id, 'caisse'::text AS source, j.evenement_id, j.stand_id, j.caisse_id, j.type, j.horodatage,
         j.total_ttc_centimes, j.mode_reglement, j.ref_evenement, j.controle
    FROM journal_caisse j
   WHERE j.type IN ('vente', 'annulation')
  UNION ALL
  SELECT v.lieu_id, v.id, 'externe'::text, v.evenement_id, cp.stand_id, NULL::uuid, 'vente'::text, v.horodatage,
         (SELECT coalesce(sum(l.montant_centimes), 0)::integer
            FROM ligne_vente_externe l
            LEFT JOIN correspondance_produit_externe m ON m.lieu_id = l.lieu_id AND m.caisse_externe_id = l.caisse_externe_id AND m.cle = l.cle
           WHERE l.lieu_id = v.lieu_id AND l.caisse_externe_id = v.caisse_externe_id AND l.id_externe = v.id_externe
             AND NOT coalesce(m.ignore, false)),
         CASE
           -- Le cashless (bracelet, QR code prépayé) n'est ni des espèces ni une carte bancaire.
           WHEN lower(coalesce(v.paiement, '')) ~ '(cashless|bracelet|prepay|prépay|nfc)' THEN NULL
           WHEN lower(coalesce(v.paiement, '')) ~ '(esp|^cash$|liquide|monnaie|billet)' THEN 'especes'
           WHEN lower(coalesce(v.paiement, '')) ~ '(carte|cb|card|visa|master|amex|sans contact|contactless|tpe)' THEN 'carte'
         END,
         NULL::uuid, NULL::jsonb
    FROM vente_externe v
    LEFT JOIN correspondance_point_de_vente cp ON cp.lieu_id = v.lieu_id AND cp.caisse_externe_id = v.caisse_externe_id AND cp.nom = v.point_de_vente
   WHERE NOT v.annulee;

CREATE VIEW ligne_gestion WITH (security_invoker = true) AS
  SELECT l.lieu_id, l.journal_id, l.produit_id, l.libelle, l.quantite::numeric AS quantite, l.prix_unitaire_centimes, l.taux_tva_pb,
         l.brut_centimes, l.remise_centimes, l.offert_centimes, l.fidelite_centimes, l.net_ttc_centimes, l.ht_centimes, l.tva_centimes
    FROM ligne_ticket l
  UNION ALL
  SELECT l.lieu_id, v.id, m.produit_id, l.libelle, l.quantite, l.prix_unitaire_centimes, t.taux,
         l.montant_centimes, 0, 0, 0, l.montant_centimes,
         CASE WHEN t.taux IS NULL THEN NULL ELSE round(l.montant_centimes * 10000.0 / (10000 + t.taux))::integer END,
         CASE WHEN t.taux IS NULL THEN NULL ELSE l.montant_centimes - round(l.montant_centimes * 10000.0 / (10000 + t.taux))::integer END
    FROM ligne_vente_externe l
    JOIN vente_externe v ON v.lieu_id = l.lieu_id AND v.caisse_externe_id = l.caisse_externe_id AND v.id_externe = l.id_externe AND NOT v.annulee
    LEFT JOIN correspondance_produit_externe m ON m.lieu_id = l.lieu_id AND m.caisse_externe_id = l.caisse_externe_id AND m.cle = l.cle
    CROSS JOIN LATERAL (
      SELECT coalesce(l.tva_pb, (SELECT pt.taux_tva_pb FROM produit_tarif pt WHERE pt.lieu_id = l.lieu_id AND pt.produit_id = m.produit_id
                                  ORDER BY pt.valide_du DESC LIMIT 1)) AS taux
    ) t
   WHERE NOT coalesce(m.ignore, false);

GRANT SELECT ON vente_gestion, ligne_gestion TO flaix_app;
