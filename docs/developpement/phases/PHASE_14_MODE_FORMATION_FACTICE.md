# Phase 14 — Mode formation « FACTICE »

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.109 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.109 Ordre de développement fixé par Rémi ; mode formation « FACTICE » construit (2026-09-30)

**Message de Rémi (verbatim)** : *« Ok, pour le mode de formation, c'est une très bonne idée. Ensuite, tu continues avec export pour l'expert comptable, click and collect, vue téléphone, coût par buvette. Et tu peux aussi enchaîner fidélité, wallet, facturation, back office, recette et IA on voit ensemble. Conformité on va voir ça ensemble il va falloir créer un dossier bien structuré garde ça en tête marque-toi le on reviendra dessus il y a des choses aussi qu'on avait prévu de revoir ensemble et pour ce qui est le serveur je m'y penche dessus prochainement, pour l'instant, développe, sans t'arrêter. »*

**Ordre retenu** : mode formation → export pour l'expert-comptable → Click & Collect → vue téléphone → coûts par buvette → fidélité → wallet → facturation → back-office. **À voir ensemble, pas construits seul** : conformité (dossier structuré à préparer, avec les points « prévus à revoir ensemble »), recettes, IA ; serveur de production (Rémi).

**Mode formation — ce qui est construit** (BOFiP §150, tests B3 et B4 du §15.19) :
- **Un lieu d'entraînement jumeau par lieu** (migration `0012`) : un lieu à part entière, isolé par les mêmes politiques de sécurité par ligne que n'importe quel autre lieu. Tout ce qui s'y fait (matchs, ventes, annulations, tickets, clôtures, Z, stock, planning) y est enregistré et chaîné normalement, mais **ne peut pas, par construction, toucher un compteur du vrai lieu** : ce n'est pas un filtre dans les calculs, c'est la base qui sépare les deux. Choisi plutôt qu'un simple « drapeau formation » sur les tickets, qu'il aurait fallu exclure dans chaque calcul présent et futur (un oubli suffisait à fausser un total).
- **Configuration recopiée à chaque entrée** (identité, stands, caisses, catégories, produits, prix datés, directeurs et caissières, fiches employés), **en lecture seule dans le lieu d'entraînement** : toute modification de configuration y est refusée par le serveur (409), elle se fait dans le vrai lieu.
- **Le directeur** entre et sort depuis Paramètres → Mode formation ; bandeau rayé « MODE FORMATION — FACTICE » **non masquable** sur chaque écran, repère dans le menu, filigrane « FACTICE » sur toute page imprimée, mention **en tête et en pied du ticket client**. Entrées, sorties et remises à zéro sont inscrites au **journal technique du vrai lieu**.
- **Tablettes** : le directeur met une tablette en formation (Équipe → Tablettes) ; toute caissière qui s'y connecte vend alors en factice sur la caisse jumelle. La session en cours sur la tablette est fermée d'office à chaque bascule (la base n'accepte qu'une session du bon mode). **Refusé si la vraie caisse est ouverte** (pas de bascule au milieu du service). Une caissière ne peut pas activer la formation (refus journalisé, B2).
- **La connexion par e-mail mène toujours au vrai lieu**, jamais au lieu d'entraînement.
- **Recommencer la formation** : le lieu d'entraînement est mis de côté (**rien n'est effacé**, cohérent avec l'inaltérabilité) ; la prochaine entrée repart d'un lieu vierge.

**Vérifié** : 10 tests automatisés (`apps/api/test/formation.test.ts`), dont **B4** : vente, clôture de caisse et Z du match en formation → le vrai lieu n'a reçu ni ticket, ni match, ni ouverture de caisse, ni clôture, perpétuel à 0 ; tablette en formation ; vraie caisse inaccessible depuis la tablette en formation ; remise à zéro. Suite complète : 144 tests serveur. Parcours dans le navigateur : entrée, match d'entraînement créé et ouvert, bière vendue, ticket client imprimable avec « FACTICE — MODE FORMATION · SANS VALEUR » en tête et en pied, sortie, vrai lieu intact.

**Limites assumées, dites** : le numéro de ticket d'entraînement a le même format qu'un vrai (`2026-C2-000001`) — c'est la mention FACTICE imprimée et le bandeau qui les distinguent ; changer le format toucherait la chaîne scellée, non justifié. Le lieu d'entraînement ne suit pas la configuration en direct : elle est recopiée à chaque entrée (ou reconnexion d'une caissière sur une tablette en formation).

## 2. Ce qui a été construit — commits

- [`019dbcd`](https://github.com/Break-Eat-APP/flaix-expert/commit/019dbcd5d04cf3c2df5ff21f7dd42c8c5aee3140) — 2026-09-30 — Mode formation FACTICE, serveur (en cours) : lieu de formation jumeau, sessions, tablettes en formation, configuration en lecture seule (dossier §15.109)
- [`4711c41`](https://github.com/Break-Eat-APP/flaix-expert/commit/4711c41a1394e216f1ac61602d91df724e20f6b2) — 2026-09-30 — Mode formation : tests B3/B4 (vente, clôture et Z en formation sans effet sur le vrai lieu ; tablette ; remise à zéro)
- [`7c65a1b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7c65a1b02189ef9933f540a46e5f7fecd241dba7) — 2026-09-30 — Mode formation FACTICE : écrans (bandeau non masquable, Paramètres → Mode formation, tablettes en formation, ticket FACTICE), dossier §15.109, ordre de développement fixé par Rémi

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0012_mode_formation.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/db/migrations/0012_mode_formation.sql)

### Tests

- `apps/api/test/formation.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/test/formation.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/auth/appareil.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/auth/appareil.ts)
- `apps/api/src/auth/contexte.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/auth/contexte.ts)
- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/auth/routes.ts)
- `apps/api/src/base.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/base.ts)
- `apps/api/src/routes/equipe.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/routes/equipe.ts)
- `apps/api/src/routes/formation.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/routes/formation.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/composants/Formation.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/composants/Formation.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/PosteCaissiere.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/caisse/PosteCaissiere.tsx)
- `apps/web/src/pages/caisse/TicketClient.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/caisse/TicketClient.tsx)
- `apps/web/src/pages/ConnexionCaissiere.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/ConnexionCaissiere.tsx)
- `apps/web/src/pages/equipe/Equipe.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/equipe/Equipe.tsx)
- `apps/web/src/pages/parametres/Formation.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/parametres/Formation.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/apps/web/src/styles.css)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/CLAUDE.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/7c65a1b02189ef9933f540a46e5f7fecd241dba7/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/formation.test.ts`

- **le directeur entre en formation**
  - B3 — la session est marquée formation, dans un lieu à part où la configuration est recopiée
  - [F] la configuration ne se modifie pas en formation
  - B4 [F] — ventes, clôture de caisse et Z du match en formation : aucun effet sur le vrai lieu
  - entrées et sorties sont inscrites au journal technique du vrai lieu
  - la connexion par e-mail mène toujours au vrai lieu, jamais au lieu de formation
  - à la rentrée : même lieu de formation, entraînements gardés, configuration remise à jour
- **tablette en formation**
  - [F] une caissière ne peut pas mettre la formation ; le directeur le fait, c'est journalisé
  - B3 / B4 — la caissière y vend sur la caisse jumelle ; le vrai lieu ne voit rien
  - [F] une tablette dont la vraie caisse est ouverte ne passe pas en formation
- **recommencer la formation**
  - le lieu de formation est retiré (rien n'est effacé) ; la rentrée suivante repart d'un lieu vierge

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/formation.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
