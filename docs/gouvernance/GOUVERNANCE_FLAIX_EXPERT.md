# FlaiX Expert — gouvernance du développement

## Règles permanentes de développement, documentation, sécurité et passation

**Version :** 1.0
**Date :** 12 novembre 2026
**Statut :** document de gouvernance technique de FlaiX Expert. Adapté, à la demande de Rémi (2026-11-12), de sa
« Master Engineering Governance » du 11 novembre 2026 : mêmes règles et même structure, appliquées à FlaiX Expert
(caisse et outil de gestion des buvettes). **À valider par Rémi.**
**Concerne :** Claude Code, Codex, Cursor et tout futur agent ou développeur humain.
**Produit :** FlaiX Expert — éditeur et hébergeur Break Eat App (fondateur Rémi Notta) ; marque affichée à l'écran :
FlaiX Expert.

> Ce document ne remplace pas les documents déjà en place : il fixe les règles et renvoie, pour chaque sujet, au fichier
> du dépôt qui le tient (voir § 2.2). Les règles marquées **[proposée]** ne sont pas encore des décisions de Rémi ; ce qui
> n'est pas connu est marqué **À confirmer**, jamais inventé.

---

# SOMMAIRE

1. Objet et principes non négociables
2. Sources de vérité et hiérarchie documentaire
3. Rôle des agents IA et des développeurs
4. Workflow obligatoire avant chaque tâche
5. Cycle de développement et phases
6. Documentation obligatoire après chaque tâche
7. Document technique central
8. Historique des changements, versions et mises en ligne
9. Bugs, incidents et problèmes récurrents
10. Architecture, qualité et règles de code
11. Règles critiques FlaiX Expert : ventes, caisse et journaux
12. Sécurité applicative
13. Données, base de données et migrations
14. Tests, validation et revue de code
15. Git, commits et protection contre les régressions
16. Mise en ligne, surveillance, sauvegardes et retour arrière
17. Dépendances et secrets
18. Passation à un nouveau développeur
19. Structure documentaire
20. Modèles
21. Consigne permanente pour Claude Code
22. Checklist de fin de tâche
23. Procédure d'urgence en cas de bug en production
24. Mise à jour de cette gouvernance
25. Sources et statut des règles

---

# 1. OBJET ET PRINCIPES NON NÉGOCIABLES

## 1.1 Objectif

Ce document est la constitution technique de FlaiX Expert. Toute personne — développeur, prestataire, auditeur ou agent
IA — doit pouvoir comprendre avec lui et les documents qu'il cite :

- ce que fait l'application ;
- comment elle est construite ;
- quelles règles métier et fiscales ne doivent jamais être violées ;
- où se trouve chaque fonction ;
- quelles décisions ont été prises, et pourquoi ;
- quelles phases sont terminées, en cours ou bloquées ;
- quels bugs sont connus ;
- comment tester, mettre en ligne et revenir à une version stable.

Le dépôt doit rester compréhensible même si le développeur ou l'agent IA qui a écrit le code n'est plus disponible.

## 1.2 Règles non négociables

1. **Ne jamais perdre une vente.** Une vente validée sur une tablette, même sans réseau, arrive au serveur et y reste.
2. **Ne jamais altérer une vente enregistrée.** Les journaux de caisse et les tarifs sont en écriture seule dans la base ;
   une erreur se corrige par une rectification signée, jamais par une modification ou une suppression.
3. **Chaque opération sensible est traçable** : auteur, date et heure, avant et après (journal technique du lieu).
4. **Aucun accès d'un lieu aux données d'un autre**, ni d'un client à un autre : l'isolement est assuré par la base
   elle-même (sécurité par ligne), pas par l'écran.
5. **Aucune donnée inventée** : ni chiffre, ni loi, ni source. En cas de doute, le dire.
6. **Aucune donnée de démonstration en production** : chaque lieu démarre vide et le directeur construit sa configuration.
7. **FlaiX Expert ne remplit jamais une configuration dont il n'est pas sûr** : quand il ne sait pas, il propose, et le
   directeur choisit (Rémi, 2026-11-12).
8. **Montants en centimes entiers, taux de TVA en points de base** (1 000 = 10 %) : jamais de nombre à virgule pour de
   l'argent.
9. **Décision écrite avant le code** : tout changement de comportement ou de périmètre est écrit (dossier projet ou échange
   avec Rémi) avant d'être codé.
10. **La performance et la stabilité priment sur l'effet visuel** ; l'écran reste simple, compréhensible sans chercher,
    toujours clair (jamais de fond sombre).
11. **La V1 reste simple** : un monorepo, un serveur, une base ; pas de microservices sans décision d'architecture écrite.
12. **Tablette et téléphone d'abord** : chaque écran de caisse et de suivi fonctionne d'abord sur tablette et téléphone.
13. **TypeScript strict**, logique métier écrite une seule fois (dans `packages/domain`), composants réutilisés.
14. **Chaque module optionnel s'active ou se désactive par lieu** (options du lieu, réglées depuis le back-office).
15. **Travailler module par module**, en petites étapes ; ne jamais générer ou modifier toute l'application d'un coup.
16. **Toute action importante est documentée.**

**Indicateurs de fiabilité : zéro vente perdue, zéro rupture des journaux, zéro accès entre lieux.** Ce sont des
objectifs à vérifier par des tests et des contrôles, pas des garanties à affirmer.

