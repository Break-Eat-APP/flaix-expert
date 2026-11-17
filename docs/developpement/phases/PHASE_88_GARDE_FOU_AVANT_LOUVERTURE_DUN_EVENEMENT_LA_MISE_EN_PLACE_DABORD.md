# Phase 88 — Garde-fou avant l'ouverture d'un événement : la mise en place d'abord

> FlaiX Expert · dossier de développement · généré le 2026-11-17 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-17 |
| Décision | dossier projet §15.187 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.187 Garde-fou avant l'ouverture d'un événement : la mise en place d'abord (2026-11-17)

**Contexte** : Rémi : « avant d'ouvrir un événement, ça serait bien de mettre un garde-fou qui demande d'abord de faire une
mise en place… si on ouvre un événement, on ne peut plus revenir sur la mise en place… ça serait bien de faire une
alerte ». Proposé : une fenêtre de confirmation qui liste les stands sans mise en place, avec « Faire la mise en place » et
« Ouvrir quand même » (jamais bloquant), et, pour l'ouverture automatique par la première caisse d'une caissière, une alerte
qui ne bloque jamais la caissière. Rémi : garder « Ouvrir quand même » (« ok ») ; alerte « le matin même » ; « ok ».

**Règle** : un stand est signalé s'il est actif, vend au moins un produit actif, et n'a encore **aucune** mise en place
(produit ou ingrédient) pour cet événement. Un stand sans produit n'est jamais signalé. Rien n'est vérifié si l'option
Stock du lieu est coupée. **Rien n'est bloqué** : ni l'ouverture par le directeur, ni l'ouverture automatique par la caisse.

**Ce qui est fait** :
- `apps/api/src/routes/stock.ts` : `standsSansMiseEnPlace(c, lieuId, evenementId)` (une seule requête, stands triés).
- `apps/api/src/routes/evenements.ts` : `GET /api/evenements/:id/preparation` → `{ stockSuivi, standsSansMiseEnPlace }`
  (directeur ; liste vide si l'option Stock est coupée ou l'événement déjà ouvert).
- `apps/api/src/routes/alertes.ts` : nouvelle alerte `mise_en_place` (forte, « calculée ») dans le Centre d'alertes, **le jour
  même** (jour à Paris) d'un événement à venir qui a des stands sans mise en place ; lien direct vers Stock › Mise en place
  de cet événement. Type ajouté au moteur (`packages/domain/src/alertes.ts`).
- `apps/web/src/composants/ConfirmerOuverture.tsx` (nouveau), utilisé dans **Caisses** (« Événement du jour ») et dans **En
  direct** : après « Ouvrir l'événement », si des stands n'ont pas de mise en place : « Mise en place non faite pour N
  stands : … Une fois l'événement ouvert, la mise en place est figée : tu pourras seulement ajouter du réassort. » avec
  [Faire la mise en place] [Ouvrir quand même] [Annuler]. Sinon, la confirmation habituelle. Si la vérification échoue, la
  confirmation habituelle reste là (jamais bloquant).
- En direct, avant l'ouverture, le jour même : bandeau « Mise en place à faire avant l'ouverture : N stands (…) », avec le
  lien « Faire la mise en place ».
- `apps/web/src/pages/stock/Stock.tsx` : l'adresse `/stock?onglet=mep&evenement=<id>` ouvre directement l'onglet « Mise en
  place » de l'événement.

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Garde-fou (serveur, vraie base) | `vitest run test/garde-fou-ouverture.test.ts --pool=forks --maxWorkers=1` | 5 réussis : 2 stands signalés, pas le stand vide ; alerte le jour même seulement ; mise en place de produit puis d'ingrédient → plus rien ; [F] ouverture jamais bloquée ; [F] option Stock coupée → rien |
| Non-régression (serveur) | `test/alertes.test.ts`, `test/stock.test.ts`, `test/stock-ingredients.test.ts`, `test/conditionnement.test.ts` | 9 + 11 + 11 + 6 réussis |
| Écrans | `vitest run src/pages/direct src/pages/stock src/pages/caisse src/pages/alertes` | 12 + 39 réussis (confirmation habituelle, garde-fou avec « Ouvrir quand même », rappel du jour même, pas de rappel un autre jour) |
| Types | `tsc --noEmit` (serveur, écran, moteur) | sans erreur |

Changement de test par décision : la confirmation d'En direct dit désormais « La mise en place est faite à chaque stand ;
elle sera figée… » (`EnDirect.test.tsx`).

À l'écran, en local (deux stands, un produit, un événement du jour, puis données retirées) : Caisses → « Ouvrir
l'événement » → bandeau orange « Mise en place non faite pour 2 stands : Buvette Nord, Buvette Sud » ; « Faire la mise en
place » ouvre Stock › 2. Mise en place sur l'événement ; Centre d'alertes : « Mise en place à faire avant … : 2 stands » ;
En direct : bandeau du jour au-dessus de « Ouvrir l'événement ».

**Risques restants** : l'alerte ne part pas sur le téléphone (elle est dans le Centre d'alertes et En direct) ; un stand
dont la mise en place a été saisie puis remise à 0 compte comme « fait » (il y a eu une saisie).

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne sur le serveur de test ; aucune migration ; retour
arrière = commit précédent.

## 2. Ce qui a été construit — commits

- [`7426233`](https://github.com/Break-Eat-APP/flaix-expert/commit/742623310c9d327f531ebb55b9cc91d05e069074) — 2026-11-17 — Événements : garde-fou avant l'ouverture — stands sans mise en place signalés (confirmation « Faire la mise en place » / « Ouvrir quand même », rappel du matin même dans En direct et le Centre d'alertes) ; jamais bloquant (§15.187)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/garde-fou-ouverture.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/api/test/garde-fou-ouverture.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/packages/domain/src/alertes.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/composants/ConfirmerOuverture.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/composants/ConfirmerOuverture.tsx)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/direct/EnDirect.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/742623310c9d327f531ebb55b9cc91d05e069074/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/garde-fou-ouverture.test.ts`

- **garde-fou avant l'ouverture d'un événement**
  - aucune mise en place : les deux stands qui vendent sont signalés, pas le stand vide
  - le matin même, le Centre d'alertes prévient (la première caisse peut ouvrir l'événement) ; pas pour l'événement de demain
  - une mise en place de produit, puis d'ingrédient : le stand n'est plus signalé, l'alerte disparaît
  - [F] le garde-fou ne bloque jamais : un événement sans mise en place s'ouvre quand même
  - [F] sans l'option Stock : rien à vérifier, aucune alerte

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/garde-fou-ouverture.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
