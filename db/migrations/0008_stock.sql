-- =============================================================================
-- 0008 — Stock, première version en production (dossier §15.105, module 4).
--
-- * Une réserve centrale par lieu. Tout ce qui bouge est un MOUVEMENT, en écriture
--   seule : livraison fournisseur (entre en réserve), mise en place et réassort (de la
--   réserve vers un stand, pour un match ; négatif = retour en réserve). La mise en place
--   se prépare avant l'ouverture du match et se fige à l'ouverture ; le réassort n'existe
--   que pendant le match. Aucun mouvement n'est jamais modifié ni supprimé.
-- * Comptage de fin de match par stand et produit : se corrige tant que le match n'est pas
--   clos, figé ensuite par la base.
-- * Inventaire réserve daté : le compté devient le nouveau point de départ du solde.
-- =============================================================================

CREATE TABLE stock_mouvement (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id                 uuid NOT NULL REFERENCES lieu (id),
  type                    text NOT NULL CHECK (type IN ('livraison', 'mise_en_place', 'reassort')),
  produit_id              uuid NOT NULL,
  evenement_id            uuid,
  stand_id                uuid,
  quantite                integer NOT NULL CHECK (quantite <> 0 AND quantite BETWEEN -100000 AND 100000),
  prix_unitaire_centimes  integer CHECK (prix_unitaire_centimes BETWEEN 0 AND 10000000),
  fournisseur             text CHECK (fournisseur IS NULL OR length(btrim(fournisseur)) BETWEEN 1 AND 120),
  date_livraison          date,
  -- Coût matière de la fiche avant et après le recalcul CUMP d'une livraison.
  cout_avant_centimes     integer,
  cout_apres_centimes     integer,
  par                     uuid NOT NULL REFERENCES utilisateur (id),
  le                      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  CONSTRAINT stock_mouvement_forme CHECK (
    (type = 'livraison' AND evenement_id IS NULL AND stand_id IS NULL AND quantite > 0
       AND prix_unitaire_centimes IS NOT NULL AND date_livraison IS NOT NULL)
    OR (type IN ('mise_en_place', 'reassort') AND evenement_id IS NOT NULL AND stand_id IS NOT NULL
       AND prix_unitaire_centimes IS NULL AND fournisseur IS NULL AND date_livraison IS NULL
       AND cout_avant_centimes IS NULL AND cout_apres_centimes IS NULL)
  )
);
CREATE INDEX stock_mouvement_match ON stock_mouvement (lieu_id, evenement_id, stand_id, produit_id);
CREATE INDEX stock_mouvement_produit ON stock_mouvement (lieu_id, produit_id, le);
ALTER TABLE stock_mouvement ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_mouvement_isolement ON stock_mouvement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON stock_mouvement TO flaix_app;
CREATE TRIGGER stock_mouvement_ecriture_seule BEFORE UPDATE OR DELETE ON stock_mouvement FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER stock_mouvement_pas_de_vidage BEFORE TRUNCATE ON stock_mouvement FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

-- La mise en place se prépare avant l'ouverture et se fige avec elle ; le réassort n'a lieu que pendant le match.
CREATE FUNCTION controler_mouvement_stock() RETURNS trigger
  LANGUAGE plpgsql AS
$$
DECLARE
  v_etat text;
BEGIN
  IF NEW.type = 'livraison' THEN
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
CREATE TRIGGER stock_mouvement_cycle BEFORE INSERT ON stock_mouvement FOR EACH ROW EXECUTE FUNCTION controler_mouvement_stock();

CREATE TABLE stock_comptage (
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  evenement_id  uuid NOT NULL,
  stand_id      uuid NOT NULL,
  produit_id    uuid NOT NULL,
  quantite      integer NOT NULL CHECK (quantite BETWEEN 0 AND 100000),
  motif         text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 5 AND 300),
  par           uuid NOT NULL REFERENCES utilisateur (id),
  le            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evenement_id, stand_id, produit_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id)
);
ALTER TABLE stock_comptage ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_comptage_isolement ON stock_comptage USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON stock_comptage TO flaix_app;
GRANT UPDATE (quantite, motif, par, le) ON stock_comptage TO flaix_app;

-- Le comptage se saisit pendant le match (caisses fermées ou non) et se fige à sa clôture.
CREATE FUNCTION controler_comptage_stock() RETURNS trigger
  LANGUAGE plpgsql AS
$$
DECLARE
  v_etat text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Un comptage ne se supprime pas' USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT etat INTO v_etat FROM evenement WHERE lieu_id = NEW.lieu_id AND id = NEW.evenement_id;
  IF v_etat IS DISTINCT FROM 'ouvert' THEN
    RAISE EXCEPTION 'Le comptage se fait pendant le match ; il est figé une fois le match clos' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER stock_comptage_cycle BEFORE INSERT OR UPDATE OR DELETE ON stock_comptage FOR EACH ROW EXECUTE FUNCTION controler_comptage_stock();

CREATE TABLE inventaire_reserve (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  date_inventaire  date NOT NULL,
  par              uuid NOT NULL REFERENCES utilisateur (id),
  le               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE TABLE inventaire_reserve_ligne (
  lieu_id        uuid NOT NULL,
  inventaire_id  uuid NOT NULL,
  produit_id     uuid NOT NULL,
  -- Solde calculé au moment de l'inventaire (null : premier inventaire de ce produit).
  calcule        integer,
  compte         integer NOT NULL CHECK (compte BETWEEN 0 AND 1000000),
  PRIMARY KEY (inventaire_id, produit_id),
  FOREIGN KEY (lieu_id, inventaire_id) REFERENCES inventaire_reserve (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id)
);
ALTER TABLE inventaire_reserve ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventaire_reserve_isolement ON inventaire_reserve USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
ALTER TABLE inventaire_reserve_ligne ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventaire_reserve_ligne_isolement ON inventaire_reserve_ligne USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON inventaire_reserve, inventaire_reserve_ligne TO flaix_app;
CREATE TRIGGER inventaire_reserve_ecriture_seule BEFORE UPDATE OR DELETE ON inventaire_reserve FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER inventaire_reserve_ligne_ecriture_seule BEFORE UPDATE OR DELETE ON inventaire_reserve_ligne FOR EACH ROW EXECUTE FUNCTION refuser_modification();
