-- =============================================================================
-- 0043 — « Ce qu'il te reste » et « Mes frais » (dossier §15.154, demande de Rémi du 2026-10-10).
--
-- Le résultat de la soirée devient « ce qu'il te reste » : tous les frais déduits, dont la part des frais du mois
-- (stands et lieu), répartie au prorata du CA HT des soirées du mois (choix de Rémi, 2026-10-11).
--   - poste de dépense de soirée : montant habituel (appliqué à chaque soirée sans saisie propre), clé du frais
--     proposé dont il est la réponse ; nouvelle unité « % des paiements par carte » (frais bancaires) ;
--   - frais mensuels du lieu, nommés, aux montants datés (un montant vaut à partir de son mois, sans réécrire les
--     mois passés ; un frais s'arrête par un montant à 0) ;
--   - frais proposés déclarés « pas concerné » par le lieu.
-- Chaque modification est journalisée par le serveur.
-- =============================================================================

ALTER TABLE poste_depense ADD COLUMN cle text CHECK (cle IS NULL OR length(cle) BETWEEN 1 AND 40);
ALTER TABLE poste_depense ADD COLUMN mode_habituel text CHECK (mode_habituel IN ('euros', 'pourcent', 'pourcent_carte'));
ALTER TABLE poste_depense ADD COLUMN valeur_habituelle integer;
ALTER TABLE poste_depense ADD CONSTRAINT poste_depense_habituel_check CHECK (
  (mode_habituel IS NULL) = (valeur_habituelle IS NULL)
  AND (valeur_habituelle IS NULL OR valeur_habituelle >= 0 AND (mode_habituel = 'euros' AND valeur_habituelle <= 100000000 OR mode_habituel <> 'euros' AND valeur_habituelle <= 10000))
);
CREATE UNIQUE INDEX poste_depense_cle_unique ON poste_depense (lieu_id, cle) WHERE cle IS NOT NULL;
GRANT UPDATE (mode_habituel, valeur_habituelle) ON poste_depense TO flaix_app;

-- Unité « % des paiements par carte » : les contrôles de la dépense d'une soirée sont refaits.
DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'depense_evenement'::regclass AND contype = 'c' LOOP
    EXECUTE format('ALTER TABLE depense_evenement DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;
ALTER TABLE depense_evenement ADD CONSTRAINT depense_evenement_mode_check CHECK (mode IN ('euros', 'pourcent', 'pourcent_carte'));
ALTER TABLE depense_evenement ADD CONSTRAINT depense_evenement_valeur_check
  CHECK (valeur >= 0 AND (mode = 'euros' AND valeur <= 100000000 OR mode <> 'euros' AND valeur <= 10000));

CREATE TABLE frais_mensuel (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL REFERENCES lieu (id),
  nom         text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 80),
  cle         text CHECK (cle IS NULL OR length(cle) BETWEEN 1 AND 40),
  -- Jumeau de formation : frais d'origine du lieu réel.
  origine_id  uuid,
  cree_par    uuid NOT NULL REFERENCES utilisateur (id),
  cree_le     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX frais_mensuel_nom_unique ON frais_mensuel (lieu_id, lower(nom));
CREATE UNIQUE INDEX frais_mensuel_cle_unique ON frais_mensuel (lieu_id, cle) WHERE cle IS NOT NULL;
ALTER TABLE frais_mensuel ENABLE ROW LEVEL SECURITY;
CREATE POLICY frais_mensuel_isolement ON frais_mensuel USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON frais_mensuel TO flaix_app;
GRANT UPDATE (nom) ON frais_mensuel TO flaix_app;

CREATE TABLE frais_mensuel_montant (
  lieu_id          uuid NOT NULL,
  frais_id         uuid NOT NULL,
  -- Premier jour du mois à partir duquel le montant s'applique.
  a_partir_de      date NOT NULL CHECK (extract(day FROM a_partir_de) = 1),
  montant_centimes integer NOT NULL CHECK (montant_centimes BETWEEN 0 AND 100000000),
  saisi_par        uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, frais_id, a_partir_de),
  FOREIGN KEY (lieu_id, frais_id) REFERENCES frais_mensuel (lieu_id, id)
);
ALTER TABLE frais_mensuel_montant ENABLE ROW LEVEL SECURITY;
CREATE POLICY frais_mensuel_montant_isolement ON frais_mensuel_montant USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON frais_mensuel_montant TO flaix_app;
GRANT UPDATE (montant_centimes, saisi_par, saisi_le) ON frais_mensuel_montant TO flaix_app;

CREATE TABLE frais_pas_concerne (
  lieu_id    uuid NOT NULL REFERENCES lieu (id),
  cle        text NOT NULL CHECK (length(cle) BETWEEN 1 AND 40),
  saisi_par  uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, cle)
);
ALTER TABLE frais_pas_concerne ENABLE ROW LEVEL SECURITY;
CREATE POLICY frais_pas_concerne_isolement ON frais_pas_concerne USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON frais_pas_concerne TO flaix_app;

-- Mode formation : Mes frais recopiés dans le jumeau à chaque entrée (le reste de 0031 inchangé).
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
END
$$;

