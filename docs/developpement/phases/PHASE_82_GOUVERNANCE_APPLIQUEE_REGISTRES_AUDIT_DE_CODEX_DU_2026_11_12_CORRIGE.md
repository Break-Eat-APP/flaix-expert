# Phase 82 — Gouvernance appliquée (registres) ; audit de Codex du 2026-11-12 corrigé

> FlaiX Expert · dossier de développement · généré le 2026-11-16 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.181 |
| État | livrée, tests au vert au moment du commit |
| Commits | 7 |

## 1. Ce qui a été décidé, et pourquoi

### 15.181 Gouvernance appliquée ; audit de Codex du 2026-11-12 corrigé (2026-11-12)

**Contexte** : Rémi a remis sa gouvernance (2026-11-11), adaptée à FlaiX Expert (`docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md`,
2026-11-12). Le 2026-11-12 : « à partir de maintenant, tu vas mettre à jour les documents à chaque fois que tu développes du
code […] et oui, tu peux lancer » (registre des bugs, correction des points de Codex, documents manquants). Rapport :
`docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md` (aucun P1 ; six P2, trois P3).

**Ce qui est fait** :
- Registres de la gouvernance : `BUGS_ET_INCIDENTS.md` (BUG-2026-001 à 020 : corrigés depuis le 2026-10-26, puis points de
  Codex), `SECURITE.md`, `TESTS.md`, `MISE_EN_LIGNE.md`, `.env.example` (noms et rôles des variables, aucune valeur).
- BUG-2026-015 : ligne de facture → ingrédient bornée à la saisie et à la validation (message lisible).
- BUG-2026-016 : avoir Montaner Pietrini refusé par la lecture automatique, avec la raison ; `FacturePdfLue.refus`.
- BUG-2026-020 : migration 0063, recettes réellement ajoutées comptées par la copie de catalogue.
- BUG-2026-012 : total HT lu dans le fichier Excel/CSV (`LectureFacture.totalHt`), reporté à l'écran, contrôle dit.
- BUG-2026-013 : feuille d'un classeur choisie avec les règles d'une facture (`lireFichierVentes(…, "facture")`), choix de
  la feuille à l'écran Factures.
- BUG-2026-019 : colonne « Col/Pack » reconnue.
- BUG-2026-014 : écart d'arrondi colis → unités calculé (`ecartArrondiUnites`) et inscrit au journal de la validation.

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Lecteur PDF (avoir refusé) | `vitest run src/factures-pdf.test.ts` (domaine) | 7 réussis |
| Import Excel/CSV (total, Col/Pack, arrondi) | `vitest run src/factures-import.test.ts` (domaine) | 8 réussis |
| Classeur à trois feuilles, écran Factures | `vitest run src/pages/caisses-connectees src/pages/factures` (écran) | 11 réussis |
| Factures, réserve, ingrédients, livraison du lieu, copie, export, formation | `vitest run test/<fichier>.test.ts --pool=forks --maxWorkers=1` (serveur, un par un) | 8 + 5 + 4 + 3 + 3 + 2 + 2 réussis |
| Vraies factures (hors dépôt) | script local pdf.js + lecteur | 4 511,74 € ; 7 297,65 € ; 3 831,61 € retombent juste |
| Types | `tsc --noEmit` (domaine, serveur, écran) | sans erreur |

Le premier passage de `catalogue-copie` a montré « 3 ignorés » (base de test en cours de migration) ; relancé seul : 3 réussis.

**Risques restants** : BUG-2026-014, règle à valider (écart de quelques centimes tracé, ou deux mouvements par ligne) ;
BUG-2026-017 recette Wallet réelle ; BUG-2026-018 PDF réels dans les tests. Règle métier à confirmer par Rémi : la réserve
ne bouge qu'à la validation de la facture (case « entrer en réserve »), pas au dépôt.

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne sur le serveur de test (migration 0063 : remplace une
fonction, aucune donnée touchée) ; retour arrière = remettre le commit précédent, la fonction de 0063 reste (sans effet sur
les données).

## 2. Ce qui a été construit — commits

