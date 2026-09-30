# Avancement — reprise après coupure

Mis à jour le 2026-09-30 (après l'étape 1). Pour reprendre : lire ce fichier, puis le dossier §15.99.

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | **fait le 2026-09-30** (dossier §15.100) |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | à faire — prochaine étape |
| 3 | Clôtures : assistant de clôture du match | à faire |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | à faire |
| 5 | Équipe : fiches, planning, masse salariale | à faire |
| 6 | Stock : mise en place, comptage, réserve et livraisons | à faire |

## Points d'entrée utiles pour l'étape 2

- Journal des tickets du directeur : `apps/web/src/pages/caisse/MesCaisses.tsx` (onglet « Tickets du match », `DetailTicket`).
- Mentions du lieu (raison sociale, SIRET, TVA, adresse) : `apps/api/src/routes/lieu.ts`.
- Journal technique : `packages/domain/src/journal-technique.ts` (nouveau type pour chaque édition de ticket).

## Reste à faire hors modules

- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Copie de la sauvegarde hors du serveur + essai de restauration.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
