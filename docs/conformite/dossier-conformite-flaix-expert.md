# FlaiX Expert — Dossier de conformité du système de caisse

**Éditeur** : Break Eat App (forme sociale et SIREN à reporter depuis l'extrait Kbis).
**Logiciel** : FlaiX Expert, logiciel de caisse et de gestion pour buvettes de stades et de patinoires.
**Version du dossier** : 0.1, du 2026-10-03. **Version du logiciel couverte** : aucune pour l'instant. Le logiciel est en **version de test** et la racine de version majeure sera fixée au passage en production (partie 12).
**Plan** : celui de Rémi Notta (20 parties, OneDrive « FLAIX EXPERT — DOSSIER DE CONFORMITÉ DU SYSTÈME DE CAISSE »), réécrit pour la caisse FlaiX Expert le 2026-10-03, avec ses ajouts (parties 21 à 28).

> **Comment lire ce dossier.** Chaque partie dit ce qui est **construit**, la **preuve** (fichier de code ou test automatique du dépôt), et ce qui **reste à faire** ou **à fournir** (par Rémi, l'avocat ou l'expert-comptable).
> **Ce dossier présente des faits techniques. Il ne tranche aucune question juridique ou fiscale** : celles-ci sont posées à l'expert-comptable (`docs/questions-expert-comptable.md`) et, si Rémi le décide, à un avocat (partie 17).
> Les références « §15.x » renvoient au dossier projet `docs/flaix-gestion-dossier-projet.md`, qui contient le raisonnement complet.

**États** : CONSTRUIT (en service, testé) · PARTIEL · À CONSTRUIRE · À FOURNIR (document ou décision hors code).

---

## Tableau de bord

| Partie | Sujet | État |
|---|---|---|
| 01 | Attestation individuelle de l'éditeur | À FOURNIR + À CONSTRUIRE (téléchargement dans l'application) |
| 02 | Identification du logiciel et de la version | À CONSTRUIRE (numéro de version, registre) |
| 03 | Périmètre fonctionnel de la caisse | CONSTRUIT (décrit ici) |
| 04 | Documentation technique | CONSTRUIT (décrit ici) |
| 05 | Matrice de conformité fiscale | CONSTRUIT (ci-dessous) |
| 06 | Inaltérabilité | CONSTRUIT |
| 07 | Sécurisation | CONSTRUIT, sauf compte vérificateur (À CONSTRUIRE) |
| 08 | Conservation | CONSTRUIT (conservation sans limite, question RGPD G.19 posée) |
| 09 | Archivage fiscal annuel | À CONSTRUIRE |
| 10 | Journalisation et traçabilité | CONSTRUIT |
| 11 | Annulations, offerts, remises, rectifications | CONSTRUIT |
| 12 | Gestion des versions | À CONSTRUIRE (registre) ; règle majeure / mineure écrite ici |
| 13 | Procédure de mise à jour | PARTIEL (sauvegarde avant chaque mise en ligne ; étapes de conformité à formaliser) |
| 14 | Tests de conformité | CONSTRUIT pour A, B, C, F ; D (archivage) à construire ; E (paiements intégrés) le jour venu |
| 15 | Contrôle d'intégrité | CONSTRUIT |
| 16 | Sauvegardes | PARTIEL (sur le serveur : fait ; copie chiffrée hors serveur : attend le stockage OVH) |
| 17 | Avis juridique | À FOURNIR (décision de Rémi) |
| 18 | Validation comptable | À FOURNIR (questions prêtes) |
| 19 | Historique du dossier | Tenu dans ce fichier (Git) |
| 20 | Documents remis aux clients | À CONSTRUIRE (espace « Conformité » du lieu) |
| 21 | Vente sans réseau | CONSTRUIT |
| 22 | Mode formation | CONSTRUIT |
| 23 | Clôtures et totaux | CONSTRUIT |
| 24 | Ticket client et duplicata | CONSTRUIT (sur demande) ; obligation par défaut à confirmer (G.18) |
| 25 | Contrôle inopiné et accès de l'administration | PARTIEL |
| 26 | Obligations propres à l'éditeur (code de chaque version) | PARTIEL (Git) ; étiquette par version à mettre en place |
| 27 | Évolution prévue : TPE Android avec prestataire de paiement | À VENIR (version majeure) |
| 28 | Limites assumées | Écrites ici |

---

## 01 — Attestation individuelle de l'éditeur

**Ce que c'est.** Le document par lequel **Break Eat App**, éditeur, atteste que FlaiX Expert respecte les quatre conditions de l'article 286, I-3° bis du CGI : **inaltérabilité, sécurisation, conservation, archivage**. Modèle de l'administration : **BOI-LETTRE-000242**. Depuis le **21/02/2026** (loi n° 2026-103, art. 125), l'attestation de l'éditeur et le certificat d'un organisme accrédité sont deux preuves **au choix** (§15.1). Cette possibilité avait été supprimée en 2025, puis rétablie : elle peut changer à nouveau.

