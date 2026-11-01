# Audit chirurgical du système — phases 67 à 76

> Audit indépendant réalisé le 2026-10-26 sur le dépôt `flaix-expert`, commit `050b9bc`.
> Périmètre : phases 67 à 76, avec contrôle transversal des invariants de sécurité, du mode formation,
> des factures, des caisses externes, des sorties de stock, des résultats et des wallets Apple / Google.
>
> Aucun code applicatif n'a été modifié pendant cet audit. Le seul ajout est ce rapport.

## 1. Verdict

Le système est cohérent sur les parcours fonctionnels nouvellement développés et les corrections documentées sont bien
présentes. Les tests ciblés passent, y compris l'entrée en réserve, l'annulation d'un import, les événements privés,
le mode formation et les cartes Apple / Google.

Deux points doivent toutefois être corrigés avant une mise en production réelle :

1. **P1 — isolation des lieux incomplète dans le rapprochement d'une facture** : `livraison_id` peut référencer un
   mouvement de stock d'un autre lieu, ou un mouvement qui n'est pas une livraison.
2. **P1 — dépendance de production vulnérable** : `zod@4.6.5` est signalé en gravité haute par `pnpm audit --prod`.

Deux durcissements importants sont également à traiter avant l'exploitation réelle : la signature de l'annulation d'un
import et la concurrence du relanceur wallet.

## 2. Périmètre vérifié

| Phase | Sujet contrôlé | Résultat |
|---|---|---|
| 67–68 | En direct, Résultats, rafraîchissement et données de soirée | Cohérent ; charge à mesurer en exploitation |
| 69 | Imports de caisses externes et annulation d'import | Suppression limitée au lieu et à l'import ; signature à durcir |
| 70–72 | Sorties de stock, événements privés, résultats, Click & Collect | Règles de cycle respectées ; borne d'agrégation à mieux traiter |
| 73–75 | Factures, rapprochement, entrée en réserve, correspondances, export | Défaut P1 de clé étrangère et de validation d'un mouvement |
| 76 | Corrections de l'audit précédent et mode formation | Corrections présentes et testées |
| 35–38, transversal | Apple Wallet, Google Wallet, révocation et relances | Parcours applicatif couvert ; intégration réelle à valider |

## 3. Défauts à corriger

### P1-1 — Une ligne de facture peut pointer vers le stock d'un autre lieu

**Fichiers :**

- `apps/api/src/routes/factures.ts:322-334`
- `db/migrations/0017_factures_fournisseurs.sql:50-56`

La route accepte n'importe quel UUID dans `livraisonId`. Elle vérifie seulement que ce mouvement n'est pas déjà
affecté à une autre ligne de facture du lieu courant. Elle ne vérifie pas :

- que le mouvement appartient au lieu courant ;
- qu'il est de type `livraison` ;
- que son `produit_id` correspond au `produit_id` de la ligne.

La base renforce le problème : `ligne_facture_fournisseur.livraison_id` possède une clé étrangère vers
`stock_mouvement(id)` uniquement. Elle ne porte donc pas l'isolement composé `(lieu_id, id)`.

**Scénario :** un directeur obtient l'UUID d'un mouvement d'un autre lieu, puis appelle
`PUT /api/factures/:id/lignes/:ligneId/livraison`. La ligne de facture du lieu courant est alors liée à un mouvement
extérieur. La réponse ne montre pas nécessairement ce mouvement, car les lectures de livraisons sont filtrées par lieu,
mais la donnée incohérente est enregistrée et l'invariant d'isolement de la base est contourné.

**Correction recommandée :**

1. Ajouter une contrainte d'unicité `(lieu_id, id)` sur `stock_mouvement` si nécessaire.
2. Remplacer la référence par une clé étrangère composée `(lieu_id, livraison_id)`.
3. Dans la route, charger le mouvement avec `lieu_id = auth.lieuId`, `type = 'livraison'` et vérifier le produit de la
   ligne avant l'UPDATE.
4. Auditer les éventuelles lignes déjà enregistrées avant de poser la contrainte en `NOT VALID`, puis les nettoyer par
   une migration dédiée.

### P1-2 — Dépendances de production signalées par l'audit de sécurité

Commande exécutée :

```text
pnpm audit --prod
```

Résultat : `1 high`, `5 moderate`, `5 low`.

Le point bloquant principal est :

| Paquet | Version actuelle | Gravité | Version corrigée indiquée |
|---|---:|---:|---:|
| `zod` | 4.6.5 | Haute — épuisement mémoire lors de validations de collections contraintes | >= 4.6.6 |

