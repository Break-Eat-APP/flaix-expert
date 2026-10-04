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

## Fonctions et routes clés — ligne exacte

> Lignes relevées sur le commit [`b6bb919`](https://github.com/Break-Eat-APP/flaix-expert/commit/b6bb919a85b17c60f159741648473bf5a37f1ad2) ; le lien GitHub pointe sur ce commit, le lien local sur le fichier actuel.

| Sujet | Fichier | Symbole | Ligne |
|---|---|---|---|
| Scellement | `packages/domain/src/chaine.ts` | `jsonCanonique` | [45](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/chaine.ts#L45) · [local](../../packages/domain/src/chaine.ts) |
| Scellement | `packages/domain/src/chaine.ts` | `calculerEmpreinte` | [35](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/chaine.ts#L35) · [local](../../packages/domain/src/chaine.ts) |
| Scellement | `packages/domain/src/chaine.ts` | `verifierChaine` | [74](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/chaine.ts#L74) · [local](../../packages/domain/src/chaine.ts) |
| Scellement | `packages/domain/src/journal-caisse.ts` | `champsScellesCaisse` | [30](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/journal-caisse.ts#L30) · [local](../../packages/domain/src/journal-caisse.ts) |
| Scellement | `packages/domain/src/journal-caisse.ts` | `empreinteCaisse` | [49](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/journal-caisse.ts#L49) · [local](../../packages/domain/src/journal-caisse.ts) |
| Vente sans réseau | `packages/domain/src/caisse-scellee.ts` | `scellerVente` | [235](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-scellee.ts#L235) · [local](../../packages/domain/src/caisse-scellee.ts) |
| Vente sans réseau | `packages/domain/src/caisse-scellee.ts` | `scellerAnnulation` | [254](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-scellee.ts#L254) · [local](../../packages/domain/src/caisse-scellee.ts) |
| Vente sans réseau | `packages/domain/src/caisse-scellee.ts` | `controlerEvenementTablette` | [278](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-scellee.ts#L278) · [local](../../packages/domain/src/caisse-scellee.ts) |
| Vente sans réseau | `packages/domain/src/caisse-scellee.ts` | `apercuFidelite` | [211](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/caisse-scellee.ts#L211) · [local](../../packages/domain/src/caisse-scellee.ts) |
| Calcul du ticket | `packages/domain/src/ticket.ts` | `calculerTicket` | [104](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/ticket.ts#L104) · [local](../../packages/domain/src/ticket.ts) |
| Calcul du ticket | `packages/domain/src/ticket.ts` | `erreurAjustement` | [154](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/ticket.ts#L154) · [local](../../packages/domain/src/ticket.ts) |
| Calcul du ticket | `packages/domain/src/ticket.ts` | `numeroJustificatif` | [173](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/ticket.ts#L173) · [local](../../packages/domain/src/ticket.ts) |
| Journal technique | `packages/domain/src/journal-technique.ts` | `TYPES_JET` | [8](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/journal-technique.ts#L8) · [local](../../packages/domain/src/journal-technique.ts) |
| Journal technique | `apps/api/src/journal-technique.ts` | `inscrireJet` | [30](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/journal-technique.ts#L30) · [local](../../apps/api/src/journal-technique.ts) |
| Journal technique | `apps/api/src/journal-technique.ts` | `verifierJet` | [99](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/journal-technique.ts#L99) · [local](../../apps/api/src/journal-technique.ts) |
| Journal de caisse | `apps/api/src/journal-caisse.ts` | `inscrireEvenementTablette` | [128](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/journal-caisse.ts#L128) · [local](../../apps/api/src/journal-caisse.ts) |
| Journal de caisse | `apps/api/src/journal-caisse.ts` | `verifierCaisses` | [189](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/journal-caisse.ts#L189) · [local](../../apps/api/src/journal-caisse.ts) |
| Base et isolement | `apps/api/src/base.ts` | `transaction` | [20](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/base.ts#L20) · [local](../../apps/api/src/base.ts) |
| Base et isolement | `apps/api/src/base.ts` | `changerLieu` | [54](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/base.ts#L54) · [local](../../apps/api/src/base.ts) |
| Base et isolement | `apps/api/src/base.ts` | `verrouiller` | [59](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/base.ts#L59) · [local](../../apps/api/src/base.ts) |
| Accès | `apps/api/src/auth/contexte.ts` | `exigerSession` | [32](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/auth/contexte.ts#L32) · [local](../../apps/api/src/auth/contexte.ts) |
| Accès | `apps/api/src/auth/contexte.ts` | `exigerAccesCaisse` | [53](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/auth/contexte.ts#L53) · [local](../../apps/api/src/auth/contexte.ts) |
| Accès | `apps/api/src/auth/contexte.ts` | `exigerDirecteur` | [64](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/auth/contexte.ts#L64) · [local](../../apps/api/src/auth/contexte.ts) |
| Formation | `apps/api/src/serveur.ts` | `CONFIGURATION` | [38](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/serveur.ts#L38) · [local](../../apps/api/src/serveur.ts) |
| Caisse (serveur) | `apps/api/src/routes/caisse.ts` | `/api/caisses/:id/journal` | [578](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/caisse.ts#L578) · [local](../../apps/api/src/routes/caisse.ts) |
| Caisse (serveur) | `apps/api/src/routes/caisse.ts` | `/api/caisses/:id/ouverture` | [490](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/caisse.ts#L490) · [local](../../apps/api/src/routes/caisse.ts) |
| Caisse (serveur) | `apps/api/src/routes/caisse.ts` | `/api/caisses/:id/cloture` | [766](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/caisse.ts#L766) · [local](../../apps/api/src/routes/caisse.ts) |
| Caisse (serveur) | `apps/api/src/routes/caisse.ts` | `insererLignes` | [316](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/caisse.ts#L316) · [local](../../apps/api/src/routes/caisse.ts) |
| Clôtures | `apps/api/src/routes/evenements.ts` | `/api/evenements/:id/cloture` | [141](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/evenements.ts#L141) · [local](../../apps/api/src/routes/evenements.ts) |
| Clôtures | `apps/api/src/routes/periodes.ts` | `zDuMatch` | [206](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/periodes.ts#L206) · [local](../../apps/api/src/routes/periodes.ts) |
| Clôtures | `apps/api/src/routes/periodes.ts` | `verifierClotures` | [313](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/periodes.ts#L313) · [local](../../apps/api/src/routes/periodes.ts) |
| Stock | `packages/domain/src/stock.ts` | `cump` | [32](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/stock.ts#L32) · [local](../../packages/domain/src/stock.ts) |
| Stock | `packages/domain/src/stock.ts` | `alerteStock` | [21](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/stock.ts#L21) · [local](../../packages/domain/src/stock.ts) |
| Stock | `packages/domain/src/stock.ts` | `suggestionMiseEnPlace` | [38](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/stock.ts#L38) · [local](../../packages/domain/src/stock.ts) |
| Stock | `apps/api/src/routes/stock.ts` | `stockDuMatch` | [82](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock.ts#L82) · [local](../../apps/api/src/routes/stock.ts) |
| Stock | `apps/api/src/routes/stock.ts` | `restesDuMatch` | [208](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock.ts#L208) · [local](../../apps/api/src/routes/stock.ts) |
| Stock des ingrédients | `apps/api/src/routes/stock-ingredients.ts` | `stockIngredientsDuMatch` | [117](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock-ingredients.ts#L117) · [local](../../apps/api/src/routes/stock-ingredients.ts) |
| Stock des ingrédients | `apps/api/src/routes/stock-ingredients.ts` | `figerConsommationIngredients` | [70](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/stock-ingredients.ts#L70) · [local](../../apps/api/src/routes/stock-ingredients.ts) |
| Recettes | `apps/api/src/routes/recettes.ts` | `recalculerCoutsRecettes` | [61](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/recettes.ts#L61) · [local](../../apps/api/src/routes/recettes.ts) |
| Recettes | `apps/api/src/routes/recettes.ts` | `aUneRecette` | [80](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/recettes.ts#L80) · [local](../../apps/api/src/routes/recettes.ts) |
| Click & Collect | `packages/domain/src/click-collect.ts` | `prixAppExact` | [56](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/click-collect.ts#L56) · [local](../../packages/domain/src/click-collect.ts) |
| Click & Collect | `packages/domain/src/click-collect.ts` | `resteApp` | [78](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/click-collect.ts#L78) · [local](../../packages/domain/src/click-collect.ts) |
| Click & Collect | `packages/domain/src/click-collect.ts` | `cascadeEncaissement` | [108](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/click-collect.ts#L108) · [local](../../packages/domain/src/click-collect.ts) |
| Fidélité | `packages/domain/src/fidelite.ts` | `remiseCodePromo` | [53](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/fidelite.ts#L53) · [local](../../packages/domain/src/fidelite.ts) |
| Fidélité | `packages/domain/src/fidelite.ts` | `etatCodePromo` | [45](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/fidelite.ts#L45) · [local](../../packages/domain/src/fidelite.ts) |
| Fidélité | `packages/domain/src/fidelite.ts` | `pointsDuTicket` | [23](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/fidelite.ts#L23) · [local](../../packages/domain/src/fidelite.ts) |
| Fidélité à la caisse | `apps/api/src/routes/fidelite-caisse.ts` | `soldePoints` | [50](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/fidelite-caisse.ts#L50) · [local](../../apps/api/src/routes/fidelite-caisse.ts) |
| Fidélité à la caisse | `apps/api/src/routes/fidelite-caisse.ts` | `consommerFidelite` | [232](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/fidelite-caisse.ts#L232) · [local](../../apps/api/src/routes/fidelite-caisse.ts) |
| Fidélité à la caisse | `apps/api/src/routes/fidelite-caisse.ts` | `/api/caisses/:id/fidelite/points` | [136](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/fidelite-caisse.ts#L136) · [local](../../apps/api/src/routes/fidelite-caisse.ts) |
| Fidélité à la caisse | `apps/api/src/routes/fidelite-caisse.ts` | `/api/caisses/:id/fidelite/codes` | [159](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/fidelite-caisse.ts#L159) · [local](../../apps/api/src/routes/fidelite-caisse.ts) |
| Back-office | `apps/api/src/routes/editeur.ts` | `exigerEditeur` | [54](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/editeur.ts#L54) · [local](../../apps/api/src/routes/editeur.ts) |
| Back-office | `apps/api/src/routes/editeur.ts` | `/api/editeur/lieux` | [215](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/editeur.ts#L215) · [local](../../apps/api/src/routes/editeur.ts) |
| Back-office | `apps/api/src/routes/editeur.ts` | `/api/editeur/lieux/:id/verification` | [265](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/api/src/routes/editeur.ts#L265) · [local](../../apps/api/src/routes/editeur.ts) |
| Options | `packages/domain/src/editeur.ts` | `optionDeLaRoute` | [97](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/editeur.ts#L97) · [local](../../packages/domain/src/editeur.ts) |
| Options | `packages/domain/src/editeur.ts` | `OPTIONS_LIEU` | [85](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/editeur.ts#L85) · [local](../../packages/domain/src/editeur.ts) |
| Mots de passe | `packages/domain/src/mot-de-passe.ts` | `refusMotDePasse` | [26](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/packages/domain/src/mot-de-passe.ts#L26) · [local](../../packages/domain/src/mot-de-passe.ts) |
| Tablette | `apps/web/src/pages/caisse/memoire.ts` | `memoriserTicket` | [101](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/memoire.ts#L101) · [local](../../apps/web/src/pages/caisse/memoire.ts) |
| Tablette | `apps/web/src/pages/caisse/memoire.ts` | `envoyer` | [124](https://github.com/Break-Eat-APP/flaix-expert/blob/b6bb919a85b17c60f159741648473bf5a37f1ad2/apps/web/src/pages/caisse/memoire.ts#L124) · [local](../../apps/web/src/pages/caisse/memoire.ts) |
