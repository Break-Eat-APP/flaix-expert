# Documentation de FlaiX Expert — sommaire

> Point d'entrée d'un développeur qui reprend le projet : **[`developpement/GUIDE_DE_REPRISE.md`](developpement/GUIDE_DE_REPRISE.md)**
> (version Word à côté). Ce sommaire dit où se trouve chaque document et à quoi il sert.

## Lire dans cet ordre

1. [`developpement/GUIDE_DE_REPRISE.md`](developpement/GUIDE_DE_REPRISE.md) — le projet en cinq minutes, les principes à ne jamais casser, la recette
   pour ajouter une fonctionnalité, la mise en ligne, ce qui a été construit récemment.
2. [`../AGENTS.md`](../AGENTS.md) et [`../CLAUDE.md`](../CLAUDE.md) — règles du projet.
3. [`flaix-gestion-dossier-projet.md`](flaix-gestion-dossier-projet.md) — **la source de vérité** : chaque décision prise avec Rémi (ses mots,
   le raisonnement, ce qui a été construit et testé), section par section (§15.93 → §15.175).
4. [`avancement.md`](avancement.md) et [`points-a-revoir.md`](points-a-revoir.md) — où en est le projet, ce qui attend Rémi, les développements suivants.

## Le dossier, rangé par usage

| Dossier ou fichier | Contenu |
|---|---|
| [`developpement/`](developpement/) | Suivi du développement : guide de reprise (Markdown et Word), [carte du code](developpement/CARTE_DU_CODE.md) (où est quoi, ligne exacte des fonctions clés), [journal des phases](developpement/JOURNAL_DES_PHASES.md), [une fiche par phase](developpement/phases/README.md) en Markdown et en Word (`phases/word/`), [consigne d'audit pour Codex](developpement/CODEX_AUDIT_PROMPT.md). Généré en partie par `node infra/outils/journal-developpement.cjs` et `node infra/outils/phases-word.cjs`. |
| [`audits/`](audits/README.md) | Rapports d'audit du code (Claude, Codex) et suivi de leurs corrections ; le plus récent : [`AUDIT_2026-10-25_claude-phases-67-75.md`](audits/AUDIT_2026-10-25_claude-phases-67-75.md). |
| [`flaix-gestion-dossier-projet.md`](flaix-gestion-dossier-projet.md) | Dossier projet complet (cadrage, modules, décisions, §15 : journal des décisions de développement). |
| [`decisions-architecture-production.md`](decisions-architecture-production.md) | Choix d'architecture validés, questions ouvertes, incident Docker du poste de Rémi. |
| [`guide-serveur-test-ovh.md`](guide-serveur-test-ovh.md) | Le serveur de test OVH : installation, ce que Rémi règle lui-même (sauvegardes, IA, Brevo, wallet). |
| [`conformite/`](conformite/) | Dossier de conformité du système de caisse (Markdown, Word, PDF). |
| [`questions-expert-comptable.md`](questions-expert-comptable.md) | Questions fiscales encore ouvertes (NF525…). |
| [`cadrage/`](cadrage/) | Périmètre du produit et test terrain (origine du projet). |
| [`strategie/`](strategie/) | Analyse « intelligence, prévision, décision » (orientation des modules d'IA). |
| [`reference/`](reference/) | Références : formats des caisses externes, maquette HTML d'origine. |
| [`maquettes/`](maquettes/) | Maquette d'organisation des écrans. |
| [`marque/`](marque/) | Logo officiel FlaiX Expert. |
| [`flaix-brief-production-claude-code.md`](flaix-brief-production-claude-code.md) | Brief initial de production. |

## À la fin de chaque séance de développement

1. Section « Réalisé le … » dans le dossier projet (§15.x), `avancement.md`, `points-a-revoir.md`.
2. Une entrée dans `infra/outils/phases.cjs`, puis `node infra/outils/journal-developpement.cjs` (journal, CHANGELOG,
   carte du code) et `node infra/outils/phases-word.cjs` (fiches de phase).
3. Si le guide de reprise change : régénérer sa version Word
   et celle du dernier audit : `node infra/outils/guide-word.cjs`.
