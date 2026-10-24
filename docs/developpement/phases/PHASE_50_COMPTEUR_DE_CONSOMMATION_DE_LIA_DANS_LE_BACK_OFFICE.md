# Phase 50 — Compteur de consommation de l'IA dans le back-office

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-06 |
| Décision | dossier projet §15.149 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.149 Compteur de consommation de l'IA dans le back-office (2026-10-06)

**Demande de Rémi** : connaître le coût réel de l'IA (« combien coûte un agent IA pour chaque requête sur OVH ? » puis
« oui » au compteur). **Estimation donnée** : Mistral Small 3.2 chez OVHcloud, environ 0,09 à 0,10 € par million de jetons
lus et 0,28 à 0,31 € par million de jetons écrits (comparateurs, 2026-10-06) ; une question courante (2 à 3 appels au modèle)
≈ 0,1 centime, la plus longue (5 appels) ≈ 0,5 centime ; 10 questions par jour ≈ 0,35 € par mois et par lieu.

**Réalisé le 2026-10-06** (migration 0039, `GET /api/editeur/consommation-ia`, carte « Consommation de l'IA » du
back-office) : les jetons de chaque question étaient déjà tracés (§15.136) ; ceux de la reformulation du brief le sont
désormais (comptés même si la reformulation est écartée : l'appel a coûté). Totaux par lieu et par mois (un lieu de
formation compte avec son vrai lieu), coût estimé hors taxes aux prix réglés sur le serveur (`IA_PRIX_ENTREE_MILLION`,
`IA_PRIX_SORTIE_MILLION`, par défaut 0,10 et 0,31 €), jamais le texte des questions. La facture OVHcloud fait foi.
**Tests** : serveur 2 (totaux et coût, mois sans consommation, mois invalide refusé, directeur refusé ; jetons du brief
enregistrés, reformulation retenue ou écartée).

## 2. Ce qui a été construit — commits

- [`4329abb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be) — 2026-10-06 — Compteur de consommation de l'IA dans le back-office (dossier §15.149)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0039_consommation_ia.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/db/migrations/0039_consommation_ia.sql)

### Tests

- `apps/api/test/assistant.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/api/test/assistant.test.ts)
- `apps/api/test/editeur.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/api/test/editeur.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/packages/domain/src/editeur.ts)

### Serveur (apps/api)

- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/api/src/config.ts)
- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/notifications.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/api/src/routes/notifications.ts)

### Écrans (apps/web)

- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/4329abb8a9ad14e89f3b45f496ef0cfaa860b1be/apps/web/src/pages/editeur/EspaceEditeur.tsx)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
