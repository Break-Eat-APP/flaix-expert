# Phase 25 — Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-02 |
| Décision | dossier projet §15.121, §15.122 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.121 L'éditeur s'appelle FlaiX Expert (2026-10-02)

Correction de Rémi : *« tu parles de Break Eat, cela n'a rien à voir, c'est FlaiX Expert seulement »*. L'éditeur du logiciel, son back-office (`/editeur`), ses comptes, les messages des options (« à demander à FlaiX Expert »), les inscriptions au journal technique (« FlaiX Expert — nom du compte », « FlaiX Expert (éditeur) ») et l'outil d'administration du serveur portent désormais le nom **FlaiX Expert**. Les sections plus anciennes de ce dossier qui disent « Break Eat » pour l'éditeur (abonnement, facturation 12a, back-office, attestation) se lisent **FlaiX Expert**.

**Reste en suspens (question posée à Rémi)** : les mentions du Click & Collect — « application Break Eat » et « commission Break Eat » (écran Click & Collect, coûts par buvette). Elles désignent le canal de commande grand public et le taux de son contrat, pas l'éditeur : elles ne changent que sur sa réponse.

### 15.122 Lieux et directeurs depuis le back-office ; mots de passe de 6 caractères (2026-10-02)

Demandes de Rémi : *« la possibilité de voir le mot de passe pour chaque identification »*, *« pas besoin de mettre douze caractères, six suffit »*, *« dans mon back-office je n'avais pas la possibilité d'ajouter de nouveaux lieux… créer un compte directeur pour un lieu »*.

- **Mots de passe** : 6 caractères au moins (au lieu de 12), pour les directeurs comme pour les comptes FlaiX Expert. Contrepartie ajoutée : les mots de passe les plus utilisés (123456, azerty, motdepasse…), les suites (abcdef, 654321) et les répétitions (000000) sont refusés — avec 6 caractères, ce sont les premiers essayés. Les connexions restent limitées à 10 essais par quart d'heure et par adresse. Chaque champ de mot de passe a un œil pour afficher ce qu'on tape. Le code à 4 chiffres des caissières reste masqué (il se tape au comptoir, devant le public).
- **Mot de passe provisoire** désormais lisible et dictable : trois groupes de quatre caractères sans lettres ambiguës (« k7mq-4xtp-9rwe »).
- **Back-office** (migration 0021) : « Nouveau lieu » crée un lieu **vide** avec son premier directeur ; pour chaque lieu, la liste de ses directeurs, « Ajouter un directeur » et « Nouveau mot de passe » (oublié, jamais reçu : ses sessions sont fermées). Le mot de passe provisoire s'affiche **une seule fois** à l'écran de FlaiX Expert, avec un bouton Copier ; il n'est jamais stocké en clair ni écrit au journal. Une adresse déjà connue est rattachée avec son mot de passe actuel ; une adresse de compte FlaiX Expert est refusée. Chaque création, ajout et renouvellement est inscrit au journal technique du lieu concerné, au nom de FlaiX Expert.
- **Exception assumée à « ni nom de salarié »** (§15.13) : le back-office voit le nom et l'e-mail des **directeurs** — le contact du client, que FlaiX Expert crée lui-même. Jamais ceux des caissières ni des employés.
- L'outil du serveur (`sudo flaix-admin creer-lieu`) reste disponible en secours.

## 2. Ce qui a été construit — commits

- [`c694bbe`](https://github.com/Break-Eat-APP/flaix-expert/commit/c694bbe8507accae347e88817de19d604a2ba2ee) — 2026-10-02 — Éditeur et back-office au nom de FlaiX Expert (et non Break Eat)
- [`66326dc`](https://github.com/Break-Eat-APP/flaix-expert/commit/66326dc7eb9cf072917491acb352a7e10e6dd3ae) — 2026-10-02 — Back-office : créer un lieu et ses directeurs, mot de passe provisoire ; mots de passe de 6 caractères avec un œil
- [`d8d7990`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8d7990f3794d8911fb7141ce1bdfef8997a32e7) — 2026-10-02 — Avancement : ce qui se passera au passage en production

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0021_lieux_back_office.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/db/migrations/0021_lieux_back_office.sql)

### Tests

- `apps/api/test/editeur.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/test/editeur.test.ts)
- `apps/api/test/lieux-editeur.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/test/lieux-editeur.test.ts)
- `apps/api/test/options.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/test/options.test.ts)
- `packages/domain/src/mot-de-passe.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/packages/domain/src/mot-de-passe.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/packages/domain/src/editeur.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/packages/domain/src/journal-technique.ts)
- `packages/domain/src/mot-de-passe.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/packages/domain/src/mot-de-passe.ts)

### Serveur (apps/api)

- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/auth/routes.ts)
- `apps/api/src/auth/secrets.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/auth/secrets.ts)
- `apps/api/src/options.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/options.ts)
- `apps/api/src/outils/cli.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/outils/cli.ts)
- `apps/api/src/routes/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/routes/editeur.ts)
- `apps/api/src/routes/export-comptable.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/routes/export-comptable.ts)
- `apps/api/src/routes/lieu.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/routes/lieu.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/composants/MotDePasse.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/composants/MotDePasse.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/clotures/ExportComptable.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/clotures/ExportComptable.tsx)
- `apps/web/src/pages/Compte.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/Compte.tsx)
- `apps/web/src/pages/Connexion.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/Connexion.tsx)
- `apps/web/src/pages/editeur/EspaceEditeur.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/editeur/EspaceEditeur.tsx)
- `apps/web/src/pages/parametres/JournalTechnique.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/pages/parametres/JournalTechnique.tsx)
- `apps/web/src/session.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/session.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/infra/vps/flaix-admin.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/d8d7990f3794d8911fb7141ce1bdfef8997a32e7/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

### `apps/api/test/lieux-editeur.test.ts`

- **nouveau lieu depuis le back-office**
  - le lieu est créé vide avec son directeur ; le mot de passe provisoire est lisible et ouvre la session
  - le lieu le voit dans son journal : création et compte directeur, par FlaiX Expert
  - [F] champs obligatoires et e-mail valide
- **directeurs d'un lieu**
  - une adresse déjà connue est rattachée avec son mot de passe actuel
  - [F] doublon, compte FlaiX Expert, lieu inconnu
  - nouveau mot de passe provisoire : l'ancien ne marche plus, ses sessions sont fermées, ses lieux le voient
  - [F] un compte qui n'est pas directeur de ce lieu n'est pas touché
- **[F] réservé au back-office**
  - une session de directeur ne crée ni lieu ni directeur, pas même directement dans la base
- **mot de passe : 6 caractères suffisent, pas les plus utilisés**
  - refuse 123456 et 5 caractères, accepte 6 caractères

### `packages/domain/src/mot-de-passe.test.ts`

- **règle des mots de passe**
  - six caractères suffisent
  - refuse les plus utilisés, les suites et les répétitions
  - refuse au-delà de 200 caractères

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/mot-de-passe.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/lieux-editeur.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
