# Phase 0 — Socle de production et configuration d'un lieu vide

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-29 |
| Décision | dossier projet §15.93 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.93 Démarrage de la production — architecture validée, socle et configuration d'un lieu vide (2026-09-28)

**Demande de Rémi (verbatim)** : *« J'aimerais qu'on commence à le produire. De façon propre et vierge, sans modèle de démo ni chiffres ni statistiques. […] je veux aussi que tu me conseilles s'il y a des choses que tu trouves pas très bien, je veux que tu me dises si on doit développer un back-end sachant que je vais avoir un back-office de gestion de certaines options et configurations pour chacun des lieux mais aussi avoir une base de données où je vais pouvoir remonter tous les tickets, les chiffres d'affaires qui ont été archivés si demain je dois avoir un contrôle. »*

**Décision écrite avant code** : `docs/decisions-architecture-production.md` (backend indispensable, trois notions distinctes derrière « back-office + base de contrôle », architecture, modèle de données, rôles, Stripe, phasage, onze points fragiles). Questions fiscales préparées pour l'expert-comptable : `docs/questions-expert-comptable.md`.

**Décisions de Rémi (2026-09-28, questions posées une par une)** :
1. Base technique : serveur Node.js/TypeScript (Fastify) + PostgreSQL, application web React, hébergement en France choisi avant la mise en ligne.
2. Back-office éditeur : **sans montants par défaut, lecture seule sur autorisation du lieu** (confirme §15.13) — en contrôle, c'est le lieu qui exporte depuis son compte.
3. Modèle produit : **une fiche par produit au niveau du lieu, stands cochés** — retour au modèle §3/§5, abandon du modèle « une ligne par stand » du prototype fusionné (§15.31, §15.71).
4. Dépôt de code : `C:\Users\notta\dev\flaix-expert`, hors OneDrive, versionné avec Git. **À partir de ce jour, la copie de ce dossier dans le dépôt fait référence** ; celle de OneDrive reste en archive.

**Livré (phase 0 + phase 1)** : dépôt monorepo ; schéma PostgreSQL (lieux, comptes, sessions, stands, caisses, catégories, produits, disponibilité par stand, tarifs datés, journal technique chaîné) avec droits par table et par colonne, isolement des lieux par sécurité par ligne, journaux et tarifs en écriture seule imposée par la base ; serveur (connexion argon2id, sessions dont seul le condensat est stocké, protection contre les requêtes intersites, limitation des tentatives) ; écrans Connexion, Démarrage du lieu, Identité du lieu, Gestion des stands & caisses, Config produits (avec **ajout de produit**, prix datés, historique, marge comptoir), Journal technique (avec vérification d'intégrité), Mon mot de passe ; outil d'administration pour créer un lieu vide. Aucune donnée de démonstration.

**Vérifié** : 70 tests automatisés (37 sur le moteur de calcul avec les exemples chiffrés du dossier, 33 sur le serveur et la base), dont les tests de falsification A1, A2, A8, B2 et d'isolement des lieux, exécutés contre la vraie base : ils provoquent la fraude et vérifient que PostgreSQL la refuse, y compris au propriétaire des tables. Parcours visuel complet dans le navigateur (lieu vide → stands → caisses → produit → nouveau tarif → journal intact). Deux défauts trouvés pendant ce parcours et corrigés : boutons-liens soulignés ; liste des produits tronquée sur un écran de portable (désormais en cartes empilées dès que la place manque).

**Écarts signalés** : voir `docs/decisions-architecture-production.md` § 12 (formule de scellement étendue au contenu, écran Identité du lieu, entrée Démarrage, catégories distinctes de la TVA, TVA non présélectionnée).

**En attente** : validation visuelle de Rémi ; réponse écrite de l'expert-comptable avant toute mise en service de Ma caisse ; choix du produit Stripe ; cash oui/non.

## 2. Ce qui a été construit — commits

- [`4a205cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a205cb70382af4b1ae34c55e3f86c529ef714f0) — 2026-09-29 — Socle de production FlaiX Expert et configuration d'un lieu vide
- [`40693c8`](https://github.com/Break-Eat-APP/flaix-expert/commit/40693c85ae0183bd8cf90613fa503abaf344461d) — 2026-09-29 — Garde-fou d'envoi : FlaiX Expert ne part que vers son propre dépôt

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0001_socle.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/db/migrations/0001_socle.sql)
- `db/migrations/0002_configuration_lieu.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/db/migrations/0002_configuration_lieu.sql)

### Tests

- `apps/api/test/api.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/test/api.test.ts)
- `apps/api/test/conformite-base.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/test/conformite-base.test.ts)
- `packages/domain/src/argent.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/argent.test.ts)
- `packages/domain/src/chaine.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/chaine.test.ts)
- `packages/domain/src/tva-marge.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/tva-marge.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/package.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/package.json)
- `packages/domain/src/argent.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/argent.ts)
- `packages/domain/src/chaine.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/chaine.ts)
- `packages/domain/src/index.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/journal-technique.ts)
- `packages/domain/src/marge.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/marge.ts)
- `packages/domain/src/modele.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/modele.ts)
- `packages/domain/src/tva.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/src/tva.ts)
- `packages/domain/tsconfig.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/packages/domain/tsconfig.json)

