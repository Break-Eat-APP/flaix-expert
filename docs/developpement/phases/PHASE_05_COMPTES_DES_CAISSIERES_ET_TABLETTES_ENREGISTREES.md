# Phase 5 — Comptes des caissières et tablettes enregistrées

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.99, §15.100 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.99 Ticket sur demande, comptes des caissières et modules restants — décisions avant code (2026-09-30)

**Message de Rémi (verbatim)** : *« le choix ticket papier ou ticket dématérialisé pas de ticket a sortir on sen fou, seulemen sur demande au directer / les comptes des caissières sur les tablettes fait donc / les modules pas encore construits (Stock, Équipe, les tableaux de Résultats, la suite des Clôtures). fait aussi aller on continue »*

**Décisions actées** :
1. **Aucun ticket imprimé par défaut, aucune imprimante sur les caisses.** Sur demande d'un client, **le directeur produit le ticket** depuis Caisses → Tickets du match (affiché ou imprimé depuis son navigateur). Proposition de construction : chaque édition est inscrite au journal technique ; à partir de la deuxième, le ticket porte « DUPLICATA n° N » (usage habituel des référentiels de certification, à confirmer).
   **Signalé, sans conclusion** : le §15.18 a relevé que l'article D541-371 du code de l'environnement garde le ticket obligatoire dans certaines exceptions, dont le secteur de l'hôtellerie-restauration, dont une buvette relève peut-être. Si c'est le cas, « sur demande » ne suffirait pas. **À faire confirmer par l'expert-comptable ou la DGCCRF avant le premier vrai match** (question ajoutée à `questions-expert-comptable.md`). Un affichage « ticket disponible sur demande » au point de vente reste à prévoir dans le kit d'installation.
2. **Comptes des caissières : à construire**, selon la décision par défaut déjà écrite (`decisions-architecture-production.md` § 5 et § 9) : le directeur crée chaque caissière dans Équipe (nom, code personnel à 4-6 chiffres) ; il **enregistre la tablette** comme appareil de caisse (une fois, avec son propre compte) ; sur cette tablette seulement, la caissière se connecte avec son code ; elle ne voit que l'écran de vente de sa caisse, et le serveur ne lui envoie jamais marges, coûts ni salaires. Codes stockés en empreinte, tentatives limitées, chaque connexion au journal technique.
3. **Modules à construire, dans cet ordre** (dépendances et utilité pour le premier match) : (1) comptes des caissières + tablette enregistrée ; (2) ticket sur demande ; (3) Clôtures, assistant de clôture du match (ventes → restes → espèces et carte → clôture) ; (4) Résultats (vue d'ensemble, ventes, comparaison de deux matchs, « coût manquant ») ; (5) Équipe (fiches, planning, masse salariale) ; (6) Stock (mise en place, comptage, réserve et livraisons). Chaque module : relecture du prototype validé, décision écrite, code, tests, déploiement sur le serveur de test.

**Statut au 2026-09-30** : décisions écrites, **rien n'est encore construit**. Avancement tenu dans `docs/avancement.md`.

### 15.100 Comptes des caissières et tablettes enregistrées — conception (2026-09-30)

Décision de Rémi : *« les comptes des caissières sur les tablettes fait donc »* (§15.99). Conception écrite avant le code, dans le cadre déjà fixé par `decisions-architecture-production.md` § 5 (« code personnel, sur une tablette **enregistrée** par le directeur comme caisse n° X ; uniquement sa caisse ; le serveur ne lui envoie jamais marges, coûts ni salaires »).

1. **La caissière est une fiche de l'équipe**, créée par le directeur dans **Équipe → Fiches** : prénom et nom, **sans e-mail ni mot de passe**. À la création, FlaiX tire au hasard un **code personnel à 4 chiffres**, affiché **une seule fois** au directeur qui le transmet ; « Nouveau code » en redonne un autre (l'ancien cesse aussitôt de fonctionner). Le code n'est jamais stocké, seulement son empreinte (argon2id, comme les mots de passe). Une fiche se désactive, elle ne se supprime pas (ses tickets la référencent).
2. **La tablette est enregistrée par le directeur**, sur la tablette elle-même : connecté avec son e-mail, il ouvre Caisses → la caisse → « Enregistrer cette tablette comme caisse n° X ». La tablette reçoit un **jeton d'appareil** gardé dans un cookie protégé (illisible par la page) ; le serveur n'en garde que l'empreinte. La liste des tablettes et le bouton **« Retirer »** sont dans **Équipe → Tablettes** ; retirer une tablette ferme aussitôt les connexions des caissières sur celle-ci.
3. **Connexion de la caissière** : sur une tablette enregistrée, l'écran d'accueil montre les noms des caissières du lieu ; elle touche son nom, tape son code. **5 codes faux → fiche bloquée 15 minutes** (le directeur la débloque en donnant un nouveau code). Chaque connexion, refus et blocage est inscrit au journal technique. Le code ne fonctionne **que sur une tablette enregistrée** : depuis un autre appareil, il ne sert à rien. Lien « Connexion directeur » pour l'e-mail.
4. **Ce que voit la caissière** : l'écran de vente de **sa** caisse (celle de la tablette), rien d'autre — ni menu, ni Résultats, ni Paramètres. Elle peut ouvrir la caisse (fond de caisse), vendre, annuler un ticket de la session avec motif, clôturer la caisse. Le serveur refuse tout le reste (accès refusé inscrit au journal technique). **La reprise d'une caisse sur un autre appareil reste réservée au directeur** : elle écarte les tickets non envoyés de l'ancienne tablette, ce qui ne doit pas être à la main de la personne qui encaisse.
5. **Changement de caissière pendant le match** : « Changer de caissière » la déconnecte ; la caisse reste ouverte sur la tablette avec ses tickets en mémoire, la suivante se connecte et continue. **Chaque ticket porte la personne connectée au moment de la vente** (et non plus celle qui a ouvert la caisse). Changement signalé du §15.97 : le vendeur fait partie du scellement de chaque ticket, la formule d'empreinte ne change pas.
6. **Limites dites clairement** : la connexion d'une caissière demande le réseau (une caissière déjà connectée continue de vendre sans réseau) ; 4 chiffres suffisent parce que le code ne marche que sur une tablette enregistrée et que les essais sont limités, mais un code partagé entre collègues reste possible — c'est une consigne à donner, pas une protection technique ; le serveur vérifie que le vendeur inscrit sur un ticket appartient bien au lieu, pas qu'il était physiquement devant la tablette.
7. **Emplacement dans le menu, signalé** : Équipe devient active avec quatre onglets : **Fiches** et **Tablettes** (construits maintenant), **Planning** et **Masse salariale** (à venir, étape 5 — le prototype du module 14 sera relu en entier avant). L'onglet « Tablettes » n'était pas dans l'organisation du §15.95.

