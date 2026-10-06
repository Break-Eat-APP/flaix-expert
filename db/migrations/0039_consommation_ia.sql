-- =============================================================================
-- 0039 — Compteur de consommation de l'IA (demande de Rémi du 2026-10-06 ; dossier §15.149).
--
-- Les jetons de chaque question à l'assistant sont déjà tracés (assistant_echange, migration 0029). Il manquait ceux
-- de la reformulation du brief de fin de soirée. Le back-office (Break Eat, qui paie l'IA) lit des totaux par lieu
-- et par période, jamais le texte des questions.
-- =============================================================================

ALTER TABLE brief_soiree ADD COLUMN jetons_entree integer CHECK (jetons_entree IS NULL OR jetons_entree >= 0);
ALTER TABLE brief_soiree ADD COLUMN jetons_sortie integer CHECK (jetons_sortie IS NULL OR jetons_sortie >= 0);

-- Consommation par lieu sur une période : questions, briefs reformulés par l'IA, jetons lus et écrits. Un lieu de
-- formation compte avec son vrai lieu. Réservé aux comptes éditeur.
CREATE FUNCTION consommation_ia(p_debut timestamptz, p_fin timestamptz)
  RETURNS TABLE (lieu_id uuid, nom text, questions integer, briefs integer, jetons_entree bigint, jetons_sortie bigint)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM exiger_editeur_courant();
  RETURN QUERY
  WITH conso AS (
    SELECT coalesce(l.formation_de, l.id) AS lieu, 1 AS q, 0 AS b, coalesce(a.jetons_entree, 0)::bigint AS e, coalesce(a.jetons_sortie, 0)::bigint AS s
      FROM assistant_echange a JOIN lieu l ON l.id = a.lieu_id
     WHERE a.cree_le >= p_debut AND a.cree_le < p_fin
    UNION ALL
    SELECT coalesce(l.formation_de, l.id), 0, 1, coalesce(x.jetons_entree, 0)::bigint, coalesce(x.jetons_sortie, 0)::bigint
      FROM brief_soiree x JOIN lieu l ON l.id = x.lieu_id
     WHERE x.cree_le >= p_debut AND x.cree_le < p_fin AND x.jetons_entree IS NOT NULL
  )
  SELECT l.id, l.nom, sum(c.q)::integer, sum(c.b)::integer, sum(c.e)::bigint, sum(c.s)::bigint
    FROM conso c JOIN lieu l ON l.id = c.lieu
   GROUP BY l.id, l.nom
   ORDER BY sum(c.e) + sum(c.s) DESC, l.nom;
END
$$;
REVOKE ALL ON FUNCTION consommation_ia(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consommation_ia(timestamptz, timestamptz) TO flaix_app;
