# Phase 7 — Clôture du match : Z des tiroirs, rectification signée

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.102 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.102 Clôtures — assistant de clôture du match : conception (2026-09-30)

Demande de Rémi : *« la suite des Clôtures […] fait aussi »* (§15.99). Sources relues avant d'écrire : module 7 Contrôle & Espèces (§14, prototype isolé `58f197d5…` relu en entier le 2026-09-30) et module 10 Clôture d'événement (§14). **L'onglet « Clôture du match » devient l'assistant en 4 étapes validé**, pour le match ouvert :

1. **Ventes** — plus d'import en production : les ventes sont déjà dans le journal de caisse. L'étape liste chaque caisse du match (tickets, total, espèces, carte) et **est faite quand toutes les caisses sont clôturées** (depuis leur tablette).
2. **Restes** — le comptage de ce qui reste (module 10) demande la mise en place du module **Stock, pas encore construit**. L'étape est affichée « à venir » et **ne bloque pas** tant qu'aucune mise en place n'existe ; elle deviendra obligatoire avec le module Stock. *Écart signalé par rapport au module 10 validé.*
3. **Espèces** (module 7, repris tel quel) — pour chaque session de caisse qui accepte les espèces : **comptage par coupure** (500 € à 1 c), attendu = **fond + ventes espèces nettes du journal** − sorties vers le coffre, écart = compté − attendu, **tolérance réglable par le lieu (5,00 € par défaut)**, motif obligatoire au-delà (5 caractères au moins) **sans jamais bloquer**, écart positif signalé comme le négatif. **« Clôturer le Z »** : définitif, attribué, horodaté, inscrit au journal technique qui le scelle. **Rectification** : jamais d'écrasement ; montant compté rectifié, motif, **signature en toutes lettres**, inscrite à côté du Z d'origine qui reste affiché inchangé. Les caisses « carte uniquement » n'ont pas de tiroir : leur total carte est affiché pour la comparaison avec le TPE, que le directeur fait lui-même (§15.95, décision 3 — aucune saisie du ticket TPE).
4. **Clôture du match** — la clôture définitive existante, qui exige désormais aussi **que chaque tiroir ait son Z**.

**Écarts signalés par rapport aux modules validés** :
- **Sorties vers le coffre** pendant le match : pas encore de saisie ; comptées à zéro. À ajouter si le lieu fait des remontées d'espèces en cours de soirée (question pour Rémi).
- **Notification par e-mail d'une rectification** : aucun envoi d'e-mail n'existe encore dans FlaiX. La rectification est enregistrée, signée et scellée, mais **pas notifiée** ; l'e-mail viendra avec le « rapport de soirée par e-mail » (ajout validé au §15.95).
- **Clôture du lieu / grand total de période** : la clôture du match fige la soirée ; les totaux de période et l'archivage relèvent de l'onglet « Mois & année » (à venir).

**Données** : nouvelle table en écriture seule `comptage_especes` (comptages et rectifications, jamais modifiés, un seul comptage par session), copie interrogeable de ce que scelle le journal technique (même principe que `ligne_ticket`). Tests [F] écrits avec le code.

**Réalisé le 2026-09-30** : migration `0006_comptage_especes.sql` (tolérance du lieu, 5,00 € par défaut ; table `comptage_especes` en écriture seule, un seul Z par session, contrôles de cohérence dans la base : attendu = fond + espèces − sorties, écart = compté − attendu, motif obligatoire hors tolérance, rectification avec motif et signature) ; moteur `packages/domain/src/especes.ts` (coupures, attendu, écart, motif requis) ; serveur `routes/clotures.ts` (`GET /api/clotures`, `POST /api/sessions-caisse/:id/comptage`, `POST /api/comptages/:id/rectification`), clôture du match qui exige chaque Z, réglage `PUT /api/lieu/seuil-especes`. Écran Clôtures → Clôture du match : les 4 étapes et leur état, 4 chiffres (caisses clôturées, espèces attendues, comptées, écart), ventes par caisse, restes « à venir », tiroirs à compter par coupure avec bilan en direct, Z clos avec son détail, rectification ; « Voir sa clôture » pour un match déjà clos. Paramètres → Le lieu : carte « Contrôle des espèces » (tolérance).

**Défaut trouvé pendant l'essai et corrigé** : après « Clore le match », l'écran basculait sur « Aucun match ouvert » au lieu de montrer la clôture qu'on vient de faire.