## 1.3 Principes complémentaires

- Aucune modification importante sans objectif clairement identifié.
- Aucune modification sans lecture préalable des documents de référence et du code concerné en entier.
- Aucune modification d'architecture implicite.
- Aucun changement de schéma sans migration versionnée.
- Aucun bug connu important ne reste seulement dans une conversation ou dans la mémoire d'un agent.
- Aucune mise en ligne sans tests adaptés au risque.
- Aucune fonction déclarée terminée sans vérification réelle (tests exécutés, contrôle à l'écran).
- Aucune documentation ne prétend qu'une fonction existe si elle n'est pas dans le code.
- Toute information inconnue est marquée « À confirmer ».
- Toute action touchant aux ventes, clôtures, paiements, stocks, accès ou données clients est sensible.
- Sujets fiscaux et juridiques : présenter les faits et les sources, jamais de conclusion définitive ; rappeler quand un
  professionnel (expert-comptable, juriste) doit valider.

---

# 2. SOURCES DE VÉRITÉ ET HIÉRARCHIE DOCUMENTAIRE

## 2.1 Ordre de priorité

En cas de contradiction :

1. Sécurité, obligations légales et fiscales (dossier de conformité, art. 286 I-3° bis du CGI).
2. Décisions validées par Rémi : `docs/flaix-gestion-dossier-projet.md` (§15.x) et
   `docs/decisions-architecture-production.md`.
3. Règles métier écrites dans le dossier projet.
4. Architecture réelle, vérifiée dans le code (`docs/developpement/CARTE_DU_CODE.md`).
5. Avancement et points ouverts (`docs/avancement.md`, `docs/points-a-revoir.md`).
6. Instructions ponctuelles de la tâche, si elles ne contredisent pas ce qui précède.

Une instruction ponctuelle ne supprime jamais silencieusement une règle de sécurité ou une règle métier critique.

## 2.2 Documents de référence (correspondance avec le dépôt)

FlaiX Expert a déjà sa documentation : elle est gardée telle quelle, sans doublon. Correspondance :

| Rôle | Fichier FlaiX Expert | État |
|---|---|---|
| Instructions de Claude Code | `CLAUDE.md` | en place |
| Règles communes aux agents | `AGENTS.md` | en place |
| Vision et périmètre produit | `docs/cadrage/`, `docs/flaix-brief-production-claude-code.md` | en place |
| Architecture | `docs/decisions-architecture-production.md`, `docs/developpement/CARTE_DU_CODE.md` | en place |
| Document technique central | `docs/flaix-gestion-dossier-projet.md`, `docs/developpement/GUIDE_DE_REPRISE.md` | en place |
| Règles de développement | `AGENTS.md`, `CLAUDE.md`, ce document | en place |
| Sécurité | `docs/gouvernance/SECURITE.md` | en place (2026-11-12) |
| Tests | `docs/gouvernance/TESTS.md` | en place (2026-11-12) |
| Feuille de route et statut des phases | `docs/avancement.md`, `docs/points-a-revoir.md`, `docs/developpement/JOURNAL_DES_PHASES.md` | en place |
| Historique des changements | `CHANGELOG.md` (produit automatiquement) | en place |
| Bugs et incidents | `docs/gouvernance/BUGS_ET_INCIDENTS.md` | en place (2026-11-12) |
| Mise en ligne, retour arrière, procédures | `docs/gouvernance/MISE_EN_LIGNE.md`, `docs/guide-serveur-test-ovh.md`, `infra/vps/` | en place (2026-11-12) |
| Décisions d'architecture | `docs/decisions-architecture-production.md` (§ 10 et suivants) | en place |
| Compte rendu de chaque tâche | une section §15.x du dossier projet + la fiche de phase `docs/developpement/phases/` | en place |
| Conformité fiscale | `docs/conformite/dossier-conformite-flaix-expert.md` | en place |
| Audits | `docs/audits/` | en place |
| Variables d'environnement | `.env.example` | en place (2026-11-12) |

---

# 3. RÔLE DES AGENTS IA ET DES DÉVELOPPEURS

## 3.1 Claude Code — architecte et agent principal

Construit : décision écrite → code → tests → vérification à l'écran → documentation → commit → mise en ligne sur le
serveur de test. Il comprend l'existant avant de proposer, respecte les frontières des modules, écrit les tests, signale
les risques et rend compte de chaque tâche. Il agit comme un ingénieur responsable de la qualité du dépôt, pas comme un
générateur pressé de finir.

## 3.2 Codex — audit indépendant

Lit, exécute les tests, cherche les défauts et rend un rapport dans `docs/audits/`
(`docs/developpement/CODEX_AUDIT_PROMPT.md`). **Il ne modifie pas le code sans demande explicite de Rémi**, ne pousse
rien sur GitHub et ne met rien en ligne. Son audit, à chaque grande étape, sert de **validation technique indépendante**.

## 3.3 Cursor, si utilisé

Petites améliorations d'écran et corrections locales, dans le respect de l'architecture, sans toucher au serveur de sa
propre initiative, en documentant ses changements.

## 3.4 Rémi — responsable produit

Valide le produit et les règles métier ; arbitre les changements à risque ; installe lui-même les secrets
(`flaix-admin`) ; garde l'accès aux comptes, au dépôt et au serveur ; décide de la mise en production. Les questions
fiscales et juridiques sont validées par un professionnel (`docs/questions-expert-comptable.md`).

## 3.5 Coordination

Deux agents ne modifient jamais les mêmes fichiers en même temps. Un seul agent est responsable d'une tâche ; les autres
relisent sans écraser.

---

# 4. WORKFLOW OBLIGATOIRE AVANT CHAQUE TÂCHE

## Étape 1 — Comprendre

- Lire `AGENTS.md`, `CLAUDE.md`, `docs/avancement.md` et les sections du dossier projet concernées.
- Lire en entier le code du module à modifier.
- Vérifier les points ouverts (`docs/points-a-revoir.md`) et l'état Git.

## Étape 2 — Diagnostiquer

Reproduire le bug, identifier la cause, distinguer cause confirmée et hypothèse, vérifier si une solution existe déjà.
Corriger la cause, pas seulement le symptôme.

## Étape 3 — Définir le périmètre

Objectif, comportement attendu et actuel, fichiers et données concernés, risques, tests, documents à mettre à jour,
critères d'acceptation, retour arrière si nécessaire. Une tâche reste assez petite pour être relue, testée et annulée seule.

## Étape 4 — Vérifier les prérequis

- Dépôt propre, ou changements existants identifiés ; ne jamais écraser un changement non enregistré.
- Base de test locale disponible (Docker, `docker compose -f infra/docker-compose.yml up -d --wait`).
- Poste à 6 Go de mémoire : serveur local fermé avant les vérifications de types et les tests ; tests du serveur un
  fichier à la fois.
- Secrets présents sans jamais afficher leur valeur.

## Étape 5 — Implémenter

Seulement le périmètre nécessaire, selon les conventions ; pas de refonte non demandée ; pas de dépendance sans
justification ; jamais de contournement d'un refus de la base (il est voulu) ; tests ajoutés ou adaptés.

## Étape 6 — Vérifier

Tests du moteur, du serveur (contre la vraie base) et des écrans ; vérification des types ; construction ; contrôle à
l'écran dans l'application locale quand l'écran change. **Ne jamais écrire « tests passés » sans les avoir exécutés** ;
dire lesquels n'ont pas tourné et pourquoi.

## Étape 7 — Documenter

Voir § 6.

## Étape 8 — Rendre compte

Ce qui a été fait et pourquoi, fichiers, migrations, dépendances, tests réellement exécutés et résultats, risques
restants, documents mis à jour, prochaines étapes — en français simple pour Rémi.

## Étape 9 — Versionner et mettre en ligne

Commit logique et descriptif, puis mise en ligne selon § 16.

---

# 5. CYCLE DE DÉVELOPPEMENT ET PHASES

Les phases de FlaiX Expert sont numérotées (phase 0 à la phase en cours) dans `infra/outils/phases.cjs` ; chacune renvoie
à sa section du dossier projet (§15.x) et à ses commits. La fiche de chaque phase est produite automatiquement dans
`docs/developpement/phases/`.

## 5.1 Contenu d'une phase

Objectif ; périmètre ; règles métier ; architecture et données touchées ; écrans ; sécurité ; tests ; critères
d'acceptation ; vérification ; documentation ; mise en ligne.

## 5.2 États

`À FAIRE` · `EN COURS` · `EN ATTENTE` (d'une décision ou d'un élément de Rémi) · `BLOQUÉE` · `TERMINÉE` ·
`ABANDONNÉE`. Le statut est tenu dans `docs/avancement.md` et `docs/points-a-revoir.md`.

## 5.3 Règle de non-saut

Ne pas commencer une phase qui dépend d'une autre tant que ses prérequis critiques ne sont pas vérifiés. Une exception
est écrite, motivée et acceptée par Rémi.

---

# 6. DOCUMENTATION OBLIGATOIRE APRÈS CHAQUE TÂCHE

## 6.1 Règle centrale

Après chaque tâche, un compte rendu est écrit et les documents concernés — et seulement eux — sont mis à jour.

## 6.2 Le compte rendu : une section §15.x du dossier projet

Chaque tâche ajoute une section numérotée à la fin de `docs/flaix-gestion-dossier-projet.md`, avec :

- la demande de Rémi (citée) et la date ;
- ce qui est fait, et pourquoi ;
- fichiers et migrations ;
- dépendances ajoutées ;
- **tests réellement exécutés (commande → résultat)**, et ceux qui n'ont pas pu l'être ;
- vérification à l'écran ;
- **risques restants** ;
- **mise en ligne et retour arrière** ;
- ce qui reste.

Puis : `docs/avancement.md`, `docs/points-a-revoir.md`, `infra/outils/phases.cjs`, le guide de reprise et la carte du
code si l'architecture ou les migrations changent.

## 6.3 Documents produits automatiquement

Ce qui peut être produit par un programme l'est, pour éviter que deux documents se contredisent :
`node infra/outils/journal-developpement.cjs` (`CHANGELOG.md`, journal des phases, carte du code),
`node infra/outils/phases-word.cjs` (fiches de phase en Markdown et Word), `node infra/outils/guide-word.cjs` (versions
Word). Ces fichiers ne se modifient jamais à la main.

## 6.4 Questions à se poser à chaque tâche

Une règle métier, technique ou de sécurité a-t-elle changé ? Une décision d'architecture a-t-elle été prise ? Un risque
nouveau est-il apparu ? Une procédure de mise en ligne ou de diagnostic a-t-elle changé ? Si oui, mettre à jour le
document correspondant, avec la raison. Pas de règle permanente pour un cas particulier.

---

# 7. DOCUMENT TECHNIQUE CENTRAL

Le dossier projet (`docs/flaix-gestion-dossier-projet.md`) est le carnet de bord : toutes les décisions et leur
raisonnement, une section par phase. Le guide de reprise (`docs/developpement/GUIDE_DE_REPRISE.md`) en est l'entrée pour
un développeur : produit, stack et versions, architecture, dossiers, modules, flux critiques, données, sécurité, tests,
mise en ligne, limites connues, phases. Il porte en tête sa date, la phase et la dernière migration. Il décrit l'état
réel vérifié, jamais une architecture rêvée.

---

# 8. HISTORIQUE DES CHANGEMENTS, VERSIONS ET MISES EN LIGNE

- `CHANGELOG.md` : chaque commit et ses fichiers, produit automatiquement.
- La version en service est inscrite par le serveur (registre des versions de la conformité).
- Chaque mise en ligne laisse : date, commit, migrations appliquées, tests exécutés, résultat du contrôle de santé
  (journal de déploiement et section du dossier).
- Les numéros de version ne s'augmentent pas arbitrairement ; la convention de version de la production est
  **À confirmer** avec le dossier de conformité (version majeure, version mineure).

---

# 9. BUGS, INCIDENTS ET PROBLÈMES RÉCURRENTS

Registre : `docs/gouvernance/BUGS_ET_INCIDENTS.md` (créé le 2026-11-12, avec les bugs corrigés depuis le 2026-10-26).

## 9.1 Fiche d'un bug

Identifiant stable `BUG-2026-NNN` ; date ; environnement (local, test, production) ; version ; module ; gravité ;
priorité ; description ; étapes pour le reproduire ; attendu ; observé ; fréquence ; lieux touchés (sans données
personnelles inutiles) ; éléments de diagnostic sans secret ; cause (confirmée, probable, inconnue) ; correction ; test
de non-régression ; version corrigée ; statut.

## 9.2 Gravité

- `SEV-0` : vente perdue ou altérée, rupture d'un journal de caisse ou de sa chaîne, clôture fiscale fausse, accès aux
  données d'un autre lieu, fuite de données ou de secret.
- `SEV-1` : caisse inutilisable pendant un événement, ventes sans réseau non remontées, clôture impossible.
- `SEV-2` : fonction importante dégradée avec contournement (stock, factures, résultats, fidélité).
- `SEV-3` : anomalie limitée ou d'affichage, sans effet sur les chiffres.
- `SEV-4` : amélioration ou défaut mineur.

La gravité mesure l'impact ; la priorité dépend aussi de l'urgence (un événement en cours, par exemple).

## 9.3 Incident en production

Protéger les ventes et les données ; mesurer l'impact ; stabiliser (option du lieu désactivée, ou retour à la version
précédente) ; conserver les traces ; corriger ; vérifier les ventes, clôtures et stocks touchés ; tester ; écrire la
cause ; ajouter le test de non-régression ; mettre à jour les procédures. Ne jamais masquer à l'écran un problème dont la
cause est dans le serveur ou la base.

