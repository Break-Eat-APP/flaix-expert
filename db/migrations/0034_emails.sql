-- 0034 — E-mails par Brevo : rapport de soirée et rectifications (décision de Rémi du 2026-10-05, dossier §15.146).
--
-- Réglages du lieu (actifs par défaut) et adresses ajoutées en plus des directeurs (5 au plus, contrôlées par
-- le serveur). Chaque envoi est tracé, en écriture seule ; un rapport de soirée ne part qu'une fois par événement.

ALTER TABLE lieu ADD COLUMN email_rapport boolean NOT NULL DEFAULT true;
ALTER TABLE lieu ADD COLUMN email_rectification boolean NOT NULL DEFAULT true;
ALTER TABLE lieu ADD COLUMN emails_supplementaires text[] NOT NULL DEFAULT '{}' CHECK (cardinality(emails_supplementaires) <= 5);
GRANT UPDATE (email_rapport, email_rectification, emails_supplementaires) ON lieu TO flaix_app;

CREATE TABLE email_envoye (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  type          text NOT NULL CHECK (type IN ('rapport_soiree', 'rectification', 'essai')),
  -- Événement (rapport) ou comptage rectifié : ce dont parle l'e-mail.
  objet_id      uuid,
  sujet         text NOT NULL CHECK (length(sujet) BETWEEN 1 AND 300),
  destinataires integer NOT NULL CHECK (destinataires >= 0),
  statut        text NOT NULL CHECK (statut IN ('envoye', 'echec', 'sans_service')),
  erreur        text CHECK (erreur IS NULL OR length(erreur) <= 500),
  message_id    text CHECK (message_id IS NULL OR length(message_id) <= 300),
  le            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_envoye_rapport_unique ON email_envoye (lieu_id, objet_id) WHERE type = 'rapport_soiree' AND statut = 'envoye';
CREATE INDEX email_envoye_lieu ON email_envoye (lieu_id, le DESC);
ALTER TABLE email_envoye ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_envoye_isolement ON email_envoye USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON email_envoye TO flaix_app;
CREATE TRIGGER email_envoye_ecriture_seule BEFORE UPDATE OR DELETE ON email_envoye FOR EACH ROW EXECUTE FUNCTION refuser_modification();
