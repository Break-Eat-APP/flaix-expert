# Phase 33 — Caisse automatique selon la date, clôture par le directeur, « événement » partout

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.130 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.130 Caisse automatique selon la date, clôture par le directeur, « événement » partout (2026-10-04)

**Demande de Rémi** : *« à chaque fois que l'opératrice va se connecter à la caisse, elle va devoir rentrer un match ou un événement ? Ce serait bien que ce soit automatisé, que la caissière n'ait rien à faire et qu'elle ait accès à sa caisse en fonction de la date. C'est au directeur de faire une clôture de la caisse. Une fois la clôture faite, la caisse va se réserver sur un autre événement qui va arriver dans les jours qui suivent. […] Tu parles beaucoup de match mais ça peut être un événement général : ce serait bien de généraliser les mots. »*

**Constat avant cette décision** : la caissière ne choisissait pas le match, mais elle était bloquée tant que le directeur n'avait pas « ouvert le match du jour », devait saisir son fond de caisse, et pouvait clôturer sa caisse.

**Choix de Rémi** (les quatre recommandations) :
1. **Ouverture automatique le jour J, à la première connexion** : l'événement prévu ce jour-là (date de Paris) s'ouvre à la première ouverture de caisse ; s'il y en a deux le même jour, le premier qui n'est pas clos. Garde-fou : si un événement d'un jour précédent est resté ouvert alors qu'un autre est prévu aujourd'hui, la caisse ne s'ouvre pas (les ventes d'aujourd'hui iraient sur l'événement d'hier) et la caissière est invitée à prévenir le directeur. Un événement de plusieurs jours reste possible : sans autre événement prévu ce jour-là, la caisse rouvre sur l'événement encore ouvert.
2. **Fond de caisse prévu par le directeur**, caisse par caisse (Paramètres → Stands & caisses). Sur la tablette d'une caissière, la caisse s'ouvre seule avec ce fond ; rien à saisir. Le fond reste recompté au Z. Sans fond prévu, la caissière le saisit (repli).
3. **Clôture de caisse par le directeur seulement**, depuis Mes caisses ou depuis la tablette. La tablette signale régulièrement au serveur son dernier ticket et ce qu'elle a encore à envoyer : la clôture est **refusée tant que tout n'est pas reçu**. Tablette perdue, cassée ou injoignable : **clôture forcée** avec motif et signature, inscrite au journal technique (les ventes restées sur la tablette ne sont alors plus inscrites ; le journal le dit, et la tablette les garde de côté pour les montrer au directeur). Après la clôture, la tablette se vide d'elle-même et attend l'événement suivant.
4. **« Événement » partout** à la place de « match » (match, concert, soirée, gala…). Les noms internes du code (`evenement`, `zDuMatch`, niveau `match` des clôtures) ne changent pas : seuls les textes affichés changent.

