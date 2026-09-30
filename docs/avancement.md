# Avancement — reprise après coupure

Mis à jour le 2026-09-30 (après l'étape 4). Pour reprendre : lire ce fichier, puis le dossier §15.99.

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | **fait le 2026-09-30** (dossier §15.100) |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | **fait le 2026-09-30** (dossier §15.101) |
| 3 | Clôtures : assistant de clôture du match | **fait le 2026-09-30** (dossier §15.102) — étape « Restes » en attente du module Stock |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | **fait le 2026-09-30** (dossier §15.103) |
| 5 | Équipe : fiches, planning, masse salariale | à faire — prochaine étape |
| 6 | Stock : mise en place, comptage, réserve et livraisons | à faire |

## Points d'entrée utiles pour l'étape 5

- Module validé : dossier §14 « Module 14 — Masse salariale et employeur », §15.65, §15.72, §15.80, §15.87 (planning, frise horaire) ; prototype isolé `0fbe1abf…` (lien au §14).
- Déjà construit : fiches des caissières et tablettes (`apps/web/src/pages/equipe/Equipe.tsx`, `apps/api/src/routes/equipe.ts`) — les fiches du module 14 (statut, taux horaire) s'y ajoutent.
- Les salaires sont des données personnelles : jamais envoyées à une caissière, exclues de l'assistant IA (§15.95).

## Reste à faire hors modules

- Résultats : rapport de soirée figé et imprimable, envoi par e-mail à la clôture ; historique des coûts matière (avec le Stock).

- Clôtures : sorties d'espèces vers le coffre pendant le match (question à Rémi) ; e-mail de notification d'une rectification de Z (quand l'envoi d'e-mails existera).

- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Copie de la sauvegarde hors du serveur + essai de restauration.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