**Contenu à prévoir** (§15.9 point 2) :
- identité de l'éditeur : Break Eat App, forme, SIREN, adresse, représentant légal ;
- logiciel : FlaiX Expert ; **version** et **racine de la dernière version majeure** ;
- **nominative** : identité du lieu (raison sociale, SIRET) et **date d'acquisition** ;
- déclaration de conformité aux quatre conditions ;
- **engagement de l'éditeur** à n'utiliser les sous-versions que pour des versions mineures (BOFiP §380) ;
- date et signature du représentant légal.

**État.**
- À FOURNIR (Rémi) : le texte définitif sur le modèle BOI-LETTRE-000242, et le représentant légal signataire.
- À CONSTRUIRE : l'attestation de chaque lieu **générée et téléchargeable depuis son application** (Paramètres → Conformité), pré-remplie avec l'identité du lieu et la version en service. Le contrôle de l'art. L80 O du LPF est inopiné : le lieu doit pouvoir la présenter sans appeler l'éditeur (partie 25).
- À CONSTRUIRE : dans le back-office, la liste des attestations à réémettre après une version majeure.

---

## 02 — Identification de FlaiX Expert et de la version

**Construit.**
- Chaque mise en ligne est un dossier daté sur le serveur (`/srv/flaix/versions/AAAAMMJJ-HHMMSS`), affiché dans le back-office (« Version en service »).
- Le code de chaque mise en ligne est un commit Git identifié, poussé sur le dépôt privé `Break-Eat-APP/flaix-expert`.
- Environnement affiché à l'écran : développement, test ou production (bandeau).
- Un seul logiciel pour tous les lieux : pas de version propre à un client (§15.5 point 3).

**À construire.**
- **Numéro de version** lisible (`1.0.0` = première version de production = racine majeure), affiché dans l'application et sur l'attestation.
- **Registre des versions** (partie 12) : numéro, date de mise en service, nature majeure ou mineure, modifications, justification du classement.
- **Correspondance lieu ↔ version** : un seul serveur, donc tous les lieux ont la même version à un instant donné. Le registre suffit à dire quelle version un lieu utilisait à une date donnée.

**Modules couverts par l'attestation** : la caisse (vente, annulation, sessions, Z de caisse et de coffre, clôtures, journal technique). **Hors champ fiscal** : stock, planning, marges, fidélité (hors dépense de points à la caisse, qui sera une donnée d'encaissement), factures fournisseurs, Click & Collect (calculateur de prix).

---

## 03 — Périmètre fonctionnel de la caisse *(réécrit pour FlaiX Expert)*

**Ce qu'est une opération d'encaissement dans FlaiX Expert.** Une **vente** saisie par une caissière (ou le directeur) sur une **tablette enregistrée comme caisse**, pendant un **match ouvert** : produits, quantités, prix en vigueur, TVA par taux, remise ou offert éventuel avec motif, **mode de règlement** (espèces ou carte), montant TTC. Chaque vente reçoit un **numéro de justificatif séquentiel propre à la caisse** (préfixe de caisse) et est **scellée** (partie 06).

**Les systèmes en présence aujourd'hui :**

| Système | Rôle | Données | Responsable |
|---|---|---|---|
| **FlaiX Expert** (tablette + serveur) | Enregistre chaque vente et son mode de règlement ; clôtures ; journal technique | Tickets ligne à ligne, sessions, Z, clôtures, journal | Le **lieu** (assujetti), données hébergées par Break Eat App pour son compte |
| **TPE bancaire du lieu** (non relié) | Encaisse la carte | Transaction bancaire | Le lieu et sa banque |
| **Espèces** | Tiroir de chaque caisse, comptées au Z ; remontées au coffre | Comptage, écart, motif | Le lieu |

**Ce que FlaiX Expert ne fait pas aujourd'hui** : il ne pilote pas le TPE, ne reçoit aucune donnée de carte et **n'utilise pas Stripe dans la caisse**. Le montant carte est **déclaré** par la caissière, **non vérifié** auprès de la banque (limite assumée, partie 28). Aucun remboursement par carte ne passe par le logiciel.

**Rôle de Break Eat App** : éditeur et hébergeur. **Aucun accès à l'encaissement** : le back-office ne voit ni montant, ni ticket, ni nom de salarié, et la base lui refuse toute écriture dans les données d'un lieu (tests B6 et B7).

**Évolution annoncée** (partie 27) : tablettes ou TPE Android FlaiX encaissant la carte par un prestataire de paiement (Stripe ou autre). Le périmètre de cette partie sera alors réécrit, dans une version majeure.

---

## 04 — Documentation technique *(réécrit pour FlaiX Expert)*