**Réalisé le 2026-10-04** (migration 0025, moteur `caisse-auto.ts`, phase 33) :
- **Ouverture** : `ouvertureCaisse` (moteur, 12 tests) dit sur quel événement la caisse s'ouvre, d'après les événements du lieu et la date de Paris. La tablette d'une caissière ouvre sa caisse toute seule, sans rien demander, quand c'est possible ; l'événement du jour s'ouvre avec la première caisse (journal technique : `evenement_ouvert` marqué `automatique`), sous verrou pour que deux tablettes allumées ensemble ne l'ouvrent pas deux fois. Sinon, écran d'attente : « Aucun événement prévu aujourd'hui. Prochain : … ». Garde-fou de l'événement d'hier : il bloque la caissière ; **le directeur garde la main** (il peut encore ouvrir une caisse sur cet événement, averti), car c'est à lui de décider.
- **Une caisse clôturée ne se rouvre pas seule** pour le même événement : elle attend le prochain (« Caisse clôturée pour … ; elle se rouvrira seule au prochain événement »). Seul le directeur peut la rouvrir (nouvelle session).
- **Fond prévu** : colonne `caisse.fond_prevu_centimes` (0 à 10 000 €), réglée dans Paramètres → Stands & caisses (« Fond prévu »), modification journalisée ; recopiée dans le mode formation.
- **Nouvelles de la tablette** : toutes les 30 s au plus (ou dès qu'un ticket est scellé ou envoyé), la tablette dit au serveur son dernier ticket scellé et ce qui attend (`POST /api/caisses/:id/nouvelles`, colonnes `session_caisse.tablette_*`). En retour, elle apprend si sa caisse a été clôturée ou reprise ailleurs : elle se libère alors d'elle-même ; s'il lui restait des tickets non envoyés, elle les met de côté (jamais effacés) et les affiche pour le directeur.
- **Clôture** : réservée au directeur (une caissière reçoit 403 ; le bouton n'existe plus sur sa tablette). Depuis la tablette qui tient la caisse, comme avant (jeton et dernier rang). À distance, depuis Caisses → En direct (« Clôturer ») : seulement si la tablette a tout envoyé et a donné des nouvelles depuis moins de 2 minutes ; sinon le motif s'affiche et « Forcer la clôture » demande un motif (5 caractères au moins) et une signature (prénom et nom), inscrits au journal technique avec le nombre de tickets annoncés en attente et l'heure des dernières nouvelles (`caisse_cloturee` : `aDistance`, `forcee`).
- **Caisses → En direct** : sous « Ouverte », l'état de la tablette (« à jour · il y a 12 s », « 2 tickets à envoyer », « sans nouvelles », « pas encore vue »).
- **Tests** : moteur 12, serveur 9 (`caisse-auto.test.ts` : attente sans événement, fond prévu journalisé, ouverture automatique avec l'événement, deuxième caisse sans rouvrir l'événement, caissière refusée à la clôture, clôture à distance refusée puis faite, caisse clôturée qui attend le prochain, tablette muette et forçage signé, garde-fou de l'événement d'hier), écrans 11 (ouverture automatique, attente, fond non prévu, directeur ; nouvelles, mise de côté, mémoire pleine). Vérifié dans le navigateur sur la base locale.

## 2. Ce qui a été construit — commits

- [`d9720eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9720eba1f8ebaab55b147a4a3cb210b225f4b5f) — 2026-10-04 — « Événement » à la place de « match » dans tous les textes affichés (dossier §15.130)
- [`b6bb919`](https://github.com/Break-Eat-APP/flaix-expert/commit/b6bb919a85b17c60f159741648473bf5a37f1ad2) — 2026-10-04 — Caisse automatique selon la date : ouverture seule le jour J avec le fond prévu, clôture par le directeur seul (dossier §15.130)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0025_caisse_automatique.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/db/migrations/0025_caisse_automatique.sql)

### Tests

- `apps/api/test/caisse-auto.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/caisse-auto.test.ts)
- `apps/api/test/caisse.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/caisse.test.ts)
- `apps/api/test/caissieres.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/caissieres.test.ts)
- `apps/api/test/clotures.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/clotures.test.ts)
- `apps/api/test/coffre.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/coffre.test.ts)
- `apps/api/test/conformite-base.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/conformite-base.test.ts)
- `apps/api/test/equipe.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/equipe.test.ts)
- `apps/api/test/export-comptable.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/export-comptable.test.ts)
- `apps/api/test/formation.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/formation.test.ts)
- `apps/api/test/periodes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/periodes.test.ts)
- `apps/api/test/resultats.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/resultats.test.ts)
- `apps/api/test/stock-ingredients.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/stock-ingredients.test.ts)
- `apps/api/test/stock.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/test/stock.test.ts)
- `apps/web/src/pages/caisse/memoire.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/memoire.test.ts)
- `packages/domain/src/caisse-auto.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-auto.test.ts)
- `packages/domain/src/cloture-periode.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/cloture-periode.test.ts)
- `packages/domain/src/export-comptable.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/export-comptable.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisse-auto.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-auto.ts)
- `packages/domain/src/cloture-periode.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/cloture-periode.ts)
- `packages/domain/src/couts-buvette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/couts-buvette.ts)
- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/editeur.ts)
- `packages/domain/src/export-comptable.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/export-comptable.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/index.ts)
- `packages/domain/src/journal-caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/journal-caisse.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/modele.ts)
- `packages/domain/src/planning.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/planning.ts)
- `packages/domain/src/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/resultats.ts)
- `packages/domain/src/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/stock-ingredients.ts)
- `packages/domain/src/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/stock.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/clotures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/couts-buvette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/couts-buvette.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/export-comptable.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/export-comptable.ts)
- `apps/api/src/routes/periodes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/periodes.ts)
- `apps/api/src/routes/planning.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/planning.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/resultats.ts)
- `apps/api/src/routes/stands.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stands.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock-ingredients.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisse/EcranCaisse.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/EcranCaisse.test.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/memoire.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/memoire.ts)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/clotures/ExportComptable.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/clotures/ExportComptable.tsx)
- `apps/web/src/pages/clotures/Periodes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/clotures/Periodes.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/equipe/Equipe.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/equipe/Equipe.tsx)
- `apps/web/src/pages/equipe/Planning.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/equipe/Planning.tsx)
- `apps/web/src/pages/parametres/CoutsBuvette.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/CoutsBuvette.tsx)
- `apps/web/src/pages/parametres/Formation.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/Formation.tsx)
- `apps/web/src/pages/parametres/Identite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/Identite.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/parametres/Saison.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/Saison.tsx)
- `apps/web/src/pages/parametres/StandsCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/parametres/StandsCaisses.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/graphiques.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/resultats/graphiques.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/pages/stock/StockIngredients.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/stock/StockIngredients.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/caisse-auto.test.ts`

