-- =============================================================================
-- 0057 — Factures fournisseurs automatisées (dossier §15.173, demande de Rémi du 2026-10-24).
--
-- * Chaque ligne dit combien d'unités vendues contient une unité facturée (« Coca 33 cl x24 » : 24) et le code article
--   du fournisseur : la réserve reçoit quantité × colis, au prix ÷ colis.
-- * Total HT annoncé sur la facture (facultatif) : comparé à la somme des lignes avant validation.
-- * Correspondances article du fournisseur → produit et colis, apprises à chaque facture enregistrée et reprises à la
--   suivante (import Excel ou CSV). C'est un réglage : il se modifie, chaque changement est journalisé.
-- =============================================================================

ALTER TABLE ligne_facture_fournisseur ADD COLUMN unites_par_colis integer NOT NULL DEFAULT 1 CHECK (unites_par_colis BETWEEN 1 AND 10000);
ALTER TABLE ligne_facture_fournisseur ADD COLUMN code_article text CHECK (code_article IS NULL OR length(btrim(code_article)) BETWEEN 1 AND 60);

ALTER TABLE facture_fournisseur ADD COLUMN total_annonce_centimes integer CHECK (total_annonce_centimes IS NULL OR total_annonce_centimes BETWEEN 0 AND 1000000000);
GRANT UPDATE (total_annonce_centimes) ON facture_fournisseur TO flaix_app;

-- Le total annoncé se fige avec la facture, comme son en-tête.
CREATE OR REPLACE FUNCTION controler_facture_figee() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_TABLE_NAME = 'facture_fournisseur' THEN
    IF OLD.validee_le IS NOT NULL AND (NEW.fournisseur, NEW.numero, NEW.date_facture, NEW.echeance, NEW.validee_par, NEW.validee_le, NEW.motif_validation, NEW.total_annonce_centimes)
         IS DISTINCT FROM (OLD.fournisseur, OLD.numero, OLD.date_facture, OLD.echeance, OLD.validee_par, OLD.validee_le, OLD.motif_validation, OLD.total_annonce_centimes) THEN
      RAISE EXCEPTION 'Facture validée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.payee_le IS NOT NULL THEN
      RAISE EXCEPTION 'Facture payée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM facture_fournisseur f WHERE f.id = OLD.facture_id AND f.validee_le IS NOT NULL) THEN
    RAISE EXCEPTION 'Facture validée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;

CREATE TABLE correspondance_article_fournisseur (
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  -- Fournisseur et clé normalisés (sans accents, minuscules) : « code:coc33 » ou « lib:coca cola 33 cl x24 ».
  fournisseur      text NOT NULL CHECK (length(fournisseur) BETWEEN 1 AND 120),
  cle              text NOT NULL CHECK (length(cle) BETWEEN 5 AND 200),
  libelle          text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 160),
  produit_id       uuid,
  unites_par_colis integer NOT NULL DEFAULT 1 CHECK (unites_par_colis BETWEEN 1 AND 10000),
  modifiee_par     uuid NOT NULL REFERENCES utilisateur (id),
  modifiee_le      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, fournisseur, cle),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id)
);
ALTER TABLE correspondance_article_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondance_article_fournisseur_isolement ON correspondance_article_fournisseur USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON correspondance_article_fournisseur TO flaix_app;
GRANT UPDATE (libelle, produit_id, unites_par_colis, modifiee_par, modifiee_le) ON correspondance_article_fournisseur TO flaix_app;
