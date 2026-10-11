-- =============================================================================
-- 0049 — Événements privés (dossier §15.160, demande de Rémi du 2026-10-11).
--
-- Salons, privatisations, groupes avec un budget pour la soirée. De la gestion tenue par le directeur : rien ne passe
-- par la caisse (tickets, Z, clôtures des buvettes intacts). Fiche, consommations (produits du catalogue ou lignes
-- libres), frais ; à la clôture, coûts et lignes sont figés (verrou dans la base) — seul le règlement se note ensuite.
-- Facture de vente : série continue par lieu et par année, contenu figé et scellé par son empreinte, en écriture seule.
-- =============================================================================

ALTER TABLE option_lieu DROP CONSTRAINT option_lieu_option_check;
ALTER TABLE option_lieu ADD CONSTRAINT option_lieu_option_check
  CHECK (option IN ('stock', 'equipe', 'fidelite', 'click_collect', 'factures', 'export_comptable', 'couts_buvette', 'assistant', 'caisses_connectees', 'hygiene', 'evenements_prives'));

CREATE TABLE evenement_prive (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id          uuid NOT NULL REFERENCES lieu (id),
  nom              text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 120),
  debut            timestamptz NOT NULL,
  salon            text CHECK (salon IS NULL OR length(btrim(salon)) BETWEEN 1 AND 120),
  invites          integer CHECK (invites IS NULL OR invites BETWEEN 1 AND 100000),
  budget_centimes  integer CHECK (budget_centimes IS NULL OR budget_centimes BETWEEN 0 AND 100000000),
  client_nom       text CHECK (client_nom IS NULL OR length(btrim(client_nom)) BETWEEN 1 AND 120),
  client_contact   text CHECK (client_contact IS NULL OR length(btrim(client_contact)) BETWEEN 1 AND 200),
  societe          text CHECK (societe IS NULL OR length(btrim(societe)) BETWEEN 1 AND 200),
  adresse          text CHECK (adresse IS NULL OR length(btrim(adresse)) BETWEEN 1 AND 300),
  siret            text CHECK (siret IS NULL OR siret ~ '^[0-9]{14}$'),
  tva_intracom     text CHECK (tva_intracom IS NULL OR tva_intracom ~ '^[A-Z]{2}[0-9A-Z]{2,13}$'),
  notes            text CHECK (notes IS NULL OR length(notes) <= 2000),
  etat             text NOT NULL DEFAULT 'prevu' CHECK (etat IN ('prevu', 'cloture')),
  cloture_le       timestamptz,
  cloture_par      uuid REFERENCES utilisateur (id),
  reglement        text CHECK (reglement IN ('virement', 'carte', 'especes', 'cheque')),
  regle_le         date,
  cree_par         uuid NOT NULL REFERENCES utilisateur (id),
  cree_le          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id),
  CHECK ((etat = 'cloture') = (cloture_le IS NOT NULL)),
  CHECK ((reglement IS NULL) = (regle_le IS NULL))
);
CREATE INDEX evenement_prive_debut ON evenement_prive (lieu_id, debut);
ALTER TABLE evenement_prive ENABLE ROW LEVEL SECURITY;
CREATE POLICY evenement_prive_isolement ON evenement_prive USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON evenement_prive TO flaix_app;
GRANT UPDATE (nom, debut, salon, invites, budget_centimes, client_nom, client_contact, societe, adresse, siret, tva_intracom, notes, etat, cloture_le, cloture_par, reglement, regle_le)
  ON evenement_prive TO flaix_app;

-- Clôturé : la fiche ne change plus, sauf le règlement.
CREATE FUNCTION evenement_prive_fige() RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  IF OLD.etat = 'cloture' AND ROW(NEW.nom, NEW.debut, NEW.salon, NEW.invites, NEW.budget_centimes, NEW.client_nom, NEW.client_contact, NEW.societe, NEW.adresse, NEW.siret, NEW.tva_intracom, NEW.notes, NEW.etat, NEW.cloture_le, NEW.cloture_par)
       IS DISTINCT FROM ROW(OLD.nom, OLD.debut, OLD.salon, OLD.invites, OLD.budget_centimes, OLD.client_nom, OLD.client_contact, OLD.societe, OLD.adresse, OLD.siret, OLD.tva_intracom, OLD.notes, OLD.etat, OLD.cloture_le, OLD.cloture_par) THEN
    RAISE EXCEPTION 'Événement privé clôturé : seul le règlement se note encore.';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER evenement_prive_fige BEFORE UPDATE ON evenement_prive FOR EACH ROW EXECUTE FUNCTION evenement_prive_fige();

