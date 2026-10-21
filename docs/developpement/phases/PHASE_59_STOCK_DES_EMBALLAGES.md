# Phase 59 — Stock des emballages

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-11 |
| Décision | dossier projet §15.158 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.158 Stock des emballages (2026-10-11)

**Demande** : « le stock de gobelets ». **Décisions** : un emballage se suit en stock à partir d'un premier comptage ;
**stock estimé = dernier comptage + livraisons depuis − portions vendues depuis × emballages de chaque produit** (ventes
de la caisse et des caisses connectées). Consommation moyenne des 3 derniers matchs → « ≈ N matchs » couverts. Seuil
d'alerte facultatif ; alerte « Stock bas » dans le centre d'alertes sous le seuil ou quand il ne reste pas de quoi tenir
un match (forte à zéro). Livraison reçue, recompter, seuil : dans Produits & prix → Emballages ; journalisés. Un stock
négatif signale un comptage à refaire. Migration 0047. Tests : serveur 1 (comptage, ventes déduites, livraison, seuil,
alerte), écran 1.

## 2. Ce qui a été construit — commits

- [`32ee27d`](https://github.com/Break-Eat-APP/flaix-expert/commit/32ee27da642829b3c21eae356a150d0e0ad03253) — 2026-10-11 — Stock des emballages : gobelets et autres (dossier §15.158)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0047_stock_emballages.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/db/migrations/0047_stock_emballages.sql)

### Tests

- `apps/api/test/conditionnement.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/api/test/conditionnement.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/packages/domain/src/alertes.ts)
- `packages/domain/src/emballages.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/packages/domain/src/emballages.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/emballages.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/api/src/routes/emballages.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Conditionnement.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/web/src/pages/parametres/Conditionnement.test.tsx)
- `apps/web/src/pages/parametres/Conditionnement.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/web/src/pages/parametres/Conditionnement.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/32ee27da642829b3c21eae356a150d0e0ad03253/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
