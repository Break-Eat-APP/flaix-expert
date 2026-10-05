-- =============================================================================
-- 0033 — Back-office niveau 2 : support sur autorisation du lieu (dossier §15.13, §15.142).
--
-- Le lieu autorise le support (1 h, 4 h ou 24 h) depuis son écran et peut retirer l'autorisation à tout
-- moment. FlaiX Expert ne peut ouvrir une session « support » que pendant une autorisation en cours :
-- la base le vérifie à l'ouverture (ouvrir_session_support) et à chaque requête (session_valide).
-- La session support est en lecture seule : le serveur ouvre ses transactions en READ ONLY, refuse toute
-- requête d'écriture, et chaque consultation est inscrite au journal du lieu.
-- =============================================================================

CREATE TABLE autorisation_support (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id      uuid NOT NULL REFERENCES lieu (id),
  accordee_par uuid NOT NULL REFERENCES utilisateur (id),
  debut        timestamptz NOT NULL DEFAULT now(),
  fin          timestamptz NOT NULL,
  motif        text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 1 AND 200),
  retiree_le   timestamptz,
  retiree_par  uuid REFERENCES utilisateur (id),
  CHECK (fin > debut AND fin <= debut + interval '24 hours 1 minute'),
  CHECK ((retiree_le IS NULL) = (retiree_par IS NULL))
);
CREATE INDEX autorisation_support_lieu ON autorisation_support (lieu_id, debut DESC);
ALTER TABLE autorisation_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY autorisation_support_isolement ON autorisation_support USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON autorisation_support TO flaix_app;
GRANT UPDATE (retiree_le, retiree_par) ON autorisation_support TO flaix_app;

-- Ce que le support a consulté : une ligne par adresse et par session (écriture seule).
CREATE TABLE consultation_support (
  lieu_id         uuid NOT NULL REFERENCES lieu (id),
  autorisation_id uuid NOT NULL REFERENCES autorisation_support (id),
  session_hash    text NOT NULL,
  route           text NOT NULL CHECK (length(route) BETWEEN 1 AND 200),
  editeur_id      uuid NOT NULL REFERENCES utilisateur (id),
  le              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_hash, route)
);
CREATE INDEX consultation_support_autorisation ON consultation_support (lieu_id, autorisation_id, le);
ALTER TABLE consultation_support ENABLE ROW LEVEL SECURITY;
CREATE POLICY consultation_support_isolement ON consultation_support USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON consultation_support TO flaix_app;
CREATE TRIGGER consultation_support_ecriture_seule BEFORE UPDATE OR DELETE ON consultation_support FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Session « support » : rattachée au lieu et à l'autorisation qui la permet.
ALTER TABLE session DROP CONSTRAINT session_role_check;
ALTER TABLE session ADD CONSTRAINT session_role_check CHECK (role IN ('directeur', 'operateur', 'verificateur', 'editeur', 'support'));
ALTER TABLE session ADD COLUMN autorisation_id uuid REFERENCES autorisation_support (id);
ALTER TABLE session ADD CONSTRAINT session_support_autorisee CHECK ((role = 'support') = (autorisation_id IS NOT NULL));

-- Ouverture par un compte éditeur, seulement pendant une autorisation en cours du lieu (jamais un lieu de formation).
CREATE FUNCTION ouvrir_session_support(p_lieu uuid, p_jeton_hash text)
  RETURNS TABLE (autorisation_id uuid, fin timestamptz)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE a record;
BEGIN
  PERFORM exiger_editeur_courant();
  IF p_jeton_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Jeton invalide' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  SELECT s.id, s.fin INTO a FROM autorisation_support s JOIN lieu l ON l.id = s.lieu_id
   WHERE s.lieu_id = p_lieu AND l.formation_de IS NULL AND s.retiree_le IS NULL AND s.debut <= now() AND s.fin > now()
   ORDER BY s.debut DESC LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ce lieu n''a pas autorisé le support FlaiX Expert, ou son autorisation est terminée.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO session (jeton_hash, utilisateur_id, lieu_id, role, expire_le, autorisation_id)
  VALUES (p_jeton_hash, utilisateur_courant(), p_lieu, 'support', a.fin, a.id);
  RETURN QUERY SELECT a.id, a.fin;
END
$$;

-- Lieux où le support est autorisé en ce moment (pour le parc du back-office).
CREATE FUNCTION supports_autorises()
  RETURNS TABLE (lieu_id uuid, fin timestamptz, motif text)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  RETURN QUERY SELECT DISTINCT ON (s.lieu_id) s.lieu_id, s.fin, s.motif FROM autorisation_support s
    WHERE s.retiree_le IS NULL AND s.debut <= now() AND s.fin > now() ORDER BY s.lieu_id, s.debut DESC;
END
$$;

-- Validation d'une session : celles des lieux (inchangé, 0012), plus la session support tant que son
-- autorisation est en cours. Retirer l'autorisation ferme donc l'accès dès la requête suivante.
CREATE OR REPLACE FUNCTION session_valide(p_jeton_hash text)
  RETURNS TABLE (utilisateur_id uuid, lieu_id uuid, role text, nom text, email text, appareil_id uuid, appareil_caisse_id uuid, formation boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT s.utilisateur_id, s.lieu_id, s.role, u.nom, u.email, s.appareil_id,
         CASE WHEN l.formation_de IS NULL THEN a.caisse_id
              ELSE (SELECT c.id FROM caisse c WHERE c.lieu_id = s.lieu_id AND c.origine_id = a.caisse_id) END,
         l.formation_de IS NOT NULL
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    JOIN lieu l ON l.id = s.lieu_id
    JOIN membre m ON m.utilisateur_id = s.utilisateur_id AND m.lieu_id = s.lieu_id
    LEFT JOIN appareil_caisse a ON a.id = s.appareil_id
   WHERE s.jeton_hash = p_jeton_hash
     AND s.role <> 'support'
     AND s.revoquee_le IS NULL
     AND s.expire_le > now()
     AND u.actif
     AND m.actif
     AND l.formation_retiree_le IS NULL
     AND (l.formation_de IS NULL OR EXISTS (
           SELECT 1 FROM membre mr WHERE mr.lieu_id = l.formation_de AND mr.utilisateur_id = s.utilisateur_id AND mr.actif))
     AND (s.appareil_id IS NULL OR (a.retire_le IS NULL AND a.formation = (l.formation_de IS NOT NULL)))
  UNION ALL
  SELECT s.utilisateur_id, s.lieu_id, s.role, u.nom, u.email, NULL::uuid, NULL::uuid, false
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    JOIN compte_editeur e ON e.utilisateur_id = s.utilisateur_id
    JOIN autorisation_support z ON z.id = s.autorisation_id AND z.lieu_id = s.lieu_id
   WHERE s.jeton_hash = p_jeton_hash
     AND s.role = 'support'
     AND s.revoquee_le IS NULL
     AND s.expire_le > now()
     AND u.actif AND e.actif
     AND z.retiree_le IS NULL AND z.fin > now()
$$;

REVOKE ALL ON FUNCTION ouvrir_session_support(uuid, text), supports_autorises() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ouvrir_session_support(uuid, text), supports_autorises() TO flaix_app;
