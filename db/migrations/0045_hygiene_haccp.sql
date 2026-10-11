-- =============================================================================
-- 0045 — Hygiène et HACCP (dossier §15.156, demande de Rémi du 2026-10-10).
--
-- Réglages du lieu : équipements suivis en température (froid, surgelé, maintien au chaud, friteuse) avec leurs
-- limites, tâches de nettoyage et de contrôle (ouverture, fermeture, semaine). Un équipement ou une tâche se
-- désactive, il ne se supprime pas : le registre garde ses noms.
-- Registre : relevés de température, tâches faites, contrôles à réception, contrôles de l'huile — en ÉCRITURE SEULE
-- (ni modification ni effacement : c'est la preuve présentée lors d'un contrôle sanitaire). La conformité est
-- calculée par le serveur ; une non-conformité porte toujours son action corrective.
-- Températures en dixièmes de degré ; composés polaires en dixièmes de pour cent.
-- =============================================================================

ALTER TABLE option_lieu DROP CONSTRAINT option_lieu_option_check;
ALTER TABLE option_lieu ADD CONSTRAINT option_lieu_option_check
  CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'export_comptable', 'couts_buvette', 'assistant', 'caisses_connectees', 'hygiene'));

CREATE TABLE hygiene_equipement (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  nom           text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 60),
  stand_id      uuid,
  sorte         text NOT NULL CHECK (sorte IN ('froid', 'surgele', 'chaud', 'friteuse')),
  min_dixiemes  integer CHECK (min_dixiemes BETWEEN -500 AND 1500),
  max_dixiemes  integer CHECK (max_dixiemes BETWEEN -500 AND 1500),
  actif         boolean NOT NULL DEFAULT true,
  origine_id    uuid,
  cree_par      uuid NOT NULL REFERENCES utilisateur (id),
  cree_le       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  CHECK (min_dixiemes IS NULL OR max_dixiemes IS NULL OR min_dixiemes <= max_dixiemes)
);
CREATE UNIQUE INDEX hygiene_equipement_nom_unique ON hygiene_equipement (lieu_id, lower(nom));
ALTER TABLE hygiene_equipement ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_equipement_isolement ON hygiene_equipement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_equipement TO flaix_app;
GRANT UPDATE (nom, stand_id, min_dixiemes, max_dixiemes, actif) ON hygiene_equipement TO flaix_app;

CREATE TABLE hygiene_tache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL REFERENCES lieu (id),
  nom         text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 120),
  stand_id    uuid,
  moment      text NOT NULL CHECK (moment IN ('ouverture', 'fermeture', 'semaine')),
  actif       boolean NOT NULL DEFAULT true,
  origine_id  uuid,
  cree_par    uuid NOT NULL REFERENCES utilisateur (id),
  cree_le     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
ALTER TABLE hygiene_tache ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_tache_isolement ON hygiene_tache USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_tache TO flaix_app;
GRANT UPDATE (nom, stand_id, moment, actif) ON hygiene_tache TO flaix_app;

-- ---------- Registre (écriture seule) ----------

CREATE TABLE hygiene_releve (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id              uuid NOT NULL REFERENCES lieu (id),
  equipement_id        uuid NOT NULL,
  evenement_id         uuid,
  moment               text NOT NULL CHECK (moment IN ('ouverture', 'fermeture', 'autre')),
  temperature_dixiemes integer NOT NULL CHECK (temperature_dixiemes BETWEEN -500 AND 1500),
  conforme             boolean NOT NULL,
  action_corrective    text CHECK (action_corrective IS NULL OR length(btrim(action_corrective)) BETWEEN 3 AND 500),
  saisi_par            uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le             timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, equipement_id) REFERENCES hygiene_equipement (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CHECK (conforme OR action_corrective IS NOT NULL)
);
CREATE INDEX hygiene_releve_date ON hygiene_releve (lieu_id, saisi_le);
ALTER TABLE hygiene_releve ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_releve_isolement ON hygiene_releve USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_releve TO flaix_app;

