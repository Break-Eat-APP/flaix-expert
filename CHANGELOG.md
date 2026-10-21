# CHANGELOG — FlaiX Expert

> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git. Ne pas modifier à la main.
> Chaque entrée : date, commit (lien GitHub), message, fichiers créés ou modifiés. Le plus récent en premier. Phases : [docs/developpement/JOURNAL_DES_PHASES.md](docs/developpement/JOURNAL_DES_PHASES.md).

## 2026-10-21

### [`5a7f287`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c) — Rapport de soirée : stock de la soirée stand par stand (§15.170) ; test des cibles après la clôture *(phase 71)*

- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/test/finances.test.ts`
- modifié : `apps/api/test/rapport-soiree.test.ts`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `packages/domain/src/rapport-soiree.test.ts`
- modifié : `packages/domain/src/rapport-soiree.ts`

### [`631ca41`](https://github.com/Break-Eat-APP/flaix-expert/commit/631ca4169ff7bf5861b65ede39c043de7f7782d4) — Événement privé : rapport de stock, à sortir puis sorti de la réserve, au coût d'achat (§15.170) *(phase 71)*

- modifié : `apps/api/src/routes/evenements-prives.ts`
- modifié : `apps/api/test/sortie-stock-prive.test.ts`
- modifié : `apps/web/src/pages/prives/EvenementPrive.test.tsx`
- modifié : `apps/web/src/pages/prives/EvenementPrive.tsx`
- modifié : `packages/domain/src/evenements-prives.ts`

### [`26cf6ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/26cf6abde2c89c15296ae8d56e5f36ecaf1a8eab) — Ce qu'il te reste en clair, en tête de Résultats et en direct (§15.170) *(phase 71)*

- modifié : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- créé : `apps/web/src/pages/resultats/ResteSoiree.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`

## 2026-10-19

### [`2a4d4c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/2a4d4c6b38045a311997aa6d333f27e8997dd5b1) — Dossier §15.169, avancement, phase 70

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md`
- créé : `docs/developpement/phases/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx`
- modifié : `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx`
- modifié : `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx`
- modifié : `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx`
- modifié : `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx`
- modifié : `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx`
- modifié : `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx`
- modifié : `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx`
- modifié : `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx`
- modifié : `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx`
- modifié : `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx`
- modifié : `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx`
- modifié : `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx`
- modifié : `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx`
- créé : `docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`61ad9fb`](https://github.com/Break-Eat-APP/flaix-expert/commit/61ad9fb0be474eec24bf32ef9adec9ee93409520) — Résultats : marge par catégorie, avec total et cible (§15.169) *(phase 70)*

- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `packages/domain/src/resultats.test.ts`
- modifié : `packages/domain/src/resultats.ts`

### [`600c400`](https://github.com/Break-Eat-APP/flaix-expert/commit/600c4009e628aa1904f49a623979a1b2407c3e1b) — Événement privé : ses produits sortent de la réserve centrale à la clôture (§15.169) *(phase 70)*

- modifié : `apps/api/src/routes/evenements-prives.ts`
- modifié : `apps/api/src/routes/stock-ingredients.ts`
- modifié : `apps/api/src/routes/stock.ts`
- créé : `apps/api/test/sortie-stock-prive.test.ts`
- modifié : `apps/web/src/pages/prives/EvenementPrive.test.tsx`
- modifié : `apps/web/src/pages/prives/EvenementPrive.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `apps/web/src/pages/stock/StockIngredients.tsx`
- créé : `db/migrations/0055_sortie_stock_evenement_prive.sql`
- modifié : `packages/domain/src/evenements-prives.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/stock-ingredients.ts`

### [`47bddbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/47bddbf9e7b0928298b7dfb6f0d49b24cebdb383) — En direct : ouvrir l'événement d'ici, après confirmation (§15.169) *(phase 70)*

- modifié : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/styles.css`

### [`9a05031`](https://github.com/Break-Eat-APP/flaix-expert/commit/9a05031b459346df960660f5dcaca687b489e418) — Stock : réserve centrale en premier et étapes expliquées ; TVA à 2,1 % retirée des choix (§15.169) *(phase 70)*

- modifié : `apps/web/src/pages/parametres/ClickCollect.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- modifié : `apps/web/src/pages/prives/EvenementPrive.tsx`
- modifié : `apps/web/src/pages/stock/PrixFournisseurs.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `packages/domain/src/tva.test.ts`
- modifié : `packages/domain/src/tva.ts`

### [`074b283`](https://github.com/Break-Eat-APP/flaix-expert/commit/074b283ae3a9fde1d8411b92289eff4ce5e71948) — Lieu en 3D : le décor s'enregistre dès qu'on le choisit (§15.169) *(phase 70)*

- modifié : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/resultats/PlanStade.tsx`

### [`ae2f50c`](https://github.com/Break-Eat-APP/flaix-expert/commit/ae2f50caf0414ccc14dec418675ad6ff375ba219) — Dossier §15.168, avancement, phase 69

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.md`
- créé : `docs/developpement/phases/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx`
- modifié : `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx`
- modifié : `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx`
- modifié : `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx`
- modifié : `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx`
- modifié : `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx`
- modifié : `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx`
- modifié : `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx`
- modifié : `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx`
- modifié : `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx`
- modifié : `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx`
- modifié : `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx`
- modifié : `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx`
- créé : `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`b54f0f6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27) — Caisses connectées : exports de L'Addition lus seuls, import annulable (§15.168) *(phase 69)*

- modifié : `apps/api/src/routes/caisses-externes.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- créé : `apps/api/test/annulation-import.test.ts`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx`
- modifié : `apps/web/src/pages/caisses-connectees/fichiers.ts`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0054_annulation_import_ventes_externes.sql`
- modifié : `packages/domain/src/caisses-externes.test.ts`
- modifié : `packages/domain/src/caisses-externes.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`d031e65`](https://github.com/Break-Eat-APP/flaix-expert/commit/d031e653c548dab555533ff0e2aa09085b8ff8e1) — Dossier §15.167 : En direct à part, Résultats pour les événements terminés (phase 68)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx`
- modifié : `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx`
- modifié : `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx`
- modifié : `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx`
- modifié : `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx`
- modifié : `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx`
- modifié : `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx`
- modifié : `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx`
- modifié : `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx`
- modifié : `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx`
- modifié : `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx`
- modifié : `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx`
- créé : `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`f73a1b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5) — En direct : badges courts et montants arrondis comme la maquette, rangée courbe/catégories à hauteur égale, cartes des stands plus lisibles *(phase 68)*

- modifié : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/styles.css`

### [`a34efbd`](https://github.com/Break-Eat-APP/flaix-expert/commit/a34efbd946d10f3234fd45df50937f0e1854d6a1) — En direct à part dans le menu (point rouge pendant un événement) : chiffres clés au design de Résultats, lieu 3D avec petits chiffres par stand et détail en grand au clic, courbe de la soirée, ventes par catégorie, meilleurs produits ; Résultats limité aux événements terminés *(phase 68)*

- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/pages/resultats/Stade3D.tsx`
- modifié : `apps/web/src/styles.css`

### [`25fcf2a`](https://github.com/Break-Eat-APP/flaix-expert/commit/25fcf2a9fbdb17a911700a253ddad814aae2e521) — Tableau En direct : CA, tickets et panier comparés au match précédent au même moment, courbe par quart d'heure, marge, prévision, catégories, meilleurs produits (moteur, serveur) *(phase 68)*

- créé : `apps/api/src/routes/direct.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/plan-stade.test.ts`
- créé : `packages/domain/src/direct.test.ts`
- créé : `packages/domain/src/direct.ts`
- modifié : `packages/domain/src/index.ts`

### [`8182a81`](https://github.com/Break-Eat-APP/flaix-expert/commit/8182a81f6691cd73fffc07e5a0d2031e2115506f) — Dossier §15.166 : le tableau En direct d'après la maquette (phase 67)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.md`
- modifié : `docs/developpement/phases/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.md`
- modifié : `docs/developpement/phases/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.md`
- créé : `docs/developpement/phases/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx`
- modifié : `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx`
- modifié : `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx`
- modifié : `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx`
- modifié : `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx`
- modifié : `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx`
- modifié : `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx`
- modifié : `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx`
- modifié : `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx`
- modifié : `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx`
- modifié : `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx`
- modifié : `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx`
- modifié : `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx`
- modifié : `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx`
- modifié : `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx`
- créé : `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`77de79f`](https://github.com/Break-Eat-APP/flaix-expert/commit/77de79f0bf42f5e1ed518a6323257cb4dc062c43) — En direct : en-tête et chiffres lisibles sur téléphone ; « 1 caisse ouverte sur 2 » *(phase 67)*

- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/styles.css`

### [`a54313b`](https://github.com/Break-Eat-APP/flaix-expert/commit/a54313b9270212f230f55e7cd5d42ccd828d3111) — En direct refait d'après la maquette : chiffres de la soirée, lieu 3D en haut avec À traiter, cartes des stands, réassort en deux gestes ; le stade quitte Résultats *(phase 67)*

- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/direct/EnDirect.test.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- supprimé : `apps/web/src/pages/resultats/PlanStade.test.tsx`
- modifié : `apps/web/src/pages/resultats/PlanStade.tsx`
- modifié : `apps/web/src/styles.css`

### [`0e5db30`](https://github.com/Break-Eat-APP/flaix-expert/commit/0e5db300d4aa4cf49b5e7403de1fac3af2bf3137) — En direct : chiffres de la soirée, ventes des 10 dernières minutes, rythme, match précédent au même moment (moteur, serveur) *(phase 67)*

- modifié : `apps/api/src/routes/plan-stade.ts`
- modifié : `apps/api/test/plan-stade.test.ts`
- modifié : `packages/domain/src/plan-stade.test.ts`
- modifié : `packages/domain/src/plan-stade.ts`

### [`cd00826`](https://github.com/Break-Eat-APP/flaix-expert/commit/cd008264774dd6c23a521ea6c74a1fcf65c3b8af) — Documentation de reprise : guide pour un développeur (Markdown et Word), carte du code complète, fiches des 67 phases régénérées

- modifié : `CHANGELOG.md`
- modifié : `README.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- créé : `docs/developpement/GUIDE_DE_REPRISE.docx`
- créé : `docs/developpement/GUIDE_DE_REPRISE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.md`
- modifié : `docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md`
- modifié : `docs/developpement/phases/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.md`
- modifié : `docs/developpement/phases/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.md`
- modifié : `docs/developpement/phases/PHASE_04_SERVEUR_DE_TEST_OVH.md`
- modifié : `docs/developpement/phases/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.md`
- modifié : `docs/developpement/phases/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.md`
- modifié : `docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md`
- modifié : `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md`
- modifié : `docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md`
- modifié : `docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md`
- modifié : `docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md`
- modifié : `docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md`
- modifié : `docs/developpement/phases/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.md`
- modifié : `docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md`
- modifié : `docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md`
- modifié : `docs/developpement/phases/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.md`
- modifié : `docs/developpement/phases/PHASE_17_VUE_TELEPHONE_EN_DIRECT.md`
- modifié : `docs/developpement/phases/PHASE_18_COUTS_PAR_BUVETTE.md`
- modifié : `docs/developpement/phases/PHASE_19_FIDELITE_PARTIE_GESTION.md`
- modifié : `docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md`
- modifié : `docs/developpement/phases/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.md`
- modifié : `docs/developpement/phases/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.md`
- modifié : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- modifié : `docs/developpement/phases/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.md`
- modifié : `docs/developpement/phases/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.md`
- modifié : `docs/developpement/phases/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.md`
- modifié : `docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md`
- modifié : `docs/developpement/phases/PHASE_28_LOGO_OFFICIEL_V2.md`
- modifié : `docs/developpement/phases/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.md`
- modifié : `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md`
- modifié : `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md`
- modifié : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- modifié : `docs/developpement/phases/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.md`
- modifié : `docs/developpement/phases/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.md`
- modifié : `docs/developpement/phases/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.md`
- modifié : `docs/developpement/phases/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.md`
- modifié : `docs/developpement/phases/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.md`
- modifié : `docs/developpement/phases/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.md`
- créé : `docs/developpement/phases/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.md`
- créé : `docs/developpement/phases/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.md`
- créé : `docs/developpement/phases/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.md`
- créé : `docs/developpement/phases/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.md`
- créé : `docs/developpement/phases/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.md`
- créé : `docs/developpement/phases/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.md`
- créé : `docs/developpement/phases/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.md`
- créé : `docs/developpement/phases/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.md`
- créé : `docs/developpement/phases/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.md`
- créé : `docs/developpement/phases/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.md`
- créé : `docs/developpement/phases/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.md`
- créé : `docs/developpement/phases/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.md`
- créé : `docs/developpement/phases/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.md`
- créé : `docs/developpement/phases/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.md`
- créé : `docs/developpement/phases/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.md`
- créé : `docs/developpement/phases/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.md`
- créé : `docs/developpement/phases/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.md`
- créé : `docs/developpement/phases/PHASE_57_HYGIENE_ET_HACCP.md`
- créé : `docs/developpement/phases/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.md`
- créé : `docs/developpement/phases/PHASE_59_STOCK_DES_EMBALLAGES.md`
- créé : `docs/developpement/phases/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.md`
- créé : `docs/developpement/phases/PHASE_61_EVENEMENTS_PRIVES.md`
- créé : `docs/developpement/phases/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.md`
- créé : `docs/developpement/phases/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.md`
- créé : `docs/developpement/phases/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.md`
- créé : `docs/developpement/phases/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.md`
- créé : `docs/developpement/phases/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- créé : `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx`
- créé : `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx`
- créé : `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx`
- créé : `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx`
- créé : `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx`
- créé : `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx`
- créé : `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx`
- créé : `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx`
- créé : `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx`
- créé : `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx`
- créé : `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx`
- créé : `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx`
- créé : `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx`
- créé : `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx`
- créé : `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx`
- créé : `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx`
- créé : `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx`
- créé : `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx`
- créé : `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx`
- créé : `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx`
- créé : `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx`
- créé : `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx`
- créé : `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx`
- créé : `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx`
- créé : `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx`
- créé : `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx`
- créé : `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx`
- créé : `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx`
- modifié : `infra/outils/carte-du-code-intro.md`
- modifié : `infra/outils/journal-developpement.cjs`

