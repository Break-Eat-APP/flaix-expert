# Audit technique FlaiX Expert — 2026-10-04

## Périmètre

- Dépôt audité : `C:\Users\notta\dev\flaix-expert`
- Branche : `main`
- HEAD : `0c29f8f`
- Audit effectué sur le working tree, qui contient aussi des modifications et fichiers non suivis liés au journal des phases.
- PostgreSQL Docker vérifié et sain (`flaix-expert-postgres-1`, port local 5433).

## Vérifications exécutées

- `pnpm test` : OK — 146 tests moteur et 230 tests API ; aucun test web réel.
- `pnpm typecheck` : OK — domaine, API et web.
- `pnpm --filter @flaix/web build` : OK.
- `pnpm audit --prod` : aucune vulnérabilité connue.
- `git diff --check` : OK.

## Synthèse

Le socle est compilable et les suites existantes passent. Je ne recommande toutefois pas de considérer la fonctionnalité de fidélité comme sûre pour une exploitation réelle avant correction du défaut P1 ci-dessous. Le problème permet de consommer une réservation valide alors que les données du ticket ne correspondent pas, et permet aussi de consommer une réservation depuis une autre caisse ou après son expiration.

## P1 — À corriger avant production

### P1-001 — Une réservation de fidélité est consommée avant validation complète

**Fichier :** `apps/api/src/routes/fidelite-caisse.ts:223-244` et `:246-261`

La fonction locale `consommer()` verrouille la réservation puis renseigne immédiatement `consommee_par` ligne 234. Les vérifications de l'abonné, du nombre de points, du montant et du code promo ne sont faites qu'après, lignes 241-243 et 259-260.

Scénarios reproductibles :

1. Une réservation de 200 points est créée. Un ticket scellé porte cette réservation mais seulement 100 points : la réservation est consommée, puis une anomalie est signalée. Le solde du client ne retrace pourtant que les 100 points du ticket.
2. Une réservation du code promo A est envoyée dans un ticket portant le code B : la réservation A est consommée avant que la différence de code soit détectée.
3. La réservation contient `caisse_id`, mais `consommerFidelite()` ne reçoit pas la caisse et ne compare jamais ce champ. Un ticket d'une autre caisse peut donc consommer la réservation.
4. `expire_le` n'est jamais comparé à `heureVente`. Une tablette conservant une réservation peut donc l'utiliser après son expiration.

**Correction attendue :** passer `caisseId` à `consommerFidelite`, verrouiller la réservation, vérifier avant toute mise à jour le type, la caisse, l'abonné ou le code, les points, le montant et l'expiration par rapport à `heureVente`, puis ne renseigner `consommee_par` que si toutes les conditions sont valides. Ajouter des tests pour les quatre scénarios et vérifier qu'une anomalie ne consomme pas la réservation.

## P2 — À corriger avant exploitation réelle

### P2-001 — L'option `export_comptable` existe en base mais ne peut pas être désactivée

**Fichiers :** `db/migrations/0020_options_lieu.sql:13`, `packages/domain/src/editeur.ts:82-103`, `apps/api/src/routes/editeur.ts:255`, `apps/api/src/routes/export-comptable.ts:136-144`

La migration prévoit bien l'option `export_comptable`, mais `OptionLieu`, `OPTIONS_LIEU`, `OPTIONS_PAR_DEFAUT` et `optionDeLaRoute()` l'omettent. L'écran éditeur ne peut donc pas la sélectionner et les routes `/api/export-comptable` restent accessibles même si une ligne SQL `export_comptable=false` existe.

**Correction attendue :** choisir explicitement si l'export comptable est une option ou une fonctionnalité de base. S'il s'agit d'une option comme l'indique la phase 23, l'ajouter dans le type, les libellés, les valeurs par défaut, le routage serveur, les écrans et les tests.

### P2-002 — Le périmètre de l'option `equipe` est incomplet ou ambigu

