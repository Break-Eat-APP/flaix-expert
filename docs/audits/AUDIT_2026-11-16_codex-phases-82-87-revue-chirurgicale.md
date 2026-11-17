# Audit chirurgical — phases 82 à 87

**Date :** 2026-11-16  
**Périmètre :** dépôt `C:/Users/notta/dev/flaix-expert`, code applicatif, migrations, scripts d’exploitation, documentation de gouvernance et tests associés aux derniers développements.  
**Révision auditée :** `e5eed9c` — `Dossier : remise à zéro de la réserve (§15.186, phase 87)`  
**Méthode :** lecture des changements depuis l’audit précédent, exécution des contrôles ciblés en environnement Docker/PostgreSQL, vérification des types, build web et audit des dépendances.

## Verdict exécutif

Le développement est sensiblement plus mûr. Les corrections annoncées sont présentes et plusieurs règles métier importantes sont désormais correctement protégées par des tests : remise à zéro de la réserve, validation de facture, conversion colis/pack, bornes de stock ingrédient, changement de lieu, import de feuilles Excel et mécanique locale des wallets.

Le dépôt n’est cependant pas encore démontré comme entièrement prêt pour une exploitation réelle. Aucun P1 n’a été trouvé dans les changements examinés, mais quatre sujets P2 restent à traiter avant de considérer l’ensemble comme fiable en production :

1. le lecteur Excel/CSV ne reconnaît pas un fichier contenant uniquement `Sous-total HT` ;
2. les dumps temporaires de restauration sont rendus lisibles par tous les utilisateurs locaux (`644`) ;
3. la copie de sauvegarde hors serveur n’est pas encore configurée et la vérification de restauration ne compare que des volumes de lignes ;
4. la recette réelle Apple Wallet / Google Wallet n’a pas encore été faite sur appareils et comptes réels.

Le lecteur PDF est volontairement conservateur et évite de deviner sur un format inconnu ou un PDF scanné. C’est une bonne règle de sécurité métier, mais les tests restent synthétiques : la robustesse sur de vrais PDF fournisseurs n’est donc pas encore prouvée.

## État des développements récents

| Domaine | État observé | Vérification |
|---|---|---|
| Remise à zéro de la réserve | Fonctionnelle pour les produits actifs et ingrédients suivis ; les éléments jamais comptés passent bien à zéro | 5/5 tests API |
| Exclusion des restes après remise à zéro | Le calcul filtre les anciens événements de reste à partir de la dernière remise à zéro | Vérifié dans `stock.ts` et par test de scénario |
| Validation facture → réserve | Le mouvement est créé à la validation, avec conversion quantité × pack et traçabilité de l’arrondi | 12/12 tests API |
| Prix/arrondis | L’écart d’arrondi est journalisé ; la règle est explicitement acceptée dans la gouvernance | Vérifié dans la route facture et le journal technique |
| Ingrédients | Les bornes de quantité sont contrôlées et les ingrédients suivis alimentent le mouvement de stock | Tests ciblés verts |
| Changement de lieu | Changement réservé au profil autorisé, session fermée puis recréée, journalisation des deux lieux | 5/5 tests API |
| Excel/CSV | Sélection de feuille, colonnes `Col/Pack`, total HT et contrôles de cohérence fonctionnent dans les cas couverts | 8/8 parser + 5/5 sélection de feuilles |
| PDF connu | Layouts Relais d’Or/CDB reconnus, totaux contrôlés, avoir CDB refusé | 7/7 tests synthétiques |
| Wallet Apple/Google | Signature, génération, appels d’actualisation, retries et limites sont implémentés | 27/27 tests unitaires/intégration isolés |
| Sauvegarde/restauration | Restauration locale serveur exécutée avec succès ; copie hors serveur non finalisée | Documentée, mais contrôle de contenu incomplet |
| Interface résultats | Alignement et impression navigateur vers PDF présents | 7/7 tests web ; build réussi |

## Anomalies et risques

### P2 — Le total `Sous-total HT` seul n’est pas reconnu

**Fichier :** `packages/domain/src/factures-import.ts:66`

La regex `TOTAL_HT` accepte `Total HT`, `Montant Total HT`, `Total général HT` et `Total hors taxes`, mais pas `Sous-total HT`. Pourtant le commentaire et la logique d’import annoncent la possibilité de retenir le dernier sous-total lorsqu’il y en a plusieurs.

Reproduction effectuée avec un fichier CSV minimal :

```text
Designation;Qte;PU HT;Montant HT
Biere;1;10;10
Sous-total HT;;;10
```

