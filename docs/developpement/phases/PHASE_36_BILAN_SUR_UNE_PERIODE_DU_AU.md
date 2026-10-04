# Phase 36 — Bilan sur une période du … au …

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.133 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.133 Bilan sur une période « du … au … » (2026-10-04)

**Demande de Rémi** : *« tout doit être possible d'avoir un bilan de plusieurs jours en choisissant soit une date à une date »*.

**Réalisé** (moteur `periode-bilan.ts`, phase 36) :
- **Résultats** : bascule « Un événement / Une période ». Une période regroupe les événements dont la date de début (jour de Paris) tombe entre les deux jours inclus — la même règle que les clôtures mensuelles. Tous les onglets la prennent : Vue d'ensemble, Ventes, Finances, Marges, Rapports de soirée (liste filtrée), « À surveiller ». Raccourcis : ce mois-ci, le mois dernier, 30 derniers jours, depuis le 1er août (début de saison).
- **Comparaison** : avec la période précédente de même durée, qui se termine la veille (septembre → du 2 au 31 août). Jamais une moyenne ; sans vente sur la période précédente, pas de comparaison.
- **Finances d'une période** : somme des soirées ; dépenses additionnées par poste, en lecture (elles se saisissent soirée par soirée) ; tableau « Soirée par soirée » avec la marge nette et la cible de chacune ; cible de la période = somme des cibles des soirées, jugée seulement si chaque soirée en a une.
- **Règles d'honnêteté conservées** : CA par spectateur seulement si l'affluence est saisie pour chaque événement de la période (sinon « affluence incomplète », et l'alerte le dit) ; marge nette seulement si elle existe pour chaque soirée.
- **Tests** : moteur 5 (durée, période précédente, jour de Paris à minuit, libellés, dates impossibles), serveur 6, écrans 2. Vérifié dans le navigateur. Un plantage de l'écran (une fonction de date qui s'appelait elle-même) a été trouvé à la vérification et corrigé ; le test d'écran ajouté le couvre.

## 2. Ce qui a été construit — commits

- [`10e0186`](https://github.com/Break-Eat-APP/flaix-expert/commit/10e018659b30bb2cf3a005ec4ef65994e92ce077) — 2026-10-04 — Bilan sur une période « du … au … » dans Résultats et Finances (dossier §15.133)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/periode.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/api/test/periode.test.ts)
- `packages/domain/src/periode-bilan.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/packages/domain/src/periode-bilan.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/packages/domain/src/finances.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/packages/domain/src/index.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/packages/domain/src/modele.ts)
- `packages/domain/src/periode-bilan.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/packages/domain/src/periode-bilan.ts)

### Serveur (apps/api)

- `apps/api/src/routes/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/api/src/routes/finances.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/api/src/routes/resultats.ts)

### Écrans (apps/web)

- `apps/web/src/pages/resultats/Finances.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/web/src/pages/resultats/Finances.test.tsx)
- `apps/web/src/pages/resultats/Finances.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/web/src/pages/resultats/Finances.tsx)
- `apps/web/src/pages/resultats/Tableaux.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/web/src/pages/resultats/Tableaux.test.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/apps/web/src/resultats.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/10e018659b30bb2cf3a005ec4ef65994e92ce077/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/periode.test.ts`

- **Résultats sur une période**
  - septembre : les deux événements de la période additionnés, comparés à la période précédente de même durée
  - affluence incomplète : pas de CA par spectateur, et « À surveiller » le dit
  - une période sans événement : rien à additionner, sans erreur
  - [F] période incomplète, à l'envers ou date impossible : refusée
- **Finances sur une période**
  - dépenses et marge nette additionnées, soirée par soirée ; la cible n'est jugée que si chaque soirée en a une
  - [F] ni événement ni période complète : refusé

### `packages/domain/src/periode-bilan.test.ts`

- **bilan sur une période**
  - durée bornes comprises et période précédente de même durée, qui finit la veille
  - un événement compte pour le jour de Paris de son début : 23 h 30 à Paris le 30 septembre reste en septembre
  - libellés lisibles
  - [F] une date impossible est refusée ; une période se reconnaît à son identifiant
  - raccourcis à partir d'aujourd'hui (4 octobre 2026)

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/periode-bilan.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/periode.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
