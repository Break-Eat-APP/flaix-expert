# Guide de reprise — pour un développeur qui arrive sur FlaiX Expert

> Écrit le 2026-10-19, à jour de la phase 66 (migration `0053`). À relire en premier ; il dit où aller pour tout le reste.

## 1. Le projet en cinq minutes

**FlaiX Expert** (éditeur et hébergeur : Break Eat App, fondateur Rémi Notta) est la caisse et l'outil de gestion des
buvettes de stade et de salle : le directeur F&B configure son lieu (stands, caisses, produits, prix, stock, équipe), les
caissières vendent sur tablette (même sans réseau), le directeur suit ses résultats, ses marges, son stock, son hygiène et
ses clôtures de caisse.

- **Pile** : TypeScript partout ; monorepo pnpm. Serveur Node.js + Fastify (`apps/api`), écrans React 19 + Vite +
  TanStack Query (`apps/web`), moteur de calcul pur partagé (`packages/domain`), PostgreSQL 17 (`db/migrations`).
- **État** : en service sur un serveur de **test** OVH (`https://flaixexpert.flaixlabs.com`), utilisé pour des essais.
  Pas encore en production réelle : voir § 9.
- **Code** : `https://github.com/Break-Eat-APP/flaix-expert` (branche `main`). Rémi pousse lui-même (`git push`).

## 2. Où lire quoi, dans cet ordre

