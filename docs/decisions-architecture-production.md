# FlaiX Expert — Décisions d'architecture pour la production

**Statut** : proposition du 2026-09-28, rédigée par Claude Code après lecture intégrale du dossier projet (§0 à §15.92), du brief de production, du cadrage de périmètre et de la grille de test terrain. **À valider par Rémi avant la première ligne de code métier** (règle « décision écrite avant code »). Les décisions validées sont reportées au § 10.

---

## 1. La réponse courte : oui, il faut un backend — ce n'est pas une option

Le prototype est un fichier HTML sans serveur : rien n'est enregistré, tout disparaît au rechargement, et n'importe qui peut lire marges et salaires dans les outils du navigateur (§15.50, §15.91). Pour la production, un backend (un serveur + une base de données) est indispensable, pour six raisons déjà écrites dans le dossier :

| Besoin | Pourquoi un navigateur seul ne peut pas le faire | Réf. dossier |
|---|---|---|
| Conserver les données | 6 ans de tickets ligne à ligne, clôtures, compteurs | §15.4 |
| Inaltérabilité réelle | L'interdiction de modifier ou supprimer un ticket doit être imposée par la base elle-même (droits SQL), pas par l'écran | §15.2, tests A1/A2 |
| Numérotation sans trou ni doublon | Un numéro de ticket attribué par le serveur, avec contrainte d'unicité en base | §15.12, test A8 |
| Confidentialité par rôle | Un opérateur ne doit jamais *recevoir* les marges, coûts et salaires — pas seulement ne pas les voir | §15.50 |
| Isolation entre lieux | Chaque lieu est un assujetti distinct ; ses données ne sont jamais visibles d'un autre lieu | §15.12 |
| Paiements (plus tard) | Si un lieu choisit un jour un terminal piloté par la caisse, les confirmations de paiement arriveront sur un serveur. *(Depuis le 2026-09-29, la carte passe par le TPE du lieu, non relié : § 6.)* | §15.17 |

S'y ajoute le défaut structurel relevé en §15.91 : dans le prototype, chaque module a sa propre chaîne de tickets et son propre jeu de données. En production il y a **un seul journal**, et tous les écrans (Journal, Ventes & CA, Clôtures, Marges…) le lisent.

---

## 2. « Back-office + base de contrôle » : trois choses différentes

La demande du 2026-09-28 (« un back-office de gestion d'options et de configurations pour chaque lieu, et une base de données où remonter tous les tickets et le CA archivés en cas de contrôle ») recouvre trois choses. Le dossier a déjà tracé la frontière (§15.13, §15.15) ; elle est maintenue ici parce qu'elle protège Break Eat.

**A. L'espace du lieu** — le directeur configure ses stands, caisses, produits, prix, stocks, personnel. C'est l'application elle-même. Chaque lieu a le sien, vide au départ.

**B. Le back-office éditeur Break Eat** — créer un lieu, activer ses modules, régler son contrat (abonnement, commission), voir quelle version il utilise, s'il a clôturé ses journées et archivé ses exercices, si sa chaîne d'intégrité est intacte, quelles attestations réémettre après une version majeure. Application séparée, connexion séparée avec double authentification.
- **Niveau 1, permanent** : aucune donnée de vente, aucun montant, aucun nom de salarié.
- **Niveau 2, sur autorisation** : lecture seule des données d'un lieu, **uniquement si le lieu l'ouvre lui-même** depuis son écran, limitée dans le temps, chaque consultation inscrite dans *son* journal.
- **Jamais** : aucun compte Break Eat ne peut modifier ou supprimer un ticket, même techniquement (droits SQL, test B6).

**C. La base des tickets et du CA archivés** — elle existe : base de production (exercice en cours + 2 précédents en ligne), **une archive scellée par exercice** conservée 6 ans (format ouvert, notice en français, empreintes — §15.15/§15.16), et des sauvegardes techniques, qui ne sont **pas** des archives (§15.10). **En cas de contrôle, c'est le lieu qui produit ses données depuis son propre compte** (export, ou compte vérificateur temporaire qu'il crée en un clic), pas Break Eat depuis son back-office.

