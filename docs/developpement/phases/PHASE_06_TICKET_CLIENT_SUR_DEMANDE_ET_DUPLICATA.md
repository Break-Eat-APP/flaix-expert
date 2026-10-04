# Phase 6 — Ticket client sur demande et duplicata

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.101 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.101 Ticket client sur demande — réalisé (2026-09-30)

Décision du §15.99 (aucun ticket imprimé à la caisse ; sur demande, le directeur le produit). **Construit** : dans Caisses → Tickets du match, le détail de chaque ticket porte un bouton **« Ticket client »**. Il ouvre le ticket mis en forme (raison sociale, adresse, SIRET et n° de TVA du lieu ; numéro, date, caisse, stand, personne qui a servi ; lignes, remise, offert, total, règlement, rendu ; TVA par taux en HT / TVA / TTC ; heure d'édition « à la demande du client » ; début de l'empreinte), avec « Imprimer » (imprimante du directeur, largeur ticket 72 mm) et « Fermer ». Un ticket d'annulation s'édite aussi, marqué « ANNULATION du ticket … ».

**Règles** : chaque édition est inscrite au journal technique (« Ticket client édité », n° d'édition) ; **la 1re édition est l'original** (aucun ticket n'a été remis à la vente), **à partir de la 2e le ticket porte « DUPLICATA n° 1, 2… »**. Si l'identité du lieu est incomplète, un avertissement (non imprimé) le signale. Hors production, le ticket porte « TICKET D'ESSAI — SANS VALEUR ».

**Toujours à confirmer** (question G.18 de `questions-expert-comptable.md`) : l'exception « hôtellerie-restauration » du ticket obligatoire (§15.18), et la forme exacte attendue d'un duplicata.

**Vérifié** : 2 tests serveur (éditions numérotées et journalisées, duplicata à la 2e ; édition refusée sans session de directeur, ticket d'un autre lieu introuvable) ; essai dans le navigateur sur le lieu d'essai local (ticket 2026-C1-000001 de Julie M. : 14,00 €, TVA 20 % 2,33 € sur 11,67 € HT, avertissement « identité du lieu incomplète » affiché hors du ticket).

## 2. Ce qui a été construit — commits

- [`911d4b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/911d4b3b22ad6e2d31206d2b1c653d4e3565111f) — 2026-09-30 — Ticket client sur demande : édition par le directeur, duplicata numéroté et journalisé (dossier §15.101)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/caissieres.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/apps/api/test/caissieres.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/apps/api/src/routes/caisse.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/caisse/TicketClient.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/apps/web/src/pages/caisse/TicketClient.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/911d4b3b22ad6e2d31206d2b1c653d4e3565111f/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
