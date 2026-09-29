-- =============================================================================
-- 0001 — Socle : lieux, comptes, sessions, journal technique chaîné.
--
-- Principes (docs/decisions-architecture-production.md § 4) :
-- * Deux rôles PostgreSQL. `flaix_owner` possède les tables et applique les
--   migrations ; `flaix_app` est le seul compte utilisé par le serveur. Ses
--   droits sont donnés table par table et colonne par colonne : ce que le
--   serveur n'a pas le droit de faire, la base le refuse, même en cas de bogue
--   ou d'intrusion dans l'application (dossier §15.2 : « un ORM ne protège de
--   rien si la connexion a les droits »).
-- * Isolement des lieux : chaque table métier porte `lieu_id` et une politique
--   de sécurité par ligne (RLS) qui ne laisse voir que le lieu de la requête en
--   cours. Deuxième barrière, indépendante du code applicatif (§15.12).
-- * Journaux en écriture seule : ni UPDATE ni DELETE accordés, et un déclencheur
--   refuse toute modification même au propriétaire des tables (§15.2).
-- * Rien n'est supprimé : les entités se désactivent.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'flaix_app') THEN
    CREATE ROLE flaix_app NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO flaix_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Contexte de la requête en cours, posé par le serveur au début de chaque transaction.
CREATE FUNCTION lieu_courant() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.lieu_id', true), '')::uuid $$;

CREATE FUNCTION utilisateur_courant() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.utilisateur_id', true), '')::uuid $$;

-- Refuse toute modification d'une table en écriture seule, quel que soit le rôle.
CREATE FUNCTION refuser_modification() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  RAISE EXCEPTION 'La table % est en écriture seule : % refusé', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;

-- -----------------------------------------------------------------------------
-- Lieu = un exploitant = un assujetti à la TVA (§15.12). Créé par l'éditeur
-- (Break Eat), jamais par le serveur de l'application : flaix_app n'a pas INSERT.
-- -----------------------------------------------------------------------------
CREATE TABLE lieu (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom            text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 120),
  raison_sociale text CHECK (length(raison_sociale) <= 200),
  siret          text CHECK (siret ~ '^[0-9]{14}$'),
  tva_intracom   text CHECK (tva_intracom ~ '^[A-Z]{2}[0-9A-Z]{2,13}$'),
  adresse        text CHECK (length(adresse) <= 300),
  code_postal    text CHECK (length(code_postal) <= 10),
  ville          text CHECK (length(ville) <= 120),
  cree_le        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lieu ENABLE ROW LEVEL SECURITY;
CREATE POLICY lieu_isolement ON lieu
  USING (id = lieu_courant())
  WITH CHECK (id = lieu_courant());
GRANT SELECT ON lieu TO flaix_app;
GRANT UPDATE (nom, raison_sociale, siret, tva_intracom, adresse, code_postal, ville) ON lieu TO flaix_app;

-- -----------------------------------------------------------------------------
-- Comptes. Un compte est une personne ; ses droits sur un lieu sont portés par
-- `membre`. Le mot de passe n'est jamais stocké, seulement son empreinte argon2id.
-- -----------------------------------------------------------------------------
CREATE TABLE utilisateur (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nom               text NOT NULL CHECK (length(btrim(nom)) BETWEEN 1 AND 120),
  mot_de_passe_hash text NOT NULL,
  actif             boolean NOT NULL DEFAULT true,
  cree_le           timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX utilisateur_email_unique ON utilisateur (lower(email));
GRANT SELECT ON utilisateur TO flaix_app;
GRANT UPDATE (mot_de_passe_hash) ON utilisateur TO flaix_app;

CREATE TABLE membre (
  lieu_id        uuid NOT NULL REFERENCES lieu (id),
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id),
  role           text NOT NULL CHECK (role IN ('directeur', 'operateur', 'verificateur')),
  actif          boolean NOT NULL DEFAULT true,
  cree_le        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, utilisateur_id)
);
ALTER TABLE membre ENABLE ROW LEVEL SECURITY;
-- Visible depuis son lieu, ou par la personne elle-même (choix du lieu à la connexion).
CREATE POLICY membre_isolement ON membre
  USING (lieu_id = lieu_courant() OR utilisateur_id = utilisateur_courant());
GRANT SELECT ON membre TO flaix_app;

