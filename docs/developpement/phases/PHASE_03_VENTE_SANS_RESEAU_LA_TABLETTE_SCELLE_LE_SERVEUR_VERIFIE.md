# Phase 3 — Vente sans réseau : la tablette scelle, le serveur vérifie

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-29 |
| Décision | dossier projet §15.97 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.97 Vente sans réseau — conception (2026-09-29)

**Décision de Rémi (verbatim)** : *« Ok, c'est parti pour la vente sans réseau, ensuite tu prépareras cette maquette. »* Conception écrite avant le code ; tests F1 à F4 du §15.12 écrits avec le code.

**Principe : la caisse scelle, le serveur vérifie.**

1. **Ouverture de caisse — réseau nécessaire** (inchangé). Le serveur inscrit l'ouverture et remet à la tablette : le contexte de scellement (lieu, caisse, stand, match, session, utilisateur), la **tête de chaîne** (dernier rang, dernière empreinte, dernier numéro de ticket), **l'heure du serveur** (la tablette recale son horloge dessus) et un **jeton d'appareil** aléatoire dont le serveur ne garde que l'empreinte SHA-256. La tablette garde aussi le catalogue et les prix de son stand.
2. **Pendant la session, la tablette est seule à écrire la chaîne de sa caisse.** Chaque vente ou annulation y est numérotée (rang et numéro de justificatif suivants), horodatée (horloge recalée), calculée par le **même moteur de calcul** que le serveur (`packages/domain`), scellée (même formule d'empreinte chaînée) et **enregistrée dans la mémoire de la tablette avant l'affichage « encaissé »**. Elle part aussitôt au serveur ; si le réseau manque, elle attend et part au retour, dans l'ordre.
3. **Le serveur vérifie chaque ticket avant de l'inscrire** : jeton d'appareil, rang et numéro qui suivent exactement le précédent, empreinte recalculée identique, montants recalculés identiques par le moteur de calcul, espèces autorisées sur la caisse, montant donné suffisant, annulation portant sur une vente de la même session non encore annulée. **Tout écart de structure refuse le lot entier** (rien n'est inscrit, la tablette garde tout et affiche la raison). Un envoi répété est reconnu (même identifiant, même empreinte) et ignoré : jamais de doublon.
4. **Contrôles signalés sans refus** — la vente a eu lieu et l'argent est encaissé, on ne l'efface pas, on la signale : prix différent du tarif en vigueur à l'heure de la vente (prix changé pendant une coupure), ticket reçu plus d'une minute après sa création (**enregistré hors ligne**), heure incohérente. Visibles dans Caisses → Tickets du match. Chaque arrivée de tickets enregistrés hors ligne est inscrite au journal technique.
5. **Heure de réception** : nouvelle colonne du journal de caisse, à côté de l'heure de la vente (vide pour les tickets déjà enregistrés, reçus à l'instant même).
6. **Clôture de caisse — réseau nécessaire.** La tablette envoie d'abord tout ce qui attend ; le serveur vérifie qu'il ne manque aucun ticket (la tablette annonce son dernier rang) avant de clôturer. La clôture tient dans une seule transaction : elle est faite entièrement ou pas du tout (test F4).
7. **Annulation d'un ticket : désormais sur l'écran de la caisse** (liste des tickets de la session), et non plus depuis Caisses → Tickets du match. Raison : pendant la session, la tablette doit être seule à écrire la chaîne de sa caisse ; une annulation faite ailleurs pourrait prendre le numéro d'un ticket vendu hors ligne. **Changement d'un module validé (§15.94), signalé.**
8. **Prix** : la règle « prix lu par le serveur à l'instant de la vente » devient « prix du catalogue chargé sur la caisse (rafraîchi dès que le réseau est là), **contrôlé par le serveur à la réception** ». **Changement signalé.**
9. **Une caisse ouverte appartient à un seul appareil.** Si la tablette casse ou perd sa mémoire : « Reprendre la caisse sur cet appareil » (nouveau jeton, l'ancien est révoqué, inscrit au journal technique).
10. **Écran rechargé sans réseau** : l'application garde ses fichiers sur la tablette (« service worker ») et la dernière session connue ; l'écran de caisse fonctionne alors avec les seules données de la tablette.

**Limites, dites clairement** :
- Tablette perdue, cassée ou vidée pendant la coupure = tickets non encore envoyés perdus. Consignes : pas de navigation privée, tablette chargée.
- Après une reprise sur un autre appareil, les tickets que l'ancienne tablette n'avait pas envoyés ne sont plus acceptés automatiquement.
- La carte dépend du TPE de la banque, pas de FlaiX.
- Ouverture et clôture de caisse demandent le réseau.
- Quelqu'un qui modifierait les données de la tablette pendant une coupure pourrait recalculer des empreintes cohérentes : la formule est connue. C'est la limite de toute caisse qui scelle sur l'appareil. Le signalement des tickets reçus en retard rend visible un usage anormal du hors-ligne. Question 12 bis posée à l'expert-comptable.

**Réalisé le 2026-09-29** : migration `0004_vente_sans_reseau.sql` ; module partagé `packages/domain/src/caisse-scellee.ts` (scellement côté tablette, contrôle côté serveur, même code) ; serveur : `/caisses/:id/journal` (réception d'un lot, tout ou rien), `/caisses/:id/reprise`, ouverture qui remet la tête de chaîne et le jeton, clôture qui vérifie le dernier rang ; les anciennes routes `/ventes` et `/tickets/:id/annulation` sont retirées. Écran de caisse : mémoire locale (`apps/web/src/pages/caisse/memoire.ts`), indicateur « Tout est envoyé / Hors ligne · N en attente », « Tickets de la session » (annulation), reprise sur un autre appareil ; Caisses → Tickets du match affiche les signalements ; dernière session gardée sur l'appareil ; service worker (`apps/web/public/sw.js`, version construite seulement).

**Vérifié** : 61 tests du moteur (dont 11 nouveaux : F1, annulation, cinq tentatives de fraude refusées) et 57 tests serveur (F1/F2 vingt ventes hors ligne, F3 [F] deux caisses reprises en même temps, lot trafiqué refusé en entier, envoi répété et envoi simultané sans doublon, écart de prix signalé, reprise sur un autre appareil, F4 clôture refusée tant qu'un ticket manque puis faite une seule fois). **Essai réel dans le navigateur, sur le lieu d'essai local** : vente avec réseau ; serveur coupé ; deux ventes (« Hors ligne · 2 en attente ») ; page rechargée pendant la coupure (la caisse s'ouvre depuis la mémoire de la tablette) ; annulation et vente hors ligne ; serveur relancé → envoi automatique, « Tout est envoyé » ; tickets marqués « Hors ligne » dans Tickets du match ; numérotation continue 000002 → 000006 ; vérification d'intégrité : chaîne de la caisse intacte (9 maillons) ; journal technique : « Tickets enregistrés hors ligne reçus » (2 tickets, 90 s de retard maximum). Deux défauts trouvés pendant l'essai et corrigés : la session n'était pas gardée sur l'appareil après la connexion (rechargement sans réseau impossible) ; le résumé de clôture ne s'affichait pas si l'écran du serveur n'avait pas pu être relu.

**Reste à essayer sur le vrai serveur** : le rechargement complet de la page sans réseau passe par le service worker, qui ne fonctionne que sur la version construite (pas en développement) — à vérifier sur le VPS de test.

## 2. Ce qui a été construit — commits

- [`6fb5840`](https://github.com/Break-Eat-APP/flaix-expert/commit/6fb584066acdbb07aba1202a849e6d8355ca6eb2) — 2026-09-29 — Vente sans réseau : la tablette scelle, le serveur vérifie (dossier §15.97)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0004_vente_sans_reseau.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/db/migrations/0004_vente_sans_reseau.sql)

### Tests

- `apps/api/test/caisse.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/api/test/caisse.test.ts)
- `packages/domain/src/caisse-scellee.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/packages/domain/src/caisse-scellee.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisse-scellee.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/packages/domain/src/caisse-scellee.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/journal-caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/api/src/journal-caisse.ts)
- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/api/src/routes/caisse.ts)
- `apps/api/test/tablette.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/api/test/tablette.ts)

### Écrans (apps/web)

- `apps/web/public/sw.js` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/public/sw.js)
- `apps/web/src/main.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/src/main.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/memoire.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/src/pages/caisse/memoire.ts)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/apps/web/src/session.tsx)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/CLAUDE.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/6fb584066acdbb07aba1202a849e6d8355ca6eb2/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

### `packages/domain/src/caisse-scellee.test.ts`

- **vente sans réseau — la tablette scelle (§15.97)**
  - F1 — trois ventes hors ligne : numérotées, horodatées, chaînées à la suite de l'ouverture
  - l'heure d'un ticket ne recule jamais, même si l'horloge de la tablette recule
  - le numéro porte l'année de Paris, pas celle de l'horloge universelle
  - le serveur accepte ce que la tablette a scellé, dans l'ordre
  - annulation scellée sur la tablette : inverse exacte de la vente, acceptée par le serveur
- **comptes des caissières — chaque ticket porte la personne connectée (§15.100)**
  - la caissière connectée est scellée sur son ticket, à la place de celle qui a ouvert la caisse
  - [F] attribuer après coup un ticket à une autre personne casse l'empreinte
  - une annulation porte la personne qui annule, pas celle qui a vendu
- **vente sans réseau — le serveur refuse ce qui a été trafiqué [F]**
  - un montant modifié après scellement
  - un montant modifié ET une empreinte recalculée : les montants ne correspondent plus au moteur de calcul
  - un ticket qui saute un numéro ou qui ne suit pas le précédent
  - un ticket scellé pour une autre caisse
  - une remise sans motif, même bien scellée
  - des espèces insuffisantes, même bien scellées

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/caisse-scellee.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
