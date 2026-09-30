-- =============================================================================
-- 0005 — Comptes des caissières et tablettes enregistrées (dossier §15.100).
--
-- * Une caissière est un compte SANS e-mail ni mot de passe : elle se connecte avec un
--   code personnel à 4 chiffres, et seulement sur une tablette enregistrée par le directeur.
--   Le code n'est jamais stocké, seulement son empreinte argon2id, portée par `membre`
--   (un code par lieu).
-- * Le serveur (`flaix_app`) n'a toujours pas le droit d'écrire librement dans `utilisateur`
--   ni dans `membre` : il passe par trois fonctions qui ne savent créer et modifier QUE des
--   caissières, et seulement quand la requête vient d'un directeur du lieu. Un bogue ne peut
--   donc pas créer un compte directeur ni changer le rôle de quelqu'un.
-- * Une tablette enregistrée garde un jeton dans un cookie protégé ; la base n'en connaît
--   que l'empreinte SHA-256. Une tablette retirée ne revient jamais (nouvel enregistrement).
-- =============================================================================

ALTER TABLE utilisateur ALTER COLUMN email DROP NOT NULL;
ALTER TABLE utilisateur ALTER COLUMN mot_de_passe_hash DROP NOT NULL;
-- Soit un compte à e-mail et mot de passe (directeur, vérificateur), soit ni l'un ni l'autre (caissière).
ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_identifiant CHECK ((email IS NULL) = (mot_de_passe_hash IS NULL));

ALTER TABLE membre ADD COLUMN code_hash text;
ALTER TABLE membre ADD COLUMN code_echecs integer NOT NULL DEFAULT 0 CHECK (code_echecs BETWEEN 0 AND 100);
ALTER TABLE membre ADD COLUMN code_bloque_jusqua timestamptz;
ALTER TABLE membre ADD CONSTRAINT membre_code_caissiere CHECK (code_hash IS NULL OR role = 'operateur');
-- Compteur d'essais : seule écriture directe du serveur sur `membre`.
GRANT UPDATE (code_echecs, code_bloque_jusqua) ON membre TO flaix_app;

-- -----------------------------------------------------------------------------
-- Tablettes enregistrées comme caisse n° X.
-- -----------------------------------------------------------------------------
CREATE TABLE appareil_caisse (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id         uuid NOT NULL REFERENCES lieu (id),
  caisse_id       uuid NOT NULL,
  jeton_empreinte text NOT NULL CHECK (jeton_empreinte ~ '^[0-9a-f]{64}$'),
  enregistre_par  uuid NOT NULL REFERENCES utilisateur (id),
  enregistre_le   timestamptz NOT NULL DEFAULT now(),
  retire_par      uuid REFERENCES utilisateur (id),
  retire_le       timestamptz,
  UNIQUE (lieu_id, id),
  CONSTRAINT appareil_jeton_unique UNIQUE (jeton_empreinte),
  CONSTRAINT appareil_retrait_complet CHECK ((retire_le IS NULL) = (retire_par IS NULL)),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id)
);
CREATE INDEX appareil_caisse_lieu ON appareil_caisse (lieu_id, enregistre_le DESC);
ALTER TABLE appareil_caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY appareil_caisse_isolement ON appareil_caisse USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON appareil_caisse TO flaix_app;
GRANT UPDATE (retire_par, retire_le) ON appareil_caisse TO flaix_app;

-- Une tablette retirée le reste : rien d'autre ne se modifie après l'enregistrement.
CREATE FUNCTION controler_appareil() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF OLD.retire_le IS NOT NULL THEN
    RAISE EXCEPTION 'Une tablette retirée ne revient pas : enregistre-la à nouveau' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.lieu_id <> OLD.lieu_id OR NEW.caisse_id <> OLD.caisse_id OR NEW.jeton_empreinte <> OLD.jeton_empreinte
     OR NEW.enregistre_par <> OLD.enregistre_par OR NEW.enregistre_le <> OLD.enregistre_le THEN
    RAISE EXCEPTION 'Enregistrement de tablette non modifiable' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER appareil_caisse_cycle BEFORE UPDATE ON appareil_caisse FOR EACH ROW EXECUTE FUNCTION controler_appareil();
CREATE TRIGGER appareil_caisse_pas_de_suppression BEFORE DELETE ON appareil_caisse FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Session d'une caissière : toujours liée à la tablette où elle s'est connectée.
ALTER TABLE session ADD COLUMN appareil_id uuid REFERENCES appareil_caisse (id);
ALTER TABLE session ADD CONSTRAINT session_caissiere_sur_tablette CHECK (role <> 'operateur' OR appareil_id IS NOT NULL) NOT VALID;

