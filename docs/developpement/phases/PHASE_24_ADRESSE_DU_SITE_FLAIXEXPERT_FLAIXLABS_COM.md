# Phase 24 — Adresse du site flaixexpert.flaixlabs.com

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-02 |
| Décision | dossier projet §15.120 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.120 Adresse du site : flaixexpert.flaixlabs.com (2026-10-02)

Rémi a enregistré le sous-domaine **flaixexpert.flaixlabs.com** (entrée DNS de type A vers le serveur, 146.59.154.196). Le serveur répond désormais à cette adresse, avec un certificat https obtenu et renouvelé automatiquement ; le logiciel du directeur est à **https://flaixexpert.flaixlabs.com**, le back-office FlaiX Expert à **https://flaixexpert.flaixlabs.com/editeur**. L'ancienne adresse provisoire (146-59-154-196.sslip.io) renvoie définitivement vers la nouvelle (favoris et tablettes déjà configurés ne cassent pas ; une tablette enregistrée comme caisse devra être réenregistrée sur la nouvelle adresse, son cookie étant lié à l'adresse). Seule l'adresse a changé : le serveur reste la **version de test**.

## 2. Ce qui a été construit — commits

- [`e18b9ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/e18b9ea9af4e97d3285468c2f3f587f1848c1acc) — 2026-10-02 — Adresse du site : flaixexpert.flaixlabs.com ; l'ancienne adresse provisoire (sslip.io) renvoie vers elle
- [`f6a4820`](https://github.com/Break-Eat-APP/flaix-expert/commit/f6a48204cc8d8f50724447a6e00506d7e290cbf4) — 2026-10-02 — Docs : adresse du site flaixexpert.flaixlabs.com (dossier §15.120, guide du serveur, avancement)

## 3. Fichiers, par couche

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f6a48204cc8d8f50724447a6e00506d7e290cbf4/infra/vps/deployer.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f6a48204cc8d8f50724447a6e00506d7e290cbf4/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f6a48204cc8d8f50724447a6e00506d7e290cbf4/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f6a48204cc8d8f50724447a6e00506d7e290cbf4/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
