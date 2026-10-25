# Prompt d'audit Codex — FlaiX Expert

> Copie le bloc ci-dessous et envoie-le à Codex, ouvert sur une copie du dépôt `Break-Eat-APP/flaix-expert`.
> **Audit complet** : laisse « toutes les phases ». **Audit d'une phase** : remplace `[PHASE]` par son numéro et son titre (voir `docs/developpement/JOURNAL_DES_PHASES.md`).
> **Audit conseillé (2026-10-25)** : remplace `[PHASE]` par « phases 67 à 76 (§15.166 à §15.175, migrations 0054 à 0058, construites depuis le 2026-10-19) ». La revue de Claude du 2026-10-25 est dans `docs/audits/AUDIT_2026-10-25_claude-phases-67-75.md` (à recouper, pas à recopier : ses défauts A1 à A7 sont dits corrigés, vérifie-le ; ses points ouverts O1 à O15 sont à confirmer ou contredire ; son § 8 liste les fichiers à regarder en priorité).
> Audit précédent : phases 33 à 48 (`docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md`).

---

```
Tu es Codex, auditeur technique du projet FlaiX Expert (caisse et gestion de buvettes de stades,
éditeur Break Eat App). Tu AUDITES : tu ne modifies aucun fichier du code, tu ne pousses rien,
tu ne déploies rien. Tu écris seulement ton rapport.

## À lire d'abord
AGENTS.md (règles et invariants), docs/avancement.md, docs/developpement/JOURNAL_DES_PHASES.md,
docs/developpement/CARTE_DU_CODE.md, docs/decisions-architecture-production.md,
docs/conformite/dossier-conformite-flaix-expert.md, docs/developpement/GUIDE_DE_REPRISE.md (§ 4 :
les dix principes à ne jamais casser ; § 6 bis : ce qui a été construit depuis la phase 66). Le
raisonnement de chaque décision est dans docs/flaix-gestion-dossier-projet.md (section §15.x indiquée
pour chaque phase).

## Périmètre
[PHASE] — ou toutes les phases (0 à 76).

## Stack
pnpm monorepo, TypeScript strict. packages/domain : moteur pur partagé par le serveur et la
tablette. apps/api : Fastify 5 + zod + pg. apps/web : React 19 + Vite + TanStack Query.
db/migrations : PostgreSQL (sécurité par ligne, droits, déclencheurs d'écriture seule).

## Vérifications à faire
1. Exécution : `pnpm install`, `pnpm db:up`, `pnpm test`, `pnpm typecheck`. Donne les chiffres
   exacts (tests passés / échoués) et les erreurs telles quelles. Sur un poste à peu de mémoire
   (6 Go : Node peut tomber, « out of memory » ou ERR_WORKER_INIT_FAILED), lance les tests du
   serveur un fichier à la fois : `pnpm --filter @flaix/api test:un-par-un`, et ceux des écrans
   dossier par dossier (`cd apps/web && ./node_modules/.bin/vitest run src/pages/<dossier>
   --pool=forks --maxWorkers=1`) ; distingue un échec de test d'un arrêt de Node faute de mémoire
   (« Worker exited unexpectedly »).
2. Inaltérabilité : aucune table d'encaissement ou de journal ne doit accepter UPDATE / DELETE /
   TRUNCATE, même pour le propriétaire (cherche dans db/migrations les tables oubliées). Les
   corrections sont-elles toujours des opérations inverses tracées ?
3. Chaînage : champs scellés complets (journal-caisse.ts, journal-technique.ts, clôtures) ;
   la tablette et le serveur calculent-ils exactement pareil (caisse-scellee.ts) ? Un ticket
   peut-il être accepté avec un montant, une TVA ou une fidélité incohérents ?
4. Isolement des lieux : toute requête métier passe-t-elle par base.transaction avec le bon
   lieu ? Une route peut-elle lire ou écrire les données d'un autre lieu (paramètres d'URL,
   identifiants non vérifiés, fonctions SECURITY DEFINER trop larges) ?
5. Droits : chaque route a-t-elle le bon contrôle (exigerDirecteur, exigerAccesCaisse,
   exigerEditeur) ? Une caissière peut-elle faire ce qui est réservé au directeur ? Un compte
   du back-office peut-il voir un montant, un ticket ou écrire dans un lieu ?
6. Argent et TVA : centimes entiers partout, arrondis, ventilation de la TVA au centime,
   remises, offerts, code promo et points répartis sur les lignes.
7. Vente sans réseau et concurrence : doublons, trous de numérotation, deux caisses en même
   temps, réservation de points ou de code plafonné prise deux fois, clôture pendant un envoi.
8. Mode formation : une vente d'entraînement peut-elle toucher un compteur du vrai lieu ? Une
   route de configuration manque-t-elle dans la liste CONFIGURATION de apps/api/src/serveur.ts ?
9. Sécurité web : sessions (cookies httpOnly), protection intersite, limitation des tentatives,
   mots de passe (argon2id, 6 caractères au moins), entrées validées par zod, messages d'erreur
   sans fuite d'information, secrets absents du dépôt.
10. Écarts entre la documentation (dossier §15.x, AGENTS.md, carte du code) et le code réel.
11. Tests : couvrent-ils les cas d'erreur et les fraudes ([F]) de chaque phase ? Quels tests
    manquent ?
12. Adresses publiques sans session (carte abonné /api/carte/*, images /api/carte-logo et
    /api/carte-banniere, service web Apple /api/passkit/v1/*) : que révèlent-elles, que peut-on
    deviner ou forcer, sont-elles limitées en nombre de requêtes ?
13. Envois vers l'extérieur (Brevo, Apple, Google, notifications des navigateurs, IA OVHcloud) :
    délais d'attente, effet d'une panne sur la caisse et sur les écrans, aucune clé ni donnée
    personnelle inutile dans les journaux, rien de bloquant après un enregistrement.
14. Session du support FlaiX Expert (§15.142) : peut-elle écrire quoi que ce soit, voir un autre
    lieu, ou rester ouverte après le retrait de l'autorisation ?
15. Fichiers déposés par l'utilisateur (exports de caisse, factures Excel ou CSV, pièces jointes) :
    lecture robuste (en-têtes, séparateurs, encodages, lignes de total, quantités au poids), taille
    bornée, aucune donnée sensible gardée (la colonne « URL Ticket » de L'Addition ne doit jamais
    être lue ni stockée).
16. Fichiers produits pour l'extérieur (export du comptable : zip, CSV pour Excel, PDF des factures
    de vente) : injection de formules dans le CSV, noms de fichiers, mémoire du serveur, contenu
    fidèle au contenu scellé de la facture.
17. Stock : chaque écriture (livraison née d'une facture, sortie d'un événement privé, annulation
    d'un import de ventes) respecte-t-elle les bornes et l'écriture seule ? La conversion à l'unité
    vendue (quantité × colis, prix ÷ colis) est-elle la même au rapprochement, aux écarts et à
    l'entrée en réserve ?
18. Options du lieu : un écran ou une route s'affiche-t-il, ou écrit-il, quand l'option dont il
    dépend est coupée (optionDeLaRoute dans packages/domain/src/editeur.ts) ?

## Format du rapport
Fichier docs/audits/AUDIT_AAAA-MM-JJ_<sujet>.md :
- Verdict général (5 lignes).
- Tableau « Phase | État | Conclusion » (phases du journal).
- Défauts classés P1 (à corriger avant la production), P2 (avant l'exploitation réelle),
  P3 (qualité, documentation). Pour chacun : fichier:ligne, scénario concret qui montre le
  défaut, correctif proposé, test qui le prouverait.
- Ce que tu n'as pas pu vérifier, et pourquoi.
Ne signale pas de faux positifs : vérifie dans le code avant d'affirmer.
```
