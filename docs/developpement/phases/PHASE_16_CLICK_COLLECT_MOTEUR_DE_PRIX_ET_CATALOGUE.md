# Phase 16 — Click & Collect : moteur de prix et catalogue

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.111 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.111 Click & Collect (2026-10-01)

**Demande** : 3ᵉ module de l'ordre fixé par Rémi (§15.109). Reprise du module 13 validé (§15.28) dans sa forme finale (§15.76 : la configuration C&C par produit vit dans ce module ; Produits & prix ne garde que le prix comptoir).

**Construit** (Paramètres → Click & Collect, trois onglets) :
- **Moteur de prix** (`packages/domain/src/click-collect.ts`) : la formule corrigée de §15.20 ter, qui préserve la **marge hors taxes** du comptoir — prix app = prix buvette × (u + commission × k) ÷ (u − Stripe), u = 1 ÷ (1 + TVA du produit). Conseillé arrondi au **centime supérieur** (il couvre toujours). Vérifié sur les exemples du dossier : hot-dog 6,50 € à 10 % → 7,5661 € (+16,4 %) ; majorations 15,71 / 16,40 / 17,94 % selon la TVA ; 7,42 € si la TVA sur commission n'est pas répercutée ; à 7,50 €, « manque 0,06 € par vente ».
- **Réglages du lieu** (migration `0014`) : commission Break Eat (taux unique, sur le prix buvette), TVA sur la commission répercutée (défaut prudent, k = 1,2) ou non (k = 1,0), **contrat Stripe en pourcentage + frais fixe** et **panier moyen** de l'application → taux Stripe effectif (1,5 % + 0,25 € à 27 € = 2,43 %, comme §3). **Aucune valeur supposée** : tant que le directeur ne les a pas saisis, pas de prix conseillé.
- **Catalogue C&C** : les produits vendus dans un stand « point de retrait », au prix buvette en vigueur ; prix conseillé et majoration ; **prix appliqué** (le directeur arrondit) avec verdict « couvre / manque X € par vente » ; détail de l'encaissement dépliable (TVA produit, Stripe, commission HT, TVA sur commission, reste HT comparé au comptoir) ; **mode de stock C&C** (partagé, dédié, 100 % app). Chaque changement est inscrit au journal technique.
- **Simulateur libre** : calculateur autonome (§15.28), ne lit ni ne modifie le catalogue, prérempli avec les réglages du lieu quand ils existent.
- Recopie en **mode formation** (réglages et prix app), en lecture seule là-bas.

**Ce qui n'est pas fait, et pourquoi** : les **ventes** Click & Collect passent par l'application Break Eat ; FlaiX n'en reçoit rien pour l'instant (pas de raccordement entre les deux systèmes). Donc pas encore de CA comptoir / app par stand, ni de marge réalisée par canal, ni de stock dédié décompté. **Point déjà signalé, toujours ouvert** (§15.20) : termes réels du contrat Stripe et panier moyen mesuré — le logiciel prend ce que le directeur saisit ; la question « le lieu déduit-il la TVA sur la commission ? » reste pour l'expert-comptable.

**Vérifié** : 8 tests du moteur (exemples du dossier), 7 tests contre la base (lieu neuf vide ; catalogue limité aux points de retrait ; réglages et prix journalisés avec avant/après ; valeurs invalides refusées ; recopie en formation et refus d'y modifier) ; suites complètes 102 (moteur) et 157 (serveur). Écran vérifié dans le navigateur : bière 7,00 € à 20 % → conseillé 8,25 € (+17,9 %) ; à 8,00 € « manque 0,20 € / vente », détail 5,63 € contre 5,83 € au comptoir ; simulateur hot-dog 6,50 € → 7,57 €.

## 2. Ce qui a été construit — commits

- [`07e608a`](https://github.com/Break-Eat-APP/flaix-expert/commit/07e608af3939ccd0e187ab310bcbed679822da31) — 2026-10-01 — Click & Collect : moteur de prix (marge HT préservée, Stripe taux + fixe sur panier moyen, TVA sur commission), tests du dossier
- [`c969d9f`](https://github.com/Break-Eat-APP/flaix-expert/commit/c969d9fa35f11b681a86e86ff422b9f125428ca4) — 2026-10-01 — Click & Collect, serveur : réglages du lieu, catalogue des points de retrait, prix app et mode de stock par produit, recopie en formation (migration 0014)
- [`d9708e0`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9708e0963944998d2e891ad9a2c8b7a0fd5dcbb) — 2026-10-01 — Click & Collect : écran Paramètres → Click & Collect (catalogue, réglages du lieu, simulateur libre)
- [`d5c624d`](https://github.com/Break-Eat-APP/flaix-expert/commit/d5c624d5f88cab945153642dde9681fe120efd82) — 2026-10-01 — Docs : Click & Collect (dossier §15.111), avancement

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0014_click_collect.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/db/migrations/0014_click_collect.sql)

### Tests

- `apps/api/test/click-collect.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/api/test/click-collect.test.ts)
- `packages/domain/src/click-collect.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/packages/domain/src/click-collect.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/click-collect.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/packages/domain/src/click-collect.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/click-collect.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/api/src/routes/click-collect.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/web/src/App.tsx)
- `apps/web/src/pages/parametres/ClickCollect.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/web/src/pages/parametres/ClickCollect.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/apps/web/src/pages/parametres/Parametres.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d5c624d5f88cab945153642dde9681fe120efd82/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `packages/domain/src/click-collect.test.ts`

- **prix app conseillé**
  - hot-dog 6,50 €, TVA 10 % → 7,5661 € (+16,4 %), arrondi au centime supérieur 7,57 €
  - la marge HT du comptoir est préservée exactement au prix exact
  - la majoration dépend de la TVA du produit : 15,71 % / 16,40 % / 17,94 %
  - TVA sur commission non répercutée : 7,42 € au lieu de 7,57 €
  - commission sur le prix app : hot-dog 6,50 € → 7,7335 € (+18,98 %), marge HT du comptoir préservée
  - frais impossibles à couvrir (Stripe ≥ prix HT) : pas de prix
- **Stripe : pourcentage + frais fixe sur le panier moyen**
  - 1,5 % + 0,25 € à 27 € de panier = 2,43 % ; à 8 € = 4,63 %
- **verdict sur le prix choisi par le directeur**
  - à 7,50 € il manque 0,06 € par vente ; au prix conseillé, rien ne manque
  - cascade : payé = TVA produit + Stripe + commission HT + TVA commission + reste

### `apps/api/test/click-collect.test.ts`

- **lieu neuf**
  - rien n'est supposé : pas de réglages, pas de point de retrait, catalogue vide
- **catalogue C&C**
  - seuls les produits vendus dans un point de retrait y figurent, au prix buvette en vigueur
- **réglages du lieu**
  - [F] une commission hors bornes est refusée
  - réglés par le directeur ; le changement est journalisé
  - commission calculée sur le prix app (§15.124) : réglage enregistré et journalisé
- **prix app d'un produit**
  - prix appliqué et mode de stock enregistrés, journalisés avec l'avant et l'après
  - [F] un mode de stock inconnu est refusé
- **mode formation**
  - réglages et prix app recopiés dans le lieu d'entraînement, en lecture seule

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/click-collect.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/click-collect.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
