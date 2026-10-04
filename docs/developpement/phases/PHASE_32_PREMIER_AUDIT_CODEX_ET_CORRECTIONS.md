# Phase 32 — Premier audit Codex et corrections

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.129 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.129 Premier audit Codex et corrections (2026-10-04)

Rémi a fait auditer le code et les documents par Codex (`docs/audits/AUDIT_2026-10-04_revue-code.md`, avec la réponse point par point). Retenu et corrigé : **P1-001** (une réservation de fidélité ne se consomme plus que si tout concorde : même caisse, non expirée à l'heure de la vente, mêmes abonné, points, montant ou code), **P2-002** (la masse salariale est fermée avec l'option « Planning & masse salariale » ; fiches, accès caisse et tablettes restent dans la base), **P2-004** (premiers tests des écrans : file d'envoi hors ligne, fidélité, menu), **P3-001** (documents générés en tout ou rien), **P3-002** (écrans du directeur chargés à la demande, la caisse reste dans le chargement principal). Non retenu, avec la raison : **P2-001** (l'export comptable est dans la base depuis la décision §15.124). Déjà réglé : **P2-003**.

## 2. Ce qui a été construit — commits

- [`4e289bd`](https://github.com/Break-Eat-APP/flaix-expert/commit/4e289bdbfab09ac9ed5a682ac58ec08c393ee586) — 2026-10-04 — Audit Codex : P1 réservation de fidélité vérifiée avant d'être consommée ; option équipe, tests des écrans, documents tout ou rien, chargement allégé

## 3. Fichiers, par couche

### Tests

- `apps/api/test/fidelite-caisse.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/api/test/fidelite-caisse.test.ts)
- `apps/api/test/options.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/api/test/options.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/src/composants/Coquille.test.ts)
- `apps/web/src/pages/caisse/memoire.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/src/pages/caisse/memoire.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/packages/domain/src/editeur.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/fidelite-caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/api/src/routes/fidelite-caisse.ts)

### Écrans (apps/web)

- `apps/web/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/package.json)
- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/caisse/FideliteCaisse.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/src/pages/caisse/FideliteCaisse.test.tsx)
- `apps/web/vitest.config.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/apps/web/vitest.config.ts)

### Serveur OVH et outils (infra)

- `infra/outils/phases-word.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/infra/outils/phases-word.cjs)

### Documentation

- `AGENTS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/AGENTS.md)
- `docs/audits/AUDIT_2026-10-04_revue-code.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/audits/AUDIT_2026-10-04_revue-code.md)
- `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md)
- `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md)
- `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/docs/flaix-gestion-dossier-projet.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4e289bdbfab09ac9ed5a682ac58ec08c393ee586/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/web/src/composants/Coquille.test.ts`

- **menu selon les options activées par FlaiX Expert**
  - toutes les options actives : les huit entrées
  - Stock, Fidélité et Factures désactivées : leurs entrées disparaissent, la base reste

### `apps/web/src/pages/caisse/memoire.test.ts`

- **la tablette garde chaque ticket avant de l'afficher encaissé**
  - trois ventes : mémorisées dans l'ordre, en attente d'envoi
  - [F] mémoire de la tablette pleine ou refusée : l'enregistrement échoue, la vente n'est PAS comptée encaissée
- **envoi au serveur**
  - le serveur confirme : la file se vide, dans l'ordre
  - réseau coupé : rien n'est retiré de la mémoire, la tablette se dit hors ligne
  - serveur injoignable derrière le relais (502) : traité comme une coupure
  - refus du serveur : le message s'affiche, le ticket reste en mémoire
  - session expirée (401) : la tablette demande une reconnexion, rien n'est perdu
  - une vente faite pendant l'envoi part au tour suivant, sans doublon
  - deux envois demandés en même temps : un seul part
  - 250 tickets après une longue coupure : envoyés par lots de 200, dans l'ordre

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
