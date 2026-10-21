# Phase 39 — Revenue Engine : « Où je perds de l'argent »

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.138 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.138 Revenue Engine : « Où je perds de l'argent » (2026-10-04)

**Demande de Rémi** : *« avant de développer les agents IA, je veux qu'on continue à développer l'ensemble des modules […] Revenue Engine, "où je perds de l'argent" : c'est le prochain »* (choix du §15.137). C'est le **module 6 Optimisation** du prototype (validé le 2026-09-13, règles au §14 module 6 et délimitation au §15.22) et l'**étape 2** de l'analyse « Intelligence, prévision et décision » (§15.134) : ruptures chiffrées en fourchette, saturation des caisses, écarts, produits sous leur cible.

**Règle de délimitation reprise du §15.22** : le moteur ne recalcule aucun chiffre qui vit ailleurs. Il **lit** Résultats (ventes, marges, cibles), Stock (mise en place, comptages, écarts), Clôtures (Z des tiroirs et du coffre, rectifications) et le journal de caisse (heure de chaque ticket), puis il **chiffre ce que chaque écart coûte** et le classe par montant. Aucune IA : des règles fixes, écrites ici, testées.

**Où** : Résultats → nouvel onglet **« Où je perds de l'argent »**, pour un événement ou une période (même choix que les autres onglets). Extension additive : les onglets existants ne changent pas.

