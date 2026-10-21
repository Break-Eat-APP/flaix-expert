# Phase 57 — Hygiène et HACCP

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.156 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.156 Hygiène et HACCP (2026-10-11)

**Demande de Rémi** (2026-10-10) : *« ce que nous avons oublié de mettre dans le logiciel : hygiène et HACCP… est-ce
que ça va être un module ? »* ; idées du site O-Ven consultées (relevés horodatés, listes, alertes, dossier
d'inspection). Proposition : un module à part, simple, pensé pour une buvette ; ordre validé le 2026-10-11.

**Décisions** :
- **Module optionnel « Hygiène & HACCP »** (actif par défaut, désactivable par FlaiX Expert), entrée « Hygiène » du menu.
- **Réglages** : équipements suivis (froid ≤ 4 °C, surgelé ≤ −18 °C, maintien au chaud ≥ 63 °C, friteuse), limites
  propres possibles, rattachés à un stand ou à tout le lieu ; tâches à l'ouverture, à la fermeture ou chaque semaine.
  Idées d'un clic (frigo, congélateur, vitrine chaude, friteuse ; plans de travail, lave-mains, dates limites, tireuse,
  poubelles, friteuse, dégivrage). Un équipement ou une tâche se désactive, jamais supprimé. Journalisés.
- **Aujourd'hui** : températures d'ouverture et de fermeture de chaque équipement, tâches à cocher (« fait par … à … »).
  Un relevé fait pendant un match y est rattaché.
- **Réceptions** : fournisseur, produits, type (frais ≤ 4 °C, surgelés ≤ −15 °C, épicerie), dates limites, emballages.
  **Huile de friture** : contrôle des composés polaires (au-delà de 25 %, à changer) ou huile changée.
- **Conformité calculée par FlaiX Expert, jamais déclarée** ; hors limite, l'enregistrement exige l'action corrective.
- **Registre en écriture seule** (ni modification ni effacement, même par l'application : vérifié par les droits de la
  base) ; registre d'une période, imprimable ou en PDF pour un contrôle sanitaire.
- **Rappels** dans le centre d'alertes : non-conformités des 7 derniers jours ; équipements sans relevé d'ouverture
  pendant un match.
- Plus tard : saisie depuis la tablette des caissières, photos (étiquettes, traçabilité), capteurs connectés,
  allergènes sur chaque produit.

**Réalisé le 2026-10-11** : migration 0045 ; moteur (limites, lectures, conformités) ; serveur (réglages, registre,
période, alertes, option) ; écran à cinq onglets. **Tests** : moteur 2, serveur 6 (relevé conforme rattaché au match,
hors limite refusé sans action, friteuse, tâche, réception, huile, registre, écriture seule, alertes, option fermée),
écran 2 ; vérifié dans le navigateur (frigo ajouté d'un clic, relevé 3,5 °C).

## 2. Ce qui a été construit — commits

- [`ca7116b`](https://github.com/Break-Eat-APP/flaix-expert/commit/ca7116b4bf1cfab6b031f0acd156a05578026fdb) — 2026-10-11 — Hygiène et HACCP : moteur et serveur (dossier §15.156)
- [`e621cad`](https://github.com/Break-Eat-APP/flaix-expert/commit/e621cadd9a6f115351c60323ed964d78d6d717e4) — 2026-10-11 — Hygiène et HACCP : écrans (dossier §15.156)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0045_hygiene_haccp.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/db/migrations/0045_hygiene_haccp.sql)

### Tests

- `apps/api/test/hygiene.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/api/test/hygiene.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/composants/Coquille.test.ts)
- `packages/domain/src/hygiene.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/hygiene.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/alertes.ts)
- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/editeur.ts)
- `packages/domain/src/hygiene.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/hygiene.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/hygiene.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/api/src/routes/hygiene.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/hygiene/Hygiene.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/pages/hygiene/Hygiene.test.tsx)
- `apps/web/src/pages/hygiene/Hygiene.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/pages/hygiene/Hygiene.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e621cadd9a6f115351c60323ed964d78d6d717e4/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/hygiene.test.ts`

- **hygiène et HACCP**
  - réglages : équipements et tâche, journalisés ; nom en double, limites inversées refusés
  - relevé conforme rattaché au match ; hors limite sans action refusé, avec action enregistré ; friteuse refusée
  - tâche faite ; réception non conforme avec action ; huile contrôlée puis à changer
  - registre de la période ; l'application ne peut ni modifier ni effacer un relevé
  - centre d'alertes : non-conformités de la semaine ; équipement sans relevé d'ouverture pendant le match
  - caissière sur la tablette de sa caisse (§15.159) : relevé et réception avec photo ; ni réglages ni registre
  - [F] option désactivée par FlaiX Expert : module fermé

### `packages/domain/src/hygiene.test.ts`

- **hygiène et HACCP (§15.156)**
  - températures : lecture, affichage, limites par défaut ou propres à l'équipement
  - réception : date limite, emballage, température selon le type ; huile de friture

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/hygiene.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/hygiene.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