**Vérifié** : 5 tests du moteur (dont l'exemple chiffré du prototype : attendu 1 070 €, compté 1 038,80 €, écart −31,20 €, motif requis) ; 12 tests serveur (tiroir d'une caisse encore ouverte refusé, caisse carte sans tiroir, match refusé tant qu'un tiroir n'a pas son Z, motif exigé au-delà de 5 €, coupure inconnue refusée, Z enregistré et journalisé, second Z refusé, rectification sans signature refusée puis ajoutée sans toucher au Z d'origine, rectification encore possible après la clôture du match, tolérance modifiable et journalisée) et 3 tests [F] sur la base (Z ni modifiable ni supprimable, même par le propriétaire, ni vidable ; Z incohérent ou second Z refusés même en écrivant directement). **Essai dans le navigateur** (lieu d'essai local, caisse de Julie M., fond 50 €, 14 € d'espèces) : attendu 64,00 € ; 62,00 € compté → écart −2,00 € dans la tolérance, aucun motif ; 52,00 € → −12,00 €, motif exigé et bouton grisé ; 64,00 € (1 × 50 €, 1 × 10 €, 2 × 2 €) → Z clos ; rectification à 65,00 € signée, Z d'origine inchangé ; match clos.

## 2. Ce qui a été construit — commits

- [`c8e6246`](https://github.com/Break-Eat-APP/flaix-expert/commit/c8e624655779c4a12c57e9dd2fbac1e91a3a6015) — 2026-09-30 — Dossier §15.102 : conception de l'assistant de clôture du match
- [`3398ccb`](https://github.com/Break-Eat-APP/flaix-expert/commit/3398ccba3c5083fffb474060fadbd64679b93441) — 2026-09-30 — Clôture du match, serveur : Z du tiroir par coupure, rectification signée, clôture du match exigeant chaque Z (dossier §15.102)
- [`d3670c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3670c65e032f1ade82ea7d9a05cca551a05b109) — 2026-09-30 — Clôture du match : assistant en 4 étapes, comptage des tiroirs par coupure, rectification (dossier §15.102)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0006_comptage_especes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/db/migrations/0006_comptage_especes.sql)

### Tests

- `apps/api/test/caisse.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/test/caisse.test.ts)
- `apps/api/test/clotures.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/test/clotures.test.ts)
- `apps/api/test/conformite-base.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/test/conformite-base.test.ts)
- `packages/domain/src/especes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/packages/domain/src/especes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/especes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/packages/domain/src/especes.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/clotures.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/lieu.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/src/routes/lieu.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/parametres/Identite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/web/src/pages/parametres/Identite.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3670c65e032f1ade82ea7d9a05cca551a05b109/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/clotures.test.ts`

- **étape 1 — ventes : toutes les caisses clôturées**
  - tant qu'une caisse est ouverte, l'étape n'est pas faite et son tiroir ne se compte pas
  - caisses clôturées : l'étape ventes est faite ; la caisse carte n'a pas de tiroir
- **étape 3 — espèces : comptage par coupure, Z définitif (module 7)**
  - l'événement ne se clôt pas tant que le tiroir n'a pas son Z
  - écart au-delà de la tolérance (5,00 €) : motif obligatoire ; une coupure inconnue est refusée
  - avec motif, le Z est enregistré, attribué, et inscrit au journal technique qui le scelle
  - un second Z pour le même tiroir est refusé : on corrige par une rectification
  - rectification : motif et signature obligatoires ; elle s'ajoute, le Z d'origine reste inchangé
  - étape 4 : l'événement se clôt ; ensuite, plus de Z tardif, mais une rectification reste possible
- **tolérance réglable par le lieu**
  - 5,00 € par défaut ; modifiable, et la modification est journalisée
- **[F] le Z est protégé par la base elle-même**
  - ni le serveur ni le propriétaire ne modifient ou ne suppriment un Z
  - un Z incohérent (écart faux, hors tolérance sans motif, second Z) est refusé même en écrivant directement

### `packages/domain/src/especes.test.ts`

- **contrôle des espèces — module 7 (§14, §15.102)**
  - compte le tiroir coupure par coupure
  - exemple du prototype validé : C3, attendu 150 + 1 120 − 200 = 1 070 €, compté 1 038,80 € → écart −31,20 €, motif requis
  - dans la tolérance, aucun motif ; un écart positif est traité comme un négatif
  - refuse une coupure inconnue ou un nombre invalide
  - nettoie le comptage et nomme les coupures

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/especes.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/clotures.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
