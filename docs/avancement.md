# Avancement — reprise après coupure

Mis à jour le 2026-10-01 (6 étapes + coffre + clôtures de période + copie chiffrée des sauvegardes + mode formation + export comptable + Click & Collect + vue téléphone + coûts par buvette + fidélité gestion + factures fournisseurs). Pour reprendre : lire ce fichier, puis le dossier §15.99 à §15.115.

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

**Repris en partie**

| Prototype | Déjà dans le logiciel | Manque |
|---|---|---|
| 5 Marges & ratios | Résultats → marge produit par produit (coût matière CUMP du Stock) | cibles de marge par catégorie et par produit (§15.78) |
| 6 Optimisation | Résultats → « Pistes pour le prochain match » | croisement volume × marge complet, écarts entre stands, coût des ruptures, actions classées par impact |
| 9 Reporting de soirée | les chiffres sont dans Résultats | rapport figé du match, imprimable, envoyé par e-mail à la clôture |
| 11 Gestion financière | Résultats → TVA collectée, moyens de paiement, personnel | dépenses catégorisées, commission Break Eat, cascade marge brute → nette, cible de marge nette de la soirée (écran « Configuration cible & marge ») |
| 16 Conformité / Profil & documentation | journal technique, vérification des chaînes, clôtures scellées | attestation, registre des versions, connexions par caisse, archive annuelle en format ouvert, accès vérificateur |
| 18 Centre d'alertes | Résultats → « À surveiller » | le centre et ses 6 alertes (dépend des cibles de marge et des prix fournisseurs) |

**Pas encore commencé**

| Travail | Remarque |
|---|---|
| Alerte de rupture poussée sur téléphone | suppose l'envoi de notifications |

**Plus tard (décidé par Rémi)** : 19 Fidélité, 20 Wallet & campagnes, Facturation (facture Break Eat, rapprochement fournisseur), 17 Back-office éditeur, assistant IA, recettes et matières premières.

## Ordre fixé par Rémi le 2026-09-30 (dossier §15.109) — « développe, sans t'arrêter »

| # | Module | État |
|---|---|---|
| 1 | Mode formation « FACTICE » | **fait le 2026-09-30** (§15.109) |
| 2 | Export pour l'expert-comptable | **fait le 2026-09-30** (§15.110) — format à confirmer par le comptable (G.20) |
| 3 | Click & Collect | **fait le 2026-10-01** (§15.111) — ventes C&C : pas de raccordement à l'app Break Eat pour l'instant |
| 4 | Vue téléphone du directeur | **fait le 2026-10-01** (§15.112) — écran « En direct » |
| 5 | Coûts par buvette | **fait le 2026-10-01** (§15.113) — frais mensuels datés par stand |
| 6 | Fidélité | **partie gestion faite le 2026-10-01** (§15.114) ; partie caisse (dépenser des points, code promo) à faire : choix « sans réseau » à valider |
| 7 | Wallet & campagnes | **mis de côté** (§15.115) — carte reportée par Rémi ; campagnes : service d'e-mails et domaine à choisir |
| 8 | Facturation | **factures fournisseurs (12b) faites le 2026-10-01** (§15.115) ; 12a (Break Eat) avec le back-office |
| 9 | Back-office éditeur | **prochain** |

**À voir avec Rémi, ne pas construire seul** : Conformité (dossier bien structuré à préparer ; y joindre les points prévus à revoir ensemble), recettes / matières premières, IA ; serveur de production (Rémi s'en occupe).

## Ancienne proposition d'ordre (remplacée par le tableau ci-dessus)

1. **Mode formation « FACTICE »** — pour que les essais ne se mélangent jamais aux vrais chiffres.
2. **Conformité** : attestation, registre des versions, connexions par caisse, archive annuelle, accès vérificateur, export pour l'expert-comptable.
3. **Passage en production** : vraie base neuve, seule la configuration du directeur recopiée, sous-domaine Break Eat. Préalables : réponse écrite de l'expert-comptable (NF525), décision d'hébergement (§15.108), copie OVH réglée et essai de restauration réussi.
4. **Gestion financière complète + cibles de marge**.
5. **Reporting de soirée** figé, imprimable, envoyé par e-mail (choisir un service d'envoi d'e-mails ; sert aussi à la notification des rectifications).
6. **Centre d'alertes + Optimisation complète**.
7. **Click & Collect**, après révision des règles de prix.
8. Puis les modules « plus tard ».

## Reste à faire hors modules

- **Copie des sauvegardes chez OVH** : scripts en service et essayés sur le serveur le 2026-09-30 (faux stockage, clé jetable : chiffrement, envoi, mauvaise clé refusée, restauration complète). **Attend Rémi** : créer le stockage OVH puis lancer `sudo flaix-admin sauvegarde-externe` (guide serveur, « Copie des sauvegardes chez OVH »), puis `sudo flaix-admin essai-restauration`.
- Premier mois de l'exercice : à régler par le directeur de chaque lieu (Paramètres → Le lieu), avec son expert-comptable.
- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
- Conservation des tickets sans limite : décidée (§15.106) ; question RGPD posée (G.19).