CREATE TABLE hygiene_tache_faite (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  tache_id      uuid NOT NULL,
  evenement_id  uuid,
  commentaire   text CHECK (commentaire IS NULL OR length(btrim(commentaire)) BETWEEN 1 AND 500),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, tache_id) REFERENCES hygiene_tache (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id)
);
CREATE INDEX hygiene_tache_faite_date ON hygiene_tache_faite (lieu_id, saisi_le);
ALTER TABLE hygiene_tache_faite ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_tache_faite_isolement ON hygiene_tache_faite USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_tache_faite TO flaix_app;

CREATE TABLE hygiene_reception (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id              uuid NOT NULL REFERENCES lieu (id),
  fournisseur          text NOT NULL CHECK (length(btrim(fournisseur)) BETWEEN 1 AND 120),
  produits             text NOT NULL CHECK (length(btrim(produits)) BETWEEN 1 AND 300),
  type                 text NOT NULL CHECK (type IN ('frais', 'surgele', 'sec')),
  temperature_dixiemes integer CHECK (temperature_dixiemes BETWEEN -500 AND 1500),
  dlc_ok               boolean NOT NULL,
  emballage_ok         boolean NOT NULL,
  conforme             boolean NOT NULL,
  action_corrective    text CHECK (action_corrective IS NULL OR length(btrim(action_corrective)) BETWEEN 3 AND 500),
  saisi_par            uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le             timestamptz NOT NULL DEFAULT now(),
  CHECK (conforme OR action_corrective IS NOT NULL)
);
CREATE INDEX hygiene_reception_date ON hygiene_reception (lieu_id, saisi_le);
ALTER TABLE hygiene_reception ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_reception_isolement ON hygiene_reception USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_reception TO flaix_app;

CREATE TABLE hygiene_huile (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id            uuid NOT NULL REFERENCES lieu (id),
  equipement_id      uuid NOT NULL,
  action             text NOT NULL CHECK (action IN ('controle', 'changement')),
  polaires_dixiemes  integer CHECK (polaires_dixiemes BETWEEN 0 AND 1000),
  conforme           boolean NOT NULL,
  action_corrective  text CHECK (action_corrective IS NULL OR length(btrim(action_corrective)) BETWEEN 3 AND 500),
  saisi_par          uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le           timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, equipement_id) REFERENCES hygiene_equipement (lieu_id, id),
  CHECK (conforme OR action_corrective IS NOT NULL),
  CHECK (action = 'changement' OR polaires_dixiemes IS NOT NULL)
);
CREATE INDEX hygiene_huile_date ON hygiene_huile (lieu_id, saisi_le);
ALTER TABLE hygiene_huile ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_huile_isolement ON hygiene_huile USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_huile TO flaix_app;

