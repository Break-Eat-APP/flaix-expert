# Audit des phases 67 à 75 — revue de Claude du 2026-10-25

> Demandé par Rémi le 2026-10-25 : *« une audite de tout ce que nous avons développé dernièrement… un informaticien qui
> reprend le dossier doit savoir ce qui a été fait et comment ; une audite va être faite par Codex derrière »*.
> Ce rapport est une **auto-revue** : Claude relit le code qu'il a écrit. Il ne remplace pas l'audit indépendant de Codex
> (consigne à jour dans [`../developpement/CODEX_AUDIT_PROMPT.md`](../developpement/CODEX_AUDIT_PROMPT.md)) : à recouper,
> pas à recopier.

## 1. Verdict

- Les phases 67 à 75 (dossier §15.166 à §15.174, migrations **0054 à 0057**) tiennent les règles du projet sur
  l'essentiel : moteur pur et testé, isolement des lieux par la base, droits `exigerDirecteur`, écriture seule des
  registres, journal technique pour chaque changement de paramétrage.
- **Sept défauts** trouvés par cette revue, **tous corrigés** le 2026-10-25 (commit `0ff2657`, migration **0058**,
  §15.175) : le plus important, une règle du guide de reprise oubliée deux fois (la configuration nouvelle n'était pas
  recopiée en mode formation).
- **Quatre régressions** apparues pendant les phases, trouvées par la suite complète des tests et corrigées sur le
  moment (§ 4).
- **Quinze points ouverts**, aucun bloquant pour le serveur de test : performances, approximations assumées, limites
  de la lecture des fichiers, environnement du poste de Rémi (§ 5).
- Mise en production réelle : toujours conditionnée aux points du [`../avancement.md`](../avancement.md) et de
  [`../points-a-revoir.md`](../points-a-revoir.md) (base neuve, conformité, NF525).

## 2. Périmètre

| Phase | Dossier | Sujet | Migration | Commits principaux |
|---|---|---|---|---|
| 67 | §15.166 | Le tableau En direct d'après la maquette, avec le lieu en 3D | — | `0e5db30`, `a54313b`, `77de79f` |
| 68 | §15.167 | En direct à part, au design des maquettes ; Résultats pour les événements terminés | — | `25fcf2a`, `a34efbd`, `f73a1b3` |
| 69 | §15.168 | Exports de L'Addition lus seuls ; annuler un import de caisse connectée | 0054 | `b54f0f6` |
| 70 | §15.169 | Décor fixe, stock dans l'ordre, ouverture depuis En direct, stock des événements privés, marge par catégorie | 0055 | `074b283`, `9a05031`, `47bddbf`, `600c400`, `61ad9fb` |
| 71 | §15.170 | Rapport de stock par événement ; « Ce qu'il te reste » en clair ; le net en direct | — | `26cf6ab`, `631ca41`, `5a7f287`, `7b2ecfb` |
| 72 | §15.171 | Les chiffres de la soirée ; événements privés dans Résultats ; Click & Collect par fichier | 0056 | `b75c773`, `2561df7` |
| 73 | §15.172 | Achats, Ingrédients à part, raccourci de clôture ; facture qui entre en réserve ; export pour le comptable | — (dépendances `fflate`, `pdf-lib`) | `8aa91c8`, `e521638`, `e3f7ec6`, `269beca` |
| 74 | §15.173 | Factures automatisées : import Excel ou CSV, colis, correspondances apprises, alertes | 0057 | `6d19641`, `1c6a401` |
| 75 | §15.174 | Correspondances fournisseurs à l'écran ; Résultats au design de la 2e maquette | — | `6fb8776`, `d2d5506`, `ee26b84` |
| 76 | §15.175 | Cet audit et ses corrections | 0058 | `0ff2657` |

Chaque phase a sa fiche (décision, commits, fichiers par couche, tests) dans
[`../developpement/phases/`](../developpement/phases/README.md), en Markdown et en Word.

## 3. Ce qui a été vérifié, et comment

1. **Relecture du code** des routes nouvelles ou modifiées (§ 6), en priorité celles qui écrivent : validation d'une
   facture, annulation d'un import, sortie de stock d'un événement privé, correspondances, export.
2. **Règles du guide de reprise** ([`../developpement/GUIDE_DE_REPRISE.md`](../developpement/GUIDE_DE_REPRISE.md) § 4),
   une par une, contre chaque migration et chaque route : isolement, droits, écriture seule, journal technique,
   options du lieu, **mode formation**.
