# Phase 81 — Catalogue copié d'un lieu à l'autre du même client ; composer un produit simplement

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.180 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.180 Copier le catalogue d'un lieu à l'autre ; composer un produit simplement (2026-11-12)

**Contexte** : Rémi, le 2026-11-12, « ok lance » pour la copie du catalogue entre lieux, et : « Il faut que ce soit facile
[…] lorsque tu vas faire l'addition de plusieurs ingrédients dans un produit comme le hot dog […] Il peut y avoir aussi
des hot dogs qui sont déjà fournis avec le pain. Peut-être que d'autres achèteront que la saucisse […] il faut que ce soit
facile d'utilisation. »

**Constat** : un directeur de plusieurs lieux est toujours connecté au premier ; l'application ne permet pas de changer de
lieu. La copie se fait donc là où les lieux s'ouvrent : le back-office FlaiX Expert.

**Ce qui est fait** :
- Migration 0062, `copier_catalogue_editeur(source, cible)` : catégories, produits et leur prix en vigueur, ingrédients et
  recettes, emballages et conditionnement, correspondances des factures fournisseurs (vers le produit ou l'ingrédient du même
  nom). Réservée à l'éditeur ; **seulement entre deux lieux qui ont un directeur actif en commun** (le catalogue d'un client
  ne va jamais chez un autre) ; **rien n'est écrasé** : un élément du même nom déjà présent est gardé et sert de lien ; une
  recette ou un conditionnement ne s'ajoute qu'à un produit qui n'en a pas. Ni stands, ni caisses, ni ventes, ni stock. Les
  éléments copiés sont signés du directeur commun (un lieu ne voit que ses membres ; une première version signée du compte
  éditeur rendait les prix copiés invisibles, vu au test) ; le journal du lieu (`catalogue_copie`) dit que la copie vient de
  FlaiX Expert. Les coûts des recettes sont recalculés avec les prix du lieu rempli.
- Back-office, fiche d'un lieu : « Copier le catalogue d'un autre lieu de ce client », qui ne propose que les lieux au
  directeur commun, et dit ce qui a été ajouté.
- Recette d'un produit : « Nouvel ingrédient » créé sans quitter le produit (et ajouté à la recette, quantité à dire) ;
  **marge par portion en direct** (prix de vente HT en vigueur, ingrédients, emballages) ; aide repliable avec les trois cas
  du hot dog : livré complet (un ingrédient), saucisse et pain à part (deux), box = hot dog + nachos.

**Vérifié** : `catalogue-copie.test.ts` (3, dont [F] deux clients différents : refusé, rien de copié ; seconde copie : rien
d'ajouté ; produit déjà présent : prix gardé, recette reçue, coût recalculé). Tests des écrans (paramètres, back-office,
factures, achats : 17). À l'écran, en local : « Hot dog complet » créé depuis la box, coût 1,69 €, marge 81 % affichés.

**Reste** : changer de lieu dans l'application pour un directeur de plusieurs lieux (aujourd'hui, le premier seulement).

## 2. Ce qui a été construit — commits

- [`2ed8cbc`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ed8cbc0dc573c40456ef3b389e884887bdcf371) — 2026-11-12 — Back-office (§15.180) : copier le catalogue d'un lieu dans un autre du même client — catégories, produits et prix, ingrédients et recettes, emballages, correspondances fournisseurs ; rien n'est écrasé ; refusé entre deux clients (migration 0062)
- [`e550426`](https://github.com/Break-Eat-APP/flaix-expert/commit/e5504267fa3a38624bf30c5ce2a7906d98a62c43) — 2026-11-12 — Recette d'un produit (§15.180) : créer un ingrédient sans quitter le produit, marge par portion en direct, exemples du hot dog (complet, saucisse et pain à part, box)
- [`76b440c`](https://github.com/Break-Eat-APP/flaix-expert/commit/76b440c39af43b9e8df84fe865f16b205b6fed1d) — 2026-11-12 — Dossier : copie du catalogue entre lieux, recette simplifiée (§15.180, phase 81)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0062_copie_catalogue.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/db/migrations/0062_copie_catalogue.sql)

### Tests

- `apps/api/test/catalogue-copie.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/apps/api/test/catalogue-copie.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/packages/domain/src/editeur.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/apps/api/src/routes/editeur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/parametres/Recettes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/apps/web/src/pages/parametres/Recettes.tsx)

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/infra/outils/carte-du-code-intro.md)
- `infra/outils/phases.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/infra/outils/phases.cjs)

### Documentation

- `CHANGELOG.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/CHANGELOG.md)
- `docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.docx)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/avancement.md)
- `docs/developpement/CARTE_DU_CODE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/GUIDE_DE_REPRISE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/GUIDE_DE_REPRISE.docx)
- `docs/developpement/GUIDE_DE_REPRISE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/GUIDE_DE_REPRISE.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md)
- `docs/developpement/phases/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.md)
- `docs/developpement/phases/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/README.md)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx)
- `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx)
- `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx)
- `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx)
- `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx)
- `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx)
- `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx)
- `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx)
- `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx)
- `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx)
- `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx)
- `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx)
- `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx)
- `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx)
- `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx)
- `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx)
- `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx)
- `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx)
- `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx)
- `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx)
- `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx)
- `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx)
- `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx)
- `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx)
- `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx)
- `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx)
- `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx)
- `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx)
- `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx)
- `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx)
- `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx)
- `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx)
- `docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx)
- `docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx)
- `docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx)
- `docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx)
- `docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx)
- `docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx)
- `docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx)
- `docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx)
- `docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx)
- `docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx)
- `docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx)
- `docs/developpement/phases/word/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/developpement/phases/word/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.docx)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/flaix-gestion-dossier-projet.md)
- `docs/points-a-revoir.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/points-a-revoir.md)
- `docs/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/76b440c39af43b9e8df84fe865f16b205b6fed1d/docs/README.md)

## 4. Tests créés dans cette phase

### `apps/api/test/catalogue-copie.test.ts`

- **copie du catalogue entre deux lieux du même client**
  - [F] deux lieux sans directeur commun (deux clients) : refusé, rien n'est copié
  - copié : ce qui manque est ajouté ; le produit déjà là garde son prix et reçoit la recette ; journal du lieu rempli
  - une seconde copie n'ajoute rien

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/catalogue-copie.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
