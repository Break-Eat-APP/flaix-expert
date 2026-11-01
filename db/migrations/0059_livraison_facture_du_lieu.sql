-- =============================================================================
-- 0059 — Une ligne de facture ne se rapproche que d'une livraison de son lieu (audit Codex du 2026-10-26, P1-1, §15.176).
--
-- `ligne_facture_fournisseur.livraison_id` référençait `stock_mouvement (id)` seul : la route n'interrogeait pas le
-- mouvement, une ligne pouvait donc être reliée au mouvement d'un autre lieu. La clé devient composée (lieu, id), comme
-- les autres clés du schéma ; la route vérifie en plus le type du mouvement et son produit.
--
-- Une facture validée ne se modifie plus (déclencheur `ligne_facture_figee`) : si des lignes déjà enregistrées pointent
-- ailleurs, la migration ne les touche pas. La clé reste alors « non validée » (elle s'applique à toute nouvelle écriture)
-- et un avertissement le signale : à traiter par une migration dédiée, après examen.
-- =============================================================================

ALTER TABLE stock_mouvement ADD CONSTRAINT stock_mouvement_lieu_id_unique UNIQUE (lieu_id, id);

ALTER TABLE ligne_facture_fournisseur DROP CONSTRAINT ligne_facture_fournisseur_livraison_id_fkey;
ALTER TABLE ligne_facture_fournisseur
  ADD CONSTRAINT ligne_facture_livraison_du_lieu FOREIGN KEY (lieu_id, livraison_id) REFERENCES stock_mouvement (lieu_id, id) NOT VALID;

DO $$
DECLARE
  v_incoherentes integer;
BEGIN
  SELECT count(*) INTO v_incoherentes
    FROM ligne_facture_fournisseur l
    LEFT JOIN stock_mouvement m ON m.lieu_id = l.lieu_id AND m.id = l.livraison_id
   WHERE l.livraison_id IS NOT NULL AND m.id IS NULL;
  IF v_incoherentes = 0 THEN
    ALTER TABLE ligne_facture_fournisseur VALIDATE CONSTRAINT ligne_facture_livraison_du_lieu;
  ELSE
    RAISE WARNING '% ligne(s) de facture reliée(s) à un mouvement d''un autre lieu : clé non validée, à examiner.', v_incoherentes;
  END IF;
END
$$;
