# Points à revoir avec Rémi

Liste tenue à jour à la fin de chaque séance (dernière mise à jour : 2026-11-13). Chaque point dit **qui** doit agir :
**Rémi** (compte, clé, test, décision) ou **Claude** (développement, une fois la décision prise). Rien de secret ici :
les clés et mots de passe ne passent jamais par Claude.

## 1. À décider ou à faire par Rémi

| # | Point | Ce qu'il faut faire | Réf. |
|---|---|---|---|
| 1 | **Lecture des factures scannées par IA (Mistral OCR)** | Les PDF fabriqués par un logiciel se lisent déjà sans IA (Relais d'Or, Montaner Pietrini, §15.178). Restent les factures **scannées ou photographiées** et les autres mises en page : créer le compte sur console.mistral.ai, offre payante « Scale », clé `flaix-expert-serveur` installée par Rémi (`sudo flaix-admin cle-mistral`). Envoyer une facture scannée d'exemple. | §15.173, §15.178 |
| 2 | **Google Wallet en mode démo** | Pay & Wallet Console : « Configurer des comptes de test » (son Gmail) ; dans FlaiX Expert, enregistrer le design de la carte, créer le lien d'un abonné de test et l'ouvrir sur Android → « Google Wallet » (crée la classe — ne pas la créer à la main dans la console) ; compléter la fiche d'établissement ; puis « Demander l'accès en publication ». | §15.147 |
| 3 | **Export réel de l'application Break Eat (Click & Collect)** | Envoyer un vrai export pour vérifier que les colonnes sont reconnues (caisse connectée « Click & Collect (application Break Eat) »). Plus tard : liaison directe avec l'application (touche au projet Break Eat : seulement avec l'accord de Rémi). | §15.171 |
| 5 | **Premier export pour le comptable** | Faire un export réel (Achats › Factures › Pour le comptable) et ouvrir une facture de vente en PDF : la mise en page n'a pas pu être vue à l'écran pendant le développement. | §15.172 |
| 6 | **Notifications sur les téléphones** | Sur chaque téléphone de directeur : Paramètres › Notifications › « Activer sur cet appareil » ; sur iPhone, ajouter d'abord FlaiX Expert à l'écran d'accueil (Safari › Partager) et l'ouvrir par son icône. | §15.140 |
| 7 | **Stand gris dans le lieu en 3D (ventes par L'Addition)** | Décider : passer un stand en vert dès qu'il a des ventes dans le fichier importé (aujourd'hui gris faute de caisse FlaiX Expert ouverte). | §15.162 |
| 8 | **Assistant IA** | Activer l'option « Assistant IA » d'un lieu ; la clé Mistral du point 1 peut servir aussi à l'assistant. Clé OVHcloud IA : toujours non installée. | §15.136 |
| 9 | **Sauvegardes hors du serveur** | Vérifier que la copie chiffrée des sauvegardes chez OVH est réglée (`sudo flaix-admin sauvegarde-externe`). | guide serveur |
| 10 | **Recette réelle des cartes Wallet** (Codex P2-3) | Essayer une carte sur un vrai iPhone et un vrai Android, avec les vrais comptes Apple et Google (voir le point 2). | §15.176 |

## 2. À développer ensuite (Claude), décisions prises ou à prendre

| # | Point | État |
|---|---|---|
| 11 | **Lecture des PDF scannés par IA** : le même bouton passera la facture scannée à Mistral, qui rendra la même forme de lecture que les PDF fabriqués (§15.178). Ajouter aussi les mises en page des autres fournisseurs de Rémi au fil des factures reçues. |
| 12 | **Changer de lieu dans l'application** : un directeur de plusieurs lieux n'accède aujourd'hui qu'au premier (la copie du catalogue se fait depuis le back-office, §15.180). | À faire. |
| 21 | **Règles à valider par Rémi (audit Codex 2026-11-12)** : (1) écart d'arrondi colis → unités de quelques centimes, tracé au journal (BUG-2026-014) ; (2) la réserve ne bouge qu'à la validation de la facture, pas au dépôt. | À décider. |
| 13 | **Adresse e-mail de dépôt des factures** : transférer une facture par e-mail pour qu'elle s'importe seule. Pour l'instant : dépôt direct dans FlaiX Expert. | Plus tard. |
| 14 | **Pilote automatique de la soirée** : files d'attente estimées au rythme des tablettes ; anticipation de la mi-temps (réassort poussé au téléphone, « Prévenir le stand ») ; mise en place calculée seule (affluence, adversaire, historique). Le net en direct est fait (§15.170). | À faire, dans cet ordre. |
| 17 | **Passage en production** : base neuve, reprise de la seule configuration (lieu, stands, caisses, produits, catégories, tarifs, recettes, emballages, équipe, réglages), jamais les données de test. Outil de reprise à préparer et tester avant la bascule, faite avec Rémi. | À préparer. |
| 18 | **Conformité de la caisse** (pièces du dossier structuré), avec Rémi. | À traiter ensemble. |
| 19 | **Points ouverts de l'audit du 2026-10-25** (O1 à O15 : charge des écrans, minutes de personnel en double, lecture d'un classeur de facture à plusieurs feuilles…) | À trier. |

## 3. Faits récemment

| Point | Fait le | Réf. |
|---|---|---|
| Écran des correspondances fournisseurs (Achats › Correspondances) | 2026-10-25 | §15.174 |
| Page Résultats au design de la 2e maquette (vue à l'écran en local après coup, §15.175) | 2026-10-25 | §15.174 |
| Exclusion antivirus des dossiers Docker (Rémi) | 2026-10-25 | — |
| Imports L'Addition ratés : point retiré à la demande de Rémi | 2026-10-25 | §15.168 |
| Audit des phases 67 à 75 : sept défauts corrigés, dossier de reprise à jour | 2026-10-25 | §15.175 |
| Mode formation : famille des catégories et correspondances fournisseurs recopiées (migration 0058) | 2026-10-25 | §15.175 |
| Audit de Codex du 2026-10-26 : isolement d'une livraison de facture et dépendances corrigés (migration 0059) | 2026-11-01 | §15.176 |
| Audit de Codex : auteur d'une annulation, relances wallet, clôture d'un événement privé, compteur d'une caisse connectée, export en flux (migration 0060) | 2026-11-11 | §15.177 |
| Factures PDF fabriquées par un logiciel lues sans IA : Relais d'Or, Montaner Pietrini (CDB), total contrôlé, PDF joint | 2026-11-12 | §15.178 |
| Ligne de facture reliée à un ingrédient (prix, réserve, coût des recettes) ; à l'import, le sûr rempli et le ressemblant proposé (migration 0061) | 2026-11-12 | §15.179 |
| Copie du catalogue entre lieux d'un même client (back-office) ; recette avec ingrédient créé sur place et marge en direct (migration 0062) | 2026-11-12 | §15.180 |
| Gouvernance appliquée (registres) ; audit Codex du 2026-11-12 corrigé : total Excel, feuille, Col/Pack, bornes ingrédients, avoir, compteur de recettes (migration 0063) | 2026-11-13 | §15.181 |
