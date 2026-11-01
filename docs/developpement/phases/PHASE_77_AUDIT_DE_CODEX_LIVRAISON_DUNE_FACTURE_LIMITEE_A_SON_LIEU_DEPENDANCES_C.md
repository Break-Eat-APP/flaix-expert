# Phase 77 — Audit de Codex : livraison d'une facture limitée à son lieu, dépendances corrigées

> FlaiX Expert · dossier de développement · généré le 2026-11-01 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-01 |
| Décision | dossier projet §15.176 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.176 Audit de Codex du 2026-10-26 : les deux points bloquants corrigés (2026-11-01)

**Contexte** : rapport indépendant `docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.md` (commit audité `050b9bc`).
Rémi, le 2026-11-01 : « ok » pour corriger d'abord les deux points bloquants, avant la lecture des factures PDF.

**Corrigé** :
- **P1-1 — isolement des lieux** (vérifié dans le code avant correction) : `PUT /api/factures/:id/lignes/:ligneId/livraison`
  acceptait tout identifiant, et `livraison_id` ne référençait que `stock_mouvement (id)`. La route exige désormais une
  **livraison du lieu et du produit de la ligne** (même réponse 404 sinon, rien ne révèle ce qui existe ailleurs) ;
  migration 0059 : clé étrangère composée `(lieu_id, livraison_id)`. Si des lignes déjà enregistrées pointaient ailleurs,
  la clé resterait « non validée » avec un avertissement, sans toucher aux factures figées. Test
  `facture-livraison-lieu.test.ts` (3, dont 2 [F] : la route, puis la base attaquée directement).
- **P1-2 — dépendances** : `zod` 4.6.7 (faille haute : épuisement de la mémoire), `fastify` 5.12.7, `@fastify/rate-limit`
  11.2.1, `fast-uri` et `ip-address` à leurs versions corrigées. `pnpm audit --prod` : plus aucune alerte.

**Restent ouverts** (points 10 et 20 de `docs/points-a-revoir.md`) : P2-1 auteur de l'annulation d'un import, fourni à la fonction
au lieu d'être lu dans la session ; P2-2 relances wallet sans réservation atomique ; P2-3 recette Apple et Google réelle ;
P3-1 somme des lignes d'un événement privé au-delà de 100 000 unités ; P3-2 compteur de ventes d'une caisse externe ; P3-3
export du comptable entièrement en mémoire.

## 2. Ce qui a été construit — commits

- [`dca4c8f`](https://github.com/Break-Eat-APP/flaix-expert/commit/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad) — 2026-11-01 — Audit Codex (P1) : livraison d'une facture limitée à son lieu et son produit ; dépendances corrigées (§15.176)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0059_livraison_facture_du_lieu.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/db/migrations/0059_livraison_facture_du_lieu.sql)

### Tests

- `apps/api/test/facture-livraison-lieu.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/apps/api/test/facture-livraison-lieu.test.ts)

### Serveur (apps/api)

- `apps/api/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/apps/api/package.json)
- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/apps/api/src/routes/factures.ts)

### Documentation

- `docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/dca4c8fd30c535d1dcda32289bf075c9fa2a8fad/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/api/test/facture-livraison-lieu.test.ts`

- **rapprochement d'une ligne de facture**
  - [F] livraison d'un autre lieu, mouvement qui n'est pas une livraison, autre produit : refusés, rien n'est écrit
  - [F] même écrite directement par l'application, la livraison d'un autre lieu est refusée par la base
  - une livraison du lieu et du même produit se relie ; le retour à l'automatique reste possible

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/facture-livraison-lieu.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
