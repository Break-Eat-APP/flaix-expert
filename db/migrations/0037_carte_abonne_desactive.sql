-- =============================================================================
-- 0037 — Carte wallet d'un abonné désactivé (audit du 2026-10-05, P2-2 ; dossier §15.147).
--
-- Jusqu'ici, le service web d'Apple ignorait les abonnés désactivés : le téléphone n'apprenait jamais la
-- désactivation et gardait une carte d'apparence valable. Désormais il est prévenu et reçoit la carte barrée
-- (« voided »). La page publique de la carte (carte_par_jeton) reste fermée à un abonné désactivé.
-- =============================================================================

CREATE OR REPLACE FUNCTION carte_par_serie(p_serie uuid, p_auth text)
  RETURNS TABLE (lieu_id uuid, abonne_id uuid)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT a.lieu_id, a.id FROM abonne_fidelite a
   WHERE a.id = p_serie AND a.carte_auth IS NOT NULL AND a.carte_auth = p_auth
$$;

CREATE OR REPLACE FUNCTION cartes_appareil(p_appareil text, p_depuis timestamptz)
  RETURNS TABLE (abonne_id uuid, maj_le timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT a.id, a.carte_maj_le FROM wallet_appareil w JOIN abonne_fidelite a ON a.lieu_id = w.lieu_id AND a.id = w.abonne_id
   WHERE w.appareil = p_appareil AND (p_depuis IS NULL OR a.carte_maj_le > p_depuis)
$$;
