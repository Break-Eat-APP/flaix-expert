-- =============================================================================
-- 0038 — Cartes wallet à renvoyer (audit Codex du 2026-10-05, P2 ; dossier §15.147).
--
-- Quand Apple ou Google ne répond pas (panne, délai dépassé, erreur 5xx ou 429), la carte d'un abonné (ou le
-- modèle de carte du lieu, « classe ») serait restée périmée jusqu'au prochain changement. Elle est notée ici et
-- renvoyée plus tard par le serveur, avec un délai croissant ; abandonnée (et journalisée) après 12 essais.
-- =============================================================================

CREATE TABLE wallet_relance (
  lieu_id        uuid NOT NULL REFERENCES lieu (id),
  -- L'abonné (son identifiant) ou « classe » pour le modèle de carte Google du lieu.
  cible          text NOT NULL CHECK (cible = 'classe' OR cible ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  essais         integer NOT NULL CHECK (essais BETWEEN 1 AND 100),
  prochain_essai timestamptz NOT NULL,
  cause          text NOT NULL CHECK (length(cause) BETWEEN 1 AND 200),
  depuis         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lieu_id, cible)
);
ALTER TABLE wallet_relance ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallet_relance_isolement ON wallet_relance USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT, UPDATE, DELETE ON wallet_relance TO flaix_app;

-- Le relanceur passe sur tous les lieux : il ne voit que les relances dues (lieu et cible), rien d'autre.
CREATE FUNCTION relances_wallet_dues(p_max integer)
  RETURNS TABLE (lieu_id uuid, cible text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT r.lieu_id, r.cible FROM wallet_relance r WHERE r.prochain_essai <= now() ORDER BY r.prochain_essai LIMIT least(greatest(p_max, 1), 1000)
$$;
REVOKE ALL ON FUNCTION relances_wallet_dues(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION relances_wallet_dues(integer) TO flaix_app;
