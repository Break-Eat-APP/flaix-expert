# Phase 11 — Remontées au coffre et Z du coffre

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-30 |
| Décision | dossier projet §15.106 |
| État | livrée, tests au vert au moment du commit |
| Commits | 4 |

## 1. Ce qui a été décidé, et pourquoi

### 15.106 Conservation des tickets et remontées d'espèces au coffre — décisions (2026-09-30)

**Réponses de Rémi (verbatim)** : ticket — *« toujours garder les tickets et stocker sur une durée indéterminée »* ; espèces envoyées au coffre pendant le match — *« oui, clôturer l'espèce finale de la soirée »* ; matières premières, recettes, e-mail de rectification reportés — *« ok »* ; envoi sur GitHub — *« oui »* (fait le 2026-09-30).

**1. Tickets conservés sans limite de durée.** C'est déjà le fonctionnement de FlaiX : le journal de caisse et ses lignes sont en écriture seule, la base refuse toute suppression, même au propriétaire des tables, et n'importe quel ticket se réédite à tout moment (§15.101). Ajout : **la sauvegarde du 1er de chaque mois est gardée sans limite** (les sauvegardes quotidiennes restent gardées 14 jours).
**Signalé, sans conclusion** : les tickets contiennent des données personnelles (nom de la personne qui a servi, n° d'abonné saisi pour la remise). Le RGPD demande de fixer une durée de conservation pour les données personnelles ; une conservation « indéterminée » pourrait devoir être justifiée, ou ces données rendues anonymes au-delà d'une durée (par exemple après les 6 ans de conservation fiscale). **À faire valider** (expert-comptable ou conseil RGPD) — question ajoutée. Rien n'est effacé ni rendu anonyme d'ici là.
**Toujours à faire** : une copie des sauvegardes **hors du serveur** (une panne du disque du serveur emporterait tout) — destination à choisir.

**2. Remontées d'espèces au coffre pendant le match, puis clôture finale des espèces de la soirée.** Conception (lecture de la réponse de Rémi, à confirmer visuellement) :
- **Remontée au coffre** : pendant le match (ou avant le Z du tiroir), le directeur enregistre, pour une caisse, le montant retiré du tiroir et porté au coffre ; heure et auteur gardés, inscrite au journal technique. Une remontée saisie par erreur s'annule par une écriture inverse avec motif, jamais en l'effaçant.
- **Z du tiroir** : l'attendu devient **fond + ventes espèces − remontées au coffre** (formule déjà prévue par le module 7).
- **Coffre de la soirée** : en fin de soirée, le coffre se compte par coupure ; attendu = **total des remontées** du match ; écart ; motif obligatoire au-delà de la tolérance du lieu. C'est un Z du coffre, définitif, rectifiable comme un Z de tiroir.
- **Espèces de la soirée** : un récapitulatif fige le tout — fonds, ventes espèces, remontées, tiroirs comptés, coffre compté, écart total.
- **Clôture du match** : exige le Z de chaque tiroir (déjà) **et**, s'il y a eu des remontées, le comptage du coffre.

**Réalisé le 2026-09-30** : migration `0009_coffre.sql` (`sortie_especes` et `comptage_coffre` en écriture seule ; la base refuse une remontée après le Z du tiroir ou du coffre, ou sur une caisse sans espèces) ; serveur : remontée et annulation (`/api/sessions-caisse/:id/remontees`, `/api/remontees/:id/annulation`), Z du coffre et sa rectification (`/api/clotures/coffre`, `/api/comptages-coffre/:id/rectification`), Z du tiroir qui déduit les remontées, clôture du match qui exige le Z du coffre s'il y a eu des remontées. Écran Clôtures : remontées sur chaque tiroir (ajout, annulation avec motif), coffre de la soirée compté par coupure, récapitulatif « Espèces de la soirée » ; les 4 chiffres du haut portent désormais sur toute la soirée (tiroirs + coffre). Sauvegarde du 1er de chaque mois gardée sans limite (`infra/vps/deployer.sh`).

**Vérifié** : 6 tests serveur (remontée déduite de l'attendu du tiroir : 100 + 21 − 15 = 106 € ; annulation sans motif refusée puis tracée sans effacement ; coffre refusé tant qu'une caisse est ouverte ; plus de remontée après le Z du tiroir ; match refusé tant que le coffre n'est pas compté ; Z du coffre, second Z refusé, rectification ajoutée ; écriture seule même pour le propriétaire). **Essai dans le navigateur** (lieu d'essai local) : caisse ouverte avec 100 € de fond, remontée de 30 € au coffre → attendu du tiroir 70 € ; Z du tiroir 70 € (1 × 50 €, 1 × 20 €) ; Z du coffre 30 € ; « Espèces de la soirée » : 100 € attendus, 100 € comptés, écart 0 ; match clos.

## 2. Ce qui a été construit — commits

- [`27be12a`](https://github.com/Break-Eat-APP/flaix-expert/commit/27be12a8bbffc011ac34ee44c6857d306160e17e) — 2026-09-30 — Dossier §15.106 : tickets conservés sans limite, remontées d'espèces au coffre et clôture finale des espèces
- [`4aa3109`](https://github.com/Break-Eat-APP/flaix-expert/commit/4aa310972d68abaf25e02e92529e7ea9b81d1c8b) — 2026-09-30 — Remontées d'espèces au coffre et Z du coffre de la soirée, serveur et tests (dossier §15.106)
- [`2ba4293`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ba429373c1a48ce1e30cff7ae626d337b1371f9) — 2026-09-30 — Clôtures : remontées au coffre, Z du coffre, espèces de la soirée ; sauvegarde mensuelle gardée sans limite (dossier §15.106)
- [`69d161f`](https://github.com/Break-Eat-APP/flaix-expert/commit/69d161f77edca030cb2fa585a5b96694706227ef) — 2026-09-30 — Guide du serveur de test : sauvegarde mensuelle gardée sans limite

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0009_coffre.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/db/migrations/0009_coffre.sql)

### Tests

- `apps/api/test/coffre.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/apps/api/test/coffre.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/packages/domain/src/modele.ts)

### Serveur (apps/api)

- `apps/api/src/routes/clotures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/apps/api/src/routes/clotures.ts)
- `apps/api/src/routes/evenements.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/apps/api/src/routes/evenements.ts)

### Écrans (apps/web)

- `apps/web/src/pages/clotures/Clotures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/apps/web/src/styles.css)

### Serveur OVH et outils (infra)

- `infra/vps/deployer.sh` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/infra/vps/deployer.sh)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/docs/flaix-gestion-dossier-projet.md)
- `docs/guide-serveur-test-ovh.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/docs/guide-serveur-test-ovh.md)
- `docs/questions-expert-comptable.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/69d161f77edca030cb2fa585a5b96694706227ef/docs/questions-expert-comptable.md)

## 4. Tests créés dans cette phase

### `apps/api/test/coffre.test.ts`

- **remontées au coffre pendant l'événement**
  - une remontée se déduit de l'attendu du tiroir ; une erreur s'annule avec motif, sans être effacée
  - le coffre ne se compte pas tant qu'une caisse est ouverte
  - Z du tiroir : les remontées sont inscrites avec lui ; plus aucune remontée ensuite
  - l'événement ne se clôt pas tant que le coffre n'est pas compté
  - Z du coffre : attendu = total des remontées ; un second Z est refusé ; la rectification s'ajoute
  - [F] remontées et Z du coffre en écriture seule, même pour le propriétaire

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/coffre.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
