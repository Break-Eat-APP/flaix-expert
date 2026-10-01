-- =============================================================================
-- 0019 — Recettes : coût de fabrication d'un produit à partir de ses ingrédients
-- (dossier §15.77, §15.86, spécification de Rémi au §15.117, construction §15.119).
--
-- Le directeur saisit ses ingrédients avec leur unité d'achat (kg, litre, pièce) et leur prix HT
-- par unité ; la recette d'un produit vendu liste les ingrédients et leur quantité. Le coût de
-- fabrication (Σ prix × quantité) devient le coût matière du produit, recalculé dès qu'une recette
-- ou le prix d'un ingrédient change. Quantités en MILLIÈMES de l'unité d'achat : grammes pour le
-- kg, millilitres pour le litre, millièmes de pièce (une demi-pièce = 500).
-- Le stock au poids (déduire les ingrédients à chaque vente) n'est pas construit ici.
-- =============================================================================

CREATE TABLE ingredient (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  nom           text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 80),
  -- L'unité ne change plus après la création : les quantités des recettes en dépendent.
  unite         text NOT NULL CHECK (unite IN ('kg', 'l', 'piece')),
  prix_centimes integer NOT NULL CHECK (prix_centimes BETWEEN 0 AND 10000000),
  actif         boolean NOT NULL DEFAULT true,
  origine_id    uuid REFERENCES ingredient (id),
  cree_par      uuid NOT NULL REFERENCES utilisateur (id),
  cree_le       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX ingredient_nom_unique ON ingredient (lieu_id, lower(btrim(nom)));
CREATE UNIQUE INDEX ingredient_origine_unique ON ingredient (lieu_id, origine_id) WHERE origine_id IS NOT NULL;
ALTER TABLE ingredient ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredient_isolement ON ingredient USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ingredient TO flaix_app;
GRANT UPDATE (nom, prix_centimes, actif) ON ingredient TO flaix_app;
CREATE TRIGGER ingredient_pas_de_suppression BEFORE DELETE ON ingredient FOR EACH ROW EXECUTE FUNCTION refuser_modification();

CREATE TABLE recette_ligne (
  lieu_id        uuid NOT NULL,
  produit_id     uuid NOT NULL,
  ingredient_id  uuid NOT NULL,
  quantite_milli integer NOT NULL CHECK (quantite_milli > 0 AND quantite_milli <= 100000000),
  PRIMARY KEY (lieu_id, produit_id, ingredient_id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
ALTER TABLE recette_ligne ENABLE ROW LEVEL SECURITY;
CREATE POLICY recette_ligne_isolement ON recette_ligne USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON recette_ligne TO flaix_app;

-- Recopie dans le lieu de formation (§15.109) : ingrédients puis recettes, par correspondance.
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

  UPDATE ingredient f SET nom = r.nom, prix_centimes = r.prix_centimes, actif = r.actif
    FROM ingredient r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO ingredient (lieu_id, nom, unite, prix_centimes, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.unite, r.prix_centimes, r.actif, r.id, r.cree_par, r.cree_le FROM ingredient r
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
