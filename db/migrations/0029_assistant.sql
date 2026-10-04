-- 0029 — Assistant « pose ta question » et reformulation du brief par Mistral (décision de Rémi du
-- 2026-10-04, dossier §15.136).
--
-- Option du lieu « assistant », désactivée par défaut (chaque question coûte) : activée par FlaiX Expert
-- dans le back-office. Chaque échange est gardé (question, réponse, outils consultés, modèle, contrôle
-- des chiffres) : on sait toujours ce que l'IA a lu et ce qu'elle a répondu.

ALTER TABLE option_lieu DROP CONSTRAINT option_lieu_option_check;
ALTER TABLE option_lieu ADD CONSTRAINT option_lieu_option_check
  CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'export_comptable', 'couts_buvette', 'assistant'));

CREATE TABLE assistant_echange (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id        uuid NOT NULL REFERENCES lieu (id),
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id),
  question       text NOT NULL CHECK (length(question) BETWEEN 1 AND 500),
  reponse        text NOT NULL,
  -- Outils consultés : nom et paramètres, dans l'ordre.
  sources        jsonb NOT NULL,
  modele         text NOT NULL,
  -- Tous les chiffres de la réponse figurent-ils dans les données lues ?
  verifie        boolean NOT NULL,
  jetons_entree  integer,
  jetons_sortie  integer,
  cree_le        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assistant_echange_jour ON assistant_echange (lieu_id, cree_le);
ALTER TABLE assistant_echange ENABLE ROW LEVEL SECURITY;
CREATE POLICY assistant_echange_isolement ON assistant_echange USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON assistant_echange TO flaix_app;
CREATE TRIGGER assistant_echange_ecriture_seule BEFORE UPDATE OR DELETE ON assistant_echange FOR EACH ROW EXECUTE FUNCTION refuser_modification();
