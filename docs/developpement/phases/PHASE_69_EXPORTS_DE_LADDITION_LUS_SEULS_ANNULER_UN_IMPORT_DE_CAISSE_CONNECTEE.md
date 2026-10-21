# Phase 69 — Exports de L'Addition lus seuls ; annuler un import de caisse connectée

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-19 |
| Décision | dossier projet §15.168 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.168 Exports de L'Addition lus seuls ; annuler un import de caisse connectée (2026-10-19)

**Demande de Rémi** (2026-10-19, avec l'export Excel de L'Addition et deux captures) : *« qu'est-ce que tu me
conseillerais afin de coordonner facilement les caisses connectées avec le dépôt de document Excel ? »*, puis *« il faut
aussi gérer les correspondances dans FlaiX Expert, je comprends pas à quoi correspond HD7CD, faudrait faciliter les
choses »* et, sur l'écran d'import ouvert sur la feuille « Accueil » avec 14 listes vides, *« ça aussi j'ai du mal à
comprendre ce que ça veut dire »*.

**Constat** sur le fichier : le classeur a plusieurs feuilles, les ventes sont dans « SalesDocumentLines » et l'écran
ouvrait la première (« Accueil », vide) ; une ligne par article ; « - » écrit dans les cases vides (« Menu parent ») ;
colonnes « Taux », « Paiements », « TAG_Salle », « Remises TTC », « Offerts TTC » non reconnues. Dans les données de
Rémi : un premier import fait avec de mauvaises colonnes (produit « - », 1 072 articles pour 6,7 millions d'euros, relié
à tort à « La Box ») et un second où le produit était le code interne de L'Addition (« HD7CF-289 ») : rien ne permettait
de retirer un import raté. La colonne « URL Ticket » contient des liens de ticket signés : jamais lue ni gardée.

**Décisions** :
- **Feuille choisie seule** : celle dont les en-têtes (20 premières lignes) donnent toutes les colonnes nécessaires,
  la plus complète puis la plus longue ; le choix de feuille reste possible.
- **Colonnes de L'Addition reconnues** : « Taux » (TVA), « Paiements », « Salle »/« TAG_Salle » (point de vente),
  « Remises TTC » et « Offerts TTC » (nouveaux champs retirés de prix × quantité quand il n'y a pas de montant) ;
  « - » ou « _ » vaut case vide ; lignes de total ou de sous-total ignorées.
- **Écran** : quand tout est reconnu, un résumé « ✓ Colonnes reconnues » (colonne du fichier → sens) remplace la grille
  de 14 listes ; la grille s'ouvre par « Modifier les colonnes », ou d'office s'il manque une colonne.
- **Produits par leur nom** : nom de l'article, avec le code de la caisse à côté (« HOTDOG · HD7CF-289 ») ; le code
  sert à reconnaître le même article d'un fichier à l'autre.
- **Sans colonnes choisies**, le serveur prend les colonnes reconnues dans le fichier avant celles gardées du dernier
  import : un mauvais choix fait une fois ne se répète plus.
- **Annuler un import** (onglet Importer › « Fichiers importés ») : retire ses ventes et leurs articles ; l'import reste
  dans le relevé, marqué annulé (date, auteur, ventes et montant retirés) ; une seule fois ; journal
  `caisse_externe_import_annule` ; refusé en formation. Migration 0054 : table `import_ventes_externes_annule` (écriture
  seule), fonction `annuler_import_ventes_externes` (propriétaire de la base) ; les articles restent en écriture seule
  hors de cette annulation.
- **Résultats** (correction de §15.167) : un événement d'un lieu à caisse connectée, commencé et avec des ventes,
  compte comme terminé (`evenementTermine`) ; le filtre « clos seulement » les avait écartés.

**Réalisé le 2026-10-19**. Essai sur le vrai fichier de Rémi : feuille « SalesDocumentLines » choisie seule, 11
colonnes reconnues, 372 ventes, 1 072 articles, 0 erreur, 6 286,30 €, produits nommés. **Tests** : moteur 9 (dont
l'export de L'Addition), serveur (annulation d'un mauvais import puis réimport, caisses connectées 12, résultats 6),
écran 8 ; moteur complet 271 ; types et construction.

**À faire par Rémi** : dans Caisses connectées › Importer › « Fichiers importés », annuler les deux imports ratés,
réimporter le fichier, puis valider les rapprochements proposés dans Correspondances.

## 2. Ce qui a été construit — commits

- [`b54f0f6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27) — 2026-10-19 — Caisses connectées : exports de L'Addition lus seuls, import annulable (§15.168)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0054_annulation_import_ventes_externes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/db/migrations/0054_annulation_import_ventes_externes.sql)

### Tests

- `apps/api/test/annulation-import.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/api/test/annulation-import.test.ts)
- `packages/domain/src/caisses-externes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/packages/domain/src/caisses-externes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/packages/domain/src/caisses-externes.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/caisses-externes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/api/src/routes/caisses-externes.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/api/src/routes/resultats.ts)

### Écrans (apps/web)

- `apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/web/src/pages/caisses-connectees/CaissesConnectees.test.tsx)
- `apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/web/src/pages/caisses-connectees/CaissesConnectees.tsx)
- `apps/web/src/pages/caisses-connectees/fichiers.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/web/src/pages/caisses-connectees/fichiers.ts)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b54f0f6ad4044e68fdc3dd6356ac658d21a65f27/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

### `apps/api/test/annulation-import.test.ts`

- **annuler un import de caisse connectée**
  - mauvaises colonnes (produit « Paiements », prix « Qte », ticket « ID Receipt ») : import absurde, puis annulé
  - réimport du même fichier sans colonnes choisies : les colonnes reconnues l'emportent sur le mauvais choix gardé ; produits par leur nom

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/annulation-import.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