## 9.4 Postmortem

Pour `SEV-0`, `SEV-1` et les incidents récurrents, sans recherche de coupable : résumé, chronologie, impact, détection,
cause, facteurs, résolution, actions correctives (qui, quand), prévention.

---

# 10. ARCHITECTURE, QUALITÉ ET RÈGLES DE CODE

## 10.1 Repères

- Monorepo pnpm : `apps/api` (Fastify), `apps/web` (React, Vite), `packages/domain` (moteur de calcul pur, sans accès à la
  base), `db/migrations` (SQL).
- Toute requête métier passe par `base.transaction(contexte(auth), …)` : c'est ce qui active l'isolement des lieux.
- Tout changement de paramétrage s'accompagne d'un `inscrireJet(…)` dans la même transaction.
- Les refus de la base (droits, déclencheurs, contraintes) sont voulus : ne jamais les contourner.
- Toute nouvelle configuration est recopiée en mode formation (`synchroniser_complements_formation`, route dans
  `CONFIGURATION`, test dans `formation-complements.test.ts`).

## 10.2 Principes

Modules séparés ; logique métier à un seul endroit ; composants réutilisés ; contrats explicites (schémas `zod`) ;
erreurs cohérentes et lisibles en français ; fonctions testables ; peu de dépendances ; complexité justifiée par un
besoin réel.

