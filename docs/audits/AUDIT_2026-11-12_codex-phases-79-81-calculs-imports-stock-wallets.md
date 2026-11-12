# Audit chirurgicale — phases 79 à 81

> Audit réalisée le 2026-11-12 sur le commit `76b440c` du dépôt `flaix-expert`.
> Périmètre principal : calculs de factures, lecture PDF/Excel/CSV, entrée en réserve, ingrédients/recettes, catalogue copié entre lieux et wallets Apple/Google.
> Aucun code applicatif n'a été modifié pendant cette audit ; seul ce rapport a été ajouté.

## 1. Verdict exécutif

Le système est globalement cohérent et les corrections de l'audit précédent sont présentes : la contrainte de lieu sur les livraisons de facture, l'auteur de l'annulation d'import et la prise concurrente des relances wallet sont bien renforcés. Les tests et le typecheck passent.

Le verdict n'est toutefois pas « tout est automatique et exact au centime ».

Les points les plus importants sont :

1. **P2 — l'import Excel/CSV d'une facture ne lit pas le total HT ni les métadonnées d'en-tête** : il ne remplit que les lignes. Le total doit être saisi séparément ; aucun contrôle automatique du total importé n'est donc possible pour Excel/CSV.
2. **P2 — l'import Excel/CSV réutilise la sélection de feuille des exports de caisse** : dans un classeur multi-feuilles, la feuille de facture peut ne pas être choisie, ou une feuille de synthèse peut l'être à sa place.
3. **P2 — arrondis lors du passage colis → unités** : le prix unitaire est arrondi au centime, sans ligne de reliquat dans le mouvement de réserve. La valeur du stock peut donc différer de 1 ou plusieurs centimes du montant de la facture.
4. **P2 — bornes insuffisantes pour les lignes de facture liées à un ingrédient** : `quantité × quantité d'ingrédient` et `quantité × prix` ne sont pas contrôlés avant l'appel d'écriture en réserve. Une saisie extrême échoue sur une contrainte PostgreSQL ou peut dépasser les bornes financières prévues.
5. **P2 — le cas AVOIR / ligne article négative n'est pas correctement modélisé par le lecteur PDF CDB** : une ligne article négative est transformée en zéro, alors que le document est explicitement reconnu comme `FACTURE/AVOIR`.
6. **P2 — wallets : la recette Apple/Google réelle reste non prouvée**. Les briques locales sont testées, mais pas l'acceptation d'un `.pkpass` sur appareil Apple, APNs avec certificat réel, création/mise à jour réelle de Google Wallet.

Il n'y a pas de nouveau P1 démontré dans le code inspecté.

## 2. Réponse directe aux questions métier

### Les règles de calcul sont-elles bonnes ?

**Oui dans leur intention et dans les cas courants, mais pas parfaitement exactes pour tous les conditionnements.**

| Cas | Calcul actuel | Conclusion |
|---|---|---|
| Total de facture | `quantité facturée × prix unitaire facturé` | Correct : le colis ne doit pas multiplier le total de facture. |
| Produit en colis | `quantité × unités par colis` ; prix `prix colis ÷ colis`, arrondi au centime | Correct pour la quantité ; écart de valeur possible à cause de l'arrondi du prix unitaire. |
| Ingrédient suivi | `quantité facturée × millièmes par unité facturée` ; entrée de livraison ; CUMP recalculé | Correct dans les limites normales ; bornes extrêmes non contrôlées. |
| Ingrédient non suivi | prix de l'ingrédient remplacé par le prix de la facture ; coûts des recettes recalculés | Correct, mais aucune quantité de réserve n'est créée, ce qui est conforme à « non suivi ». |
| Consommation d'un match | ventes × recette ; consommation figée à la clôture | Cohérent et conforme à l'objectif de ne pas réécrire l'historique après modification d'une recette. |

Exemple de perte d'exactitude : un colis facturé 10,00 € contenant 3 unités devient 3 unités à 3,33 €. La facture vaut 1 000 centimes, mais la livraison de réserve vaut 999 centimes. Le rapprochement peut apparaître conforme alors que le stock a perdu 1 centime.

### Est-ce que tout se décompte automatiquement ?

**Non. Le fonctionnement actuel est automatique seulement après validation explicite de la facture.**

Le parcours réel est :