- **ouverture selon la date : la caissière n'a rien à faire**
  - rien de prévu aujourd'hui : la tablette attend et annonce le prochain événement ; la caisse ne s'ouvre pas
  - le directeur prévoit le fond de la caisse ; la modification est journalisée
  - jour J : à la première connexion, la caisse s'ouvre seule sur l'événement du jour, qui s'ouvre avec elle, avec le fond prévu
  - la caisse suivante s'ouvre sur le même événement, sans l'ouvrir une deuxième fois
- **clôture : le directeur seul**
  - [F] la caissière ne clôture pas sa caisse
  - [F] à distance, refusée tant que la tablette a des tickets à envoyer ; faite dès qu'ils sont arrivés
  - après la clôture, la caisse ne se rouvre pas seule : elle attend le prochain événement ; seul le directeur la rouvre
  - [F] tablette muette : clôture à distance refusée, sauf forçage avec motif et signature, inscrit au journal
- **garde-fou de date**
  - [F] l'événement d'hier est resté ouvert alors qu'un autre est prévu aujourd'hui : la caisse de la caissière ne s'ouvre pas ; le directeur, averti, garde la main

### `packages/domain/src/caisse-auto.test.ts`

- **sur quel événement la caisse s'ouvre**
  - rien d'ouvert, un événement prévu aujourd'hui : il s'ouvrira avec la première caisse
  - un événement prévu à 0 h 30 heure de Paris compte bien pour ce jour-là
  - deux événements le même jour : le premier qui n'est pas clos
  - un événement déjà ouvert : la caisse s'ouvre dessus, sans en ouvrir un autre
  - [F] l'événement d'hier est resté ouvert et un autre est prévu aujourd'hui : blocage, le directeur doit clôturer
  - événement sur plusieurs jours (rien d'autre prévu aujourd'hui) : la caisse rouvre dessus
  - [F] caisse déjà clôturée par le directeur pour l'événement en cours : elle attend le prochain
  - rien aujourd'hui : la tablette attend et annonce le prochain
- **clôture à distance par le directeur**
  - tablette à jour il y a 10 s, rien en attente : possible
  - [F] tickets encore sur la tablette : impossible, avec leur nombre
  - [F] tablette muette depuis 25 min : impossible sans forcer
  - [F] tablette qui n'a jamais donné de nouvelles : impossible sans forcer

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/caisse-auto.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/caisse-auto.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
