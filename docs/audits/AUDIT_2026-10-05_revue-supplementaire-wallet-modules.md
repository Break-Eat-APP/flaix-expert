# Audit chirurgicale — Wallets abonnés et modules récents

Date : 2026-10-05  
Périmètre : phases 39 à 48, avec priorité aux cartes Apple Wallet / Google Wallet et aux modifications non commitée présentes dans l’arbre de travail.

## Verdict

Le socle est bien avancé : le typage passe, les tests du domaine passent et les parcours Wallet ont une couverture utile. La correction de la désactivation d’un abonné est présente dans l’arbre courant : Apple reçoit maintenant une carte `voided`, Google reçoit un objet `INACTIVE`, et le service PassKit peut encore servir la carte désactivée afin que le téléphone récupère cette évolution.

Je ne validerais toutefois pas encore la mise en production pour deux raisons :

1. la désactivation de l’option Fidélité ne révoque pas les cartes déjà installées ;
2. la dépendance `node-forge` reste signalée par `pnpm audit` malgré le passage à 1.4.0.

## Findings

### P1 — Désactiver l’option Fidélité ne coupe pas les Wallets déjà installés

**Constat confirmé.**

- `apps/api/src/routes/editeur.ts:259-270` modifie uniquement `option_lieu` via `definir_option_lieu`.
- `db/migrations/0037_carte_abonne_desactive.sql:10-26` autorise désormais PassKit à retrouver une carte inactive, mais ne contrôle pas l’option Fidélité.
- `apps/api/src/routes/wallet.ts:160-169` (`parSerie`) ne vérifie pas `lireOptions(...).fidelite`.
- `packages/domain/src/wallet.ts:384` choisit `ACTIVE` / `INACTIVE` selon `actif`, jamais selon l’option du lieu.
- `parJeton` ferme la page publique lorsque l’option est désactivée, mais ce contrôle ne s’applique pas au service PassKit ni à l’objet déjà présent dans Google Wallet.

**Impact.** Un ancien pass Apple peut continuer à être récupéré avec `200`, et l’objet Google peut rester `ACTIVE`, alors que le contrat fonctionnel dit que l’option désactivée ferme les cartes. Le QR affiché peut aussi continuer à circuler hors ligne ; la caisse refusera bien l’abonné inactif, mais l’expérience Wallet reste incohérente et la révocation n’est pas complète.

**Correction recommandée.** Définir explicitement le comportement de coupure : soit révoquer les pass Apple et passer tous les objets Google en état inactif lors de la désactivation de l’option, soit faire refuser les endpoints PassKit et marquer les objets Google comme invalides. Ajouter un test d’intégration « option Fidélité off après installation Apple + Google ».

### P2 — `node-forge` reste vulnérable dans la version actuellement déclarée

`apps/api/package.json:21` et `pnpm-lock.yaml` déclarent `node-forge` 1.4.0. La commande `pnpm audit --prod --json` exécutée pendant cette revue remonte **7 vulnérabilités high et 1 moderate**, avec une correction indiquée en `>= 1.4.1` pour les avis les plus récents.

**Correction recommandée.** Passer à la version corrigée indiquée par le registre, régénérer le lockfile, puis revalider la signature PKCS#7 Apple et `pnpm audit --prod`.

### P2 — Les erreurs Google et Apple peuvent laisser une carte périmée sans alerte métier

- `apps/api/src/wallet/google.ts` renvoie le code HTTP de Google, mais `apps/api/src/routes/wallet.ts:206-222` ignore ce code ; seuls les rejets JavaScript sont journalisés.
- Une réponse Google `401`, `403`, `429` ou `5xx` peut donc laisser la carte distante ancienne sans retry, sans état d’échec persistant et sans alerte.
- Pour Apple, `apps/api/src/routes/wallet.ts:206-216` traite uniquement `410` ; les autres erreurs APNs sont ignorées après le retour de la tâche de fond.

**Correction recommandée.** Considérer `2xx` comme succès, `404` comme « pass pas encore créé », et les autres réponses comme des erreurs à journaliser/retenter. Une table ou une file d’outbox par lieu et par abonné éviterait de perdre les mises à jour.

### P2 — Un directeur peut créer un lien Wallet pour un abonné désactivé, puis recevoir un lien inutilisable

`apps/api/src/routes/wallet.ts:393-395` crée le `carte_jeton` sans exiger `a.actif`. Or `carte_par_jeton` dans `db/migrations/0035_wallet.sql:35-41` exige `a.actif`.

