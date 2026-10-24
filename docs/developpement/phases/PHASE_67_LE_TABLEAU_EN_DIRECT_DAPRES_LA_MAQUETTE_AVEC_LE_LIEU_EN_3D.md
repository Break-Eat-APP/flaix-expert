# Phase 67 — Le tableau En direct, d'après la maquette, avec le lieu en 3D

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-19 |
| Décision | dossier projet §15.166 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.166 Le tableau En direct, d'après la maquette de Rémi, avec le lieu en 3D (2026-10-19)

**Demande de Rémi** (2026-10-19, avec deux captures des maquettes de l'artifact de design du 2026-10-11) : *« je pense
que la section en direct est très sympa, notamment comment le logiciel est présenté avec les graphiques et les modules,
avec les petites sections… ça serait bien de faire le dashboard en direct et aussi ce que tu as développé avec le stade
en 3D… pose-moi tes questions, donne des propositions, on construit ensemble »*.

**Avis donné avant de construire** : la maquette affichait une attente (« 6 min », « Chargé / Fluide ») que rien ne
mesure (la file retirée au §15.163), et « Prévenir le stand » suppose un message vers les tablettes, qui n'existe pas.

**Réponses de Rémi** : stade **en haut** d'En direct, cartes des stands dessous (recommandé) ; à la place de l'attente,
les **ventes des 10 dernières minutes** (recommandé) ; **pas d'horloge de match** ; « Prévenir le stand » **plus tard**.

**Décisions** :
- **En direct** devient le tableau de la soirée : en-tête « ● En direct · ouvert depuis 1 h 52 », mis à jour toutes les
  10 s, bouton vers l'assistant ; **4 chiffres** — CA en cours comparé au **match précédent à la même minute** (dernier
  événement clos qui a des ventes ; CA de ses tickets jusqu'au même temps écoulé depuis son ouverture), tickets et ceux
  des 10 dernières minutes, **ventes par minute** avec une pastille *Calme / Normal / Soutenu* (rythme des 10 dernières
  minutes rapporté à la moyenne de la soirée, < 0,6 ou > 1,4, dès 15 min d'ouverture), caisses ouvertes et tablettes
  sans réseau.
- **Le lieu en 3D** (décor, couleurs, placement des stands) passe de Résultats à En direct, avec **« À traiter »** à côté :
  toutes les alertes des stands, rouges d'abord, avec le **réassort en deux gestes** (alertes de stock), « Voir le stand »
  (la page défile jusqu'à sa carte) ou « Y aller ». Un clic sur un stand dans la 3D fait aussi défiler jusqu'à sa carte.
- **Une carte par stand**, de la plus urgente à la fermée : CA, tickets, ventes des 10 dernières minutes, les 3 produits
  les plus entamés en barres (% restant ; rouge en rupture, orange en stock faible, vert sinon), caisses ouvertes et
  dernière vente.
- **Téléphone** : chiffres et cartes d'abord, « À traiter » en carte, le lieu en 3D derrière un bouton.
- **Hors événement** : « Aucun événement ouvert » (et le prochain), le lieu en gris et le placement des stands.
- Résultats ne montre plus le stade (il garde ses tableaux et l'accroche vers En direct pendant l'événement).

**Réalisé le 2026-10-19** : sans migration. Moteur (`planStade` : ventes récentes par stand, produits suivis, `Direct`,
`rythmeVentes`) ; serveur (ventes des 10 dernières minutes, match précédent au même moment) ; écran (`EnDirect.tsx`
refait, `LieuEnDirect` dans `PlanStade.tsx`). **Tests** : moteur 6, serveur 4, écran 5 (chiffres et comparaison, cartes
et barres, stand choisi dans la 3D, À traiter et réassort envoyé, placement, hors événement) ; suite des écrans 97/97.
Essayé dans le navigateur avec une soirée simulée (4 stands, alertes) : ordinateur et téléphone. Corrigés à l'essai :
en-tête et chiffres serrés sur téléphone, « 1 / 2 caisses ouverte ».

## 2. Ce qui a été construit — commits

- [`0e5db30`](https://github.com/Break-Eat-APP/flaix-expert/commit/0e5db300d4aa4cf49b5e7403de1fac3af2bf3137) — 2026-10-19 — En direct : chiffres de la soirée, ventes des 10 dernières minutes, rythme, match précédent au même moment (moteur, serveur)
- [`a54313b`](https://github.com/Break-Eat-APP/flaix-expert/commit/a54313b9270212f230f55e7cd5d42ccd828d3111) — 2026-10-19 — En direct refait d'après la maquette : chiffres de la soirée, lieu 3D en haut avec À traiter, cartes des stands, réassort en deux gestes ; le stade quitte Résultats
- [`77de79f`](https://github.com/Break-Eat-APP/flaix-expert/commit/77de79f0bf42f5e1ed518a6323257cb4dc062c43) — 2026-10-19 — En direct : en-tête et chiffres lisibles sur téléphone ; « 1 caisse ouverte sur 2 »

## 3. Fichiers, par couche

### Tests

- `apps/api/test/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/api/test/plan-stade.test.ts)
- `packages/domain/src/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/packages/domain/src/plan-stade.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/packages/domain/src/plan-stade.ts)

### Serveur (apps/api)

- `apps/api/src/routes/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/api/src/routes/plan-stade.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/App.tsx)
- `apps/web/src/pages/direct/EnDirect.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/PlanStade.test.tsx` — supprimé (n'existe plus)
- `apps/web/src/pages/resultats/PlanStade.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/pages/resultats/PlanStade.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/77de79f0bf42f5e1ed518a6323257cb4dc062c43/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
