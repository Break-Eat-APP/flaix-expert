# Phase 60 — Hygiène sur la tablette des caissières ; photos d'étiquettes

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.159 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.159 Hygiène sur la tablette des caissières ; photos d'étiquettes (2026-10-11)

**Décisions** :
- Sur le poste d'une caissière (tablette enregistrée comme caisse), un bouton **« Hygiène »** ouvre la journée :
  relevés de température, tâches, contrôles à réception, huile de friture. **La caisse reste ouverte** derrière (le
  ticket en cours n'est pas perdu) ; « Retour à la caisse ». Réglages et registre restent au directeur (refusés à la
  caissière, refus journalisé). Le relevé porte le nom de la caissière.
- **Photo de l'étiquette** (lot, date limite, estampille) jointe au contrôle à réception : prise à l'appareil photo du
  téléphone ou de la tablette, réduite sur place (JPEG, 1 600 px au plus), contrôlée par le serveur (JPEG, 2 Mo au
  plus), gardée en écriture seule comme le registre, visible depuis la liste des réceptions et signalée au registre.
- Migration 0048. Tests : serveur 1 (caissière connectée par code sur sa tablette : relevé, réception avec photo,
  photo relue, image non JPEG refusée, réglages et registre refusés), écran 1 (onglets de la caissière, photo envoyée).

## 2. Ce qui a été construit — commits

- [`8e7298c`](https://github.com/Break-Eat-APP/flaix-expert/commit/8e7298c915f658f84b2931da8847dee28c984ae8) — 2026-10-11 — Hygiène sur la tablette des caissières et photos d'étiquettes (dossier §15.159)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0048_photos_hygiene.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/db/migrations/0048_photos_hygiene.sql)

### Tests

- `apps/api/test/hygiene.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/api/test/hygiene.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/hygiene.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/packages/domain/src/hygiene.ts)

### Serveur (apps/api)

- `apps/api/src/routes/hygiene.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/api/src/routes/hygiene.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisse/PosteCaissiere.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/web/src/pages/caisse/PosteCaissiere.tsx)
- `apps/web/src/pages/hygiene/Hygiene.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/web/src/pages/hygiene/Hygiene.test.tsx)
- `apps/web/src/pages/hygiene/Hygiene.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/web/src/pages/hygiene/Hygiene.tsx)
- `apps/web/src/pages/hygiene/photo.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/web/src/pages/hygiene/photo.ts)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8e7298c915f658f84b2931da8847dee28c984ae8/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
