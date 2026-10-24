# Phase 40 — Temps de prise de commande, par caisse et par stand

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.139 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.139 Temps de prise de commande, par caisse et par stand (2026-10-04)

**Demande de Rémi** : *« une fonctionnalité du calcul de temps de la caissière […] du moment où la caissière tape le premier produit jusqu'à l'encaissement, ou peut-être mieux jusqu'au moment où elle réouvre un ticket avec un produit, donc un nouveau client. Il se peut qu'il n'y ait pas de commande à prendre derrière le client […] afin de savoir la moyenne de traitement de commande. »*

**Avis rendu** : faisable et utile — c'est la mesure qui manquait au signal « caisse à plein régime » (§15.138) : la durée d'une commande donne la cadence maximale d'une caisse, et l'écart entre deux clients dit s'il y avait une file. **Risque signalé** : mesurer le temps d'une personne nommée est une surveillance de salarié — information écrite préalable de chaque salariée (Code du travail, art. L1222-4), consultation du CSE à partir de 50 salariés, et une IA qui noterait les caissières serait « à haut risque » au sens du règlement européen sur l'IA (annexe III). À faire valider par un avocat si un jour on mesure par personne.

**Choix de Rémi** (les deux recommandations) : **mesure par caisse et par stand, personne n'est nommé** ; construite **juste après le Revenue Engine**.

**Règles** :
- La tablette note l'heure du **premier produit tapé** de chaque ticket. Cette heure **n'entre pas dans le ticket scellé** (le journal fiscal ne change pas) : elle part à côté, comme une mesure d'exploitation, et le serveur la range dans une table à part, rattachée au ticket.
- **Durée de la commande** = encaissement − premier produit tapé.
- **Client suivant** = premier produit du ticket suivant de la même caisse − encaissement du précédent. **Moins de 20 secondes : le client suivant attendait (file)** ; au-delà, la caisse attendait un client et ce temps n'entre dans aucune moyenne.
- Chiffres affichés, par caisse et par stand : durée médiane d'une commande (la médiane plutôt que la moyenne, qu'une commande oubliée ouverte fausserait), cadence en file (commandes par heure quand la file est là), part des commandes servies avec une file derrière.
- Aucune donnée par caissière, ni à l'écran ni dans l'assistant.


**Réalisé le 2026-10-05** (migration 0030, moteur `temps-service.ts`) : la tablette note l'heure du premier produit tapé (remise à zéro si le panier est vidé) et l'envoie à côté du ticket ; le serveur la range dans `mesure_ticket` (écriture seule), en ignorant une heure impossible (après l'encaissement ou plus de 4 h avant) ; le ticket scellé ne change pas. Résultats → « Où je perds de l'argent » → carte **« Temps de prise de commande »** : par stand puis par caisse, commandes mesurées, durée médiane, part avec file, cadence en file. Une commande de plus de 15 minutes est écartée (ticket oublié ouvert) ; sous 5 commandes, pas de médiane. **Tests** : moteur 5, serveur 2, écrans 2 (tablette : mesure à côté du ticket et remise à zéro ; carte).

## 2. Ce qui a été construit — commits

- [`72f087a`](https://github.com/Break-Eat-APP/flaix-expert/commit/72f087a9c12264b7aa6c658c949a6008d8e4b290) — 2026-10-05 — Temps de prise de commande, par caisse et par stand (dossier §15.139)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0030_temps_de_service.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/db/migrations/0030_temps_de_service.sql)

### Tests

- `apps/api/test/pertes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/api/test/pertes.test.ts)
- `packages/domain/src/temps-service.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/packages/domain/src/temps-service.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisse-scellee.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/packages/domain/src/caisse-scellee.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/packages/domain/src/index.ts)
- `packages/domain/src/pertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/packages/domain/src/pertes.ts)
- `packages/domain/src/temps-service.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/packages/domain/src/temps-service.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/pertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/api/src/routes/pertes.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisse/EcranCaisse.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/web/src/pages/caisse/EcranCaisse.test.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/resultats/Pertes.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/web/src/pages/resultats/Pertes.test.tsx)
- `apps/web/src/pages/resultats/Pertes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/72f087a9c12264b7aa6c658c949a6008d8e4b290/apps/web/src/pages/resultats/Pertes.tsx)

## 4. Tests créés dans cette phase

### `packages/domain/src/temps-service.test.ts`

- **temps de prise de commande (§15.139)**
  - mi-temps : 6 commandes de 30 s, le client suivant à 5 s → toutes en file après la première, 103 commandes par heure
  - une caisse qui attend ses clients : le temps sans client n'entre dans aucune moyenne
  - [F] une commande oubliée ouverte (40 min) est écartée ; la médiane ignore une commande lente ; sous 5 commandes, pas de médiane
  - un stand réunit ses caisses sans mélanger leurs files ; les tickets sans mesure sont comptés à part
  - durées écrites en clair

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/temps-service.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
