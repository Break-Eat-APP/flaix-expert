# Guide de reprise — pour un développeur qui arrive sur FlaiX Expert

> Écrit le 2026-10-19, **mis à jour le 2026-10-25 : phase 76, migration `0058`**. À relire en premier ; il dit où aller pour
> tout le reste. Ce qui a été construit depuis la phase 66 est résumé au § 6 bis.

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
| [`docs/flaix-gestion-dossier-projet.md`](../flaix-gestion-dossier-projet.md) | **La source de vérité.** Chaque décision prise avec Rémi, avec ses mots, son raisonnement, ce qui a été construit et testé. La partie §15 suit le développement section par section (§15.93 → §15.175). |
| [`docs/avancement.md`](../avancement.md) | Où en est le projet, séance par séance, et ce qui est à faire au passage en production. |
| [`docs/points-a-revoir.md`](../points-a-revoir.md) | **La liste tenue à jour** de ce qui attend Rémi (comptes, clés, tests, décisions) et des développements suivants. |
| [`docs/decisions-architecture-production.md`](../decisions-architecture-production.md) | Choix d'architecture validés (§ 10), questions ouvertes (§ 11), incident Docker du poste de Rémi (§ 13). |
| [`JOURNAL_DES_PHASES.md`](JOURNAL_DES_PHASES.md) et [`phases/`](phases/README.md) | Les 77 phases de construction (0 → 76), dans l'ordre : pour chacune, une fiche en Markdown **et en Word** (décision, commits, fichiers par couche, tests, comment reprendre). |
| [`CARTE_DU_CODE.md`](CARTE_DU_CODE.md) | Où est quoi dans le code, et la ligne exacte des fonctions et routes clés. |
| [`CHANGELOG.md`](../../CHANGELOG.md) | Tous les commits, regroupés par phase. |
| `docs/conformite/`, [`docs/questions-expert-comptable.md`](../questions-expert-comptable.md) | Dossier de conformité du système de caisse ; questions fiscales encore ouvertes (NF525…). |
| [`docs/guide-serveur-test-ovh.md`](../guide-serveur-test-ovh.md) | Le serveur : ce qui est installé, ce que Rémi règle lui-même (sauvegardes, IA, Brevo, wallet). |
| [`docs/audits/`](../audits/README.md) | Audits de code (Claude, Codex) et leurs corrections ; le dernier : [`AUDIT_2026-10-25_claude-phases-67-75.md`](../audits/AUDIT_2026-10-25_claude-phases-67-75.md). Consigne pour Codex : [`CODEX_AUDIT_PROMPT.md`](CODEX_AUDIT_PROMPT.md). |

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
- **Tests des écrans d'un seul bloc** : sur 6 Go, la suite tombe parfois (« Worker exited unexpectedly », code 134 ou
  3221226505) : ce n'est pas un échec de test ; la lancer dossier par dossier
  (`cd apps/web && ./node_modules/.bin/vitest run src/pages/resultats --pool=forks --maxWorkers=1`).
- **Construction des écrans** (`vite build`) qui échoue sur « memory allocation failed » : arrêter Docker le temps de la
  construction (`docker desktop stop`, puis `docker desktop start` et `pnpm db:up`).
