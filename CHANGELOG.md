# CHANGELOG — FlaiX Expert

> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git. Ne pas modifier à la main.
> Chaque entrée : date, commit (lien GitHub), message, fichiers créés ou modifiés. Le plus récent en premier. Phases : [docs/developpement/JOURNAL_DES_PHASES.md](docs/developpement/JOURNAL_DES_PHASES.md).

## 2026-10-05

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