## 2026-10-17

### [`dca76ed`](https://github.com/Break-Eat-APP/flaix-expert/commit/dca76edc4972e07ceef9b5373afbc975281aa0e6) — Avancement : au passage en production, base neuve et reprise de la seule configuration

- modifié : `docs/avancement.md`

### [`6be91d3`](https://github.com/Break-Eat-APP/flaix-expert/commit/6be91d397f274f1fd855735bcb1767f0d17a5940) — Dossier §15.165 : la corbeille explique un refus (phase 66)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`04e39ff`](https://github.com/Break-Eat-APP/flaix-expert/commit/04e39ff9bee14028ecdf78572118a157a03a1712) — Saison : la corbeille sur chaque événement ; ouvert ou clos, elle explique pourquoi il ne se supprime pas *(phase 66)*

- modifié : `apps/web/src/pages/parametres/Saison.tsx`
- modifié : `apps/web/src/pages/stock/RemiseAZero.test.tsx`

### [`0004b81`](https://github.com/Break-Eat-APP/flaix-expert/commit/0004b81d242a6f85eb36ebf9ab084284b0e99559) — Dossier §15.165 : remise à zéro du stock, suppression d'un événement à venir (phase 66)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`325a75d`](https://github.com/Break-Eat-APP/flaix-expert/commit/325a75dbd36aec91527e5803d0c9cbd564793dae) — Écrans : « Remettre à zéro » dans Stock (motif obligatoire), suppression d'un événement à venir dans Saison *(phase 66)*

- modifié : `apps/web/src/pages/parametres/Saison.tsx`
- créé : `apps/web/src/pages/stock/RemiseAZero.test.tsx`
- créé : `apps/web/src/pages/stock/RemiseAZero.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`

### [`f4e5aa8`](https://github.com/Break-Eat-APP/flaix-expert/commit/f4e5aa88b6979734a6be3d1f9b21989be6bc01e2) — Remise à zéro du stock (restes et réserve, avec motif) et suppression d'un événement à venir — base, serveur *(phase 66)*

- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/stock-ingredients.ts`
- modifié : `apps/api/src/routes/stock.ts`
- créé : `apps/api/test/remise-zero.test.ts`
- créé : `db/migrations/0053_remise_zero_suppression_evenement.sql`
- modifié : `packages/domain/src/journal-technique.ts`

## 2026-10-16

### [`c0abb91`](https://github.com/Break-Eat-APP/flaix-expert/commit/c0abb91e5e3c865b1dfbfb003c750ccc3bc2344e) — Dossier §15.164 : le lieu en 3D, quatre décors et stands posés à la main (phase 65)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`69daccc`](https://github.com/Break-Eat-APP/flaix-expert/commit/69dacccb4d5c16bcd19da326cbec79bee1288efa) — Plan du lieu : ordre et écart des buvettes de l'arène, buvettes nord de la salle derrière l'écran, fosse plus visible *(phase 65)*

- modifié : `apps/web/src/pages/resultats/decors3d.ts`
- modifié : `apps/web/src/pages/resultats/modeles-plan.test.ts`
- modifié : `apps/web/src/pages/resultats/modeles-plan.ts`

### [`284297b`](https://github.com/Break-Eat-APP/flaix-expert/commit/284297bec857e094f0e40459c102f2b8a2b564c4) — Plan du lieu : quatre décors 3D (stade, patinoire, arène ronde, salle de spectacle) et mode « Placer les stands » *(phase 65)*

- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/resultats/PlanStade.test.tsx`
- modifié : `apps/web/src/pages/resultats/PlanStade.tsx`
- modifié : `apps/web/src/pages/resultats/Stade3D.tsx`
- créé : `apps/web/src/pages/resultats/decors3d.ts`
- créé : `apps/web/src/pages/resultats/modeles-plan.test.ts`
- créé : `apps/web/src/pages/resultats/modeles-plan.ts`
- modifié : `apps/web/src/styles.css`

### [`2bcf514`](https://github.com/Break-Eat-APP/flaix-expert/commit/2bcf5147ff8c71bc4b2043c05ff9050b1ac30ee5) — Plan du lieu : décor (stade, patinoire, arène, salle) et stands posés à la main — base, moteur, serveur *(phase 65)*

- modifié : `apps/api/src/routes/plan-stade.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/plan-stade.test.ts`
- créé : `db/migrations/0052_plan_lieu.sql`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/plan-stade.test.ts`
- modifié : `packages/domain/src/plan-stade.ts`

### [`01704d9`](https://github.com/Break-Eat-APP/flaix-expert/commit/01704d9c200e516658e883a6e819baab88ba7bfe) — Dossier §15.163 : le stade en direct sans file d'attente (phase 64)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`af99274`](https://github.com/Break-Eat-APP/flaix-expert/commit/af99274982ae73f30fb39365fafb0e429ba960dc) — Stade en direct : sans file d'attente ; alertes de vente (rupture prévue, réserve, caisse sans vente, prix hors tarif, annulations) *(phase 64)*

- modifié : `apps/api/src/routes/plan-stade.ts`
- modifié : `apps/api/test/plan-stade.test.ts`
- modifié : `apps/web/src/pages/resultats/PlanStade.test.tsx`
- modifié : `apps/web/src/pages/resultats/PlanStade.tsx`
- modifié : `packages/domain/src/plan-stade.test.ts`
- modifié : `packages/domain/src/plan-stade.ts`

## 2026-10-12

### [`a3a959a`](https://github.com/Break-Eat-APP/flaix-expert/commit/a3a959a4abc5febb89d7a311b51138274f711d84) — Dossier §15.162 : le stade en direct (phase 63)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`3af785c`](https://github.com/Break-Eat-APP/flaix-expert/commit/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d) — Stade en direct : cadrage adapté à l'écran, pastilles seules sur téléphone, noms des tribunes au bord du terrain *(phase 63)*

- modifié : `apps/web/src/pages/resultats/Stade3D.tsx`
- modifié : `apps/web/src/styles.css`

### [`8ff9104`](https://github.com/Break-Eat-APP/flaix-expert/commit/8ff9104a938807f869865dcc4579d59b4d0c88f3) — Le stade en direct : stands en 3D autour du stade, en couleur, alertes au clic *(phase 63)*

- créé : `apps/api/src/routes/plan-stade.ts`
- modifié : `apps/api/src/routes/stands.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/plan-stade.test.ts`
- modifié : `apps/web/package.json`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/parametres/StandsCaisses.tsx`
- créé : `apps/web/src/pages/resultats/PlanStade.test.tsx`
- créé : `apps/web/src/pages/resultats/PlanStade.tsx`
- créé : `apps/web/src/pages/resultats/Stade3D.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0051_stade_tribune.sql`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/plan-stade.test.ts`
- créé : `packages/domain/src/plan-stade.ts`
- modifié : `pnpm-lock.yaml`

### [`50dd9d8`](https://github.com/Break-Eat-APP/flaix-expert/commit/50dd9d8a0c07fe272c37e68756ecb5636f59b4c1) — Dossier §15.161 : Produits & prix plus clair (phase 62)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`1cbf91d`](https://github.com/Break-Eat-APP/flaix-expert/commit/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2) — Produits & prix : section active en couleur, allergènes cochables dans le tableau, emballages expliqués *(phase 62)*

- modifié : `apps/web/src/pages/parametres/Allergenes.test.tsx`
- modifié : `apps/web/src/pages/parametres/Allergenes.tsx`
- modifié : `apps/web/src/pages/parametres/Conditionnement.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- modifié : `apps/web/src/styles.css`

### [`4387e4a`](https://github.com/Break-Eat-APP/flaix-expert/commit/4387e4a433c3d2212cddd9595707d22c5f71f5c7) — Événements privés : dossier §15.160, avancement, journal des phases (phase 61)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`f03bba1`](https://github.com/Break-Eat-APP/flaix-expert/commit/f03bba194965bff68ffbbdf9915154eeebea75ad) — Événements privés : écrans (dossier §15.160) *(phase 61)*

- modifié : `apps/api/src/routes/evenements-prives.ts`
- modifié : `apps/api/test/evenements-prives.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/prives/EvenementPrive.test.tsx`
- créé : `apps/web/src/pages/prives/EvenementPrive.tsx`
- créé : `apps/web/src/pages/prives/EvenementsPrives.tsx`
- créé : `apps/web/src/pages/prives/FactureVente.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0050_prive_client_apres_cloture.sql`
- modifié : `packages/domain/src/evenements-prives.test.ts`
- modifié : `packages/domain/src/evenements-prives.ts`

## 2026-10-11

### [`8fa7985`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fa79850a868d8541d787e41ab4968e1edf55c95) — Événements privés : moteur et serveur (dossier §15.160) *(phase 61)*

- créé : `apps/api/src/routes/evenements-prives.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/evenements-prives.test.ts`
- créé : `db/migrations/0049_evenements_prives.sql`
- modifié : `packages/domain/src/editeur.ts`
- créé : `packages/domain/src/evenements-prives.test.ts`
- créé : `packages/domain/src/evenements-prives.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`f4a4412`](https://github.com/Break-Eat-APP/flaix-expert/commit/f4a441228324ff2f143486ca5d29691a4fb20bb5) — Allergènes, stock des emballages, hygiène sur tablette : dossier §15.157 à §15.159, phases 58 à 60

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`8e7298c`](https://github.com/Break-Eat-APP/flaix-expert/commit/8e7298c915f658f84b2931da8847dee28c984ae8) — Hygiène sur la tablette des caissières et photos d'étiquettes (dossier §15.159) *(phase 60)*

- modifié : `apps/api/src/routes/hygiene.ts`
- modifié : `apps/api/test/hygiene.test.ts`
- modifié : `apps/web/src/pages/caisse/PosteCaissiere.tsx`
- modifié : `apps/web/src/pages/hygiene/Hygiene.test.tsx`
- modifié : `apps/web/src/pages/hygiene/Hygiene.tsx`
- créé : `apps/web/src/pages/hygiene/photo.ts`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0048_photos_hygiene.sql`
- modifié : `packages/domain/src/hygiene.ts`

### [`32ee27d`](https://github.com/Break-Eat-APP/flaix-expert/commit/32ee27da642829b3c21eae356a150d0e0ad03253) — Stock des emballages : gobelets et autres (dossier §15.158) *(phase 59)*

- modifié : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/emballages.ts`
- modifié : `apps/api/test/conditionnement.test.ts`
- modifié : `apps/web/src/pages/parametres/Conditionnement.test.tsx`
- modifié : `apps/web/src/pages/parametres/Conditionnement.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0047_stock_emballages.sql`
- modifié : `packages/domain/src/alertes.ts`
- modifié : `packages/domain/src/emballages.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`87e7fa5`](https://github.com/Break-Eat-APP/flaix-expert/commit/87e7fa596a0daa29f1e941594d128e4398c0cf0e) — Allergènes de chaque produit (dossier §15.157) *(phase 58)*

- modifié : `apps/api/src/routes/produits.ts`
- créé : `apps/api/test/allergenes.test.ts`
- créé : `apps/web/src/pages/parametres/Allergenes.test.tsx`
- créé : `apps/web/src/pages/parametres/Allergenes.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0046_allergenes.sql`
- créé : `packages/domain/src/allergenes.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`41769fe`](https://github.com/Break-Eat-APP/flaix-expert/commit/41769fecfe2ac9b57c55d1cc71954cd053e1232e) — Hygiène et HACCP : dossier §15.156, avancement, journal des phases (phase 57)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`e621cad`](https://github.com/Break-Eat-APP/flaix-expert/commit/e621cadd9a6f115351c60323ed964d78d6d717e4) — Hygiène et HACCP : écrans (dossier §15.156) *(phase 57)*

- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/hygiene/Hygiene.test.tsx`
- créé : `apps/web/src/pages/hygiene/Hygiene.tsx`
- modifié : `apps/web/src/styles.css`

### [`ca7116b`](https://github.com/Break-Eat-APP/flaix-expert/commit/ca7116b4bf1cfab6b031f0acd156a05578026fdb) — Hygiène et HACCP : moteur et serveur (dossier §15.156) *(phase 57)*

- modifié : `apps/api/src/routes/alertes.ts`
- créé : `apps/api/src/routes/hygiene.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/hygiene.test.ts`
- créé : `db/migrations/0045_hygiene_haccp.sql`
- modifié : `packages/domain/src/alertes.ts`
- modifié : `packages/domain/src/editeur.ts`
- créé : `packages/domain/src/hygiene.test.ts`
- créé : `packages/domain/src/hygiene.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`9af348d`](https://github.com/Break-Eat-APP/flaix-expert/commit/9af348d76c968dd0be181877b1ccfeff6459b52a) — Conditionnement : dossier §15.155, avancement, journal des phases (phase 56)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`23a2058`](https://github.com/Break-Eat-APP/flaix-expert/commit/23a205809c1fbcea5971b797b1689575f0bf1e10) — Conditionnement de chaque produit : écrans (dossier §15.155) *(phase 56)*

- créé : `apps/web/src/pages/parametres/Conditionnement.test.tsx`
- créé : `apps/web/src/pages/parametres/Conditionnement.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.test.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.tsx`
- modifié : `apps/web/src/styles.css`

### [`64619cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/64619cb481da392672ec0e171ad9321428ae4c44) — Conditionnement de chaque produit : moteur et serveur (dossier §15.155) *(phase 56)*

