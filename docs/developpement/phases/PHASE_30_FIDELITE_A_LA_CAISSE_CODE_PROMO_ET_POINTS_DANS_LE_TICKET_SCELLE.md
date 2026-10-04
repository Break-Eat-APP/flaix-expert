# Phase 30 — Fidélité à la caisse : code promo et points dans le ticket scellé

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-03, 2026-10-04 |
| Décision | dossier projet §15.127 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.127 Fidélité à la caisse : code promo et points dans le ticket scellé (2026-10-03)

Suite de §15.114 et de l'option A choisie par Rémi (§15.115) ; Rémi : *« faut mettre en place tous les modules, faut développer le logiciel de A à Z »*. Migration `0024`.
- **Deux nouvelles réductions en euros**, appliquées **après** la remise et l'offert et réparties sur les lignes comme l'offert (la TVA reste ventilée au centime) : le **code promo** (pourcentage ou montant) et les **points** (paliers × valeur du palier). Chaque ligne du ticket porte sa part (`fidelite`, colonne `ligne_ticket.fidelite_centimes`) ; la contrainte de la base devient brut − remise − offert − fidélité = net.
- **Un ticket sans fidélité garde exactement sa forme d'avant** (aucune clé ajoutée) : une tablette pas encore mise à jour continue d'être acceptée.
- **Option A** : le serveur **réserve** les points (sous verrou de la fiche de l'abonné) ou un usage d'un code **plafonné** avant l'encaissement ; le ticket scellé porte la réservation, consommée par le serveur à la réception. Une réservation abandonnée **expire au bout de 2 heures** ; la caissière peut la rendre tout de suite (×). Un code **sans plafond** marche aussi **hors ligne** : la tablette garde la liste des codes valables.
- **Les points ne se dépensent que sur le ticket d'un abonné** (motif abonné, même n°) et jamais au-delà de ce qui reste à payer.
- **Soldes jamais recopiés** : points = gagnés (euros entiers × points par euro) − dépensés + mouvements, lus dans les tickets **non annulés** ; une annulation rend les points et l'usage du code d'elle-même.
- **Un ticket scellé n'est jamais refusé pour une raison de fidélité** (la vente a eu lieu) : réservation inconnue, déjà utilisée, rendue, code plafonné sans réservation, valeur différente → **signalé** au directeur (« Fidélité » dans Mes caisses). Seule une incohérence de calcul (montant gonflé, points au-delà du ticket, points d'un autre abonné) est refusée.
- **Écran de caisse** : bloc « Fidélité » (code promo ; « Points de l'abonné » → solde, paliers, Utiliser) ; lignes « Code … » et « Points (…) » sur le ticket client.
- Tests : 6 du moteur, 8 contre la base (réservation, épuisement, annulation, libération, hors ligne, anomalies, refus de la base).
- **État au 2026-10-04** : vérifié à l'écran (21,00 € − abonné 10 % − code 10 % − 200 points = 7,01 € ; ticket reçu sans anomalie ; solde 300 → 107 points) et mis en ligne. Le traitement en TVA des réductions de fidélité est à confirmer par l'expert-comptable (question C).

## 2. Ce qui a été construit — commits

- [`87c46b8`](https://github.com/Break-Eat-APP/flaix-expert/commit/87c46b8234d355b7db4e2dbdf6c328fa5574c301) — 2026-10-03 — Fidélité à la caisse : code promo et points dans le ticket scellé, réservations du serveur (écran à vérifier)
- [`c3d3041`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874) — 2026-10-04 — Fidélité à la caisse vérifiée à l'écran ; journal des phases à jour

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0024_fidelite_caisse.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/db/migrations/0024_fidelite_caisse.sql)

### Tests

- `apps/api/test/fidelite-caisse.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/test/fidelite-caisse.test.ts)
- `packages/domain/src/fidelite-caisse.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/packages/domain/src/fidelite-caisse.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisse-scellee.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/packages/domain/src/caisse-scellee.ts)
- `packages/domain/src/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/packages/domain/src/fidelite.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/packages/domain/src/modele.ts)
- `packages/domain/src/ticket.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/packages/domain/src/ticket.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/fidelite-caisse.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/src/routes/fidelite-caisse.ts)
- `apps/api/src/routes/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/src/routes/fidelite.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/src/serveur.ts)
- `apps/api/test/tablette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/api/test/tablette.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/FideliteCaisse.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/web/src/pages/caisse/FideliteCaisse.tsx)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/caisse/TicketClient.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/web/src/pages/caisse/TicketClient.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/outils/journal-developpement.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/infra/outils/journal-developpement.cjs)

### Documentation

- `CHANGELOG.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/CHANGELOG.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/docs/avancement.md)
- `docs/developpement/CARTE_DU_CODE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3d3041ab4b8eb3b2031ccd4fd072c4291b02874/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/fidelite-caisse.test.ts`

- **points de l'abonné à la caisse**
  - solde lu au serveur : 300 points = 3 paliers de 5,00 € ; un n° sans fiche est refusé clairement
  - réserver 2 paliers bloque 200 points pour les autres caisses ; on ne peut pas réserver plus que le disponible
  - annulation du ticket : les points dépensés reviennent d'eux-mêmes
  - points rendus par la caissière avant d'encaisser : disponibles à nouveau tout de suite
- **codes promo à la caisse**
  - code sans plafond : aucune réservation, et gardé par la tablette pour servir sans réseau
  - code plafonné à 1 usage : la réservation prend l'usage, une seconde caisse le trouve épuisé
  - [F] tablette trafiquée : points sans réservation, code plafonné sans réseau → encaissés (la vente a eu lieu) mais signalés
  - [F] la base refuse de supprimer une réservation ou d'en changer le ticket

### `packages/domain/src/fidelite-caisse.test.ts`

- **calcul : code promo et points après la remise et l'offert**
  - 20,00 € − 10 % abonné = 18,00 € ; code −10 % = 1,80 € ; 2 paliers de points = 5,00 € → 11,20 €, TVA ventilée au centime
  - les points ne dépassent jamais ce qui reste à payer
  - un ticket sans fidélité garde exactement sa forme d'avant (tablettes déjà en service)
- **ticket scellé avec fidélité : la tablette et le serveur calculent pareil**
  - code −10 % et 200 points (5,00 €) : 11,20 € ; accepté par le serveur ; détail lisible
  - aperçu à la caisse : réductions, total, et points trop élevés signalés avant d'encaisser
  - [F] montant du code gonflé, points sans réservation, points d'un autre abonné, points sans abonné : refusés
  - [F] des points qui dépassent le ticket sont refusés
  - annulation : les parts de fidélité sont inversées avec le reste, le serveur l'accepte

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/fidelite-caisse.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/fidelite-caisse.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
