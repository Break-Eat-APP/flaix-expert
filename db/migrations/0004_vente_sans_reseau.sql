-- =============================================================================
-- 0004 — Vente sans réseau (dossier §15.97).
--
-- * Pendant une session, la tablette scelle elle-même les tickets de sa caisse
--   (même formule, packages/domain) ; le serveur les vérifie avant de les inscrire.
-- * Une caisse ouverte appartient à un seul appareil : le serveur garde l'empreinte
--   SHA-256 du jeton remis à cet appareil, jamais le jeton lui-même.
-- * À côté de chaque ticket : l'heure à laquelle le serveur l'a reçu, et les
--   contrôles signalés sans refus (écart de tarif, réception tardive, heure incohérente).
--   Colonnes ajoutées sans valeur par défaut : aucune ligne existante n'est réécrite.
-- =============================================================================

ALTER TABLE session_caisse ADD COLUMN appareil_jeton_empreinte text CHECK (appareil_jeton_empreinte ~ '^[0-9a-f]{64}$');
-- Seule la reprise sur un autre appareil remplace le jeton.
GRANT UPDATE (appareil_jeton_empreinte) ON session_caisse TO flaix_app;

-- Heure de réception par le serveur. Vide pour les tickets inscrits avant cette migration,
-- que le serveur recevait à l'instant même de la vente.
ALTER TABLE journal_caisse ADD COLUMN recu_le timestamptz;
-- Contrôles faits à la réception, qui ne refusent pas la vente (l'argent est encaissé).
ALTER TABLE journal_caisse ADD COLUMN controle jsonb;
