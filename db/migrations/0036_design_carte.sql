-- =============================================================================
-- 0036 — Design de la carte abonné : logo, bannière, couleurs, textes et liens (dossier §15.148).
--
-- Le design (textes, couleurs, options d'affichage) est un petit document JSON du lieu, contrôlé par le serveur.
-- Les images sont rangées dans la base, déjà retaillées aux formats d'Apple et de Google : elles sont ainsi dans
-- les sauvegardes, et le serveur n'a besoin d'aucune bibliothèque d'images.
-- =============================================================================

ALTER TABLE lieu ADD COLUMN carte_design jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(carte_design) = 'object' AND length(carte_design::text) < 8000);
GRANT UPDATE (carte_design) ON lieu TO flaix_app;

CREATE TABLE carte_image (
  lieu_id   uuid NOT NULL REFERENCES lieu (id),
  variante  text NOT NULL CHECK (variante IN ('logo', 'logo@2x', 'logo@3x', 'icon', 'icon@2x', 'icon@3x', 'google-logo',
                                              'strip', 'strip@2x', 'strip@3x', 'google-hero')),
  sorte     text NOT NULL CHECK (sorte IN ('logo', 'banniere')),
  contenu   bytea NOT NULL CHECK (octet_length(contenu) BETWEEN 40 AND 3000000),
  largeur   integer NOT NULL CHECK (largeur BETWEEN 1 AND 2000),
  hauteur   integer NOT NULL CHECK (hauteur BETWEEN 1 AND 2000),
  depose_le timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, variante)
);
ALTER TABLE carte_image ENABLE ROW LEVEL SECURITY;
CREATE POLICY carte_image_isolement ON carte_image USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON carte_image TO flaix_app;