1. Le dépôt ou l'import PDF/Excel/CSV remplit la saisie ; il ne crée pas de mouvement de stock.
2. L'enregistrement crée une facture reçue ; il ne fait pas entrer la marchandise en réserve.
3. Lors de la validation, l'écran coche par défaut l'option d'entrée en réserve lorsqu'il existe des lignes concernées.
4. L'API ne crée les mouvements que si `entrerEnReserve: true` est envoyé.
5. Une validation API sans ce booléen, ou une case décochée, valide la facture sans créer la livraison correspondante ; pour un ingrédient non suivi, elle ne met pas non plus à jour son prix.

Cette distinction est saine pour éviter une double entrée lorsqu'une livraison a déjà été saisie, mais elle doit être assumée comme règle métier. Si « déposer une facture = compter automatiquement la réserve » est l'exigence, le comportement actuel ne la respecte pas.

Ne sont pas entrés automatiquement :

- une ligne sans produit ni ingrédient confirmé ;
- une simple proposition de correspondance non acceptée ;
- un produit qui possède une recette (`produitFabrique`) : il faut relier la facture à ses ingrédients ;
- une ligne déjà rapprochée d'une livraison existante ;
- une facture enregistrée mais non validée.

## 3. Contrôles exécutés

| Contrôle | Résultat |
|---|---:|
| `pnpm typecheck` | OK — domaine, API et web |
| Tests domaine | OK — 43 fichiers, 292 tests |
| Tests API ciblés factures/ingrédients/wallets/éditeur/recettes | OK — 8 fichiers, 72 tests |
| Tests web ciblés import fichiers + écran factures | OK — 2 fichiers, 6 tests |
| `pnpm audit --prod --json` | OK — 0 vulnérabilité signalée |
| Migrations | OK — base de développement annoncée à jour, migration 0062 comprise |
| Tests externes Apple/APNs/Google réels | Non vérifiés |

Les tests PDF utilisent des jeux de texte positionnés fabriqués pour les deux mises en page ; ils ne constituent pas à eux seuls une recette sur plusieurs PDF binaires réels.

## 4. Défauts à corriger

### P2-1 — L'import Excel/CSV de facture ne contrôle pas automatiquement le total HT

**Fichiers concernés :**

- `C:\Users\notta\dev\flaix-expert\packages\domain\src\factures-import.ts:39-57,65-145`
- `C:\Users\notta\dev\flaix-expert\apps\web\src\pages\factures\Factures.tsx:519,596-605`

`LectureFacture` ne retourne que les en-têtes, colonnes, lignes et erreurs. La fonction `lireFactureExport` ignore les lignes `Total HT` et ne retourne pas le total annoncé. L'écran ne renseigne `totalAnnonce` automatiquement que dans le chemin PDF ; le chemin Excel/CSV appelle seulement `remplir(lu.lignes, ...)`.

Conséquence : un fichier Excel contenant une ligne manquante, dupliquée ou un montant mal lu peut être enregistré sans contrôle automatique du total du fichier, sauf si le directeur recopie manuellement le total HT dans le formulaire.

**Correction recommandée :** extraire explicitement le total annoncé lorsque sa ligne est identifiable, le retourner avec la lecture, le préremplir dans le formulaire et maintenir le blocage/alerte si la somme des lignes diffère.

### P2-2 — La sélection de feuille Excel n'est pas adaptée aux factures

**Fichiers concernés :**

- `C:\Users\notta\dev\flaix-expert\apps\web\src\pages\caisses-connectees\fichiers.ts:85-96,112-132`
- `C:\Users\notta\dev\flaix-expert\apps\web\src\pages\factures\Factures.tsx:600-605`

`lireFichierVentes` choisit automatiquement la feuille avec `devinerColonnes` et `champsManquants`, qui sont les règles des ventes : numéro de ticket, date, produit, quantité et montant. Une facture fournisseur n'a normalement ni numéro de ticket ni date par ligne. Dans un classeur multi-feuilles, le système peut donc :

- retenir une feuille de ventes/synthèse qui satisfait les règles caisse ;
- retomber sur la première feuille non vide, qui peut être une page de garde ou une feuille de paramètres ;
- ne pas lire la feuille de facture sans offrir de choix à l'écran Factures.

Le sélecteur de feuille existe dans l'écran Caisses connectées, mais pas dans l'écran Factures.

**Correction recommandée :** créer un lecteur de classeur dédié aux factures, avec un score basé sur `désignation + quantité + prix/montant`, et proposer la liste des feuilles lorsque plusieurs candidates existent. Ajouter un test de classeur multi-feuilles de facture.

### P2-3 — L'arrondi colis → unités peut désaligner la réserve de la facture

