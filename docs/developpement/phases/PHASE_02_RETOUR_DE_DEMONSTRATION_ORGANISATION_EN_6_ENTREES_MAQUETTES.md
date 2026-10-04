# Phase 2 — Retour de démonstration, organisation en 6 entrées, maquettes

> FlaiX Expert · dossier de développement · généré le 2026-10-04 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-09-29 |
| Décision | dossier projet §15.95, §15.96, §15.98 |
| État | livrée, tests au vert au moment du commit |
| Commits | 6 |

## 1. Ce qui a été décidé, et pourquoi

### 15.95 Retour de la démonstration au directeur — trop d'informations ; encaissement sur le TPE du lieu (2026-09-29) — PROPOSITION, à valider

**Message de Rémi (verbatim, extraits)** : *« j'ai présenté la démo au directeur. Et je me suis un petit peu perdu. Je trouve qu'il y a beaucoup trop d'informations, que ça part un peu dans tous les sens. Que ce n'est pas bien structuré. […] Les clôtures doivent être dans d'autres modules, je pense qu'il faut mettre tout ce qui est résultat dans un module, tout ce qui est paramètres dans un module. Pour le moment, mon système d'encaissement ne fait aucun encaissement via Stripe, je ne gère pas les encaissements, tout est fait sur un TPE à part, à eux. »* Trois images de référence jointes (un tableau de bord d'administration, deux tableaux de bord « fitness ») : menu latéral court à icônes, quatre chiffres clés en cartes avec mini-graphique, un graphique principal, un panneau latéral avec calendrier et événements à venir, beaucoup d'espace.

**1. Encaissement — fait acté** : aucun encaissement ne passe par Stripe ni par FlaiX Expert ; le paiement carte se fait sur le **TPE bancaire du lieu, non relié**. Conséquences appliquées aux documents le jour même : `decisions-architecture-production.md` § 6 (Stripe sans objet pour la caisse), § 7 (phase Stripe retirée), § 8 point 1 ; `questions-expert-comptable.md` (contexte et question 2 réécrits) ; CLAUDE.md. Ce que la caisse faisait déjà reste juste : « carte » est déclaré par la caissière. **Proposition nouvelle, à valider** : dans la clôture, saisir le total du ticket de fin de journée du TPE de chaque caisse et l'afficher face au total carte enregistré (écart carte), ce qui couvre le risque « validé sans être payé » (§15.9 point 5, §7 du dossier). Stripe ne reste utile que pour le Click & Collect de l'application Break Eat (moteur de prix du module 13, inchangé).

**2. Diagnostic de la surcharge** : deux causes, distinctes. (a) Le prototype présenté porte beaucoup de texte de maquette (avertissements « jeu de test », références « §15.xx », sous-titres « Modules fusionnés : … ») : ce texte n'existe pas en production (§3, « trois registres »). (b) Mais même sans lui, l'organisation validée au §15.81 donne 9 sections et jusqu'à 7 sous-modules par section, et mélange dans une même section des résultats, des réglages et des clôtures (« Clôture & Pilotage » contient à la fois l'écart de caisse, les clôtures, l'optimisation et les marges). Le retour de Rémi vise juste.

**3. Organisation proposée — 6 entrées, rangées par ce que fait le directeur** :

| Entrée | Question à laquelle elle répond | Onglets | Modules validés qu'elle reprend |
|---|---|---|---|
| **Résultats** (page d'accueil) | « Comment s'est passé le match ? » | Vue d'ensemble · Ventes · Finances · Marges · Rapports de soirée | Ventes & CA (2, y compris la comparaison entre deux matchs §15.89), Gestion financière (11), Marges & ratios (5), Optimisation (6, recommandations dans l'onglet Marges), Reporting de soirée (9), Centre d'alertes (18, en encadré « À surveiller » de la vue d'ensemble, liste complète en un clic) |
| **Caisses** | « Qu'est-ce qui se vend en ce moment ? » | En direct · Tickets du match | Mes caisses (§15.73), Ma caisse (1, l'écran de vente), Journal / Tickets (3) ; l'ouverture du match du jour se fait ici |
| **Stock** | « Qu'est-ce que j'envoie, qu'est-ce qu'il reste ? » | Mise en place · Pendant le match · Comptage · Réserve & livraisons | Stock (4) |
| **Équipe** | « Qui travaille, combien ça coûte ? » | Planning · Fiches · Masse salariale | Personnel et planning (14) |
| **Clôtures** | « Est-ce que tout est bouclé et conforme ? » | Clôture du match · Mois & année · Archives & contrôle | Écart de caisse (7) et Clôture d'événement (10) réunis en un seul assistant (ventes → restes → espèces et carte → clôture), Clôtures mensuelle & annuelle (§15.85), archives et accès vérificateur de Conformité (16) |
| **Paramètres** | « Comment est réglé mon lieu ? » | Le lieu · Stands & caisses · Produits & prix · Click & Collect · Saison · Objectifs & coûts · Accès · Conformité | Identité et réglages de caisse, Gestion des stands & caisses (§15.88), Config produits (15b, avec catégories et recettes), Click & Collect (13, prix app), Calendrier des matchs, Configuration cible & marge (§15.79) et cibles par produit (§15.78), Coûts par buvette (8), comptes, journal technique et attestation (16) |
| *Plus tard* | | | Fidélité (19, 20) et Facturation (12a, 12b) : ajoutés au menu le jour où ils sont construits, pas avant |

