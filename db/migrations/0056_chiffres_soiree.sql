-- =============================================================================
-- 0056 — Les chiffres de la soirée (dossier §15.171, demande de Rémi du 2026-10-21).
--
-- * Famille d'une catégorie (boisson, nourriture, autre) pour la part boissons / nourriture du CA et de la marge.
--   Vide : FlaiX Expert la devine d'après le nom (« Bières » → boisson, « Snacking » → nourriture).
-- * Click & Collect de l'application Break Eat : un nouveau système de caisse connectée, « breakeat ». Ses ventes,
--   importées par fichier comme celles de L'Addition, sont comptées à part dans Résultats (part du CA, des tickets,
--   des spectateurs, panier comparé au comptoir).
-- =============================================================================

ALTER TABLE categorie ADD COLUMN famille text CHECK (famille IN ('boisson', 'nourriture', 'autre'));
GRANT UPDATE (famille) ON categorie TO flaix_app;

ALTER TABLE caisse_externe DROP CONSTRAINT caisse_externe_systeme_check;
ALTER TABLE caisse_externe ADD CONSTRAINT caisse_externe_systeme_check CHECK (systeme IN ('digifood', 'weezevent', 'laddition', 'breakeat', 'autre'));