| Document | Pour quoi |
|---|---|
| [`AGENTS.md`](../../AGENTS.md), [`CLAUDE.md`](../../CLAUDE.md) | Règles du projet (aucune donnée inventée, décision écrite avant code, lecture complète d'un module avant de le modifier…). |
| [`docs/flaix-gestion-dossier-projet.md`](../flaix-gestion-dossier-projet.md) | **La source de vérité.** Chaque décision prise avec Rémi, avec ses mots, son raisonnement, ce qui a été construit et testé. La partie §15 suit le développement section par section (§15.93 → §15.165). |
| [`docs/avancement.md`](../avancement.md) | Où en est le projet, ce qui attend Rémi, ce qui est à faire au passage en production. |
| [`docs/decisions-architecture-production.md`](../decisions-architecture-production.md) | Choix d'architecture validés (§ 10), questions ouvertes (§ 11), incident Docker du poste de Rémi (§ 13). |
| [`JOURNAL_DES_PHASES.md`](JOURNAL_DES_PHASES.md) et [`phases/`](phases/README.md) | Les 67 phases de construction (0 → 66), dans l'ordre : pour chacune, une fiche en Markdown **et en Word** (décision, commits, fichiers par couche, tests, comment reprendre). |
| [`CARTE_DU_CODE.md`](CARTE_DU_CODE.md) | Où est quoi dans le code, et la ligne exacte des fonctions et routes clés. |
| [`CHANGELOG.md`](../../CHANGELOG.md) | Tous les commits, regroupés par phase. |
| `docs/conformite/`, [`docs/questions-expert-comptable.md`](../questions-expert-comptable.md) | Dossier de conformité du système de caisse ; questions fiscales encore ouvertes (NF525…). |
| [`docs/guide-serveur-test-ovh.md`](../guide-serveur-test-ovh.md) | Le serveur : ce qui est installé, ce que Rémi règle lui-même (sauvegardes, IA, Brevo, wallet). |
| `docs/audits/` | Audits de code (Claude, Codex) et leurs corrections. |

## 3. Démarrer en local

Les commandes sont dans le [`README.md`](../../README.md) (`pnpm install`, `pnpm db:up`, `pnpm db:migrate`, `pnpm dev`,
`pnpm cli creer-lieu …`). Pièges connus :

- **Poste à peu de mémoire (6 Go)** : lancer les tests du serveur un fichier à la fois
  (`cd apps/api && pnpm test:un-par-un`, ou `npx vitest run test/xxx.test.ts --pool=forks --maxWorkers=1`) ; ne pas
  laisser tourner le serveur de développement pendant `tsc` et les tests. Un résultat vide ou un « out of memory » :
  relancer le fichier seul.
- **Docker Desktop qui ne démarre pas** (sockets `.sock` impossibles à supprimer) : arrêter Docker, **renommer** (pas
  supprimer) `%LOCALAPPDATA%\Docker\run` et `%LOCALAPPDATA%\docker-secrets-engine`, relancer. Jamais « Reset to factory
  defaults » (§ 13 des décisions d'architecture).
- Deux bases locales : `flaix` (développement) et `flaix_test` (tests, remise à neuf par les tests eux-mêmes).

## 4. Principes à ne jamais casser

1. **Le moteur fait foi.** Tout calcul (TVA, marges, stock, clôtures, couleurs du stade…) vit dans `packages/domain`,
   sans base ni réseau, testé ; le serveur et les écrans l'appellent, ne le recopient pas.
2. **Nombres entiers** : montants en **centimes**, taux en **points de base** (1000 = 10 %), emballages en **millimes**
   (1/1000 €), températures en **dixièmes de degré**, quantités d'ingrédients en **millièmes** d'unité.
3. **Isolement des lieux par la base** : chaque requête métier passe par `base.transaction(contexte(auth), …)`, qui pose
   `app.lieu_id` ; la sécurité par ligne de PostgreSQL (`lieu_courant()`) fait le reste. Le rôle de l'application
   (`flaix_app`) n'a que les droits nécessaires, colonne par colonne.
4. **Écriture seule et chaînes scellées** : journal de chaque caisse, journal technique (JET) par lieu, clôtures (Z du
   match, du mois, de l'exercice, total perpétuel), rapport de soirée, factures de vente, registre d'hygiène,
   mouvements de stock… Des déclencheurs refusent toute modification ou suppression, même au propriétaire de la base.
   On **corrige par une nouvelle écriture**, jamais en effaçant. Les tests **[F]** de `apps/api/test/conformite-base.test.ts`
   le vérifient en tentant la fraude.
5. **Migrations immuables** : une migration appliquée ne se modifie jamais (son empreinte SHA-256 est vérifiée). On en
   ajoute une nouvelle.
6. **Mode formation** : un lieu jumeau « FACTICE » recopie la configuration du vrai lieu. Toute migration qui ajoute de la
   configuration **redéfinit `synchroniser_complements_formation`** (reprendre la dernière version et ajouter la copie),
   et les routes de configuration figurent dans la liste `CONFIGURATION` de `apps/api/src/serveur.ts` (lecture seule en
   formation).
7. **Tout changement de paramétrage est inscrit au journal technique** (`inscrireJet`, types déclarés dans
   `packages/domain/src/journal-technique.ts`).
8. **Droits** : `exigerDirecteur` (directeur ; le support FlaiX en lecture seule, sur autorisation du lieu),
   `exigerAccesCaisse` (caissière sur une tablette enregistrée), tous deux dans `apps/api/src/auth/contexte.ts` ;
   `exigerEquipe` (hygiène, dans `routes/hygiene.ts`).
9. **Options par lieu** : chaque module peut être coupé depuis le back-office (`OPTIONS_LIEU` dans
   `packages/domain/src/editeur.ts`, contrainte `option_lieu_option_check` en base).
10. **Écrans** : style clair et arrondi, jamais de fond sombre (§15.153) ; textes en français, tutoiement ; aucune donnée
    de démonstration dans un vrai lieu.

## 5. Ajouter une fonctionnalité — la recette suivie depuis la phase 0

1. **Décision écrite** dans le dossier projet (nouvelle section §15.x : demande de Rémi citée, décisions, raisons).
2. **Migration** `db/migrations/00NN_nom.sql` : tables, droits (`GRANT` au plus juste), sécurité par ligne, écriture
   seule si c'est un registre, copie en mode formation si c'est de la configuration.
3. **Moteur** dans `packages/domain/src` + ses tests (`*.test.ts`), exporté dans `index.ts`.
4. **Route** dans `apps/api/src/routes/` (enregistrée dans `serveur.ts`) + tests contre la vraie base dans `apps/api/test/`,
   dont au moins un test **[F]** quand une règle de sécurité est en jeu.
5. **Écran** dans `apps/web/src/pages/` + test de l'écran (serveur simulé) ; route dans `App.tsx`, menu dans
   `composants/Coquille.tsx`.
6. `pnpm typecheck`, tests, essai dans le navigateur (`.claude/launch.json` : `flaix-expert`, ou `flaix-expert-leger` =
   version compilée, plus économe en mémoire).
7. **Documentation** : « Réalisé le … » dans la section §15.x, `docs/avancement.md`, une entrée dans
   `infra/outils/phases.cjs`, puis `node infra/outils/journal-developpement.cjs` (journal, CHANGELOG, carte du code) et
   `node infra/outils/phases-word.cjs` (fiches de phase Markdown et Word).
8. **Commit** court par étape ; puis sauvegarde et déploiement (§ 7).

## 6. Les tests

- `pnpm test` (tout), ou par paquet : `packages/domain` (moteur), `apps/api` (contre PostgreSQL, base `flaix_test`),
  `apps/web` (jsdom ; la 3D est remplacée par un faux composant, jsdom n'a pas de WebGL).
- Chaque fiche de phase liste ses tests ; les noms des tests disent la règle vérifiée.
- `apps/api/test/tablette.ts` simule une tablette (tickets scellés hors ligne, envoi) ; `apps/api/test/aide.ts` crée
  un lieu de test et ouvre les bases.

## 7. Mettre en ligne (serveur de test OVH)

Procédure suivie à chaque livraison, depuis le poste de Rémi (clé SSH `flaix_ovh`, utilisateur `debian`) :

1. Sauvegarde : `sudo -n /usr/local/sbin/sauvegarde-flaix.sh` (sauvegardes dans `/var/backups/flaix`).
2. `git archive --format=tar.gz -o flaix-<commit>.tar.gz HEAD`, copie dans `/tmp` du serveur.
3. `sudo -n /usr/local/sbin/deployer-flaix.sh /tmp/flaix-<commit>.tar.gz` : installe, compile, **applique les
   migrations**, redémarre.
4. Contrôle : `https://flaixexpert.flaixlabs.com/api/sante` doit répondre `{"ok":true}`.

Les **secrets** (base, IA, Brevo, wallet, Apple/Google) ne sont **jamais** dans le dépôt : Rémi les installe lui-même sur
le serveur par les commandes `flaix-admin` (`infra/vps/flaix-admin.sh`). Personne ne lit la base de production à la main.

## 8. Petit glossaire

| Mot | Sens dans le code |
|---|---|
| Lieu | Un client (stade, salle) ; tout est cloisonné par lieu. |
| Événement (anciennement « match ») | Une soirée de vente : à venir → ouvert → clos. Un seul ouvert à la fois. |
| Stand, caisse, tribune | Un point de vente ; une tablette de vente (numérotée sur tout le lieu) ; le côté du stade où le stand est dessiné. |
| Z | Clôture scellée d'un tiroir, du coffre, de l'événement, du mois ou de l'exercice. |
| JET | Journal des événements techniques (paramétrage, connexions…), chaîné par lieu. |
| Mise en place, réassort, reste, réserve | Envoyé au stand avant l'ouverture ; ajouté pendant ; compté à la fin (devient le départ du suivant) ; stock central. |
| CUMP | Coût unitaire moyen pondéré, recalculé à chaque livraison. |
| Formation | Lieu jumeau factice pour s'entraîner sans toucher aux vrais chiffres. |
| Remise à zéro | Les restes comptés avant elle ne passent plus au suivant ; la réserve repart d'un inventaire à 0 (§15.165). |

## 9. Ce qui reste ouvert

- **Passage en production** : base neuve, reprise de la seule configuration, aucune donnée de test (décision de Rémi du
  2026-10-17, `docs/avancement.md`) ; outil de reprise à préparer.
- **Fiscal** : question NF525 à trancher avec l'expert-comptable avant la mise en service réelle de la caisse.
- Sujets que Rémi tranche lui-même : hébergeur de production, coûts (abonnements, IA), conformité (dossier structuré).
