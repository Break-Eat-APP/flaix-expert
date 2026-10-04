# Phase 1 — Matchs, caisse, Mes caisses, journal des tickets

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-29 |
| Décision | dossier projet §15.94 |
| État | livrée, tests au vert au moment du commit |
| Commits | 1 |

## 1. Ce qui a été décidé, et pourquoi

### 15.94 Version test complète — décisions et étape 1 : matchs, Ma caisse, Mes caisses, journal des tickets (2026-09-28)

**Demandes de Rémi (verbatim)** : *« je préfère le serveur français, et ses écrans aussi […] tu peux déjà créer une version test vierge ? que le directeur puisse intégrer des chiffres et suivre le fonctionnement sur plusieurs matchs ? sur une caisse fictive »* ; *« je préférerais gratuit »* ; puis, sur le contenu : *« l'ensemble complet, pour tester je dois avoir un logiciel fini et fonctionnel »*.

**Décisions** (détail dans `decisions-architecture-production.md` § 10, lignes 6 à 9) : serveur et écrans en France ; version test sur un VPS OVHcloud (aucun hébergement gratuit fiable en France n'a été trouvé — dit à Rémi plutôt que de lui promettre du gratuit) ; **logiciel complet**, construit dans l'ordre des dépendances (étapes 1 à 6), chaque module relu en entier dans son prototype validé avant d'être construit, et déployé sur le serveur de test dès qu'il est prêt ; le directeur tape lui-même les ventes en test. Rappel fait à Rémi, avec son historique (§15.39 à §15.60) : tout intégrer d'un coup avait produit des modules résumés — d'où l'ordre et la relecture systématique.

**Étape 1 — ce qui est construit, et d'où vient chaque règle** :
1. **Calendrier des matchs** (nouveau, dans Configuration) : un match = libellé, date, spectateurs (saisis, pour le CA par spectateur), état *à venir → ouvert → clos*. Jusqu'ici chaque module du prototype tenait sa propre liste de soirées (Stock, Personnel, Ventes & CA, Gestion financière) — la production n'en a qu'une. Une caisse ne s'ouvre que pendant un match ouvert ; un match ne se clôt que lorsque toutes ses caisses sont fermées (le module Clôture d'événement, étape 2, ajoutera ses propres conditions).
2. **Ma caisse** (module 1, §14 et §15.26, prototype `Cmd` relu en entier) : ouverture de caisse (fond de caisse seulement si la caisse accepte les espèces), produits du stand par catégorie avec effet visuel à l'ajout, remise 0/5/10/15/20/50 %, pastille Abonné à 15 % avec n° obligatoire, offert en montant exact, motif obligatoire (Staff, Geste commercial, Remboursement, Client mécontent, Autre + texte), paiement espèces avec rendu monnaie ou carte (déclaratif, sans Stripe en test), ticket scellé et numéroté par caisse, clôture de caisse. **Le prix de chaque ligne est lu sur le tarif en vigueur à l'instant de la vente, côté serveur** (jamais envoyé par l'écran). Le stock restant sur les cartes produits arrivera avec le module Stock (étape 3). Les boutons de démonstration du prototype (« Falsifier ce ticket », « Simuler une coupure réseau ») ne sont pas repris : texte et outils de maquette (§3, « trois registres »).
3. **Mes caisses** (§15.73) : tableau de bord par caisse et par match, et en plus, maintenant qu'il y a un serveur, l'état **ouverte / fermée en direct** que le prototype ne pouvait pas montrer. Le directeur peut ouvrir une caisse depuis cet écran (décision 9).
4. **Journal des tickets** (module 3, §15.29 et §15.62) : tous les tickets du match, filtres stand / caisse / opérateur / mode de règlement / texte, détail, vérification d'intégrité dans l'ordre réel de scellement.
5. **Annulation d'un ticket après coup** (§15.2, test A6) : le ticket d'origine demeure, un événement d'annulation de sens inverse le référence, avec motif et auteur. Absent du prototype, exigé par le dossier de conformité.

**Choix de modélisation signalés** :
- Remise en % et offert en € peuvent coexister sur un même ticket et sont enregistrés séparément (le prototype n'en gardait qu'un des deux dans l'enregistrement).
- Pour la TVA, la remise s'applique à chaque ligne ; l'offert est réparti sur les lignes au prorata de leur montant. **À faire confirmer par l'expert-comptable (question 8).**
- Chaque caisse a sa propre chaîne, qui couvre aussi le détail des lignes et des ajustements (même raisonnement que pour le journal technique, `decisions-architecture-production.md` § 12).
- Le serveur de test affiche en permanence « VERSION DE TEST — aucune vente réelle ».

**Vérifié (étape 1, 2026-09-29)** : 102 tests automatisés (50 sur le moteur, dont le calcul du ticket avec les exemples du dossier — 15,50 € remise abonné 10 % → 13,95 € ; 7,00 € remise abonné 15 % → 5,95 € ; 52 sur le serveur et la base, dont les tests de falsification A1, A2, A3, A8 sur le journal de caisse et les lignes de ticket, le test A6 d'annulation, vingt ventes simultanées sur une caisse sans trou ni doublon de numéro, et l'envoi répété d'un même ticket qui n'en crée jamais deux). Parcours complet dans le navigateur : match ouvert → caisse 1 ouverte avec 150 € de fond → ticket de 24,00 € au tarif abonné 15 % = 20,40 €, 50 € donnés, 29,60 € rendus, TVA 0,18 € (5,5 %) et 1,54 € (10 %) → ticket carte de 7,00 € avec 1 € offert → annulation de ce ticket (le ticket d'origine demeure, marqué « Annulé », l'annulation porte le numéro suivant) → intégrité des chaînes « Intègre » → clôture de caisse : 170,40 € d'espèces attendues → match clos. Deux défauts trouvés et corrigés : colonnes coupées sur un écran de portable dans « Mes caisses » ; lignes du détail d'un ticket affichées après remise alors que la remise était aussi listée (lecture ambiguë, désormais montant brut par ligne puis remise, offert et total).

## 2. Ce qui a été construit — commits

- [`f454873`](https://github.com/Break-Eat-APP/flaix-expert/commit/f454873fd886775f86e40826d636a9643993d65e) — 2026-09-29 — Étape 1 de la version test : matchs, Ma caisse, Mes caisses, journal des tickets

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0003_matchs_et_caisse.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/db/migrations/0003_matchs_et_caisse.sql)

### Tests

- `apps/api/test/caisse.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/test/caisse.test.ts)
- `packages/domain/src/ticket.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/ticket.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/index.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/index.ts)
- `packages/domain/src/journal-caisse.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/journal-caisse.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/journal-technique.ts)
- `packages/domain/src/modele.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/modele.ts)
- `packages/domain/src/ticket.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/packages/domain/src/ticket.ts)

### Serveur (apps/api)

- `apps/api/src/auth/routes.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/auth/routes.ts)
- `apps/api/src/config.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/config.ts)
- `apps/api/src/journal-caisse.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/journal-caisse.ts)
- `apps/api/src/routes/caisse.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/routes/caisse.ts)
- `apps/api/src/routes/evenements.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/routes/evenements.ts)
- `apps/api/src/routes/lieu.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/routes/lieu.ts)
- `apps/api/src/routes/stands.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/routes/stands.ts)
- `apps/api/src/serveur.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/api/src/serveur.ts)

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/web/src/App.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/configuration/Identite.tsx` — modifié (n'existe plus)
- `apps/web/src/pages/configuration/Matchs.tsx` — créé (n'existe plus)
- `apps/web/src/pages/configuration/Produits.tsx` — modifié (n'existe plus)
- `apps/web/src/pages/conformite/JournalTechnique.tsx` — modifié (n'existe plus)
- `apps/web/src/pages/Demarrage.tsx` — modifié (n'existe plus)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/apps/web/src/styles.css)

### Documentation

- `docs/decisions-architecture-production.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/docs/decisions-architecture-production.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/f454873fd886775f86e40826d636a9643993d65e/docs/flaix-gestion-dossier-projet.md)

## 4. Tests créés dans cette phase

### `apps/api/test/caisse.test.ts`

- **cycle d'un événement**
  - une caisse ne s'ouvre pas sans événement ouvert ni prévu aujourd'hui
  - ouvre l'événement ; un second match ne peut pas être ouvert en même temps
  - le libellé d'un événement ouvert ne se modifie plus, mais les spectateurs oui
- **Ma caisse — la tablette scelle, le serveur vérifie (§15.97)**
  - ouverture : fond obligatoire si la caisse accepte les espèces ; la tablette reçoit la tête de chaîne et son jeton
  - l'écran de caisse ne propose que les produits du stand, au prix en vigueur
  - vend un ticket : numéro par caisse, TVA ventilée, heure de réception notée, aucun signalement
  - un envoi répété (réponse perdue) est reconnu : jamais deux fois le même ticket
  - espèces : refusées sur une caisse carte uniquement ; montant insuffisant refusé ; rendu scellé
  - remise sans motif refusée ; remise abonné acceptée et signalée tant que le taux du lieu diffère
  - un produit qui n'est pas vendu à ce stand est inscrit mais signalé
  - F1/F2 — vingt ventes hors ligne, envoyées d'un coup au retour du réseau : numéros continus, marquées hors ligne
  - F3 [F] — deux caisses hors ligne en même temps, reprise en même temps : aucune collision, chaque chaîne intacte
  - le même lot envoyé deux fois en même temps n'inscrit chaque ticket qu'une fois
  - A6 — annulation sur la tablette : le ticket d'origine demeure, une opération inverse le référence, une seule fois
  - [F] un lot dont un ticket a été trafiqué est refusé en entier : rien n'est inscrit
  - prix changé pendant une coupure : la vente au prix de la tablette est inscrite et l'écart signalé
  - reprise sur un autre appareil : l'ancien jeton est refusé, le nouvel appareil continue la chaîne
  - Mes caisses : état ouvert en direct et chiffres de l'événement par caisse
  - F4 — clôture : refusée tant qu'un ticket manque, puis faite en une fois ; une seconde clôture est refusée
  - un événement ne se clôt pas tant qu'une caisse est ouverte ni tant qu'un tiroir n'a pas son Z, puis se clôt définitivement
  - la chaîne de chaque caisse est intacte, tickets scellés par la tablette compris
- **Groupe A — journal de caisse inaltérable [F]**
  - A1/A2 [F] — ni le serveur ni le propriétaire ne peuvent modifier ou supprimer un ticket ou une ligne
  - A8 [F] — un numéro de justificatif ne peut pas être émis deux fois
  - A3 [F] — une ligne insérée en contournant l'application (fausse empreinte) est détectée à la vérification

### `packages/domain/src/ticket.test.ts`

- **calculerTicket**
  - sans ajustement : total = somme des lignes, TVA ventilée par taux
  - exemple du dossier (§15.26) : 2 hot-dogs à 6,00 € + 1 soda à 3,50 €, remise abonné 10 % → 13,95 €
  - remise abonné 15 % sur 7,00 € → 5,95 € (vérifié dans le prototype, §15.39)
  - l'offert est réparti au prorata, la somme reste exacte au centime
  - un offert supérieur au montant est plafonné : le total ne descend jamais sous 0
  - remise ET offert se cumulent et restent tous deux visibles
  - HT + TVA = TTC pour chaque taux, quel que soit l'ajustement
- **repartirProrata**
  - répartit exactement, sans centime perdu ni créé
- **erreurAjustement**
  - aucun ajustement : rien à justifier
  - remise sans motif : refusée
  - abonné : n° obligatoire, et au taux du lieu seulement
  - « Autre » exige un texte ; un palier hors liste est refusé
- **numeroJustificatif**
  - format 2026-C3-000125 (§15.12)

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests du moteur de cette phase : `cd packages/domain && ./node_modules/.bin/vitest run src/ticket.test.ts`.
3. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/caisse.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
