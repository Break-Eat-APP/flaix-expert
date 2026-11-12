# FlaiX Expert — registre des bugs et incidents

Tenu selon la gouvernance (`GOUVERNANCE_FLAIX_EXPERT.md`, § 9). Créé le 2026-11-13. Chaque bug a un identifiant stable
`BUG-2026-NNN` ; il n'est jamais supprimé, seulement clos. Gravité : `SEV-0` (vente perdue ou altérée, journal cassé,
clôture fausse, accès entre lieux, fuite) à `SEV-4` (mineur). Statuts : OUVERT, EN COURS, CORRIGÉ (dans le code et
testé), VÉRIFIÉ (contrôlé en ligne), CLOS, ACCEPTÉ (risque assumé, décision écrite).

Les défauts antérieurs au 2026-10-26 sont décrits dans les rapports de `docs/audits/` (avec leur suivi) et dans le
dossier projet ; ils ne sont pas renumérotés ici.

## Tableau de bord

| ID | Titre | Gravité | Statut | Source | Correction |
|---|---|---|---|---|---|
| BUG-2026-001 | Ligne de facture reliée à la livraison d'un autre lieu | SEV-0 | VÉRIFIÉ | Audit Codex 2026-10-26, P1-1 | `dca4c8f`, migration 0059 (§15.176) |
| BUG-2026-002 | Dépendances de production vulnérables (zod : épuisement mémoire) | SEV-2 | VÉRIFIÉ | Audit Codex 2026-10-26, P1-2 | `dca4c8f` (§15.176) |
| BUG-2026-003 | Auteur d'une annulation d'import falsifiable par l'appelant | SEV-2 | VÉRIFIÉ | Audit Codex 2026-10-26, P2-1 | `ace2a94`, migration 0060 (§15.177) |
| BUG-2026-004 | Relances wallet traitées deux fois en parallèle | SEV-3 | VÉRIFIÉ | Audit Codex 2026-10-26, P2-2 | `ace2a94`, migration 0060 (§15.177) |
| BUG-2026-005 | Événement privé au-delà de 100 000 unités : erreur de base illisible (clôture, ajout au même prix) | SEV-3 | VÉRIFIÉ | Audit Codex 2026-10-26, P3-1 ; test du 2026-11-11 | `ace2a94`, `12aef8f` (§15.177) |
| BUG-2026-006 | Compteur de ventes d'une caisse connectée comptant les annulées | SEV-3 | VÉRIFIÉ | Audit Codex 2026-10-26, P3-2 | `ace2a94` (§15.177) |
| BUG-2026-007 | Export du comptable construit entièrement en mémoire | SEV-3 | VÉRIFIÉ | Audit Codex 2026-10-26, P3-3 | `ace2a94` (§15.177) |
| BUG-2026-008 | Facture PDF : lot au poids compté avec le colis du libellé (8 steaks au lieu de 32) | SEV-2 | VÉRIFIÉ | Test à l'écran, 2026-11-12 | `a8c8d1f` (§15.178) |
| BUG-2026-009 | Colonne « URL Ticket » de L'Addition envoyée au serveur dans le fichier | SEV-2 | VÉRIFIÉ | Test à l'écran, 2026-11-12 | `a8c8d1f` (§15.178) |
| BUG-2026-010 | Import de facture : produit seulement ressemblant et colis deviné pré-remplis | SEV-2 | VÉRIFIÉ | Règle de Rémi, 2026-11-12 | `2f1a337` (§15.179) |
| BUG-2026-011 | Copie de catalogue : prix copiés invisibles (signés du compte éditeur) | SEV-2 | VÉRIFIÉ | Test avant mise en ligne, 2026-11-12 | `2ed8cbc`, migration 0062 (§15.180) |
| BUG-2026-012 | Import Excel/CSV de facture : total HT non lu, donc non contrôlé | SEV-2 | OUVERT | Audit Codex 2026-11-12, P2-1 | — |
| BUG-2026-013 | Import Excel de facture : feuille choisie avec les règles des ventes de caisse | SEV-2 | OUVERT | Audit Codex 2026-11-12, P2-2 | — |
| BUG-2026-014 | Entrée en réserve d'un colis : prix unitaire arrondi, valeur du stock ≠ montant de la ligne | SEV-3 | OUVERT | Audit Codex 2026-11-12, P2-3 | — |
| BUG-2026-015 | Ligne de facture → ingrédient : quantités et montants extrêmes non bornés avant la réserve | SEV-3 | OUVERT | Audit Codex 2026-11-12, P2-4 | — |
| BUG-2026-016 | Lecteur PDF Montaner Pietrini : un avoir (ligne négative) lu comme une ligne à zéro | SEV-2 | OUVERT | Audit Codex 2026-11-12, P2-5 | — |
| BUG-2026-017 | Cartes Wallet : recette réelle Apple et Google non faite | SEV-2 | OUVERT | Audits Codex 2026-10-26 (P2-3) et 2026-11-12 (P2-6) | Recette avec Rémi (points à revoir n° 10) |
| BUG-2026-018 | Lecteur PDF : pas de fichiers PDF réels dans les tests (mises en page, polices, avoirs) | SEV-4 | OUVERT | Audit Codex 2026-11-12, P3-1 | — |
| BUG-2026-019 | Import Excel de facture : colonne « Col/Pack » non reconnue comme colis | SEV-3 | OUVERT | Audit Codex 2026-11-12, P3-2 | — |
| BUG-2026-020 | Copie de catalogue : nombre de recettes annoncé même quand rien n'est ajouté | SEV-4 | OUVERT | Audit Codex 2026-11-12, P3-3 | — |

