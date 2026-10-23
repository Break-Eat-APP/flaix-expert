# Phase 66 — Remettre le stock à zéro ; supprimer un événement à venir

> FlaiX Expert · dossier de développement · généré le 2026-10-23 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-17 |
| Décision | dossier projet §15.165 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.165 Remettre le stock à zéro ; supprimer un événement à venir (2026-10-17)

**Demande de Rémi** (2026-10-17) : *« si je veux un accès aux données produits, stock… pour supprimer les stocks que
j'ai rentrés sur mon dernier événement, comment je fais ? »* puis *« je veux remettre à zéro, tu me le fais toi les
stocks, et supprime-moi les événements du 23, garde les produits et leurs tarifs »* — et *« ok go »* pour les deux
boutons proposés.

**Décisions** :
- **Pas d'effacement direct dans la base en ligne** (ni par Claude, ni par un accès donné à Rémi) : le stock et les
  événements sont tracés exprès, la base refuse elle-même les suppressions, et le journal de caisse se conserve
  (obligation légale). À la place, deux actions dans l'application, faites par le directeur, inscrites au journal.
- **Remettre le stock à zéro** (Stock › « Remettre à zéro », motif obligatoire, refusé pendant un événement ouvert) :
  rien n'est effacé ; une remise datée fait que les restes comptés avant elle ne passent plus à l'événement suivant
  (produits et ingrédients), et la réserve repart d'un inventaire à 0 pour chaque produit et ingrédient qui y avait un
  solde. Produits, tarifs et emballages ne bougent pas.
- **Supprimer un événement** (Saison, après confirmation) : **seulement un événement à venir**, jamais ouvert ; sa mise
  en place (produits, ingrédients), son planning, ses objectifs, ses dépenses et son brief partent avec lui.
  **Un événement ouvert puis clos ne se supprime pas, même sans vente** : sa clôture de caisse (niveau « match ») est
  scellée et chaînée aux autres clôtures (séquence, empreinte précédente, perpétuel) — la retirer casserait la chaîne.
  Il reste dans l'historique (à 0 € s'il n'a rien vendu) ; la remise à zéro fait qu'il ne pèse plus sur le stock.
- Base : les tables en écriture seule le restent ; seule la fonction `supprimer_evenement_a_venir` (propriétaire de la
  base) peut retirer les lignes d'un événement à venir (mise en place, brief), pendant la suppression et pour cet
  événement seulement. Toute autre trace inattendue bloque la suppression par sa clé étrangère.

**Réalisé le 2026-10-17** : migration 0053 ; serveur (POST /api/stock/remise-a-zero, DELETE /api/evenements/:id) ;
écrans (Stock, Saison). **Tests** : serveur 5 (remise refusée pendant un événement ouvert et sans motif, restes et
réserve à 0, produits et tarifs intacts ; écriture seule maintenue, même pour le propriétaire hors suppression ;
événement clos sans vente refusé ; événement à venir supprimé avec sa mise en place ; événement ouvert avec ventes
refusé, même en appelant la base directement), écran 3 ; stock, ingrédients, clôtures et conformité de la base
relancés. Pas d'essai dans le navigateur (poste à court de mémoire, deux redémarrages le 2026-10-16 et 17).

**Ajout du 2026-10-17** (retour de Rémi : *« j'arrive pas à supprimer le match du 23 Marseille vs Rouen »*) : la
corbeille n'apparaissait que sur les événements à venir, sans rien dire pour les autres. Elle est désormais sur chaque
événement ; pour un événement ouvert ou clos, elle explique pourquoi il ne se supprime pas (clôture de caisse scellée et
chaînée) et renvoie à « Remettre à zéro » dans Stock (commit 04e39ff).

## 2. Ce qui a été construit — commits

- [`f4e5aa8`](https://github.com/Break-Eat-APP/flaix-expert/commit/f4e5aa88b6979734a6be3d1f9b21989be6bc01e2) — 2026-10-17 — Remise à zéro du stock (restes et réserve, avec motif) et suppression d'un événement à venir — base, serveur
- [`325a75d`](https://github.com/Break-Eat-APP/flaix-expert/commit/325a75dbd36aec91527e5803d0c9cbd564793dae) — 2026-10-17 — Écrans : « Remettre à zéro » dans Stock (motif obligatoire), suppression d'un événement à venir dans Saison
- [`04e39ff`](https://github.com/Break-Eat-APP/flaix-expert/commit/04e39ff9bee14028ecdf78572118a157a03a1712) — 2026-10-17 — Saison : la corbeille sur chaque événement ; ouvert ou clos, elle explique pourquoi il ne se supprime pas

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0053_remise_zero_suppression_evenement.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/db/migrations/0053_remise_zero_suppression_evenement.sql)

### Tests

- `apps/api/test/remise-zero.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/api/test/remise-zero.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/api/src/routes/stock-ingredients.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Saison.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/web/src/pages/parametres/Saison.tsx)
- `apps/web/src/pages/stock/RemiseAZero.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/web/src/pages/stock/RemiseAZero.test.tsx)
- `apps/web/src/pages/stock/RemiseAZero.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/web/src/pages/stock/RemiseAZero.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/04e39ff9bee14028ecdf78572118a157a03a1712/apps/web/src/pages/stock/Stock.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/remise-zero.test.ts`

- **remise à zéro du stock**
  - refusée pendant un événement ouvert, ou sans motif ; puis restes et réserve à 0, produits et tarifs intacts
- **suppression d'un événement**
  - [F] hors suppression, le stock reste en écriture seule, même pour le propriétaire de la base ; le réglage seul n'ouvre rien à l'application
  - clos (même sans vente) : refusé, sa clôture est chaînée aux autres ; il reste dans l'historique
  - à venir : supprimé avec sa mise en place, inscrit au journal ; produits et tarifs intacts
  - ouvert, avec des ventes : refusé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/remise-zero.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