**Résultat.** Le POST directeur peut répondre correctement avec une URL `/carte/...`, mais cette URL renvoie immédiatement `404` pour le même abonné désactivé. Ce comportement peut être voulu pour une pré-provision, mais il n’est ni documenté ni testé.

**Correction recommandée.** Refuser la création/envoi avec un `409` explicite lorsque l’abonné est désactivé, ou assumer la pré-provision et tester le parcours « réactivation puis ouverture du lien ».

### P2 — Les e-mails Brevo sont envoyés à l’intérieur d’une transaction SQL

`apps/api/src/routes/emails.ts:90-102` appelle Brevo avec un timeout de 15 secondes avant d’insérer la trace. `envoyerRapportParEmail` et `envoyerRectificationParEmail` appellent cette fonction dans `base.transaction` (`:110-128`).

**Risques.** Une indisponibilité Brevo immobilise une connexion et une transaction pendant 15 secondes. Deux clôtures/reprises concurrentes peuvent aussi envoyer deux e-mails avant que l’index unique `email_envoye_rapport_unique` (`db/migrations/0034_emails.sql:24`) ne fasse échouer l’un des inserts : la contrainte protège la trace, pas l’envoi externe déjà effectué.

**Correction recommandée.** Enregistrer d’abord une intention idempotente/outbox, valider la transaction, puis envoyer en tâche de fond avec retry et statut final.

### P2 — La suite de tests n’est pas verte dans l’état audité

Résultats observés :

- `pnpm typecheck` : OK pour domain, API et web.
- Tests domain : **32 fichiers, 240 tests OK**.
- Tests ciblés Wallet + fichiers : **20 tests OK** lorsqu’ils sont lancés seuls.
- Suite API complète : **35 fichiers OK, 2 fichiers en échec, 10 tests en échec sur 345** ; les échecs concernent notamment les tests Wallet et Alertes lorsque les tâches de fond et les doubles globaux sont combinés.
- `pnpm test` à la racine : exécution interrompue par des erreurs de mémoire Node/Vitest en parallèle API/web.

La correction `enArrierePlan` (`apps/api/src/arriere-plan.ts`) est pertinente pour ne pas ralentir la caisse, mais elle rend obligatoire une stratégie d’attente et d’isolation de test fiable. Le commentaire de `apps/api/vitest.config.ts` annonce une exécution séquentielle ; le comportement observé doit être vérifié dans le CI réel.

## Points positifs vérifiés

- La réponse de la caisse n’attend plus Apple, Google ni les notifications de stock (`apps/api/src/routes/caisse.ts:751-760`).
- La mise à jour des cartes est découpée en lots de 100 (`apps/api/src/routes/wallet.ts:178-222`) et les soldes sont lus en lot (`apps/api/src/routes/fidelite-caisse.ts:68-91`).
- La limitation PassKit a été ajoutée : 120 requêtes/minute sur les endpoints Wallet et 10/minute sur le journal Apple (`apps/api/src/routes/wallet.ts:488-532`).
- Le payload Apple désactivé utilise `voided` et le payload Google `INACTIVE` (`packages/domain/src/wallet.ts:319-330`, `:384`). Ces champs correspondent aux mécanismes officiels : [Apple Pass — `voided`](https://developer.apple.com/documentation/walletpasses/pass), [Apple Wallet updates](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html), [Google LoyaltyObject](https://developers.google.com/wallet/reference/rest/v1/loyaltyobject?hl=en) et [Google State](https://developers.google.com/wallet/reference/rest/v1/State).

## Tests à ajouter avant validation finale

1. Désactiver l’option Fidélité après installation réelle d’un pass Apple et d’un objet Google.
2. Désactiver puis réactiver un abonné sur un vrai iPhone et un vrai Android ; vérifier si le pass Apple `voided` peut réellement redevenir actif ou s’il faut réémettre un nouveau pass.
3. Simuler Google `401`, `429`, `500` et APNs `500` ; vérifier retry, journal et absence de perte silencieuse.
4. Lancer deux clôtures/envois e-mail concurrents et vérifier qu’un seul e-mail est reçu.
5. Lancer le CI dans le même mode que la production avec Docker, puis corriger les tests qui dépendent de mocks globaux ou de tâches asynchrones résiduelles.

## Conclusion opérationnelle

Le développement des modules récents est cohérent et la correction de désactivation d’un abonné est bien engagée. Pour fermer l’audit, je traiterais dans cet ordre :

1. révocation complète quand l’option Fidélité est désactivée ;
2. `node-forge` vers une version corrigée et nouvel audit des dépendances ;
3. statut/retry persistant des mises à jour Apple/Google ;
4. outbox e-mail et tests de concurrence ;
5. stabilisation du CI et validation sur appareils physiques.
