# Phase 80 — Ligne de facture reliée à un ingrédient ; à l'import, le sûr rempli et le ressemblant proposé

> FlaiX Expert · dossier de développement · généré le 2026-11-12 depuis le dépôt [Break-Eat-APP/flaix-expert](https://github.com/Break-Eat-APP/flaix-expert). Règles du projet : `AGENTS.md`.

| | |
|---|---|
| Dates | 2026-11-12 |
| Décision | dossier projet §15.179 |
| État | livrée, tests au vert au moment du commit |
| Commits | 3 |

## 1. Ce qui a été décidé, et pourquoi

### 15.179 Ligne de facture reliée à un ingrédient ; seul le sûr est rempli, le reste est proposé (2026-11-12)

**Contexte** : calcul de la marge d'octobre des Spartiates (export L'Addition et factures Relais d'Or, Montaner Pietrini) :
les boissons se relient produit à produit, mais la nourriture s'achète en **ingrédients** (saucisse, pain, nachos) alors
qu'une ligne de facture ne se reliait qu'à un produit. Rémi, le 2026-11-12 : « Il faut surtout pas que FlaiX Expert propose
ou remplisse automatique des configurations faussées. Quand il ne sait pas, il doit proposer des solutions ou des
correspondances […] Je te laisse relier une ligne de facture à un ingrédient. »

**Ce qui est fait** :
- Migration 0061 : `ligne_facture_fournisseur` et `correspondance_article_fournisseur` gagnent `ingredient_id` (clé
  composée avec le lieu) et `ingredient_milli_par_unite` (quantité d'ingrédient dans une unité facturée, en millièmes de son
  unité : carton de 32 pièces = 32 000 ; fût de 30 L = 30 000 ; lot de 4,8 kg = 4 800). Produit OU ingrédient, jamais les
  deux ; ingrédient sans quantité refusé (contraintes de la base et du serveur). Copie en formation avec l'ingrédient du lieu
  de formation (fonction `synchroniser_complements_formation` redéfinie, règle n° 6).
- Validation d'une facture, case « entrer en réserve » : un ingrédient **suivi en stock** reçoit une livraison (réserve,
  coût moyen pondéré : `enregistrerLivraisonIngredient`, extraite de `stock-ingredients.ts` et partagée avec la saisie à la
  main) ; un ingrédient **non suivi** prend le prix de la facture (journal `ingredient_prix_facture`). Dans les deux cas,
  les coûts des recettes qui l'utilisent sont recalculés (`recalculerCoutsRecettes`) : la marge des produits vendus suit.
- Correspondances apprises et écran Achats › Correspondances : produit ou ingrédient, colis ou contenu.
- **Seul le sûr est rempli** à l'import (PDF, Excel, CSV) : correspondance déjà validée pour ce fournisseur, produit ou
  ingrédient du même nom, colis écrit dans le fichier. Le ressemblant (nom proche, ou nom dont tous les mots figurent dans le
  libellé : `proposerPourArticle`), le colis deviné dans le libellé et la quantité d'ingrédient (pièces du carton, poids ou
  volume écrit) sont **proposés**, à accepter d'un clic ou tous ensemble — jamais choisis d'office. Avant, le produit le plus
  ressemblant et le colis deviné étaient pré-remplis.

**Vérifié** : `facture-ingredient.test.ts` (4, dont [F] produit et ingrédient à la fois, quantité absente, ingrédient d'un
autre lieu) : 2 cartons de 32 saucisses à 54,15 € → 64 saucisses en réserve à 1,69 € ; pain non suivi au prix de la facture ;
coût du hot dog recalculé. `formation-complements` (copie de l'ingrédient), `Factures.test.tsx` ([F] rien de ressemblant
n'est choisi d'office), `factures-import.test.ts`. À l'écran, en local, avec la facture fictive au format Relais d'Or :
« Frites » et « Steak haché VBF » proposés sans être choisis ; le steak accepté comme ingrédient en kg, « 4,8 kg ? » proposé.

