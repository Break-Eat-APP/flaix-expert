# Phase 52 — Ventes déposées dans tout FlaiX Expert ; fichiers Excel

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-09 |
| Décision | dossier projet §15.151 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.151 Ventes déposées dans tout FlaiX Expert ; fichiers Excel (2026-10-09)

**Demande de Rémi** : « développe ça en priorité, la conformité on verra plus tard » (lecture des fichiers Excel, branchement
des modules sur les ventes déposées), « à toi de développer le nécessaire, fichier xls, csv, excel ». Question préalable :
*« est-ce que ce fichier déposé peut alimenter tous les modules y compris stock, marges, CA, gestion, cible ? »* — réponse :
oui pour tout ce qui se fait après le match ; non pour le direct (vue « En direct », rupture poussée), le temps de prise de
commande, les écarts de caisse, les Z et clôtures, les points de fidélité gagnés à la buvette.

**Décisions** :
- **Deux vues de gestion** (`vente_gestion`, `ligne_gestion`, migration 0041) réunissent les tickets scellés de la caisse
  FlaiX Expert et les ventes importées, dans la même forme. Les écrans de gestion les lisent ; **rien de fiscal ne les lit**
  (Z, clôtures mensuelles et annuelles, export comptable, journal de caisse, fidélité restent sur les seuls tickets scellés).
  Vues « security_invoker » : la sécurité par lieu des tables s'applique.
- Vente importée : comptée si elle n'est pas annulée ; lignes des produits ignorés écartées ; stand d'après la correspondance
  du point de vente ; taux de TVA du fichier, sinon celui du produit rapproché, sinon inconnu (hors taxes inconnu, jamais
  supposé) ; moyen de paiement reconnu « espèces » ou « carte » (le cashless n'est ni l'un ni l'autre).
- **Produit non rapproché** : compte dans le chiffre d'affaires comme un produit **sans coût** (marge globale non annoncée,
  alerte « Coût manquant… ; Caisses connectées → Correspondances ») : aucune marge inventée.
- **Événement terminé** : clos dans la caisse FlaiX Expert, ou déjà commencé avec des ventes (un lieu à caisse connectée
  n'ouvre ni ne clôt ses événements dans FlaiX Expert) ; sert à la prévision, aux prix fournisseurs, aux alertes, aux
  coûts par buvette.
- **Fichiers** : CSV, Excel (.xlsx, .xlsm, ancien .xls), OpenDocument (.ods), lus dans le navigateur avec SheetJS 0.20.3
  (distribution officielle de l'éditeur, version npm ancienne et vulnérable écartée), chargé seulement à l'ouverture d'un
  classeur ; feuille au choix ; dates Excel relues telles qu'affichées (sans fuseau, puis heure de Paris) ; titre au-dessus
  du tableau et ligne de total reconnus.

**Réalisé le 2026-10-09** : écrans branchés — Résultats (chiffre d'affaires, tickets, heures, stands, modes de paiement,
produits, marges, cibles, TVA, bilan sur une période, comparaison), rapport de soirée, gestion financière, assistant IA (via
Résultats), stock (vendu par stand, historique de mise en place), consommation des ingrédients, prévision (réalisé,
comparables, pics par stand), coûts par buvette, prix fournisseurs, alertes. **Tests** : moteur 6 (dont titre et total,
date « à minuit » et heure à part), serveur 11 (dont Résultats, prévision, stock alimentés par les ventes déposées,
produit non rapproché sans marge, clôtures fiscales intactes), écran 6 (dont classeurs .xlsx et .xls fabriqués, feuille
choisie, fichier abîmé) ; tous les tests des modules branchés repassés sans changement.

## 2. Ce qui a été construit — commits

- [`944717e`](https://github.com/Break-Eat-APP/flaix-expert/commit/944717ecf8426656dc270a9c29e8c93f2b991839) — 2026-10-09 — Ventes déposées dans tout FlaiX Expert ; fichiers Excel (dossier §15.151)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0041_ventes_gestion.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/db/migrations/0041_ventes_gestion.sql)

### Tests

- `apps/api/test/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/test/caisses-externes.test.ts)
- `apps/web/src/pages/caisses-connectees/fichiers.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/web/src/pages/caisses-connectees/fichiers.test.ts)
- `packages/domain/src/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/packages/domain/src/caisses-externes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/packages/domain/src/caisses-externes.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/couts-buvette.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/couts-buvette.ts)
- `apps/api/src/routes/fournisseurs.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/fournisseurs.ts)
- `apps/api/src/routes/prevision.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/prevision.ts)
- `apps/api/src/routes/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/rapport-soiree.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/resultats.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/stock-ingredients.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/web/package.json)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx)
- `apps/web/src/pages/caisses-connectees/fichiers.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/apps/web/src/pages/caisses-connectees/fichiers.ts)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/944717ecf8426656dc270a9c29e8c93f2b991839/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/web/src/pages/caisses-connectees/fichiers.test.ts`

- **fichiers d'export**
  - CSV lu en UTF-8, ou en Windows-1252 (export Excel français)
  - classeur Excel (.xlsx) : dates et heures relues telles qu'affichées, puis lues comme un export de caisse
  - ancien format Excel (.xls) ; plusieurs feuilles : la première avec des données, ou celle demandée
  - fichier illisible : message clair

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
