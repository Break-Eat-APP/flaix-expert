-- =============================================================================
-- 0025 — Caisse automatique selon la date, clôture par le directeur (dossier §15.130).
--
-- Rémi : « que la caissière n'ait rien à faire et qu'elle ait accès à sa caisse en fonction de la
-- date ; c'est au directeur de faire la clôture de la caisse ».
-- * Fond de caisse prévu par le directeur, caisse par caisse : la caisse d'une caissière s'ouvre
--   seule avec ce fond (repli : saisie, s'il n'est pas prévu).
-- * Nouvelles de la tablette : son dernier ticket scellé et ce qu'elle a encore à envoyer. Le
--   directeur ne clôture une caisse à distance que si tout est reçu, sauf clôture forcée signée.
-- =============================================================================

ALTER TABLE caisse ADD COLUMN fond_prevu_centimes integer CHECK (fond_prevu_centimes BETWEEN 0 AND 1000000);
GRANT UPDATE (fond_prevu_centimes) ON caisse TO flaix_app;

ALTER TABLE session_caisse ADD COLUMN tablette_vue_le timestamptz;
ALTER TABLE session_caisse ADD COLUMN tablette_sequence integer CHECK (tablette_sequence >= 0);
ALTER TABLE session_caisse ADD COLUMN tablette_attente integer CHECK (tablette_attente >= 0);
GRANT UPDATE (tablette_vue_le, tablette_sequence, tablette_attente) ON session_caisse TO flaix_app;

CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

  -- Fond de caisse prévu par le directeur (§15.130).
  UPDATE caisse f SET fond_prevu_centimes = r.fond_prevu_centimes
    FROM caisse r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

  DELETE FROM frais_stand WHERE lieu_id = p_form;
  INSERT INTO frais_stand (lieu_id, stand_id, poste, a_partir_de, montant_centimes, saisi_par, saisi_le)
  SELECT p_form, fs.id, r.poste, r.a_partir_de, r.montant_centimes, r.saisi_par, r.saisi_le
    FROM frais_stand r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel;

  UPDATE ingredient f SET nom = r.nom, prix_centimes = r.prix_centimes, actif = r.actif, suivi_stock = r.suivi_stock
    FROM ingredient r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO ingredient (lieu_id, nom, unite, prix_centimes, actif, suivi_stock, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.unite, r.prix_centimes, r.actif, r.suivi_stock, r.id, r.cree_par, r.cree_le FROM ingredient r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM ingredient f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  DELETE FROM recette_ligne WHERE lieu_id = p_form;
  INSERT INTO recette_ligne (lieu_id, produit_id, ingredient_id, quantite_milli)
  SELECT p_form, fp.id, fi.id, r.quantite_milli
    FROM recette_ligne r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN ingredient fi ON fi.lieu_id = p_form AND fi.origine_id = r.ingredient_id
   WHERE r.lieu_id = p_reel;
END
$$;
