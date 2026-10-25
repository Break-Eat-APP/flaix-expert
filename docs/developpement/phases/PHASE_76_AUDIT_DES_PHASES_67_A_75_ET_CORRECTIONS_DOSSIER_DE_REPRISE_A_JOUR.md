# Phase 76 — Audit des phases 67 à 75 et corrections ; dossier de reprise à jour

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-25 |
| Décision | dossier projet §15.175 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.175 Audit des phases 67 à 75 ; corrections ; dossier de reprise à jour (2026-10-25)

**Demande de Rémi** (2026-10-25) : *« fais-moi une audite de tout ce que nous avons développé dernièrement et mets à jour
le dossier de développement. Si je suis un informaticien qui reprend le dossier, je dois savoir ce qui a été fait et
comment, les phases de développement, les explications et un dossier bien rangé. Une audite va être faite par Codex
derrière. »*

**Méthode** : relecture du code des phases 67 à 75 (§15.166 à §15.174), règle par règle du guide de reprise (§ 4),
bornes de la base, fichiers produits pour l'extérieur ; puis toute la suite de tests. Rapport :
`docs/audits/AUDIT_2026-10-25_claude-phases-67-75.md` (auto-revue, à recouper par Codex).

**Défauts trouvés et corrigés** (commit `0ff2657`, migration 0058) :
- **A1 — mode formation** : la famille des catégories (§15.171) et les correspondances fournisseurs (§15.173) ne se
  recopiaient pas dans le lieu de formation (règle n° 6 oubliée deux fois) ; la correction d'une correspondance
  manquait à la liste `CONFIGURATION`. Migration 0058 : `synchroniser_complements_formation` reprise de 0052 avec ces
  deux copies ; test `formation-complements.test.ts`.
- **A2** : validation d'une facture — quantité × colis au-delà de 100 000 unités (borne d'un mouvement de stock)
  refusée avec un message clair, au lieu d'une erreur de contrainte.
- **A3** : produit fabriqué (recette) écarté de l'entrée en réserve par la même règle à l'écran et au serveur
  (`produitFabrique`) ; avant, une facture faite de seuls produits fabriqués restait impossible à valider.
- **A4** : récapitulatif pour Excel — un texte saisi commençant par = + - @ précédé d'une apostrophe (injection de
  formule).
- **A5** : correspondance « désapprise » quand une ligne est remise sans produit ni colis.
- **A6** : export pour le comptable — pièces jointes bornées à 150 Mo (zip construit en mémoire).
- **A7** : onglet Événements privés de Résultats et case « faire entrer en réserve » selon les options du lieu.

**Restent ouverts** (quinze points, § 6 du rapport) : charge des écrans qui se rafraîchissent, logique des minutes de
personnel en double, correspondances apprises avant la validation, arrondi du prix ÷ colis, PDF à regarder sur un
premier export réel, seuils fixes, approximation de la mi-temps, lecture d'un classeur de facture à plusieurs
feuilles, test d'écran qui attend un délai, recherche de la 2e maquette non construite, environnement du poste.

**Dossier de développement mis à jour** : `GUIDE_DE_REPRISE.md` (phase 76, migration 0058, § 6 bis « ce qui a été
construit depuis la phase 66 » avec le chemin d'une facture de bout en bout, pièges du poste, glossaire) et sa version
Word ; `CARTE_DU_CODE.md` (modules et fonctions clés nouveaux, ligne exacte) ; `CODEX_AUDIT_PROMPT.md` (périmètre
phases 67 à 76 et quatre vérifications nouvelles : fichiers déposés, fichiers produits, écritures de stock, options) ;
`docs/README.md` (sommaire du dossier `docs/`) ; fiches de phase 67 à 76 régénérées en Markdown et en Word.

**Vu dans le navigateur** (local, 2026-10-25) : la vue d'ensemble de Résultats au design de la 2e maquette ; corrigé à
l'essai : le cercle décoratif de « Prochain match » passait par-dessus son bouton (`ee26b84`).

## 2. Ce qui a été construit — commits

- [`0ff2657`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ff265774c65cdde7f72d140c99b0eaaed28b3c6) — 2026-10-25 — Audit des phases 67 à 75 : corrections (§15.175)
- [`117a10d`](https://github.com/Break-Eat-APP/flaix-expert/commit/117a10d6b54087eba2d604665aa913c496274350) — 2026-10-25 — Audit des phases 67 à 75 : rapport, guide de reprise, carte du code, consigne Codex, sommaire de la documentation (§15.175)
- [`96c1e51`](https://github.com/Break-Eat-APP/flaix-expert/commit/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265) — 2026-10-25 — Audit : résultats des tests ; fiches de phase et versions Word régénérées

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0058_formation_famille_correspondances.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/db/migrations/0058_formation_famille_correspondances.sql)

### Tests

- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/api/test/facture-reserve.test.ts)
- `apps/api/test/formation-complements.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/api/test/formation-complements.test.ts)
- `packages/domain/src/factures.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/packages/domain/src/factures.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/packages/domain/src/factures.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/api/src/routes/factures.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/apps/web/src/pages/resultats/Tableaux.tsx)

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/infra/outils/carte-du-code-intro.md)
- `infra/outils/guide-word.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/infra/outils/guide-word.cjs)
- `infra/outils/journal-developpement.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/infra/outils/journal-developpement.cjs)
- `infra/outils/phases.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/infra/outils/phases.cjs)

### Documentation

- `CHANGELOG.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/CHANGELOG.md)
- `docs/audits/AUDIT_2026-10-25_claude-phases-67-75.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/audits/AUDIT_2026-10-25_claude-phases-67-75.docx)
- `docs/audits/AUDIT_2026-10-25_claude-phases-67-75.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/audits/AUDIT_2026-10-25_claude-phases-67-75.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/avancement.md)
- `docs/developpement/CARTE_DU_CODE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/CODEX_AUDIT_PROMPT.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/CODEX_AUDIT_PROMPT.md)
- `docs/developpement/GUIDE_DE_REPRISE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/GUIDE_DE_REPRISE.docx)
- `docs/developpement/GUIDE_DE_REPRISE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/GUIDE_DE_REPRISE.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md)
- `docs/developpement/phases/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.md)
- `docs/developpement/phases/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.md)
- `docs/developpement/phases/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.md)
- `docs/developpement/phases/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.md)
- `docs/developpement/phases/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/README.md)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx)
- `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx)
- `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx)
- `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx)
- `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx)
- `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx)
- `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx)
- `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx)
- `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx)
- `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx)
- `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx)
- `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx)
- `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx)
- `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx)
- `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx)
- `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx)
- `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx)
- `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx)
- `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx)
- `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx)
- `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx)
- `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx)
- `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx)
- `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx)
- `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx)
- `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx)
- `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx)
- `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx)
- `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx)
- `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx)
- `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx)
- `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx)
- `docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx)
- `docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx)
- `docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx)
- `docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx)
- `docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx)
- `docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx)
- `docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/flaix-gestion-dossier-projet.md)
- `docs/points-a-revoir.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/points-a-revoir.md)
- `docs/README.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/96c1e51e9c1b4b2d1125ac7bf39dd48eecb80265/docs/README.md)

## 4. Tests créés dans cette phase

### `apps/api/test/formation-complements.test.ts`

- **mode formation : famille et correspondances recopiées**
  - dans le lieu de formation : la famille de la catégorie, la correspondance vers le produit de la formation
  - [F] corriger une correspondance en formation : refusé, comme toute configuration

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/formation-complements.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
