# Phase 81 — Catalogue copié d'un lieu à l'autre du même client ; composer un produit simplement

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.180 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.180 Copier le catalogue d'un lieu à l'autre ; composer un produit simplement (2026-11-12)

**Contexte** : Rémi, le 2026-11-12, « ok lance » pour la copie du catalogue entre lieux, et : « Il faut que ce soit facile
[…] lorsque tu vas faire l'addition de plusieurs ingrédients dans un produit comme le hot dog […] Il peut y avoir aussi
des hot dogs qui sont déjà fournis avec le pain. Peut-être que d'autres achèteront que la saucisse […] il faut que ce soit
facile d'utilisation. »

**Constat** : un directeur de plusieurs lieux est toujours connecté au premier ; l'application ne permet pas de changer de
lieu. La copie se fait donc là où les lieux s'ouvrent : le back-office FlaiX Expert.

**Ce qui est fait** :
- Migration 0062, `copier_catalogue_editeur(source, cible)` : catégories, produits et leur prix en vigueur, ingrédients et
  recettes, emballages et conditionnement, correspondances des factures fournisseurs (vers le produit ou l'ingrédient du même
  nom). Réservée à l'éditeur ; **seulement entre deux lieux qui ont un directeur actif en commun** (le catalogue d'un client
  ne va jamais chez un autre) ; **rien n'est écrasé** : un élément du même nom déjà présent est gardé et sert de lien ; une
  recette ou un conditionnement ne s'ajoute qu'à un produit qui n'en a pas. Ni stands, ni caisses, ni ventes, ni stock. Les
  éléments copiés sont signés du directeur commun (un lieu ne voit que ses membres ; une première version signée du compte
  éditeur rendait les prix copiés invisibles, vu au test) ; le journal du lieu (`catalogue_copie`) dit que la copie vient de
  FlaiX Expert. Les coûts des recettes sont recalculés avec les prix du lieu rempli.
- Back-office, fiche d'un lieu : « Copier le catalogue d'un autre lieu de ce client », qui ne propose que les lieux au
  directeur commun, et dit ce qui a été ajouté.
- Recette d'un produit : « Nouvel ingrédient » créé sans quitter le produit (et ajouté à la recette, quantité à dire) ;
  **marge par portion en direct** (prix de vente HT en vigueur, ingrédients, emballages) ; aide repliable avec les trois cas
  du hot dog : livré complet (un ingrédient), saucisse et pain à part (deux), box = hot dog + nachos.

**Vérifié** : `catalogue-copie.test.ts` (3, dont [F] deux clients différents : refusé, rien de copié ; seconde copie : rien
d'ajouté ; produit déjà présent : prix gardé, recette reçue, coût recalculé). Tests des écrans (paramètres, back-office,
factures, achats : 17). À l'écran, en local : « Hot dog complet » créé depuis la box, coût 1,69 €, marge 81 % affichés.

**Reste** : changer de lieu dans l'application pour un directeur de plusieurs lieux (aujourd'hui, le premier seulement).

## 2. Ce qui a été construit — commits

- [`2ed8cbc`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ed8cbc0dc573c40456ef3b389e884887bdcf371) — 2026-11-12 — Back-office (§15.180) : copier le catalogue d'un lieu dans un autre du même client — catégories, produits et prix, ingrédients et recettes, emballages, correspondances fournisseurs ; rien n'est écrasé ; refusé entre deux clients (migration 0062)
- [`e550426`](https://github.com/Break-Eat-APP/flaix-expert/commit/e5504267fa3a38624bf30c5ce2a7906d98a62c43) — 2026-11-12 — Recette d'un produit (§15.180) : créer un ingrédient sans quitter le produit, marge par portion en direct, exemples du hot dog (complet, saucisse et pain à part, box)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0062_copie_catalogue.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/db/migrations/0062_copie_catalogue.sql)

### Tests

- `apps/api/test/catalogue-copie.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/apps/api/test/catalogue-copie.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/packages/domain/src/editeur.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/apps/api/src/routes/editeur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/parametres/Recettes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e5504267fa3a38624bf30c5ce2a7906d98a62c43/apps/web/src/pages/parametres/Recettes.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/catalogue-copie.test.ts`

- **copie du catalogue entre deux lieux du même client**
  - [F] deux lieux sans directeur commun (deux clients) : refusé, rien n'est copié
  - copié : ce qui manque est ajouté ; le produit déjà là garde son prix et reçoit la recette ; journal du lieu rempli
  - une seconde copie n'ajoute rien

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/catalogue-copie.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
