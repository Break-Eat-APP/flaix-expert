# Phase 28 — Logo officiel v2

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-03 |
| Décision | dossier projet — |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

Pas de section propre dans le dossier projet (—). Voir les commits ci-dessous.

## 2. Ce qui a été construit — commits

- [`1259fb6`](https://github.com/Break-Eat-APP/flaix-expert/commit/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256) — 2026-10-03 — Logo officiel v2 (X en quatre traits) dans l'application

## 3. Fichiers, par couche

### Écrans (apps/web)

- `apps/web/src/assets/logo-clair.svg` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256/apps/web/src/assets/logo-clair.svg)
- `apps/web/src/assets/logo-sombre.svg` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256/apps/web/src/assets/logo-sombre.svg)

### Serveur OVH et outils (infra)

- `infra/outils/logo.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256/infra/outils/logo.cjs)

### Documentation

- `docs/marque/logo-expert-officiel.png` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256/docs/marque/logo-expert-officiel.png)
- `docs/marque/logo-expert-officiel.svg` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256/docs/marque/logo-expert-officiel.svg)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
