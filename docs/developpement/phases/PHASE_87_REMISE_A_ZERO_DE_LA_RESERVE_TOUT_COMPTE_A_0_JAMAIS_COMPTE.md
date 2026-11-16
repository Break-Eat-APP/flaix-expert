# Phase 87 — Remise à zéro de la réserve : tout compté à 0 ; « jamais compté »

> FlaiX Expert · dossier de développement · généré le 2026-11-16 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-16 |
| Décision | dossier projet §15.186 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.186 Remise à zéro de la réserve : tout est compté à 0 ; « jamais compté » (2026-11-16)

**Contexte** : Rémi, capture de la réserve centrale (Hot-dog « non déclaré », 200 livrés, 200 sortis) : « ça veut dire quoi
non déclaré ? », puis « est-ce que, dans la version test, c'est possible d'avoir un bouton qui remet la réserve centrale à
zéro ? ». Le bouton existe (Stock › Remettre à zéro, §15.165), mais il ne comptait à 0 que les produits **au solde non nul** :
un produit déjà à 0 jamais compté restait « non déclaré » après la remise. Proposé, puis Rémi : « oui fais-le ».

**Ce qui est fait** :
- `apps/api/src/routes/stock.ts`, `POST /api/stock/remise-a-zero` : l'inventaire à 0 porte sur **tous** les produits actifs et
  ingrédients suivis, même déjà à 0. Le journal (`stock_remis_a_zero`) garde ce qui a été effacé (soldes non nuls) et ajoute
  le nombre d'articles comptés à 0. Le reste ne change pas (motif obligatoire, refus si un événement est ouvert, rien
  d'effacé, produits et tarifs intacts).
- Écran Stock, réserve centrale : « non déclaré » devient **« jamais compté »**, avec une bulle : « Ce produit n'a jamais été
  compté dans la réserve : son stock part de 0. Fais un inventaire de la réserve pour donner son stock de départ. »
- Écran de confirmation de la remise : « la réserve est comptée à 0 pour N produits et M ingrédients ».

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Remise à zéro (serveur) | `vitest run test/remise-zero.test.ts --pool=forks --maxWorkers=1` | 5 réussis : un produit jamais compté et à 0 est compté à 0 ; journal (Frites 80, 2 comptés) |
| Stock, ingrédients (serveur) | `vitest run test/stock.test.ts`, `test/stock-ingredients.test.ts` | 11 + 11 réussis |
| Écrans du stock | `vitest run src/pages/stock` | 3 réussis (message de confirmation mis à jour) |
| Types | `tsc --noEmit` (serveur, écran) | sans erreur |

À l'écran, en local : deux produits jamais comptés à 0 → après la remise, « 0 au 16/11/2026 » ; un produit ajouté ensuite →
« jamais compté », bulle d'explication.

**Risques restants** : aucun sur les données (un inventaire de plus, daté et journalisé).

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne ; retour arrière = commit précédent.

## 2. Ce qui a été construit — commits

- [`295423c`](https://github.com/Break-Eat-APP/flaix-expert/commit/295423ca78ee4a95572cdd64c0ed204a30fc325d) — 2026-11-16 — Stock : la remise à zéro compte à 0 tous les produits et ingrédients suivis, même déjà à 0 ; « non déclaré » devient « jamais compté », avec une explication (§15.186)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/remise-zero.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/295423ca78ee4a95572cdd64c0ed204a30fc325d/apps/api/test/remise-zero.test.ts)

### Serveur (apps/api)

- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/295423ca78ee4a95572cdd64c0ed204a30fc325d/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/pages/stock/RemiseAZero.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/295423ca78ee4a95572cdd64c0ed204a30fc325d/apps/web/src/pages/stock/RemiseAZero.test.tsx)
- `apps/web/src/pages/stock/RemiseAZero.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/295423ca78ee4a95572cdd64c0ed204a30fc325d/apps/web/src/pages/stock/RemiseAZero.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/295423ca78ee4a95572cdd64c0ed204a30fc325d/apps/web/src/pages/stock/Stock.tsx)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
