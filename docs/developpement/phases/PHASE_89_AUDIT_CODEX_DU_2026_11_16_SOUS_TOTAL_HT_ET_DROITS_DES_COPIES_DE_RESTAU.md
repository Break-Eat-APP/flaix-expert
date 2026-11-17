# Phase 89 — Audit Codex du 2026-11-16 : « Sous-total HT » et droits des copies de restauration

> FlaiX Expert · dossier de développement · généré le 2026-11-17 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-17 |
| Décision | dossier projet §15.188 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.188 Audit Codex du 2026-11-16 : « Sous-total HT » et droits des copies de restauration (2026-11-17)

**Contexte** : audit Codex des phases 82 à 87 (`docs/audits/AUDIT_2026-11-16_codex-phases-82-87-revue-chirurgicale.md`) :
aucun P1, des P2. Rémi : « oui lance les points 1 et 2 ».

**Ce qui est fait** :
- **BUG-2026-021** (P2, `packages/domain/src/factures-import.ts`) : un fichier Excel/CSV de facture qui n'a qu'une ligne
  « Sous-total HT » (sans « Total HT ») n'avait pas de total lu, donc pas de contrôle automatique de la somme des lignes.
  Désormais : « Sous-total HT », « Sous total H.T. », « Sous-total hors taxes » sont reconnus ; s'il y en a plusieurs, le
  dernier est retenu ; une ligne « Total HT » passe toujours avant, où qu'elle soit. Si le dernier sous-total ne couvre
  qu'une partie des lignes, le contrôle de la somme le signale : rien n'est validé en silence. Un sous-total TTC n'est
  jamais pris.
- **BUG-2026-022** (P2, `infra/vps/flaix-admin.sh`, commandes `essai-restauration` et `essai-restauration-locale`) : la
  copie temporaire de la base était rendue lisible par tous les comptes du serveur (dossier 755, fichier 644) le temps de
  l'essai. Désormais le dossier appartient à `postgres` (700) et la copie est en 600 : seuls root et postgres la lisent
  (postgres lit déjà la base entière). Les sauvegardes elles-mêmes étaient déjà protégées (`/var/backups/flaix` en 700,
  fichiers en 600, vérifié sur le serveur).

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Lecture des factures (moteur) | `vitest run src/factures-import.test.ts src/factures.test.ts src/factures-pdf.test.ts` | 29 réussis, dont le nouveau : sous-total seul, variantes d'écriture, plusieurs sous-totaux (le dernier), « Total HT » prioritaire, [F] sous-total TTC jamais pris |
| Factures (serveur, vraie base) | `export-factures`, `facture-ingredient`, `facture-livraison-lieu`, `facture-reserve`, `factures` | 2 + 4 + 3 + 5 + 8 réussis |
| Écrans Achats et Factures | `vitest run src/pages/achats`, `src/pages/factures` | 1 + 2 réussis |
| Script du serveur | `bash -n infra/vps/flaix-admin.sh` | syntaxe correcte |
| Types | `tsc --noEmit` (moteur) | sans erreur |

L'essai de restauration avec les nouveaux droits se refait sur le serveur par Rémi (`sudo flaix-admin
essai-restauration-locale`) : il demande le mot de passe d'administration, que Claude n'a pas.

**Restent de l'audit** (non traités ici) : copie hors serveur chez OVH (reportée par Rémi) ; l'essai de restauration ne
compare que des nombres de lignes, son message devrait dire « volumes comparés » plutôt que « identiques » ; recette réelle
Apple/Google Wallet (BUG-2026-017) ; PDF réels dans les tests (BUG-2026-018) ; P3 documentaires.

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne sur le serveur de test ; aucune migration ; retour
arrière = commit précédent.

## 2. Ce qui a été construit — commits

- [`775bcf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/775bcf2da73e3011205e64ec9cbdaca0ee355669) — 2026-11-17 — Audit Codex 2026-11-16 : « Sous-total HT » seul reconnu comme total HT (le dernier ; un « Total HT » passe avant) ; copie temporaire des essais de restauration lisible par root et postgres seuls (700/600) (BUG-2026-021, BUG-2026-022, §15.188)

## 3. Fichiers, par couche

### Tests

- `packages/domain/src/factures-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/775bcf2da73e3011205e64ec9cbdaca0ee355669/packages/domain/src/factures-import.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/775bcf2da73e3011205e64ec9cbdaca0ee355669/packages/domain/src/factures-import.ts)

### Serveur OVH et outils (infra)

- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/775bcf2da73e3011205e64ec9cbdaca0ee355669/infra/vps/flaix-admin.sh)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