**Fichiers concernés :**

- `C:\Users\notta\dev\flaix-expert\packages\domain\src\factures-import.ts:164-171`
- `C:\Users\notta\dev\flaix-expert\apps\api\src\routes\factures.ts:276-276,593-612`

`enUnites` convertit la quantité exactement mais calcule `Math.round(prixUnitaire / colis)`. Le total de facture est conservé avec le prix du colis, tandis que le mouvement de réserve est écrit avec le prix unitaire arrondi. Aucun reliquat n'est associé à la ligne de stock.

Le PDF dispose d'une ligne d'arrondi synthétique au niveau de la facture, mais cela ne résout pas nécessairement le second arrondi créé par la division du prix du colis en unités.

**Correction recommandée :** conserver le montant de ligne comme référence financière, puis choisir une stratégie explicite : coût unitaire avec reliquat conservé dans un mouvement dédié, ou dernier prix unitaire ajusté de façon déterministe pour que `quantité × prix` retombe exactement sur le montant de la ligne. Ajouter des tests avec 10,00 € / 3 et avec un colis dont le prix comporte déjà des millièmes.

### P2-4 — Les lignes d'ingrédients ne sont pas bornées avant écriture en réserve

**Fichiers concernés :**

- `C:\Users\notta\dev\flaix-expert\apps\api\src\routes\factures.ts:43-64,613-621`
- `C:\Users\notta\dev\flaix-expert\apps\api\src\routes\stock-ingredients.ts:36-52,325-342`
- `C:\Users\notta\dev\flaix-expert\db\migrations\0023_stock_ingredients.sql:13-24`

La saisie accepte une quantité de facture jusqu'à 1 000 000 et une quantité d'ingrédient par unité jusqu'à 100 000 000 millièmes. Leur produit peut dépasser 1 000 000 000 millièmes, alors que `ingredient_mouvement.quantite_milli` est borné à cette valeur. De même, `prixTotal = quantité × prixUnitaire` peut dépasser le `integer` et la limite de 100 000 000 centimes du mouvement ingrédient.

La saisie est donc acceptée, puis la validation peut échouer sur PostgreSQL au lieu de retourner une erreur métier claire. Le cas extrême est surtout un garde-fou contre une erreur de colis ou de quantité, mais il doit être traité avant l'écriture.

**Correction recommandée :** appliquer avant `enregistrerLivraisonIngredient` les mêmes bornes que la livraison manuelle, vérifier les multiplications avec `Number.isSafeInteger`, puis retourner une erreur métier indiquant la ligne et le dépassement.

### P2-5 — Le lecteur CDB n'est pas sûr pour un AVOIR article

**Fichier concerné :** `C:\Users\notta\dev\flaix-expert\packages\domain\src\factures-pdf.ts:101-211`

La mise en page reconnaît `FACTURE/AVOIR`, mais une ligne article négative passe par `Math.max(0, a.montant)`. Une ligne négative devient donc une ligne à zéro, sans représentation de l'avoir. Le contrôle du total peut ensuite produire une remarque, mais l'écran permet encore de poursuivre avec une saisie incomplète ou erronée.

**Correction recommandée :** distinguer facture et avoir, préserver les montants négatifs dans un modèle autorisé par la base, ou refuser explicitement l'automatisation d'un avoir avec un message bloquant et une saisie manuelle.

## 5. Wallets Apple et Google

### Ce qui est correctement construit

- Apple : `.pkpass`, manifeste, signature CMS, certificat/intermédiaire, jeton d'authentification par abonné, service web PassKit, inscription/suppression d'appareils, notification APNs et suppression d'un appareil sur réponse 410.
- Google : JWT « Save to Wallet » signé RS256, identifiant de classe par lieu, identifiant d'objet par abonné, classe partagée, objet individuel, solde de points, réduction, QR code et état actif/inactif.
- Les mises à jour sont préparées par lots et les échecs temporaires sont mis en relance.
- La migration 0060 est effectivement utilisée par `relancerCartes` : les relances sont prises avec `FOR UPDATE SKIP LOCKED` via `prendre_relances_wallet`, ce qui corrige le double traitement concurrent observé lors de l'audit précédent.

Les tests locaux vérifient les signatures et la structure des artefacts. Pour Google, le code utilise bien les endpoints `PUT` de mise à jour de classe et d'objet ; la documentation officielle décrit ces méthodes et autorise `reviewStatus=underReview` lors des mises à jour de classe : [Google Wallet — loyaltyclass.update](https://developers.google.com/wallet/reference/rest/v1/loyaltyclass/update), [Google Wallet — update passes](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/updates).

