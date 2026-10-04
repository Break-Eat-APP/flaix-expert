# Phase 20 — Factures fournisseurs

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-01 |
| Décision | dossier projet §15.115 |
| État | livrée, tests au vert au moment du commit |
| Commits | 2 |

## 1. Ce qui a été décidé, et pourquoi

### 15.115 Factures fournisseurs ; Wallet & campagnes mis de côté (2026-10-01)

**Demande** : 7ᵉ et 8ᵉ modules de l'ordre fixé par Rémi (§15.109) : « wallet », puis « facturation ».

**Wallet & campagnes — pas construit, et pourquoi** : la carte Wallet de l'abonné a été **reportée par Rémi lui-même** (§14, module 20 : *« on reviendra sur le Wallet »*) et suppose des comptes éditeur Apple et Google ; les **campagnes** ont besoin d'un canal d'envoi qui n'existe pas encore (un service d'envoi d'e-mails avec une adresse d'expéditeur sur un domaine Break Eat, ou les notifications de l'application Break Eat, non raccordée) ; et un message commercial impose un lien de désinscription — sujet RGPD que Rémi veut voir ensemble. **Décisions attendues** : service d'envoi d'e-mails et domaine d'expéditeur ; raccordement à l'app Break Eat. Le même service d'e-mails servira au rapport de soirée et à la notification des rectifications de Z.

**Facturation — ce qui est construit : le module 12b validé (factures fournisseurs)**. Le module 12a (ce que le lieu doit à Break Eat : abonnement et commission C&C) dépend des ventes de l'app Break Eat et des contrats côté Break Eat : il ira avec le back-office. L'extension « Factures » proposée le 29/09 (§15.95 : fiches fournisseurs, échéancier, relances, virements groupés) **n'a pas été validée** : non construite.

