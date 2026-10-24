# Phase 62 — Produits & prix plus clair : section active, allergènes cochables, emballages expliqués

> FlaiX Expert · dossier de développement · généré le 2026-10-24 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-12 |
| Décision | dossier projet §15.161 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.161 Produits & prix plus clair : section active, allergènes cochables, emballages expliqués (2026-10-12)

**Retour de Rémi** (version d'essai, 0 produit) : *« comment fonctionnent les emballages et allergènes ? j'ai
l'impression que je ne peux pas configurer manuellement mes allergènes… quand je clique sur une section, faudrait
garder la section sélectionnée en bleu clair… les emballages : chaque idée que je clique ajoute la section au produit
en fait ? on a du mal à le comprendre dès le départ… je ne suis pas obligé de mettre un emballage ou un allergène ? »*

**Décisions** :
- **Un seul panneau ouvert à la fois** (Catégories, Ingrédients, Emballages, Allergènes) ; le bouton de la section
  ouverte reste en couleur (violet clair, `aria-pressed`) ; recliquer le referme.
- **Allergènes cochables dans le tableau** : une case par produit et par allergène, enregistrée aussitôt (comme dans la
  fiche du produit) ; à l'impression, les cases deviennent des ●. Sans produit : « Ajoute d'abord tes produits… ».
- **Emballages expliqués** : « Facultatif » ; deux étapes — 1) ici, la liste des emballages et leur prix ; 2) dans la
  fiche de chaque produit (rubrique « Conditionnement »), ceux qu'il utilise. Les idées indiquent « (remplit le nom) » :
  elles ne touchent à aucun produit.
- **Rien d'obligatoire** : sans emballage, la marge ne compte que la matière ; sans allergène coché, le tableau signale
  le produit à vérifier (l'information reste due au client pour ce qui est servi sans emballage).

**Réalisé le 2026-10-12** : écran seul, sans migration. **Tests** : écran (case du tableau envoyée aussitôt, tableau
vide expliqué) ; suite web 85/85 ; essayé dans le navigateur (bouton en couleur, une seule section ouverte, case
« Frites : Gluten » enregistrée puis retirée).

## 2. Ce qui a été construit — commits

- [`1cbf91d`](https://github.com/Break-Eat-APP/flaix-expert/commit/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2) — 2026-10-12 — Produits & prix : section active en couleur, allergènes cochables dans le tableau, emballages expliqués

## 3. Fichiers, par couche

### Écrans (apps/web)

- `apps/web/src/pages/parametres/Allergenes.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2/apps/web/src/pages/parametres/Allergenes.test.tsx)
- `apps/web/src/pages/parametres/Allergenes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2/apps/web/src/pages/parametres/Allergenes.tsx)
- `apps/web/src/pages/parametres/Conditionnement.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2/apps/web/src/pages/parametres/Conditionnement.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/1cbf91dd73f883979efcb3e6cb0f4f795c7d24c2/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
