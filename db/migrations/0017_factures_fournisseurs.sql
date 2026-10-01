-- =============================================================================
-- 0017 — Factures fournisseurs (module 12b validé ; dossier §14 module 12b, §15.115).
--
-- FlaiX n'est pas une plateforme agréée : la facture arrive par celle du lieu (ou sur papier) ;
-- ici, on la saisit (lignes) et on y joint le PDF ou la photo, puis chaque ligne est rapprochée
-- d'une livraison déjà saisie dans le Stock. Écarts signalés, jamais corrigés.
--
-- Cycle : reçue → rapprochée / en écart → validée (motif obligatoire s'il reste un écart) → payée.
-- Une facture validée ne se modifie plus ; rien ne se supprime.
-- =============================================================================

CREATE TABLE facture_fournisseur (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  fournisseur   text NOT NULL CHECK (length(btrim(fournisseur)) BETWEEN 1 AND 120),
  numero        text NOT NULL CHECK (length(btrim(numero)) BETWEEN 1 AND 60),
  date_facture  date NOT NULL,
  echeance      date,
  validee_par   uuid REFERENCES utilisateur (id),
  validee_le    timestamptz,
  motif_validation text CHECK (motif_validation IS NULL OR length(btrim(motif_validation)) BETWEEN 5 AND 500),
  payee_par     uuid REFERENCES utilisateur (id),
  payee_le      timestamptz,
  date_paiement date,
  cree_par      uuid NOT NULL REFERENCES utilisateur (id),
  cree_le       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CONSTRAINT facture_echeance CHECK (echeance IS NULL OR echeance >= date_facture),
  CONSTRAINT facture_validation_complete CHECK ((validee_par IS NULL) = (validee_le IS NULL)),
  CONSTRAINT facture_paiement_complet CHECK ((payee_par IS NULL) = (payee_le IS NULL) AND (payee_le IS NULL) = (date_paiement IS NULL)),
  CONSTRAINT facture_payee_apres_validation CHECK (payee_le IS NULL OR validee_le IS NOT NULL)
);
-- Un même n° de facture d'un même fournisseur ne s'enregistre qu'une fois.
CREATE UNIQUE INDEX facture_fournisseur_numero ON facture_fournisseur (lieu_id, lower(btrim(fournisseur)), btrim(numero));
ALTER TABLE facture_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY facture_fournisseur_isolement ON facture_fournisseur USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON facture_fournisseur TO flaix_app;
GRANT UPDATE (fournisseur, numero, date_facture, echeance, validee_par, validee_le, motif_validation, payee_par, payee_le, date_paiement) ON facture_fournisseur TO flaix_app;

CREATE TABLE ligne_facture_fournisseur (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id                uuid NOT NULL,
  facture_id             uuid NOT NULL,
  ordre                  integer NOT NULL CHECK (ordre >= 0),
  produit_id             uuid,
  libelle                text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 160),
  quantite               integer NOT NULL CHECK (quantite > 0 AND quantite <= 1000000),
  prix_unitaire_centimes integer NOT NULL CHECK (prix_unitaire_centimes BETWEEN 0 AND 10000000),
  -- Livraison du Stock choisie par le directeur ; figée à la validation (proposée automatiquement sinon).
  livraison_id           uuid REFERENCES stock_mouvement (id),
  FOREIGN KEY (lieu_id, facture_id) REFERENCES facture_fournisseur (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  CONSTRAINT ligne_facture_ordre UNIQUE (facture_id, ordre)
);
-- Une livraison ne se rapproche que d'une seule ligne de facture.
CREATE UNIQUE INDEX ligne_facture_livraison_unique ON ligne_facture_fournisseur (livraison_id) WHERE livraison_id IS NOT NULL;
ALTER TABLE ligne_facture_fournisseur ENABLE ROW LEVEL SECURITY;
CREATE POLICY ligne_facture_isolement ON ligne_facture_fournisseur USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON ligne_facture_fournisseur TO flaix_app;
GRANT UPDATE (livraison_id) ON ligne_facture_fournisseur TO flaix_app;

-- Pièce jointe (PDF ou photo), gardée dans la base : elle part dans les sauvegardes avec le reste.
CREATE TABLE fichier_facture (
  facture_id  uuid PRIMARY KEY,
  lieu_id     uuid NOT NULL,
  nom         text NOT NULL CHECK (length(nom) BETWEEN 1 AND 200),
  type        text NOT NULL CHECK (type IN ('application/pdf', 'image/jpeg', 'image/png')),
  taille      integer NOT NULL CHECK (taille BETWEEN 1 AND 10485760),
  contenu     bytea NOT NULL,
  depose_par  uuid NOT NULL REFERENCES utilisateur (id),
  depose_le   timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, facture_id) REFERENCES facture_fournisseur (lieu_id, id)
);
ALTER TABLE fichier_facture ENABLE ROW LEVEL SECURITY;
CREATE POLICY fichier_facture_isolement ON fichier_facture USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON fichier_facture TO flaix_app;
GRANT UPDATE (nom, type, taille, contenu, depose_par, depose_le) ON fichier_facture TO flaix_app;

-- Une facture validée est figée : ni ses lignes, ni sa pièce jointe, ni son en-tête ne changent
-- (seul le paiement s'y ajoute). Rien ne se supprime.
CREATE FUNCTION controler_facture_figee() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF TG_TABLE_NAME = 'facture_fournisseur' THEN
    IF OLD.validee_le IS NOT NULL AND (NEW.fournisseur, NEW.numero, NEW.date_facture, NEW.echeance, NEW.validee_par, NEW.validee_le, NEW.motif_validation)
         IS DISTINCT FROM (OLD.fournisseur, OLD.numero, OLD.date_facture, OLD.echeance, OLD.validee_par, OLD.validee_le, OLD.motif_validation) THEN
      RAISE EXCEPTION 'Facture validée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.payee_le IS NOT NULL THEN
      RAISE EXCEPTION 'Facture payée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  -- Lignes et pièce jointe : la facture à laquelle elles appartiennent ne doit pas être validée.
  IF EXISTS (SELECT 1 FROM facture_fournisseur f WHERE f.id = OLD.facture_id AND f.validee_le IS NOT NULL) THEN
    RAISE EXCEPTION 'Facture validée : elle ne se modifie plus' USING ERRCODE = 'check_violation';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
CREATE TRIGGER facture_figee BEFORE UPDATE ON facture_fournisseur FOR EACH ROW EXECUTE FUNCTION controler_facture_figee();
CREATE TRIGGER facture_pas_de_suppression BEFORE DELETE ON facture_fournisseur FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER ligne_facture_figee BEFORE UPDATE OR DELETE ON ligne_facture_fournisseur FOR EACH ROW EXECUTE FUNCTION controler_facture_figee();
CREATE TRIGGER fichier_facture_fige BEFORE UPDATE ON fichier_facture FOR EACH ROW EXECUTE FUNCTION controler_facture_figee();
CREATE TRIGGER fichier_facture_pas_de_suppression BEFORE DELETE ON fichier_facture FOR EACH ROW EXECUTE FUNCTION refuser_modification();