**Retiré du menu, proposé** : « Lexique des règles » (§15.58, que Rémi avait accepté « on verra plus tard si on la garde ») — chaque écran garde son bloc « Règles » repliable, qui dit la même chose au bon endroit.

**4. Règles d'écran proposées, pour tous les modules** :
1. Un écran répond à une question. En haut, quatre chiffres au plus, avec leur évolution par rapport au match précédent ; le détail vient en dessous.
2. Une phrase de sous-titre au plus. Toute explication va dans le bloc « Règles », fermé par défaut.
3. Cinq onglets au plus par entrée du menu.
4. Aucun texte technique à l'écran : ni numéro de module, ni référence au dossier, ni nom interne.
5. Une action principale visible par écran ; les actions secondaires sont dans le détail.
6. Charte inchangée (violet FlaiX, Raleway pour les titres, Plus Jakarta Sans), mise en page reprise des références de Rémi : menu à icônes court, cartes de chiffres avec mini-graphique, un graphique principal, panneau de droite avec le calendrier des matchs.

**Statut** : proposition écrite avant tout code, maquette visuelle publiée pour Rémi. **Rien n'est modifié dans les écrans déjà construits tant que Rémi ne l'a pas validée.**

**Réponse de Rémi (2026-09-29, verbatim)** : *« ah oui beaucoup mieux, une question que verrais-tu à rajouter ? vois-tu des problèmes ? peux-tu faire encore plus moderne sur certaines stats et camembert, je reviens sur la clôture à la fin de journée sur TPE et caisse, tu peux supprimer lexique par contre conformité pas encore »*

**Décisions actées** :
1. **Organisation en 6 entrées validée** (« beaucoup mieux ») : Résultats, Caisses, Stock, Équipe, Clôtures, Paramètres.
2. **« Lexique des règles » supprimé du menu** ; chaque écran garde son bloc « Règles ».
3. **Conformité conservée** (« conformité pas encore ») : elle reste dans l'organisation (journal technique et attestation dans Paramètres, archives et accès vérificateur dans Clôtures). *Lecture retenue : ne pas la retirer. Si Rémi voulait dire « ne pas la construire tout de suite », c'est compatible : elle reste en place, construite plus tard dans l'ordre prévu.*
4. **Saisie du ticket TPE à la clôture : en attente**, Rémi y reviendra. Reste affichée dans la maquette comme proposition, rien n'est construit.
5. Demande : graphiques plus modernes (statistiques, camemberts) dans la maquette, et l'avis de Claude sur ce qu'il faudrait ajouter et sur les problèmes.

**Maquette v2.1 (2026-09-29), même lien** (`docs/maquettes/organisation-v2.html`) — ce qui a changé :
- Les 5 onglets de Résultats fonctionnent. **Vue d'ensemble** : courbe du CA par heure lissée, en dégradé, avec le match précédent en pointillé et un viseur au survol ; anneau « ventes par famille » (5 parts maximum, montant et % écrits à côté de chaque couleur) ; meilleurs produits avec barre intégrée. **Ventes** : comparaison de deux matchs au choix, écart par stand (point gris = avant, point violet = ce match). **Finances** : cascade de l'encaissé TTC jusqu'à la marge nette (TVA, matière, personnel, commission, frais, dépenses), anneau « marge nette vs cible », barre unique des moyens de paiement. **Marges** : chaque produit placé selon ses ventes et sa marge par vente (zone « à revoir » mise en évidence), avec 3 pistes chiffrées. **Rapports** : la saison match par match et la liste des rapports figés.
- Règle appliquée : pas de camembert pour 2 ou 3 valeurs proches de la moitié (une barre se lit mieux), jamais plus de 6 parts, chaque couleur toujours accompagnée de son libellé et de son montant (palette vérifiée pour les daltoniens, en clair et en sombre).
- « Lexique des règles » affiché comme supprimé ; Conformité conservée à ses deux places ; colonne « Ticket TPE » marquée « en attente de ta décision ».
- Vocabulaire : « mi-temps » remplacé par « pause » / « pic de la soirée ». Le lieu pilote est une patinoire (hockey sur glace, rapprochement fait au §15.26), où il n'y a pas de mi-temps mais deux pauses entre les tiers-temps. *Terme exact employé par l'équipe à confirmer par Rémi.*
- Tous les chiffres de la maquette sont des exemples cohérents entre eux (CA par heure = CA par stand = CA par famille = 18 640 €), jamais des données réelles.