Pourquoi « un back-office où Break Eat voit tous les tickets et le CA de tous les lieux » n'est pas recommandé :
1. Le contrôlé, c'est le lieu. L'obligation de l'éditeur (LPF art. L96 J) porte sur **le code, les traitements et la documentation**, pas sur les données des clients.
2. Un éditeur qui peut techniquement toucher aux journaux de ses clients affaiblit ce que son attestation affirme (CGI art. 1770 undecies : 15 % du CA tiré du logiciel sur 6 ans + solidarité de paiement).
3. Commercialement, un directeur qui apprend que son prestataire — qui prend une commission sur le Click & Collect — voit en continu son CA comptoir, ses marges et l'activité de ses salariés a une objection légitime. Et au titre du RGPD, Break Eat deviendrait responsable de ces données.

Si Break Eat est contrôlé **en tant qu'éditeur**, il présente le code source de chaque version livrée (conservé jusqu'à 3 ans après la fin de sa diffusion), le registre des versions, le dossier de conformité et les attestations émises. Le dépôt Git (§ 8 point 9) sert précisément à ça.

---

## 3. Architecture proposée

```
            ┌──────────────────────────── Hébergement en France ────────────────────────────┐
 Tablette caisse ──┐                                                                        │
 (navigateur)      │      ┌────────────────┐        ┌─────────────────────────────────┐     │
 Poste directeur ──┼────► │ API (serveur)  │ ─────► │ PostgreSQL                       │     │
 (navigateur)      │      │ droits, règles,│        │ • paramétrage (historisé)        │     │
 Back-office ──────┘      │ calculs        │        │ • journal en écriture seule,     │     │
 éditeur (app séparée)    └───────┬────────┘        │   chaîné par empreinte           │     │
                                  │                 └─────────────────────────────────┘     │
                  Stripe ◄────────┘                 ┌─────────────────────────────────┐     │
               (compte du lieu)                     │ Stockage des archives d'exercice │     │
                                                    │ verrouillé (non modifiable)      │     │
                                                    └─────────────────────────────────┘     │
            └───────────────────────────────────────────────────────────────────────────────┘
```

| Brique | Choix | Pourquoi |
|---|---|---|
| Langage | TypeScript partout | Conforme §8 ; mêmes types et même moteur de calcul côté serveur et côté écran |
| Écrans | React + Vite — une application web : espace directeur + écran caisse sur tablette | Pas besoin d'app native tant que le hors-ligne est hors périmètre (brief §5) ; une tablette avec un navigateur suffit |
| Serveur | Node.js + Fastify | Plus léger que NestJS (prévu au §8 quand Synertic devait intervenir). Rémi est seul responsable du code (§15.10) : moins de couches = plus facile à relire et à auditer |
| Base | PostgreSQL | Droits par table (INSERT/SELECT seulement sur le journal), contraintes d'unicité, transactions — ce que §15.2 exige |
| Schéma | Migrations SQL versionnées | Le schéma devient une pièce lisible du dossier de conformité (section 3 du plan §15.14) |
| Moteur de calcul | Paquet séparé, testé, reprenant le cahier des formules | « Le code calcule » (§3) ; chaque formule a ses tests avec les exemples vérifiés du dossier |
| Hébergement | France (décidé §15.10) — candidats : Scaleway, OVHcloud, Clever Cloud | Choix final avant la mise en ligne ; d'ici là tout tourne en local (Docker) |

Organisation du code (un seul dépôt) :

```
flaix-expert/
├── apps/web          écrans directeur + caisse
├── apps/api          serveur
├── apps/editeur      back-office Break Eat (plus tard, §15.13)
├── packages/domain   types du modèle canonique + moteur de calcul testé
├── db/migrations     schéma SQL versionné
└── docs/             dossier projet, brief, décisions, conformité
```

---

## 4. Modèle de données — les principes qui ne se rattrapent pas après coup

1. **Multi-lieux dès le premier jour.** Chaque donnée porte son lieu ; un lieu ne voit jamais un autre lieu. Démarrer « un seul lieu » puis généraliser obligerait à reprendre toutes les tables et tous les écrans.
2. **Deux familles de tables.**
   - *Paramétrage* (stands, caisses, produits, prix, TVA, comptes) : modifiable, mais **jamais supprimé** (on désactive), et **les prix sont datés** : un nouveau tarif est une nouvelle ligne avec sa date d'effet ; un ticket garde toujours le prix en vigueur à son horodatage (§15.30, test A9).
   - *Journal* (tickets, annulations, remises, ouvertures et clôtures de caisse, journal technique) : **écriture seule, imposée par la base** — le compte du serveur n'a pas le droit de modifier ni de supprimer — et chaîné par empreinte SHA-256 (§15.2, §15.3).
