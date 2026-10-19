# Phase 45 — IA : OVHcloud seul comme moteur de langage de l'agent

> FlaiX Expert · dossier de développement · généré le 2026-10-19 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.145 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.145 Moteur de langage de l'agent : OVHcloud seul (2026-10-05)

**Question de Rémi** : *« étions-nous obligés de passer par Mistral ? On a dit que nous développons notre propre agent. »* **Réponse** : non. L'agent est bien celui de FlaiX Expert (outils en lecture seule, consignes, contrôle des chiffres, trace, limite par jour, §15.137) ; seul le **modèle de langage** (le moteur qui comprend la question et rédige) est loué, ou installé chez nous. Trois voies présentées : Mistral en direct (meilleur modèle ; nouveau compte, offre payante « Scale » obligatoire car l'offre gratuite « Experiment » permet à Mistral d'entraîner ses modèles avec les données envoyées) ; **OVHcloud AI Endpoints seul** (compte OVH existant, hébergement en Europe, aucun nouveau contrat, modèle plus petit) ; un modèle sur notre propre serveur (carte graphique, coût sans rapport avec l'usage actuel).

**Décision de Rémi** : **OVHcloud seul** (la recommandation). Rien à reprogrammer : la passerelle essaie les modèles branchés dans l'ordre ; avec le seul jeton OVHcloud, c'est lui qui répond. Les textes affichés ne nomment plus Mistral (l'écran de l'assistant indique le modèle sous chaque réponse) ; le guide du serveur commence par OVHcloud ; `flaix-admin cle-mistral` reste disponible en option.

## 2. Ce qui a été construit — commits

- [`0cf75f7`](https://github.com/Break-Eat-APP/flaix-expert/commit/0cf75f74279946891a5f97e9149a8f8086144895) — 2026-10-05 — IA : OVHcloud seul comme moteur de langage de l'agent (dossier §15.145)
- [`b860416`](https://github.com/Break-Eat-APP/flaix-expert/commit/b8604166a371e12a7b414dbe8de26b42bae76ad6) — 2026-10-05 — IA OVHcloud : « clé d'API » comme dans l'espace OVHcloud, commande à lancer en une ligne depuis PowerShell

## 3. Fichiers, par couche

### Tests

- `apps/api/test/assistant.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/apps/api/test/assistant.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/editeur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/packages/domain/src/editeur.ts)

### Serveur (apps/api)

- `apps/api/src/ia/fournisseur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/apps/api/src/ia/fournisseur.ts)
- `apps/api/src/routes/assistant.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/apps/api/src/routes/assistant.ts)

### Écrans (apps/web)

- `apps/web/src/pages/Assistant.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/apps/web/src/pages/Assistant.test.tsx)
- `apps/web/src/pages/Assistant.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/apps/web/src/pages/Assistant.tsx)

### Serveur OVH et outils (infra)

- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/infra/vps/flaix-admin.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b8604166a371e12a7b414dbe8de26b42bae76ad6/docs/guide-serveur-test-ovh.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
