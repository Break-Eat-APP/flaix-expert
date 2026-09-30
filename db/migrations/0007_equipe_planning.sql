-- =============================================================================
-- 0007 — Équipe : fiches employés, planning par match, masse salariale (dossier §15.104,
-- module 14).
--
-- * Une fiche par employé (salarié ou intérimaire), taux horaire en centimes. L'accès
--   caisse est facultatif : c'est le compte caissière du §15.100, relié à la fiche.
-- * Planning : une affectation = un employé sur un match, à un stand et une caisse du
--   lieu (ou « autre poste »), heures prévues et heures réelles (heures d'horloge ; une
--   fin avant le début = après minuit). Le taux est figé sur l'affectation à sa création.
-- * Ni la fiche ni le planning ne sont des journaux fiscaux : ils se modifient, et chaque
--   modification est inscrite au journal technique (auteur, heure, avant/après).
-- =============================================================================

CREATE TABLE employe (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id                uuid NOT NULL REFERENCES lieu (id),
  nom                    text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 60),
  statut                 text NOT NULL DEFAULT 'salarie' CHECK (statut IN ('salarie', 'interimaire')),
  agence                 text CHECK (agence IS NULL OR length(btrim(agence)) BETWEEN 1 AND 80),
  role                   text NOT NULL DEFAULT 'Caissier' CHECK (role IN ('Caissier', 'Préparation / cuisine', 'Responsable de stand', 'Renfort ponctuel')),
  taux_horaire_centimes  integer CHECK (taux_horaire_centimes BETWEEN 0 AND 100000),
  -- Compte caissière relié (accès caisse par code), facultatif.
  utilisateur_id         uuid REFERENCES utilisateur (id),
  actif                  boolean NOT NULL DEFAULT true,
  cree_le                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CONSTRAINT employe_agence_interimaire CHECK (statut = 'interimaire' OR agence IS NULL)
);
CREATE UNIQUE INDEX employe_nom_unique ON employe (lieu_id, lower(btrim(nom)));
CREATE UNIQUE INDEX employe_utilisateur_unique ON employe (lieu_id, utilisateur_id) WHERE utilisateur_id IS NOT NULL;
ALTER TABLE employe ENABLE ROW LEVEL SECURITY;
CREATE POLICY employe_isolement ON employe USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON employe TO flaix_app;
GRANT UPDATE (nom, statut, agence, role, taux_horaire_centimes, utilisateur_id, actif) ON employe TO flaix_app;

-- Les caissières déjà créées deviennent des fiches (taux à compléter par le directeur).
INSERT INTO employe (lieu_id, nom, role, utilisateur_id, actif)
SELECT m.lieu_id, u.nom, 'Caissier', u.id, m.actif AND u.actif
  FROM membre m JOIN utilisateur u ON u.id = m.utilisateur_id
 WHERE m.role = 'operateur';

CREATE TABLE affectation (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id                uuid NOT NULL REFERENCES lieu (id),
  evenement_id           uuid NOT NULL,
  employe_id             uuid NOT NULL,
  stand_id               uuid,
  caisse_id              uuid,
  role                   text NOT NULL CHECK (role IN ('Caissier', 'Préparation / cuisine', 'Responsable de stand', 'Renfort ponctuel')),
  debut_prevu            time NOT NULL,
  fin_prevu              time NOT NULL,
  debut_reel             time NOT NULL,
  fin_reel               time NOT NULL,
  reel_corrige_par       uuid REFERENCES utilisateur (id),
  reel_corrige_le        timestamptz,
  -- Taux de l'employé au moment de l'affectation : un changement de taux ne réécrit pas le passé.
  taux_horaire_centimes  integer CHECK (taux_horaire_centimes BETWEEN 0 AND 100000),
  cree_le                timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, employe_id) REFERENCES employe (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  CONSTRAINT affectation_caisse_avec_stand CHECK (caisse_id IS NULL OR stand_id IS NOT NULL),
  CONSTRAINT affectation_correction_complete CHECK ((reel_corrige_par IS NULL) = (reel_corrige_le IS NULL))
);
CREATE INDEX affectation_evenement ON affectation (lieu_id, evenement_id);
ALTER TABLE affectation ENABLE ROW LEVEL SECURITY;
CREATE POLICY affectation_isolement ON affectation USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON affectation TO flaix_app;
GRANT UPDATE (stand_id, caisse_id, role, debut_prevu, fin_prevu, debut_reel, fin_reel, reel_corrige_par, reel_corrige_le) ON affectation TO flaix_app;
