# Phase 53 — Caisses connectées : correspondances automatiques et suggérées

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-09 |
| Décision | dossier projet §15.152 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.152 Caisses connectées : correspondances automatiques et suggérées (2026-10-09)

**Demande de Rémi** : *« comment tu fais pour qu'il comprenne le bon produit ? »* — la correspondance (code du produit dans
la caisse, sinon son libellé exact). Proposition acceptée (« ok fais le ») : relier sans demander ce qui porte le même nom,
proposer ce qui porte un nom proche, même principe pour les bars et les stands.

**Décisions** :
- **Même nom** aux majuscules, accents, espaces et ponctuation près (« BIERE 50CL » = « Bière 50 cl ») qu'**un seul**
  produit (ou stand) actif de FlaiX Expert : relié à l'import, dans la même transaction, marqué « auto » à l'écran et dans
  la base (migration 0042, colonne `automatique`) ; nombre de liens inscrit au journal de l'import. Deux homonymes : aucun
  lien, une suggestion.
- **Nom proche** : proposé (« Suggestion : X — Accepter »), jamais relié sans le directeur. Ressemblance = moyenne des mots
  communs (chiffres et lettres séparés, unités cl, ml, l… écartées) et des groupes de trois lettres communs ; seuil 0,4.
  **Jamais proposé** : contenances différentes (33 cl / 50 cl), variantes opposées (nord / sud, haut / bas, rouge / blanc /
  rosé, blonde / brune, petite / grande).
- **« Accepter les N suggestions »** : toutes celles affichées, d'un coup, comme un choix du directeur (pas « auto ») ;
  inscrit au journal technique (nouveau type « correspondances suggérées acceptées », avec la liste).
- **Choix à la main** : jamais « auto ». Retirer un lien (« — à rapprocher — ») est retenu comme une décision : plus de
  liaison automatique à l'import suivant, plus de suggestion pour ce produit (il reste choisissable dans la liste).

**Réalisé le 2026-10-09** : moteur (`normaliserNom`, `ressemblance`, `suggererCorrespondance`, `correspondanceExacte`),
serveur (liaison à l'import, suggestions dans les listes, deux routes « tout accepter »), écran Correspondances (étiquette
« auto », suggestion acceptable, bouton tout accepter, message d'import « reliés automatiquement »). **Tests** : moteur 2
(même nom, homonymes, nom proche, contenances et variantes opposées), serveur 1 (liaison à l'import et journal, suggestions,
« aucun » respecté au réimport, tout accepter produits et points de vente), écran 2 (étiquette, suggestion acceptée seule
ou toutes ensemble).

## 2. Ce qui a été construit — commits

- [`50d818b`](https://github.com/Break-Eat-APP/flaix-expert/commit/50d818b8b67023979d5615ffbe6cc60dd0cae6f2) — 2026-10-09 — Caisses connectées : moteur des correspondances suggérées (même nom, nom proche)
- [`b79db0d`](https://github.com/Break-Eat-APP/flaix-expert/commit/b79db0d8ee72df223a72a2996de0776cf1998a00) — 2026-10-09 — Caisses connectées : correspondances automatiques et suggérées (dossier §15.152)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0042_correspondances_automatiques.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/db/migrations/0042_correspondances_automatiques.sql)

### Tests

- `apps/api/test/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/apps/api/test/caisses-externes.test.ts)
- `packages/domain/src/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/packages/domain/src/caisses-externes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/packages/domain/src/caisses-externes.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/apps/api/src/routes/caisses-externes.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b79db0d8ee72df223a72a2996de0776cf1998a00/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
