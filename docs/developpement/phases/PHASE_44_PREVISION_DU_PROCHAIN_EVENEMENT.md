# Phase 44 — Prévision du prochain événement

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.143 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.143 Prévision du prochain événement (2026-10-05)

**Demande de Rémi** (2026-10-04 au soir) : *« prévision du prochain événement »*. C'est l'**étape 3** de l'analyse « Intelligence, prévision et décision » (§15.134) : *« mise en place par produit et par stand, personnel à prévoir, en fourchette »*, avec la règle : **les prévisions viennent de modèles statistiques classiques, qui donnent une fourchette et se vérifient** — jamais d'une IA qui rédige. Elle prolonge la « suggestion » de mise en place de Stock (moyenne des ventes − reste, §15.105), qui ne change pas.

**Données utilisées** (celles de FlaiX Expert, rien d'extérieur : ni météo, ni vacances, ni billetterie) : les **8 derniers événements clos qui ont des ventes** (« comparables »), leurs ventes par stand et par produit, leur CA, leurs tickets, leur affluence quand elle est saisie, leurs tickets à l'heure de pointe par stand ; l'**affluence prévue** du prochain événement si le directeur l'a saisie (Paramètres → Saison).

**Méthode** :
- **Avec l'affluence** (affluence prévue saisie, et au moins 3 comparables avec leur affluence) : chaque comparable donne un **taux par spectateur** (ventes ÷ affluence) ; prévision = taux × affluence prévue.
- **Sans l'affluence** : les valeurs des comparables directement (« un événement comme les précédents »), et l'écran le dit.
- **Fourchette** : du 1er au 3e quartile des comparables dès 4 comparables ; du plus bas au plus haut avec 2 ou 3 ; **pas de prévision avec moins de 2 comparables** (« pas encore assez d'historique »). Valeur centrale : la médiane. Un produit non vendu lors d'un comparable compte 0 pour ce comparable.
- **Mise en place proposée**, par stand et par produit : médiane − reste compté au stand (même reste que Stock) ; « pour ne pas manquer » : haut de la fourchette − reste. Aucune quantité n'est saisie à la place du directeur.
- **Caisses à l'heure de pointe**, par stand : tickets prévus à l'heure de pointe (même méthode) ÷ **cadence en file** mesurée par le temps de prise de commande (§15.139) ; sans cadence mesurée, seuls les tickets de l'heure de pointe s'affichent.
- **La prévision se vérifie** : pour un événement déjà clos, la prévision est recalculée **avec les seuls événements joués avant lui**, et comparée au réalisé (« dans la fourchette », « au-dessus », « en dessous ») ; l'écran affiche combien de fois la fourchette a vu juste sur les derniers événements. Ainsi le directeur sait ce que vaut la prévision avant de s'y fier.

**Où** : une page « Prochain événement » (`/prevision`, sans nouvelle entrée de menu), ouverte depuis la carte « Prochains événements » de Résultats et depuis Stock → Mise en place. On y choisit l'événement (à venir, ou déjà joué pour voir la vérification).

**Limites dites à l'écran** : pas de météo, d'adversaire, de vacances ni d'horaire dans le calcul (à ajouter quand l'historique sera assez long pour les mesurer) ; une fourchette n'est pas une promesse.

**Réalisé le 2026-10-05** (moteur `prevision.ts`, route `GET /api/prevision`, page `/prevision` ouverte depuis Résultats → Prochains événements et depuis Stock) : chiffres clés (CA et tickets prévus, événements comparés, fiabilité), ventes et mise en place proposée par stand et par produit, tickets et caisses à l'heure de pointe ; pour un événement joué, le réalisé et son verdict. **Tests** : moteur 5 (quartiles, affluence, comparables sans affluence refusés pour le calcul par spectateur, verdict, caisses), serveur 4 (prochain événement ramené à l'affluence, fiabilité 1 sur 2, événement joué recalculé avec les seuls événements d'avant, pas de prévision sans historique), écrans 2.

## 2. Ce qui a été construit — commits

- [`534a3a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/534a3a6d867afcbcf5840bc11afcfd7c0f245267) — 2026-10-05 — Prévision du prochain événement (dossier §15.143)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/prevision.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/api/test/prevision.test.ts)
- `packages/domain/src/prevision.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/packages/domain/src/prevision.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/packages/domain/src/index.ts)
- `packages/domain/src/prevision.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/packages/domain/src/prevision.ts)

### Serveur (apps/api)

- `apps/api/src/routes/prevision.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/api/src/routes/prevision.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/web/src/App.tsx)
- `apps/web/src/pages/prevision/Prevision.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/web/src/pages/prevision/Prevision.test.tsx)
- `apps/web/src/pages/prevision/Prevision.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/web/src/pages/prevision/Prevision.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/534a3a6d867afcbcf5840bc11afcfd7c0f245267/apps/web/src/pages/stock/Stock.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/prevision.test.ts`

- **prévision du prochain événement (§15.143)**
  - par défaut, le prochain événement : 3 000 spectateurs prévus × 0,01 frite par spectateur → 30 frites, 150 € de CA
  - la prévision se vérifie : Anglet (dans la fourchette, d'après les 3 d'avant), Brest (au-dessus, d'après 2 sans affluence) → 1 sur 2
  - un événement joué : la prévision recalculée avec les seuls événements d'avant lui, et le réalisé
  - un lieu qui n'a encore aucun événement : réponse vide (l'écran invite à créer la saison), jamais une erreur
  - [F] le premier événement joué n'a pas d'historique : pas de prévision inventée ; un événement inconnu est refusé

### `packages/domain/src/prevision.test.ts`

- **fourchette**
  - quartiles dès 4 valeurs, extrêmes avec 2 ou 3, rien en dessous de 2
- **prévision du prochain événement (§15.143)**
  - avec l'affluence : 3 000 spectateurs prévus, comparables à 0,10 frite par spectateur environ → autour de 300 frites
  - sans affluence prévue : les comparables tels quels, et c'est dit ; moins de 2 comparables : pas de prévision
  - [F] affluence prévue mais trop peu de comparables avec leur affluence : on ne divise pas par une affluence inconnue
  - vérification et caisses au pic

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/prevision.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/prevision.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
