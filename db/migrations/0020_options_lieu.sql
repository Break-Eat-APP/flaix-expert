-- =============================================================================
-- 0020 — Options par lieu, activées par Break Eat depuis son back-office (dossier §15.117, §15.118).
--
-- Rémi : « dans mon back office je décide de quel lieu a activer certaines options ».
-- La base (caisse, clôtures, résultats, paramètres, formation) est toujours là ; les options
-- s'ajoutent. Absence de ligne = option ACTIVE : rien ne change pour un lieu existant.
-- Seul un compte éditeur peut écrire (fonction ci-dessous) ; c'est la configuration du contrat,
-- jamais une donnée d'encaissement (§15.13). Chaque changement est inscrit au journal du lieu.
-- =============================================================================

CREATE TABLE option_lieu (
  lieu_id      uuid NOT NULL REFERENCES lieu (id),
  option       text NOT NULL CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'export_comptable', 'couts_buvette')),
  active       boolean NOT NULL,
  modifiee_par uuid NOT NULL REFERENCES utilisateur (id),
  modifiee_le  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, option)
);
ALTER TABLE option_lieu ENABLE ROW LEVEL SECURITY;
-- Un lieu de formation lit les options de son vrai lieu.
CREATE POLICY option_lieu_lecture ON option_lieu
  USING (lieu_id = lieu_courant() OR lieu_id = (SELECT l.formation_de FROM lieu l WHERE l.id = lieu_courant()));
GRANT SELECT ON option_lieu TO flaix_app;

CREATE FUNCTION definir_option_lieu(p_lieu uuid, p_option text, p_active boolean) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  IF NOT EXISTS (SELECT 1 FROM lieu WHERE id = p_lieu AND formation_de IS NULL) THEN
    RAISE EXCEPTION 'Lieu introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  INSERT INTO option_lieu (lieu_id, option, active, modifiee_par) VALUES (p_lieu, p_option, p_active, utilisateur_courant())
  ON CONFLICT (lieu_id, option) DO UPDATE SET active = EXCLUDED.active, modifiee_par = EXCLUDED.modifiee_par, modifiee_le = now();
END
$$;

-- Options désactivées de chaque lieu, pour la vue du parc.
CREATE FUNCTION options_du_parc() RETURNS TABLE (lieu_id uuid, option text, active boolean)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  RETURN QUERY SELECT o.lieu_id, o.option, o.active FROM option_lieu o;
END
$$;

REVOKE ALL ON FUNCTION definir_option_lieu(uuid, text, boolean), options_du_parc() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION definir_option_lieu(uuid, text, boolean), options_du_parc() TO flaix_app;
