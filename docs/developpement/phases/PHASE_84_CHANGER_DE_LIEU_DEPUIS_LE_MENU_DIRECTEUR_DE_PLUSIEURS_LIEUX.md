# Phase 84 — Changer de lieu depuis le menu (directeur de plusieurs lieux)

> FlaiX Expert · dossier de développement · généré le 2026-11-16 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-16 |
| Décision | dossier projet §15.183 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.183 Changer de lieu (2026-11-16)

**Contexte** : constaté au §15.180 — un directeur de plusieurs lieux était toujours connecté au premier, sans moyen d'aller
dans les autres. Proposé à Rémi (« je le note pour plus tard, ou je le lance ? ») ; le 2026-11-16, Rémi : « on passe à la
suite ». Les lieux de Break Eat (Palais Omnisport, Spartiate…) ont le même directeur.

**Ce qui est fait** :
- Serveur (`apps/api/src/auth/routes.ts`) : `GET /api/auth/lieux` (lieux où le compte est membre actif, hors caissière et
  hors lieu de formation ; vide pour une tablette de caisse, le support ou le mode formation) ; `POST /api/auth/lieu`
  (lieu choisi parmi ceux-là, sinon 404 sans rien révéler ; refus en mode formation ou pour une session de caisse ou de
  support). **Une session ne change jamais de lieu** : l'actuelle est fermée, une nouvelle est ouverte dans le lieu choisi,
  avec le rôle du compte dans ce lieu. Journal : `changement_lieu` dans le lieu quitté (vers quel lieu), `connexion` dans le
  lieu choisi (depuis quel lieu). Type `LieuDuCompte` (domaine).
- Écran : sous le nom du lieu, dans le menu, « Changer de lieu » (liste de ses lieux) quand le directeur en a plusieurs ;
  le choix oublie tout ce qui était affiché et revient à l'accueil du lieu choisi.

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Changer de lieu | `vitest run test/changement-lieu.test.ts --pool=forks --maxWorkers=1` | 5 réussis, dont 3 [F] (lieu d'un autre client, membre retiré, mode formation) |
| Connexion, caissières, support, formation, conformité, back-office | `vitest run test/<api, caissieres, support, formation, conformite-base, lieux-editeur>.test.ts` (un par un) | 20 + 22 + 7 + 10 + 15 + 9 réussis |
| Écrans (application, composants) | `vitest run src/App.test.tsx src/composants` | 4 réussis |
| Types | `tsc --noEmit` (serveur, écran) | sans erreur |

À l'écran, en local : compte d'essai rattaché à deux lieux ; la liste propose les deux ; le passage au second affiche son
accueil (lieu vide, 0 produit), session du serveur dans le second lieu.

**Risques restants** : aucun sur les données (pas de migration). La caissière ne change pas de lieu (elle se connecte par
code sur une tablette du lieu).

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne sur le serveur de test ; retour arrière = commit
précédent (aucune migration).

## 2. Ce qui a été construit — commits

- [`e43f0c7`](https://github.com/Break-Eat-APP/flaix-expert/commit/e43f0c75e7797a0e2cc28f71542cca6220bf4f55) — 2026-11-16 — Changer de lieu (§15.183) : un directeur de plusieurs lieux passe de l'un à l'autre depuis le menu ; session fermée et rouverte dans le lieu choisi, journal des deux lieux ; refusé hors de ses lieux et en mode formation

## 3. Fichiers, par couche

### Tests

- `apps/api/test/changement-lieu.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/apps/api/test/changement-lieu.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/apps/api/src/auth/routes.ts)

### Écrans (apps/web)

- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e43f0c75e7797a0e2cc28f71542cca6220bf4f55/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/changement-lieu.test.ts`

- **changer de lieu**
  - le directeur voit ses deux lieux, pas celui d'un autre client
  - [F] lieu d'un autre client : refusé ; la session reste dans son lieu
  - passage au second lieu : nouvelle session, ancienne fermée, on ne voit que le second lieu ; journal des deux lieux
  - [F] retiré du lieu choisi entre-temps : refusé
  - [F] en mode formation : refusé, il faut d'abord en sortir

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/changement-lieu.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