- modifié : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/caisses-externes.ts`
- modifié : `apps/api/src/routes/couts-buvette.ts`
- créé : `apps/api/src/routes/emballages.ts`
- modifié : `apps/api/src/routes/finances.ts`
- modifié : `apps/api/src/routes/produits.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/conditionnement.test.ts`
- créé : `db/migrations/0044_conditionnement.sql`
- créé : `packages/domain/src/emballages.test.ts`
- créé : `packages/domain/src/emballages.ts`
- modifié : `packages/domain/src/finances.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/rapport-soiree.ts`

### [`e4b50b7`](https://github.com/Break-Eat-APP/flaix-expert/commit/e4b50b724e012e2dfaf24ef43b66128df7f20863) — Ce qu'il te reste : dossier §15.154, avancement, journal des phases (phase 55)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`973fa42`](https://github.com/Break-Eat-APP/flaix-expert/commit/973fa4209adba4b303273f5d4491b76bc4d67e32) — Mes frais : loyer, logiciels et TPE saisissables pour tout le lieu sans Coûts par buvette *(phase 55)*

- modifié : `apps/api/src/routes/frais.ts`

### [`b36b67d`](https://github.com/Break-Eat-APP/flaix-expert/commit/b36b67d1a15a486368af647761fdaf156625363e) — Ce qu'il te reste et Mes frais : écrans (dossier §15.154) *(phase 55)*

- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/parametres/MesFrais.test.tsx`
- créé : `apps/web/src/pages/parametres/MesFrais.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.test.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/pages/resultats/graphiques.tsx`
- modifié : `apps/web/src/resultats.css`
- modifié : `apps/web/src/styles.css`

### [`8201e24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8201e24f292722ce3747fe094e0bc041645dbdd8) — Ce qu'il te reste et Mes frais : calcul et serveur (dossier §15.154) *(phase 55)*

- modifié : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/finances.ts`
- créé : `apps/api/src/routes/frais.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/mes-frais.test.ts`
- créé : `db/migrations/0043_ce_qu_il_te_reste.sql`
- modifié : `packages/domain/src/alertes.ts`
- modifié : `packages/domain/src/finances.ts`
- créé : `packages/domain/src/frais.test.ts`
- créé : `packages/domain/src/frais.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/rapport-soiree.ts`

## 2026-10-10

### [`0d20594`](https://github.com/Break-Eat-APP/flaix-expert/commit/0d20594a8577b9902f5650c874b9397cd1b9d22e) — Nouveau style : dossier §15.153, avancement, journal des phases (phase 54)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`56df8e0`](https://github.com/Break-Eat-APP/flaix-expert/commit/56df8e0d5c2079aa0899deebd9dc6118904c82cf) — Nouveau style : arrondi, épuré, toujours clair (dossier §15.153) *(phase 54)*

- modifié : `apps/web/src/composants/Logo.tsx`
- modifié : `apps/web/src/resultats.css`
- modifié : `apps/web/src/styles.css`

## 2026-10-09

### [`c22ee6c`](https://github.com/Break-Eat-APP/flaix-expert/commit/c22ee6cfbb07bdc3da62576e8df6170cf67ba7d1) — Correspondances suggérées : dossier §15.152, avancement, journal des phases (phase 53)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`b79db0d`](https://github.com/Break-Eat-APP/flaix-expert/commit/b79db0d8ee72df223a72a2996de0776cf1998a00) — Caisses connectées : correspondances automatiques et suggérées (dossier §15.152) *(phase 53)*

- modifié : `apps/api/src/routes/caisses-externes.ts`
- modifié : `apps/api/test/caisses-externes.test.ts`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0042_correspondances_automatiques.sql`
- modifié : `packages/domain/src/caisses-externes.test.ts`
- modifié : `packages/domain/src/caisses-externes.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`62e44ae`](https://github.com/Break-Eat-APP/flaix-expert/commit/62e44ae95730c7e766844572f67a1910fb80d5af) — Avancement : correspondances suggérées en cours

- modifié : `docs/avancement.md`

### [`50d818b`](https://github.com/Break-Eat-APP/flaix-expert/commit/50d818b8b67023979d5615ffbe6cc60dd0cae6f2) — Caisses connectées : moteur des correspondances suggérées (même nom, nom proche) *(phase 53)*

- modifié : `packages/domain/src/caisses-externes.test.ts`
- modifié : `packages/domain/src/caisses-externes.ts`

### [`9f0b1f0`](https://github.com/Break-Eat-APP/flaix-expert/commit/9f0b1f0931f1338caafa150955d4b9c7f9a0fe16) — Ventes déposées et fichiers Excel : dossier §15.151, avancement, journal des phases (phase 52)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases.cjs`

### [`944717e`](https://github.com/Break-Eat-APP/flaix-expert/commit/944717ecf8426656dc270a9c29e8c93f2b991839) — Ventes déposées dans tout FlaiX Expert ; fichiers Excel (dossier §15.151) *(phase 52)*

- modifié : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/couts-buvette.ts`
- modifié : `apps/api/src/routes/fournisseurs.ts`
- modifié : `apps/api/src/routes/prevision.ts`
- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/routes/stock-ingredients.ts`
- modifié : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/test/caisses-externes.test.ts`
- modifié : `apps/web/package.json`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx`
- modifié : `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx`
- créé : `apps/web/src/pages/caisses-connectees/fichiers.test.ts`
- créé : `apps/web/src/pages/caisses-connectees/fichiers.ts`
- créé : `db/migrations/0041_ventes_gestion.sql`
- modifié : `packages/domain/src/caisses-externes.test.ts`
- modifié : `packages/domain/src/caisses-externes.ts`
- modifié : `pnpm-lock.yaml`

### [`86a44bc`](https://github.com/Break-Eat-APP/flaix-expert/commit/86a44bc1c9c76face424287b5696f88fc972f811) — Menu : le wallet n'est plus « plus tard » (fait le 2026-10-05)

- modifié : `apps/web/src/composants/Coquille.tsx`

### [`299ec93`](https://github.com/Break-Eat-APP/flaix-expert/commit/299ec934392869fd24bf16302be275f3e5dba987) — Caisses connectées et compteur IA : dossier (réalisé), avancement, journal des phases 49 à 51

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`3f9b046`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e) — Caisses connectées (2/2) : écran (importer avec aperçu et colonnes corrigeables, correspondances, résultats), entrée de menu selon l'option du lieu (dossier §15.150) *(phase 51)*

- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx`
- créé : `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx`

## 2026-10-06

### [`1d5db67`](https://github.com/Break-Eat-APP/flaix-expert/commit/1d5db67cea273c4e9af132ea8b73da8764ef5019) — Caisses connectées (1/2) : import des ventes d'une caisse externe, correspondances, résultats (dossier §15.150) *(phase 51)*

- créé : `apps/api/src/routes/caisses-externes.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/caisses-externes.test.ts`
- modifié : `apps/api/test/options.test.ts`
- créé : `db/migrations/0040_caisses_connectees.sql`
- créé : `packages/domain/src/caisses-externes.test.ts`
- créé : `packages/domain/src/caisses-externes.ts`
- créé : `packages/domain/src/csv.ts`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/fidelite.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`77558bd`](https://github.com/Break-Eat-APP/flaix-expert/commit/77558bd28a81154bc1b4544160dea01271c53497) — Caisses externes : recherche L'Addition, Digifood, Weezevent ; décisions §15.149 (compteur IA) et §15.150 (module Caisses connectées) *(phase 51)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `docs/reference/caisses-externes.md`

### [`4329abb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be) — Compteur de consommation de l'IA dans le back-office (dossier §15.149) *(phase 50)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/test/assistant.test.ts`
- modifié : `apps/api/test/editeur.test.ts`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- créé : `db/migrations/0039_consommation_ia.sql`
- modifié : `packages/domain/src/editeur.ts`

## 2026-10-05

### [`2bbfa35`](https://github.com/Break-Eat-APP/flaix-expert/commit/2bbfa3531dcfe02072e54fb3bd50af167f895278) — Audit Codex : mise en ligne vérifiée ; réglages Apple et Google enfin lus par le serveur (script de mise en ligne jamais mis à jour)

- modifié : `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md`
- modifié : `docs/avancement.md`

### [`9df5acd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9df5acd92b8e84a20dd79f5618ce68696fbac7a5) — Audit Codex du 2026-10-05 : corrections *(phase 49)*

- modifié : `apps/api/package.json`
- modifié : `apps/api/src/index.ts`
- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/wallet/apple.ts`
- créé : `apps/api/src/wallet/cms.ts`
- modifié : `apps/api/test/emails.test.ts`
- modifié : `apps/api/test/wallet-fichiers.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0038_wallet_relance.sql`
- créé : `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CODEX_AUDIT_PROMPT.md`
- créé : `infra/outils/tests-un-par-un.mjs`
- modifié : `pnpm-lock.yaml`

### [`2d49d12`](https://github.com/Break-Eat-APP/flaix-expert/commit/2d49d1218f629a5d93562d3ba0a4ff5c745ce676) — Avancement : corrections de l'audit déployées sur le serveur de test

- modifié : `docs/avancement.md`

### [`76af5c9`](https://github.com/Break-Eat-APP/flaix-expert/commit/76af5c92f3e186a120cd2e3668844fe9dc061ffe) — Audit du 2026-10-05 : corrections notées dans le rapport ; avancement

- modifié : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`
- créé : `docs/audits/AUDIT_2026-10-05_revue-supplementaire-wallet-modules.md`
- modifié : `docs/avancement.md`

### [`360895e`](https://github.com/Break-Eat-APP/flaix-expert/commit/360895e746e57d6f985505fa58cf94afdb6f23de) — Audit du 2026-10-05 : corrections P2-1 à P2-5 *(phase 49)*

- modifié : `apps/api/package.json`
- créé : `apps/api/src/arriere-plan.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/fidelite-caisse.ts`
- modifié : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/test/alertes.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0037_carte_abonne_desactive.sql`
- modifié : `packages/domain/src/wallet.test.ts`
- modifié : `packages/domain/src/wallet.ts`
- modifié : `pnpm-lock.yaml`

### [`0100cd3`](https://github.com/Break-Eat-APP/flaix-expert/commit/0100cd3380139b256f15edbeccb9a6e011098fe0) — Audit : revue des phases 39 à 48 par Claude (P2 : caisse qui attend les notifications, carte d'un abonné désactivé, mise à jour des cartes par lots, node-forge, limite PassKit) ; prompt Codex pour les phases 33 à 48 *(phase 49)*

- créé : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`
- modifié : `docs/developpement/CODEX_AUDIT_PROMPT.md`

### [`c98b882`](https://github.com/Break-Eat-APP/flaix-expert/commit/c98b882efcd70c79f464cc1e546f91853d980989) — Avancement : design de la carte abonné déployé sur le serveur de test

- modifié : `docs/avancement.md`

### [`405b044`](https://github.com/Break-Eat-APP/flaix-expert/commit/405b04421a55f9f71482ed1e464f153e5a0a69fd) — Design de la carte abonné : dossier §15.148, avancement, guide, journal des phases (phase 48)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`a6538ef`](https://github.com/Break-Eat-APP/flaix-expert/commit/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561) — Design de la carte abonné (2/2) : éditeur avec aperçu iPhone et Android, logo et bannière retaillés dans le navigateur, page de l'abonné aux couleurs du club (dossier §15.148) *(phase 48)*

- modifié : `apps/web/src/api.ts`
- créé : `apps/web/src/composants/ApercuCarte.tsx`
- modifié : `apps/web/src/pages/carte/PageCarte.tsx`
- modifié : `apps/web/src/pages/fidelite/CarteWallet.test.tsx`
- modifié : `apps/web/src/pages/fidelite/CarteWallet.tsx`
- créé : `apps/web/src/pages/fidelite/DesignCarte.test.tsx`
- créé : `apps/web/src/pages/fidelite/DesignCarte.tsx`
- modifié : `apps/web/src/pages/fidelite/Fidelite.tsx`
- créé : `apps/web/src/pages/fidelite/imagesCarte.ts`
- modifié : `apps/web/src/styles.css`

