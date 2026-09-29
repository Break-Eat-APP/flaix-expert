# FlaiX Expert / Flex Expert — Brief de passage en production (à l'attention de Claude Code)

**Rédigé le** 2026-09-28, à la demande de Rémi Notta (fondateur, Break Eat SAS), révisé le même jour (§15.92 du dossier) après une précision importante de Rémi sur l'encaissement réel. Ce document résume la décision de passage en production et l'état réel du prototype existant. Il ne remplace pas le dossier projet complet (`flaix-gestion-dossier-projet.md`, source de vérité validée module par module) — il en est un résumé opérationnel écrit pour démarrer le chantier de code.

**⚠ Point bloquant en tête de ce document, à lire avant tout le reste : §2.** Le périmètre a changé entre la première et la deuxième version de ce brief, le même jour — ne pas travailler à partir d'une version antérieure ou d'un souvenir de conversation.

## 1. Ce qui est demandé

Construire une **première version de production** de FlaiX Expert (Break Eat SAS). Le client pilote est **Les Spartiates de Marseille** (Directeur F&B : Nicolas Cocandeau), mais l'application doit être générique et réutilisable pour d'autres lieux.

**Exigence explicite de Rémi, absolue** : **aucune donnée de démonstration ne doit être intégrée**. Le directeur du lieu part d'un compte **entièrement vide** et construit lui-même, progressivement, à travers l'interface :
- ses stands,
- ses caisses,
- son catalogue produits et ses prix,
- ses stocks.

Rien n'est préchargé. Aucun stand fictif, aucun produit fictif, aucun montant fictif, aucun jeu de test visible par un utilisateur réel. Ceci s'applique à **tout ce qui sera construit à partir de maintenant**.

## 2. Périmètre réel — ni Mode A pur, ni Mode B complet (révisé le 2026-09-28)

Le dossier projet (§0) distingue deux modes de déploiement :

- **Mode A — Overlay (le lieu garde sa caisse existante)** : FlaiX Expert analyse à côté, alimenté par import/saisie, **aucun encaissement réel**, hors champ NF525.
- **Mode B — Caisse (le lieu remplace sa caisse)** : FlaiX Expert encaisse au ticket, en temps réel, app opératrice offline, matériel de paiement, NF525/ISCA. Chantier lourd, plusieurs mois.

**Une première réponse de Rémi (2026-09-28, tôt) avait choisi le Mode A.** Une clarification survenue **le même jour, juste après**, a changé la donne : *« la caissière va juste taper sur la caisse pour créer des tickets, mais l'encaissement se fait par un moyen bancaire via la plateforme Stripe »*. Confirmé par Rémi : **le module de création de tickets (Ma caisse) est bien dans le périmètre de cette mise en production** — ce n'est donc plus un Mode A pur.

**Ce que ça change concrètement** : la caissière utilise réellement FlaiX Expert pour créer chaque ticket de vente ; le règlement carte est capté via Stripe (pas d'espèces confirmées à ce stade — à vérifier, voir §5). Ce montage ne correspond ni exactement au Mode A (il y a bien un encaissement, via Stripe) ni au Mode B complet tel que décrit dans le dossier (pas de mention d'app offline ni de matériel de paiement propre à FlaiX Expert — Stripe fournit son propre terminal/lecteur).

**⚠ Point bloquant, à traiter AVANT de construire l'encaissement réel — pas après, pas en parallèle** : un logiciel qui **enregistre** une transaction de vente (même si le règlement lui-même passe par un prestataire tiers comme Stripe) est potentiellement soumis à l'obligation de certification NF525 / attestation individuelle (article 286, I-3° bis du code général des impôts) — c'est la fonction d'**enregistrement du paiement client**, pas le moyen de paiement utilisé, qui est régulée. Le module Conformité du prototype indique lui-même : *« Version attestée : non émise à ce jour »* — FlaiX Expert n'a aujourd'hui aucune certification. **Ceci n'est pas une conclusion juridique — ni Rémi ni moi ne sommes fiscalistes.** Cette question est déjà en attente dans le dossier (§12) depuis le début du projet, jamais posée par écrit à un expert-comptable ou fiscaliste. **Recommandation forte : la faire trancher par écrit avant que Claude Code développe la brique d'encaissement**, pas après coup — une certification a posteriori ou un chantier à refaire coûterait bien plus cher qu'une question posée maintenant.

