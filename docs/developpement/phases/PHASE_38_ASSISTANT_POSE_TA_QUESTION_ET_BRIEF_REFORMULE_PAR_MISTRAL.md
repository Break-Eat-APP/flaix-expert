# Phase 38 — Assistant « pose ta question » et brief reformulé par Mistral

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.136 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.136 Assistant « pose ta question » et brief reformulé par Mistral (2026-10-04)

**Réalisé** (migration 0029, `ia/fournisseur.ts`, `routes/assistant.ts`, phase 38) :
- **Fournisseur** : Mistral (décision de Rémi), par son interface de conversation avec outils ; modèle `mistral-medium-latest` (réglable). Clé posée par Rémi sur le serveur avec `sudo flaix-admin cle-mistral` (tapée sans affichage, vérifiée auprès de Mistral, fichier lisible par le seul service) — jamais vue ni manipulée par Claude. Sans clé : l'IA est absente, tout le reste fonctionne.
- **Option du lieu « Assistant IA »**, désactivée par défaut (chaque question coûte), activée par FlaiX Expert dans le back-office. Limite : 60 questions par lieu et par jour.
- **Ce que l'IA peut lire** : cinq outils **en lecture seule** — liste des événements, résultats d'un événement ou d'une période, finances (jusqu'à la marge nette et la cible), rapport de soirée figé, marges du catalogue au prix actuel. Les montants y sont écrits comme à l'écran (« 18 640,00 € »). L'IA ne peut rien modifier.
- **Consignes** : répondre uniquement à partir des outils, recopier les montants, nommer l'événement ou la période, dire une donnée absente, aucun conseil juridique, fiscal ou social, « la marge nette de la soirée n'est pas le bénéfice du lieu ».
- **Contrôle des chiffres** (`chiffresVerifies`) : chaque nombre de la réponse est cherché dans les données lues (les petits comptes jusqu'à 10 sont tolérés) ; sinon l'écran affiche « chiffre à vérifier ». **Trace** : chaque échange est gardé (question, réponse, outils lus, modèle, contrôle, jetons consommés), en écriture seule.
- **Règlement européen sur l'IA, article 50** : chaque réponse porte « Rédigé par une IA (modèle) ».
- **Brief reformulé** : si l'option est active, Mistral réécrit le brief en 2 ou 3 phrases ; la reformulation n'est retenue que si elle n'ajoute ni ne change aucun chiffre (`reformulationFidele`), sinon le brief par règles part. La trace dit qui l'a rédigé.
- **Écran** : entrée « Assistant » du menu (si l'option est active), questions suggérées, sources lues, nombre de questions restantes ; guide serveur complété (création de la clé par Rémi).
- **À valider** : contrat de traitement des données avec Mistral (RGPD) ; durée de conservation des échanges (à fixer avec Rémi).
- **Tests** : moteur 3, serveur 7 (option fermée par défaut, clé absente, lecture par outil et source citée, chiffre non retrouvé, limite du jour, reformulation fidèle retenue, reformulation inventée refusée), écrans 3 (dont le menu).

## 2. Ce qui a été construit — commits

- [`4a30d13`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a30d1373cebf546b6614e731c9fb280fa9d41d6) — 2026-10-04 — Assistant « pose ta question » et brief reformulé par Mistral, derrière une option du lieu (dossier §15.136)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0029_assistant.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/db/migrations/0029_assistant.sql)

### Tests

- `apps/api/test/assistant.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/test/assistant.test.ts)
- `apps/api/test/options.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/test/options.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/composants/Coquille.test.ts)
- `packages/domain/src/assistant.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/packages/domain/src/assistant.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/assistant.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/packages/domain/src/assistant.ts)
- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/packages/domain/src/editeur.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/packages/domain/src/index.ts)

### Serveur (apps/api)

- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/config.ts)
- `apps/api/src/ia/fournisseur.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/ia/fournisseur.ts)
- `apps/api/src/routes/assistant.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/routes/assistant.ts)
- `apps/api/src/routes/notifications.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/routes/notifications.ts)
- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/routes/produits.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/Assistant.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/pages/Assistant.test.tsx)
- `apps/web/src/pages/Assistant.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/pages/Assistant.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/infra/vps/flaix-admin.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4a30d1373cebf546b6614e731c9fb280fa9d41d6/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

### `apps/api/test/assistant.test.ts`

- **assistant « pose ta question »**
  - [F] option désactivée par défaut (chaque question coûte) : l'assistant est fermé
  - option active mais clé Mistral absente : l'écran le sait, la question est refusée proprement
  - l'IA lit les résultats par un outil en lecture seule, recopie le montant, cite sa source ; l'échange est gardé
  - [F] un chiffre que les données ne contiennent pas : la réponse est marquée « à vérifier »
  - [F] limite par jour atteinte : la question est refusée
- **brief reformulé par Mistral**
  - reformulation fidèle : elle part sur le téléphone, et la trace dit « rédigé par Mistral »
  - [F] reformulation qui invente un chiffre : refusée, le brief par règles part à la place

### `packages/domain/src/assistant.test.ts`

- **contrôle des chiffres de l'assistant**
  - montants recopiés, dates et comptes : vérifié, quel que soit l'espace des milliers
  - les petits comptes (jusqu'à 10) ne bloquent pas : « 3 produits », « 2 soirées »
  - [F] un montant absent des données lues, ou recalculé de tête : à vérifier

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/assistant.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/assistant.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
