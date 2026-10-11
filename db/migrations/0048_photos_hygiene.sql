-- =============================================================================
-- 0048 — Photos d'étiquettes jointes aux contrôles à réception (dossier §15.159, demande de Rémi du 2026-10-11).
--
-- Traçabilité : la photo de l'étiquette (lot, date limite, estampille sanitaire) prise au téléphone ou à la tablette
-- au moment de la livraison. Réduite avant l'envoi (JPEG, 1 600 px au plus) ; en écriture seule comme le registre.
-- =============================================================================

CREATE TABLE hygiene_photo (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lieu_id       uuid NOT NULL REFERENCES lieu (id),
  reception_id  uuid NOT NULL REFERENCES hygiene_reception (id),
  contenu       bytea NOT NULL CHECK (octet_length(contenu) BETWEEN 100 AND 2000000),
  saisi_par     uuid NOT NULL REFERENCES utilisateur (id),
  saisi_le      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hygiene_photo_reception ON hygiene_photo (lieu_id, reception_id);
ALTER TABLE hygiene_photo ENABLE ROW LEVEL SECURITY;
CREATE POLICY hygiene_photo_isolement ON hygiene_photo USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON hygiene_photo TO flaix_app;
