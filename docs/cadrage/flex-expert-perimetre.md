# Flex Expert — Cadrage du périmètre (v1)

**Objet** : figer ce qui est *dans* et *hors* du produit avant d'écrire le cahier des charges technique. Document de référence ; toute demande future se tranche avec la règle du §6.

---

## 1. La promesse, en une phrase

Flex Expert est le logiciel de **caisse et de gestion financière** des buvettes de stade : il enregistre les ventes (comptoir + Click & Collect), les transforme en **vérité financière** (CA, TVA, coûts, résultat, rapprochement) et en **recommandations d'optimisation**, et alimente Flaix Ops en données.

Ce n'est pas un POS généraliste, ni une plateforme d'expérience fan.

---

## 2. Décisions actées — ne plus rediscuter

- **Option B** : Flex Expert *est* la caisse. Il enregistre le règlement, il **remplace** la caisse du lieu (pas d'overlay, pas deux systèmes qui comptent le CA).
- **Conséquence fiscale assumée** : c'est un système de caisse → obligations ISCA (inaltérabilité, sécurisation, conservation, archivage) + attestation éditeur (possible en auto-attestation depuis la LF2026).
- **Click & Collect** = canal avec sa **propre caisse** (Break Eat / Stripe), fiscalisé côté Break Eat. Flex Expert l'**agrège**, il ne le re-fiscalise pas.
- **Un produit = un SKU, un stock.** Le **canal** différencie (comptoir / C&C). L'allocation C&C est un **plafond**, pas un stock séparé.
- **Offline résilient** (vendre pendant une coupure) + **web** pour la direction.
- **Le code calcule, l'IA narre.** Rien d'Ops ni d'LLM dans le chemin critique d'encaissement.

---

## 3. Dans le périmètre — Flex Expert

| Bloc | Contenu |
|---|---|
| **Caisse** | Saisie produits, validation du paiement (après TPE), remises, annulations/remboursements, journal fiscal inaltérable, clôtures Z / événement, multi-buvette / multi-caisse / multi-événement, offline + synchro périodique |
| **Finance** | CA HT/TTC, TVA (5,5 / 10 / 20 %), ventilation, CA / spectateur, export FEC vers l'expert-comptable |
| **Rapprochement** | Ventes → net → banque par canal (comptoir TPE, C&C Stripe) ; écarts espèces et CB par caissier |
| **Coûts & résultat** | Matière, masse salariale, TPE, logiciel, abonnement, loyer, frais spécifiques → coût de fonctionnement par buvette + résultat net |
| **Stock** | Inventaire valorisé début/fin, écart valorisé, coulage vs offerts tracés, allocation de canal |
| **Optimisation** | Prix app/buvette recommandés, marges & ratios (food/beverage cost), produits à revoir — **règles déterministes** |
| **Agrégation** | Par match / mois / saison, clôture événement, comparaison inter-événements |
| **Facturation** | Facture Break Eat (commission + modules) + exports PDF |
| **Accès** | Rôles & permissions (opératrice / resp. stand / directeur) |
| **Connecteur** | Ingestion Break Eat (canal C&C) dans le modèle canonique |

---

## 4. Hors périmètre — et où ça va

| Fonction | Verdict | Destination |
|---|---|---|
| Fidélité, CRM, données client | Hors | Autre produit |
| In-seat ordering, kiosques | Hors | Canal (éventuellement Break Eat, plus tard) |
| Heatmap, temps de service, dispatch temps réel, capacité | Hors | **Flaix Ops** |
| Forecast, staffing prédictif, copilote IA, questions en langage naturel | Hors | **Flaix Intelligence** (V3, après fiabilité data) |
| Billetterie complète, multi-sites / groupe, ERP | Hors V1 | V2+ |
| Paie (bulletins, DSN, convention HCR) | Hors | Intégration tierce — **jamais construit** |
| Comptabilité certifiée / tenue comptable | Hors | Export FEC vers expert-comptable |
| Connecteur/overlay multi-POS pur | Hors V1 | Acte 2 (après avoir gagné en étant la caisse) |
| POS généraliste (toutes les features de Zelty/L'Addition) | Non | Caisse minimale + optimisation, pas plus |

### Note V2 — Encaissement sur TPE intégré (SoftPOS)

Certains lieux voudront encaisser **directement sur un terminal intelligent** (produits + paiement sur le même appareil, sans système à côté — cf. Digifood). À développer en **V2**, avec ces partis pris actés :

- **Via un prestataire SoftPOS, jamais notre propre monétique.** Terminal Android tout-en-un (Sunmi/PAX) ou Tap-to-Pay téléphone. Le prestataire porte l'agrément + PCI.
- **Cible : Stripe Terminal + SDK React Native officiel** — cohérent avec Stripe déjà utilisé pour Break Eat (le settlement alimente automatiquement le rapprochement). Adyen en plan B multi-acquéreur.
- **Flux intégré** : commande → `collectPayment(montant)` → lecture carte → résultat + `transaction_id` → vente enregistrée payée → journal fiscal. Supprime le « validé sans payé » et automatise le rapprochement CB.
- **Trois points durs à spécifier** : idempotence (un retry ≠ deux ventes), gestion du « payé mais réponse perdue » (réconcilier par `transaction_id`), et **offline limité** (cash offline OK, carte = autorisation en ligne requise).

---

## 5. Frontières entre les produits Flaix

- **Flex Expert** — caisse + vérité financière + optimisation.
- **Break Eat** — canal de commande digital (Click & Collect).
- **Flaix Ops** — intelligence opérationnelle (dispatch, capacité, prévision). *Consomme* la donnée, ne l'enregistre pas.
- **Flaix Intelligence** — prévision, recommandation, copilote. V3.

**Le lien entre eux n'est pas un fil direct, c'est un modèle de données canonique partagé** (même `event`, même `revenue_center`/stand, même SKU). C'est le vrai actif stratégique.

---

## 6. La règle anti-dérive — le test

Avant d'ajouter **toute** fonction, une seule question :

> « Sert-elle à établir la vérité financière ou à optimiser le résultat de la buvette ? »

- **Oui** → Flex Expert.
- Elle sert l'opérationnel terrain (flux, capacité, temps) → **Flaix Ops**.
- Elle prédit / recommande via IA → **Flaix Intelligence**.
- Elle sert le fan (fidélité, expérience) → **hors périmètre**.

**En cas d'hésitation : hors périmètre par défaut.**

---

## 7. Reste à trancher (avant / pendant le cahier des charges)

- Validation du périmètre fiscal par un **fiscaliste** avant l'auto-attestation.
- Schéma de **numérotation continue offline** multi-tablettes (contrainte du moteur de transaction).
- Clé de répartition des **frais fixes** (loyer : au CA ou à la surface ?).
- **Élasticité de la demande** pour fiabiliser l'optimisation prix — donnée absente aujourd'hui.
- **Récupération automatique du crédit banque** comptoir (manuel au départ ; payout Stripe automatisable pour le C&C).

---

## Risque n°1 — rappel

**La dispersion.** Ce document existe pour ça. Le benchmark et les grands acteurs vont te tenter avec la fidélité, l'IA, le multi-sites, le temps réel. Chaque « oui » hors périmètre repousse la V1 et dilue l'edge. La ligne à tenir : **caisse + vérité financière + optimisation, sur tes buvettes, d'abord.** Le reste est un autre produit, ou plus tard.
