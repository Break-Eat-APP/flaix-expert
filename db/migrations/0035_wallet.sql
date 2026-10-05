-- =============================================================================
-- 0035 — Carte abonné dans Apple Wallet et Google Wallet (dossier §14 module 20, §15.147).
--
-- Chaque abonné peut recevoir un lien personnel (/carte/<jeton>) ; le jeton est renouvelable par le directeur,
-- ce qui invalide l'ancien lien. La carte Apple porte un « jeton d'authentification » propre, exigé par le
-- service web PassKit pour la mettre à jour. Les pages publiques (sans session) ne lisent la base qu'au
-- travers des fonctions ci-dessous, qui ne rendent qu'un identifiant de lieu et d'abonné.
-- =============================================================================

ALTER TABLE lieu ADD COLUMN carte_couleur text CHECK (carte_couleur IS NULL OR carte_couleur ~ '^#[0-9a-f]{6}$');
GRANT UPDATE (carte_couleur) ON lieu TO flaix_app;

ALTER TABLE abonne_fidelite ADD COLUMN carte_jeton text CHECK (carte_jeton IS NULL OR carte_jeton ~ '^[A-Za-z0-9_-]{40,64}$');
ALTER TABLE abonne_fidelite ADD COLUMN carte_auth text CHECK (carte_auth IS NULL OR carte_auth ~ '^[A-Za-z0-9_-]{32,64}$');
-- Dernière modification de ce que montre la carte (points, nom) : sert aux mises à jour à distance.
ALTER TABLE abonne_fidelite ADD COLUMN carte_maj_le timestamptz;
CREATE UNIQUE INDEX abonne_carte_jeton ON abonne_fidelite (carte_jeton) WHERE carte_jeton IS NOT NULL;
GRANT UPDATE (carte_jeton, carte_auth, carte_maj_le) ON abonne_fidelite TO flaix_app;

-- Téléphones Apple inscrits pour recevoir les mises à jour d'une carte (service web PassKit).
CREATE TABLE wallet_appareil (
  lieu_id    uuid NOT NULL REFERENCES lieu (id),
  abonne_id  uuid NOT NULL,
  appareil   text NOT NULL CHECK (length(appareil) BETWEEN 1 AND 200),
  push_token text NOT NULL CHECK (length(push_token) BETWEEN 1 AND 300),
  inscrit_le timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (abonne_id, appareil),
  FOREIGN KEY (lieu_id, abonne_id) REFERENCES abonne_fidelite (lieu_id, id)
);
ALTER TABLE wallet_appareil ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_appareil_isolement ON wallet_appareil USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON wallet_appareil TO flaix_app;

-- Page publique de la carte : le jeton du lien donne le lieu et l'abonné (abonné actif, lieu réel).
CREATE FUNCTION carte_par_jeton(p_jeton text)
  RETURNS TABLE (lieu_id uuid, abonne_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT a.lieu_id, a.id FROM abonne_fidelite a JOIN lieu l ON l.id = a.lieu_id
   WHERE p_jeton ~ '^[A-Za-z0-9_-]{40,64}$' AND a.carte_jeton = p_jeton AND a.actif AND l.formation_de IS NULL
$$;

-- Service web PassKit : le numéro de série (l'abonné) et le jeton d'authentification de la carte.
CREATE FUNCTION carte_par_serie(p_serie uuid, p_auth text)
  RETURNS TABLE (lieu_id uuid, abonne_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT a.lieu_id, a.id FROM abonne_fidelite a
   WHERE a.id = p_serie AND a.carte_auth IS NOT NULL AND a.carte_auth = p_auth AND a.actif
$$;

-- Service web PassKit : les cartes inscrites sur un téléphone, modifiées depuis une date (tous lieux).
CREATE FUNCTION cartes_appareil(p_appareil text, p_depuis timestamptz)
  RETURNS TABLE (abonne_id uuid, maj_le timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT a.id, a.carte_maj_le FROM wallet_appareil w JOIN abonne_fidelite a ON a.lieu_id = w.lieu_id AND a.id = w.abonne_id
   WHERE w.appareil = p_appareil AND a.actif AND (p_depuis IS NULL OR a.carte_maj_le > p_depuis)
$$;

REVOKE ALL ON FUNCTION carte_par_jeton(text), carte_par_serie(uuid, text), cartes_appareil(text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION carte_par_jeton(text), carte_par_serie(uuid, text), cartes_appareil(text, timestamptz) TO flaix_app;
