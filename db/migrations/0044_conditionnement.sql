-- =============================================================================
-- 0044 — Conditionnement de chaque produit (dossier §15.155, demande de Rémi du 2026-10-10).
--
-- Les emballages du lieu (gobelet, barquette, serviette, pique…) ont un prix à l'unité en millièmes d'euro (une
-- serviette coûte moins d'un centime) ; chaque produit dit lesquels il utilise et combien. Coût de conditionnement
-- d'un produit = Σ quantité × prix ; il s'ajoute au coût matière dans les marges et dans « ce qu'il te reste ».
-- Changer le prix d'un emballage met à jour tous les produits qui l'utilisent (comme un coût matière, sans
-- historique). Un emballage se supprime avec ses liens. Chaque modification est journalisée par le serveur.
-- =============================================================================

CREATE TABLE emballage (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  nom           text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 60),
  -- Prix d'une unité HT, en millièmes d'euro (0,008 € = 8), jusqu'à 100 €.
  prix_millimes integer NOT NULL CHECK (prix_millimes BETWEEN 0 AND 100000),
  -- Jumeau de formation : emballage d'origine du lieu réel.
  origine_id    uuid,
  cree_par      uuid NOT NULL REFERENCES utilisateur (id),
  cree_le       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX emballage_nom_unique ON emballage (lieu_id, lower(nom));
ALTER TABLE emballage ENABLE ROW LEVEL SECURITY;
CREATE POLICY emballage_isolement ON emballage USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON emballage TO flaix_app;
GRANT UPDATE (nom, prix_millimes) ON emballage TO flaix_app;

CREATE TABLE produit_emballage (
  lieu_id       uuid NOT NULL,
  produit_id    uuid NOT NULL,
  emballage_id  uuid NOT NULL,
  quantite      integer NOT NULL CHECK (quantite BETWEEN 1 AND 50),
  PRIMARY KEY (lieu_id, produit_id, emballage_id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, emballage_id) REFERENCES emballage (lieu_id, id)
);
ALTER TABLE produit_emballage ENABLE ROW LEVEL SECURITY;
CREATE POLICY produit_emballage_isolement ON produit_emballage USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON produit_emballage TO flaix_app;
GRANT UPDATE (quantite) ON produit_emballage TO flaix_app;

-- Coût de conditionnement d'une portion de chaque produit, en millièmes d'euro (sécurité par lieu des tables).
CREATE VIEW produit_conditionnement WITH (security_invoker = true) AS
  SELECT pe.lieu_id, pe.produit_id, sum(pe.quantite * e.prix_millimes)::int AS millimes
    FROM produit_emballage pe
    JOIN emballage e ON e.lieu_id = pe.lieu_id AND e.id = pe.emballage_id
   GROUP BY pe.lieu_id, pe.produit_id;
GRANT SELECT ON produit_conditionnement TO flaix_app;

-- Mode formation : le conditionnement est recopié dans le jumeau à chaque entrée (le reste de 0043 inchangé).
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
END
$$;

