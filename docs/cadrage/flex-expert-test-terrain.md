# Flex Expert — Grille de test terrain

**But** : confronter le prototype à l'expert directeur **et à une opératrice**, pour décider quoi **garder, retirer, restructurer** avant le cahier des charges. On cherche à **invalider**, pas à confirmer.

---

## Méthode (à lire avant)

- **Deux profils, deux moments.** L'opératrice teste la **caisse** (écran Commande). Le directeur teste la **gestion/finance**.
- **Ne guide pas.** Donne la tâche, tais-toi, observe. La friction que tu vois vaut plus que ce qu'ils disent.
- **La question en or**, à poser à chaque profil : « *Qu'est-ce que tu fais aujourd'hui que ce logiciel ne te laisse pas faire ?* »
- **Note les verbatims exacts**, pas ton interprétation.
- **Barème par écran** : ✅ fluide · ⚠️ hésitation · ❌ blocage.
- **Un bon test retire des choses.** Si un écran ne sert à personne, c'est une victoire de le supprimer.

---

## Test 1 — Le seul qui peut TOUT invalider : l'encaissement en rush (opératrice)

Chronomètre. Compare au temps sur sa **caisse actuelle**.

| Scénario | Temps | Nb de gestes | Erreur ? |
|---|---|---|---|
| 1 article, paiement CB | | | |
| 3 articles, paiement CB | | | |
| Espèces avec rendu monnaie | | | |
| Vente avec remise | | | |
| Annulation d'un article | | | |

**Hypothèse à casser** : « la caisse Flex est au moins aussi rapide que l'actuelle ». **Si elle est plus lente en rush, rien d'autre ne compte** — c'est le cœur du métier le soir du match.

Cible à valider avec elle : encaissement standard en **≤ ___ secondes**.

---

## Test 2 — Grille par écran

Pour chaque écran : fais faire la **tâche**, observe, note.

| Écran | Profil | Tâche concrète | Ce qu'on cherche à invalider | Note | Manque / en trop | Verbatim |
|---|---|---|---|---|---|---|
| **Commande** | Opératrice | Encaisser une commande mixte, cash + rendu, une remise, une annulation | Est-ce assez rapide et clair sous pression ? | | | |
| **Ventes & CA** | Directeur | Retrouver le CA d'un stand, puis d'une caisse | L'info est-elle là où il la cherche ? | | | |
| **Journal / Tickets** | Directeur | Retrouver un ticket annulé et lire sa trace | Lisible et crédible pour un contrôle ? | | | |
| **Inventaire** | Resp. stand | Saisir un comptage de fin, lire l'écart valorisé + alerte stock | Utilisable vite en fin de service ? | | | |
| **Contrôles** (espèces/CB/offerts) | Resp./Dir. | Rapprocher une caisse, tracer un offert | Correspond à leur pratique réelle ? | | | |
| **Fin de soirée** | Directeur | Lire le résultat net et le coulage | Y croit-il ? Les chiffres lui parlent-ils ? | | | |
| **Coûts par buvette** | Directeur | Lire le coût de fonctionnement d'un stand | La clé de répartition est-elle acceptée ? | | | |
| **Marges & ratios** | Directeur | Lire food/beverage cost, produits à revoir | Les seuils correspondent-ils à son métier ? | | | |
| **Optimisation** | Directeur | Lire une reco de prix, l'« appliquer » | L'appliquerait-il vraiment ? | | | |
| **Click & Collect** | Directeur | Comprendre la caisse C&C et la commission | Le modèle « une caisse C&C par stand » colle-t-il ? | | | |
| **Clôture événement** | Directeur | Clôturer l'événement | Le rituel correspond-il au sien ? | | | |
| **Facturation Break Eat** | Directeur | Lire la facture du mois | Les montants et le format sont-ils justes ? | | | |
| **Config produits** | Dir./Resp. | Créer et modifier un produit (TVA, prix, coût) | Est-il autonome, sans toi ? | | | |
| **Masse salariale** | Directeur | Lire le ratio masse salariale / CA | Utile pour ses décisions ? | | | |

---

## Test 3 — Les questions stratégiques que SEUL le terrain tranche

Ces réponses conditionnent l'architecture et le cahier des charges. Note la réponse **réelle**, pas celle qui t'arrange.

- **Cash** : quelle fréquence réelle aujourd'hui ? qui le gère (intérim / restaurateur externe) ?
- **Restaurateurs externes** : entité distincte (leur TVA, leur caisse, leur responsabilité) ou sous le système du lieu ?
- **Acquéreur / monétique** : le lieu a-t-il déjà un contrat bancaire ou un TPE imposé ?
- **Caisse existante** : y a-t-il déjà une caisse certifiée à remplacer, ou rien du tout ?
- **C&C** : partout, ou seulement quelques stands ? une caisse C&C par stand, c'est réaliste ?
- **TVA** : quelle grille le lieu applique-t-il *vraiment* ? (vérifier ta config 5,5 % sur boisson/dessert)
- **Seuils & ratios** : quel seuil de stock faible par produit ? quels ratios cibles réels ?
- **Rôles** : qui doit voir le résultat net, qui ne voit que sa caisse ?

---

## Synthèse (à remplir après le test)

- **3 forces confirmées** : 
- **3 manques bloquants** : 
- **3 choses à retirer** (en trop) : 
- **Décision** — garder tel quel / restructurer quoi / abandonner quoi : 

---

*Rappel : l'objectif de ce test n'est pas d'être rassuré, c'est de trouver ce qui casse. Un test qui ne révèle aucun problème est un test raté.*
