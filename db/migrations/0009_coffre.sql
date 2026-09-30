-- =============================================================================
-- 0009 — Remontées d'espèces au coffre et Z du coffre (dossier §15.106, module 7).
--
-- * Remontée : montant retiré du tiroir d'une caisse et porté au coffre pendant le match
--   (ou avant le Z du tiroir). Écriture seule ; une erreur s'annule par une écriture
--   inverse, avec motif, qui référence la remontée — jamais en l'effaçant.
-- * Z du tiroir : attendu = fond + ventes espèces − remontées (colonne déjà prévue en 0006).
-- * Z du coffre : en fin de soirée, le coffre se compte par coupure ; attendu = total des
--   remontées du match. Même règles que le Z d'un tiroir (définitif, rectification signée).
-- =============================================================================

CREATE TABLE sortie_especes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id           uuid NOT NULL REFERENCES lieu (id),
  session_id        uuid NOT NULL,
  caisse_id         uuid NOT NULL,
  evenement_id      uuid NOT NULL,
  type              text NOT NULL CHECK (type IN ('remontee', 'annulation')),
  ref_sortie        uuid REFERENCES sortie_especes (id),
  montant_centimes  integer NOT NULL CHECK (montant_centimes BETWEEN -10000000 AND 10000000),
  motif             text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 5 AND 300),
  par               uuid NOT NULL REFERENCES utilisateur (id),
  le                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, session_id) REFERENCES session_caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CONSTRAINT sortie_especes_forme CHECK (
    (type = 'remontee' AND ref_sortie IS NULL AND montant_centimes > 0)
    OR (type = 'annulation' AND ref_sortie IS NOT NULL AND montant_centimes < 0 AND motif IS NOT NULL)
  )
);
CREATE UNIQUE INDEX sortie_especes_une_annulation ON sortie_especes (ref_sortie) WHERE type = 'annulation';
CREATE INDEX sortie_especes_evenement ON sortie_especes (lieu_id, evenement_id);
ALTER TABLE sortie_especes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sortie_especes_isolement ON sortie_especes USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON sortie_especes TO flaix_app;
CREATE TRIGGER sortie_especes_ecriture_seule BEFORE UPDATE OR DELETE ON sortie_especes FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER sortie_especes_pas_de_vidage BEFORE TRUNCATE ON sortie_especes FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

CREATE TABLE comptage_coffre (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  evenement_id     uuid NOT NULL,
  type             text NOT NULL CHECK (type IN ('comptage', 'rectification')),
  ref_comptage     uuid REFERENCES comptage_coffre (id),
  coupures         jsonb NOT NULL,
  attendu_centimes integer NOT NULL CHECK (attendu_centimes >= 0),
  compte_centimes  integer NOT NULL CHECK (compte_centimes >= 0),
  ecart_centimes   integer NOT NULL,
  seuil_centimes   integer NOT NULL CHECK (seuil_centimes >= 0),
  motif            text CHECK (motif IS NULL OR length(btrim(motif)) BETWEEN 5 AND 500),
  signature        text CHECK (signature IS NULL OR length(btrim(signature)) BETWEEN 3 AND 120),
  par              uuid NOT NULL REFERENCES utilisateur (id),
  le               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CONSTRAINT coffre_ecart CHECK (ecart_centimes = compte_centimes - attendu_centimes),
  CONSTRAINT coffre_motif_hors_tolerance CHECK (abs(ecart_centimes) <= seuil_centimes OR motif IS NOT NULL),
  CONSTRAINT coffre_rectification CHECK (
    (type = 'comptage' AND ref_comptage IS NULL AND signature IS NULL)
    OR (type = 'rectification' AND ref_comptage IS NOT NULL AND motif IS NOT NULL AND signature IS NOT NULL)
  )
);
CREATE UNIQUE INDEX comptage_coffre_un_par_match ON comptage_coffre (evenement_id) WHERE type = 'comptage';
ALTER TABLE comptage_coffre ENABLE ROW LEVEL SECURITY;
CREATE POLICY comptage_coffre_isolement ON comptage_coffre USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON comptage_coffre TO flaix_app;
CREATE TRIGGER comptage_coffre_ecriture_seule BEFORE UPDATE OR DELETE ON comptage_coffre FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER comptage_coffre_pas_de_vidage BEFORE TRUNCATE ON comptage_coffre FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

-- Une remontée ne s'inscrit plus une fois le tiroir compté (son attendu est figé) ni une
-- fois le coffre compté ; seulement pour une caisse qui accepte les espèces.
CREATE FUNCTION controler_sortie_especes() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM session_caisse WHERE lieu_id = NEW.lieu_id AND id = NEW.session_id AND fond_centimes IS NOT NULL) THEN
    RAISE EXCEPTION 'Cette caisse n''accepte pas les espèces' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM comptage_especes WHERE lieu_id = NEW.lieu_id AND session_id = NEW.session_id AND type = 'comptage') THEN
    RAISE EXCEPTION 'Le tiroir de cette caisse est déjà compté : une remontée ne s''y ajoute plus' USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (SELECT 1 FROM comptage_coffre WHERE lieu_id = NEW.lieu_id AND evenement_id = NEW.evenement_id AND type = 'comptage') THEN
    RAISE EXCEPTION 'Le coffre de ce match est déjà compté' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER sortie_especes_cycle BEFORE INSERT ON sortie_especes FOR EACH ROW EXECUTE FUNCTION controler_sortie_especes();