CREATE TABLE evenement_prive_ligne (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id            uuid NOT NULL,
  evenement_id       uuid NOT NULL,
  produit_id         uuid,
  libelle            text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 120),
  quantite           integer NOT NULL CHECK (quantite BETWEEN 1 AND 100000),
  prix_ttc_centimes  integer NOT NULL CHECK (prix_ttc_centimes BETWEEN 0 AND 10000000),
  taux_tva_pb        integer NOT NULL CHECK (taux_tva_pb IN (210, 550, 1000, 2000)),
  -- Coût d'une unité (matière + conditionnement), figé à la clôture ; saisi pour une ligne libre.
  cout_unitaire      numeric(14, 3) CHECK (cout_unitaire IS NULL OR cout_unitaire >= 0),
  cree_le            timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement_prive (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id)
);
CREATE INDEX evenement_prive_ligne_evenement ON evenement_prive_ligne (lieu_id, evenement_id);
ALTER TABLE evenement_prive_ligne ENABLE ROW LEVEL SECURITY;
CREATE POLICY evenement_prive_ligne_isolement ON evenement_prive_ligne USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON evenement_prive_ligne TO flaix_app;
GRANT UPDATE (libelle, quantite, prix_ttc_centimes, cout_unitaire) ON evenement_prive_ligne TO flaix_app;

CREATE TABLE evenement_prive_frais (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id           uuid NOT NULL,
  evenement_id      uuid NOT NULL,
  libelle           text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 120),
  montant_centimes  integer NOT NULL CHECK (montant_centimes BETWEEN 0 AND 100000000),
  cree_le           timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement_prive (lieu_id, id)
);
ALTER TABLE evenement_prive_frais ENABLE ROW LEVEL SECURITY;
CREATE POLICY evenement_prive_frais_isolement ON evenement_prive_frais USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, DELETE ON evenement_prive_frais TO flaix_app;

-- Lignes et frais d'un événement clôturé : figés.
CREATE FUNCTION evenement_prive_detail_fige() RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
  ev uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.evenement_id ELSE NEW.evenement_id END;
  li uuid := CASE WHEN TG_OP = 'DELETE' THEN OLD.lieu_id ELSE NEW.lieu_id END;
BEGIN
  IF EXISTS (SELECT 1 FROM evenement_prive WHERE lieu_id = li AND id = ev AND etat = 'cloture') THEN
    RAISE EXCEPTION 'Événement privé clôturé : ses consommations et ses frais ne changent plus.';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END
$$;
CREATE TRIGGER evenement_prive_ligne_fige BEFORE INSERT OR UPDATE OR DELETE ON evenement_prive_ligne FOR EACH ROW EXECUTE FUNCTION evenement_prive_detail_fige();
CREATE TRIGGER evenement_prive_frais_fige BEFORE INSERT OR UPDATE OR DELETE ON evenement_prive_frais FOR EACH ROW EXECUTE FUNCTION evenement_prive_detail_fige();

CREATE TABLE facture_vente (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id             uuid NOT NULL REFERENCES lieu (id),
  evenement_prive_id  uuid NOT NULL,
  annee               integer NOT NULL CHECK (annee BETWEEN 2020 AND 2200),
  sequence            integer NOT NULL CHECK (sequence >= 1),
  numero              text NOT NULL,
  contenu             jsonb NOT NULL,
  empreinte           text NOT NULL CHECK (empreinte ~ '^[0-9a-f]{64}$'),
  emise_le            timestamptz NOT NULL,
  emise_par           uuid NOT NULL REFERENCES utilisateur (id),
  UNIQUE (lieu_id, annee, sequence),
  UNIQUE (lieu_id, evenement_prive_id),
  FOREIGN KEY (lieu_id, evenement_prive_id) REFERENCES evenement_prive (lieu_id, id)
);
ALTER TABLE facture_vente ENABLE ROW LEVEL SECURITY;
CREATE POLICY facture_vente_isolement ON facture_vente USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON facture_vente TO flaix_app;
