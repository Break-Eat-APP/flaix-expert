# Avancement — reprise après coupure

Mis à jour le 2026-09-30 (après l'étape 2). Pour reprendre : lire ce fichier, puis le dossier §15.99.

## Ordre de construction (dossier §15.99)

| # | Travail | État |
|---|---|---|
| 1 | Comptes des caissières (code personnel) + tablette enregistrée comme appareil de caisse | **fait le 2026-09-30** (dossier §15.100) |
| 2 | Ticket sur demande (édition par le directeur, duplicata tracé) | **fait le 2026-09-30** (dossier §15.101) |
| 3 | Clôtures : assistant de clôture du match | à faire — prochaine étape |
| 4 | Résultats : tableaux (vue d'ensemble, ventes, comparaison, coût manquant) | à faire |
| 5 | Équipe : fiches, planning, masse salariale | à faire |
| 6 | Stock : mise en place, comptage, réserve et livraisons | à faire |

## Points d'entrée utiles pour l'étape 3

- Prototype validé : `docs/reference/flaix-gestion-final.html`, modules Écart de caisse (7) et Clôture d'événement (10) — à relire en entier avant d'écrire la décision.
- Écran actuel : `apps/web/src/pages/clotures/Clotures.tsx` ; clôture du match : `apps/api/src/routes/evenements.ts` ; totaux de clôture de caisse : `apps/api/src/routes/caisse.ts` (route `/cloture`).
- Tout nouveau journal (comptage, écart) : tests [F] dans `apps/api/test/conformite-base.test.ts` avant le code.

## Reste à faire hors modules

- Recharger la page sans réseau sur le vrai serveur (service worker) : à essayer.
- Copie de la sauvegarde hors du serveur + essai de restauration.
- Sous-domaine Break Eat à la place de sslip.io (Rémi).
