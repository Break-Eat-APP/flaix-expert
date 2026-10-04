# Phase 31 — Suivi du développement et préparation de l'audit Codex

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.128 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.128 Suivi du développement et préparation de l'audit Codex (2026-10-04)

Rémi : *« je vais faire faire un audit du code et des documents à Codex ; as-tu créé un dossier de développement de chaque phase, ligne de code, GitHub relié au document, comme avec Break Eat ? Le dossier de règles. »*
Mis en place, sur le modèle de Break Eat (`brain/`, `CHANGELOG.md`, audits par phase) :
- **`AGENTS.md`** (racine, lu automatiquement par Codex) : règles et invariants pour tous les outils d'IA, rôles (Claude Code construit, Codex audite sans modifier), commandes, format des rapports. `CLAUDE.md` et `README.md` mis à jour (éditeur Break Eat App, renvois).
- **`docs/developpement/JOURNAL_DES_PHASES.md`** : 31 phases (0 à 30), chacune avec sa section du dossier, ses commits (liens GitHub), ses migrations, son moteur, son serveur, ses écrans, ses tests.
- **`docs/developpement/CARTE_DU_CODE.md`** : où trouver quoi, et la **ligne exacte** des fonctions et routes clés (liens GitHub figés sur le commit).
- **`CHANGELOG.md`** : chaque commit, sa date, son lien GitHub, ses fichiers.
- **`docs/developpement/CODEX_AUDIT_PROMPT.md`** : le prompt à donner à Codex (audit complet ou d'une phase) ; rapports dans **`docs/audits/`**, défauts classés P1 / P2 / P3 avec fichier et ligne.
- **`docs/developpement/phases/`** (demande de Rémi : *« à faire pour le développeur »*) : **un document par phase**, en Markdown et en **Word** (`word/`, copie dans OneDrive « FlaixX Expert/phases de DEV ») — la décision complète (texte du dossier projet), les commits avec liens GitHub, les fichiers par couche, les cas de test créés, comment reprendre. Produit par `node infra/outils/phases-word.cjs` avec la bibliothèque `docx` (Word n'est pas nécessaire ; l'import HTML par Word restait bloqué).
- Le journal, le CHANGELOG et la carte sont **générés depuis Git** (`node infra/outils/journal-developpement.cjs`) : à relancer après chaque phase, ils ne peuvent pas diverger du code.

## 2. Ce qui a été construit — commits

- [`0b59036`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b590362a71a8549b053dcfb0e1a6ff474fd3d5e) — 2026-10-04 — Dossier de développement pour l'audit Codex : AGENTS.md, journal des phases, carte du code, CHANGELOG, prompt d'audit
- [`2859233`](https://github.com/Break-Eat-APP/flaix-expert/commit/2859233de0a1cd9bc6dd27b388e7f97fd32f575a) — 2026-10-04 — Journal des phases : phase 31 (suivi du développement)
- [`0c29f8f`](https://github.com/Break-Eat-APP/flaix-expert/commit/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc) — 2026-10-04 — Journal des phases : commits rattachés
- [`a23a7fb`](https://github.com/Break-Eat-APP/flaix-expert/commit/a23a7fb359ee3958deeb4b2d09c87f633f8f0006) — 2026-10-04 — Dossier de développement par phase pour le développeur : 32 documents Markdown et Word générés depuis Git

## 3. Fichiers, par couche

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/infra/outils/carte-du-code-intro.md)
- `infra/outils/journal-developpement.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/infra/outils/journal-developpement.cjs)
- `infra/outils/md-vers-docx.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/infra/outils/md-vers-docx.cjs)
- `infra/outils/phases-word.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/infra/outils/phases-word.cjs)
- `infra/outils/phases.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/infra/outils/phases.cjs)

### Documentation

- `AGENTS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/AGENTS.md)
- `CHANGELOG.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/CHANGELOG.md)
- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/CLAUDE.md)
- `docs/audits/AUDIT_2026-10-04_revue-code.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/audits/AUDIT_2026-10-04_revue-code.md)
- `docs/audits/README.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/audits/README.md)
- `docs/developpement/CARTE_DU_CODE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/CODEX_AUDIT_PROMPT.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/CODEX_AUDIT_PROMPT.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/developpement/phases/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.md)
- `docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md)
- `docs/developpement/phases/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.md)
- `docs/developpement/phases/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.md)
- `docs/developpement/phases/PHASE_04_SERVEUR_DE_TEST_OVH.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_04_SERVEUR_DE_TEST_OVH.md)
- `docs/developpement/phases/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.md)
- `docs/developpement/phases/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.md)
- `docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md)
- `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md)
- `docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md)
- `docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md)
- `docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md)
- `docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md)
- `docs/developpement/phases/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.md)
- `docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md)
- `docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md)
- `docs/developpement/phases/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.md)
- `docs/developpement/phases/PHASE_17_VUE_TELEPHONE_EN_DIRECT.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_17_VUE_TELEPHONE_EN_DIRECT.md)
- `docs/developpement/phases/PHASE_18_COUTS_PAR_BUVETTE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_18_COUTS_PAR_BUVETTE.md)
- `docs/developpement/phases/PHASE_19_FIDELITE_PARTIE_GESTION.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_19_FIDELITE_PARTIE_GESTION.md)
- `docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md)
- `docs/developpement/phases/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.md)
- `docs/developpement/phases/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.md)
- `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md)
- `docs/developpement/phases/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.md)
- `docs/developpement/phases/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.md)
- `docs/developpement/phases/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.md)
- `docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md)
- `docs/developpement/phases/PHASE_28_LOGO_OFFICIEL_V2.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_28_LOGO_OFFICIEL_V2.md)
- `docs/developpement/phases/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.md)
- `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md)
- `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md` — créé (n'existe plus)
- `docs/developpement/phases/README.md` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — créé (n'existe plus)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — créé (n'existe plus)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/docs/flaix-gestion-dossier-projet.md)
- `README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/README.md)

### Autres

- `package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/package.json)
- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a23a7fb359ee3958deeb4b2d09c87f633f8f0006/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
