# Phase 17 — Vue téléphone « En direct »

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.112 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.112 Vue téléphone du directeur : « En direct » (2026-10-01)

**Demande** : 4ᵉ module de l'ordre fixé par Rémi (§15.109) ; contenu validé le 2026-09-29 (§15.95, ajout 1 : « vue soir de match sur téléphone pour le directeur : CA en direct, caisses ouvertes, ruptures ») et règle mobile du 2026-09-11 (§3 : consulter partout, gestes courts seulement — réassort en cours de match ; cartes empilées, jamais un tableau compressé).

**Construit** (écran `/direct`, conçu d'abord pour le téléphone) :
- CA TTC du match en direct (espèces / carte), tickets et panier moyen, caisses ouvertes sur le nombre de caisses actives ;
- **ruptures et stock faible**, par stand : restant = départ + réassorts − vendu ; faible à 15 % du départ ou moins (même règle que le module Stock) ; ruptures d'abord ;
- **réassort en deux gestes** depuis l'alerte (quantité, valider), inscrit comme dans Stock ;
- caisses par stand : ouverte ou fermée, qui l'a ouverte, CA, dernier ticket « il y a X min » ;
- **mise à jour automatique toutes les 20 secondes**, et bouton pour mettre à jour tout de suite.
- **Aucun calcul nouveau** : l'écran assemble les chiffres déjà calculés par Caisses (`/api/caisses/tableau`) et Stock (`/api/stock`) — une seule source pour chaque chiffre.
- **Menu inchangé** (6 entrées validées, §15.96) : l'écran s'ouvre depuis une carte « match en cours » en tête de Résultats, et depuis Caisses (« Vue téléphone »).
- Sur téléphone, le bandeau « MODE FORMATION — FACTICE » se réduit à la mention et au bouton « Quitter » (la phrase d'explication reste sur grand écran).

**Vérifié dans le navigateur, au format téléphone (375 px)**, en mode formation : match d'entraînement ouvert, 2 bières mises en place au Bar, vendues → « Rupture · reste 0 sur 2 · vendu 2 », CA 14,00 €, 1 caisse ouverte sur 2 ; réassort de 6 en deux gestes → plus aucune alerte.

**Reste, déjà dans la liste** : l'alerte de rupture **poussée** sur le téléphone (notification), qui suppose l'envoi de notifications ; le rapport de soirée envoyé par e-mail.

## 2. Ce qui a été construit — commits

- [`8fec2c4`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fec2c423fac32948e9b0251b9543d97218761a2) — 2026-10-01 — Vue téléphone « En direct » : CA, caisses, ruptures et réassort en deux gestes, mise à jour toutes les 20 s ; bandeau formation compact sur téléphone (dossier §15.112)

## 3. Fichiers, par couche

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/App.tsx)
- `apps/web/src/composants/Formation.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/composants/Formation.tsx)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/8fec2c423fac32948e9b0251b9543d97218761a2/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
