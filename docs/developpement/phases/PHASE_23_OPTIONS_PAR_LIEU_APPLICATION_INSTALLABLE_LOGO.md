# Phase 23 — Options par lieu, application installable, logo

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.118 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.118 Options par lieu, activées depuis le back-office ; application installable (2026-10-01)

**Demande de Rémi** (§15.117) : *« dans mon back office je décide de quel lieu a activer certaines options »*.

**Construit** (migration `0020`) :
- **Base, toujours incluse** : caisse (tablettes, caissières), clôtures, résultats, paramètres, mode formation, vue En direct.
- **Options** (liste proposée, à ajuster par Rémi) : Stock ; Planning & masse salariale ; Fidélité ; Click & Collect ; Factures fournisseurs ; Export comptable ; Coûts par buvette.
- **Sans réglage, une option est active** : rien n'a changé pour un lieu existant.
- Rémi coche ou décoche chaque option de chaque lieu dans **`/editeur`** ; seule la fonction réservée aux comptes Break Eat peut écrire (vérifié jusque dans la base) ; **chaque changement est inscrit au journal technique du lieu** (« Break Eat — nom »), qui le voit. C'est la configuration du contrat, jamais une donnée d'encaissement (§15.13).
- Une option désactivée : son entrée disparaît du menu (ou son onglet, sa tuile), et **ses adresses sont fermées par le serveur** (message « option non activée pour ce lieu : à demander à Break Eat »). Le lieu de formation suit les options de son vrai lieu.
- Base de la future **facturation Break Eat** (12a) : l'abonnement se déduira des options actives — montants et document de facture à cadrer avec Rémi.

**Application installable** (réponse « en URL et en mode application », §15.117) : fiche d'application (`manifest.webmanifest`), icônes (X blanc sur violet FlaiX, générées par `infra/outils/icones-application.cjs`), plein écran. Sur tablette ou téléphone : menu du navigateur → « Ajouter à l'écran d'accueil » (ou « Installer l'application »). Le fonctionnement hors connexion est le même qu'en URL (§15.97).

**Vérifié** : 5 tests (toutes actives par défaut ; Stock désactivé → adresses fermées, base ouverte, journal du lieu, parc à jour ; lieu de formation aligné ; réactivation ; écriture refusée à un directeur et dans la base ; lieu inconnu). Navigateur : Factures décochée dans `/editeur` → entrée absente du menu du lieu et adresse refusée avec le message ; fiche d'application et icônes servies.

## 2. Ce qui a été construit — commits

- [`80c5742`](https://github.com/Break-Eat-APP/flaix-expert/commit/80c5742fe8aa8efc1febbbd1675b31df5bef3132) — 2026-10-01 — Options par lieu, serveur : activées par Break Eat depuis le back-office, adresses fermées si désactivées, journal du lieu, lieu de formation aligné (migration 0020)
- [`0579d24`](https://github.com/Break-Eat-APP/flaix-expert/commit/0579d248fdd9dc4a9c34883f3a8c159469fb4c96) — 2026-10-01 — Options par lieu (écrans et back-office), application installable (fiche d'application, icônes) ; dossier §15.118, §15.119
- [`9287bce`](https://github.com/Break-Eat-APP/flaix-expert/commit/9287bce7d739539eb77005cd8a9dd8eb747770e7) — 2026-10-01 — Logo officiel « eXpert » sur tous les écrans (menu, téléphone, caisse, connexions, back-office), versions claire et sombre ; originaux dans docs/marque

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0020_options_lieu.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/db/migrations/0020_options_lieu.sql)

### Tests

- `apps/api/test/options.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/api/test/options.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/packages/domain/src/editeur.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/options.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/api/src/options.ts)
- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/lieu.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/api/src/routes/lieu.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/index.html` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/index.html)
- `apps/web/public/apple-touch-icon.png` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/public/apple-touch-icon.png)
- `apps/web/public/icone-192.png` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/public/icone-192.png)
- `apps/web/public/icone-512.png` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/public/icone-512.png)
- `apps/web/public/icone-masquable-512.png` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/public/icone-masquable-512.png)
- `apps/web/public/manifest.webmanifest` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/public/manifest.webmanifest)
- `apps/web/src/assets/logo-clair.svg` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/assets/logo-clair.svg)
- `apps/web/src/assets/logo-sombre.svg` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/assets/logo-sombre.svg)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/composants/Logo.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/composants/Logo.tsx)
- `apps/web/src/pages/caisse/PosteCaissiere.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/caisse/PosteCaissiere.tsx)
- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/Connexion.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/Connexion.tsx)
- `apps/web/src/pages/ConnexionCaissiere.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/ConnexionCaissiere.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/equipe/Equipe.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/equipe/Equipe.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/outils/icones-application.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/infra/outils/icones-application.cjs)
- `infra/outils/logo.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/infra/outils/logo.cjs)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/docs/flaix-gestion-dossier-projet.md)
- `docs/marque/logo-expert-officiel.png` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/docs/marque/logo-expert-officiel.png)
- `docs/marque/logo-expert-officiel.svg` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9287bce7d739539eb77005cd8a9dd8eb747770e7/docs/marque/logo-expert-officiel.svg)

## 4. Tests créés dans cette phase

### `apps/api/test/options.test.ts`

- **options d'un lieu**
  - sans réglage, toutes les options sont actives (rien ne change pour un lieu existant), sauf l'assistant IA, payant à l'usage
  - FlaiX Expert désactive le Stock : ses adresses sont fermées, le lieu le voit dans son journal
  - le lieu de formation suit les options du vrai lieu
  - réactivée, l'option rouvre ses adresses
  - chaque option ferme toutes ses adresses, et seulement elles (audit P2-002)
  - [F] seul un compte FlaiX Expert change une option, jusque dans la base ; lieu inconnu refusé

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/options.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
