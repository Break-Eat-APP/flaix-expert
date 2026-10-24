# Phase 43 — Back-office niveau 2 : support sur autorisation du lieu

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.142 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.142 Back-office niveau 2 : support sur autorisation du lieu (2026-10-05)

**Demande de Rémi** (2026-10-04 au soir) : *« back office niveau 2 »*. Cadrage déjà acté au §15.13 : *« accès aux données d'un lieu, en lecture seule, limité dans le temps, et seulement après autorisation explicite du lieu depuis son propre écran — même mécanique que le compte vérificateur (§15.12). Chaque ouverture et chaque consultation sont inscrites dans le journal des événements du lieu, visibles par lui. Break Eat ne peut jamais s'auto-ouvrir l'accès. »* Et la règle absolue : aucun compte de l'éditeur n'écrit jamais dans les données d'un lieu, **imposé par l'architecture**, pas par une consigne.

**Côté lieu** (Paramètres → **Support FlaiX Expert**) :
- Le directeur **autorise** le support pour **1 heure, 4 heures ou 24 heures** (4 heures proposé), avec un motif facultatif (« problème de clôture »). Une seule autorisation active à la fois ; il la **retire** quand il veut, et l'accès s'arrête à l'instant (la base ne valide plus la session).
- L'écran dit ce que le support verra (tous les écrans du directeur, en lecture : ventes, tickets, stock, équipe, abonnés…) et ce qu'il ne pourra jamais faire (rien modifier, rien supprimer, rien encaisser).
- Il liste les autorisations passées et, pour chacune, **ce qui a été consulté**, avec l'heure et le nom de la personne de FlaiX Expert.
- Autorisation et retrait sont inscrits au journal technique du lieu (`support_autorise`, `support_retire`).

**Côté FlaiX Expert** (back-office `/editeur`) :
- Un lieu qui a autorisé le support affiche « Support autorisé jusqu'à 18 h 40 » et un bouton **« Ouvrir en lecture seule »**. Sans autorisation active, le bouton n'existe pas et la base refuse l'ouverture.
- L'ouverture crée une **session « support »** rattachée au lieu, au nom de la personne de FlaiX Expert, qui expire à la fin de l'autorisation ; elle est inscrite au journal du lieu (`support_ouvert`). La personne voit les écrans du directeur avec un bandeau permanent « Support FlaiX Expert — lecture seule — jusqu'à … » et un bouton « Quitter ».
- **Chaque écran consulté** (chaque adresse lue, une fois par session) est inscrit au journal du lieu (`support_consultation`).

**Lecture seule, imposée à trois niveaux** :
1. La **base** : toute transaction d'une session support est ouverte en **lecture seule** (`BEGIN READ ONLY`) ; PostgreSQL refuse alors toute écriture, quel que soit le code qui la tente.
2. Le **serveur** : toute requête autre qu'une lecture d'une session support est refusée (403) avant même d'arriver à la route, et la tentative est inscrite au journal du lieu (`acces_refuse`).
3. La **validation de la session** se fait dans la base : une session support n'est valide que tant qu'une autorisation du lieu est en cours (non retirée, non échue).
- Conséquence assumée : un écran qui écrit en lisant (rapport de soirée établi à la première lecture, par exemple) affiche une erreur au support ; le directeur, lui, n'est pas concerné.
- Le mode formation n'est pas accessible au support.

**À valider plus tard avec Rémi** (dossier de conformité) : la durée de conservation de la trace des consultations (aujourd'hui : sans limite, comme le journal technique) ; la mention du support dans le contrat de sous-traitance RGPD avec chaque lieu.

**Réalisé le 2026-10-05** (migration 0033, `routes/support.ts`, écrans Paramètres → Support FlaiX Expert et back-office) : autorisation 1 h / 4 h / 24 h avec motif, retrait immédiat (sessions fermées), historique avec les écrans consultés ; `ouvrir_session_support` (base) refuse sans autorisation en cours et ne s'ouvre jamais sur un lieu de formation ; `session_valide` n'accepte une session support que pendant l'autorisation ; transactions `BEGIN READ ONLY` pour toute requête support ; écritures refusées avant la route (403, journalisé `acces_refuse`) ; consultation inscrite une fois par adresse et par session (`consultation_support`, écriture seule, et `support_consultation` au journal) ; bandeau « Support FlaiX Expert — lecture seule — jusqu'à … » avec « Quitter » (`support_ferme`). **Tests** : serveur 7 (ouverture refusée sans autorisation, autorisation et refus d'une seconde, lecture et trace sans doublon, écriture refusée et journalisée, base qui refuse l'écriture en lecture seule, retrait qui coupe l'accès à la requête suivante, trace inaltérable), écrans 2.

## 2. Ce qui a été construit — commits

- [`0a675eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/0a675ebb0890bbe6e768539eac7b651b1c0d73a6) — 2026-10-05 — Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.142)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0033_support_niveau2.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/db/migrations/0033_support_niveau2.sql)

### Tests

- `apps/api/test/support.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/test/support.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/packages/domain/src/editeur.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/auth/contexte.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/auth/contexte.ts)
- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/auth/routes.ts)
- `apps/api/src/base.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/base.ts)
- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/outils.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/routes/outils.ts)
- `apps/api/src/routes/support.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/routes/support.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/parametres/SupportFlaix.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/pages/parametres/SupportFlaix.test.tsx)
- `apps/web/src/pages/parametres/SupportFlaix.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/pages/parametres/SupportFlaix.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0a675ebb0890bbe6e768539eac7b651b1c0d73a6/apps/web/src/pages/Resultats.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/support.test.ts`

- **sans autorisation du lieu**
  - [F] FlaiX Expert ne peut pas s'ouvrir l'accès : refus de la base, aucune session
- **autorisation, consultation en lecture seule, retrait**
  - le directeur autorise 4 h avec un motif ; une seule autorisation à la fois ; journalisé
  - FlaiX Expert ouvre la session : il lit les écrans du directeur, avec un bandeau « jusqu'à » ; ouverture et écrans consultés au journal du lieu
  - [F] pendant le support, toute écriture est refusée avant la route, et la tentative va au journal du lieu
  - [F] même si le code d'une route écrivait, la base refuse : transaction en lecture seule
  - [F] le directeur retire l'autorisation : l'accès s'arrête à la requête suivante ; retrait journalisé
  - [F] la trace des consultations ne se modifie ni ne se supprime

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/support.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
