# Carte du code — où trouver quoi (FlaiX Expert)

> Généré par `node infra/outils/journal-developpement.cjs` : cette introduction vient de `infra/outils/carte-du-code-intro.md`, le tableau des lignes est recalculé à chaque génération.
> **Nouveau sur le projet ? Commence par [`GUIDE_DE_REPRISE.md`](GUIDE_DE_REPRISE.md).** Règles du projet : [`AGENTS.md`](../../AGENTS.md). Ordre de construction : [`JOURNAL_DES_PHASES.md`](JOURNAL_DES_PHASES.md), une fiche par phase dans [`phases/`](phases/README.md). Décisions : `docs/flaix-gestion-dossier-projet.md` (§15.x).

## Organisation

| Dossier | Contenu | Règle |
|---|---|---|
| `packages/domain/src` | Moteur de calcul **pur** (aucune base, aucun réseau), partagé par le serveur ET la tablette. | Montants en **centimes entiers**, taux en **points de base** (1000 = 10 %), emballages en **millimes**, températures en **dixièmes de degré**. Un calcul fait foi ici et seulement ici. |
| `apps/api/src` | Serveur Fastify : droits, règles, accès à PostgreSQL. | Toute requête métier passe par `base.transaction(contexte(auth), …)` : la sécurité par ligne isole les lieux. |
| `apps/web/src` | Écrans React (directeur, caisse sur tablette, téléphone, back-office `/editeur`). | Jamais de règle métier dupliquée : l'écran appelle le moteur ou le serveur. |
| `db/migrations` | Schéma PostgreSQL versionné (`0001` → `0058`). | Une migration appliquée **ne se modifie jamais**. Droits, sécurité par ligne, déclencheurs d'écriture seule et fonctions du mode formation y sont définis. |
| `apps/api/test`, `packages/domain/src/*.test.ts`, `apps/web/src/**/*.test.tsx` | Tests contre la vraie base, tests du moteur, tests des écrans (serveur simulé). | Les tests **[F]** provoquent la fraude et vérifient que la base la refuse. |
| `infra/` | Docker local, scripts du serveur OVH (`vps/deployer.sh`, `vps/flaix-admin.sh`), outils (logo, icônes, journal, fiches de phase). | Les secrets restent sur le serveur, jamais dans le dépôt. |
| `docs/` | Dossier projet, décisions d'architecture, conformité, questions à l'expert-comptable, guide du serveur, suivi du développement. | Décision écrite avant code. |

## Serveur — `apps/api/src`

