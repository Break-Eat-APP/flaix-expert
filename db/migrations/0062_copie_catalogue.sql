-- =============================================================================
-- 0062 — Copier le catalogue d'un lieu dans un autre lieu du même client (dossier §15.180, demande de Rémi du
-- 2026-11-12 : « à chaque ouverture de lieu, il faut que je fasse une correspondance des produits »).
--
-- Depuis le back-office FlaiX Expert : catégories, produits et leur prix en vigueur, ingrédients et recettes, emballages
-- et conditionnement, correspondances apprises des factures fournisseurs. Règles :
-- * seulement entre deux lieux qui ont un directeur actif en commun : le catalogue d'un client ne va jamais chez un autre ;
-- * rien n'est écrasé : un élément du même nom déjà présent dans le lieu à remplir est gardé tel quel, et sert de lien
--   (une recette ou un conditionnement ne s'ajoute qu'à un produit qui n'en a pas) ;
-- * ni stands, ni caisses, ni ventes, ni stock : ce qui est propre au lieu reste à faire sur place (un produit copié n'est
--   vendu sur aucun stand tant que le directeur ne l'y met pas).
-- =============================================================================

CREATE FUNCTION copier_catalogue_editeur(p_source uuid, p_cible uuid)
  RETURNS TABLE (categories integer, produits integer, ingredients integer, recettes integer, emballages integer, correspondances integer)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  v_par uuid;
  n_cat integer;
  n_prod integer;
  n_ing integer;
  n_rec integer;
  n_emb integer;
  n_corr integer;
BEGIN
  PERFORM exiger_editeur_courant();
  IF p_source = p_cible THEN
    RAISE EXCEPTION 'Choisis un autre lieu que celui à remplir.' USING ERRCODE = 'check_violation';
  END IF;
  IF (SELECT count(*) FROM lieu WHERE id IN (p_source, p_cible) AND formation_de IS NULL) <> 2 THEN
    RAISE EXCEPTION 'Lieu introuvable' USING ERRCODE = 'no_data_found';
  END IF;
  -- Les prix, ingrédients et emballages copiés sont signés du directeur commun : le lieu ne voit que ses membres (le
  -- journal du lieu dit que la copie vient de FlaiX Expert).
  SELECT a.utilisateur_id INTO v_par FROM membre a JOIN membre b ON b.utilisateur_id = a.utilisateur_id
   WHERE a.lieu_id = p_source AND b.lieu_id = p_cible AND a.role = 'directeur' AND b.role = 'directeur' AND a.actif AND b.actif
   ORDER BY a.utilisateur_id LIMIT 1;
  IF v_par IS NULL THEN
    RAISE EXCEPTION 'Ces deux lieux n''ont aucun directeur en commun : le catalogue d''un client ne se copie pas chez un autre.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO categorie (lieu_id, nom, actif, cible_marge_pb, famille)
  SELECT p_cible, s.nom, s.actif, s.cible_marge_pb, s.famille FROM categorie s
   WHERE s.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM categorie t WHERE t.lieu_id = p_cible AND lower(btrim(t.nom)) = lower(btrim(s.nom)));
  GET DIAGNOSTICS n_cat = ROW_COUNT;

  INSERT INTO produit (lieu_id, nom, categorie_id, cout_matiere_centimes, actif, prix_app_centimes, mode_stock_cc, cible_marge_pb, allergenes)
  SELECT p_cible, s.nom, tc.id, s.cout_matiere_centimes, s.actif, s.prix_app_centimes, s.mode_stock_cc, s.cible_marge_pb, s.allergenes
    FROM produit s
    LEFT JOIN categorie sc ON sc.lieu_id = s.lieu_id AND sc.id = s.categorie_id
    LEFT JOIN categorie tc ON tc.lieu_id = p_cible AND lower(btrim(tc.nom)) = lower(btrim(sc.nom))
   WHERE s.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM produit t WHERE t.lieu_id = p_cible AND lower(btrim(t.nom)) = lower(btrim(s.nom)));
  GET DIAGNOSTICS n_prod = ROW_COUNT;

  -- Prix en vigueur dans le lieu d'origine, pour les produits du lieu à remplir qui n'ont encore aucun prix.
  INSERT INTO produit_tarif (lieu_id, produit_id, prix_ttc_centimes, taux_tva_pb, valide_du, saisi_par)
  SELECT p_cible, t.id, pt.prix_ttc_centimes, pt.taux_tva_pb, now(), v_par
    FROM produit t
    JOIN produit s ON s.lieu_id = p_source AND lower(btrim(s.nom)) = lower(btrim(t.nom))
    JOIN LATERAL (SELECT prix_ttc_centimes, taux_tva_pb FROM produit_tarif x WHERE x.lieu_id = p_source AND x.produit_id = s.id AND x.valide_du <= now() ORDER BY x.valide_du DESC LIMIT 1) pt ON true
   WHERE t.lieu_id = p_cible AND NOT EXISTS (SELECT 1 FROM produit_tarif y WHERE y.lieu_id = p_cible AND y.produit_id = t.id);

  INSERT INTO ingredient (lieu_id, nom, unite, prix_centimes, actif, suivi_stock, cree_par)
  SELECT p_cible, s.nom, s.unite, s.prix_centimes, s.actif, s.suivi_stock, v_par FROM ingredient s
   WHERE s.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM ingredient t WHERE t.lieu_id = p_cible AND lower(btrim(t.nom)) = lower(btrim(s.nom)));
  GET DIAGNOSTICS n_ing = ROW_COUNT;

  -- Recettes : seulement pour un produit qui n'en a pas encore dans le lieu à remplir.
  INSERT INTO recette_ligne (lieu_id, produit_id, ingredient_id, quantite_milli)
  SELECT p_cible, tp.id, ti.id, r.quantite_milli
    FROM recette_ligne r
    JOIN produit sp ON sp.lieu_id = r.lieu_id AND sp.id = r.produit_id
    JOIN produit tp ON tp.lieu_id = p_cible AND lower(btrim(tp.nom)) = lower(btrim(sp.nom))
    JOIN ingredient si ON si.lieu_id = r.lieu_id AND si.id = r.ingredient_id
    JOIN ingredient ti ON ti.lieu_id = p_cible AND lower(btrim(ti.nom)) = lower(btrim(si.nom))
   WHERE r.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM recette_ligne x WHERE x.lieu_id = p_cible AND x.produit_id = tp.id);
  SELECT count(DISTINCT tp.id)::int INTO n_rec
    FROM recette_ligne r
    JOIN produit sp ON sp.lieu_id = r.lieu_id AND sp.id = r.produit_id
    JOIN produit tp ON tp.lieu_id = p_cible AND lower(btrim(tp.nom)) = lower(btrim(sp.nom))
   WHERE r.lieu_id = p_source;

  INSERT INTO emballage (lieu_id, nom, prix_millimes, seuil, cree_par)
  SELECT p_cible, s.nom, s.prix_millimes, s.seuil, v_par FROM emballage s
   WHERE s.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM emballage t WHERE t.lieu_id = p_cible AND lower(t.nom) = lower(s.nom));
  GET DIAGNOSTICS n_emb = ROW_COUNT;
  INSERT INTO produit_emballage (lieu_id, produit_id, emballage_id, quantite)
  SELECT p_cible, tp.id, te.id, r.quantite
    FROM produit_emballage r
    JOIN produit sp ON sp.lieu_id = r.lieu_id AND sp.id = r.produit_id
    JOIN produit tp ON tp.lieu_id = p_cible AND lower(btrim(tp.nom)) = lower(btrim(sp.nom))
    JOIN emballage se ON se.lieu_id = r.lieu_id AND se.id = r.emballage_id
    JOIN emballage te ON te.lieu_id = p_cible AND lower(te.nom) = lower(se.nom)
   WHERE r.lieu_id = p_source AND NOT EXISTS (SELECT 1 FROM produit_emballage x WHERE x.lieu_id = p_cible AND x.produit_id = tp.id);

  -- Correspondances des factures fournisseurs : l'article mène au produit ou à l'ingrédient du même nom dans ce lieu.
  INSERT INTO correspondance_article_fournisseur (lieu_id, fournisseur, cle, libelle, produit_id, unites_par_colis, ingredient_id, ingredient_milli_par_unite, modifiee_par)
  SELECT p_cible, r.fournisseur, r.cle, r.libelle, tp.id, r.unites_par_colis, ti.id, CASE WHEN ti.id IS NULL THEN NULL ELSE r.ingredient_milli_par_unite END, v_par
    FROM correspondance_article_fournisseur r
    LEFT JOIN produit sp ON sp.lieu_id = r.lieu_id AND sp.id = r.produit_id
    LEFT JOIN produit tp ON tp.lieu_id = p_cible AND lower(btrim(tp.nom)) = lower(btrim(sp.nom))
    LEFT JOIN ingredient si ON si.lieu_id = r.lieu_id AND si.id = r.ingredient_id
    LEFT JOIN ingredient ti ON ti.lieu_id = p_cible AND lower(btrim(ti.nom)) = lower(btrim(si.nom))
   WHERE r.lieu_id = p_source
     AND NOT EXISTS (SELECT 1 FROM correspondance_article_fournisseur x WHERE x.lieu_id = p_cible AND x.fournisseur = r.fournisseur AND x.cle = r.cle);
  GET DIAGNOSTICS n_corr = ROW_COUNT;

  RETURN QUERY SELECT n_cat, n_prod, n_ing, n_rec, n_emb, n_corr;
END
$$;
REVOKE ALL ON FUNCTION copier_catalogue_editeur(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION copier_catalogue_editeur(uuid, uuid) TO flaix_app;
