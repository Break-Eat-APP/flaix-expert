# Avancement — reprise après coupure

Mis à jour le 2026-09-30. Pour reprendre : lire ce fichier, puis le dossier §15.99.

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | à faire — prochaine étape |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | à faire |
| 3 | Clôtures : assistant de clôture du match | à faire |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | à faire |
| 5 | Équipe : fiches, planning, masse salariale | à faire |
| 6 | Stock : mise en place, comptage, réserve et livraisons | à faire |

## Points d'entrée utiles pour l'étape 1

- Rôles et sessions : `db/migrations/0001_socle.sql` (`membre.role` accepte déjà `operateur`), `apps/api/src/auth/routes.ts`, `apps/api/src/auth/contexte.ts`.
- Écran de caisse : `apps/web/src/pages/caisse/EcranCaisse.tsx` ; session gardée sur l'appareil : `apps/web/src/session.tsx`.
- Nouvelle migration à écrire : `db/migrations/0005_…sql` (ne jamais modifier une migration appliquée).
- Déploiement sur le serveur de test : `docs/guide-serveur-test-ovh.md`, section « Mettre à jour l'application ».

## Reste à faire hors modules

- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Copie de la sauvegarde hors du serveur + essai de restauration.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