### [`0721b51`](https://github.com/Break-Eat-APP/flaix-expert/commit/0721b5128becc3a3b38e22653d7e7f98d6602f6a) — Design de la carte abonné (1/2) : logo, bannière, couleurs, textes, informations et liens ; modèle Google remplacé à chaque changement (dossier §15.148) *(phase 48)*

- modifié : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/wallet/apple.ts`
- modifié : `apps/api/src/wallet/google.ts`
- créé : `apps/api/src/wallet/images.ts`
- modifié : `apps/api/test/wallet-fichiers.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0036_design_carte.sql`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/wallet.test.ts`
- modifié : `packages/domain/src/wallet.ts`

### [`5f928e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/5f928e10cc45c602f4c6025704971d34856183db) — Avancement : comptes Apple et Google de la carte wallet installés sur le serveur de test

- modifié : `docs/avancement.md`

### [`be734a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/be734a0497d48788218b17e3b7ca385dad80b572) — Avancement : carte wallet déployée sur le serveur de test

- modifié : `docs/avancement.md`

### [`e351ee5`](https://github.com/Break-Eat-APP/flaix-expert/commit/e351ee57abeae90827b77754ac066428182ab6e8) — Wallet : dossier (réalisé), guide de Rémi pour Apple et Google, avancement, journal des phases (phase 47)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`4662794`](https://github.com/Break-Eat-APP/flaix-expert/commit/466279489d406c8ac1230051e1717cb73e7cf8d5) — Wallet (4/4) : page de la carte de l'abonné (/carte/<jeton>), lien de la carte dans la fiche de l'abonné, onglet « Carte téléphone » et couleur des cartes (dossier §15.147) *(phase 47)*

- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/carte/PageCarte.tsx`
- créé : `apps/web/src/pages/fidelite/CarteWallet.test.tsx`
- créé : `apps/web/src/pages/fidelite/CarteWallet.tsx`
- modifié : `apps/web/src/pages/fidelite/Fidelite.tsx`
- modifié : `apps/web/src/pages/parametres/EmailsLieu.tsx`
- modifié : `apps/web/src/styles.css`

### [`0b0f1ee`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b0f1eea2f883d395f0a8b4a2f5bc2c208aeeae0) — Wallet (3/4) : commandes flaix-admin pour la carte Apple (clé et demande de certificat sur le serveur, installation de pass.cer contrôlée) et Google (clé du compte de service vérifiée auprès de Google) (dossier §15.147) *(phase 47)*

- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`

### [`6a23cf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/6a23cf28837f784116a2d8c2af19180175019ce0) — Wallet (2/4) : carte Apple et Google côté serveur, service web PassKit, mises à jour du solde (dossier §15.147) *(phase 47)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/fidelite.ts`
- créé : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/src/wallet/apple.ts`
- créé : `apps/api/src/wallet/fichiers.ts`
- créé : `apps/api/src/wallet/google.ts`
- modifié : `apps/api/test/emails.test.ts`
- créé : `apps/api/test/wallet-fichiers.test.ts`
- créé : `apps/api/test/wallet.test.ts`
- modifié : `db/migrations/0035_wallet.sql`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/emails.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/wallet.ts`

### [`91b5446`](https://github.com/Break-Eat-APP/flaix-expert/commit/91b5446a293d1a7d981e749812d1e1e4e0f64cb4) — Wallet (1/4) : décision, migration 0035 et contenu de la carte abonné (dossier §15.147) *(phase 47)*

- modifié : `apps/api/package.json`
- créé : `db/migrations/0035_wallet.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/wallet.test.ts`
- créé : `packages/domain/src/wallet.ts`
- modifié : `pnpm-lock.yaml`

### [`b53a267`](https://github.com/Break-Eat-APP/flaix-expert/commit/b53a2678daa08283526661fb0f6cc7dc412871f2) — Avancement : e-mails Brevo en service sur le serveur de test

- modifié : `docs/avancement.md`

### [`d123027`](https://github.com/Break-Eat-APP/flaix-expert/commit/d123027d3c4f02b8ca73cd8c990019473dee6bc5) — flaix-admin cle-brevo : affiche l'explication de Brevo en cas de refus, repère une clé SMTP collée à la place de la clé d'API

- modifié : `infra/vps/flaix-admin.sh`

### [`f340c85`](https://github.com/Break-Eat-APP/flaix-expert/commit/f340c853e04d5d91d99f11eb7aac9ce2a4badb9b) — Mise en ligne : le script de déploiement se met lui-même à jour sur le serveur

- modifié : `infra/vps/deployer.sh`

### [`4e7e74f`](https://github.com/Break-Eat-APP/flaix-expert/commit/4e7e74f45c43f70b3ee27ca74bfa94a7c3c24ac7) — Journal : phases 45 (IA OVHcloud) et 46 (e-mails Brevo)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/phases.cjs`

### [`3276652`](https://github.com/Break-Eat-APP/flaix-expert/commit/3276652190fa7fd86d1a643f2ee027e7f657ecf5) — E-mails par Brevo : rapport de soirée à la clôture, notification des rectifications de Z (dossier §15.146) *(phase 46)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/routes/clotures.ts`
- créé : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/emails.test.ts`
- créé : `apps/web/src/pages/parametres/EmailsLieu.test.tsx`
- créé : `apps/web/src/pages/parametres/EmailsLieu.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.tsx`
- créé : `db/migrations/0034_emails.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- créé : `packages/domain/src/emails.test.ts`
- créé : `packages/domain/src/emails.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`12c69e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/12c69e10bb15cef6b7a2fe3c1b9aca1164f0447c) — Avancement : serveur de test mis à jour (version b860416, migrations 0030 à 0033)

- modifié : `docs/avancement.md`

### [`b860416`](https://github.com/Break-Eat-APP/flaix-expert/commit/b8604166a371e12a7b414dbe8de26b42bae76ad6) — IA OVHcloud : « clé d'API » comme dans l'espace OVHcloud, commande à lancer en une ligne depuis PowerShell *(phase 45)*

- modifié : `docs/avancement.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/flaix-admin.sh`

### [`0cf75f7`](https://github.com/Break-Eat-APP/flaix-expert/commit/0cf75f74279946891a5f97e9149a8f8086144895) — IA : OVHcloud seul comme moteur de langage de l'agent (dossier §15.145) *(phase 45)*

- modifié : `apps/api/src/ia/fournisseur.ts`
- modifié : `apps/api/src/routes/assistant.ts`
- modifié : `apps/api/test/assistant.test.ts`
- modifié : `apps/web/src/pages/Assistant.test.tsx`
- modifié : `apps/web/src/pages/Assistant.tsx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/flaix-admin.sh`
- modifié : `packages/domain/src/editeur.ts`

### [`e9427a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/e9427a6ab263b3b376ecb1e7ce3dd80bddafd756) — Avancement : vérification à l'écran terminée (prévision, temps de commande)

- modifié : `docs/avancement.md`

### [`7b69e85`](https://github.com/Break-Eat-APP/flaix-expert/commit/7b69e85de78f1fac19cd496629c63b9e522a6065) — Journal : phases 40 à 44 (temps de commande, centre d'alertes, fournisseurs, support niveau 2, prévision) ; avancement à jour

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`534a3a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/534a3a6d867afcbcf5840bc11afcfd7c0f245267) — Prévision du prochain événement (dossier §15.143) *(phase 44)*

- créé : `apps/api/src/routes/prevision.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/prevision.test.ts`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/prevision/Prevision.test.tsx`
- créé : `apps/web/src/pages/prevision/Prevision.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/prevision.test.ts`
- créé : `packages/domain/src/prevision.ts`

### [`0a675eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/0a675ebb0890bbe6e768539eac7b651b1c0d73a6) — Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.142) *(phase 43)*

- modifié : `apps/api/src/auth/contexte.ts`
- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/base.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/outils.ts`
- créé : `apps/api/src/routes/support.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/support.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- créé : `apps/web/src/pages/parametres/SupportFlaix.test.tsx`
- créé : `apps/web/src/pages/parametres/SupportFlaix.tsx`
- créé : `db/migrations/0033_support_niveau2.sql`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`cb5cb03`](https://github.com/Break-Eat-APP/flaix-expert/commit/cb5cb039544ae547d7f86b649da7a5af4e35f00c) — Comparaison des prix entre fournisseurs (module 5, dossier §15.141) *(phase 42)*

- créé : `apps/api/src/routes/fournisseurs.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/fournisseurs.test.ts`
- créé : `apps/web/src/pages/stock/PrixFournisseurs.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- créé : `db/migrations/0032_conditionnements_fournisseurs.sql`
- créé : `packages/domain/src/fournisseurs.test.ts`
- créé : `packages/domain/src/fournisseurs.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`b24b3c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b24b3c607722123e302c890c09795f70f602d59f) — Centre d'alertes et rupture de stock poussée sur le téléphone (module 18, dossier §15.140) *(phase 41)*

- créé : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/click-collect.ts`
- modifié : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/alertes.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/alertes/CentreAlertes.test.tsx`
- créé : `apps/web/src/pages/alertes/CentreAlertes.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.test.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- créé : `db/migrations/0031_centre_alertes.sql`
- créé : `packages/domain/src/alertes.test.ts`
- créé : `packages/domain/src/alertes.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`72f087a`](https://github.com/Break-Eat-APP/flaix-expert/commit/72f087a9c12264b7aa6c658c949a6008d8e4b290) — Temps de prise de commande, par caisse et par stand (dossier §15.139) *(phase 40)*

- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/pertes.ts`
- modifié : `apps/api/test/pertes.test.ts`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.test.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/resultats/Pertes.test.tsx`
- modifié : `apps/web/src/pages/resultats/Pertes.tsx`
- créé : `db/migrations/0030_temps_de_service.sql`
- modifié : `packages/domain/src/caisse-scellee.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/pertes.ts`
- créé : `packages/domain/src/temps-service.test.ts`
- créé : `packages/domain/src/temps-service.ts`

### [`5516b41`](https://github.com/Break-Eat-APP/flaix-expert/commit/5516b41e3dbdcc3ce1c10a7ccff1063ff76554b5) — Dossier : temps de commande, centre d'alertes, prix fournisseurs, support niveau 2, prévision, copie de configuration abandonnée (§15.139 à §15.144)

- modifié : `docs/flaix-gestion-dossier-projet.md`

## 2026-10-04

### [`4d416ac`](https://github.com/Break-Eat-APP/flaix-expert/commit/4d416ac5c9af2fd00b7ef7a4294d8bfd6935d208) — Journal : phase 39 (Revenue Engine) ; décision du temps de prise de commande par caisse (dossier §15.139)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`f001e72`](https://github.com/Break-Eat-APP/flaix-expert/commit/f001e72807328fbfd90912174919d11b7dd5f91b) — Revenue Engine : onglet « Où je perds de l'argent » dans Résultats (dossier §15.138) *(phase 39)*

- créé : `apps/web/src/pages/resultats/Pertes.test.tsx`
- créé : `apps/web/src/pages/resultats/Pertes.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`

### [`6679d7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/6679d7e3b95a5b0a3d944201499bac16b653694e) — Revenue Engine : route GET /api/pertes, événement ou période (dossier §15.138) *(phase 39)*

- créé : `apps/api/src/routes/pertes.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/pertes.test.ts`
- modifié : `packages/domain/src/pertes.ts`

### [`21c7f53`](https://github.com/Break-Eat-APP/flaix-expert/commit/21c7f53ff7f62de497df5079a50ec1bafa83e392) — Revenue Engine : moteur « où je perds de l'argent » et décision (dossier §15.138) *(phase 39)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/pertes.test.ts`
- créé : `packages/domain/src/pertes.ts`

### [`ffe43d3`](https://github.com/Break-Eat-APP/flaix-expert/commit/ffe43d3af21b6ddbc869b3f7da205f7d904c1aa1) — Avancement : inventaire des modules remis à jour au 2026-10-04

- modifié : `docs/avancement.md`

### [`aa091ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/aa091ea651d6d39adf78be704c765b8aaf035d81) — Journal : passerelle d'IA rattachée à la phase 38

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `infra/outils/phases.cjs`

### [`047ce76`](https://github.com/Break-Eat-APP/flaix-expert/commit/047ce760656a8c5a5ba720501ede4c6bcedf593a) — Passerelle d'IA : Mistral d'abord, OVHcloud AI Endpoints en secours (dossier §15.137) *(phase 38)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/ia/fournisseur.ts`
- créé : `apps/api/test/ia.test.ts`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`

### [`7175d0b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7175d0b6da4bd25db4dfe1b15a394b1b296070b8) — Journal : phase 38 (assistant Mistral)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- modifié : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- créé : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `infra/outils/phases.cjs`

### [`4a30d13`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a30d1373cebf546b6614e731c9fb280fa9d41d6) — Assistant « pose ta question » et brief reformulé par Mistral, derrière une option du lieu (dossier §15.136) *(phase 38)*

