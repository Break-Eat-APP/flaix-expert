# Phase 12 — Clôtures mensuelle et annuelle, total perpétuel

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.107 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.107 Clôtures → Mois & année : conception (2026-09-30)

Suite des Clôtures demandée par Rémi (§15.99). Sources relues : module 2, onglet clôtures (§15.27, validé le 2026-09-12, déplacé dans Clôtures au §15.85), §15.4 (clôtures journalière, mensuelle, annuelle ; grand total de période ; total perpétuel), plan de tests C1 à C8 (§15.19).

1. **Z du match (clôture « journalière »)** : créé **automatiquement à la clôture définitive du match** : tickets, annulations, total TTC net, espèces, carte, **TVA par taux**, total de chaque caisse, **grand total du match** et **total perpétuel** du lieu avant et après, et de chaque caisse. Un match clos avant cette version reçoit son Z au moment de la clôture de son mois.
2. **Clôture mensuelle** (mois civil, heure de Paris, selon la date du match) : possible seulement **une fois le mois terminé**, **tous ses matchs clos**, et **le mois précédent qui a des matchs déjà clôturé** (verrou validé au §15.27). Grand total du mois = somme de ses Z de match ; total perpétuel = celui de la clôture précédente + grand total du mois. Un mois clôturé ne reçoit plus de match : l'ouverture d'un match daté dans un mois clos est refusée.
3. **Clôture de l'exercice** : exercice de 12 mois, **premier mois réglable dans Paramètres → Le lieu (janvier par défaut, à confirmer avec l'expert-comptable du lieu)**, non modifiable une fois un exercice clôturé. Possible une fois l'exercice terminé et tous ses mois qui ont des matchs clôturés.
4. **Inaltérable et chaîné** : chaque clôture (match, mois, exercice) est une ligne en écriture seule, scellée SHA-256 et chaînée à la précédente du lieu ; « Vérifier l'intégrité » relit la chaîne. Chaque clôture est aussi inscrite au journal technique.
5. **Écran** : Clôtures → Mois & année : total perpétuel du lieu, les mois (matchs clos / total, grand total, état, bouton « Clôturer le mois »), les exercices, la liste des clôtures avec leurs empreintes.

**Hors de cette étape** : l'archive annuelle en format ouvert et l'accès vérificateur (onglet Archives & contrôle, module 16) ; les clôtures ne purgent rien (aucune donnée n'est jamais effacée, §15.106).

**Réalisé le 2026-09-30** : migration `0010_clotures_periode.sql` (table `cloture_periode` en écriture seule, chaînée ; la base vérifie perpétuel après = perpétuel avant + grand total ; premier mois de l'exercice sur le lieu) ; moteur `packages/domain/src/cloture-periode.ts` (mois et exercice à l'heure de Paris, formule de scellement) ; serveur `routes/periodes.ts` (état des périodes, clôture du mois, de l'exercice, vérification de la chaîne, réglage de l'exercice) ; Z du match créé à la clôture définitive du match ; création, déplacement et ouverture d'un match refusés dans un mois clôturé. Écran Clôtures → Mois & année (total perpétuel, mois, exercices, clôtures scellées avec détail TVA et caisses, vérification) ; Paramètres → Le lieu → Exercice comptable.

**Vérifié** : 4 tests du moteur (mois à Paris autour de minuit, fin de mois, exercice civil et juillet-juin) ; 9 tests serveur couvrant C1 (Z du match : 14,00 € TTC, TVA 2,33 € sur 11,67 € HT, perpétuel 0 → 14,00 €), le verrou d'un mois avec un match non clos, du mois suivant avant le précédent, du mois en cours, C3/C4 (mars = 14 + 21 = 35 € ; perpétuel 0 → 35 € puis mai 35 → 42 €), le mois clôturé fermé aux nouveaux matchs, C2/C6 (exercice 2025 = 70 € = somme de ses mois ; exercice 2026 non terminé), l'exercice figé une fois clôturé, la chaîne intègre (9 maillons), C5 [F] (perpétuel non modifiable, clôture non supprimable, perpétuel incohérent refusé par la base). Écran vérifié dans le navigateur (mois non terminés signalés, vérification de la chaîne).

## 2. Ce qui a été construit — commits

- [`8b02048`](https://github.com/Break-Eat-APP/flaix-expert/commit/8b020484526c8b4914bb2eec0b1f976e2a2b0634) — 2026-09-30 — Dossier §15.107 : conception des clôtures mensuelle et annuelle
- [`1141f9c`](https://github.com/Break-Eat-APP/flaix-expert/commit/1141f9cce56d1b669331d941b94595803f792956) — 2026-09-30 — Clôtures de période, serveur : Z du match, clôtures mensuelle et annuelle scellées et chaînées, total perpétuel (dossier §15.107)
- [`284f366`](https://github.com/Break-Eat-APP/flaix-expert/commit/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909) — 2026-09-30 — Clôtures → Mois & année : écran des clôtures mensuelle et annuelle, exercice comptable du lieu (dossier §15.107)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0010_clotures_periode.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/db/migrations/0010_clotures_periode.sql)

### Tests

- `apps/api/test/periodes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/api/test/periodes.test.ts)
- `packages/domain/src/cloture-periode.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/packages/domain/src/cloture-periode.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/cloture-periode.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/packages/domain/src/cloture-periode.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/periodes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/api/src/routes/periodes.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/clotures/Periodes.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/web/src/pages/clotures/Periodes.tsx)
- `apps/web/src/pages/parametres/Identite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/apps/web/src/pages/parametres/Identite.tsx)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/CLAUDE.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/periodes.test.ts`

- **premier mois de l'exercice : à régler par le directeur (§15.108)**
  - vide sur un lieu neuf : aucun exercice proposé, clôture d'exercice refusée ; puis réglé à janvier
- **C1 — Z de l'événement (clôture journalière)**
  - à la clôture de l'événement : totaux figés, TVA par taux exacte, perpétuel avancé, empreinte produite
- **clôture mensuelle**
  - bloquée tant qu'un événement du mois n'est pas clos
  - un mois ne se clôt pas avant le précédent qui a des événements ; le mois en cours n'est jamais clôturable
  - C3 / C4 — grand total du mois = somme de ses événements ; perpétuel après = avant + grand total
  - un mois clôturé ne reçoit plus d'événement, ni créé, ni déplacé, ni ouvert
- **clôture de l'exercice**
  - C2 / C6 — exercice 2025 : somme de ses mois, perpétuel chaîné ; l'exercice en cours n'est pas terminé
  - le premier mois de l'exercice ne se change plus une fois un exercice clôturé
  - la chaîne des clôtures est intègre
  - C5 [F] — le perpétuel ne se remet pas à zéro et une clôture ne se modifie pas, même en écrivant dans la base

### `packages/domain/src/cloture-periode.test.ts`

- **clôtures de période (§15.107)**
  - le mois d'un événement se lit à l'heure de Paris
  - bornes et nom d'un mois, années bissextiles comprises
  - un mois n'est terminé qu'à partir du mois suivant, à Paris
  - exercice civil par défaut ; exercice de juillet à juin

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/cloture-periode.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/periodes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
