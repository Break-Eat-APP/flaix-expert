# Phase 27 — Stock des ingrédients au choix (bière pression)

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-03 |
| Décision | dossier projet §15.125 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.125 Stock des ingrédients au choix — construit (2026-10-03)

Décision de Rémi (§15.124, point 6), premier cas : la bière pression. Migration `0023`.
- **Case « suivre » sur chaque ingrédient** (Paramètres → Produits & prix → Ingrédients), journalisée. Un ingrédient non coché sert seulement au coût des recettes.
- **Même cycle que les produits** (Stock → onglet **Ingrédients**), en kg, litres ou pièces (stockés en millièmes) : réserve (inventaire, livraisons), mise en place par stand avant l'ouverture, réassort pendant le match (« − » pour un retour), comptage de fin de match avec motif au-delà de 3 % du départ, inventaire de la réserve.
- **Consommé = Σ produits vendus × recette** (une pinte de 50 cl déduit 0,5 L du fût), lu en direct pendant le match, **figé à la clôture du match** (table `ingredient_consommation`) : une recette changée ensuite ne réécrit pas le passé.
- **Livraison au prix total HT** (« fût de 30 L à 90 € ») : le prix de l'ingrédient devient le coût moyen pondéré, et le coût des recettes qui l'utilisent est recalculé (journal : `ingredient_livre`).
- **Clôture du match** : un ingrédient mis en place ou réassorti doit être compté, comme un produit.
- Tout est en écriture seule (refus de la base testés) ; le lieu de formation recopie la case « suivre ».

## 2. Ce qui a été construit — commits

- [`f5a8b5a`](https://github.com/Break-Eat-APP/flaix-expert/commit/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9) — 2026-10-03 — Stock des ingrédients au choix (bière pression au litre) : réserve, mise en place, comptage, consommation figée à la clôture

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0023_stock_ingredients.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/db/migrations/0023_stock_ingredients.sql)

### Tests

- `apps/api/test/stock-ingredients.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/test/stock-ingredients.test.ts)
- `packages/domain/src/stock-ingredients.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/packages/domain/src/stock-ingredients.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/packages/domain/src/journal-technique.ts)
- `packages/domain/src/recettes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/packages/domain/src/recettes.ts)
- `packages/domain/src/stock-ingredients.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/packages/domain/src/stock-ingredients.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/recettes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/src/routes/recettes.ts)
- `apps/api/src/routes/stock-ingredients.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/src/routes/stock-ingredients.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/src/routes/stock.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Recettes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/web/src/pages/parametres/Recettes.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/pages/stock/StockIngredients.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/apps/web/src/pages/stock/StockIngredients.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/stock-ingredients.test.ts`

- **un ingrédient n'est suivi que si le directeur le décide**
  - non suivi : absent du stock, livraison refusée
  - case cochée : il apparaît au stand où se vend la pinte, journalisé
- **réserve : livraisons au prix total, coût moyen pondéré**
  - 2 fûts de 30 L à 180 € : 3,00 €/L ; puis 30 L à 102 € → (60 × 3,00 + 30 × 3,40) ÷ 90 = 3,13 €/L, la pinte suit
- **match 1 : la bière pression**
  - mise en place de 30 L au stand avant l'ouverture : la réserve descend à 60 L
  - 52 pintes vendues : 26 L consommés selon la recette, restant attendu 4 L
  - la clôture de l'événement exige le comptage du fût
  - fût vide en fin d'événement : −4 L, au-delà de 3 % du départ → motif exigé ; valorisé au prix moyen
  - événement clos : la consommation est figée, une recette changée ensuite ne réécrit pas le passé
  - [F] la base refuse de modifier ou supprimer un mouvement ou une consommation figée
- **événement suivant et inventaire**
  - reste 0 L reporté ; suggestion = consommation moyenne (26 L) − reste
  - inventaire de la réserve : calculé 90 − 30 − 26 = 34 L, compté 33,5 L → écart −0,5 L

### `packages/domain/src/stock-ingredients.test.ts`

- **stock des ingrédients**
  - saisie en unité d'achat, stockée en millièmes
  - affichage avec l'unité
  - fût de 30 L à 90 € : 3,00 €/L ; 4 L perdus valent 12 €
  - le coût moyen pondéré marche en millièmes : 10 L à 3,00 € + 30 L à 3,40 € → 3,30 €/L

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/stock-ingredients.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/stock-ingredients.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
