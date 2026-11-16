# Phase 83 — Deux règles validées (réserve à la validation, arrondi tracé) ; barre des sections en violet

> FlaiX Expert · dossier de développement · généré le 2026-11-16 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-16 |
| Décision | dossier projet §15.182 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.182 Deux règles validées ; barre des sections en violet (2026-11-16)

**Contexte** : Rémi, le 2026-11-16, sur les deux règles laissées ouvertes au §15.181 : « je valide ». Et, captures d'écran à
l'appui (Équipe, Résultats, Stock) : « pour chaque module […] lorsque tu présentes des sections, elles soient plutôt de
couleur inverse aux couleurs de la page, c'est-à-dire que la barre du menu du module soit de couleur violette et lorsque tu
cliques dessus, ça soit une autre couleur […] Ça permet à l'œil de faire une différence entre sur quelle page je suis,
qu'est-ce qui est le menu. »

**Ce qui est fait** :
- Règles écrites dans la gouvernance (§ 11.3) : la réserve ne bouge qu'à la validation de la facture (case « entrer en
  réserve »), jamais au dépôt ; l'écart d'arrondi colis → unités (quelques centimes) est accepté et inscrit au journal.
  BUG-2026-014 passe ACCEPTÉ ; suivi de l'audit Codex à jour.
- `apps/web/src/styles.css`, classes `.onglets` et `.onglet` (toutes les barres de sections : Stock, Résultats, Équipe,
  Achats, Caisses, Caisses connectées, Clôtures… 12 écrans) : barre violette (`--violet`, ombre violette), sections en blanc,
  la section choisie en blanc avec texte violet (couleur inverse de la barre) ; survol plus clair ; contour blanc au
  clavier. La page reste claire : seule la barre du menu est en couleur.

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Écrans avec barres de sections | `vitest run src/pages/<stock, achats, factures, caisses-connectees>` (écran) | 3 + 1 + 2 + 9 réussis |
| Rendu | page de l'application (style réel) avec deux barres, capture | barre `rgb(77, 4, 244)`, section choisie blanche |

Contrôle sur une page connectée non fait : Docker arrêté sur le poste (pas de base locale) ; rendu vérifié avec la vraie
feuille de style.

**Risques restants** : aucun sur les données ; à regarder par Rémi sur téléphone (barre qui passe sur deux lignes).

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne sur le serveur de test ; retour arrière = commit
précédent (style seul, aucune migration).

## 2. Ce qui a été construit — commits

- [`45e297e`](https://github.com/Break-Eat-APP/flaix-expert/commit/45e297ed6482b6809bafc8cd79fa6c1288616dd2) — 2026-11-16 — Écrans : barre des sections d'un module en violet, section choisie en blanc (couleur inverse de la page)

## 3. Fichiers, par couche

### Écrans (apps/web)

- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/45e297ed6482b6809bafc8cd79fa6c1288616dd2/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
