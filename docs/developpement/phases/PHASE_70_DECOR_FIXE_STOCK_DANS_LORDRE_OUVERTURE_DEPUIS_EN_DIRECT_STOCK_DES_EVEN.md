# Phase 70 — Décor fixe, stock dans l'ordre, ouverture depuis En direct, stock des événements privés, marge par catégorie

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-19 |
| Décision | dossier projet §15.169 |
| État | livrée, tests au vert au moment du commit |
| Commits | 5 |

## 1. Ce qui a été décidé, et pourquoi

### 15.169 Décor du lieu fixe, stock dans l'ordre, ouverture depuis En direct, stock des événements privés, marge par catégorie (2026-10-19)

**Questions de Rémi** (2026-10-19) : réserve centrale en premier dans le stock, étapes séparées, filtre par stand ;
*« pourquoi une TVA à 2,1 % ? »* ; stock des événements privés ; marge totale de chaque catégorie ; un chemin plus simple
pour ouvrir un événement ; puis *« produits seulement et tu peux enchaîner le développement des 5 points »* et *« j'ai
cru voir que l'enregistrement du schéma stade se remet à zéro… la patinoire reste la patinoire »*.

**Constats** : le filtre par stand existait déjà (Mise en place, Pendant l'événement, Comptage) ; le décor du lieu
n'était enregistré qu'avec « Enregistrer » à la fin de « Placer les stands » : quitter sans ce clic ramenait le stade ;
un événement privé ne sortait rien du stock ; aucune marge par catégorie.

**Décisions et réalisation** :
- **Décor fixe** : le décor s'enregistre dès qu'on le choisit (« ✓ Décor enregistré »), indépendamment du placement.
- **Stock** : onglets numérotés « 1. Réserve centrale · 2. Mise en place · 3. Pendant l'événement · 4. Comptage », puis
  Ingrédients et Prix fournisseurs ; une phrase en tête de chaque étape explique le chemin (réserve → stands → réassort →
  restes). La page s'ouvre sur la réserve, ou sur « Pendant l'événement » quand un événement est ouvert.
- **TVA à 2,1 %** (médicaments remboursés, presse, premières représentations de spectacles) : retirée des choix ;
  toujours acceptée, et proposée au produit qui l'a déjà.
- **Ouvrir l'événement depuis En direct** : bouton avec confirmation (« la mise en place sera figée »), en plus de
  l'ouverture par la première caisse et de Caisses. Pas d'ouverture automatique à l'heure prévue : elle figerait une
  mise en place peut-être inachevée.
- **Événements privés et stock** (choix de Rémi : produits seulement ; une seule réserve, celle du lieu) : à la clôture,
  chaque produit du catalogue sort de la **réserve centrale** ; un produit dont la recette utilise un ingrédient suivi
  sort ses ingrédients (une pinte sort 0,5 L du fût), pour ne rien retirer deux fois ; les lignes libres ne sortent rien.
  Mouvement « Événement privé » dans le journal des mouvements, rappel sur la fiche clôturée. Migration 0055 : type
  `evenement_prive` sur `stock_mouvement` et `ingredient_mouvement` (écriture seule, une fois par produit ou ingrédient,
  seulement après la clôture, vérifié par la base). Les événements privés clôturés avant cette version ne sortent rien.
- **Marge par catégorie** (Résultats › Marges) : vendus, CA HT, marge totale, marge %, cible commune, total ; le taux se
  calcule sur les produits dont le coût est saisi, les autres sont signalés « sans coût ».

**Tests** : moteur (taux proposés, marge par catégorie), serveur (sortie de stock d'un événement privé 3 ; événements
privés, stock, ingrédients, remise à zéro, conformité de la base relancés), écrans (En direct 6, stock, privés,
résultats 17) ; types et construction. Vu dans le navigateur en local : Stock et Marge par catégorie.

## 2. Ce qui a été construit — commits

- [`074b283`](https://github.com/Break-Eat-APP/flaix-expert/commit/074b283ae3a9fde1d8411b92289eff4ce5e71948) — 2026-10-19 — Lieu en 3D : le décor s'enregistre dès qu'on le choisit (§15.169)
- [`9a05031`](https://github.com/Break-Eat-APP/flaix-expert/commit/9a05031b459346df960660f5dcaca687b489e418) — 2026-10-19 — Stock : réserve centrale en premier et étapes expliquées ; TVA à 2,1 % retirée des choix (§15.169)
- [`47bddbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/47bddbf9e7b0928298b7dfb6f0d49b24cebdb383) — 2026-10-19 — En direct : ouvrir l'événement d'ici, après confirmation (§15.169)
- [`600c400`](https://github.com/Break-Eat-APP/flaix-expert/commit/600c4009e628aa1904f49a623979a1b2407c3e1b) — 2026-10-19 — Événement privé : ses produits sortent de la réserve centrale à la clôture (§15.169)
- [`61ad9fb`](https://github.com/Break-Eat-APP/flaix-expert/commit/61ad9fb0be474eec24bf32ef9adec9ee93409520) — 2026-10-19 — Résultats : marge par catégorie, avec total et cible (§15.169)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0055_sortie_stock_evenement_prive.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/db/migrations/0055_sortie_stock_evenement_prive.sql)

### Tests

- `apps/api/test/sortie-stock-prive.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/api/test/sortie-stock-prive.test.ts)
- `packages/domain/src/resultats.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/resultats.test.ts)
- `packages/domain/src/tva.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/tva.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/evenements-prives.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/modele.ts)
- `packages/domain/src/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/resultats.ts)
- `packages/domain/src/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/stock-ingredients.ts)
- `packages/domain/src/tva.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/packages/domain/src/tva.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/api/src/routes/evenements-prives.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/api/src/routes/stock-ingredients.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/pages/direct/EnDirect.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/parametres/ClickCollect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/parametres/ClickCollect.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/prives/EvenementPrive.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/prives/EvenementPrive.test.tsx)
- `apps/web/src/pages/prives/EvenementPrive.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/prives/EvenementPrive.tsx)
- `apps/web/src/pages/resultats/PlanStade.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/resultats/PlanStade.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/pages/stock/PrixFournisseurs.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/stock/PrixFournisseurs.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/pages/stock/StockIngredients.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/pages/stock/StockIngredients.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/61ad9fb0be474eec24bf32ef9adec9ee93409520/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `packages/domain/src/tva.test.ts`

- **taux de TVA proposés (§15.169)**
  - sans le 2,1 %, sauf pour le produit qui l'a déjà ; il reste un taux valable

### `apps/api/test/sortie-stock-prive.test.ts`

- **événement privé : sortie de la réserve centrale à la clôture**
  - rien ne sort avant la clôture, ni à la main
  - clôture : 12 canettes et 15 L de fût sortent ; la pinte ne sort pas en produit ; la location rien
  - une seule sortie par produit et par événement privé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/tva.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/sortie-stock-prive.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
