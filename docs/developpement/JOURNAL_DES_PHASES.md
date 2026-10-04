# Journal des phases de développement — FlaiX Expert

> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git : à relancer après chaque phase. Ne pas modifier à la main (ajouter la phase dans le script).
> Pour chaque phase : la **décision** (section du dossier projet `docs/flaix-gestion-dossier-projet.md`), les **commits** (liens GitHub), puis les fichiers touchés, rangés par couche. Les règles du projet sont dans [`AGENTS.md`](../../AGENTS.md), la carte du code dans [`CARTE_DU_CODE.md`](CARTE_DU_CODE.md).

| Phase | Sujet | Décision | Commits | État |
|---|---|---|---|---|
| 0 | [Socle de production et configuration d'un lieu vide](#phase-0) | §15.93 | [`4a205cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a205cb70382af4b1ae34c55e3f86c529ef714f0) [`40693c8`](https://github.com/Break-Eat-APP/flaix-expert/commit/40693c85ae0183bd8cf90613fa503abaf344461d) | livrée |
| 1 | [Matchs, caisse, Mes caisses, journal des tickets](#phase-1) | §15.94 | [`f454873`](https://github.com/Break-Eat-APP/flaix-expert/commit/f454873fd886775f86e40826d636a9643993d65e) | livrée |
| 2 | [Retour de démonstration, organisation en 6 entrées, maquettes](#phase-2) | §15.95, §15.96, §15.98 | [`9c7d7a9`](https://github.com/Break-Eat-APP/flaix-expert/commit/9c7d7a9cfac6576334b90a7f9fa4c400247d340b) [`0ef6cf1`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ef6cf1642dc15da9025d83ffadf1499006a4072) [`26237fc`](https://github.com/Break-Eat-APP/flaix-expert/commit/26237fc761668dc3febbef1056001ddf8b472018) [`0219e7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/0219e7e9bc8049916b4296e348f738e4c586ac9d) [`6f272dd`](https://github.com/Break-Eat-APP/flaix-expert/commit/6f272ddafe23fd7a7aadc1863c7f2e69675e49d7) [`c3c6168`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3c616893e44194563a4b7cdca5c11ce674c18db) | livrée |
| 3 | [Vente sans réseau : la tablette scelle, le serveur vérifie](#phase-3) | §15.97 | [`6fb5840`](https://github.com/Break-Eat-APP/flaix-expert/commit/6fb584066acdbb07aba1202a849e6d8355ca6eb2) | livrée |
| 4 | [Serveur de test OVH](#phase-4) | guide-serveur-test-ovh.md | [`249f3f5`](https://github.com/Break-Eat-APP/flaix-expert/commit/249f3f515fcf3fb18838b3fa7da93a25c8bd64d2) [`ef7c9fa`](https://github.com/Break-Eat-APP/flaix-expert/commit/ef7c9fa97f461831a4b39359294ce9e8cc3b1417) | livrée |
| 5 | [Comptes des caissières et tablettes enregistrées](#phase-5) | §15.99, §15.100 | [`d51b910`](https://github.com/Break-Eat-APP/flaix-expert/commit/d51b910bfd4c17aa9b75ce8476936e8dfff70136) [`3f03ee8`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f03ee810aba01f1df5ca9c205f9b797ea37829d) [`9253115`](https://github.com/Break-Eat-APP/flaix-expert/commit/92531158323017d891cde1de21856af2f3ddd672) [`9324475`](https://github.com/Break-Eat-APP/flaix-expert/commit/9324475237b4721e3a80c10b517659e1a3a30f59) | livrée |
| 6 | [Ticket client sur demande et duplicata](#phase-6) | §15.101 | [`911d4b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/911d4b3b22ad6e2d31206d2b1c653d4e3565111f) | livrée |
| 7 | [Clôture du match : Z des tiroirs, rectification signée](#phase-7) | §15.102 | [`c8e6246`](https://github.com/Break-Eat-APP/flaix-expert/commit/c8e624655779c4a12c57e9dd2fbac1e91a3a6015) [`3398ccb`](https://github.com/Break-Eat-APP/flaix-expert/commit/3398ccba3c5083fffb474060fadbd64679b93441) [`d3670c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3670c65e032f1ade82ea7d9a05cca551a05b109) | livrée |
| 8 | [Résultats sur les vraies ventes](#phase-8) | §15.103 | [`d0985d1`](https://github.com/Break-Eat-APP/flaix-expert/commit/d0985d1d0d9e4401daf162b3691e0a8bbf64d93d) [`d29e769`](https://github.com/Break-Eat-APP/flaix-expert/commit/d29e769b04006130ef9260ed5ac5a4e52015c7b2) [`d3194ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3194ab2b67f34b45515cd6ef005c9494c72cb34) | livrée |
| 9 | [Équipe : fiches, planning, masse salariale](#phase-9) | §15.104 | [`40c3f7b`](https://github.com/Break-Eat-APP/flaix-expert/commit/40c3f7bf6313745264d25bffd53c8e512e445054) [`bbf7f4b`](https://github.com/Break-Eat-APP/flaix-expert/commit/bbf7f4b05168d8a41c7df7eae0341107a52da5f9) [`3509f19`](https://github.com/Break-Eat-APP/flaix-expert/commit/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde) | livrée |
| 10 | [Stock : réserve, livraisons au CUMP, mise en place, comptage](#phase-10) | §15.105 | [`d8163c3`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8163c3ae7c7d8dc902a0343e61d41069b3c8807) [`292fe39`](https://github.com/Break-Eat-APP/flaix-expert/commit/292fe3901113c8d297cd808b95959985516550e3) [`9b43fdd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba) | livrée |
| 11 | [Remontées au coffre et Z du coffre](#phase-11) | §15.106 | [`27be12a`](https://github.com/Break-Eat-APP/flaix-expert/commit/27be12a8bbffc011ac34ee44c6857d306160e17e) [`4aa3109`](https://github.com/Break-Eat-APP/flaix-expert/commit/4aa310972d68abaf25e02e92529e7ea9b81d1c8b) [`2ba4293`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ba429373c1a48ce1e30cff7ae626d337b1371f9) [`69d161f`](https://github.com/Break-Eat-APP/flaix-expert/commit/69d161f77edca030cb2fa585a5b96694706227ef) | livrée |
| 12 | [Clôtures mensuelle et annuelle, total perpétuel](#phase-12) | §15.107 | [`8b02048`](https://github.com/Break-Eat-APP/flaix-expert/commit/8b020484526c8b4914bb2eec0b1f976e2a2b0634) [`1141f9c`](https://github.com/Break-Eat-APP/flaix-expert/commit/1141f9cce56d1b669331d941b94595803f792956) [`284f366`](https://github.com/Break-Eat-APP/flaix-expert/commit/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909) | livrée |
| 13 | [Exercice par lieu, sauvegardes chiffrées hors serveur](#phase-13) | §15.108 | [`8542bbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/8542bbf2917250654fa57285b66854d56afdf4f0) [`43fd2f2`](https://github.com/Break-Eat-APP/flaix-expert/commit/43fd2f2403c402c0f3100b9c03fbd576dab36869) [`8903b24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8903b2402a29f454d5f87ba3bf0b180cc537c260) [`ec9398d`](https://github.com/Break-Eat-APP/flaix-expert/commit/ec9398d1095c16338ee3ad8a8b31263aaa88491f) | livrée |
| 14 | [Mode formation « FACTICE »](#phase-14) | §15.109 | [`019dbcd`](https://github.com/Break-Eat-APP/flaix-expert/commit/019dbcd5d04cf3c2df5ff21f7dd42c8c5aee3140) [`4711c41`](https://github.com/Break-Eat-APP/flaix-expert/commit/4711c41a1394e216f1ac61602d91df724e20f6b2) [`7c65a1b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7c65a1b02189ef9933f540a46e5f7fecd241dba7) | livrée |
| 15 | [Export pour l'expert-comptable](#phase-15) | §15.110 | [`187fdf5`](https://github.com/Break-Eat-APP/flaix-expert/commit/187fdf5a242b1149783bf040bfd06304111df1c2) [`7429ef2`](https://github.com/Break-Eat-APP/flaix-expert/commit/7429ef25ffb03eb538f67ca8516567a912405875) | livrée |
| 16 | [Click & Collect : moteur de prix et catalogue](#phase-16) | §15.111 | [`07e608a`](https://github.com/Break-Eat-APP/flaix-expert/commit/07e608af3939ccd0e187ab310bcbed679822da31) [`c969d9f`](https://github.com/Break-Eat-APP/flaix-expert/commit/c969d9fa35f11b681a86e86ff422b9f125428ca4) [`d9708e0`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9708e0963944998d2e891ad9a2c8b7a0fd5dcbb) [`d5c624d`](https://github.com/Break-Eat-APP/flaix-expert/commit/d5c624d5f88cab945153642dde9681fe120efd82) | livrée |
| 17 | [Vue téléphone « En direct »](#phase-17) | §15.112 | [`8fec2c4`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fec2c423fac32948e9b0251b9543d97218761a2) | livrée |
| 18 | [Coûts par buvette](#phase-18) | §15.113 | [`66936e8`](https://github.com/Break-Eat-APP/flaix-expert/commit/66936e88516f21751d32bc255b77fc6cf1223f5d) [`5a2fe6a`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a2fe6a3147e340d0f7695556aba2be65114921f) | livrée |
| 19 | [Fidélité, partie gestion](#phase-19) | §15.114 | [`e110233`](https://github.com/Break-Eat-APP/flaix-expert/commit/e110233bfed49b8dd87effc7d564314ea89666c7) [`f9ce7f4`](https://github.com/Break-Eat-APP/flaix-expert/commit/f9ce7f4a2853d19ec6a98c4e84e104a986205497) [`bd1b604`](https://github.com/Break-Eat-APP/flaix-expert/commit/bd1b60433763f1ee26a19bf713bde0d5672455e9) | livrée |
| 20 | [Factures fournisseurs](#phase-20) | §15.115 | [`be6307c`](https://github.com/Break-Eat-APP/flaix-expert/commit/be6307ce4039ab4cae3dc394f699410264d9c832) [`e847e75`](https://github.com/Break-Eat-APP/flaix-expert/commit/e847e752747b612abb5b16d8de499b4d3e2ab82c) | livrée |
| 21 | [Back-office éditeur, niveau 1](#phase-21) | §15.116 | [`e83eaf3`](https://github.com/Break-Eat-APP/flaix-expert/commit/e83eaf391efff8da06bdbed32e06ddb5d677f18f) [`a698a23`](https://github.com/Break-Eat-APP/flaix-expert/commit/a698a230b4cb37522ea05d97100a797f09528d28) | livrée |
| 22 | [Décisions du 2026-10-01 et recettes](#phase-22) | §15.117, §15.119 | [`3abfb38`](https://github.com/Break-Eat-APP/flaix-expert/commit/3abfb38bc013cd7cd8167690ba9ca1b498200207) [`92de462`](https://github.com/Break-Eat-APP/flaix-expert/commit/92de4627a1c71f49ffc38196e034bf5fe84e95e0) [`c6aae54`](https://github.com/Break-Eat-APP/flaix-expert/commit/c6aae5476b9450542850564c8393a0edda7567ea) [`929f16a`](https://github.com/Break-Eat-APP/flaix-expert/commit/929f16a8e962ef83d5668fac57809e5822642849) | livrée |
| 23 | [Options par lieu, application installable, logo](#phase-23) | §15.118 | [`80c5742`](https://github.com/Break-Eat-APP/flaix-expert/commit/80c5742fe8aa8efc1febbbd1675b31df5bef3132) [`0579d24`](https://github.com/Break-Eat-APP/flaix-expert/commit/0579d248fdd9dc4a9c34883f3a8c159469fb4c96) [`9287bce`](https://github.com/Break-Eat-APP/flaix-expert/commit/9287bce7d739539eb77005cd8a9dd8eb747770e7) | livrée |
| 24 | [Adresse du site flaixexpert.flaixlabs.com](#phase-24) | §15.120 | [`e18b9ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/e18b9ea9af4e97d3285468c2f3f587f1848c1acc) [`f6a4820`](https://github.com/Break-Eat-APP/flaix-expert/commit/f6a48204cc8d8f50724447a6e00506d7e290cbf4) | livrée |
| 25 | [Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe](#phase-25) | §15.121, §15.122 | [`c694bbe`](https://github.com/Break-Eat-APP/flaix-expert/commit/c694bbe8507accae347e88817de19d604a2ba2ee) [`66326dc`](https://github.com/Break-Eat-APP/flaix-expert/commit/66326dc7eb9cf072917491acb352a7e10e6dd3ae) [`d8d7990`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8d7990f3794d8911fb7141ce1bdfef8997a32e7) | livrée |
| 26 | [Click & Collect neutre, export comptable dans la base, assiette de la commission](#phase-26) | §15.123, §15.124 | [`3979502`](https://github.com/Break-Eat-APP/flaix-expert/commit/3979502a25057064cf9c3d3345429cf2f3d308e2) [`7294651`](https://github.com/Break-Eat-APP/flaix-expert/commit/729465129cb7c7a95965666641164b8badd537f2) | livrée |
| 27 | [Stock des ingrédients au choix (bière pression)](#phase-27) | §15.125 | [`f5a8b5a`](https://github.com/Break-Eat-APP/flaix-expert/commit/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9) | livrée |
| 28 | [Logo officiel v2](#phase-28) | — | [`1259fb6`](https://github.com/Break-Eat-APP/flaix-expert/commit/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256) | livrée |
| 29 | [Dossier de conformité v0.1](#phase-29) | §15.126 | [`f75e8a7`](https://github.com/Break-Eat-APP/flaix-expert/commit/f75e8a722681b183641c02e16efd38a6ac4b38ff) [`d26e10e`](https://github.com/Break-Eat-APP/flaix-expert/commit/d26e10ef12863773b521852e0d84a9ffd2415a1d) | livrée |
| 30 | [Fidélité à la caisse : code promo et points dans le ticket scellé](#phase-30) | §15.127 | [`87c46b8`](https://github.com/Break-Eat-APP/flaix-expert/commit/87c46b8234d355b7db4e2dbdf6c328fa5574c301) | en cours |

<a id="phase-0"></a>
## Phase 0 — Socle de production et configuration d'un lieu vide

- **Dates** : 2026-09-29
- **Décision et raisonnement** : dossier projet §15.93
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`4a205cb`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a205cb70382af4b1ae34c55e3f86c529ef714f0) 2026-09-29 — Socle de production FlaiX Expert et configuration d'un lieu vide
  - [`40693c8`](https://github.com/Break-Eat-APP/flaix-expert/commit/40693c85ae0183bd8cf90613fa503abaf344461d) 2026-09-29 — Garde-fou d'envoi : FlaiX Expert ne part que vers son propre dépôt
- **Migrations (base)** :
  - [`db/migrations/0001_socle.sql`](../../db/migrations/0001_socle.sql) — créé
  - [`db/migrations/0002_configuration_lieu.sql`](../../db/migrations/0002_configuration_lieu.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/package.json`](../../packages/domain/package.json) — créé
  - [`packages/domain/src/argent.ts`](../../packages/domain/src/argent.ts) — créé
  - [`packages/domain/src/chaine.ts`](../../packages/domain/src/chaine.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — créé
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — créé
  - [`packages/domain/src/marge.ts`](../../packages/domain/src/marge.ts) — créé
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — créé
  - [`packages/domain/src/tva.ts`](../../packages/domain/src/tva.ts) — créé
  - [`packages/domain/tsconfig.json`](../../packages/domain/tsconfig.json) — créé
- **Serveur (apps/api)** :
  - [`apps/api/package.json`](../../apps/api/package.json) — créé
  - [`apps/api/src/auth/contexte.ts`](../../apps/api/src/auth/contexte.ts) — créé
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — créé
  - [`apps/api/src/auth/secrets.ts`](../../apps/api/src/auth/secrets.ts) — créé
  - [`apps/api/src/base.ts`](../../apps/api/src/base.ts) — créé
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — créé
  - [`apps/api/src/erreurs.ts`](../../apps/api/src/erreurs.ts) — créé
  - [`apps/api/src/index.ts`](../../apps/api/src/index.ts) — créé
  - [`apps/api/src/journal-technique.ts`](../../apps/api/src/journal-technique.ts) — créé
  - [`apps/api/src/outils/cli.ts`](../../apps/api/src/outils/cli.ts) — créé
  - [`apps/api/src/outils/migrations.ts`](../../apps/api/src/outils/migrations.ts) — créé
  - [`apps/api/src/outils/migrer.ts`](../../apps/api/src/outils/migrer.ts) — créé
  - [`apps/api/src/outils/reinitialiser-base-dev.ts`](../../apps/api/src/outils/reinitialiser-base-dev.ts) — créé
  - [`apps/api/src/routes/journal.ts`](../../apps/api/src/routes/journal.ts) — créé
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — créé
  - [`apps/api/src/routes/outils.ts`](../../apps/api/src/routes/outils.ts) — créé
  - [`apps/api/src/routes/produits.ts`](../../apps/api/src/routes/produits.ts) — créé
  - [`apps/api/src/routes/stands.ts`](../../apps/api/src/routes/stands.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — créé
  - [`apps/api/test/aide.ts`](../../apps/api/test/aide.ts) — créé
  - [`apps/api/test/preparation-base.ts`](../../apps/api/test/preparation-base.ts) — créé
  - [`apps/api/tsconfig.json`](../../apps/api/tsconfig.json) — créé
  - [`apps/api/vitest.config.ts`](../../apps/api/vitest.config.ts) — créé
- **Écrans (apps/web)** :
  - [`apps/web/index.html`](../../apps/web/index.html) — créé
  - [`apps/web/package.json`](../../apps/web/package.json) — créé
  - [`apps/web/src/api.ts`](../../apps/web/src/api.ts) — créé
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — créé
  - [`apps/web/src/composants/communs.tsx`](../../apps/web/src/composants/communs.tsx) — créé
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — créé
  - [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx) — créé
  - [`apps/web/src/pages/Compte.tsx`](../../apps/web/src/pages/Compte.tsx) — créé
  - `apps/web/src/pages/configuration/Identite.tsx` (n'existe plus) — créé
  - `apps/web/src/pages/configuration/Produits.tsx` (n'existe plus) — créé
  - `apps/web/src/pages/configuration/StandsCaisses.tsx` (n'existe plus) — créé
  - `apps/web/src/pages/conformite/JournalTechnique.tsx` (n'existe plus) — créé
  - [`apps/web/src/pages/Connexion.tsx`](../../apps/web/src/pages/Connexion.tsx) — créé
  - `apps/web/src/pages/Demarrage.tsx` (n'existe plus) — créé
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — créé
  - [`apps/web/tsconfig.json`](../../apps/web/tsconfig.json) — créé
  - [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts) — créé
- **Tests** :
  - [`apps/api/test/api.test.ts`](../../apps/api/test/api.test.ts) — créé
  - [`apps/api/test/conformite-base.test.ts`](../../apps/api/test/conformite-base.test.ts) — créé
  - [`packages/domain/src/argent.test.ts`](../../packages/domain/src/argent.test.ts) — créé
  - [`packages/domain/src/chaine.test.ts`](../../packages/domain/src/chaine.test.ts) — créé
  - [`packages/domain/src/tva-marge.test.ts`](../../packages/domain/src/tva-marge.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/docker-compose.yml`](../../infra/docker-compose.yml) — créé
  - [`infra/postgres/init/01-bases.sql`](../../infra/postgres/init/01-bases.sql) — créé
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — créé
  - [`docs/cadrage/flex-expert-perimetre.md`](../../docs/cadrage/flex-expert-perimetre.md) — créé
  - [`docs/cadrage/flex-expert-test-terrain.md`](../../docs/cadrage/flex-expert-test-terrain.md) — créé
  - [`docs/decisions-architecture-production.md`](../../docs/decisions-architecture-production.md) — créé
  - [`docs/flaix-brief-production-claude-code.md`](../../docs/flaix-brief-production-claude-code.md) — créé
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — créé
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — créé
  - [`docs/reference/flaix-gestion-final.html`](../../docs/reference/flaix-gestion-final.html) — créé
  - [`README.md`](../../README.md) — créé
- **Autres** :
  - [`.claude/launch.json`](../../.claude/launch.json) — créé
  - [`.gitattributes`](../../.gitattributes) — créé
  - [`.githooks/pre-push`](../../.githooks/pre-push) — créé
  - [`.gitignore`](../../.gitignore) — créé
  - [`package.json`](../../package.json) — créé
  - [`pnpm-lock.yaml`](../../pnpm-lock.yaml) — créé
  - [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) — créé
  - [`tsconfig.base.json`](../../tsconfig.base.json) — créé

<a id="phase-1"></a>
## Phase 1 — Matchs, caisse, Mes caisses, journal des tickets

- **Dates** : 2026-09-29
- **Décision et raisonnement** : dossier projet §15.94
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`f454873`](https://github.com/Break-Eat-APP/flaix-expert/commit/f454873fd886775f86e40826d636a9643993d65e) 2026-09-29 — Étape 1 de la version test : matchs, Ma caisse, Mes caisses, journal des tickets
- **Migrations (base)** :
  - [`db/migrations/0003_matchs_et_caisse.sql`](../../db/migrations/0003_matchs_et_caisse.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-caisse.ts`](../../packages/domain/src/journal-caisse.ts) — créé
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/ticket.ts`](../../packages/domain/src/ticket.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — modifié
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — modifié
  - [`apps/api/src/journal-caisse.ts`](../../apps/api/src/journal-caisse.ts) — créé
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — créé
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — créé
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — modifié
  - [`apps/api/src/routes/stands.ts`](../../apps/api/src/routes/stands.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — créé
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — créé
  - `apps/web/src/pages/configuration/Identite.tsx` (n'existe plus) — modifié
  - `apps/web/src/pages/configuration/Matchs.tsx` (n'existe plus) — créé
  - `apps/web/src/pages/configuration/Produits.tsx` (n'existe plus) — modifié
  - `apps/web/src/pages/conformite/JournalTechnique.tsx` (n'existe plus) — modifié
  - `apps/web/src/pages/Demarrage.tsx` (n'existe plus) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/caisse.test.ts`](../../apps/api/test/caisse.test.ts) — créé
  - [`packages/domain/src/ticket.test.ts`](../../packages/domain/src/ticket.test.ts) — créé
- **Documentation** :
  - [`docs/decisions-architecture-production.md`](../../docs/decisions-architecture-production.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-2"></a>
## Phase 2 — Retour de démonstration, organisation en 6 entrées, maquettes

- **Dates** : 2026-09-29
- **Décision et raisonnement** : dossier projet §15.95, §15.96, §15.98
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`9c7d7a9`](https://github.com/Break-Eat-APP/flaix-expert/commit/9c7d7a9cfac6576334b90a7f9fa4c400247d340b) 2026-09-29 — Retour de démonstration : encaissement sur le TPE du lieu, proposition de réorganisation
  - [`0ef6cf1`](https://github.com/Break-Eat-APP/flaix-expert/commit/0ef6cf1642dc15da9025d83ffadf1499006a4072) 2026-09-29 — Maquette v2.1 : graphiques de Résultats modernisés, Lexique supprimé, avis consigné
  - [`26237fc`](https://github.com/Break-Eat-APP/flaix-expert/commit/26237fc761668dc3febbef1056001ddf8b472018) 2026-09-29 — Dossier §15.95 : réponses de Rémi, réseau de la caisse, tour des logiciels de stades
  - [`0219e7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/0219e7e9bc8049916b4296e348f738e4c586ac9d) 2026-09-29 — Vente sans réseau décidée, gobelets en option, facture électronique et module Factures proposé
  - [`6f272dd`](https://github.com/Break-Eat-APP/flaix-expert/commit/6f272ddafe23fd7a7aadc1863c7f2e69675e49d7) 2026-09-29 — Organisation en 6 entrées appliquée à la version test
  - [`c3c6168`](https://github.com/Break-Eat-APP/flaix-expert/commit/c3c616893e44194563a4b7cdca5c11ce674c18db) 2026-09-29 — Maquette v2.2 : assistant IA en lecture seule (dossier §15.98)
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/communs.tsx`](../../apps/web/src/composants/communs.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — modifié
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — créé
  - `apps/web/src/pages/Demarrage.tsx` (n'existe plus) — supprimé
  - [`apps/web/src/pages/parametres/Identite.tsx`](../../apps/web/src/pages/parametres/Identite.tsx) — renommé
  - [`apps/web/src/pages/parametres/JournalTechnique.tsx`](../../apps/web/src/pages/parametres/JournalTechnique.tsx) — renommé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — créé
  - [`apps/web/src/pages/parametres/Produits.tsx`](../../apps/web/src/pages/parametres/Produits.tsx) — renommé
  - [`apps/web/src/pages/parametres/Saison.tsx`](../../apps/web/src/pages/parametres/Saison.tsx) — renommé
  - [`apps/web/src/pages/parametres/StandsCaisses.tsx`](../../apps/web/src/pages/parametres/StandsCaisses.tsx) — renommé
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/decisions-architecture-production.md`](../../docs/decisions-architecture-production.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/maquettes/organisation-v2.html`](../../docs/maquettes/organisation-v2.html) — créé
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — modifié

<a id="phase-3"></a>
## Phase 3 — Vente sans réseau : la tablette scelle, le serveur vérifie

- **Dates** : 2026-09-29
- **Décision et raisonnement** : dossier projet §15.97
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`6fb5840`](https://github.com/Break-Eat-APP/flaix-expert/commit/6fb584066acdbb07aba1202a849e6d8355ca6eb2) 2026-09-29 — Vente sans réseau : la tablette scelle, le serveur vérifie (dossier §15.97)
- **Migrations (base)** :
  - [`db/migrations/0004_vente_sans_reseau.sql`](../../db/migrations/0004_vente_sans_reseau.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/caisse-scellee.ts`](../../packages/domain/src/caisse-scellee.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/journal-caisse.ts`](../../apps/api/src/journal-caisse.ts) — modifié
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/test/tablette.ts`](../../apps/api/test/tablette.ts) — créé
- **Écrans (apps/web)** :
  - [`apps/web/public/sw.js`](../../apps/web/public/sw.js) — créé
  - [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx) — modifié
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/caisse/memoire.ts`](../../apps/web/src/pages/caisse/memoire.ts) — créé
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — modifié
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — modifié
- **Tests** :
  - [`apps/api/test/caisse.test.ts`](../../apps/api/test/caisse.test.ts) — modifié
  - [`packages/domain/src/caisse-scellee.test.ts`](../../packages/domain/src/caisse-scellee.test.ts) — créé
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — créé

<a id="phase-4"></a>
## Phase 4 — Serveur de test OVH

- **Dates** : 2026-09-29
- **Décision et raisonnement** : dossier projet guide-serveur-test-ovh.md
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`249f3f5`](https://github.com/Break-Eat-APP/flaix-expert/commit/249f3f515fcf3fb18838b3fa7da93a25c8bd64d2) 2026-09-29 — Serveur derrière un relais https : adresse réelle du visiteur (RELAIS_DE_CONFIANCE)
  - [`ef7c9fa`](https://github.com/Break-Eat-APP/flaix-expert/commit/ef7c9fa97f461831a4b39359294ce9e8cc3b1417) 2026-09-29 — Serveur de test OVH en service : scripts d'installation et guide mis à jour
- **Serveur (apps/api)** :
  - [`apps/api/src/config.ts`](../../apps/api/src/config.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — créé
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — créé
  - [`infra/vps/installer-socle.sh`](../../infra/vps/installer-socle.sh) — créé
  - [`infra/vps/montee-debian.sh`](../../infra/vps/montee-debian.sh) — créé
  - [`infra/vps/securiser.sh`](../../infra/vps/securiser.sh) — créé
- **Documentation** :
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-5"></a>
## Phase 5 — Comptes des caissières et tablettes enregistrées

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.99, §15.100
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`d51b910`](https://github.com/Break-Eat-APP/flaix-expert/commit/d51b910bfd4c17aa9b75ce8476936e8dfff70136) 2026-09-30 — Dossier §15.99 : ticket sur demande, comptes des caissières, ordre des modules restants
  - [`3f03ee8`](https://github.com/Break-Eat-APP/flaix-expert/commit/3f03ee810aba01f1df5ca9c205f9b797ea37829d) 2026-09-30 — Dossier §15.100 : conception des comptes des caissières et des tablettes enregistrées
  - [`9253115`](https://github.com/Break-Eat-APP/flaix-expert/commit/92531158323017d891cde1de21856af2f3ddd672) 2026-09-30 — Comptes des caissières et tablettes enregistrées : base, serveur et tests (dossier §15.100)
  - [`9324475`](https://github.com/Break-Eat-APP/flaix-expert/commit/9324475237b4721e3a80c10b517659e1a3a30f59) 2026-09-30 — Comptes des caissières : écrans (tablette, poste de caisse, Équipe) et déconnexion corrigée
- **Migrations (base)** :
  - [`db/migrations/0005_caissieres_et_tablettes.sql`](../../db/migrations/0005_caissieres_et_tablettes.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/caisse-scellee.ts`](../../packages/domain/src/caisse-scellee.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/auth/appareil.ts`](../../apps/api/src/auth/appareil.ts) — créé
  - [`apps/api/src/auth/contexte.ts`](../../apps/api/src/auth/contexte.ts) — modifié
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — modifié
  - [`apps/api/src/erreurs.ts`](../../apps/api/src/erreurs.ts) — modifié
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/src/routes/equipe.ts`](../../apps/api/src/routes/equipe.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
  - [`apps/api/test/tablette.ts`](../../apps/api/test/tablette.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/caisse/PosteCaissiere.tsx`](../../apps/web/src/pages/caisse/PosteCaissiere.tsx) — créé
  - [`apps/web/src/pages/Connexion.tsx`](../../apps/web/src/pages/Connexion.tsx) — modifié
  - [`apps/web/src/pages/ConnexionCaissiere.tsx`](../../apps/web/src/pages/ConnexionCaissiere.tsx) — créé
  - [`apps/web/src/pages/equipe/Equipe.tsx`](../../apps/web/src/pages/equipe/Equipe.tsx) — créé
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/api.test.ts`](../../apps/api/test/api.test.ts) — modifié
  - [`apps/api/test/caissieres.test.ts`](../../apps/api/test/caissieres.test.ts) — créé
  - [`packages/domain/src/caisse-scellee.test.ts`](../../packages/domain/src/caisse-scellee.test.ts) — modifié
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/avancement.md`](../../docs/avancement.md) — créé
  - [`docs/decisions-architecture-production.md`](../../docs/decisions-architecture-production.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — modifié

<a id="phase-6"></a>
## Phase 6 — Ticket client sur demande et duplicata

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.101
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`911d4b3`](https://github.com/Break-Eat-APP/flaix-expert/commit/911d4b3b22ad6e2d31206d2b1c653d4e3565111f) 2026-09-30 — Ticket client sur demande : édition par le directeur, duplicata numéroté et journalisé (dossier §15.101)
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — modifié
  - [`apps/web/src/pages/caisse/TicketClient.tsx`](../../apps/web/src/pages/caisse/TicketClient.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/caissieres.test.ts`](../../apps/api/test/caissieres.test.ts) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-7"></a>
## Phase 7 — Clôture du match : Z des tiroirs, rectification signée

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.102
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`c8e6246`](https://github.com/Break-Eat-APP/flaix-expert/commit/c8e624655779c4a12c57e9dd2fbac1e91a3a6015) 2026-09-30 — Dossier §15.102 : conception de l'assistant de clôture du match
  - [`3398ccb`](https://github.com/Break-Eat-APP/flaix-expert/commit/3398ccba3c5083fffb474060fadbd64679b93441) 2026-09-30 — Clôture du match, serveur : Z du tiroir par coupure, rectification signée, clôture du match exigeant chaque Z (dossier §15.102)
  - [`d3670c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3670c65e032f1ade82ea7d9a05cca551a05b109) 2026-09-30 — Clôture du match : assistant en 4 étapes, comptage des tiroirs par coupure, rectification (dossier §15.102)
- **Migrations (base)** :
  - [`db/migrations/0006_comptage_especes.sql`](../../db/migrations/0006_comptage_especes.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/especes.ts`](../../packages/domain/src/especes.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/clotures.ts`](../../apps/api/src/routes/clotures.ts) — créé
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/parametres/Identite.tsx`](../../apps/web/src/pages/parametres/Identite.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/caisse.test.ts`](../../apps/api/test/caisse.test.ts) — modifié
  - [`apps/api/test/clotures.test.ts`](../../apps/api/test/clotures.test.ts) — créé
  - [`apps/api/test/conformite-base.test.ts`](../../apps/api/test/conformite-base.test.ts) — modifié
  - [`packages/domain/src/especes.test.ts`](../../packages/domain/src/especes.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-8"></a>
## Phase 8 — Résultats sur les vraies ventes

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.103
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`d0985d1`](https://github.com/Break-Eat-APP/flaix-expert/commit/d0985d1d0d9e4401daf162b3691e0a8bbf64d93d) 2026-09-30 — Dossier §15.103 : conception des tableaux de Résultats sur les vraies ventes
  - [`d29e769`](https://github.com/Break-Eat-APP/flaix-expert/commit/d29e769b04006130ef9260ed5ac5a4e52015c7b2) 2026-09-30 — Résultats, serveur : chiffres du match, comparaison, coût manquant, alertes (dossier §15.103)
  - [`d3194ab`](https://github.com/Break-Eat-APP/flaix-expert/commit/d3194ab2b67f34b45515cd6ef005c9494c72cb34) 2026-09-30 — Résultats : 5 onglets sur les vraies ventes, comparaison au choix, coût manquant (dossier §15.103)
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/resultats.ts`](../../packages/domain/src/resultats.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/resultats.ts`](../../apps/api/src/routes/resultats.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx) — modifié
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — modifié
  - [`apps/web/src/pages/resultats/graphiques.tsx`](../../apps/web/src/pages/resultats/graphiques.tsx) — créé
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — créé
  - [`apps/web/src/resultats.css`](../../apps/web/src/resultats.css) — créé
- **Tests** :
  - [`apps/api/test/resultats.test.ts`](../../apps/api/test/resultats.test.ts) — créé
  - [`packages/domain/src/resultats.test.ts`](../../packages/domain/src/resultats.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-9"></a>
## Phase 9 — Équipe : fiches, planning, masse salariale

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.104
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`40c3f7b`](https://github.com/Break-Eat-APP/flaix-expert/commit/40c3f7bf6313745264d25bffd53c8e512e445054) 2026-09-30 — Dossier §15.104 : conception d'Équipe (fiches, planning, masse salariale)
  - [`bbf7f4b`](https://github.com/Break-Eat-APP/flaix-expert/commit/bbf7f4b05168d8a41c7df7eae0341107a52da5f9) 2026-09-30 — Équipe, serveur : fiches employés avec accès caisse, planning prévu/réel, masse salariale, personnel dans Résultats (dossier §15.104)
  - [`3509f19`](https://github.com/Break-Eat-APP/flaix-expert/commit/3509f19548e29f1cb5ba3e7a88f8bb60c3705cde) 2026-09-30 — Équipe : fiches, planning avec frise horaire, masse salariale ; personnel dans Résultats (dossier §15.104)
- **Migrations (base)** :
  - [`db/migrations/0007_equipe_planning.sql`](../../db/migrations/0007_equipe_planning.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/planning.ts`](../../packages/domain/src/planning.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/erreurs.ts`](../../apps/api/src/erreurs.ts) — modifié
  - [`apps/api/src/routes/equipe.ts`](../../apps/api/src/routes/equipe.ts) — modifié
  - [`apps/api/src/routes/planning.ts`](../../apps/api/src/routes/planning.ts) — créé
  - [`apps/api/src/routes/resultats.ts`](../../apps/api/src/routes/resultats.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/equipe/Equipe.tsx`](../../apps/web/src/pages/equipe/Equipe.tsx) — modifié
  - [`apps/web/src/pages/equipe/Planning.tsx`](../../apps/web/src/pages/equipe/Planning.tsx) — créé
  - [`apps/web/src/pages/resultats/Tableaux.tsx`](../../apps/web/src/pages/resultats/Tableaux.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/equipe.test.ts`](../../apps/api/test/equipe.test.ts) — créé
  - [`packages/domain/src/planning.test.ts`](../../packages/domain/src/planning.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-10"></a>
## Phase 10 — Stock : réserve, livraisons au CUMP, mise en place, comptage

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.105
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`d8163c3`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8163c3ae7c7d8dc902a0343e61d41069b3c8807) 2026-09-30 — Dossier §15.105 : conception de la première version du Stock en production
  - [`292fe39`](https://github.com/Break-Eat-APP/flaix-expert/commit/292fe3901113c8d297cd808b95959985516550e3) 2026-09-30 — Stock, serveur : réserve centrale, livraisons au CUMP, inventaires, mise en place, réassort, comptage ; étape Restes de la clôture (dossier §15.105)
  - [`9b43fdd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9b43fddad7636f2cf32b93708a0ba1e7b8b254ba) 2026-09-30 — Stock : écran en 4 onglets, étape Restes de la clôture, tests de conformité (dossier §15.105)
- **Migrations (base)** :
  - [`db/migrations/0008_stock.sql`](../../db/migrations/0008_stock.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/stock.ts`](../../packages/domain/src/stock.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/clotures.ts`](../../apps/api/src/routes/clotures.ts) — modifié
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/routes/planning.ts`](../../apps/api/src/routes/planning.ts) — modifié
  - [`apps/api/src/routes/stock.ts`](../../apps/api/src/routes/stock.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/stock/Stock.tsx`](../../apps/web/src/pages/stock/Stock.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/clotures.test.ts`](../../apps/api/test/clotures.test.ts) — modifié
  - [`apps/api/test/conformite-base.test.ts`](../../apps/api/test/conformite-base.test.ts) — modifié
  - [`apps/api/test/stock.test.ts`](../../apps/api/test/stock.test.ts) — créé
  - [`packages/domain/src/stock.test.ts`](../../packages/domain/src/stock.test.ts) — créé
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-11"></a>
## Phase 11 — Remontées au coffre et Z du coffre

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.106
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`27be12a`](https://github.com/Break-Eat-APP/flaix-expert/commit/27be12a8bbffc011ac34ee44c6857d306160e17e) 2026-09-30 — Dossier §15.106 : tickets conservés sans limite, remontées d'espèces au coffre et clôture finale des espèces
  - [`4aa3109`](https://github.com/Break-Eat-APP/flaix-expert/commit/4aa310972d68abaf25e02e92529e7ea9b81d1c8b) 2026-09-30 — Remontées d'espèces au coffre et Z du coffre de la soirée, serveur et tests (dossier §15.106)
  - [`2ba4293`](https://github.com/Break-Eat-APP/flaix-expert/commit/2ba429373c1a48ce1e30cff7ae626d337b1371f9) 2026-09-30 — Clôtures : remontées au coffre, Z du coffre, espèces de la soirée ; sauvegarde mensuelle gardée sans limite (dossier §15.106)
  - [`69d161f`](https://github.com/Break-Eat-APP/flaix-expert/commit/69d161f77edca030cb2fa585a5b96694706227ef) 2026-09-30 — Guide du serveur de test : sauvegarde mensuelle gardée sans limite
- **Migrations (base)** :
  - [`db/migrations/0009_coffre.sql`](../../db/migrations/0009_coffre.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/clotures.ts`](../../apps/api/src/routes/clotures.ts) — modifié
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/coffre.test.ts`](../../apps/api/test/coffre.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — modifié

<a id="phase-12"></a>
## Phase 12 — Clôtures mensuelle et annuelle, total perpétuel

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.107
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`8b02048`](https://github.com/Break-Eat-APP/flaix-expert/commit/8b020484526c8b4914bb2eec0b1f976e2a2b0634) 2026-09-30 — Dossier §15.107 : conception des clôtures mensuelle et annuelle
  - [`1141f9c`](https://github.com/Break-Eat-APP/flaix-expert/commit/1141f9cce56d1b669331d941b94595803f792956) 2026-09-30 — Clôtures de période, serveur : Z du match, clôtures mensuelle et annuelle scellées et chaînées, total perpétuel (dossier §15.107)
  - [`284f366`](https://github.com/Break-Eat-APP/flaix-expert/commit/284f366b585e0dbe57cb9a7fc01a4e5d6b95b909) 2026-09-30 — Clôtures → Mois & année : écran des clôtures mensuelle et annuelle, exercice comptable du lieu (dossier §15.107)
- **Migrations (base)** :
  - [`db/migrations/0010_clotures_periode.sql`](../../db/migrations/0010_clotures_periode.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/cloture-periode.ts`](../../packages/domain/src/cloture-periode.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/routes/periodes.ts`](../../apps/api/src/routes/periodes.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/clotures/Periodes.tsx`](../../apps/web/src/pages/clotures/Periodes.tsx) — créé
  - [`apps/web/src/pages/parametres/Identite.tsx`](../../apps/web/src/pages/parametres/Identite.tsx) — modifié
- **Tests** :
  - [`apps/api/test/periodes.test.ts`](../../apps/api/test/periodes.test.ts) — créé
  - [`packages/domain/src/cloture-periode.test.ts`](../../packages/domain/src/cloture-periode.test.ts) — créé
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-13"></a>
## Phase 13 — Exercice par lieu, sauvegardes chiffrées hors serveur

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.108
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`8542bbf`](https://github.com/Break-Eat-APP/flaix-expert/commit/8542bbf2917250654fa57285b66854d56afdf4f0) 2026-09-30 — Exercice comptable à régler par lieu ; dossier §15.108 : sauvegarde chiffrée chez OVH, logiciel vierge, reprise des modules
  - [`43fd2f2`](https://github.com/Break-Eat-APP/flaix-expert/commit/43fd2f2403c402c0f3100b9c03fbd576dab36869) 2026-09-30 — Sauvegarde : copie chiffrée (age) chez OVHcloud Object Storage, flaix-admin sauvegarde-externe et essai-restauration (dossier §15.108)
  - [`8903b24`](https://github.com/Break-Eat-APP/flaix-expert/commit/8903b2402a29f454d5f87ba3bf0b180cc537c260) 2026-09-30 — flaix-admin : sans messages techniques de rclone
  - [`ec9398d`](https://github.com/Break-Eat-APP/flaix-expert/commit/ec9398d1095c16338ee3ad8a8b31263aaa88491f) 2026-09-30 — Docs : inventaire prototype → logiciel et ordre A à Z, guide de la copie des sauvegardes chez OVH
- **Migrations (base)** :
  - [`db/migrations/0011_exercice_a_regler.sql`](../../db/migrations/0011_exercice_a_regler.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/periodes.ts`](../../apps/api/src/routes/periodes.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/clotures/Periodes.tsx`](../../apps/web/src/pages/clotures/Periodes.tsx) — modifié
  - [`apps/web/src/pages/parametres/Identite.tsx`](../../apps/web/src/pages/parametres/Identite.tsx) — modifié
- **Tests** :
  - [`apps/api/test/periodes.test.ts`](../../apps/api/test/periodes.test.ts) — modifié
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
  - [`infra/vps/installer-socle.sh`](../../infra/vps/installer-socle.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-14"></a>
## Phase 14 — Mode formation « FACTICE »

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.109
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`019dbcd`](https://github.com/Break-Eat-APP/flaix-expert/commit/019dbcd5d04cf3c2df5ff21f7dd42c8c5aee3140) 2026-09-30 — Mode formation FACTICE, serveur (en cours) : lieu de formation jumeau, sessions, tablettes en formation, configuration en lecture seule (dossier §15.109)
  - [`4711c41`](https://github.com/Break-Eat-APP/flaix-expert/commit/4711c41a1394e216f1ac61602d91df724e20f6b2) 2026-09-30 — Mode formation : tests B3/B4 (vente, clôture et Z en formation sans effet sur le vrai lieu ; tablette ; remise à zéro)
  - [`7c65a1b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7c65a1b02189ef9933f540a46e5f7fecd241dba7) 2026-09-30 — Mode formation FACTICE : écrans (bandeau non masquable, Paramètres → Mode formation, tablettes en formation, ticket FACTICE), dossier §15.109, ordre de développement fixé par Rémi
- **Migrations (base)** :
  - [`db/migrations/0012_mode_formation.sql`](../../db/migrations/0012_mode_formation.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/auth/appareil.ts`](../../apps/api/src/auth/appareil.ts) — modifié
  - [`apps/api/src/auth/contexte.ts`](../../apps/api/src/auth/contexte.ts) — modifié
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — modifié
  - [`apps/api/src/base.ts`](../../apps/api/src/base.ts) — modifié
  - [`apps/api/src/routes/equipe.ts`](../../apps/api/src/routes/equipe.ts) — modifié
  - [`apps/api/src/routes/formation.ts`](../../apps/api/src/routes/formation.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/composants/Formation.tsx`](../../apps/web/src/composants/Formation.tsx) — créé
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/caisse/PosteCaissiere.tsx`](../../apps/web/src/pages/caisse/PosteCaissiere.tsx) — modifié
  - [`apps/web/src/pages/caisse/TicketClient.tsx`](../../apps/web/src/pages/caisse/TicketClient.tsx) — modifié
  - [`apps/web/src/pages/ConnexionCaissiere.tsx`](../../apps/web/src/pages/ConnexionCaissiere.tsx) — modifié
  - [`apps/web/src/pages/equipe/Equipe.tsx`](../../apps/web/src/pages/equipe/Equipe.tsx) — modifié
  - [`apps/web/src/pages/parametres/Formation.tsx`](../../apps/web/src/pages/parametres/Formation.tsx) — créé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — modifié
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/formation.test.ts`](../../apps/api/test/formation.test.ts) — créé
- **Documentation** :
  - [`CLAUDE.md`](../../CLAUDE.md) — modifié
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-15"></a>
## Phase 15 — Export pour l'expert-comptable

- **Dates** : 2026-09-30
- **Décision et raisonnement** : dossier projet §15.110
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`187fdf5`](https://github.com/Break-Eat-APP/flaix-expert/commit/187fdf5a242b1149783bf040bfd06304111df1c2) 2026-09-30 — Export pour l'expert-comptable, serveur : journal des ventes et récapitulatif sur les Z scellés, écarts de caisse, plan de comptes du lieu (dossier §15.110)
  - [`7429ef2`](https://github.com/Break-Eat-APP/flaix-expert/commit/7429ef25ffb03eb538f67ca8516567a912405875) 2026-09-30 — Export comptable : écran Clôtures → Export comptable, mention FACTICE dans les fichiers de formation, dossier §15.110, question G.20
- **Migrations (base)** :
  - [`db/migrations/0013_plan_comptes.sql`](../../db/migrations/0013_plan_comptes.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/export-comptable.ts`](../../packages/domain/src/export-comptable.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/export-comptable.ts`](../../apps/api/src/routes/export-comptable.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/api.ts`](../../apps/web/src/api.ts) — modifié
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/clotures/ExportComptable.tsx`](../../apps/web/src/pages/clotures/ExportComptable.tsx) — créé
- **Tests** :
  - [`apps/api/test/export-comptable.test.ts`](../../apps/api/test/export-comptable.test.ts) — créé
  - [`packages/domain/src/export-comptable.test.ts`](../../packages/domain/src/export-comptable.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — modifié

<a id="phase-16"></a>
## Phase 16 — Click & Collect : moteur de prix et catalogue

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.111
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`07e608a`](https://github.com/Break-Eat-APP/flaix-expert/commit/07e608af3939ccd0e187ab310bcbed679822da31) 2026-10-01 — Click & Collect : moteur de prix (marge HT préservée, Stripe taux + fixe sur panier moyen, TVA sur commission), tests du dossier
  - [`c969d9f`](https://github.com/Break-Eat-APP/flaix-expert/commit/c969d9fa35f11b681a86e86ff422b9f125428ca4) 2026-10-01 — Click & Collect, serveur : réglages du lieu, catalogue des points de retrait, prix app et mode de stock par produit, recopie en formation (migration 0014)
  - [`d9708e0`](https://github.com/Break-Eat-APP/flaix-expert/commit/d9708e0963944998d2e891ad9a2c8b7a0fd5dcbb) 2026-10-01 — Click & Collect : écran Paramètres → Click & Collect (catalogue, réglages du lieu, simulateur libre)
  - [`d5c624d`](https://github.com/Break-Eat-APP/flaix-expert/commit/d5c624d5f88cab945153642dde9681fe120efd82) 2026-10-01 — Docs : Click & Collect (dossier §15.111), avancement
- **Migrations (base)** :
  - [`db/migrations/0014_click_collect.sql`](../../db/migrations/0014_click_collect.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/click-collect.ts`](../../packages/domain/src/click-collect.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/click-collect.ts`](../../apps/api/src/routes/click-collect.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/parametres/ClickCollect.tsx`](../../apps/web/src/pages/parametres/ClickCollect.tsx) — créé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
- **Tests** :
  - [`apps/api/test/click-collect.test.ts`](../../apps/api/test/click-collect.test.ts) — créé
  - [`packages/domain/src/click-collect.test.ts`](../../packages/domain/src/click-collect.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-17"></a>
## Phase 17 — Vue téléphone « En direct »

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.112
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`8fec2c4`](https://github.com/Break-Eat-APP/flaix-expert/commit/8fec2c423fac32948e9b0251b9543d97218761a2) 2026-10-01 — Vue téléphone « En direct » : CA, caisses, ruptures et réassort en deux gestes, mise à jour toutes les 20 s ; bandeau formation compact sur téléphone (dossier §15.112)
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Formation.tsx`](../../apps/web/src/composants/Formation.tsx) — modifié
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — modifié
  - [`apps/web/src/pages/direct/EnDirect.tsx`](../../apps/web/src/pages/direct/EnDirect.tsx) — créé
  - [`apps/web/src/pages/Resultats.tsx`](../../apps/web/src/pages/Resultats.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-18"></a>
## Phase 18 — Coûts par buvette

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.113
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`66936e8`](https://github.com/Break-Eat-APP/flaix-expert/commit/66936e88516f21751d32bc255b77fc6cf1223f5d) 2026-10-01 — Coûts par buvette, serveur : frais mensuels datés par stand, consolidation du mois (matière, masse salariale, CA HT, reste), recopie en formation (migration 0015)
  - [`5a2fe6a`](https://github.com/Break-Eat-APP/flaix-expert/commit/5a2fe6a3147e340d0f7695556aba2be65114921f) 2026-10-01 — Coûts par buvette : écran Paramètres → Coûts par buvette (frais datés par stand, coûts du mois, camembert), dossier §15.113
- **Migrations (base)** :
  - [`db/migrations/0015_couts_buvette.sql`](../../db/migrations/0015_couts_buvette.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/couts-buvette.ts`](../../packages/domain/src/couts-buvette.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/couts-buvette.ts`](../../apps/api/src/routes/couts-buvette.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/parametres/CoutsBuvette.tsx`](../../apps/web/src/pages/parametres/CoutsBuvette.tsx) — créé
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
- **Tests** :
  - [`apps/api/test/couts-buvette.test.ts`](../../apps/api/test/couts-buvette.test.ts) — créé
  - [`packages/domain/src/couts-buvette.test.ts`](../../packages/domain/src/couts-buvette.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-19"></a>
## Phase 19 — Fidélité, partie gestion

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.114
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`e110233`](https://github.com/Break-Eat-APP/flaix-expert/commit/e110233bfed49b8dd87effc7d564314ea89666c7) 2026-10-01 — Fidélité : migration (abonnés, mouvements de points en écriture seule, codes promo, réglages vides) et calcul (points, conversion, codes, import tolérant)
  - [`f9ce7f4`](https://github.com/Break-Eat-APP/flaix-expert/commit/f9ce7f4a2853d19ec6a98c4e84e104a986205497) 2026-10-01 — Fidélité, serveur : abonnés, points lus dans les tickets scellés, ajustements, import, codes promo, refus en formation
  - [`bd1b604`](https://github.com/Break-Eat-APP/flaix-expert/commit/bd1b60433763f1ee26a19bf713bde0d5672455e9) 2026-10-01 — Fidélité, écran (abonnés, historique, ajustements, codes promo, import, règles des points), menu ; dossier §15.114, question G.21
- **Migrations (base)** :
  - [`db/migrations/0016_fidelite.sql`](../../db/migrations/0016_fidelite.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/fidelite.ts`](../../packages/domain/src/fidelite.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/fidelite.ts`](../../apps/api/src/routes/fidelite.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/fidelite/Fidelite.tsx`](../../apps/web/src/pages/fidelite/Fidelite.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/fidelite.test.ts`](../../apps/api/test/fidelite.test.ts) — créé
  - [`packages/domain/src/fidelite.test.ts`](../../packages/domain/src/fidelite.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/questions-expert-comptable.md`](../../docs/questions-expert-comptable.md) — modifié

<a id="phase-20"></a>
## Phase 20 — Factures fournisseurs

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.115
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`be6307c`](https://github.com/Break-Eat-APP/flaix-expert/commit/be6307ce4039ab4cae3dc394f699410264d9c832) 2026-10-01 — Factures fournisseurs, serveur : saisie, rapprochement avec les livraisons du Stock, écarts, validation motivée, paiement, pièce jointe, facture figée (migration 0017)
  - [`e847e75`](https://github.com/Break-Eat-APP/flaix-expert/commit/e847e752747b612abb5b16d8de499b4d3e2ab82c) 2026-10-01 — Factures fournisseurs : écran (saisie, rapprochement, validation, paiement, pièce jointe), menu ; test de conformité ajusté ; dossier §15.115
- **Migrations (base)** :
  - [`db/migrations/0017_factures_fournisseurs.sql`](../../db/migrations/0017_factures_fournisseurs.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/factures.ts`](../../packages/domain/src/factures.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/factures.ts`](../../apps/api/src/routes/factures.ts) — créé
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/pages/factures/Factures.tsx`](../../apps/web/src/pages/factures/Factures.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/conformite-base.test.ts`](../../apps/api/test/conformite-base.test.ts) — modifié
  - [`apps/api/test/factures.test.ts`](../../apps/api/test/factures.test.ts) — créé
  - [`packages/domain/src/factures.test.ts`](../../packages/domain/src/factures.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-21"></a>
## Phase 21 — Back-office éditeur, niveau 1

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.116
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`e83eaf3`](https://github.com/Break-Eat-APP/flaix-expert/commit/e83eaf391efff8da06bdbed32e06ddb5d677f18f) 2026-10-01 — Back-office éditeur, niveau 1, serveur : comptes Break Eat séparés, sessions sans lieu, vue du parc sans montant, vérification d'intégrité journalisée chez le lieu ; tests B6/B7 (migration 0018)
  - [`a698a23`](https://github.com/Break-Eat-APP/flaix-expert/commit/a698a230b4cb37522ea05d97100a797f09528d28) 2026-10-01 — Back-office éditeur : écran /editeur (parc, alertes, vérification d'intégrité, mot de passe), commande creer-editeur ; dossier §15.116
- **Migrations (base)** :
  - [`db/migrations/0018_back_office_editeur.sql`](../../db/migrations/0018_back_office_editeur.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — créé
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/outils/cli.ts`](../../apps/api/src/outils/cli.ts) — modifié
  - [`apps/api/src/routes/editeur.ts`](../../apps/api/src/routes/editeur.ts) — créé
  - [`apps/api/src/routes/periodes.ts`](../../apps/api/src/routes/periodes.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/pages/editeur/EspaceEditeur.tsx`](../../apps/web/src/pages/editeur/EspaceEditeur.tsx) — créé
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/editeur.test.ts`](../../apps/api/test/editeur.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-22"></a>
## Phase 22 — Décisions du 2026-10-01 et recettes

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.117, §15.119
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`3abfb38`](https://github.com/Break-Eat-APP/flaix-expert/commit/3abfb38bc013cd7cd8167690ba9ca1b498200207) 2026-10-01 — Décisions de Rémi du 2026-10-01 (dossier §15.117) : tolérance des factures validée, base fidélité, Brevo, options par lieu, recettes ; réponse sur le hors connexion
  - [`92de462`](https://github.com/Break-Eat-APP/flaix-expert/commit/92de4627a1c71f49ffc38196e034bf5fe84e95e0) 2026-10-01 — Recettes, serveur : ingrédients au kg/litre/pièce, recette d'un produit, coût de fabrication = coût matière recalculé à chaque changement de prix, recopie en formation (migration 0019)
  - [`c6aae54`](https://github.com/Break-Eat-APP/flaix-expert/commit/c6aae5476b9450542850564c8393a0edda7567ea) 2026-10-01 — Recettes, écrans : ingrédients (Produits & prix → Ingrédients), recette dans la fiche produit avec coût de fabrication en direct
  - [`929f16a`](https://github.com/Break-Eat-APP/flaix-expert/commit/929f16a8e962ef83d5668fac57809e5822642849) 2026-10-01 — Dossier : choix de Rémi, option A (points et codes plafonnés avec réseau) ; réponse sur les coupures de réseau
- **Migrations (base)** :
  - [`db/migrations/0019_recettes.sql`](../../db/migrations/0019_recettes.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/factures.ts`](../../packages/domain/src/factures.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/recettes.ts`](../../packages/domain/src/recettes.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/produits.ts`](../../apps/api/src/routes/produits.ts) — modifié
  - [`apps/api/src/routes/recettes.ts`](../../apps/api/src/routes/recettes.ts) — créé
  - [`apps/api/src/routes/stock.ts`](../../apps/api/src/routes/stock.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/factures/Factures.tsx`](../../apps/web/src/pages/factures/Factures.tsx) — modifié
  - [`apps/web/src/pages/parametres/Produits.tsx`](../../apps/web/src/pages/parametres/Produits.tsx) — modifié
  - [`apps/web/src/pages/parametres/Recettes.tsx`](../../apps/web/src/pages/parametres/Recettes.tsx) — créé
- **Tests** :
  - [`apps/api/test/recettes.test.ts`](../../apps/api/test/recettes.test.ts) — créé
  - [`packages/domain/src/recettes.test.ts`](../../packages/domain/src/recettes.test.ts) — créé
- **Documentation** :
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-23"></a>
## Phase 23 — Options par lieu, application installable, logo

- **Dates** : 2026-10-01
- **Décision et raisonnement** : dossier projet §15.118
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`80c5742`](https://github.com/Break-Eat-APP/flaix-expert/commit/80c5742fe8aa8efc1febbbd1675b31df5bef3132) 2026-10-01 — Options par lieu, serveur : activées par Break Eat depuis le back-office, adresses fermées si désactivées, journal du lieu, lieu de formation aligné (migration 0020)
  - [`0579d24`](https://github.com/Break-Eat-APP/flaix-expert/commit/0579d248fdd9dc4a9c34883f3a8c159469fb4c96) 2026-10-01 — Options par lieu (écrans et back-office), application installable (fiche d'application, icônes) ; dossier §15.118, §15.119
  - [`9287bce`](https://github.com/Break-Eat-APP/flaix-expert/commit/9287bce7d739539eb77005cd8a9dd8eb747770e7) 2026-10-01 — Logo officiel « eXpert » sur tous les écrans (menu, téléphone, caisse, connexions, back-office), versions claire et sombre ; originaux dans docs/marque
- **Migrations (base)** :
  - [`db/migrations/0020_options_lieu.sql`](../../db/migrations/0020_options_lieu.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/options.ts`](../../apps/api/src/options.ts) — créé
  - [`apps/api/src/routes/editeur.ts`](../../apps/api/src/routes/editeur.ts) — modifié
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/index.html`](../../apps/web/index.html) — modifié
  - [`apps/web/public/apple-touch-icon.png`](../../apps/web/public/apple-touch-icon.png) — créé
  - [`apps/web/public/icone-192.png`](../../apps/web/public/icone-192.png) — créé
  - [`apps/web/public/icone-512.png`](../../apps/web/public/icone-512.png) — créé
  - [`apps/web/public/icone-masquable-512.png`](../../apps/web/public/icone-masquable-512.png) — créé
  - [`apps/web/public/manifest.webmanifest`](../../apps/web/public/manifest.webmanifest) — créé
  - [`apps/web/src/assets/logo-clair.svg`](../../apps/web/src/assets/logo-clair.svg) — créé
  - [`apps/web/src/assets/logo-sombre.svg`](../../apps/web/src/assets/logo-sombre.svg) — créé
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/composants/Logo.tsx`](../../apps/web/src/composants/Logo.tsx) — créé
  - [`apps/web/src/pages/caisse/PosteCaissiere.tsx`](../../apps/web/src/pages/caisse/PosteCaissiere.tsx) — modifié
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/Connexion.tsx`](../../apps/web/src/pages/Connexion.tsx) — modifié
  - [`apps/web/src/pages/ConnexionCaissiere.tsx`](../../apps/web/src/pages/ConnexionCaissiere.tsx) — modifié
  - [`apps/web/src/pages/direct/EnDirect.tsx`](../../apps/web/src/pages/direct/EnDirect.tsx) — modifié
  - [`apps/web/src/pages/editeur/EspaceEditeur.tsx`](../../apps/web/src/pages/editeur/EspaceEditeur.tsx) — modifié
  - [`apps/web/src/pages/equipe/Equipe.tsx`](../../apps/web/src/pages/equipe/Equipe.tsx) — modifié
  - [`apps/web/src/pages/parametres/Parametres.tsx`](../../apps/web/src/pages/parametres/Parametres.tsx) — modifié
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/options.test.ts`](../../apps/api/test/options.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/outils/icones-application.cjs`](../../infra/outils/icones-application.cjs) — créé
  - [`infra/outils/logo.cjs`](../../infra/outils/logo.cjs) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/marque/logo-expert-officiel.png`](../../docs/marque/logo-expert-officiel.png) — créé
  - [`docs/marque/logo-expert-officiel.svg`](../../docs/marque/logo-expert-officiel.svg) — créé

<a id="phase-24"></a>
## Phase 24 — Adresse du site flaixexpert.flaixlabs.com

- **Dates** : 2026-10-02
- **Décision et raisonnement** : dossier projet §15.120
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`e18b9ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/e18b9ea9af4e97d3285468c2f3f587f1848c1acc) 2026-10-02 — Adresse du site : flaixexpert.flaixlabs.com ; l'ancienne adresse provisoire (sslip.io) renvoie vers elle
  - [`f6a4820`](https://github.com/Break-Eat-APP/flaix-expert/commit/f6a48204cc8d8f50724447a6e00506d7e290cbf4) 2026-10-02 — Docs : adresse du site flaixexpert.flaixlabs.com (dossier §15.120, guide du serveur, avancement)
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-25"></a>
## Phase 25 — Marque FlaiX Expert ; lieux et directeurs depuis le back-office ; mots de passe

- **Dates** : 2026-10-02
- **Décision et raisonnement** : dossier projet §15.121, §15.122
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`c694bbe`](https://github.com/Break-Eat-APP/flaix-expert/commit/c694bbe8507accae347e88817de19d604a2ba2ee) 2026-10-02 — Éditeur et back-office au nom de FlaiX Expert (et non Break Eat)
  - [`66326dc`](https://github.com/Break-Eat-APP/flaix-expert/commit/66326dc7eb9cf072917491acb352a7e10e6dd3ae) 2026-10-02 — Back-office : créer un lieu et ses directeurs, mot de passe provisoire ; mots de passe de 6 caractères avec un œil
  - [`d8d7990`](https://github.com/Break-Eat-APP/flaix-expert/commit/d8d7990f3794d8911fb7141ce1bdfef8997a32e7) 2026-10-02 — Avancement : ce qui se passera au passage en production
- **Migrations (base)** :
  - [`db/migrations/0021_lieux_back_office.sql`](../../db/migrations/0021_lieux_back_office.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/mot-de-passe.ts`](../../packages/domain/src/mot-de-passe.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/auth/routes.ts`](../../apps/api/src/auth/routes.ts) — modifié
  - [`apps/api/src/auth/secrets.ts`](../../apps/api/src/auth/secrets.ts) — modifié
  - [`apps/api/src/options.ts`](../../apps/api/src/options.ts) — modifié
  - [`apps/api/src/outils/cli.ts`](../../apps/api/src/outils/cli.ts) — modifié
  - [`apps/api/src/routes/editeur.ts`](../../apps/api/src/routes/editeur.ts) — modifié
  - [`apps/api/src/routes/export-comptable.ts`](../../apps/api/src/routes/export-comptable.ts) — modifié
  - [`apps/api/src/routes/lieu.ts`](../../apps/api/src/routes/lieu.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx) — modifié
  - [`apps/web/src/composants/Coquille.tsx`](../../apps/web/src/composants/Coquille.tsx) — modifié
  - [`apps/web/src/composants/MotDePasse.tsx`](../../apps/web/src/composants/MotDePasse.tsx) — créé
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/clotures/ExportComptable.tsx`](../../apps/web/src/pages/clotures/ExportComptable.tsx) — modifié
  - [`apps/web/src/pages/Compte.tsx`](../../apps/web/src/pages/Compte.tsx) — modifié
  - [`apps/web/src/pages/Connexion.tsx`](../../apps/web/src/pages/Connexion.tsx) — modifié
  - [`apps/web/src/pages/editeur/EspaceEditeur.tsx`](../../apps/web/src/pages/editeur/EspaceEditeur.tsx) — modifié
  - [`apps/web/src/pages/parametres/JournalTechnique.tsx`](../../apps/web/src/pages/parametres/JournalTechnique.tsx) — modifié
  - [`apps/web/src/session.tsx`](../../apps/web/src/session.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/editeur.test.ts`](../../apps/api/test/editeur.test.ts) — modifié
  - [`apps/api/test/lieux-editeur.test.ts`](../../apps/api/test/lieux-editeur.test.ts) — créé
  - [`apps/api/test/options.test.ts`](../../apps/api/test/options.test.ts) — modifié
  - [`packages/domain/src/mot-de-passe.test.ts`](../../packages/domain/src/mot-de-passe.test.ts) — créé
- **Serveur et outils (infra)** :
  - [`infra/vps/deployer.sh`](../../infra/vps/deployer.sh) — modifié
  - [`infra/vps/flaix-admin.sh`](../../infra/vps/flaix-admin.sh) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié
  - [`docs/guide-serveur-test-ovh.md`](../../docs/guide-serveur-test-ovh.md) — modifié

<a id="phase-26"></a>
## Phase 26 — Click & Collect neutre, export comptable dans la base, assiette de la commission

- **Dates** : 2026-10-03
- **Décision et raisonnement** : dossier projet §15.123, §15.124
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`3979502`](https://github.com/Break-Eat-APP/flaix-expert/commit/3979502a25057064cf9c3d3345429cf2f3d308e2) 2026-10-03 — Click & Collect neutre : application de commande, commission de la plateforme, frais de paiement
  - [`7294651`](https://github.com/Break-Eat-APP/flaix-expert/commit/729465129cb7c7a95965666641164b8badd537f2) 2026-10-03 — Export comptable dans la base ; commission C&C calculée sur le prix buvette ou sur le prix app
- **Migrations (base)** :
  - [`db/migrations/0022_export_base_assiette_cc.sql`](../../db/migrations/0022_export_base_assiette_cc.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/click-collect.ts`](../../packages/domain/src/click-collect.ts) — modifié
  - [`packages/domain/src/couts-buvette.ts`](../../packages/domain/src/couts-buvette.ts) — modifié
  - [`packages/domain/src/editeur.ts`](../../packages/domain/src/editeur.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/click-collect.ts`](../../apps/api/src/routes/click-collect.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/clotures/Clotures.tsx`](../../apps/web/src/pages/clotures/Clotures.tsx) — modifié
  - [`apps/web/src/pages/editeur/EspaceEditeur.tsx`](../../apps/web/src/pages/editeur/EspaceEditeur.tsx) — modifié
  - [`apps/web/src/pages/parametres/ClickCollect.tsx`](../../apps/web/src/pages/parametres/ClickCollect.tsx) — modifié
- **Tests** :
  - [`apps/api/test/click-collect.test.ts`](../../apps/api/test/click-collect.test.ts) — modifié
  - [`packages/domain/src/click-collect.test.ts`](../../packages/domain/src/click-collect.test.ts) — modifié
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-27"></a>
## Phase 27 — Stock des ingrédients au choix (bière pression)

- **Dates** : 2026-10-03
- **Décision et raisonnement** : dossier projet §15.125
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`f5a8b5a`](https://github.com/Break-Eat-APP/flaix-expert/commit/f5a8b5a9526bd0fc4def45a7782fd9e07b6750b9) 2026-10-03 — Stock des ingrédients au choix (bière pression au litre) : réserve, mise en place, comptage, consommation figée à la clôture
- **Migrations (base)** :
  - [`db/migrations/0023_stock_ingredients.sql`](../../db/migrations/0023_stock_ingredients.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/index.ts`](../../packages/domain/src/index.ts) — modifié
  - [`packages/domain/src/journal-technique.ts`](../../packages/domain/src/journal-technique.ts) — modifié
  - [`packages/domain/src/recettes.ts`](../../packages/domain/src/recettes.ts) — modifié
  - [`packages/domain/src/stock-ingredients.ts`](../../packages/domain/src/stock-ingredients.ts) — créé
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/evenements.ts`](../../apps/api/src/routes/evenements.ts) — modifié
  - [`apps/api/src/routes/recettes.ts`](../../apps/api/src/routes/recettes.ts) — modifié
  - [`apps/api/src/routes/stock-ingredients.ts`](../../apps/api/src/routes/stock-ingredients.ts) — créé
  - [`apps/api/src/routes/stock.ts`](../../apps/api/src/routes/stock.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/parametres/Recettes.tsx`](../../apps/web/src/pages/parametres/Recettes.tsx) — modifié
  - [`apps/web/src/pages/stock/Stock.tsx`](../../apps/web/src/pages/stock/Stock.tsx) — modifié
  - [`apps/web/src/pages/stock/StockIngredients.tsx`](../../apps/web/src/pages/stock/StockIngredients.tsx) — créé
- **Tests** :
  - [`apps/api/test/stock-ingredients.test.ts`](../../apps/api/test/stock-ingredients.test.ts) — créé
  - [`packages/domain/src/stock-ingredients.test.ts`](../../packages/domain/src/stock-ingredients.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/flaix-gestion-dossier-projet.md`](../../docs/flaix-gestion-dossier-projet.md) — modifié

<a id="phase-28"></a>
## Phase 28 — Logo officiel v2

- **Dates** : 2026-10-03
- **Décision et raisonnement** : dossier projet —
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`1259fb6`](https://github.com/Break-Eat-APP/flaix-expert/commit/1259fb69e57fa0e3ed5843fd8a5b32a6dd56b256) 2026-10-03 — Logo officiel v2 (X en quatre traits) dans l'application
- **Écrans (apps/web)** :
  - [`apps/web/src/assets/logo-clair.svg`](../../apps/web/src/assets/logo-clair.svg) — modifié
  - [`apps/web/src/assets/logo-sombre.svg`](../../apps/web/src/assets/logo-sombre.svg) — modifié
- **Serveur et outils (infra)** :
  - [`infra/outils/logo.cjs`](../../infra/outils/logo.cjs) — modifié
- **Documentation** :
  - [`docs/marque/logo-expert-officiel.png`](../../docs/marque/logo-expert-officiel.png) — modifié
  - [`docs/marque/logo-expert-officiel.svg`](../../docs/marque/logo-expert-officiel.svg) — modifié

<a id="phase-29"></a>
## Phase 29 — Dossier de conformité v0.1

- **Dates** : 2026-10-03
- **Décision et raisonnement** : dossier projet §15.126
- **État** : livrée (tests au vert au moment du commit)
- **Commits** :
  - [`f75e8a7`](https://github.com/Break-Eat-APP/flaix-expert/commit/f75e8a722681b183641c02e16efd38a6ac4b38ff) 2026-10-03 — Dossier de conformité FlaiX Expert v0.1 (plan de Rémi réécrit pour la caisse, parties 21 à 28)
  - [`d26e10e`](https://github.com/Break-Eat-APP/flaix-expert/commit/d26e10ef12863773b521852e0d84a9ffd2415a1d) 2026-10-03 — Dossier de conformité v0.1 en Word et PDF
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
  - [`docs/conformite/dossier-conformite-flaix-expert.md`](../../docs/conformite/dossier-conformite-flaix-expert.md) — créé
  - [`docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx`](../../docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx) — créé
  - [`docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf`](../../docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf) — créé

<a id="phase-30"></a>
## Phase 30 — Fidélité à la caisse : code promo et points dans le ticket scellé

- **Dates** : 2026-10-03
- **Décision et raisonnement** : dossier projet §15.127
- **État** : en cours : écran de caisse à vérifier dans le navigateur, pas encore en ligne
- **Commits** :
  - [`87c46b8`](https://github.com/Break-Eat-APP/flaix-expert/commit/87c46b8234d355b7db4e2dbdf6c328fa5574c301) 2026-10-03 — Fidélité à la caisse : code promo et points dans le ticket scellé, réservations du serveur (écran à vérifier)
- **Migrations (base)** :
  - [`db/migrations/0024_fidelite_caisse.sql`](../../db/migrations/0024_fidelite_caisse.sql) — créé
- **Moteur de calcul (packages/domain)** :
  - [`packages/domain/src/caisse-scellee.ts`](../../packages/domain/src/caisse-scellee.ts) — modifié
  - [`packages/domain/src/fidelite.ts`](../../packages/domain/src/fidelite.ts) — modifié
  - [`packages/domain/src/modele.ts`](../../packages/domain/src/modele.ts) — modifié
  - [`packages/domain/src/ticket.ts`](../../packages/domain/src/ticket.ts) — modifié
- **Serveur (apps/api)** :
  - [`apps/api/src/routes/caisse.ts`](../../apps/api/src/routes/caisse.ts) — modifié
  - [`apps/api/src/routes/fidelite-caisse.ts`](../../apps/api/src/routes/fidelite-caisse.ts) — créé
  - [`apps/api/src/routes/fidelite.ts`](../../apps/api/src/routes/fidelite.ts) — modifié
  - [`apps/api/src/serveur.ts`](../../apps/api/src/serveur.ts) — modifié
  - [`apps/api/test/tablette.ts`](../../apps/api/test/tablette.ts) — modifié
- **Écrans (apps/web)** :
  - [`apps/web/src/pages/caisse/EcranCaisse.tsx`](../../apps/web/src/pages/caisse/EcranCaisse.tsx) — modifié
  - [`apps/web/src/pages/caisse/FideliteCaisse.tsx`](../../apps/web/src/pages/caisse/FideliteCaisse.tsx) — créé
  - [`apps/web/src/pages/caisse/MesCaisses.tsx`](../../apps/web/src/pages/caisse/MesCaisses.tsx) — modifié
  - [`apps/web/src/pages/caisse/TicketClient.tsx`](../../apps/web/src/pages/caisse/TicketClient.tsx) — modifié
  - [`apps/web/src/styles.css`](../../apps/web/src/styles.css) — modifié
- **Tests** :
  - [`apps/api/test/fidelite-caisse.test.ts`](../../apps/api/test/fidelite-caisse.test.ts) — créé
  - [`packages/domain/src/fidelite-caisse.test.ts`](../../packages/domain/src/fidelite-caisse.test.ts) — créé
- **Documentation** :
  - [`docs/avancement.md`](../../docs/avancement.md) — modifié