**Architecture.**
- **Serveur** : Node.js / TypeScript (Fastify) et **PostgreSQL**, sur un serveur OVHcloud **en France**, derrière un relais https (Caddy, certificat Let's Encrypt). Adresse de test : `flaixexpert.flaixlabs.com`.
- **Application** : web (React), installable sur tablette et téléphone. La caisse fonctionne **sans réseau** (partie 21).
- **Isolement des lieux** : sécurité par ligne de PostgreSQL. Chaque requête est faite dans le contexte d'un lieu, et un lieu ne voit ni n'écrit jamais les données d'un autre (tests « Isolement des lieux », `apps/api/test/conformite-base.test.ts`).
- **Deux rôles de base** : le serveur se connecte avec un rôle **sans droit de modification ni de suppression** sur les journaux. Les tables d'encaissement sont protégées par des **déclencheurs qui refusent toute modification, même au propriétaire des tables** (partie 06).

**Flux d'une vente.**
1. La caissière se connecte sur une **tablette enregistrée** avec son **code personnel** (4 chiffres, blocage après des codes erronés).
2. Elle ouvre sa caisse ; le serveur remet à la tablette la tête de chaîne de cette caisse.
3. Chaque vente est **calculée, numérotée, horodatée et scellée sur la tablette**, gardée en mémoire locale **avant** d'être affichée comme payée, puis envoyée au serveur.
4. Le serveur **rejoue exactement les mêmes calculs** (même code des deux côtés), vérifie la chaîne et inscrit l'opération. Il garde l'heure de la vente et note l'heure de réception.
5. Fin de service : **clôture de caisse**, puis **Z du tiroir** (espèces comptées, écart, motif au-delà du seuil). Fin de match : **Z du match** (clôture journalière). Puis clôtures mensuelle et annuelle (partie 23).

**Annulations et corrections** : partie 11. **Journalisation** : partie 10. **Accès** : partie 07. **Conservation** : partie 08. **Archivage** : partie 09. **Versions** : parties 12 et 13. **Sauvegardes** : partie 16. **Interfaces avec des tiers** : export pour l'expert-comptable (fichiers CSV mensuels tirés des Z scellés) ; aucun autre système ne reçoit de données d'encaissement.

**Code de référence** : `packages/domain/src/journal-caisse.ts` (champs scellés), `packages/domain/src/caisse-scellee.ts` (scellement tablette / serveur), `packages/domain/src/chaine.ts` (empreinte SHA-256), `db/migrations/` (droits et déclencheurs).

---

## 05 — Matrice de conformité fiscale

| Exigence (BOFiP BOI-TVA-DECLA-30-10-30) | Fonction FlaiX Expert | Preuve |
|---|---|---|
| **Inaltérabilité** — pas de modification ni de suppression ; correction par opération inverse (§90) | Journaux en écriture seule imposée par la base ; annulation = opération inverse rattachée | Tests A1, A2, A6, A8, A9 ; `conformite-base.test.ts`, `caisse.test.ts` |
| Chaînage fiable (§140) | Empreinte SHA-256 chaînée par caisse, par lieu (journal technique) et pour les clôtures | Tests A3, A4, A5 ; vérification d'intégrité |
| **Sécurisation** — identification des personnes (§130), droits | Comptes nominatifs, codes personnels, rôles, journal des connexions, tentatives refusées journalisées | Tests B1, B2, B6, B7 |
| Mode « école » identifié (§150) | Mode formation : lieu jumeau séparé, bandeau et mention « FACTICE » | Tests B3, B4 (`formation.test.ts`) |
| **Conservation** — données ligne à ligne, 6 ans (§155) | Aucune purge ; conservation sans limite (décision du 2026-09-30) | Partie 08 |
| Clôtures journalière, mensuelle, annuelle ; grand total ; total perpétuel (§170) | Z du match, clôture du mois, clôture de l'exercice, chaînées | Tests C2 à C6 (`periodes.test.ts`, `clotures.test.ts`) |
| **Archivage** — annuel, format ouvert, notice, support externe, date certaine (§220-260) | **À construire** (partie 09) | Tests D1 à D6 à écrire |
| Versions majeure / mineure (§330-380) | Règle écrite (partie 12) ; registre à construire | — |
| Documentation et code de chaque version (LPF L96 J) | Dépôt Git privé ; étiquette par version à mettre en place | Partie 26 |

---

## 06 — Inaltérabilité

**Construit.**
- **Aucune table d'encaissement n'accepte de modification ni de suppression** : le rôle du serveur n'a que les droits de lecture et d'ajout ; des déclencheurs refusent `UPDATE`, `DELETE` et `TRUNCATE` **même au propriétaire des tables** (journal de caisse, lignes de ticket, journal technique, Z de caisse et de coffre, clôtures, stock).
- **Prix datés** : un changement de prix crée un nouveau tarif avec sa date d'effet ; un ticket garde le prix en vigueur à son heure (test A9).
- **Chaque opération est scellée** : son empreinte SHA-256 couvre ses champs (numéro, heure, type, lieu, stand, caisse, match, opérateur, mode de règlement, montant, détail complet des lignes et de la TVA) et l'empreinte de l'opération précédente de la même caisse. Retirer, modifier ou intervertir une opération casse la chaîne à l'endroit exact (tests A3, A4, A5).
- **Numéro de justificatif unique** par caisse, imposé par la base (test A8).
- **Auteur et heure** sur chaque opération ; valeurs avant et après dans le journal technique pour tout changement de paramétrage (partie 10).

**Choix assumé** : **chaînage sans signature par clé privée** (décision de Rémi, §15.26). Le chaînage est admis par le BOFiP §140. Sa limite est écrite en partie 28.

---

## 07 — Sécurisation

**Construit.**
- **Authentification** : mot de passe (6 caractères au moins, les plus courants refusés ; empreinte argon2id ; 10 essais par quart d'heure et par adresse) pour les directeurs et les comptes FlaiX Expert ; **code personnel à 4 chiffres** pour les caissières, valable seulement sur une **tablette enregistrée**, avec blocage temporaire après des codes erronés.
- **Rôles** : directeur, caissière, vérificateur (prévu), éditeur. Une caissière ne peut ni clôturer, ni changer un paramètre, ni activer la formation : chaque tentative est refusée **et inscrite au journal** (test B2).
- **Séparation éditeur / lieu** : comptes FlaiX Expert distincts, sans lieu ; aucun accès aux données d'encaissement (tests B6, B7).
- **Protection des échanges** : https ; cookies de session `httpOnly` ; requêtes de modification acceptées seulement en JSON et depuis une origine autorisée.
- **Base** : sécurité par ligne ; le serveur n'a aucun droit de modification sur les journaux ; mots de passe de la base conservés sur le serveur seulement.
- **Paramétrage de sécurisation séparé du paramétrage métier** : le directeur règle produits, prix et stands ; rien de ce qu'il règle ne touche au scellement ni aux clôtures (§15.5 point 3).

**À construire.**
- **Compte vérificateur temporaire** (voie B du §15.12) : lecture seule, période et durée limitées, créé par le directeur ; création et connexions journalisées (test B5).
- **Niveau 2 du back-office** (support sur autorisation du lieu) : lecture seule, limitée dans le temps, journalisée chez le lieu. Pas en service.

---

## 08 — Conservation des données

**Données conservées pour chaque opération** : numéro de justificatif, date et heure (vente et réception par le serveur), caisse, stand, match, opérateur, lignes (produit, quantité, prix, TVA), remise ou offert et motif, mode de règlement, montant TTC, ventilation de TVA, empreintes. Également : sessions de caisse, Z (comptage, écart, motif, rectifications), remontées au coffre, clôtures et totaux, journal technique.

**Durée.**
- Obligation fiscale : **6 ans** (LPF art. L102 B).
- Décision de Rémi du 2026-09-30 : **conservation sans limite**, aucune purge.
- Question posée à l'expert-comptable (G.19) : compatibilité avec le RGPD des données personnelles des tickets (nom de qui a servi, numéro d'abonné).

**Lieu** : France (hébergeur OVHcloud). **Déclaration du lieu de stockage** : due par le lieu à son service des impôts dès qu'un tiers héberge. L'application la pré-remplira (À CONSTRUIRE, partie 20).

**Protection** : parties 06, 07 et 16.

---

## 09 — Procédure d'archivage *(à construire)*

**Une sauvegarde n'est pas une archive** (BOFiP §220) : la sauvegarde sert à repartir après une panne ; l'archive est **figée, scellée, datée, lisible sans le logiciel**.

**Spécification** (§15.15 et §15.16, archive de référence produite le 2026-09-11) :
- **une archive par exercice et par lieu**, générée à la clôture de l'exercice ;
- fichiers **CSV UTF-8 sans BOM**, séparateur `;`, fin de ligne CRLF, décimale point, heures ISO 8601 : opérations, lignes de ticket, journal technique, sessions de caisse, clôtures, cumuls ;
- **notice en français**, **empreintes SHA-256** de chaque fichier et empreinte de scellement ;
- copie tableur **pour la lecture seulement, qui ne fait pas foi** ;
- **téléchargeable par le lieu** et conservée hors du logiciel (support externe) ;
- **vérifiable sans FlaiX Expert** par un script indépendant fourni.

**Tests à écrire** : D1 à D6 du §15.19 (structure, vérification indépendante, lecture sans le logiciel, altération détectée, totaux conservés en ligne après une purge, sauvegarde ≠ archive).

---

## 10 — Journalisation et traçabilité

**Construit — deux journaux chaînés.**
- **Journal de caisse** (par caisse) : ouverture, ventes, annulations, clôture.
- **Journal technique** (par lieu, numéroté sans trou, chaîné) : connexions, refus et blocages, déconnexions, changements de mot de passe, accès refusés, création et modification de stands, caisses, produits et **tarifs** (avant / après), réglages de caisse, ouverture et clôture des matchs, Z de caisse et de coffre, **rectifications**, clôtures du mois et de l'exercice, tickets édités, tablettes enregistrées ou retirées, entrées et sorties du mode formation, exports pour l'expert-comptable, vérifications d'intégrité (y compris celles faites par FlaiX Expert), options activées par FlaiX Expert, comptes directeur ajoutés et mots de passe provisoires donnés par FlaiX Expert.

**Chaque entrée** porte l'auteur, la date et l'heure, et une référence à l'objet concerné. Le directeur consulte le journal dans Paramètres → Conformité ; le journal est vérifiable à tout moment (partie 15).

Liste complète des types : `packages/domain/src/journal-technique.ts`.

---

## 11 — Annulations, offerts, remises, rectifications *(réécrit pour FlaiX Expert)*

FlaiX Expert **ne fait pas de remboursement par carte** : le TPE n'est pas relié. Les corrections possibles sont les suivantes. **Aucune n'efface l'opération d'origine.**

| Situation | Ce que fait FlaiX Expert | Trace |
|---|---|---|
| Erreur avant validation du ticket | Rien n'est enregistré tant que la vente n'est pas validée | — |
| **Annulation d'un ticket** | Opération inverse du même montant, rattachée au ticket d'origine, avec motif et auteur ; le ticket d'origine demeure (test A6) | Journal de caisse |
| **Offert** | Montant offert sur le ticket scellé, avec motif obligatoire, déduit du total et compté à part ; son traitement en TVA est posé à l'expert-comptable (question C) | Ticket et Z |
| **Remise** (abonné) | Remise inscrite dans le ticket scellé, avec le numéro d'abonné | Ticket |
| **Erreur de comptage du tiroir** | **Rectification du Z** : nouvel enregistrement avec motif et signature en toutes lettres ; le Z d'origine demeure | Journal technique (`z_caisse_rectifie`) |
| **Erreur sur le coffre** | Annulation d'une remontée, rectification du Z du coffre, mêmes règles | Journal technique |
| **Erreur de prix d'un produit** | Nouveau tarif daté ; les tickets passés gardent leur prix (test A9) | Journal technique (`tarif_cree`) |

**Le jour où la carte sera encaissée par le logiciel** (partie 27) : paiement refusé, paiement annulé, remboursement total ou partiel par le prestataire, ticket réglé en deux moyens. Ce seront de nouveaux types d'opérations (§15.17), dans une version majeure.

---

## 12 — Gestion des versions

**Règle** (BOFiP §330-380, §15.5) :
- **version majeure** : toute modification qui touche l'une des quatre conditions (champs scellés, calcul des empreintes, droits et déclencheurs de la base, clôtures et totaux, conservation, archivage, flux d'encaissement). Elle **invalide l'attestation**, qui doit être **réémise à chaque lieu** ;
- **version mineure** : tout le reste (écrans, gestion, stock, planning, rapports…). L'attestation reste valable si elle désigne la racine de la dernière version majeure et si l'éditeur s'engage à ne créer de sous-versions que pour des versions mineures.

