-- =============================================================================
-- 0055 — Un événement privé sort ses consommations de la réserve centrale (dossier §15.169, demande de Rémi du
-- 2026-10-19 : « produits seulement »).
--
-- À la clôture d'un événement privé, chaque produit du catalogue consommé sort de la réserve : un nouveau mouvement
-- « evenement_prive », en écriture seule comme les autres, rattaché à l'événement privé. Un produit dont la recette
-- utilise un ingrédient suivi sort ses ingrédients (la pinte sort 0,5 L du fût) au lieu de lui-même, pour ne rien
-- retirer deux fois. Les lignes libres (location du salon, service…) ne sortent rien. Une seule sortie par produit ou
-- ingrédient et par événement privé, et seulement pour un événement privé clôturé.
-- =============================================================================

ALTER TABLE stock_mouvement ADD COLUMN evenement_prive_id uuid;
ALTER TABLE stock_mouvement ADD CONSTRAINT stock_mouvement_evenement_prive_fk FOREIGN KEY (lieu_id, evenement_prive_id) REFERENCES evenement_prive (lieu_id, id);
ALTER TABLE stock_mouvement DROP CONSTRAINT stock_mouvement_type_check;
ALTER TABLE stock_mouvement ADD CONSTRAINT stock_mouvement_type_check CHECK (type IN ('livraison', 'mise_en_place', 'reassort', 'evenement_prive'));
ALTER TABLE stock_mouvement DROP CONSTRAINT stock_mouvement_forme;
ALTER TABLE stock_mouvement ADD CONSTRAINT stock_mouvement_forme CHECK (
  (type = 'livraison' AND evenement_id IS NULL AND stand_id IS NULL AND evenement_prive_id IS NULL AND quantite > 0
     AND prix_unitaire_centimes IS NOT NULL AND date_livraison IS NOT NULL)
  OR (type IN ('mise_en_place', 'reassort') AND evenement_id IS NOT NULL AND stand_id IS NOT NULL AND evenement_prive_id IS NULL
     AND prix_unitaire_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
     AND cout_avant_centimes IS NULL AND cout_apres_centimes IS NULL)
  OR (type = 'evenement_prive' AND evenement_prive_id IS NOT NULL AND evenement_id IS NULL AND stand_id IS NULL AND quantite > 0
     AND prix_unitaire_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
     AND cout_avant_centimes IS NULL AND cout_apres_centimes IS NULL)
);
CREATE UNIQUE INDEX stock_mouvement_evenement_prive ON stock_mouvement (lieu_id, evenement_prive_id, produit_id) WHERE type = 'evenement_prive';

ALTER TABLE ingredient_mouvement ADD COLUMN evenement_prive_id uuid;
ALTER TABLE ingredient_mouvement ADD CONSTRAINT ingredient_mouvement_evenement_prive_fk FOREIGN KEY (lieu_id, evenement_prive_id) REFERENCES evenement_prive (lieu_id, id);
ALTER TABLE ingredient_mouvement DROP CONSTRAINT ingredient_mouvement_type_check;
ALTER TABLE ingredient_mouvement ADD CONSTRAINT ingredient_mouvement_type_check CHECK (type IN ('livraison', 'mise_en_place', 'reassort', 'evenement_prive'));
ALTER TABLE ingredient_mouvement DROP CONSTRAINT ingredient_mouvement_forme;
ALTER TABLE ingredient_mouvement ADD CONSTRAINT ingredient_mouvement_forme CHECK (
  (type = 'livraison' AND evenement_id IS NULL AND stand_id IS NULL AND evenement_prive_id IS NULL AND quantite_milli > 0
     AND prix_total_centimes IS NOT NULL AND date_livraison IS NOT NULL)
  OR (type IN ('mise_en_place', 'reassort') AND evenement_id IS NOT NULL AND stand_id IS NOT NULL AND evenement_prive_id IS NULL
     AND prix_total_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
     AND prix_avant_centimes IS NULL AND prix_apres_centimes IS NULL)
  OR (type = 'evenement_prive' AND evenement_prive_id IS NOT NULL AND evenement_id IS NULL AND stand_id IS NULL AND quantite_milli > 0
     AND prix_total_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
     AND prix_avant_centimes IS NULL AND prix_apres_centimes IS NULL)
);
CREATE UNIQUE INDEX ingredient_mouvement_evenement_prive ON ingredient_mouvement (lieu_id, evenement_prive_id, ingredient_id) WHERE type = 'evenement_prive';

-- Mêmes règles qu'avant pour la mise en place et le réassort ; la sortie d'un événement privé n'existe qu'une fois
-- celui-ci clôturé (dans la même transaction que la clôture).
CREATE OR REPLACE FUNCTION controler_mouvement_stock() RETURNS trigger
  LANGUAGE plpgsql AS
$$
DECLARE
  v_etat text;
BEGIN
  IF NEW.type = 'livraison' THEN
    RETURN NEW;
  END IF;
  IF NEW.type = 'evenement_prive' THEN
    SELECT etat INTO v_etat FROM evenement_prive WHERE lieu_id = NEW.lieu_id AND id = NEW.evenement_prive_id;
    IF v_etat IS DISTINCT FROM 'cloture' THEN
      RAISE EXCEPTION 'Un événement privé ne sort son stock qu''à sa clôture' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  SELECT etat INTO v_etat FROM evenement WHERE lieu_id = NEW.lieu_id AND id = NEW.evenement_id;
  IF NEW.type = 'mise_en_place' AND v_etat IS DISTINCT FROM 'a_venir' THEN
    RAISE EXCEPTION 'La mise en place est figée à l''ouverture du match : utilise le réassort' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.type = 'reassort' AND v_etat IS DISTINCT FROM 'ouvert' THEN
    RAISE EXCEPTION 'Le réassort n''existe que pendant le match' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
