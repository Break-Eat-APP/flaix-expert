# Phase 47 — Carte abonné dans Apple Wallet et Google Wallet

> FlaiX Expert · dossier de développement · généré le 2026-10-23 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.147 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.147 Carte abonné dans Apple Wallet et Google Wallet (2026-10-05)

**Demande de Rémi** : *« j'ai déjà les comptes Apple et Google, guide-moi dans ce développement »* — la carte wallet abonné reportée le 12/09 (§14 module 20) devient constructible. **Règles validées le 12/09, reprises** : la carte porte le **nom et la couleur du lieu** (pas la marque FlaiX Expert : elle doit ressembler au club) ; le **numéro d'abonné en QR code** (le même numéro identifie l'abonné à la caisse, §14 module 19 point 4) ; le **solde de points**, **mis à jour à distance** quand il change.

**Construction** :
- **Lien personnel** de chaque abonné (`/carte/<jeton>`, jeton aléatoire, renouvelable par le directeur, qui invalide l'ancien) : une page publique minimale avec les deux boutons « Ajouter à Apple Wallet » et « Ajouter à Google Wallet ». Elle ne montre que ce que montre la carte (lieu, nom de l'abonné, numéro, points). Le directeur la donne depuis Fidélité → l'abonné : lien à copier, à partager depuis son téléphone (SMS, WhatsApp…) ou à envoyer par e-mail (Brevo) si l'abonné a une adresse. *Pas de QR code du lien à l'écran : il demanderait une bibliothèque de plus ; à ajouter si le besoin se confirme au comptoir.*
- **Apple Wallet** : fichier `.pkpass` signé par le certificat « Pass Type ID » de Break Eat App ; **la clé privée est fabriquée sur le serveur et n'en sort jamais** (`flaix-admin wallet-apple-demande` produit la demande de certificat à déposer chez Apple ; `flaix-admin wallet-apple-certificat` installe le certificat rendu par Apple). Mise à jour du solde : service web PassKit d'Apple + notification au téléphone.
- **Google Wallet** : carte de fidélité (« loyalty ») émise par le compte émetteur de Break Eat App ; clé du compte de service installée par `flaix-admin wallet-google` (jamais vue ni manipulée par Claude). Mise à jour du solde : modification de la carte chez Google.
- **Couleur de la carte** : réglage du lieu (Fidélité → onglet « Carte téléphone », avec l'option Fidélité) ; par défaut, un violet neutre.
- **Le solde** est celui que lit déjà la caisse (tickets non annulés, §15.127) : la carte ne calcule rien.

**Pas dans cette étape** : la carte membre grand public (inscription par QR code, §14 module 20 point 9 : prototype en attente de validation par Rémi), le logo du lieu sur la carte (pas encore de dépôt de logo dans FlaiX Expert), les campagnes.

**Comptes (Rémi)** : Apple — Team ID et identifiant de pass `pass.com.flaixlabs.abonne` ; Google — Issuer ID, compte de service autorisé dans la console Google Wallet, puis demande de publication une fois la carte vue en mode démo.

**Réalisé le 2026-10-05** (migration 0035, moteur `wallet.ts`, `apps/api/src/wallet/` et `routes/wallet.ts`, page publique `/carte/<jeton>`, Fidélité → fiche de l'abonné et onglet « Carte téléphone », commandes `flaix-admin wallet-apple-demande`, `wallet-apple-certificat`, `wallet-google`, `wallet-retirer`) :
- **Lien** créé ou renouvelé par le directeur (journal `carte_wallet_lien`), envoyé par e-mail (trace `carte_wallet`) ; la page publique ne lit la base qu'au travers de `carte_par_jeton` ; lien refusé pour un abonné désactivé, un lieu de formation ou un lieu sans l'option Fidélité.
- **Apple** : `.pkpass` (zip, manifeste SHA-1, signature PKCS #7 détachée avec le certificat de la carte et l'intermédiaire WWDR d'Apple, vérifiée par `openssl smime -verify`) ; service web PassKit sous `/api/passkit/v1` (inscription et désinscription d'un téléphone, cartes modifiées depuis une date, carte à jour, journal) contrôlé par le jeton propre à chaque carte (`carte_par_serie`) ; notification au téléphone (APNs, HTTP/2) ; un téléphone qui a retiré la carte (réponse 410) est oublié.
- **Google** : lien « Ajouter à Google Wallet » signé RS256 par la clé du compte de service (classe par lieu, carte par abonné) ; mise à jour du nom et du solde par l'API Google Wallet.
- **Solde suivi** : après chaque réception de tickets portant le n° d'abonné (vente, ou annulation de cette vente), après un ajustement de points, un changement de nom ou d'état de l'abonné, un changement de règle de points ou de couleur. Une mise à jour qui échoue est journalisée et ne retarde ni ne remet en cause aucun ticket.
- **Clés** : la clé privée Apple est fabriquée sur le serveur ; Team ID et Pass Type ID sont lus dans le certificat d'Apple, contrôlé (même clé que la demande, encore valable, signé par l'intermédiaire d'Apple) ; la clé Google est vérifiée auprès de Google (jeton d'accès et accès à l'émetteur) puis effacée du dossier de dépôt. Rien de secret ne passe par Claude.
- **Tests** : briques 3 (zip et image, `.pkpass` signé, lien Google signé), serveur 13 (lien et journal, e-mail, couleur, page publique, carte Apple, lien Google et logo, inscription PassKit et refus sans jeton, vente avec n° d'abonné → téléphone prévenu et Google mis à jour, vente sans abonné → personne, ajustement et nom, 410, désinscription sans corps, lien renouvelé, abonné désactivé), écrans 5.
- **Reste à faire par Rémi** : certificat Apple et compte de service Google (guide serveur, section « Carte abonné »), puis essai sur un iPhone et un Android ; demande de publication chez Google une fois la carte vue en mode démo (tant qu'elle n'est pas publiée, seuls les comptes de test déclarés dans la console Google peuvent l'ajouter).

## 2. Ce qui a été construit — commits

- [`91b5446`](https://github.com/Break-Eat-APP/flaix-expert/commit/91b5446a293d1a7d981e749812d1e1e4e0f64cb4) — 2026-10-05 — Wallet (1/4) : décision, migration 0035 et contenu de la carte abonné (dossier §15.147)
- [`6a23cf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/6a23cf28837f784116a2d8c2af19180175019ce0) — 2026-10-05 — Wallet (2/4) : carte Apple et Google côté serveur, service web PassKit, mises à jour du solde (dossier §15.147)
- [`0b0f1ee`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b0f1eea2f883d395f0a8b4a2f5bc2c208aeeae0) — 2026-10-05 — Wallet (3/4) : commandes flaix-admin pour la carte Apple (clé et demande de certificat sur le serveur, installation de pass.cer contrôlée) et Google (clé du compte de service vérifiée auprès de Google) (dossier §15.147)
- [`4662794`](https://github.com/Break-Eat-APP/flaix-expert/commit/466279489d406c8ac1230051e1717cb73e7cf8d5) — 2026-10-05 — Wallet (4/4) : page de la carte de l'abonné (/carte/<jeton>), lien de la carte dans la fiche de l'abonné, onglet « Carte téléphone » et couleur des cartes (dossier §15.147)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0035_wallet.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/db/migrations/0035_wallet.sql)

### Tests

- `apps/api/test/emails.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/test/emails.test.ts)
- `apps/api/test/wallet-fichiers.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/test/wallet-fichiers.test.ts)
- `apps/api/test/wallet.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/test/wallet.test.ts)
- `packages/domain/src/wallet.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/wallet.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/editeur.ts)
- `packages/domain/src/emails.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/emails.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/journal-technique.ts)
- `packages/domain/src/wallet.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/packages/domain/src/wallet.ts)

### Serveur (apps/api)

- `apps/api/package.json` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/package.json)
- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/config.ts)
- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/emails.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/routes/emails.ts)
- `apps/api/src/routes/fidelite.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/routes/fidelite.ts)
- `apps/api/src/routes/wallet.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/routes/wallet.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/serveur.ts)
- `apps/api/src/wallet/apple.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/wallet/apple.ts)
- `apps/api/src/wallet/fichiers.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/wallet/fichiers.ts)
- `apps/api/src/wallet/google.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/api/src/wallet/google.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/App.tsx)
- `apps/web/src/pages/carte/PageCarte.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/pages/carte/PageCarte.tsx)
- `apps/web/src/pages/fidelite/CarteWallet.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/pages/fidelite/CarteWallet.test.tsx)
- `apps/web/src/pages/fidelite/CarteWallet.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/pages/fidelite/CarteWallet.tsx)
- `apps/web/src/pages/fidelite/Fidelite.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/pages/fidelite/Fidelite.tsx)
- `apps/web/src/pages/parametres/EmailsLieu.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/pages/parametres/EmailsLieu.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/infra/vps/deployer.sh)
- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/infra/vps/flaix-admin.sh)

### Documentation

- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/docs/flaix-gestion-dossier-projet.md)

### Autres

- `pnpm-lock.yaml` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/466279489d406c8ac1230051e1717cb73e7cf8d5/pnpm-lock.yaml)

## 4. Tests créés dans cette phase

### `packages/domain/src/wallet.test.ts`

- **carte abonné (§15.147)**
  - Apple : nom et couleur du lieu, numéro en QR, solde de points, service de mise à jour
  - sans programme de points : la carte montre le nom, aucun solde ni réduction inventés
  - Google : identifiants sans tirets, même QR, solde ; classe aux couleurs du lieu
  - abonné désactivé : carte Apple barrée, carte Google inactive (audit P2-2)
  - couleurs : rgb, texte lisible sur fond clair ou foncé
- **design de la carte (§15.148)**
  - Apple : titre, nom des points, couleurs choisies, pas de nom à côté du logo, réduction en euros, remise, dos complet
  - remise et réduction se masquent ; sans remise réglée, rien n'est affiché
  - Google : nom du programme, bannière, textes et liens au dos, points renommés, réduction en euros
  - design enregistré : valeurs par défaut, champ illisible ignoré
  - réduction, remise, règle, liens et téléphone
- **images de la carte (§15.148)**
  - bannière : remplit le cadre, recadrée au centre
  - logo Apple : entier, dans le cadre 480 × 150, sans marge ; logo large : toute la largeur
  - logo Google : carré 660 × 660, centré avec une marge pour le cercle
  - taille des fichiers reçus contrôlée

### `apps/api/test/wallet-fichiers.test.ts`

- **archive zip et image**
  - le zip se relit à l'identique ; l'image est un PNG valide
- **images de la carte (§15.148)**
  - taille d'un PNG lue dans son en-tête ; autre chose qu'un PNG est refusé
  - tous les formats exigés, chacun à la bonne taille ; rien d'autre
- **carte Apple (.pkpass)**
  - contient pass.json, les images, un manifeste exact et une signature PKCS #7 qui porte le certificat de la carte et l'intermédiaire
- **carte Google (lien signé)**
  - le jeton est signé RS256 par la clé du compte de service et contient la classe et la carte

### `apps/api/test/wallet.test.ts`

- **lien de la carte (directeur)**
  - pas de lien tant que le directeur ne l'a pas créé ; le créer donne une adresse /carte/<jeton> et l'inscrit au journal
  - le lien part par e-mail à l'abonné, envoi tracé
  - couleur des cartes : contrôlée, enregistrée, journalisée
- **page publique et cartes**
  - le lien montre la carte sans connexion : nom, numéro, solde ; un faux lien est refusé
  - carte Apple : .pkpass signé, QR code = n° d'abonné, service web et jeton propre à la carte
  - carte Google : redirection vers le lien signé « Ajouter à Google Wallet »
- **service web PassKit**
  - inscription du téléphone : 201 puis 200 ; sans le bon jeton, 401
  - une vente avec le n° d'abonné : le téléphone est prévenu, Google mis à jour, la carte a le nouveau solde
  - la caisse n'attend ni Apple ni Google : réponse d'abord, notification ensuite (audit P2-1)
  - une vente sans abonné ne prévient personne
  - ajustement de points et changement de nom prévenus ; téléphone qui a retiré la carte (410) oublié
  - désinscription sans corps ni JSON acceptée ; journal du téléphone accepté
  - journal du téléphone limité à 10 envois par minute (audit P2-5)
- **design de la carte (§15.148)**
  - contrôlé ; enregistré et journalisé ; téléphone prévenu, modèle et carte Google remplacés ; rien de changé, rien d'envoyé
  - logo et bannière : formats contrôlés, rangés, dans la carte Apple, la page de l'abonné et le modèle Google ; retirés
- **mise à jour de toutes les cartes par lots (audit P2-3)**
  - 250 cartes de plus : modèle Google une fois, chaque carte une fois ; soldes identiques à ceux lus par la caisse
- **relance des envois en échec (audit Codex du 2026-10-05)**
  - Google en panne : carte notée, renvoyée à l'heure prévue, relance effacée ; abandon après 12 essais
  - une panne du modèle de carte Google est aussi relancée
- **lien renouvelé et option**
  - renouveler le lien rend l'ancien inutilisable ; la carte Apple déjà installée reste à jour
  - option Fidélité retirée par FlaiX Expert : cartes barrées et inactives, page fermée ; rendue : cartes valables (audit Codex P1)
  - abonné désactivé : page de la carte fermée ; téléphone prévenu, carte Apple barrée, carte Google inactive (audit P2-2)

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/wallet.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/wallet-fichiers.test.ts test/wallet.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
