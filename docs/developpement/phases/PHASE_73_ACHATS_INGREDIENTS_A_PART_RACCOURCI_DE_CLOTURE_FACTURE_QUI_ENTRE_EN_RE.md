# Phase 73 — Achats, Ingrédients à part, raccourci de clôture ; facture qui entre en réserve ; export pour le comptable

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-23 |
| Décision | dossier projet §15.172 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.172 Achats, Ingrédients à part, raccourci de clôture ; facture qui entre en réserve ; export pour le comptable (2026-10-23)

**Demande de Rémi** (2026-10-23) : *« clôture de caisse plus en avant dans la section En direct… les ingrédients séparés
de la gestion stock, laissons le stock pur et compréhensible… lire une facture de fournisseur automatiquement pour
qu'elle rentre en réserve principale ?… suivi de chaque facture payée ou pas, télécharger par période les factures en
PDF pour la comptabilité… comment activer les notifications ?… le prix fournisseur, peut-être les mettre ailleurs.
Le but : comprendre facilement le logiciel sans trop chercher. »* Choix de Rémi : Achats et Ingrédients à part ;
clôture : « juste un raccourci » ; factures : d'abord sans IA ; factures concernées : fournisseurs reçues et
événements privés.

**Décisions et réalisation** :
- **En direct** : bouton rouge « Clôturer la soirée » pendant un événement ouvert, vers Clôtures (les contrôles restent
  ceux de Clôtures).
- **Menu** : « Achats » remplace « Factures » et regroupe trois onglets — Factures, Livraisons (le formulaire de
  livraison sorti de la réserve, et les dernières livraisons), Prix fournisseurs ; visible avec l'option Factures ou
  l'option Stock (l'onglet suit l'option). « Ingrédients » devient une page du menu (réserve, mise en place, comptage des
  ingrédients suivis). **Stock** ne garde que les produits, en 4 étapes ; la réserve renvoie vers Achats pour une
  livraison. L'adresse /factures mène à Achats › Factures.
- **Facture validée → réserve** : à la validation, une case (cochée par défaut) fait entrer en réserve centrale chaque
  produit de la facture sans livraison rapprochée : une livraison au prix et à la date de la facture, coût moyen pondéré
  recalculé (fonction `enregistrerLivraison`, commune avec la saisie d'une livraison), rapprochée de sa ligne ; un
  produit fabriqué (recette) ne se livre pas. Sans la case, la règle d'avant (motif exigé) demeure. Journal : liste des
  produits entrés.
- **Export pour le comptable** (Achats › Factures › « Pour le comptable », mois précédent par défaut) : un zip
  `factures-AAAA-MM-JJ-au-AAAA-MM-JJ.zip` — `achats/` : la pièce jointe (PDF ou photo) de chaque facture fournisseur
  datée de la période ; `ventes/` : chaque facture d'événement privé émise sur la période, en PDF fabriqué depuis son
  contenu scellé (`pdf-facture.ts`, pdf-lib, Helvetica) ; `recapitulatif.csv` (Excel : « ; », virgule décimale, BOM) :
  type, date, numéro, fournisseur ou client, HT, TVA et TTC (ventes), statut, date de paiement, pièce. Journalisé
  (`factures_exportees`). Dépendances ajoutées : fflate 0.8.3, pdf-lib 1.17.1.
- **Lecture automatique des factures (IA)** : plus tard, une fois le service choisi avec Rémi (coût à la page, envoi
  de la facture à un tiers) ; la saisie validée par le directeur restera obligatoire.
- **Notifications** (réponse à Rémi, rien de changé) : Paramètres › Notifications › « Activer sur cet appareil » sur
  chaque téléphone ; sur iPhone, ajouter d'abord FlaiX Expert à l'écran d'accueil (Safari › Partager) et l'ouvrir par
  son icône. Ruptures et stock bas pendant l'événement, brief de fin de soirée ; rapport de soirée par e-mail.

**Tests** : serveur (facture → réserve 2, export 2, factures, stock), écrans 102 (menu : Achats et Ingrédients) ;
suite du serveur relancée fichier par fichier ; types et construction. Vu dans le navigateur en local : Achats
(Factures et l'encadré pour le comptable, Livraisons), Ingrédients, Stock. Le PDF n'a pas pu être regardé à l'écran
(le navigateur intégré n'affiche pas les PDF) : à vérifier sur le premier export réel.

## 2. Ce qui a été construit — commits

- [`8aa91c8`](https://github.com/Break-Eat-APP/flaix-expert/commit/8aa91c88b0c11f747157cebe5e896453830b0192) — 2026-10-23 — En direct : raccourci « Clôturer la soirée » vers Clôtures (§15.172)
- [`e521638`](https://github.com/Break-Eat-APP/flaix-expert/commit/e5216385a9821425c1f4cd3d1907dbbc722975e1) — 2026-10-23 — Menus : Achats (factures, livraisons, prix fournisseurs) et Ingrédients à part ; Stock ne garde que les produits (§15.172)
- [`e3f7ec6`](https://github.com/Break-Eat-APP/flaix-expert/commit/e3f7ec6be880641bcce20da04181cc78089235e5) — 2026-10-23 — Facture validée : ses produits entrent en réserve centrale (§15.172) ; avancement
- [`269beca`](https://github.com/Break-Eat-APP/flaix-expert/commit/269beca65504c00298d03bbdb4703904021cbda3) — 2026-10-23 — Achats : export des factures d'une période pour le comptable (§15.172)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/export-factures.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/test/export-factures.test.ts)
- `apps/api/test/facture-reserve.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/test/facture-reserve.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/composants/Coquille.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/packages/domain/src/factures.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/package.json)
- `apps/api/src/pdf-facture.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/src/pdf-facture.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/src/routes/factures.ts)
- `apps/api/src/routes/stock.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/api/src/routes/stock.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/achats/Achats.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/achats/Achats.tsx)
- `apps/web/src/pages/achats/Livraisons.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/achats/Livraisons.tsx)
- `apps/web/src/pages/direct/EnDirect.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/pages/ingredients/Ingredients.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/ingredients/Ingredients.tsx)
- `apps/web/src/pages/parametres/Recettes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/parametres/Recettes.tsx)
- `apps/web/src/pages/stock/Stock.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/pages/stock/Stock.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/docs/avancement.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/269beca65504c00298d03bbdb4703904021cbda3/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/api/test/facture-reserve.test.ts`

- **facture validée, produits entrés en réserve**
  - [F] sans la case : un produit sans livraison demande un motif, rien n'entre en réserve
  - avec la case : 24 canettes entrent en réserve au prix et à la date de la facture, ligne rapprochée, facture validée
  - correspondance apprise ; [F] colis oublié : alerte, validation refusée sans « J'ai vérifié », acceptée avec

### `apps/api/test/export-factures.test.ts`

- **export des factures pour le comptable**
  - un zip : pièce du fournisseur, facture de vente en PDF, récapitulatif ; hors période absente ; journalisé
  - [F] période à l'envers : refusée

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/facture-reserve.test.ts test/export-factures.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
