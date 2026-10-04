# Phase 35 — Cibles de marge et gestion financière de la soirée

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.132 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.132 Cibles de marge et gestion financière de la soirée (2026-10-04)

**Demande de Rémi** : *« passe aux cibles de marge et à la gestion financière »* — modules 5 (cibles, §15.78) et 11 (gestion financière, §14 module 11, §15.79, §15.81), validés sur le prototype.

**Réalisé** (migration 0027, moteur `finances.ts`, phase 35) :
- **Cibles de marge brute** (marge brute ÷ CA HT) : par catégorie, et par produit quand elle est saisie, qui prime (`cibleEffective`, la règle unique du §15.78). Aucune valeur proposée d'avance (décision du §14 module 5). Saisies dans Paramètres → **Objectifs de marge** (catégories) et sur la fiche produit (cible propre). Journalisées (`cible_marge_modifiee`).
- **Où elles se voient** : Produits & prix — la marge au prix du moment, comparée à la cible, dans la fiche et dans la liste (pastille « sous la cible »), et **dès la frappe d'un nouveau prix, avant de l'enregistrer** (l'alerte « marge configurée » demandée au §14, ligne 2136) ; Résultats → Marges — colonne « Cible » sur la marge réalisée (« tenue · +3 pt », « sous la cible · −86 pt ») ; « À surveiller » — « N produits sous leur cible de marge ». Sans cible ou sans coût : rien n'est jugé.
- **Gestion financière de la soirée** (Résultats → Finances, refait) : bandeau de périmètre (« tout cet écran porte sur la seule soirée … »), quatre chiffres (encaissé avec par ticket et par spectateur, CA HT, marge brute, marge nette jugée par rapport à sa cible), cascade complète jusqu'à la **marge nette de la soirée** = marge brute − personnel (planning d'Équipe) − dépenses de la soirée, TVA par taux, moyens de paiement. Coût matière et personnel sont **calculés et non saisissables** (décision du §14 module 11).
- **Dépenses de la soirée** : postes nommés librement par le lieu (Paramètres → Objectifs de marge, avec des suggestions à ajouter d'un clic, rien de créé d'office) ; un poste se **désactive, il ne se supprime jamais** ; montant saisi soirée par soirée, **en euros ou en % du CA HT** (§15.79). Chaque saisie est journalisée avec avant et après (`depense_soiree_saisie`). Un poste désactivé ne reçoit plus de saisie, mais les soirées passées gardent leurs montants.
- **Cible de marge nette de la soirée** (§15.79) : gabarit du lieu (Paramètres → Objectifs de marge), ajustable pour une soirée (Résultats → Finances), « Revenir à la cible du lieu ». Affichée en % et en euros ; « cible tenue » ou « sous la cible » avec l'écart en euros.
- **Rapport de soirée** : la cascade comprend désormais les dépenses de la soirée ; le rapport fige les dépenses et la cible **telles qu'au moment de la clôture**. Une facture saisie après la clôture modifie Finances, pas le rapport. Les rapports établis avant le 2026-10-04 le disent.
- **Mode formation** : cibles et postes recopiés dans le jumeau à chaque entrée.
- **Pas encore** : commission et frais de paiement du Click & Collect dans la cascade (attendent l'import des ventes C&C) ; vue « saison » de Finances ; charges de structure (hors périmètre, décision de Rémi du 11/09).
- **Tests** : moteur 11 (dont l'exemple des frites du dossier : 68,3 % pour une cible de 70 %, −0,07 € par vente), serveur 12, écran 3. Vérifié dans le navigateur.

## 2. Ce qui a été construit — commits

- [`074647f`](https://github.com/Break-Eat-APP/flaix-expert/commit/074647f3a6d171ab1f4b33201e211395759a1efa) — 2026-10-04 — Cibles de marge et gestion financière de la soirée (modules 5 et 11, dossier §15.132)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0027_cibles_finances.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/db/migrations/0027_cibles_finances.sql)

### Tests

- `apps/api/test/finances.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/test/finances.test.ts)
- `apps/api/test/rapport-soiree.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/test/rapport-soiree.test.ts)
- `packages/domain/src/finances.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/finances.test.ts)
- `packages/domain/src/rapport-soiree.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/rapport-soiree.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/finances.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/finances.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/modele.ts)
- `packages/domain/src/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/packages/domain/src/rapport-soiree.ts)

### Serveur (apps/api)

- `apps/api/src/routes/finances.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/src/routes/finances.ts)
- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/src/routes/produits.ts)
- `apps/api/src/routes/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/src/routes/rapport-soiree.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/App.tsx)
- `apps/web/src/composants/cibles.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/composants/cibles.tsx)
- `apps/web/src/pages/parametres/Objectifs.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/parametres/Objectifs.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/resultats/Finances.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/resultats/Finances.test.tsx)
- `apps/web/src/pages/resultats/Finances.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/resultats/Finances.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/resultats/RapportSoiree.test.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/resultats/RapportSoiree.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/apps/web/src/resultats.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/074647f3a6d171ab1f4b33201e211395759a1efa/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/finances.test.ts`

- **cibles de marge (module 5)**
  - sans cible saisie, rien n'est jugé
  - cible de la catégorie : la bière (79,4 % réalisés) passe sous une cible de 90 % ; alerte et journal
  - la cible du produit prime sur celle de sa catégorie : 70 % pour la bière, tenue
  - [F] une cible hors de 0 à 100 % est refusée
- **gestion financière de la soirée (module 11)**
  - sans dépense ni cible : la cascade s'arrête aux chiffres calculés, aucun jugement
  - postes de dépense nommés par le lieu ; [F] un nom ne sert qu'une fois ; journalisés
  - dépenses en euros et en pourcentage du CA HT : la marge nette de la soirée les retire ; journalisées
  - [F] un pourcentage au-delà de 100 % est refusé ; une dépense retirée disparaît du calcul
  - cible de marge nette : le gabarit du lieu, puis une cible propre à l'événement qui prime
  - [F] poste désactivé : il ne se supprime pas, ses montants passés restent ; pas de nouvelle saisie
  - le rapport de soirée fige les dépenses et la cible du moment de la clôture
  - [F] le directeur d'un autre lieu ne touche ni aux postes ni aux dépenses de ce lieu

### `packages/domain/src/finances.test.ts`

- **cibles de marge (module 5)**
  - la cible du produit prime sur celle de sa catégorie ; sans aucune, pas de cible (jamais inventée)
  - exemple du dossier : frites 4,50 € TTC à 5,5 %, coût 1,35 €, cible 70 % → 68,3 %, sous la cible de 1,7 point, −0,07 € par vente
  - bière pression 25 cl, 5,00 € à 20 %, coût 1,217 € : tient tout juste sa cible de 70 % (70,8 %)
  - [F] coût manquant : pas de marge configurée (jamais 100 %) ; sans cible, le taux s'affiche sans être jugé
- **dépenses de la soirée et cible de marge nette (module 11)**
  - une dépense en euros reste telle quelle ; en pourcentage, elle porte sur le CA HT de la soirée
  - marge nette comparée à sa cible : 8 776 € pour 16 606 € HT, cible 50 % → tenue de 473 €
  - sans cible : rien n'est jugé ; marge nette incalculable : la cible s'affiche, l'écart non
  - saisie d'un pourcentage : virgule acceptée, bornes respectées

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/finances.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/finances.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
