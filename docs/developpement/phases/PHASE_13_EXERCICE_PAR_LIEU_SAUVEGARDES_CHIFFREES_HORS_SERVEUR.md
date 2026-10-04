# Phase 13 — Exercice par lieu, sauvegardes chiffrées hors serveur

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.108 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.108 Réponses de Rémi : sauvegarde chez OVH, exercice, logiciel vierge, reprise des modules (2026-09-30)

**Message de Rémi (verbatim)** : *« Où garder la copie des sauvegardes hors du serveur : un stockage OVH à part. Le premier mois de l'exercice comptable de la patinoire : aucune idée encore, ça peut varier pour chacun des lieux. Les modules que tu développes, tu reprends quand même ce que j'ai développé mais avec amélioration et compréhension ? Je veux un logiciel fini de A à Z et surtout je vois que tu développes en test sauf que ça va être de vrais chiffres qui vont être intégrés donc je veux un logiciel vierge sans démo ou autre. »*

**1. Exercice comptable** : le réglage « janvier par défaut » était une supposition, retirée. **Vide sur chaque lieu tant que le directeur ne l'a pas saisi** ; la clôture d'un exercice est refusée d'ici là ; les mois se clôturent normalement (migration `0011`).

**2. Copie des sauvegardes hors du serveur : stockage objet OVHcloud (S3), en France.** Rémi crée le stockage et son identifiant d'accès (compte et paiement : lui seul) ; il saisit lui-même l'identifiant sur le serveur par une commande qui le demande à l'écran — il ne transite jamais par la conversation.
- **Chiffrée avant de partir** : chaque sauvegarde est chiffrée sur le serveur avec une clé publique ; **la clé de restauration (privée) n'est jamais stockée sur le serveur** : elle s'affiche une seule fois à Rémi, qui la garde en deux endroits (gestionnaire de mots de passe, clé USB). Raison : les sauvegardes contiennent des données personnelles (noms, n° d'abonnés) ; une fuite du stockage ne livre rien de lisible. **Risque dit clairement : sans cette clé, les copies chez OVH sont illisibles.**
- Copie quotidienne gardée 30 jours ; **copie du 1er de chaque mois gardée sans limite** (§15.106).
- **Essai de restauration** : une commande télécharge la dernière copie, la déchiffre avec la clé, la restaure dans une base temporaire, compare les nombres de lignes avec la base en service, puis supprime la base temporaire.

**3. « Logiciel vierge, sans démo » — état et recommandation.** Le logiciel ne contient **aucune donnée de démonstration** : le serveur de Rémi ne contient que son lieu et son compte ; les noms vus dans les captures (« Patinoire d'essai », « Julie M. »…) n'existent que dans la base de développement du poste de travail. « Test » désigne seulement **l'environnement** (bandeau, adresse provisoire). **Mais les ventes tapées pendant un essai sont inscrites pour toujours** (journal inaltérable) : elles ne doivent jamais se mélanger aux vraies. Recommandation, **à valider par Rémi** :
- construire d'abord le **mode formation « FACTICE »** déjà décidé (`decisions-architecture-production.md` § 4.5, BOFiP §150, tests B3/B4) : les ventes d'entraînement sont marquées et n'entrent dans aucun total, aucun compteur, aucune clôture ;
- au premier vrai match, **passer ce serveur en production** : bandeau retiré, sous-domaine Break Eat, **vraie base neuve** (journal vide) dans laquelle on **recopie seulement la configuration** saisie par le directeur (identité, stands, caisses, produits et prix, équipe) — jamais un ticket d'essai. Préalable inchangé : la réponse écrite de l'expert-comptable (NF525).
- Hébergement : la décision 7 prévoyait une base gérée séparée pour la production. Pour un seul lieu pilote, le même VPS **avec la copie chiffrée hors serveur et un essai de restauration réussi** est défendable ; à revoir dès plusieurs lieux. **À trancher par Rémi.**

**4. « Tu reprends ce que j'ai développé ? »** Oui : chaque module de production a été construit après relecture de son prototype validé (sources citées dans chaque section §15.100 à §15.107), avec des améliorations que le prototype ne pouvait pas avoir (vraie base, sécurité par rôle, vente sans réseau, inaltérabilité imposée par la base, tests). **Tous les modules validés ne sont pas encore repris** : l'inventaire est dans `docs/avancement.md`, avec l'ordre proposé pour finir « de A à Z ».

**Mis en œuvre le 2026-09-30** (`infra/vps/flaix-admin.sh`, `infra/vps/deployer.sh`) : chiffrement `age` (clé publique sur le serveur, clé privée affichée une seule fois), envoi `rclone` vers le stockage S3 OVH, identifiant saisi par Rémi dans `/etc/flaix/sauvegarde-externe.env` (root seul). Essayé de bout en bout sur le serveur avec un faux stockage et une clé jetable : chiffrement, envoi, clé conservée au second réglage, mauvaise clé refusée, restauration complète et comparée, base temporaire supprimée. **En attente de Rémi** : création du stockage et réglage (guide serveur, « Copie des sauvegardes chez OVH »).

## 2. Ce qui a été construit — commits

- [`8542bbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/8542bbf2917250654fa57285b66854d56afdf4f0) — 2026-09-30 — Exercice comptable à régler par lieu ; dossier §15.108 : sauvegarde chiffrée chez OVH, logiciel vierge, reprise des modules
- [`43fd2f2`](https://github.com/Break-Eat-APP/flaix-expert/commit/43fd2f2403c402c0f3100b9c03fbd576dab36869) — 2026-09-30 — Sauvegarde : copie chiffrée (age) chez OVHcloud Object Storage, flaix-admin sauvegarde-externe et essai-restauration (dossier §15.108)
- [`8903b24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8903b2402a29f454d5f87ba3bf0b180cc537c260) — 2026-09-30 — flaix-admin : sans messages techniques de rclone
- [`ec9398d`](https://github.com/Break-Eat-APP/flaix-expert/commit/ec9398d1095c16338ee3ad8a8b31263aaa88491f) — 2026-09-30 — Docs : inventaire prototype → logiciel et ordre A à Z, guide de la copie des sauvegardes chez OVH

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0011_exercice_a_regler.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/db/migrations/0011_exercice_a_regler.sql)

### Tests

- `apps/api/test/periodes.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/apps/api/test/periodes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/periodes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/apps/api/src/routes/periodes.ts)

### Écrans (apps/web)

- `apps/web/src/pages/clotures/Periodes.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/apps/web/src/pages/clotures/Periodes.tsx)
- `apps/web/src/pages/parametres/Identite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/apps/web/src/pages/parametres/Identite.tsx)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/infra/vps/flaix-admin.sh)
- `infra/vps/installer-socle.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/infra/vps/installer-socle.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/ec9398d1095c16338ee3ad8a8b31263aaa88491f/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
