# Phase 4 — Serveur de test OVH

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-29 |
| Décision | dossier projet guide-serveur-test-ovh.md |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

Pas de section propre dans le dossier projet (guide-serveur-test-ovh.md). Voir les commits ci-dessous.

## 2. Ce qui a été construit — commits

- [`249f3f5`](https://github.com/Break-Eat-APP/flaix-expert/commit/249f3f515fcf3fb18838b3fa7da93a25c8bd64d2) — 2026-09-29 — Serveur derrière un relais https : adresse réelle du visiteur (RELAIS_DE_CONFIANCE)
- [`ef7c9fa`](https://github.com/Break-Eat-APP/flaix-expert/commit/ef7c9fa97f461831a4b39359294ce9e8cc3b1417) — 2026-09-29 — Serveur de test OVH en service : scripts d'installation et guide mis à jour

## 3. Fichiers, par couche

### Serveur (apps/api)

- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/apps/api/src/config.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/apps/api/src/serveur.ts)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/infra/vps/flaix-admin.sh)
- `infra/vps/installer-socle.sh` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/infra/vps/installer-socle.sh)
- `infra/vps/montee-debian.sh` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/infra/vps/montee-debian.sh)
- `infra/vps/securiser.sh` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/infra/vps/securiser.sh)

### Documentation

- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ef7c9fa97f461831a4b39359294ce9e8cc3b1417/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
