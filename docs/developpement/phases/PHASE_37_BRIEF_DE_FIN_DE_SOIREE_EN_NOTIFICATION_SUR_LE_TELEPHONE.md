# Phase 37 — Brief de fin de soirée en notification sur le téléphone

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.134, §15.135 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.134 Note produit de Rémi (ChatGPT) : Flaix Ops / Expert / Autopilot, agents IA (2026-10-04)

Rémi a partagé une note produit rédigée avec ChatGPT (`FLAIX_EXPERT_PRODUCT_SPEC_CLAUDE_CODE.md` : couche d'intelligence décisionnelle, détecteur de fuites de revenus, cerveau d'événement, agents IA, simulation, jumeau numérique, mémoire du stade, Autopilot). Avis rendu le 2026-10-04 dans la conversation, avec une recherche sur les concurrents (Oracle Simphony, Shift4/VenueNext, SpotOn/Appetize, Nory, WaitTime, Safari AI) et sur l'AI Act. **IA : à décider avec Rémi, rien de construit seul** ; priorités à arrêter ensemble.

**Analyse remise** : `docs/strategie/analyse-intelligence-2026-10.md`, en Word et PDF (`FlaiX-Expert-Intelligence-prevision-decision-v1`), copiés dans le dossier OneDrive « FlaixX Expert ».

**Décisions de Rémi (2026-10-04)** : (1) on commence par **le brief de fin de soirée et l'assistant** ; (2) fournisseur d'IA : **Mistral** (entreprise française, hébergement en Europe) ; (3) le brief arrive en **notification sur le téléphone** (application installée), sans e-mail pour l'instant.

### 15.135 Brief de fin de soirée en notification sur le téléphone (2026-10-04)

**Réalisé** (migration 0028, moteur `brief.ts`, phase 37) :
- **Le brief** : établi par des règles fixes à partir du rapport de soirée figé — titre (« Spartiates – Rouen : 18 640,00 € encaissés »), une ligne (tickets, panier moyen, marge nette), puis au plus quatre points dans l'ordre : la marge nette face à sa cible, l'évolution par rapport à l'événement précédent, ce qui demande une vérification (écart d'espèces au-delà de la tolérance, écart de stock, alertes fortes), le meilleur produit. Chaque chiffre est un chiffre du rapport, recopié ; une marge incalculable est dite comme telle.
- **Garde-fou pour l'IA à venir** : `reformulationFidele` refuse toute reformulation qui contient un nombre absent du brief d'origine — Mistral pourra réécrire, jamais inventer.
- **Envoi** : à la clôture de l'événement, une fois la transaction de clôture validée, vers chaque appareil abonné d'un directeur du lieu (Web Push de l'application installée ; aucun service extérieur à part celui du téléphone). Une seule fois par événement (table `brief_soiree`, écriture seule : contenu, « rédigé par les règles », nombre d'appareils atteints). Une notification qui échoue n'annule jamais la clôture ; un téléphone désabonné (réponse 404/410) est retiré.
- **Clés du serveur** (VAPID) : créées au premier besoin, gardées dans la base, sur le serveur.
- **Écrans** : Paramètres → **Notifications** (activer sur cet appareil, envoyer une notification d'essai, désactiver ; explication pour l'iPhone : ajouter l'application à l'écran d'accueil) ; toucher la notification ouvre le rapport de soirée ; « Le brief de la soirée » en tête du rapport.
- **Pas encore** : la reformulation et l'assistant par Mistral (il faut le compte et la clé de Rémi) ; le brief de veille (avec la prévision).
- **Tests** : moteur 6, serveur 7, écrans 2. Vérifié dans le navigateur (le navigateur intégré bloque les notifications : l'essai réel se fait sur le téléphone de Rémi).

## 2. Ce qui a été construit — commits

- [`bcb9455`](https://github.com/Break-Eat-APP/flaix-expert/commit/bcb9455bc942b80996d2302d3467a2a1a9316a56) — 2026-10-04 — Brief de fin de soirée envoyé en notification sur le téléphone du directeur (dossier §15.135)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0028_brief_notifications.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/db/migrations/0028_brief_notifications.sql)

### Tests

- `apps/api/test/notifications.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/test/notifications.test.ts)
- `packages/domain/src/brief.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/packages/domain/src/brief.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/brief.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/packages/domain/src/brief.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/packages/domain/src/index.ts)

### Serveur (apps/api)

- `apps/api/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/package.json)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/notifications.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/src/routes/notifications.ts)
- `apps/api/src/routes/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/src/routes/rapport-soiree.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/public/sw.js` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/public/sw.js)
- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/App.tsx)
- `apps/web/src/pages/parametres/Notifications.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/pages/parametres/Notifications.test.tsx)
- `apps/web/src/pages/parametres/Notifications.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/pages/parametres/Notifications.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/pages/resultats/RapportSoiree.test.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/pages/resultats/RapportSoiree.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/docs/flaix-gestion-dossier-projet.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bcb9455bc942b80996d2302d3467a2a1a9316a56/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `apps/api/test/notifications.test.ts`

- **abonnement du téléphone**
  - la clé publique du serveur est créée une fois, puis toujours la même
  - [F] une adresse d'abonnement qui n'est pas en https est refusée
  - le téléphone s'abonne ; s'abonner deux fois ne fait pas deux abonnements ; l'essai arrive
- **brief de fin de soirée**
  - à la clôture de l'événement, chaque téléphone abonné reçoit le brief, une seule fois
  - le rapport de soirée montre le même brief
  - [F] un téléphone désabonné côté navigateur (410) est retiré ; la clôture n'échoue jamais pour une notification

### `packages/domain/src/brief.test.ts`

- **brief de fin de soirée**
  - exemple du dossier : cible tenue, encaissé en baisse, écart d'espèces, écart de stock — au plus quatre points, dans l'ordre
  - [F] marge incalculable : dite comme telle, jamais un chiffre à la place
  - premier événement, rien d'anormal : l'évolution n'est pas inventée, le meilleur produit apparaît
  - la notification reprend le titre, la ligne de résumé et les deux premiers points
- **garde-fou des reformulations par l'IA**
  - les nombres se lisent quel que soit l'espace des milliers
  - [F] une reformulation qui ajoute ou change un chiffre est refusée ; une reformulation fidèle est acceptée

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/brief.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/notifications.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