### Serveur (apps/api)

- `apps/api/package.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/package.json)
- `apps/api/src/auth/contexte.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/auth/contexte.ts)
- `apps/api/src/auth/routes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/auth/routes.ts)
- `apps/api/src/auth/secrets.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/auth/secrets.ts)
- `apps/api/src/base.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/base.ts)
- `apps/api/src/config.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/config.ts)
- `apps/api/src/erreurs.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/erreurs.ts)
- `apps/api/src/index.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/index.ts)
- `apps/api/src/journal-technique.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/journal-technique.ts)
- `apps/api/src/outils/cli.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/outils/cli.ts)
- `apps/api/src/outils/migrations.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/outils/migrations.ts)
- `apps/api/src/outils/migrer.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/outils/migrer.ts)
- `apps/api/src/outils/reinitialiser-base-dev.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/outils/reinitialiser-base-dev.ts)
- `apps/api/src/routes/journal.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/routes/journal.ts)
- `apps/api/src/routes/lieu.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/routes/lieu.ts)
- `apps/api/src/routes/outils.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/routes/outils.ts)
- `apps/api/src/routes/produits.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/routes/produits.ts)
- `apps/api/src/routes/stands.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/routes/stands.ts)
- `apps/api/src/serveur.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/src/serveur.ts)
- `apps/api/test/aide.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/test/aide.ts)
- `apps/api/test/preparation-base.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/test/preparation-base.ts)
- `apps/api/tsconfig.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/tsconfig.json)
- `apps/api/vitest.config.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/api/vitest.config.ts)

### Écrans (apps/web)

- `apps/web/index.html` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/index.html)
- `apps/web/package.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/package.json)
- `apps/web/src/api.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/api.ts)
- `apps/web/src/App.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/App.tsx)
- `apps/web/src/composants/communs.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/composants/communs.tsx)
- `apps/web/src/composants/Coquille.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/main.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/main.tsx)
- `apps/web/src/pages/Compte.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/pages/Compte.tsx)
- `apps/web/src/pages/configuration/Identite.tsx` — créé (n'existe plus)
- `apps/web/src/pages/configuration/Produits.tsx` — créé (n'existe plus)
- `apps/web/src/pages/configuration/StandsCaisses.tsx` — créé (n'existe plus)
- `apps/web/src/pages/conformite/JournalTechnique.tsx` — créé (n'existe plus)
- `apps/web/src/pages/Connexion.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/pages/Connexion.tsx)
- `apps/web/src/pages/Demarrage.tsx` — créé (n'existe plus)
- `apps/web/src/session.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/src/styles.css)
- `apps/web/tsconfig.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/tsconfig.json)
- `apps/web/vite.config.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/apps/web/vite.config.ts)

### Serveur OVH et outils (infra)

- `infra/docker-compose.yml` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/infra/docker-compose.yml)
- `infra/postgres/init/01-bases.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/infra/postgres/init/01-bases.sql)

### Documentation

- `CLAUDE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/CLAUDE.md)
- `docs/cadrage/flex-expert-perimetre.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/cadrage/flex-expert-perimetre.md)
- `docs/cadrage/flex-expert-test-terrain.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/cadrage/flex-expert-test-terrain.md)
- `docs/decisions-architecture-production.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/decisions-architecture-production.md)
- `docs/flaix-brief-production-claude-code.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/flaix-brief-production-claude-code.md)
- `docs/flaix-gestion-dossier-projet.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/flaix-gestion-dossier-projet.md)
- `docs/questions-expert-comptable.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/questions-expert-comptable.md)
- `docs/reference/flaix-gestion-final.html` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/docs/reference/flaix-gestion-final.html)
- `README.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/README.md)

### Autres

- `.claude/launch.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/.claude/launch.json)
- `.gitattributes` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/.gitattributes)
- `.githooks/pre-push` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/.githooks/pre-push)
- `.gitignore` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/.gitignore)
- `package.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/package.json)
- `pnpm-lock.yaml` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/pnpm-lock.yaml)
- `pnpm-workspace.yaml` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/pnpm-workspace.yaml)
- `tsconfig.base.json` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/40693c85ae0183bd8cf90613fa503abaf344461d/tsconfig.base.json)

## 4. Tests créés dans cette phase

### `apps/api/test/api.test.ts`

- **connexion et session**
  - refuse un mauvais mot de passe, sans dire si le compte existe, et le trace au journal
  - ouvre une session : cookie httpOnly, session lisible, connexion journalisée
  - sans session : 401
  - [F] requête intersite : format non JSON refusé (415), origine étrangère refusée (403)
- **identité du lieu**
  - refuse un SIRET mal formé, enregistre une identité valide et trace l'avant/après