- modifié : `apps/api/src/config.ts`
- créé : `apps/api/src/ia/fournisseur.ts`
- créé : `apps/api/src/routes/assistant.ts`
- modifié : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/routes/produits.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/assistant.test.ts`
- modifié : `apps/api/test/options.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/Assistant.test.tsx`
- créé : `apps/web/src/pages/Assistant.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0029_assistant.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- créé : `packages/domain/src/assistant.test.ts`
- créé : `packages/domain/src/assistant.ts`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/index.ts`

### [`8354e35`](https://github.com/Break-Eat-APP/flaix-expert/commit/8354e354ef96657d911a1b10f615058d6fdbbd4d) — Journal : phase 37 (brief de fin de soirée)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- créé : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `infra/outils/phases.cjs`

### [`bcb9455`](https://github.com/Break-Eat-APP/flaix-expert/commit/bcb9455bc942b80996d2302d3467a2a1a9316a56) — Brief de fin de soirée envoyé en notification sur le téléphone du directeur (dossier §15.135) *(phase 37)*

- modifié : `apps/api/package.json`
- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/notifications.test.ts`
- modifié : `apps/web/public/sw.js`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/parametres/Notifications.test.tsx`
- créé : `apps/web/src/pages/parametres/Notifications.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0028_brief_notifications.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `packages/domain/src/brief.test.ts`
- créé : `packages/domain/src/brief.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `pnpm-lock.yaml`

### [`2f42193`](https://github.com/Break-Eat-APP/flaix-expert/commit/2f42193e3a18d9e7a30cfbfc6c6e739f3c00c4ab) — Analyse « Intelligence, prévision et décision » v1 : avis sur la note produit, marché, propositions, IA, cadre juridique (dossier §15.134)

- créé : `docs/strategie/FlaiX-Expert-Intelligence-prevision-decision-v1.docx`
- créé : `docs/strategie/FlaiX-Expert-Intelligence-prevision-decision-v1.pdf`
- créé : `docs/strategie/analyse-intelligence-2026-10.md`

### [`8ed1a2c`](https://github.com/Break-Eat-APP/flaix-expert/commit/8ed1a2c0c059f5d1613ab92bdd7b83c295e8d57a) — Journal : phase 36 (bilan sur une période)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.md`
- créé : `docs/developpement/phases/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- créé : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `infra/outils/phases.cjs`

### [`10e0186`](https://github.com/Break-Eat-APP/flaix-expert/commit/10e018659b30bb2cf3a005ec4ef65994e92ce077) — Bilan sur une période « du … au … » dans Résultats et Finances (dossier §15.133) *(phase 36)*

- modifié : `apps/api/src/routes/finances.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- créé : `apps/api/test/periode.test.ts`
- modifié : `apps/web/src/pages/resultats/Finances.test.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.tsx`
- créé : `apps/web/src/pages/resultats/Tableaux.test.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/finances.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/periode-bilan.test.ts`
- créé : `packages/domain/src/periode-bilan.ts`

### [`11ce1ec`](https://github.com/Break-Eat-APP/flaix-expert/commit/11ce1ecd57c4babe97af5e5d6d157f8225073384) — Journal : phase 35 (cibles de marge et gestion financière)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- créé : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `infra/outils/phases.cjs`

### [`074647f`](https://github.com/Break-Eat-APP/flaix-expert/commit/074647f3a6d171ab1f4b33201e211395759a1efa) — Cibles de marge et gestion financière de la soirée (modules 5 et 11, dossier §15.132) *(phase 35)*

- créé : `apps/api/src/routes/finances.ts`
- modifié : `apps/api/src/routes/produits.ts`
- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/finances.test.ts`
- modifié : `apps/api/test/rapport-soiree.test.ts`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/composants/cibles.tsx`
- créé : `apps/web/src/pages/parametres/Objectifs.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- créé : `apps/web/src/pages/resultats/Finances.test.tsx`
- créé : `apps/web/src/pages/resultats/Finances.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`
- créé : `db/migrations/0027_cibles_finances.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `packages/domain/src/finances.test.ts`
- créé : `packages/domain/src/finances.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/rapport-soiree.test.ts`
- modifié : `packages/domain/src/rapport-soiree.ts`

### [`dd181a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/dd181a0ad88f55d567f681ba03eb489194720d49) — Journal : phase 34 (rapport de soirée)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- créé : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `infra/outils/phases.cjs`

### [`8cc5951`](https://github.com/Break-Eat-APP/flaix-expert/commit/8cc595142e87b87cec009b42aa1f43b1a60b4a71) — Rapport de soirée figé à la clôture de l'événement, imprimable et en PDF (module 9, dossier §15.131) *(phase 34)*

- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/rapport-soiree.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- créé : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- créé : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0026_rapport_soiree.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- créé : `packages/domain/src/rapport-soiree.test.ts`
- créé : `packages/domain/src/rapport-soiree.ts`

### [`a787a2a`](https://github.com/Break-Eat-APP/flaix-expert/commit/a787a2ae3b2fa762b9c1b2e36221af9d8ff21796) — Journal : phase 33 (caisse automatique selon la date)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md`
- modifié : `docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md`
- modifié : `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md`
- modifié : `docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md`
- modifié : `docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md`
- modifié : `docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md`
- modifié : `docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md`
- modifié : `docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md`
- modifié : `docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md`
- modifié : `docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md`
- modifié : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- créé : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `infra/outils/phases.cjs`

### [`b6bb919`](https://github.com/Break-Eat-APP/flaix-expert/commit/b6bb919a85b17c60f159741648473bf5a37f1ad2) — Caisse automatique selon la date : ouverture seule le jour J avec le fond prévu, clôture par le directeur seul (dossier §15.130) *(phase 33)*

- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/stands.ts`
- créé : `apps/api/test/caisse-auto.test.ts`
- modifié : `apps/api/test/caisse.test.ts`
- modifié : `apps/api/test/caissieres.test.ts`
- modifié : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/caisse/EcranCaisse.test.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- modifié : `apps/web/src/pages/caisse/memoire.test.ts`
- modifié : `apps/web/src/pages/caisse/memoire.ts`
- modifié : `apps/web/src/pages/parametres/StandsCaisses.tsx`
- créé : `db/migrations/0025_caisse_automatique.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `packages/domain/src/caisse-auto.test.ts`
- créé : `packages/domain/src/caisse-auto.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/modele.ts`

### [`d9720eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9720eba1f8ebaab55b147a4a3cb210b225f4b5f) — « Événement » à la place de « match » dans tous les textes affichés (dossier §15.130) *(phase 33)*

- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/couts-buvette.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/export-comptable.ts`
- modifié : `apps/api/src/routes/periodes.ts`
- modifié : `apps/api/src/routes/planning.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/routes/stock-ingredients.ts`
- modifié : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/test/caisse.test.ts`
- modifié : `apps/api/test/caissieres.test.ts`
- modifié : `apps/api/test/clotures.test.ts`
- modifié : `apps/api/test/coffre.test.ts`
- modifié : `apps/api/test/conformite-base.test.ts`
- modifié : `apps/api/test/equipe.test.ts`
- modifié : `apps/api/test/export-comptable.test.ts`
- modifié : `apps/api/test/formation.test.ts`
- modifié : `apps/api/test/periodes.test.ts`
- modifié : `apps/api/test/resultats.test.ts`
- modifié : `apps/api/test/stock-ingredients.test.ts`
- modifié : `apps/api/test/stock.test.ts`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- modifié : `apps/web/src/pages/clotures/ExportComptable.tsx`
- modifié : `apps/web/src/pages/clotures/Periodes.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/equipe/Equipe.tsx`
- modifié : `apps/web/src/pages/equipe/Planning.tsx`
- modifié : `apps/web/src/pages/parametres/CoutsBuvette.tsx`
- modifié : `apps/web/src/pages/parametres/Formation.tsx`
- modifié : `apps/web/src/pages/parametres/Identite.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- modifié : `apps/web/src/pages/parametres/Saison.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/pages/resultats/graphiques.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `apps/web/src/pages/stock/StockIngredients.tsx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/cloture-periode.test.ts`
- modifié : `packages/domain/src/cloture-periode.ts`
- modifié : `packages/domain/src/couts-buvette.ts`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/export-comptable.test.ts`
- modifié : `packages/domain/src/export-comptable.ts`
- modifié : `packages/domain/src/journal-caisse.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/planning.ts`
- modifié : `packages/domain/src/resultats.ts`
- modifié : `packages/domain/src/stock-ingredients.ts`
- modifié : `packages/domain/src/stock.ts`

### [`1423401`](https://github.com/Break-Eat-APP/flaix-expert/commit/14234013f2ca514de339db098259adcb48f11285) — Journal : phase 32 (audit Codex et corrections)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- créé : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `infra/outils/phases.cjs`

### [`4e289bd`](https://github.com/Break-Eat-APP/flaix-expert/commit/4e289bdbfab09ac9ed5a682ac58ec08c393ee586) — Audit Codex : P1 réservation de fidélité vérifiée avant d'être consommée ; option équipe, tests des écrans, documents tout ou rien, chargement allégé *(phase 32)*

- modifié : `AGENTS.md`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/fidelite-caisse.ts`
- modifié : `apps/api/test/fidelite-caisse.test.ts`
- modifié : `apps/api/test/options.test.ts`
- modifié : `apps/web/package.json`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/caisse/FideliteCaisse.test.tsx`
- créé : `apps/web/src/pages/caisse/memoire.test.ts`
- créé : `apps/web/vitest.config.ts`
- modifié : `docs/audits/AUDIT_2026-10-04_revue-code.md`
- modifié : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- modifié : `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md`
- modifié : `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/phases-word.cjs`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `pnpm-lock.yaml`

### [`c2c517e`](https://github.com/Break-Eat-APP/flaix-expert/commit/c2c517e5fc91cf8a5e5e26b19a1b8601121c9b65) — Journal et dossiers de phase régénérés

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `infra/outils/phases.cjs`

### [`a23a7fb`](https://github.com/Break-Eat-APP/flaix-expert/commit/a23a7fb359ee3958deeb4b2d09c87f633f8f0006) — Dossier de développement par phase pour le développeur : 32 documents Markdown et Word générés depuis Git *(phase 31)*

- modifié : `AGENTS.md`
- modifié : `CHANGELOG.md`
- créé : `docs/audits/AUDIT_2026-10-04_revue-code.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.md`
- créé : `docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md`
- créé : `docs/developpement/phases/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.md`
- créé : `docs/developpement/phases/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.md`
- créé : `docs/developpement/phases/PHASE_04_SERVEUR_DE_TEST_OVH.md`
- créé : `docs/developpement/phases/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.md`
- créé : `docs/developpement/phases/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.md`
- créé : `docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md`
- créé : `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md`
- créé : `docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md`
- créé : `docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md`
- créé : `docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md`
- créé : `docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md`
- créé : `docs/developpement/phases/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.md`
- créé : `docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md`
- créé : `docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md`
- créé : `docs/developpement/phases/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.md`
- créé : `docs/developpement/phases/PHASE_17_VUE_TELEPHONE_EN_DIRECT.md`
- créé : `docs/developpement/phases/PHASE_18_COUTS_PAR_BUVETTE.md`
- créé : `docs/developpement/phases/PHASE_19_FIDELITE_PARTIE_GESTION.md`
- créé : `docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md`
- créé : `docs/developpement/phases/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.md`
- créé : `docs/developpement/phases/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.md`
- créé : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- créé : `docs/developpement/phases/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.md`
- créé : `docs/developpement/phases/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.md`
- créé : `docs/developpement/phases/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.md`
- créé : `docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md`
- créé : `docs/developpement/phases/PHASE_28_LOGO_OFFICIEL_V2.md`
- créé : `docs/developpement/phases/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.md`
- créé : `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md`
- créé : `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md`
- créé : `docs/developpement/phases/README.md`
- créé : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- créé : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- créé : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- créé : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- créé : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- créé : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- créé : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- créé : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- créé : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- créé : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- créé : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- créé : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- créé : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- créé : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- créé : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- créé : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- créé : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- créé : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- créé : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- créé : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- créé : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- créé : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- créé : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- créé : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- créé : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- créé : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- créé : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- créé : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- créé : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- créé : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- créé : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- créé : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/journal-developpement.cjs`
- créé : `infra/outils/md-vers-docx.cjs`
- créé : `infra/outils/phases-word.cjs`
- créé : `infra/outils/phases.cjs`
- modifié : `package.json`
- modifié : `pnpm-lock.yaml`

### [`0c29f8f`](https://github.com/Break-Eat-APP/flaix-expert/commit/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc) — Journal des phases : commits rattachés *(phase 31)*

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/journal-developpement.cjs`

### [`c3d3041`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874) — Fidélité à la caisse vérifiée à l'écran ; journal des phases à jour *(phase 30)*

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/journal-developpement.cjs`