**Exemples** : la vente sans réseau, une signature par clé privée ou le paiement intégré (partie 27) sont **majeurs**. Le stock des ingrédients, le Click & Collect ou un nouvel écran de résultats sont **mineurs**.

**À construire** : le **registre des versions** (numéro, date, nature, modifications, justification du classement, tests rejoués), tenu dans le dépôt et visible dans le back-office.

---

## 13 — Procédure de mise à jour

**Construit** : chaque mise en ligne passe par le dépôt Git, les tests automatiques (environ 360), **une sauvegarde de la base juste avant**, puis le déploiement. Les migrations de base sont appliquées dans l'ordre et ne réécrivent jamais une donnée d'encaissement.

**À formaliser** (étapes de Rémi) :
1. développement ;
2. liste des modifications ;
3. **classement majeur ou mineur, justifié par écrit** ;
4. tests (plan complet rejoué pour une version majeure) ;
5. validation ;
6. **mise en ligne hors des heures de match** ;
7. inscription au registre des versions ;
8. mise à jour de ce dossier ;
9. **réémission des attestations** si la version est majeure.

---

## 14 — Tests de conformité *(réécrit pour FlaiX Expert)*

Les tests sont **automatiques**, rejoués à chaque modification, contre une vraie base PostgreSQL. Les tests **[F]** provoquent réellement la fraude et vérifient que la base la refuse ou la détecte.

