-- =============================================================================
-- 0010 — Clôtures de période : Z du match, clôture mensuelle, clôture de l'exercice
-- (dossier §15.4, §15.27, §15.107 ; tests C1 à C6).
--
-- * Une ligne par clôture, en écriture seule, scellée SHA-256 et chaînée par lieu
--   (formule : packages/domain/src/cloture-periode.ts).
-- * Grand total de la période et total perpétuel avant/après : la base vérifie elle-même
--   que perpétuel après = perpétuel avant + grand total. Rien ne remet le perpétuel à zéro.
-- * Premier mois de l'exercice : réglage du lieu, janvier par défaut.
-- =============================================================================

ALTER TABLE lieu ADD COLUMN mois_debut_exercice integer NOT NULL DEFAULT 1 CHECK (mois_debut_exercice BETWEEN 1 AND 12);
GRANT UPDATE (mois_debut_exercice) ON lieu TO flaix_app;

CREATE TABLE cloture_periode (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id                   uuid NOT NULL REFERENCES lieu (id),
  sequence                  integer NOT NULL CHECK (sequence > 0),
  niveau                    text NOT NULL CHECK (niveau IN ('match', 'mois', 'exercice')),
  evenement_id              uuid,
  debut                     date NOT NULL,
  fin                       date NOT NULL CHECK (fin >= debut),
  total_ttc_centimes        bigint NOT NULL,
  perpetuel_avant_centimes  bigint NOT NULL,
  perpetuel_apres_centimes  bigint NOT NULL,
  details                   jsonb NOT NULL,
  horodatage                timestamptz NOT NULL,
  par                       uuid NOT NULL REFERENCES utilisateur (id),
  empreinte_precedente      text NOT NULL CHECK (empreinte_precedente ~ '^[0-9a-f]{64}$'),
  empreinte                 text NOT NULL CHECK (empreinte ~ '^[0-9a-f]{64}$'),
  UNIQUE (lieu_id, id),
  CONSTRAINT cloture_periode_sequence_unique UNIQUE (lieu_id, sequence),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  CONSTRAINT cloture_periode_match CHECK ((niveau = 'match') = (evenement_id IS NOT NULL)),
  -- Le perpétuel ne se remet jamais à zéro : il avance exactement du grand total de la période (C4, C5).
  CONSTRAINT cloture_periode_perpetuel CHECK (perpetuel_apres_centimes = perpetuel_avant_centimes + total_ttc_centimes)
);
CREATE UNIQUE INDEX cloture_periode_un_z_par_match ON cloture_periode (evenement_id) WHERE niveau = 'match';
CREATE UNIQUE INDEX cloture_periode_une_par_periode ON cloture_periode (lieu_id, niveau, debut) WHERE niveau <> 'match';
ALTER TABLE cloture_periode ENABLE ROW LEVEL SECURITY;
CREATE POLICY cloture_periode_isolement ON cloture_periode USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON cloture_periode TO flaix_app;
CREATE TRIGGER cloture_periode_ecriture_seule BEFORE UPDATE OR DELETE ON cloture_periode FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER cloture_periode_pas_de_vidage BEFORE TRUNCATE ON cloture_periode FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
