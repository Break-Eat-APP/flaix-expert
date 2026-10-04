-- 0028 — Brief de fin de soirée envoyé en notification sur le téléphone du directeur (dossier §15.135).
--
-- Notifications « Web Push » de l'application installée : aucun service extérieur à part celui du
-- navigateur du téléphone. La paire de clés du serveur (VAPID) est créée au premier besoin et reste
-- dans la base, sur le serveur.

CREATE TABLE cle_serveur (
  nom     text PRIMARY KEY CHECK (nom ~ '^[a-z_]{1,40}$'),
  valeur  text NOT NULL,
  cree_le timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON cle_serveur TO flaix_app;

-- Un téléphone (ou un navigateur) abonné aux notifications d'un directeur, pour un lieu.
CREATE TABLE abonnement_push (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id        uuid NOT NULL REFERENCES lieu (id),
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id),
  endpoint       text NOT NULL CHECK (endpoint ~ '^https://' AND length(endpoint) <= 1000),
  p256dh         text NOT NULL CHECK (length(p256dh) BETWEEN 1 AND 200),
  auth           text NOT NULL CHECK (length(auth) BETWEEN 1 AND 100),
  appareil       text CHECK (length(appareil) <= 120),
  cree_le        timestamptz NOT NULL DEFAULT now(),
  retire_le      timestamptz
);
CREATE UNIQUE INDEX abonnement_push_actif ON abonnement_push (lieu_id, endpoint) WHERE retire_le IS NULL;
ALTER TABLE abonnement_push ENABLE ROW LEVEL SECURITY;
CREATE POLICY abonnement_push_isolement ON abonnement_push USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON abonnement_push TO flaix_app;
GRANT UPDATE (retire_le) ON abonnement_push TO flaix_app;

-- Le brief tel qu'il a été envoyé, une fois par événement (traçabilité : qui a reçu quoi, rédigé comment).
CREATE TABLE brief_soiree (
  lieu_id      uuid NOT NULL,
  evenement_id uuid NOT NULL,
  contenu      jsonb NOT NULL,
  redige_par   text NOT NULL CHECK (redige_par IN ('regles', 'mistral')),
  modele       text,
  envoye_a     integer NOT NULL CHECK (envoye_a >= 0),
  cree_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, evenement_id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id)
);
ALTER TABLE brief_soiree ENABLE ROW LEVEL SECURITY;
CREATE POLICY brief_soiree_isolement ON brief_soiree USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON brief_soiree TO flaix_app;
CREATE TRIGGER brief_soiree_ecriture_seule BEFORE UPDATE OR DELETE ON brief_soiree FOR EACH ROW EXECUTE FUNCTION refuser_modification();