| Groupe | Tests | Où | État |
|---|---|---|---|
| A — Inaltérabilité | A1, A2 (modification et suppression refusées), A3 à A5 (altération, suppression, inversion détectées), A6 (annulation), A8 (numéro unique), A9 (prix daté) | `conformite-base.test.ts`, `caisse.test.ts`, `api.test.ts` | CONSTRUIT |
| B — Sécurisation | B1 (connexions journalisées), B2 (accès refusés journalisés), B3 / B4 (formation), B6 / B7 (éditeur sans accès) | `api.test.ts`, `caissieres.test.ts`, `formation.test.ts`, `editeur.test.ts` | CONSTRUIT ; B5 (vérificateur) à construire |
| C — Conservation et totaux | C1 (Z du match), C2 à C6 (mois, exercice, grand total, perpétuel chaîné, pas de remise à zéro) | `clotures.test.ts`, `periodes.test.ts` | CONSTRUIT |
| D — Archivage | D1 à D6 | — | À CONSTRUIRE avec la partie 09 |
| E — Paiements intégrés | E1 à E10 (§15.19) | — | Le jour où la carte passe par le logiciel (partie 27) |
| F — Sans réseau | F1 à F4 (ventes hors ligne chaînées, reprise sans trou, deux caisses en même temps, clôture) | `caisse.test.ts` | CONSTRUIT |
| G — Ticket | Ticket édité sur demande, duplicata | `caisse.test.ts` | CONSTRUIT (sur demande) |

