# Phase 34 — Rapport de soirée figé à la clôture, imprimable et en PDF

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.131 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.131 Rapport de soirée figé à la clôture de l'événement (2026-10-04)

**Demande de Rémi** : *« passe au rapport de soirée »* — module 9, validé le 2026-09-12 (§14, module 9) : à la fin de la clôture d'un événement, une synthèse complète de la soirée, sans ressaisir un chiffre, à sortir en PDF.

**Réalisé** (migration 0026, moteur `rapport-soiree.ts`, phase 34) :
- **Il ne recalcule rien** : il lit Résultats (ventes, TVA par taux, stands, catégories, produits, alertes), l'assistant de Clôture (tiroirs et coffre), le Stock (écarts de comptage, produits et ingrédients), l'Équipe (personnel de la soirée) et le Z de l'événement. Deux calculs seulement lui sont propres, comme décidé au §14 : la **cascade** (encaissé TTC − TVA = CA HT ; − coût matière = marge brute ; − personnel = marge nette de la soirée ; « non calculable » avec la raison dès qu'une donnée manque) et la **comparaison avec l'événement joué juste avant** (écart et écart %, jamais une moyenne ; premier événement : pas de comparaison).
- **Figé** : établi dans la même transaction que la clôture de l'événement, puis rangé dans une table en écriture seule (`rapport_soiree`, un par événement), scellé par son empreinte (SHA-256 du contenu canonique, de sa date et de sa façon d'être établi), journalisé (`rapport_soiree_etabli`). L'empreinte est recontrôlée à chaque lecture : « Intègre » ou « ANOMALIE ». Un coût d'achat changé ensuite modifie Résultats, pas le rapport. Une rectification de Z faite après la clôture figure dans Clôtures, pas dans le rapport (le document le dit).
- **Événements clos avant l'existence du rapport** : le rapport est établi à la première consultation, marqué « a posteriori ».
- **Contenu** : l'essentiel (encaissé, tickets, panier moyen, CA par spectateur, marge nette) ; résultat de la soirée en cascade avec la part du CA HT ; bandeau « la marge nette de la soirée n'est pas le bénéfice du lieu » (loyer, salaires permanents, assurance, amortissements, impôt non déduits) ; comparaison ; ventes par moyen de paiement, TVA par taux, stand, catégorie, annulations et réductions (remises, offerts, codes promo et points) ; top 3 produits par marge et par quantité ; contrôle des espèces (attendu, compté, écart, motif, rectification, coffre) ; écarts de stock valorisés ; « À surveiller » (instantané) ; pied avec date, auteur, Z, total perpétuel, empreinte. Mode formation : mention FACTICE.
- **Écran** : une page à part, sans menu (`/rapport-soiree/:id`), ouverte depuis Résultats → Rapports de soirée et depuis Clôtures (événement clos). Bouton « Imprimer ou enregistrer en PDF » : impression du navigateur (décision du §14), mise en page A4 toujours sur fond blanc, même si l'écran est en mode sombre.
- **Pas encore** : l'envoi automatique par e-mail à la clôture (attend le service d'e-mails, Brevo, §15.95) ; commission C&C, frais de paiement et autres dépenses dans la cascade (viendront avec la gestion financière et les cibles de marge).
- **Tests** : moteur 9 (cascade, comparaison, top, espèces avec rectification et coffre, écarts de stock, empreinte), serveur 7 (pas de rapport avant la clôture, établi à la clôture et journalisé, cascade et comparaison réelles, figé malgré un coût changé, base qui refuse modification et suppression, a posteriori une seule fois, autre lieu refusé), écran 4. Vérifié dans le navigateur (écran, téléphone, mode sombre).

## 2. Ce qui a été construit — commits

- [`8cc5951`](https://github.com/Break-Eat-APP/flaix-expert/commit/8cc595142e87b87cec009b42aa1f43b1a60b4a71) — 2026-10-04 — Rapport de soirée figé à la clôture de l'événement, imprimable et en PDF (module 9, dossier §15.131)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0026_rapport_soiree.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/db/migrations/0026_rapport_soiree.sql)

### Tests

- `apps/api/test/rapport-soiree.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/api/test/rapport-soiree.test.ts)
- `packages/domain/src/rapport-soiree.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/packages/domain/src/rapport-soiree.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/packages/domain/src/journal-technique.ts)
- `packages/domain/src/rapport-soiree.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/packages/domain/src/rapport-soiree.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/rapport-soiree.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/api/src/routes/rapport-soiree.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/App.tsx)
- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/pages/resultats/RapportSoiree.test.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/pages/resultats/RapportSoiree.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8cc595142e87b87cec009b42aa1f43b1a60b4a71/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/rapport-soiree.test.ts`

- **rapport de soirée : établi et figé à la clôture de l'événement**
  - événement pas encore clos : pas de rapport (jamais des chiffres provisoires)
  - clôture de l'événement : le rapport est établi dans la foulée, inscrit au journal, intègre
  - cascade complète, comparaison avec l'événement précédent, top produits, espèces et Z
  - [F] le rapport ne bouge plus : un coût changé après coup modifie Résultats, pas le rapport figé
  - [F] ni le serveur ni le propriétaire de la base ne peuvent modifier ou supprimer un rapport
  - événement clos avant que le rapport existe : établi à la première lecture, « a posteriori », une seule fois
  - [F] le directeur d'un autre lieu ne lit pas ce rapport

### `packages/domain/src/rapport-soiree.test.ts`

- **rapport de soirée : cascade du résultat**
  - exemple du dossier (12/09) : 18 640 € encaissés − 2 034 € de TVA = 16 606 € HT ; − 3 062 € de matière = 13 544 € ; − 4 013 € de personnel = 9 531 €
  - une donnée manquante ne s'estime pas : la suite de la cascade reste vide, avec la raison
- **rapport de soirée : comparaison avec l'événement précédent**
  - écart et pourcentage ; sans événement précédent, pas de comparaison (jamais une baisse de 100 %)
- **rapport de soirée : top produits**
  - trois par marge (sans les coûts manquants), trois par volume
- **rapport de soirée : contrôle des espèces**
  - un tiroir par caisse qui acceptait les espèces ; la rectification signée fait foi ; le coffre compte dans l'écart total
  - sans remontée au coffre, pas de ligne coffre
- **rapport de soirée : écarts de stock**
  - seuls les écarts non nuls ; les ingrédients dans leur unité ; la valeur totale additionne ce qui est valorisé
  - stock non suivi sur l'événement : section vide, dite comme telle
- **rapport de soirée : document figé**
  - [F] l'empreinte change dès qu'un chiffre change ; l'ordre des clés relues de la base n'y change rien

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/rapport-soiree.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/rapport-soiree.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
