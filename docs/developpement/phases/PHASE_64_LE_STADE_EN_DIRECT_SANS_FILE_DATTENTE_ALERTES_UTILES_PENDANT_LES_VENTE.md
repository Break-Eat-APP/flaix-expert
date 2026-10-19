# Phase 64 — Le stade en direct sans file d'attente : alertes utiles pendant les ventes

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-16 |
| Décision | dossier projet §15.163 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.163 Le stade en direct, sans file d'attente : les alertes utiles pendant les ventes (2026-10-16)

**Question de Rémi** (2026-10-12) : *« comment tu fais pour savoir que les gens attendent ? c'est pas calculable, il n'y
a pas de calculateur de queue »*. Réponse : la « file » du §15.162 n'était qu'une déduction (commande suivante commencée
moins de 20 s après l'encaissement) — elle dit que la caisse enchaîne, pas combien de personnes attendent. Puis : *« on
s'en fout pour l'instant de la queue, juste parle d'alerte stock, connexion, ou autres infos à savoir durant les ventes
qui pourraient alerter le directeur F&B »*.

**Décisions** :
- **File d'attente retirée** du stade (couleur, fiche, seuils). Le temps de prise de commande (§15.139) reste dans
  Résultats, inchangé. Dans la fiche du stand, « Dernière vente » la remplace.
- **Alertes pendant l'événement ouvert**, toutes lues dans ce qui existe déjà :
  - **stock** : rupture → rouge ; stock faible → orange ; **rupture prévue** dans 15 min ou moins au rythme des
    15 dernières minutes → orange (« Rupture prévue : Frites dans 10 min environ ») ; la **réserve** est rappelée
    quand elle en a (« 48 en réserve : réassort en deux gestes ») ;
  - **réseau** : tablette sans nouvelles depuis plus de 2 min ou tickets à envoyer → orange ; **plus de 15 min → rouge** ;
  - **caisses** : caisse ouverte **sans vente depuis 15 min alors que le stade vend** (une vente ailleurs dans les
    5 dernières minutes : pas d'alerte à la mi-temps ni en fin de match) → orange ; **ventes à un prix différent du
    tarif** (contrôle déjà fait à la réception des tickets : la tablette n'a pas les derniers prix) → orange ;
    **annulations nombreuses** (5 au moins et 5 % des ventes de la caisse au moins) → orange ;
  - **hygiène** : inchangée (§15.162).
- Pas d'alerte « espèces dans le tiroir » : sans prélèvement de caisse dans l'application, elle ne dirait pas quoi faire.

**Réalisé le 2026-10-16** : moteur et serveur revus, sans migration. **Tests** : moteur 5 (placement, couleurs, rupture
prévue et réserve, caisse sans vente seulement si le stade vend, prix hors tarif, annulations au-delà de 5 %, tablette
rouge après 15 min, hors événement), serveur 3 (dont un prix ancien et 5 annulations sur 16 ventes, vrais tickets de
tablette), écran 2.

## 2. Ce qui a été construit — commits

- [`af99274`](https://github.com/Break-Eat-APP/flaix-expert/commit/af99274982ae73f30fb39365fafb0e429ba960dc) — 2026-10-16 — Stade en direct : sans file d'attente ; alertes de vente (rupture prévue, réserve, caisse sans vente, prix hors tarif, annulations)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/af99274982ae73f30fb39365fafb0e429ba960dc/apps/api/test/plan-stade.test.ts)
- `packages/domain/src/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/af99274982ae73f30fb39365fafb0e429ba960dc/packages/domain/src/plan-stade.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/af99274982ae73f30fb39365fafb0e429ba960dc/packages/domain/src/plan-stade.ts)

### Serveur (apps/api)

- `apps/api/src/routes/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/af99274982ae73f30fb39365fafb0e429ba960dc/apps/api/src/routes/plan-stade.ts)

### Écrans (apps/web)

- `apps/web/src/pages/resultats/PlanStade.test.tsx` — modifié (n'existe plus)
- `apps/web/src/pages/resultats/PlanStade.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/af99274982ae73f30fb39365fafb0e429ba960dc/apps/web/src/pages/resultats/PlanStade.tsx)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
