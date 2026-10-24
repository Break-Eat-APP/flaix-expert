# Phase 72 — Les chiffres de la soirée ; événements privés dans Résultats ; Click & Collect par fichier

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-21 |
| Décision | dossier projet §15.171 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.171 Les chiffres de la soirée ; événements privés dans Résultats ; Click & Collect par fichier (2026-10-21)

**Demande de Rémi** (2026-10-21) : budget des événements privés (% et reste, au regard du coût des produits) ;
conversion des spectateurs ; part du Click & Collect dans le CA, les tickets et les spectateurs ; puis « développe ça »
sur les idées proposées (articles par ticket, mi-temps et meilleure minute, productivité du personnel, pertes en % du
CA, ventes manquées par rupture, part fidélité, panier Click & Collect contre comptoir, boissons / nourriture) ; pour le
Click & Collect, « un fichier exporté de l'application pour commencer ».

**Constats** : CA par spectateur et panier moyen existaient ; FlaiX Expert ne recevait aucune vente Click & Collect
(elles passent par l'application Break Eat) ; les ventes importées d'une caisse connectée entraient déjà dans Résultats
(vues `vente_gestion`, §15.151) ; aucune famille boisson / nourriture sur les catégories.

**Décisions et réalisation** (migration 0056) :
- **Moteur `chiffres-soiree.ts`** (`chiffresSoiree`, `devinerFamille`) : conversion (tickets ÷ spectateurs), articles
  par ticket, quart d'heure le plus fort et sa part du CA, meilleure minute (un seul événement : sur une période, les
  heures de soirées différentes ne s'additionnent pas), heures de personnel (minutes réelles du planning), CA HT par
  heure de personnel et coût du personnel en % du CA HT, tickets d'abonnés (motif « abonné » des tickets de la caisse,
  annulés exclus) et panier abonné contre les autres, part boissons / nourriture / autre du CA et de la marge, Click &
  Collect (part du CA, des tickets, des spectateurs, panier contre comptoir). Donnée manquante : null, jamais supposée.
- **Mi-temps** : FlaiX Expert ne connaît pas l'heure de la mi-temps (elle dépend du sport) : il montre le quart d'heure
  le plus fort de la soirée, qui est en pratique celui de la mi-temps.
- **Famille d'une catégorie** (`categorie.famille`, boisson / nourriture / autre) : devinée d'après le nom tant qu'elle
  n'est pas choisie (« Bières » → boisson, « Snacking » → nourriture) ; liste « auto : … » à côté de chaque catégorie
  dans Produits & prix ; modification journalisée. Non recopiée en mode formation (devinée là-bas).
- **Click & Collect par fichier** : nouveau système de caisse connectée « Click & Collect (application Break Eat) »
  (`breakeat`). Ses ventes s'importent comme celles de L'Addition (option Caisses connectées), entrent dans le CA de
  l'événement et sont comptées à part pour les chiffres Click & Collect. Une liaison directe avec l'application viendra
  plus tard, avec Rémi.
- **Écran** : carte « Les chiffres de la soirée » dans Résultats › Vue d'ensemble (chaque chiffre dit ce qui lui manque,
  avec le lien) ; pertes de stock en % du CA HT (Finances) et ventes manquées par rupture (« Où je perds de l'argent »)
  repris en chiffres clés ; onglet **Événements privés** : budget, consommé TTC, budget utilisé (couleur de la jauge),
  reste du budget, marchandise au coût d'achat, frais, ce qu'il te reste, total ; sur la période choisie, sinon tous.

**Tests** : moteur 3 (familles, chiffres, données manquantes) ; serveur 3 (conversion, articles, pic, familles devinées
puis choisies, Click & Collect importé) ; écran 2 ; Résultats, paramètres et événements privés relancés ; types et
construction. Vu dans le navigateur en local (carte et onglet ; un encadré blanc corrigé à l'essai).

## 2. Ce qui a été construit — commits

- [`b75c773`](https://github.com/Break-Eat-APP/flaix-expert/commit/b75c773ad922e56cf75d3242082deacdab2974fe) — 2026-10-21 — Les chiffres de la soirée : calcul et serveur (§15.171)
- [`2561df7`](https://github.com/Break-Eat-APP/flaix-expert/commit/2561df7f117e010bf0e3b91c63dab590e20f6c74) — 2026-10-21 — Résultats : les chiffres de la soirée, onglet Événements privés ; famille des catégories (§15.171)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0056_chiffres_soiree.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/db/migrations/0056_chiffres_soiree.sql)

### Tests

- `apps/api/test/chiffres-soiree.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/api/test/chiffres-soiree.test.ts)
- `packages/domain/src/chiffres-soiree.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/chiffres-soiree.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/caisses-externes.ts)
- `packages/domain/src/chiffres-soiree.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/chiffres-soiree.ts)
- `packages/domain/src/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/evenements-prives.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/index.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/api/src/routes/evenements-prives.ts)
- `apps/api/src/routes/produits.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/api/src/routes/produits.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/api/src/routes/resultats.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/resultats/ChiffresSoiree.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/pages/resultats/ChiffresSoiree.test.tsx)
- `apps/web/src/pages/resultats/ChiffresSoiree.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/pages/resultats/ChiffresSoiree.tsx)
- `apps/web/src/pages/resultats/Prives.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/pages/resultats/Prives.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/2561df7f117e010bf0e3b91c63dab590e20f6c74/apps/web/src/resultats.css)

## 4. Tests créés dans cette phase

### `apps/api/test/chiffres-soiree.test.ts`

- **les chiffres de la soirée**
  - sans source Click & Collect : conversion, articles par ticket, pic, familles devinées
  - famille choisie pour une catégorie : elle remplace la devinette ; journalisée
  - Click & Collect de l'application Break Eat importé : part du CA, des tickets, des spectateurs, panier

### `packages/domain/src/chiffres-soiree.test.ts`

- **les chiffres de la soirée (§15.171)**
  - famille devinée d'après le nom
  - conversion, articles par ticket, pic, personnel, fidélité, familles, Click & Collect
  - [F] donnée manquante : jamais supposée

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/chiffres-soiree.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/chiffres-soiree.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