- [`c4c1540`](https://github.com/Break-Eat-APP/flaix-expert/commit/c4c1540f8cf12d3340388e582cf3d04166c9f6fa) — 2026-11-12 — Gouvernance du développement de FlaiX Expert (docs/gouvernance/) : la gouvernance de Rémi du 2026-11-11 adaptée à FlaiX Expert — mêmes règles et même structure, ventes, caisse, journaux et conformité ; correspondance avec la documentation existante ; citée par CLAUDE.md, AGENTS.md et le sommaire ; version Word
- [`d9483cf`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9483cfb4a0d2e2ea86ac96827f09acede224df9) — 2026-11-12 — Registre des bugs et incidents (gouvernance § 9) : bugs corrigés depuis le 2026-10-26 et points ouverts de l'audit Codex du 2026-11-12 (rapport ajouté)
- [`d54be5a`](https://github.com/Break-Eat-APP/flaix-expert/commit/d54be5a3b1f5b344c6f652165f090fe57d0ab3be) — 2026-11-12 — Audit Codex 2026-11-12 : lignes d'ingrédient bornées dès la saisie (BUG-2026-015), avoir Montaner Pietrini refusé avec la raison (BUG-2026-016), copie de catalogue : recettes réellement ajoutées comptées (BUG-2026-020, migration 0063)
- [`f25f529`](https://github.com/Break-Eat-APP/flaix-expert/commit/f25f529e74d6983de9df153293e37022f0b105dc) — 2026-11-12 — Audit Codex 2026-11-12 : total HT lu dans le fichier Excel/CSV et contrôlé (BUG-2026-012), feuille de facture choisie avec les règles d'une facture et choix de la feuille à l'écran (BUG-2026-013), colonne « Col/Pack » reconnue (BUG-2026-019)
- [`04780c0`](https://github.com/Break-Eat-APP/flaix-expert/commit/04780c07ec93fcd7722d2c526fba2684e73800da) — 2026-11-12 — Audit Codex 2026-11-12 : écart d'arrondi colis → unités calculé et inscrit au journal de la validation (BUG-2026-014)
- [`a7d63d0`](https://github.com/Break-Eat-APP/flaix-expert/commit/a7d63d09e5398850cc9f8ec01f8b6fd7980f77f9) — 2026-11-12 — Dossier : gouvernance appliquée, registres (sécurité, tests, mise en ligne, .env.example), audit Codex du 2026-11-12 corrigé et suivi (§15.181, phase 82)
- [`387f2a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/387f2a686756f73467db5b3e2860e5571af4ffef) — 2026-11-12 — Dossier : date corrigée (2026-11-12, pas 2026-11-13) dans les documents du jour

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0063_copie_catalogue_compte_recettes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/db/migrations/0063_copie_catalogue_compte_recettes.sql)

### Tests

- `apps/api/test/catalogue-copie.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/api/test/catalogue-copie.test.ts)
- `apps/api/test/facture-ingredient.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/api/test/facture-ingredient.test.ts)
- `apps/web/src/pages/caisses-connectees/fichiers.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/web/src/pages/caisses-connectees/fichiers.test.ts)
- `packages/domain/src/factures-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/packages/domain/src/factures-import.test.ts)
- `packages/domain/src/factures-pdf.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/packages/domain/src/factures-pdf.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/packages/domain/src/factures-import.ts)
- `packages/domain/src/factures-pdf.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/packages/domain/src/factures-pdf.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/api/src/routes/factures.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/fichiers.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/web/src/pages/caisses-connectees/fichiers.ts)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/apps/web/src/pages/factures/Factures.tsx)

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/infra/outils/carte-du-code-intro.md)
- `infra/outils/guide-word.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/infra/outils/guide-word.cjs)
- `infra/outils/phases.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/infra/outils/phases.cjs)

### Documentation

- `AGENTS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/AGENTS.md)
- `CHANGELOG.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/CHANGELOG.md)
- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/CLAUDE.md)
- `docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.docx)
- `docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/avancement.md)
- `docs/developpement/CARTE_DU_CODE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/GUIDE_DE_REPRISE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/GUIDE_DE_REPRISE.docx)
- `docs/developpement/GUIDE_DE_REPRISE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/GUIDE_DE_REPRISE.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/developpement/phases/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.md)
- `docs/developpement/phases/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.md)
- `docs/developpement/phases/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.md)
- `docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md)
- `docs/developpement/phases/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.md)
- `docs/developpement/phases/PHASE_82_GOUVERNANCE_APPLIQUEE_REGISTRES_AUDIT_DE_CODEX_DU_2026_11_12_CORRIGE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/PHASE_82_GOUVERNANCE_APPLIQUEE_REGISTRES_AUDIT_DE_CODEX_DU_2026_11_12_CORRIGE.md)
- `docs/developpement/phases/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/README.md)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx)
- `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx)
- `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx)
- `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx)
- `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx)
- `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx)
- `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx)
- `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx)
- `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx)
- `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx)
- `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx)
- `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx)
- `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx)
- `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx)
- `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx)
- `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx)
- `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx)
- `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx)
- `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx)
- `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx)
- `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx)
- `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx)
- `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx)
- `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx)
- `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx)
- `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx)
- `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx)
- `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx)
- `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx)
- `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx)
- `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx)
- `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx)
- `docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx)
- `docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx)
- `docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx)
- `docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx)
- `docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx)
- `docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx)
- `docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx)
- `docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx)
- `docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx)
- `docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx)
- `docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx)
- `docs/developpement/phases/word/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_81_CATALOGUE_COPIE_DUN_LIEU_A_LAUTRE_DU_MEME_CLIENT_COMPOSER_UN_PRODUIT_S.docx)
- `docs/developpement/phases/word/PHASE_82_GOUVERNANCE_APPLIQUEE_REGISTRES_AUDIT_DE_CODEX_DU_2026_11_12_CORRIGE.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/developpement/phases/word/PHASE_82_GOUVERNANCE_APPLIQUEE_REGISTRES_AUDIT_DE_CODEX_DU_2026_11_12_CORRIGE.docx)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/flaix-gestion-dossier-projet.md)
- `docs/gouvernance/BUGS_ET_INCIDENTS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/BUGS_ET_INCIDENTS.md)
- `docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.docx)
- `docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md)
- `docs/gouvernance/MISE_EN_LIGNE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/MISE_EN_LIGNE.md)
- `docs/gouvernance/SECURITE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/SECURITE.md)
- `docs/gouvernance/TESTS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/gouvernance/TESTS.md)
- `docs/points-a-revoir.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/points-a-revoir.md)
- `docs/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/docs/README.md)

### Autres

- `.env.example` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/387f2a686756f73467db5b3e2860e5571af4ffef/.env.example)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
