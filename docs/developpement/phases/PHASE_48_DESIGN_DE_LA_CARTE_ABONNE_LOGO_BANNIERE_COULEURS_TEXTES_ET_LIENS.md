# Phase 48 — Design de la carte abonné : logo, bannière, couleurs, textes et liens

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.148 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.148 Design de la carte abonné : logo, bannière, couleurs, textes et liens (2026-10-05)

**Demande de Rémi** : *« il va falloir mettre le maximum de détails design […] lance la construction et ajoute le maximum afin de personnaliser la carte »*, après la question « comment les banques et les autres cartes ont-elles un design personnalisé ? ». **Réponse retenue** : Apple et Google imposent un modèle de carte (même pour les grandes marques) ; la personnalisation passe par le **logo**, une **bannière** et les **couleurs**, plus les textes. FlaiX Expert envoie ce design avec chaque carte : Apple le reçoit dans le fichier de la carte, Google dans le modèle de carte du lieu (« classe »).

**Ce que le directeur règle** (Fidélité → onglet « Carte téléphone », aperçu iPhone et Android à côté) :
- **Images** : logo (carré conseillé, 660 × 660 px ou plus) et bannière (1125 × 369 px ou plus, recadrée au centre). Une seule image déposée par sorte ; **l'écran la retaille dans le navigateur** à chaque format (Apple : logo 160 × 50 points en 1x, 2x, 3x, icône 29 × 29, bande 375 × 123 ; Google : logo 660 × 660 sur fond blanc avec une marge pour le cercle, image principale 1032 × 336). Le serveur contrôle que chaque fichier est un PNG de la bonne taille et les range dans la base (sauvegardes comprises) : aucune bibliothèque d'images sur le serveur.
- **Couleurs** : fond ; texte (automatique, clair ou foncé selon le fond, ou au choix) ; intitulés (iPhone seulement).
- **Textes** : nom du programme (« Carte abonné » par défaut), nom des points (« Points » par défaut), nom du lieu à côté du logo (à décocher si le logo le contient déjà), message libre au dos (500 caractères).
- **Informations** : remise abonné (réglage de la caisse) et réduction disponible (paliers atteints × valeur du palier), chacune affichable ou non. Toujours présents : nom, numéro d'abonné en QR code, solde de points, règle des points au dos.
- **Liens au dos** : site du club, téléphone, e-mail de contact, lien vers une application (https seulement).

**Mise à jour des cartes déjà distribuées** : tout changement de design, de règle de points, de remise abonné ou de nom du lieu met à jour toutes les cartes **en arrière-plan** (la réponse n'attend pas) : notification aux iPhone, remplacement du modèle Google du lieu puis de chaque carte Google. Les adresses des images publiques portent une version : Google reprend la nouvelle image.

**Correction au passage** : un changement de couleur ne mettait pas à jour le modèle de carte chez Google (seulement les cartes) ; désormais le modèle est remplacé aussi. Sans logo déposé, la carte Apple n'a plus de carré de couleur invisible à la place du logo (seule l'icône, exigée par Apple, reste unie).

**Réalisé le 2026-10-05** (migration 0036, moteur `wallet.ts`, `apps/api/src/wallet/images.ts`, routes `PUT /api/wallet/design`, `PUT` et `DELETE /api/wallet/images/:sorte`, aperçus, `/api/carte-banniere/:lieu.png` ; écrans `DesignCarte.tsx`, `ApercuCarte.tsx`, `imagesCarte.ts`, page de l'abonné). Journal : `carte_wallet_design` (champs modifiés), `carte_wallet_image` (déposée, retirée). **Tests** : moteur 13 (champs Apple et Google selon le design, réduction, remise, règle, liens, cadrage des images, tailles acceptées), briques 5 (PNG lus et contrôlés format par format), serveur 15 (dont design contrôlé, journalisé, cartes et modèle Google mis à jour, rien d'envoyé sans changement ; images contrôlées, dans la carte Apple, la page de l'abonné et le modèle Google, retirées), écrans 8. Vérifié à l'écran sur le lieu d'essai local : vraie image retaillée par le navigateur, enregistrée, aperçus iPhone et Android, page de l'abonné, affichage sur téléphone.

**Limites** : l'aperçu est une approximation (chaque téléphone met en page à sa façon) ; sur iPhone, les points s'écrivent par-dessus la bannière (une image sans texte rend mieux) ; Google peut demander un vrai logo pour publier la carte.

## 2. Ce qui a été construit — commits

- [`0721b51`](https://github.com/Break-Eat-APP/flaix-expert/commit/0721b5128becc3a3b38e22653d7e7f98d6602f6a) — 2026-10-05 — Design de la carte abonné (1/2) : logo, bannière, couleurs, textes, informations et liens ; modèle Google remplacé à chaque changement (dossier §15.148)
- [`a6538ef`](https://github.com/Break-Eat-APP/flaix-expert/commit/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561) — 2026-10-05 — Design de la carte abonné (2/2) : éditeur avec aperçu iPhone et Android, logo et bannière retaillés dans le navigateur, page de l'abonné aux couleurs du club (dossier §15.148)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0036_design_carte.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/db/migrations/0036_design_carte.sql)

### Tests

- `apps/api/test/wallet-fichiers.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/test/wallet-fichiers.test.ts)
- `apps/api/test/wallet.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/test/wallet.test.ts)
- `packages/domain/src/wallet.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/packages/domain/src/wallet.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/packages/domain/src/journal-technique.ts)
- `packages/domain/src/wallet.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/packages/domain/src/wallet.ts)

### Serveur (apps/api)

- `apps/api/src/routes/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/routes/fidelite.ts)
- `apps/api/src/routes/lieu.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/routes/lieu.ts)
- `apps/api/src/routes/wallet.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/routes/wallet.ts)
- `apps/api/src/wallet/apple.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/wallet/apple.ts)
- `apps/api/src/wallet/google.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/wallet/google.ts)
- `apps/api/src/wallet/images.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/api/src/wallet/images.ts)

### Écrans (apps/web)

- `apps/web/src/api.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/api.ts)
- `apps/web/src/composants/ApercuCarte.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/composants/ApercuCarte.tsx)
- `apps/web/src/pages/carte/PageCarte.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/carte/PageCarte.tsx)
- `apps/web/src/pages/fidelite/CarteWallet.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/CarteWallet.test.tsx)
- `apps/web/src/pages/fidelite/CarteWallet.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/CarteWallet.tsx)
- `apps/web/src/pages/fidelite/DesignCarte.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/DesignCarte.test.tsx)
- `apps/web/src/pages/fidelite/DesignCarte.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/DesignCarte.tsx)
- `apps/web/src/pages/fidelite/Fidelite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/Fidelite.tsx)
- `apps/web/src/pages/fidelite/imagesCarte.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/pages/fidelite/imagesCarte.ts)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561/apps/web/src/styles.css)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
