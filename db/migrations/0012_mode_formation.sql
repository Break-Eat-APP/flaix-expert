-- =============================================================================
-- 0012 — Mode formation « FACTICE » (BOFiP §150, tests B3 et B4 ; dossier §15.109).
--
-- Chaque lieu peut avoir un LIEU DE FORMATION jumeau : un lieu à part entière, isolé par
-- les mêmes politiques de sécurité par ligne que n'importe quel autre lieu. Les ventes,
-- clôtures et comptages faits en formation y sont enregistrés et chaînés comme ailleurs,
-- mais ne peuvent, par construction, toucher aucun compteur du vrai lieu (B4). Chaque
-- écran et chaque justificatif du jumeau porte la mention « FACTICE » (B3, application).
--
-- La configuration du vrai lieu (identité, stands, caisses, produits, prix, équipe) est
-- recopiée dans le jumeau à chaque entrée en formation ; elle ne s'y modifie pas.
-- « Recommencer la formation » retire le jumeau (rien n'est effacé) ; le suivant est neuf.
-- =============================================================================

ALTER TABLE lieu ADD COLUMN formation_de uuid REFERENCES lieu (id);
ALTER TABLE lieu ADD COLUMN formation_retiree_le timestamptz;
ALTER TABLE lieu ADD CONSTRAINT lieu_formation_coherente CHECK (formation_retiree_le IS NULL OR formation_de IS NOT NULL);
ALTER TABLE lieu ADD CONSTRAINT lieu_formation_pas_soi_meme CHECK (formation_de <> id);
CREATE UNIQUE INDEX lieu_une_formation_active ON lieu (formation_de) WHERE formation_de IS NOT NULL AND formation_retiree_le IS NULL;

-- Correspondance jumeau → vrai lieu, pour recopier la configuration sans doublon.
ALTER TABLE stand ADD COLUMN origine_id uuid REFERENCES stand (id);
ALTER TABLE caisse ADD COLUMN origine_id uuid REFERENCES caisse (id);
ALTER TABLE categorie ADD COLUMN origine_id uuid REFERENCES categorie (id);
ALTER TABLE produit ADD COLUMN origine_id uuid REFERENCES produit (id);
ALTER TABLE produit_tarif ADD COLUMN origine_id uuid REFERENCES produit_tarif (id);
ALTER TABLE employe ADD COLUMN origine_id uuid REFERENCES employe (id);
CREATE UNIQUE INDEX stand_origine_unique ON stand (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
CREATE UNIQUE INDEX caisse_origine_unique ON caisse (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
CREATE UNIQUE INDEX categorie_origine_unique ON categorie (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
CREATE UNIQUE INDEX produit_origine_unique ON produit (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
CREATE UNIQUE INDEX produit_tarif_origine_unique ON produit_tarif (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
CREATE UNIQUE INDEX employe_origine_unique ON employe (lieu_id, origine_id) WHERE origine_id IS NOT NULL;

-- Tablette mise en formation par le directeur : toute connexion y ouvre une session de formation.
ALTER TABLE appareil_caisse ADD COLUMN formation boolean NOT NULL DEFAULT false;
GRANT UPDATE (formation) ON appareil_caisse TO flaix_app;

-- -----------------------------------------------------------------------------
-- Lecture sans contexte : un lieu est-il un lieu de formation ? (connexion par e-mail)
-- -----------------------------------------------------------------------------
CREATE FUNCTION est_lieu_formation(p_lieu uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM lieu WHERE id = p_lieu AND formation_de IS NOT NULL) $$;

-- -----------------------------------------------------------------------------
-- Recopie de la configuration du vrai lieu dans son lieu de formation (interne).
-- -----------------------------------------------------------------------------
CREATE FUNCTION synchroniser_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE lieu f
     SET nom = r.nom, raison_sociale = r.raison_sociale, siret = r.siret, tva_intracom = r.tva_intracom,
         adresse = r.adresse, code_postal = r.code_postal, ville = r.ville, remise_abonne_pb = r.remise_abonne_pb,
         seuil_ecart_especes_centimes = r.seuil_ecart_especes_centimes,
         -- Figé une fois un exercice clôturé, en formation comme ailleurs.
         mois_debut_exercice = CASE
           WHEN EXISTS (SELECT 1 FROM cloture_periode c WHERE c.lieu_id = f.id AND c.niveau = 'exercice') THEN f.mois_debut_exercice
           ELSE r.mois_debut_exercice END
    FROM lieu r
   WHERE r.id = p_reel AND f.id = p_form;

  -- Directeurs et caissières du vrai lieu ; jamais un vérificateur.
  INSERT INTO membre (lieu_id, utilisateur_id, role, actif)
  SELECT p_form, m.utilisateur_id, m.role, m.actif FROM membre m WHERE m.lieu_id = p_reel AND m.role IN ('directeur', 'operateur')
  ON CONFLICT (lieu_id, utilisateur_id) DO UPDATE SET role = EXCLUDED.role, actif = EXCLUDED.actif;

  UPDATE stand f SET nom = r.nom, point_retrait_cc = r.point_retrait_cc, actif = r.actif
    FROM stand r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO stand (lieu_id, nom, point_retrait_cc, actif, origine_id)
  SELECT p_form, r.nom, r.point_retrait_cc, r.actif, r.id FROM stand r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM stand f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE caisse f SET stand_id = fs.id, nom = r.nom, especes_autorisees = r.especes_autorisees, actif = r.actif
    FROM caisse r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO caisse (lieu_id, stand_id, numero, nom, especes_autorisees, actif, origine_id)
  SELECT p_form, fs.id, r.numero, r.nom, r.especes_autorisees, r.actif, r.id
    FROM caisse r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM caisse f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE categorie f SET nom = r.nom, actif = r.actif
    FROM categorie r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO categorie (lieu_id, nom, actif, origine_id)
  SELECT p_form, r.nom, r.actif, r.id FROM categorie r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM categorie f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE produit f SET nom = r.nom, categorie_id = fc.id, cout_matiere_centimes = r.cout_matiere_centimes, actif = r.actif
    FROM produit r LEFT JOIN categorie fc ON fc.lieu_id = p_form AND fc.origine_id = r.categorie_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO produit (lieu_id, nom, categorie_id, cout_matiere_centimes, actif, origine_id)
  SELECT p_form, r.nom, fc.id, r.cout_matiere_centimes, r.actif, r.id
    FROM produit r LEFT JOIN categorie fc ON fc.lieu_id = p_form AND fc.origine_id = r.categorie_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM produit f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  DELETE FROM produit_stand ps
   WHERE ps.lieu_id = p_form
     AND NOT EXISTS (
       SELECT 1 FROM produit_stand r
         JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
         JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
        WHERE r.lieu_id = p_reel AND fp.id = ps.produit_id AND fs.id = ps.stand_id);
  INSERT INTO produit_stand (lieu_id, produit_id, stand_id)
  SELECT p_form, fp.id, fs.id FROM produit_stand r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel
  ON CONFLICT DO NOTHING;

  INSERT INTO produit_tarif (lieu_id, produit_id, prix_ttc_centimes, taux_tva_pb, valide_du, saisi_par, saisi_le, origine_id)
  SELECT p_form, fp.id, r.prix_ttc_centimes, r.taux_tva_pb, r.valide_du, r.saisi_par, r.saisi_le, r.id
    FROM produit_tarif r JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM produit_tarif f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE employe f
     SET nom = r.nom, statut = r.statut, agence = r.agence, role = r.role, taux_horaire_centimes = r.taux_horaire_centimes,
         utilisateur_id = r.utilisateur_id, actif = r.actif
    FROM employe r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO employe (lieu_id, nom, statut, agence, role, taux_horaire_centimes, utilisateur_id, actif, origine_id)
  SELECT p_form, r.nom, r.statut, r.agence, r.role, r.taux_horaire_centimes, r.utilisateur_id, r.actif, r.id FROM employe r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM employe f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
END
$$;

-- Lieu de formation en service du vrai lieu, créé au besoin, puis mis à jour (interne).
CREATE FUNCTION ouvrir_formation(p_reel uuid, OUT o_lieu uuid, OUT o_nouveau boolean)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  IF EXISTS (SELECT 1 FROM lieu WHERE id = p_reel AND formation_de IS NOT NULL) THEN
    RAISE EXCEPTION 'Déjà en mode formation' USING ERRCODE = 'check_violation';
  END IF;
  -- Deux entrées simultanées ne créent pas deux lieux de formation.
  PERFORM pg_advisory_xact_lock(hashtextextended('formation:' || p_reel, 0));
  SELECT id INTO o_lieu FROM lieu WHERE formation_de = p_reel AND formation_retiree_le IS NULL;
  o_nouveau := o_lieu IS NULL;
  IF o_nouveau THEN
    INSERT INTO lieu (nom, formation_de) SELECT nom, id FROM lieu WHERE id = p_reel RETURNING id INTO o_lieu;
  END IF;
  PERFORM synchroniser_formation(p_reel, o_lieu);
END
$$;

-- Le directeur entre en formation (depuis le vrai lieu).
CREATE FUNCTION entrer_formation(OUT o_lieu uuid, OUT o_nouveau boolean)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_directeur_courant();
  SELECT f.o_lieu, f.o_nouveau INTO o_lieu, o_nouveau FROM ouvrir_formation(lieu_courant()) f;
END
$$;

-- Une caissière se connecte sur une tablette mise en formation : lieu de formation et caisse jumelle.
CREATE FUNCTION formation_pour_tablette(p_appareil uuid, OUT o_lieu uuid, OUT o_nouveau boolean, OUT o_caisse uuid)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_caisse uuid;
BEGIN
  SELECT a.caisse_id INTO v_caisse FROM appareil_caisse a
   WHERE a.id = p_appareil AND a.lieu_id = lieu_courant() AND a.formation AND a.retire_le IS NULL;
  IF v_caisse IS NULL THEN
    RAISE EXCEPTION 'Cette tablette n''est pas en formation' USING ERRCODE = 'check_violation';
  END IF;
  SELECT f.o_lieu, f.o_nouveau INTO o_lieu, o_nouveau FROM ouvrir_formation(lieu_courant()) f;
  SELECT c.id INTO o_caisse FROM caisse c WHERE c.lieu_id = o_lieu AND c.origine_id = v_caisse;
END
$$;

-- Recommencer : le lieu de formation en service est retiré (rien n'est effacé), ses sessions fermées.
CREATE FUNCTION recommencer_formation() RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_ancien uuid;
BEGIN
  PERFORM exiger_directeur_courant();
  PERFORM pg_advisory_xact_lock(hashtextextended('formation:' || lieu_courant(), 0));
  UPDATE lieu SET formation_retiree_le = now()
   WHERE formation_de = lieu_courant() AND formation_retiree_le IS NULL
  RETURNING id INTO v_ancien;
  IF v_ancien IS NOT NULL THEN
    UPDATE membre SET actif = false WHERE lieu_id = v_ancien;
    UPDATE session SET revoquee_le = now() WHERE lieu_id = v_ancien AND revoquee_le IS NULL;
  END IF;
  RETURN v_ancien;
END
$$;

-- Lieu de formation en service du lieu courant (lecture pour le directeur), ou null.
CREATE FUNCTION formation_du_lieu() RETURNS TABLE (id uuid, cree_le timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT l.id, l.cree_le FROM lieu l WHERE l.formation_de = lieu_courant() AND l.formation_retiree_le IS NULL $$;

-- -----------------------------------------------------------------------------
-- Session : une session de formation est rattachée au jumeau ; la caisse d'une tablette
-- y est la caisse jumelle. Mettre une tablette en formation (ou l'en sortir) ferme la
-- session en cours ; une personne retirée du vrai lieu perd aussi sa session de formation.
-- -----------------------------------------------------------------------------
DROP FUNCTION session_valide(text);
CREATE FUNCTION session_valide(p_jeton_hash text)
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
     AND s.revoquee_le IS NULL
     AND s.expire_le > now()
     AND u.actif
     AND m.actif
     AND l.formation_retiree_le IS NULL
     AND (l.formation_de IS NULL OR EXISTS (
           SELECT 1 FROM membre mr WHERE mr.lieu_id = l.formation_de AND mr.utilisateur_id = s.utilisateur_id AND mr.actif))
     AND (s.appareil_id IS NULL OR (a.retire_le IS NULL AND a.formation = (l.formation_de IS NOT NULL)))
$$;

DROP FUNCTION appareil_pour_connexion(text);
CREATE FUNCTION appareil_pour_connexion(p_jeton_empreinte text)
  RETURNS TABLE (id uuid, lieu_id uuid, caisse_id uuid, formation boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id, lieu_id, caisse_id, formation FROM appareil_caisse WHERE jeton_empreinte = p_jeton_empreinte AND retire_le IS NULL $$;

REVOKE ALL ON FUNCTION est_lieu_formation(uuid), synchroniser_formation(uuid, uuid), ouvrir_formation(uuid), entrer_formation(),
  formation_pour_tablette(uuid), recommencer_formation(), formation_du_lieu(), session_valide(text), appareil_pour_connexion(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION est_lieu_formation(uuid), entrer_formation(), formation_pour_tablette(uuid), recommencer_formation(),
  formation_du_lieu(), session_valide(text), appareil_pour_connexion(text) TO flaix_app;