3. **Les montants sont stockés en centimes entiers**, jamais en nombres à virgule. Le prototype calcule en nombres à virgule flottante, qui produisent des erreurs d'arrondi (en informatique, 0,1 + 0,2 ne vaut pas exactement 0,3). La règle d'arrondi de la TVA (par ligne ou par ticket) est à fixer et à faire valider par l'expert-comptable.
4. **Numérotation par caisse** `2026-C3-004520`, attribuée par le serveur, contrainte d'unicité en base (§15.12). Chaque ticket porte aussi un identifiant unique généré par la tablette, pour qu'un envoi répété (réseau instable) ne crée jamais deux ventes.
5. **Un mode formation marqué « FACTICE »** (obligatoire, BOFiP §150, test B3/B4) : il permet de former une caissière ou de faire une démonstration **sans jamais toucher les vrais compteurs**. C'est la réponse propre à « aucune donnée de démo en production » : la démo existe, séparée et étiquetée, jamais mélangée aux vraies données.
6. **Produit unique au niveau du lieu + liste des stands qui le vendent** — à valider (§ 8 point 5).
7. **Place prévue pour une signature** des enregistrements par une clé conservée hors de la base, en plus du chaînage (§ 8 point 10).

---

## 5. Accès et rôles

| Rôle | Connexion | Accès |
|---|---|---|
| Directeur | e-mail + mot de passe, double authentification recommandée | tout son lieu |
| Opérateur (caissière) | code personnel, sur une tablette **enregistrée** par le directeur comme « caisse n° X » | uniquement sa caisse ; le serveur ne lui envoie jamais marges, coûts ni salaires |
| Vérificateur | compte temporaire créé par le directeur, lecture seule, période et durée limitées | ce que le directeur a ouvert ; chaque connexion journalisée (§15.12 voie B) |
| Éditeur Break Eat | application séparée, double authentification | niveau 1 sans montants ; niveau 2 sur autorisation du lieu (§ 2 B) |

Toute connexion, ouverture et fermeture de caisse est inscrite au journal technique (§15.11, test B1). Un code personnel sur tablette enregistrée est plus rapide qu'un e-mail + mot de passe à chaque prise de poste, tout en identifiant chaque personne (BOFiP §130).

---

## 6. Stripe — ~~décision ouverte~~ sans objet pour la caisse (corrigé le 2026-09-29)

> **Précision de Rémi du 2026-09-29** : *« mon système d'encaissement ne fait aucun encaissement via Stripe. Je ne gère pas les encaissements. Tout est fait sur un TPE à eux. »* Le paiement carte se fait sur le **TPE bancaire du lieu, non relié** au logiciel ; la caissière indique « carte » une fois le paiement accepté. C'est la situation « V1 caisse » déjà décrite au dossier (§7) : le risque « validé sans être payé » se couvre par un **rapprochement du total carte de chaque caisse avec le ticket de fin de journée du TPE**, proposé dans le module Clôtures (§15.95). Stripe ne concerne plus que le Click & Collect de l'application Break Eat. Le texte ci-dessous est conservé pour mémoire, pour le jour où un lieu voudrait un TPE piloté par la caisse.

*Recommandation d'origine (pour mémoire) :*

Recommandation, à confirmer auprès de Stripe :
- **Lecteur Stripe piloté par la caisse** : le montant part de FlaiX Expert vers le lecteur, la confirmation revient automatiquement dans le ticket. Un terminal Stripe séparé, sur lequel la caissière retape le montant, recrée le risque « validé sans être payé » et supprime le rapprochement automatique (§15.9 point 5, §15.17 A).
- **Connexion au compte Stripe du lieu via Stripe Connect** : le lieu autorise FlaiX Expert depuis son propre compte Stripe et peut révoquer à tout moment, au lieu que Break Eat stocke ses clés d'accès (§15.17 B point 3). L'argent reste sur le compte du lieu ; rien ne transite par Break Eat (décision §15.17 B conservée telle quelle).
- Aucune donnée de carte ne passe ni n'est stockée chez nous : seule la référence de transaction (§15.17 C, test E7).

---

## 7. Phasage proposé