-- Sessions : seul le condensat SHA-256 du jeton est stocké ; le jeton lui-même
-- ne vit que dans le cookie du navigateur.
CREATE TABLE session (
  jeton_hash     text PRIMARY KEY CHECK (jeton_hash ~ '^[0-9a-f]{64}$'),
  utilisateur_id uuid NOT NULL REFERENCES utilisateur (id),
  lieu_id        uuid NOT NULL REFERENCES lieu (id),
  role           text NOT NULL CHECK (role IN ('directeur', 'operateur', 'verificateur')),
  cree_le        timestamptz NOT NULL DEFAULT now(),
  expire_le      timestamptz NOT NULL,
  revoquee_le    timestamptz
);
CREATE INDEX session_utilisateur ON session (utilisateur_id);
GRANT SELECT, INSERT ON session TO flaix_app;
GRANT UPDATE (revoquee_le) ON session TO flaix_app;

-- Un compte n'est visible que par lui-même et depuis les lieux dont il est membre :
-- un directeur ne peut pas lire les comptes (e-mails, empreintes) d'un autre lieu.
ALTER TABLE utilisateur ENABLE ROW LEVEL SECURITY;
CREATE POLICY utilisateur_visibilite ON utilisateur
  USING (
    id = utilisateur_courant()
    OR EXISTS (SELECT 1 FROM membre m WHERE m.utilisateur_id = utilisateur.id AND m.lieu_id = lieu_courant())
  );

-- Les deux seules lectures faites avant de connaître le lieu : retrouver un compte par
-- son e-mail (connexion) et une session par l'empreinte de son jeton. Fonctions
-- exécutées avec les droits du propriétaire, ne renvoyant que le strict nécessaire.
CREATE FUNCTION compte_pour_connexion(p_email text)
  RETURNS TABLE (id uuid, nom text, email text, mot_de_passe_hash text, actif boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id, nom, email, mot_de_passe_hash, actif FROM utilisateur WHERE lower(email) = lower(btrim(p_email)) $$;

CREATE FUNCTION session_valide(p_jeton_hash text)
  RETURNS TABLE (utilisateur_id uuid, lieu_id uuid, role text, nom text, email text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT s.utilisateur_id, s.lieu_id, s.role, u.nom, u.email
    FROM session s
    JOIN utilisateur u ON u.id = s.utilisateur_id
    JOIN membre m ON m.utilisateur_id = s.utilisateur_id AND m.lieu_id = s.lieu_id
   WHERE s.jeton_hash = p_jeton_hash
     AND s.revoquee_le IS NULL
     AND s.expire_le > now()
     AND u.actif
     AND m.actif
$$;

REVOKE ALL ON FUNCTION compte_pour_connexion(text), session_valide(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION compte_pour_connexion(text), session_valide(text) TO flaix_app;

-- -----------------------------------------------------------------------------
-- Journal des événements techniques (JET, §15.3) — une chaîne par lieu.
-- empreinte = SHA256(numero|horodatage|type|lieu|stand|caisse|utilisateur|details|empreinte_precedente)
-- (formule : packages/domain/src/journal-technique.ts). Numérotation continue
-- par lieu, sans trou : contrainte d'unicité + attribution sous verrou par le serveur.
-- -----------------------------------------------------------------------------
CREATE TABLE journal_technique (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id              uuid NOT NULL REFERENCES lieu (id),
  numero               bigint NOT NULL CHECK (numero > 0),
  horodatage           timestamptz NOT NULL,
  type                 text NOT NULL CHECK (type ~ '^[a-z_]{3,60}$'),
  stand_id             uuid,
  caisse_id            uuid,
  utilisateur_id       uuid REFERENCES utilisateur (id),
  details              jsonb NOT NULL DEFAULT '{}'::jsonb,
  empreinte_precedente text NOT NULL CHECK (empreinte_precedente ~ '^[0-9a-f]{64}$'),
  empreinte            text NOT NULL CHECK (empreinte ~ '^[0-9a-f]{64}$'),
  CONSTRAINT journal_technique_numero_unique UNIQUE (lieu_id, numero),
  CONSTRAINT journal_technique_empreinte_unique UNIQUE (lieu_id, empreinte)
);
ALTER TABLE journal_technique ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_technique_isolement ON journal_technique
  USING (lieu_id = lieu_courant())
  WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON journal_technique TO flaix_app;
CREATE TRIGGER journal_technique_ecriture_seule
  BEFORE UPDATE OR DELETE ON journal_technique
  FOR EACH ROW EXECUTE FUNCTION refuser_modification();
CREATE TRIGGER journal_technique_pas_de_vidage
  BEFORE TRUNCATE ON journal_technique
  FOR EACH STATEMENT EXECUTE FUNCTION refuser_modification();