| Fichier | Rôle |
|---|---|
| `base.ts` | Connexion à PostgreSQL, `transaction` (pose `app.lieu_id` et `app.utilisateur_id` : la sécurité par ligne isole les lieux), `changerLieu`, `verrouiller`. |
| `auth/` | Sessions (cookie `fx_session`), tablettes enregistrées (`fx_appareil`), codes des caissières, mots de passe (argon2id), `exigerDirecteur`, `exigerAccesCaisse`. |
| `journal-technique.ts` | `inscrireJet` : journal technique chaîné par lieu (toute modification de paramétrage y est inscrite ; types dans `packages/domain/src/journal-technique.ts`), `verifierJet`. |
| `journal-caisse.ts` | Chaîne de chaque caisse (ouverture, ventes, annulations, clôture) et sa vérification. |
| `serveur.ts` | Assemblage des routes, protection intersite, options par lieu, liste `CONFIGURATION` (routes en lecture seule en mode formation). |
| `options.ts` | Options activées par lieu depuis le back-office (absence de réglage = active). |
| `routes/outils.ts` | Briques communes : schémas zod (`Uuid`, `texte`…), `contexte`, `corps`, `differences`. |
| `routes/caisse.ts` | Ouverture et clôture de caisse, **réception des tickets scellés par la tablette** (`POST /api/caisses/:id/journal`), ticket client et duplicata, tableau des caisses. |
| `routes/evenements.ts` | Événements : création, ouverture, **clôture** (Z des tiroirs, coffre, comptage du stock, consommation des ingrédients, Z du match, rapport de soirée), **suppression d'un événement à venir** (§15.165). |
| `routes/clotures.ts`, `routes/periodes.ts` | Assistant de clôture, Z des tiroirs et du coffre, rectifications signées ; clôtures du mois et de l'exercice, total perpétuel, vérification des clôtures. |
| `routes/resultats.ts`, `routes/finances.ts`, `routes/rapport-soiree.ts` | Chiffres des événements **terminés** et des périodes, « les chiffres de la soirée » (`chiffresDeSoiree`, §15.171) ; cibles de marge, dépenses, « ce qu'il te reste » (aussi pendant l'événement, §15.170) ; rapport de soirée figé et scellé, avec le stock de la soirée (§15.131, §15.170). |
| `routes/direct.ts` | Tableau En direct de l'événement ouvert : chiffres comparés au match précédent au même moment, quarts d'heure, prévision de fin de soirée (§15.166, §15.167). |
| `routes/pertes.ts`, `routes/prevision.ts`, `routes/alertes.ts` | « Où je perds de l'argent » et temps de prise de commande (§15.138, §15.139) ; prévision (§15.143) ; centre d'alertes et rupture poussée (§15.140). |
| `routes/plan-stade.ts` | Le lieu en direct en 3D : état de chaque stand, décor, places posées à la main (§15.162 à §15.164). |
| `routes/stock.ts`, `routes/stock-ingredients.ts` | Stock des produits et des ingrédients : réserve, livraisons au coût moyen pondéré, mise en place, réassort, comptage, inventaires, **remise à zéro** (§15.165). |
| `routes/produits.ts`, `routes/recettes.ts`, `routes/emballages.ts`, `routes/stands.ts`, `routes/lieu.ts` | Configuration : produits, tarifs datés et allergènes (§15.157) ; ingrédients et recettes ; emballages, conditionnement et leur stock (§15.155, §15.158) ; stands, caisses, tribune ; identité et réglages du lieu. |
| `routes/fournisseurs.ts`, `routes/factures.ts`, `routes/couts-buvette.ts`, `routes/frais.ts` | Prix fournisseurs (§15.141) ; factures fournisseurs : rapprochement à l'unité vendue (colis), alertes, validation qui fait entrer en réserve, correspondances apprises, export zip pour le comptable (§15.172 à §15.175) ; coûts par stand ; Mes frais et « ce qu'il te reste » (§15.154). |
| `pdf-facture.ts` | Facture de vente d'un événement privé en PDF (pdf-lib), depuis son contenu scellé, pour l'export du comptable (§15.172). |
| `routes/hygiene.ts` | Hygiène & HACCP : équipements, relevés de température, réceptions, huile, tâches, photos ; écriture seule (§15.156, §15.159). |
| `routes/evenements-prives.ts` | Événements privés hors caisse, tenus par le directeur, et facture de vente scellée FP-année-numéro (§15.160). |
| `routes/equipe.ts`, `routes/planning.ts` | Fiches employés, caissières, tablettes, planning, masse salariale. |
| `routes/fidelite.ts`, `routes/fidelite-caisse.ts`, `routes/wallet.ts` | Fidélité (abonnés, points lus dans les tickets, codes promo) ; à la caisse : réservation des points et des codes ; cartes Apple et Google Wallet (§15.147, §15.148). |
| `routes/caisses-externes.ts` | Caisses connectées : ventes d'une caisse externe importées (L'Addition, Click & Collect Break Eat…), correspondances de produits, **annulation d'un import** (§15.150 à §15.152, §15.168, §15.171). |
| `routes/click-collect.ts`, `routes/export-comptable.ts` | Prix Click & Collect ; export pour l'expert-comptable. |
| `routes/notifications.ts`, `routes/emails.ts`, `routes/assistant.ts` | Notifications sur le téléphone (brief de fin de soirée, ruptures) ; e-mails par Brevo (§15.146) ; assistant IA en lecture seule (§15.136, §15.145). |
| `routes/formation.ts`, `routes/support.ts`, `routes/editeur.ts`, `routes/journal.ts` | Mode formation (lieu jumeau) ; accès du support FlaiX sur autorisation du lieu (§15.142) ; back-office FlaiX Expert ; journal technique et vérification. |
| `ia/`, `wallet/` | Passerelle vers le moteur de langage ; fabrication et signature des cartes wallet. |
| `outils/` | Migrations (`migrations.ts`, empreinte de chaque fichier), outil d'administration du serveur (`creer-lieu`, `creer-editeur`, `nouveau-mot-de-passe`). |

