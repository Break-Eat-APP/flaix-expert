# Phase 22 — Décisions du 2026-10-01 et recettes

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.117, §15.119 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.117 Réponses de Rémi du 2026-10-01 : fidélité, hors connexion, factures, e-mails, options par lieu, recettes

**Message de Rémi (verbatim, extraits)** : *« [Base des abonnés dans FlaiX] ok — [caisse sans réseau] je veux créer le logiciel en url et en mode application aussi, quelles sont les conséquences afin que ça puisse fonctionner en hors connexion ? — [tolérance des factures] ok — [service d'e-mails] ok j'ai un compte brevo on verra plus tard — [facturation Break Eat] ok dans mon back office je décide de quel lieu a activer certaines options — les recettes, donc c'est un ensemble de tableau ou autre qui compile plusieurs produits (tomate, steak, salade, pain) afin de calculer le prix de revient d'un burger ou autres produits, objectif relié le coût des produits au kg/litre à la création d'un produit ; donc moi je vois bien le directeur rentrer tous ces produits à l'unité tomate salade etc. puis dans la recette il vient donner un nom au produit et coche chaque produit qui vont permettre la création du produit avec le poids (100 g de tomates) = 0,25 € + salade 0,10 € = 2,00 € de coût de fabrication du burger. »*

**Décisions actées** :
1. **Base des abonnés dans FlaiX** en attendant le raccordement à l'app Break Eat (§15.114) : validé.
2. **Tolérance des écarts de factures** : max(0,50 €, 1 % du montant livré) — **validée** (§15.115).
3. **Service d'envoi d'e-mails** : Brevo (compte existant de Rémi), à brancher plus tard (campagnes, rapport de soirée, notification des rectifications).
4. **Options par lieu** : Rémi active ou désactive, **depuis son back-office**, les options de chaque lieu ; base de la facturation Break Eat (12a). Construit (§15.118) ; liste proposée, à ajuster par Rémi.
5. **Recettes** : spécification de Rémi ci-dessus — ingrédients saisis à l'unité de mesure (kg, litre, pièce) avec leur prix, recette = ingrédients cochés avec leur quantité, coût de fabrication calculé. Construit (§15.119).

**Réponse donnée sur « en URL et en application » et le hors connexion** : c'est le même logiciel, ouvert soit par l'adresse, soit installé comme application (icône sur l'écran d'accueil, plein écran) — application web installable ; une application de magasin (App Store / Play Store) est possible plus tard mais coûte (99 $/an chez Apple, validation à chaque mise à jour) sans rien apporter au hors connexion. **Le hors connexion est identique dans les deux cas** : sans réseau, une tablette ne connaît que ce qu'elle savait avant la coupure. Marche déjà : vendre, encaisser, sceller, rouvrir l'application ; gagner des points (calculés après coup). Ne peut pas être vérifié hors ligne : ce qui est partagé entre tablettes (solde de points, plafond d'un code promo, stock en direct). **Question posée à Rémi** : dépenser des points / code plafonné **seulement avec réseau** (option A, recommandée, aucun risque) ou **aussi hors ligne avec un plafond par ticket** (option B, double dépense possible pendant une coupure, signalée au retour).

**Suite du 2026-10-01 — choix de Rémi : option A.** *« A points et codes plafonnés seulement avec réseau. »* Dépenser des points et utiliser un code promo **plafonné** demandent le réseau (« indisponible sans réseau » sinon) ; un code **sans plafond** (seulement des dates) marche hors ligne, la tablette gardant la liste des codes valides ; gagner des points marche toujours (calculés après coup sur les tickets). Rémi a aussi demandé ce qui se passe pour 10 caisses coupées 10 minutes puis 1 heure, client payé sur TPE externe — réponse donnée d'après le code (§15.97) : vente, numérotation et scellement continuent sur chaque tablette, ticket écrit sur la tablette avant d'être affiché encaissé, « Hors ligne · N en attente » ; au retour, renvoi automatique (toutes les 8 s et au retour du réseau), vérification par le serveur, heure de vente réelle conservée et heure de réception notée, jamais de double ; clôture de caisse et de match impossibles sans réseau (reportées, même au lendemain) ; vue En direct figée pendant la coupure ; risque réel : tablette perdue, cassée ou navigateur vidé avant le renvoi. Recommandation : Wi-Fi réservé aux caisses + routeur 4G/5G de secours.

### 15.119 Recettes (2026-10-01)

**Spécification de Rémi** (§15.117) : ingrédients saisis à l'unité (kg, litre, pièce) avec leur prix ; dans la recette, on coche les ingrédients et leur poids ; *« 100 g de tomates = 0,25 € + salade 0,10 € = 2,00 € de coût de fabrication du burger »*.

**Construit** (Paramètres → Produits & prix ; migration `0019`) :
- **Ingrédients** (bouton « Ingrédients ») : nom, unité d'achat (kilo, litre, pièce — figée après création), **prix HT par unité**, actif ou non ; nombre de recettes qui l'utilisent. Changer un prix **recalcule le coût de toutes les recettes** qui l'utilisent ; le journal technique liste les produits recalculés (avant → après).
- **Recette** dans la fiche d'un produit : ingrédients et quantités (en **grammes**, **centilitres** ou **pièces**, demi-pièce possible), coût de chaque ligne et **coût de fabrication en direct**. Coût de fabrication = Σ prix × quantité, calculé exact puis arrondi une fois au centime.
- **Le coût de fabrication devient le coût matière du produit** : marges, résultats, coûts par buvette, export l'utilisent sans changement. Un produit avec recette : coût matière non modifiable à la main, et **pas de livraison** (ce sont ses ingrédients qui s'achètent). Retirer la recette : le coût reste le dernier calculé et redevient modifiable.
- Recopie en mode formation, en lecture seule.

**Pas construit (à décider par Rémi)** : le **stock au poids** — déduire les grammes de chaque ingrédient du stock à chaque burger vendu, livraisons et inventaire des ingrédients en kg. C'est la suite naturelle, mais elle change le module Stock.

**Vérifié** : 6 tests du calcul (exemple de Rémi : tomates 0,25 + salade 0,10 + steak 1,20 + pain 0,45 = 2,00 € ; litres en cl ; demi-pièce ; arrondi unique) ; 7 tests contre la base (recette à 2,00 € devenue coût matière ; tomates à 3,00 €/kg → burger recalculé à 2,05 € et journalisé ; doublon refusé ; coût manuel et livraison refusés ; formation ; retrait de la recette). Navigateur : ingrédients saisis, recette du « Burger maison » (tomates 100 g, steak 120 g, pain 1) → 1,90 € en direct, enregistré comme coût matière.

## 2. Ce qui a été construit — commits

- [`3abfb38`](https://github.com/Break-Eat-APP/flaix-expert/commit/3abfb38bc013cd7cd8167690ba9ca1b498200207) — 2026-10-01 — Décisions de Rémi du 2026-10-01 (dossier §15.117) : tolérance des factures validée, base fidélité, Brevo, options par lieu, recettes ; réponse sur le hors connexion
- [`92de462`](https://github.com/Break-Eat-APP/flaix-expert/commit/92de4627a1c71f49ffc38196e034bf5fe84e95e0) — 2026-10-01 — Recettes, serveur : ingrédients au kg/litre/pièce, recette d'un produit, coût de fabrication = coût matière recalculé à chaque changement de prix, recopie en formation (migration 0019)
- [`c6aae54`](https://github.com/Break-Eat-APP/flaix-expert/commit/c6aae5476b9450542850564c8393a0edda7567ea) — 2026-10-01 — Recettes, écrans : ingrédients (Produits & prix → Ingrédients), recette dans la fiche produit avec coût de fabrication en direct
- [`929f16a`](https://github.com/Break-Eat-APP/flaix-expert/commit/929f16a8e962ef83d5668fac57809e5822642849) — 2026-10-01 — Dossier : choix de Rémi, option A (points et codes plafonnés avec réseau) ; réponse sur les coupures de réseau

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0019_recettes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/db/migrations/0019_recettes.sql)

### Tests

- `apps/api/test/recettes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/api/test/recettes.test.ts)
- `packages/domain/src/recettes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/recettes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/factures.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/modele.ts)
- `packages/domain/src/recettes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/packages/domain/src/recettes.ts)

### Serveur (apps/api)

- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/api/src/routes/produits.ts)
- `apps/api/src/routes/recettes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/api/src/routes/recettes.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/api/src/routes/stock.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/parametres/Recettes.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/apps/web/src/pages/parametres/Recettes.tsx)

### Documentation

- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/929f16a8e962ef83d5668fac57809e5822642849/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/recettes.test.ts`

- **ingrédients**
  - [F] un nom déjà pris est refusé ; une unité inconnue aussi
- **recette du burger (exemple de Rémi)**
  - 100 g de tomates, 25 g de salade, 120 g de steak, 1 pain → 2,00 € ; devient le coût matière
  - [F] un ingrédient en double dans la recette est refusé
  - les tomates passent à 3,00 €/kg : le burger est recalculé seul (2,05 €), et c'est journalisé
  - [F] un produit avec recette : ni coût saisi à la main, ni livraison
- **mode formation**
  - ingrédients et recettes recopiés ; ils ne se modifient pas dans le lieu d'entraînement
- **retirer la recette**
  - le coût reste le dernier calculé et redevient modifiable

### `packages/domain/src/recettes.test.ts`

- **coût de fabrication — l'exemple du burger de Rémi**
  - 100 g de tomates à 2,50 €/kg = 0,25 €
  - tomates 0,25 + salade 0,10 + steak 1,20 + pain 0,45 = 2,00 €
  - liquides au litre, saisis en cl ; pièces fractionnées
  - le coût se calcule exact puis s'arrondit une fois, au total
- **saisie des quantités**
  - g, cl et pièces → millièmes, et retour
  - vide, nul ou illisible : refusé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/recettes.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/recettes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
