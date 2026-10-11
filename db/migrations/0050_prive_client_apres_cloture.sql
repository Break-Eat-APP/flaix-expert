-- =============================================================================
-- 0050 — Événement privé clôturé : le client reste modifiable (dossier §15.160).
--
-- La clôture fige les chiffres (consommations, frais, coûts, budget, date) ; le client (nom, société, adresse,
-- SIRET, n° de TVA), son contact et les notes peuvent encore se compléter, pour pouvoir émettre la facture. Une
-- facture émise garde son propre contenu figé : la changer n'est pas possible.
-- =============================================================================

CREATE OR REPLACE FUNCTION evenement_prive_fige() RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  IF OLD.etat = 'cloture' AND ROW(NEW.nom, NEW.debut, NEW.salon, NEW.invites, NEW.budget_centimes, NEW.etat, NEW.cloture_le, NEW.cloture_par)
       IS DISTINCT FROM ROW(OLD.nom, OLD.debut, OLD.salon, OLD.invites, OLD.budget_centimes, OLD.etat, OLD.cloture_le, OLD.cloture_par) THEN
    RAISE EXCEPTION 'Événement privé clôturé : seuls le client, les notes et le règlement se modifient encore.';
  END IF;
  RETURN NEW;
END
$$;
