-- =============================================================================
-- 0022 — Décisions de Rémi du 2026-10-03 (dossier §15.124).
--
-- 1. L'export pour l'expert-comptable fait partie de la base : ce n'est plus une option.
-- 2. Click & Collect : la commission de la plateforme se calcule sur le prix buvette (cas d'origine)
--    ou sur le prix payé dans l'application (une autre plateforme peut calculer ainsi).
-- 3. Au passage : les règles de points de fidélité sont recopiées dans le lieu de formation, comme
--    les autres réglages (elles manquaient à la recopie).
-- =============================================================================

DELETE FROM option_lieu WHERE option = 'export_comptable';
ALTER TABLE option_lieu DROP CONSTRAINT option_lieu_option_check;
ALTER TABLE option_lieu ADD CONSTRAINT option_lieu_option_check
  CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'couts_buvette'));

ALTER TABLE lieu ADD COLUMN cc_commission_sur_prix_app boolean NOT NULL DEFAULT false;
GRANT UPDATE (cc_commission_sur_prix_app) ON lieu TO flaix_app;

CREATE OR REPLACE FUNCTION synchroniser_reglages_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE lieu f
     SET nom = r.nom, raison_sociale = r.raison_sociale, siret = r.siret, tva_intracom = r.tva_intracom,
         adresse = r.adresse, code_postal = r.code_postal, ville = r.ville, remise_abonne_pb = r.remise_abonne_pb,
         seuil_ecart_especes_centimes = r.seuil_ecart_especes_centimes, plan_comptes = r.plan_comptes,
         cc_commission_pb = r.cc_commission_pb, cc_tva_commission_repercutee = r.cc_tva_commission_repercutee,
         cc_stripe_taux_pb = r.cc_stripe_taux_pb, cc_stripe_fixe_centimes = r.cc_stripe_fixe_centimes,
         cc_panier_moyen_centimes = r.cc_panier_moyen_centimes, cc_commission_sur_prix_app = r.cc_commission_sur_prix_app,
         fid_points_par_euro = r.fid_points_par_euro, fid_palier_points = r.fid_palier_points,
         fid_valeur_palier_centimes = r.fid_valeur_palier_centimes,
         -- Figé une fois un exercice clôturé, en formation comme ailleurs.
         mois_debut_exercice = CASE
           WHEN EXISTS (SELECT 1 FROM cloture_periode c WHERE c.lieu_id = f.id AND c.niveau = 'exercice') THEN f.mois_debut_exercice
           ELSE r.mois_debut_exercice END
    FROM lieu r
   WHERE r.id = p_reel AND f.id = p_form;
END
$$;
