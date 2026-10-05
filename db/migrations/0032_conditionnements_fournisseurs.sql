-- 0032 — Comparaison des prix entre fournisseurs (module 5 ; demande de Rémi du 2026-10-04, dossier §15.141).
--
-- Une livraison ne dit pas la taille d'un colis (10 fûts de 30 L arrivent comme 300 L) : le conditionnement
-- se renseigne une fois par fournisseur et par article (produit ou ingrédient), pour l'écoulement et l'alerte
-- de sur-conditionnement. Chaque modification est journalisée par le serveur.

CREATE TABLE conditionnement_fournisseur (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  produit_id    uuid,
  ingredient_id uuid,
  -- Nom du fournisseur tel qu'écrit dans les livraisons ; comparé sans majuscules ni espaces superflus.
  fournisseur   text NOT NULL CHECK (length(btrim(fournisseur)) BETWEEN 1 AND 120),
  libelle       text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 60),
  -- Contenance d'un colis : portions (produit) ou millièmes d'unité d'achat (ingrédient).
  contenance    bigint NOT NULL CHECK (contenance BETWEEN 1 AND 1000000000),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now(),
  CHECK ((produit_id IS NULL) <> (ingredient_id IS NULL)),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, ingredient_id) REFERENCES ingredient (lieu_id, id)
);
CREATE UNIQUE INDEX conditionnement_produit ON conditionnement_fournisseur (lieu_id, produit_id, lower(regexp_replace(btrim(fournisseur), '\s+', ' ', 'g'))) WHERE produit_id IS NOT NULL;
CREATE UNIQUE INDEX conditionnement_ingredient ON conditionnement_fournisseur (lieu_id, ingredient_id, lower(regexp_replace(btrim(fournisseur), '\s+', ' ', 'g'))) WHERE ingredient_id IS NOT NULL;
ALTER TABLE conditionnement_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY conditionnement_fournisseur_isolement ON conditionnement_fournisseur USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON conditionnement_fournisseur TO flaix_app;
