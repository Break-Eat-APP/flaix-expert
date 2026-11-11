# Phase 78 — Audit de Codex : durcissements (annulation, relances wallet, événement privé, compteur, export en flux)

> FlaiX Expert · dossier de développement · généré le 2026-11-11 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-11 |
| Décision | dossier projet §15.177 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.177 Audit de Codex du 2026-10-26 : les durcissements (2026-11-11)

**Contexte** : Rémi, le 2026-11-11 : « vas-y avance sur les points de Codex ». Cinq des six points restants se corrigent
dans le code ; le sixième (P2-3) est une recette avec les vrais comptes Apple et Google, à faire avec Rémi.

**Corrigé** (migration 0060) :
- **P2-1 — auteur d'une annulation d'import** : `annuler_import_ventes_externes(p_import)` n'a plus de paramètre d'auteur ;
  la fonction inscrit `utilisateur_courant()` et refuse de s'exécuter sans utilisateur dans la session. L'ancienne forme à
  deux paramètres est supprimée. Test [F] dans `annulation-import.test.ts`.
- **P2-2 — relances wallet** : `relances_wallet_dues` (simple lecture) est remplacée par `prendre_relances_wallet` :
  `UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)` repousse d'une heure le prochain essai des relances prises. Un autre
  passage ou un autre serveur ne les voit plus ; réussie, la relance est effacée ; en échec, son prochain essai est
  recalculé comme avant ; serveur arrêté en route, elle redevient due une heure plus tard. Test [F] dans `wallet.test.ts` :
  deux relanceurs en même temps, Google lent, une seule mise à jour envoyée.
- **P3-1 — clôture d'un événement privé** : `exigerSortiePossible` contrôle, avant de passer l'événement à « clôturé », la
  somme par produit (plafond 100 000 unités, migration 0008) et par ingrédient suivi (10⁹ millièmes, migration 0023), avec
  un message qui nomme le produit. Le test a montré un second cas : au même prix, un ajout s'additionne à la ligne
  existante, et au-delà de 100 000 la base refusait sans explication ; refus lisible aussi. Test [F] dans
  `sortie-stock-prive.test.ts`.
- **P3-2 — compteur d'une caisse connectée** : ventes, première et dernière vente hors annulations, comme la liste des
  imports et les résultats ; l'écran dit « hors annulations ». Test [F] dans `caisses-externes.test.ts`.
- **P3-3 — export pour le comptable** : le zip part en flux (`fflate` `Zip` + `ZipDeflate`, `PassThrough` de Node) ;
  chaque pièce est lue dans sa propre transaction, ajoutée, puis l'envoi attend que le navigateur l'ait lue. Le refus
  « trop lourd » et le journal se font avant tout envoi. Une pièce retirée entre-temps reste au récapitulatif, sans pièce.

**Reste** : P2-3, recette réelle des cartes Wallet (`docs/points-a-revoir.md`, point 10).

## 2. Ce qui a été construit — commits

- [`ace2a94`](https://github.com/Break-Eat-APP/flaix-expert/commit/ace2a944113b78fb7b081e8e79e6740938e1f957) — 2026-11-11 — Audit Codex (P2-1, P2-2, P3-1, P3-2, P3-3) : auteur de l'annulation lu dans la session, relances wallet prises d'un coup, clôture d'un événement privé contrôlée, compteur sans annulations, export en flux
- [`12aef8f`](https://github.com/Break-Eat-APP/flaix-expert/commit/12aef8f05e2d22590618a05f809e335c310bde5f) — 2026-11-11 — Événement privé : ajout au-delà de 100 000 sur une ligne refusé avec un message lisible (audit Codex P3-1) ; suite du serveur : 428 tests réussis

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0060_auteur_annulation_relances_wallet.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/db/migrations/0060_auteur_annulation_relances_wallet.sql)

### Tests

- `apps/api/test/annulation-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/test/annulation-import.test.ts)
- `apps/api/test/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/test/caisses-externes.test.ts)
- `apps/api/test/sortie-stock-prive.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/test/sortie-stock-prive.test.ts)
- `apps/api/test/wallet.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/test/wallet.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/packages/domain/src/caisses-externes.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/src/routes/caisses-externes.ts)
- `apps/api/src/routes/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/src/routes/evenements-prives.ts)
- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/src/routes/factures.ts)
- `apps/api/src/routes/wallet.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/api/src/routes/wallet.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/12aef8f05e2d22590618a05f809e335c310bde5f/apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
