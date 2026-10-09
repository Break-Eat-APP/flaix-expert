# Avancement — reprise après coupure

Mis à jour le 2026-10-05 vers 4 h : les quatre modules demandés le 04/10 au soir sont faits et testés (centre d'alertes et rupture poussée, prix fournisseurs, back-office niveau 2, prévision), plus le temps de prise de commande ; tout est commité depuis le 2026-10-05 (consigne « sans commit » levée par Rémi). Pour reprendre : lire ce fichier, puis le dossier §15.138 à §15.143.

## 2026-10-09 : correspondances automatiques et suggérées (§15.152)

Caisses connectées : un produit ou point de vente de la caisse au même nom (majuscules, accents, espaces près) qu'un seul produit ou stand de FlaiX Expert est relié à l'import (étiquette « auto ») ; un nom proche est proposé, accepté un à un ou tout d'un coup. Contenances et variantes opposées jamais confondues. Migration 0042.

## 2026-10-09 : ventes déposées dans tout FlaiX Expert, fichiers Excel (§15.151)

Priorité de Rémi (la conformité attendra) : les ventes d'une caisse connectée alimentent Résultats, marges, cibles, rapport de soirée, gestion financière, stock, prévision, coûts par buvette, prix fournisseurs (vues de gestion, migration 0041) ; jamais les Z, clôtures, export comptable, fidélité. Fichiers Excel (.xlsx, .xls, .ods) et CSV, titre et total reconnus. Bibliothèque SheetJS 0.20.3 (distribution officielle), chargée seulement à l'ouverture d'un classeur.

## 2026-10-06 : compteur IA et module « Caisses connectées »

- **Compteur de consommation de l'IA** (§15.149) : back-office → carte « Consommation de l'IA » (questions, briefs, jetons, coût estimé par lieu et par mois).
- **Caisses connectées** (§15.150) : recherche sur L'Addition, Digifood, Weezevent (`docs/reference/caisses-externes.md`) — aucune API publique, partenariat à demander ; les trois savent exporter leurs ventes en fichier. Module à part, option du lieu désactivée par défaut : import des exports CSV (aperçu, colonnes corrigeables), correspondances produit et point de vente, résultats. **Reste** : connecteurs API (après partenariats) et branchement des autres écrans sur les ventes importées.
- **GitHub** : envoi fait par Rémi (les 18 commits du 2026-10-05).
- **Mémoire du poste** : 0,1 à 0,7 Go libres ; l'aperçu dans le navigateur a planté, tests lancés fichier par fichier (serveur `test:un-par-un`).

## Audit Codex du 2026-10-05 (phases 33 à 48) — corrigé le soir même

Conclusion de Codex transmise par Rémi ; suite donnée dans `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md` : P1 option Fidélité retirée → cartes révoquées ; `node-forge` retirée du serveur (signature Apple faite avec `node:crypto`, 1.4.1 non publiée) ; nouvel essai automatique des envois Apple et Google en échec (migration 0038, toutes les 5 minutes, abandon après 12 essais) ; e-mails Brevo hors transaction et en arrière-plan ; tests du serveur lancés fichier par fichier (`pnpm --filter @flaix/api test:un-par-un`) sur ce poste à 6 Go, où la suite d'un bloc fait tomber Node faute de mémoire. **Mise en ligne le 2026-10-05 à 21 h 44 puis 21 h 46** (`9df5acd`, sauvegarde avant, migration 0038). En vérifiant : le serveur ne lisait pas les réglages Apple et Google (script de mise en ligne jamais mis à jour depuis 10 h 47) — corrigé, vérifié avec une carte d'essai signée par le vrai certificat d'Apple. Pendant le travail, Docker s'est arrêté (mémoire) : relancé ; le conteneur `breakeat_audit` (autre projet de Rémi) est resté arrêté, pas touché.

## Audit du 2026-10-05 au soir (avant l'audit Codex)

Revue des phases 39 à 48 par Claude : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`. Verdict : passage en **test** possible (club qui utilise FlaiX Expert sans encaisser de vraies ventes avec), après la **copie des sauvegardes chez OVH (à faire par Rémi : non réglée, vérifié sur le serveur)**. Vraies ventes : après les pièces de conformité. Les cinq défauts P2 sont corrigés (commit `360895e`, migration 0037) ; les P3 restent. Prompt Codex mis à jour (phases 33 à 48). **Envoi GitHub** : à lancer par Rémi dans sa propre fenêtre PowerShell (la fenêtre d'identification GitHub ne s'ouvre pas depuis Claude) : `git -C C:\Users\notta\dev\flaix-expert push`. Version corrigée **déployée sur le serveur de test le 2026-10-05 à 21 h 12** (`76af5c9`, sauvegarde prise juste avant, migration 0037 ; limite du service web Apple vérifiée en ligne).

## Design de la carte abonné — fait le 2026-10-05 au soir (§15.148)

Demande de Rémi : « le maximum afin de personnaliser la carte ». Fidélité → onglet « Carte téléphone » : logo et bannière (retaillés dans le navigateur aux formats Apple et Google), couleurs (fond, texte, intitulés), nom du programme, nom des points, nom du lieu à côté du logo, message au dos, remise et réduction disponible affichables, liens (site, téléphone, e-mail, application), aperçu iPhone et Android. Les cartes déjà distribuées et le modèle Google du lieu se mettent à jour en arrière-plan. Tests : moteur 13, briques 5, serveur 15 (+ non-régression 112), écrans 63 au total. **Déployé sur le serveur de test le 2026-10-05 à 20 h 53** (version `405b044`, sauvegarde prise juste avant, migration 0036). Vu à l'écran en local (lieu d'essai ; mot de passe du compte d'essai local `verif-nuit@` renouvelé par l'outil du projet pour la vérification).

## Carte abonné wallet — faite le 2026-10-05 après-midi (§15.147)

Serveur (lien, page publique, `.pkpass` signé, service web PassKit, lien Google, mises à jour du solde après tickets, ajustements, nom, règle de points, couleur), commandes `flaix-admin wallet-…`, écrans. Tests : serveur 13 + briques 3, écrans 5 ; non-régression fidélité, caisse, e-mails, support, options, conformité de la base, connexion (102) et tous les écrans (60). **Pour Rémi** : déploiement sur le serveur de test, puis guide `docs/guide-serveur-test-ovh.md` → « Carte abonné » (Apple : identifiant `pass.com.flaixlabs.abonne`, demande de certificat fabriquée sur le serveur, `pass.cer` renvoyé ; Google : Issuer ID, compte de service, invitation dans la console, comptes de test). **Comptes installés par Rémi le 2026-10-05** : Apple à 19 h 16 (Team ID `2A5L298Q4C`, compte « Notta LLC », certificat valable jusqu'au **4 novembre 2027** : à renouveler avant, même procédure) ; Google à 20 h 25 (projet Google Cloud `rapid-access-494820-f8`, compte de service `flaix-wallet`, clé vérifiée auprès de Google ; la règle Google « Disable service account key creation » a dû être levée le temps de créer la clé, puis remise). **Reste** : essai sur iPhone et Android, comptes de test Google, puis demande de publication chez Google. **Déployé sur le serveur de test le 2026-10-05 à 13 h 18** (version `e351ee5`, sauvegarde prise juste avant, migration 0035 appliquée ; page `/carte/…`, service web PassKit et commandes `flaix-admin wallet-…` vérifiés en ligne). **Pas encore poussé sur GitHub** : l'envoi demande la fenêtre d'identification GitHub de Rémi. Rien de secret ne passe par Claude. Essai local fait sur « Buvette de démonstration nocturne » (abonné de démonstration `AB-007` ajouté dans la base locale).

## Serveur de test — mis en ligne le 2026-10-05 à 10 h 38 (version `b860416`)

Sauvegarde de la base prise juste avant ; migrations 0030 à 0033 appliquées ; site vérifié (`/api/sante`). Le serveur de test a donc le Revenue Engine, le temps de prise de commande, le centre d'alertes et la rupture poussée, les prix fournisseurs, le support niveau 2 et la prévision. **IA (OVHcloud)** : la clé d'API créée par Rémi n'est pas encore installée — OVHcloud exige un moyen de paiement sur le projet Public Cloud ; Rémi préfère avancer d'abord sur Brevo puis le wallet (2026-10-05).

## Consigne de Rémi du 2026-10-04 vers 23 h 30 (il est parti se coucher)

« Développer pour l'instant **sans commit** et enchaîner : centre d'alertes avec la rupture de stock en direct sur le téléphone, comparaison des prix entre fournisseurs, back-office niveau 2, prévision du prochain événement. On fera un commit sur GitHub quand je me connecterai. » → **Ne pas committer ni pousser** tant que Rémi ne l'a pas demandé : le travail reste dans l'arbre de travail du dépôt (`git status` le montre). Dernier commit fait avant la consigne : `4d416ac`.

**Au moment du commit** (quand Rémi le demandera) : un commit par module (temps de commande §15.139, centre d'alertes §15.140, fournisseurs §15.141, puis les suivants), ajouter les phases 40, 41, 42… dans `infra/outils/phases.cjs` avec leurs hash, relancer `node infra/outils/journal-developpement.cjs`, commiter le journal, puis `git push` (fenêtre GitHub à valider par Rémi). Migrations nouvelles : 0030, 0031, 0032, 0033.

**Mémoire du PC (nuit du 04 au 05/10)** : Windows était à 24,1 Go engagés sur 24,4 Go (applications ouvertes) ; les tests ne tournent qu'avec `--pool=threads --maxWorkers=1`, un fichier à la fois. Tout ce qui est marqué « fait » ci-dessus a ses tests au vert (moteur, serveur contre la base, écrans) et ses types vérifiés. Non-régression vérifiée vers 4 h 30 : caisse 24, stock 11, résultats 6, caisse automatique 9, notifications 6, formation 10, conformité de la base 15, connexion 20, caissières 22, back-office 9, lieux du back-office 9, options 6.

## Réponses de Rémi au réveil (2026-10-05)

- **Copie de configuration** : abandonnée, « les lieux ne se ressemblent pas » (§15.144).
- **Commit et envoi** : faits le 2026-10-05 — un commit par module (`72f087a`, `b24b3c6`, `cb5cb03`, `0a675eb`, `534a3a6`), dossier `5516b41`, journal des phases 40 à 44 ; poussés sur GitHub (fenêtre d'identification validée par Rémi).
- **Vérification à l'écran terminée le 2026-10-05** (après la fermeture d'applications par Rémi ; Docker, fermé au passage, a été relancé pour la base locale) : prévision avec 4 événements joués et 1 à venir (fourchettes, mise en place proposée, heure de pointe, fiabilité), carte du temps de prise de commande avec des mesures. Données créées sur le lieu d'essai local « Buvette de démonstration nocturne » par un script temporaire, supprimé ensuite.

## Consigne de Rémi du 2026-10-04 vers 23 h 30 (il est parti se coucher)

« Développer pour l'instant **sans commit** et enchaîner : centre d'alertes avec la rupture de stock en direct sur le téléphone, comparaison des prix entre fournisseurs, back-office niveau 2, prévision du prochain événement. On fera un commit sur GitHub quand je me connecterai. » → **Ne pas committer ni pousser** tant que Rémi ne l'a pas demandé : le travail reste dans l'arbre de travail du dépôt (`git status` le montre). Dernier commit fait avant la consigne : `4d416ac`.

**Au moment du commit** (quand Rémi le demandera) : un commit par module (temps de commande §15.139, centre d'alertes §15.140, fournisseurs §15.141, puis les suivants), ajouter les phases 40, 41, 42… dans `infra/outils/phases.cjs` avec leurs hash, relancer `node infra/outils/journal-developpement.cjs`, commiter le journal, puis `git push` (fenêtre GitHub à valider par Rémi). Migrations nouvelles : 0030, 0031, 0032, 0033.

**Mémoire du PC (nuit du 04 au 05/10)** : Windows était à 24,1 Go engagés sur 24,4 Go (applications ouvertes) ; les tests ne tournent qu'avec `--pool=threads --maxWorkers=1`, un fichier à la fois. Tout ce qui est marqué « fait » ci-dessus a ses tests au vert (moteur, serveur contre la base, écrans) et ses types vérifiés. Non-régression vérifiée vers 4 h 30 : caisse 24, stock 11, résultats 6, caisse automatique 9, notifications 6, formation 10, conformité de la base 15, connexion 20, caissières 22, back-office 9, lieux du back-office 9, options 6.

## Questions pour Rémi au réveil (2026-10-05)

1. **Commit et envoi sur GitHub** : tout le travail de la nuit est prêt à être commité (un commit par module) puis poussé ; la fenêtre GitHub s'ouvrira sur ton écran.
2. **« Copie de la configuration d'un lieu à l'autre »** : copier la configuration des Spartiates vers **un autre lieu** (un second site, par exemple), ou vers **le futur serveur de production** (le script de reprise prévu au « Passage en production ») ? Pas construit tant que ce n'est pas clair.
3. **Vérification à l'écran faite vers 4 h 20** sur un lieu d'essai de la base locale (« Buvette de démonstration nocturne », comptes d'essai locaux créés avec l'outil du projet) : centre d'alertes avec données (hausse fournisseur, mercuriale, marge configurée), Stock → Prix fournisseurs, Paramètres → Support, puis le parcours complet du support (autorisation par le lieu, back-office, ouverture en lecture seule, bandeau). Corrigé au passage : champ « Motif » mal mis en page, accueil et lien « Mon mot de passe » inadaptés au support, page de prévision en erreur sur un lieu sans événement. **Pas vu à l'écran** : la prévision avec des données, la carte « Temps de prise de commande » avec des mesures (testées automatiquement).
5. **Mémoire du PC** : 24,1 Go engagés sur 24,4 Go possibles cette nuit (applications ouvertes) ; un redémarrage ou une exclusion de quelques applications rendrait les tests et l'écran plus fiables.
4. Seuils de départ à confirmer un jour avec le terrain (déjà ceux du prototype) : hausse fournisseur 5 %, mercuriale 10 %, sur-conditionnement 1,5 événement, file d'attente 20 s.

## Consigne de Rémi du 2026-10-04 au soir

« Avant de développer les agents IA, je veux qu'on continue à développer l'ensemble des modules, à terminer. » Ordre : liste « Reste à construire » ci-dessous, dans l'ordre. Ne rien construire de nouveau côté IA (assistant, agents) avant la fin des modules.

| # | Module | État |
|---|---|---|
| 1 | Revenue Engine « Où je perds de l'argent » | **fait le 2026-10-04** (§15.138) — Résultats → onglet « Où je perds de l'argent » |
| 1 bis | Temps de prise de commande, par caisse et par stand (demande de Rémi) | **fait le 2026-10-05** (§15.139, commit `72f087a`) — carte dans « Où je perds de l'argent » |
| 2 | Prévision du prochain événement | **fait le 2026-10-05** (§15.143, commit `534a3a6`) — page `/prevision` (Résultats → Prochains événements, Stock) |
| 3 | Centre d'alertes, rupture de stock en direct sur le téléphone | **fait le 2026-10-05** (§15.140, commit `b24b3c6`) — `/alertes`, carte en tête de Résultats, Paramètres → Notifications |
| 4 | Comparaison des prix entre fournisseurs | **fait le 2026-10-05** (§15.141, commit `cb5cb03`) — Stock → « Prix fournisseurs » |
| 5 | Copie de la configuration d'un lieu à l'autre | **abandonnée** (§15.144) — Rémi : « les lieux ne se ressemblent pas » |
| 6 | Conformité : attestation, registre des versions, archive annuelle, accès vérificateur | **à voir avec Rémi** |
| 7 | Facture FlaiX Expert au lieu | attend les prix de Rémi |
| 8 | Import des ventes Click & Collect, commission et frais dans le résultat | **plus tard** (Rémi, 2026-10-05) — commandes passées dans l'application Break Eat, traitées par Flaix Ops : connexion directe Flaix Ops → FlaiX Expert recommandée ; il faudra le code de Flaix Ops |
| 9 | E-mails par Brevo (rapport, rectifications, campagnes) | **fait le 2026-10-05** (§15.146) — rapport de soirée et rectifications ; clé Brevo installée par Rémi, expéditeur de test `contact@breakeatapp.com` (**pour la production : une adresse flaixlabs.com**) ; campagnes vers les abonnés : plus tard (RGPD) |
| 10 | Wallet (carte abonné Apple et Google) | **fait le 2026-10-05** (§15.147, commits `91b5446` à `4662794`) — Fidélité → fiche de l'abonné et onglet « Carte téléphone » ; page `/carte/<jeton>` ; **reste à Rémi** : certificat Apple et compte de service Google (guide serveur, section « Carte abonné ») |
| 11 | Back-office niveau 2 | **fait le 2026-10-05** (§15.142, commit `0a675eb`) — Paramètres → Support FlaiX Expert ; back-office « Ouvrir en lecture seule » |
| 12 | Passage en production | Rémi (serveur) |

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | **fait le 2026-09-30** (dossier §15.100) |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | **fait le 2026-09-30** (dossier §15.101) |
| 3 | Clôtures : assistant de clôture du match | **fait le 2026-09-30** (dossier §15.102) |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | **fait le 2026-09-30** (dossier §15.103) |
| 5 | Équipe : fiches, planning, masse salariale | **fait le 2026-09-30** (dossier §15.104) |
| 6 | Stock : mise en place, comptage, réserve et livraisons | **fait le 2026-09-30** (dossier §15.105) — matières premières au poids et recettes en pause |

Fait ensuite le 2026-09-30 : remontées au coffre et Z du coffre (§15.106) ; clôtures mensuelle et annuelle, Z du match, total perpétuel (§15.107) ; exercice comptable à régler par lieu, copie chiffrée des sauvegardes chez OVH (§15.108).

## Inventaire : modules validés du prototype → logiciel réel (2026-09-30)

Chaque module repris l'a été après relecture de son prototype validé, avec ce que le prototype ne pouvait pas avoir (vraie base, rôles, vente sans réseau, inaltérabilité imposée par la base, tests). Numéros = journal des modules du dossier (§14).

**Repris**

| Prototype | Dans le logiciel | Reste |
|---|---|---|
| 1 Commande | Caisses → poste de la caissière (tablette, sans réseau, code personnel) | — |
| 2 Ventes & CA | Résultats ; Clôtures → Mois & année | — |
| 3 Journal / Tickets | Caisses → Tickets (vérification d'intégrité, ticket sur demande) | — |
| 4 Stock | Stock | matières premières et recettes (en pause, décision de Rémi) ; alerte de rupture en direct |
| 7 Contrôle & Espèces | Clôtures (Z du tiroir, rectification, coffre) | e-mail de notification d'une rectification (envoi d'e-mails à mettre en place) |
| 10 Clôture d'événement | Clôtures → assistant de clôture du match | — |
| 14 Masse salariale | Équipe (fiches, planning, masse salariale, accès caisse) | — |
| 15 Configuration du lieu / produits | Paramètres (lieu, saison, stands & caisses, produits & prix) | — |

**Repris en partie — état au 2026-10-04**

| Prototype | Déjà dans le logiciel | Manque |
|---|---|---|
| 5 Marges & ratios | marge produit par produit ; **cibles par catégorie et par produit, alerte dès la saisie d'un prix** (§15.132) | comparaison fournisseurs au prix unitaire et alerte de sur-conditionnement |
| 6 Optimisation | « Pistes pour le prochain événement » ; **Revenue Engine « Où je perds de l'argent »** (§15.138) : ruptures chiffrées, écarts de stock et d'espèces, ventes sous le tarif, volume × marge, écarts entre stands, caisse à plein régime, classés par montant | avant/après vérifié sur l'événement suivant |
| 9 Reporting de soirée | **rapport figé à la clôture, imprimable/PDF** (§15.131) ; **brief sur le téléphone** (§15.135) | envoi par e-mail (service d'e-mails Brevo à brancher) |
| 11 Gestion financière | **cascade jusqu'à la marge nette, dépenses en € ou en %, cible de la soirée, bilan sur une période** (§15.132, §15.133) | commission et frais du Click & Collect (attendent l'import des ventes C&C) |
| 16 Conformité | journal technique, vérification des chaînes, clôtures scellées ; dossier v0.1 | attestation, registre des versions, connexions par caisse, archive annuelle, accès vérificateur (**à voir avec Rémi**) |
| 18 Centre d'alertes | « À surveiller » ; marge sous la cible ; brief de fin de soirée | le centre lui-même, hausse d'un prix fournisseur, écart à la mercuriale, rupture en direct |
| 4 Stock | mise en place, comptages, réserve, ingrédients au poids | alerte de rupture **en direct**, poussée sur le téléphone |

**Reste à construire (état au 2026-10-04 au soir)** : ~~Revenue Engine~~ (fait, §15.138) ; temps de prise de commande par caisse (§15.139) ; prévision du prochain événement ; centre d'alertes et rupture en direct ; comparaison fournisseurs ; copie de configuration entre lieux (Spartiates) ; conformité (avec Rémi) ; facture FlaiX Expert au lieu (prix plus tard) ; import des ventes C&C ; e-mails (Brevo : rapport, rectifications, campagnes) ; wallet (comptes Apple/Google de Rémi) ; back-office niveau 2 ; passage en production. **Attend Rémi** : clé Mistral et jeton OVH (`sudo flaix-admin cle-mistral`, `cle-ovh-ia`), option « Assistant IA » des Spartiates, notifications à activer sur son téléphone, stockage OVH des sauvegardes.

**Plus tard (décidé par Rémi)** : 19 Fidélité, 20 Wallet & campagnes, Facturation (facture FlaiX Expert, rapprochement fournisseur), 17 Back-office éditeur, assistant IA, recettes et matières premières.

## Ordre fixé par Rémi le 2026-09-30 (dossier §15.109) — « développe, sans t'arrêter »

| # | Module | État |
|---|---|---|
| 1 | Mode formation « FACTICE » | **fait le 2026-09-30** (§15.109) |
| 2 | Export pour l'expert-comptable | **fait le 2026-09-30** (§15.110) — format à confirmer par le comptable (G.20) |
| 3 | Click & Collect | **fait le 2026-10-01** (§15.111) — ventes C&C : pas de raccordement à une application de commande pour l'instant |
| 4 | Vue téléphone du directeur | **fait le 2026-10-01** (§15.112) — écran « En direct » |
| 5 | Coûts par buvette | **fait le 2026-10-01** (§15.113) — frais mensuels datés par stand |
| 6 | Fidélité | **partie gestion faite le 2026-10-01** (§15.114) ; partie caisse (dépenser des points, code promo) à faire : choix « sans réseau » à valider |
| 7 | Wallet & campagnes | **mis de côté** (§15.115) — carte reportée par Rémi ; campagnes : service d'e-mails et domaine à choisir |
| 8 | Facturation | **factures fournisseurs (12b) faites le 2026-10-01** (§15.115) ; 12a (facture FlaiX Expert au lieu) avec le back-office |
| 9 | Back-office éditeur | **niveau 1 (supervision) fait le 2026-10-01** (§15.116) ; niveau 2 (support sur autorisation) avec la Conformité |

**Fait aussi le 2026-10-01** : options par lieu activées depuis le back-office et application installable (§15.118) ; recettes et coût de fabrication (§15.119). **Décidé** : fidélité à la caisse en option A (points et codes plafonnés avec réseau) — à construire. **À décider par Rémi** : stock au poids des ingrédients ; montants de l'abonnement FlaiX Expert par option.

**Fait le 2026-10-02** (§15.121, §15.122) : l'éditeur s'appelle FlaiX Expert partout (le Click & Collect est devenu neutre le 2026-10-03 : « application de commande », « commission de la plateforme », « frais de paiement ») ; back-office : créer un lieu avec son directeur, ajouter un directeur, nouveau mot de passe provisoire ; mots de passe de 6 caractères au moins (les plus utilisés refusés) avec un œil pour les afficher.

**Fait le 2026-10-03** (§15.123 à §15.126) : Click & Collect neutre ; export comptable dans la base ; commission C&C sur le prix buvette ou sur le prix app ; **stock des ingrédients au choix** (bière pression au litre). **Ordre décidé** : conformité (dossier en 20 parties pour FlaiX Expert, éditeur Break Eat App) → facturation dans le back-office → import des ventes d'une application de commande.

**Conformité — démarré le 2026-10-03** : `docs/conformite/dossier-conformite-flaix-expert.md` (v0.1, plan de Rémi en 20 parties réécrit pour FlaiX Expert + parties 21 à 28). À construire ensuite, dans l'ordre : numéro de version et registre des versions (12), attestation téléchargeable (01, 20), archive annuelle (09), compte vérificateur (07, 25), étiquette Git par version (26).

**Fait le 2026-10-04** (§15.129, §15.130) : audit Codex corrigé (P1 fidélité, option équipe, tests des écrans) ; « événement » à la place de « match » dans tous les textes ; **caisse automatique** : la tablette de la caissière s'ouvre seule le jour J sur l'événement prévu (qui s'ouvre avec la première caisse), avec le fond prévu par le directeur, et attend sinon le prochain ; clôture par le directeur seul, à distance si la tablette a tout envoyé, sinon forcée avec motif et signature. **Rapport de soirée** (§15.131) : figé à la clôture de l'événement, page imprimable et PDF, depuis Résultats et Clôtures. **Fait le 2026-10-04** (§15.132) : cibles de marge (catégorie, produit, alerte dès la saisie d'un prix) et gestion financière de la soirée (postes de dépense en € ou en %, marge nette jugée par rapport à sa cible, dans le rapport de soirée). **Bilan sur une période** (§15.133) : Résultats et Finances « du … au … », comparés à la période précédente de même durée. **En discussion avec Rémi** (§15.134) : sa note produit ChatGPT (Flaix Ops / Expert / Autopilot, agents IA) — avis rendu le 2026-10-04 ; décisions du 2026-10-04 : d'abord brief + assistant, fournisseur Mistral, brief en notification. **Fait** (§15.135) : brief de fin de soirée en notification sur le téléphone. **Fait** (§15.136) : assistant « pose ta question » et brief reformulé par Mistral — **en attente de la clé Mistral de Rémi** (`sudo flaix-admin cle-mistral`, guide serveur) et de l'option « Assistant IA » activée pour le lieu. **Prochain** : « où je perds de l'argent », prévision du prochain événement, centre d'alertes.

**Fait le 2026-10-03/04** : fidélité à la caisse (§15.127, option A) — code promo et points dans le ticket scellé, réservations du serveur (migration 0024), anomalies signalées sans refus. Moteur et serveur faits et testés (376 tests au vert). Écran vérifié le 2026-10-04 (ticket de 21,00 € − abonné 10 % − code 10 % − 200 points = 7,01 €, reçu sans anomalie, solde 300 → 107) et **mis en ligne**. Rémi veut tout le logiciel de A à Z, 100 % fonctionnel pour son test avec le directeur des Spartiates : ensuite rapport de soirée, cibles de marge et gestion financière, centre d'alertes et optimisation, alertes rupture sur téléphone, copie de configuration, conformité (registre, attestation, archive, vérificateur), wallet (comptes Apple/Google de Rémi), facturation (prix plus tard), import C&C.

**À voir avec Rémi, ne pas construire seul** : Conformité (dossier bien structuré à préparer ; y joindre les points prévus à revoir ensemble), IA ; serveur de production (Rémi s'en occupe).

## Ancienne proposition d'ordre (remplacée par le tableau ci-dessus)

1. **Mode formation « FACTICE »** — pour que les essais ne se mélangent jamais aux vrais chiffres.
2. **Conformité** : attestation, registre des versions, connexions par caisse, archive annuelle, accès vérificateur, export pour l'expert-comptable.
3. **Passage en production** : vraie base neuve, seule la configuration du directeur recopiée, adresse flaixexpert.flaixlabs.com (ou un sous-domaine de production). Préalables : réponse écrite de l'expert-comptable (NF525), décision d'hébergement (§15.108), copie OVH réglée et essai de restauration réussi.
4. **Gestion financière complète + cibles de marge**.
5. **Reporting de soirée** figé, imprimable, envoyé par e-mail (choisir un service d'envoi d'e-mails ; sert aussi à la notification des rectifications).
6. **Centre d'alertes + Optimisation complète**.
7. **Click & Collect**, après révision des règles de prix.
8. Puis les modules « plus tard ».

## Reste à faire hors modules

- **Copie des sauvegardes chez OVH** : scripts en service et essayés sur le serveur le 2026-09-30 (faux stockage, clé jetable : chiffrement, envoi, mauvaise clé refusée, restauration complète). **Attend Rémi** : créer le stockage OVH puis lancer `sudo flaix-admin sauvegarde-externe` (guide serveur, « Copie des sauvegardes chez OVH »), puis `sudo flaix-admin essai-restauration`.
- Premier mois de l'exercice : à régler par le directeur de chaque lieu (Paramètres → Le lieu), avec son expert-comptable.
- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Sous-domaine : **fait le 2026-10-02** — https://flaixexpert.flaixlabs.com (back-office : /editeur) ; l'ancienne adresse sslip.io renvoie vers elle.
- Conservation des tickets sans limite : décidée (§15.106) ; question RGPD posée (G.19).

## Passage en production — ce qui se passera (réponse à Rémi du 2026-10-02)

**Préalables (Rémi)** : réponse écrite de l'expert-comptable (questions A à G) ; entité juridique éditrice de FlaiX Expert (nom sur l'attestation, propriétaire du code, dépôt GitHub aujourd'hui chez Break-Eat-APP) ; stockage OVH réglé et essai de restauration réussi ; choix du serveur de production (recommandé : un second VPS, le serveur actuel restant celui de test) ; conditions d'abonnement et contrat de sous-traitance RGPD avec chaque lieu.

**À construire avant (moi)** : script de reprise de la configuration (identité, stands, caisses, produits et prix datés, recettes, équipe, codes caissières, options — jamais un ticket, un match, une clôture ni le journal d'essai), essayé sur une copie ; minimum de conformité vu ensemble (attestation téléchargeable dans l'application, registre des versions).

**Le jour J** : étiquette de version dans Git (L96 J) ; base neuve, bandeau « test » retiré ; configuration recopiée ; directeurs gardent leur mot de passe, tablettes réenregistrées ; sauvegarde + copie OVH + essai de restauration sur la production. Ensuite : tout ce qui est saisi est définitif (rectifications, jamais d'effacement) ; entraînement en mode formation ; mises à jour hors match, essayées d'abord sur le serveur de test ; une version majeure demande une nouvelle attestation.

**Sur place avant le premier vrai match** : soirée à blanc en mode formation avec les vraies tablettes, le vrai réseau et le TPE, coupure volontaire du Wi-Fi pour voir le hors-ligne ; caissières formées.
