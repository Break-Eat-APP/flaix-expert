-- 0026 — Rapport de soirée figé (module 9 ; dossier §14 module 9, §15.131).
--
-- Établi une seule fois : à la clôture de l'événement, ou à la première lecture pour un événement
-- clos avant que le rapport existe (« a_posteriori »). Écriture seule, comme le Z : un rapport ne
-- se modifie ni ne se supprime. Son empreinte (SHA-256 du contenu canonique, de sa date et de sa
-- façon d'être établi) se recalcule à tout moment pour prouver qu'il n'a pas bougé.

CREATE TABLE rapport_soiree (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  evenement_id  uuid NOT NULL,
  contenu       jsonb NOT NULL,
  etabli_le     timestamptz NOT NULL,
  etabli_a      text NOT NULL CHECK (etabli_a IN ('cloture', 'a_posteriori')),
  etabli_par    uuid NOT NULL REFERENCES utilisateur (id),
  empreinte     text NOT NULL CHECK (empreinte ~ '^[0-9a-f]{64}$'),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CONSTRAINT rapport_soiree_un_par_evenement UNIQUE (evenement_id)
);
ALTER TABLE rapport_soiree ENABLE ROW LEVEL SECURITY;
CREATE POLICY rapport_soiree_isolement ON rapport_soiree USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON rapport_soiree TO flaix_app;
CREATE TRIGGER rapport_soiree_ecriture_seule BEFORE UPDATE OR DELETE ON rapport_soiree FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER rapport_soiree_pas_de_vidage BEFORE TRUNCATE ON rapport_soiree FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