Le résultat retourné par `lireFactureExport` a `totalHt = null`. Le comportement évite une fausse validation — l’interface signale alors que le total est introuvable — mais le calcul automatique promis est incomplet pour ce format courant.

**Correction recommandée :** accepter explicitement `Sous-total HT` et `Sous-total hors taxes`, puis ajouter un test où aucun `Total HT` final n’est présent. Ajouter aussi un test avec plusieurs sous-totaux pour verrouiller la règle « dernier sous-total ».

### P2 — Dump de restauration temporaire lisible par tous les utilisateurs locaux

**Fichier :** `infra/vps/flaix-admin.sh:120` et `infra/vps/flaix-admin.sh:147`

Les deux parcours de restauration exécutent :

```sh
chmod 755 "$TMP" && chmod 644 "$TMP/copie.dump"
```

Le dump contient potentiellement les données personnelles, commerciales et financières de l’application. Pendant la fenêtre de restauration, tout utilisateur local peut donc lire le fichier si le système de permissions standard est respecté.

**Correction recommandée :** utiliser un répertoire temporaire `700` et un dump `600` (`chmod 700 "$TMP"; chmod 600 "$TMP/copie.dump"`). Vérifier également les permissions par défaut du répertoire de sauvegarde et du fichier de log.

### P2 — Sauvegarde hors serveur encore non opérationnelle

La gouvernance et `docs/points-a-revoir.md` indiquent que la copie externe OVH reste à configurer. Une sauvegarde présente sur le même serveur ne protège pas contre une perte du serveur, une compromission ou une suppression globale.

**Correction recommandée :** activer la copie chiffrée hors serveur, documenter la clé de restauration hors ligne, puis exécuter périodiquement les deux parcours de restauration et conserver un compte rendu daté.

### P2 — La restauration vérifie la lisibilité et les volumes, pas l’identité des données

**Fichier :** `infra/vps/flaix-admin.sh:158-165`

Le script restaure avec `pg_restore --exit-on-error`, puis compare uniquement `count(*)` sur onze tables. Deux bases peuvent avoir le même nombre de lignes tout en contenant des lignes différentes, tronquées ou modifiées.

Le compte rendu serveur parle de tables « identiques », alors que le contrôle réalisé est une comparaison de cardinalités. La formulation est donc trop forte par rapport à la preuve produite.

**Correction recommandée :** comparer au minimum des empreintes déterministes par table (clés primaires et hash des colonnes métier triés), ou effectuer une vérification de somme de contrôle du dump complétée par des contrôles d’intégrité référentielle et quelques enregistrements sentinelles. Reformuler le message en « restauration lisible et volumes comparés » tant que cette preuve n’existe pas.

### P2 — Recette réelle des wallets encore manquante

**Référence :** `docs/gouvernance/BUGS_ET_INCIDENTS.md`, `BUG-2026-017`

La mécanique Apple et Google est bien implémentée : signature du pass Apple, appel APNs, jeton de service Google, mise à jour des classes/objets et retries transitoires. Les tests isolés sont verts.

En revanche, aucune recette n’a encore démontré le parcours complet avec les identifiants de production ou de préproduction, un appareil Apple réel, un appareil Android réel, l’ajout de la carte, la mise à jour d’un abonné et la propagation visible de cette mise à jour. Les tests actuels ne suffisent donc pas à conclure que les cartes abonnés sont opérationnelles de bout en bout.

**Correction recommandée :** réaliser une recette contrôlée sur les deux plateformes et conserver les réponses HTTP, identifiants de classe/objet, horodatages et captures de l’état final. Tester aussi l’expiration, le renouvellement et la révocation d’un abonnement.

## Observations fonctionnelles importantes

### Réserve et dépôts de factures

La règle actuelle est cohérente : la réserve ne bouge pas à l’import du fichier ou à la saisie de la facture ; elle bouge à la validation de la facture. La case `entrerEnReserve` est activée par défaut dans l’interface, mais l’utilisateur peut la décocher. Il faut donc parler d’une entrée « automatique à la validation si l’option est activée », et non d’une entrée inconditionnelle.

Ce choix est sain pour éviter de stocker une facture encore contrôlée, mais il doit être explicite dans la procédure utilisateur et dans les indicateurs de rapprochement. Une facture validée avec l’option décochée ne crée volontairement aucun mouvement de réserve.

La remise à zéro est mieux verrouillée : elle refuse un événement ouvert, journalise l’action, crée une ligne zéro pour les produits actifs et ingrédients suivis, et exclut les restes antérieurs du calcul suivant. Les tests couvrent notamment un produit jamais compté et la conservation du prix.

