# Audit du 2026-10-05 — revue par Claude des phases 39 à 48, avant l'audit Codex

> Demande de Rémi (2026-10-05) : « un tour des dernières constructions […] et un retour sur ce qui reste à faire ou si je
> peux passer en mode test ». Revue du code et du serveur de test par Claude (auteur de ce code : regard à compléter par
> l'audit Codex, indépendant). Le Click & Collect non connecté est connu et hors périmètre.

## Verdict général

Le code des phases 39 à 48 est complet et testé (serveur 345 tests, écrans, moteur : tous au vert ; types vérifiés ;
écran construit). Aucun défaut de sécurité grave trouvé : isolement des lieux, droits, sessions et mode formation sont
respectés par les nouvelles routes. **Cinq défauts P2** sont à corriger avant d'utiliser les tablettes à un vrai match
(le plus important : la caisse attend les notifications envoyées à Apple, Google et aux téléphones des directeurs).
**Avant d'encaisser de vraies ventes**, restent les pièces de conformité (attestation, archivage annuel, registre des
versions) et la copie des sauvegardes hors du serveur.

## Phases revues

| Phase | Sujet | État | Conclusion |
|---|---|---|---|
| 39 | Revenue Engine « Où je perds de l'argent » | Testé | RAS |
| 40 | Temps de prise de commande | Testé | RAS (mesure hors du ticket scellé, valeurs impossibles ignorées) |
| 41 | Centre d'alertes, rupture poussée | Testé | P2-1 (la caisse attend l'envoi) ; P3-6 (calcul du stock à chaque envoi de tickets) |
| 42 | Prix entre fournisseurs | Testé | RAS |
| 43 | Back-office niveau 2 (support) | Testé | RAS : lecture seule imposée deux fois (route et transaction `READ ONLY`), traces |
| 44 | Prévision | Testé | RAS |
| 45 | IA OVHcloud | Testé, non branché | En attente du moyen de paiement OVH (Rémi) |
| 46 | E-mails Brevo | Testé, en service | Essai réel à faire par Rémi |
| 47 | Carte wallet Apple et Google | Testé, comptes installés | P2-1, P2-2, P2-3, P2-4, P2-5 ; P3 |
| 48 | Design de la carte | Testé, vu à l'écran | P2-3 |

## Défauts

### P1 — avant la production (vraies ventes)

Aucun défaut de code P1. Pièces manquantes, déjà connues (dossier de conformité, tableau de bord) :
- **Attestation individuelle de l'éditeur** (partie 01), **identification de la version et registre des versions** (02, 12),
  **archivage fiscal annuel** (09), **compte vérificateur** (07, 25), **avis juridique** (17), **validation comptable** (18).
- **Copie des sauvegardes hors du serveur** (16) : vérifié sur le serveur de test le 2026-10-05, `/etc/flaix/sauvegarde-externe.env`
  absent. Les sauvegardes quotidiennes et celles d'avant chaque mise en ligne restent sur la même machine : une panne du
  serveur emporterait les données. À régler par Rémi (guide serveur, « Copie des sauvegardes chez OVH », 15 minutes)
  **dès que de vraies données de club sont saisies**, même en test.

### P2 — avant l'exploitation réelle (et avant un match avec les tablettes)

**P2-1 — La caisse attend les notifications envoyées après l'enregistrement des tickets.**
`apps/api/src/routes/caisse.ts` (fin de `POST /api/caisses/:id/journal`) : `await pousserAlertesStock(…)` puis
`await mettreAJourCartes(…)`. Les tickets sont déjà enregistrés, mais la réponse à la tablette attend les appels à
Apple (10 s au plus par téléphone), à Google (10 s par carte) et aux navigateurs des directeurs (10 s par appareil).
Scénario : service de Google lent pendant un match, lot de tickets portant 5 numéros d'abonné → la tablette reste en
« envoi » jusqu'à 50 s, l'envoi suivant attend. Aucune perte (tout est enregistré, la tablette renvoie, doublons écartés),
mais l'écran de la caissière et le suivi en direct prennent du retard. **Correctif** : lancer ces envois après la
réponse (comme `suivreToutesLesCartes`), sans les attendre. **Test** : un notificateur qui ne répond pas ne retarde pas la
réponse de la synchronisation.
**Corrigé le 2026-10-05, commit `360895e`** : `apps/api/src/arriere-plan.ts` (travaux après la réponse, échecs journalisés) ;
alertes de stock et cartes wallet après la synchronisation de la caisse, cartes après un ajustement ou une fiche modifiée.
Test : notificateur bloqué → la caisse reçoit sa réponse, la notification part quand il se libère.

**P2-2 — La carte d'un abonné désactivé reste affichée comme valable.**
`packages/domain/src/wallet.ts` (`objetGoogle` : `state: "ACTIVE"` toujours) ; migration 0035 (`carte_par_serie` et
`cartes_appareil` filtrent `a.actif`). Scénario : le directeur désactive un abonné → Google reçoit une carte « ACTIVE »
mise à jour ; l'iPhone n'est même pas prévenu (la liste des cartes modifiées exclut l'abonné désactivé), il garde la
carte telle quelle. La caisse refuse ses points, mais la carte paraît encore bonne. **Correctif** : état `INACTIVE` chez
Google ; côté Apple, laisser le téléphone récupérer la carte de l'abonné désactivé et la marquer `voided` (barrée par
Wallet). **Test** : désactivation → carte Google `INACTIVE`, carte Apple `voided: true`.
**Corrigé le 2026-10-05, commit `360895e`** : `actif` dans le contenu de la carte ; migration 0037 (`carte_par_serie` et
`cartes_appareil` sans filtre sur `actif` ; `carte_par_jeton`, la page publique, reste fermée). Tests : moteur (barrée,
inactive) et serveur (téléphone prévenu, carte barrée puis valable après réactivation).

