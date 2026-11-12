# Phase 82 — Gouvernance appliquée (registres) ; audit de Codex du 2026-11-12 corrigé

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.181 |
| État | livrée, tests au vert au moment du commit |
| Commits | 5 |

## 1. Ce qui a été décidé, et pourquoi

### 15.181 Gouvernance appliquée ; audit de Codex du 2026-11-12 corrigé (2026-11-13)

**Contexte** : Rémi a remis sa gouvernance (2026-11-11), adaptée à FlaiX Expert (`docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md`,
2026-11-12). Le 2026-11-13 : « à partir de maintenant, tu vas mettre à jour les documents à chaque fois que tu développes du
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

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0063_copie_catalogue_compte_recettes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/db/migrations/0063_copie_catalogue_compte_recettes.sql)

### Tests

- `apps/api/test/catalogue-copie.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/api/test/catalogue-copie.test.ts)
- `apps/api/test/facture-ingredient.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/api/test/facture-ingredient.test.ts)
- `apps/web/src/pages/caisses-connectees/fichiers.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/web/src/pages/caisses-connectees/fichiers.test.ts)
- `packages/domain/src/factures-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/packages/domain/src/factures-import.test.ts)
- `packages/domain/src/factures-pdf.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/packages/domain/src/factures-pdf.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/packages/domain/src/factures-import.ts)
- `packages/domain/src/factures-pdf.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/packages/domain/src/factures-pdf.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/api/src/routes/factures.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/fichiers.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/web/src/pages/caisses-connectees/fichiers.ts)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/apps/web/src/pages/factures/Factures.tsx)

### Serveur OVH et outils (infra)

- `infra/outils/guide-word.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/infra/outils/guide-word.cjs)

### Documentation

- `AGENTS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/AGENTS.md)
- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/CLAUDE.md)
- `docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.docx)
- `docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md)
- `docs/developpement/GUIDE_DE_REPRISE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/developpement/GUIDE_DE_REPRISE.docx)
- `docs/gouvernance/BUGS_ET_INCIDENTS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/gouvernance/BUGS_ET_INCIDENTS.md)
- `docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.docx)
- `docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/gouvernance/GOUVERNANCE_FLAIX_EXPERT.md)
- `docs/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04780c07ec93fcd7722d2c526fba2684e73800da/docs/README.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
