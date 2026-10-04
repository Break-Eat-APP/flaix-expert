# Phase 8 — Résultats sur les vraies ventes

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.103 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.103 Résultats — tableaux construits sur les vraies ventes : conception (2026-09-30)

Demande de Rémi (§15.99) : construire les tableaux de Résultats. Référence visuelle : maquette v2.1 validée (`docs/maquettes/organisation-v2.html`, relue en entier le 2026-09-30) et règles d'écran du §15.95. **Principe : n'afficher que ce que les données réelles permettent de calculer ; « coût manquant » ou « donnée manquante » plutôt qu'un chiffre trompeur (décision du §15.95).**

- **Match affiché** : le match ouvert s'il a des ventes, sinon le dernier match clos ; au choix dans une liste. **Match de comparaison** : par défaut le match précédent qui a des ventes ; au choix (décision validée « choisir le match à comparer »).
- **Vue d'ensemble** : 4 chiffres avec évolution et mini-courbe (CA TTC, tickets, panier moyen, CA par spectateur — « affluence manquante » si le nombre de spectateurs n'est pas saisi) ; CA par heure (ce match en aire violette, match de comparaison en pointillé, lecture au survol) ; anneau « ventes par catégorie » (5 parts au plus + « Autres ») ; meilleurs produits (vendus, CA TTC avec barre, marge par vente ou « coût manquant ») ; panneau « À surveiller » (tickets signalés, annulations, produits sans coût, écart d'espèces au-delà de la tolérance, affluence non saisie, caisses encore ouvertes) et « Prochains matchs ».
- **Ventes** : les deux matchs côte à côte (CA, tickets, panier moyen, spectateurs), chaque stand d'un match à l'autre (point gris → point violet), produit par produit.
- **Finances** : cascade de l'encaissé TTC à la marge brute (TVA collectée, CA HT, coût matière, marge brute), TVA par taux, moyens de paiement (carte / espèces). **Personnel, commission, frais et autres dépenses : pas encore saisis dans FlaiX** (Équipe → Masse salariale et Objectifs & coûts à venir) : la cascade s'arrête à la marge brute et le dit ; pas d'objectif de marge nette tant qu'aucune cible n'est réglée.
- **Marges** : chaque produit placé selon ses ventes et sa marge par vente (repères = médianes du match, zone « à revoir » = beaucoup vendu, peu de marge) ; tableau par produit ; pistes calculées « à volume égal » (ex. +0,50 € sur le prix = +X € de marge), présentées comme des calculs, jamais comme des conseils.
- **Rapports de soirée** : la saison match par match (CA de chaque match) et la liste des matchs clos avec leurs chiffres clés. Le rapport figé imprimable et son envoi par e-mail viendront ensuite.

**Limites dites clairement** :
- **Coût matière = coût saisi aujourd'hui sur la fiche produit**, appliqué aux ventes passées : FlaiX ne garde pas encore l'historique des coûts (il viendra avec le Stock et le coût moyen pondéré). Si un coût change, la marge des matchs passés change aussi. Affiché sous la cascade et dans les règles.
- **Marge brute non calculée dès qu'un produit vendu n'a pas de coût** : « coût manquant sur N produits (X % du CA HT) », avec leur liste.
- Heures : heure de Paris ; une soirée qui passe minuit reste dans l'ordre (0 h–5 h après 23 h).

**Réalisé le 2026-09-30** : serveur `routes/resultats.ts` (`GET /api/resultats`, match et comparaison au choix) ; moteur `packages/domain/src/resultats.ts` (évolution, médianes, parts d'anneau, repères et pistes des marges) ; écran Résultats en 5 onglets sous la mise en route du lieu, graphiques repris de la maquette v2.1 (`apps/web/src/pages/resultats/`, styles `apps/web/src/resultats.css`, palette vérifiée de la maquette). **Ajustement signalé** : le match affiché par défaut est **le dernier joué** (ouvert en dernier), et la comparaison est le match joué juste avant — plutôt que l'ordre des dates du calendrier, qui pouvait mettre en avant un match au calendrier lointain.

**Vérifié** : 4 tests du moteur (évolution absente quand la comparaison manque, soirée qui passe minuit, « Autres » jamais pour une seule part, repères et pistes : +0,50 € sur la bière 25 cl à 20 % = +130 € à volume égal) ; 6 tests serveur (annulations déduites, TVA et HT recalculés à la main, coût manquant sans marge brute puis marge brute une fois le coût saisi, CA par spectateur, somme des heures = CA). Essai dans le navigateur sur le lieu d'essai local : les 5 onglets, les chiffres des 3 matchs d'essai, « À surveiller » (affluence non saisie). **Défauts trouvés et corrigés pendant l'essai** : étiquette du pic coupée au bord droit ; légende de l'anneau superposée sur une carte étroite ; mise en deux colonnes qui ne passait pas à une colonne sur écran moyen ; graduations en double sur l'axe des ventes (demi-unités arrondies) ; signe moins typographique.

## 2. Ce qui a été construit — commits

- [`d0985d1`](https://github.com/Break-Eat-APP/flaix-expert/commit/d0985d1d0d9e4401daf162b3691e0a8bbf64d93d) — 2026-09-30 — Dossier §15.103 : conception des tableaux de Résultats sur les vraies ventes
- [`d29e769`](https://github.com/Break-Eat-APP/flaix-expert/commit/d29e769b04006130ef9260ed5ac5a4e52015c7b2) — 2026-09-30 — Résultats, serveur : chiffres du match, comparaison, coût manquant, alertes (dossier §15.103)
- [`d3194ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3194ab2b67f34b45515cd6ef005c9494c72cb34) — 2026-09-30 — Résultats : 5 onglets sur les vraies ventes, comparaison au choix, coût manquant (dossier §15.103)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/resultats.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/api/test/resultats.test.ts)
- `packages/domain/src/resultats.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/packages/domain/src/resultats.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/packages/domain/src/index.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/packages/domain/src/modele.ts)
- `packages/domain/src/resultats.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/packages/domain/src/resultats.ts)

### Serveur (apps/api)

- `apps/api/src/routes/resultats.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/main.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/web/src/main.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/graphiques.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/web/src/pages/resultats/graphiques.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/apps/web/src/resultats.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d3194ab2b67f34b45515cd6ef005c9494c72cb34/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/resultats.test.ts`

- **Résultats — le dernier événement, comparé au précédent**
  - par défaut : l'événement le plus récent, comparé au précédent qui a des ventes
  - chiffres clés : les annulations sont déduites, jamais comptées comme des ventes
  - coût manquant : pas de marge brute tant qu'un produit vendu n'a pas de coût, et l'alerte le dit
  - une fois le coût saisi, la marge brute est calculée
  - l'événement précédent se choisit ; ses chiffres et son CA par spectateur
  - CA par heure : la somme des heures égale le CA

### `packages/domain/src/resultats.test.ts`

- **Résultats — calculs de présentation (§15.103)**
  - évolution : null quand la comparaison manque ou vaut zéro, jamais un chiffre inventé
  - médiane, heures d'une soirée qui passe minuit
  - camembert : 5 parts nommées au plus, le reste en « Autres » ; jamais une part « Autres » d'un seul élément
  - nuage des marges : repères = médianes des produits dont le coût est connu ; « à revoir » = beaucoup vendu, peu de marge

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/resultats.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/resultats.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
