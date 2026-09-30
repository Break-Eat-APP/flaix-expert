-- =============================================================================
-- 0013 — Export pour l'expert-comptable : plan de comptes du lieu (dossier §15.110).
--
-- Numéros de comptes et code journal utilisés dans le journal des ventes exporté.
-- Vide = valeurs par défaut proposées (packages/domain/src/export-comptable.ts), à faire
-- valider par l'expert-comptable du lieu (docs/questions-expert-comptable.md, G.20).
-- =============================================================================

ALTER TABLE lieu ADD COLUMN plan_comptes jsonb CHECK (plan_comptes IS NULL OR jsonb_typeof(plan_comptes) = 'object');
GRANT UPDATE (plan_comptes) ON lieu TO flaix_app;

-- Réglages du lieu recopiés dans son lieu de formation (§15.109) : fonction à part, à compléter
-- à chaque nouveau réglage du lieu, sans avoir à redéfinir toute la recopie.
CREATE FUNCTION synchroniser_reglages_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE lieu f
     SET nom = r.nom, raison_sociale = r.raison_sociale, siret = r.siret, tva_intracom = r.tva_intracom,
         adresse = r.adresse, code_postal = r.code_postal, ville = r.ville, remise_abonne_pb = r.remise_abonne_pb,
         seuil_ecart_especes_centimes = r.seuil_ecart_especes_centimes, plan_comptes = r.plan_comptes,
         -- Figé une fois un exercice clôturé, en formation comme ailleurs.
         mois_debut_exercice = CASE
           WHEN EXISTS (SELECT 1 FROM cloture_periode c WHERE c.lieu_id = f.id AND c.niveau = 'exercice') THEN f.mois_debut_exercice
           ELSE r.mois_debut_exercice END
    FROM lieu r
   WHERE r.id = p_reel AND f.id = p_form;
END
$$;
REVOKE ALL ON FUNCTION synchroniser_reglages_formation(uuid, uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION synchroniser_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  PERFORM synchroniser_reglages_formation(p_reel, p_form);

  -- Directeurs et caissières du vrai lieu ; jamais un vérificateur.
  INSERT INTO membre (lieu_id, utilisateur_id, role, actif)
  SELECT p_form, m.utilisateur_id, m.role, m.actif FROM membre m WHERE m.lieu_id = p_reel AND m.role IN ('directeur', 'operateur')
  ON CONFLICT (lieu_id, utilisateur_id) DO UPDATE SET role = EXCLUDED.role, actif = EXCLUDED.actif;

  UPDATE stand f SET nom = r.nom, point_retrait_cc = r.point_retrait_cc, actif = r.actif
    FROM stand r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO stand (lieu_id, nom, point_retrait_cc, actif, origine_id)
  SELECT p_form, r.nom, r.point_retrait_cc, r.actif, r.id FROM stand r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM stand f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE caisse f SET stand_id = fs.id, nom = r.nom, especes_autorisees = r.especes_autorisees, actif = r.actif
    FROM caisse r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO caisse (lieu_id, stand_id, numero, nom, especes_autorisees, actif, origine_id)
  SELECT p_form, fs.id, r.numero, r.nom, r.especes_autorisees, r.actif, r.id
    FROM caisse r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM caisse f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE categorie f SET nom = r.nom, actif = r.actif
    FROM categorie r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO categorie (lieu_id, nom, actif, origine_id)
  SELECT p_form, r.nom, r.actif, r.id FROM categorie r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM categorie f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE produit f SET nom = r.nom, categorie_id = fc.id, cout_matiere_centimes = r.cout_matiere_centimes, actif = r.actif
    FROM produit r LEFT JOIN categorie fc ON fc.lieu_id = p_form AND fc.origine_id = r.categorie_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO produit (lieu_id, nom, categorie_id, cout_matiere_centimes, actif, origine_id)
  SELECT p_form, r.nom, fc.id, r.cout_matiere_centimes, r.actif, r.id
    FROM produit r LEFT JOIN categorie fc ON fc.lieu_id = p_form AND fc.origine_id = r.categorie_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM produit f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  DELETE FROM produit_stand ps
   WHERE ps.lieu_id = p_form
     AND NOT EXISTS (
       SELECT 1 FROM produit_stand r
         JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
         JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
        WHERE r.lieu_id = p_reel AND fp.id = ps.produit_id AND fs.id = ps.stand_id);
  INSERT INTO produit_stand (lieu_id, produit_id, stand_id)
  SELECT p_form, fp.id, fs.id FROM produit_stand r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel
  ON CONFLICT DO NOTHING;

  INSERT INTO produit_tarif (lieu_id, produit_id, prix_ttc_centimes, taux_tva_pb, valide_du, saisi_par, saisi_le, origine_id)
  SELECT p_form, fp.id, r.prix_ttc_centimes, r.taux_tva_pb, r.valide_du, r.saisi_par, r.saisi_le, r.id
    FROM produit_tarif r JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM produit_tarif f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  UPDATE employe f
     SET nom = r.nom, statut = r.statut, agence = r.agence, role = r.role, taux_horaire_centimes = r.taux_horaire_centimes,
         utilisateur_id = r.utilisateur_id, actif = r.actif
    FROM employe r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO employe (lieu_id, nom, statut, agence, role, taux_horaire_centimes, utilisateur_id, actif, origine_id)
  SELECT p_form, r.nom, r.statut, r.agence, r.role, r.taux_horaire_centimes, r.utilisateur_id, r.actif, r.id FROM employe r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM employe f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
END
$$;
