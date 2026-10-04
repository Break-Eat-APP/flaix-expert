# Carte du code — où trouver quoi (FlaiX Expert)

> Généré par `node infra/outils/journal-developpement.cjs` : cette introduction vient de `infra/outils/carte-du-code-intro.md`, le tableau des lignes est recalculé à chaque génération.
> Règles du projet : [`AGENTS.md`](../../AGENTS.md). Ordre de construction : [`JOURNAL_DES_PHASES.md`](JOURNAL_DES_PHASES.md). Décisions : `docs/flaix-gestion-dossier-projet.md` (§15.x).

## Organisation

| Dossier | Contenu | Règle |
|---|---|---|
| `packages/domain/src` | Moteur de calcul **pur** (aucune base, aucun réseau) : ticket, TVA, scellement, clôtures, stock, marges, Click & Collect, fidélité, recettes. Partagé par le serveur ET la tablette. | Montants en **centimes entiers**, taux en **points de base** (1000 = 10 %). Un calcul fait foi ici et seulement ici. |
| `apps/api/src` | Serveur Fastify : droits, règles, accès à PostgreSQL. | Toute requête métier passe par `base.transaction({ lieuId, utilisateurId })` (isolement des lieux par la base). |
| `apps/web/src` | Écrans React (directeur, caisse sur tablette, téléphone, back-office `/editeur`). | Jamais de règle métier dupliquée : l'écran appelle le moteur ou le serveur. |
| `db/migrations` | Schéma PostgreSQL versionné (`0001` → `0024`). | Une migration appliquée **ne se modifie jamais**. Droits, sécurité par ligne et déclencheurs d'écriture seule y sont définis. |
| `apps/api/test`, `packages/domain/src/*.test.ts` | Tests contre la vraie base et tests du moteur. | Les tests **[F]** provoquent la fraude et vérifient que la base la refuse. |
| `infra/` | Docker local, scripts du serveur OVH (`vps/deployer.sh`, `vps/flaix-admin.sh`), outils (logo, icônes, ce journal). | Les secrets restent sur le serveur, jamais dans le dépôt. |
| `docs/` | Dossier projet, décisions d'architecture, conformité, questions à l'expert-comptable, guide du serveur, suivi du développement. | Décision écrite avant code. |

## Serveur — `apps/api/src`

| Fichier | Rôle |
|---|---|
| `base.ts` | Connexion à PostgreSQL, `transaction` (pose `app.lieu_id` et `app.utilisateur_id` : la sécurité par ligne isole les lieux), `changerLieu`, `verrouiller`. |
| `auth/` | Sessions (cookie `fx_session`), tablettes enregistrées (`fx_appareil`), codes des caissières, mots de passe (argon2id), `exigerDirecteur`, `exigerAccesCaisse`. |
| `journal-technique.ts` | `inscrireJet` : journal technique chaîné par lieu (toute modification de paramétrage y est inscrite), `verifierJet`. |
| `journal-caisse.ts` | Chaîne de chaque caisse (ouverture, ventes, annulations, clôture) et sa vérification. |
| `serveur.ts` | Assemblage, protection intersite, options par lieu, liste `CONFIGURATION` (routes en lecture seule en mode formation). |
| `options.ts` | Options activées par lieu depuis le back-office (absence de réglage = active). |
| `routes/caisse.ts` | Ouverture et clôture de caisse, **réception des tickets scellés par la tablette** (`POST /api/caisses/:id/journal`), ticket client et duplicata, tableau des caisses. |
| `routes/evenements.ts` | Matchs : création, ouverture, **clôture** (exige Z des tiroirs, coffre, comptage du stock ; fige la consommation des ingrédients ; crée le Z du match). |
| `routes/clotures.ts`, `routes/periodes.ts` | Assistant de clôture du match, Z des tiroirs et du coffre, rectifications signées ; clôtures du mois et de l'exercice, total perpétuel, vérification des clôtures. |
| `routes/resultats.ts` | Chiffres du match et comparaisons sur les vraies ventes. |
| `routes/stock.ts`, `routes/stock-ingredients.ts` | Stock des produits et des ingrédients suivis : réserve, livraisons au coût moyen pondéré, mise en place, réassort, comptage, inventaires. |
| `routes/produits.ts`, `routes/recettes.ts`, `routes/stands.ts`, `routes/lieu.ts` | Configuration : produits et tarifs datés, ingrédients et recettes, stands et caisses, identité et réglages du lieu. |
| `routes/equipe.ts`, `routes/planning.ts` | Fiches employés, caissières, tablettes, planning, masse salariale. |
| `routes/fidelite.ts`, `routes/fidelite-caisse.ts` | Fidélité (abonnés, points lus dans les tickets, codes promo) ; à la caisse : solde, **réservation** des points et des codes plafonnés, consommation à la réception du ticket. |
| `routes/click-collect.ts`, `routes/couts-buvette.ts`, `routes/factures.ts`, `routes/export-comptable.ts` | Prix Click & Collect, coûts par stand, factures fournisseurs, export pour l'expert-comptable. |
| `routes/formation.ts` | Entrée et sortie du mode formation (lieu jumeau). |
| `routes/editeur.ts` | Back-office FlaiX Expert : parc sans montant, options, lieux et directeurs, vérification d'intégrité. |
| `outils/` | Migrations, outil d'administration du serveur (`creer-lieu`, `creer-editeur`, `nouveau-mot-de-passe`). |

## Écrans — `apps/web/src/pages`

| Dossier | Écrans |
|---|---|
| `caisse/` | Écran de caisse sur tablette (`EcranCaisse.tsx`, `FideliteCaisse.tsx`), mémoire locale et envoi des tickets (`memoire.ts`), Mes caisses, ticket client. |
| `clotures/` | Assistant de clôture, mois et année, export comptable. |
| `resultats/`, `Resultats.tsx` | Tableaux de résultats. |
| `stock/` | Stock (mise en place, pendant le match, comptage, réserve) et ingrédients. |
| `equipe/` | Fiches, planning. |
| `parametres/` | Lieu, stands et caisses, produits et prix, ingrédients et recettes, saison, journal technique (Conformité), formation, Click & Collect, coûts par buvette. |
| `fidelite/`, `factures/`, `direct/`, `editeur/` | Fidélité, factures fournisseurs, vue téléphone « En direct », back-office. |
