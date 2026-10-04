# Phase 29 — Dossier de conformité v0.1

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-03 |
| Décision | dossier projet §15.126 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.126 Ordre, éditeur, évolution des paiements (Rémi, 2026-10-03)

- **Ordre** : après le stock des ingrédients, la **conformité** passe avant la facturation et l'import des ventes C&C (elle bloque la production, pas eux). Rémi : « oui ça me va ».
- **Éditeur et hébergeur** : *« la société qui héberge Flaix et FlaiX Expert, c'est Break Eat App »*. Les écrans disent **FlaiX Expert** (le produit) ; l'attestation d'éditeur, les factures aux lieux et les mentions légales sont au nom de **Break Eat App** (point 11 de `decisions-architecture-production.md` : forme sociale et SIREN à confirmer sur l'extrait Kbis).
- **Dossier de conformité** : Rémi a rédigé un plan en 20 parties (OneDrive, « FLAIX EXPERT — DOSSIER DE CONFORMITÉ DU SYSTÈME DE CAISSE »). Il valide sa réécriture pour la caisse FlaiX Expert (parties 03, 04, 11, 14, 18) et l'ajout des points propres à notre caisse (vente sans réseau, mode formation, clôtures et totaux, ticket et duplicata, contrôle inopiné, conservation du code de chaque version, version majeure / mineure, annulation, offerts et rectification au lieu du « remboursement partiel »).
- **Évolution annoncée** : *« il se peut que le logiciel évolue pour faire des tickets et ne pas encaisser directement sur nos TPE à nous ; demain je développe peut-être nos propres TPE Android qui encaisseront toujours avec un PSP style Stripe »*. Le dossier de conformité la prévoit : paiement intégré, référence de transaction du prestataire, remboursements par le prestataire → **version majeure, nouvelle attestation**, et réexamen des questions A (champ du logiciel de caisse) par l'expert-comptable.

## 2. Ce qui a été construit — commits

- [`f75e8a7`](https://github.com/Break-Eat-APP/flaix-expert/commit/f75e8a722681b183641c02e16efd38a6ac4b38ff) — 2026-10-03 — Dossier de conformité FlaiX Expert v0.1 (plan de Rémi réécrit pour la caisse, parties 21 à 28)
- [`d26e10e`](https://github.com/Break-Eat-APP/flaix-expert/commit/d26e10ef12863773b521852e0d84a9ffd2415a1d) — 2026-10-03 — Dossier de conformité v0.1 en Word et PDF

## 3. Fichiers, par couche

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d26e10ef12863773b521852e0d84a9ffd2415a1d/docs/avancement.md)
- `docs/conformite/dossier-conformite-flaix-expert.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d26e10ef12863773b521852e0d84a9ffd2415a1d/docs/conformite/dossier-conformite-flaix-expert.md)
- `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d26e10ef12863773b521852e0d84a9ffd2415a1d/docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx)
- `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d26e10ef12863773b521852e0d84a9ffd2415a1d/docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