**Quatre familles, jamais additionnées entre elles** (on n'ajoute pas une perte constatée à une estimation) :

1. **Argent perdu**, classé par montant (barres « tornado » du module 6) :
   - **Ruptures — ventes manquées (estimation en fourchette)**. Seulement pour un produit dont le stock est suivi à ce stand (mise en place ou réassort) et dont le stock théorique est tombé à zéro (alerte « rupture » du Stock). Heure de la rupture = heure de la dernière vente du produit au stand. On ne chiffre pas la demande en minutes mais **au rythme du stand** : `taux = unités du produit ÷ tickets du stand`, mesuré (a) depuis le début des ventes du stand jusqu'à la rupture et (b) sur les 30 minutes qui précèdent la rupture (10 tickets au moins, sinon (a)). `ventes manquées = taux × tickets du stand après la rupture` ; fourchette = du plus petit au plus grand des deux taux (arrondis vers le bas puis vers le haut). Montant = ventes manquées × marge par vente du produit à ce stand (prix HT moyen réalisé − coût) ; sans coût, le CA HT manqué, marqué « coût manquant ». **Pas chiffrée** si le stand a fait moins de 20 tickets avant la rupture (« rupture constatée, trop peu de ventes pour chiffrer ») ; **ignorée** s'il a fait moins de 5 tickets après (rupture en toute fin : la mise en place était juste). Estimation plutôt prudente : les clients partis sans rien acheter ne sont pas comptés. Les ingrédients au poids ne sont pas encore traités.
   - **Écarts de stock (constatés)** : comptage de fin d'événement − stock théorique, valorisé au coût d'achat (règle du Stock). Par produit, les écarts des stands **se compensent** (−8 à un stand, +8 à un autre = déplacés, pas perdus, règle du module 4) : seule la perte nette compte. Ingrédients au poids : perte nette par ingrédient. Un écart sans coût est compté en unités, « valeur inconnue ».
   - **Manques d'espèces (constatés)** : écart négatif du comptage qui fait foi (dernière rectification signée, sinon le Z), tiroir par tiroir, et du coffre. Un excédent n'est pas une perte ; il est mentionné.
   - **Ventes sous le tarif (constatées)** : tickets non annulés signalés « écart de prix » à la réception (§15.97), quand le prix vendu est inférieur au tarif en vigueur : (tarif − vendu) × quantité, ramené en HT au taux du tarif.
2. **Pistes de gain — ordres de grandeur, pas des gains promis** :
   - **Sous la cible de marge** (cible du §15.132) : `cible × CA HT − marge réalisée`, produit par produit.
   - **Volume × marge** (formules du module 6, inchangées) : part du volume − part de la marge ; écart théorique = (marge par vente du reste de la carte − marge par vente du produit) × ventes du produit. Trois produits au plus, écart de part supérieur à 1 point, 3 produits avec coût au moins.
   - **Écarts entre stands** : le module 6 comparait des volumes bruts, faute de fréquentation par stand ; le logiciel a mieux : **le nombre de tickets de chaque stand**. Taux = ventes du produit pour 100 tickets du stand. Un stand qui vend le produit à moins de la moitié du taux du meilleur stand (30 tickets au moins au stand, 10 ventes au moins au meilleur) : `potentiel = (taux du meilleur − taux du stand) × tickets du stand`, × marge par vente. Les couples stand × produit en rupture sont exclus (déjà comptés). Trois au plus.
3. **Accordé — choix du lieu, pas des pertes** : offerts, remises, réductions de fidélité (points et codes), en TTC, lus dans les lignes de ticket.
4. **Signes sans chiffrage** :
   - **Caisse à plein régime** : tickets par tranche de 5 minutes, caisse par caisse ; si la caisse a tenu au moins 85 % de son maximum pendant 3 tranches de suite (15 minutes) et que ce maximum atteint 10 tickets en 5 minutes, signe probable d'une file d'attente. **Aucun montant** : FlaiX ne voit pas les clients partis sans acheter.
   - Ruptures constatées mais non chiffrables (voir plus haut).

**Phrases de décision** (inspiration Hotel F&B, §9) : chaque ligne dit quoi regarder (« Mettre plus de Frites à Buvette Nord : rupture à 21 h 12, 48 min avant la fin des ventes du stand »), puis le calcul. Le directeur décide ; FlaiX ne change rien tout seul.

**Période** : chaque événement est analysé, puis les lignes de même nature sont regroupées (rupture d'un même produit au même stand sur plusieurs événements, écarts de stock et d'espèces additionnés) ; cibles, volume × marge et écarts entre stands se calculent sur la période entière.

**Limites dites à l'écran** : la fourchette des ruptures est une estimation ; les pistes ne tiennent compte ni du report des ventes vers un autre produit ni de l'effet d'un changement de prix (aucune élasticité mesurée, §15.22) ; pas de recommandation de prix (posture prudente du module 6, toujours en vigueur).

**Réalisé le 2026-10-04** (moteur `pertes.ts`, route `GET /api/pertes`, onglet Résultats → « Où je perds de l'argent », phase 39) : quatre chiffres clés (perdu constaté, ventes manquées en fourchette, accordé, signes à regarder) ; argent perdu et pistes en barres classées par montant, chaque ligne avec sa phrase de décision, son calcul et un lien vers l'écran où agir ; signes sans montant ; accordé à part. L'écran dit quand le stock n'est pas suivi ou qu'aucun comptage d'espèces n'existe (jamais un 0 € qui rassure à tort). Un ticket annulé ne compte nulle part, ni dans les ventes ni dans le rythme d'un stand. **Tests** : moteur 12, serveur 4, écran 2. Vérifié dans le navigateur (écran et téléphone).

## 2. Ce qui a été construit — commits

- [`21c7f53`](https://github.com/Break-Eat-APP/flaix-expert/commit/21c7f53ff7f62de497df5079a50ec1bafa83e392) — 2026-10-04 — Revenue Engine : moteur « où je perds de l'argent » et décision (dossier §15.138)
- [`6679d7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/6679d7e3b95a5b0a3d944201499bac16b653694e) — 2026-10-04 — Revenue Engine : route GET /api/pertes, événement ou période (dossier §15.138)
- [`f001e72`](https://github.com/Break-Eat-APP/flaix-expert/commit/f001e72807328fbfd90912174919d11b7dd5f91b) — 2026-10-04 — Revenue Engine : onglet « Où je perds de l'argent » dans Résultats (dossier §15.138)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/pertes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/api/test/pertes.test.ts)
- `packages/domain/src/pertes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/packages/domain/src/pertes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/packages/domain/src/index.ts)
- `packages/domain/src/pertes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/packages/domain/src/pertes.ts)

### Serveur (apps/api)

- `apps/api/src/routes/pertes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/api/src/routes/pertes.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/resultats/Pertes.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/web/src/pages/resultats/Pertes.test.tsx)
- `apps/web/src/pages/resultats/Pertes.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/web/src/pages/resultats/Pertes.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/apps/web/src/resultats.css)

### Documentation

- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f001e72807328fbfd90912174919d11b7dd5f91b/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `packages/domain/src/pertes.test.ts`

- **ruptures : ventes manquées au rythme du stand (§15.138)**
  - rupture à la 38e minute : 12 frites pour 39 tickets avant, 11 pour 30 dans la dernière demi-heure, 21 tickets après → entre 6 et 8 ventes manquées
  - [F] trop peu de tickets avant la rupture : constatée, jamais chiffrée ; rupture en toute fin : rien à signaler
  - le montant est la marge par vente à ce stand ; la phrase dit quoi faire, quand, et combien
  - sans coût d'achat : le CA HT manqué, dit comme tel ; sur une période, les ruptures d'un même produit au même stand s'additionnent
- **pertes constatées : stock, espèces, prix**
  - écarts de stock : les stands se compensent (déplacés, pas perdus), seule la perte nette compte, au coût d'achat
  - espèces : le manque compte, l'excédent est signalé sans être une perte ; ventes sous le tarif ramenées en HT
- **pistes de gain : ordres de grandeur**
  - sous la cible : frites à 61 % pour une cible de 70 % → 83,88 € de marge en plus, à ventes égales
  - volume × marge (exemple du module 6) : l'eau rapporte 2,44 € par vente contre 4,10 € pour le reste de la carte → ≈ 428 € sur 258 ventes
  - écarts entre stands ramenés aux tickets : 12 frites pour 100 tickets à Sud contre 31 à Nord → 152 ventes de plus ; un stand en rupture n'est pas comparé
- **signes sans chiffrage : caisse à plein régime**
  - 12 tickets par tranche de 5 min pendant 20 min, 3 avant et après : à plein régime de 21 h 00 à 21 h 20
  - [F] une caisse calme (moins de 10 tickets en 5 min) ou un pic bref (moins de 15 min) n'est pas signalée
- **familles jamais additionnées**
  - l'accordé (offerts, remises, fidélité) est rendu tel quel, hors des pertes ; rien à signaler sans données

### `apps/api/test/pertes.test.ts`

- **temps de prise de commande, par caisse (§15.139)**
  - l'heure du premier produit part à côté du ticket : rangée à part, le ticket scellé est accepté tel quel
  - [F] une mesure reçue ne se modifie ni ne se supprime
- **où je perds de l'argent : un événement**
  - rupture de frites chiffrée au rythme du stand, sans le ticket annulé ; stock, espèces et prix constatés
  - une période qui contient l'événement donne la même analyse
  - [F] l'événement d'un autre lieu est introuvable ; sans événement ni période, la demande est refusée
  - une période sans événement : rien à signaler, rien d'inventé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/pertes.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/pertes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
