# Avancement — reprise après coupure

Mis à jour le 2026-09-30 (après l'étape 3). Pour reprendre : lire ce fichier, puis le dossier §15.99.

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | **fait le 2026-09-30** (dossier §15.100) |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | **fait le 2026-09-30** (dossier §15.101) |
| 3 | Clôtures : assistant de clôture du match | **fait le 2026-09-30** (dossier §15.102) — étape « Restes » en attente du module Stock |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | à faire — prochaine étape |
| 5 | Équipe : fiches, planning, masse salariale | à faire |
| 6 | Stock : mise en place, comptage, réserve et livraisons | à faire |

## Points d'entrée utiles pour l'étape 4

- Spécification visuelle validée : maquette `docs/maquettes/organisation-v2.html` (onglets de Résultats, graphiques) et dossier §15.95 (règles d'écran, « coût manquant », choix du match de comparaison).
- Données : `journal_caisse` + `ligne_ticket` (ventes par produit, par stand, par heure), `produit.cout_matiere_centimes` (marge, sinon « coût manquant »), `evenement.spectateurs`.
- Écran actuel : `apps/web/src/pages/Resultats.tsx` (mise en route du lieu).

## Reste à faire hors modules

- Clôtures : sorties d'espèces vers le coffre pendant le match (question à Rémi) ; e-mail de notification d'une rectification de Z (quand l'envoi d'e-mails existera).

- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Copie de la sauvegarde hors du serveur + essai de restauration.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