Le paquet est utilisé directement sur les entrées HTTP de l'API. Même si les routes posent des limites métier, cette
alerte doit être traitée avant production.

Autres paquets signalés à mettre à jour dans le même cycle : `ip-address` via `@fastify/rate-limit`, `fast-uri` via
Fastify, et Fastify lui-même. Les versions corrigées sont indiquées par la sortie de `pnpm audit` ; le lockfile doit être
mis à jour et les tests relancés ensuite.

## 4. Durcissements recommandés

### P2-1 — L'auteur de l'annulation d'import est fourni par l'appelant SQL

**Fichiers :**

- `db/migrations/0054_annulation_import_ventes_externes.sql:46-72`
- `apps/api/src/routes/caisses-externes.ts:383`

La fonction `SECURITY DEFINER annuler_import_ventes_externes(p_import, p_par)` isole correctement le lieu et l'import,
mais fait confiance à `p_par` pour remplir la trace `import_ventes_externes_annule.par`. La route passe bien
`auth.utilisateurId`, mais la base autorise le rôle applicatif à appeler la fonction avec l'UUID arbitraire d'un autre
utilisateur.

**Impact :** l'annulation de données reste limitée au lieu courant, mais l'identité inscrite dans l'audit technique peut
être falsifiée. Cela affaiblit la valeur probante de la trace.

**Correction recommandée :** supprimer `p_par` de la fonction et utiliser `utilisateur_courant()` dans la fonction, ou
refuser explicitement tout `p_par` différent de `utilisateur_courant()`.

### P2-2 — Le relanceur wallet n'a pas de réservation atomique des tâches

**Fichier :** `apps/api/src/routes/wallet.ts:264-285`

`relancerCartes` lit les relances dues avec `relances_wallet_dues`, puis les traite. La lecture ne réserve pas les lignes
et la suppression ne se fait qu'au seuil d'abandon. Deux processus API, ou deux exécutions qui se chevauchent, peuvent
donc envoyer deux notifications Apple ou deux `PUT` Google pour la même cible.

**Impact :** appels externes dupliqués, bruit dans APNs / Google Wallet et consommation inutile du quota. Ce n'est pas une
corruption de solde, mais le comportement n'est pas idempotent côté fournisseur.

**Correction recommandée :** introduire une prise de tâche atomique (`FOR UPDATE SKIP LOCKED`, ou état
`prise_le`/`prise_par` avec expiration), puis libérer ou replanifier la cible dans la même logique. Ajouter un test avec
deux workers concurrents.

### P2-3 — Aucun test d'intégration avec les services Apple et Google réels

Les tests vérifient correctement les briques locales : signature CMS Apple, archive `.pkpass`, jeton Google signé,
service web PassKit, carte désactivée, option Fidélité retirée, réponse APNs `410`, relances et mise à jour par lots.

Ils ne vérifient pas avec les comptes réels :

- acceptation du `.pkpass` par un appareil Apple réel ;
- notification APNs avec le certificat de production ;
- création effective de la classe et de l'objet Google Wallet ;
- comportement Google après remplacement de la classe et après passage d'un objet à `INACTIVE`.

**Action recommandée avant production :** faire une campagne de recette avec certificats et identifiants de test réels,
en conservant les réponses HTTP et un appareil Apple / Google de test. Cette validation est externe au dépôt et ne peut
pas être déduite des seuls tests unitaires.

## 5. Points de qualité et de robustesse

### P3-1 — Sortie de stock d'un événement privé : somme susceptible de dépasser la borne SQL

**Fichiers :**

- `apps/api/src/routes/evenements-prives.ts:147-169`
- `db/migrations/0008_stock.sql:21`
- `db/migrations/0049_evenements_prives.sql:66`

Chaque ligne privée peut aller jusqu'à 100 000 unités et plusieurs lignes du même produit sont regroupées par
`sum(l.quantite)::int`. Le mouvement final est limité à 100 000 unités. Un événement valide dans l'écran peut donc
échouer à la clôture sur une contrainte PostgreSQL si la somme dépasse cette borne.

**Action recommandée :** vérifier la somme avant de passer l'événement à `cloture`, produire un message métier lisible,
ou faire évoluer la borne si le cas est réellement autorisé. Ajouter un test de somme dépassant 100 000.

### P3-2 — Compteur de ventes d'une caisse externe : sémantique différente après annulation

**Fichiers :** `apps/api/src/routes/caisses-externes.ts:72-75` et `:112-116`

La liste des caisses compte toutes les lignes `vente_externe`, y compris celles marquées `annulee`, tandis que la liste
des imports et les synthèses financières excluent les ventes annulées. Après une annulation transmise par la caisse, la
carte de synthèse peut donc afficher un nombre différent de celui des imports.

