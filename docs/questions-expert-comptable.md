# Questions à poser par écrit à l'expert-comptable (ou à un fiscaliste)

**Préparé le 2026-09-28, mis à jour le 2026-09-29** (le paiement carte en caisse passe par le TPE bancaire du lieu, pas par Stripe). À envoyer par Rémi Notta. Réponse écrite demandée — une réponse orale ne pourra pas être versée au dossier de conformité.

---

## Contexte, à joindre à l'envoi

Break Eat *(forme sociale exacte à confirmer : SAS ou SASU)*, SIREN 925 187 395, édite un logiciel, **FlaiX Expert**, destiné aux buvettes de stades et salles de sport. Premier client : une buvette de patinoire (4 stands, 9 caisses).

Fonctionnement prévu :
- la caissière saisit chaque vente dans FlaiX Expert, sur une tablette : le logiciel crée le ticket (produits, prix, TVA, remises) ;
- le règlement par carte se fait sur le **terminal de paiement (TPE) du lieu, fourni par sa propre banque**, qui n'est **pas relié** au logiciel : la caissière indique « carte » sur le ticket une fois le paiement accepté sur le TPE (l'argent va directement au lieu ; Break Eat ne perçoit aucun fonds et facture ses services en fin de mois) ;
- les espèces : *(à préciser par Rémi avant l'envoi : aucune / sur certaines caisses)* ;
- le logiciel conserve chaque ticket sans possibilité de modification ni de suppression, avec clôtures journalière, mensuelle et annuelle, et archive annuelle.

---

## A. Obligation de logiciel de caisse sécurisé (CGI art. 286, I-3° bis)

1. Dans ce fonctionnement, FlaiX Expert est-il un « logiciel ou système de caisse » au sens de l'article 286, I-3° bis du CGI, du fait qu'il **enregistre** chaque vente et son mode de règlement, même si le paiement carte est traité par un TPE bancaire qui n'est pas relié au logiciel ?
2. La dispense du BOFiP (BOI-TVA-DECLA-30-10-30, §35 à §37) vise les paiements réalisés exclusivement par « l'intermédiation directe d'un établissement de crédit ». **Un lieu qui n'accepte que la carte bancaire, sur le TPE fourni par sa banque, bénéficie-t-il de cette dispense ?** (L'exemple 4 du §37, péages et distributeurs de carburant n'acceptant que la carte, semble aller dans ce sens, mais ne vise pas explicitement un comptoir de restauration.)
3. Si une seule caisse du lieu accepte des espèces, confirmez-vous que la dispense ne s'applique à aucune caisse du lieu (BOFiP §37, « quelle que soit l'importance de cette partie ») ?
4. Break Eat peut-il délivrer lui-même l'**attestation individuelle d'éditeur** (modèle BOI-LETTRE-000242) à ses clients, compte tenu de son activité déclarée ? Y a-t-il une condition que nous n'aurions pas vue ?

## B. Taux de TVA dans une buvette de stade (consommation sur place)

5. Quels taux appliquer, pour une vente au comptoir d'une buvette de stade, consommée sur place ou dans les tribunes ?
   - boissons sans alcool (sodas, eau, thé glacé en canette ou bouteille) : 5,5 % ou 10 % ?
   - produits sucrés emballés (cookies, brownies) : 5,5 % ou 10 % ?
   - plats et sandwichs (hot-dog, nachos, panini, pizza, burger) : 10 % ?
   - bière et boissons alcoolisées : 20 % ?
6. Pour un ticket de plusieurs articles, l'arrondi de la TVA doit-il se faire **ligne par ligne** ou **sur le total par taux** ?

## C. Remises, offerts et commission

7. Une remise « abonné » de 15 % consentie au moment de la vente réduit-elle la base de la TVA (CGI art. 267, II-1°) ? La TVA porte-t-elle bien sur le prix net ?
8. Un produit **offert** (geste commercial, repas du personnel) : quel traitement TVA, et comment doit-il apparaître dans la caisse ?
9. La commission facturée par Break Eat au lieu (TVA 20 %) : le lieu, assujetti, peut-il déduire cette TVA ?
10. Les frais prélevés sur les paiements (commission bancaire du TPE ; frais Stripe sur les commandes Click & Collect passées dans l'application Break Eat) sont-ils soumis à TVA, et le lieu peut-il la récupérer ?

## D. Conservation et contrôle

11. Le format d'archive annuelle prévu — fichiers texte CSV (UTF-8, séparateur `;`), une notice explicative en français, et les empreintes SHA-256 de chaque fichier — répond-il à l'exigence de « format ouvert » du BOFiP (§220 à §260) ?
12. Les données sont hébergées en France par un prestataire. Confirmez-vous que le lieu doit **déclarer le lieu de stockage** à son service des impôts (LPF art. L102 C) ?
12 bis. **Vente sans réseau** : pendant une coupure, les tickets seront numérotés, scellés (chaînage SHA-256) et conservés sur la tablette de la caisse, puis envoyés au serveur au retour du réseau. Ce fonctionnement vous paraît-il compatible avec les conditions d'inaltérabilité et de sécurisation, et que doit en dire l'attestation ?

## E. Gobelets consignés (option pour certains lieux)

14. Une consigne de gobelet réutilisable encaissée à la buvette (par exemple 1 €, rendue au retour du gobelet) est-elle hors du champ de la TVA ? Doit-elle figurer sur le ticket, et comment traiter les gobelets **non rendus** en fin de match ou de saison ?

## F. Facture électronique et e-reporting

15. La patinoire (préciser : association ou société, assujettie ou non à la TVA) a-t-elle désigné la **plateforme agréée** par laquelle elle reçoit ses factures fournisseurs depuis le 1er septembre 2026 ? Laquelle ?
16. Ses ventes aux particuliers à la buvette entrent-elles dans l'**e-reporting** à partir du 1er septembre 2027 ? Quelles données et à quelle fréquence (annexe II au CGI, art. 242 nonies M à P) ?
17. Sous quel format souhaitez-vous recevoir les données de FlaiX Expert : ventes par jour, par taux de TVA et par moyen de paiement ; factures fournisseurs ; et avec quel logiciel comptable travaillez-vous ?

---

## Question à poser à la DGCCRF (ou à l'organisation professionnelle du secteur)

13. Une buvette de stade relève-t-elle de l'exception « hôtellerie-restauration » de l'article D541-371 du code de l'environnement, qui maintient l'**obligation de remettre un ticket** à chaque client ? *(Réponse nécessaire avant l'achat du matériel : imprimante par caisse ou ticket dématérialisé.)*

**G.18 — Ticket client sur demande seulement (décision de Rémi du 2026-09-30).** Les caisses n'impriment aucun ticket ; sur demande, le directeur produit le ticket depuis le logiciel. L'article D541-371 du code de l'environnement garde-t-il le ticket obligatoire pour une buvette de patinoire (exception « hôtellerie-restauration ») ? Une réédition doit-elle porter la mention « duplicata » et être comptée ?
