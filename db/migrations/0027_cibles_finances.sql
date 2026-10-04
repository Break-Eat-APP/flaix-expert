-- 0027 — Cibles de marge et gestion financière de la soirée (modules 5 et 11 ; dossier §15.78, §15.79, §15.132).
--
-- Cibles de marge brute (en points de base du CA HT) : par catégorie, et par produit quand elle est
-- saisie (prioritaire). Aucune valeur par défaut : une cible inventée produirait des alertes sans valeur.
-- Cible de marge nette de la soirée : un gabarit par lieu, ajustable événement par événement.
-- Dépenses de la soirée : des postes nommés par le lieu (un poste se désactive, il ne se supprime pas),
-- et, par événement, un montant en euros ou un pourcentage du CA HT. Chaque saisie est journalisée.

ALTER TABLE categorie ADD COLUMN cible_marge_pb integer CHECK (cible_marge_pb BETWEEN 0 AND 10000);
ALTER TABLE produit ADD COLUMN cible_marge_pb integer CHECK (cible_marge_pb BETWEEN 0 AND 10000);
GRANT UPDATE (cible_marge_pb) ON categorie TO flaix_app;
GRANT UPDATE (cible_marge_pb) ON produit TO flaix_app;

ALTER TABLE lieu ADD COLUMN cible_marge_nette_pb integer CHECK (cible_marge_nette_pb BETWEEN -10000 AND 10000);
GRANT UPDATE (cible_marge_nette_pb) ON lieu TO flaix_app;

-- Cible propre à un événement (prime sur le gabarit du lieu). À part de la table evenement :
-- un événement clos ne se modifie plus, mais sa cible peut encore se discuter.
CREATE TABLE cible_evenement (
  lieu_id       uuid NOT NULL,
  evenement_id  uuid NOT NULL,
  cible_pb      integer NOT NULL CHECK (cible_pb BETWEEN -10000 AND 10000),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, evenement_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id)
);
ALTER TABLE cible_evenement ENABLE ROW LEVEL SECURITY;
CREATE POLICY cible_evenement_isolement ON cible_evenement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON cible_evenement TO flaix_app;

CREATE TABLE poste_depense (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL REFERENCES lieu (id),
  nom         text NOT NULL CHECK (length(nom) BETWEEN 1 AND 60),
  actif       boolean NOT NULL DEFAULT true,
  -- Jumeau de formation : poste d'origine du lieu réel.
  origine_id  uuid,
  cree_par    uuid NOT NULL REFERENCES utilisateur (id),
  cree_le     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX poste_depense_nom_unique ON poste_depense (lieu_id, lower(nom));
ALTER TABLE poste_depense ENABLE ROW LEVEL SECURITY;
CREATE POLICY poste_depense_isolement ON poste_depense USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON poste_depense TO flaix_app;
GRANT UPDATE (nom, actif) ON poste_depense TO flaix_app;

CREATE TABLE depense_evenement (
  lieu_id       uuid NOT NULL,
  evenement_id  uuid NOT NULL,
  poste_id      uuid NOT NULL,
  mode          text NOT NULL CHECK (mode IN ('euros', 'pourcent')),
  -- Centimes en euros (jusqu'à 1 000 000 €), points de base du CA HT en pourcentage (jusqu'à 100 %).
  valeur        integer NOT NULL CHECK (valeur >= 0 AND (mode = 'euros' AND valeur <= 100000000 OR mode = 'pourcent' AND valeur <= 10000)),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, evenement_id, poste_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, poste_id) REFERENCES poste_depense (lieu_id, id)
);
ALTER TABLE depense_evenement ENABLE ROW LEVEL SECURITY;
CREATE POLICY depense_evenement_isolement ON depense_evenement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON depense_evenement TO flaix_app;

-- Mode formation : cibles et postes de dépense recopiés dans le jumeau à chaque entrée (le reste de 0025 inchangé).
CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc, cible_marge_pb = r.cible_marge_pb
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  UPDATE categorie f SET cible_marge_pb = r.cible_marge_pb
    FROM categorie r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  UPDATE lieu SET cible_marge_nette_pb = (SELECT cible_marge_nette_pb FROM lieu WHERE id = p_reel) WHERE id = p_form;

  UPDATE poste_depense f SET nom = r.nom, actif = r.actif
    FROM poste_depense r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO poste_depense (lieu_id, nom, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.actif, r.id, r.cree_par, r.cree_le FROM poste_depense r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM poste_depense f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

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
END
$$;