**Avis de Claude demandé par Rémi — propositions, rien n'est décidé ni construit** :

*Problèmes, du plus grave au moins grave :*
1. **Réseau de la patinoire** (déjà signalé, `decisions-architecture-production.md` § 8 point 3) : la caisse est une page web ; si le réseau sature pendant les pauses, plus aucun ticket ne s'enregistre. C'est le premier risque avant un vrai soir de match. Le paiement carte passant par le TPE du lieu (sa propre connexion), un mode « caisse sans réseau » devient d'autant plus utile. À trancher après un test du réseau un soir de match.
2. **Premier écran vide** : la version test démarre sans aucune donnée ; un tableau de bord vide sans explication donne l'impression d'un logiciel cassé. Chaque écran doit dire quoi faire en premier (« Aucun match clos : ouvre ton premier match dans Caisses »).
3. **Marges fausses si les coûts ne sont pas saisis** : sans prix d'achat, une marge s'afficherait à 100 %. Il faut afficher « coût manquant », jamais un chiffre trompeur. Même chose pour le CA par spectateur sans nombre de spectateurs.
4. **« Carte » déclaratif** : une caissière peut taper « carte » et garder des espèces ; seul le rapprochement avec le ticket du TPE le révèle. C'est l'argument principal pour la décision en attente (Rémi tranche).
5. **Comparaison « vs match précédent »** trompeuse d'un adversaire ou d'une affluence à l'autre : d'où le choix du match de comparaison et les chiffres par spectateur.

*Ajouts proposés, par ordre d'utilité :*
1. Vue « soir de match » sur téléphone pour le directeur : CA en direct, caisses ouvertes, ruptures.
2. Rapport de soirée envoyé automatiquement par e-mail à la clôture.
3. Export mensuel pour l'expert-comptable (CA par taux de TVA et par moyen de paiement) — format à demander au comptable.
4. Alerte de rupture en direct (mise en place − ventes, par stand).

**Réponse de Rémi (2026-09-29, verbatim)** : *« Alors, les problèmes que tu vois, le réseau de la patinoire, exactement, ça, c'est un sujet sur lequel nous avons discuté. Si pendant un moment, le réseau coupe, est-ce que le système de caisse est capable d'enregistrer et de remettre à jour une fois la connexion Le premier écran sera vide je pense que le directeur aura une formation je lui expliquerai je suis d'accord avec toi il faut afficher coût manquant et jamais mettre un 100% t'inquiète pas pour le paiement par carte le directeur fait le comparaison avec les TPE et chaque ticket et pour le match au rapport précédent C'est très bien que tu puisses choisir le match à comparer. Ensuite, pour ce que tu ajouterais par ordre d'utilité, je te laisse faire ça. Ça me paraît bien. Et si tu trouves d'autres choses à mettre en place, tu peux très bien aussi te nourrir de logiciels déjà existants, comme chez Oracle Symfony, Shift tous ces logiciels de Stadium et Arena […] »*

**Décisions actées** :
1. **Coût manquant** : une marge sans prix d'achat s'affiche « coût manquant », jamais 100 %. Même règle pour tout ratio dont une donnée manque (CA par spectateur sans affluence).
2. **Premier écran vide** : Rémi formera lui-même le directeur. Les écrans vides garderont une phrase d'aide courte, sans plus.
3. **Carte** : le directeur compare déjà lui-même les TPE ticket par ticket. La colonne « Ticket TPE » à la clôture reste une proposition ouverte, sans insistance.
4. **Choix du match de comparaison** : validé.
5. **Les 4 ajouts proposés** (vue soir de match sur téléphone, rapport par e-mail à la clôture, export mensuel pour le comptable, alerte de rupture) : validés, placés par Claude dans l'ordre de construction.