## 3. Le prototype existant — ce qu'il est, ce qu'il n'est pas

Un prototype fonctionnel complet existe : `flaix-gestion-final.html` (un seul fichier HTML/CSS/JS, ~6 800 lignes), publié comme artifact Claude, et son journal de décisions complet dans `flaix-gestion-dossier-projet.md` (~3 800 lignes, entrées §15.1 à §15.92). **Ce prototype fait autorité comme spécification fonctionnelle et visuelle** — chaque module a été construit puis validé visuellement par Rémi, décision par décision, tracée dans le dossier. Le dossier contient aussi le **cahier des formules** (moteur de calcul, une fiche par formule) qui fait référence pour tout recalcul en production.

**Ce que ce prototype N'EST PAS**, à ne jamais perdre de vue :

1. **Aucune persistance.** Audit exhaustif (grep) : zéro `localStorage`, zéro appel réseau (`fetch`/`XMLHttpRequest`), zéro `IndexedDB`. Toutes les données vivent en mémoire JavaScript et disparaissent au rechargement de la page. C'est un démonstrateur d'interface et de logique de calcul, jamais relié à un vrai stockage.
2. **Une mosaïque de jeux de démonstration indépendants, pas un flux de données unique.** 93 endroits du fichier signalent explicitement des données de démonstration, génériques ou déterministes (jeu de test des 3 « soirées » Toulon/Grenoble/Bayonne, volumes de vente générés par formule déterministe, prix fournisseurs génériques, employés fictifs, etc.). Plus significatif : les modules qui scellent une chaîne d'événements (Ma caisse, Ventes & CA, Config produits) le font **chacun dans son propre état interne** (`state.chaine` distinct par module, confirmé par lecture du code) — rien n'est aujourd'hui câblé comme un flux de données réel partagé entre modules. Chaque écran a été validé **isolément**, avec son propre jeu de test — c'est la méthode de travail qui a permis d'avancer vite et de faire valider chaque écran par Rémi, mais ça veut dire qu'un vrai modèle de données partagé (base de données réelle, schéma canonique) reste **entièrement à construire**, pas à « nettoyer ».
3. **Aucune sécurité réelle.** Le code d'accès « Gérant » (`GERANT_PIN`) est une constante en clair dans le JS, visible par quiconque ouvre les outils de développement du navigateur — le prototype le signale lui-même comme *« un filtre d'affichage côté client, pas une garantie de sécurité »*. Une vraie authentification (comptes, mots de passe/SSO, séparation des rôles côté serveur) reste à construire.
4. **Aucun import, aucune intégration Stripe.** Ni l'import CSV/Excel d'une caisse existante, ni une intégration de paiement Stripe n'existent dans le prototype — ce sont des fonctionnalités entièrement neuves à concevoir et construire, pas des fonctionnalités à activer.

**Conclusion pour Claude Code** : ce n'est pas un « nettoyage » du prototype existant, ni un simple retrait des données de démo. C'est une **reconstruction en vraie application (backend + base de données + auth + import)**, en utilisant le prototype comme spécification fonctionnelle/visuelle fidèle de ce que chaque écran doit calculer et afficher — pas comme code à copier tel quel.

## 4. Le point bloquant identifié le 2026-09-28

Le module **Config produits** n'a, à ce jour, **aucun bouton « ajouter un produit »** : seuls les produits déjà présents dans le jeu de démonstration sont éditables (prix, coût, recette). Or l'exigence de Rémi est que le directeur **construise son catalogue de zéro**. C'est donc un prérequis structurant, pas une fonctionnalité secondaire : sans elle, un lieu qui démarre à vide ne peut rien vendre dans l'application.

Un écran équivalent existe déjà pour les stands et les caisses (« Gestion des stands & caisses », ajouté le 2026-09-28, §15.88 du dossier) — même logique à reproduire pour les produits : ajouter, éditer, retirer un produit par stand, avec son prix et son coût matière si le directeur veut le suivi de marge.

## 5. Périmètre — révisé le 2026-09-28 après §2

Cette liste est une proposition déduite des échanges avec Rémi, **pas une décision actée point par point** — à faire confirmer avant de coder chaque brique, surtout celles marquées « à trancher ».

