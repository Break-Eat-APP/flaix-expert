# Phase 79 — Factures PDF fabriquées par le logiciel du fournisseur, lues sans IA (Relais d'Or, Montaner Pietrini)

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.178 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.178 Factures PDF fabriquées par le logiciel du fournisseur, lues sans IA (2026-11-12)

**Contexte** : Rémi, le 2026-11-12, a déposé une facture PDF dans l'import automatique : la fonction n'existait pas (seuls
Excel et CSV étaient lus). Il a envoyé de vraies factures des Spartiates de Marseille : deux de Relais d'Or Provence
(alimentaire, 57 et 69 lignes) et une de Montaner Pietrini – CDB (boissons, 5 pages, document d'accompagnement des
droits d'accises). Toutes ont un vrai texte (fabriquées par un logiciel, pas scannées) : elles se lisent **sans IA**,
gratuitement, et la facture ne quitte pas le poste pour être lue. « oui lance la construction ».

**Ce qui est fait** :
- `packages/domain/src/factures-pdf.ts` : `lignesDuPdf` regroupe les morceaux de texte positionnés en lignes ;
  `lireFacturePdf` reconnaît la mise en page et rend fournisseur, n°, date, total HT, lignes (`LigneFactureLue`, la même
  forme que l'import Excel) et des remarques. Mise en page inconnue ou PDF sans texte : `null`, rien n'est deviné.
  - **Relais d'Or** : une ligne d'article = référence, désignation, quantité, unité, prix net, montant, code TVA. La
    lettre de température en tête de désignation (G, S, F) est retirée. Quantité au poids (« 4,800 KG ») : un lot à son
    montant, signalé. Total : « TOTAL H.T … EUR » (chaque commande a son sous-total, ignoré).
  - **Montaner Pietrini (CDB)** : colonnes reconnues à leur position (code, colis, unités, désignation, montant HT droits
    compris). Ligne « GRATUITE FOURNISSEUR » : déduite du montant de la ligne payée, la quantité livrée reste entière.
    Vides, palettes, consignes : écartés (hors achats). Suites de désignation rattachées. « F G » (frais de gestion) :
    une ligne. Total HT : sous « TOTAL » en pied de page.
  - **Contrôle** : la somme des lignes doit retomber sur le total HT imprimé (à 2 centimes) ; sinon, remarque en tête.
    Total introuvable : dit aussi. Prix à 3 décimales : prix arrondi au centime inférieur, l'écart sur une ligne
    « Arrondis des prix unitaires » : le total reste exact.
- `apps/web/src/pages/factures/pdf-texte.ts` : texte du PDF lu par pdf.js 6.4.299 (publié le 2026-10-03), chargé à la
  première facture PDF seulement (fichier séparé de 430 ko, travailleur à part).
- Écran Factures : le bouton « Remplir depuis la facture (PDF, Excel ou CSV) » accepte le PDF ; fournisseur (nom déjà
  connu gardé s'il est voisin, pour reprendre ses correspondances), n°, date, total HT et lignes remplis ; remarques
  affichées ; **le PDF est joint à la facture à l'enregistrement**. Ensuite, comme pour un Excel : correspondances,
  colis, alertes, validation, entrée en réserve.

**Vérifié** : sur les trois vraies factures (non versées au dépôt, elles contiennent des données de tiers), la somme des
lignes retombe au centime sur le total HT : 4 511,74 €, 7 297,65 €, 3 831,61 €. Dans le navigateur, avec pdf.js et son
travailleur, sur une fausse facture au format Relais d'Or. Tests : `factures-pdf.test.ts` (6, dont 3 [F]), sur des
factures fictives aux positions relevées sur les vraies. Le parcours complet à l'écran (enregistrement et pièce jointe)
n'a pas pu être rejoué en local : moteur Docker arrêté sur le poste.

**Reste** : factures scannées ou d'une autre mise en page : IA (clé Mistral) ou nouvelle mise en page à ajouter ici ;
les produits au poids et les matières premières (steaks, fromages) entrent en réserve comme produits, pas comme
ingrédients suivis au poids.

## 2. Ce qui a été construit — commits

- [`2d699d5`](https://github.com/Break-Eat-APP/flaix-expert/commit/2d699d5056b9c69d282c97d5ed75a928051cdbc3) — 2026-11-12 — Factures PDF (§15.178) : lecture du texte positionné, mises en page Relais d'Or et Montaner Pietrini (CDB), contrôle du total HT ; pdf.js 6.4.299 dans l'écran
- [`ac2b4e5`](https://github.com/Break-Eat-APP/flaix-expert/commit/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56) — 2026-11-12 — Factures PDF (§15.178) : le bouton de l'écran Factures accepte la facture PDF ; fournisseur, n°, date, total HT et lignes lus dans le navigateur, PDF joint à l'enregistrement ; total introuvable signalé ; tests

## 3. Fichiers, par couche

### Tests

- `packages/domain/src/factures-pdf.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/packages/domain/src/factures-pdf.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-pdf.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/packages/domain/src/factures-pdf.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/packages/domain/src/index.ts)

### Écrans (apps/web)

- `apps/web/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/apps/web/package.json)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/pages/factures/pdf-texte.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/apps/web/src/pages/factures/pdf-texte.ts)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ac2b4e5bd5b992e4159e32b00ab3eecfc97c4d56/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `packages/domain/src/factures-pdf.test.ts`

- **factures PDF fabriquées par un logiciel (§15.178)**
  - montants des deux écritures ; lignes regroupées par hauteur, de gauche à droite
  - Relais d'Or : fournisseur, n°, date, lignes, total ; poids compté en lot ; les lignes retombent sur le total HT
  - Montaner Pietrini (CDB) : colis, produits offerts déduits, suite de désignation, consignes écartées, frais de gestion, arrondis ; total exact
  - [F] une ligne illisible ou absente : la lecture le signale au lieu de se taire
  - [F] total introuvable : contrôle impossible, dit ; à défaut de « EUR », le dernier « TOTAL H.T » fait foi
  - [F] mise en page inconnue ou PDF scanné (sans texte) : pas de lecture devinée

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/factures-pdf.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
