# Phase 68 — En direct à part, au design des maquettes ; Résultats pour les événements terminés

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-19 |
| Décision | dossier projet §15.167 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.167 En direct à part, au design des maquettes ; Résultats pour les événements terminés (2026-10-19)

**Demande de Rémi** (2026-10-19, avec les deux maquettes « En direct » et « Résultats » de l'artifact de design) :
*« je veux séparer le « en direct », avoir une section à part… « résultats » à part, la consulter pour les événements
terminés seulement pour comparer. Où est passé le stade en 3D ? … on peut afficher les KPI au-dessus de chaque stand en
petit et les alertes aussi, et à chaque clic sur le stand cela apparaît en gros les détails et KPI, alertes… au-dessus
du stade toujours afficher les KPI importants, CA, tickets vendus, avec %… je veux exactement le même design et couleur…
même le graphique avec l'évolution des heures et des ventes »*.

**Constat** : le stade n'avait pas disparu, mais En direct n'avait **pas d'entrée dans le menu** (seulement une accroche
dans Résultats pendant un événement) : hors événement, il était introuvable.

**Choix de Rémi** (KPI proposés, tous calculables) : CA, tickets, panier moyen (avec % et petite courbe), marge brute
en cours, prévision de fin de soirée ; ventes par minute et rythme, CA par spectateur. Ordre : En direct d'abord.

**Décisions** :
- **Menu** : entrée « En direct » juste après Résultats, avec un point rouge pendant un événement ouvert.
- **Résultats** ne montre plus que les **événements terminés (clos)**, pour comparer ; l'événement en cours est dans
  En direct (le serveur écarte l'événement ouvert de la liste, du choix par défaut et des bilans de période).
- **En direct**, au design de Résultats (cartes, couleurs, graphiques) :
  - **8 chiffres** : CA en cours, tickets, panier moyen (badge « +9 % » contre le **dernier événement clos qui a des
    ventes au même temps écoulé depuis son ouverture**, valeur de ce match dessous, petite courbe par quart d'heure),
    marge brute (en € et en % du CA HT, coût manquant signalé), ventes par minute et rythme, **prévision de fin de
    soirée** (médiane du module Prévision, fourchette, part déjà atteinte), CA par spectateur (si l'affluence est saisie),
    caisses ouvertes et tablettes sans réseau. Montants arrondis à l'euro comme sur la maquette.
  - **Le lieu en 3D** : sous chaque stand, ses petits chiffres (CA, tickets) et une pastille avec le nombre d'alertes ;
    **un clic ouvre son détail en grand** à côté (CA, tickets, panier, 10 dernières minutes, part du CA du lieu,
    dernière vente, alertes avec leurs actions, stock restant) ; sans stand choisi, « À traiter ».
  - **Chiffre d'affaires de la soirée** par quart d'heure, ce match en trait plein, le précédent en pointillé (même
    graphique que Résultats) ; **ventes par catégorie** (anneau) ; **cartes des stands** ; **ce qui se vend le mieux**.
  - Sur téléphone : chiffres et cartes, le lieu en 3D derrière un bouton ; les petits chiffres sous les stands masqués.

**Réalisé le 2026-10-19** : sans migration. Moteur `direct.ts` (quarts d'heure, cumul au même moment, `tableauDirect`) ;
serveur GET /api/direct ; écran (menu, `EnDirect.tsx`, étiquettes de la 3D) ; Résultats limité aux événements clos.
**Tests** : moteur 3, serveur (tableau d'un événement ouvert, aucun hors événement), écran 5 et menu 3 ; suite des écrans
97/97 ; résultats, périodes, assistant et prévision relancés. Essayé dans le navigateur sur une soirée simulée
(ordinateur). Corrigés à l'essai : textes de comparaison trop longs dans les badges, montants avec centimes sur deux
lignes, rangée du graphique de hauteur inégale, cartes des stands trop serrées.

**À faire ensuite** (avec Rémi) : la page Résultats au design de la 2e maquette pour les événements terminés ;
« Prévenir le stand » (message aux tablettes).

## 2. Ce qui a été construit — commits

- [`25fcf2a`](https://github.com/Break-Eat-APP/flaix-expert/commit/25fcf2a9fbdb17a911700a253ddad814aae2e521) — 2026-10-19 — Tableau En direct : CA, tickets et panier comparés au match précédent au même moment, courbe par quart d'heure, marge, prévision, catégories, meilleurs produits (moteur, serveur)
- [`a34efbd`](https://github.com/Break-Eat-APP/flaix-expert/commit/a34efbd946d10f3234fd45df50937f0e1854d6a1) — 2026-10-19 — En direct à part dans le menu (point rouge pendant un événement) : chiffres clés au design de Résultats, lieu 3D avec petits chiffres par stand et détail en grand au clic, courbe de la soirée, ventes par catégorie, meilleurs produits ; Résultats limité aux événements terminés
- [`f73a1b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5) — 2026-10-19 — En direct : badges courts et montants arrondis comme la maquette, rangée courbe/catégories à hauteur égale, cartes des stands plus lisibles

## 3. Fichiers, par couche

### Tests

- `apps/api/test/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/api/test/plan-stade.test.ts)
- `apps/web/src/composants/Coquille.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/composants/Coquille.test.ts)
- `packages/domain/src/direct.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/packages/domain/src/direct.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/direct.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/packages/domain/src/direct.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/packages/domain/src/index.ts)

### Serveur (apps/api)

- `apps/api/src/routes/direct.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/api/src/routes/direct.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/direct/EnDirect.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/resultats/Stade3D.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/pages/resultats/Stade3D.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f73a1b3f3be51fca8848cf9fe133baae0b0da3c5/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `packages/domain/src/direct.test.ts`

- **tableau En direct (§15.167)**
  - quarts d'heure et cumul jusqu'au même temps écoulé ; une annulation retire son ticket
  - CA, tickets et panier comparés au match précédent au même moment ; marge, prévision, spectateurs, catégories, meilleurs
  - sans match précédent ni prévision ni spectateurs : pas de comparaison, rien d'inventé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/direct.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
