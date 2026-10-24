# Phase 74 — Factures automatisées : import Excel ou CSV, colis, correspondances apprises, alertes

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-24 |
| Décision | dossier projet §15.173 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.173 Factures automatisées : import Excel ou CSV, colis, correspondances apprises, alertes (2026-10-24)

**Demande de Rémi** (2026-10-24) : *« tout automatiser lorsque je dépose des factures en PDF ou Excel… que les stocks de
la réserve se mettent à jour automatiquement… le logiciel est capable de lire chaque ligne et de la rentrer proprement
sans se tromper ? »* ; puis : *« toute facture est différente, à créer une correspondance, et aussi créer des alertes si
FlaiX Expert estime un souci de comptage et le directeur valide ou pas »* ; import Excel et contrôles : *« ok »* ; IA :
*« à voir ensemble les coûts et le système »* ; dépôt : *« direct dans FlaiX Expert ? »*.

**Réponse honnête donnée** : un Excel ou CSV se lit exactement (colonnes nettes) ; un PDF demande une IA, jamais 100 % ;
le vrai piège est le colis (« Coca 33 cl x24, quantité 5 » = 120 canettes) ; FlaiX Expert remplit et signale, le
directeur valide. Les ventes d'une caisse connectée diminuaient déjà le stock du stand, une fois les correspondances
faites (§15.151).

**Décisions et réalisation** (migration 0057) :
- **Colis** : chaque ligne de facture porte ses unités par colis (`unites_par_colis`, 1 par défaut) et le code article du
  fournisseur. Rapprochement, écarts et entrée en réserve se font à l'unité vendue (quantité × colis, prix ÷ colis) ;
  le total reste en unités facturées.
- **Correspondances apprises** (`correspondance_article_fournisseur`) : à chaque facture enregistrée, chaque article
  relié à un produit ou en colis est retenu pour ce fournisseur (par son code, sinon son libellé) ; repris à l'import
  suivant. Toute facture est différente : la correspondance se fait une fois par article et par fournisseur.
- **Import Excel ou CSV** (Achats › Factures › Saisir une facture › « Remplir depuis un fichier ») : en-têtes cherchés
  dans les 20 premières lignes (désignation, quantité, prix unitaire ou montant, code, PCB) ; lignes de total ignorées ;
  quantité non entière (au poids) écartée et listée ; produit repris de la correspondance apprise, sinon du même nom,
  sinon le plus ressemblant, marqué « proposé : à vérifier » ; colis lu (PCB) ou deviné dans le libellé (« x24 »,
  « pack de 6 »). Tout reste modifiable avant d'enregistrer.
- **Alertes avant validation** (`alertesFacture`) : total écrit sur la facture (nouveau champ facultatif) ≠ somme des
  lignes ; colis oublié (le libellé dit x24, la ligne compte 1) ; prix à l'unité à plus de 25 % de la dernière livraison
  du produit ; quantité plus de 3 fois l'habitude (médiane des 5 dernières livraisons). **Le directeur tranche** : la
  validation exige « J'ai vérifié » tant qu'il reste une alerte ; les alertes vues sont inscrites au journal.
- **Dépôt** : directement dans FlaiX Expert (bouton d'import, pièce jointe PDF), pas d'adresse e-mail pour l'instant.
- **Lecture des PDF par IA** : à décider avec Rémi (service, coût, envoi des factures à un tiers) ; l'import, les
  correspondances et les alertes ci-dessus serviront de garde-fous à la lecture automatique.

**Tests** : moteur 5 (lecture d'un export de grossiste, en-têtes avec ponctuation, colonnes manquantes, colis devinés,
conversion, alertes) ; serveur 3 (colis de 24 entré en réserve à 0,60 €, correspondance apprise, colis oublié : alerte
et validation refusée sans « J'ai vérifié ») ; écrans 2 (import CSV : appris, même nom, proposé ; alertes à cocher) ;
écrans 104 au total ; types et construction. Vu dans le navigateur en local (formulaire de saisie).

## 2. Ce qui a été construit — commits

- [`6d19641`](https://github.com/Break-Eat-APP/flaix-expert/commit/6d19641b46c8fb27480bdcddd60bea2ed1ed0859) — 2026-10-24 — Factures automatisées : colis, correspondances apprises, alertes avant validation (§15.173)
- [`1c6a401`](https://github.com/Break-Eat-APP/flaix-expert/commit/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9) — 2026-10-24 — Factures : remplir la saisie depuis un fichier Excel ou CSV, colis, total annoncé, alertes à vérifier (§15.173)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0057_factures_automatisees.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/db/migrations/0057_factures_automatisees.sql)

### Tests

- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/api/test/facture-reserve.test.ts)
- `packages/domain/src/factures-import.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/packages/domain/src/factures-import.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/packages/domain/src/factures-import.ts)
- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/packages/domain/src/factures.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/packages/domain/src/index.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/api/src/routes/factures.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/fichiers.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/web/src/pages/caisses-connectees/fichiers.ts)
- `apps/web/src/pages/factures/Factures.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/web/src/pages/factures/Factures.test.tsx)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1c6a4011332a8a16e9894b4d6fb8fef2f3d3f5a9/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `packages/domain/src/factures-import.test.ts`

- **factures automatisées (§15.173)**
  - export Excel d'un grossiste : titre au-dessus, PCB, prix déduit du montant, total ignoré, ligne au poids écartée
  - en-têtes avec ponctuation (« P.U. HT », « Qté. ») sans colonne de montant
  - [F] colonnes introuvables : dites, rien n'est lu
  - colis devinés dans un libellé ; clé d'article ; conversion à l'unité
  - alertes : total, colis oublié, prix et quantité inhabituels ; rien quand tout est normal

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/factures-import.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
