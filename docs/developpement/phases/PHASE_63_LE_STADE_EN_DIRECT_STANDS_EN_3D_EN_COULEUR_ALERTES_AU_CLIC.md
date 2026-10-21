# Phase 63 — Le stade en direct : stands en 3D, en couleur, alertes au clic

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-12 |
| Décision | dossier projet §15.162 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.162 Le stade en direct : les stands en 3D, en couleur, alertes au clic (2026-10-12)

**Demande de Rémi** (2026-10-12) : *« je verrais un stade en 3D dans le module dashboard, avec les buvettes autour,
en affichant le stand en couleur vert, orange ou rouge en fonction des capacités, stock, ou autre indice ; lorsque je
clique sur le stand, cela affiche les alertes du stand »*.

**Décisions** (choix recommandés, pris sans attendre) :
- **Carte « Le stade en direct » dans Résultats** (le tableau de bord), dès qu'il y a un stand. Stade générique : terrain,
  tribunes Nord et Sud le long du terrain, Est et Ouest derrière les buts ; chaque buvette derrière sa tribune, toit et
  pastille à sa couleur ; on tourne et zoome au doigt ou à la souris. À côté, la liste des stands du plus urgent au
  fermé ; un clic (dans la 3D ou la liste) ouvre la fiche du stand : CA, tickets, caisses ouvertes, file d'attente, et
  ses alertes avec un lien « Y aller ». Sur téléphone, la 3D ne garde que les pastilles (le nom pour le stand choisi).
- **Couleur** (rien de nouveau n'est mesuré, tout vient des modules existants) :
  - **rouge** : rupture d'un produit au stand ; file d'attente sur 80 % des commandes ou plus ;
  - **orange** : stock faible ; file sur 50 % ou plus ; tablette sans nouvelles depuis plus de 2 min ou tickets à
    envoyer ; température hors limite d'un équipement du stand (7 jours) ; températures d'ouverture à relever ;
  - **vert** : au moins une caisse ouverte, rien à signaler ; **gris** : aucune caisse ouverte.
  - « Capacité » = la file d'attente, mesurée comme au §15.139 (part des commandes servies alors que le client suivant
    attendait déjà), sur les 15 dernières minutes, dès 5 commandes mesurées.
  - Hors événement, stock et file ne comptent pas : les stands sont gris (sauf hygiène).
- **Place des stands** : tribune choisie dans Stands & caisses (« Automatique » par défaut) ; sinon devinée du nom
  (« Buvette Nord » → Nord) ; sinon la tribune la moins garnie. Sur une tribune, par nom.
- **3D** : three.js 0.186.1, chargé à part (142 Ko compressés) seulement à l'ouverture de Résultats ; si l'appareil n'a
  pas la 3D, la liste reste là. Lecture seule : aucune donnée enregistrée en dehors de la tribune.

**Réalisé le 2026-10-12** : migration 0051 (tribune du stand, suivie en mode formation) ; moteur (placement, couleur,
signaux) ; serveur (GET /api/plan-stade ; tribune dans PATCH /api/stands/:id) ; écrans (carte de Résultats, scène 3D,
choix de la tribune). **Tests** : moteur 4 (placement, couleurs, seuils de file, tablette, hygiène, hors événement),
serveur 2 (tribune devinée puis choisie, valeur refusée ; rupture → rouge avec l'alerte, stand sans caisse ouverte
gris), écran 2 ; formation, stands et conformité de la base relancés. Essayé dans le navigateur (simulation de 6 stands :
couleurs, onde rouge, clic dans la 3D et dans la liste, téléphone et ordinateur). Corrigés à l'essai : caméra collée
au terrain (ordre de calcul du cadrage), stands du bord hors cadre, étiquettes trop grandes sur téléphone.

## 2. Ce qui a été construit — commits

- [`8ff9104`](https://github.com/Break-Eat-APP/flaix-expert/commit/8ff9104a938807f869865dcc4579d59b4d0c88f3) — 2026-10-12 — Le stade en direct : stands en 3D autour du stade, en couleur, alertes au clic
- [`3af785c`](https://github.com/Break-Eat-APP/flaix-expert/commit/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d) — 2026-10-12 — Stade en direct : cadrage adapté à l'écran, pastilles seules sur téléphone, noms des tribunes au bord du terrain

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0051_stade_tribune.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/db/migrations/0051_stade_tribune.sql)

### Tests

- `apps/api/test/plan-stade.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/api/test/plan-stade.test.ts)
- `packages/domain/src/plan-stade.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/packages/domain/src/plan-stade.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/packages/domain/src/index.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/packages/domain/src/modele.ts)
- `packages/domain/src/plan-stade.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/packages/domain/src/plan-stade.ts)

### Serveur (apps/api)

- `apps/api/src/routes/plan-stade.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/api/src/routes/plan-stade.ts)
- `apps/api/src/routes/stands.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/api/src/routes/stands.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/package.json)
- `apps/web/src/pages/parametres/StandsCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/src/pages/parametres/StandsCaisses.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/PlanStade.test.tsx` — créé (n'existe plus)
- `apps/web/src/pages/resultats/PlanStade.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/src/pages/resultats/PlanStade.tsx)
- `apps/web/src/pages/resultats/Stade3D.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/src/pages/resultats/Stade3D.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/apps/web/src/styles.css)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3af785c695d739f8c33bfb6dd28e0aa4bd056c6d/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/api/test/plan-stade.test.ts`

- **le stade en direct**
  - hors événement : tribune devinée du nom ou répartie, stands gris ; tribune choisie dans les paramètres ; valeur inconnue refusée
  - décor et place des stands : patinoire, Comptoir posé à la main puis remis en automatique ; valeurs hors limites refusées
  - pendant l'événement : rupture des frites → Buvette Nord en rouge avec l'alerte ; le Comptoir sans caisse ouverte reste gris
  - ventes à vérifier : un prix différent du tarif, 5 annulations sur 16 ventes → alertes de la caisse

### `packages/domain/src/plan-stade.test.ts`

- **le stade en direct (§15.162)**
  - placement : tribune choisie, sinon devinée du nom, sinon la moins garnie ; par nom sur une tribune
  - couleurs : rupture → rouge ; stock faible → orange ; ouvert sans souci → vert ; fermé → gris
  - stock : rupture prévue au rythme des 15 dernières minutes, réserve rappelée ; rien sans vente récente
  - caisses : aucune vente depuis 15 min alors que le stade vend ; ventes hors tarif ; annulations nombreuses
  - tablette muette (rouge après 15 min) ou tickets à envoyer, hygiène du stand → orange ; hors événement, le stock ne compte pas
  - en direct : chiffres de la soirée, ventes des 10 dernières minutes, rythme, match précédent au même moment, caisses ; produits du plus entamé au moins entamé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/plan-stade.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/plan-stade.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
