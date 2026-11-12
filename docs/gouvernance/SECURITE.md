# FlaiX Expert — règles et contrôles de sécurité

Tenu selon la gouvernance (`GOUVERNANCE_FLAIX_EXPERT.md`, § 12). Créé le 2026-11-12. Ce document dit **ce qui est en place
et où**, et ce qui reste à faire ; toute règle ou tout contrôle qui change le met à jour.

## 1. Isolement des lieux (le plus important)

| Contrôle | Où | Preuve |
|---|---|---|
| Sécurité par ligne PostgreSQL : chaque table d'un lieu n'est lisible et modifiable que pour `lieu_courant()` | migrations (`ENABLE ROW LEVEL SECURITY`, politiques `*_isolement`) | `conformite-base.test.ts`, tests [F] de chaque module |
| Toute requête métier dans `base.transaction(contexte(auth), …)` | `apps/api/src/base.ts`, routes | relecture, audits |
| Clés étrangères composées avec le lieu (`(lieu_id, id)`) | migrations (ex. 0059, 0061) | `facture-livraison-lieu.test.ts` |
| Fonctions privilégiées (`SECURITY DEFINER`) : vérifient elles-mêmes le lieu, le rôle, l'utilisateur de la session | migrations | tests [F] (ex. `annulation-import`, `catalogue-copie`) |
| Copie de catalogue : seulement entre lieux d'un même client (directeur commun) | migration 0062 | `catalogue-copie.test.ts` |

## 2. Authentification et sessions

- Mots de passe hachés (argon2, `@node-rs/argon2`) ; 6 caractères au moins ; mot de passe provisoire à changer.
- Session dans un cookie `httpOnly` (illisible par la page), `secure` en ligne ; révocable ; durée `DUREE_SESSION_HEURES`.
- Caissières : code personnel, sur une tablette enregistrée par le directeur.
- Back-office éditeur : comptes et cookie séparés de l'application des lieux ; ne voit ni montant, ni ticket, ni salarié.
- Support (niveau 2) : seulement sur autorisation datée du lieu, en lecture.

## 3. Points d'entrée du serveur

- Validation stricte des entrées (schémas `zod`) ; messages d'erreur lisibles, sans détail interne.
- Limitation du nombre d'essais (`@fastify/rate-limit`) sur la connexion et les points sensibles.
- Contrôle de l'origine des requêtes (`ORIGINES_AUTORISEES`).
- Taille des corps limitée (pièces jointes 15 Mo) ; export du comptable plafonné et envoyé en flux.

## 4. Journaux et inaltérabilité

- Journal de caisse et journal technique : écriture seule (droits et déclencheurs), chaînés, vérifiables depuis le
  back-office. Tarifs en écriture seule. Factures validées figées.
- Les tests de conformité provoquent réellement les fraudes (modification, suppression, accès à un autre lieu) et ne
  passent que si la base les refuse.

## 5. Secrets

- Aucun secret dans Git (`.gitignore` : `.env`, `.env.*`), dans l'écran, dans les journaux ni dans une conversation.
- Rémi les installe sur le serveur (`sudo flaix-admin …`, fichiers `/etc/flaix/*.env` lisibles par root, transmis au
  service par systemd). Liste des variables : `.env.example` (sans valeur).
- Un secret exposé est changé immédiatement.

## 6. Données et confidentialité

- Le minimum nécessaire ; pas de données personnelles dans les journaux techniques.
- Colonne « URL Ticket » de L'Addition : retirée dans le navigateur avant l'envoi, jamais gardée (BUG-2026-009).
- Factures PDF : lues dans le navigateur, sans envoi à un tiers ; les vraies factures ne vont jamais dans le dépôt.
- Mise en production : base neuve, seule la configuration reprise.
- Sous-traitants (OVHcloud, Brevo, Apple, Google, Mistral) : dossier de conformité.

## 7. Intelligence artificielle

- Assistant en lecture seule, actif seulement avec l'option du lieu ; clé posée par Rémi.
- Offre Mistral retenue : payante « Scale », sans utilisation des données pour l'entraînement (à vérifier sur leur site
  au moment de l'activation).
- Aucun agent de développement n'a accès à la base ni aux journaux de production.

## 8. Dépendances

`pnpm audit --prod` sans alerte au 2026-11-12 (audit Codex). Scripts d'installation limités (`allowBuilds` de
`pnpm-workspace.yaml`). Voir gouvernance § 17.

## 9. À faire

- Tester une restauration de sauvegarde (MISE_EN_LIGNE.md § 4).
- Régler la copie chiffrée des sauvegardes hors serveur (`flaix-admin sauvegarde-externe`) — état à confirmer avec Rémi.
- Décider d'un outil de suivi des erreurs (sous-traitant à déclarer).
- Recette réelle des cartes Wallet avec les vrais comptes (BUG-2026-017).
