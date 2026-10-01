-- =============================================================================
-- 0018 — Back-office éditeur, niveau 1 : supervision technique (module 17 ; dossier §15.13, §15.116).
--
-- Comptes Break Eat (« éditeur »), distincts des comptes des lieux : ils ne sont membres d'aucun
-- lieu et leurs sessions n'ont pas de lieu. Les politiques de sécurité par ligne ne leur laissent
-- donc voir ni écrire aucune donnée d'un lieu (tests B6 / B7) ; la seule lecture possible passe
-- par vue_parc(), qui ne renvoie AUCUN montant, AUCUN ticket, AUCUN nom de salarié.
-- Le niveau 2 (support sur autorisation du lieu, lecture seule et limitée dans le temps) relève du
-- dossier de conformité, à voir avec Rémi : non construit.
-- =============================================================================

CREATE TABLE compte_editeur (
  utilisateur_id uuid PRIMARY KEY REFERENCES utilisateur (id),
  actif          boolean NOT NULL DEFAULT true,
  cree_le        timestamptz NOT NULL DEFAULT now()
);
-- Aucun droit direct pour le serveur : tout passe par les fonctions ci-dessous.
REVOKE ALL ON compte_editeur FROM PUBLIC;

-- Une session éditeur n'a pas de lieu ; une session de lieu en a toujours un.
ALTER TABLE session ALTER COLUMN lieu_id DROP NOT NULL;
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'session'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%verificateur%' LOOP
    EXECUTE format('ALTER TABLE session DROP CONSTRAINT %I', c);
  END LOOP;
END
$$;
ALTER TABLE session ADD CONSTRAINT session_role_check CHECK (role IN ('directeur', 'operateur', 'verificateur', 'editeur'));
ALTER TABLE session ADD CONSTRAINT session_editeur_sans_lieu CHECK ((role = 'editeur') = (lieu_id IS NULL));

CREATE FUNCTION compte_editeur_pour_connexion(p_email text)
  RETURNS TABLE (id uuid, nom text, email text, mot_de_passe_hash text, actif boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT u.id, u.nom, u.email, u.mot_de_passe_hash, u.actif AND e.actif
    FROM utilisateur u JOIN compte_editeur e ON e.utilisateur_id = u.id
   WHERE lower(u.email) = lower(btrim(p_email))
$$;

CREATE FUNCTION session_editeur_valide(p_jeton_hash text)
  RETURNS TABLE (utilisateur_id uuid, nom text, email text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT s.utilisateur_id, u.nom, u.email
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    JOIN compte_editeur e ON e.utilisateur_id = s.utilisateur_id
   WHERE s.jeton_hash = p_jeton_hash AND s.role = 'editeur' AND s.lieu_id IS NULL
     AND s.revoquee_le IS NULL AND s.expire_le > now() AND u.actif AND e.actif
$$;

CREATE FUNCTION exiger_editeur_courant() RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM compte_editeur e JOIN utilisateur u ON u.id = e.utilisateur_id WHERE e.utilisateur_id = utilisateur_courant() AND e.actif AND u.actif) THEN
    RAISE EXCEPTION 'Réservé aux comptes éditeur Break Eat' USING ERRCODE = 'insufficient_privilege';
  END IF;
END
$$;

-- Changement du mot de passe d'un compte éditeur par lui-même (il n'a pas de lieu pour la politique de visibilité).
CREATE FUNCTION changer_mot_de_passe_editeur(p_hash text, p_session text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  UPDATE utilisateur SET mot_de_passe_hash = p_hash WHERE id = utilisateur_courant();
  UPDATE session SET revoquee_le = now() WHERE utilisateur_id = utilisateur_courant() AND jeton_hash <> p_session AND revoquee_le IS NULL;
END
$$;

CREATE FUNCTION hash_mot_de_passe_editeur() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT u.mot_de_passe_hash FROM utilisateur u JOIN compte_editeur e ON e.utilisateur_id = u.id WHERE u.id = utilisateur_courant() $$;

-- -----------------------------------------------------------------------------
-- Vue du parc : une ligne par lieu réel (jamais un lieu de formation). Aucun montant, aucun ticket,
-- aucun nom de salarié : des dates, des compteurs et des états.
-- -----------------------------------------------------------------------------
CREATE FUNCTION vue_parc()
  RETURNS TABLE (
    lieu_id uuid, nom text, raison_sociale text, cree_le timestamptz,
    stands_actifs int, caisses_actives int, tablettes int,
    exercice_regle boolean, matchs_joues int, matchs_ouverts int, plus_ancien_ouvert timestamptz,
    dernier_z timestamptz, dernier_mois_cloture date, mois_a_cloturer int,
    derniere_activite timestamptz, derniere_verification timestamptz, verification_ok boolean
  )
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  RETURN QUERY
  SELECT l.id, l.nom, l.raison_sociale, l.cree_le,
         (SELECT count(*)::int FROM stand s WHERE s.lieu_id = l.id AND s.actif),
         (SELECT count(*)::int FROM caisse k WHERE k.lieu_id = l.id AND k.actif),
         (SELECT count(*)::int FROM appareil_caisse a WHERE a.lieu_id = l.id AND a.retire_le IS NULL),
         l.mois_debut_exercice IS NOT NULL,
         (SELECT count(*)::int FROM evenement e WHERE e.lieu_id = l.id AND e.etat IN ('ouvert', 'clos')),
         (SELECT count(*)::int FROM evenement e WHERE e.lieu_id = l.id AND e.etat = 'ouvert'),
         (SELECT min(e.ouvert_le) FROM evenement e WHERE e.lieu_id = l.id AND e.etat = 'ouvert'),
         (SELECT max(c.horodatage) FROM cloture_periode c WHERE c.lieu_id = l.id AND c.niveau = 'match'),
         (SELECT max(c.fin) FROM cloture_periode c WHERE c.lieu_id = l.id AND c.niveau = 'mois'),
         (SELECT count(DISTINCT date_trunc('month', e.debut AT TIME ZONE 'Europe/Paris'))::int
            FROM evenement e
           WHERE e.lieu_id = l.id AND e.etat IN ('ouvert', 'clos')
             AND date_trunc('month', e.debut AT TIME ZONE 'Europe/Paris') < date_trunc('month', now() AT TIME ZONE 'Europe/Paris')
             AND NOT EXISTS (SELECT 1 FROM cloture_periode c WHERE c.lieu_id = l.id AND c.niveau = 'mois'
                              AND c.debut = date_trunc('month', e.debut AT TIME ZONE 'Europe/Paris')::date)),
         (SELECT max(j.horodatage) FROM journal_technique j WHERE j.lieu_id = l.id),
         v.horodatage, (v.details->>'ok')::boolean
    FROM lieu l
    LEFT JOIN LATERAL (
      SELECT j.horodatage, j.details FROM journal_technique j
       WHERE j.lieu_id = l.id AND j.type = 'verification_editeur' ORDER BY j.numero DESC LIMIT 1
    ) v ON true
   WHERE l.formation_de IS NULL
   ORDER BY lower(l.nom);
END
$$;

REVOKE ALL ON FUNCTION compte_editeur_pour_connexion(text), session_editeur_valide(text), exiger_editeur_courant(),
  changer_mot_de_passe_editeur(text, text), hash_mot_de_passe_editeur(), vue_parc() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION compte_editeur_pour_connexion(text), session_editeur_valide(text), exiger_editeur_courant(),
  changer_mot_de_passe_editeur(text, text), hash_mot_de_passe_editeur(), vue_parc() TO flaix_app;
