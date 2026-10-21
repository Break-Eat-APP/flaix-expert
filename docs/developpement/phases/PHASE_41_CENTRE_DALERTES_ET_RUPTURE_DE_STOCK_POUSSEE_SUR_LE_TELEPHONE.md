# Phase 41 — Centre d'alertes et rupture de stock poussée sur le téléphone

> FlaiX Expert · dossier de développement · généré le 2026-10-21 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-10-05 |
| Décision | dossier projet §15.140 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.140 Centre d'alertes et rupture de stock en direct sur le téléphone (2026-10-04)

**Demande de Rémi** (en partant se coucher) : *« développer le centre d'alerte avec la rupture de stock en direct sur le téléphone »*. Le centre d'alertes est le **module 18**, validé le 2026-09-12 (§14 module 18, délimitation §15.23) ; la rupture poussée était déjà notée comme reste au §15.112.

**Règles du module 18, reprises sans changement** : un écran unique, qui **lit** ce que les autres modules calculent et ne calcule lui-même que trois comparaisons qui n'appartiennent à aucun module ; chaque alerte chiffre son impact en euros ; ce module ne corrige rien (un lien mène à l'écran où corriger).

**Où** : une page `/alertes` sans nouvelle entrée de menu (les 6 entrées validées au §15.96 ne bougent pas), ouverte depuis une carte « Centre d'alertes · N alertes » en tête de Résultats, comme « En direct » (§15.112).

**Contenu, dans cet ordre** :
1. **En ce moment** (si un événement est ouvert) : ruptures et stocks faibles par stand, lus dans Stock (même règle : rupture à 0, faible à 15 % du départ), avec un lien vers « En direct » pour le réassort.
2. **Lues dans les autres modules** (dernier événement clos qui a des ventes) : produits sous leur cible de marge réalisée (Résultats → Marges) ; pertes de stock valorisées et manques d'espèces (Revenue Engine, §15.138) ; tickets vendus à un autre prix que le tarif (« prix non respecté ») ; prix de l'application de commande qui ne couvre pas la marge du comptoir (Click & Collect, verdict existant).
3. **Calculées ici (module 18)** :
   - **Marge configurée sous la cible** : prix et coût actuels de la fiche, avant toute vente (calcul `margeConfiguree` déjà utilisé dans Produits & prix) ; impact = écart par vente × ventes du dernier événement.
   - **Hausse (ou baisse) d'un prix fournisseur** : chaque livraison comparée à la livraison précédente du même produit (ou ingrédient) chez le même fournisseur ; alerte à **5 %** d'écart ou plus ; impact = écart de prix × quantité livrée. Seule la dernière livraison de chaque produit est jugée.
   - **Écart à la mercuriale** : prix de référence saisi par le lieu, ici et nulle part ailleurs (« mercuriale » du module 18, faute de source de marché fiable) ; comparé au coût actuel (CUMP de Stock, ou prix de l'ingrédient) ; alerte à **10 %** au-dessus ou plus ; impact = écart × ventes du dernier événement pour un produit.
   - Les deux seuils (5 % et 10 %) restent les **valeurs de test du module 18**, à ajuster avec Rémi quand le terrain parlera ; ils sont écrits une seule fois dans le code.
4. Chaque alerte : niveau (forte / normale), phrase, impact en euros quand il existe, lien vers l'écran où agir. Classement : fortes d'abord, puis par impact.

**Rupture en direct, poussée sur le téléphone** :
- Quand le serveur reçoit des tickets d'une tablette, il recalcule le stock des seuls produits vendus dans ces tickets, au stand de la caisse. Si un produit dont le stock est suivi passe **sous 15 % de son départ** (« stock faible ») ou **à zéro** (« rupture »), une notification part vers les téléphones abonnés des directeurs du lieu (Web Push existant, §15.135) : « Rupture : Frites à Buvette Nord — reste 0 sur 120 · vendu 120 », qui ouvre « En direct » pour le réassort en deux gestes.
- **Une seule notification par niveau**, par stand et par produit, **jusqu'au prochain réassort** : après un réassort, le produit peut alerter de nouveau. Chaque envoi est inscrit (table en écriture seule), ce qui empêche les doublons même si deux tablettes envoient en même temps.
- La notification part **après** l'enregistrement des tickets ; si elle échoue, les tickets restent enregistrés (jamais l'inverse).
- Une tablette restée sans réseau n'envoie ses tickets qu'au retour du réseau : l'alerte arrive alors en retard ; c'est dit dans l'écran Notifications.
- Réglage du lieu, dans Paramètres → Notifications : « ruptures » et « stocks faibles », chacun activable ; **les deux actifs par défaut**. Le mode formation n'envoie aucune notification.

