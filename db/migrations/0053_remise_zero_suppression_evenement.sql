-- =============================================================================
-- 0053 — Remise à zéro du stock et suppression d'un événement à venir (dossier §15.165, demande de Rémi du
-- 2026-10-17 : « je veux remettre à zéro les stocks et supprimer les événements du 23, garde les produits et leurs
-- tarifs »).
--
-- Remise à zéro : rien n'est effacé. Une ligne datée (motif, auteur) dit que les restes comptés avant elle ne passent
-- plus à l'événement suivant ; la réserve repart d'un inventaire à 0 (mécanisme existant).
--
-- Suppression : seulement un événement à venir, jamais ouvert. Un événement ouvert puis clos a sa clôture scellée et
-- chaînée aux autres (cloture_periode) : la retirer casserait la chaîne des clôtures, il reste donc dans l'historique.
-- Ce qui avait été préparé pour l'événement à venir (stock, planning, objectifs, dépenses, brief) part avec lui. Les
-- tables en écriture seule le restent : seule la fonction ci-dessous, qui appartient au propriétaire de la base, peut y
-- retirer les lignes de CET événement.
-- =============================================================================

CREATE TABLE stock_remise_zero (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id  uuid NOT NULL REFERENCES lieu (id),
  motif    text NOT NULL CHECK (length(btrim(motif)) BETWEEN 5 AND 300),
  par      uuid NOT NULL REFERENCES utilisateur (id),
  le       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_remise_zero_date ON stock_remise_zero (lieu_id, le DESC);
ALTER TABLE stock_remise_zero ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_remise_zero_isolement ON stock_remise_zero USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON stock_remise_zero TO flaix_app;
CREATE TRIGGER stock_remise_zero_ecriture_seule BEFORE UPDATE OR DELETE ON stock_remise_zero FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER stock_remise_zero_pas_de_vidage BEFORE TRUNCATE ON stock_remise_zero FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

-- Écriture seule, sauf pendant la suppression d'un événement à venir, et pour les seules lignes de cet événement.
-- Le réglage de session n'ouvre rien à l'application : elle n'a pas le droit DELETE sur ces tables.
CREATE FUNCTION refuser_modification_hors_suppression_evenement() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.evenement_id IS NOT NULL AND current_setting('flaix.suppression_evenement', true) = OLD.evenement_id::text THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'La table % est en écriture seule : % refusé', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;

-- Seules les tables en écriture seule qu'un événement à venir peut déjà remplir : sa mise en place (produits,
-- ingrédients) et son brief.
DROP TRIGGER stock_mouvement_ecriture_seule ON stock_mouvement;
CREATE TRIGGER stock_mouvement_ecriture_seule BEFORE UPDATE OR DELETE ON stock_mouvement FOR EACH ROW EXECUTE FUNCTION refuser_modification_hors_suppression_evenement();
DROP TRIGGER ingredient_mouvement_ecriture_seule ON ingredient_mouvement;
CREATE TRIGGER ingredient_mouvement_ecriture_seule BEFORE UPDATE OR DELETE ON ingredient_mouvement FOR EACH ROW EXECUTE FUNCTION refuser_modification_hors_suppression_evenement();
DROP TRIGGER brief_soiree_ecriture_seule ON brief_soiree;
CREATE TRIGGER brief_soiree_ecriture_seule BEFORE UPDATE OR DELETE ON brief_soiree FOR EACH ROW EXECUTE FUNCTION refuser_modification_hors_suppression_evenement();

/*
 * Supprime un événement à venir du lieu courant ; renvoie son libellé. Refuse un événement ouvert ou clos. Toute autre
 * trace inattendue (caisse, ventes, espèces, clôture, hygiène…) bloque la suppression par sa clé étrangère : rien ne
 * part en silence.
 */
CREATE FUNCTION supprimer_evenement_a_venir(p_evenement uuid) RETURNS text
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_lieu uuid := lieu_courant();
  v_etat text;
  v_libelle text;
BEGIN
  SELECT etat, libelle INTO v_etat, v_libelle FROM evenement WHERE lieu_id = v_lieu AND id = p_evenement FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Événement introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_etat <> 'a_venir' THEN
    RAISE EXCEPTION 'Seul un événement à venir se supprime : celui-ci a été ouvert, il ne se supprime pas' USING ERRCODE = 'check_violation';
  END IF;

  PERFORM set_config('flaix.suppression_evenement', p_evenement::text, true);
  DELETE FROM brief_soiree WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM stock_mouvement WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM ingredient_mouvement WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM affectation WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM cible_evenement WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM depense_evenement WHERE lieu_id = v_lieu AND evenement_id = p_evenement;
  DELETE FROM evenement WHERE lieu_id = v_lieu AND id = p_evenement;
  PERFORM set_config('flaix.suppression_evenement', '', true);
  RETURN v_libelle;
END
$$;
REVOKE ALL ON FUNCTION supprimer_evenement_a_venir(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION supprimer_evenement_a_venir(uuid) TO flaix_app;
