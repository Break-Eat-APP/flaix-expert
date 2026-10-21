# Phase 71 — Rapport de stock par événement ; « Ce qu'il te reste » en clair ; le net en direct

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-21 |
| Décision | dossier projet §15.170 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.170 Rapport de stock par événement ; « Ce qu'il te reste » en clair ; le net en direct (2026-10-21)

**Demande de Rémi** (2026-10-19, puis « go » le 2026-10-21) : *« ça peut être intéressant dans événements d'avoir un
rapport des stocks qui sont sortis pour comprendre ce qui a été mis sur les tables… ça sort directement de la réserve
centrale »* ; *« un établissement veut savoir concrètement ce qu'il a gagné net à la soirée »* ; après la recherche sur
les stades américains (Mashgin, Zippin, Amazon Just Walk Out, Wicket, WaitTime, Levy E15, Shift4 VenueNext, Appetize :
surtout du matériel — caméras, visage —, aucun ne donne au gérant son bénéfice net en direct), premier pas du « pilote
automatique de la soirée » : **le net en direct**.

**Constat** : « Ce qu'il te reste » existait (Résultats › Finances, et un encadré en tête de Résultats), mais souvent
« pas encore calculable » sans dire quoi compléter, et sans frais saisis il paraissait trop beau.

**Décisions et réalisation** (sans migration) :
- **« Ce qu'il te reste » en clair** (composant `ResteSoiree`) : une phrase (« Cette soirée t'a laissé 1 240 € » ;
  « … t'a coûté … » en perte), le calcul en une ligne (encaissé − TVA − marchandise − emballages − pertes de stock −
  personnel − frais de la soirée − part des frais du mois = reste, % du CA HT, avant impôt), ce qui manque pour le
  calculer avec le lien où le compléter (coût d'achat des produits nommés, taux horaire dans Équipe), et un avertissement
  quand aucun frais n'est saisi (« ce reste est trop beau » → Mes frais). En tête de Résultats (événement ou période).
- **Le net en direct** (En direct, sous les chiffres clés) : le même calcul pour l'événement ouvert, relu toutes les
  30 secondes (`/api/finances` sur l'événement ouvert : frais au pourcentage sur le CA du moment, part des frais du mois).
- **Rapport de stock d'un événement privé** : carte « À sortir de la réserve centrale » avant la clôture (liste de
  préparation, mêmes règles que la sortie : produit simple ou ses ingrédients suivis), « Sorti de la réserve centrale »
  après ; quantité et valeur au coût d'achat, total (hors coûts manquants).
- **Stock de la soirée** dans le rapport de soirée d'un match : stand par stand, déjà au stand, sorti de la réserve (mise
  en place + réassort), vendu, restant compté, valeur sortie au coût d'achat (`bilanDeStock`). Champ facultatif du
  rapport figé : absent des rapports établis avant le 2026-10-21.
- **Test corrigé** : les cibles de marge (`finances.test.ts`) lisaient Résultats pendant l'événement ouvert, ce que le
  §15.167 a retiré ; elles se lisent désormais après la clôture.

**Tests** : moteur (bilan de stock), serveur (sortie et liste de préparation d'un événement privé, rapport de soirée,
finances 12), écrans (net en direct, stock d'un événement privé, stock de la soirée dans le rapport) ; suite du serveur
relancée fichier par fichier ; types et construction.

**À suivre** (pilote automatique) : files d'attente estimées au rythme des tablettes ; anticipation de la mi-temps
(réassort poussé au téléphone) ; mise en place calculée seule.

## 2. Ce qui a été construit — commits

- [`26cf6ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/26cf6abde2c89c15296ae8d56e5f36ecaf1a8eab) — 2026-10-21 — Ce qu'il te reste en clair, en tête de Résultats et en direct (§15.170)
- [`631ca41`](https://github.com/Break-Eat-APP/flaix-expert/commit/631ca4169ff7bf5861b65ede39c043de7f7782d4) — 2026-10-21 — Événement privé : rapport de stock, à sortir puis sorti de la réserve, au coût d'achat (§15.170)
- [`5a7f287`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c) — 2026-10-21 — Rapport de soirée : stock de la soirée stand par stand (§15.170) ; test des cibles après la clôture

## 3. Fichiers, par couche

### Tests

- `apps/api/test/finances.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/api/test/finances.test.ts)
- `apps/api/test/rapport-soiree.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/api/test/rapport-soiree.test.ts)
- `apps/api/test/sortie-stock-prive.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/api/test/sortie-stock-prive.test.ts)
- `packages/domain/src/rapport-soiree.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/packages/domain/src/rapport-soiree.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/packages/domain/src/evenements-prives.ts)
- `packages/domain/src/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/packages/domain/src/rapport-soiree.ts)

### Serveur (apps/api)

- `apps/api/src/routes/evenements-prives.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/api/src/routes/evenements-prives.ts)
- `apps/api/src/routes/rapport-soiree.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/api/src/routes/rapport-soiree.ts)

### Écrans (apps/web)

- `apps/web/src/pages/direct/EnDirect.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/direct/EnDirect.test.tsx)
- `apps/web/src/pages/direct/EnDirect.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/direct/EnDirect.tsx)
- `apps/web/src/pages/prives/EvenementPrive.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/prives/EvenementPrive.test.tsx)
- `apps/web/src/pages/prives/EvenementPrive.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/prives/EvenementPrive.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/resultats/RapportSoiree.test.tsx)
- `apps/web/src/pages/resultats/RapportSoiree.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/resultats/RapportSoiree.tsx)
- `apps/web/src/pages/resultats/ResteSoiree.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/resultats/ResteSoiree.tsx)
- `apps/web/src/pages/resultats/Tableaux.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/pages/resultats/Tableaux.tsx)
- `apps/web/src/resultats.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/5a7f287fe7f4342bb5fda2ced64471b1fe6d5e3c/apps/web/src/resultats.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
