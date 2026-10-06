# Caisses externes : L'Addition, Digifood, Weezevent (recherche du 2026-10-06)

> Demande de Rémi (2026-10-06) : « renseigne-toi sur les systèmes de caisse, leur API, ce qu'ils font remonter, de quoi
> avons-nous besoin ». Recherche faite sur les sites publics des éditeurs et de leurs partenaires ; **aucune documentation
> d'API de ces trois éditeurs n'est publique** : les détails ci-dessous sont ceux qu'ils publient, à confirmer avec eux.
> Décision et module : dossier §15.150.

## Ce que FlaiX Expert doit recevoir d'une caisse

| Donnée | Pourquoi | Indispensable |
|---|---|---|
| Identifiant unique de la vente (ticket) | ne jamais compter deux fois une vente | oui |
| Date et heure | rattacher la vente à l'événement, ventes à l'heure, prévisions | oui |
| Lignes : produit (code ou libellé), quantité, prix TTC | chiffre d'affaires par produit, marge, consommation du stock | oui |
| Taux de TVA par ligne | chiffre d'affaires hors taxes, marge exacte | conseillé |
| Point de vente / terminal | résultats par stand, ruptures par stand | conseillé |
| Moyen de paiement | ventilation espèces / carte / cashless | conseillé |
| Annulations et remboursements (avec la vente d'origine) | chiffre d'affaires juste | oui |
| Remises, offerts | marge réelle, « où je perds de l'argent » | conseillé |
| Catalogue (produits, catégories, prix) | correspondance avec les produits de FlaiX Expert | conseillé |
| Clôtures de journée (Z) | rapprochement avec ce qui a été importé | utile |
| Arrivée des ventes en direct (notification, « webhook ») | suivi en direct, alertes de rupture pendant l'événement | utile |

Ce qu'une caisse externe ne donnera pas : le temps de prise de commande (§15.139), les points et codes promo réservés à la
caisse de FlaiX Expert (§15.127), le mode formation, la vente sans réseau de notre tablette.

## L'Addition — caisse iPad pour la restauration

- **API** : réservée aux partenaires techniques, fermée au public ; l'éditeur choisit ses partenaires (« ne donne pas
  suite à toutes les demandes ») ; documentation téléchargeable sur sa page « Développeurs » après contact.
- **Ce que des partenaires reçoivent** : Adoria (ERP) reçoit automatiquement « les ventes, articles, encaissements et
  informations de stock » ; Fullsoon (prévisions) reçoit l'historique des ventes, les volumes par créneau.
- **Autre accès** : **Chift**, « API unifiée » qui propose un connecteur L'Addition (le restaurateur fournit un jeton
  d'accès L'Addition, Chift utilise son identifiant de partenaire). La même intégration Chift ouvre aussi Zelty, SumUp,
  Zettle, Square, Agora… Modèle de données Chift : commandes (lignes, quantités, prix, paiements), paiements, produits,
  catégories, points de vente, clôtures de journée. Payant (tarif non publié).
- **Sans API** : exports Excel (tableaux pour l'expert-comptable) et exports comptables pré-formatés.

## Digifood — caisse, bornes, commande en ligne et cashless pour stades, salles et festivals

- Clients affichés : RC Lens, FC Nantes, Stade Rennais, FC Lorient, FC Metz… : **le plus proche de la cible FlaiX Expert**.
- Caisse avec mode hors ligne ; cashless par QR code ; click & collect ; back-office avec plus de 20 modèles de rapports et
  envoi automatique des rapports.
- **API** : « dépôt de données directement sur votre BI via une intégration par API » ; « intégrations à vos systèmes » et
  « développements sur mesure ». Aucune documentation publique : **à demander à Digifood** (format, contenu, fréquence).

## Weezevent — billetterie, cashless WeezPay, contrôle d'accès

- **API billetterie** publique pour les partenaires inscrits (clé d'API dans le back-office : Outils → Clés API) :
  événements, tarifs, participants, statistiques de contrôle. **Elle ne couvre pas les ventes de la buvette.**
- **WeezPay (cashless et caisse d'événement)** : « interfaçage en API », données d'achat par profil client ; analyse des
  ventes par article, par point de vente, par activité ; points de vente qui fonctionnent sans réseau ; **export CSV ou
  XLSX des transactions**. API cashless non documentée publiquement : **à demander à Weezevent**.

## Conclusion

1. **Tout de suite, sans partenariat** : les trois caisses savent **exporter leurs ventes en fichier** (CSV ou Excel).
   FlaiX Expert peut importer ces fichiers ; c'est la première porte du module (§15.150).
2. **Ensuite, par API** : un partenariat est nécessaire avec chacun (ou un abonnement Chift pour L'Addition et d'autres
   caisses de restauration). Points à demander à chaque éditeur : documentation, compte de test, données disponibles
   (lignes, TVA, points de vente, annulations), notifications en direct, conditions et prix du partenariat.

## Sources

- L'Addition, page Développeurs : https://www.laddition.com/fr/developpeurs
- Adoria × L'Addition : https://www.adoria.com/partenaires/l-addition.html
- Fullsoon × L'Addition : https://fullsoon.co/integration-laddition/
- Chift, connecteur L'Addition : https://www.chift.eu/tools/laddition et https://docs.chift.eu/connectors/pos/laddition
- Chift, données de caisse : https://docs.chift.eu/unified-apis/POS/datatypes
- Digifood, back-office : https://www.digifood.com/nos-solutions/back-office
- Digifood, caisse : https://www.digifood.com/nos-solutions/la-caisse-de-vente-a-emporter
- Weezevent, API : https://api.weezevent.com/ et https://help.weezevent.com/en/articles/13399570-how-to-use-weezevent-s-api
- Weezevent, WeezPay : https://weezevent.com/fr/weezpay/tarifs-fonctionnalites/
