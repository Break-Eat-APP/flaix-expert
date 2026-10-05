# Journal des phases de développement — FlaiX Expert

> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git : à relancer après chaque phase. Ne pas modifier à la main (ajouter la phase dans le script).
> Pour chaque phase : la **décision** (section du dossier projet `docs/flaix-gestion-dossier-projet.md`), les **commits** (liens GitHub), puis les fichiers touchés, rangés par couche. Les règles du projet sont dans [`AGENTS.md`](../../AGENTS.md), la carte du code dans [`CARTE_DU_CODE.md`](CARTE_DU_CODE.md).

| Phase | Sujet | Décision | Commits | État |
|---|---|---|---|---|
| 0 | [Socle de production et configuration d'un lieu vide](#phase-0) | §15.93 |  | livrée |
| 1 | [Matchs, caisse, Mes caisses, journal des tickets](#phase-1) | §15.94 |  | livrée |
| 2 | [Retour de démonstration, organisation en 6 entrées, maquettes](#phase-2) | §15.95, §15.96, §15.98 |  | livrée |
| 3 | [Vente sans réseau : la tablette scelle, le serveur vérifie](#phase-3) | §15.97 |  | livrée |
| 4 | [Serveur de test OVH](#phase-4) | guide-serveur-test-ovh.md |  | livrée |
| 5 | [Comptes des caissières et tablettes enregistrées](#phase-5) | §15.99, §15.100 |  | livrée |
| 6 | [Ticket client sur demande et duplicata](#phase-6) | §15.101 |  | livrée |
| 7 | [Clôture du match : Z des tiroirs, rectification signée](#phase-7) | §15.102 |  | livrée |
| 8 | [Résultats sur les vraies ventes](#phase-8) | §15.103 |  | livrée |
| 9 | [Équipe : fiches, planning, masse salariale](#phase-9) | §15.104 |  | livrée |
| 10 | [Stock : réserve, livraisons au CUMP, mise en place, comptage](#phase-10) | §15.105 |  | livrée |
| 11 | [Remontées au coffre et Z du coffre](#phase-11) | §15.106 |  | livrée |
| 12 | [Clôtures mensuelle et annuelle, total perpétuel](#phase-12) | §15.107 |  | livrée |
| 13 | [Exercice par lieu, sauvegardes chiffrées hors serveur](#phase-13) | §15.108 |  | livrée |
| 14 | [Mode formation « FACTICE »](#phase-14) | §15.109 |  | livrée |
| 15 | [Export pour l'expert-comptable](#phase-15) | §15.110 |  | livrée |
| 16 | [Click & Collect : moteur de prix et catalogue](#phase-16) | §15.111 |  | livrée |
| 17 | [Vue téléphone « En direct »](#phase-17) | §15.112 |  | livrée |
| 18 | [Coûts par buvette](#phase-18) | §15.113 |  | livrée |
| 19 | [Fidélité, partie gestion](#phase-19) | §15.114 |  | livrée |
| 20 | [Factures fournisseurs](#phase-20) | §15.115 |  | livrée |
| 21 | [Back-office éditeur, niveau 1](#phase-21) | §15.116 |  | livrée |
| 22 | [Décisions du 2026-10-01 et recettes](#phase-22) | §15.117, §15.119 |  | livrée |
| 23 | [Options par lieu, application installable, logo](#phase-23) | §15.118 |  | livrée |
| 24 | [Adresse du site flaixexpert.flaixlabs.com](#phase-24) | §15.120 |  | livrée |
| 25 | [Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe](#phase-25) | §15.121, §15.122 |  | livrée |
| 26 | [Click & Collect neutre, export comptable dans la base, assiette de la commission](#phase-26) | §15.123, §15.124 |  | livrée |
| 27 | [Stock des ingrédients au choix (bière pression)](#phase-27) | §15.125 |  | livrée |
| 28 | [Logo officiel v2](#phase-28) | — |  | livrée |
| 29 | [Dossier de conformité v0.1](#phase-29) | §15.126 |  | livrée |
| 30 | [Fidélité à la caisse : code promo et points dans le ticket scellé](#phase-30) | §15.127 |  | livrée |
| 31 | [Suivi du développement et préparation de l'audit Codex](#phase-31) | §15.128 |  | livrée |
| 32 | [Premier audit Codex et corrections](#phase-32) | §15.129 |  | livrée |
| 33 | [Caisse automatique selon la date, clôture par le directeur, « événement » partout](#phase-33) | §15.130 |  | livrée |
| 34 | [Rapport de soirée figé à la clôture, imprimable et en PDF](#phase-34) | §15.131 |  | livrée |
| 35 | [Cibles de marge et gestion financière de la soirée](#phase-35) | §15.132 | [`074647f`](https://github.com/Break-Eat-APP/flaix-expert/commit/074647f3a6d171ab1f4b33201e211395759a1efa) | livrée |
| 36 | [Bilan sur une période du … au …](#phase-36) | §15.133 | [`10e0186`](https://github.com/Break-Eat-APP/flaix-expert/commit/10e018659b30bb2cf3a005ec4ef65994e92ce077) | livrée |
| 37 | [Brief de fin de soirée en notification sur le téléphone](#phase-37) | §15.134, §15.135 | [`bcb9455`](https://github.com/Break-Eat-APP/flaix-expert/commit/bcb9455bc942b80996d2302d3467a2a1a9316a56) | livrée |
| 38 | [Assistant « pose ta question » et brief reformulé par Mistral](#phase-38) | §15.136, §15.137 | [`4a30d13`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a30d1373cebf546b6614e731c9fb280fa9d41d6) [`047ce76`](https://github.com/Break-Eat-APP/flaix-expert/commit/047ce760656a8c5a5ba720501ede4c6bcedf593a) | livrée |
| 39 | [Revenue Engine : « Où je perds de l'argent »](#phase-39) | §15.138 | [`21c7f53`](https://github.com/Break-Eat-APP/flaix-expert/commit/21c7f53ff7f62de497df5079a50ec1bafa83e392) [`6679d7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/6679d7e3b95a5b0a3d944201499bac16b653694e) [`f001e72`](https://github.com/Break-Eat-APP/flaix-expert/commit/f001e72807328fbfd90912174919d11b7dd5f91b) | livrée |
| 40 | [Temps de prise de commande, par caisse et par stand](#phase-40) | §15.139 | [`72f087a`](https://github.com/Break-Eat-APP/flaix-expert/commit/72f087a9c12264b7aa6c658c949a6008d8e4b290) | livrée |
| 41 | [Centre d'alertes et rupture de stock poussée sur le téléphone](#phase-41) | §15.140 | [`b24b3c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b24b3c607722123e302c890c09795f70f602d59f) | livrée |
| 42 | [Comparaison des prix entre fournisseurs](#phase-42) | §15.141 | [`cb5cb03`](https://github.com/Break-Eat-APP/flaix-expert/commit/cb5cb039544ae547d7f86b649da7a5af4e35f00c) | livrée |
| 43 | [Back-office niveau 2 : support sur autorisation du lieu](#phase-43) | §15.142 | [`0a675eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/0a675ebb0890bbe6e768539eac7b651b1c0d73a6) | livrée |
| 44 | [Prévision du prochain événement](#phase-44) | §15.143 | [`534a3a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/534a3a6d867afcbcf5840bc11afcfd7c0f245267) | livrée |
| 45 | [IA : OVHcloud seul comme moteur de langage de l'agent](#phase-45) | §15.145 | [`0cf75f7`](https://github.com/Break-Eat-APP/flaix-expert/commit/0cf75f74279946891a5f97e9149a8f8086144895) [`b860416`](https://github.com/Break-Eat-APP/flaix-expert/commit/b8604166a371e12a7b414dbe8de26b42bae76ad6) | livrée |
| 46 | [E-mails par Brevo : rapport de soirée et rectifications](#phase-46) | §15.146 | [`3276652`](https://github.com/Break-Eat-APP/flaix-expert/commit/3276652190fa7fd86d1a643f2ee027e7f657ecf5) | livrée |
| 47 | [Carte abonné dans Apple Wallet et Google Wallet](#phase-47) | §15.147 | [`91b5446`](https://github.com/Break-Eat-APP/flaix-expert/commit/91b5446a293d1a7d981e749812d1e1e4e0f64cb4) [`6a23cf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/6a23cf28837f784116a2d8c2af19180175019ce0) [`0b0f1ee`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b0f1eea2f883d395f0a8b4a2f5bc2c208aeeae0) [`4662794`](https://github.com/Break-Eat-APP/flaix-expert/commit/466279489d406c8ac1230051e1717cb73e7cf8d5) | livrée |
| 48 | [Design de la carte abonné : logo, bannière, couleurs, textes et liens](#phase-48) | §15.148 | [`0721b51`](https://github.com/Break-Eat-APP/flaix-expert/commit/0721b5128becc3a3b38e22653d7e7f98d6602f6a) [`a6538ef`](https://github.com/Break-Eat-APP/flaix-expert/commit/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561) | livrée |

<a id="phase-0"></a>
## Phase 0 — Socle de production et configuration d'un lieu vide

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.93
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-1"></a>
## Phase 1 — Matchs, caisse, Mes caisses, journal des tickets

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.94
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-2"></a>
## Phase 2 — Retour de démonstration, organisation en 6 entrées, maquettes

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.95, §15.96, §15.98
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-3"></a>
## Phase 3 — Vente sans réseau : la tablette scelle, le serveur vérifie

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.97
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-4"></a>
## Phase 4 — Serveur de test OVH

- **Dates** : 
- **Décision et raisonnement** : dossier projet guide-serveur-test-ovh.md
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-5"></a>
## Phase 5 — Comptes des caissières et tablettes enregistrées

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.99, §15.100
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-6"></a>
## Phase 6 — Ticket client sur demande et duplicata

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.101
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-7"></a>
## Phase 7 — Clôture du match : Z des tiroirs, rectification signée

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.102
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-8"></a>
## Phase 8 — Résultats sur les vraies ventes

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.103
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-9"></a>
## Phase 9 — Équipe : fiches, planning, masse salariale

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.104
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-10"></a>
## Phase 10 — Stock : réserve, livraisons au CUMP, mise en place, comptage

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.105
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-11"></a>
## Phase 11 — Remontées au coffre et Z du coffre

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.106
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-12"></a>
## Phase 12 — Clôtures mensuelle et annuelle, total perpétuel

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.107
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-13"></a>
## Phase 13 — Exercice par lieu, sauvegardes chiffrées hors serveur

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.108
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-14"></a>
## Phase 14 — Mode formation « FACTICE »

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.109
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-15"></a>
## Phase 15 — Export pour l'expert-comptable

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.110
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-16"></a>
## Phase 16 — Click & Collect : moteur de prix et catalogue

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.111
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-17"></a>
## Phase 17 — Vue téléphone « En direct »

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.112
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-18"></a>
## Phase 18 — Coûts par buvette

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.113
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-19"></a>
## Phase 19 — Fidélité, partie gestion

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.114
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-20"></a>
## Phase 20 — Factures fournisseurs

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.115
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-21"></a>
## Phase 21 — Back-office éditeur, niveau 1

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.116
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-22"></a>
## Phase 22 — Décisions du 2026-10-01 et recettes

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.117, §15.119
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-23"></a>
## Phase 23 — Options par lieu, application installable, logo

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.118
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-24"></a>
## Phase 24 — Adresse du site flaixexpert.flaixlabs.com

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.120
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-25"></a>
## Phase 25 — Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.121, §15.122
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-26"></a>
## Phase 26 — Click & Collect neutre, export comptable dans la base, assiette de la commission

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.123, §15.124
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-27"></a>
## Phase 27 — Stock des ingrédients au choix (bière pression)

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.125
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-28"></a>
## Phase 28 — Logo officiel v2

- **Dates** : 
- **Décision et raisonnement** : dossier projet —
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-29"></a>
## Phase 29 — Dossier de conformité v0.1

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.126
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-30"></a>
## Phase 30 — Fidélité à la caisse : code promo et points dans le ticket scellé

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.127
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-31"></a>
## Phase 31 — Suivi du développement et préparation de l'audit Codex

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.128
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-32"></a>
## Phase 32 — Premier audit Codex et corrections

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.129
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-33"></a>
## Phase 33 — Caisse automatique selon la date, clôture par le directeur, « événement » partout

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.130
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-34"></a>
## Phase 34 — Rapport de soirée figé à la clôture, imprimable et en PDF

- **Dates** : 
- **Décision et raisonnement** : dossier projet §15.131
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :

<a id="phase-35"></a>
## Phase 35 — Cibles de marge et gestion financière de la soirée

- **Dates** : 2026-10-04
- **Décision et raisonnement** : dossier projet §15.132
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`074647f`](https://github.com/Break-Eat-APP/flaix-expert/commit/074647f3a6d171ab1f4b33201e211395759a1efa) 2026-10-04 — Cibles de marge et gestion financière de la soirée (modules 5 et 11, dossier §15.132)
- **Migrations (base)** :
  - [`db/migrations/0027_cibles_finances.sql`](../../db/migrations/0027_cibles_finances.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/finances.ts`](../../packages/domain/src/finances.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/rapport-soiree.ts`](../../packages/domain/src/rapport-soiree.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/finances.ts`](../../apps/api/src/routes/finances.ts) — créé
  - [`apps/api/src/routes/produits.ts`](../../apps/api/src/routes/produits.ts) — modifié
  - [`apps/api/src/routes/rapport-soiree.ts`](../../apps/api/src/routes/rapport-soiree.ts) — modifié
  - [`apps/api/src/routes/resultats.ts`](../../apps/api/src/routes/resultats.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/cibles.tsx`](../../apps/web/src/composants/cibles.tsx) — créé
  - [`apps/web/src/pages/parametres/Objectifs.tsx`](../../apps/web/src/pages/parametres/Objectifs.tsx) — créé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/pages/parametres/Produits.tsx`](../../apps/web/src/pages/parametres/Produits.tsx) — modifié
  - [`apps/web/src/pages/resultats/Finances.test.tsx`](../../apps/web/src/pages/resultats/Finances.test.tsx) — créé
  - [`apps/web/src/pages/resultats/Finances.tsx`](../../apps/web/src/pages/resultats/Finances.tsx) — créé
  - [`apps/web/src/pages/resultats/RapportSoiree.test.tsx`](../../apps/web/src/pages/resultats/RapportSoiree.test.tsx) — modifié
  - [`apps/web/src/pages/resultats/RapportSoiree.tsx`](../../apps/web/src/pages/resultats/RapportSoiree.tsx) — modifié
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — modifié
  - [`apps/web/src/resultats.css`](../../apps/web/src/resultats.css) — modifié
- **Tests** :
  - [`apps/api/test/finances.test.ts`](../../apps/api/test/finances.test.ts) — créé
  - [`apps/api/test/rapport-soiree.test.ts`](../../apps/api/test/rapport-soiree.test.ts) — modifié
  - [`packages/domain/src/finances.test.ts`](../../packages/domain/src/finances.test.ts) — créé
  - [`packages/domain/src/rapport-soiree.test.ts`](../../packages/domain/src/rapport-soiree.test.ts) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-36"></a>
## Phase 36 — Bilan sur une période du … au …

- **Dates** : 2026-10-04
- **Décision et raisonnement** : dossier projet §15.133
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`10e0186`](https://github.com/Break-Eat-APP/flaix-expert/commit/10e018659b30bb2cf3a005ec4ef65994e92ce077) 2026-10-04 — Bilan sur une période « du … au … » dans Résultats et Finances (dossier §15.133)
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/finances.ts`](../../packages/domain/src/finances.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/periode-bilan.ts`](../../packages/domain/src/periode-bilan.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/finances.ts`](../../apps/api/src/routes/finances.ts) — modifié
  - [`apps/api/src/routes/resultats.ts`](../../apps/api/src/routes/resultats.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/resultats/Finances.test.tsx`](../../apps/web/src/pages/resultats/Finances.test.tsx) — modifié
  - [`apps/web/src/pages/resultats/Finances.tsx`](../../apps/web/src/pages/resultats/Finances.tsx) — modifié
  - [`apps/web/src/pages/resultats/Tableaux.test.tsx`](../../apps/web/src/pages/resultats/Tableaux.test.tsx) — créé
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — modifié
  - [`apps/web/src/resultats.css`](../../apps/web/src/resultats.css) — modifié
- **Tests** :
  - [`apps/api/test/periode.test.ts`](../../apps/api/test/periode.test.ts) — créé
  - [`packages/domain/src/periode-bilan.test.ts`](../../packages/domain/src/periode-bilan.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-37"></a>
## Phase 37 — Brief de fin de soirée en notification sur le téléphone

- **Dates** : 2026-10-04
- **Décision et raisonnement** : dossier projet §15.134, §15.135
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`bcb9455`](https://github.com/Break-Eat-APP/flaix-expert/commit/bcb9455bc942b80996d2302d3467a2a1a9316a56) 2026-10-04 — Brief de fin de soirée envoyé en notification sur le téléphone du directeur (dossier §15.135)
- **Migrations (base)** :
  - [`db/migrations/0028_brief_notifications.sql`](../../db/migrations/0028_brief_notifications.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/brief.ts`](../../packages/domain/src/brief.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/package.json`](../../apps/api/package.json) — modifié
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/routes/notifications.ts`](../../apps/api/src/routes/notifications.ts) — créé
  - [`apps/api/src/routes/rapport-soiree.ts`](../../apps/api/src/routes/rapport-soiree.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/public/sw.js`](../../apps/web/public/sw.js) — modifié
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/parametres/Notifications.test.tsx`](../../apps/web/src/pages/parametres/Notifications.test.tsx) — créé
  - [`apps/web/src/pages/parametres/Notifications.tsx`](../../apps/web/src/pages/parametres/Notifications.tsx) — créé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/pages/resultats/RapportSoiree.test.tsx`](../../apps/web/src/pages/resultats/RapportSoiree.test.tsx) — modifié
  - [`apps/web/src/pages/resultats/RapportSoiree.tsx`](../../apps/web/src/pages/resultats/RapportSoiree.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/notifications.test.ts`](../../apps/api/test/notifications.test.ts) — créé
  - [`packages/domain/src/brief.test.ts`](../../packages/domain/src/brief.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
- **Autres** :
  - [`pnpm-lock.yaml`](../../pnpm-lock.yaml) — modifié

<a id="phase-38"></a>
## Phase 38 — Assistant « pose ta question » et brief reformulé par Mistral

- **Dates** : 2026-10-04
- **Décision et raisonnement** : dossier projet §15.136, §15.137
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`4a30d13`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a30d1373cebf546b6614e731c9fb280fa9d41d6) 2026-10-04 — Assistant « pose ta question » et brief reformulé par Mistral, derrière une option du lieu (dossier §15.136)
  - [`047ce76`](https://github.com/Break-Eat-APP/flaix-expert/commit/047ce760656a8c5a5ba720501ede4c6bcedf593a) 2026-10-04 — Passerelle d'IA : Mistral d'abord, OVHcloud AI Endpoints en secours (dossier §15.137)
- **Migrations (base)** :
  - [`db/migrations/0029_assistant.sql`](../../db/migrations/0029_assistant.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/assistant.ts`](../../packages/domain/src/assistant.ts) — créé
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — modifié
  - [`apps/api/src/ia/fournisseur.ts`](../../apps/api/src/ia/fournisseur.ts) — créé
  - [`apps/api/src/routes/assistant.ts`](../../apps/api/src/routes/assistant.ts) — créé
  - [`apps/api/src/routes/notifications.ts`](../../apps/api/src/routes/notifications.ts) — modifié
  - [`apps/api/src/routes/produits.ts`](../../apps/api/src/routes/produits.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/Assistant.test.tsx`](../../apps/web/src/pages/Assistant.test.tsx) — créé
  - [`apps/web/src/pages/Assistant.tsx`](../../apps/web/src/pages/Assistant.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/assistant.test.ts`](../../apps/api/test/assistant.test.ts) — créé
  - [`apps/api/test/ia.test.ts`](../../apps/api/test/ia.test.ts) — créé
  - [`apps/api/test/options.test.ts`](../../apps/api/test/options.test.ts) — modifié
  - [`apps/web/src/composants/Coquille.test.ts`](../../apps/web/src/composants/Coquille.test.ts) — modifié
  - [`packages/domain/src/assistant.test.ts`](../../packages/domain/src/assistant.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-39"></a>
## Phase 39 — Revenue Engine : « Où je perds de l'argent »

- **Dates** : 2026-10-04
- **Décision et raisonnement** : dossier projet §15.138
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`21c7f53`](https://github.com/Break-Eat-APP/flaix-expert/commit/21c7f53ff7f62de497df5079a50ec1bafa83e392) 2026-10-04 — Revenue Engine : moteur « où je perds de l'argent » et décision (dossier §15.138)
  - [`6679d7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/6679d7e3b95a5b0a3d944201499bac16b653694e) 2026-10-04 — Revenue Engine : route GET /api/pertes, événement ou période (dossier §15.138)
  - [`f001e72`](https://github.com/Break-Eat-APP/flaix-expert/commit/f001e72807328fbfd90912174919d11b7dd5f91b) 2026-10-04 — Revenue Engine : onglet « Où je perds de l'argent » dans Résultats (dossier §15.138)
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/pertes.ts`](../../packages/domain/src/pertes.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/pertes.ts`](../../apps/api/src/routes/pertes.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/resultats/Pertes.test.tsx`](../../apps/web/src/pages/resultats/Pertes.test.tsx) — créé
  - [`apps/web/src/pages/resultats/Pertes.tsx`](../../apps/web/src/pages/resultats/Pertes.tsx) — créé
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — modifié
  - [`apps/web/src/resultats.css`](../../apps/web/src/resultats.css) — modifié
- **Tests** :
  - [`apps/api/test/pertes.test.ts`](../../apps/api/test/pertes.test.ts) — créé
  - [`packages/domain/src/pertes.test.ts`](../../packages/domain/src/pertes.test.ts) — créé
- **Documentation** :
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-40"></a>
## Phase 40 — Temps de prise de commande, par caisse et par stand

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.139
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`72f087a`](https://github.com/Break-Eat-APP/flaix-expert/commit/72f087a9c12264b7aa6c658c949a6008d8e4b290) 2026-10-05 — Temps de prise de commande, par caisse et par stand (dossier §15.139)
- **Migrations (base)** :
  - [`db/migrations/0030_temps_de_service.sql`](../../db/migrations/0030_temps_de_service.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/caisse-scellee.ts`](../../packages/domain/src/caisse-scellee.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/pertes.ts`](../../packages/domain/src/pertes.ts) — modifié
  - [`packages/domain/src/temps-service.ts`](../../packages/domain/src/temps-service.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/src/routes/pertes.ts`](../../apps/api/src/routes/pertes.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/caisse/EcranCaisse.test.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.test.tsx) — modifié
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/resultats/Pertes.test.tsx`](../../apps/web/src/pages/resultats/Pertes.test.tsx) — modifié
  - [`apps/web/src/pages/resultats/Pertes.tsx`](../../apps/web/src/pages/resultats/Pertes.tsx) — modifié
- **Tests** :
  - [`apps/api/test/pertes.test.ts`](../../apps/api/test/pertes.test.ts) — modifié
  - [`packages/domain/src/temps-service.test.ts`](../../packages/domain/src/temps-service.test.ts) — créé

<a id="phase-41"></a>
## Phase 41 — Centre d'alertes et rupture de stock poussée sur le téléphone

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.140
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`b24b3c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b24b3c607722123e302c890c09795f70f602d59f) 2026-10-05 — Centre d'alertes et rupture de stock poussée sur le téléphone (module 18, dossier §15.140)
- **Migrations (base)** :
  - [`db/migrations/0031_centre_alertes.sql`](../../db/migrations/0031_centre_alertes.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/alertes.ts`](../../packages/domain/src/alertes.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/alertes.ts`](../../apps/api/src/routes/alertes.ts) — créé
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/src/routes/click-collect.ts`](../../apps/api/src/routes/click-collect.ts) — modifié
  - [`apps/api/src/routes/notifications.ts`](../../apps/api/src/routes/notifications.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/alertes/CentreAlertes.test.tsx`](../../apps/web/src/pages/alertes/CentreAlertes.test.tsx) — créé
  - [`apps/web/src/pages/alertes/CentreAlertes.tsx`](../../apps/web/src/pages/alertes/CentreAlertes.tsx) — créé
  - [`apps/web/src/pages/parametres/Notifications.test.tsx`](../../apps/web/src/pages/parametres/Notifications.test.tsx) — modifié
  - [`apps/web/src/pages/parametres/Notifications.tsx`](../../apps/web/src/pages/parametres/Notifications.tsx) — modifié
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — modifié
- **Tests** :
  - [`apps/api/test/alertes.test.ts`](../../apps/api/test/alertes.test.ts) — créé
  - [`packages/domain/src/alertes.test.ts`](../../packages/domain/src/alertes.test.ts) — créé

<a id="phase-42"></a>
## Phase 42 — Comparaison des prix entre fournisseurs

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.141
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`cb5cb03`](https://github.com/Break-Eat-APP/flaix-expert/commit/cb5cb039544ae547d7f86b649da7a5af4e35f00c) 2026-10-05 — Comparaison des prix entre fournisseurs (module 5, dossier §15.141)
- **Migrations (base)** :
  - [`db/migrations/0032_conditionnements_fournisseurs.sql`](../../db/migrations/0032_conditionnements_fournisseurs.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/fournisseurs.ts`](../../packages/domain/src/fournisseurs.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/fournisseurs.ts`](../../apps/api/src/routes/fournisseurs.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/stock/PrixFournisseurs.tsx`](../../apps/web/src/pages/stock/PrixFournisseurs.tsx) — créé
  - [`apps/web/src/pages/stock/Stock.tsx`](../../apps/web/src/pages/stock/Stock.tsx) — modifié
- **Tests** :
  - [`apps/api/test/fournisseurs.test.ts`](../../apps/api/test/fournisseurs.test.ts) — créé
  - [`packages/domain/src/fournisseurs.test.ts`](../../packages/domain/src/fournisseurs.test.ts) — créé

<a id="phase-43"></a>
## Phase 43 — Back-office niveau 2 : support sur autorisation du lieu

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.142
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`0a675eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/0a675ebb0890bbe6e768539eac7b651b1c0d73a6) 2026-10-05 — Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.142)
- **Migrations (base)** :
  - [`db/migrations/0033_support_niveau2.sql`](../../db/migrations/0033_support_niveau2.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/auth/contexte.ts`](../../apps/api/src/auth/contexte.ts) — modifié
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — modifié
  - [`apps/api/src/base.ts`](../../apps/api/src/base.ts) — modifié
  - [`apps/api/src/routes/editeur.ts`](../../apps/api/src/routes/editeur.ts) — modifié
  - [`apps/api/src/routes/outils.ts`](../../apps/api/src/routes/outils.ts) — modifié
  - [`apps/api/src/routes/support.ts`](../../apps/api/src/routes/support.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/editeur/EspaceEditeur.tsx`](../../apps/web/src/pages/editeur/EspaceEditeur.tsx) — modifié
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/pages/parametres/SupportFlaix.test.tsx`](../../apps/web/src/pages/parametres/SupportFlaix.test.tsx) — créé
  - [`apps/web/src/pages/parametres/SupportFlaix.tsx`](../../apps/web/src/pages/parametres/SupportFlaix.tsx) — créé
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — modifié
- **Tests** :
  - [`apps/api/test/support.test.ts`](../../apps/api/test/support.test.ts) — créé

<a id="phase-44"></a>
## Phase 44 — Prévision du prochain événement

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.143
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`534a3a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/534a3a6d867afcbcf5840bc11afcfd7c0f245267) 2026-10-05 — Prévision du prochain événement (dossier §15.143)
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/prevision.ts`](../../packages/domain/src/prevision.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/prevision.ts`](../../apps/api/src/routes/prevision.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/prevision/Prevision.test.tsx`](../../apps/web/src/pages/prevision/Prevision.test.tsx) — créé
  - [`apps/web/src/pages/prevision/Prevision.tsx`](../../apps/web/src/pages/prevision/Prevision.tsx) — créé
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — modifié
  - [`apps/web/src/pages/stock/Stock.tsx`](../../apps/web/src/pages/stock/Stock.tsx) — modifié
- **Tests** :
  - [`apps/api/test/prevision.test.ts`](../../apps/api/test/prevision.test.ts) — créé
  - [`packages/domain/src/prevision.test.ts`](../../packages/domain/src/prevision.test.ts) — créé

<a id="phase-45"></a>
## Phase 45 — IA : OVHcloud seul comme moteur de langage de l'agent

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.145
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`0cf75f7`](https://github.com/Break-Eat-APP/flaix-expert/commit/0cf75f74279946891a5f97e9149a8f8086144895) 2026-10-05 — IA : OVHcloud seul comme moteur de langage de l'agent (dossier §15.145)
  - [`b860416`](https://github.com/Break-Eat-APP/flaix-expert/commit/b8604166a371e12a7b414dbe8de26b42bae76ad6) 2026-10-05 — IA OVHcloud : « clé d'API » comme dans l'espace OVHcloud, commande à lancer en une ligne depuis PowerShell
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/ia/fournisseur.ts`](../../apps/api/src/ia/fournisseur.ts) — modifié
  - [`apps/api/src/routes/assistant.ts`](../../apps/api/src/routes/assistant.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/Assistant.test.tsx`](../../apps/web/src/pages/Assistant.test.tsx) — modifié
  - [`apps/web/src/pages/Assistant.tsx`](../../apps/web/src/pages/Assistant.tsx) — modifié
- **Tests** :
  - [`apps/api/test/assistant.test.ts`](../../apps/api/test/assistant.test.ts) — modifié
- **Serveur et outils (infra)** :
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-46"></a>
## Phase 46 — E-mails par Brevo : rapport de soirée et rectifications

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.146
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`3276652`](https://github.com/Break-Eat-APP/flaix-expert/commit/3276652190fa7fd86d1a643f2ee027e7f657ecf5) 2026-10-05 — E-mails par Brevo : rapport de soirée à la clôture, notification des rectifications de Z (dossier §15.146)
- **Migrations (base)** :
  - [`db/migrations/0034_emails.sql`](../../db/migrations/0034_emails.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/emails.ts`](../../packages/domain/src/emails.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — modifié
  - [`apps/api/src/routes/clotures.ts`](../../apps/api/src/routes/clotures.ts) — modifié
  - [`apps/api/src/routes/emails.ts`](../../apps/api/src/routes/emails.ts) — créé
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/parametres/EmailsLieu.test.tsx`](../../apps/web/src/pages/parametres/EmailsLieu.test.tsx) — créé
  - [`apps/web/src/pages/parametres/EmailsLieu.tsx`](../../apps/web/src/pages/parametres/EmailsLieu.tsx) — créé
  - [`apps/web/src/pages/parametres/Notifications.tsx`](../../apps/web/src/pages/parametres/Notifications.tsx) — modifié
- **Tests** :
  - [`apps/api/test/emails.test.ts`](../../apps/api/test/emails.test.ts) — créé
  - [`packages/domain/src/emails.test.ts`](../../packages/domain/src/emails.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-47"></a>
## Phase 47 — Carte abonné dans Apple Wallet et Google Wallet

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.147
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`91b5446`](https://github.com/Break-Eat-APP/flaix-expert/commit/91b5446a293d1a7d981e749812d1e1e4e0f64cb4) 2026-10-05 — Wallet (1/4) : décision, migration 0035 et contenu de la carte abonné (dossier §15.147)
  - [`6a23cf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/6a23cf28837f784116a2d8c2af19180175019ce0) 2026-10-05 — Wallet (2/4) : carte Apple et Google côté serveur, service web PassKit, mises à jour du solde (dossier §15.147)
  - [`0b0f1ee`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b0f1eea2f883d395f0a8b4a2f5bc2c208aeeae0) 2026-10-05 — Wallet (3/4) : commandes flaix-admin pour la carte Apple (clé et demande de certificat sur le serveur, installation de pass.cer contrôlée) et Google (clé du compte de service vérifiée auprès de Google) (dossier §15.147)
  - [`4662794`](https://github.com/Break-Eat-APP/flaix-expert/commit/466279489d406c8ac1230051e1717cb73e7cf8d5) 2026-10-05 — Wallet (4/4) : page de la carte de l'abonné (/carte/<jeton>), lien de la carte dans la fiche de l'abonné, onglet « Carte téléphone » et couleur des cartes (dossier §15.147)
- **Migrations (base)** :
  - [`db/migrations/0035_wallet.sql`](../../db/migrations/0035_wallet.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
  - [`packages/domain/src/emails.ts`](../../packages/domain/src/emails.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/wallet.ts`](../../packages/domain/src/wallet.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/package.json`](../../apps/api/package.json) — modifié
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — modifié
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/src/routes/emails.ts`](../../apps/api/src/routes/emails.ts) — modifié
  - [`apps/api/src/routes/fidelite.ts`](../../apps/api/src/routes/fidelite.ts) — modifié
  - [`apps/api/src/routes/wallet.ts`](../../apps/api/src/routes/wallet.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
  - [`apps/api/src/wallet/apple.ts`](../../apps/api/src/wallet/apple.ts) — créé
  - [`apps/api/src/wallet/fichiers.ts`](../../apps/api/src/wallet/fichiers.ts) — créé
  - [`apps/api/src/wallet/google.ts`](../../apps/api/src/wallet/google.ts) — créé
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/carte/PageCarte.tsx`](../../apps/web/src/pages/carte/PageCarte.tsx) — créé
  - [`apps/web/src/pages/fidelite/CarteWallet.test.tsx`](../../apps/web/src/pages/fidelite/CarteWallet.test.tsx) — créé
  - [`apps/web/src/pages/fidelite/CarteWallet.tsx`](../../apps/web/src/pages/fidelite/CarteWallet.tsx) — créé
  - [`apps/web/src/pages/fidelite/Fidelite.tsx`](../../apps/web/src/pages/fidelite/Fidelite.tsx) — modifié
  - [`apps/web/src/pages/parametres/EmailsLieu.tsx`](../../apps/web/src/pages/parametres/EmailsLieu.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/emails.test.ts`](../../apps/api/test/emails.test.ts) — modifié
  - [`apps/api/test/wallet-fichiers.test.ts`](../../apps/api/test/wallet-fichiers.test.ts) — créé
  - [`apps/api/test/wallet.test.ts`](../../apps/api/test/wallet.test.ts) — créé
  - [`packages/domain/src/wallet.test.ts`](../../packages/domain/src/wallet.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
- **Autres** :
  - [`pnpm-lock.yaml`](../../pnpm-lock.yaml) — modifié

<a id="phase-48"></a>
## Phase 48 — Design de la carte abonné : logo, bannière, couleurs, textes et liens

- **Dates** : 2026-10-05
- **Décision et raisonnement** : dossier projet §15.148
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`0721b51`](https://github.com/Break-Eat-APP/flaix-expert/commit/0721b5128becc3a3b38e22653d7e7f98d6602f6a) 2026-10-05 — Design de la carte abonné (1/2) : logo, bannière, couleurs, textes, informations et liens ; modèle Google remplacé à chaque changement (dossier §15.148)
  - [`a6538ef`](https://github.com/Break-Eat-APP/flaix-expert/commit/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561) 2026-10-05 — Design de la carte abonné (2/2) : éditeur avec aperçu iPhone et Android, logo et bannière retaillés dans le navigateur, page de l'abonné aux couleurs du club (dossier §15.148)
- **Migrations (base)** :
  - [`db/migrations/0036_design_carte.sql`](../../db/migrations/0036_design_carte.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/wallet.ts`](../../packages/domain/src/wallet.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/fidelite.ts`](../../apps/api/src/routes/fidelite.ts) — modifié
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — modifié
  - [`apps/api/src/routes/wallet.ts`](../../apps/api/src/routes/wallet.ts) — modifié
  - [`apps/api/src/wallet/apple.ts`](../../apps/api/src/wallet/apple.ts) — modifié
  - [`apps/api/src/wallet/google.ts`](../../apps/api/src/wallet/google.ts) — modifié
  - [`apps/api/src/wallet/images.ts`](../../apps/api/src/wallet/images.ts) — créé
- **Écrans (apps/web)** :
  - [`apps/web/src/api.ts`](../../apps/web/src/api.ts) — modifié
  - [`apps/web/src/composants/ApercuCarte.tsx`](../../apps/web/src/composants/ApercuCarte.tsx) — créé
  - [`apps/web/src/pages/carte/PageCarte.tsx`](../../apps/web/src/pages/carte/PageCarte.tsx) — modifié
  - [`apps/web/src/pages/fidelite/CarteWallet.test.tsx`](../../apps/web/src/pages/fidelite/CarteWallet.test.tsx) — modifié
  - [`apps/web/src/pages/fidelite/CarteWallet.tsx`](../../apps/web/src/pages/fidelite/CarteWallet.tsx) — modifié
  - [`apps/web/src/pages/fidelite/DesignCarte.test.tsx`](../../apps/web/src/pages/fidelite/DesignCarte.test.tsx) — créé
  - [`apps/web/src/pages/fidelite/DesignCarte.tsx`](../../apps/web/src/pages/fidelite/DesignCarte.tsx) — créé
  - [`apps/web/src/pages/fidelite/Fidelite.tsx`](../../apps/web/src/pages/fidelite/Fidelite.tsx) — modifié
  - [`apps/web/src/pages/fidelite/imagesCarte.ts`](../../apps/web/src/pages/fidelite/imagesCarte.ts) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/wallet-fichiers.test.ts`](../../apps/api/test/wallet-fichiers.test.ts) — modifié
  - [`apps/api/test/wallet.test.ts`](../../apps/api/test/wallet.test.ts) — modifié
  - [`packages/domain/src/wallet.test.ts`](../../packages/domain/src/wallet.test.ts) — modifié

## Commits non rattachés à une phase

- [`dd181a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/dd181a0ad88f55d567f681ba03eb489194720d49) 2026-10-04 — Journal : phase 34 (rapport de soirée)
- [`11ce1ec`](https://github.com/Break-Eat-APP/flaix-expert/commit/11ce1ecd57c4babe97af5e5d6d157f8225073384) 2026-10-04 — Journal : phase 35 (cibles de marge et gestion financière)
- [`8ed1a2c`](https://github.com/Break-Eat-APP/flaix-expert/commit/8ed1a2c0c059f5d1613ab92bdd7b83c295e8d57a) 2026-10-04 — Journal : phase 36 (bilan sur une période)
- [`2f42193`](https://github.com/Break-Eat-APP/flaix-expert/commit/2f42193e3a18d9e7a30cfbfc6c6e739f3c00c4ab) 2026-10-04 — Analyse « Intelligence, prévision et décision » v1 : avis sur la note produit, marché, propositions, IA, cadre juridique (dossier §15.134)
- [`8354e35`](https://github.com/Break-Eat-APP/flaix-expert/commit/8354e354ef96657d911a1b10f615058d6fdbbd4d) 2026-10-04 — Journal : phase 37 (brief de fin de soirée)
- [`7175d0b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7175d0b6da4bd25db4dfe1b15a394b1b296070b8) 2026-10-04 — Journal : phase 38 (assistant Mistral)
- [`aa091ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/aa091ea651d6d39adf78be704c765b8aaf035d81) 2026-10-04 — Journal : passerelle d'IA rattachée à la phase 38
- [`ffe43d3`](https://github.com/Break-Eat-APP/flaix-expert/commit/ffe43d3af21b6ddbc869b3f7da205f7d904c1aa1) 2026-10-04 — Avancement : inventaire des modules remis à jour au 2026-10-04
- [`4d416ac`](https://github.com/Break-Eat-APP/flaix-expert/commit/4d416ac5c9af2fd00b7ef7a4294d8bfd6935d208) 2026-10-04 — Journal : phase 39 (Revenue Engine) ; décision du temps de prise de commande par caisse (dossier §15.139)
- [`5516b41`](https://github.com/Break-Eat-APP/flaix-expert/commit/5516b41e3dbdcc3ce1c10a7ccff1063ff76554b5) 2026-10-05 — Dossier : temps de commande, centre d'alertes, prix fournisseurs, support niveau 2, prévision, copie de configuration abandonnée (§15.139 à §15.144)
- [`7b69e85`](https://github.com/Break-Eat-APP/flaix-expert/commit/7b69e85de78f1fac19cd496629c63b9e522a6065) 2026-10-05 — Journal : phases 40 à 44 (temps de commande, centre d'alertes, fournisseurs, support niveau 2, prévision) ; avancement à jour
- [`e9427a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/e9427a6ab263b3b376ecb1e7ce3dd80bddafd756) 2026-10-05 — Avancement : vérification à l'écran terminée (prévision, temps de commande)
- [`12c69e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/12c69e10bb15cef6b7a2fe3c1b9aca1164f0447c) 2026-10-05 — Avancement : serveur de test mis à jour (version b860416, migrations 0030 à 0033)
- [`4e7e74f`](https://github.com/Break-Eat-APP/flaix-expert/commit/4e7e74f45c43f70b3ee27ca74bfa94a7c3c24ac7) 2026-10-05 — Journal : phases 45 (IA OVHcloud) et 46 (e-mails Brevo)
- [`f340c85`](https://github.com/Break-Eat-APP/flaix-expert/commit/f340c853e04d5d91d99f11eb7aac9ce2a4badb9b) 2026-10-05 — Mise en ligne : le script de déploiement se met lui-même à jour sur le serveur
- [`d123027`](https://github.com/Break-Eat-APP/flaix-expert/commit/d123027d3c4f02b8ca73cd8c990019473dee6bc5) 2026-10-05 — flaix-admin cle-brevo : affiche l'explication de Brevo en cas de refus, repère une clé SMTP collée à la place de la clé d'API
- [`b53a267`](https://github.com/Break-Eat-APP/flaix-expert/commit/b53a2678daa08283526661fb0f6cc7dc412871f2) 2026-10-05 — Avancement : e-mails Brevo en service sur le serveur de test
- [`e351ee5`](https://github.com/Break-Eat-APP/flaix-expert/commit/e351ee57abeae90827b77754ac066428182ab6e8) 2026-10-05 — Wallet : dossier (réalisé), guide de Rémi pour Apple et Google, avancement, journal des phases (phase 47)
- [`be734a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/be734a0497d48788218b17e3b7ca385dad80b572) 2026-10-05 — Avancement : carte wallet déployée sur le serveur de test
- [`5f928e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/5f928e10cc45c602f4c6025704971d34856183db) 2026-10-05 — Avancement : comptes Apple et Google de la carte wallet installés sur le serveur de test
- [`405b044`](https://github.com/Break-Eat-APP/flaix-expert/commit/405b04421a55f9f71482ed1e464f153e5a0a69fd) 2026-10-05 — Design de la carte abonné : dossier §15.148, avancement, guide, journal des phases (phase 48)
- [`c98b882`](https://github.com/Break-Eat-APP/flaix-expert/commit/c98b882efcd70c79f464cc1e546f91853d980989) 2026-10-05 — Avancement : design de la carte abonné déployé sur le serveur de test
- [`0100cd3`](https://github.com/Break-Eat-APP/flaix-expert/commit/0100cd3380139b256f15edbeccb9a6e011098fe0) 2026-10-05 — Audit : revue des phases 39 à 48 par Claude (P2 : caisse qui attend les notifications, carte d'un abonné désactivé, mise à jour des cartes par lots, node-forge, limite PassKit) ; prompt Codex pour les phases 33 à 48
- [`360895e`](https://github.com/Break-Eat-APP/flaix-expert/commit/360895e746e57d6f985505fa58cf94afdb6f23de) 2026-10-05 — Audit du 2026-10-05 : corrections P2-1 à P2-5
- [`76af5c9`](https://github.com/Break-Eat-APP/flaix-expert/commit/76af5c92f3e186a120cd2e3668844fe9dc061ffe) 2026-10-05 — Audit du 2026-10-05 : corrections notées dans le rapport ; avancement
- [`2d49d12`](https://github.com/Break-Eat-APP/flaix-expert/commit/2d49d1218f629a5d93562d3ba0a4ff5c745ce676) 2026-10-05 — Avancement : corrections de l'audit déployées sur le serveur de test
- [`9df5acd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9df5acd92b8e84a20dd79f5618ce68696fbac7a5) 2026-10-05 — Audit Codex du 2026-10-05 : corrections
- [`2bbfa35`](https://github.com/Break-Eat-APP/flaix-expert/commit/2bbfa3531dcfe02072e54fb3bd50af167f895278) 2026-10-05 — Audit Codex : mise en ligne vérifiée ; réglages Apple et Google enfin lus par le serveur (script de mise en ligne jamais mis à jour)
- [`038601d`](https://github.com/Break-Eat-APP/flaix-expert/commit/038601dc4ccf133e081626a7d3d43199468d47ba) 2026-10-05 — Audits du 2026-10-05 : lien de carte refusé pour un abonné désactivé ; P3-1, P3-2, P3-3
- [`e463281`](https://github.com/Break-Eat-APP/flaix-expert/commit/e4632817f4f7960b4f8c102ceda8d45f25de0ba3) 2026-10-05 — Conformité : proposition pour les pièces restantes avant la production (dossier §15.149, à valider) ; avancement
