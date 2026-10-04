# Phase 26 — Click & Collect neutre, export comptable dans la base, assiette de la commission

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-03 |
| Décision | dossier projet §15.123, §15.124 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.123 Click & Collect neutre : n'importe quelle application de commande (2026-10-03)

Rémi : *« garde Click & Collect, imagine demain c'est un autre Click & Collect ou leur propre app »*. Les écrans ne nomment plus aucune plateforme : « application de commande », « commission de la plateforme » (0 pour l'application du lieu lui-même), « frais de paiement » (Stripe ou autre prestataire). Le moteur de prix est inchangé (§15.20 ter). Reste ouvert, proposé à Rémi : une plateforme qui calcule sa commission sur le **prix app** et non sur le prix buvette (réglage d'assiette à ajouter s'il le valide) ; le raccordement des ventes d'une application au logiciel (import, puis branchement).

### 15.124 Décisions de Rémi du 2026-10-03 : C&C, abonnement, stock des ingrédients

Réponses de Rémi (« ok » point par point, et « oui » pour la bière pression) :

1. **Commission calculée sur le prix app** : réglage à ajouter (assiette « prix buvette » ou « prix payé sur l'application »), pour une plateforme qui ne calcule pas comme Break Eat.
2. **Ventes d'une application de commande** : d'abord un import du fichier de ventes de n'importe quelle application, ensuite un branchement direct, plateforme par plateforme.
3. **Export comptable inclus dans la base** : ce n'est plus une option.
4. **Abonnement** : prélèvement SEPA recommandé ; la commission Click & Collect n'apparaît pas sur la facture FlaiX Expert (elle appartient à la plateforme).
5. **Facturation dans le back-office** : grille de prix ; pour chaque lieu, date de début, formule et remise ; historique des dates d'activation des options ; option activée en cours de mois = mois entier, option arrêtée = due jusqu'à la fin du mois ; chaque mois, un relevé par lieu, vérifié par Rémi avant que la facture parte (émise par son outil de facturation, §15.123 et réponse du 2026-10-03).
6. **Stock des ingrédients au choix, ingrédient par ingrédient** (case « suivre le stock ») ; premier cas : la **bière pression** (fût en litres, la pinte déduit sa recette).

Restent à fixer par Rémi : les montants de la grille (ma proposition du 2026-10-03 sert d'exemple, rien n'est prérempli), le tarif d'un mois sans match, ses vrais frais de paiement et panier moyen, et si son « +16 % » contient une marge voulue.

## 2. Ce qui a été construit — commits

- [`3979502`](https://github.com/Break-Eat-APP/flaix-expert/commit/3979502a25057064cf9c3d3345429cf2f3d308e2) — 2026-10-03 — Click & Collect neutre : application de commande, commission de la plateforme, frais de paiement
- [`7294651`](https://github.com/Break-Eat-APP/flaix-expert/commit/729465129cb7c7a95965666641164b8badd537f2) — 2026-10-03 — Export comptable dans la base ; commission C&C calculée sur le prix buvette ou sur le prix app

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0022_export_base_assiette_cc.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/db/migrations/0022_export_base_assiette_cc.sql)

### Tests

- `apps/api/test/click-collect.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/apps/api/test/click-collect.test.ts)
- `packages/domain/src/click-collect.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/packages/domain/src/click-collect.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/click-collect.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/packages/domain/src/click-collect.ts)
- `packages/domain/src/couts-buvette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/packages/domain/src/couts-buvette.ts)
- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/packages/domain/src/editeur.ts)

### Serveur (apps/api)

- `apps/api/src/routes/click-collect.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/apps/api/src/routes/click-collect.ts)

### Écrans (apps/web)

- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/parametres/ClickCollect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/apps/web/src/pages/parametres/ClickCollect.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/729465129cb7c7a95965666641164b8badd537f2/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