**Dans le périmètre, à construire avec de vraies données (sans démo)** :
- Configuration : Config produits (+ ajout de produit à construire, §4), Click & Collect, Configuration cible & marge, Coûts par buvette, Gestion des stands & caisses.
- Stock, Personnel et planning.
- Dashboard : Ventes & CA et Gestion financière.
- Marges & ratios, Optimisation, Centre d'alertes, Reporting de soirée.
- **Ma caisse / Commande** (création de tickets par la caissière) — **confirmé dans le périmètre le 2026-09-28** (§15.92 du dossier), avec encaissement carte via Stripe. **Ne pas démarrer le développement de cette brique avant la clarification NF525 du §2.**
- Journal des caisses — probablement nécessaire si Ma caisse existe (traçabilité des tickets), mais **pas confirmé explicitement par Rémi** — à reposer avant de le construire.

**Incertain, à trancher avec Rémi avant de coder** :
- Écart de caisse (comptage d'un fond de caisse en espèces) : si le règlement est **uniquement** par carte via Stripe, il n'y a peut-être plus d'espèces à compter dans ce lieu — à vérifier plutôt que supposer.
- Clôtures mensuelle & annuelle : sur les vrais tickets de Ma caisse plutôt que sur un import, du coup — la chaîne de scellement SHA-256 déjà construite dans le prototype devient potentiellement pertinente, sous réserve de la réponse NF525 du §2 (elle avait été pensée précisément pour cet usage).
- Le module Conformité tel que construit (attestation NF525) : redevient directement pertinent maintenant que Ma caisse est dans le périmètre — mais son contenu dépend entièrement de la réponse fiscale du §2, pas à porter tel quel sans cette réponse.
- Fidélité (Programme + Wallet) et Facturation (Break Eat / Rapprochement fournisseur) : pertinence pas encore clarifiée avec Rémi.
- La distinction stand / caisse (numérotation de 9 caisses physiques chez Les Spartiates) reste pertinente maintenant que Ma caisse est confirmée — inchangé par rapport au prototype sur ce point.

**Hors périmètre, clairement** : synchronisation offline, matériel de paiement propre à FlaiX Expert (Stripe fournit son propre terminal), app mobile opératrice — rien dans les échanges avec Rémi n'indique un besoin de fonctionnement hors ligne à ce stade.

## 6. Questions d'architecture à trancher avant d'écrire du code (pas dans le prototype, jamais discutées)

- Backend et base de données : quelle stack, quel hébergement (le dossier, §8, indique "stack technique — à confirmer avec Synertic" : à vérifier si c'est toujours d'actualité).
- Authentification réelle : comptes multi-lieux, rôles (Directeur / Opérateur / éditeur Break Eat), réinitialisation de mot de passe, etc.
- Format exact attendu pour l'import CSV/Excel d'une caisse existante — aucune spécification ne semble exister aujourd'hui (colonnes, encodage, granularité). C'est une brique neuve entière, pas seulement un connecteur.
- Multi-lieux dès le départ, ou un seul lieu (Les Spartiates) d'abord puis généralisation ?
- Environnement de déploiement (test / production), stratégie de migration si le schéma de données évolue.
- **Intégration Stripe pour l'encaissement carte** (§2) : quel produit Stripe précisément (Stripe Terminal avec lecteur physique ? Stripe Checkout/liens de paiement ? autre) — non précisé par Rémi à ce stade, à clarifier avant de coder cette brique. Dépend aussi de la réponse NF525 du §2 : si une certification s'avère nécessaire, elle peut contraindre le choix technique (traçabilité, inaltérabilité des tickets).

## 7. Méthode à conserver

Le projet a été mené module par module, avec une règle constante qui a bien fonctionné et qu'il est recommandé de garder en production : **décision écrite avant code, lecture complète du module concerné avant de le modifier, vérification (tests + revue visuelle) après chaque changement, jamais de donnée inventée ou de chiffre non confirmé par Rémi ou une source fiable**. Le dossier `flaix-gestion-dossier-projet.md` documente cette méthode en détail (§11) et l'historique complet des décisions déjà actées — à lire avant de commencer, pas seulement ce brief.

## 8. Ce qui n'est pas tranché dans ce document

Ce brief n'a pas vocation à choisir la stack technique, le nom de domaine, l'ordre exact des modules à construire, ni le format d'import. Ce sont des décisions à prendre avec Rémi, une par une, suivant la méthode ci-dessus — ce document sert à cadrer le point de départ (périmètre réel du §2, zéro démo, état réel du prototype), pas à s'y substituer.
