# Phase 9 — Équipe : fiches, planning, masse salariale

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.104 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.104 Équipe — fiches employés, planning, masse salariale : conception (2026-09-30)

Demande de Rémi (§15.99). Sources relues avant d'écrire : module 14 (§14, prototype isolé `0fbe1abf…` relu en entier le 2026-09-30), §15.65, §15.72 (planning d'un match à venir), §15.80 (affectation à un stand et une caisse), §15.87 (frise horaire « d'un coup d'œil »).

1. **Une fiche par employé** (Équipe → Fiches) : nom, statut (salarié / intérimaire + agence), rôle habituel (Caissier, Préparation / cuisine, Responsable de stand, Renfort ponctuel — liste du prototype), **taux horaire** (coût chargé pour un salarié, taux facturé par l'agence pour un intérimaire), actif. **Accès caisse facultatif** : c'est le compte caissière du §15.100 (code à 4 chiffres, tablette enregistrée), donné ou retiré depuis la fiche. Les caissières déjà créées deviennent des fiches (taux à compléter). Un employé ne se supprime pas, il devient inactif (son accès caisse est coupé en même temps).
2. **Planning par match** (Équipe → Planning), pour un match à venir comme pour un match joué : chaque affectation = employé, **stand et caisse réels du lieu** (ou « autre poste »), rôle, heures **prévues**, heures **réelles** (égales aux prévues par défaut ; une correction garde **son auteur et son heure**). Une fin avant le début = après minuit. **Frise horaire par stand** au-dessus du tableau : une barre par personne sur ses heures réelles, en ambre si elles ont été corrigées.
3. **Coût** = durée réelle × taux ; **le taux est figé sur l'affectation à sa création** : changer le taux d'une fiche ne réécrit pas les matchs passés (le prototype : « reste nommé, avec son taux d'origine, sur les affectations passées »). Sans taux sur la fiche : « taux manquant », jamais zéro.
4. **Masse salariale** (Équipe → Masse salariale) : somme des coûts réels du planning, par match, par statut, par rôle — jamais un nouveau calcul.
5. **Résultats → Finances, extension additive signalée** : la cascade ajoute « Personnel (planning) » et s'arrête à la **marge après personnel** (et non « marge nette » : commission, frais et autres dépenses ne sont toujours pas saisis). Sans planning pour le match, ou avec un taux manquant, l'étape n'est pas ajoutée et l'écran le dit.
6. **Confidentialité** : taux et coûts ne sont envoyés qu'au directeur ; jamais à une caissière, jamais à l'assistant IA (§15.95).

**Écarts signalés** : pas de Click & Collect comme poste (il n'existe pas en production) ; le planning n'est pas un journal fiscal : une affectation se retire (le journal technique garde son contenu), les heures se corrigent même après la clôture du match.

**Réalisé le 2026-09-30** : migration `0007_equipe_planning.sql` (tables `employe` et `affectation` ; les caissières existantes deviennent des fiches) ; moteur `packages/domain/src/planning.ts` (durée qui passe minuit, coût, format des durées) ; serveur : fiches (`/api/equipe/employes…`, accès caisse donné, renouvelé ou retiré depuis la fiche), planning (`/api/planning…`), masse salariale (`/api/equipe/masse-salariale`), personnel du match dans `/api/resultats`. Écrans : Équipe → Fiches (création, modification, accès caisse), Planning (choix du match, 4 chiffres, frise horaire par stand, tableau éditable, ajout d'une affectation), Masse salariale (saison, par match, par rôle), Tablettes ; Résultats → Finances déduit le personnel du planning.

**Vérifié** : 3 tests du moteur (exemple chiffré validé du module 14 : Julie B. 104,40 € prévus puis 108,75 € réels, Karim T. 159,60 €, Sophie L. 130,00 €, total 398,35 €) ; 9 tests serveur (caissière → fiche, accès donné/retiré, fiche désactivée qui perd son accès, réel qui suit le prévu tant qu'il n'est pas corrigé, correction signée, taux figé sur l'affectation, poste invalide et employé inactif refusés, taux manquant signalé sans coût inventé, retrait tracé au journal, masse salariale par match et par rôle, personnel déduit dans Résultats). **Essai dans le navigateur** (lieu d'essai local, match à venir) : 3 affectations saisies par le formulaire → 394,00 € prévus ; fin réelle de Julie corrigée à 00:15 → 398,35 € réels, « corrigé par Directeur Essai », barre ambre sur la frise. **Défaut trouvé et corrigé** : dans le tableau du planning, les menus Poste et Rôle se réduisaient à une flèche sur un écran moyen ; champs désormais empilés dans chaque cellule.

## 2. Ce qui a été construit — commits

- [`40c3f7b`](https://github.com/Break-Eat-APP/flaix-expert/commit/40c3f7bf6313745264d25bffd53c8e512e445054) — 2026-09-30 — Dossier §15.104 : conception d'Équipe (fiches, planning, masse salariale)
- [`bbf7f4b`](https://github.com/Break-Eat-APP/flaix-expert/commit/bbf7f4b05168d8a41c7df7eae0341107a52da5f9) — 2026-09-30 — Équipe, serveur : fiches employés avec accès caisse, planning prévu/réel, masse salariale, personnel dans Résultats (dossier §15.104)
- [`3509f19`](https://github.com/Break-Eat-APP/flaix-expert/commit/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde) — 2026-09-30 — Équipe : fiches, planning avec frise horaire, masse salariale ; personnel dans Résultats (dossier §15.104)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0007_equipe_planning.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/db/migrations/0007_equipe_planning.sql)

### Tests

- `apps/api/test/equipe.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/test/equipe.test.ts)
- `packages/domain/src/planning.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/packages/domain/src/planning.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/packages/domain/src/modele.ts)
- `packages/domain/src/planning.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/packages/domain/src/planning.ts)

### Serveur (apps/api)

- `apps/api/src/erreurs.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/src/erreurs.ts)
- `apps/api/src/routes/equipe.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/src/routes/equipe.ts)
- `apps/api/src/routes/planning.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/src/routes/planning.ts)
- `apps/api/src/routes/resultats.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/src/routes/resultats.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/equipe/Equipe.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/web/src/pages/equipe/Equipe.tsx)
- `apps/web/src/pages/equipe/Planning.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/web/src/pages/equipe/Planning.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/equipe.test.ts`

- **fiches employés**
  - une caissière créée par son compte a aussi sa fiche employé (taux à compléter)
  - fiche sans accès caisse ; fiche avec accès : un code à 4 chiffres, remis une fois ; l'agence ne vaut que pour un intérimaire
  - donner puis retirer l'accès caisse ; une fiche désactivée perd son accès
- **planning d'un événement à venir, prévu puis réel**
  - exemple validé du module 14 : Julie 104,40 € prévus ; Karim 159,60 € ; Sophie 130,00 €
  - tant que le réel n'est pas corrigé, il suit le prévu ; une correction garde son auteur et son heure
  - le taux est figé sur l'affectation : changer la fiche ne réécrit pas le planning
  - poste invalide, employé inactif, taux manquant : refusé ou signalé, jamais un coût inventé
- **masse salariale et Résultats → Finances**
  - masse salariale : par événement, par statut, par rôle — la somme du planning, jamais un autre calcul
  - le personnel du planning est déduit dans Résultats → Finances une fois l'événement joué

### `packages/domain/src/planning.test.ts`

- **planning — module 14 (§14, §15.104)**
  - exemple chiffré validé : Julie B., 17,40 €/h, prévu 18:00→00:00 (104,40 €), réel 18:00→00:15 (108,75 €)
  - Karim T., 22,80 €/h, 17:30→00:30 = 159,60 € ; Sophie L., intérimaire 26,00 €/h, 18:00→23:00 = 130,00 € ; total 398,35 €
  - taux manquant : pas de coût, jamais zéro ; heure illisible refusée

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/planning.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/equipe.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
