-- =============================================================================
-- 0016 — Fidélité, partie gestion (module 19 validé ; dossier §14 module 19, §15.114).
--
-- Population : les ABONNÉS du lieu seulement (contrainte de terrain : un client du comptoir
-- n'est pas identifiable). Identifiant unique : le n° d'abonné, le même que celui saisi à la
-- caisse pour la remise abonné — c'est lui qui rattache les tickets à l'abonné.
--
-- Les points gagnés se calculent à partir des tickets scellés (jamais recopiés) ; ne sont
-- inscrits ici que les mouvements hors caisse : points de départ (import), ajustements.
-- Les réglages (points par euro, palier de conversion) sont vides tant que le directeur ne les
-- a pas fixés (le dossier ne donne que des valeurs de test).
--
-- Données personnelles (nom, e-mail, téléphone) : isolées par lieu ; registre des traitements
-- et durée de conservation à établir (docs/questions-expert-comptable.md, G.21).
-- =============================================================================

ALTER TABLE lieu ADD COLUMN fid_points_par_euro integer CHECK (fid_points_par_euro BETWEEN 1 AND 100);
ALTER TABLE lieu ADD COLUMN fid_palier_points integer CHECK (fid_palier_points BETWEEN 1 AND 1000000);
ALTER TABLE lieu ADD COLUMN fid_valeur_palier_centimes integer CHECK (fid_valeur_palier_centimes BETWEEN 1 AND 100000);
GRANT UPDATE (fid_points_par_euro, fid_palier_points, fid_valeur_palier_centimes) ON lieu TO flaix_app;

CREATE TABLE abonne_fidelite (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id    uuid NOT NULL REFERENCES lieu (id),
  -- Tel que saisi à la caisse, en majuscules, sans espaces autour.
  numero     text NOT NULL CHECK (numero = upper(btrim(numero)) AND length(numero) BETWEEN 1 AND 40),
  nom        text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 120),
  email      text CHECK (email IS NULL OR (length(email) <= 200 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  telephone  text CHECK (telephone IS NULL OR length(telephone) BETWEEN 6 AND 30),
  source     text NOT NULL CHECK (source IN ('import', 'saisie')),
  actif      boolean NOT NULL DEFAULT true,
  cree_par   uuid NOT NULL REFERENCES utilisateur (id),
  cree_le    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CONSTRAINT abonne_numero_unique UNIQUE (lieu_id, numero)
);
ALTER TABLE abonne_fidelite ENABLE ROW LEVEL SECURITY;
CREATE POLICY abonne_fidelite_isolement ON abonne_fidelite USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON abonne_fidelite TO flaix_app;
GRANT UPDATE (nom, email, telephone, actif) ON abonne_fidelite TO flaix_app;
-- Une fiche se désactive, elle ne se supprime pas (ses tickets restent rattachés).
CREATE TRIGGER abonne_fidelite_pas_de_suppression BEFORE DELETE ON abonne_fidelite FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Mouvements de points hors caisse : écriture seule, jamais modifiés ni supprimés.
CREATE TABLE mouvement_points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL,
  abonne_id   uuid NOT NULL,
  motif       text NOT NULL CHECK (motif IN ('depart', 'ajustement')),
  points      integer NOT NULL CHECK (points <> 0 AND abs(points) <= 10000000),
  commentaire text CHECK (commentaire IS NULL OR length(btrim(commentaire)) BETWEEN 3 AND 300),
  par         uuid NOT NULL REFERENCES utilisateur (id),
  le          timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, abonne_id) REFERENCES abonne_fidelite (lieu_id, id),
  CONSTRAINT ajustement_commente CHECK (motif <> 'ajustement' OR commentaire IS NOT NULL)
);
CREATE INDEX mouvement_points_abonne ON mouvement_points (lieu_id, abonne_id, le);
ALTER TABLE mouvement_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY mouvement_points_isolement ON mouvement_points USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON mouvement_points TO flaix_app;
CREATE TRIGGER mouvement_points_inalterable BEFORE UPDATE OR DELETE ON mouvement_points FOR EACH ROW EXECUTE FUNCTION refuser_modification();

CREATE TABLE code_promo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id    uuid NOT NULL REFERENCES lieu (id),
  code       text NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,30}$'),
  type       text NOT NULL CHECK (type IN ('pourcentage', 'montant')),
  -- Pourcentage : points de base (5000 = 50 %) ; montant : centimes.
  valeur     integer NOT NULL CHECK (valeur > 0),
  debut      date NOT NULL,
  fin        date NOT NULL,
  usage_max  integer CHECK (usage_max IS NULL OR usage_max > 0),
  actif      boolean NOT NULL DEFAULT true,
  cree_par   uuid NOT NULL REFERENCES utilisateur (id),
  cree_le    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CONSTRAINT code_promo_unique UNIQUE (lieu_id, code),
  CONSTRAINT code_promo_dates CHECK (fin >= debut),
  CONSTRAINT code_promo_pourcentage CHECK (type <> 'pourcentage' OR valeur <= 10000)
);
ALTER TABLE code_promo ENABLE ROW LEVEL SECURITY;
CREATE POLICY code_promo_isolement ON code_promo USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON code_promo TO flaix_app;
GRANT UPDATE (fin, usage_max, actif) ON code_promo TO flaix_app;
CREATE TRIGGER code_promo_pas_de_suppression BEFORE DELETE ON code_promo FOR EACH ROW EXECUTE FUNCTION refuser_modification();