-- Lecture faite avant de connaître le lieu : quelle tablette porte ce jeton ?
CREATE FUNCTION appareil_pour_connexion(p_jeton_empreinte text)
  RETURNS TABLE (id uuid, lieu_id uuid, caisse_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id, lieu_id, caisse_id FROM appareil_caisse WHERE jeton_empreinte = p_jeton_empreinte AND retire_le IS NULL $$;

-- La session d'une caissière cesse dès que sa tablette est retirée (ou sa fiche désactivée).
DROP FUNCTION session_valide(text);
CREATE FUNCTION session_valide(p_jeton_hash text)
  RETURNS TABLE (utilisateur_id uuid, lieu_id uuid, role text, nom text, email text, appareil_id uuid, appareil_caisse_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT s.utilisateur_id, s.lieu_id, s.role, u.nom, u.email, s.appareil_id, a.caisse_id
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    JOIN membre m ON m.utilisateur_id = s.utilisateur_id AND m.lieu_id = s.lieu_id
    LEFT JOIN appareil_caisse a ON a.id = s.appareil_id
   WHERE s.jeton_hash = p_jeton_hash
     AND s.revoquee_le IS NULL
     AND s.expire_le > now()
     AND u.actif
     AND m.actif
     AND (s.appareil_id IS NULL OR a.retire_le IS NULL)
$$;

-- -----------------------------------------------------------------------------
-- Fiches des caissières : seules écritures possibles, réservées au directeur du lieu.
-- Les fonctions s'exécutent avec les droits du propriétaire (qui n'est pas soumis à la
-- sécurité par ligne) : chaque requête y filtre donc explicitement sur le lieu courant.
-- -----------------------------------------------------------------------------
CREATE FUNCTION exiger_directeur_courant() RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM membre
     WHERE lieu_id = lieu_courant() AND utilisateur_id = utilisateur_courant() AND role = 'directeur' AND actif
  ) THEN
    RAISE EXCEPTION 'Réservé au directeur du lieu' USING ERRCODE = 'insufficient_privilege';
  END IF;
END
$$;

CREATE FUNCTION exiger_nom_caissiere_libre(p_nom text, p_sauf uuid) RETURNS void
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  IF EXISTS (
    SELECT 1 FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
     WHERE m.lieu_id = lieu_courant() AND m.role = 'operateur'
       AND lower(btrim(u.nom)) = lower(btrim(p_nom))
       AND u.id IS DISTINCT FROM p_sauf
  ) THEN
    RAISE EXCEPTION 'Une fiche porte déjà ce nom' USING ERRCODE = 'unique_violation', CONSTRAINT = 'caissiere_nom_unique';
  END IF;
END
$$;

CREATE FUNCTION creer_caissiere(p_nom text, p_code_hash text) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_id uuid;
BEGIN
  PERFORM exiger_directeur_courant();
  PERFORM exiger_nom_caissiere_libre(p_nom, NULL);
  INSERT INTO utilisateur (nom) VALUES (btrim(p_nom)) RETURNING id INTO v_id;
  INSERT INTO membre (lieu_id, utilisateur_id, role, code_hash) VALUES (lieu_courant(), v_id, 'operateur', p_code_hash);
  RETURN v_id;
END
$$;

CREATE FUNCTION modifier_caissiere(p_id uuid, p_nom text, p_actif boolean) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_directeur_courant();
  IF NOT EXISTS (SELECT 1 FROM membre WHERE lieu_id = lieu_courant() AND utilisateur_id = p_id AND role = 'operateur') THEN
    RAISE EXCEPTION 'Fiche de caissière introuvable dans ce lieu' USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM exiger_nom_caissiere_libre(p_nom, p_id);
  UPDATE utilisateur SET nom = btrim(p_nom) WHERE id = p_id;
  UPDATE membre SET actif = p_actif WHERE lieu_id = lieu_courant() AND utilisateur_id = p_id;
END
$$;

-- Nouveau code : l'ancien cesse de fonctionner, le blocage éventuel est levé.
CREATE FUNCTION changer_code_caissiere(p_id uuid, p_code_hash text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_directeur_courant();
  UPDATE membre SET code_hash = p_code_hash, code_echecs = 0, code_bloque_jusqua = NULL
   WHERE lieu_id = lieu_courant() AND utilisateur_id = p_id AND role = 'operateur';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fiche de caissière introuvable dans ce lieu' USING ERRCODE = 'insufficient_privilege';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION appareil_pour_connexion(text), session_valide(text), exiger_directeur_courant(),
  exiger_nom_caissiere_libre(text, uuid), creer_caissiere(text, text), modifier_caissiere(uuid, text, boolean),
  changer_code_caissiere(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION appareil_pour_connexion(text), session_valide(text), creer_caissiere(text, text),
  modifier_caissiere(uuid, text, boolean), changer_code_caissiere(uuid, text) TO flaix_app;