- **lieu vide → stands et caisses**
  - un nouveau lieu démarre vide : aucun stand, aucun produit
  - crée des stands ; un doublon de nom est refusé avec un message clair
  - numérote les caisses sur tout le lieu, dans l'ordre de création
  - refuse de désactiver un stand qui a encore des caisses actives
  - déplace une caisse vers un autre stand sans changer son numéro
- **produits et tarifs datés**
  - crée un produit unique vendu dans deux stands, avec son premier tarif
  - refuse un second produit du même nom et un taux de TVA inconnu
  - A9 — un nouveau tarif remplace le prix en vigueur sans effacer l'ancien
  - refuse de ressaisir le tarif déjà en vigueur
  - programme un tarif futur sans toucher au prix en vigueur ; refuse un tarif rétroactif
  - retire un stand d'un produit ; le changement est tracé
  - le journal technique a tout tracé et sa chaîne est intacte
- **droits**
  - [F] — un compte caissière ne se connecte jamais par e-mail, même avec le bon mot de passe (§15.100)
  - [F] — le directeur d'un autre lieu ne peut ni lire ni modifier ce lieu
  - déconnexion : la session est révoquée côté serveur

### `apps/api/test/conformite-base.test.ts`

- **Groupe A — inaltérabilité, imposée par la base**
  - A1 [F] — UPDATE sur le journal technique avec le compte du serveur : refusé par PostgreSQL
  - A2 [F] — DELETE sur le journal technique : refusé par PostgreSQL
  - A1 [F] — un prix ne peut pas être réécrit en place (tarifs datés) : UPDATE et DELETE refusés
  - [F] — même le propriétaire des tables ne peut ni modifier, ni supprimer, ni vider le journal
  - [F] — Z de caisse (comptage des espèces, §15.102) : écriture seule, même pour le propriétaire, et jamais vidé
  - [F] — mouvements de stock et inventaires de la réserve (§15.105) : écriture seule, même pour le propriétaire
  - A8 [F] — deux événements ne peuvent pas porter le même numéro : contrainte d'unicité
  - [F] — le serveur ne peut pas changer l'identifiant d'un lieu ni déplacer un stand vers un autre lieu
  - la chaîne du journal technique est intacte et numérotée sans trou
  - vingt inscriptions simultanées restent numérotées sans trou ni doublon, chaîne intacte
- **Isolement des lieux (sécurité par ligne)**
  - [F] — depuis le lieu A, les stands du lieu B sont invisibles
  - [F] — depuis le lieu A, impossible d'écrire dans le lieu B
  - [F] — depuis le lieu A, le journal et les comptes du lieu B sont invisibles
  - sans contexte de lieu, le serveur ne voit aucune donnée de lieu
  - [F] — le serveur ne peut pas créer de lieu (réservé à l'éditeur)

### `packages/domain/src/argent.test.ts`

- **lireMontant**
- **formatage**
  - affiche au format français
- **diviserArrondi**
  - arrondit au plus proche, demi vers l'extérieur, symétriquement

### `packages/domain/src/chaine.test.ts`

- **formule de scellement (§15.16)**
  - est exactement SHA256(champ1|…|champN|empreinte_precedente) quand aucun champ ne contient | ni \\
  - échappe | et \\ pour que deux contenus différents ne se confondent jamais
  - un champ vide (null) reste distinct d'un champ absent
- **jsonCanonique**
  - donne le même texte quel que soit l'ordre des clés
- **verifierChaine — tests de falsification [F] (§15.19 A3, A4, A5)**
  - une chaîne intacte est reconnue
  - A3 — un montant modifié est détecté au maillon exact
  - A4 — une ligne supprimée au milieu est détectée à la ligne suivante
  - A5 — deux lignes interverties cassent la chaîne : l'ordre est scellé
  - une chaîne entièrement recalculée par un fraudeur reste cohérente — d'où la signature prévue (§15.16, réserve)
- **journal technique**
  - scelle le contenu détaillé : modifier un détail change l'empreinte
  - l'ordre des clés du détail n'a pas d'effet (relecture depuis la base)

### `packages/domain/src/tva-marge.test.ts`

- **ventilerTtc**
  - HT + TVA redonne toujours exactement le TTC
  - hot-dog à 7,00 € (TVA 10 %) : 6,36 € HT + 0,64 € de TVA
  - bière 50 cl à 7,00 € (TVA 20 %) : 5,83 € HT + 1,17 € de TVA
  - soda à 4,00 € (TVA 5,5 %) : 3,79 € HT + 0,21 € de TVA
  - une annulation ventile exactement comme la vente qu'elle annule
- **taux de TVA**
  - libellés au format français
  - seuls les taux français connus sont acceptés
- **margeUnitaireComptoir — exemples vérifiés du dossier**
  - frites 4,50 € TVA 5,5 %, coût 1,35 € → marge 2,92 €, taux 68,35 % (module 18)
  - hot-dog 6,50 € TVA 10 %, coût 1,20 € → marge 4,71 € par vente, taux 79,7 % (module 5)
  - prix nul : pas de taux (pas de division par zéro)

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/argent.test.ts src/chaine.test.ts src/tva-marge.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/api.test.ts test/conformite-base.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