### Ce qui reste à prouver avant production

La couverture locale ne prouve pas :

- l'installation du `.pkpass` sur un iPhone réel avec le certificat de production ;
- la réception APNs avec la configuration réelle et un téléphone inscrit ;
- la création effective de la classe Google et de l'objet Google ;
- la mise à jour d'une classe déjà approuvée et d'un objet déjà installé ;
- le comportement d'une carte désactivée sur les deux wallets ;
- la reprise après expiration ou rotation de certificats/clés.

**Conclusion wallets :** architecture locale solide, mais statut « prêt production » non démontré sans recette externe Apple/Google.

## 6. Points P3

### P3-1 — Lecteur PDF dépendant fortement de deux mises en page

Les coordonnées CDB et la tolérance de regroupement PDF sont codées en dur. La stratégie est saine lorsqu'une mise en page est reconnue et que le total ne retombe pas : elle signale alors une erreur au lieu de deviner. Il manque toutefois des fixtures binaires réelles et des tests de variations de pagination, de polices, d'avoirs et de documents multi-commandes.

### P3-2 — Alias Excel facture incomplets par rapport au vocabulaire affiché

L'écran parle de `Col/Pack`, mais l'alias facture reconnaît `PCB`, `colisage`, `conditionnement`, `UVC`, `unités par colis`, etc. Il ne reconnaît pas littéralement `Col/Pack`. Une colonne courante de grossiste peut donc être ignorée et ramener le colis à 1, avec alerte ou correction manuelle nécessaire.

### P3-3 — Compteur de recettes annoncé par la copie de catalogue

`db/migrations/0062_copie_catalogue.sql` calcule `n_rec` sur les recettes source compatibles, pas sur les lignes réellement insérées. Si le produit cible avait déjà une recette, la copie n'écrase rien mais le nombre retourné peut annoncer une recette « copiée » alors qu'aucune ligne n'a été ajoutée. Impact limité à la restitution du résultat et au journal.

## 7. Corrections de l'audit précédent vérifiées

- La relation facture → livraison est désormais composée par `(lieu_id, livraison_id)` et les lectures/validations restent filtrées par lieu.
- L'auteur de l'annulation d'import est pris dans la session SQL et non fourni par l'appelant.
- Les relances wallet sont réservées atomiquement avant l'appel externe.
- Les tests de dépendances sont propres au moment de cette audit : `pnpm audit --prod --json` retourne zéro vulnérabilité.
- Le typecheck est propre sur le domaine, l'API et le web.

## 8. Plan de correction priorisé

### Avant mise en production

1. Séparer le lecteur de classeur « facture » du lecteur « caisse » et gérer les classeurs multi-feuilles.
2. Retourner/préremplir le total HT Excel/CSV et bloquer ou alerter sur l'écart.
3. Décider et implémenter une règle d'arrondi qui conserve exactement le montant financier de la ligne lors de l'entrée en réserve.
4. Borner les conversions ingrédients avant insertion et produire une erreur métier lisible.
5. Refuser explicitement les avoirs PDF non supportés, ou les modéliser avec des montants négatifs.
6. Faire la recette réelle Apple et Google avec des identifiants/certificats de test.

### À ajouter aux tests

- classeur facture à trois feuilles : page de garde, synthèse, lignes ;
- total Excel présent, absent, différent et ligne dupliquée ;
- colis 3 à 10,00 € et colis avec arrondi PDF ;
- ingrédient à 1 000 000 unités × 1 000 millièmes, puis dépassement attendu ;
- avoir CDB avec article négatif ;
- deux workers wallet concurrents et réponse temporaire puis succès ;
- recette Apple sur appareil réel et Google Wallet sur classe/objet déjà approuvés.

## Conclusion

Les fondations sont bonnes et les corrections précédentes sont bien intégrées. Les règles de calcul sont fiables dans les cas habituels, et les entrées d'ingrédients/CUMP sont correctement reliées aux recettes lorsqu'elles sont confirmées et que la validation demande l'entrée en réserve.

En revanche, il ne faut pas annoncer aujourd'hui que « tout se décompte automatiquement dès le dépôt d'une facture » ni que « l'import Excel contrôle automatiquement le total ». Le système est **semi-automatique avec confirmation de validation**, et il reste cinq points P2 à traiter avant de considérer le flux factures/réserve comme totalement sûr.
