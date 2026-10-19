# Phase 46 — E-mails par Brevo : rapport de soirée et rectifications

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.146 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.146 E-mails par Brevo : rapport de soirée et rectifications (2026-10-05)

**Demande de Rémi** : *« ok go pour Brevo »*, avec le compte Brevo existant (celui de Break Eat), une clé d'API dédiée à FlaiX Expert et une adresse d'expédition d'un domaine déjà vérifié. Décisions déjà actées : rapport de soirée envoyé par e-mail à la clôture (ajout validé au §15.95) ; rectification d'un Z **notifiée par e-mail au moment de l'enregistrement** (module 7, §14) ; service d'envoi : Brevo (§15.117).

**Ce qui part** (e-mails « transactionnels », vers les directeurs du lieu) :
1. **Rapport de soirée**, à la clôture de l'événement, une seule fois : le brief de fin de soirée (titre, résumé, points, §15.135 — mêmes chiffres, recopiés du rapport figé) et un lien vers le rapport complet (connexion nécessaire : aucun chiffre détaillé hors de l'application).
2. **Rectification d'un Z** (tiroir ou coffre), à chaque enregistrement : caisse ou coffre, événement, compté et écart avant → après, motif, signature, auteur et heure, lien vers Clôtures.
- **Destinataires** : les directeurs actifs du lieu (adresse de leur compte), plus jusqu'à 5 adresses ajoutées par le lieu (l'expert-comptable, par exemple), dans Paramètres → Notifications → E-mails. Chaque envoi se coupe séparément (rapport / rectifications) ; **les deux sont actifs par défaut**. Changements journalisés.
- **Jamais bloquant** : l'e-mail part après l'enregistrement ; un échec n'annule ni la clôture ni la rectification. Chaque envoi est tracé (table en écriture seule : type, destinataires, sujet, résultat), et l'écran montre les derniers envois.
- **Mode formation** : aucun e-mail.
- **Pas de campagnes vers les abonnés** pour l'instant : leurs adresses appartiennent au lieu, elles ne passent pas par le compte Brevo de Break Eat (RGPD, campagnes à voir avec Rémi, §14 module 20).

**Clé et expéditeur** : posés par Rémi sur le serveur avec `sudo flaix-admin cle-brevo` (clé tapée sans affichage, vérifiée auprès de Brevo ; adresse d'expédition demandée en clair ; nom affiché « FlaiX Expert »). Sans clé, rien ne part et l'écran le dit.

**Réalisé le 2026-10-05** (migration 0034, moteur `emails.ts`, route `routes/emails.ts`, Paramètres → Notifications → carte « E-mails », commande `flaix-admin cle-brevo`) : rapport de soirée envoyé après la clôture (une fois, contrôlé par la trace), rectification de Z (tiroir et coffre) notifiée après l'enregistrement, e-mail d'essai à la personne connectée, derniers envois affichés avec leur résultat (« envoyé », « échec », « non envoyé (Brevo non réglé) »). Contenu échappé (un motif ne devient jamais du HTML). **Tests** : moteur 3, serveur 7 (réglages par défaut et destinataires, adresses refusées, rapport une seule fois au directeur et à l'expert-comptable, rectification notifiée avec motif et signature, Brevo en panne sans rien bloquer, essai à la seule personne connectée, trace inaltérable), écran 2.

## 2. Ce qui a été construit — commits

- [`3276652`](https://github.com/Break-Eat-APP/flaix-expert/commit/3276652190fa7fd86d1a643f2ee027e7f657ecf5) — 2026-10-05 — E-mails par Brevo : rapport de soirée à la clôture, notification des rectifications de Z (dossier §15.146)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0034_emails.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/db/migrations/0034_emails.sql)

### Tests

- `apps/api/test/emails.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/test/emails.test.ts)
- `packages/domain/src/emails.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/packages/domain/src/emails.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/emails.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/packages/domain/src/emails.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/src/config.ts)
- `apps/api/src/routes/clotures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/emails.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/src/routes/emails.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/src/routes/evenements.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/pages/parametres/EmailsLieu.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/web/src/pages/parametres/EmailsLieu.test.tsx)
- `apps/web/src/pages/parametres/EmailsLieu.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/web/src/pages/parametres/EmailsLieu.tsx)
- `apps/web/src/pages/parametres/Notifications.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/apps/web/src/pages/parametres/Notifications.tsx)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/infra/vps/flaix-admin.sh)

### Documentation

- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/3276652190fa7fd86d1a643f2ee027e7f657ecf5/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

### `apps/api/test/emails.test.ts`

- **e-mails du lieu (§15.146)**
  - réglages : rapport et rectifications actifs par défaut ; le directeur est destinataire
  - une adresse en plus (l'expert-comptable) ; [F] une adresse mal formée ou plus de 5 adresses sont refusées ; journalisé
  - clôture de l'événement : le rapport part une fois, au directeur et à l'expert-comptable, avec le lien du rapport
  - rectification du Z : notifiée aussitôt, avec le motif et la signature
  - [F] Brevo en panne : la rectification est enregistrée quand même, l'échec est tracé et visible
  - e-mail d'essai : à la seule personne connectée
  - [F] la trace des envois ne se modifie ni ne se supprime

### `packages/domain/src/emails.test.ts`

- **e-mails (§15.146)**
  - rapport de soirée : le brief tel quel et le lien vers le rapport complet, sans autre chiffre
  - [F] le contenu est échappé : un motif avec du code ne devient jamais du HTML
  - adresses : forme contrôlée ; e-mail d'essai

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/emails.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/emails.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
