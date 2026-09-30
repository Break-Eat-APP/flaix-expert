-- =============================================================================
-- 0006 — Contrôle des espèces à la clôture du match (dossier §15.102, module 7).
--
-- * Un comptage par session de caisse qui accepte les espèces (le « Z » du tiroir),
--   saisi par coupure, définitif. Une correction est une RECTIFICATION qui s'ajoute
--   et référence le comptage d'origine ; rien n'est jamais modifié ni supprimé.
-- * Écriture seule imposée par la base (droits + déclencheurs), comme les journaux.
--   Chaque ligne est aussi inscrite au journal technique (chaîné) : cette table en
--   est la copie interrogeable, comme `ligne_ticket` pour le journal de caisse.
-- * Tolérance d'écart : réglage du lieu, 5,00 € par défaut (module 7).
-- =============================================================================

ALTER TABLE lieu ADD COLUMN seuil_ecart_especes_centimes integer NOT NULL DEFAULT 500
  CHECK (seuil_ecart_especes_centimes BETWEEN 0 AND 100000);
GRANT UPDATE (seuil_ecart_especes_centimes) ON lieu TO flaix_app;

CREATE TABLE comptage_especes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id         uuid NOT NULL REFERENCES lieu (id),
  session_id      uuid NOT NULL,
  caisse_id       uuid NOT NULL,
  evenement_id    uuid NOT NULL,
  type            text NOT NULL CHECK (type IN ('comptage', 'rectification')),
  ref_comptage    uuid REFERENCES comptage_especes (id),
  -- Nombre de pièces et billets par coupure, en centimes : {"5000": 3, "200": 12, …}.
  coupures        jsonb NOT NULL,
  fond_centimes   integer NOT NULL CHECK (fond_centimes >= 0),
  especes_centimes integer NOT NULL,
  sorties_centimes integer NOT NULL DEFAULT 0 CHECK (sorties_centimes >= 0),
  attendu_centimes integer NOT NULL,
  compte_centimes integer NOT NULL CHECK (compte_centimes >= 0),
  ecart_centimes  integer NOT NULL,
  seuil_centimes  integer NOT NULL CHECK (seuil_centimes >= 0),
  motif           text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 5 AND 500),
  signature       text CHECK (signature IS NULL OR length(btrim(signature)) BETWEEN 3 AND 120),
  par             uuid NOT NULL REFERENCES utilisateur (id),
  le              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, session_id) REFERENCES session_caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CONSTRAINT comptage_attendu CHECK (attendu_centimes = fond_centimes + especes_centimes - sorties_centimes),
  CONSTRAINT comptage_ecart CHECK (ecart_centimes = compte_centimes - attendu_centimes),
  -- Au-delà de la tolérance, un motif est obligatoire (la clôture n'est jamais bloquée pour autant).
  CONSTRAINT comptage_motif_hors_tolerance CHECK (abs(ecart_centimes) <= seuil_centimes OR motif IS NOT NULL),
  -- Une rectification référence le comptage d'origine, porte un motif et une signature en toutes lettres.
  CONSTRAINT comptage_rectification CHECK (
    (type = 'comptage' AND ref_comptage IS NULL AND signature IS NULL)
    OR (type = 'rectification' AND ref_comptage IS NOT NULL AND motif IS NOT NULL AND signature IS NOT NULL)
  )
);
-- Un seul comptage (Z) par session de caisse ; les rectifications s'y ajoutent.
CREATE UNIQUE INDEX comptage_especes_un_par_session ON comptage_especes (session_id) WHERE type = 'comptage';
CREATE INDEX comptage_especes_evenement ON comptage_especes (lieu_id, evenement_id);
ALTER TABLE comptage_especes ENABLE ROW LEVEL SECURITY;
CREATE POLICY comptage_especes_isolement ON comptage_especes USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON comptage_especes TO flaix_app;
CREATE TRIGGER comptage_especes_ecriture_seule BEFORE UPDATE OR DELETE ON comptage_especes
  FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER comptage_especes_pas_de_vidage BEFORE TRUNCATE ON comptage_especes
  FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
