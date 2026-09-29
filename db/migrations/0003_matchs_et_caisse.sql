-- =============================================================================
-- 0003 — Matchs (événements), sessions de caisse, journal de caisse chaîné,
-- lignes de ticket. Dossier §15.94 (étape 1 de la version test).
--
-- * Un seul calendrier de matchs pour tout le lieu (le prototype en tenait un
--   par module). État : à venir → ouvert → clos, jamais en arrière.
-- * Journal de caisse : une chaîne PAR CAISSE (§15.12), en écriture seule imposée
--   par la base. Ouverture, vente, annulation, clôture. Un ticket annulé demeure :
--   l'annulation est un nouvel événement qui le référence (§15.2, test A6).
-- * Numéro de justificatif séquentiel par caisse, unique (test A8).
-- =============================================================================

-- Taux de remise contractuel accordé aux abonnés : un réglage du lieu, jamais un
-- choix du caissier (§14 module 1, ajout du 11/09). Vide tant que le directeur ne l'a pas saisi.
ALTER TABLE lieu ADD COLUMN remise_abonne_pb integer CHECK (remise_abonne_pb BETWEEN 1 AND 10000);
GRANT UPDATE (remise_abonne_pb) ON lieu TO flaix_app;

CREATE TABLE evenement (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL REFERENCES lieu (id),
  libelle     text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 120),
  debut       timestamptz NOT NULL,
  spectateurs integer CHECK (spectateurs >= 0 AND spectateurs <= 500000),
  etat        text NOT NULL DEFAULT 'a_venir' CHECK (etat IN ('a_venir', 'ouvert', 'clos')),
  ouvert_le   timestamptz,
  clos_le     timestamptz,
  cree_le     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lieu_id, id)
);
CREATE INDEX evenement_lieu_debut ON evenement (lieu_id, debut DESC);
-- Un seul match ouvert à la fois : chaque ticket sait sans ambiguïté à quel match il appartient.
CREATE UNIQUE INDEX evenement_un_seul_ouvert ON evenement (lieu_id) WHERE etat = 'ouvert';
ALTER TABLE evenement ENABLE ROW LEVEL SECURITY;
CREATE POLICY evenement_isolement ON evenement USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON evenement TO flaix_app;
GRANT UPDATE (libelle, debut, spectateurs, etat, ouvert_le, clos_le) ON evenement TO flaix_app;

-- Le cycle d'un match ne revient jamais en arrière ; un match clos ne change plus
-- (seul le nombre de spectateurs peut être complété après coup, il n'est pas fiscal).
CREATE FUNCTION controler_evenement() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  IF OLD.etat = 'clos' AND (NEW.etat <> 'clos' OR NEW.libelle <> OLD.libelle OR NEW.debut <> OLD.debut) THEN
    RAISE EXCEPTION 'Un match clos ne se modifie plus' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.etat = 'ouvert' AND NEW.etat = 'a_venir' THEN
    RAISE EXCEPTION 'Un match ouvert ne revient pas à « à venir »' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.etat = 'a_venir' AND NEW.etat = 'clos' THEN
    RAISE EXCEPTION 'Un match doit être ouvert avant d''être clos' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER evenement_cycle BEFORE UPDATE ON evenement FOR EACH ROW EXECUTE FUNCTION controler_evenement();

-- Session de caisse : index opérationnel « quelle caisse est ouverte, par qui, sur quel
-- match ». Ce qui fait foi reste le journal chaîné ci-dessous (ouverture / clôture).
CREATE TABLE session_caisse (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id     uuid NOT NULL,
  caisse_id   uuid NOT NULL,
  evenement_id uuid NOT NULL,
  stand_id    uuid NOT NULL,
  ouverte_par uuid NOT NULL REFERENCES utilisateur (id),
  ouverte_le  timestamptz NOT NULL,
  fond_centimes integer CHECK (fond_centimes >= 0),
  fermee_par  uuid REFERENCES utilisateur (id),
  fermee_le   timestamptz,
  UNIQUE (lieu_id, id),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, stand_id) REFERENCES stand (lieu_id, id)
);
-- Une caisse n'a jamais deux sessions ouvertes en même temps.
CREATE UNIQUE INDEX session_caisse_une_ouverte ON session_caisse (caisse_id) WHERE fermee_le IS NULL;
ALTER TABLE session_caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_caisse_isolement ON session_caisse USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON session_caisse TO flaix_app;
GRANT UPDATE (fermee_par, fermee_le) ON session_caisse TO flaix_app;

