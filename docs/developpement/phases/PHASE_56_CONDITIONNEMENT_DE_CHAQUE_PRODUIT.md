# Phase 56 — Conditionnement de chaque produit

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.155 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.155 Conditionnement de chaque produit (2026-10-11)

**Demande de Rémi** (2026-10-10) : *« ce que nous avons oublié… les prix du conditionnement pour chaque produit…
le conditionnement, tu peux le mettre à chaque produit, je pense que c'est mieux »* ; le 2026-10-11 : *« fais le
conditionnement aussi… enchaîne sans me demander »*.

**Décisions** :
- **Une liste d'emballages par lieu** (gobelet 25 cl, gobelet 50 cl, barquette, serviette, pique, sachet, paille,
  couvercle… proposés d'un clic), chacun avec son **prix HT à l'unité au millième d'euro** (une serviette coûte souvent
  moins d'un centime). **Chaque produit** dit les emballages d'une portion et leur nombre (1 gobelet + 2 serviettes).
  Changer le prix d'un emballage met à jour tous les produits qui l'utilisent : une seule saisie.
- **Coût de revient d'une portion** = coût matière + conditionnement. Il sert à la marge comptoir et à sa cible (fiche
  produit, alertes de marge), aux marges par produit de Résultats, au coût par buvette et au résultat des caisses
  connectées. Dans la cascade, **« Conditionnement »** est une ligne à part, retirée avant la marge brute, donc dans
  « ce qu'il te reste ». Totaux calculés au millième, arrondis au centime.
- Pas d'historique du prix d'un emballage (comme le coût matière : un nouveau prix vaut aussi pour les ventes passées).
  Le stock des emballages (rupture de gobelets) n'est pas suivi : à voir plus tard.
- Un emballage se supprime avec ses liens (confirmation à l'écran s'il sert à des produits). Mode formation : recopié.
  Journal : 4 nouveaux types.

**Réalisé le 2026-10-11** : migration 0044 (tables `emballage`, `produit_emballage`, vue `produit_conditionnement`) ;
moteur (`conditionnementMillimes`, `coutDeRevient`, `conditionnementVendu`, lecture et affichage au millième) ; serveur
(routes des emballages, conditionnement d'un produit, prise en compte dans Résultats, Finances, coûts par buvette,
caisses connectées, alertes) ; écrans (Produits & prix → Emballages, conditionnement dans la fiche, marges, Finances).
**Tests** : moteur 3, serveur 4 (prix au millième, 1 gobelet + 2 serviettes = 0,136 €, 0,41 € pour 3 bières, marge du
produit 13,49 €, prix changé, emballage supprimé, refus), écran 2 ; vérifié dans le navigateur (frites : 1,40 € + 0,12 €
de gobelet, marge 2,57 €).

## 2. Ce qui a été construit — commits

- [`64619cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/64619cb481da392672ec0e171ad9321428ae4c44) — 2026-10-11 — Conditionnement de chaque produit : moteur et serveur (dossier §15.155)
- [`23a2058`](https://github.com/Break-Eat-APP/flaix-expert/commit/23a205809c1fbcea5971b797b1689575f0bf1e10) — 2026-10-11 — Conditionnement de chaque produit : écrans (dossier §15.155)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0044_conditionnement.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/db/migrations/0044_conditionnement.sql)

### Tests

- `apps/api/test/conditionnement.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/test/conditionnement.test.ts)
- `packages/domain/src/emballages.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/emballages.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/emballages.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/emballages.ts)
- `packages/domain/src/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/finances.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/modele.ts)
- `packages/domain/src/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/packages/domain/src/rapport-soiree.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/caisses-externes.ts)
- `apps/api/src/routes/couts-buvette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/couts-buvette.ts)
- `apps/api/src/routes/emballages.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/emballages.ts)
- `apps/api/src/routes/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/finances.ts)
- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/produits.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Conditionnement.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/pages/parametres/Conditionnement.test.tsx)
- `apps/web/src/pages/parametres/Conditionnement.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/pages/parametres/Conditionnement.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/resultats/Finances.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/pages/resultats/Finances.test.tsx)
- `apps/web/src/pages/resultats/Finances.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/pages/resultats/Finances.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/23a205809c1fbcea5971b797b1689575f0bf1e10/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/conditionnement.test.ts`

- **conditionnement**
  - emballages du lieu au millième d'euro ; nom en double refusé
  - emballages d'une bière : 1 gobelet et 2 serviettes = 0,136 € la portion ; [F] doublon, quantité nulle, inconnu
  - conditionnement vendu déduit avant la marge brute : Finances et Résultats
  - prix du gobelet changé : tous les produits suivent ; emballage supprimé avec ses liens ; journal
  - stock des gobelets (§15.158) : comptage, ventes déduites, livraison, seuil et alerte

### `packages/domain/src/emballages.test.ts`

- **conditionnement (§15.155)**
  - prix au millième d'euro : lecture, affichage, saisie
  - conditionnement d'une portion, coût de revient, conditionnement vendu arrondi au centime
  - cascade : le conditionnement se retire avant la marge brute

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/emballages.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/conditionnement.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