- **`tsx` qui échoue au démarrage** (« spawn UNKNOWN », vu le 2026-10-25 sur le poste de Rémi, sans doute l'antivirus) :
  lancer le serveur par `node --import tsx src/index.ts` depuis `apps/api` ; la configuration d'aperçu
  `flaix-expert-leger` (`.claude/launch.json` du dossier de travail, hors dépôt) le fait déjà. Si `npx` lui-même
  échoue (« Cannot find module './lt' »), passer par `pnpm exec …` ou `./node_modules/.bin/…`.

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
   configuration **redéfinit `synchroniser_complements_formation`** (reprendre la **dernière** version — aujourd'hui
   `0058_formation_famille_correspondances.sql` — et ajouter la copie), et les routes de configuration figurent dans la
   liste `CONFIGURATION` de `apps/api/src/serveur.ts` (lecture seule en formation). Cette règle a été oubliée deux fois
   (§15.171, §15.173) et rattrapée par l'audit du 2026-10-25 : **ajouter un test dans
   `apps/api/test/formation-complements.test.ts`** pour chaque nouvelle configuration.
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
   `node infra/outils/phases-word.cjs` (fiches de phase Markdown et Word) ; `docs/points-a-revoir.md` tenu à jour ; si ce
   guide ou un audit change, `node infra/outils/guide-word.cjs` (leur version Word). Sommaire de la documentation :
   [`docs/README.md`](../README.md).
8. **Commit** court par étape ; puis sauvegarde et déploiement (§ 7).

## 6 bis. Ce qui a été construit depuis la phase 66 (2026-10-19 → 2026-10-25)

Le détail est dans le dossier projet (§15.166 → §15.175), une fiche par phase dans [`phases/`](phases/README.md) et l'audit
[`AUDIT_2026-10-25_claude-phases-67-75.md`](../audits/AUDIT_2026-10-25_claude-phases-67-75.md). En résumé, par écran :

| Écran (menu) | Ce qu'il fait | Code principal |
|---|---|---|
| **En direct** (phases 67, 68, 70, 71) | La soirée en cours : 8 chiffres comparés au match précédent au même moment, le lieu en 3D (petits chiffres sous chaque stand, détail au clic), courbe par quart d'heure, catégories, cartes des stands ; « Ce qu'il te reste » à la minute ; « Ouvrir l'événement » hors soirée ; raccourci « Clôturer la soirée ». | `packages/domain/src/direct.ts` (`tableauDirect`), `apps/api/src/routes/direct.ts`, `apps/web/src/pages/direct/EnDirect.tsx`, `pages/resultats/PlanStade.tsx`, `Stade3D.tsx` |
| **Résultats** (68, 70, 71, 72, 75) | Événements **terminés** seulement (`evenementTermine` : clos, ou — caisse connectée — commencé et avec des ventes). Vue d'ensemble au design de la 2e maquette : « Bonsoir Rémi », « Ce qu'il te reste » en clair, 4 chiffres, courbe et catégories, ce qui se vend le mieux, à surveiller, prochain match (prévision), « Les chiffres de la soirée » (conversion, articles par ticket, moment fort, personnel, pertes, ruptures, abonnés, boissons / nourriture, Click & Collect). Onglets Marges (marge par catégorie) et Événements privés. | `pages/Resultats.tsx`, `pages/resultats/Tableaux.tsx`, `Ensemble.tsx`, `ResteSoiree.tsx`, `ChiffresSoiree.tsx`, `Prives.tsx` ; `packages/domain/src/chiffres-soiree.ts` ; `apps/api/src/routes/resultats.ts` (`chiffresDeSoiree`) |
| **Stock** (70, 73) | Produits seuls, en 4 étapes : 1. Réserve centrale, 2. Mise en place, 3. Pendant l'événement, 4. Comptage. | `pages/stock/Stock.tsx` |
| **Ingrédients** (73) | Stock des ingrédients suivis (fûts, matières), sorti de Stock. | `pages/ingredients/Ingredients.tsx` (reprend `pages/stock/StockIngredients.tsx`) |
| **Achats** (73, 74, 75) | Onglets Factures, Correspondances, Livraisons, Prix fournisseurs. Une facture se remplit depuis un **Excel ou CSV** du fournisseur ; chaque ligne porte ses **unités par colis** ; les **correspondances** (article du fournisseur → produit, colis) s'apprennent à chaque facture et se corrigent dans l'onglet ; des **alertes** (total annoncé, colis oublié, prix ou quantité inhabituels) se cochent avant de valider ; la **validation fait entrer les produits en réserve** ; « Pour le comptable » : un zip par période (pièces, factures de vente en PDF, récapitulatif Excel). | `packages/domain/src/factures-import.ts`, `factures.ts` ; `apps/api/src/routes/factures.ts`, `routes/stock.ts` (`enregistrerLivraison`), `apps/api/src/pdf-facture.ts` ; `apps/web/src/pages/achats/`, `pages/factures/Factures.tsx` |
| **Caisses connectées** (69, 72) | Exports de L'Addition lus seuls (feuille et colonnes reconnues, « - » = vide, remises et offerts) ; **annuler un import** raté ; nouveau système « Click & Collect (application Break Eat) » compté à part dans Résultats. | `packages/domain/src/caisses-externes.ts`, `apps/api/src/routes/caisses-externes.ts`, `pages/caisses-connectees/` |
| **Événements privés** (70, 71) | À la clôture, les produits du catalogue sortent de la réserve centrale (un produit fait d'un ingrédient suivi sort ses ingrédients) ; carte « À sortir / Sorti de la réserve ». | `apps/api/src/routes/evenements-prives.ts` (`sortirDeLaReserve`, `sortieStockDe`), `pages/prives/EvenementPrive.tsx` |
| **Rapport de soirée** (71) | Section « Stock de la soirée », stand par stand (champ facultatif des rapports figés depuis le 2026-10-21). | `packages/domain/src/rapport-soiree.ts` (`bilanDeStock`), `routes/rapport-soiree.ts` |
| **Paramètres › Produits & prix** (70, 72) | Famille de chaque catégorie (boisson, nourriture, autre ; devinée tant qu'elle n'est pas choisie) ; TVA à 2,1 % retirée des choix. | `pages/parametres/Produits.tsx`, `packages/domain/src/tva.ts` (`tauxTvaProposes`) |

**Le chemin d'une facture fournisseur**, de bout en bout :

1. Achats › Factures › « Remplir depuis un fichier » : `lireFichierVentes` (classeur → CSV) puis `lireFactureExport`
   (colonnes devinées, lignes de total ignorées, quantités au poids écartées).
2. Chaque ligne reprend la correspondance apprise (`cleArticle` : code, sinon libellé, par fournisseur normalisé), sinon
   le produit du même nom, sinon le plus ressemblant (« proposé : à vérifier ») ; colis lu ou deviné (`colisDevine`).
3. `POST /api/factures` enregistre la facture et **apprend** les correspondances (`apprendreCorrespondances`).
4. L'état de la facture recalcule le rapprochement **à l'unité vendue** (`enUnites` : quantité × colis, prix ÷ colis)
   et les **alertes** (`alertesFacture`).
5. `POST /api/factures/:id/validation` : refus tant qu'une alerte n'est pas cochée ; entrée en réserve
   (`enregistrerLivraison`, coût moyen pondéré) des produits sans livraison, ni fabriqués, dans la limite d'un
   mouvement (100 000 unités) ; motif exigé s'il reste un écart ; journal technique.
6. Paiement, puis `GET /api/factures/export` pour le comptable.

**Migrations de la période** : `0054` (annulation d'un import de caisse connectée), `0055` (sortie de stock d'un
événement privé), `0056` (famille des catégories, système `breakeat`), `0057` (colis, code article, total annoncé,
correspondances fournisseurs), `0058` (mode formation : famille et correspondances recopiées).
**Dépendances ajoutées** : `fflate` 0.8.3 (zip) et `pdf-lib` 1.17.1 (PDF), côté serveur.

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
| Caisse connectée | Une caisse d'un autre logiciel (L'Addition, Weezevent, Click & Collect Break Eat…) dont les ventes sont importées par fichier : comptées en gestion, jamais dans les Z ni l'export comptable. |
| Colis, unités par colis | Une ligne de facture compte des unités facturées (colis de 24) ; la réserve reçoit quantité × colis. |
| Correspondance fournisseur | « Tel article chez tel fournisseur = tel produit, en colis de tant », apprise à chaque facture, corrigée dans Achats. |
| Famille | Boisson, nourriture ou autre : regroupe les catégories pour la part boissons / nourriture de Résultats. |
| Événement terminé | Clos, ou (lieu à caisse connectée) commencé et avec des ventes : ce que Résultats montre. |

## 9. Ce qui reste ouvert

- La liste à jour : [`docs/points-a-revoir.md`](../points-a-revoir.md) (dont la lecture des factures PDF par IA, Mistral
  OCR, qui attend le compte de Rémi) ; les points ouverts de l'audit : § 6 de
  [`AUDIT_2026-10-25_claude-phases-67-75.md`](../audits/AUDIT_2026-10-25_claude-phases-67-75.md).
- **Passage en production** : base neuve, reprise de la seule configuration, aucune donnée de test (décision de Rémi du
  2026-10-17, `docs/avancement.md`) ; outil de reprise à préparer.
- **Fiscal** : question NF525 à trancher avec l'expert-comptable avant la mise en service réelle de la caisse.
- Sujets que Rémi tranche lui-même : hébergeur de production, coûts (abonnements, IA), conformité (dossier structuré).