**Construit** (nouvelle entrée de menu « Factures » ; migration `0017`) :
- **Saisie** de la facture reçue (par la plateforme agréée du lieu, ou sur papier) : fournisseur (proposé d'après les livraisons connues), n°, date, échéance, lignes (produit ou frais sans produit, quantité, prix unitaire HT) ; **pièce jointe** PDF, JPEG ou PNG (10 Mo, contenu vérifié, gardée dans la base donc dans les sauvegardes) ; une même facture (fournisseur + n°) ne s'enregistre qu'une fois.
- **Rapprochement automatique** avec les livraisons **déjà saisies** dans le Stock : même produit, même fournisseur (casse et accents ignorés), livrée entre 45 jours avant et 7 jours après la facture ; même quantité d'abord, puis la date la plus proche ; une livraison ne sert qu'une fois ; le directeur peut choisir une autre livraison.
- **Écarts** (règles du dossier, défaut corrigé compris) : quantité = facturé − livré ; prix = (prix facturé − prix livré) × quantité livrée, **en euros** ; tolérance **max(0,50 €, 1 % du montant livré)** — **validée par Rémi le 2026-10-01** (§15.117). Signalés, **jamais corrigés**.
- **Statuts** : reçue (à rapprocher) → rapprochée / en écart → **validée** (motif obligatoire s'il reste un écart ou une ligne sans livraison ; le rapprochement est figé avec la validation) → **payée** (date de paiement, après validation). **Une facture validée est figée par la base** (en-tête, lignes, pièce jointe) ; rien ne se supprime. Chaque étape est inscrite au journal technique. Échéance dépassée d'une facture validée non payée : signalée en tête d'écran.
- **Conformité** : le test « les mouvements de stock ne se vident pas, même par le propriétaire de la base » a été ajusté — les lignes de facture référencent les livraisons, PostgreSQL refuse donc le vidage avant même la protection ; le vidage « en cascade » est vérifié refusé par la protection elle-même.

**Pas construit (hors périmètre validé)** : capture par une adresse e-mail dédiée au lieu (suppose de recevoir des e-mails) ; partage en lecture seule avec l'expert-comptable (ira avec l'accès vérificateur, sujet Conformité) ; mise à jour du coût d'achat depuis la facture (le dossier 12b dit : écarts jamais corrigés automatiquement).

**Vérifié** : 10 tests du rapprochement (les trois cas chiffrés du dossier : Brasserie du Sud rapprochée, Boucherie 20 € d'écart au-dessus du seuil de 4,75 €, Frigo Nord −4 en quantité ; seuil sur l'impact en euros ; unicité d'usage d'une livraison ; choix du directeur ; statut ; total) ; 8 tests contre la base (saisie, doublon refusé, frais ignorés, nouveau fournisseur « reçue », livraison déjà prise non reproposée, motif obligatoire, facture figée jusque dans la base, rapprochement figé à la validation, paiement après validation et une seule fois, pièce jointe vérifiée et relue). Suites complètes : 124 (moteur), 180 (serveur). Écran vérifié dans le navigateur (facture à 1,20 € contre une livraison à 1,10 € : « +2,40 € sur le prix », validée avec motif).

## 2. Ce qui a été construit — commits

- [`be6307c`](https://github.com/Break-Eat-APP/flaix-expert/commit/be6307ce4039ab4cae3dc394f699410264d9c832) — 2026-10-01 — Factures fournisseurs, serveur : saisie, rapprochement avec les livraisons du Stock, écarts, validation motivée, paiement, pièce jointe, facture figée (migration 0017)
- [`e847e75`](https://github.com/Break-Eat-APP/flaix-expert/commit/e847e752747b612abb5b16d8de499b4d3e2ab82c) — 2026-10-01 — Factures fournisseurs : écran (saisie, rapprochement, validation, paiement, pièce jointe), menu ; test de conformité ajusté ; dossier §15.115

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0017_factures_fournisseurs.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/db/migrations/0017_factures_fournisseurs.sql)

### Tests

- `apps/api/test/conformite-base.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/api/test/conformite-base.test.ts)
- `apps/api/test/factures.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/api/test/factures.test.ts)
- `packages/domain/src/factures.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/packages/domain/src/factures.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/packages/domain/src/factures.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/api/src/routes/factures.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/factures/Factures.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/web/src/pages/factures/Factures.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/apps/web/src/styles.css)

### Documentation

- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/docs/avancement.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/e847e752747b612abb5b16d8de499b4d3e2ab82c/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/factures.test.ts`

- **saisie et rapprochement**
  - Brasserie du Sud : identique à la livraison → rapprochée ; un n° déjà saisi est refusé
  - Boucherie : 0,99 € contre 0,95 € sur 500 → 20 € d'écart, en écart ; frais de livraison sans produit ignorés
  - nouveau fournisseur sans livraison : reçue, à rapprocher
  - une livraison déjà rapprochée d'une facture n'est pas proposée à une autre
- **validation et paiement**
  - [F] une facture en écart ne se valide pas sans motif ; avec motif, elle est validée et figée
  - le rapprochement automatique est figé à la validation
  - payée seulement après validation, une seule fois ; tout est journalisé
- **pièce jointe**
  - un PDF se dépose et se relit ; un contenu qui ne correspond pas au type est refusé

### `packages/domain/src/factures.test.ts`

- **écarts : les trois cas vérifiés du dossier (module 12b)**
  - Brasserie du Sud : 240 bières à 1,25 € comme livrées → rapprochée, écart nul
  - Boucherie : 500 saucisses à 0,99 € contre 0,95 € → 20 € d'impact, au-dessus du seuil de 4,75 € → en écart
  - le seuil porte sur l'impact en euros, pas sur l'écart unitaire (défaut corrigé au dossier)
  - Frigo Nord : 76 kg facturés contre 80 livrés → en écart, même à prix identique
- **rapprochement automatique**
  - même produit et même fournisseur (casse et accents ignorés), dans la fenêtre de dates ; même quantité d'abord
  - une livraison ne sert qu'une fois ; une ligne sans livraison possible reste non rapprochée
  - le choix du directeur l'emporte et réserve la livraison
  - une livraison déjà rattachée à une autre facture n'est pas reprise
- **statut et total**
  - rapprochée seulement si chaque ligne produit l'est ; un écart l'emporte ; frais divers ignorés
  - total HT = Σ quantité × prix unitaire

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/factures.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/factures.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