**Fichiers :** `packages/domain/src/editeur.ts:97-103`, `apps/api/src/routes/equipe.ts:197-325`, `apps/api/src/routes/planning.ts:151-273`

`optionDeLaRoute()` protège `/api/planning`, mais pas `/api/equipe/employes` ni les autres routes de gestion de l'équipe. Si l'option « Planning & masse salariale » doit couvrir tout le module Équipe, ces adresses restent utilisables après désactivation. Le test actuel ne couvre que la désactivation du Stock.

**Correction attendue :** documenter le périmètre (les fiches caissières/tablettes peuvent rester dans le socle caisse) puis appliquer le contrôle aux routes réellement couvertes et ajouter un test par famille de routes.

### P2-003 — Les nouveaux outils ne sont pas reproductibles depuis le commit Git actuel

**Fichiers :** `infra/outils/journal-developpement.cjs:18`, `infra/outils/phases.cjs`, `infra/outils/phases-word.cjs`, `infra/outils/md-vers-html.cjs`, `infra/outils/html-vers-word.ps1`

Le fichier suivi `journal-developpement.cjs` dépend de `./phases.cjs`, mais `phases.cjs` et les autres nouveaux outils ainsi que `docs/developpement/phases/` sont actuellement non suivis par Git. Une récupération du commit `0c29f8f` seul provoquera `MODULE_NOT_FOUND` lors de la génération du journal.

**Correction attendue :** committer ensemble le script modifié et toutes ses dépendances, ou ne pas modifier le script suivi tant que les dépendances ne sont pas intégrées.

### P2-004 — Absence de tests web automatisés

**Fichier :** `apps/web/package.json:13-14`

Le script `test` affiche simplement « aucun test web pour l'instant ». Le build et le typage détectent les erreurs de compilation, mais pas les régressions de navigation, de droits affichés, de mémorisation hors ligne ou d'envoi des tickets.

**Correction attendue :** ajouter au minimum des tests des parcours caisse, mode formation, options désactivées et file hors ligne, avec quelques tests d'intégration API simulant les erreurs serveur.

## P3 — Qualité / maintenance

### P3-001 — Génération des documents non atomique

**Fichier :** `infra/outils/phases-word.cjs:72` et `:143`

Le générateur supprime les Markdown et les `.docx` existants avant la conversion Word. Si Word est absent, bloqué ou échoue en cours de conversion, le dépôt peut rester avec une documentation partiellement régénérée et sans anciens `.docx`.

**Correction attendue :** générer dans un dossier temporaire, vérifier que toutes les conversions ont réussi, puis remplacer l'ancien dossier par renommage atomique ou conserver les fichiers précédents en cas d'échec.

### P3-002 — Bundle web volumineux

Le build produit un chunk JavaScript minifié d'environ 707 kB et Vite émet un avertissement de dépassement de 500 kB. Ce n'est pas un bug fonctionnel, mais cela pénalise le premier chargement des tablettes et des téléphones.

**Correction attendue :** découper les écrans par `import()` dynamique et charger les espaces directeur, éditeur et caisse à la demande.

## Points positifs vérifiés

- Montants et TVA traités en entiers.
- Calcul du ticket rejoué côté serveur avant inscription.
- Contrôles de chaîne, doublons et numérotation présents.
- Cookies de session `httpOnly`, `sameSite=strict` et `secure` en production.
- Protection intersite et limitation des tentatives de connexion présentes.
- Isolation PostgreSQL par lieu active dans les chemins audités.
- Tests moteur/API et typecheck au vert.

## Priorité de reprise

1. Corriger P1-001 et ajouter les tests de non-consommation en cas d'anomalie.
2. Décider et corriger le périmètre des options `export_comptable` et `equipe`.
3. Intégrer toutes les dépendances non suivies du générateur dans le même commit.
4. Ajouter la couverture web avant les essais de production.