**P2-3 — Mise à jour de toutes les cartes dans une seule transaction, avec un calcul de solde par carte.**
`apps/api/src/routes/wallet.ts`, `mettreAJourCartes` : pour chaque abonné, `donneesCarte` relance le calcul du solde
(`soldePoints`, lecture des tickets de l'abonné) dans une seule transaction ouverte pendant toute la boucle. Scénario :
changement de design dans un lieu de 2 000 cartes → 2 000 calculs de solde dans une transaction longue, en arrière-plan,
puis 2 000 appels à Google. **Correctif** : lire les abonnés par lots (100), soldes par lots, transaction courte par lot.
**Test** : mise à jour de 250 cartes en plusieurs lots, résultat identique.
**Corrigé le 2026-10-05, commit `360895e`** : lots de 100, transaction par lot, `donneesCartes` et `soldesPoints` (une lecture
par lot, même calcul que `soldePoints` de la caisse). Test : 250 cartes de plus → modèle Google une fois, chaque carte une
fois ; soldes du lot égaux à ceux lus par la caisse.

**P2-4 — Bibliothèque `node-forge` 1.3.1 vulnérable** (`apps/api/package.json`). `pnpm audit --prod` : 8 alertes (7
« high »), toutes sur `node-forge` 1.3.1, ajoutée pour signer la carte Apple. FlaiX Expert ne s'en sert que pour signer
et lire ses propres certificats (aucune donnée extérieure vérifiée), l'exposition est faible ; la version 1.4.0 corrige
7 alertes (la 8ᵉ, vérification de signatures, n'a pas encore de version corrigée et ne concerne pas notre usage).
**Correctif** : passer à 1.4.0 ; relancer les tests de signature (`openssl smime -verify`).
**Corrigé le 2026-10-05, commit `360895e`** : 1.4.0 ; `pnpm audit --prod` : 1 alerte restante (vérification de signatures,
sans version corrigée publiée, non utilisée par FlaiX Expert) ; carte signée vérifiée par `openssl smime -verify`.

**P2-5 — Service web PassKit sans limite de requêtes.** `apps/api/src/routes/wallet.ts` : les adresses
`/api/passkit/v1/...` n'ont pas de limitation (contrairement aux pages publiques de la carte). `POST /api/passkit/v1/log`
accepte sans authentification 50 lignes de 1 000 caractères par requête, écrites au journal du serveur : remplissage du
journal possible. **Correctif** : limite par adresse (par exemple 120 par minute ; journal : 10 par minute).
**Corrigé le 2026-10-05, commit `360895e`** : 120 requêtes par minute et par adresse, journal 10 par minute. Test : 11ᵉ envoi
du journal refusé (429).

### P3 — qualité, robustesse

- **P3-1** `apps/api/src/serveur.ts` : l'exemption de la protection intersite pour PassKit repose sur `req.url` ; préférer
  l'adresse de la route reconnue (`req.routeOptions.url`). Pas d'attaque trouvée (les navigateurs normalisent les chemins),
  durcissement.
- **P3-2** Serveur : l'API écoute sur `0.0.0.0:3001` ; le pare-feu ne laisse passer que 22, 80 et 443, mais l'écoute devrait
  être limitée à `127.0.0.1`.
- **P3-3** PassKit : `lastUpdated` est rendu à la milliseconde, `carte_maj_le` est en microsecondes ; après une notification,
  un téléphone peut retélécharger une carte inchangée. Arrondir à la milliseconde.
- **P3-4** Apple : une connexion HTTP/2 par notification ; à mutualiser pour les mises à jour de toutes les cartes.
- **P3-5** Pas d'en-tête `Content-Security-Policy` (défense en profondeur ; React échappe déjà le contenu).
- **P3-6** Centre d'alertes : le stock de l'événement est recalculé à chaque envoi de tickets contenant des ventes (toutes
  les 8 s par tablette pendant le service). Sans effet visible au volume de test ; à mesurer lors du premier match.

## Suite

Les cinq P2 sont corrigés (commit `360895e`) ; les P3 restent, à recouper avec l'audit Codex. Tests après corrections :
moteur 241, serveur au vert (le fichier « formation » relancé seul, 10 sur 10, après un arrêt de Node faute de mémoire sur le
PC), types vérifiés.

## Ce qui reste à vérifier sur le terrain (pas du code)

- E-mail d'essai Brevo (Paramètres → Notifications → E-mails) : pas encore fait.
- Carte wallet sur un vrai iPhone et un vrai Android ; comptes de test Google, puis demande de publication.
- Assistant IA : en attente du moyen de paiement OVHcloud.
- Click & Collect : non connecté (connu).

## Ce qui n'a pas été vérifié

- Tenue en charge (plusieurs tablettes à un vrai match) : à observer lors du premier essai.
- Comportement réel d'Apple Wallet et de Google Wallet (mise à jour à distance, rendu du design) : seulement simulé dans les tests.
- Revue indépendante : ce code a été écrit par Claude ; l'audit Codex reste nécessaire.
