-- Exécuté une seule fois, à la création du volume de développement.
-- Base séparée pour les tests automatisés : ils ne touchent jamais la base de développement.
CREATE DATABASE flaix_test OWNER flaix_owner;