## 10.3 L'existant avant l'idéal

Avant de restructurer : comprendre, repérer les dépendances et les utilisateurs du code, mesurer le risque, avancer par
étapes. Ne pas réécrire ce qui fonctionne parce qu'une autre architecture paraît plus élégante.

## 10.4 Options par lieu (interrupteurs de fonctions)

Un module optionnel est une option du lieu, activée depuis le back-office, avec sa valeur par défaut documentée
(`OPTIONS_LIEU`). Désactiver une option est le premier geste d'urgence (§ 23).

---

# 11. RÈGLES CRITIQUES FLAIX EXPERT : VENTES, CAISSE ET JOURNAUX

Ces règles sont prioritaires : elles concernent le cœur de la caisse et sa conformité.

## 11.1 Ventes et caisse

- Une vente validée ne disparaît jamais.
- Chaque vente a un identifiant stable ; elle est scellée par la tablette qui l'enregistre.
- **Vente sans réseau** : la tablette garde la vente scellée et la renvoie ; le serveur vérifie le sceau et n'accepte
  jamais deux fois la même vente (rejeu sans doublon).
- Une erreur se corrige par une **rectification signée**, jamais par une modification ou une suppression.
- Les clôtures (Z de caisse, du coffre, mensuelle, annuelle, total perpétuel) sont figées une fois faites.
- La base fait foi : un écran « en direct » ne fait qu'afficher, et se recharge depuis le serveur.

