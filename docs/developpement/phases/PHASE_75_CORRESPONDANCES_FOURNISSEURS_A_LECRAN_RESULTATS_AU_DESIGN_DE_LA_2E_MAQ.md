# Phase 75 — Correspondances fournisseurs à l'écran ; Résultats au design de la 2e maquette

> FlaiX Expert · dossier de développement · généré le 2026-10-25 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-25 |
| Décision | dossier projet §15.174 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.174 Correspondances fournisseurs à l'écran ; Résultats au design de la 2e maquette (2026-10-25)

**Demande de Rémi** (2026-10-25, sur la liste des points à revoir) : « un écran pour corriger les correspondances
fournisseurs » : *« fait »* ; « la page Résultats au design de ta 2e maquette » : *« fait »* ; point L'Addition :
*« annule »* (retiré de la liste) ; exclusion antivirus des dossiers Docker : *« ok fait »*.

**Réalisation** (sans migration) :
- **Achats › Correspondances** : ce que FlaiX Expert a appris des factures, par fournisseur (article, code, produit,
  unités par colis) ; produit et colis corrigés sur place, article retiré (la prochaine facture le redemandera) ; vaut
  pour les factures suivantes, jamais pour celles déjà enregistrées. Routes PUT et DELETE
  `/api/factures/correspondances`, journal `correspondance_fournisseur_modifiee`.
- **Résultats, vue d'ensemble** (maquette « Bonsoir Rémi », image du 2026-10-19) : en-tête « Bonjour / Bonsoir » et prénom
  (18 h, heure de Paris), cloche du centre d'alertes avec son nombre (remplace le bandeau) ; « Bilan de …, samedi 3
  octobre » ; à côté du choix de l'événement, la pastille « Comparé à … » (ouvre Ventes pour en changer) et le bouton
  « Rapport de soirée » (événement clos) ; quatre chiffres avec leur évolution en pastille, la valeur du match précédent
  et la petite courbe, la marge brute dans la carte du CA ; la courbe de la soirée et son moment le plus fort (« fait
  34 % de la soirée »), l'anneau des catégories et ses tuiles ; en bas, « Ce qui se vend le mieux » (initiale, barre,
  CA), « À surveiller » (colorées par niveau) et « Prochain match » (date, dans combien de jours, chiffre attendu et
  produit le plus attendu d'après la Prévision, « Préparer le stock », « Voir la prévision ») ; barre « Soir de match »
  (En direct, en rouge pendant un événement ; Assistant si l'option est active ; Caisses). « Ce qu'il te reste » garde
  sa place en tête (demande de Rémi, §15.170), « Les chiffres de la soirée » suit. La colonne de droite disparaît.
  Pas de recherche dans l'en-tête (la maquette en montrait une) : à faire si Rémi la veut.

**Tests** : serveur (correspondance corrigée puis retirée, journal, 404) ; écrans (correspondances ; vue d'ensemble :
bilan, rapport de soirée, comparaison, évolution, à surveiller, prochain match et prévision) ; écrans 106 au total,
lancés par dossier (la mémoire du poste fait tomber la suite d'un bloc) ; types et construction. **Pas vu dans le
navigateur** : la fenêtre était masquée et le serveur local ne démarrait pas faute de mémoire — à regarder en ligne.

## 2. Ce qui a été construit — commits

- [`6fb8776`](https://github.com/Break-Eat-APP/flaix-expert/commit/6fb87761e08be3995b5f2c966a9d00ba9bb9673d) — 2026-10-25 — Achats › Correspondances : corriger ou retirer les articles appris des factures (§15.174)
- [`d2d5506`](https://github.com/Break-Eat-APP/flaix-expert/commit/d2d5506c0ef61be624c5605ce051ee76ded362df) — 2026-10-25 — Résultats au design de la 2e maquette : bonsoir, cloche, chiffres comparés, courbe et catégories, à surveiller, prochain match, barre Soir de match (§15.174)

## 3. Fichiers, par couche

### Tests

- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/api/test/facture-reserve.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/api/src/routes/factures.ts)

### Écrans (apps/web)

- `apps/web/src/pages/achats/Achats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/achats/Achats.tsx)
- `apps/web/src/pages/achats/Correspondances.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/achats/Correspondances.test.tsx)
- `apps/web/src/pages/achats/Correspondances.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/achats/Correspondances.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/pages/resultats/Ensemble.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/resultats/Ensemble.tsx)
- `apps/web/src/pages/resultats/Tableaux.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/resultats/Tableaux.test.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d2d5506c0ef61be624c5605ce051ee76ded362df/apps/web/src/resultats.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
