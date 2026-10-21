# Phase 55 — Ce qu'il te reste et Mes frais

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.154 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.154 « Ce qu'il te reste » et « Mes frais » (2026-10-11)

**Demande de Rémi** (2026-10-10) : *« ce que l'on veut savoir à la fin de la soirée, c'est ce qu'il te reste dans la
poche une fois tous les frais déduits… masse salariale, coût du produit, abonnement… le but de mon logiciel, c'est
vraiment de savoir ce que l'on gagne net »* ; *« on a dû oublier certaines choses »*. Proposition validée le
2026-10-11 : *« ok prorata, commence par le 1 »*.

**Décisions** :
- **Un seul chiffre, « Ce qu'il te reste » (avant impôt)** = CA HT − marchandise vendue ± écarts de stock comptés en fin
  de soirée − personnel (coût horaire chargé) − frais de la soirée − part des frais du mois. Il remplace la « marge nette
  de la soirée » (la cible de marge nette porte désormais sur lui). Une donnée manquante le rend « pas encore
  calculable », jamais estimé. Affiché en tête de l'accueil Résultats et en carte principale de Finances.
- **Frais du mois** = frais de chaque stand (Coûts par buvette : loyer, logiciel, abonnement, TPE) + frais mensuels du
  lieu (Mes frais), datés : un montant vaut à partir de son mois sans réécrire les mois passés ; un frais s'arrête par
  un montant à 0. **Répartis au prorata du CA HT** des soirées du mois (choix de Rémi) : part = frais du mois × CA HT
  du match ÷ CA HT de tous les matchs du mois. Un mois sans chiffre d'affaires ne se répartit sur aucun match : il
  compte en entier dans le bilan d'une période qui le contient tout entier.
- **Frais de soirée** (postes de dépense) : **montant habituel** facultatif, appliqué tout seul à chaque soirée jouée
  sans saisie propre ; une saisie dans Finances le remplace pour la soirée. Nouvelle unité **« % des paiements par
  carte »** (frais bancaires), à côté de l'euro et du « % du CA HT » (commission du club).
- **Mes frais** (Paramètres) : 25 frais courants d'une buvette proposés (commission du club, frais de carte, cashless,
  gobelets non rendus, glace et gaz, sécurité, nettoyage, location, transport ; loyer, logiciels dont FlaiX Expert,
  TPE ; salaires hors soirée, assurance, énergie, téléphone, comptable, banque, hygiène, tenues, entretien, matériel
  étalé, taxes, SACEM). Chacun est **renseigné**, **pas concerné**, ou **à vérifier** ; avancement affiché, rappel dans
  le centre d'alertes et dans Finances tant qu'il en reste. Frais libres en plus. Loyer, logiciels et TPE : stand par
  stand si Coûts par buvette est activé, sinon pour tout le lieu.
- Rapport de soirée : les rapports déjà figés gardent leur contenu (« marge nette ») ; les nouveaux montrent « ce qu'il
  te reste ». Mode formation : Mes frais recopiés dans le lieu d'entraînement. Tout est journalisé (3 nouveaux types).
- Pas encore dans le calcul : la commission Click & Collect (avec l'import des ventes C&C), le conditionnement de chaque
  produit (§15.155).

**Réalisé le 2026-10-11** : migration 0043 ; moteur (`partDesFrais`, `montantDuMois`, `moisComplets`, frais proposés,
cascade) ; serveur (Finances, Mes frais, alerte) ; écrans (accueil, Finances, Mes frais, cascade négative en rouge).
**Tests** : moteur 4, serveur 6 (prorata, montant habituel, frais de carte, saisie propre, mois sans match, frais arrêté,
refus), écran 3 ; vérifié dans le navigateur sur le lieu de démonstration (commission de 10 % appliquée seule).

## 2. Ce qui a été construit — commits

- [`8201e24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8201e24f292722ce3747fe094e0bc041645dbdd8) — 2026-10-11 — Ce qu'il te reste et Mes frais : calcul et serveur (dossier §15.154)
- [`b36b67d`](https://github.com/Break-Eat-APP/flaix-expert/commit/b36b67d1a15a486368af647761fdaf156625363e) — 2026-10-11 — Ce qu'il te reste et Mes frais : écrans (dossier §15.154)
- [`973fa42`](https://github.com/Break-Eat-APP/flaix-expert/commit/973fa4209adba4b303273f5d4491b76bc4d67e32) — 2026-10-11 — Mes frais : loyer, logiciels et TPE saisissables pour tout le lieu sans Coûts par buvette

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0043_ce_qu_il_te_reste.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/db/migrations/0043_ce_qu_il_te_reste.sql)

### Tests

- `apps/api/test/mes-frais.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/api/test/mes-frais.test.ts)
- `packages/domain/src/frais.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/frais.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/alertes.ts)
- `packages/domain/src/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/finances.ts)
- `packages/domain/src/frais.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/frais.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/journal-technique.ts)
- `packages/domain/src/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/packages/domain/src/rapport-soiree.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/finances.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/api/src/routes/finances.ts)
- `apps/api/src/routes/frais.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/api/src/routes/frais.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/App.tsx)
- `apps/web/src/pages/parametres/MesFrais.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/parametres/MesFrais.test.tsx)
- `apps/web/src/pages/parametres/MesFrais.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/parametres/MesFrais.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/resultats/Finances.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/Finances.test.tsx)
- `apps/web/src/pages/resultats/Finances.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/Finances.tsx)
- `apps/web/src/pages/resultats/graphiques.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/graphiques.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/RapportSoiree.test.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/RapportSoiree.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/resultats.css)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/973fa4209adba4b303273f5d4491b76bc4d67e32/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/mes-frais.test.ts`

- **mes frais et ce qu'il te reste**
  - au départ : tous les frais proposés sont à vérifier ; rappel dans le centre d'alertes
  - frais renseignés : du mois (proposé, libre, par stand), de soirée avec montant habituel ; « pas concerné » ; journal
  - [F] frais du mois proposé comme frais de soirée, doublon, pourcentage au-delà de 100 % : refusés
  - frais du mois (300 €) répartis sur les deux matchs au prorata du CA HT ; montant habituel ; « ce qu'il te reste »
  - une saisie propre à la soirée remplace le montant habituel
  - période septembre–octobre : octobre sans match compte ses frais en entier ; un frais arrêté ne réécrit pas septembre

### `packages/domain/src/frais.test.ts`

- **ce qu'il te reste et mes frais (§15.154)**
  - frais du mois répartis au prorata du CA HT des soirées du mois ; soirée sans CA : rien
  - montant mensuel daté : la ligne la plus récente déjà commencée ; mois complets d'une période
  - frais bancaires en % des paiements par carte ; clés des frais proposés uniques
  - cascade : écarts de stock et part des frais du mois déduits jusqu'à « ce qu'il te reste »

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/frais.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/mes-frais.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
