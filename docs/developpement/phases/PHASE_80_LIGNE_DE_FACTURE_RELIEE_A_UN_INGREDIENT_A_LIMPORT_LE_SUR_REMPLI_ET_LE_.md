# Phase 80 — Ligne de facture reliée à un ingrédient ; à l'import, le sûr rempli et le ressemblant proposé

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.179 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.179 Ligne de facture reliée à un ingrédient ; seul le sûr est rempli, le reste est proposé (2026-11-12)

**Contexte** : calcul de la marge d'octobre des Spartiates (export L'Addition et factures Relais d'Or, Montaner Pietrini) :
les boissons se relient produit à produit, mais la nourriture s'achète en **ingrédients** (saucisse, pain, nachos) alors
qu'une ligne de facture ne se reliait qu'à un produit. Rémi, le 2026-11-12 : « Il faut surtout pas que FlaiX Expert propose
ou remplisse automatique des configurations faussées. Quand il ne sait pas, il doit proposer des solutions ou des
correspondances […] Je te laisse relier une ligne de facture à un ingrédient. »

**Ce qui est fait** :
- Migration 0061 : `ligne_facture_fournisseur` et `correspondance_article_fournisseur` gagnent `ingredient_id` (clé
  composée avec le lieu) et `ingredient_milli_par_unite` (quantité d'ingrédient dans une unité facturée, en millièmes de son
  unité : carton de 32 pièces = 32 000 ; fût de 30 L = 30 000 ; lot de 4,8 kg = 4 800). Produit OU ingrédient, jamais les
  deux ; ingrédient sans quantité refusé (contraintes de la base et du serveur). Copie en formation avec l'ingrédient du lieu
  de formation (fonction `synchroniser_complements_formation` redéfinie, règle n° 6).
- Validation d'une facture, case « entrer en réserve » : un ingrédient **suivi en stock** reçoit une livraison (réserve,
  coût moyen pondéré : `enregistrerLivraisonIngredient`, extraite de `stock-ingredients.ts` et partagée avec la saisie à la
  main) ; un ingrédient **non suivi** prend le prix de la facture (journal `ingredient_prix_facture`). Dans les deux cas,
  les coûts des recettes qui l'utilisent sont recalculés (`recalculerCoutsRecettes`) : la marge des produits vendus suit.
- Correspondances apprises et écran Achats › Correspondances : produit ou ingrédient, colis ou contenu.
- **Seul le sûr est rempli** à l'import (PDF, Excel, CSV) : correspondance déjà validée pour ce fournisseur, produit ou
  ingrédient du même nom, colis écrit dans le fichier. Le ressemblant (nom proche, ou nom dont tous les mots figurent dans le
  libellé : `proposerPourArticle`), le colis deviné dans le libellé et la quantité d'ingrédient (pièces du carton, poids ou
  volume écrit) sont **proposés**, à accepter d'un clic ou tous ensemble — jamais choisis d'office. Avant, le produit le plus
  ressemblant et le colis deviné étaient pré-remplis.

**Vérifié** : `facture-ingredient.test.ts` (4, dont [F] produit et ingrédient à la fois, quantité absente, ingrédient d'un
autre lieu) : 2 cartons de 32 saucisses à 54,15 € → 64 saucisses en réserve à 1,69 € ; pain non suivi au prix de la facture ;
coût du hot dog recalculé. `formation-complements` (copie de l'ingrédient), `Factures.test.tsx` ([F] rien de ressemblant
n'est choisi d'office), `factures-import.test.ts`. À l'écran, en local, avec la facture fictive au format Relais d'Or :
« Frites » et « Steak haché VBF » proposés sans être choisis ; le steak accepté comme ingrédient en kg, « 4,8 kg ? » proposé.

**Marge d'octobre des Spartiates** (calcul hors logiciel, sur les vrais fichiers, coûts du 8 octobre ; hot dog = « Box
hotdog maxi porc 32x160g » 54,15 € / 32 = 1,69 €, pain compris selon Rémi, à confirmer ; box = hot dog + nachos 2,44 €) :
hot dog 73 %, box hot dog 54 % ; avec les boissons et le reste, 97 % du chiffre d'affaires HT chiffré, marge 68 % (sauces,
garnitures et emballages non comptés ; eau offerte en octobre). Dans FlaiX Expert, ce calcul se fait seul une fois les
produits L'Addition reliés, les recettes saisies et les factures validées.

**Reste** : copier le catalogue et les correspondances d'un lieu à un autre du même directeur ; reprendre dans le compte réel
de Rémi la liaison des 27 produits L'Addition et les recettes (hot dog, box hot dog, toppings).

## 2. Ce qui a été construit — commits

- [`1d5f58f`](https://github.com/Break-Eat-APP/flaix-expert/commit/1d5f58f9e642c012849f3deb670bbeed0a3b7d1b) — 2026-11-12 — Factures (§15.179) : une ligne se relie à un ingrédient — livraison en réserve s'il est suivi, prix repris sinon, coûts des recettes recalculés ; correspondances apprises avec l'ingrédient ; migration 0061 (et copie en formation)
- [`2f1a337`](https://github.com/Break-Eat-APP/flaix-expert/commit/2f1a337604ffb9f503d5b03e23015bfd262803b7) — 2026-11-12 — Factures (§15.179) : produit ou ingrédient au choix à l'écran et dans les correspondances ; seul le sûr est rempli (appris, même nom, colis du fichier), le ressemblant et le colis deviné sont proposés ; proposition par mots contenus dans le libellé

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0061_facture_vers_ingredient.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/db/migrations/0061_facture_vers_ingredient.sql)

### Tests

- `apps/api/test/facture-ingredient.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/api/test/facture-ingredient.test.ts)
- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/api/test/facture-reserve.test.ts)
- `apps/api/test/formation-complements.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/api/test/formation-complements.test.ts)
- `packages/domain/src/factures-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/packages/domain/src/factures-import.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/packages/domain/src/factures-import.ts)
- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/packages/domain/src/factures.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/api/src/routes/factures.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/api/src/routes/stock-ingredients.ts)

### Écrans (apps/web)

- `apps/web/src/pages/achats/Correspondances.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/web/src/pages/achats/Correspondances.tsx)
- `apps/web/src/pages/factures/article.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/web/src/pages/factures/article.tsx)
- `apps/web/src/pages/factures/Factures.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/web/src/pages/factures/Factures.test.tsx)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2f1a337604ffb9f503d5b03e23015bfd262803b7/apps/web/src/pages/factures/Factures.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/facture-ingredient.test.ts`

- **facture fournisseur : ligne reliée à un ingrédient**
  - [F] produit et ingrédient à la fois, quantité d'ingrédient absente, ingrédient d'un autre lieu : refusés
  - enregistrée : la ligne garde l'ingrédient et sa quantité ; pas d'alerte de colis pour un ingrédient
  - validée avec entrée en réserve : 64 saucisses en réserve au prix de la facture, pain au prix de la facture, coût du hot dog recalculé
  - l'article est retenu : correspondance vers l'ingrédient et sa quantité, reprise à la facture suivante

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/facture-ingredient.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
