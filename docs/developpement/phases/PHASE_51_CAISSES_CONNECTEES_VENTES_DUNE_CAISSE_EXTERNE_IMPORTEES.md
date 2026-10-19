# Phase 51 — Caisses connectées : ventes d'une caisse externe importées

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-06, 2026-10-09 |
| Décision | dossier projet §15.150 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.150 Module « Caisses connectées » : ventes d'une caisse externe (2026-10-06)

**Demande de Rémi** : *« si demain le logiciel d'encaissement tombe à l'eau […] est-ce que je pourrai me connecter via une
API à un système de caisse qui fait remonter toutes les infos nécessaires […] sans avoir à ouvrir de ticket ? »*, puis
*« développe ça dans un module à part »* et *« renseigne-toi […] L'Addition, Digifood, Weezevent »*.

**Réponse** : l'API est celle de l'éditeur de caisse ; FlaiX Expert développe le connecteur. Recherche : `docs/reference/
caisses-externes.md`. Aucune des trois API n'est publique (partenariat à demander ; Chift ouvre L'Addition et d'autres
caisses de restauration par une seule intégration payante), mais **les trois savent exporter leurs ventes en fichier**.
Avantage de ce mode : la caisse de l'éditeur porte la certification ; FlaiX Expert y est un logiciel de **gestion**, sans
les obligations d'un logiciel de caisse pour ces lieux.

**Décisions (recommandation de Claude, demande de Rémi)** :
- **Module à part**, option du lieu « Caisses connectées », désactivée par défaut (activée par FlaiX Expert).
- **Ventes importées rangées à part** des tickets scellés : elles n'entrent jamais dans les Z, les clôtures, l'export
  comptable ni le journal de caisse de FlaiX Expert (ce ne sont pas ses encaissements).
- **Première porte : le fichier d'export** de la caisse (CSV ; un fichier Excel s'enregistre en CSV), une ligne par
  article vendu. Les colonnes sont reconnues d'après leurs en-têtes, corrigeables, et retenues pour l'import suivant ;
  une vente déjà importée n'est jamais comptée deux fois (identifiant de la vente + caisse).
- **Correspondances** : produit de la caisse → produit de FlaiX Expert (coût matière, donc marge) ou « ignoré » ;
  point de vente de la caisse → stand. Rattachement à l'événement du même jour.
- **Résultats du module** : chiffre d'affaires, marge estimée, ventes par produit, par stand, par événement.
- **Ensuite** (étapes suivantes, après partenariats) : connecteurs par API (Digifood, Weezevent, L'Addition ou Chift)
  avec relève automatique et notifications en direct ; branchement des modules existants (résultats, stock, prévisions,
  alertes, « où je perds de l'argent ») sur les ventes importées.

**Réalisé le 2026-10-06** (moteur `csv.ts` et `caisses-externes.ts`, migration 0040, `routes/caisses-externes.ts`, écran « Caisses
connectées » dans le menu quand l'option est active) : caisses du lieu ; import d'un export CSV avec **aperçu sans rien
enregistrer**, colonnes reconnues d'après les en-têtes (français ou anglais), corrigeables et retenues ; fichier lu en UTF-8
ou en Windows-1252 (exports Excel) ; lignes fautives écartées et listées ; ventes regroupées par n° de vente ; dates sans
fuseau lues à l'heure de Paris ; aucune vente comptée deux fois, annulation reportée à l'import suivant ; vente rattachée à
l'événement du jour ; correspondances produit (ou « ignoré ») et point de vente → stand ; résultats du … au … : chiffre
d'affaires, panier moyen, marge estimée des produits rapprochés (part du chiffre d'affaires couverte), par produit, stand,
événement et heure. Journal : `caisse_externe_creee`, `caisse_externe_modifiee`, `caisse_externe_import`,
`correspondance_externe_modifiee`. Ventes importées jamais dans le journal de caisse (vérifié par un test). **Tests** :
moteur 5 (en-têtes, dates été et hiver, montants, regroupement et annulations, colonnes manquantes ou choisies), serveur 9
(option désactivée par défaut, caisse, aperçu, import, réimport sans doublon, colonnes manquantes, correspondances,
résultats, autre lieu isolé), écran 3. Non vu dans le navigateur : le poste de Rémi manquait de mémoire (0,1 Go libre).

## 2. Ce qui a été construit — commits

- [`77558bd`](https://github.com/Break-Eat-APP/flaix-expert/commit/77558bd28a81154bc1b4544160dea01271c53497) — 2026-10-06 — Caisses externes : recherche L'Addition, Digifood, Weezevent ; décisions §15.149 (compteur IA) et §15.150 (module Caisses connectées)
- [`1d5db67`](https://github.com/Break-Eat-APP/flaix-expert/commit/1d5db67cea273c4e9af132ea8b73da8764ef5019) — 2026-10-06 — Caisses connectées (1/2) : import des ventes d'une caisse externe, correspondances, résultats (dossier §15.150)
- [`3f9b046`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e) — 2026-10-09 — Caisses connectées (2/2) : écran (importer avec aperçu et colonnes corrigeables, correspondances, résultats), entrée de menu selon l'option du lieu (dossier §15.150)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0040_caisses_connectees.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/db/migrations/0040_caisses_connectees.sql)

### Tests

- `apps/api/test/caisses-externes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/api/test/caisses-externes.test.ts)
- `apps/api/test/options.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/api/test/options.test.ts)
- `packages/domain/src/caisses-externes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/caisses-externes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/caisses-externes.ts)
- `packages/domain/src/csv.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/csv.ts)
- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/editeur.ts)
- `packages/domain/src/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/fidelite.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisses-externes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/api/src/routes/caisses-externes.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx)

### Documentation

- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/docs/flaix-gestion-dossier-projet.md)
- `docs/reference/caisses-externes.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3f9b0460764cd42cb2b79bd589fcb94b0c7e278e/docs/reference/caisses-externes.md)

