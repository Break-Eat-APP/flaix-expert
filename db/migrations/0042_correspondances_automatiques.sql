-- =============================================================================
-- 0042 — Correspondances automatiques des caisses connectées (dossier §15.152).
--
-- Un produit (ou un point de vente) de la caisse qui porte le même nom qu'un seul produit (ou stand) de FlaiX Expert,
-- aux majuscules, accents et espaces près, est relié sans demander : la correspondance est marquée « automatique »
-- pour que le directeur la voie et puisse la changer. Une correspondance choisie à la main ne l'est pas.
-- =============================================================================

ALTER TABLE correspondance_produit_externe ADD COLUMN automatique boolean NOT NULL DEFAULT false;
ALTER TABLE correspondance_point_de_vente ADD COLUMN automatique boolean NOT NULL DEFAULT false;