## Fiches

### BUG-2026-001 — Ligne de facture reliée à la livraison d'un autre lieu
- Découvert le : 2026-10-26 · Environnement : code · Module : factures · Gravité : SEV-0 · Statut : VÉRIFIÉ
- Description : la route de rapprochement acceptait l'identifiant d'une livraison d'un autre lieu ; la clé de la base ne
  portait que sur l'identifiant.
- Cause : confirmée. Correction : route limitée aux livraisons du lieu et du produit de la ligne ; clé composée
  `(lieu_id, livraison_id)`. Test : `facture-livraison-lieu.test.ts` ([F] route et base). Mise en ligne : 2026-11-01.

### BUG-2026-002 — Dépendances de production vulnérables
- Découvert le : 2026-10-26 · Module : dépendances · Gravité : SEV-2 · Statut : VÉRIFIÉ
- Correction : `zod` 4.6.7, `fastify` 5.12.7, `@fastify/rate-limit` 11.2.1 ; `pnpm audit --prod` sans alerte (revérifié par
  Codex le 2026-11-12).

### BUG-2026-003 à 007 — Durcissements de l'audit Codex du 2026-10-26
- Détail, tests et commits : dossier projet §15.177. Mise en ligne : 2026-11-11.

### BUG-2026-008 — Lot au poids compté avec le colis du libellé
- Découvert le : 2026-11-12, en rejouant la facture PDF à l'écran · Module : factures PDF · Gravité : SEV-2
- Observé : « Steak haché 8x150g, 4,800 KG » proposait 8 unités. Attendu : 32 (4 800 g / 150 g).
- Correction : le nombre de pièces d'un lot se calcule quand le compte tombe juste, sinon 1 avec une remarque. Test :
  `factures-pdf.test.ts`. Statut : VÉRIFIÉ.

### BUG-2026-009 — « URL Ticket » envoyée au serveur
- Découvert le : 2026-11-12 · Module : caisses connectées · Gravité : SEV-2 (confidentialité)
- Le serveur ne gardait pas la colonne, mais le navigateur l'envoyait dans le CSV. Correction : colonnes « URL… » retirées
  du classeur avant l'envoi ; contrôlé : aucun lien dans le contenu envoyé. Statut : VÉRIFIÉ.

### BUG-2026-010 — Propositions pré-remplies
- Découvert le : 2026-11-12, règle de Rémi (« quand il ne sait pas, il doit proposer ») · Module : factures
- Correction : seul le sûr est rempli ; le ressemblant et le colis deviné sont proposés. Test : `Factures.test.tsx` ([F]).

### BUG-2026-011 — Prix copiés invisibles
- Découvert le : 2026-11-12, par le test avant toute mise en ligne · Module : back-office, copie de catalogue
- Cause : les tarifs copiés étaient signés du compte éditeur, que le lieu ne voit pas (isolement). Correction : signés du
  directeur commun. Note : la migration 0062 a été corrigée après son passage sur la base locale (jamais mise en ligne) ;
  la règle « une migration appliquée ne se modifie jamais, même en local » est depuis écrite dans la gouvernance (§ 13.1).

### BUG-2026-012 à 020 — Audit Codex du 2026-11-12
- Rapport : `docs/audits/AUDIT_2026-11-12_codex-phases-79-81-calculs-imports-stock-wallets.md` (diagnostic, fichiers,
  corrections recommandées). Suivi dans le tableau ci-dessus et dans le rapport (§ 9 de suivi).
