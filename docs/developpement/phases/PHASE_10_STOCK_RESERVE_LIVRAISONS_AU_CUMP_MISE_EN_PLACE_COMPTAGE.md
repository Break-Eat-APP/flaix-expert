# Phase 10 — Stock : réserve, livraisons au CUMP, mise en place, comptage

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.105 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.105 Stock — conception de la première version en production (2026-09-30)

Demande de Rémi (§15.99). Sources relues avant d'écrire : module 4 (§14, toutes ses versions v1 à v10 et la définition de la réserve), §15.44, §15.67, module 10 (compter les restes), organisation §15.95 (onglets Mise en place · Pendant le match · Comptage · Réserve & livraisons).

**Construit maintenant** (produits suivis à l'unité) :
1. **Réserve centrale unique** du lieu (confirmé par Rémi le 2026-09-12). Son **stock de départ se déclare par un inventaire réserve daté** ; un inventaire validé devient le nouveau point de départ. Entre deux inventaires, le solde est **calculé** (dernier inventaire + livraisons − mises en place − réassorts) et affiché comme tel (« solde calculé »), jamais comme certain ; l'écart constaté à l'inventaire est la perte au dépôt.
2. **Livraisons fournisseur** (produit, quantité, prix d'achat unitaire, fournisseur, date) → entrent en réserve et **recalculent le coût matière en CUMP** : `(solde réserve × coût actuel + quantité livrée × prix) ÷ (solde réserve + quantité livrée)`. Le CUMP devient le coût de la fiche produit (source unique pour la valorisation du stock, les écarts et les marges de Résultats) ; chaque recalcul est inscrit au journal technique.
3. **Mise en place par match et par stand** (avant l'ouverture du match, figée à l'ouverture) : quantité envoyée de la réserve au stand, avec **auteur et heure** ; **reste du match précédent** lu en direct sur le dernier comptage du même stand ; **quantité suggérée** = moyenne des ventes réelles de ce produit à ce stand sur les matchs précédents − reste, plancher 0, sans marge de sécurité ; « pas d'historique » sinon ; bouton « Appliquer toutes les suggestions ». Préparable plusieurs jours avant un match à venir.
4. **Pendant le match** : **réassort** à quantité libre, « + » et « − » (retour en réserve), horodaté et attribué ; **restant** = reste précédent + mise en place + réassort − vendu (ventes lues en direct dans le journal de caisse) ; seuil = 15 % du départ (reste + mise en place) ; alerte « faible » / « rupture ».
5. **Comptage** (match ouvert) : quantité trouvée par stand et produit → **attendu** = reste + mise en place + réassort − vendu ; **écart** = compté − attendu, valorisé **au coût matière, jamais au prix de vente** ; motif obligatoire si l'écart dépasse 3 % du départ (module 10). Le comptage se corrige tant que le match n'est pas clos, puis il est figé par la base.
6. **Clôtures → étape « Restes »** : devient obligatoire **pour un match qui a une mise en place ou un réassort** : chaque produit concerné doit être compté avant la clôture du match (§15.102 l'annonçait).
7. **Chiffres en euros par défaut** (les unités de produits différents ne s'additionnent pas, décision v5) ; en unités dès qu'un seul produit est filtré. **Journal des mouvements** visible (réserve et stands).

**Reporté, signalé** (ni données ni écran de configuration encore en production) : **matières premières suivies au poids ou au volume** (frites, lait, tenders) et **recettes / prix de revient** — ils demandent d'abord les fiches ingrédients et recettes dans Paramètres → Produits & prix ; les stocks « app » du Click & Collect (pas de Click & Collect en production) ; la détection « déplacés, pas perdus » entre deux piles d'un même stand (sans objet sans stock app). Ces produits se suivent en attendant comme les autres, à l'unité, ou pas du tout.

**Réalisé le 2026-09-30** : migration `0008_stock.sql` (`stock_mouvement` en écriture seule, mise en place figée à l'ouverture et réassort réservé au match ouvert imposés par la base ; `stock_comptage` figé à la clôture du match ; inventaires de la réserve en écriture seule) ; moteur `packages/domain/src/stock.ts` ; serveur `routes/stock.ts` ; étape « Restes » de Clôtures branchée sur le stock (requise dès qu'un match a une mise en place ou un réassort) ; écran Stock en 4 onglets (Mise en place avec suggestions, Pendant le match avec réassort « + / − » et alertes, Comptage avec motif exigé au-delà de 3 %, Réserve & livraisons avec inventaire, livraison au CUMP, inventaires passés et journal des mouvements). Stock actif dans le menu.

**Vérifié** : 5 tests du moteur (exemples validés : hot-dog Buvette Sud écart −2 soit −3,80 € ; module 10 motif requis à 17 sur 260 ; CUMP bière 25 cl 1,217 € ; seuil 15 % ; suggestion) ; 11 tests serveur (déclaration de départ sans écart, livraison et CUMP (300 × 1,90 + 200 × 1,95) ÷ 500 = 1,92 €, mise en place qui décrémente la réserve et s'inscrit en différences, réassort refusé avant l'ouverture et mise en place refusée après, retour limité au réassort, clôture du match refusée tant que les restes ne sont pas comptés, écart valorisé au CUMP et motif exigé au-delà de 3 %, correction de comptage journalisée, comptage figé après la clôture même en écrivant dans la base, reste reporté au match suivant et suggestion 160 − 28 = 132, inventaire réserve : calculé 178, compté 170, écart −8, nouveau point de départ, Résultats valorisé au CUMP) et 1 test [F] de conformité. **Essai dans le navigateur** (lieu d'essai local) : inventaire de départ (200 bières, 100 sodas) ; livraison de 100 bières à 2,40 € → coût 2,27 € ; mise en place de 48 bières à la Buvette Nord et suggestion appliquée au Bar → réserve 249, valeur 115,77 € ; match ouvert, réassort +12 → restant 60 ; compté 58 → motif demandé et enregistré, écart −4,54 € ; Clôtures : « Restes : tout est compté » ; match clos.

**Défauts trouvés et corrigés pendant l'essai** : un match sans aucune caisse ouverte était bloqué par l'assistant de clôture alors que le serveur l'acceptait ; la carte « Restes » ne s'affichait pas sur un tel match ; sans match ouvert ni à venir, Stock et Planning montraient le match à la date de calendrier la plus lointaine au lieu du dernier joué ; « produits restant à compter » affiché sur un match où le stock n'était pas suivi.

## 2. Ce qui a été construit — commits

- [`d8163c3`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8163c3ae7c7d8dc902a0343e61d41069b3c8807) — 2026-09-30 — Dossier §15.105 : conception de la première version du Stock en production
- [`292fe39`](https://github.com/Break-Eat-APP/flaix-expert/commit/292fe3901113c8d297cd808b95959985516550e3) — 2026-09-30 — Stock, serveur : réserve centrale, livraisons au CUMP, inventaires, mise en place, réassort, comptage ; étape Restes de la clôture (dossier §15.105)
- [`9b43fdd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba) — 2026-09-30 — Stock : écran en 4 onglets, étape Restes de la clôture, tests de conformité (dossier §15.105)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0008_stock.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/db/migrations/0008_stock.sql)

### Tests

- `apps/api/test/clotures.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/test/clotures.test.ts)
- `apps/api/test/conformite-base.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/test/conformite-base.test.ts)
- `apps/api/test/stock.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/test/stock.test.ts)
- `packages/domain/src/stock.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/packages/domain/src/stock.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/packages/domain/src/modele.ts)
- `packages/domain/src/stock.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/packages/domain/src/stock.ts)

### Serveur (apps/api)

- `apps/api/src/routes/clotures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/planning.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/src/routes/planning.ts)
- `apps/api/src/routes/stock.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/src/routes/stock.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/apps/web/src/styles.css)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/CLAUDE.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/stock.test.ts`

- **réserve centrale : déclaration de départ, livraison, CUMP**
  - premier inventaire = déclaration de départ, sans écart ; le solde part de là
  - livraison de 200 à 1,95 € : la réserve monte, le coût matière devient le CUMP (300 × 1,90 + 200 × 1,95) ÷ 500 = 1,92 €
- **match 1 : mise en place, réassort, comptage**
  - mise en place avant l'ouverture : la réserve se décrémente, l'auteur et l'heure sont gardés ; pas d'historique = pas de suggestion
  - pas de réassort avant l'ouverture ; après l'ouverture, plus de mise en place
  - exemple validé : départ 160, réassort 30, vendu 160 → restant 30 ; « − » ne dépasse pas le réassort
  - la clôture de l'événement exige le comptage des restes
  - compté 28 → écart −2, −3,84 € au CUMP ; sous 3 % du départ, pas de motif. Compté 20 → motif exigé
  - [F] événement clos : le comptage est figé par la base ; un mouvement ne se modifie ni ne se supprime
- **événement suivant : reste reporté, suggestion, inventaire réserve**
  - le reste compté à l'événement 1 devient le départ de l'événement 2 ; suggestion = ventes moyennes − reste
  - inventaire réserve : solde calculé 500 − 160 − 30 − 132 = 178, compté 170 → écart −8 ; le compté devient le point de départ
  - Résultats valorise au CUMP : le coût matière de la fiche est celui des livraisons

### `packages/domain/src/stock.test.ts`

- **stock — module 4 (§14, §15.105)**
  - exemple validé : Hot-dog, Buvette Sud — départ 160, entrées 30, vendu 160, compté 28 → attendu 30, écart −2, −3,80 € à 1,90 €
  - exemple validé du module 10 : mise en place 260, vendu 238, compté 5 → écart −17, motif requis (17 > 7,8)
  - seuil d'alerte à 15 % du départ : faible puis rupture
  - CUMP, exemple validé : bière 25 cl, 480 en réserve à 1,200 € + 240 livrées à 1,25 € → 1,217 € (arrondi au centime : 1,22 €)
  - suggestion : moyenne des ventes précédentes − reste, plancher 0 ; pas d'historique = pas de chiffre

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/stock.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/stock.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
