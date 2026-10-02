-- =============================================================================
-- 0021 — Créer les lieux et les comptes directeur depuis le back-office FlaiX Expert (dossier §15.122).
--
-- Rémi : « dans mon back-office je n'avais pas la possibilité d'ajouter de nouveaux lieux… créer un
-- compte directeur pour un lieu ». Jusqu'ici, seul l'outil d'administration du serveur (flaix-admin)
-- le faisait. Le lieu est créé VIDE, comme avant (aucun stand, aucune caisse, aucun produit).
-- Le mot de passe provisoire est tiré par le serveur : seule son empreinte arrive ici.
-- Le back-office voit le nom et l'e-mail des DIRECTEURS (le contact du client, qu'il a lui-même créé),
-- jamais ceux des caissières ni des employés.
-- =============================================================================

CREATE FUNCTION creer_lieu_editeur(p_nom text) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE v_lieu uuid;
BEGIN
  PERFORM exiger_editeur_courant();
  INSERT INTO lieu (nom) VALUES (btrim(p_nom)) RETURNING id INTO v_lieu;
  RETURN v_lieu;
END
$$;

-- Ajoute un directeur à un lieu réel. Un compte qui existe déjà (même e-mail) est rattaché avec son
-- mot de passe actuel ; sinon il est créé avec l'empreinte du mot de passe provisoire.
CREATE FUNCTION ajouter_directeur_editeur(p_lieu uuid, p_email text, p_nom text, p_hash text)
  RETURNS TABLE (utilisateur_id uuid, nouveau_compte boolean)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE v_id uuid;
BEGIN
  PERFORM exiger_editeur_courant();
  IF NOT EXISTS (SELECT 1 FROM lieu WHERE id = p_lieu AND formation_de IS NULL) THEN
    RAISE EXCEPTION 'Lieu introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  SELECT u.id INTO v_id FROM utilisateur u WHERE lower(u.email) = lower(btrim(p_email));
  IF v_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM compte_editeur e WHERE e.utilisateur_id = v_id) THEN
      RAISE EXCEPTION 'Cette adresse est celle d''un compte FlaiX Expert : un directeur a son propre compte.' USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM membre m WHERE m.lieu_id = p_lieu AND m.utilisateur_id = v_id) THEN
      RAISE EXCEPTION 'Ce compte a déjà accès à ce lieu.' USING ERRCODE = 'unique_violation';
    END IF;
    INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES (p_lieu, v_id, 'directeur');
    RETURN QUERY SELECT v_id, false;
  ELSE
    INSERT INTO utilisateur (email, nom, mot_de_passe_hash) VALUES (lower(btrim(p_email)), btrim(p_nom), p_hash) RETURNING id INTO v_id;
    INSERT INTO membre (lieu_id, utilisateur_id, role) VALUES (p_lieu, v_id, 'directeur');
    RETURN QUERY SELECT v_id, true;
  END IF;
END
$$;

-- Les directeurs de chaque lieu réel, pour la vue du parc.
CREATE FUNCTION directeurs_du_parc()
  RETURNS TABLE (lieu_id uuid, utilisateur_id uuid, nom text, email text, actif boolean)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  RETURN QUERY
  SELECT m.lieu_id, u.id, u.nom, u.email, m.actif AND u.actif
    FROM membre m
    JOIN utilisateur u ON u.id = m.utilisateur_id
    JOIN lieu l ON l.id = m.lieu_id AND l.formation_de IS NULL
   WHERE m.role = 'directeur'
   ORDER BY lower(u.nom);
END
$$;

-- Nouveau mot de passe provisoire pour un directeur (oublié, jamais reçu…). Ses sessions sont fermées.
-- Renvoie les lieux réels dont il est membre : le changement est inscrit au journal de chacun.
CREATE FUNCTION nouveau_mot_de_passe_directeur(p_lieu uuid, p_utilisateur uuid, p_hash text)
  RETURNS SETOF uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  IF NOT EXISTS (
    SELECT 1 FROM membre m JOIN lieu l ON l.id = m.lieu_id
     WHERE m.lieu_id = p_lieu AND m.utilisateur_id = p_utilisateur AND m.role = 'directeur' AND l.formation_de IS NULL
  ) OR EXISTS (SELECT 1 FROM compte_editeur e WHERE e.utilisateur_id = p_utilisateur) THEN
    RAISE EXCEPTION 'Directeur introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  UPDATE utilisateur SET mot_de_passe_hash = p_hash WHERE id = p_utilisateur;
  UPDATE session SET revoquee_le = now() WHERE utilisateur_id = p_utilisateur AND revoquee_le IS NULL;
  RETURN QUERY SELECT m.lieu_id FROM membre m JOIN lieu l ON l.id = m.lieu_id WHERE m.utilisateur_id = p_utilisateur AND l.formation_de IS NULL;
END
$$;

REVOKE ALL ON FUNCTION creer_lieu_editeur(text), ajouter_directeur_editeur(uuid, text, text, text), directeurs_du_parc(),
  nouveau_mot_de_passe_directeur(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION creer_lieu_editeur(text), ajouter_directeur_editeur(uuid, text, text, text), directeurs_du_parc(),
  nouveau_mot_de_passe_directeur(uuid, uuid, text) TO flaix_app;