**Marge d'octobre des Spartiates** (calcul hors logiciel, sur les vrais fichiers, coûts du 8 octobre ; hot dog = « Box
hotdog maxi porc 32x160g » 54,15 € / 32 = 1,69 €, pain compris selon Rémi, à confirmer ; box = hot dog + nachos 2,44 €) :
hot dog 73 %, box hot dog 54 % ; avec les boissons et le reste, 97 % du chiffre d'affaires HT chiffré, marge 68 % (sauces,
garnitures et emballages non comptés ; eau offerte en octobre). Dans FlaiX Expert, ce calcul se fait seul une fois les
produits L'Addition reliés, les recettes saisies et les factures validées.

**Reste** : copier le catalogue et les correspondances d'un lieu à un autre du même directeur ; reprendre dans le compte réel
de Rémi la liaison des 27 produits L'Addition et les recettes (hot dog, box hot dog, toppings).

## 2. Ce qui a été construit — commits

- [`1d5f58f`](https://github.com/Break-Eat-APP/flaix-expert/commit/1d5f58f9e642c012849f3deb670bbeed0a3b7d1b) — 2026-11-12 — Factures (§15.179) : une ligne se relie à un ingrédient — livraison en réserve s'il est suivi, prix repris sinon, coûts des recettes recalculés ; correspondances apprises avec l'ingrédient ; migration 0061 (et copie en formation)
- [`2f1a337`](https://github.com/Break-Eat-APP/flaix-expert/commit/2f1a337604ffb9f503d5b03e23015bfd262803b7) — 2026-11-12 — Factures (§15.179) : produit ou ingrédient au choix à l'écran et dans les correspondances ; seul le sûr est rempli (appris, même nom, colis du fichier), le ressemblant et le colis deviné sont proposés ; proposition par mots contenus dans le libellé
- [`9d2b38b`](https://github.com/Break-Eat-APP/flaix-expert/commit/9d2b38b075e81b1382ccedc1003a606f84a8e0b3) — 2026-11-12 — Dossier : facture reliée à un ingrédient, le sûr rempli et le reste proposé (§15.179, phase 80)

## 3. Fichiers, par couche

### Base de données (migrations)

- `db/migrations/0061_facture_vers_ingredient.sql` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/db/migrations/0061_facture_vers_ingredient.sql)

### Tests

- `apps/api/test/facture-ingredient.test.ts` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/api/test/facture-ingredient.test.ts)
- `apps/api/test/facture-reserve.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/api/test/facture-reserve.test.ts)
- `apps/api/test/formation-complements.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/api/test/formation-complements.test.ts)
- `packages/domain/src/factures-import.test.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/packages/domain/src/factures-import.test.ts)

### Moteur de calcul (packages/domain)

- `packages/domain/src/factures-import.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/packages/domain/src/factures-import.ts)
- `packages/domain/src/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/packages/domain/src/factures.ts)
- `packages/domain/src/journal-technique.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/packages/domain/src/journal-technique.ts)

### Serveur (apps/api)

- `apps/api/src/routes/factures.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/api/src/routes/factures.ts)
- `apps/api/src/routes/stock-ingredients.ts` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/api/src/routes/stock-ingredients.ts)

### Écrans (apps/web)

- `apps/web/src/pages/achats/Correspondances.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/web/src/pages/achats/Correspondances.tsx)
- `apps/web/src/pages/factures/article.tsx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/web/src/pages/factures/article.tsx)
- `apps/web/src/pages/factures/Factures.test.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/web/src/pages/factures/Factures.test.tsx)
- `apps/web/src/pages/factures/Factures.tsx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/apps/web/src/pages/factures/Factures.tsx)

### Serveur OVH et outils (infra)

- `infra/outils/carte-du-code-intro.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/infra/outils/carte-du-code-intro.md)
- `infra/outils/phases.cjs` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/infra/outils/phases.cjs)

### Documentation