## 11.2 Journaux et conformité

- Journal de caisse et journal technique : écriture seule, chaînés, vérifiables (vérification depuis le back-office).
- Tout ce qui touche à l'inaltérabilité, la sécurisation, la conservation et l'archivage des ventes suit le dossier de
  conformité (`docs/conformite/`). La question NF525 reste à trancher avec l'expert-comptable avant la mise en service
  réelle de la caisse.
- **Mode formation** : factice, signalé en permanence à l'écran et sur tout justificatif, jamais mélangé aux vraies ventes.

## 11.3 Autres flux sensibles

- **Stock** : chaque mouvement est tracé ; le coût moyen pondéré se recalcule à chaque livraison.
- **Factures fournisseurs** : à l'import, seul ce qui est sûr est rempli, le reste est proposé ; le total des lignes est
  contrôlé contre le total imprimé ; une facture validée est figée.
- **Caisses connectées** (L'Addition…) : un import se retire en entier s'il est faux ; **la colonne « URL Ticket » n'est
  jamais gardée, répétée ni envoyée**.
- **Fidélité et cartes Wallet** : chaque mouvement de points est tracé (vente, ajustement avec commentaire) ; quand
  l'option est retirée, les cartes installées sont barrées, pas effacées.
- **Click & Collect** : l'application de commande qui encaisse (Stripe) reste maître de ses commandes ; FlaiX Expert en
  reçoit les ventes et ne les modifie pas.

---

# 12. SÉCURITÉ APPLICATIVE

La sécurité fait partie de chaque tâche, pas d'une étape finale.

## 12.1 Authentification

Mots de passe hachés (argon2), jamais stockés ni affichés en clair ; mot de passe provisoire à changer à la première
connexion ; sessions dans un cookie inaccessible aux scripts de la page (`httpOnly`), révocables ; caissières par code
sur une tablette enregistrée ; comptes éditeur séparés (autre cookie).

## 12.2 Autorisation

Moindre privilège ; droits vérifiés par le serveur et par la base pour chaque ressource ; un bouton masqué n'est jamais
une protection ; isolement par lieu dans PostgreSQL ; **chaque accès direct par identifiant à la ressource d'un autre lieu
est testé** (tests marqués [F]).

## 12.3 Secrets

Aucun secret dans Git, dans l'écran, dans les journaux ni dans une conversation avec un agent. **Rémi installe lui-même
chaque clé sur le serveur** (`sudo flaix-admin …`) ; les agents ne voient ni ne manipulent jamais une clé. Un secret exposé
est changé immédiatement.

## 12.4 Points d'entrée du serveur

Limitation du nombre de tentatives sur les connexions et les points sensibles ; validation stricte des entrées ; contrôle
de l'origine des requêtes ; messages d'erreur sans détail interne ; taille des fichiers limitée.

## 12.5 Données et confidentialité

Le minimum nécessaire ; pas de données personnelles dans les journaux ; **aucune donnée réelle de client ou de tiers dans
le dépôt ni dans les tests** (les tests utilisent des données fictives) ; à la mise en production, base neuve et seule la
configuration reprise ; sous-traitants (OVHcloud, Brevo, Apple, Google, Mistral) listés dans le dossier de conformité.

## 12.6 Intelligence artificielle

- L'assistant est en lecture seule et ne s'active que si l'option du lieu est activée.
- Une facture PDF fabriquée par un logiciel est lue **dans le navigateur, sans IA** ; seules les factures scannées
  passeront par Mistral, une fois la clé installée par Rémi.
- Ce qui est envoyé à un fournisseur d'IA est limité à ce qui est nécessaire ; l'offre retenue ne doit pas utiliser les
  données pour entraîner ses modèles.
- Aucun agent de développement n'a accès à la base de production ni à ses journaux.

## 12.7 Journalisation

Connexions et refus, rôles, opérations du back-office, paramétrages, ventes et rectifications, clôtures, stock,
factures, copies de catalogue, imports. Jamais de mot de passe, de jeton ou de secret.

## 12.8 Dépendances

Voir § 17.

---

# 13. DONNÉES, BASE DE DONNÉES ET MIGRATIONS

## 13.1 Migrations

- Tout changement de schéma passe par une migration numérotée dans `db/migrations/`.
- **Une migration appliquée — même seulement en local — ne se modifie jamais** : on en écrit une nouvelle (le serveur
  contrôle l'empreinte de chaque migration). Leçon du 2026-11-12 : la 0062, corrigée après son passage en local, avant
  toute mise en ligne.
- Pas de suppression de colonne sans analyse des usages ; pas de migration destructive sans sauvegarde et plan de retour.
- Une contrainte nouvelle sur des données existantes se pose « non validée » puis se valide après contrôle, sans toucher
  aux pièces figées (exemple : migration 0059).

## 13.2 Données de production

Aucune suppression directe de données de production ; aucun accès des agents à la base de production ; aucune copie de
données de production sur un poste ou un environnement non sécurisé.

## 13.3 Intégrité

Contraintes de la base pour les invariants (clés composées avec le lieu, plafonds, écriture seule) ; transactions pour
les opérations atomiques ; rejeu sans doublon ; heure de Paris explicite ; dates en types date et horodatage.

---

# 14. TESTS, VALIDATION ET REVUE

## 14.1 Ce qui est testé

- Moteur de calcul (`packages/domain`) : calculs, lectures de fichiers, règles.
- Serveur (`apps/api`) contre la vraie base de test : routes, droits, isolement entre lieux, journaux.
- **Tests de conformité** : ils provoquent réellement les fraudes à détecter (modification d'un journal, accès à un autre
  lieu…) et ne passent que si la base les refuse.
- Écrans (`apps/web`) : parcours essentiels.
- Contrôle dans l'application locale quand un écran change.

Les tests qui prouvent un refus sont marqués **[F]**.

## 14.2 Flux à tester en priorité

Vente et rectification ; vente sans réseau et rejeu ; clôtures ; journaux ; isolement des lieux ; mode formation ;
stock ; factures et entrée en réserve ; imports de caisses connectées ; fidélité.

## 14.3 Règles

- Ne jamais modifier un test pour le faire passer. Un test ne change que si le comportement change par décision, et le
  compte rendu le dit.
- Une erreur d'environnement (mémoire, fichier verrouillé) : relancer le fichier seul et le dire.
- Les vrais fichiers de Rémi (factures, exports) servent au contrôle local, jamais de données de test dans le dépôt.

## 14.4 Revue

Avant une mise en ligne : relire le différentiel, chercher ce qui sort du périmètre, les cas limites, les droits, les
migrations, les tests et la documentation. À chaque grande étape : audit de Codex (§ 3.2).

---

# 15. GIT, COMMITS ET PROTECTION CONTRE LES RÉGRESSIONS

- Un commit = une unité logique, au message explicite en français ; commit à chaque étape (le travail peut s'interrompre).
- Avant de créer un commit, regarder ce qu'il contient : aucun fichier sensible, temporaire ou hors sujet ; jamais de
  `.env` ni de clé.
- Pas de réécriture de l'historique partagé.
- Envoi sur GitHub après chaque étape ; quand GitHub demande la connexion de Rémi, il lance
  `git -C "C:\Users\notta\dev\flaix-expert" push`.
- Le dépôt travaille aujourd'hui sur une seule branche (`main`) ; la stratégie de branches pour la production est
  **À confirmer**.

---

# 16. MISE EN LIGNE, SURVEILLANCE, SAUVEGARDES ET RETOUR ARRIÈRE

## 16.1 Environnements

- **Local** : poste de développement, base Docker (`flaix`, et `flaix_test` pour les tests).
- **Test** : `flaixexpert.flaixlabs.com` (OVHcloud), version de test actuelle.
- **Production** : **à créer** au passage en production, avec une base neuve. Garder un serveur de test distinct de la
  production est recommandé ; son coût est **À confirmer** avec Rémi.

## 16.2 Règle de mise en ligne

- **Serveur de test : mise en ligne automatique** après chaque fonction terminée et vérifiée (décision de Rémi,
  2026-11-12), toujours précédée d'une sauvegarde, suivie du contrôle de santé (`/api/sante`).
- **Production : feu vert explicite de Rémi à chaque mise en ligne** [proposée, à confirmer au passage en production].
- Une mise en ligne n'est pas validée parce que le script dit « TERMINÉ » : le contrôle de santé et, au besoin, un
  contrôle à l'écran la valident.

## 16.3 Surveillance

Aujourd'hui : contrôle de santé après chaque mise en ligne, journaux du serveur, vérification des journaux depuis le
back-office. Un outil de suivi des erreurs (type Sentry) est **À confirmer** : il serait un sous-traitant de plus à
déclarer.

## 16.4 Sauvegardes

Sauvegarde quotidienne de la base sur le serveur (14 jours, celle du 1er de chaque mois gardée), plus une avant chaque
mise en ligne ; copie chiffrée hors serveur chez OVHcloud une fois réglée par Rémi (`flaix-admin sauvegarde-externe`,
état **À confirmer**). **Une restauration n'a jamais été testée à ce jour** : à faire avant la production. Une sauvegarde
non restaurée n'est pas une reprise garantie.

## 16.5 Retour arrière

Remettre en ligne l'archive du commit précédent. **Un retour arrière du code n'annule pas une migration** : une migration
déjà passée se corrige par une nouvelle migration, et les données déjà écrites se traitent explicitement. Vérifier après
coup le contrôle de santé et les écrans touchés.

---

# 17. DÉPENDANCES ET SECRETS

- Chaque dépendance ajoutée est justifiée dans le compte rendu : besoin, alternative, maintenance, taille, risque,
  version exacte.
- Préférer une version publiée depuis plusieurs semaines à la toute dernière [proposée] ; seules les dépendances listées
  dans `pnpm-workspace.yaml` (`allowBuilds`) peuvent lancer un script à l'installation.
- `pnpm audit --prod` après toute mise à jour ; une mise à jour majeure ne s'accepte pas sans tests.
- Chaque variable d'environnement est décrite dans `.env.example`, jamais avec sa valeur.
- Un agent ne demande jamais à Rémi de coller un secret dans la conversation.

---

# 18. PASSATION À UN NOUVEAU DÉVELOPPEUR

Le guide de reprise (`docs/developpement/GUIDE_DE_REPRISE.md`, en Markdown et en Word) permet de trouver : lancer le
projet, versions, configuration, architecture, modules, règles métier critiques, ventes et journaux, routes, droits,
tests, mise en ligne, retour arrière, bugs connus, phases terminées, priorités.

## 18.1 Test de passation

À chaque grande étape, une personne qui n'a pas écrit le code suit les documents pour installer le projet, lancer
l'application, exécuter les tests, trouver un module, comprendre la vente et les journaux, trouver un bug connu et mettre
en ligne sur le serveur de test. Si elle doit poser une question essentielle à l'oral, la documentation est incomplète.

---

# 19. STRUCTURE DOCUMENTAIRE

```text
/
├── CLAUDE.md, AGENTS.md, README.md, CHANGELOG.md
├── .env.example
├── docs/
│   ├── README.md                         sommaire de la documentation
│   ├── gouvernance/
│   │   ├── GOUVERNANCE_FLAIX_EXPERT.md   ce document
│   │   ├── BUGS_ET_INCIDENTS.md          registre des bugs et incidents
│   │   ├── SECURITE.md                   contrôles de sécurité en place
│   │   ├── TESTS.md                      stratégie de tests
│   │   └── MISE_EN_LIGNE.md              mise en ligne, sauvegardes, retour arrière
│   ├── flaix-gestion-dossier-projet.md   décisions et comptes rendus (§15.x)
│   ├── decisions-architecture-production.md
│   ├── avancement.md, points-a-revoir.md
│   ├── developpement/                    guide de reprise, carte du code, journal et fiches des phases
│   ├── conformite/                       dossier de conformité de la caisse
│   ├── audits/                           rapports d'audit (Claude, Codex)
│   └── cadrage/, strategie/, maquettes/, marque/, reference/
├── apps/api, apps/web, packages/domain, db/migrations
└── infra/                                Docker local, serveur (infra/vps), outils de documentation
```

Le code n'est jamais déplacé pour suivre une structure documentaire.

---

# 20. MODÈLES

## 20.1 Compte rendu d'une tâche (section du dossier projet)

```markdown
### 15.NNN Titre (AAAA-MM-JJ)

**Contexte** : la demande de Rémi, citée, et ce qu'on a constaté.

**Ce qui est fait** : … (fichiers, migrations, dépendances)

**Vérifié** :
| Test | Commande | Résultat |
|---|---|---|

Contrôle à l'écran : …

**Risques restants** : …

**Mise en ligne et retour arrière** : …

**Reste** : …
```

## 20.2 Bug

```markdown
### BUG-2026-NNN — Titre

- Découvert le : · Environnement : · Version : · Module :
- Gravité : · Priorité : · Statut : OUVERT / EN COURS / CORRIGÉ / VÉRIFIÉ / CLOS

Description · Pour le reproduire · Attendu · Observé · Fréquence et impact · Diagnostic
Cause : confirmée / probable / inconnue · Correction · Test de non-régression · Version corrigée · Liens (§15.x, commit)
```

## 20.3 Décision d'architecture

Une section numérotée dans `docs/decisions-architecture-production.md` : date, statut (proposée, validée, refusée,
remplacée), décideur, contexte, problème, options, décision, raisons, conséquences, risques, plan, documents touchés.

## 20.4 Postmortem

Résumé · impact sur les ventes et les lieux · chronologie · détection · cause · facteurs · résolution · données touchées ·
actions correctives (qui, quand, statut) · tests de prévention · documents mis à jour.

---

# 21. CONSIGNE PERMANENTE POUR CLAUDE CODE

```text
Tu es l'architecte et l'agent principal de FlaiX Expert.

AVANT DE CODER :
1. Lis AGENTS.md, CLAUDE.md, docs/avancement.md et les sections du dossier projet concernées.
2. Lis en entier le code du module à modifier.
3. Regarde l'état Git et les changements non enregistrés.
4. Identifie les règles métier et fiscales, les droits, l'isolement des lieux et les risques.
5. Si le besoin ou la source de vérité est ambigu, demande ou marque « À confirmer ». N'invente rien.

POUR CHAQUE TÂCHE :
1. Périmètre réduit et clair ; plan expliqué avant tout changement important.
2. Pas de refonte hors périmètre sans accord.
3. Préserve les ventes, les journaux et l'isolement des lieux.
4. Pas de dépendance sans justification.
5. Tests ajoutés ou adaptés, réellement exécutés ; dis ceux qui n'ont pas tourné.
6. Contrôle à l'écran quand un écran change.
7. Mise en ligne automatique sur le serveur de test, sauvegarde avant ; production seulement avec le feu vert de Rémi.

APRÈS CHAQUE TÂCHE :
1. Section §15.x du dossier projet (tests commande → résultat, risques, retour arrière).
2. avancement.md, points-a-revoir.md, phases.cjs ; guide de reprise et carte du code si besoin.
3. Registre des bugs si un bug est trouvé ou corrigé.
4. Documents produits automatiquement (journal-developpement, phases-word, guide-word).
5. Commit, envoi sur GitHub.

RÈGLES ABSOLUES :
- Ne jamais perdre ni altérer une vente ; rectification signée seulement.
- Ne jamais casser un journal ni sa chaîne.
- Aucun accès entre lieux ou entre clients.
- Aucun secret dans le code, Git, l'écran, les journaux ou la conversation.
- Aucune autorisation fondée seulement sur l'écran.
- Aucune migration appliquée modifiée ; aucune migration destructive sans sauvegarde.
- Aucune donnée inventée ni de démonstration en production.
- FlaiX Expert propose quand il ne sait pas ; il ne remplit jamais une configuration incertaine.
- Aucun changement non écrit des règles métier.

À LA FIN : fichiers, migrations, dépendances, tests et résultats, risques, documents mis à jour, prochaines étapes, en
français simple pour Rémi. Laisse le dépôt reprenable par un autre développeur.
```

---

# 22. CHECKLIST DE FIN DE TÂCHE

- [ ] Objectif et périmètre respectés ; rien hors périmètre sans raison.
- [ ] Différentiel relu.
- [ ] Règles métier, fiscales et d'isolement respectées.
- [ ] Sécurité et droits vérifiés ; aucun secret ajouté.
- [ ] Tests ajoutés ou adaptés et réellement exécutés ; types vérifiés ; construction faite si l'écran change.
- [ ] Contrôle à l'écran si l'écran change.
- [ ] Migration nouvelle, testée, jamais une migration appliquée modifiée.
- [ ] Mode formation : nouvelle configuration recopiée.
- [ ] Section §15.x écrite ; avancement, points à revoir, phases à jour.
- [ ] Registre des bugs à jour si concerné.
- [ ] Documents automatiques régénérés.
- [ ] Commit, envoi sur GitHub.
- [ ] Sauvegarde, mise en ligne sur le serveur de test, contrôle de santé.
- [ ] Compte rendu présenté à Rémi.

---

# 23. PROCÉDURE D'URGENCE EN CAS DE BUG EN PRODUCTION

1. Ne pas lancer de réécriture.
2. Noter l'environnement, la version et l'heure du début.
3. Évaluer si des ventes, clôtures, stocks ou données sont touchés.
4. Stabiliser : désactiver l'option du lieu concernée depuis le back-office, ou remettre la version précédente (§ 16.5).
5. Conserver journaux et traces, sans secret.
6. Reproduire sur le serveur de test ou en local.
7. Trouver la cause.
8. Correction limitée, avec test de non-régression.
9. Relire le différentiel.
10. Mettre en ligne selon § 16.2.
11. Vérifier le rétablissement.
12. Rapprocher les ventes, clôtures et stocks touchés.
13. Registre des bugs, dossier projet, procédures à jour.
14. Postmortem pour `SEV-0`, `SEV-1` et les incidents récurrents.

**Priorité absolue : l'intégrité des ventes, des journaux et des données.**

---

# 24. MISE À JOUR DE CETTE GOUVERNANCE

Ce document évolue, sans modification opportuniste. On le modifie quand une règle permanente est ajoutée, corrigée ou
devient obsolète, quand une décision change la façon de travailler, ou quand un incident révèle une lacune générale.

Processus : décrire la règle actuelle, le problème, la nouvelle règle, les documents touchés et les conséquences ; faire
valider par Rémi les règles structurantes ; mettre à jour la version et l'historique ci-dessous ; en informer les agents
(`CLAUDE.md`, `AGENTS.md`).

| Version | Date | Modification |
|---|---|---|
| 1.0 | 2026-11-12 | Adaptation à FlaiX Expert de la « Master Engineering Governance » de Rémi du 2026-11-11 : mêmes règles et même structure ; ventes, caisse, journaux et conformité à la place des commandes et du temps réel ; correspondance avec la documentation existante ; décision de mise en ligne automatique sur le serveur de test. |

---

# 25. SOURCES ET STATUT DES RÈGLES

1. **« Master Engineering Governance » de Rémi** (2026-11-11), elle-même issue des « AI Engineering Rules & Master
   Prompts » (2026-05-25) et du « AI Development Workflow & Security Process » (2026-05-19) : workflow, documentation,
   bugs, sécurité, tests, passation, structure de ce document.
2. **Règles déjà en vigueur dans FlaiX Expert** : `CLAUDE.md`, `AGENTS.md`, dossier projet, décisions d'architecture,
   dossier de conformité — reprises ici sans changement de sens.
3. **Décisions de Rémi du 2026-11-12** : mise en ligne automatique sur le serveur de test ; « quand il ne sait pas, il
   doit proposer ».

Les règles marquées [proposée] et les points « À confirmer » attendent la validation de Rémi.

**Appliquée depuis le 2026-11-12** : registres `BUGS_ET_INCIDENTS.md`, `SECURITE.md`, `TESTS.md`, `MISE_EN_LIGNE.md` et
`.env.example` créés. **Reste à faire** : tester une restauration de sauvegarde ; décider de la règle de mise en ligne en
production, du serveur de test séparé et de l'outil de suivi des erreurs.

---

## RÈGLE FINALE

Le code est le produit. La documentation est sa mémoire.

Chaque développement laisse derrière lui un code compréhensible, des tests vérifiables, un historique des changements,
des bugs traçables, des décisions expliquées, une architecture documentée et un projet qu'un autre développeur peut
reprendre.

**Aucune connaissance essentielle de FlaiX Expert ne reste seulement dans la tête d'un développeur, dans une conversation
ou dans la mémoire temporaire d'un agent IA.**