**À faire** : conserver les sorties datées de chaque exécution, rattachées au numéro de version (pièce à joindre au registre).

---

## 15 — Procédure de contrôle d'intégrité

**Construit.**
- **Vérification à la demande** par le directeur : relecture complète des chaînes de chaque caisse, du journal technique et des clôtures ; une rupture est localisée à l'opération exacte.
- **Vérification par FlaiX Expert** depuis le back-office (sans voir aucun montant), **inscrite au journal du lieu**, qui la voit.
- Le back-office signale un lieu dont la dernière vérification a trouvé une rupture.

**À écrire** : la procédure en cas d'anomalie (qui prévenir, quelles traces conserver, comment l'expliquer au lieu et, le cas échéant, à l'administration).

---

## 16 — Procédure de sauvegarde

**Construit.**
- Sauvegarde quotidienne de la base sur le serveur : 14 jours, et la sauvegarde du 1er de chaque mois gardée sans limite.
- Sauvegarde automatique **juste avant chaque mise en ligne**.
- Copie **chiffrée** hors du serveur vers un stockage OVHcloud en France : chiffrement avec une clé publique, **clé de restauration jamais stockée sur le serveur** ; commande d'**essai de restauration** qui compare la copie à la base en service.

**À faire (Rémi)** : créer le stockage OVH, régler la copie, réussir un essai de restauration. **Tant que ce n'est pas fait, il n'existe aucune copie hors du serveur.**

**Rappel** : la sauvegarde ne remplace pas l'archive (partie 09).

---

## 17 — Avis juridique

**À FOURNIR, sur décision de Rémi.** Un avocat fiscaliste ou en droit du numérique examinerait notamment :
- la qualification de FlaiX Expert au regard de l'article 286, I-3° bis du CGI ;
- l'attestation de l'éditeur et l'engagement des versions mineures ;
- la responsabilité de l'éditeur : art. 1770 undecies du CGI (15 % du chiffre d'affaires tiré du logiciel et solidarité) et art. 441-1 du code pénal (fausse attestation) ;
- le futur paiement intégré (partie 27) ;
- les contrats avec les lieux : conditions d'abonnement, sous-traitance RGPD.

Cet avis sécurise, il **ne remplace pas** l'attestation.

---

## 18 — Validation comptable *(réécrit pour FlaiX Expert)*

**À FOURNIR** : les réponses écrites de l'expert-comptable aux questions de `docs/questions-expert-comptable.md` :
- **A** : champ de l'obligation, cas d'un lieu tout par carte, attestation de l'éditeur ;
- **B** : TVA en buvette de stade ;
- **C** : remises, offerts, commission ;
- **D** : conservation et contrôle ;
- **G.18** : ticket obligatoire en buvette ;
- **G.19** : conservation sans limite et RGPD ;
- **G.20** : format de l'export, comptes ;
- **G.21** : données des abonnés.

