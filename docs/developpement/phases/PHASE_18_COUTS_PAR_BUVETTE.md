# Phase 18 — Coûts par buvette

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.113 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.113 Coûts par buvette (2026-10-01)

**Demande** : 5ᵉ module de l'ordre fixé par Rémi (§15.109). Reprise du module 8 tel que validé : vue consolidée complète (§15.83), dans Paramètres, frais saisis directement par stand et gardés pour la saison, modifiables (§15.84).

**Construit** (Paramètres → Coûts par buvette) :
- **Frais par stand** (migration `0015`, table `frais_stand`) : loyer, logiciel, abonnement, TPE, **montants par mois**, saisis directement pour chaque stand, **aucune valeur par défaut** (0 sans saisie). **Amélioration par rapport au prototype** : chaque montant est **daté** (« à partir de » un mois) — changer un frais en cours de saison ne réécrit pas les mois passés ; c'est la règle des prix datés appliquée aux frais. Chaque changement est inscrit au journal technique avec l'avant et l'après.
- **Coûts du mois par stand** : CA HT, coût matière (quantités vendues × coût matière de la fiche, comme Résultats), masse salariale (coût réel des affectations, taux figé, comme Équipe), frais du mois, total des coûts, et **reste** = CA HT − total. Le personnel affecté sans stand (Click & Collect, renfort) est compté dans le total du lieu. Produits sans coût et affectations sans taux **signalés**, jamais comptés 0 en silence.
- **Camembert** de répartition des coûts du mois pour tout le lieu (coût matière, masse salariale, loyer, logiciel et abonnement, TPE).
- **Unité de temps : le mois** (les frais sont mensuels ; les coûts de match y sont rattachés par la date du match, heure de Paris) — remplace l'« instantané saison » du prototype, qui additionnait des frais mensuels à des totaux de saison.
- Recopie en mode formation (frais sur les stands jumeaux), en lecture seule.
- **Amélioration** : le CA HT et le « reste » par stand n'existaient pas dans le prototype ; ajoutés pour répondre à la vraie question (« ce stand couvre-t-il ses coûts ? »), avec la mention que ce n'est **pas** le bénéfice (commission Break Eat et charges du lieu non saisies exclues).

**Vérifié** : 4 tests du calcul (frais en vigueur par mois, changement sans effet rétroactif, total et reste, répartition) ; 5 tests contre la base (match d'octobre 2025 : CA HT 19,40 €, matière 2,70 €, eau sans coût signalée, Karim 4 h à 20 € = 80 €, Léa sans stand 30 € ; frais d'octobre ; loyer de novembre sans effet sur octobre ; refus d'un montant négatif ou d'un poste inconnu ; recopie en formation et refus d'y modifier). Suites complètes : 106 (moteur), 162 (serveur). Écran vérifié dans le navigateur (saisie du loyer et du TPE du Bar → total, reste et camembert mis à jour).

## 2. Ce qui a été construit — commits

- [`66936e8`](https://github.com/Break-Eat-APP/flaix-expert/commit/66936e88516f21751d32bc255b77fc6cf1223f5d) — 2026-10-01 — Coûts par buvette, serveur : frais mensuels datés par stand, consolidation du mois (matière, masse salariale, CA HT, reste), recopie en formation (migration 0015)
- [`5a2fe6a`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a2fe6a3147e340d0f7695556aba2be65114921f) — 2026-10-01 — Coûts par buvette : écran Paramètres → Coûts par buvette (frais datés par stand, coûts du mois, camembert), dossier §15.113

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0015_couts_buvette.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/db/migrations/0015_couts_buvette.sql)

### Tests

- `apps/api/test/couts-buvette.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/api/test/couts-buvette.test.ts)
- `packages/domain/src/couts-buvette.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/packages/domain/src/couts-buvette.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/couts-buvette.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/packages/domain/src/couts-buvette.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/couts-buvette.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/api/src/routes/couts-buvette.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/web/src/App.tsx)
- `apps/web/src/pages/parametres/CoutsBuvette.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/web/src/pages/parametres/CoutsBuvette.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/apps/web/src/pages/parametres/Parametres.tsx)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a2fe6a3147e340d0f7695556aba2be65114921f/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/couts-buvette.test.ts`

- **consolidation du mois**
  - sans frais saisis : coût matière et masse salariale lus, produit sans coût signalé
- **frais par stand, datés**
  - saisis à partir d'un mois : ils comptent ce mois-là ; un frais inchangé n'est pas réinscrit
  - un nouveau loyer à partir de novembre ne réécrit pas octobre
  - [F] montant négatif ou poste inconnu refusés
- **mode formation**
  - frais recopiés sur les stands jumeaux, en lecture seule

### `packages/domain/src/couts-buvette.test.ts`

- **frais en vigueur pour un mois**
  - la ligne la plus récente déjà commencée ; un changement ne réécrit pas les mois passés
  - avant le premier mois saisi, ou sans saisie : 0
- **coûts d'un stand et répartition**
  - total = frais + coût matière + masse salariale ; reste = CA HT − total
  - camembert : matière, masse salariale (personnel hors stand compris), puis chaque poste

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/couts-buvette.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/couts-buvette.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
