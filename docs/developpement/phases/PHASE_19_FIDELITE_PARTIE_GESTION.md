# Phase 19 — Fidélité, partie gestion

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.114 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.114 Fidélité — partie gestion (2026-10-01)

**Demande** : 6ᵉ module de l'ordre fixé par Rémi (§15.109). Reprise du module 19 validé (§14) : abonnés seulement, n° d'abonné = identifiant unique (le même que la remise abonné du module 1), points convertibles en euros, codes promo, import de la base existante, historique de consommation lu dans les tickets.

**Construit** (nouvelle entrée de menu « Fidélité », prévue « plus tard » au §15.96 ; migration `0016`) :
- **Registre des abonnés** : n° (majuscules, espaces ignorés — le même rapprochement qu'à la caisse), nom, e-mail et téléphone facultatifs, actif ou non (une fiche se désactive, elle ne se supprime pas). Les n° saisis à la caisse **sans fiche** sont signalés pour qu'on la crée.
- **Points lus dans les tickets scellés** : euros entiers de chaque ticket « remise abonné » non annulé × points par euro, + points de départ (import) + ajustements. **Rien n'est recopié** : un ticket annulé ne compte plus, automatiquement. Les mouvements hors caisse (départ, ajustement avec motif) sont en **écriture seule** (la base refuse modification et suppression).
- **Règles des points vides tant que le lieu ne les fixe pas** : le dossier ne donne que des valeurs de test (1 point / €, 100 points = 5 €) ; elles ne sont **pas** appliquées d'office. Exemple chiffré affiché une fois réglées.
- **Historique de consommation** par abonné : tickets (annulés barrés, sans points), mouvements, modification de la fiche, ajustement.
- **Codes promo** : pourcentage ou montant, dates, plafond d'usages facultatif, désactivables ; un code ne se réutilise pas ; état calculé (valide, à venir, expiré, épuisé, désactivé). Le compteur d'usages lit déjà les tickets qui porteront le motif « code promo ».
- **Import** de la base existante : fichier CSV d'un tableur, séparateur et en-têtes reconnus seuls (n°, nom, e-mail, téléphone, points), aperçu avant envoi, lignes fautives listées avec leur numéro, doublons du fichier écartés ; un n° qui a déjà une fiche **n'est pas écrasé** ; le serveur revérifie tout.
- **Données personnelles** : isolées par lieu ; le journal technique note quels champs ont changé, **sans recopier** nom, e-mail ou téléphone ; **non recopiées dans le lieu de formation** (minimisation). Question G.21 posée (registre des traitements, durée de conservation).

**Choix à valider par Rémi** :
1. **La base des abonnés vit dans FlaiX, en attendant le raccordement à l'application Break Eat.** Le dossier dit : *« ça doit apparaître dans ma base de données de l'application Break Eat »*, mais le mécanisme n'est pas conçu (il dépend de la façon dont ce backend est construit). FlaiX est le seul système qui voit les tickets de la caisse : il garde donc le registre et les points, et les transmettra à l'app Break Eat le jour où elle expose un accès (dans un sens ou dans les deux, à décider avec qui la maintient).
2. **Les règles des points** (combien de points par euro, palier, valeur) : à fixer par Rémi ou par lieu.

**Pas encore fait — partie caisse** : dépenser des points et appliquer un code promo **à la caisse** (nouvelles remises « points » et « code promo » dans le ticket scellé). Point délicat, à trancher avant de construire : la caisse vend **sans réseau** ; un solde de points ou un plafond d'usages ne peut pas être vérifié sur une tablette coupée du serveur sans risque de double dépense. Proposition : points et codes plafonnés **seulement avec réseau** (refus clair sinon), codes sans plafond utilisables hors ligne (liste des codes valides gardée sur la tablette).

**Vérifié** : 8 tests du calcul (exemple du dossier : 32,40 € → 32 points ; 340 points → 3 paliers, 15 €, 40 restants ; MATCH50 −50 % sur 12,00 € → 6,00 € ; états d'un code ; import tolérant : en-têtes, séparateurs, guillemets, lignes fautives, doublons) ; 10 tests contre la base (n° inconnus signalés ; rattachement insensible à la casse et aux espaces ; ticket annulé exclu ; points nuls tant que non réglés puis 31 ; ajustement avec motif obligatoire ; historique ; journal sans données personnelles ; import sans écrasement avec points de départ ; codes uniques, plafonds, désactivation ; formation sans registre et en lecture seule). Suites complètes : 114 (moteur), 172 (serveur). Écran vérifié dans le navigateur.

## 2. Ce qui a été construit — commits

- [`e110233`](https://github.com/Break-Eat-APP/flaix-expert/commit/e110233bfed49b8dd87effc7d564314ea89666c7) — 2026-10-01 — Fidélité : migration (abonnés, mouvements de points en écriture seule, codes promo, réglages vides) et calcul (points, conversion, codes, import tolérant)
- [`f9ce7f4`](https://github.com/Break-Eat-APP/flaix-expert/commit/f9ce7f4a2853d19ec6a98c4e84e104a986205497) — 2026-10-01 — Fidélité, serveur : abonnés, points lus dans les tickets scellés, ajustements, import, codes promo, refus en formation
- [`bd1b604`](https://github.com/Break-Eat-APP/flaix-expert/commit/bd1b60433763f1ee26a19bf713bde0d5672455e9) — 2026-10-01 — Fidélité, écran (abonnés, historique, ajustements, codes promo, import, règles des points), menu ; dossier §15.114, question G.21

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0016_fidelite.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/db/migrations/0016_fidelite.sql)

### Tests

- `apps/api/test/fidelite.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/api/test/fidelite.test.ts)
- `packages/domain/src/fidelite.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/packages/domain/src/fidelite.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/fidelite.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/packages/domain/src/fidelite.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/fidelite.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/api/src/routes/fidelite.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/fidelite/Fidelite.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/web/src/pages/fidelite/Fidelite.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/docs/flaix-gestion-dossier-projet.md)
- `docs/questions-expert-comptable.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/bd1b60433763f1ee26a19bf713bde0d5672455e9/docs/questions-expert-comptable.md)

## 4. Tests créés dans cette phase

### `packages/domain/src/fidelite.test.ts`

- **points et conversion (exemple du dossier, valeurs de test)**
  - 32,40 € TTC à 1 point par euro → 32 points ; un ticket annulé ou nul n'en donne pas
  - 340 points, palier de 100 = 5 € → 3 paliers, 15 €, 40 points restent
- **codes promo**
  - valide dans ses dates et sous son plafond ; sinon à venir, expiré, épuisé ou désactivé
  - −50 % sur 12,00 € → 6,00 € ; un montant ne dépasse jamais le panier
- **import tolérant de la base d'abonnés**
  - reconnaît les en-têtes usuels, le point-virgule, les guillemets ; normalise le n°
  - virgule comme séparateur, colonnes dans un autre ordre, colonnes en trop ignorées
  - lignes fautives listées avec leur numéro de ligne ; doublon pris une seule fois
  - sans colonne n° d'abonné ou nom : rien n'est importé, l'erreur le dit

### `apps/api/test/fidelite.test.ts`

- **abonnés et points**
  - lieu neuf : aucune règle de points supposée ; le n° inconnu de la caisse est signalé
  - une fiche rattache les tickets du n° (casse et espaces ignorés), annulation exclue ; points nuls tant que non réglés
  - règles réglées : 1 point par euro entier → 31 points
  - ajustement : motif obligatoire, journalisé, compté dans le solde
  - historique : tickets (annulé marqué, sans points) et mouvements
  - modification et désactivation journalisées sans recopier les données personnelles
- **import de la base existante**
  - crée les nouveaux abonnés avec leurs points de départ ; un n° déjà présent est signalé, pas écrasé
  - [F] une ligne invalide fait refuser tout l'envoi
- **codes promo**
  - créé, unique, désactivable ; son état est calculé
- **mode formation**
  - le registre des abonnés n'est pas recopié dans le lieu d'entraînement, et ne s'y modifie pas

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/fidelite.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/fidelite.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
