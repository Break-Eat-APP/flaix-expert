# Phase 49 — Audits du 2026-10-05 (Claude puis Codex) et corrections

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet docs/audits |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

Pas de section propre dans le dossier projet (docs/audits). Voir les commits ci-dessous.

## 2. Ce qui a été construit — commits

- [`0100cd3`](https://github.com/Break-Eat-APP/flaix-expert/commit/0100cd3380139b256f15edbeccb9a6e011098fe0) — 2026-10-05 — Audit : revue des phases 39 à 48 par Claude (P2 : caisse qui attend les notifications, carte d'un abonné désactivé, mise à jour des cartes par lots, node-forge, limite PassKit) ; prompt Codex pour les phases 33 à 48
- [`360895e`](https://github.com/Break-Eat-APP/flaix-expert/commit/360895e746e57d6f985505fa58cf94afdb6f23de) — 2026-10-05 — Audit du 2026-10-05 : corrections P2-1 à P2-5
- [`9df5acd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9df5acd92b8e84a20dd79f5618ce68696fbac7a5) — 2026-10-05 — Audit Codex du 2026-10-05 : corrections

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0037_carte_abonne_desactive.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/db/migrations/0037_carte_abonne_desactive.sql)
- `db/migrations/0038_wallet_relance.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/db/migrations/0038_wallet_relance.sql)

### Tests

- `apps/api/test/alertes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/test/alertes.test.ts)
- `apps/api/test/emails.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/test/emails.test.ts)
- `apps/api/test/wallet-fichiers.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/test/wallet-fichiers.test.ts)
- `apps/api/test/wallet.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/test/wallet.test.ts)
- `packages/domain/src/wallet.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/packages/domain/src/wallet.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/wallet.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/packages/domain/src/wallet.ts)

### Serveur (apps/api)

- `apps/api/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/package.json)
- `apps/api/src/arriere-plan.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/arriere-plan.ts)
- `apps/api/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/index.ts)
- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/clotures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/emails.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/emails.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/fidelite-caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/fidelite-caisse.ts)
- `apps/api/src/routes/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/fidelite.ts)
- `apps/api/src/routes/wallet.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/routes/wallet.ts)
- `apps/api/src/wallet/apple.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/wallet/apple.ts)
- `apps/api/src/wallet/cms.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/apps/api/src/wallet/cms.ts)

### Serveur OVH et outils (infra)

- `infra/outils/tests-un-par-un.mjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/infra/outils/tests-un-par-un.mjs)

### Documentation

- `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md)
- `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/docs/avancement.md)
- `docs/developpement/CODEX_AUDIT_PROMPT.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/docs/developpement/CODEX_AUDIT_PROMPT.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9df5acd92b8e84a20dd79f5618ce68696fbac7a5/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