**Réponse à la question du réseau — état réel du code au 2026-09-29** : la caisse **ne vend pas sans réseau** aujourd'hui. Si la connexion coupe, l'encaissement échoue avec un message ; le panier reste à l'écran et le même identifiant de ticket est réutilisé au nouvel essai (aucun doublon possible), mais on ne peut pas enchaîner les ventes. Le mode hors ligne était prévu dès le cadrage (§15.12, tests F1 à F4) et la numérotation par caisse a été conçue pour lui, mais **il n'est pas construit**. Ce qu'il demande : produits et prix du match gardés sur la tablette à l'ouverture ; tickets numérotés, scellés et conservés sur la tablette pendant la coupure ; envoi dans l'ordre au retour du réseau avec contrôle serveur (aucun numéro manquant, prix en vigueur à l'heure du ticket, aucun doublon) ; voyant « tickets en attente d'envoi » par caisse ; clôture de caisse bloquée tant que tout n'est pas envoyé. Limites : tablette perdue ou vidée pendant la coupure = tickets non envoyés perdus ; heure du ticket = horloge de la tablette pendant la coupure ; les tickets conservés sur la tablette doivent être protégés comme ceux du serveur (inaltérabilité, à couvrir par l'attestation). **Proposition de Claude : le construire avant le premier vrai match encaissé avec FlaiX — en attente du oui de Rémi.**

**Tour des logiciels de stades et d'arénas (recherche du 2026-09-29, sources publiques des éditeurs)** :
- **Oracle Simphony** (sports et spectacles) : fonctionnement hors ligne annoncé, bornes de commande, terminaux portables, commande depuis le siège, gestion des loges, fidélité, analyses. https://www.oracle.com/food-beverage/sports-entertainment/
- **Shift4 Venue (ex-VenueNext)** : les commandes hors ligne sont « stockées localement » puis envoyées au retour du réseau ; un voyant jaune signale un appareil qui a des ventes non envoyées, avec le nombre, et un rapport liste les appareils concernés ; remises soumises à l'accord d'un responsable ; touches favorites. https://support.venuenext.net/hc/en-us/articles/22494601136019-Manage-Offline-Orders-and-Transactions-in-Shift4-Venue
- **Weezevent** (France, stades et clubs) : mode hors ligne, stock en temps réel, **gobelets consignés**, export CSV, panier moyen et affluence. https://weezevent.com/fr/stades-clubs-sportifs/
- **Yellow Dog** et **ConcessionStand.ai** (stock des buvettes) : feuille de stand (comptage à l'ouverture et à la fermeture de chaque match, écart), réassort par niveau cible, pertes et offerts enregistrés, vérification avant le match, mode test pour former sans fausser les chiffres, affluence et météo notées à la clôture. https://www.yellowdogsoftware.com/stadiums · https://concessionstand.ai/features/game-day-operations/

**Ce qui est déjà couvert chez nous** : comptage ouverture/fermeture et écart (module Stock), pertes et offerts, vente à emporter via le Click & Collect Break Eat, mode école obligatoire en production (§3, décisions transverses du 2026-09-07, BOFiP §150) qui sert aussi à la formation du directeur et des caissières sans fausser les chiffres.

**Ajouts proposés par Claude (non décidés), par ordre d'utilité** : (1) mode hors ligne ci-dessus ; (2) vérification avant le match (produits, mise en place, planning, caisses et fonds, tablettes chargées) ; (3) réassort par niveau cible par stand, ou d'après le match comparable ; (4) contexte du match (adversaire, jour, affluence, note libre) pour des comparaisons justes ; (5) accord du responsable pour une remise ou un offert au-dessus d'un seuil ; (6) gobelets consignés, **si la patinoire en utilise** : touche dédiée, montant hors chiffre d'affaires, gobelets non rendus comptés (la consigne d'un emballage récupérable n'est en principe pas soumise à la TVA selon les sources comptables consultées — **à confirmer par l'expert-comptable**) ; (7) autorisations de buvette, **si la bière est vendue par dérogation** : l'article L3335-4 du code de la santé publique interdit la vente des boissons des groupes 3 à 5 dans les établissements sportifs, sauf dérogation du maire (48 h maximum, 10 par an pour une association sportive agréée) — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039650350 . FlaiX pourrait garder l'arrêté de chaque match et compter le quota. **Aucune conclusion sur la situation de la patinoire : à vérifier avec le directeur.**

**Écartés pour l'instant (disproportionnés pour une patinoire)** : gestion de loges, bornes de commande, bracelets cashless, magasins sans caisse, fidélité par segmentation automatique, ERP.

**Réponse de Rémi (2026-09-29, verbatim)** : *« Je te confirme bien pour construire la vente sans réseau avant le premier vrai match. La patinoire utilise des gobelets consignés Oui, et non. D'autres endroits peuvent les utiliser. La bière est vendue automatiquement, sans autorisation. Jette un coup d'œil aussi sur des modules et des fonctionnalités de facture électronique, de suivi de facture, de comptabilité, étape de paiement des factures que ce soit pour la patinoire qu'ils doivent payer à des fournisseurs, Dis-moi si tu as d'autres idées que tu as repéré des choses. Dans tous ces gros logiciels américains, j'ai vu aussi qu'ils utilisent des agents IA, du cloud. Est-ce qu'il est intéressant d'utiliser Starlink ? »*

**Décisions actées** :
1. **Vente sans réseau : construite avant le premier vrai match encaissé avec FlaiX** (`decisions-architecture-production.md` § 11 mis à jour). Conception écrite avant le code, tests F1 à F4 (§15.12) à écrire en premier.
2. **Gobelets consignés : option à activer lieu par lieu** (« d'autres endroits peuvent les utiliser »), désactivée par défaut. Traitement TVA de la consigne à confirmer par l'expert-comptable avant construction.
3. **Bière** : selon Rémi, vendue à la patinoire sans autorisation. **Signalé, sans conclusion** : l'article L3335-4 du code de la santé publique, tel que lu sur Légifrance le 2026-09-29, interdit la vente des boissons des groupes 3 à 5 dans les établissements d'activités physiques et sportives, sauf dérogation (alinéa 2 : installations situées dans des hôtels de tourisme ou des restaurants, accordée par l'autorité administrative ; alinéa 3 : arrêté du maire, 48 h maximum, 10 par an pour une association sportive agréée). Il peut exister un cadre que Rémi ne connaît pas (dérogation obtenue par le club ou la mairie, installation classée restaurant, bière sans alcool relevant du groupe 1). **À vérifier par le lieu auprès du club ou d'un avocat ; ni Claude ni Rémi ne sont juristes.** Aucune fonctionnalité liée tant que ce n'est pas éclairci.

**Facture électronique — faits vérifiés (sources officielles DGFiP)** :
- Fiche 1 « Que va-t-il se passer pour mon entreprise » (mise à jour juin 2026) : **réception obligatoire pour toutes les entreprises depuis le 1er septembre 2026** ; émission obligatoire au 1er septembre 2026 pour les grandes entreprises et ETI, **au 1er septembre 2027 pour les PME et micro-entreprises**. Émission, transmission et réception passent par une **plateforme agréée** (liste sur impots.gouv.fr). https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiche-1_que-va-t-il-se-passer-pour-mon-entreprise.pdf
- Guide pratique de démarrage (DGFiP, juillet 2026) : e-reporting (données de transaction et, dans certains cas, de paiement) transmis par la plateforme agréée, même calendrier que l'émission (PME : septembre 2027) ; distinction rejet par une plateforme / refus motivé par l'acheteur ; pas de sanction automatique au démarrage si la mise en conformité est engagée et documentée ; éviter doubles paiements et doubles comptabilisations. Périodicités et données exactes renvoyées aux articles 242 nonies M à P de l'annexe II au CGI — **non lus à ce stade**. https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf
- Conséquence pour la patinoire, **à vérifier avec son comptable** : elle devrait déjà pouvoir recevoir ses factures fournisseurs par une plateforme agréée ; ses ventes aux particuliers (buvette) relèveraient de l'e-reporting à partir de septembre 2027 si c'est une PME assujettie à la TVA.

**Logiciels de factures fournisseurs regardés** : MarginEdge (saisie des factures ligne par ligne par apprentissage automatique puis vérification humaine, circuits de validation, paiement des factures), Restaurant365 (comptabilité, fournisseurs, stock et recettes reliés ; écarts de prix sur facture), Ottimate (lecture automatique des factures, validation, paiement). https://www.marginedge.com/blog/marginedge-vs-restaurant365-for-independent-restaurant-operators · https://nxtedge.net/expert-comparison-of-top-restaurant-inventory-software-nxtedge-marginedge-and-plateiq-2/

**IA dans les grands logiciels** : Oracle ajuste les stocks selon la billetterie, le type d'événement et l'historique ; Toast (ToastIQ) prévoit les ventes et le personnel ; l'aréna Co-op Live (Manchester) relie caisse et finances (rapprochement, budget, prévision). https://www.stocktitan.net/news/ORCL/co-op-live-sets-the-stage-for-connected-operations-with-oracle-cloud-6snd141yq4v6.html · https://www.usecarly.com/blog/toast-pos-ai/

**Starlink** : kit autour de 369 €, abonnements résidentiels de 35 à 65 € par mois, offres professionnelles à part, sans engagement, **vue dégagée du ciel obligatoire** (antenne sur le toit) — prix relevés sur jechange.fr (page du 22/09/2026), à confirmer sur starlink.com. https://www.jechange.fr/telecom/starlink

**Propositions de Claude (non décidées)** :
- **Nouveau module « Factures »** (remplace « Facturation » dans « Plus tard ») : fiches fournisseurs ; factures reçues par la plateforme agréée du lieu (FlaiX s'y raccorde, il n'en devient pas une) et, pendant la transition, PDF ou photo ; statuts (reçue, à valider, validée, refusée avec motif, payée) ; rapprochement avec les livraisons de Stock (quantités, prix unitaire qui a changé) ; mise à jour automatique du coût d'achat après validation, ce qui supprime les « coût manquant » ; échéancier et relances ; **fichier de virements groupés à importer dans la banque** — FlaiX ne déplace jamais d'argent lui-même ; export pour l'expert-comptable (ventes par jour, taux de TVA et moyen de paiement ; achats) ; plus tard, factures aux clients professionnels (partenaires, privatisations) avant l'échéance de septembre 2027, et e-reporting des ventes de la buvette.
- **IA, dans cet ordre et seulement en suggestion validée par le directeur** : (1) lecture des factures PDF ou photo — inutile pour les factures électroniques, qui arrivent déjà en données ; (2) prévision de la mise en place d'après l'affluence attendue et les matchs comparables, après quelques matchs d'historique ; (3) question en français au tableau de bord et résumé de soirée ; (4) repérage des annulations ou remises inhabituelles. Jamais d'écriture dans le journal fiscal, jamais de prix modifié ni de paiement lancé par une IA. Tout fournisseur d'IA reçoit des données du lieu : contrat et lieu de traitement à choisir en conséquence (RGPD).
- **Cloud** : FlaiX l'est déjà (serveur en France, OVH).
- **Réseau, dans cet ordre** : vente sans réseau (décidée) ; Wi-Fi réservé aux caisses, séparé du public, sur la connexion fixe du lieu ; routeur 4G/5G de secours multi-opérateurs ; **Starlink seulement si le lieu n'a pas de connexion fixe fiable et que le réseau mobile sature pendant les matchs** — il apporte internet jusqu'au bâtiment mais ne règle pas le Wi-Fi à l'intérieur.

**Questions ouvertes pour Rémi** : la patinoire a-t-elle choisi sa plateforme agréée de réception (obligatoire depuis le 1er septembre 2026) ? Est-elle une association ou une société, et assujettie à la TVA ? Validation du module « Factures » et de sa place dans le menu.

**Réponses de Rémi (2026-09-29, verbatim)** : *« Ce sont tous des sociétés qui payent de la TVA. J'aimerais développer un peu d'intelligence artificielle. Et comme tu dis, un agent IA. Elle se nourrit seulement des données et répond à des questions. Elle ne touche rien au prix ni au stock ni à autre chose. C'est juste du renseignement. »* — *« Je n'ai aucune idée de quel système de facturation électronique les lieux utilisent pour le moment. »* — *« Tu as mon feu vert pour appliquer les six entrées dans la version. »*

**Décisions actées** :
1. **Tous les lieux sont des sociétés assujetties à la TVA.** La réforme de la facture électronique les concerne ; taille (PME ou non) à confirmer lieu par lieu avec leur comptable.
2. **Plateforme agréée des lieux : inconnue.** FlaiX ne présuppose aucune plateforme : le module Factures (encore à valider) devra pouvoir se raccorder à celle que chaque lieu choisit.
3. **Assistant IA : décidé, en lecture seule, par construction.** Il lit les données du lieu et répond aux questions ; il ne modifie rien (prix, stock, tickets, réglages). Principes de conception proposés, à valider avec la maquette : (a) l'IA ne reçoit **aucun outil d'écriture** — elle appelle une liste fermée de questions préparées côté serveur, exécutées dans une transaction PostgreSQL en lecture seule, avec l'isolement du lieu déjà en place ; jamais de requête SQL libre ; (b) **les chiffres viennent de la base, jamais de l'IA** : les totaux sont calculés par le moteur de calcul existant, la réponse cite sa source (« ventes du match n° 4 ») et dit « donnée manquante » plutôt que d'estimer ; (c) **données personnelles exclues** par défaut (noms et salaires du personnel) ; (d) réservé au directeur ; (e) chaque question posée est inscrite au journal technique (auteur, heure, questions préparées appelées).
   **Fournisseur d'IA : à choisir, rien n'est décidé.** Éléments relevés le 2026-09-29 dans des **sources secondaires** (à vérifier dans les conditions officielles avant tout choix) : Mistral AI (société française) annonce un hébergement dans l'Union européenne par défaut et l'absence d'entraînement sur les données de l'API ; l'API directe d'Anthropic (Claude) n'offrirait pas de résidence des données garantie dans l'UE en 2026, possible en revanche via des régions européennes d'AWS Bedrock ou Google Vertex. Sources : https://www.donneespersonnelles.fr/mistral-rgpd · https://sonomos.ai/blog/claude-eu-data-residency-2026/ · https://formation-claude-ia.fr/en/blog/where-claude-data-is-hosted/
4. **Feu vert pour appliquer les 6 entrées** dans la version test (§15.96).

### 15.96 Application de l'organisation en 6 entrées dans la version test (2026-09-29)

Décision écrite avant le code. Organisation validée au §15.95, feu vert de Rémi ci-dessus. **Ce qui change, écran par écran — tout déplacement d'un module validé est annoncé ici** :

- **Menu** : Résultats · Caisses · Stock · Équipe · Clôtures · Paramètres, sans sous-menus dépliants ; en bas, « Plus tard : Fidélité · Facturation ». Stock et Équipe restent marqués « à venir » (non construits en production). Le « Lexique des règles » disparaît du menu (il n'avait jamais été construit en production).
- **Résultats** (page d'accueil) : les tableaux de résultats ne sont pas encore construits ; la page affiche honnêtement « à venir » et reprend **la mise en route du lieu** (ex-« Démarrage du lieu », §12 des décisions d'architecture), qui quitte le menu. Aucun chiffre inventé.
- **Caisses** (ex-« Mes caisses ») : ajout d'un bloc « Match du jour » qui permet **d'ouvrir le match** (action déplacée depuis le calendrier) ; onglets renommés « En direct » et « Tickets du match ». Le reste est inchangé.
- **Clôtures** (nouvelle page) : onglet « Clôture du match » qui porte **la clôture définitive du match** (action déplacée depuis le calendrier, avec la même confirmation et la même règle : toutes les caisses doivent être clôturées) et la liste des matchs clos ; onglets « Mois & année » et « Archives & contrôle » marqués « à venir ». L'assistant en 4 étapes (écart de caisse, restes comptés) viendra avec le module Clôtures.
- **Paramètres** (nouvelle page d'accueil des réglages, en tuiles) : Le lieu, Stands & caisses, Produits & prix, Saison, Conformité (construits) ; Click & Collect, Objectifs & coûts, Accès (à venir). Les écrans existants changent d'adresse (`/parametres/...`) et de titre : « Identité du lieu » → « Le lieu », « Gestion des stands & caisses » → « Stands & caisses », « Config produits » → « Produits & prix », « Calendrier des matchs » → « Saison », « Journal technique » reste le titre de l'écran Conformité.
- **Saison** (ex-« Calendrier des matchs ») : on y crée et modifie les matchs et le nombre de spectateurs ; les boutons d'ouverture et de clôture sont remplacés par des liens vers Caisses et Clôtures.
- **API, base de données, règles de calcul et journaux : inchangés.** Seuls l'organisation des écrans, les adresses, les titres et les liens changent.

**Réalisé le 2026-09-29, avec trois ajustements signalés** :
1. L'ouverture du match dans Caisses demande **une confirmation** (« Confirmer l'ouverture »), parce qu'elle est définitive ; le calendrier n'en demandait pas.
2. Sans match ouvert ni clos, Caisses affiche par défaut **le prochain match à venir** (auparavant : le premier de la liste, qui pouvait être le plus lointain).
3. Le fil d'Ariane « Paramètres » des écrans de réglage est cliquable et ramène aux tuiles.

**Vérifié** : vérification des types et construction de l'application sans erreur ; 102 tests passent (50 moteur de calcul, 52 API). Parcours complet dans le navigateur sur un lieu d'essai **local** (base de développement, adresse fictive, aucune donnée réelle) : mise en route 4/5 sur Résultats ; tuiles de Paramètres avec leurs compteurs ; Saison sans boutons d'ouverture ni de clôture ; ouverture du match depuis Caisses avec confirmation ; vente de 7,00 € par carte (ticket 2026-C2-000001) ; Clôtures refuse la clôture tant qu'une caisse est ouverte (bouton grisé, message) ; clôture de la caisse puis clôture définitive du match depuis Clôtures ; le match passe dans « Matchs clos ». Le journal technique trace chaque étape (match ouvert, ouverture de caisse, clôture de caisse, match clos). **En attente de la validation visuelle de Rémi.**

### 15.98 Maquette de l'assistant IA en lecture seule (2026-09-29)

Demande de Rémi : *« Ensuite, tu prépareras cette maquette. »* Maquette ajoutée à celle de l'organisation (v2.2, même lien) : un bouton « Demander à FlaiX » dans le menu et en tête de Résultats ouvre un panneau latéral marqué **« Lecture seule »**, avec trois exemples de questions et une conversation d'exemple, tous cohérents avec les chiffres de la maquette :
1. **Comparaison de deux matchs** (« Quel stand a le plus progressé ? ») : réponse chiffrée, petit tableau, **sources citées** (ventes des matchs n° 3 et n° 4).
2. **Explication avec donnée manquante** (« Pourquoi la marge est sous la cible ? ») : les chiffres disponibles, puis **« Je ne peux pas dire lequel a augmenté : les coûts du match précédent ne sont pas saisis »** — l'assistant dit ce qu'il ne sait pas au lieu d'estimer.
3. **Refus d'agir** (« Augmente la bière 25 cl de 50 centimes ») : « Je ne peux rien modifier », renvoi vers Paramètres → Produits & prix, puis l'information utile pour décider (+156 € par match à volume égal).
Pied du panneau : chiffres issus de la base avec leur source, noms et salaires du personnel exclus, chaque question inscrite au journal technique, fournisseur d'IA à choisir. **En attente de la validation de Rémi ; rien n'est construit dans l'application.**

## 2. Ce qui a été construit — commits

- [`9c7d7a9`](https://github.com/Break-Eat-APP/flaix-expert/commit/9c7d7a9cfac6576334b90a7f9fa4c400247d340b) — 2026-09-29 — Retour de démonstration : encaissement sur le TPE du lieu, proposition de réorganisation
- [`0ef6cf1`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ef6cf1642dc15da9025d83ffadf1499006a4072) — 2026-09-29 — Maquette v2.1 : graphiques de Résultats modernisés, Lexique supprimé, avis consigné
- [`26237fc`](https://github.com/Break-Eat-APP/flaix-expert/commit/26237fc761668dc3febbef1056001ddf8b472018) — 2026-09-29 — Dossier §15.95 : réponses de Rémi, réseau de la caisse, tour des logiciels de stades
- [`0219e7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/0219e7e9bc8049916b4296e348f738e4c586ac9d) — 2026-09-29 — Vente sans réseau décidée, gobelets en option, facture électronique et module Factures proposé
- [`6f272dd`](https://github.com/Break-Eat-APP/flaix-expert/commit/6f272ddafe23fd7a7aadc1863c7f2e69675e49d7) — 2026-09-29 — Organisation en 6 entrées appliquée à la version test
- [`c3c6168`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3c616893e44194563a4b7cdca5c11ce674c18db) — 2026-09-29 — Maquette v2.2 : assistant IA en lecture seule (dossier §15.98)

## 3. Fichiers, par couche

### Écrans (apps/web)

- `apps/web/src/App.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/App.tsx)
- `apps/web/src/composants/communs.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/composants/communs.tsx)
- `apps/web/src/composants/Coquille.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/composants/Coquille.tsx)
- `apps/web/src/pages/caisse/EcranCaisse.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/caisse/EcranCaisse.tsx)
- `apps/web/src/pages/caisse/MesCaisses.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/caisse/MesCaisses.tsx)
- `apps/web/src/pages/clotures/Clotures.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/clotures/Clotures.tsx)
- `apps/web/src/pages/Demarrage.tsx` — supprimé (n'existe plus)
- `apps/web/src/pages/parametres/Identite.tsx` — renommé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/Identite.tsx)
- `apps/web/src/pages/parametres/JournalTechnique.tsx` — renommé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/JournalTechnique.tsx)
- `apps/web/src/pages/parametres/Parametres.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/Parametres.tsx)
- `apps/web/src/pages/parametres/Produits.tsx` — renommé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/Produits.tsx)
- `apps/web/src/pages/parametres/Saison.tsx` — renommé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/Saison.tsx)
- `apps/web/src/pages/parametres/StandsCaisses.tsx` — renommé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/parametres/StandsCaisses.tsx)
- `apps/web/src/pages/Resultats.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/pages/Resultats.tsx)
- `apps/web/src/styles.css` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/apps/web/src/styles.css)

### Documentation

- `CLAUDE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/CLAUDE.md)
- `docs/decisions-architecture-production.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/docs/decisions-architecture-production.md)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/docs/flaix-gestion-dossier-projet.md)
- `docs/maquettes/organisation-v2.html` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/docs/maquettes/organisation-v2.html)
- `docs/questions-expert-comptable.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/c3c616893e44194563a4b7cdca5c11ce674c18db/docs/questions-expert-comptable.md)

## 4. Tests créés dans cette phase

Aucun fichier de test créé dans cette phase (les tests modifiés figurent dans la section 3).

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