**Réalisé le 2026-10-05** (migration 0031, moteur `alertes.ts`, route `routes/alertes.ts`) : page `/alertes` (« En ce moment », « À regarder », mercuriale saisie ligne par ligne) ; carte « Centre d'alertes : N alertes » en tête de Résultats ; Paramètres → Notifications → « Stock en direct, pendant l'événement » ; rupture et stock faible poussés à la réception des tickets (`pousserAlertesStock`, après l'enregistrement), trace `alerte_stock_poussee` en écriture seule ; mercuriale `prix_reference` recopiée dans le mode formation ; saisies journalisées (`mercuriale_modifiee`, `alertes_reglages_modifies`). Les pertes, manques d'espèces et prix non respectés sont lus dans le Revenue Engine (§15.138), sans second calcul. **Tests** : moteur 9, serveur 9 (faible puis rupture une seule fois, une bière ne réveille pas les frites, réassort qui réarme, trace inaltérable, réglage coupé, en direct, hausse fournisseur, mercuriale journalisée, marge configurée, refus), écrans 4.

## 2. Ce qui a été construit — commits

- [`b24b3c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b24b3c607722123e302c890c09795f70f602d59f) — 2026-10-05 — Centre d'alertes et rupture de stock poussée sur le téléphone (module 18, dossier §15.140)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0031_centre_alertes.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/db/migrations/0031_centre_alertes.sql)

### Tests

- `apps/api/test/alertes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/test/alertes.test.ts)
- `packages/domain/src/alertes.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/packages/domain/src/alertes.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/alertes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/packages/domain/src/alertes.ts)
- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/packages/domain/src/index.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/alertes.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/src/routes/alertes.ts)
- `apps/api/src/routes/caisse.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/click-collect.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/src/routes/click-collect.ts)
- `apps/api/src/routes/notifications.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/src/routes/notifications.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/App.tsx)
- `apps/web/src/pages/alertes/CentreAlertes.test.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/alertes/CentreAlertes.test.tsx)
- `apps/web/src/pages/alertes/CentreAlertes.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/alertes/CentreAlertes.tsx)
- `apps/web/src/pages/parametres/Notifications.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/parametres/Notifications.test.tsx)
- `apps/web/src/pages/parametres/Notifications.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/parametres/Notifications.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/Resultats.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/b24b3c607722123e302c890c09795f70f602d59f/apps/web/src/pages/Resultats.tsx)

## 4. Tests créés dans cette phase

### `apps/api/test/alertes.test.ts`

- **rupture de stock poussée sur le téléphone (§15.140)**
  - 7 frites vendues sur 10 : rien ; la 8e (reste 2) : « stock faible », une seule fois
  - les deux dernières : « rupture », une seule fois même si d'autres tickets arrivent
  - un réassort réarme l'alerte : 5 frites remises, toutes vendues d'un coup → une nouvelle rupture (pas de « faible » au passage)
  - [F] la trace des notifications ne se modifie ni ne se supprime
  - réglages du lieu : ruptures coupées → plus rien ne part ; le changement est journalisé
- **centre d'alertes (module 18)**
  - en direct : la rupture des frites ; calculée : la hausse du prix de la bière (+5,6 %, 21 € sur 300)
  - mercuriale : référence des frites à 1,00 € pour un coût de 1,20 € → +20 %, alerte ; la saisie est journalisée
  - marge configurée : une cible de 80 % sur les frites (73,6 % au prix actuel) → alerte calculée
  - [F] mercuriale : un produit d'un autre lieu est introuvable ; un prix nul est refusé

### `packages/domain/src/alertes.test.ts`

- **variation du prix d'un fournisseur (module 18)**
  - exemple du dossier : 1,25 € puis 1,32 € → +5,6 %, au-dessus du seuil de 5 % : alerte hausse, impact sur la quantité livrée
  - hot-dog +2,2 % : sous le seuil, pas d'alerte ; seule la dernière livraison est jugée ; un autre fournisseur ne compte pas comme « précédente »
  - une baisse au-delà du seuil est signalée sans impact négatif présenté comme une perte
- **mercuriale (module 18)**
  - exemples du dossier : bière 1,217 € pour 1,20 € → +1,4 %, pas d'alerte ; saucisses 0,95 € pour 0,80 € → +18,8 %, alerte
  - [F] sans référence ou sans coût : rien n'est jugé (jamais un écart inventé)
- **marge configurée, tri, rupture poussée**
  - frites 68,3 % pour 70 % : −0,07 € par vente, soit 14 € sur 200 ventes
  - les fortes d'abord, puis par impact
  - rupture et stock faible poussés selon les réglages du lieu ; texte de la notification

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/alertes.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/alertes.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
