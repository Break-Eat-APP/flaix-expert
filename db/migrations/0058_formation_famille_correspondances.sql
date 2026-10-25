-- =============================================================================
-- 0058 — Mode formation : la famille des catégories (0056) et les correspondances fournisseurs (0057) sont de la
-- configuration ; elles se recopient dans le lieu de formation comme le reste (règle n° 6 du guide de reprise, oubliée
-- aux §15.171 et §15.173, relevée par l'audit du 2026-10-25, §15.175). Reprise de la version 0052 de la fonction, plus
-- ces deux copies.
-- =============================================================================

CREATE OR REPLACE FUNCTION synchroniser_complements_formation(p_reel uuid, p_form uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
BEGIN
  UPDATE produit f SET prix_app_centimes = r.prix_app_centimes, mode_stock_cc = r.mode_stock_cc, cible_marge_pb = r.cible_marge_pb, allergenes = r.allergenes
    FROM produit r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  -- Famille de la catégorie (boisson, nourriture, autre), §15.171.
  UPDATE categorie f SET cible_marge_pb = r.cible_marge_pb, famille = r.famille
    FROM categorie r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  UPDATE lieu f SET cible_marge_nette_pb = r.cible_marge_nette_pb, plan_modele = r.plan_modele FROM lieu r WHERE f.id = p_form AND r.id = p_reel;

  UPDATE poste_depense f SET nom = r.nom, actif = r.actif, mode_habituel = r.mode_habituel, valeur_habituelle = r.valeur_habituelle
    FROM poste_depense r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO poste_depense (lieu_id, nom, actif, cle, mode_habituel, valeur_habituelle, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.actif, r.cle, r.mode_habituel, r.valeur_habituelle, r.id, r.cree_par, r.cree_le FROM poste_depense r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM poste_depense f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  -- Mes frais (§15.154) : frais mensuels du lieu, leurs montants datés, les frais déclarés « pas concerné ».
  UPDATE frais_mensuel f SET nom = r.nom
    FROM frais_mensuel r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO frais_mensuel (lieu_id, nom, cle, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.cle, r.id, r.cree_par, r.cree_le FROM frais_mensuel r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM frais_mensuel f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  DELETE FROM frais_mensuel_montant WHERE lieu_id = p_form;
  INSERT INTO frais_mensuel_montant (lieu_id, frais_id, a_partir_de, montant_centimes, saisi_par, saisi_le)
  SELECT p_form, ff.id, r.a_partir_de, r.montant_centimes, r.saisi_par, r.saisi_le
    FROM frais_mensuel_montant r JOIN frais_mensuel ff ON ff.lieu_id = p_form AND ff.origine_id = r.frais_id
   WHERE r.lieu_id = p_reel;
  DELETE FROM frais_pas_concerne WHERE lieu_id = p_form;
  INSERT INTO frais_pas_concerne (lieu_id, cle, saisi_par, saisi_le)
  SELECT p_form, r.cle, r.saisi_par, r.saisi_le FROM frais_pas_concerne r WHERE r.lieu_id = p_reel;

  -- Tribune de chaque stand sur le stade en direct (§15.162).
  UPDATE stand f SET tribune = r.tribune, plan_x = r.plan_x, plan_z = r.plan_z
    FROM stand r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

  -- Fond de caisse prévu par le directeur (§15.130).
  UPDATE caisse f SET fond_prevu_centimes = r.fond_prevu_centimes
    FROM caisse r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;

  DELETE FROM frais_stand WHERE lieu_id = p_form;
  INSERT INTO frais_stand (lieu_id, stand_id, poste, a_partir_de, montant_centimes, saisi_par, saisi_le)
  SELECT p_form, fs.id, r.poste, r.a_partir_de, r.montant_centimes, r.saisi_par, r.saisi_le
    FROM frais_stand r JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel;

  UPDATE ingredient f SET nom = r.nom, prix_centimes = r.prix_centimes, actif = r.actif, suivi_stock = r.suivi_stock
    FROM ingredient r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO ingredient (lieu_id, nom, unite, prix_centimes, actif, suivi_stock, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.unite, r.prix_centimes, r.actif, r.suivi_stock, r.id, r.cree_par, r.cree_le FROM ingredient r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM ingredient f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  DELETE FROM recette_ligne WHERE lieu_id = p_form;
  INSERT INTO recette_ligne (lieu_id, produit_id, ingredient_id, quantite_milli)
  SELECT p_form, fp.id, fi.id, r.quantite_milli
    FROM recette_ligne r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN ingredient fi ON fi.lieu_id = p_form AND fi.origine_id = r.ingredient_id
   WHERE r.lieu_id = p_reel;

  -- Mercuriale : prix de référence saisis par le lieu (§15.140).
  DELETE FROM prix_reference WHERE lieu_id = p_form;
  INSERT INTO prix_reference (lieu_id, produit_id, ingredient_id, prix_centimes, saisi_par, saisi_le)
  SELECT p_form, fp.id, fi.id, r.prix_centimes, r.saisi_par, r.saisi_le
    FROM prix_reference r
    LEFT JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    LEFT JOIN ingredient fi ON fi.lieu_id = p_form AND fi.origine_id = r.ingredient_id
   WHERE r.lieu_id = p_reel AND (fp.id IS NOT NULL OR fi.id IS NOT NULL);

  -- Conditionnement (§15.155) : emballages du lieu et emballages de chaque produit.
  UPDATE emballage f SET nom = r.nom, prix_millimes = r.prix_millimes, seuil = r.seuil
    FROM emballage r WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  DELETE FROM produit_emballage WHERE lieu_id = p_form;
  DELETE FROM emballage_mouvement WHERE lieu_id = p_form;
  DELETE FROM emballage f WHERE f.lieu_id = p_form AND NOT EXISTS (SELECT 1 FROM emballage r WHERE r.lieu_id = p_reel AND r.id = f.origine_id);
  INSERT INTO emballage (lieu_id, nom, prix_millimes, seuil, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, r.prix_millimes, r.seuil, r.id, r.cree_par, r.cree_le FROM emballage r
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM emballage f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  INSERT INTO produit_emballage (lieu_id, produit_id, emballage_id, quantite)
  SELECT p_form, fp.id, fe.id, r.quantite
    FROM produit_emballage r
    JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
    JOIN emballage fe ON fe.lieu_id = p_form AND fe.origine_id = r.emballage_id
   WHERE r.lieu_id = p_reel;

  -- Hygiène (§15.156) : équipements et tâches suivent ceux du vrai lieu (le registre reste propre à chaque lieu).
  UPDATE hygiene_equipement f SET nom = r.nom, stand_id = fs.id, sorte = r.sorte, min_dixiemes = r.min_dixiemes, max_dixiemes = r.max_dixiemes, actif = r.actif
    FROM hygiene_equipement r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO hygiene_equipement (lieu_id, nom, stand_id, sorte, min_dixiemes, max_dixiemes, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, fs.id, r.sorte, r.min_dixiemes, r.max_dixiemes, r.actif, r.id, r.cree_par, r.cree_le
    FROM hygiene_equipement r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM hygiene_equipement f WHERE f.lieu_id = p_form AND f.origine_id = r.id);
  UPDATE hygiene_tache f SET nom = r.nom, stand_id = fs.id, moment = r.moment, actif = r.actif
    FROM hygiene_tache r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE f.lieu_id = p_form AND f.origine_id = r.id AND r.lieu_id = p_reel;
  INSERT INTO hygiene_tache (lieu_id, nom, stand_id, moment, actif, origine_id, cree_par, cree_le)
  SELECT p_form, r.nom, fs.id, r.moment, r.actif, r.id, r.cree_par, r.cree_le
    FROM hygiene_tache r LEFT JOIN stand fs ON fs.lieu_id = p_form AND fs.origine_id = r.stand_id
   WHERE r.lieu_id = p_reel AND NOT EXISTS (SELECT 1 FROM hygiene_tache f WHERE f.lieu_id = p_form AND f.origine_id = r.id);

  -- Correspondances apprises des factures fournisseurs (§15.173) : article → produit (celui du lieu de formation), colis.
  DELETE FROM correspondance_article_fournisseur WHERE lieu_id = p_form;
  INSERT INTO correspondance_article_fournisseur (lieu_id, fournisseur, cle, libelle, produit_id, unites_par_colis, modifiee_par, modifiee_le)
  SELECT p_form, r.fournisseur, r.cle, r.libelle, fp.id, r.unites_par_colis, r.modifiee_par, r.modifiee_le
    FROM correspondance_article_fournisseur r
    LEFT JOIN produit fp ON fp.lieu_id = p_form AND fp.origine_id = r.produit_id
   WHERE r.lieu_id = p_reel;
END
$$;
