-- =============================================================================
-- 0002 — Configuration d'un lieu : stands, caisses, catégories, produits,
-- disponibilité par stand, tarifs datés.
--
-- * Un produit = une fiche au niveau du lieu, un prix, un historique ; la table
--   `produit_stand` dit quels stands le vendent (décision de Rémi du 2026-09-28,
--   retour au modèle §3/§5 du dossier).
-- * Le prix ne se modifie jamais en place : chaque changement est une nouvelle
--   ligne de `produit_tarif` avec sa date d'effet (§15.30, test A9). Le taux de
--   TVA fait partie du tarif, daté de la même façon.
-- * Les références croisées portent le lieu (clés étrangères composites) : une
--   caisse ne peut pas être rattachée au stand d'un autre lieu, même par erreur.
-- =============================================================================

CREATE TABLE stand (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  nom              text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 80),
  point_retrait_cc boolean NOT NULL DEFAULT false,
  actif            boolean NOT NULL DEFAULT true,
  cree_le          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX stand_nom_unique ON stand (lieu_id, lower(btrim(nom)));
ALTER TABLE stand ENABLE ROW LEVEL SECURITY;
CREATE POLICY stand_isolement ON stand USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON stand TO flaix_app;
GRANT UPDATE (nom, point_retrait_cc, actif) ON stand TO flaix_app;

-- Numéro de caisse unique sur tout le lieu (Les Spartiates : caisses 1 à 9 réparties
-- sur 4 stands, §15.31). Les tickets seront numérotés PAR caisse (§15.12).
CREATE TABLE caisse (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id            uuid NOT NULL REFERENCES lieu (id),
  stand_id           uuid NOT NULL,
  numero             integer NOT NULL CHECK (numero > 0),
  nom                text CHECK (length(btrim(nom)) BETWEEN 1 AND 60),
  especes_autorisees boolean NOT NULL DEFAULT false,
  actif              boolean NOT NULL DEFAULT true,
  cree_le            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CONSTRAINT caisse_numero_unique UNIQUE (lieu_id, numero),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
ALTER TABLE caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY caisse_isolement ON caisse USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON caisse TO flaix_app;
GRANT UPDATE (stand_id, nom, especes_autorisees, actif) ON caisse TO flaix_app;

CREATE TABLE categorie (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id uuid NOT NULL REFERENCES lieu (id),
  nom     text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 60),
  actif   boolean NOT NULL DEFAULT true,
  cree_le timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE UNIQUE INDEX categorie_nom_unique ON categorie (lieu_id, lower(btrim(nom)));
ALTER TABLE categorie ENABLE ROW LEVEL SECURITY;
CREATE POLICY categorie_isolement ON categorie USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON categorie TO flaix_app;
GRANT UPDATE (nom, actif) ON categorie TO flaix_app;

CREATE TABLE produit (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id               uuid NOT NULL REFERENCES lieu (id),
  nom                   text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 80),
  categorie_id          uuid,
  -- Coût matière HT par portion, facultatif (sert au suivi de marge). Il sera
  -- remplacé par le coût moyen pondéré calculé par le module Stock (§14, module 4).
  cout_matiere_centimes integer CHECK (cout_matiere_centimes >= 0),
  actif                 boolean NOT NULL DEFAULT true,
  cree_le               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, categorie_id) REFERENCES categorie (lieu_id, id)
);
CREATE UNIQUE INDEX produit_nom_unique ON produit (lieu_id, lower(btrim(nom)));
ALTER TABLE produit ENABLE ROW LEVEL SECURITY;
CREATE POLICY produit_isolement ON produit USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON produit TO flaix_app;
GRANT UPDATE (nom, categorie_id, cout_matiere_centimes, actif) ON produit TO flaix_app;

-- Quels stands vendent quel produit (catalogue par stand, décision du 2026-09-07).
-- Seule table de paramétrage où une ligne peut être retirée : elle n'est référencée
-- par aucun ticket (un ticket enregistre son propre stand), et chaque ajout ou
-- retrait est inscrit au journal technique.
CREATE TABLE produit_stand (
  lieu_id    uuid NOT NULL,
  produit_id uuid NOT NULL,
  stand_id   uuid NOT NULL,
  PRIMARY KEY (lieu_id, produit_id, stand_id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
ALTER TABLE produit_stand ENABLE ROW LEVEL SECURITY;
CREATE POLICY produit_stand_isolement ON produit_stand USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON produit_stand TO flaix_app;

-- Tarifs datés, en écriture seule. Le tarif en vigueur à un instant T est celui
-- dont la date d'effet est la plus récente sans dépasser T.
CREATE TABLE produit_tarif (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id           uuid NOT NULL,
  produit_id        uuid NOT NULL,
  prix_ttc_centimes integer NOT NULL CHECK (prix_ttc_centimes >= 0 AND prix_ttc_centimes <= 1000000),
  taux_tva_pb       integer NOT NULL CHECK (taux_tva_pb IN (210, 550, 1000, 2000)),
  valide_du         timestamptz NOT NULL,
  saisi_par         uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le          timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  CONSTRAINT produit_tarif_date_unique UNIQUE (produit_id, valide_du)
);
CREATE INDEX produit_tarif_recherche ON produit_tarif (produit_id, valide_du DESC);
ALTER TABLE produit_tarif ENABLE ROW LEVEL SECURITY;
CREATE POLICY produit_tarif_isolement ON produit_tarif USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON produit_tarif TO flaix_app;
CREATE TRIGGER produit_tarif_ecriture_seule
  BEFORE UPDATE OR DELETE ON produit_tarif
  FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER produit_tarif_pas_de_vidage
  BEFORE TRUNCATE ON produit_tarif
  FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
