# Audit Codex du 2026-10-05 — phases 33 à 48

> Conclusion de Codex transmise par Rémi le 2026-10-05 (le rapport complet de Codex n'a pas été déposé dans le dépôt).
> Codex confirme les corrections de la revue de Claude du même jour (`AUDIT_2026-10-05_revue-claude-phases-39-48.md`),
> en particulier la carte barrée (Apple, `voided`) et inactive (Google, `INACTIVE`) d'un abonné désactivé, conforme aux
> mécanismes officiels d'Apple et de Google.

## Défauts relevés par Codex et suite donnée

| Classe | Défaut | Suite |
|---|---|---|
| P1 | Désactiver l'option Fidélité d'un lieu ne révoque pas les cartes Apple et Google déjà installées | **Corrigé** |
| P2 | `node-forge` 1.4.0 reste vulnérable ; passage recommandé à 1.4.1 ou plus | **Corrigé autrement** : 1.4.1 n'est pas publiée ; `node-forge` est retirée du serveur |
| P2 | Une erreur d'Apple ou de Google laisse une carte périmée, sans nouvel essai | **Corrigé** |
| P2 | Les e-mails Brevo sont envoyés dans une transaction SQL | **Corrigé** |
| P2 | Suite de tests du serveur pas entièrement verte (10 échecs sur 345), problèmes de mémoire | **Expliqué et outillé** (voir ci-dessous) |

### P1 — Option Fidélité retirée : cartes révoquées

`apps/api/src/routes/wallet.ts` (`donneesCartes`) : une carte n'est valable que si l'abonné est actif **et** l'option
Fidélité du lieu est active. `apps/api/src/routes/editeur.ts` (`PUT /api/editeur/lieux/:id/options`) : retirer ou rendre
l'option Fidélité met à jour toutes les cartes du lieu en arrière-plan (iPhone prévenus, cartes Google remplacées). Option
retirée : carte Apple barrée, carte Google `INACTIVE`, page de la carte fermée ; option rendue : cartes de nouveau valables.
Test : `wallet.test.ts`, « option Fidélité retirée par FlaiX Expert ».

### P2 — `node-forge`

La version 1.4.1 recommandée n'existe pas encore sur npm (dernière publiée : 1.4.0). La signature de la carte Apple est
désormais faite sans bibliothèque : `apps/api/src/wallet/cms.ts` code la signature CMS détachée en DER (mêmes attributs
qu'`openssl smime -sign` : type de contenu, date de signature, empreinte SHA-256 du manifeste) et signe avec `node:crypto` ;
certificats lus avec `X509Certificate`, clé avec `createPrivateKey`. `node-forge` ne sert plus qu'aux tests (fabrication de
faux certificats) : `pnpm audit --prod` → « No known vulnerabilities found ». Vérifications : test qui relit les attributs
signés et vérifie la signature RSA avec la clé publique du certificat ; `openssl smime -verify` → « Verification successful ».

### P2 — Nouvel essai après une erreur d'Apple ou de Google

Migration 0038 (`wallet_relance`, fonction `relances_wallet_dues`). Une réponse passagère (pas de réponse, 408, 429, 5xx)
d'Apple ou de Google, pour une carte ou pour le modèle de carte du lieu, est notée ; le serveur la renvoie toutes les
5 minutes (`relancerCartes`, lancée par `apps/api/src/index.ts`), avec un délai croissant (5 min, 10, 20… jusqu'à 6 h),
et l'abandonne en le journalisant après 12 essais. Un envoi réussi efface la relance. Tests : panne de Google → relance
notée, rien avant l'heure, renvoi réussi puis effacé, abandon au 12ᵉ essai ; panne du modèle de carte relancée.

### P2 — E-mails hors transaction

`apps/api/src/routes/emails.ts` : `envoyerEtTracer` appelle Brevo hors de toute transaction, puis écrit la trace dans sa
propre transaction. Rapport de soirée et rectification : données lues dans une transaction, envoi ensuite ; lancés en
arrière-plan après la clôture et après la rectification (l'écran n'attend plus Brevo). E-mail d'essai et lien de la carte :
même découpage. Test : aucune connexion à la base n'est occupée pendant les envois (`emails.test.ts`).

### P2 — Suite de tests du serveur

Le poste de Rémi a 6 Go de mémoire (0,2 à 0,5 Go libres le 2026-10-05, l'application Codex ouverte) : lancée d'un bloc, la
suite fait tomber Node (« out of memory », `ERR_WORKER_INIT_FAILED`) et les fichiers touchés comptent comme des échecs.
Nouvelle commande : `pnpm --filter @flaix/api test:un-par-un` (un fichier par processus, base neuve à chaque fichier,
résumé à la fin) ; le prompt d'audit Codex la mentionne. Résultat fichier par fichier : voir la section suivante.

## Défaut trouvé en vérifiant la mise en ligne (non vu par les audits)

**Le serveur de test ne lisait pas les réglages Apple et Google.** Le script de mise en ligne installé sur le serveur datait du
2026-10-05 à 10 h 47, avant la ligne qui le met à jour lui-même : chaque mise en ligne réécrivait donc le service avec
l'ancienne liste de fichiers de réglages, sans `wallet-apple.env` ni `wallet-google.env`. Effet : les boutons « Ajouter à
Apple Wallet / Google Wallet » ne pouvaient pas apparaître, bien que Rémi ait installé les deux comptes. Corrigé le
2026-10-05 à 21 h 46 : script installé une fois à la main, nouvelle mise en ligne ; il se met désormais à jour seul. Vérifié
sur le serveur : réglages Apple et Google lus, carte d'essai signée avec le vrai certificat d'Apple et vérifiée avec
l'intermédiaire d'Apple (`openssl smime -verify` : « Verification successful »), service web Apple qui répond.

## Résultat des tests après corrections

Serveur, fichier par fichier (`test:un-par-un`) le 2026-10-05 au soir : **37 fichiers, 351 tests, tous verts au premier essai**
(dont `wallet.test.ts` 21, `wallet-fichiers.test.ts` 5, `emails.test.ts` 7, `formation.test.ts` 10). Types vérifiés. Moteur et
écrans non modifiés par ces corrections (240 et 63 tests verts au passage précédent). `pnpm audit --prod` : aucune vulnérabilité.
