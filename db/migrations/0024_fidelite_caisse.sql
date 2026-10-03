-- =============================================================================
-- 0024 — Fidélité à la caisse : code promo et points dans le ticket (dossier §15.127).
--
-- Option A de Rémi (§15.115) : dépenser des points et utiliser un code promo PLAFONNÉ demandent le
-- réseau. Le serveur réserve les points (ou un usage du code) avant l'encaissement ; le ticket
-- scellé porte la réservation, que le serveur consomme quand il reçoit le ticket. Une réservation
-- abandonnée expire seule. Un code sans plafond marche hors ligne, sans réservation.
-- Les soldes ne sont jamais recopiés : ils se lisent dans les tickets non annulés (une annulation
-- rend les points et l'usage du code d'elle-même).
-- =============================================================================

-- La part de fidélité de chaque ligne de ticket (0 pour un ticket sans fidélité).
ALTER TABLE ligne_ticket ADD COLUMN fidelite_centimes integer NOT NULL DEFAULT 0;
DO $$
DECLARE c text;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'ligne_ticket'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%offert_centimes%net_ttc_centimes%' LOOP
    EXECUTE format('ALTER TABLE ligne_ticket DROP CONSTRAINT %I', c);
  END LOOP;
END
$$;
ALTER TABLE ligne_ticket ADD CONSTRAINT ligne_ticket_net CHECK (brut_centimes - remise_centimes - offert_centimes - fidelite_centimes = net_ttc_centimes);

CREATE TABLE reservation_fidelite (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id           uuid NOT NULL REFERENCES lieu (id),
  type              text NOT NULL CHECK (type IN ('points', 'code_promo')),
  abonne_id         uuid,
  code_promo_id     uuid,
  points            integer CHECK (points > 0),
  montant_centimes  integer CHECK (montant_centimes > 0),
  caisse_id         uuid NOT NULL,
  expire_le         timestamptz NOT NULL,
  -- Le ticket qui a utilisé la réservation (journal de caisse), ou la libération par la caissière.
  consommee_par     uuid,
  liberee_le        timestamptz,
  par               uuid NOT NULL REFERENCES utilisateur (id),
  le                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, abonne_id) REFERENCES abonne_fidelite (lieu_id, id),
  FOREIGN KEY (lieu_id, code_promo_id) REFERENCES code_promo (lieu_id, id),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  CONSTRAINT reservation_fidelite_forme CHECK (
    (type = 'points' AND abonne_id IS NOT NULL AND points IS NOT NULL AND montant_centimes IS NOT NULL AND code_promo_id IS NULL)
    OR (type = 'code_promo' AND code_promo_id IS NOT NULL AND abonne_id IS NULL AND points IS NULL AND montant_centimes IS NULL)
  )
);
CREATE INDEX reservation_fidelite_actives ON reservation_fidelite (lieu_id, type) WHERE consommee_par IS NULL AND liberee_le IS NULL;
CREATE UNIQUE INDEX reservation_fidelite_un_ticket ON reservation_fidelite (consommee_par) WHERE consommee_par IS NOT NULL AND type = 'points';
ALTER TABLE reservation_fidelite ENABLE ROW LEVEL SECURITY;
CREATE POLICY reservation_fidelite_isolement ON reservation_fidelite USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON reservation_fidelite TO flaix_app;
GRANT UPDATE (consommee_par, liberee_le) ON reservation_fidelite TO flaix_app;

-- Une réservation se consomme ou se libère une seule fois ; le reste ne bouge jamais.
CREATE FUNCTION controler_reservation_fidelite() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Une réservation ne se supprime pas' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF (OLD.consommee_par IS NOT NULL AND NEW.consommee_par IS DISTINCT FROM OLD.consommee_par)
     OR (OLD.liberee_le IS NOT NULL AND NEW.liberee_le IS DISTINCT FROM OLD.liberee_le) THEN
    RAISE EXCEPTION 'Réservation déjà utilisée ou libérée' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER reservation_fidelite_cycle BEFORE UPDATE OR DELETE ON reservation_fidelite FOR EACH ROW EXECUTE FUNCTION controler_reservation_fidelite();