| Phase | Contenu | Commentaire |
|---|---|---|
| **0 — Socle** | dépôt, base, serveur, connexion, lieux, journal technique, moteur de calcul testé | tout le reste en dépend |
| **1 — Configuration d'un lieu vide** | identité du lieu (raison sociale, SIRET, n° TVA, adresse — mentions du ticket), stands, caisses, produits **avec bouton d'ajout**, TVA, prix datés, comptes | débloque tout (brief §4) |
| **2 — Ma caisse + Journal** | tickets, remises et offerts avec motif, tarif abonné, ouverture et clôture de caisse, Z journalier, journal consolidé, mode formation | **se développe dès maintenant ; mise en service réelle seulement après la réponse écrite de l'expert-comptable** (`questions-expert-comptable.md`) |
| ~~**3 — Stripe**~~ | ~~lecteur, rapprochement journal / Stripe~~ | **retiré le 2026-09-29** : paiement carte sur le TPE du lieu (§ 6) ; le rapprochement carte / TPE rejoint le module Clôtures |
| **4 — Dashboard** | Ventes & CA, Gestion financière, clôtures mensuelle et annuelle, archive d'exercice | lit le journal |
| **5 — Stock, Personnel & planning** | | |
| **6 — Clôture & pilotage** | marges, optimisation, alertes, reporting de soirée, coûts par buvette | n'a de sens qu'avec de vraies ventes |
| **7 — Plus tard** | fidélité, wallet, facturation Break Eat et fournisseur, connecteur Click & Collect, back-office éditeur complet | règle anti-dérive du périmètre |

Chaque phase suit la méthode du projet : décision écrite → code → tests → validation visuelle par Rémi → phase suivante.

---

## 8. Ce qui est fragile aujourd'hui — par ordre d'importance

1. **La question NF525 n'a jamais été posée par écrit.** Le logiciel enregistre chaque vente et son mode de règlement : c'est la fonction visée par l'article 286, même si le paiement carte passe par le TPE bancaire du lieu. La dispense du BOFiP §35-37 (paiements exclusivement par l'intermédiaire d'un établissement de crédit) pourrait concerner un lieu 100 % carte sur TPE bancaire, mais le texte ne vise pas explicitement ce cas. *(Ma remarque du 28/09 sur le statut de Stripe est sans objet depuis le 29/09 : la caisse n'utilise pas Stripe.)* Ce n'est pas une conclusion juridique : c'est la question à poser. Liste prête à envoyer : `questions-expert-comptable.md`.
2. **Le ticket client.** Si une buvette relève de l'exception hôtellerie-restauration (§15.18), le ticket doit être émis par défaut. Une tablette sans imprimante ne le permet pas : il faut soit une imprimante par caisse (du matériel, alors que le brief l'exclut), soit un ticket dématérialisé (consentement explicite, et l'impression ne peut jamais être refusée). À trancher avant d'acheter le matériel.
3. **Le réseau du stade.** Le brief exclut le hors-ligne. Mais un stade à la mi-temps sature souvent le réseau. Sans réseau : pas de ticket, donc une vente perdue ou notée sur papier — un trou dans le journal. Le paiement carte a de toute façon besoin du réseau. Recommandation : **tester le réseau réel de la patinoire un soir de match** avant de trancher. Le schéma prévoit dès maintenant ce qui permettra d'ajouter un mode dégradé plus tard sans reprise de données (numéro par caisse, identifiant unique par ticket).
4. **La dispersion.** Le prototype compte une vingtaine de modules. Reconstruits avec une vraie base, une vraie sécurité et des tests, c'est plusieurs mois. Le vrai risque : arriver au premier match avec 20 modules à moitié finis au lieu de 5 solides. D'où le phasage du § 7 — Fidélité, Wallet et Facturation (ajoutés au périmètre le 12/09) passent en dernier.
5. **Le modèle produit du prototype fusionné.** Ses 25 lignes contiennent trois « Hot dog » (un par stand), chacun avec son propre prix, son historique et sa marge. Le dossier avait décidé l'inverse (§3 et §5, 07/09) : un produit = une référence au niveau du lieu, un prix unique, et la liste des stands qui le vendent. Avec trois hot-dogs distincts : trois prix qui peuvent diverger sans le vouloir, trois marges, un stock qui ne se consolide pas. Recommandation : revenir au modèle du dossier, avec la possibilité d'ajouter plus tard un prix propre à un stand si un lieu en a réellement besoin.
6. **La TVA à 5,5 % sur les boissons.** La grille confirmée pour les Spartiates reste douteuse pour une consommation sur place (§6, §15.35). En production le logiciel ne choisit plus : le directeur saisit le taux de chaque produit. Mais un mauvais taux fausse la TVA collectée de toute une saison — la question figure dans la liste pour l'expert-comptable.
7. **Espèces : oui ou non ?** Jamais confirmé (brief §5). Une seule caisse qui prend des espèces place tout le lieu dans le champ du NF525 (tolérance zéro, §15.1), et décide si le module « Écart de caisse » (comptage du tiroir) existe.
8. **Des pièces de référence manquent dans ce dossier** : le cahier des formules (§15.34), l'archive de référence `archive-2025-2026-L001.zip` avec `verifier_chaine.py` (§15.16, qui « tient lieu de spécification » du format d'archive), les prototypes isolés de chaque module, et le logo (le dossier `logo/` est vide). Le prototype fusionné a lui-même perdu une partie des modules validés (§15.39 à §15.60) : les prototypes isolés restent la meilleure référence.
9. **Le projet n'est pas versionné et vit dans OneDrive.** L'article L96 J du LPF impose de pouvoir restituer le code source de chaque version livrée. Un dépôt Git avec une étiquette par version, sauvegardé hors de l'ordinateur (dépôt privé), y répond — à condition de le faire dès le premier jour. Par ailleurs OneDrive synchronise mal les projets de code (des centaines de milliers de petits fichiers, fichiers verrouillés pendant la synchronisation) : le dépôt de code doit vivre hors OneDrive.
10. **Chaînage seul, sans signature** (choix du §15.26). Admis par le BOFiP, mais quelqu'un qui détient le code peut recalculer toute la chaîne. Ajouter une signature par une clé conservée hors de la base coûte peu si c'est prévu maintenant, beaucoup après la première saison. Le schéma lui réserve sa place ; l'activation reste la décision de Rémi.
11. **Break Eat SAS ou Break Eat App SASU ?** Le dossier indique « Break Eat App SASU, SIREN 925 187 395 » (§2) ; le brief et CLAUDE.md disent « Break Eat SAS ». Le nom exact de l'éditeur figurera sur chaque attestation.

