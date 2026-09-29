# FlaiX Expert

Caisse et gestion financière des buvettes de stade — Break Eat.
Décisions d'architecture : [`docs/decisions-architecture-production.md`](docs/decisions-architecture-production.md). Dossier projet (source de vérité) : [`docs/flaix-gestion-dossier-projet.md`](docs/flaix-gestion-dossier-projet.md).

## Organisation

```
apps/api          serveur (Node.js + Fastify) — droits, règles, calculs
apps/web          écrans directeur (React + Vite)
packages/domain   modèle canonique + moteur de calcul pur, testé
db/migrations     schéma PostgreSQL versionné (une migration appliquée ne se modifie jamais)
infra/            base PostgreSQL locale (Docker)
docs/             dossier projet, brief, décisions, questions à l'expert-comptable
```

## Démarrer en local

Prérequis : Node.js 24+, pnpm, Docker Desktop.

```bash
pnpm install
pnpm db:up          # démarre PostgreSQL (port 5433)
pnpm db:migrate     # applique le schéma
pnpm dev            # serveur (3001) + écrans (http://localhost:5173)
```

Créer un lieu **vide** et son directeur (outil éditeur Break Eat, en attendant le back-office) :

```bash
pnpm cli creer-lieu --nom "Nom du lieu" --email directeur@exemple.fr --directeur "Prénom Nom"
```

Le mot de passe provisoire s'affiche une seule fois ; à changer dans « Mon mot de passe » dès la première connexion.
Mot de passe perdu : `pnpm cli nouveau-mot-de-passe --email …`

## Tests

```bash
pnpm test           # moteur de calcul + serveur + tests de conformité contre la vraie base
pnpm typecheck
```

Les tests de conformité (`apps/api/test/conformite-base.test.ts`) provoquent réellement les fraudes qu'ils doivent détecter (modification ou suppression d'un journal, accès à un autre lieu…) : ils ne passent que si la base PostgreSQL elle-même les refuse (plan de tests §15.19 du dossier).

`pnpm db:reset` vide entièrement la base de développement locale (refusé en production et sur une base distante).

## Règles de travail

Voir [`CLAUDE.md`](CLAUDE.md) : décision écrite avant code, aucune donnée de démonstration, lecture complète d'un module avant de le modifier, validation visuelle par Rémi module par module.
