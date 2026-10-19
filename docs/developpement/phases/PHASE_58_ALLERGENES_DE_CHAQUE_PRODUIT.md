# Phase 58 — Allergènes de chaque produit

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.157 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.157 Allergènes de chaque produit (2026-10-11)

**Demande de Rémi** (2026-10-11), sur la liste « pas encore fait » : *« fait »* (= à faire).

**Décisions** : les 14 allergènes réglementaires (règlement INCO n° 1169/2011, annexe II) se cochent dans la fiche de
chaque produit (aucun par défaut ; liste rangée dans l'ordre réglementaire ; chaque changement journalisé). Produits &
prix → **Allergènes** : tableau des produits en vente × 14 allergènes, à imprimer pour l'affichage à la buvette, avec un
avertissement pour les produits sans aucun allergène déclaré. Plus tard : allergènes hérités des ingrédients d'une
recette, affichage sur la caisse et au Click & Collect. Migration 0046. Tests : serveur 1, écran 2.

## 2. Ce qui a été construit — commits

- [`87e7fa5`](https://github.com/Break-Eat-APP/flaix-expert/commit/87e7fa596a0daa29f1e941594d128e4398c0cf0e) — 2026-10-11 — Allergènes de chaque produit (dossier §15.157)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0046_allergenes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/db/migrations/0046_allergenes.sql)

### Tests

- `apps/api/test/allergenes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/api/test/allergenes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/allergenes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/packages/domain/src/allergenes.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/api/src/routes/produits.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Allergenes.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/web/src/pages/parametres/Allergenes.test.tsx)
- `apps/web/src/pages/parametres/Allergenes.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/web/src/pages/parametres/Allergenes.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/87e7fa596a0daa29f1e941594d128e4398c0cf0e/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/allergenes.test.ts`

- **allergènes**
  - aucun par défaut ; liste rangée dans l'ordre réglementaire ; inconnu refusé ; journal

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/allergenes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