-- Mode formation : équipements et tâches recopiés dans le jumeau à chaque entrée (le reste de 0044 inchangé).
CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc, cible_marge_pb = r.cible_marge_pb
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  UPDATE categorie f SET cible_marge_pb = r.cible_marge_pb
    FROM categorie r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  UPDATE lieu SET cible_marge_nette_pb = (SELECT cible_marge_nette_pb FROM lieu WHERE id = p_reel) WHERE id = p_form;

  UPDATE poste_depense f SET nom = r.nom, actif = r.actif, mode_habituel = r.mode_habituel, valeur_habituelle = r.valeur_habituelle
    FROM poste_depense r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO poste_depense (lieu_id, nom, actif, cle, mode_habituel, valeur_habituelle, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.actif, r.cle, r.mode_habituel, r.valeur_habituelle, r.id, r.cree_par, r.cree_le FROM poste_depense r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM poste_depense f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  -- Mes frais (§15.154) : frais mensuels du lieu, leurs montants datés, les frais déclarés « pas concerné ».
  UPDATE frais_mensuel f SET nom = r.nom
    FROM frais_mensuel r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO frais_mensuel (lieu_id, nom, cle, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.cle, r.id, r.cree_par, r.cree_le FROM frais_mensuel r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM frais_mensuel f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  DELETE FROM frais_mensuel_montant WHERE lieu_id = p_form;
  INSERT INTO frais_mensuel_montant (lieu_id, frais_id, a_partir_de, montant_centimes, saisi_par, saisi_le)
  SELECT p_form, ff.id, r.a_partir_de, r.montant_centimes, r.saisi_par, r.saisi_le
    FROM frais_mensuel_montant r JOIN frais_mensuel ff ON ff.lieu_id = p_form AND ff.origine_id = r.frais_id
   WHERE r.lieu_id = p_reel;
  DELETE FROM frais_pas_concerne WHERE lieu_id = p_form;
  INSERT INTO frais_pas_concerne (lieu_id, cle, saisi_par, saisi_le)
  SELECT p_form, r.cle, r.saisi_par, r.saisi_le FROM frais_pas_concerne r WHERE r.lieu_id = p_reel;

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

  -- Mercuriale : prix de référence saisis par le lieu (§15.140).
  DELETE FROM prix_reference WHERE lieu_id = p_form;
  INSERT INTO prix_reference (lieu_id, produit_id, ingredient_id, prix_centimes, saisi_par, saisi_le)
  SELECT p_form, fp.id, fi.id, r.prix_centimes, r.saisi_par, r.saisi_le
    FROM prix_reference r
    LEFT JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    LEFT JOIN ingredient fi ON fi.lieu_id = p_form AND fi.origine_id = r.ingredient_id
   WHERE r.lieu_id = p_reel AND (fp.id IS NOT NULL OR fi.id IS NOT NULL);

  -- Conditionnement (§15.155) : emballages du lieu et emballages de chaque produit.
  UPDATE emballage f SET nom = r.nom, prix_millimes = r.prix_millimes
    FROM emballage r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  DELETE FROM produit_emballage WHERE lieu_id = p_form;
  DELETE FROM emballage f WHERE f.lieu_id = p_form AND NOT EXISTS (SELECT 1 FROM emballage r WHERE r.lieu_id = p_reel AND r.id = f.origine_id);
  INSERT INTO emballage (lieu_id, nom, prix_millimes, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.prix_millimes, r.id, r.cree_par, r.cree_le FROM emballage r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM emballage f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  INSERT INTO produit_emballage (lieu_id, produit_id, emballage_id, quantite)
  SELECT p_form, fp.id, fe.id, r.quantite
    FROM produit_emballage r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN emballage fe ON fe.lieu_id = p_form AND fe.origine_id = r.emballage_id
   WHERE r.lieu_id = p_reel;

  -- Hygiène (§15.156) : équipements et tâches suivent ceux du vrai lieu (le registre reste propre à chaque lieu).
  UPDATE hygiene_equipement f SET nom = r.nom, stand_id = fs.id, sorte = r.sorte, min_dixiemes = r.min_dixiemes, max_dixiemes = r.max_dixiemes, actif = r.actif
    FROM hygiene_equipement r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO hygiene_equipement (lieu_id, nom, stand_id, sorte, min_dixiemes, max_dixiemes, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, fs.id, r.sorte, r.min_dixiemes, r.max_dixiemes, r.actif, r.id, r.cree_par, r.cree_le
    FROM hygiene_equipement r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM hygiene_equipement f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  UPDATE hygiene_tache f SET nom = r.nom, stand_id = fs.id, moment = r.moment, actif = r.actif
    FROM hygiene_tache r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO hygiene_tache (lieu_id, nom, stand_id, moment, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, fs.id, r.moment, r.actif, r.id, r.cree_par, r.cree_le
    FROM hygiene_tache r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM hygiene_tache f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
END
$$;