---

## 9. Décisions prises par défaut (modifiables sur simple demande)

- Multi-lieux dès le départ (§ 4.1).
- Montants en centimes entiers (§ 4.3).
- Mode formation « FACTICE » séparé des vraies données (§ 4.5).
- Place réservée pour la signature des enregistrements (§ 4.7).
- Opérateurs : code personnel sur tablette enregistrée (§ 5).
- Hébergement en France, hébergeur choisi avant la première mise en ligne ; développement en local d'ici là.

---

## 10. Décisions validées par Rémi

Validées le 2026-09-28 (questions posées une par une, réponses de Rémi) :

| # | Décision | Choix de Rémi |
|---|---|---|
| 1 | Base technique | **Serveur Node.js/TypeScript (Fastify) + PostgreSQL**, application web React pour le directeur et la caisse sur tablette, hébergement en France choisi avant la mise en ligne (§ 3) |
| 2 | Accès de Break Eat aux données des lieux | **Sans montants par défaut, lecture seule sur autorisation du lieu**, limitée dans le temps et tracée ; en contrôle, le lieu exporte depuis son compte (§ 2 B, confirme §15.13) |
| 3 | Modèle produit | **Une fiche produit au niveau du lieu, un prix, un historique ; le directeur coche les stands qui le vendent** (§ 8 point 5, retour au modèle §3/§5 du dossier) |
| 4 | Dépôt de code | **`C:\Users\notta\dev\flaix-expert`, hors OneDrive, versionné avec Git** ; ce dépôt devient la référence pour CLAUDE.md et `docs/`, le dossier OneDrive reste intact comme archive |

Validées le 2026-09-28, suite :