**Réalisé le 2026-09-30** : migration `0005_caissieres_et_tablettes.sql` (fiche de caissière sans e-mail, empreinte du code sur `membre`, compteur d'essais, table `appareil_caisse`, session liée à la tablette ; écritures des fiches uniquement par les fonctions `creer_caissiere`, `modifier_caissiere`, `changer_code_caissiere`, qui exigent un directeur du lieu) ; serveur : `/api/appareil` (accueil de la tablette), `/api/auth/code`, `/api/equipe/caissieres…`, `/api/appareils…`, `/api/caisses/:id/appareil` ; l'écran de caisse, l'ouverture, l'envoi des tickets et la clôture acceptent une caissière **sur la caisse de sa tablette seulement** ; chaque ticket scelle la personne connectée. Écrans : accueil de la tablette (noms, pavé à 4 chiffres), poste de la caissière (écran de vente seul, « Changer de caissière »), Équipe → Fiches et Tablettes, carte « Tablette de caisse » sur l'écran de caisse du directeur. Équipe est active dans le menu (Planning et Masse salariale « à venir »).

**Défaut trouvé et corrigé pendant l'essai** (antérieur à ce travail) : « Se déconnecter » fermait bien la session sur le serveur, mais l'écran restait affiché jusqu'au rechargement de la page. Corrigé dans `apps/web/src/session.tsx`.

**Vérifié** : 64 tests du moteur (dont 3 nouveaux : vendeur scellé sur le ticket, attribution après coup refusée) et 77 tests serveur (dont 20 nouveaux : code affiché une seule fois et jamais stocké en clair, code inutile sans tablette enregistrée, 4 codes faux puis blocage au 5e même avec le bon code, nouveau code qui débloque, caissière refusée partout sauf l'écran de sa caisse — 9 refus journalisés, écran sans aucun coût, reprise refusée —, changement de caissière en cours de match avec un ticket en attente, ticket attribué à une personne d'un autre lieu refusé, fiche désactivée et tablette retirée qui ferment les connexions, et côté base : création de compte, de membre, changement de rôle ou de code directs refusés au serveur, fonctions refusées à une caissière, tablette retirée qui ne revient pas). **Essai réel dans le navigateur**, sur le lieu d'essai local : fiche « Julie M. » créée (code affiché une fois) → appareil enregistré comme caisse 1 → déconnexion du directeur → la tablette affiche « Qui encaisse ? » → code faux refusé → bon code → écran de vente seul → ouverture avec 50 € de fond → 2 bières en espèces, 14,00 € → « Changer de caissière » (caisse restée ouverte, mémoire intacte) → côté directeur, le ticket 2026-C1-000001 porte « Julie M. » et le journal technique trace chaque étape → clôture de la caisse depuis la même tablette : 64,00 € d'espèces attendues.

## 2. Ce qui a été construit — commits

- [`d51b910`](https://github.com/Break-Eat-APP/flaix-expert/commit/d51b910bfd4c17aa9b75ce8476936e8dfff70136) — 2026-09-30 — Dossier §15.99 : ticket sur demande, comptes des caissières, ordre des modules restants
- [`3f03ee8`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f03ee810aba01f1df5ca9c205f9b797ea37829d) — 2026-09-30 — Dossier §15.100 : conception des comptes des caissières et des tablettes enregistrées
- [`9253115`](https://github.com/Break-Eat-APP/flaix-expert/commit/92531158323017d891cde1de21856af2f3ddd672) — 2026-09-30 — Comptes des caissières et tablettes enregistrées : base, serveur et tests (dossier §15.100)
- [`9324475`](https://github.com/Break-Eat-APP/flaix-expert/commit/9324475237b4721e3a80c10b517659e1a3a30f59) — 2026-09-30 — Comptes des caissières : écrans (tablette, poste de caisse, Équipe) et déconnexion corrigée

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0005_caissieres_et_tablettes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/db/migrations/0005_caissieres_et_tablettes.sql)

### Tests

- `apps/api/test/api.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/test/api.test.ts)
- `apps/api/test/caissieres.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/test/caissieres.test.ts)
- `packages/domain/src/caisse-scellee.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/packages/domain/src/caisse-scellee.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisse-scellee.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/packages/domain/src/caisse-scellee.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/auth/appareil.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/auth/appareil.ts)
- `apps/api/src/auth/contexte.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/auth/contexte.ts)
- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/auth/routes.ts)
- `apps/api/src/erreurs.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/erreurs.ts)
- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/equipe.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/routes/equipe.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/src/serveur.ts)
- `apps/api/test/tablette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/api/test/tablette.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/PosteCaissiere.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/pages/caisse/PosteCaissiere.tsx)
- `apps/web/src/pages/Connexion.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/pages/Connexion.tsx)
- `apps/web/src/pages/ConnexionCaissiere.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/pages/ConnexionCaissiere.tsx)
- `apps/web/src/pages/equipe/Equipe.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/pages/equipe/Equipe.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/apps/web/src/styles.css)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/CLAUDE.md)
- `docs/avancement.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/docs/avancement.md)
- `docs/decisions-architecture-production.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/docs/decisions-architecture-production.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/docs/flaix-gestion-dossier-projet.md)
- `docs/questions-expert-comptable.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9324475237b4721e3a80c10b517659e1a3a30f59/docs/questions-expert-comptable.md)