**À vérifier par lui sur les vrais chiffres d'un premier match** :
- la concordance entre la somme des tickets, le Z du match et la clôture du mois ;
- le rapprochement des paiements carte déclarés avec les remises bancaires du TPE du lieu (contrôle manuel aujourd'hui, partie 28) ;
- le traitement des écarts de caisse et des offerts.

---

## 19 — Historique du dossier

| Version | Date | Version du logiciel | Modifications | Validé par |
|---|---|---|---|---|
| 0.1 | 2026-10-03 | test (avant 1.0.0) | Première rédaction sur le plan de Rémi : parties 03, 04, 11, 14 et 18 réécrites pour la caisse FlaiX Expert ; parties 21 à 28 ajoutées | à valider par Rémi |

Ce fichier est versionné avec le code (Git) : chaque modification est datée et attribuée.

---

## 20 — Documents remis aux clients *(à construire)*

Un espace **Paramètres → Conformité** dans l'application du lieu, où le directeur trouve à tout moment :
- son **attestation** nominative, à jour de la version en service ;
- la **version** utilisée et la date de sa mise en service ;
- ses **archives** d'exercice et la façon de les vérifier ;
- l'**export** des données d'une période (voie A du §15.12) et la création d'un **compte vérificateur** (voie B) ;
- la **déclaration du lieu de stockage** pré-remplie (nom et adresse de l'hébergeur) ;
- les **conditions d'utilisation**, la notice de conservation et d'archivage, et le contrat de sous-traitance RGPD.

Le journal technique et la vérification d'intégrité y sont déjà (Paramètres → Conformité).

---

## 21 — Vente sans réseau *(ajouté)*

**Construit** (§15.97). Un match sature souvent le réseau.
- Chaque vente est **scellée sur la tablette** (numéro, heure, empreinte chaînée à la précédente de la même caisse) et **gardée en mémoire locale avant d'être affichée comme payée**.
- La tablette renvoie les ventes en attente toutes les 8 secondes et dès le retour du réseau. Le serveur **vérifie chaque maillon** et garde l'heure de la vente ; il note à part l'heure de réception.
- **Aucun trou ni doublon** : numérotation propre à chaque caisse ; deux caisses hors ligne en même temps ne se gênent pas (test F3).
- La **clôture de caisse exige le réseau** et est refusée tant qu'un ticket manque (test F4).
- Le paiement carte se fait sur le TPE du lieu, qui a son propre réseau.

**Limite** : une tablette perdue ou détruite **avant** d'avoir envoyé ses ventes les perd. La clôture le révèle (trou dans la séquence), mais ne les reconstitue pas (partie 28).

---

## 22 — Mode formation *(ajouté)*

**Construit** (BOFiP §150, §15.109).
- **Un lieu d'entraînement jumeau**, séparé par la base comme n'importe quel autre lieu : une vente d'entraînement **ne peut pas** toucher un compteur du vrai lieu (test B4).
- La configuration est recopiée du vrai lieu et ne se modifie pas dans le lieu d'entraînement.
- **Bandeau rayé « MODE FORMATION — FACTICE »** non masquable, filigrane sur toute page imprimée, **mention en tête et en pied du ticket**.
- Tablettes mises en formation par le directeur ; bascule refusée si la vraie caisse est ouverte.
- Entrées, sorties et remises à zéro inscrites au **journal du vrai lieu**.

---

## 23 — Clôtures et totaux *(ajouté)*

**Construit** (BOFiP §170, §15.102, §15.107).
- **Z du match** (clôture journalière) : totaux, TVA par taux, grand total et **total perpétuel**, scellés. Le match ne se clôt pas tant qu'une caisse est ouverte, qu'un tiroir n'a pas son Z, que le coffre n'est pas compté ou que le stock mis en place n'est pas compté.
- **Clôture mensuelle** : une fois le mois terminé et tous ses matchs clos ; grand total du mois = somme de ses Z.
- **Clôture de l'exercice** : une fois l'exercice terminé et ses mois clôturés. Le premier mois de l'exercice est réglé par le directeur ; tant qu'il ne l'est pas, la clôture d'exercice est refusée.
- **Total perpétuel** : celui de la clôture précédente + grand total ; **jamais remis à zéro** (test C5). Chaque clôture est chaînée à la précédente.

---

## 24 — Ticket client et duplicata *(ajouté)*

**Construit** (§15.101) : décision de Rémi du 2026-09-30, **aucun ticket imprimé par défaut**. Sur demande du client, le directeur produit le ticket depuis le logiciel, avec les mentions du BOFiP §50 et l'identité du lieu. **Toute réédition est un duplicata, marqué comme tel et inscrit au journal** (`ticket_edite`).

**Question ouverte (G.18)** : l'exception « hôtellerie-restauration » de l'article D541-371 du code de l'environnement rend-elle le ticket **obligatoire par défaut** en buvette ? Si oui, il faudra une impression par caisse ou un ticket dématérialisé avec consentement (§15.18). **Ce dossier ne tranche pas.**

---

## 25 — Contrôle inopiné et accès de l'administration *(ajouté)*

**Le contexte** : le contrôle de l'art. **L80 O du LPF** est inopiné, dans les locaux professionnels, entre 8 h et 20 h. Le lieu doit présenter l'attestation et donner accès à ses données.

**Ce que le lieu doit pouvoir faire seul, en quelques minutes :**
1. **Présenter l'attestation** : À CONSTRUIRE (parties 01 et 20).
2. **Produire l'historique** :
   - CONSTRUIT : en ligne (tickets, Z, clôtures, journal technique, vérification d'intégrité) ;
   - À CONSTRUIRE : l'export d'une période en format ouvert et les archives d'exercice (partie 09).
3. **Démontrer la continuité** : le total perpétuel relie les clôtures. CONSTRUIT.
4. **Donner un accès en lecture seule** au vérificateur sans prêter son compte : À CONSTRUIRE (partie 07).

**C'est toujours le lieu qui donne l'accès, jamais l'éditeur** : Break Eat App n'a aucun accès aux données d'encaissement.

---

## 26 — Obligations propres à l'éditeur *(ajouté)*

**LPF art. L96 J** : l'éditeur conserve et communique sur demande **le code, les traitements et la documentation** de chaque version, **jusqu'à la fin de la troisième année suivant celle où la version a cessé d'être diffusée**. Sanction : 1 500 € (CGI art. 1734).

**Construit** : dépôt Git privé (`Break-Eat-APP/flaix-expert`), historique complet, avec le dossier projet et ce dossier dans le dépôt.

**À mettre en place** : une **étiquette Git par version** mise en service (inscrite au registre), et une **copie du dépôt hors de GitHub** (par exemple avec la copie chiffrée des sauvegardes).

**Qualité d'éditeur** : Break Eat App détient le code et maîtrise ses modifications (BOFiP §300). Aucun prestataire ne détient le code (décision de Rémi, §15.10). Tout développeur extérieur qui interviendrait sur la caisse devra céder ses droits par contrat.

---

## 27 — Évolution prévue : TPE Android avec prestataire de paiement *(ajouté)*

**Annoncé par Rémi le 2026-10-03** : *« il se peut que le logiciel évolue de façon à faire des tickets et ne pas encaisser directement sur nos TPE à nous ; il se peut que demain je développe nos propres TPE Android qui encaisseront toujours avec un PSP style Stripe. »*

**Ce que cela changera** (préparé au §15.17, plan de tests E du §15.19) :
- **Version majeure** : nouvelle attestation pour chaque lieu.
- Le paiement carte devient **constaté** (confirmation du prestataire) au lieu d'être déclaré, ce qui fait disparaître la principale limite de la partie 28.
- **Nouvelles données** dans chaque vente : prestataire, **référence de transaction**, statut (autorisé, capturé, refusé, annulé, remboursé), montants. **Aucune donnée de carte** dans FlaiX Expert.
- **Nouvelles opérations** : paiement refusé (enregistré, sans recette), paiement annulé, **remboursement total ou partiel** rattaché au ticket d'origine, ticket réglé en deux moyens.
- **Nouveau contrôle** : rapprochement quotidien entre les paiements carte du journal et les captures du prestataire ; tout écart affiché.
- **Le compte du prestataire est celui du lieu** (décision du 2026-09-11) : les fonds ne passent jamais par Break Eat App, ce qui écarte la question de l'agrément de l'ACPR. **À garder comme règle** : le jour où un euro transiterait par un compte de Break Eat App, la question se reposerait.
- **Clés d'accès restreintes** au strict nécessaire (terminal, lecture des transactions), chiffrées, révocables par le lieu.
- **Sécurité des cartes (PCI DSS)** : le questionnaire annuel incombe au lieu, commerçant ; il change selon l'intégration (à annoncer au lieu avant la vente du TPE).
- **Questions à reposer** : à l'expert-comptable, la partie A (cas d'un lieu tout par carte via un prestataire) ; à Stripe ou au prestataire choisi, la qualification de l'éditeur dans le périmètre PCI.

---

## 28 — Limites assumées *(ajouté)*

*Une limite écrite est défendable ; une limite tue ne l'est pas* (§15.14).

1. **Montant carte déclaré, non vérifié** : le TPE n'est pas relié ; une caissière peut déclarer « carte » une vente payée en espèces. Contrôle : rapprochement du Z avec les remises bancaires du TPE, par le lieu. Disparaît avec la partie 27.
2. **Chaînage sans signature par clé privée** : il détecte toute altération par un tiers, mais quelqu'un qui détient le code et l'accès complet à la base pourrait recalculer une chaîne. Admis par le BOFiP §140. Une signature par une clé gardée hors de la base supprimerait cette limite (version majeure, décision de Rémi).
3. **Tablette perdue avant l'envoi de ses ventes hors ligne** : les ventes non envoyées sont perdues. La clôture révèle le trou mais ne le comble pas (partie 21).
4. **Copie hors serveur pas encore réglée** : tant que le stockage OVH n'est pas en place, une destruction du serveur ferait perdre les données (partie 16).
5. **Archivage annuel, attestation, registre des versions et compte vérificateur pas encore construits** : ils sont la condition du passage en production.