### [`2859233`](https://github.com/Break-Eat-APP/flaix-expert/commit/2859233de0a1cd9bc6dd27b388e7f97fd32f575a) — Journal des phases : phase 31 (suivi du développement) *(phase 31)*

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/journal-developpement.cjs`

### [`0b59036`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b590362a71a8549b053dcfb0e1a6ff474fd3d5e) — Dossier de développement pour l'audit Codex : AGENTS.md, journal des phases, carte du code, CHANGELOG, prompt d'audit *(phase 31)*

- créé : `AGENTS.md`
- créé : `CHANGELOG.md`
- modifié : `CLAUDE.md`
- modifié : `README.md`
- créé : `docs/audits/README.md`
- créé : `docs/developpement/CARTE_DU_CODE.md`
- créé : `docs/developpement/CODEX_AUDIT_PROMPT.md`
- créé : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `infra/outils/carte-du-code-intro.md`
- créé : `infra/outils/journal-developpement.cjs`

## 2026-10-03

### [`87c46b8`](https://github.com/Break-Eat-APP/flaix-expert/commit/87c46b8234d355b7db4e2dbdf6c328fa5574c301) — Fidélité à la caisse : code promo et points dans le ticket scellé, réservations du serveur (écran à vérifier) *(phase 30)*

- modifié : `apps/api/src/routes/caisse.ts`
- créé : `apps/api/src/routes/fidelite-caisse.ts`
- modifié : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/fidelite-caisse.test.ts`
- modifié : `apps/api/test/tablette.ts`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- créé : `apps/web/src/pages/caisse/FideliteCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- modifié : `apps/web/src/pages/caisse/TicketClient.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0024_fidelite_caisse.sql`
- modifié : `docs/avancement.md`
- modifié : `packages/domain/src/caisse-scellee.ts`
- créé : `packages/domain/src/fidelite-caisse.test.ts`
- modifié : `packages/domain/src/fidelite.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/ticket.ts`

### [`d26e10e`](https://github.com/Break-Eat-APP/flaix-expert/commit/d26e10ef12863773b521852e0d84a9ffd2415a1d) — Dossier de conformité v0.1 en Word et PDF *(phase 29)*

- créé : `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx`
- créé : `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf`

### [`f75e8a7`](https://github.com/Break-Eat-APP/flaix-expert/commit/f75e8a722681b183641c02e16efd38a6ac4b38ff) — Dossier de conformité FlaiX Expert v0.1 (plan de Rémi réécrit pour la caisse, parties 21 à 28) *(phase 29)*

- modifié : `docs/avancement.md`
- créé : `docs/conformite/dossier-conformite-flaix-expert.md`

### [`1259fb6`](https://github.com/Break-Eat-APP/flaix-expert/commit/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256) — Logo officiel v2 (X en quatre traits) dans l'application *(phase 28)*

- modifié : `apps/web/src/assets/logo-clair.svg`
- modifié : `apps/web/src/assets/logo-sombre.svg`
- modifié : `docs/marque/logo-expert-officiel.png`
- modifié : `docs/marque/logo-expert-officiel.svg`
- modifié : `infra/outils/logo.cjs`

### [`f5a8b5a`](https://github.com/Break-Eat-APP/flaix-expert/commit/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9) — Stock des ingrédients au choix (bière pression au litre) : réserve, mise en place, comptage, consommation figée à la clôture *(phase 27)*

- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/recettes.ts`
- créé : `apps/api/src/routes/stock-ingredients.ts`
- modifié : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/stock-ingredients.test.ts`
- modifié : `apps/web/src/pages/parametres/Recettes.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- créé : `apps/web/src/pages/stock/StockIngredients.tsx`
- créé : `db/migrations/0023_stock_ingredients.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/recettes.ts`
- créé : `packages/domain/src/stock-ingredients.test.ts`
- créé : `packages/domain/src/stock-ingredients.ts`

### [`7294651`](https://github.com/Break-Eat-APP/flaix-expert/commit/729465129cb7c7a95965666641164b8badd537f2) — Export comptable dans la base ; commission C&C calculée sur le prix buvette ou sur le prix app *(phase 26)*

- modifié : `apps/api/src/routes/click-collect.ts`
- modifié : `apps/api/test/click-collect.test.ts`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/parametres/ClickCollect.tsx`
- créé : `db/migrations/0022_export_base_assiette_cc.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/click-collect.test.ts`
- modifié : `packages/domain/src/click-collect.ts`
- modifié : `packages/domain/src/editeur.ts`

### [`3979502`](https://github.com/Break-Eat-APP/flaix-expert/commit/3979502a25057064cf9c3d3345429cf2f3d308e2) — Click & Collect neutre : application de commande, commission de la plateforme, frais de paiement *(phase 26)*

- modifié : `apps/api/src/routes/click-collect.ts`
- modifié : `apps/web/src/pages/parametres/ClickCollect.tsx`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/click-collect.ts`
- modifié : `packages/domain/src/couts-buvette.ts`
- modifié : `packages/domain/src/editeur.ts`

## 2026-10-02

### [`d8d7990`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8d7990f3794d8911fb7141ce1bdfef8997a32e7) — Avancement : ce qui se passera au passage en production *(phase 25)*

- modifié : `docs/avancement.md`

### [`66326dc`](https://github.com/Break-Eat-APP/flaix-expert/commit/66326dc7eb9cf072917491acb352a7e10e6dd3ae) — Back-office : créer un lieu et ses directeurs, mot de passe provisoire ; mots de passe de 6 caractères avec un œil *(phase 25)*

- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/auth/secrets.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- créé : `apps/api/test/lieux-editeur.test.ts`
- créé : `apps/web/src/composants/MotDePasse.tsx`
- modifié : `apps/web/src/pages/Compte.tsx`
- modifié : `apps/web/src/pages/Connexion.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0021_lieux_back_office.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- créé : `packages/domain/src/mot-de-passe.test.ts`
- créé : `packages/domain/src/mot-de-passe.ts`

### [`c694bbe`](https://github.com/Break-Eat-APP/flaix-expert/commit/c694bbe8507accae347e88817de19d604a2ba2ee) — Éditeur et back-office au nom de FlaiX Expert (et non Break Eat) *(phase 25)*

- modifié : `apps/api/src/options.ts`
- modifié : `apps/api/src/outils/cli.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/export-comptable.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/editeur.test.ts`
- modifié : `apps/api/test/options.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/clotures/ExportComptable.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/parametres/JournalTechnique.tsx`
- modifié : `apps/web/src/session.tsx`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`f6a4820`](https://github.com/Break-Eat-APP/flaix-expert/commit/f6a48204cc8d8f50724447a6e00506d7e290cbf4) — Docs : adresse du site flaixexpert.flaixlabs.com (dossier §15.120, guide du serveur, avancement) *(phase 24)*

- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`

### [`e18b9ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/e18b9ea9af4e97d3285468c2f3f587f1848c1acc) — Adresse du site : flaixexpert.flaixlabs.com ; l'ancienne adresse provisoire (sslip.io) renvoie vers elle *(phase 24)*

- modifié : `infra/vps/deployer.sh`

## 2026-10-01

### [`9287bce`](https://github.com/Break-Eat-APP/flaix-expert/commit/9287bce7d739539eb77005cd8a9dd8eb747770e7) — Logo officiel « eXpert » sur tous les écrans (menu, téléphone, caisse, connexions, back-office), versions claire et sombre ; originaux dans docs/marque *(phase 23)*

- créé : `apps/web/src/assets/logo-clair.svg`
- créé : `apps/web/src/assets/logo-sombre.svg`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/composants/Logo.tsx`
- modifié : `apps/web/src/pages/Connexion.tsx`
- modifié : `apps/web/src/pages/ConnexionCaissiere.tsx`
- modifié : `apps/web/src/pages/caisse/PosteCaissiere.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- créé : `docs/marque/logo-expert-officiel.png`
- créé : `docs/marque/logo-expert-officiel.svg`
- créé : `infra/outils/logo.cjs`

### [`0579d24`](https://github.com/Break-Eat-APP/flaix-expert/commit/0579d248fdd9dc4a9c34883f3a8c159469fb4c96) — Options par lieu (écrans et back-office), application installable (fiche d'application, icônes) ; dossier §15.118, §15.119 *(phase 23)*

- modifié : `apps/web/index.html`
- créé : `apps/web/public/apple-touch-icon.png`
- créé : `apps/web/public/icone-192.png`
- créé : `apps/web/public/icone-512.png`
- créé : `apps/web/public/icone-masquable-512.png`
- créé : `apps/web/public/manifest.webmanifest`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- modifié : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/equipe/Equipe.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/session.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `infra/outils/icones-application.cjs`

### [`80c5742`](https://github.com/Break-Eat-APP/flaix-expert/commit/80c5742fe8aa8efc1febbbd1675b31df5bef3132) — Options par lieu, serveur : activées par Break Eat depuis le back-office, adresses fermées si désactivées, journal du lieu, lieu de formation aligné (migration 0020) *(phase 23)*

- créé : `apps/api/src/options.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/options.test.ts`
- créé : `db/migrations/0020_options_lieu.sql`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`929f16a`](https://github.com/Break-Eat-APP/flaix-expert/commit/929f16a8e962ef83d5668fac57809e5822642849) — Dossier : choix de Rémi, option A (points et codes plafonnés avec réseau) ; réponse sur les coupures de réseau *(phase 22)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`c6aae54`](https://github.com/Break-Eat-APP/flaix-expert/commit/c6aae5476b9450542850564c8393a0edda7567ea) — Recettes, écrans : ingrédients (Produits & prix → Ingrédients), recette dans la fiche produit avec coût de fabrication en direct *(phase 22)*

- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- créé : `apps/web/src/pages/parametres/Recettes.tsx`

### [`92de462`](https://github.com/Break-Eat-APP/flaix-expert/commit/92de4627a1c71f49ffc38196e034bf5fe84e95e0) — Recettes, serveur : ingrédients au kg/litre/pièce, recette d'un produit, coût de fabrication = coût matière recalculé à chaque changement de prix, recopie en formation (migration 0019) *(phase 22)*

- modifié : `apps/api/src/routes/produits.ts`
- créé : `apps/api/src/routes/recettes.ts`
- modifié : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/recettes.test.ts`
- créé : `db/migrations/0019_recettes.sql`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/recettes.test.ts`
- créé : `packages/domain/src/recettes.ts`

### [`3abfb38`](https://github.com/Break-Eat-APP/flaix-expert/commit/3abfb38bc013cd7cd8167690ba9ca1b498200207) — Décisions de Rémi du 2026-10-01 (dossier §15.117) : tolérance des factures validée, base fidélité, Brevo, options par lieu, recettes ; réponse sur le hors connexion *(phase 22)*

- modifié : `apps/web/src/pages/factures/Factures.tsx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/factures.ts`

### [`a698a23`](https://github.com/Break-Eat-APP/flaix-expert/commit/a698a230b4cb37522ea05d97100a797f09528d28) — Back-office éditeur : écran /editeur (parc, alertes, vérification d'intégrité, mot de passe), commande creer-editeur ; dossier §15.116 *(phase 21)*

- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`

### [`e83eaf3`](https://github.com/Break-Eat-APP/flaix-expert/commit/e83eaf391efff8da06bdbed32e06ddb5d677f18f) — Back-office éditeur, niveau 1, serveur : comptes Break Eat séparés, sessions sans lieu, vue du parc sans montant, vérification d'intégrité journalisée chez le lieu ; tests B6/B7 (migration 0018) *(phase 21)*

- modifié : `apps/api/src/outils/cli.ts`
- créé : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/periodes.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/editeur.test.ts`
- créé : `db/migrations/0018_back_office_editeur.sql`
- modifié : `infra/vps/flaix-admin.sh`
- créé : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`e847e75`](https://github.com/Break-Eat-APP/flaix-expert/commit/e847e752747b612abb5b16d8de499b4d3e2ab82c) — Factures fournisseurs : écran (saisie, rapprochement, validation, paiement, pièce jointe), menu ; test de conformité ajusté ; dossier §15.115 *(phase 20)*

- modifié : `apps/api/test/conformite-base.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/factures/Factures.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`be6307c`](https://github.com/Break-Eat-APP/flaix-expert/commit/be6307ce4039ab4cae3dc394f699410264d9c832) — Factures fournisseurs, serveur : saisie, rapprochement avec les livraisons du Stock, écarts, validation motivée, paiement, pièce jointe, facture figée (migration 0017) *(phase 20)*

- créé : `apps/api/src/routes/factures.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/factures.test.ts`
- créé : `db/migrations/0017_factures_fournisseurs.sql`
- créé : `packages/domain/src/factures.test.ts`
- créé : `packages/domain/src/factures.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`bd1b604`](https://github.com/Break-Eat-APP/flaix-expert/commit/bd1b60433763f1ee26a19bf713bde0d5672455e9) — Fidélité, écran (abonnés, historique, ajustements, codes promo, import, règles des points), menu ; dossier §15.114, question G.21 *(phase 19)*

- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/fidelite/Fidelite.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/questions-expert-comptable.md`

### [`f9ce7f4`](https://github.com/Break-Eat-APP/flaix-expert/commit/f9ce7f4a2853d19ec6a98c4e84e104a986205497) — Fidélité, serveur : abonnés, points lus dans les tickets scellés, ajustements, import, codes promo, refus en formation *(phase 19)*

- créé : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/fidelite.test.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`e110233`](https://github.com/Break-Eat-APP/flaix-expert/commit/e110233bfed49b8dd87effc7d564314ea89666c7) — Fidélité : migration (abonnés, mouvements de points en écriture seule, codes promo, réglages vides) et calcul (points, conversion, codes, import tolérant) *(phase 19)*

- créé : `db/migrations/0016_fidelite.sql`
- créé : `packages/domain/src/fidelite.test.ts`
- créé : `packages/domain/src/fidelite.ts`
- modifié : `packages/domain/src/index.ts`

### [`5a2fe6a`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a2fe6a3147e340d0f7695556aba2be65114921f) — Coûts par buvette : écran Paramètres → Coûts par buvette (frais datés par stand, coûts du mois, camembert), dossier §15.113 *(phase 18)*

- modifié : `apps/api/src/routes/couts-buvette.ts`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/parametres/CoutsBuvette.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`66936e8`](https://github.com/Break-Eat-APP/flaix-expert/commit/66936e88516f21751d32bc255b77fc6cf1223f5d) — Coûts par buvette, serveur : frais mensuels datés par stand, consolidation du mois (matière, masse salariale, CA HT, reste), recopie en formation (migration 0015) *(phase 18)*

- créé : `apps/api/src/routes/couts-buvette.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/couts-buvette.test.ts`
- créé : `db/migrations/0015_couts_buvette.sql`
- créé : `packages/domain/src/couts-buvette.test.ts`
- créé : `packages/domain/src/couts-buvette.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`8fec2c4`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fec2c423fac32948e9b0251b9543d97218761a2) — Vue téléphone « En direct » : CA, caisses, ruptures et réassort en deux gestes, mise à jour toutes les 20 s ; bandeau formation compact sur téléphone (dossier §15.112) *(phase 17)*

- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Formation.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- créé : `apps/web/src/pages/direct/EnDirect.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`d5c624d`](https://github.com/Break-Eat-APP/flaix-expert/commit/d5c624d5f88cab945153642dde9681fe120efd82) — Docs : Click & Collect (dossier §15.111), avancement *(phase 16)*

- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`d9708e0`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9708e0963944998d2e891ad9a2c8b7a0fd5dcbb) — Click & Collect : écran Paramètres → Click & Collect (catalogue, réglages du lieu, simulateur libre) *(phase 16)*

- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/parametres/ClickCollect.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`

### [`c969d9f`](https://github.com/Break-Eat-APP/flaix-expert/commit/c969d9fa35f11b681a86e86ff422b9f125428ca4) — Click & Collect, serveur : réglages du lieu, catalogue des points de retrait, prix app et mode de stock par produit, recopie en formation (migration 0014) *(phase 16)*

- créé : `apps/api/src/routes/click-collect.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/click-collect.test.ts`
- créé : `db/migrations/0014_click_collect.sql`
- modifié : `packages/domain/src/journal-technique.ts`

### [`07e608a`](https://github.com/Break-Eat-APP/flaix-expert/commit/07e608af3939ccd0e187ab310bcbed679822da31) — Click & Collect : moteur de prix (marge HT préservée, Stripe taux + fixe sur panier moyen, TVA sur commission), tests du dossier *(phase 16)*

- créé : `packages/domain/src/click-collect.test.ts`
- créé : `packages/domain/src/click-collect.ts`
- modifié : `packages/domain/src/index.ts`

## 2026-09-30

### [`7429ef2`](https://github.com/Break-Eat-APP/flaix-expert/commit/7429ef25ffb03eb538f67ca8516567a912405875) — Export comptable : écran Clôtures → Export comptable, mention FACTICE dans les fichiers de formation, dossier §15.110, question G.20 *(phase 15)*

- modifié : `apps/api/src/routes/export-comptable.ts`
- modifié : `apps/api/test/export-comptable.test.ts`
- modifié : `apps/web/src/api.ts`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- créé : `apps/web/src/pages/clotures/ExportComptable.tsx`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/questions-expert-comptable.md`

### [`187fdf5`](https://github.com/Break-Eat-APP/flaix-expert/commit/187fdf5a242b1149783bf040bfd06304111df1c2) — Export pour l'expert-comptable, serveur : journal des ventes et récapitulatif sur les Z scellés, écarts de caisse, plan de comptes du lieu (dossier §15.110) *(phase 15)*

- créé : `apps/api/src/routes/export-comptable.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/export-comptable.test.ts`
- créé : `db/migrations/0013_plan_comptes.sql`
- créé : `packages/domain/src/export-comptable.test.ts`
- créé : `packages/domain/src/export-comptable.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`7c65a1b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7c65a1b02189ef9933f540a46e5f7fecd241dba7) — Mode formation FACTICE : écrans (bandeau non masquable, Paramètres → Mode formation, tablettes en formation, ticket FACTICE), dossier §15.109, ordre de développement fixé par Rémi *(phase 14)*

- modifié : `CLAUDE.md`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/composants/Formation.tsx`
- modifié : `apps/web/src/pages/ConnexionCaissiere.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/PosteCaissiere.tsx`
- modifié : `apps/web/src/pages/caisse/TicketClient.tsx`
- modifié : `apps/web/src/pages/equipe/Equipe.tsx`
- créé : `apps/web/src/pages/parametres/Formation.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/session.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`4711c41`](https://github.com/Break-Eat-APP/flaix-expert/commit/4711c41a1394e216f1ac61602d91df724e20f6b2) — Mode formation : tests B3/B4 (vente, clôture et Z en formation sans effet sur le vrai lieu ; tablette ; remise à zéro) *(phase 14)*

- créé : `apps/api/test/formation.test.ts`

### [`019dbcd`](https://github.com/Break-Eat-APP/flaix-expert/commit/019dbcd5d04cf3c2df5ff21f7dd42c8c5aee3140) — Mode formation FACTICE, serveur (en cours) : lieu de formation jumeau, sessions, tablettes en formation, configuration en lecture seule (dossier §15.109) *(phase 14)*

- modifié : `apps/api/src/auth/appareil.ts`
- modifié : `apps/api/src/auth/contexte.ts`
- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/base.ts`
- modifié : `apps/api/src/routes/equipe.ts`
- créé : `apps/api/src/routes/formation.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `db/migrations/0012_mode_formation.sql`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`ec9398d`](https://github.com/Break-Eat-APP/flaix-expert/commit/ec9398d1095c16338ee3ad8a8b31263aaa88491f) — Docs : inventaire prototype → logiciel et ordre A à Z, guide de la copie des sauvegardes chez OVH *(phase 13)*

- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`

### [`8903b24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8903b2402a29f454d5f87ba3bf0b180cc537c260) — flaix-admin : sans messages techniques de rclone *(phase 13)*

- modifié : `infra/vps/flaix-admin.sh`

### [`43fd2f2`](https://github.com/Break-Eat-APP/flaix-expert/commit/43fd2f2403c402c0f3100b9c03fbd576dab36869) — Sauvegarde : copie chiffrée (age) chez OVHcloud Object Storage, flaix-admin sauvegarde-externe et essai-restauration (dossier §15.108) *(phase 13)*

- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- modifié : `infra/vps/installer-socle.sh`

### [`8542bbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/8542bbf2917250654fa57285b66854d56afdf4f0) — Exercice comptable à régler par lieu ; dossier §15.108 : sauvegarde chiffrée chez OVH, logiciel vierge, reprise des modules *(phase 13)*

- modifié : `apps/api/src/routes/periodes.ts`
- modifié : `apps/api/test/periodes.test.ts`
- modifié : `apps/web/src/pages/clotures/Periodes.tsx`
- modifié : `apps/web/src/pages/parametres/Identite.tsx`
- créé : `db/migrations/0011_exercice_a_regler.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/modele.ts`

### [`284f366`](https://github.com/Break-Eat-APP/flaix-expert/commit/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909) — Clôtures → Mois & année : écran des clôtures mensuelle et annuelle, exercice comptable du lieu (dossier §15.107) *(phase 12)*

- modifié : `CLAUDE.md`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- créé : `apps/web/src/pages/clotures/Periodes.tsx`
- modifié : `apps/web/src/pages/parametres/Identite.tsx`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`1141f9c`](https://github.com/Break-Eat-APP/flaix-expert/commit/1141f9cce56d1b669331d941b94595803f792956) — Clôtures de période, serveur : Z du match, clôtures mensuelle et annuelle scellées et chaînées, total perpétuel (dossier §15.107) *(phase 12)*

- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/periodes.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/periodes.test.ts`
- créé : `db/migrations/0010_clotures_periode.sql`
- créé : `packages/domain/src/cloture-periode.test.ts`
- créé : `packages/domain/src/cloture-periode.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`8b02048`](https://github.com/Break-Eat-APP/flaix-expert/commit/8b020484526c8b4914bb2eec0b1f976e2a2b0634) — Dossier §15.107 : conception des clôtures mensuelle et annuelle *(phase 12)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`69d161f`](https://github.com/Break-Eat-APP/flaix-expert/commit/69d161f77edca030cb2fa585a5b96694706227ef) — Guide du serveur de test : sauvegarde mensuelle gardée sans limite *(phase 11)*

- modifié : `docs/guide-serveur-test-ovh.md`

### [`2ba4293`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ba429373c1a48ce1e30cff7ae626d337b1371f9) — Clôtures : remontées au coffre, Z du coffre, espèces de la soirée ; sauvegarde mensuelle gardée sans limite (dossier §15.106) *(phase 11)*

- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/vps/deployer.sh`

### [`4aa3109`](https://github.com/Break-Eat-APP/flaix-expert/commit/4aa310972d68abaf25e02e92529e7ea9b81d1c8b) — Remontées d'espèces au coffre et Z du coffre de la soirée, serveur et tests (dossier §15.106) *(phase 11)*

- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/test/coffre.test.ts`
- créé : `db/migrations/0009_coffre.sql`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`27be12a`](https://github.com/Break-Eat-APP/flaix-expert/commit/27be12a8bbffc011ac34ee44c6857d306160e17e) — Dossier §15.106 : tickets conservés sans limite, remontées d'espèces au coffre et clôture finale des espèces *(phase 11)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/questions-expert-comptable.md`

### [`9b43fdd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba) — Stock : écran en 4 onglets, étape Restes de la clôture, tests de conformité (dossier §15.105) *(phase 10)*

- modifié : `CLAUDE.md`
- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/planning.ts`
- modifié : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/test/conformite-base.test.ts`
- modifié : `apps/api/test/stock.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- créé : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`292fe39`](https://github.com/Break-Eat-APP/flaix-expert/commit/292fe3901113c8d297cd808b95959985516550e3) — Stock, serveur : réserve centrale, livraisons au CUMP, inventaires, mise en place, réassort, comptage ; étape Restes de la clôture (dossier §15.105) *(phase 10)*

- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/stock.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/clotures.test.ts`
- créé : `apps/api/test/stock.test.ts`
- créé : `db/migrations/0008_stock.sql`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/stock.test.ts`
- créé : `packages/domain/src/stock.ts`

### [`d8163c3`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8163c3ae7c7d8dc902a0343e61d41069b3c8807) — Dossier §15.105 : conception de la première version du Stock en production *(phase 10)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`3509f19`](https://github.com/Break-Eat-APP/flaix-expert/commit/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde) — Équipe : fiches, planning avec frise horaire, masse salariale ; personnel dans Résultats (dossier §15.104) *(phase 9)*

- modifié : `apps/web/src/pages/equipe/Equipe.tsx`
- créé : `apps/web/src/pages/equipe/Planning.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/planning.test.ts`
- modifié : `packages/domain/src/planning.ts`

### [`bbf7f4b`](https://github.com/Break-Eat-APP/flaix-expert/commit/bbf7f4b05168d8a41c7df7eae0341107a52da5f9) — Équipe, serveur : fiches employés avec accès caisse, planning prévu/réel, masse salariale, personnel dans Résultats (dossier §15.104) *(phase 9)*

- modifié : `apps/api/src/erreurs.ts`
- modifié : `apps/api/src/routes/equipe.ts`
- créé : `apps/api/src/routes/planning.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/equipe.test.ts`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- créé : `db/migrations/0007_equipe_planning.sql`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/planning.test.ts`
- créé : `packages/domain/src/planning.ts`

### [`40c3f7b`](https://github.com/Break-Eat-APP/flaix-expert/commit/40c3f7bf6313745264d25bffd53c8e512e445054) — Dossier §15.104 : conception d'Équipe (fiches, planning, masse salariale) *(phase 9)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`d3194ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3194ab2b67f34b45515cd6ef005c9494c72cb34) — Résultats : 5 onglets sur les vraies ventes, comparaison au choix, coût manquant (dossier §15.103) *(phase 8)*

- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/web/src/main.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/resultats/Tableaux.tsx`
- créé : `apps/web/src/pages/resultats/graphiques.tsx`
- créé : `apps/web/src/resultats.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/modele.ts`

### [`d29e769`](https://github.com/Break-Eat-APP/flaix-expert/commit/d29e769b04006130ef9260ed5ac5a4e52015c7b2) — Résultats, serveur : chiffres du match, comparaison, coût manquant, alertes (dossier §15.103) *(phase 8)*

- créé : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/resultats.test.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/resultats.test.ts`
- créé : `packages/domain/src/resultats.ts`

### [`d0985d1`](https://github.com/Break-Eat-APP/flaix-expert/commit/d0985d1d0d9e4401daf162b3691e0a8bbf64d93d) — Dossier §15.103 : conception des tableaux de Résultats sur les vraies ventes *(phase 8)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`d3670c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3670c65e032f1ade82ea7d9a05cca551a05b109) — Clôture du match : assistant en 4 étapes, comptage des tiroirs par coupure, rectification (dossier §15.102) *(phase 7)*

- modifié : `apps/web/src/pages/clotures/Clotures.tsx`
- modifié : `apps/web/src/pages/parametres/Identite.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`3398ccb`](https://github.com/Break-Eat-APP/flaix-expert/commit/3398ccba3c5083fffb474060fadbd64679b93441) — Clôture du match, serveur : Z du tiroir par coupure, rectification signée, clôture du match exigeant chaque Z (dossier §15.102) *(phase 7)*

- créé : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/caisse.test.ts`
- créé : `apps/api/test/clotures.test.ts`
- modifié : `apps/api/test/conformite-base.test.ts`
- créé : `db/migrations/0006_comptage_especes.sql`
- créé : `packages/domain/src/especes.test.ts`
- créé : `packages/domain/src/especes.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`c8e6246`](https://github.com/Break-Eat-APP/flaix-expert/commit/c8e624655779c4a12c57e9dd2fbac1e91a3a6015) — Dossier §15.102 : conception de l'assistant de clôture du match *(phase 7)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`911d4b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/911d4b3b22ad6e2d31206d2b1c653d4e3565111f) — Ticket client sur demande : édition par le directeur, duplicata numéroté et journalisé (dossier §15.101) *(phase 6)*

- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/test/caissieres.test.ts`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- créé : `apps/web/src/pages/caisse/TicketClient.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`9324475`](https://github.com/Break-Eat-APP/flaix-expert/commit/9324475237b4721e3a80c10b517659e1a3a30f59) — Comptes des caissières : écrans (tablette, poste de caisse, Équipe) et déconnexion corrigée *(phase 5)*

- modifié : `CLAUDE.md`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/Connexion.tsx`
- créé : `apps/web/src/pages/ConnexionCaissiere.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- créé : `apps/web/src/pages/caisse/PosteCaissiere.tsx`
- créé : `apps/web/src/pages/equipe/Equipe.tsx`
- modifié : `apps/web/src/session.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/journal-technique.ts`

### [`9253115`](https://github.com/Break-Eat-APP/flaix-expert/commit/92531158323017d891cde1de21856af2f3ddd672) — Comptes des caissières et tablettes enregistrées : base, serveur et tests (dossier §15.100) *(phase 5)*

- créé : `apps/api/src/auth/appareil.ts`
- modifié : `apps/api/src/auth/contexte.ts`
- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/erreurs.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- créé : `apps/api/src/routes/equipe.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/api.test.ts`
- créé : `apps/api/test/caissieres.test.ts`
- modifié : `apps/api/test/tablette.ts`
- créé : `db/migrations/0005_caissieres_et_tablettes.sql`
- modifié : `packages/domain/src/caisse-scellee.test.ts`
- modifié : `packages/domain/src/caisse-scellee.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`3f03ee8`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f03ee810aba01f1df5ca9c205f9b797ea37829d) — Dossier §15.100 : conception des comptes des caissières et des tablettes enregistrées *(phase 5)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`d51b910`](https://github.com/Break-Eat-APP/flaix-expert/commit/d51b910bfd4c17aa9b75ce8476936e8dfff70136) — Dossier §15.99 : ticket sur demande, comptes des caissières, ordre des modules restants *(phase 5)*

- créé : `docs/avancement.md`
- modifié : `docs/decisions-architecture-production.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/questions-expert-comptable.md`

## 2026-09-29

### [`ef7c9fa`](https://github.com/Break-Eat-APP/flaix-expert/commit/ef7c9fa97f461831a4b39359294ce9e8cc3b1417) — Serveur de test OVH en service : scripts d'installation et guide mis à jour *(phase 4)*

- modifié : `docs/guide-serveur-test-ovh.md`
- créé : `infra/vps/deployer.sh`
- créé : `infra/vps/flaix-admin.sh`
- créé : `infra/vps/installer-socle.sh`
- créé : `infra/vps/montee-debian.sh`
- créé : `infra/vps/securiser.sh`

### [`249f3f5`](https://github.com/Break-Eat-APP/flaix-expert/commit/249f3f515fcf3fb18838b3fa7da93a25c8bd64d2) — Serveur derrière un relais https : adresse réelle du visiteur (RELAIS_DE_CONFIANCE) *(phase 4)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/serveur.ts`

### [`c3c6168`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3c616893e44194563a4b7cdca5c11ce674c18db) — Maquette v2.2 : assistant IA en lecture seule (dossier §15.98) *(phase 2)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/maquettes/organisation-v2.html`

### [`6fb5840`](https://github.com/Break-Eat-APP/flaix-expert/commit/6fb584066acdbb07aba1202a849e6d8355ca6eb2) — Vente sans réseau : la tablette scelle, le serveur vérifie (dossier §15.97) *(phase 3)*

- modifié : `CLAUDE.md`
- modifié : `apps/api/src/journal-caisse.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/test/caisse.test.ts`
- créé : `apps/api/test/tablette.ts`
- créé : `apps/web/public/sw.js`
- modifié : `apps/web/src/main.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- créé : `apps/web/src/pages/caisse/memoire.ts`
- modifié : `apps/web/src/session.tsx`
- créé : `db/migrations/0004_vente_sans_reseau.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `docs/guide-serveur-test-ovh.md`
- créé : `packages/domain/src/caisse-scellee.test.ts`
- créé : `packages/domain/src/caisse-scellee.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`6f272dd`](https://github.com/Break-Eat-APP/flaix-expert/commit/6f272ddafe23fd7a7aadc1863c7f2e69675e49d7) — Organisation en 6 entrées appliquée à la version test *(phase 2)*

- modifié : `CLAUDE.md`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/composants/communs.tsx`
- supprimé : `apps/web/src/pages/Demarrage.tsx`
- créé : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/caisse/MesCaisses.tsx`
- créé : `apps/web/src/pages/clotures/Clotures.tsx`
- renommé : `apps/web/src/pages/parametres/Identite.tsx`
- renommé : `apps/web/src/pages/parametres/JournalTechnique.tsx`
- créé : `apps/web/src/pages/parametres/Parametres.tsx`
- renommé : `apps/web/src/pages/parametres/Produits.tsx`
- renommé : `apps/web/src/pages/parametres/Saison.tsx`
- renommé : `apps/web/src/pages/parametres/StandsCaisses.tsx`
- modifié : `apps/web/src/styles.css`
- modifié : `docs/decisions-architecture-production.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`0219e7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/0219e7e9bc8049916b4296e348f738e4c586ac9d) — Vente sans réseau décidée, gobelets en option, facture électronique et module Factures proposé *(phase 2)*

- modifié : `docs/decisions-architecture-production.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/questions-expert-comptable.md`

### [`26237fc`](https://github.com/Break-Eat-APP/flaix-expert/commit/26237fc761668dc3febbef1056001ddf8b472018) — Dossier §15.95 : réponses de Rémi, réseau de la caisse, tour des logiciels de stades *(phase 2)*

- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`0ef6cf1`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ef6cf1642dc15da9025d83ffadf1499006a4072) — Maquette v2.1 : graphiques de Résultats modernisés, Lexique supprimé, avis consigné *(phase 2)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/maquettes/organisation-v2.html`

### [`9c7d7a9`](https://github.com/Break-Eat-APP/flaix-expert/commit/9c7d7a9cfac6576334b90a7f9fa4c400247d340b) — Retour de démonstration : encaissement sur le TPE du lieu, proposition de réorganisation *(phase 2)*

- modifié : `CLAUDE.md`
- modifié : `docs/decisions-architecture-production.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `docs/maquettes/organisation-v2.html`
- modifié : `docs/questions-expert-comptable.md`

### [`f454873`](https://github.com/Break-Eat-APP/flaix-expert/commit/f454873fd886775f86e40826d636a9643993d65e) — Étape 1 de la version test : matchs, Ma caisse, Mes caisses, journal des tickets *(phase 1)*

- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/config.ts`
- créé : `apps/api/src/journal-caisse.ts`
- créé : `apps/api/src/routes/caisse.ts`
- créé : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/routes/stands.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/caisse.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/Demarrage.tsx`
- créé : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- créé : `apps/web/src/pages/caisse/MesCaisses.tsx`
- modifié : `apps/web/src/pages/configuration/Identite.tsx`
- créé : `apps/web/src/pages/configuration/Matchs.tsx`
- modifié : `apps/web/src/pages/configuration/Produits.tsx`
- modifié : `apps/web/src/pages/conformite/JournalTechnique.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0003_matchs_et_caisse.sql`
- modifié : `docs/decisions-architecture-production.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/journal-caisse.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/ticket.test.ts`
- créé : `packages/domain/src/ticket.ts`

### [`40693c8`](https://github.com/Break-Eat-APP/flaix-expert/commit/40693c85ae0183bd8cf90613fa503abaf344461d) — Garde-fou d'envoi : FlaiX Expert ne part que vers son propre dépôt *(phase 0)*

- créé : `.githooks/pre-push`
- modifié : `README.md`

### [`4a205cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a205cb70382af4b1ae34c55e3f86c529ef714f0) — Socle de production FlaiX Expert et configuration d'un lieu vide *(phase 0)*

- créé : `.claude/launch.json`
- créé : `.gitattributes`
- créé : `.gitignore`
- créé : `CLAUDE.md`
- créé : `README.md`
- créé : `apps/api/package.json`
- créé : `apps/api/src/auth/contexte.ts`
- créé : `apps/api/src/auth/routes.ts`
- créé : `apps/api/src/auth/secrets.ts`
- créé : `apps/api/src/base.ts`
- créé : `apps/api/src/config.ts`
- créé : `apps/api/src/erreurs.ts`
- créé : `apps/api/src/index.ts`
- créé : `apps/api/src/journal-technique.ts`
- créé : `apps/api/src/outils/cli.ts`
- créé : `apps/api/src/outils/migrations.ts`
- créé : `apps/api/src/outils/migrer.ts`
- créé : `apps/api/src/outils/reinitialiser-base-dev.ts`
- créé : `apps/api/src/routes/journal.ts`
- créé : `apps/api/src/routes/lieu.ts`
- créé : `apps/api/src/routes/outils.ts`
- créé : `apps/api/src/routes/produits.ts`
- créé : `apps/api/src/routes/stands.ts`
- créé : `apps/api/src/serveur.ts`
- créé : `apps/api/test/aide.ts`
- créé : `apps/api/test/api.test.ts`
- créé : `apps/api/test/conformite-base.test.ts`
- créé : `apps/api/test/preparation-base.ts`
- créé : `apps/api/tsconfig.json`
- créé : `apps/api/vitest.config.ts`
- créé : `apps/web/index.html`
- créé : `apps/web/package.json`
- créé : `apps/web/src/App.tsx`
- créé : `apps/web/src/api.ts`
- créé : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/composants/communs.tsx`
- créé : `apps/web/src/main.tsx`
- créé : `apps/web/src/pages/Compte.tsx`
- créé : `apps/web/src/pages/Connexion.tsx`
- créé : `apps/web/src/pages/Demarrage.tsx`
- créé : `apps/web/src/pages/configuration/Identite.tsx`
- créé : `apps/web/src/pages/configuration/Produits.tsx`
- créé : `apps/web/src/pages/configuration/StandsCaisses.tsx`
- créé : `apps/web/src/pages/conformite/JournalTechnique.tsx`
- créé : `apps/web/src/session.tsx`
- créé : `apps/web/src/styles.css`
- créé : `apps/web/tsconfig.json`
- créé : `apps/web/vite.config.ts`
- créé : `db/migrations/0001_socle.sql`
- créé : `db/migrations/0002_configuration_lieu.sql`
- créé : `docs/cadrage/flex-expert-perimetre.md`
- créé : `docs/cadrage/flex-expert-test-terrain.md`
- créé : `docs/decisions-architecture-production.md`
- créé : `docs/flaix-brief-production-claude-code.md`
- créé : `docs/flaix-gestion-dossier-projet.md`
- créé : `docs/questions-expert-comptable.md`
- créé : `docs/reference/flaix-gestion-final.html`
- créé : `infra/docker-compose.yml`
- créé : `infra/postgres/init/01-bases.sql`
- créé : `package.json`
- créé : `packages/domain/package.json`
- créé : `packages/domain/src/argent.test.ts`
- créé : `packages/domain/src/argent.ts`
- créé : `packages/domain/src/chaine.test.ts`
- créé : `packages/domain/src/chaine.ts`
- créé : `packages/domain/src/index.ts`
- créé : `packages/domain/src/journal-technique.ts`
- créé : `packages/domain/src/marge.ts`
- créé : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/tva-marge.test.ts`
- créé : `packages/domain/src/tva.ts`
- créé : `packages/domain/tsconfig.json`
- créé : `pnpm-lock.yaml`
- créé : `pnpm-workspace.yaml`
- créé : `tsconfig.base.json`
