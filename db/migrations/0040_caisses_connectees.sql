-- =============================================================================
-- 0040 — Caisses connectées : ventes d'une caisse externe importées pour la gestion (dossier §15.150).
--
-- Les ventes importées (L'Addition, Digifood, Weezevent…) sont rangées à part des tickets scellés : elles n'entrent
-- jamais dans le journal de caisse, les Z, les clôtures ni l'export comptable de FlaiX Expert. Une vente n'est importée
-- qu'une fois (identifiant de la vente dans sa caisse) ; seule son annulation peut être reportée par un import suivant.
-- =============================================================================

ALTER TABLE option_lieu DROP CONSTRAINT option_lieu_option_check;
ALTER TABLE option_lieu ADD CONSTRAINT option_lieu_option_check
  CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'export_comptable', 'couts_buvette', 'assistant', 'caisses_connectees'));

CREATE TABLE caisse_externe (
  id       uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lieu_id  uuid NOT NULL REFERENCES lieu (id),
  nom      text NOT NULL CHECK (length(nom) BETWEEN 1 AND 80),
  systeme  text NOT NULL CHECK (systeme IN ('digifood', 'weezevent', 'laddition', 'autre')),
  -- Colonnes du fichier retenues au dernier import (reprises au suivant).
  colonnes jsonb CHECK (colonnes IS NULL OR jsonb_typeof(colonnes) = 'object'),
  cree_le  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
ALTER TABLE caisse_externe ENABLE ROW LEVEL SECURITY;
CREATE POLICY caisse_externe_isolement ON caisse_externe USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON caisse_externe TO flaix_app;
GRANT UPDATE (nom, colonnes) ON caisse_externe TO flaix_app;

CREATE TABLE import_ventes_externes (
  id               uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lieu_id          uuid NOT NULL,
  caisse_externe_id uuid NOT NULL,
  le               timestamptz NOT NULL DEFAULT now(),
  par              uuid NOT NULL REFERENCES utilisateur (id),
  fichier          text NOT NULL CHECK (length(fichier) BETWEEN 1 AND 200),
  lignes_lues      integer NOT NULL CHECK (lignes_lues >= 0),
  ventes_ajoutees  integer NOT NULL CHECK (ventes_ajoutees >= 0),
  ventes_deja      integer NOT NULL CHECK (ventes_deja >= 0),
  erreurs          jsonb NOT NULL CHECK (jsonb_typeof(erreurs) = 'array'),
  FOREIGN KEY (lieu_id, caisse_externe_id) REFERENCES caisse_externe (lieu_id, id)
);
ALTER TABLE import_ventes_externes ENABLE ROW LEVEL SECURITY;
CREATE POLICY import_ventes_externes_isolement ON import_ventes_externes USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON import_ventes_externes TO flaix_app;
CREATE TRIGGER import_ventes_externes_ecriture_seule BEFORE UPDATE OR DELETE ON import_ventes_externes FOR EACH ROW EXECUTE FUNCTION refuser_modification();

CREATE TABLE vente_externe (
  lieu_id           uuid NOT NULL,
  caisse_externe_id uuid NOT NULL,
  id_externe        text NOT NULL CHECK (length(id_externe) BETWEEN 1 AND 120),
  horodatage        timestamptz NOT NULL,
  point_de_vente    text CHECK (point_de_vente IS NULL OR length(point_de_vente) <= 120),
  paiement          text CHECK (paiement IS NULL OR length(paiement) <= 60),
  annulee           boolean NOT NULL,
  total_centimes    integer NOT NULL,
  -- Événement du même jour (heure de Paris), rattaché à l'import ; null : hors événement.
  evenement_id      uuid,
  import_id         uuid NOT NULL REFERENCES import_ventes_externes (id),
  PRIMARY KEY (lieu_id, caisse_externe_id, id_externe),
  FOREIGN KEY (lieu_id, caisse_externe_id) REFERENCES caisse_externe (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id)
);
CREATE INDEX vente_externe_horodatage ON vente_externe (lieu_id, horodatage);
ALTER TABLE vente_externe ENABLE ROW LEVEL SECURITY;
CREATE POLICY vente_externe_isolement ON vente_externe USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON vente_externe TO flaix_app;
GRANT UPDATE (annulee) ON vente_externe TO flaix_app;

CREATE TABLE ligne_vente_externe (
  lieu_id                uuid NOT NULL,
  caisse_externe_id      uuid NOT NULL,
  id_externe             text NOT NULL,
  rang                   smallint NOT NULL CHECK (rang >= 0),
  -- Clé de correspondance : code du produit dans la caisse, sinon son libellé.
  cle                    text NOT NULL CHECK (length(cle) BETWEEN 1 AND 200),
  libelle                text NOT NULL CHECK (length(libelle) BETWEEN 1 AND 200),
  code                   text CHECK (code IS NULL OR length(code) <= 120),
  quantite               numeric(12, 3) NOT NULL,
  prix_unitaire_centimes integer NOT NULL,
  montant_centimes       integer NOT NULL,
  tva_pb                 integer CHECK (tva_pb IS NULL OR tva_pb BETWEEN 0 AND 10000),
  PRIMARY KEY (lieu_id, caisse_externe_id, id_externe, rang),
  FOREIGN KEY (lieu_id, caisse_externe_id, id_externe) REFERENCES vente_externe (lieu_id, caisse_externe_id, id_externe)
);
CREATE INDEX ligne_vente_externe_cle ON ligne_vente_externe (lieu_id, caisse_externe_id, cle);
ALTER TABLE ligne_vente_externe ENABLE ROW LEVEL SECURITY;
CREATE POLICY ligne_vente_externe_isolement ON ligne_vente_externe USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ligne_vente_externe TO flaix_app;
CREATE TRIGGER ligne_vente_externe_ecriture_seule BEFORE UPDATE OR DELETE ON ligne_vente_externe FOR EACH ROW EXECUTE FUNCTION refuser_modification();

-- Produit de la caisse → produit de FlaiX Expert (coût matière, donc marge), ou ignoré.
CREATE TABLE correspondance_produit_externe (
  lieu_id           uuid NOT NULL,
  caisse_externe_id uuid NOT NULL,
  cle               text NOT NULL CHECK (length(cle) BETWEEN 1 AND 200),
  produit_id        uuid,
  ignore            boolean NOT NULL DEFAULT false,
  PRIMARY KEY (lieu_id, caisse_externe_id, cle),
  FOREIGN KEY (lieu_id, caisse_externe_id) REFERENCES caisse_externe (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  CHECK (NOT (ignore AND produit_id IS NOT NULL))
);
ALTER TABLE correspondance_produit_externe ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondance_produit_externe_isolement ON correspondance_produit_externe USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON correspondance_produit_externe TO flaix_app;

-- Point de vente de la caisse → stand de FlaiX Expert.
CREATE TABLE correspondance_point_de_vente (
  lieu_id           uuid NOT NULL,
  caisse_externe_id uuid NOT NULL,
  nom               text NOT NULL CHECK (length(nom) BETWEEN 1 AND 120),
  stand_id          uuid,
  PRIMARY KEY (lieu_id, caisse_externe_id, nom),
  FOREIGN KEY (lieu_id, caisse_externe_id) REFERENCES caisse_externe (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
ALTER TABLE correspondance_point_de_vente ENABLE ROW LEVEL SECURITY;
CREATE POLICY correspondance_point_de_vente_isolement ON correspondance_point_de_vente USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON correspondance_point_de_vente TO flaix_app;