## 4. Tests créés dans cette phase

### `apps/api/test/caissieres.test.ts`

- **Équipe → Fiches : le directeur crée les caissières**
  - une fiche reçoit un code à 4 chiffres, remis une seule fois ; la création est journalisée
  - deux fiches ne portent pas le même nom (la caissière se reconnaît sur la tablette)
  - [F] le code n'est jamais stocké en clair : la base n'en garde que l'empreinte
- **tablette enregistrée comme caisse**
  - sans tablette enregistrée, le code ne sert à rien
  - le directeur enregistre la tablette : elle reçoit un cookie protégé et montre sa caisse et les caissières
  - la tablette enregistrée ne sert pas à un directeur d'un autre lieu
- **connexion d'une caissière par son code**
  - 4 codes faux : refusés et journalisés ; le 5e bloque la fiche 15 minutes, même avec le bon code ensuite [F]
  - un nouveau code donné par le directeur débloque la fiche ; l'ancien code ne marche plus
  - une caissière ne se connecte jamais par e-mail, et n'a pas de mot de passe à changer
- **B2 [F] — une caissière ne voit que l'écran de SA caisse**
  - configuration, produits (coûts), tickets du lieu, équipe : refusés et journalisés
  - l'écran de sa caisse ne contient aucun coût ; l'écran d'une autre caisse est refusé
  - elle ouvre sa caisse, vend ; chaque ticket porte son nom ; la reprise sur un autre appareil lui est refusée
  - changement de caissière : Julie se déconnecte, Marc continue la même caisse ; chaque ticket garde sa vendeuse
  - [F] un ticket attribué à une personne d'un autre lieu est refusé, lot entier
- **retirer une tablette, désactiver une fiche**
  - fiche désactivée : ses connexions sont fermées, elle disparaît de la tablette
  - tablette retirée : les caissières qui y sont connectées sont déconnectées, le code n'y marche plus
  - le journal technique reste intègre après tout cela
- **[F] la base elle-même refuse ce que le serveur ne doit pas faire**
  - le serveur ne peut ni créer un compte, ni un membre, ni changer un rôle directement
  - créer une caissière demande d'être directeur du lieu, même en appelant la base directement
  - une tablette retirée ne revient pas, et un enregistrement ne se supprime pas
- **ticket client sur demande (dossier §15.99)**
  - le directeur édite le ticket ; chaque édition est journalisée et numérotée, la 2e est un duplicata
  - [F] une caissière ne peut pas éditer de ticket, et un ticket d'un autre lieu est introuvable

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/caissieres.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