| # | Décision | Choix de Rémi |
|---|---|---|
| 5 | Dépôt GitHub | Privé, dans l'organisation **Break-Eat-APP** (`Break-Eat-APP/flaix-expert`), à côté de `breakeat-admin`. Garde-fou d'envoi : aucun envoi possible vers un autre dépôt (`.githooks/pre-push`) |
| 6 | Hébergement | **Serveur et écrans en France, chez le même hébergeur** (pas Vercel). Break Eat reste sur Vercel/Railway : produits distincts, hébergements distincts |
| 7 | Version test | **VPS OVHcloud VPS-1** (≈ 4,57 € TTC/mois relevé le 2026-09-28), application + PostgreSQL sur le même serveur, base de test séparée de la future production. Production ensuite sur base gérée avec sauvegardes (Clever Cloud exclu : sa base n'autorise pas la création du rôle restreint `flaix_app`, vérifié dans sa documentation ; Scaleway l'autorise) |
| 8 | Contenu de la version test | **Le logiciel complet** (tous les modules validés du prototype), construit dans l'ordre des dépendances, chaque module relu en entier dans son prototype validé avant d'être construit, et déployé sur le serveur de test dès qu'il est prêt |
| 9 | Qui tape les ventes en test | **Le directeur lui-même** peut ouvrir n'importe quelle caisse ; chaque ticket porte le nom de qui l'a saisi |

Les décisions par défaut du § 9 restent en vigueur tant que Rémi ne les modifie pas.

---

## 11. Décisions encore ouvertes, avec leur échéance

| Décision | Avant quelle phase |
|---|---|
| Réponse écrite de l'expert-comptable (NF525, TVA, ticket) | mise en service de Ma caisse (phase 2) |
| ~~Produit Stripe~~ | sans objet depuis le 2026-09-29 (§ 6) |
| Hébergeur en France | première mise en ligne |
| Ticket papier ou dématérialisé (§ 8 point 2) | achat du matériel |
| Hors-ligne (§ 8 point 3) | après le test réseau à la patinoire |

---

## 12. Écarts signalés par rapport au dossier, dans le code livré le 2026-09-28

Conformément à la règle « ne jamais s'écarter d'une décision sans le signaler » :

1. **Formule de scellement du journal technique** (§15.16 : `horodatage, type, lieu_id, stand_id, caisse_id, operateur_id`). Le code scelle en plus le **numéro d'ordre** et le **contenu détaillé** de l'événement (sérialisé de façon canonique), et échappe les caractères `|` et `\` à l'intérieur d'un champ. Raison : une chaîne qui ne couvre pas le contenu ne prouve pas que le contenu est intact (on pourrait changer « 7,00 € » en « 5,00 € » dans un changement de tarif sans casser la chaîne). Sans `|` ni `\` dans les champs, le calcul reste identique à la formule du §15.16 (vérifié par un test). Formule : `packages/domain/src/journal-technique.ts`.
2. **Nouvel écran « Identité du lieu »** dans Configuration (raison sociale, SIRET, n° de TVA, adresse). Absent du prototype ; nécessaire parce que ces mentions sont obligatoires sur le ticket (BOFiP §50) et sur l'attestation.
3. **Entrée « Démarrage du lieu »** en tête du menu : liste des étapes restantes pour un lieu qui part de zéro. Absente du menu validé au §15.81 ; à garder ou retirer selon l'avis de Rémi.
4. **Catégories de produits** : table propre au lieu, créée et nommée par le directeur (aucune catégorie préchargée). Le prototype utilisait la grille TVA (food / boisson / sucré / bière) comme catégorie ; en production, catégorie et taux de TVA sont deux réglages distincts du produit.
5. **Taux de TVA non présélectionné** à la création d'un produit : le directeur doit le choisir (question 5 de `questions-expert-comptable.md`).

## 13. Incident de poste de travail — Docker Desktop (2026-09-28)

Docker Desktop plantait au démarrage : des fichiers de communication (« sockets » Unix sous Windows) laissés par une session du 21/09 (`%LOCALAPPDATA%\Docker\run\…`, `%LOCALAPPDATA%\docker-secrets-engine\engine.sock`) ne pouvaient plus être supprimés, **y compris un fichier que Docker venait lui-même de créer**. Le problème vient donc de Windows ou d'un filtre du système (l'antivirus Bitdefender installé sur le poste est un suspect plausible, **non vérifié**), pas de FlaiX Expert.

Contournement appliqué : les dossiers concernés ont été renommés (`run.ancien-…`, `docker-secrets-engine.ancien-…`, rien n'a été supprimé), Docker les recrée au démarrage. **Le problème peut revenir au prochain redémarrage de Docker.** À essayer dans l'ordre : redémarrer l'ordinateur ; si le plantage revient, vérifier si Bitdefender bloque les fichiers de `%LOCALAPPDATA%\Docker` (réglage de sécurité : à faire par Rémi lui-même). Ne jamais cliquer « Reset to factory defaults » dans la fenêtre d'erreur de Docker sans nécessité : cela efface aussi la base de développement locale.
