# Phase 42 — Comparaison des prix entre fournisseurs

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.141 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.141 Comparaison des prix entre fournisseurs (2026-10-05)

**Demande de Rémi** (2026-10-04 au soir) : *« comparaison des prix entre fournisseurs »*. C'est la partie restante du **module 5** (Marges & ratios, validé le 2026-09-11 ; choix de Rémi : « comparaison fournisseurs au prix unitaire, plus alerte de sur-conditionnement », §14 module 5 ; règle « un ingrédient s'achète par conditionnement », §4).

**Règles du prototype, reprises** : prix comparés **à l'unité** (la portion pour un produit, le kg, le litre ou la pièce pour un ingrédient), jamais au colis — sinon un fût de 50 L paraît toujours plus cher qu'un fût de 30 L ; le moins cher est marqué, les autres affichent leur écart en % ; **écoulement** = contenance d'un colis ÷ consommation moyenne par événement ; **alerte de sur-conditionnement** quand le moins cher à l'unité est un colis qui couvre **plus de 1,5 événement** de consommation (« sur un produit frais ou un fût entamé, ce qui reste peut coûter plus cher que l'économie faite à l'achat »).

**Ce que le logiciel réel sait, et ne sait pas** : le prototype avait un jeu de test d'achats avec leur conditionnement. Le logiciel a les **vraies livraisons** (Stock : produit ou ingrédient, quantité, prix, fournisseur, date), mais une livraison ne dit pas la taille d'un colis (10 fûts de 30 L arrivent comme 300 L). D'où :
- **Prix de chaque fournisseur** = prix unitaire de sa **dernière livraison** (produit : prix unitaire saisi ; ingrédient : prix total ÷ quantité). Les noms de fournisseurs se regroupent sans tenir compte des majuscules ni des espaces ; une livraison sans fournisseur compte sous « Fournisseur non précisé ».
- **Conditionnement** : se renseigne une fois par fournisseur et par article, dans le nouvel onglet (« fût », 30 L), modification journalisée. Sans conditionnement renseigné, l'écoulement s'affiche « — » et aucune alerte n'est donnée (jamais une taille devinée). Le formulaire de livraison de Stock ne change pas.
- **Consommation moyenne par événement** : moyenne sur les 5 derniers événements qui ont des ventes (un produit non vendu compte 0) ; pour un ingrédient suivi, sa consommation figée à la clôture (§15.125). Sans historique : « — ».
- **Où** : Stock → nouvel onglet **« Prix fournisseurs »** (extension additive ; les autres onglets ne changent pas). Les articles achetés chez au moins deux fournisseurs viennent d'abord ; un article à un seul fournisseur connu le dit (« rien à comparer »).
- Rien ne se corrige ici : le coût matière reste le CUMP de Stock, le prix de vente se règle dans Produits & prix.

**Réalisé le 2026-10-05** (migration 0032, moteur `fournisseurs.ts`, route `routes/fournisseurs.ts`, Stock → « Prix fournisseurs ») : un tableau par article (moins cher marqué, écart en %, colis, écoulement, dernier achat et nombre de livraisons), alerte de sur-conditionnement, colis renseigné en ligne (journalisé : `conditionnement_modifie`). **Tests** : moteur 5, serveur 3 (regroupement des noms, dernière livraison, colis qui couvre 1,5 puis 15 événements, refus).

## 2. Ce qui a été construit — commits

- [`cb5cb03`](https://github.com/Break-Eat-APP/flaix-expert/commit/cb5cb039544ae547d7f86b649da7a5af4e35f00c) — 2026-10-05 — Comparaison des prix entre fournisseurs (module 5, dossier §15.141)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0032_conditionnements_fournisseurs.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/db/migrations/0032_conditionnements_fournisseurs.sql)

### Tests

- `apps/api/test/fournisseurs.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/apps/api/test/fournisseurs.test.ts)
- `packages/domain/src/fournisseurs.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/packages/domain/src/fournisseurs.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/fournisseurs.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/packages/domain/src/fournisseurs.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/fournisseurs.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/apps/api/src/routes/fournisseurs.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/stock/PrixFournisseurs.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/apps/web/src/pages/stock/PrixFournisseurs.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/cb5cb039544ae547d7f86b649da7a5af4e35f00c/apps/web/src/pages/stock/Stock.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/fournisseurs.test.ts`

- **comparaison des prix entre fournisseurs (§15.141)**
  - prix de la dernière livraison chez chaque fournisseur, regroupés sans majuscules ni espaces ; +12 % chez le plus cher
  - colis renseigné : un carton de 24 couvre 1,5 événement (pas d'alerte) ; une palette de 240 couvre 15 événements → sur-conditionnement ; journalisé
  - [F] colis sans contenance refusé ; article d'un autre lieu introuvable

### `packages/domain/src/fournisseurs.test.ts`

- **comparaison des prix entre fournisseurs (module 5)**
  - exemple du prototype : 4,500 €/L chez le moins cher, 5,050 €/L chez l'autre → +12,2 % ; au litre, jamais au fût
  - le prix d'un fournisseur est celui de sa dernière livraison ; les noms se regroupent sans majuscules ni espaces
  - sur-conditionnement : le moins cher est un fût de 50 L pour 14 L bus par événement → couvre 3,6 événements, alerte
  - un seul fournisseur : rien à comparer, après les autres ; livraison sans fournisseur nommée comme telle
  - consommation moyenne : les événements sans vente comptent pour 0

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/fournisseurs.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/fournisseurs.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