## 4. Tests créés dans cette phase

### `apps/api/test/caisses-externes.test.ts`

- **caisses connectées**
  - module désactivé par défaut : refusé tant que FlaiX Expert ne l'a pas activé
  - ajout d'une caisse, inscrit au journal ; système inconnu refusé
  - aperçu : colonnes reconnues, ventes comptées, ligne fautive montrée ; rien n'est enregistré
  - import : ventes ajoutées, colonnes retenues, relevé et journal ; aucune vente dans le journal de caisse
  - réimport : aucune vente comptée deux fois, l'annulation est reportée, la nouvelle vente ajoutée
  - [F] colonnes obligatoires introuvables : refusé avec la liste ; colonnes choisies à l'écran : import accepté
  - correspondances : produit de la caisse → produit FlaiX Expert ou ignoré ; point de vente → stand
  - résultats : chiffre d'affaires sans les annulées ni les ignorés, marge des produits rapprochés, par stand, événement, heure
  - les ventes déposées alimentent les Résultats : chiffre d'affaires, stand, mode de paiement, marges ; produit non rapproché sans marge inventée (§15.151)
  - … la prévision (réalisé de l'événement), le stock du stand ; et jamais les clôtures fiscales
  - [F] un autre lieu ne voit rien de ces ventes
  - correspondances automatiques (§15.152) : même nom relié à l'import, nom proche proposé, tout accepter ; « aucun » choisi à la main respecté

### `packages/domain/src/caisses-externes.test.ts`

- **caisses connectées : lecture d'un export (§15.150)**
  - colonnes reconnues d'après des en-têtes variés
  - dates : heure de Paris (été et hiver), fuseau explicite gardé, illisible refusé
  - montants à la française ou non, négatifs, illisibles
  - articles regroupés par vente ; prix ou montant ; TVA ; remboursement ; ligne fautive écartée et signalée
  - colonnes obligatoires manquantes : rien n'est lu ; colonnes données par l'écran : utilisées telles quelles
  - titre au-dessus du tableau et ligne de total en bas (exports Excel) : tableau trouvé, total ignoré sans erreur
- **correspondances suggérées (§15.152)**
  - même nom aux majuscules, accents, espaces et ponctuation près : relié ; homonymes ou rien : pas de lien
  - nom proche : proposé ; contenances différentes jamais confondues ; nom sans rapport : rien
- **export de L'Addition (§15.168)**
  - colonnes reconnues (taux, paiements, salle, remises, offerts), « - » vide, ligne Total ignorée, remise et offert retirés

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/caisses-externes.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/caisses-externes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
