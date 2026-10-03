-- =============================================================================
-- 0023 — Stock des ingrédients, au choix ingrédient par ingrédient (décision de Rémi, dossier §15.124).
--
-- Une case « suivre le stock » sur l'ingrédient. Un ingrédient suivi vit comme un produit en stock :
-- livraisons en réserve (le prix devient le coût moyen pondéré), mise en place et réassort par
-- stand et par match, comptage de fin de match, inventaire de la réserve. Ce qui est « vendu » ne
-- se saisit pas : c'est la recette de chaque produit vendu (une pinte déduit 0,5 L du fût).
-- Quantités en MILLIÈMES de l'unité d'achat (g, ml, millième de pièce), comme les recettes.
-- La consommation d'un match est figée à sa clôture : changer une recette ensuite ne réécrit pas
-- le passé. Tout est en écriture seule, comme le stock des produits.
-- =============================================================================

ALTER TABLE ingredient ADD COLUMN suivi_stock boolean NOT NULL DEFAULT false;
GRANT UPDATE (suivi_stock) ON ingredient TO flaix_app;

CREATE TABLE ingredient_mouvement (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id             uuid NOT NULL REFERENCES lieu (id),
  type                text NOT NULL CHECK (type IN ('livraison', 'mise_en_place', 'reassort')),
  ingredient_id       uuid NOT NULL,
  evenement_id        uuid,
  stand_id            uuid,
  quantite_milli      bigint NOT NULL CHECK (quantite_milli <> 0 AND quantite_milli BETWEEN -1000000000 AND 1000000000),
  prix_total_centimes integer CHECK (prix_total_centimes BETWEEN 0 AND 100000000),
  fournisseur         text CHECK (fournisseur IS NULL OR length(btrim(fournisseur)) BETWEEN 1 AND 120),
  date_livraison      date,
  -- Prix de l'ingrédient (par unité d'achat) avant et après le recalcul CUMP d'une livraison.
  prix_avant_centimes integer,
  prix_apres_centimes integer,
  par                 uuid NOT NULL REFERENCES utilisateur (id),
  le                  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  CONSTRAINT ingredient_mouvement_forme CHECK (
    (type = 'livraison' AND evenement_id IS NULL AND stand_id IS NULL AND quantite_milli > 0
       AND prix_total_centimes IS NOT NULL AND date_livraison IS NOT NULL)
    OR (type IN ('mise_en_place', 'reassort') AND evenement_id IS NOT NULL AND stand_id IS NOT NULL
       AND prix_total_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
       AND prix_avant_centimes IS NULL AND prix_apres_centimes IS NULL)
  )
);
CREATE INDEX ingredient_mouvement_match ON ingredient_mouvement (lieu_id, evenement_id, stand_id, ingredient_id);
CREATE INDEX ingredient_mouvement_ingredient ON ingredient_mouvement (lieu_id, ingredient_id, le);
ALTER TABLE ingredient_mouvement ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredient_mouvement_isolement ON ingredient_mouvement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ingredient_mouvement TO flaix_app;
CREATE TRIGGER ingredient_mouvement_ecriture_seule BEFORE UPDATE OR DELETE ON ingredient_mouvement FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER ingredient_mouvement_pas_de_vidage BEFORE TRUNCATE ON ingredient_mouvement FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
-- Mêmes règles de cycle que les produits : mise en place avant l'ouverture, réassort pendant le match.
CREATE TRIGGER ingredient_mouvement_cycle BEFORE INSERT ON ingredient_mouvement FOR EACH ROW EXECUTE FUNCTION controler_mouvement_stock();

CREATE TABLE ingredient_comptage (
  lieu_id         uuid NOT NULL REFERENCES lieu (id),
  evenement_id    uuid NOT NULL,
  stand_id        uuid NOT NULL,
  ingredient_id   uuid NOT NULL,
  quantite_milli  bigint NOT NULL CHECK (quantite_milli BETWEEN 0 AND 1000000000),
  motif           text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 5 AND 300),
  par             uuid NOT NULL REFERENCES utilisateur (id),
  le              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evenement_id, stand_id, ingredient_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
ALTER TABLE ingredient_comptage ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredient_comptage_isolement ON ingredient_comptage USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ingredient_comptage TO flaix_app;
GRANT UPDATE (quantite_milli, motif, par, le) ON ingredient_comptage TO flaix_app;
CREATE TRIGGER ingredient_comptage_cycle BEFORE INSERT OR UPDATE OR DELETE ON ingredient_comptage FOR EACH ROW EXECUTE FUNCTION controler_comptage_stock();

-- Lignes d'ingrédients d'un inventaire de la réserve (l'en-tête est celui des produits).
CREATE TABLE inventaire_reserve_ingredient (
  lieu_id        uuid NOT NULL,
  inventaire_id  uuid NOT NULL,
  ingredient_id  uuid NOT NULL,
  -- Solde calculé au moment de l'inventaire (null : premier inventaire de cet ingrédient).
  calcule_milli  bigint,
  compte_milli   bigint NOT NULL CHECK (compte_milli BETWEEN 0 AND 1000000000),
  PRIMARY KEY (inventaire_id, ingredient_id),
  FOREIGN KEY (lieu_id, inventaire_id) REFERENCES inventaire_reserve (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
ALTER TABLE inventaire_reserve_ingredient ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventaire_reserve_ingredient_isolement ON inventaire_reserve_ingredient USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON inventaire_reserve_ingredient TO flaix_app;
CREATE TRIGGER inventaire_reserve_ingredient_ecriture_seule BEFORE UPDATE OR DELETE ON inventaire_reserve_ingredient FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Consommation théorique d'un match (Σ ventes × recette), figée à la clôture du match.
CREATE TABLE ingredient_consommation (
  lieu_id         uuid NOT NULL,
  evenement_id    uuid NOT NULL,
  stand_id        uuid NOT NULL,
  ingredient_id   uuid NOT NULL,
  quantite_milli  bigint NOT NULL,
  PRIMARY KEY (evenement_id, stand_id, ingredient_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
ALTER TABLE ingredient_consommation ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredient_consommation_isolement ON ingredient_consommation USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ingredient_consommation TO flaix_app;
CREATE TRIGGER ingredient_consommation_ecriture_seule BEFORE UPDATE OR DELETE ON ingredient_consommation FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER ingredient_consommation_pas_de_vidage BEFORE TRUNCATE ON ingredient_consommation FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

-- Recopie dans le lieu de formation : la case « suivre le stock » suit le vrai lieu.
CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

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
