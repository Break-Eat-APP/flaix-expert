# FlaiX Expert — stratégie de tests

Tenu selon la gouvernance (`GOUVERNANCE_FLAIX_EXPERT.md`, § 14). Créé le 2026-11-12.

## 1. Les trois niveaux

| Niveau | Où | Contre quoi | Commande |
|---|---|---|---|
| Moteur de calcul | `packages/domain/src/*.test.ts` | fonctions pures (calculs, lectures de fichiers, règles) | `cd packages/domain && ./node_modules/.bin/vitest run` |
| Serveur | `apps/api/test/*.test.ts` | **la vraie base de test** PostgreSQL (`flaix_test`), routes, droits, isolement, journaux | `cd apps/api && pnpm test:un-par-un` |
| Écrans | `apps/web/src/**/*.test.tsx` | composants React, serveur simulé | `cd apps/web && ./node_modules/.bin/vitest run src/pages/<dossier>` |

Vérification des types : `pnpm typecheck` (ou `./node_modules/.bin/tsc --noEmit -p .` dans chaque paquet). Construction de
l'écran : `cd apps/web && ./node_modules/.bin/vite build`.

## 2. Règles

- Un test qui prouve un refus (accès à un autre lieu, fraude, saisie hors bornes) est marqué **[F]** dans son titre.
- Les **tests de conformité** (`conformite-base.test.ts`) provoquent réellement les fraudes et ne passent que si la base
  les refuse.
- **Ne jamais modifier un test pour le faire passer.** Un test ne change que si le comportement change par décision ; le
  compte rendu (§15.x) le dit.
- **Ne jamais écrire « tests passés » sans les avoir exécutés** ; le compte rendu donne la commande et le résultat, et dit
  ce qui n'a pas pu tourner.
- Données de test fictives seulement : les vrais fichiers de Rémi (factures, exports de caisse) servent au contrôle local,
  hors du dépôt.
- Quand un écran change : contrôle dans l'application locale (`.claude/launch.json`, configuration `flaix-expert`).

## 3. Le poste de développement (6 Go de mémoire)

- Fermer le serveur local avant les vérifications de types et les tests.
- Tests du serveur **un fichier à la fois** (`pnpm test:un-par-un`, ou `vitest run test/x.test.ts --pool=forks
  --maxWorkers=1`).
- Tests des écrans par dossier (la suite entière d'un coup manque de mémoire).
- Une erreur d'environnement (mémoire, « spawn UNKNOWN », fichier verrouillé, délai de préparation dépassé) : relancer le
  fichier seul, et le dire dans le compte rendu.
- La base locale tourne dans Docker : `docker compose -f infra/docker-compose.yml up -d --wait`.

## 4. Flux à couvrir en priorité

Vente et rectification ; vente sans réseau et rejeu sans doublon ; clôtures ; journaux et leur chaîne ; isolement des
lieux ; mode formation ; stock et coût moyen ; factures (import, alertes, validation, entrée en réserve) ; caisses
connectées ; fidélité et cartes Wallet ; back-office.

## 5. Ce qui n'est pas couvert aujourd'hui

- Recette réelle Apple Wallet et Google Wallet (BUG-2026-017).
- Lecteur PDF sur de vrais fichiers PDF dans les tests (BUG-2026-018) : contrôlé à la main sur les vraies factures.
- Tests de charge (affluence d'un match) : à définir.
- Restauration d'une sauvegarde : jamais faite (MISE_EN_LIGNE.md § 4).