### Lecture Excel/CSV

La sélection de feuille est maintenant correctement ciblée sur les feuilles de ventes/factures et les colonnes `Col/Pack` sont reconnues. Les contrôles de total empêchent une validation silencieuse si le total lu ne correspond pas aux lignes.

La réserve ne doit toutefois pas être considérée comme automatiquement exacte pour tous les fichiers tant que le cas `Sous-total HT` seul n’est pas couvert. Le défaut actuel est plutôt un refus contrôlé qu’une fausse entrée, mais il reste incompatible avec la promesse de lecture automatique complète.

### Lecture PDF

Le comportement « ne pas deviner » est correct : un PDF scanné sans couche texte ou un format fournisseur inconnu est refusé avec demande de saisie manuelle. Les avoirs CDB négatifs sont également bloqués.

Le risque restant est la couverture réelle : les fixtures actuelles représentent du texte extrait, pas des fichiers PDF réels avec polices, positions, retours à la ligne, tableaux multi-pages, arrondis et variantes de mise en page. Le registre le suit dans `BUG-2026-018`.

### Wallets abonnés

Le code local et les tests donnent une base solide, mais ils ne prouvent pas la compatibilité opérationnelle avec les environnements Apple/Google configurés par le client. Le statut correct est donc : **fonctionnalité implémentée et testée isolément, recette de bout en bout encore ouverte**.

## Vérifications exécutées

| Contrôle | Résultat |
|---|---|
| Démarrage Docker/PostgreSQL et `pnpm db:migrate` | OK — base déjà à jour |
| Import facture Excel/CSV | 8/8 OK |
| Parser PDF connu | 7/7 OK |
| Sélection de feuilles Excel | 5/5 OK |
| Écrans Factures, Remise à zéro, Résultats | 7/7 OK |
| Changement de lieu | 5/5 OK |
| Remise à zéro de la réserve | 5/5 OK |
| Facture/réserve/ingrédients/livraison | 12/12 OK |
| Fichiers wallet | 5/5 OK |
| Wallet Apple/Google | 22/22 OK |
| Typecheck domain, API, web | OK |
| Build web | OK — avertissements de taille de chunks |
| `pnpm audit --prod --json` | 0 vulnérabilité connue, 130 dépendances analysées |

Les premiers tests lancés en parallèle ont été interrompus par une limite mémoire/thread du poste (`errno=1455`), pas par un échec applicatif. Les mêmes contrôles ciblés ont ensuite été relancés séquentiellement avec un worker et sont passés.

## P3 — Qualité et dette documentaire

- `docs/avancement.md` conserve un en-tête « Mis à jour le 2026-10-05 », alors que les phases 82 à 87 sont datées du 2026-11-16.
- `docs/developpement/CODEX_AUDIT_PROMPT.md` décrit encore une plage de phases antérieure et devrait être réaligné sur le périmètre courant.
- Le build web signale des chunks volumineux, notamment le worker PDF et le module 3D. Ce n’est pas un bug fonctionnel, mais cela peut peser sur le premier chargement et les appareils modestes.
- Les tests PDF réels et la recette wallet réelle restent absents ; ils sont déjà inscrits dans le registre, ce qui est positif, mais doivent rester bloquants pour une conclusion « production complète ».

## Conclusion

Les derniers développements sont globalement cohérents et les corrections précédentes sont effectivement intégrées. Les règles de calcul de réserve sont bonnes dans le parcours nominal : la réserve est alimentée à la validation de facture, les conversions et arrondis sont tracés, et la remise à zéro est correctement bornée et journalisée.

La réponse précise à la question « est-ce que tout se décompte automatiquement ? » est : **oui dans le parcours validé et avec l’option d’entrée en réserve activée ; non si l’utilisateur décoche cette option, si le total HT n’est pas reconnu, ou si le document est un PDF scanné/inconnu**. Ces cas sont en partie des choix explicites, mais ils doivent être visibles dans le produit et la documentation.

Avant une mise en exploitation réelle, je recommande de traiter dans cet ordre :

1. corriger et tester `Sous-total HT` ;
2. sécuriser les permissions des dumps temporaires ;
3. activer et tester la sauvegarde hors serveur, avec une vérification de contenu plus forte ;
4. exécuter la recette Apple Wallet et Google Wallet sur appareils réels ;
5. ajouter des PDF fournisseurs réels et refaire la validation de non-régression.

