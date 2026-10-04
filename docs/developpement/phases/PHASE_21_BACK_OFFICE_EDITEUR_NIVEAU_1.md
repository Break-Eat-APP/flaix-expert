# Phase 21 — Back-office éditeur, niveau 1

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.116 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.116 Back-office éditeur — niveau 1, supervision technique (2026-10-01)

**Demande** : 9ᵉ et dernier module de l'ordre fixé par Rémi (§15.109). Cadrage déjà acté au §15.13 : deux niveaux strictement séparés ; règle absolue : aucun compte Break Eat n'écrit dans les données d'un lieu.

**Construit — niveau 1** (adresse `/editeur`, espace à part ; migration `0018`) :
- **Comptes Break Eat distincts** des comptes des lieux (table `compte_editeur`), créés par `sudo flaix-admin creer-editeur` (mot de passe provisoire affiché une seule fois dans le terminal de celui qui lance la commande), **cookie distinct** (`fx_editeur`, limité aux adresses `/api/editeur`), session de 8 heures, changement de mot de passe (ferme les autres sessions). Un compte de lieu ne se connecte pas au back-office ; un compte Break Eat ne se connecte pas comme un lieu.
- **Une session éditeur n'a pas de lieu** : les politiques de sécurité par ligne de la base ne lui montrent **aucune ligne** d'un lieu et refusent toute écriture — **tests B6 et B7 (§15.19) vérifiés au niveau de la base**, pas seulement de l'application.
- **Vue du parc** (fonction `vue_parc()`, seule lecture permise, réservée aux comptes éditeur) : par lieu réel (jamais un lieu de formation) — stands, caisses et tablettes actifs, matchs joués et ouverts (depuis quand), dernier Z, dernier mois clôturé, **mois terminés non clôturés**, exercice réglé ou non, dernière activité, dernière vérification d'intégrité. **Aucun montant, aucun ticket, aucun nom de salarié** (vérifié par test sur la réponse). Alertes : match ouvert depuis plus de 24 h, mois à clôturer, rupture d'intégrité, exercice non réglé. Version en service affichée.
- **Vérifier l'intégrité d'un lieu** : le serveur relit ses chaînes (caisses, journal technique, clôtures) et ne renvoie que des états (intact / rupture, nombre de maillons) ; **chaque vérification est inscrite au journal technique du lieu**, qui voit « Break Eat — nom » et le résultat.

**Pas construit, et pourquoi** :
- **Niveau 2 — support sur autorisation du lieu** (lecture seule, limitée dans le temps, ouverte par le lieu depuis son écran) : même mécanique que le **compte vérificateur** (§15.12), qui relève du dossier de conformité que Rémi veut voir ensemble.
- **Attestations à réémettre, archives annuelles** : n'existent pas encore (Conformité).
- **Facturation Break Eat (12a)** : abonnement et commission C&C — la commission dépend des ventes de l'app Break Eat (non raccordée), l'abonnement des contrats ; une facture émise par Break Eat est un document fiscal de Break Eat (numérotation, mentions, facture électronique à partir de septembre 2027 pour une PME) : à cadrer avec Rémi.

**Vérifié** : 9 tests contre la base (connexion séparée dans les deux sens ; cookie protégé ; parc sans le lieu de formation et sans aucun montant ; refus sans session éditeur et avec un cookie de directeur ; `vue_parc()` refusée à un directeur ; B7 : la session éditeur n'ouvre aucun écran de lieu ; B6 : sans lieu, zéro ligne lue et écriture refusée par la base ; vérification d'intégrité journalisée chez le lieu ; lieu de formation refusé ; mot de passe et déconnexion). Suites complètes : 124 (moteur), 189 (serveur). Écran vérifié dans le navigateur avec un compte éditeur d'essai local (parc, alertes, vérification « chaînes intactes »).

## 2. Ce qui a été construit — commits

- [`e83eaf3`](https://github.com/Break-Eat-APP/flaix-expert/commit/e83eaf391efff8da06bdbed32e06ddb5d677f18f) — 2026-10-01 — Back-office éditeur, niveau 1, serveur : comptes Break Eat séparés, sessions sans lieu, vue du parc sans montant, vérification d'intégrité journalisée chez le lieu ; tests B6/B7 (migration 0018)
- [`a698a23`](https://github.com/Break-Eat-APP/flaix-expert/commit/a698a230b4cb37522ea05d97100a797f09528d28) — 2026-10-01 — Back-office éditeur : écran /editeur (parc, alertes, vérification d'intégrité, mot de passe), commande creer-editeur ; dossier §15.116

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0018_back_office_editeur.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/db/migrations/0018_back_office_editeur.sql)

### Tests

- `apps/api/test/editeur.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/api/test/editeur.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/packages/domain/src/editeur.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/outils/cli.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/api/src/outils/cli.ts)
- `apps/api/src/routes/editeur.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/periodes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/api/src/routes/periodes.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/web/src/App.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/infra/vps/flaix-admin.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a698a230b4cb37522ea05d97100a797f09528d28/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

### `apps/api/test/editeur.test.ts`

- **connexion éditeur**
  - cookie distinct ; un compte de lieu ne se connecte pas au back-office
  - un compte éditeur ne se connecte pas comme un lieu (aucun lieu)
- **vue du parc**
  - le lieu y figure, sans aucun montant ; jamais son lieu de formation
  - [F] sans session éditeur : refusé ; une session de directeur n'ouvre pas le back-office
- **B6 / B7 — un compte FlaiX Expert ne lit ni n'écrit les données d'un lieu**
  - [F] sa session n'ouvre aucun écran d'un lieu
  - [F] au niveau de la base : sans lieu, il ne voit aucune ligne et ne peut rien écrire
- **vérification d'intégrité**
  - le serveur relit les chaînes du lieu, ne renvoie que des états, et l'inscrit au journal du lieu
  - [F] un lieu inconnu ou de formation est refusé
- **mot de passe et déconnexion**
  - changement de mot de passe (l'actuel est exigé), puis déconnexion

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/editeur.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
