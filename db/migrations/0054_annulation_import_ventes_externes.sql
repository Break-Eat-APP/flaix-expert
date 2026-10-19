-- =============================================================================
-- 0054 — Annuler l'import d'un export de caisse connectée (dossier §15.168, retour de Rémi du 2026-10-19 sur un fichier
-- de L'Addition importé avec de mauvaises colonnes : une ligne « - » de 6,7 millions d'euros, des ventes en double).
--
-- Les ventes d'une caisse connectée sont la copie de celles d'un autre logiciel : un import fait avec de mauvaises
-- colonnes doit pouvoir se retirer pour être refait. Rien ne s'efface en silence : l'import reste dans son relevé, son
-- annulation est datée, signée et inscrite au journal ; seules ses ventes et leurs articles sont retirés, par la fonction
-- ci-dessous (propriétaire de la base), pour CET import seulement. Les articles restent en écriture seule partout ailleurs.
-- =============================================================================

CREATE TABLE import_ventes_externes_annule (
  import_id  uuid NOT NULL PRIMARY KEY REFERENCES import_ventes_externes (id),
  lieu_id    uuid NOT NULL REFERENCES lieu (id),
  par        uuid NOT NULL REFERENCES utilisateur (id),
  le         timestamptz NOT NULL DEFAULT now(),
  ventes     integer NOT NULL CHECK (ventes >= 0),
  montant_centimes bigint NOT NULL
);
ALTER TABLE import_ventes_externes_annule ENABLE ROW LEVEL SECURITY;
CREATE POLICY import_ventes_externes_annule_isolement ON import_ventes_externes_annule USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT ON import_ventes_externes_annule TO flaix_app;
CREATE TRIGGER import_ventes_externes_annule_ecriture_seule BEFORE UPDATE OR DELETE ON import_ventes_externes_annule FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Articles en écriture seule, sauf pendant l'annulation d'un import, et pour les seuls articles de ses ventes.
CREATE FUNCTION refuser_modification_hors_annulation_import() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'DELETE' AND EXISTS (
       SELECT 1 FROM vente_externe v
        WHERE v.lieu_id = OLD.lieu_id AND v.caisse_externe_id = OLD.caisse_externe_id AND v.id_externe = OLD.id_externe
          AND v.import_id::text = current_setting('flaix.annulation_import', true)) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'La table % est en écriture seule : % refusé', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;
DROP TRIGGER ligne_vente_externe_ecriture_seule ON ligne_vente_externe;
CREATE TRIGGER ligne_vente_externe_ecriture_seule BEFORE UPDATE OR DELETE ON ligne_vente_externe FOR EACH ROW EXECUTE FUNCTION refuser_modification_hors_annulation_import();

/*
 * Annule un import du lieu courant : retire ses ventes et leurs articles, garde le relevé de l'import et inscrit
 * l'annulation. Une seule fois par import.
 */
CREATE FUNCTION annuler_import_ventes_externes(p_import uuid, p_par uuid) RETURNS TABLE (ventes integer, montant bigint)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_lieu uuid := lieu_courant();
  v_ventes integer;
  v_montant bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM import_ventes_externes WHERE lieu_id = v_lieu AND id = p_import) THEN
    RAISE EXCEPTION 'Import introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  IF EXISTS (SELECT 1 FROM import_ventes_externes_annule WHERE import_id = p_import) THEN
    RAISE EXCEPTION 'Cet import est déjà annulé' USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::int, coalesce(sum(total_centimes), 0) INTO v_ventes, v_montant
    FROM vente_externe WHERE lieu_id = v_lieu AND import_id = p_import AND NOT annulee;
  PERFORM set_config('flaix.annulation_import', p_import::text, true);
  DELETE FROM ligne_vente_externe l USING vente_externe v
   WHERE l.lieu_id = v_lieu AND v.lieu_id = l.lieu_id AND v.caisse_externe_id = l.caisse_externe_id AND v.id_externe = l.id_externe AND v.import_id = p_import;
  DELETE FROM vente_externe WHERE lieu_id = v_lieu AND import_id = p_import;
  PERFORM set_config('flaix.annulation_import', '', true);
  INSERT INTO import_ventes_externes_annule (import_id, lieu_id, par, ventes, montant_centimes) VALUES (p_import, v_lieu, p_par, v_ventes, v_montant);
  RETURN QUERY SELECT v_ventes, v_montant;
END
$$;
REVOKE ALL ON FUNCTION annuler_import_ventes_externes(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION annuler_import_ventes_externes(uuid, uuid) TO flaix_app;