-- Journal de caisse (écriture seule). Formule de scellement : packages/domain/src/journal-caisse.ts.
CREATE TABLE journal_caisse (
  id                   uuid PRIMARY KEY,           -- fourni par la tablette : un envoi répété ne crée jamais deux ventes
  lieu_id              uuid NOT NULL,
  caisse_id            uuid NOT NULL,
  sequence             bigint NOT NULL CHECK (sequence > 0),
  type                 text NOT NULL CHECK (type IN ('ouverture_caisse', 'vente', 'annulation', 'cloture_caisse')),
  numero_ticket        integer CHECK (numero_ticket > 0),
  numero_justificatif  text,
  horodatage           timestamptz NOT NULL,
  stand_id             uuid NOT NULL,
  evenement_id         uuid NOT NULL,
  session_id           uuid,
  utilisateur_id       uuid NOT NULL REFERENCES utilisateur (id),
  ref_evenement        uuid REFERENCES journal_caisse (id),
  mode_reglement       text CHECK (mode_reglement IN ('especes', 'carte')),
  total_ttc_centimes   integer,
  details              jsonb NOT NULL DEFAULT '{}'::jsonb,
  empreinte_precedente text NOT NULL CHECK (empreinte_precedente ~ '^[0-9a-f]{64}$'),
  empreinte            text NOT NULL CHECK (empreinte ~ '^[0-9a-f]{64}$'),
  UNIQUE (lieu_id, id),
  CONSTRAINT journal_caisse_sequence_unique UNIQUE (caisse_id, sequence),
  CONSTRAINT journal_caisse_ticket_unique UNIQUE (caisse_id, numero_ticket),
  CONSTRAINT journal_caisse_justificatif_unique UNIQUE (lieu_id, numero_justificatif),
  CONSTRAINT journal_caisse_ticket_coherent CHECK (
    (type IN ('vente', 'annulation')) = (numero_ticket IS NOT NULL AND numero_justificatif IS NOT NULL
                                         AND mode_reglement IS NOT NULL AND total_ttc_centimes IS NOT NULL)
  ),
  CONSTRAINT journal_caisse_signe CHECK (
    (type <> 'vente' OR total_ttc_centimes >= 0) AND (type <> 'annulation' OR total_ttc_centimes <= 0)
  ),
  CONSTRAINT journal_caisse_annulation_ref CHECK ((type = 'annulation') = (ref_evenement IS NOT NULL)),
  FOREIGN KEY (lieu_id, caisse_id) REFERENCES caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, evenement_id) REFERENCES evenement (lieu_id, id),
  FOREIGN KEY (lieu_id, session_id) REFERENCES session_caisse (lieu_id, id)
);
-- Un ticket ne s'annule qu'une fois.
CREATE UNIQUE INDEX journal_caisse_une_annulation ON journal_caisse (ref_evenement) WHERE type = 'annulation';
CREATE INDEX journal_caisse_evenement ON journal_caisse (lieu_id, evenement_id, horodatage);
ALTER TABLE journal_caisse ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_caisse_isolement ON journal_caisse USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON journal_caisse TO flaix_app;
CREATE TRIGGER journal_caisse_ecriture_seule BEFORE UPDATE OR DELETE ON journal_caisse
  FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER journal_caisse_pas_de_vidage BEFORE TRUNCATE ON journal_caisse
  FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();

-- Lignes de ticket : copie interrogeable du détail déjà scellé dans journal_caisse.details
-- (sert aux ventes par produit, au stock, aux marges). Écriture seule également.
CREATE TABLE ligne_ticket (
  lieu_id          uuid NOT NULL,
  journal_id       uuid NOT NULL,
  rang             integer NOT NULL CHECK (rang > 0),
  produit_id       uuid NOT NULL,
  libelle          text NOT NULL,
  quantite         integer NOT NULL CHECK (quantite <> 0),
  prix_unitaire_centimes integer NOT NULL CHECK (prix_unitaire_centimes >= 0),
  taux_tva_pb      integer NOT NULL CHECK (taux_tva_pb IN (210, 550, 1000, 2000)),
  brut_centimes    integer NOT NULL,
  remise_centimes  integer NOT NULL,
  offert_centimes  integer NOT NULL,
  net_ttc_centimes integer NOT NULL,
  ht_centimes      integer NOT NULL,
  tva_centimes     integer NOT NULL,
  PRIMARY KEY (journal_id, rang),
  FOREIGN KEY (lieu_id, journal_id) REFERENCES journal_caisse (lieu_id, id),
  FOREIGN KEY (lieu_id, produit_id) REFERENCES produit (lieu_id, id),
  CHECK (ht_centimes + tva_centimes = net_ttc_centimes),
  CHECK (brut_centimes - remise_centimes - offert_centimes = net_ttc_centimes)
);
CREATE INDEX ligne_ticket_produit ON ligne_ticket (lieu_id, produit_id);
ALTER TABLE ligne_ticket ENABLE ROW LEVEL SECURITY;
CREATE POLICY ligne_ticket_isolement ON ligne_ticket USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON ligne_ticket TO flaix_app;
CREATE TRIGGER ligne_ticket_ecriture_seule BEFORE UPDATE OR DELETE ON ligne_ticket
  FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER ligne_ticket_pas_de_vidage BEFORE TRUNCATE ON ligne_ticket
  FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
