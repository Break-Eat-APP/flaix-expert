# Points à revoir avec Rémi

Liste tenue à jour à la fin de chaque séance (dernière mise à jour : 2026-10-25, après l'audit). Chaque point dit **qui** doit agir :
**Rémi** (compte, clé, test, décision) ou **Claude** (développement, une fois la décision prise). Rien de secret ici :
les clés et mots de passe ne passent jamais par Claude.

## 1. À décider ou à faire par Rémi

| # | Point | Ce qu'il faut faire | Réf. |
|---|---|---|---|
| 1 | **Lecture des factures PDF par IA (Mistral OCR)** | Créer le compte sur console.mistral.ai, **offre payante « Scale »** (l'offre gratuite peut entraîner les modèles avec les données), limite de dépense mensuelle (ex. 10 €), créer une clé « flaix-expert-serveur », l'installer soi-même : `ssh -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196` puis `sudo flaix-admin cle-mistral`. Envoyer à Claude 2 ou 3 factures PDF typiques (grossiste, brasseur, une scannée). | §15.173 |
| 2 | **Google Wallet en mode démo** | Pay & Wallet Console : « Configurer des comptes de test » (son Gmail) ; dans FlaiX Expert, enregistrer le design de la carte, créer le lien d'un abonné de test et l'ouvrir sur Android → « Google Wallet » (crée la classe — ne pas la créer à la main dans la console) ; compléter la fiche d'établissement ; puis « Demander l'accès en publication ». | §15.147 |
| 3 | **Export réel de l'application Break Eat (Click & Collect)** | Envoyer un vrai export pour vérifier que les colonnes sont reconnues (caisse connectée « Click & Collect (application Break Eat) »). Plus tard : liaison directe avec l'application (touche au projet Break Eat : seulement avec l'accord de Rémi). | §15.171 |
| 5 | **Premier export pour le comptable** | Faire un export réel (Achats › Factures › Pour le comptable) et ouvrir une facture de vente en PDF : la mise en page n'a pas pu être vue à l'écran pendant le développement. | §15.172 |
| 6 | **Notifications sur les téléphones** | Sur chaque téléphone de directeur : Paramètres › Notifications › « Activer sur cet appareil » ; sur iPhone, ajouter d'abord FlaiX Expert à l'écran d'accueil (Safari › Partager) et l'ouvrir par son icône. | §15.140 |
| 7 | **Stand gris dans le lieu en 3D (ventes par L'Addition)** | Décider : passer un stand en vert dès qu'il a des ventes dans le fichier importé (aujourd'hui gris faute de caisse FlaiX Expert ouverte). | §15.162 |
| 8 | **Assistant IA** | Activer l'option « Assistant IA » d'un lieu ; la clé Mistral du point 1 peut servir aussi à l'assistant. Clé OVHcloud IA : toujours non installée. | §15.136 |
| 9 | **Sauvegardes hors du serveur** | Vérifier que la copie chiffrée des sauvegardes chez OVH est réglée (`sudo flaix-admin sauvegarde-externe`). | guide serveur |
| 10 | **Audit de Codex** des phases 67 à 76 | Donner à Codex le bloc de `docs/developpement/CODEX_AUDIT_PROMPT.md` (périmètre « phases 67 à 76 ») ; son rapport ira dans `docs/audits/`. | §15.175 |

## 2. À développer ensuite (Claude), décisions prises ou à prendre

| # | Point | État |
|---|---|---|
| 11 | **Lecture des PDF par IA** : le même bouton accepte un PDF ; Mistral lit fournisseur, n°, date, total et lignes ; puis correspondances, colis, alertes et validation comme pour un Excel. | Attend le point 1. |
| 13 | **Adresse e-mail de dépôt des factures** : transférer une facture par e-mail pour qu'elle s'importe seule. Pour l'instant : dépôt direct dans FlaiX Expert. | Plus tard. |
| 14 | **Pilote automatique de la soirée** : files d'attente estimées au rythme des tablettes ; anticipation de la mi-temps (réassort poussé au téléphone, « Prévenir le stand ») ; mise en place calculée seule (affluence, adversaire, historique). Le net en direct est fait (§15.170). | À faire, dans cet ordre. |
| 17 | **Passage en production** : base neuve, reprise de la seule configuration (lieu, stands, caisses, produits, catégories, tarifs, recettes, emballages, équipe, réglages), jamais les données de test. Outil de reprise à préparer et tester avant la bascule, faite avec Rémi. | À préparer. |
| 18 | **Conformité de la caisse** (pièces du dossier structuré), avec Rémi. | À traiter ensemble. |
| 19 | **Points ouverts de l'audit du 2026-10-25** (O1 à O15 : charge des écrans, minutes de personnel en double, lecture d'un classeur de facture à plusieurs feuilles…) | À trier après l'audit de Codex. |

## 3. Faits récemment

| Point | Fait le | Réf. |
|---|---|---|
| Écran des correspondances fournisseurs (Achats › Correspondances) | 2026-10-25 | §15.174 |
| Page Résultats au design de la 2e maquette (vue à l'écran en local après coup, §15.175) | 2026-10-25 | §15.174 |
| Exclusion antivirus des dossiers Docker (Rémi) | 2026-10-25 | — |
| Imports L'Addition ratés : point retiré à la demande de Rémi | 2026-10-25 | §15.168 |
| Audit des phases 67 à 75 : sept défauts corrigés, dossier de reprise à jour | 2026-10-25 | §15.175 |
| Mode formation : famille des catégories et correspondances fournisseurs recopiées (migration 0058) | 2026-10-25 | §15.175 |
