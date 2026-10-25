# Phase 76 — Audit des phases 67 à 75 et corrections ; dossier de reprise à jour

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-25 |
| Décision | dossier projet §15.175 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.175 Audit des phases 67 à 75 ; corrections ; dossier de reprise à jour (2026-10-25)

**Demande de Rémi** (2026-10-25) : *« fais-moi une audite de tout ce que nous avons développé dernièrement et mets à jour
le dossier de développement. Si je suis un informaticien qui reprend le dossier, je dois savoir ce qui a été fait et
comment, les phases de développement, les explications et un dossier bien rangé. Une audite va être faite par Codex
derrière. »*

**Méthode** : relecture du code des phases 67 à 75 (§15.166 à §15.174), règle par règle du guide de reprise (§ 4),
bornes de la base, fichiers produits pour l'extérieur ; puis toute la suite de tests. Rapport :
`docs/audits/AUDIT_2026-10-25_claude-phases-67-75.md` (auto-revue, à recouper par Codex).

**Défauts trouvés et corrigés** (commit `0ff2657`, migration 0058) :
- **A1 — mode formation** : la famille des catégories (§15.171) et les correspondances fournisseurs (§15.173) ne se
  recopiaient pas dans le lieu de formation (règle n° 6 oubliée deux fois) ; la correction d'une correspondance
  manquait à la liste `CONFIGURATION`. Migration 0058 : `synchroniser_complements_formation` reprise de 0052 avec ces
  deux copies ; test `formation-complements.test.ts`.
- **A2** : validation d'une facture — quantité × colis au-delà de 100 000 unités (borne d'un mouvement de stock)
  refusée avec un message clair, au lieu d'une erreur de contrainte.
- **A3** : produit fabriqué (recette) écarté de l'entrée en réserve par la même règle à l'écran et au serveur
  (`produitFabrique`) ; avant, une facture faite de seuls produits fabriqués restait impossible à valider.
- **A4** : récapitulatif pour Excel — un texte saisi commençant par = + - @ précédé d'une apostrophe (injection de
  formule).
- **A5** : correspondance « désapprise » quand une ligne est remise sans produit ni colis.
- **A6** : export pour le comptable — pièces jointes bornées à 150 Mo (zip construit en mémoire).
- **A7** : onglet Événements privés de Résultats et case « faire entrer en réserve » selon les options du lieu.

**Restent ouverts** (quinze points, § 6 du rapport) : charge des écrans qui se rafraîchissent, logique des minutes de
personnel en double, correspondances apprises avant la validation, arrondi du prix ÷ colis, PDF à regarder sur un
premier export réel, seuils fixes, approximation de la mi-temps, lecture d'un classeur de facture à plusieurs
feuilles, test d'écran qui attend un délai, recherche de la 2e maquette non construite, environnement du poste.

**Dossier de développement mis à jour** : `GUIDE_DE_REPRISE.md` (phase 76, migration 0058, § 6 bis « ce qui a été
construit depuis la phase 66 » avec le chemin d'une facture de bout en bout, pièges du poste, glossaire) et sa version
Word ; `CARTE_DU_CODE.md` (modules et fonctions clés nouveaux, ligne exacte) ; `CODEX_AUDIT_PROMPT.md` (périmètre
phases 67 à 76 et quatre vérifications nouvelles : fichiers déposés, fichiers produits, écritures de stock, options) ;
`docs/README.md` (sommaire du dossier `docs/`) ; fiches de phase 67 à 76 régénérées en Markdown et en Word.

**Vu dans le navigateur** (local, 2026-10-25) : la vue d'ensemble de Résultats au design de la 2e maquette ; corrigé à
l'essai : le cercle décoratif de « Prochain match » passait par-dessus son bouton (`ee26b84`).

## 2. Ce qui a été construit — commits

- [`0ff2657`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ff265774c65cdde7f72d140c99b0eaaed28b3c6) — 2026-10-25 — Audit des phases 67 à 75 : corrections (§15.175)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0058_formation_famille_correspondances.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/db/migrations/0058_formation_famille_correspondances.sql)

### Tests

- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/api/test/facture-reserve.test.ts)
- `apps/api/test/formation-complements.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/api/test/formation-complements.test.ts)
- `packages/domain/src/factures.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/packages/domain/src/factures.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/packages/domain/src/factures.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/api/src/routes/factures.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0ff265774c65cdde7f72d140c99b0eaaed28b3c6/apps/web/src/pages/resultats/Tableaux.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/formation-complements.test.ts`

- **mode formation : famille et correspondances recopiées**
  - dans le lieu de formation : la famille de la catégorie, la correspondance vers le produit de la formation
  - [F] corriger une correspondance en formation : refusé, comme toute configuration

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/formation-complements.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
