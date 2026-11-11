-- =============================================================================
-- 0060 — Durcissements de l'audit Codex du 2026-10-26 (§15.177).
--
-- P2-1 : l'annulation d'un import de caisse connectée inscrivait comme auteur l'utilisateur passé en paramètre ; le rôle
-- de l'application pouvait donc signer au nom d'un autre. L'auteur est désormais celui de la session
-- (`utilisateur_courant()`), et la fonction refuse de s'exécuter sans session.
--
-- P2-2 : le relanceur des cartes wallet lisait les relances dues sans les réserver : deux serveurs, ou deux passages qui
-- se chevauchent, pouvaient prévenir Apple ou Google deux fois pour la même carte. Les relances dues sont maintenant
-- « prises » d'un seul coup (verrou qui saute les lignes déjà prises) : leur prochain essai est repoussé d'une heure,
-- le temps de les traiter. Réussie, la relance est effacée ; en échec, son prochain essai est recalculé ; si le serveur
-- s'arrête en route, elle redevient due une heure plus tard.
-- =============================================================================

DROP FUNCTION annuler_import_ventes_externes(uuid, uuid);

/*
 * Annule un import du lieu courant au nom de l'utilisateur de la session : retire ses ventes et leurs articles, garde le
 * relevé de l'import et inscrit l'annulation. Une seule fois par import.
 */
CREATE FUNCTION annuler_import_ventes_externes(p_import uuid) RETURNS TABLE (ventes integer, montant bigint)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_lieu uuid := lieu_courant();
  v_par uuid := utilisateur_courant();
  v_ventes integer;
  v_montant bigint;
BEGIN
  IF v_par IS NULL THEN
    RAISE EXCEPTION 'Annulation d''un import sans utilisateur connecté' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM import_ventes_externes WHERE lieu_id = v_lieu AND id = p_import) THEN
    RAISE EXCEPTION 'Import introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  IF EXISTS (SELECT 1 FROM import_ventes_externes_annule WHERE import_id = p_import) THEN
    RAISE EXCEPTION 'Cet import est déjà annulé' USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::int, coalesce(sum(total_centimes), 0) INTO v_ventes, v_montant
    FROM vente_externe WHERE lieu_id = v_lieu AND import_id = p_import AND NOT annulee;
  PERFORM set_config('flaix.annulation_import', p_import::text, true);
  DELETE FROM ligne_vente_externe l USING vente_externe v
   WHERE l.lieu_id = v_lieu AND v.lieu_id = l.lieu_id AND v.caisse_externe_id = l.caisse_externe_id AND v.id_externe = l.id_externe AND v.import_id = p_import;
  DELETE FROM vente_externe WHERE lieu_id = v_lieu AND import_id = p_import;
  PERFORM set_config('flaix.annulation_import', '', true);
  INSERT INTO import_ventes_externes_annule (import_id, lieu_id, par, ventes, montant_centimes) VALUES (p_import, v_lieu, v_par, v_ventes, v_montant);
  RETURN QUERY SELECT v_ventes, v_montant;
END
$$;
REVOKE ALL ON FUNCTION annuler_import_ventes_externes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION annuler_import_ventes_externes(uuid) TO flaix_app;

DROP FUNCTION relances_wallet_dues(integer);

-- Le relanceur passe sur tous les lieux : il prend les relances dues (lieu et cible), rien d'autre.
CREATE FUNCTION prendre_relances_wallet(p_max integer)
  RETURNS TABLE (lieu_id uuid, cible text)
  LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS
$$
  UPDATE wallet_relance r SET prochain_essai = now() + interval '1 hour'
    FROM (SELECT d.lieu_id, d.cible FROM wallet_relance d WHERE d.prochain_essai <= now()
           ORDER BY d.prochain_essai LIMIT least(greatest(p_max, 1), 1000) FOR UPDATE SKIP LOCKED) dues
   WHERE r.lieu_id = dues.lieu_id AND r.cible = dues.cible
  RETURNING r.lieu_id, r.cible
$$;
REVOKE ALL ON FUNCTION prendre_relances_wallet(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prendre_relances_wallet(integer) TO flaix_app;
