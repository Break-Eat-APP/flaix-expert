-- 0030 — Temps de prise de commande, par caisse et par stand (décision de Rémi du 2026-10-04, dossier §15.139).
--
-- La tablette note l'heure du premier produit tapé de chaque vente. Cette heure n'entre PAS dans le ticket
-- scellé (le journal de caisse ne change pas) : c'est une mesure d'exploitation, rangée ici, rattachée au
-- ticket. Aucune donnée par caissière n'en est tirée (choix de Rémi) : seulement des chiffres par caisse et
-- par stand. Écriture seule : une mesure reçue ne se corrige pas.

CREATE TABLE mesure_ticket (
  lieu_id      uuid NOT NULL REFERENCES lieu (id),
  journal_id   uuid NOT NULL,
  caisse_id    uuid NOT NULL,
  debut_saisie timestamptz NOT NULL,
  encaisse_le  timestamptz NOT NULL,
  PRIMARY KEY (lieu_id, journal_id),
  FOREIGN KEY (lieu_id, journal_id) REFERENCES journal_caisse (lieu_id, id),
  CHECK (debut_saisie <= encaisse_le)
);
CREATE INDEX mesure_ticket_caisse ON mesure_ticket (lieu_id, caisse_id, encaisse_le);
ALTER TABLE mesure_ticket ENABLE ROW LEVEL SECURITY;
CREATE POLICY mesure_ticket_isolement ON mesure_ticket USING (lieu_id = lieu_courant()) WITH CHECK (lieu_id = lieu_courant());
GRANT SELECT, INSERT ON mesure_ticket TO flaix_app;
CREATE TRIGGER mesure_ticket_ecriture_seule BEFORE UPDATE OR DELETE ON mesure_ticket FOR EACH ROW EXECUTE FUNCTION refuser_modification();
