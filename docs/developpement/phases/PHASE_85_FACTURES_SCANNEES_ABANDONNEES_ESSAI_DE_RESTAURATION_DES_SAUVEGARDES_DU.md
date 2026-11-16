# Phase 85 — Factures scannées abandonnées ; essai de restauration des sauvegardes du serveur

> FlaiX Expert · dossier de développement · généré le 2026-11-16 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-16 |
| Décision | dossier projet §15.184 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.184 Lecture des factures scannées abandonnée ; essai de restauration des sauvegardes (2026-11-16)

**Contexte** : Rémi, le 2026-11-16, sur la clé Mistral : « on va laisser tomber ça car ça sera toujours du PDF, jamais sur
un papier, et tu m'as dit que par PDF c'est ok, ça fonctionne très bien » ; puis « on y va pour 1 » (tester la restauration
d'une sauvegarde, point le plus important avant la production selon la gouvernance § 16.4).

**Décision** : la lecture des factures scannées par IA (Mistral OCR, §15.173, points 1 et 11) est abandonnée. Les PDF
fabriqués par un logiciel se lisent sans IA (§15.178) ; **un nouveau fournisseur demande d'ajouter sa mise en page** au
lecteur, pas d'IA. La clé Mistral ne servirait plus qu'à l'assistant (option du lieu, inchangée).

**Constat sur les sauvegardes** : `flaix-admin essai-restauration` existait déjà pour la **copie chez OVH** (essayée le
2026-09-30 avec un faux stockage et une clé jetable : restauration complète) ; elle exige que la copie soit réglée par Rémi,
ce qui est encore à faire. **Rien ne permettait d'essayer les sauvegardes du serveur lui-même** (`/var/backups/flaix`). Les
documents du 2026-11-12 disaient « jamais testée » : corrigé (le mécanisme OVH l'a été, sur un faux stockage).

**Ce qui est fait** : `sudo flaix-admin essai-restauration-locale` (`infra/vps/flaix-admin.sh`, installé à chaque mise en
ligne) : dernière sauvegarde du serveur copiée, restaurée dans une base temporaire `flaix_essai_restauration`
(`pg_restore --exit-on-error` : la moindre erreur arrête l'essai et le dit), comptes de onze tables comparés à la base en
service (dont `schema_migrations`, journaux, clôtures, factures, stock), durée affichée, base temporaire supprimée. La base
en service n'est jamais touchée. Aucun accès supplémentaire pour l'agent : la commande est lancée par Rémi.

**Vérifié** :

| Test | Commande | Résultat |
|---|---|---|
| Syntaxe du script | `bash -n infra/vps/flaix-admin.sh` | sans erreur |
| Répétition de la restauration (poste, base Docker) | `pg_dump -Fc flaix` puis `pg_restore --no-owner --no-privileges --exit-on-error` dans une base neuve | réussie en 5 s ; 63 migrations, lieux, produits, journal technique, factures : comptes identiques |

Le passage sur le serveur lui-même reste à faire par Rémi (l'agent n'y a que la sauvegarde et la mise en ligne).

**Risques restants** : tant que la copie chez OVH n'est pas réglée, les sauvegardes sont sur le même serveur que la base :
une panne du disque du serveur les emporterait toutes.

**Mise en ligne et retour arrière** : sauvegarde puis mise en ligne (installe le nouvel outil) ; retour arrière = commit
précédent.

**Suite du même jour** : Rémi a lancé l'essai sur le serveur
(`ssh -t … "sudo flaix-admin essai-restauration-locale"`) : sauvegarde `flaix-20261116-1221.dump` (2,9 Mo) restaurée en
**2 s** ; `schema_migrations` 63, `lieu` 3, `utilisateur` 4, `produit` 38, `evenement` 4, `journal_caisse` 18, `ligne_ticket`
56, `journal_technique` 196, `cloture_periode` 3, `facture_fournisseur` 0, `stock_mouvement` 20 — identiques à la base en
service. Premier essai réel réussi ; à refaire chaque trimestre. Reste la copie hors serveur.

## 2. Ce qui a été construit — commits

- [`284edd8`](https://github.com/Break-Eat-APP/flaix-expert/commit/284edd88911e2eb36ced490d0f1cfdfef135d356) — 2026-11-16 — Serveur : « flaix-admin essai-restauration-locale » restaure la dernière sauvegarde du serveur dans une base temporaire, compare et mesure la durée (§15.184)

## 3. Fichiers, par couche

### Serveur OVH et outils (infra)

- `infra/vps/flaix-admin.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/284edd88911e2eb36ced490d0f1cfdfef135d356/infra/vps/flaix-admin.sh)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