Ce n'est pas une fuite ni une erreur de montant dans les synthèses contrôlées, mais le libellé devrait préciser « ventes
importées, annulations comprises » ou le compteur devrait utiliser la même définition que les autres écrans.

### P3-3 — Export comptable toujours construit intégralement en mémoire

La limite de 150 Mo sur les pièces jointes corrige le risque principal identifié par la revue précédente, mais le ZIP
final, les PDF générés et les `Uint8Array` sont simultanément en mémoire. Une période contenant beaucoup de PDF générés
peut dépasser largement 150 Mo de mémoire résidente.

À surveiller avec des données réelles ; passer à une génération en flux si les exports deviennent volumineux.

## 6. Ce qui est validé

### Annulation des imports externes

- clé primaire externe `(lieu_id, caisse_externe_id, id_externe)` empêchant les doublons ;
- fonction d'annulation limitée à `lieu_courant()` et à `p_import` ;
- articles supprimables uniquement pendant la fenêtre de l'import ciblé ;
- import annulé conservé et opération journalisée ;
- mode formation refusé pour les opérations réelles.

Le défaut résiduel concerne la signature de l'auteur, pas le périmètre de suppression.

### Sorties de stock et événements privés

- le mouvement `evenement_prive` exige un événement du même lieu ;
- la base exige l'état `cloture` ;
- la clôture et la sortie de stock sont dans la même transaction ;
- les recettes avec ingrédients suivis sortent les ingrédients, pas le produit deux fois ;
- les index uniques empêchent une seconde sortie pour le même événement et le même article.

### Factures fournisseurs

- facture validée figée par route et par déclencheur ;
- quantité × colis contrôlée avant entrée en réserve ;
- produits fabriqués exclus de l'entrée directe en réserve ;
- alertes et motif de validation cohérents avec l'écran ;
- export CSV protégé contre l'injection de formule ;
- pièces jointes limitées et contrôlées par signature de fichier ;
- correspondances et configuration recopiées en mode formation.

La référence de livraison est le seul défaut d'intégrité identifié dans ce module.

### Wallet Apple / Google

- Apple : manifeste SHA-1, signature CMS détachée, certificat Pass Type ID / WWDR, service web PassKit,
  désactivation `voided`, gestion APNs `410` ;
- Google : JWT RS256 « Save to Wallet », classe par lieu, objet par abonné, état `INACTIVE`, images versionnées,
  renouvellement des mises à jour ;
- Fidélité désactivée : la page publique est fermée et les cartes sont rendues inactives / barrées ;
- échecs transitoires : relances persistées avec abandon après 12 essais.

Réserve : l'acceptation réelle par Apple / Google doit encore être testée avec les comptes et certificats de production.

## 7. Tests exécutés

| Suite | Résultat |
|---|---|
| `pnpm typecheck` — domain, API, web | Vert |
| Domaine | 42 fichiers, 285 tests passés |
| API ciblée — factures, réserve, export, caisses externes, événements privés, sortie de stock, formation, résultats | 44 tests passés |
| API ciblée — wallet et fichiers wallet | 26 tests passés |
| Web ciblé — factures, En direct, Résultats | 5 fichiers, 15 tests passés |
| `pnpm audit --prod` | Échec attendu : 1 haute, 5 modérées, 5 faibles |

Le PostgreSQL de développement a été démarré via Docker Compose sur le port 5433, sans réinitialisation du volume.

## 8. Plan de correction priorisé

1. Mettre à jour `zod` et les dépendances signalées, régénérer le lockfile, relancer CI.
2. Corriger la relation `ligne_facture_fournisseur → stock_mouvement` par clé composée et ajouter la vérification du
   type / produit dans la route.
3. Faire dériver l'auteur de l'annulation de `utilisateur_courant()`.
4. Rendre la prise des relances wallet atomique entre plusieurs instances.
5. Ajouter les tests de bornes et de concurrence, puis effectuer la recette Apple / Google réelle.

## 9. Suivi des corrections

Ajouté par Claude après le rapport (le texte de l'audit ci-dessus n'est pas modifié).

| Point | État | Commit |
|---|---|---|
| P1-1 livraison d'une facture | Corrigé le 2026-11-01 : route, migration 0059, `facture-livraison-lieu.test.ts` | `dca4c8f` |
| P1-2 dépendances | Corrigé le 2026-11-01 : `pnpm audit --prod` sans alerte | `dca4c8f` |
| P2-1, P2-2, P2-3, P3-1, P3-2, P3-3 | Ouverts : `docs/points-a-revoir.md`, points 10 et 20 | — |

