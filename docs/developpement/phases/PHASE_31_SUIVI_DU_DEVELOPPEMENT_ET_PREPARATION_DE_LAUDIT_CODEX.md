# Phase 31 — Suivi du développement et préparation de l'audit Codex

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-04 |
| Décision | dossier projet §15.128 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.128 Suivi du développement et préparation de l'audit Codex (2026-10-04)

Rémi : *« je vais faire faire un audit du code et des documents à Codex ; as-tu créé un dossier de développement de chaque phase, ligne de code, GitHub relié au document, comme avec Break Eat ? Le dossier de règles. »*
Mis en place, sur le modèle de Break Eat (`brain/`, `CHANGELOG.md`, audits par phase) :
- **`AGENTS.md`** (racine, lu automatiquement par Codex) : règles et invariants pour tous les outils d'IA, rôles (Claude Code construit, Codex audite sans modifier), commandes, format des rapports. `CLAUDE.md` et `README.md` mis à jour (éditeur Break Eat App, renvois).
- **`docs/developpement/JOURNAL_DES_PHASES.md`** : 31 phases (0 à 30), chacune avec sa section du dossier, ses commits (liens GitHub), ses migrations, son moteur, son serveur, ses écrans, ses tests.
- **`docs/developpement/CARTE_DU_CODE.md`** : où trouver quoi, et la **ligne exacte** des fonctions et routes clés (liens GitHub figés sur le commit).
- **`CHANGELOG.md`** : chaque commit, sa date, son lien GitHub, ses fichiers.
- **`docs/developpement/CODEX_AUDIT_PROMPT.md`** : le prompt à donner à Codex (audit complet ou d'une phase) ; rapports dans **`docs/audits/`**, défauts classés P1 / P2 / P3 avec fichier et ligne.
- Le journal, le CHANGELOG et la carte sont **générés depuis Git** (`node infra/outils/journal-developpement.cjs`) : à relancer après chaque phase, ils ne peuvent pas diverger du code.

## 2. Ce qui a été construit — commits

- [`0b59036`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b590362a71a8549b053dcfb0e1a6ff474fd3d5e) — 2026-10-04 — Dossier de développement pour l'audit Codex : AGENTS.md, journal des phases, carte du code, CHANGELOG, prompt d'audit
- [`2859233`](https://github.com/Break-Eat-APP/flaix-expert/commit/2859233de0a1cd9bc6dd27b388e7f97fd32f575a) — 2026-10-04 — Journal des phases : phase 31 (suivi du développement)
- [`0c29f8f`](https://github.com/Break-Eat-APP/flaix-expert/commit/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc) — 2026-10-04 — Journal des phases : commits rattachés

## 3. Fichiers, par couche

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/infra/outils/carte-du-code-intro.md)
- `infra/outils/journal-developpement.cjs` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/infra/outils/journal-developpement.cjs)

### Documentation

- `AGENTS.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/AGENTS.md)
- `CHANGELOG.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/CHANGELOG.md)
- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/CLAUDE.md)
- `docs/audits/README.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/docs/audits/README.md)
- `docs/developpement/CARTE_DU_CODE.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/CODEX_AUDIT_PROMPT.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/docs/developpement/CODEX_AUDIT_PROMPT.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/docs/flaix-gestion-dossier-projet.md)
- `README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/0c29f8f88e666c02e4f7e3a5a95cda100937c5bc/README.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
