# FlaiX Expert — Intelligence, prévision et décision

**Analyse et propositions — version 1 du 4 octobre 2026**
Éditeur : Break Eat App. Document de travail, à partir de la note produit de Rémi (rédigée avec ChatGPT) et d'une recherche sur le marché.

## 1. En bref

- La direction proposée par la note est la bonne : **expliquer, prévoir, recommander, puis mesurer si la recommandation a marché**. C'est ce qui manque aux logiciels de caisse classiques.
- Mais la note est écrite pour un grand stade américain (128 000 € de chiffre d'affaires par match, zones, capteurs, caméras). Une buvette de patinoire ou de stade français, c'est quelques milliers de spectateurs, 3 à 6 buvettes et 15 à 25 soirées par saison : il faut une version **réaliste avec les données qui existent vraiment**.
- **Notre avantage décisif : FlaiX Expert est la caisse.** Chaque ticket est connu à la seconde, par caisse et par caissière, scellé et contrôlé. Les grands acteurs de l'« intelligence » doivent se brancher sur la caisse de quelqu'un d'autre.
- En France, nous n'avons trouvé **aucun logiciel pour buvettes de stade ou de patinoire** qui réunisse caisse certifiée, gestion financière de la soirée et prévision. C'est le créneau.
- Décision de Rémi du 4 octobre 2026 : on commence par **le brief de fin de soirée et l'assistant** (« pose ta question »).

## 2. La note produit : ce qui est juste, ce qui ne tient pas

**Ce qui est juste**

- La boucle *recommandation → action → résultat → apprentissage* : c'est elle qui prouve la valeur du logiciel, événement après événement.
- Les garde-fous : pas de score arbitraire, pas de prévision sans niveau de confiance, chaque recommandation explique son origine, validation humaine des décisions sensibles. Ce sont déjà les règles de FlaiX Expert (« coût manquant » plutôt qu'un chiffre inventé, journal de chaque action).
- Ne pas tout reconstruire : rester une couche d'intelligence qui s'appuie sur l'existant (billetterie, TPE, application de commande).

**Ce qui ne tient pas, ou pas encore**

| Point de la note | Pourquoi | Ce que nous proposons |
| --- | --- | --- |
| Files d'attente, flux par zone, jumeau numérique | Demandent des caméras ou capteurs que les lieux n'ont pas | Mesurer la saturation **par la caisse elle-même** (rythme de tickets) |
| Prévisions « à 97 % » | Chiffres d'éditeurs de chaînes de restaurants, avec des milliers de services | Prévision **en fourchette**, qui s'affine au fil des soirées |
| « Ne pas remplacer le POS » | FlaiX Expert **est** la caisse certifiée | En faire l'argument principal : la donnée est à la source |
| Trois produits (Ops, Expert, Autopilot) | Bon discours commercial, trop tôt pour le logiciel | Un seul produit, trois niveaux : observer, recommander, exécuter |
| Comparaison entre stades (benchmark) | Il faut plusieurs clients, des contrats et une anonymisation solide | Plus tard ; d'abord la comparaison du lieu avec lui-même |
| Note globale sur 100 | Risque de chiffre arbitraire (la note le reconnaît) | Plus tard, quand chaque composante sera mesurée |

## 3. Le marché : ce que font les autres

| Acteur | Pour qui | Ce qu'il fait | Limite pour nos clients |
| --- | --- | --- | --- |
| Oracle Simphony | Grands stades et arènes | Caisse ; stock ajusté selon la billetterie, le type d'événement et l'historique ; assistant d'aide en caisse | Lourd, cher, pensé pour les très grandes enceintes |
| Shift4 / VenueNext ; SpotOn / Appetize | Stades américains | Caisse, application, paiement ; marché en concentration (rachats) | Pas de présence ni de conformité françaises |
| Nory | Chaînes de restaurants | Agents de prévision, planning, commandes ; résultats annoncés par l'éditeur : jusqu'à −20 % de coûts | Pas de caisse ; pas fait pour 20 soirées par an |
| WaitTime, Safari AI | Grands stades | Caméras qui mesurent les files d'attente | Matériel et coût importants |
| Mercedes-Benz Stadium (AiFi, GS Draft) | Un grand stade | Bière en libre-service, caméras et tireuses connectées | Vitrine technologique, hors de portée d'une buvette de club |

Bilan honnête publié par Nory lui-même : la prévision, le planning et les commandes donnent de vrais résultats ; la voix, les robots et le marketing par IA relèvent encore surtout du discours.

## 4. Propositions, réalistes pour nos lieux

| Proposition | Ce que ça apporte | Données nécessaires | Quand |
| --- | --- | --- | --- |
| **Brief de fin de soirée** (téléphone) et brief de veille | Les 3 points qui comptent, écrits en clair, sans ouvrir le logiciel | Celles de FlaiX Expert | Étape 1 (choix de Rémi) |
| **Assistant « pose ta question »** | « Pourquoi la marge a baissé en septembre ? » — réponse qui cite toujours la soirée, la période et les chiffres utilisés | Celles de FlaiX Expert | Étape 1 (choix de Rémi) |
| **Où je perds de l'argent** | Ventes perdues par rupture (en fourchette), écarts de stock et d'espèces, produits sous leur cible | Celles de FlaiX Expert | Étape 2 |
| **Saturation mesurée par la caisse** | Quand le rythme de tickets d'une caisse plafonne à la mi-temps, la file déborde : pression par stand en direct, ventes perdues estimées | Celles de FlaiX Expert, aucun matériel | Étape 2 |
| **Rapprochement TPE ↔ tickets carte** | Chaque « carte » déclarée mais non encaissée est trouvée : le risque de fraude n° 1 d'une buvette | Relevé du TPE (ou natif avec le futur TPE Android + Stripe) | Dès qu'un relevé est disponible |
| **Prévision du prochain événement** | Mise en place par produit et par stand, personnel à prévoir, en fourchette | Affluence prévue, adversaire, jour, heure, vacances, météo | Étape 3 |
| **Débitmètres sur les tireuses** | Litres tirés contre litres vendus en direct : la première perte d'une buvette | Petit matériel par tireuse | Partenaire à choisir |

## 5. Quelle intelligence, pour quoi

- **Les chiffres ne viennent jamais d'une IA qui rédige du texte.** Les prévisions viennent de modèles statistiques classiques, qui donnent une fourchette et se vérifient.
- **Les mots** (expliquer, résumer, répondre aux questions, rédiger le brief) viennent d'un modèle de langage par API. Candidats : **Claude** (Anthropic) et **Mistral** (entreprise française, hébergement en Europe, argument de souveraineté auprès des clubs). L'auteur de ce document est lui-même Claude : la comparaison doit être faite par Rémi, sur un essai réel.
- **Les « agents »** : des programmes qui lisent les données de FlaiX Expert en lecture seule, citent leurs sources et proposent. **Ils ne font rien sans validation**, et toute action validée est inscrite au journal technique.
- **Rien n'écrit dans la chaîne de caisse.** Les tickets, les clôtures et le journal restent hors de portée de l'IA (exigence de la certification de caisse).

## 6. Cadre juridique — faits à faire valider par l'avocat

- **Règlement européen sur l'IA, article 50** (en vigueur depuis le 2 août 2026) : un assistant conversationnel doit indiquer clairement qu'il est une IA, au moment de l'échange.
- **Règlement européen sur l'IA, annexe III (emploi)** : une IA qui répartit les tâches selon le comportement des salariés, ou qui surveille et évalue leurs performances, est classée « à haut risque » ; ces obligations s'appliquent, d'après nos recherches, à partir de décembre 2027. Un agent qui « noterait » les caissières serait concerné : à éviter, ou à préparer en conséquence.
- **RGPD et surveillance des salariés** : information préalable des salariés ; le cas échéant, consultation des représentants du personnel.
- **Fournisseur d'IA** : contrat de traitement des données, données hébergées en Europe si possible, pas d'utilisation des données des clients pour entraîner les modèles.

## 7. Feuille de route proposée

1. **Étape 1 — Brief et assistant** (décidé le 4 octobre 2026) : brief de fin de soirée et de veille ; assistant qui répond en citant ses sources, avec la mention « IA ». Préalable : choix du fournisseur et création du compte par Rémi.
2. **Étape 2 — Où je perds de l'argent** : ruptures chiffrées, saturation par caisse, écarts, produits sous cible ; puis rapprochement TPE.
3. **Étape 3 — Prochain événement** : prévision en fourchette, mise en place et personnel suggérés, mesure de l'écart prévu / réalisé.
4. **Plus tard** : pilote automatique (actions autorisées, validées), comparaison entre lieux, jumeau numérique, note globale.

## 8. Sources

- Oracle — Sports & Entertainment : https://www.oracle.com/food-beverage/sports-entertainment/
- Stadium Tech Report — SpotOn et Appetize : https://stadiumtechreport.com/news/spoton-raises-300-million-in-part-to-aquire-venue-pos-services-provider-appetize/
- Restaurant Technology News — Nory : https://restauranttechnologynews.com/2026/06/nory-brings-agentic-ai-to-restaurant-forecasting-labor-optimization-inventory-management-and-profitability/
- Nory — Ce qui marche vraiment en 2026 : https://www.nory.ai/blog/ai-for-restaurants-in-2026-what-actually-works
- Safari AI — stades : https://www.getsafari.ai/stadiums-arenas-venues
- The Spoon — WaitTime : https://thespoon.tech/waittime-is-like-the-waze-for-long-food-lines-at-stadiums/
- AiFi — Mercedes-Benz Stadium : https://aifi.com/aifi-and-mercedes-benz-stadium/
- Process Excellence Network — AI Act 2026 : https://www.processexcellencenetwork.com/ai/articles/eu-ai-act-2026-what-actually-changed-and-what-deployers-still-must-do
- Brevet US10549978 (pertes de boisson) : https://patents.google.com/patent/US10549978
