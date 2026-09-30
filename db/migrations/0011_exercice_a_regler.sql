-- =============================================================================
-- 0011 — Premier mois de l'exercice : non réglé par défaut (dossier §15.108).
--
-- Rémi (2026-09-30) : « aucune idée encore, ça peut varier pour chacun des lieux ».
-- « Janvier » était une supposition : le réglage devient vide tant que le directeur ne
-- l'a pas saisi, et la clôture d'un exercice est refusée d'ici là. Un lieu qui a déjà
-- clôturé un exercice garde son réglage (il est figé).
-- =============================================================================

ALTER TABLE lieu ALTER COLUMN mois_debut_exercice DROP DEFAULT;
ALTER TABLE lieu ALTER COLUMN mois_debut_exercice DROP NOT NULL;
UPDATE lieu SET mois_debut_exercice = NULL
 WHERE NOT EXISTS (SELECT 1 FROM cloture_periode c WHERE c.lieu_id = lieu.id AND c.niveau = 'exercice');
