# Phase 15 — Export pour l'expert-comptable

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.110 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.110 Export pour l'expert-comptable (2026-09-30)

**Demande** : 2ᵉ module de l'ordre fixé par Rémi (§15.109) ; contenu déjà cadré (§15.95 : « export mensuel pour l'expert-comptable, CA par taux de TVA et par moyen de paiement — format à demander au comptable » ; module Factures : « ventes par jour, taux de TVA et moyen de paiement ; achats »).

**Construit** (Clôtures → Export comptable) :
- **Bâti sur les Z de match scellés**, jamais sur des chiffres recalculés : ce qui est exporté est exactement ce qui a été clôturé. Un match sans Z (pas encore clos) n'est pas exporté et il est listé comme tel. Tant que le mois n'est pas clôturé, l'export est « provisoire » (écrit dans le nom des fichiers).
- **Journal des ventes** (CSV) : une pièce par Z (`Z000001`), équilibrée — débit caisse espèces et cartes à encaisser ; crédit ventes HT et TVA collectée par taux ; écart de caisse des tiroirs et du coffre (dernière rectification comprise) : manquant en charge, excédent en produit. Débit total = crédit total, contrôlé avant chaque téléchargement ; un déséquilibre bloque l'export au lieu d'être corrigé en silence.
- **Récapitulatif par match** (CSV) : tickets, annulations, CA TTC, HT et TVA par taux présent, espèces, carte, écarts, empreinte du Z, ligne de total.
- **Plan de comptes du lieu** (migration `0013`, `lieu.plan_comptes`) : valeurs proposées par défaut, modifiables ; **à faire valider par l'expert-comptable** (question G.20). Recopié dans le lieu de formation (fonction `synchroniser_reglages_formation`, à compléter pour chaque futur réglage du lieu).
- Format : point-virgule, virgule décimale, date JJ/MM/AAAA, UTF-8 avec BOM (ouverture directe dans Excel), fins de ligne Windows. Chaque téléchargement et chaque changement du plan de comptes sont inscrits au journal technique.
- **Mode formation** : fichiers nommés « -FACTICE » et chaque libellé commence par « FACTICE — » (la mention est dans le fichier, pas seulement dans son nom).

**Ce que ce n'est pas** : ni un FEC (le fichier des écritures comptables de l'entreprise est produit par le logiciel du comptable, à partir de toutes ses écritures), ni l'export des achats et de la commission Break Eat (module Factures, plus tard).

**Vérifié** : 9 tests du calcul (pièce équilibrée, manquant et excédent, montants négatifs, ordre, CSV, libellés protégés, récapitulatif, plan complété) ; 6 tests contre la base (match mars 2025 : 2 bières en espèces, une eau par carte, tiroir court de 2,00 € → 8 lignes, 18,00 € de chaque côté ; provisoire puis définitif après clôture du mois ; mois vide refusé ; plan invalide refusé, plan du lieu utilisé puis remis aux valeurs proposées ; journal technique). Suites complètes : 94 tests du moteur, 150 du serveur. Écran vérifié dans le navigateur (en formation : match d'entraînement clos, aperçu, contrôle débit = crédit, fichier « provisoire-FACTICE »).

## 2. Ce qui a été construit — commits

- [`187fdf5`](https://github.com/Break-Eat-APP/flaix-expert/commit/187fdf5a242b1149783bf040bfd06304111df1c2) — 2026-09-30 — Export pour l'expert-comptable, serveur : journal des ventes et récapitulatif sur les Z scellés, écarts de caisse, plan de comptes du lieu (dossier §15.110)
- [`7429ef2`](https://github.com/Break-Eat-APP/flaix-expert/commit/7429ef25ffb03eb538f67ca8516567a912405875) — 2026-09-30 — Export comptable : écran Clôtures → Export comptable, mention FACTICE dans les fichiers de formation, dossier §15.110, question G.20

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0013_plan_comptes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/db/migrations/0013_plan_comptes.sql)

### Tests

- `apps/api/test/export-comptable.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/api/test/export-comptable.test.ts)
- `packages/domain/src/export-comptable.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/packages/domain/src/export-comptable.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/export-comptable.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/packages/domain/src/export-comptable.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/export-comptable.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/api/src/routes/export-comptable.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/api.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/web/src/api.ts)
- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/clotures/ExportComptable.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/apps/web/src/pages/clotures/ExportComptable.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/docs/flaix-gestion-dossier-projet.md)
- `docs/questions-expert-comptable.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7429ef25ffb03eb538f67ca8516567a912405875/docs/questions-expert-comptable.md)

## 4. Tests créés dans cette phase

### `apps/api/test/export-comptable.test.ts`

- **aperçu du mois**
  - le mois de l'événement est proposé ; le Z porte les ventes, la TVA par taux et l'écart du tiroir
- **fichiers**
  - écritures : CSV équilibré, provisoire tant que le mois n'est pas clôturé, téléchargement journalisé
  - récapitulatif : une ligne par événement et le total ; définitif une fois le mois clôturé
  - un mois sans événement clos n'a rien à exporter
- **plan de comptes**
  - [F] un numéro de compte invalide est refusé
  - le plan réglé par le lieu sert à l'export ; le remettre à zéro revient aux valeurs proposées

### `packages/domain/src/export-comptable.test.ts`

- **écritures d'un Z**
  - encaissements au débit, ventes HT et TVA par taux au crédit : la pièce est équilibrée
  - un manquant de caisse : charge au débit, caisse au crédit ; un excédent : l'inverse
  - aucune ligne à zéro ; un montant négatif passe de l'autre côté, jamais en négatif
- **journal du mois et fichiers**
  - les pièces sont dans l'ordre des événements ; débit total = crédit total
  - un Z dont la ventilation ne tombe pas juste est signalé, pas corrigé en silence
  - CSV des écritures : BOM, point-virgule, date JJ/MM/AAAA, virgule décimale, CRLF
  - un libellé qui contient un point-virgule ou un guillemet est protégé
  - récapitulatif : une colonne HT et TVA par taux présent, une ligne par événement, une ligne de total
- **plan de comptes**
  - un plan enregistré partiellement est complété par les valeurs par défaut

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/export-comptable.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/export-comptable.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
