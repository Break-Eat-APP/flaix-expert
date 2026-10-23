# Phase 65 — Le lieu en 3D : quatre décors, stands posés à la main

> FlaiX Expert · dossier de développement · généré le 2026-10-23 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-16 |
| Décision | dossier projet §15.164 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.164 Le lieu en 3D : quatre décors, stands posés à la main (2026-10-16)

**Demande de Rémi** (2026-10-16) : *« j'ai vu que tu plaçais automatiquement les stands autour du stade. Est-ce qu'il
est possible de les placer moi-même ? … Tu as mis un stade carré, mais il peut y avoir aussi une arène ronde, un stade
de hockey sur glace ou autre type de stadium. Est-ce que tu peux me créer un effet 3D comme tu l'as fait, de plusieurs
templates ? »*

**Décisions** (choix recommandés) :
- **Quatre décors** dessinés en 3D, au choix du directeur pour son lieu : **stade** (foot, rugby : terrain, quatre
  tribunes avec toit), **patinoire** (glace aux lignes de hockey, bandes, vitres, buts, gradins arrondis tout autour),
  **arène ronde** (parquet avec terrain de basket aux couleurs de l'application, gradins circulaires, tableau
  d'affichage suspendu), **salle de spectacle** (scène, écran, enceintes, fosse, gradins à l'est, au sud, à l'ouest).
  Le titre de la carte suit le décor (« La patinoire en direct »…).
- **Mode « Placer les stands »** (directeur seulement ; ni le support, ni le mode formation) : choix du décor, puis on
  attrape une buvette (souris ou doigt) et on la pose où l'on veut sur l'esplanade ; elle se tourne vers le centre.
  Chaque stand se remet en automatique d'un geste (ou « Tout en automatique ») ; rien n'est enregistré avant
  « Enregistrer », « Annuler » abandonne tout.
- **Sans position posée**, un stand reste placé tout seul sur sa tribune (§15.162), dans le décor choisi (même ordre de
  gauche à droite partout). Changer de décor garde les places posées à la main.
- Positions en unités de la scène, centre du lieu en 0,0, bornées à 120 (la buvette reste sur l'esplanade) ; écriture
  au journal technique (`plan_stade_modifie` : décor avant/après, stands déplacés).

**Réalisé le 2026-10-16** : migration 0052 (décor du lieu, position des stands, suivis en mode formation) ; serveur
(PUT /api/plan-stade) ; écran (décors, glisser-déposer, panneau de placement). **Tests** : serveur 4 (dont décor et
place enregistrés, valeurs hors limites refusées, stand inconnu, retour en automatique), moteur 5, décors 4 (place
automatique dans chaque décor, ordre gauche-droite, place posée, comptoir vers le centre, bornage), écran 3 (dont mode
placement : décor choisi, stand glissé, remis en automatique, enregistré). Essayé dans le navigateur : les quatre décors
avec 6 stands simulés, puis sur le compte de démonstration : patinoire choisie, Buvette Nord glissée au sud-est,
enregistrée et relue. Corrigés à l'essai : buvettes de l'arène trop serrées et ordre inversé au sud, buvettes nord de la
salle cachées par l'écran, fosse peu visible.

## 2. Ce qui a été construit — commits

- [`2bcf514`](https://github.com/Break-Eat-APP/flaix-expert/commit/2bcf5147ff8c71bc4b2043c05ff9050b1ac30ee5) — 2026-10-16 — Plan du lieu : décor (stade, patinoire, arène, salle) et stands posés à la main — base, moteur, serveur
- [`284297b`](https://github.com/Break-Eat-APP/flaix-expert/commit/284297bec857e094f0e40459c102f2b8a2b564c4) — 2026-10-16 — Plan du lieu : quatre décors 3D (stade, patinoire, arène ronde, salle de spectacle) et mode « Placer les stands »
- [`69daccc`](https://github.com/Break-Eat-APP/flaix-expert/commit/69dacccb4d5c16bcd19da326cbec79bee1288efa) — 2026-10-16 — Plan du lieu : ordre et écart des buvettes de l'arène, buvettes nord de la salle derrière l'écran, fosse plus visible

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0052_plan_lieu.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/db/migrations/0052_plan_lieu.sql)

### Tests

- `apps/api/test/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/api/test/plan-stade.test.ts)
- `apps/web/src/pages/resultats/modeles-plan.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/resultats/modeles-plan.test.ts)
- `packages/domain/src/plan-stade.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/packages/domain/src/plan-stade.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/packages/domain/src/journal-technique.ts)
- `packages/domain/src/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/packages/domain/src/plan-stade.ts)

### Serveur (apps/api)

- `apps/api/src/routes/plan-stade.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/api/src/routes/plan-stade.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/decors3d.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/resultats/decors3d.ts)
- `apps/web/src/pages/resultats/modeles-plan.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/resultats/modeles-plan.ts)
- `apps/web/src/pages/resultats/PlanStade.test.tsx` — modifié (n'existe plus)
- `apps/web/src/pages/resultats/PlanStade.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/resultats/PlanStade.tsx)
- `apps/web/src/pages/resultats/Stade3D.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/pages/resultats/Stade3D.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69dacccb4d5c16bcd19da326cbec79bee1288efa/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/web/src/pages/resultats/modeles-plan.test.ts`

- **décors du lieu**
  - stade : les buvettes d'une tribune se partagent sa longueur, derrière les gradins (comme avant le choix du décor)
  - chaque décor : place sur le bon côté, hors de l'aire de jeu, dans le cadre, et distincte pour deux voisines
  - posé à la main : la position l'emporte sur la tribune ; comptoir vers le centre ; bornée à l'esplanade
- **ordre des buvettes sur un côté**
  - de gauche à droite vu du sud, comme au stade : au nord et au sud d'ouest en est ; à l'est et à l'ouest du nord au sud

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
