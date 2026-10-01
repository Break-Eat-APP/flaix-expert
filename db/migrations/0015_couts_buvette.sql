-- =============================================================================
-- 0015 — Coûts par buvette (module 8 ; dossier §15.83, §15.84, §15.113).
--
-- Frais propres à chaque stand (loyer, logiciel, abonnement, TPE), saisis directement par le
-- directeur — pas de clé de répartition (§15.84). Montants MENSUELS, datés : une ligne vaut à
-- partir de son mois et jusqu'à la suivante ; changer un frais en cours de saison ne réécrit pas
-- les mois passés. Aucun montant par défaut : un stand sans ligne a des frais à 0.
-- =============================================================================

CREATE TABLE frais_stand (
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  stand_id         uuid NOT NULL,
  poste            text NOT NULL CHECK (poste IN ('loyer', 'logiciel', 'abonnement', 'tpe')),
  -- Premier jour du mois à partir duquel le montant s'applique.
  a_partir_de      date NOT NULL CHECK (extract(day FROM a_partir_de) = 1),
  montant_centimes integer NOT NULL CHECK (montant_centimes BETWEEN 0 AND 100000000),
  saisi_par        uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, stand_id, poste, a_partir_de),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
ALTER TABLE frais_stand ENABLE ROW LEVEL SECURITY;
CREATE POLICY frais_stand_isolement ON frais_stand USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON frais_stand TO flaix_app;
GRANT UPDATE (montant_centimes, saisi_par, saisi_le) ON frais_stand TO flaix_app;

-- Recopie dans le lieu de formation (§15.109) : les frais suivent la correspondance des stands.
CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

  DELETE FROM frais_stand WHERE lieu_id = p_form;
  INSERT INTO frais_stand (lieu_id, stand_id, poste, a_partir_de, montant_centimes, saisi_par, saisi_le)
  SELECT p_form, fs.id, r.poste, r.a_partir_de, r.montant_centimes, r.saisi_par, r.saisi_le
    FROM frais_stand r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel;
END
$$;
