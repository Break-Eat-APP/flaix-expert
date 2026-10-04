# FlaiX Expert — règles pour les agents (Claude Code, Codex, Cursor…)

Version : 2026-10-04. **Source de vérité pour tout outil d'IA qui lit ou modifie ce dépôt.** Les instructions propres à Claude Code sont dans [`CLAUDE.md`](CLAUDE.md) ; elles ne contredisent pas ce fichier.

## Le projet en bref

FlaiX Expert est la caisse et l'outil de gestion des buvettes de stades et de patinoires : ventes sur tablette (même sans réseau), clôtures fiscales, résultats, stock, équipe, fidélité, Click & Collect, back-office de l'éditeur.
**Éditeur et hébergeur : Break Eat App** (fondateur Rémi Notta). **Marque affichée à l'écran : FlaiX Expert**, jamais « Break Eat ».
Statut : **version de test** sur `flaixexpert.flaixlabs.com` ; la production attend la réponse de l'expert-comptable, la conformité (attestation, registre des versions, archive) et la copie des sauvegardes hors serveur.

## À lire avant tout travail (dans cet ordre)

1. [`docs/avancement.md`](docs/avancement.md) — où on en est, ce qui est en cours, ce qui reste.
2. [`docs/developpement/JOURNAL_DES_PHASES.md`](docs/developpement/JOURNAL_DES_PHASES.md) — chaque phase : décision, commits GitHub, fichiers.
3. [`docs/developpement/CARTE_DU_CODE.md`](docs/developpement/CARTE_DU_CODE.md) — où trouver quoi, ligne exacte des fonctions clés.
   Pour un développeur : [`docs/developpement/phases/`](docs/developpement/phases/README.md) — un dossier par phase (décision complète, commits, fichiers, cas de test), en Markdown et en Word.
4. [`docs/flaix-gestion-dossier-projet.md`](docs/flaix-gestion-dossier-projet.md) — **toutes les décisions et leur raisonnement** (§15.x, une section par phase). Fait foi en cas de doute.
5. [`docs/decisions-architecture-production.md`](docs/decisions-architecture-production.md) — architecture validée.
6. [`docs/conformite/dossier-conformite-flaix-expert.md`](docs/conformite/dossier-conformite-flaix-expert.md) — conformité du système de caisse (art. 286 I-3° bis du CGI).
7. [`CHANGELOG.md`](CHANGELOG.md) — chaque commit et ses fichiers.

## Rôles

- **Claude Code** construit : décision écrite → code → tests → vérification à l'écran → commit → mise en ligne.
- **Codex audite** : il lit, exécute les tests, cherche les défauts et rend un rapport dans `docs/audits/` (voir [`docs/developpement/CODEX_AUDIT_PROMPT.md`](docs/developpement/CODEX_AUDIT_PROMPT.md)). **Il ne modifie pas le code sans demande explicite de Rémi**, ne pousse rien sur GitHub et ne déploie rien.
- **Aucun outil** ne modifie un test pour le faire passer, ne modifie une migration déjà appliquée, ni ne « contourne » un refus de la base : ces refus sont voulus.

## Règles non négociables

**Produit**
- **Aucune donnée inventée** (chiffre, loi, source) : dire « je ne dispose pas d'une information suffisamment fiable » plutôt que deviner.
- **Aucune donnée de démonstration** dans le logiciel : chaque lieu démarre vide.
- **Décision écrite avant code** (dossier projet ou échange avec Rémi), jamais l'inverse.
- **Sujets fiscaux et juridiques** : présenter les faits et les sources, jamais conclure ; renvoyer à l'expert-comptable ou à un avocat.
- Écrans et messages **en français**, pour un public non technique.

**Technique (invariants vérifiés par les tests)**
- **Argent en centimes entiers ; TVA en points de base** (1000 = 10 %). Jamais de nombre à virgule pour de l'argent.
- **Isolement des lieux par la base** : toute requête métier passe par `base.transaction({ lieuId, utilisateurId })` ; la sécurité par ligne de PostgreSQL fait le reste. Un lieu ne voit ni n'écrit jamais les données d'un autre.
- **Écriture seule** : journaux de caisse, lignes de ticket, journal technique, Z, clôtures, mouvements de stock, réservations de fidélité… n'acceptent ni modification ni suppression, **même pour le propriétaire des tables** (droits + déclencheurs). Une correction est une opération inverse tracée.
- **Chaînage SHA-256** : chaque caisse, chaque journal technique de lieu et les clôtures sont chaînés ; `jsonCanonique` fixe l'ordre. **Ne jamais changer les champs scellés sans version majeure** (dossier §15.5).
- **Vente sans réseau** : la tablette calcule, numérote et scelle avec le **même code** que le serveur (`packages/domain/src/caisse-scellee.ts`) ; le serveur rejoue le calcul avant d'inscrire. Le serveur n'écrit dans la chaîne d'une caisse qu'à l'ouverture et à la clôture.
- Un ticket scellé **ne se refuse pas pour une raison métier** (la vente a eu lieu) : un écart (prix, stand, fidélité…) est **signalé** dans `controle`, pas refusé. Seule une incohérence de calcul ou de chaîne est refusée.
- **Tarifs datés** : un prix ne se réécrit jamais, un nouveau tarif prend effet à sa date.
- **Toute modification de paramétrage** s'accompagne d'un `inscrireJet(…)` (auteur, heure, avant / après) dans la même transaction.
- **Mode formation** : un lieu jumeau séparé par la base ; ne jamais filtrer « formation » dans les calculs. Toute nouvelle route de configuration va dans la liste `CONFIGURATION` (`apps/api/src/serveur.ts`).
- **Comptes FlaiX Expert (back-office)** : aucun accès aux données d'encaissement d'un lieu ; ils ne voient ni montant, ni ticket, ni nom de salarié (seuls les directeurs, contact du client).
- **Fidélité à la caisse** (option A de Rémi) : points et codes plafonnés **réservés par le serveur** avant l'encaissement ; les soldes se lisent dans les tickets non annulés, jamais recopiés.
- **Secrets** : aucun mot de passe, clé ou identifiant dans le dépôt ; ils vivent sur le serveur.
- **Une migration appliquée ne se modifie jamais** : en écrire une nouvelle.

## Commandes

```bash
pnpm install
pnpm db:up            # PostgreSQL local (Docker, port 5433) : bases flaix (développement) et flaix_test (tests)
pnpm db:migrate       # applique les migrations à la base de développement
pnpm test             # moteur + serveur contre la vraie base (environ 390 tests)
pnpm typecheck
node infra/outils/journal-developpement.cjs   # régénère CHANGELOG, journal des phases, carte du code
node infra/outils/phases-word.cjs             # dossier de développement par phase (Markdown + Word) pour un développeur
```

Poste de développement à 6 Go de mémoire : en cas de manque, lancer les tests d'un paquet avec `--maxWorkers=1` (`cd apps/api && ./node_modules/.bin/vitest run --maxWorkers=1`).

## Où écrire

- Décision : `docs/flaix-gestion-dossier-projet.md` (nouvelle section §15.x datée).
- Avancement : `docs/avancement.md`.
- Rapport d'audit : `docs/audits/AUDIT_AAAA-MM-JJ_<sujet>.md`, défauts classés **P1** (à corriger avant la production), **P2** (avant l'exploitation réelle), **P3** (qualité, documentation), chacun avec fichier et ligne.
