# FlaiX Expert / Flex Expert — instructions de projet

Ce projet construit la **première version de production** de FlaiX Expert (Break Eat SAS, fondateur Rémi Notta). Avant d'écrire une seule ligne de code, lis en entier :

1. `docs/flaix-gestion-dossier-projet.md` — le dossier projet complet : toutes les décisions déjà actées avec Rémi, module par module, avec leur raisonnement. C'est la seule source de vérité validée.
2. `docs/flaix-brief-production-claude-code.md` — le brief de passage en production (2026-09-28) : périmètre retenu, ce qui manque, points bloquants encore ouverts (notamment une question fiscale NF525/Stripe non tranchée, voir sa section 2).

3. `docs/decisions-architecture-production.md` — les décisions d'architecture de la production, validées par Rémi le 2026-09-28 (§ 10), et ce qui reste ouvert (§ 11).

Le prototype de référence (`docs/reference/flaix-gestion-final.html`, artifact Claude, ~6 800 lignes) fait autorité comme **spécification fonctionnelle et visuelle** de chaque écran déjà validé par Rémi — mais ce n'est pas du code à copier tel quel : il n'a aucune persistance, aucune sécurité réelle, et chaque module y scelle ses propres données de démonstration indépendamment des autres (voir dossier §15.91).

## Règles non négociables, héritées de tout le projet jusqu'ici

- **Aucune donnée inventée.** Jamais un chiffre, une loi, une source, une entreprise, une donnée que Rémi n'a pas confirmée. En cas de doute : le dire explicitement (« je ne dispose pas d'une information suffisamment fiable ») plutôt que de deviner.
- **Aucune donnée de démonstration dans la version de production.** Chaque lieu (à commencer par Les Spartiates de Marseille) démarre avec un compte **entièrement vide** : le directeur construit lui-même ses stands, ses caisses, son catalogue, ses prix, ses stocks. Rien de préchargé, rien de fictif visible par un utilisateur réel.
- **Décision écrite avant code.** Pour tout changement de comportement ou de périmètre, la décision et son raisonnement sont écrits (dans le dossier ou dans un échange avec Rémi) avant d'être codés — jamais l'inverse.
- **Lire le module concerné en entier avant de le modifier.** Ne jamais modifier un écran déjà construit sans avoir lu tout son code existant d'abord.
- **Ne jamais toucher un module déjà validé sans le signaler explicitement.** Une extension additive et clairement annoncée est acceptable ; une modification silencieuse ne l'est jamais.
- **Analyse critique, pas de complaisance.** Rémi attend un avis d'investisseur/consultant senior : chercher les failles avant les qualités, signaler les risques et les hypothèses non vérifiées, proposer une meilleure solution si elle existe même si elle contredit sa demande initiale.
- **Sujets fiscaux/juridiques (NF525, RGPD, attestation éditeur...)** : présenter les faits et les sources, jamais de conclusion définitive — Rémi n'est pas juriste ni comptable, moi non plus. Rappeler quand un point nécessite une validation par un professionnel, et vérifier dans le dossier (§15.7 à §15.14) ce qui a déjà été recherché avant de recommencer une recherche à zéro.

## Périmètre de cette mise en production (résumé — le détail fait foi dans le brief)

Confirmé avec Rémi le 2026-09-28 : le module **Ma caisse** (création de tickets par la caissière) est dans le périmètre. **Corrigé par Rémi le 2026-09-29 : aucun encaissement ne passe par Stripe ni par FlaiX Expert. Le paiement carte se fait sur le TPE du lieu (sa banque), non relié au logiciel ; la caisse enregistre « carte » une fois le paiement accepté** (dossier §15.95). Stripe ne concerne que le Click & Collect de l'application Break Eat. La question NF525 reste à trancher avant la mise en service réelle de la caisse (`docs/questions-expert-comptable.md`).

## Avant de commencer à coder

1. Lire les documents `docs/` en entier.
2. ~~Écrire et faire valider les décisions d'architecture~~ — **fait le 2026-09-28** (`docs/decisions-architecture-production.md` § 10). Restent ouverts : hébergeur de production, ticket papier/dématérialisé, hors-ligne, et la nouvelle organisation des écrans (dossier §15.95) (§ 11 du même document).
3. ~~Construire la configuration d'un lieu vide~~ — **socle + phase 1 livrés le 2026-09-28** (dossier §15.93), en attente de validation visuelle par Rémi.
4. Ensuite, reprendre la méthode déjà éprouvée sur ce projet : un module à la fois, décision → code → vérification → validation visuelle par Rémi → module suivant.

## Repères techniques (ajoutés le 2026-09-28)

- Monorepo pnpm : `apps/api` (Fastify), `apps/web` (React + Vite), `packages/domain` (moteur de calcul pur), `db/migrations` (SQL). Commandes dans `README.md`.
- **Montants en centimes entiers, taux de TVA en points de base (1000 = 10 %)** — jamais de nombre à virgule pour de l'argent.
- **Toute requête métier passe par `base.transaction({ lieuId, utilisateurId }, …)`** : c'est ce qui active l'isolement des lieux dans PostgreSQL (sécurité par ligne).
- **Toute modification d'un paramétrage s'accompagne d'un `inscrireJet(…)` dans la même transaction** (auteur + horodatage + avant/après, dossier §3).
- Journaux et tarifs sont en écriture seule **au niveau de la base** (droits + déclencheurs). Ne jamais « contourner » un refus de la base : il est voulu.
- Une migration déjà appliquée ne se modifie jamais : écrire une nouvelle migration.
- Tests de conformité : `apps/api/test/conformite-base.test.ts`. Tout nouveau journal (tickets, clôtures…) doit y recevoir ses tests [F] avant d'être codé (§15.19).
- Docker Desktop sur ce poste : en cas de plantage au démarrage (« The file cannot be accessed by the system » sur un fichier `.sock`), voir la note dans `docs/decisions-architecture-production.md` § 13.