- `CHANGELOG.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/CHANGELOG.md)
- `docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/audits/AUDIT_2026-10-26_codex-systeme-phases-67-76.docx)
- `docs/avancement.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/avancement.md)
- `docs/developpement/CARTE_DU_CODE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/CARTE_DU_CODE.md)
- `docs/developpement/GUIDE_DE_REPRISE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/GUIDE_DE_REPRISE.docx)
- `docs/developpement/GUIDE_DE_REPRISE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/GUIDE_DE_REPRISE.md)
- `docs/developpement/JOURNAL_DES_PHASES.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/JOURNAL_DES_PHASES.md)
- `docs/developpement/phases/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.md)
- `docs/developpement/phases/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.md)
- `docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.md)
- `docs/developpement/phases/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/README.md)
- `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx)
- `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx)
- `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx)
- `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx)
- `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx)
- `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx)
- `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx)
- `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx)
- `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx)
- `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx)
- `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx)
- `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx)
- `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx)
- `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx)
- `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx)
- `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx)
- `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx)
- `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx)
- `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx)
- `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx)
- `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx)
- `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx)
- `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx)
- `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx)
- `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx)
- `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx)
- `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx)
- `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx)
- `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx)
- `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx)
- `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx)
- `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx)
- `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx)
- `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx)
- `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx)
- `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx)
- `docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_39_REVENUE_ENGINE_OU_JE_PERDS_DE_LARGENT.docx)
- `docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_40_TEMPS_DE_PRISE_DE_COMMANDE_PAR_CAISSE_ET_PAR_STAND.docx)
- `docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_41_CENTRE_DALERTES_ET_RUPTURE_DE_STOCK_POUSSEE_SUR_LE_TELEPHONE.docx)
- `docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_42_COMPARAISON_DES_PRIX_ENTRE_FOURNISSEURS.docx)
- `docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_43_BACK_OFFICE_NIVEAU_2_SUPPORT_SUR_AUTORISATION_DU_LIEU.docx)
- `docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_44_PREVISION_DU_PROCHAIN_EVENEMENT.docx)
- `docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_45_IA_OVHCLOUD_SEUL_COMME_MOTEUR_DE_LANGAGE_DE_LAGENT.docx)
- `docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_46_E_MAILS_PAR_BREVO_RAPPORT_DE_SOIREE_ET_RECTIFICATIONS.docx)
- `docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_47_CARTE_ABONNE_DANS_APPLE_WALLET_ET_GOOGLE_WALLET.docx)
- `docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_48_DESIGN_DE_LA_CARTE_ABONNE_LOGO_BANNIERE_COULEURS_TEXTES_ET_LIENS.docx)
- `docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_49_AUDITS_DU_2026_10_05_CLAUDE_PUIS_CODEX_ET_CORRECTIONS.docx)
- `docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_50_COMPTEUR_DE_CONSOMMATION_DE_LIA_DANS_LE_BACK_OFFICE.docx)
- `docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_51_CAISSES_CONNECTEES_VENTES_DUNE_CAISSE_EXTERNE_IMPORTEES.docx)
- `docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_52_VENTES_DEPOSEES_DANS_TOUT_FLAIX_EXPERT_FICHIERS_EXCEL.docx)
- `docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_53_CAISSES_CONNECTEES_CORRESPONDANCES_AUTOMATIQUES_ET_SUGGEREES.docx)
- `docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_54_NOUVEAU_STYLE_ARRONDI_EPURE_TOUJOURS_CLAIR.docx)
- `docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_55_CE_QUIL_TE_RESTE_ET_MES_FRAIS.docx)
- `docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_56_CONDITIONNEMENT_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_57_HYGIENE_ET_HACCP.docx)
- `docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_58_ALLERGENES_DE_CHAQUE_PRODUIT.docx)
- `docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_59_STOCK_DES_EMBALLAGES.docx)
- `docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_60_HYGIENE_SUR_LA_TABLETTE_DES_CAISSIERES_PHOTOS_DETIQUETTES.docx)
- `docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_61_EVENEMENTS_PRIVES.docx)
- `docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_62_PRODUITS_PRIX_PLUS_CLAIR_SECTION_ACTIVE_ALLERGENES_COCHABLES_EMBALLAGE.docx)
- `docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_63_LE_STADE_EN_DIRECT_STANDS_EN_3D_EN_COULEUR_ALERTES_AU_CLIC.docx)
- `docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_64_LE_STADE_EN_DIRECT_SANS_FILE_DATTENTE_ALERTES_UTILES_PENDANT_LES_VENTE.docx)
- `docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_65_LE_LIEU_EN_3D_QUATRE_DECORS_STANDS_POSES_A_LA_MAIN.docx)
- `docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_66_REMETTRE_LE_STOCK_A_ZERO_SUPPRIMER_UN_EVENEMENT_A_VENIR.docx)
- `docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_67_LE_TABLEAU_EN_DIRECT_DAPRES_LA_MAQUETTE_AVEC_LE_LIEU_EN_3D.docx)
- `docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_68_EN_DIRECT_A_PART_AU_DESIGN_DES_MAQUETTES_RESULTATS_POUR_LES_EVENEMENTS.docx)
- `docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_69_EXPORTS_DE_LADDITION_LUS_SEULS_ANNULER_UN_IMPORT_DE_CAISSE_CONNECTEE.docx)
- `docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_70_DECOR_FIXE_STOCK_DANS_LORDRE_OUVERTURE_DEPUIS_EN_DIRECT_STOCK_DES_EVEN.docx)
- `docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_71_RAPPORT_DE_STOCK_PAR_EVENEMENT_CE_QUIL_TE_RESTE_EN_CLAIR_LE_NET_EN_DIR.docx)
- `docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_72_LES_CHIFFRES_DE_LA_SOIREE_EVENEMENTS_PRIVES_DANS_RESULTATS_CLICK_COLLE.docx)
- `docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_73_ACHATS_INGREDIENTS_A_PART_RACCOURCI_DE_CLOTURE_FACTURE_QUI_ENTRE_EN_RE.docx)
- `docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_74_FACTURES_AUTOMATISEES_IMPORT_EXCEL_OU_CSV_COLIS_CORRESPONDANCES_APPRIS.docx)
- `docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_75_CORRESPONDANCES_FOURNISSEURS_A_LECRAN_RESULTATS_AU_DESIGN_DE_LA_2E_MAQ.docx)
- `docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_76_AUDIT_DES_PHASES_67_A_75_ET_CORRECTIONS_DOSSIER_DE_REPRISE_A_JOUR.docx)
- `docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_77_AUDIT_DE_CODEX_LIVRAISON_DUNE_FACTURE_LIMITEE_A_SON_LIEU_DEPENDANCES_C.docx)
- `docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_78_AUDIT_DE_CODEX_DURCISSEMENTS_ANNULATION_RELANCES_WALLET_EVENEMENT_PRIV.docx)
- `docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_79_FACTURES_PDF_FABRIQUEES_PAR_LE_LOGICIEL_DU_FOURNISSEUR_LUES_SANS_IA_RE.docx)
- `docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx` — créé — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/developpement/phases/word/PHASE_80_LIGNE_DE_FACTURE_RELIEE_A_UN_INGREDIENT_A_LIMPORT_LE_SUR_REMPLI_ET_LE_.docx)
- `docs/flaix-gestion-dossier-projet.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/flaix-gestion-dossier-projet.md)
- `docs/points-a-revoir.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/points-a-revoir.md)
- `docs/README.md` — modifié — [voir sur GitHub](https://github.com/Break-Eat-APP/flaix-expert/blob/9d2b38b075e81b1382ccedc1003a606f84a8e0b3/docs/README.md)

## 4. Tests créés dans cette phase

### `apps/api/test/facture-ingredient.test.ts`

- **facture fournisseur : ligne reliée à un ingrédient**
  - [F] produit et ingrédient à la fois, quantité d'ingrédient absente, quantités ou montants hors bornes, ingrédient d'un autre lieu : refusés
  - enregistrée : la ligne garde l'ingrédient et sa quantité ; pas d'alerte de colis pour un ingrédient
  - validée avec entrée en réserve : 64 saucisses en réserve au prix de la facture, pain au prix de la facture, coût du hot dog recalculé
  - l'article est retenu : correspondance vers l'ingrédient et sa quantité, reprise à la facture suivante

## 5. Pour reprendre ou vérifier cette phase

1. `pnpm install`, `pnpm db:up` (PostgreSQL local dans Docker), `pnpm db:migrate`.
2. Tests contre la base : `cd apps/api && ./node_modules/.bin/vitest run test/facture-ingredient.test.ts`.
- Avant toute modification : lire `AGENTS.md` (règles et invariants), puis la section du dossier projet indiquée ci-dessus. Une migration appliquée ne se modifie jamais ; un refus de la base est voulu.
- Ordre de construction complet : `docs/developpement/JOURNAL_DES_PHASES.md` ; où trouver quoi : `docs/developpement/CARTE_DU_CODE.md`.
