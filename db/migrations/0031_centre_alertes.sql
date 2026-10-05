-- 0031 — Centre d'alertes et rupture de stock en direct sur le téléphone (demande de Rémi du 2026-10-04,
-- module 18 validé le 2026-09-12 ; dossier §15.140).
--
-- 1. Mercuriale : prix de référence d'un produit ou d'un ingrédient, saisi par le lieu dans le centre
--    d'alertes (et nulle part ailleurs), comparé au coût actuel. Chaque saisie est journalisée par le serveur.
-- 2. Alertes de stock poussées : une ligne par notification envoyée (écriture seule) ; une seule par niveau,
--    stand et produit jusqu'au réassort suivant (le total des réassorts fait partie de la clé).
-- 3. Réglages du lieu : ruptures et stocks faibles poussés, actifs par défaut.

CREATE TABLE prix_reference (
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  produit_id    uuid,
  ingredient_id uuid,
  -- Produit : coût par portion ; ingrédient : prix par unité d'achat (kg, L, pièce), HT.
  prix_centimes integer NOT NULL CHECK (prix_centimes BETWEEN 1 AND 10000000),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now(),
  CHECK ((produit_id IS NULL) <> (ingredient_id IS NULL)),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
CREATE UNIQUE INDEX prix_reference_produit ON prix_reference (lieu_id, produit_id) WHERE produit_id IS NOT NULL;
CREATE UNIQUE INDEX prix_reference_ingredient ON prix_reference (lieu_id, ingredient_id) WHERE ingredient_id IS NOT NULL;
ALTER TABLE prix_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY prix_reference_isolement ON prix_reference USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON prix_reference TO flaix_app;

CREATE TABLE alerte_stock_poussee (
  lieu_id      uuid NOT NULL REFERENCES lieu (id),
  evenement_id uuid NOT NULL,
  stand_id     uuid NOT NULL,
  produit_id   uuid NOT NULL,
  niveau       text NOT NULL CHECK (niveau IN ('faible', 'rupture')),
  -- Total des réassorts au moment de l'alerte : un nouveau réassort réarme l'alerte.
  reassort     integer NOT NULL,
  depart       integer NOT NULL,
  restant      integer NOT NULL,
  -- Téléphones atteints.
  envoye_a     integer NOT NULL CHECK (envoye_a >= 0),
  le           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, evenement_id, stand_id, produit_id, niveau, reassort)
);
ALTER TABLE alerte_stock_poussee ENABLE ROW LEVEL SECURITY;
CREATE POLICY alerte_stock_poussee_isolement ON alerte_stock_poussee USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON alerte_stock_poussee TO flaix_app;
CREATE TRIGGER alerte_stock_poussee_ecriture_seule BEFORE UPDATE OR DELETE ON alerte_stock_poussee FOR EACH ROW EXECUTE FUNCTION refuser_modification();

ALTER TABLE lieu ADD COLUMN alerte_rupture boolean NOT NULL DEFAULT true;
ALTER TABLE lieu ADD COLUMN alerte_stock_faible boolean NOT NULL DEFAULT true;
GRANT UPDATE (alerte_rupture, alerte_stock_faible) ON lieu TO flaix_app;

-- Mode formation : la mercuriale est recopiée dans le jumeau à chaque entrée (le reste de 0027 inchangé).
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