## Moteur — `packages/domain/src`

| Domaine | Fichiers |
|---|---|
| Caisse et conformité | `ticket.ts`, `tva.ts`, `argent.ts`, `chaine.ts`, `caisse-scellee.ts`, `journal-caisse.ts`, `caisse-auto.ts`, `especes.ts`, `cloture-periode.ts`, `journal-technique.ts` |
| Résultats et pilotage | `resultats.ts` (dont la marge par catégorie), `periode-bilan.ts`, `finances.ts`, `marge.ts`, `pertes.ts`, `temps-service.ts`, `prevision.ts`, `alertes.ts`, `brief.ts`, `rapport-soiree.ts` (dont `bilanDeStock`), `frais.ts`, `plan-stade.ts`, `direct.ts` (tableau En direct), `chiffres-soiree.ts` (conversion, moment fort, familles, Click & Collect) |
| Stock et achats | `stock.ts`, `stock-ingredients.ts`, `recettes.ts`, `emballages.ts`, `fournisseurs.ts`, `factures.ts` (dont le récapitulatif du comptable), `factures-import.ts` (lecture d'un export de facture, colis, correspondances, alertes), `couts-buvette.ts` |
| Clients et ventes annexes | `fidelite.ts`, `wallet.ts`, `click-collect.ts`, `caisses-externes.ts`, `evenements-prives.ts`, `emails.ts` |
| Divers | `modele.ts` (types partagés), `planning.ts`, `hygiene.ts`, `allergenes.ts`, `export-comptable.ts`, `csv.ts`, `mot-de-passe.ts`, `assistant.ts`, `editeur.ts` (options par lieu) |

## Écrans — `apps/web/src`

| Dossier | Écrans |
|---|---|
| `App.tsx`, `composants/Coquille.tsx`, `session.tsx`, `api.ts`, `styles.css` | Routes, menu, session et options du lieu, appels au serveur, style (clair et arrondi, §15.153). |
| `pages/caisse/` | Caisse sur tablette (`EcranCaisse.tsx`, `FideliteCaisse.tsx`, `PosteCaissiere.tsx` avec l'hygiène), mémoire locale et envoi des tickets (`memoire.ts`), Mes caisses, ticket client. |
| `pages/Resultats.tsx`, `pages/resultats/` | Résultats : vue d'ensemble au design de la 2e maquette (`Ensemble.tsx`, `ResteSoiree.tsx`, `ChiffresSoiree.tsx`), onglets (`Tableaux.tsx`), finances, « où je perds de l'argent », événements privés (`Prives.tsx`), rapport de soirée, **lieu en 3D** (`PlanStade.tsx`, `Stade3D.tsx` avec three.js chargé à part, `decors3d.ts`, `modeles-plan.ts`). |
| `pages/stock/`, `pages/ingredients/`, `pages/achats/` | Stock des produits en 4 étapes (réserve, mise en place, pendant l'événement, comptage ; remise à zéro) ; page Ingrédients ; **Achats** : factures, correspondances, livraisons, prix fournisseurs (§15.172 à §15.174). |
| `pages/clotures/` | Assistant de clôture, mois et année, export comptable. |
| `pages/parametres/` | Lieu, stands et caisses, produits et prix (allergènes, conditionnement), recettes, saison, journal technique (Conformité), formation, Click & Collect, coûts, objectifs, mes frais, notifications, e-mails, support. |
| `pages/equipe/`, `pages/hygiene/`, `pages/prives/` | Équipe et planning ; hygiène & HACCP ; événements privés et facture. |
| `pages/alertes/`, `pages/prevision/`, `pages/direct/`, `pages/caisses-connectees/` | Centre d'alertes ; prévision ; **En direct** (soirée en cours, lieu en 3D, net à la minute) ; caisses connectées (`fichiers.ts` : classeur Excel → CSV, aussi pour les factures). |
| `pages/fidelite/`, `pages/carte/`, `pages/factures/`, `pages/editeur/`, `pages/Assistant.tsx` | Fidélité et design de la carte wallet ; page publique de la carte ; factures fournisseurs (saisie, import d'un fichier, alertes, export, affichées dans Achats) ; back-office ; assistant. |