3. **Bornes de la base** : chaque valeur calculée écrite en base comparée à la contrainte de sa colonne (c'est ainsi
   qu'a été trouvé le défaut A2).
4. **Fichiers produits pour l'extérieur** (CSV pour Excel, PDF, zip) : contenu saisi par l'utilisateur, noms de
   fichiers, taille.
5. **Tests** : types (`tsc --noEmit`) des trois paquets ; moteur complet ; serveur fichier par fichier
   (`pnpm --filter @flaix/api test:un-par-un`) ; écrans dossier par dossier (le poste de 6 Go fait tomber la suite d'un
   seul bloc : un arrêt de Node, pas un échec de test). Les chiffres exacts sont au § 7.

## 4. Régressions apparues pendant les phases (corrigées sur le moment)

| # | Introduite | Défaut | Trouvé par | Corrigé |
|---|---|---|---|---|
| R1 | §15.167 | Résultats limité aux événements **clos** : un lieu dont les ventes viennent d'une caisse connectée (événements jamais clos dans FlaiX Expert) n'avait plus de Résultats. | Test serveur `caisses-externes` | §15.168, `b54f0f6` : `evenementTermine` (clos, ou commencé et avec des ventes) |
| R2 | §15.167 | Trois tests lisaient Résultats pendant un événement ouvert (cibles de marge, conditionnement, personnel). Le comportement voulu avait changé, pas le code fautif : tests réécrits pour lire après la clôture, ou Finances pendant l'événement. | Suite complète du serveur | `5a7f287`, `7b2ecfb` |
| R3 | §15.173 | En-têtes avec ponctuation (« P.U. HT », « Qté. ») non reconnus : `sansAccents` remplace la ponctuation par des espaces. | Test d'écran de l'import | avant le commit `1c6a401` |
| R4 | §15.164 → §15.169 | Le décor du lieu (patinoire…) n'était gardé qu'avec « Enregistrer » à la fin du placement : il revenait au stade. | Retour de Rémi | `074b283` : enregistré au clic |

## 5. Défauts trouvés par cette revue — tous corrigés (§15.175, commit `0ff2657`)

| # | Gravité | Défaut | Scénario | Correction | Test |
|---|---|---|---|---|---|
| A1 | P2 | **Mode formation** : la famille des catégories (0056) et les correspondances fournisseurs (0057) ne se recopiaient pas dans le lieu de formation (règle n° 6 du guide), et la correction d'une correspondance n'était pas dans la liste `CONFIGURATION` ([`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts)). | En formation, la part boissons / nourriture était devinée au lieu de reprendre les choix du lieu ; un import de facture ne retrouvait aucun article appris ; une correction faite en formation était effacée à la synchronisation suivante sans prévenir. | Migration **0058** : `synchroniser_complements_formation` (version 0052) plus la famille et les correspondances (produit de la formation, via `origine_id`) ; route ajoutée à `CONFIGURATION`. | `apps/api/test/formation-complements.test.ts` (2, dont 1 [F]) |
| A2 | P2 | **Validation d'une facture** : quantité × colis écrite en livraison sans borne, alors qu'un mouvement de stock est limité à 100 000 (`stock_mouvement.quantite`, migration 0008). | 5 000 colis × 24 = 120 000 : erreur de contrainte, message générique « valeur refusée ». | Refus avant écriture, message qui dit le calcul et quoi vérifier (`QUANTITE_MAX_MOUVEMENT`, `routes/factures.ts`). | `facture-reserve.test.ts` (« [F] quantité × colis au-delà… ») |
| A3 | P3 | **Produit fabriqué** (avec une recette) : l'écran le comptait parmi les produits qui entreraient en réserve, le serveur l'écartait. | Facture dont seules les lignes sont des produits fabriqués : l'écran cache le motif, le serveur l'exige, la validation reste bloquée. | `produitFabrique` sur chaque ligne (`LigneFactureVue`), même règle à l'écran et au serveur. | tests factures (serveur et écran) relancés |
| A4 | P2 | **Récapitulatif pour Excel** : un fournisseur, un client ou un n° de facture saisi qui commence par `=`, `+`, `-` ou `@` est lu par Excel comme une formule (injection de formule). | Un fournisseur nommé `=HYPERLINK(…)` dans l'export du comptable. | Apostrophe devant ces textes (`csvRecapFactures`, `packages/domain/src/factures.ts`). | `factures.test.ts` (« [F] … jamais une formule pour Excel ») |
| A5 | P3 | **Correspondance apprise** jamais « désapprise » : une ligne remise sans produit et sans colis laissait l'ancien produit retenu. | Erreur de rapprochement corrigée sur une facture, puis reproposée à l'import suivant. | Ligne sans produit ni colis : la correspondance existante est remise à vide (`apprendreCorrespondances`). | `facture-reserve.test.ts` (« produit retiré… ») |
| A6 | P2 | **Export pour le comptable** construit en mémoire sans limite (pièces jointes jusqu'à 10 Mo chacune). | Une année entière de factures avec photos : mémoire du serveur saturée. | Somme des pièces jointes bornée à 150 Mo (`EXPORT_PIECES_MAX`), sinon 413 « choisis une période plus courte ». | — (borne simple ; à couvrir si Codex le juge utile) |
| A7 | P3 | **Options du lieu** : l'onglet « Événements privés » de Résultats s'affichait option coupée (erreur à l'ouverture) ; la case « faire entrer en réserve » s'affichait sans l'option Stock. | Lieu sans l'option Événements privés ou Stock. | Onglet et case selon `useOptions()`. | tests d'écrans de Résultats et des factures relancés |

## 6. Points ouverts (non corrigés) — à trancher ou à surveiller

| # | Gravité | Point | Où | Proposition |
|---|---|---|---|---|
| O1 | P3 | **Charge** : la vue d'ensemble de Résultats appelle `/api/resultats`, `/api/finances`, `/api/pertes` et `/api/prevision` ; En direct relit `/api/plan-stade` et `/api/direct` toutes les 10 s et `/api/finances` toutes les 30 s par écran ouvert. | `pages/resultats/Ensemble.tsx`, `ChiffresSoiree.tsx`, `pages/direct/EnDirect.tsx` | Mesurer sur une vraie soirée ; au besoin, une route « résumé » unique ou un cache court côté serveur. |
| O2 | P3 | **Logique dupliquée** : les minutes de personnel des « chiffres de la soirée » sont recalculées en SQL (`minutesPersonnel`), alors que le planning les calcule déjà (`minutesReelles`). | `apps/api/src/routes/resultats.ts` (`minutesPersonnel`) | Réutiliser `affectationsDuMatch` / `totauxAffectations` de `routes/planning.ts`. |
| O3 | P3 | **Correspondances apprises** dès l'enregistrement d'une facture (pas seulement à la validation), et clé du fournisseur = son nom normalisé : « Metro » et « METRO Cash & Carry » sont deux fournisseurs. | `apprendreCorrespondances` | Choix assumé (le directeur corrige dans Achats › Correspondances) ; à revoir si les doublons de fournisseurs gênent. |
| O4 | P3 | **Prix ÷ colis** arrondi au centime : un article à moins d'un demi-centime l'unité entre à 0 €. | `enUnites` (`factures-import.ts`) | Négligeable en buvette ; à documenter seulement. |
| O5 | P3 | **Zip en mémoire** (borné à 150 Mo, A6). | `GET /api/factures/export` | Écriture en flux si les exports deviennent gros. |
| O6 | P3 | **PDF des factures de vente** : police Helvetica (WinAnsi), caractères hors de ce jeu remplacés par « ? » ; **mise en page jamais regardée à l'écran** (le navigateur intégré n'affiche pas les PDF). | `apps/api/src/pdf-facture.ts` | Rémi ouvre un premier export réel (point 5 de `points-a-revoir.md`). |
| O7 | P3 | **Seuils fixes** : alerte prix à 25 %, quantité à 3 fois l'habitude (2 livraisons au moins : jamais d'alerte sur les premières factures), export à 150 Mo, livraison à 100 000 unités. | `factures-import.ts`, `routes/factures.ts` | Réglables par lieu si Rémi le demande. |
| O8 | P3 | **« Mi-temps »** : FlaiX Expert n'en connaît pas l'heure ; il montre le quart d'heure le plus fort, en pratique celui de la mi-temps. Calculé pour un seul événement (pas sur une période). | `chiffresSoiree`, `chiffresDeSoiree` | Approximation écrite dans le dossier §15.171. |
| O9 | P3 | **Fidélité dans les chiffres de la soirée** : seuls les tickets FlaiX Expert portant le motif « abonné » comptent ; les ventes importées n'ont pas d'abonné. | `chiffresDeSoiree` | Normal tant que les caisses externes ne transmettent pas de carte. |
| O10 | P3 | **Sortie de stock des événements privés** : seuls ceux clôturés après la migration 0055 ont sorti leurs produits ; aucun rattrapage des plus anciens. | `sortirDeLaReserve` | Choix assumé (§15.169). |
| O11 | P3 | **Click & Collect par fichier** : aucun vrai export de l'application Break Eat essayé ; colonnes devinées comme pour L'Addition. | caisse connectée `breakeat` | Attend l'export de Rémi (point 3 de `points-a-revoir.md`). |
| O12 | P3 | **Lecture d'un classeur de facture** : la feuille choisie est la meilleure pour des colonnes **de caisse** (`meilleureFeuille` de `caisses-connectees/fichiers.ts`), à défaut la première non vide ; un classeur de facture à plusieurs feuilles peut ouvrir la mauvaise. | `pages/factures/Factures.tsx` → `lireFichierVentes` | Passer une fonction de score propre aux factures (`devinerColonnesFacture`). |
| O13 | P3 | **Tests fragiles** : le test d'écran de l'import attend 50 ms la réponse des correspondances. | `apps/web/src/pages/factures/Factures.test.tsx` | Attendre l'état de la requête plutôt qu'un délai. |
| O14 | P3 | **Résultats, 2e maquette** : la recherche de l'en-tête n'est pas construite ; la colonne de droite (À surveiller, Prochains événements) a disparu des autres onglets (elle est dans la vue d'ensemble). | `pages/Resultats.tsx`, `pages/resultats/Tableaux.tsx` | Selon l'avis de Rémi. |
| O15 | — | **Environnement du poste de Rémi** (pas un défaut du code) : `tsx` y échoue au lancement de son processus (`spawn UNKNOWN`, sans doute l'antivirus) : l'aperçu local lance le serveur par `node --import tsx src/index.ts` (fichier `.claude/launch.json`, hors dépôt). 6 Go de mémoire : la construction et les suites de tests d'un bloc tombent parfois ; arrêter Docker le temps d'une construction, lancer les tests par fichier ou par dossier. | — | Voir `GUIDE_DE_REPRISE.md` § 3. |

## 7. Résultats des tests (2026-10-25, après les corrections)

- Types : `packages/domain`, `apps/api`, `apps/web` — aucune erreur.
- Moteur : voir le résumé ci-dessous (suite complète).
- Serveur : suite complète fichier par fichier ; fichiers touchés par l'audit relancés seuls (`factures` 8,
  `facture-reserve` 5, `export-factures` 2, `formation` 10, `formation-complements` 2, `conformite-base` 15).
- Écrans : 106 tests en 29 fichiers, verts dossier par dossier.

Résumé de la dernière exécution complète (2026-10-25, après les corrections) :

| Suite | Fichiers | Tests | Résultat |
|---|---|---|---|
| Moteur (`packages/domain`) | 42 | 285 | tous verts, d'un seul bloc |
| Serveur (`apps/api`, contre PostgreSQL) | 51 | 416 | tous verts ; 3 fichiers (`conditionnement`, `evenements-prives`, `rapport-soiree`) tombés pendant la suite sur des erreurs de l'environnement (fichier temporaire illisible, module npm introuvable, transformation interrompue — poste à court de mémoire), verts relancés seuls |
| Écrans (`apps/web`) | 29 | 106 | tous verts, dossier par dossier |

## 8. Pour l'auditeur suivant (Codex)

À regarder en priorité, du plus sensible au moins sensible :

1. `db/migrations/0054_annulation_import_ventes_externes.sql` — fonction `SECURITY DEFINER`
   `annuler_import_ventes_externes` et contournement de l'écriture seule par réglage de session
   (`flaix.annulation_import`) : peut-on effacer des articles hors de l'import visé, ou d'un autre lieu ?
2. `db/migrations/0055_sortie_stock_evenement_prive.sql` — nouveau type de mouvement, contraintes `*_forme`,
   `controler_mouvement_stock` remplacée : les règles d'avant (mise en place, réassort) sont-elles intactes ?
3. `apps/api/src/routes/factures.ts` — validation (alertes, entrée en réserve, motif), correspondances (PUT, DELETE,
   apprentissage), export (zip, PDF, CSV).
4. `db/migrations/0057_factures_automatisees.sql` et `0058_formation_famille_correspondances.sql` — droits colonne par
   colonne, sécurité par ligne, `controler_facture_figee` remplacée (le total annoncé se fige).
5. `apps/api/src/routes/resultats.ts` (`chiffresDeSoiree`, `minutesPersonnel`, filtre `evenementTermine`),
   `routes/evenements-prives.ts` (`sortirDeLaReserve`), `routes/caisses-externes.ts` (choix des colonnes, imports).
6. Écrans : `pages/resultats/Ensemble.tsx`, `ChiffresSoiree.tsx`, `ResteSoiree.tsx`, `pages/achats/`,
   `pages/factures/Factures.tsx`, `pages/direct/EnDirect.tsx`.

## 9. Suivi

| Date | Fait | Commit |
|---|---|---|
| 2026-10-25 | Revue, corrections A1 à A7, migration 0058, dossier §15.175, documentation de reprise mise à jour | `0ff2657` et suivants |
