# CHANGELOG — FlaiX Expert

> Généré par `node infra/outils/journal-developpement.cjs` à partir de Git. Ne pas modifier à la main.
> Chaque entrée : date, commit (lien GitHub), message, fichiers créés ou modifiés. Le plus récent en premier. Phases : [docs/developpement/JOURNAL_DES_PHASES.md](docs/developpement/JOURNAL_DES_PHASES.md).

## 2026-10-05

### [`e463281`](https://github.com/Break-Eat-APP/flaix-expert/commit/e4632817f4f7960b4f8c102ceda8d45f25de0ba3) — Conformité : proposition pour les pièces restantes avant la production (dossier §15.149, à valider) ; avancement

- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`

### [`038601d`](https://github.com/Break-Eat-APP/flaix-expert/commit/038601dc4ccf133e081626a7d3d43199468d47ba) — Audits du 2026-10-05 : lien de carte refusé pour un abonné désactivé ; P3-1, P3-2, P3-3

- modifié : `apps/api/src/index.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/serveur.ts`
- modifié : `apps/api/test/wallet.test.ts`
- modifié : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`
- modifié : `docs/audits/AUDIT_2026-10-05_revue-supplementaire-wallet-modules.md`

### [`2bbfa35`](https://github.com/Break-Eat-APP/flaix-expert/commit/2bbfa3531dcfe02072e54fb3bd50af167f895278) — Audit Codex : mise en ligne vérifiée ; réglages Apple et Google enfin lus par le serveur (script de mise en ligne jamais mis à jour)

- modifié : `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md`
- modifié : `docs/avancement.md`

### [`9df5acd`](https://github.com/Break-Eat-APP/flaix-expert/commit/9df5acd92b8e84a20dd79f5618ce68696fbac7a5) — Audit Codex du 2026-10-05 : corrections

- modifié : `apps/api/package.json`
- modifié : `apps/api/src/index.ts`
- modifié : `apps/api/src/routes/clotures.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/wallet/apple.ts`
- créé : `apps/api/src/wallet/cms.ts`
- modifié : `apps/api/test/emails.test.ts`
- modifié : `apps/api/test/wallet-fichiers.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0038_wallet_relance.sql`
- créé : `docs/audits/AUDIT_2026-10-05_codex-phases-33-48.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CODEX_AUDIT_PROMPT.md`
- créé : `infra/outils/tests-un-par-un.mjs`
- modifié : `pnpm-lock.yaml`

### [`2d49d12`](https://github.com/Break-Eat-APP/flaix-expert/commit/2d49d1218f629a5d93562d3ba0a4ff5c745ce676) — Avancement : corrections de l'audit déployées sur le serveur de test

- modifié : `docs/avancement.md`

### [`76af5c9`](https://github.com/Break-Eat-APP/flaix-expert/commit/76af5c92f3e186a120cd2e3668844fe9dc061ffe) — Audit du 2026-10-05 : corrections notées dans le rapport ; avancement

- modifié : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`
- créé : `docs/audits/AUDIT_2026-10-05_revue-supplementaire-wallet-modules.md`
- modifié : `docs/avancement.md`

### [`360895e`](https://github.com/Break-Eat-APP/flaix-expert/commit/360895e746e57d6f985505fa58cf94afdb6f23de) — Audit du 2026-10-05 : corrections P2-1 à P2-5

- modifié : `apps/api/package.json`
- créé : `apps/api/src/arriere-plan.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/fidelite-caisse.ts`
- modifié : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/test/alertes.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0037_carte_abonne_desactive.sql`
- modifié : `packages/domain/src/wallet.test.ts`
- modifié : `packages/domain/src/wallet.ts`
- modifié : `pnpm-lock.yaml`

### [`0100cd3`](https://github.com/Break-Eat-APP/flaix-expert/commit/0100cd3380139b256f15edbeccb9a6e011098fe0) — Audit : revue des phases 39 à 48 par Claude (P2 : caisse qui attend les notifications, carte d'un abonné désactivé, mise à jour des cartes par lots, node-forge, limite PassKit) ; prompt Codex pour les phases 33 à 48

- créé : `docs/audits/AUDIT_2026-10-05_revue-claude-phases-39-48.md`
- modifié : `docs/developpement/CODEX_AUDIT_PROMPT.md`

### [`c98b882`](https://github.com/Break-Eat-APP/flaix-expert/commit/c98b882efcd70c79f464cc1e546f91853d980989) — Avancement : design de la carte abonné déployé sur le serveur de test

- modifié : `docs/avancement.md`

### [`405b044`](https://github.com/Break-Eat-APP/flaix-expert/commit/405b04421a55f9f71482ed1e464f153e5a0a69fd) — Design de la carte abonné : dossier §15.148, avancement, guide, journal des phases (phase 48)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`a6538ef`](https://github.com/Break-Eat-APP/flaix-expert/commit/a6538ef335fcaf5bdf5e1d55b2f8b35af2b78561) — Design de la carte abonné (2/2) : éditeur avec aperçu iPhone et Android, logo et bannière retaillés dans le navigateur, page de l'abonné aux couleurs du club (dossier §15.148) *(phase 48)*

- modifié : `apps/web/src/api.ts`
- créé : `apps/web/src/composants/ApercuCarte.tsx`
- modifié : `apps/web/src/pages/carte/PageCarte.tsx`
- modifié : `apps/web/src/pages/fidelite/CarteWallet.test.tsx`
- modifié : `apps/web/src/pages/fidelite/CarteWallet.tsx`
- créé : `apps/web/src/pages/fidelite/DesignCarte.test.tsx`
- créé : `apps/web/src/pages/fidelite/DesignCarte.tsx`
- modifié : `apps/web/src/pages/fidelite/Fidelite.tsx`
- créé : `apps/web/src/pages/fidelite/imagesCarte.ts`
- modifié : `apps/web/src/styles.css`

### [`0721b51`](https://github.com/Break-Eat-APP/flaix-expert/commit/0721b5128becc3a3b38e22653d7e7f98d6602f6a) — Design de la carte abonné (1/2) : logo, bannière, couleurs, textes, informations et liens ; modèle Google remplacé à chaque changement (dossier §15.148) *(phase 48)*

- modifié : `apps/api/src/routes/fidelite.ts`
- modifié : `apps/api/src/routes/lieu.ts`
- modifié : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/wallet/apple.ts`
- modifié : `apps/api/src/wallet/google.ts`
- créé : `apps/api/src/wallet/images.ts`
- modifié : `apps/api/test/wallet-fichiers.test.ts`
- modifié : `apps/api/test/wallet.test.ts`
- créé : `db/migrations/0036_design_carte.sql`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/wallet.test.ts`
- modifié : `packages/domain/src/wallet.ts`

### [`5f928e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/5f928e10cc45c602f4c6025704971d34856183db) — Avancement : comptes Apple et Google de la carte wallet installés sur le serveur de test

- modifié : `docs/avancement.md`

### [`be734a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/be734a0497d48788218b17e3b7ca385dad80b572) — Avancement : carte wallet déployée sur le serveur de test

- modifié : `docs/avancement.md`

### [`e351ee5`](https://github.com/Break-Eat-APP/flaix-expert/commit/e351ee57abeae90827b77754ac066428182ab6e8) — Wallet : dossier (réalisé), guide de Rémi pour Apple et Google, avancement, journal des phases (phase 47)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`4662794`](https://github.com/Break-Eat-APP/flaix-expert/commit/466279489d406c8ac1230051e1717cb73e7cf8d5) — Wallet (4/4) : page de la carte de l'abonné (/carte/<jeton>), lien de la carte dans la fiche de l'abonné, onglet « Carte téléphone » et couleur des cartes (dossier §15.147) *(phase 47)*

- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/carte/PageCarte.tsx`
- créé : `apps/web/src/pages/fidelite/CarteWallet.test.tsx`
- créé : `apps/web/src/pages/fidelite/CarteWallet.tsx`
- modifié : `apps/web/src/pages/fidelite/Fidelite.tsx`
- modifié : `apps/web/src/pages/parametres/EmailsLieu.tsx`
- modifié : `apps/web/src/styles.css`

### [`0b0f1ee`](https://github.com/Break-Eat-APP/flaix-expert/commit/0b0f1eea2f883d395f0a8b4a2f5bc2c208aeeae0) — Wallet (3/4) : commandes flaix-admin pour la carte Apple (clé et demande de certificat sur le serveur, installation de pass.cer contrôlée) et Google (clé du compte de service vérifiée auprès de Google) (dossier §15.147) *(phase 47)*

- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`

### [`6a23cf2`](https://github.com/Break-Eat-APP/flaix-expert/commit/6a23cf28837f784116a2d8c2af19180175019ce0) — Wallet (2/4) : carte Apple et Google côté serveur, service web PassKit, mises à jour du solde (dossier §15.147) *(phase 47)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/fidelite.ts`
- créé : `apps/api/src/routes/wallet.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/src/wallet/apple.ts`
- créé : `apps/api/src/wallet/fichiers.ts`
- créé : `apps/api/src/wallet/google.ts`
- modifié : `apps/api/test/emails.test.ts`
- créé : `apps/api/test/wallet-fichiers.test.ts`
- créé : `apps/api/test/wallet.test.ts`
- modifié : `db/migrations/0035_wallet.sql`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/emails.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/wallet.ts`

### [`91b5446`](https://github.com/Break-Eat-APP/flaix-expert/commit/91b5446a293d1a7d981e749812d1e1e4e0f64cb4) — Wallet (1/4) : décision, migration 0035 et contenu de la carte abonné (dossier §15.147) *(phase 47)*

- modifié : `apps/api/package.json`
- créé : `db/migrations/0035_wallet.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/wallet.test.ts`
- créé : `packages/domain/src/wallet.ts`
- modifié : `pnpm-lock.yaml`

### [`b53a267`](https://github.com/Break-Eat-APP/flaix-expert/commit/b53a2678daa08283526661fb0f6cc7dc412871f2) — Avancement : e-mails Brevo en service sur le serveur de test

- modifié : `docs/avancement.md`

### [`d123027`](https://github.com/Break-Eat-APP/flaix-expert/commit/d123027d3c4f02b8ca73cd8c990019473dee6bc5) — flaix-admin cle-brevo : affiche l'explication de Brevo en cas de refus, repère une clé SMTP collée à la place de la clé d'API

- modifié : `infra/vps/flaix-admin.sh`

### [`f340c85`](https://github.com/Break-Eat-APP/flaix-expert/commit/f340c853e04d5d91d99f11eb7aac9ce2a4badb9b) — Mise en ligne : le script de déploiement se met lui-même à jour sur le serveur

- modifié : `infra/vps/deployer.sh`

### [`4e7e74f`](https://github.com/Break-Eat-APP/flaix-expert/commit/4e7e74f45c43f70b3ee27ca74bfa94a7c3c24ac7) — Journal : phases 45 (IA OVHcloud) et 46 (e-mails Brevo)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/phases.cjs`

### [`3276652`](https://github.com/Break-Eat-APP/flaix-expert/commit/3276652190fa7fd86d1a643f2ee027e7f657ecf5) — E-mails par Brevo : rapport de soirée à la clôture, notification des rectifications de Z (dossier §15.146) *(phase 46)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/routes/clotures.ts`
- créé : `apps/api/src/routes/emails.ts`
- modifié : `apps/api/src/routes/evenements.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/emails.test.ts`
- créé : `apps/web/src/pages/parametres/EmailsLieu.test.tsx`
- créé : `apps/web/src/pages/parametres/EmailsLieu.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.tsx`
- créé : `db/migrations/0034_emails.sql`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- créé : `packages/domain/src/emails.test.ts`
- créé : `packages/domain/src/emails.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`12c69e1`](https://github.com/Break-Eat-APP/flaix-expert/commit/12c69e10bb15cef6b7a2fe3c1b9aca1164f0447c) — Avancement : serveur de test mis à jour (version b860416, migrations 0030 à 0033)

- modifié : `docs/avancement.md`

### [`b860416`](https://github.com/Break-Eat-APP/flaix-expert/commit/b8604166a371e12a7b414dbe8de26b42bae76ad6) — IA OVHcloud : « clé d'API » comme dans l'espace OVHcloud, commande à lancer en une ligne depuis PowerShell *(phase 45)*

- modifié : `docs/avancement.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/flaix-admin.sh`

### [`0cf75f7`](https://github.com/Break-Eat-APP/flaix-expert/commit/0cf75f74279946891a5f97e9149a8f8086144895) — IA : OVHcloud seul comme moteur de langage de l'agent (dossier §15.145) *(phase 45)*

- modifié : `apps/api/src/ia/fournisseur.ts`
- modifié : `apps/api/src/routes/assistant.ts`
- modifié : `apps/api/test/assistant.test.ts`
- modifié : `apps/web/src/pages/Assistant.test.tsx`
- modifié : `apps/web/src/pages/Assistant.tsx`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/flaix-admin.sh`
- modifié : `packages/domain/src/editeur.ts`

### [`e9427a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/e9427a6ab263b3b376ecb1e7ce3dd80bddafd756) — Avancement : vérification à l'écran terminée (prévision, temps de commande)

- modifié : `docs/avancement.md`

### [`7b69e85`](https://github.com/Break-Eat-APP/flaix-expert/commit/7b69e85de78f1fac19cd496629c63b9e522a6065) — Journal : phases 40 à 44 (temps de commande, centre d'alertes, fournisseurs, support niveau 2, prévision) ; avancement à jour

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`534a3a6`](https://github.com/Break-Eat-APP/flaix-expert/commit/534a3a6d867afcbcf5840bc11afcfd7c0f245267) — Prévision du prochain événement (dossier §15.143) *(phase 44)*

- créé : `apps/api/src/routes/prevision.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/prevision.test.ts`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/prevision/Prevision.test.tsx`
- créé : `apps/web/src/pages/prevision/Prevision.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/prevision.test.ts`
- créé : `packages/domain/src/prevision.ts`

### [`0a675eb`](https://github.com/Break-Eat-APP/flaix-expert/commit/0a675ebb0890bbe6e768539eac7b651b1c0d73a6) — Back-office niveau 2 : support FlaiX Expert sur autorisation du lieu (dossier §15.142) *(phase 43)*

- modifié : `apps/api/src/auth/contexte.ts`
- modifié : `apps/api/src/auth/routes.ts`
- modifié : `apps/api/src/base.ts`
- modifié : `apps/api/src/routes/editeur.ts`
- modifié : `apps/api/src/routes/outils.ts`
- créé : `apps/api/src/routes/support.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/support.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- modifié : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- créé : `apps/web/src/pages/parametres/SupportFlaix.test.tsx`
- créé : `apps/web/src/pages/parametres/SupportFlaix.tsx`
- créé : `db/migrations/0033_support_niveau2.sql`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`

### [`cb5cb03`](https://github.com/Break-Eat-APP/flaix-expert/commit/cb5cb039544ae547d7f86b649da7a5af4e35f00c) — Comparaison des prix entre fournisseurs (module 5, dossier §15.141) *(phase 42)*

- créé : `apps/api/src/routes/fournisseurs.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/fournisseurs.test.ts`
- créé : `apps/web/src/pages/stock/PrixFournisseurs.tsx`
- modifié : `apps/web/src/pages/stock/Stock.tsx`
- créé : `db/migrations/0032_conditionnements_fournisseurs.sql`
- créé : `packages/domain/src/fournisseurs.test.ts`
- créé : `packages/domain/src/fournisseurs.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`b24b3c6`](https://github.com/Break-Eat-APP/flaix-expert/commit/b24b3c607722123e302c890c09795f70f602d59f) — Centre d'alertes et rupture de stock poussée sur le téléphone (module 18, dossier §15.140) *(phase 41)*

- créé : `apps/api/src/routes/alertes.ts`
- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/click-collect.ts`
- modifié : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/alertes.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/alertes/CentreAlertes.test.tsx`
- créé : `apps/web/src/pages/alertes/CentreAlertes.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.test.tsx`
- modifié : `apps/web/src/pages/parametres/Notifications.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- créé : `db/migrations/0031_centre_alertes.sql`
- créé : `packages/domain/src/alertes.test.ts`
- créé : `packages/domain/src/alertes.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`

### [`72f087a`](https://github.com/Break-Eat-APP/flaix-expert/commit/72f087a9c12264b7aa6c658c949a6008d8e4b290) — Temps de prise de commande, par caisse et par stand (dossier §15.139) *(phase 40)*

- modifié : `apps/api/src/routes/caisse.ts`
- modifié : `apps/api/src/routes/pertes.ts`
- modifié : `apps/api/test/pertes.test.ts`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.test.tsx`
- modifié : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- modifié : `apps/web/src/pages/resultats/Pertes.test.tsx`
- modifié : `apps/web/src/pages/resultats/Pertes.tsx`
- créé : `db/migrations/0030_temps_de_service.sql`
- modifié : `packages/domain/src/caisse-scellee.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/pertes.ts`
- créé : `packages/domain/src/temps-service.test.ts`
- créé : `packages/domain/src/temps-service.ts`

### [`5516b41`](https://github.com/Break-Eat-APP/flaix-expert/commit/5516b41e3dbdcc3ce1c10a7ccff1063ff76554b5) — Dossier : temps de commande, centre d'alertes, prix fournisseurs, support niveau 2, prévision, copie de configuration abandonnée (§15.139 à §15.144)

- modifié : `docs/flaix-gestion-dossier-projet.md`

## 2026-10-04

### [`4d416ac`](https://github.com/Break-Eat-APP/flaix-expert/commit/4d416ac5c9af2fd00b7ef7a4294d8bfd6935d208) — Journal : phase 39 (Revenue Engine) ; décision du temps de prise de commande par caisse (dossier §15.139)

- modifié : `CHANGELOG.md`
- modifié : `docs/avancement.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `infra/outils/journal-developpement.cjs`
- modifié : `infra/outils/phases.cjs`

### [`f001e72`](https://github.com/Break-Eat-APP/flaix-expert/commit/f001e72807328fbfd90912174919d11b7dd5f91b) — Revenue Engine : onglet « Où je perds de l'argent » dans Résultats (dossier §15.138) *(phase 39)*

- créé : `apps/web/src/pages/resultats/Pertes.test.tsx`
- créé : `apps/web/src/pages/resultats/Pertes.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`

### [`6679d7e`](https://github.com/Break-Eat-APP/flaix-expert/commit/6679d7e3b95a5b0a3d944201499bac16b653694e) — Revenue Engine : route GET /api/pertes, événement ou période (dossier §15.138) *(phase 39)*

- créé : `apps/api/src/routes/pertes.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/pertes.test.ts`
- modifié : `packages/domain/src/pertes.ts`

### [`21c7f53`](https://github.com/Break-Eat-APP/flaix-expert/commit/21c7f53ff7f62de497df5079a50ec1bafa83e392) — Revenue Engine : moteur « où je perds de l'argent » et décision (dossier §15.138) *(phase 39)*

- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/index.ts`
- créé : `packages/domain/src/pertes.test.ts`
- créé : `packages/domain/src/pertes.ts`

### [`ffe43d3`](https://github.com/Break-Eat-APP/flaix-expert/commit/ffe43d3af21b6ddbc869b3f7da205f7d904c1aa1) — Avancement : inventaire des modules remis à jour au 2026-10-04

- modifié : `docs/avancement.md`

### [`aa091ea`](https://github.com/Break-Eat-APP/flaix-expert/commit/aa091ea651d6d39adf78be704c765b8aaf035d81) — Journal : passerelle d'IA rattachée à la phase 38

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `infra/outils/phases.cjs`

### [`047ce76`](https://github.com/Break-Eat-APP/flaix-expert/commit/047ce760656a8c5a5ba720501ede4c6bcedf593a) — Passerelle d'IA : Mistral d'abord, OVHcloud AI Endpoints en secours (dossier §15.137) *(phase 38)*

- modifié : `apps/api/src/config.ts`
- modifié : `apps/api/src/ia/fournisseur.ts`
- créé : `apps/api/test/ia.test.ts`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`

### [`7175d0b`](https://github.com/Break-Eat-APP/flaix-expert/commit/7175d0b6da4bd25db4dfe1b15a394b1b296070b8) — Journal : phase 38 (assistant Mistral)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- modifié : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- créé : `docs/developpement/phases/word/PHASE_38_ASSISTANT_POSE_TA_QUESTION_ET_BRIEF_REFORMULE_PAR_MISTRAL.docx`
- modifié : `infra/outils/phases.cjs`

### [`4a30d13`](https://github.com/Break-Eat-APP/flaix-expert/commit/4a30d1373cebf546b6614e731c9fb280fa9d41d6) — Assistant « pose ta question » et brief reformulé par Mistral, derrière une option du lieu (dossier §15.136) *(phase 38)*

- modifié : `apps/api/src/config.ts`
- créé : `apps/api/src/ia/fournisseur.ts`
- créé : `apps/api/src/routes/assistant.ts`
- modifié : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/routes/produits.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/assistant.test.ts`
- modifié : `apps/api/test/options.test.ts`
- modifié : `apps/web/src/App.tsx`
- modifié : `apps/web/src/composants/Coquille.test.ts`
- modifié : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/pages/Assistant.test.tsx`
- créé : `apps/web/src/pages/Assistant.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0029_assistant.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `docs/guide-serveur-test-ovh.md`
- modifié : `infra/vps/deployer.sh`
- modifié : `infra/vps/flaix-admin.sh`
- créé : `packages/domain/src/assistant.test.ts`
- créé : `packages/domain/src/assistant.ts`
- modifié : `packages/domain/src/editeur.ts`
- modifié : `packages/domain/src/index.ts`

### [`8354e35`](https://github.com/Break-Eat-APP/flaix-expert/commit/8354e354ef96657d911a1b10f615058d6fdbbd4d) — Journal : phase 37 (brief de fin de soirée)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- créé : `docs/developpement/phases/word/PHASE_37_BRIEF_DE_FIN_DE_SOIREE_EN_NOTIFICATION_SUR_LE_TELEPHONE.docx`
- modifié : `infra/outils/phases.cjs`

### [`bcb9455`](https://github.com/Break-Eat-APP/flaix-expert/commit/bcb9455bc942b80996d2302d3467a2a1a9316a56) — Brief de fin de soirée envoyé en notification sur le téléphone du directeur (dossier §15.135) *(phase 37)*

- modifié : `apps/api/package.json`
- modifié : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/notifications.ts`
- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/notifications.test.ts`
- modifié : `apps/web/public/sw.js`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/pages/parametres/Notifications.test.tsx`
- créé : `apps/web/src/pages/parametres/Notifications.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/styles.css`
- créé : `db/migrations/0028_brief_notifications.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `packages/domain/src/brief.test.ts`
- créé : `packages/domain/src/brief.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `pnpm-lock.yaml`

### [`2f42193`](https://github.com/Break-Eat-APP/flaix-expert/commit/2f42193e3a18d9e7a30cfbfc6c6e739f3c00c4ab) — Analyse « Intelligence, prévision et décision » v1 : avis sur la note produit, marché, propositions, IA, cadre juridique (dossier §15.134)

- créé : `docs/strategie/FlaiX-Expert-Intelligence-prevision-decision-v1.docx`
- créé : `docs/strategie/FlaiX-Expert-Intelligence-prevision-decision-v1.pdf`
- créé : `docs/strategie/analyse-intelligence-2026-10.md`

### [`8ed1a2c`](https://github.com/Break-Eat-APP/flaix-expert/commit/8ed1a2c0c059f5d1613ab92bdd7b83c295e8d57a) — Journal : phase 36 (bilan sur une période)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- modifié : `docs/developpement/phases/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.md`
- créé : `docs/developpement/phases/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- modifié : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- créé : `docs/developpement/phases/word/PHASE_36_BILAN_SUR_UNE_PERIODE_DU_AU.docx`
- modifié : `infra/outils/phases.cjs`

### [`10e0186`](https://github.com/Break-Eat-APP/flaix-expert/commit/10e018659b30bb2cf3a005ec4ef65994e92ce077) — Bilan sur une période « du … au … » dans Résultats et Finances (dossier §15.133) *(phase 36)*

- modifié : `apps/api/src/routes/finances.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- créé : `apps/api/test/periode.test.ts`
- modifié : `apps/web/src/pages/resultats/Finances.test.tsx`
- modifié : `apps/web/src/pages/resultats/Finances.tsx`
- créé : `apps/web/src/pages/resultats/Tableaux.test.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- modifié : `packages/domain/src/finances.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/periode-bilan.test.ts`
- créé : `packages/domain/src/periode-bilan.ts`

### [`11ce1ec`](https://github.com/Break-Eat-APP/flaix-expert/commit/11ce1ecd57c4babe97af5e5d6d157f8225073384) — Journal : phase 35 (cibles de marge et gestion financière)

- modifié : `CHANGELOG.md`
- modifié : `docs/developpement/CARTE_DU_CODE.md`
- modifié : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.md`
- modifié : `docs/developpement/phases/README.md`
- modifié : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- modifié : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- modifié : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- modifié : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- modifié : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- modifié : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- modifié : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- modifié : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- modifié : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- modifié : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- modifié : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- modifié : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- modifié : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- modifié : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- modifié : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- modifié : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- modifié : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- modifié : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- modifié : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- modifié : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- modifié : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- modifié : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- modifié : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- modifié : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- modifié : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- modifié : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- modifié : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- modifié : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- modifié : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- modifié : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- modifié : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- créé : `docs/developpement/phases/word/PHASE_35_CIBLES_DE_MARGE_ET_GESTION_FINANCIERE_DE_LA_SOIREE.docx`
- modifié : `infra/outils/phases.cjs`

### [`074647f`](https://github.com/Break-Eat-APP/flaix-expert/commit/074647f3a6d171ab1f4b33201e211395759a1efa) — Cibles de marge et gestion financière de la soirée (modules 5 et 11, dossier §15.132) *(phase 35)*

- créé : `apps/api/src/routes/finances.ts`
- modifié : `apps/api/src/routes/produits.ts`
- modifié : `apps/api/src/routes/rapport-soiree.ts`
- modifié : `apps/api/src/routes/resultats.ts`
- modifié : `apps/api/src/serveur.ts`
- créé : `apps/api/test/finances.test.ts`
- modifié : `apps/api/test/rapport-soiree.test.ts`
- modifié : `apps/web/src/App.tsx`
- créé : `apps/web/src/composants/cibles.tsx`
- créé : `apps/web/src/pages/parametres/Objectifs.tsx`
- modifié : `apps/web/src/pages/parametres/Parametres.tsx`
- modifié : `apps/web/src/pages/parametres/Produits.tsx`
- créé : `apps/web/src/pages/resultats/Finances.test.tsx`
- créé : `apps/web/src/pages/resultats/Finances.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- modifié : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- modifié : `apps/web/src/pages/resultats/Tableaux.tsx`
- modifié : `apps/web/src/resultats.css`
- créé : `db/migrations/0027_cibles_finances.sql`
- modifié : `docs/avancement.md`
- modifié : `docs/flaix-gestion-dossier-projet.md`
- créé : `packages/domain/src/finances.test.ts`
- créé : `packages/domain/src/finances.ts`
- modifié : `packages/domain/src/index.ts`
- modifié : `packages/domain/src/journal-technique.ts`
- modifié : `packages/domain/src/modele.ts`
- modifié : `packages/domain/src/rapport-soiree.test.ts`
- modifié : `packages/domain/src/rapport-soiree.ts`

### [`dd181a0`](https://github.com/Break-Eat-APP/flaix-expert/commit/dd181a0ad88f55d567f681ba03eb489194720d49) — Journal : phase 34 (rapport de soirée)

- créé : `.claude/launch.json`
- créé : `.gitattributes`
- créé : `.githooks/pre-push`
- créé : `.gitignore`
- créé : `AGENTS.md`
- créé : `CHANGELOG.md`
- créé : `CLAUDE.md`
- créé : `README.md`
- créé : `apps/api/package.json`
- créé : `apps/api/src/auth/appareil.ts`
- créé : `apps/api/src/auth/contexte.ts`
- créé : `apps/api/src/auth/routes.ts`
- créé : `apps/api/src/auth/secrets.ts`
- créé : `apps/api/src/base.ts`
- créé : `apps/api/src/config.ts`
- créé : `apps/api/src/erreurs.ts`
- créé : `apps/api/src/index.ts`
- créé : `apps/api/src/journal-caisse.ts`
- créé : `apps/api/src/journal-technique.ts`
- créé : `apps/api/src/options.ts`
- créé : `apps/api/src/outils/cli.ts`
- créé : `apps/api/src/outils/migrations.ts`
- créé : `apps/api/src/outils/migrer.ts`
- créé : `apps/api/src/outils/reinitialiser-base-dev.ts`
- créé : `apps/api/src/routes/caisse.ts`
- créé : `apps/api/src/routes/click-collect.ts`
- créé : `apps/api/src/routes/clotures.ts`
- créé : `apps/api/src/routes/couts-buvette.ts`
- créé : `apps/api/src/routes/editeur.ts`
- créé : `apps/api/src/routes/equipe.ts`
- créé : `apps/api/src/routes/evenements.ts`
- créé : `apps/api/src/routes/export-comptable.ts`
- créé : `apps/api/src/routes/factures.ts`
- créé : `apps/api/src/routes/fidelite-caisse.ts`
- créé : `apps/api/src/routes/fidelite.ts`
- créé : `apps/api/src/routes/formation.ts`
- créé : `apps/api/src/routes/journal.ts`
- créé : `apps/api/src/routes/lieu.ts`
- créé : `apps/api/src/routes/outils.ts`
- créé : `apps/api/src/routes/periodes.ts`
- créé : `apps/api/src/routes/planning.ts`
- créé : `apps/api/src/routes/produits.ts`
- créé : `apps/api/src/routes/rapport-soiree.ts`
- créé : `apps/api/src/routes/recettes.ts`
- créé : `apps/api/src/routes/resultats.ts`
- créé : `apps/api/src/routes/stands.ts`
- créé : `apps/api/src/routes/stock-ingredients.ts`
- créé : `apps/api/src/routes/stock.ts`
- créé : `apps/api/src/serveur.ts`
- créé : `apps/api/test/aide.ts`
- créé : `apps/api/test/api.test.ts`
- créé : `apps/api/test/caisse-auto.test.ts`
- créé : `apps/api/test/caisse.test.ts`
- créé : `apps/api/test/caissieres.test.ts`
- créé : `apps/api/test/click-collect.test.ts`
- créé : `apps/api/test/clotures.test.ts`
- créé : `apps/api/test/coffre.test.ts`
- créé : `apps/api/test/conformite-base.test.ts`
- créé : `apps/api/test/couts-buvette.test.ts`
- créé : `apps/api/test/editeur.test.ts`
- créé : `apps/api/test/equipe.test.ts`
- créé : `apps/api/test/export-comptable.test.ts`
- créé : `apps/api/test/factures.test.ts`
- créé : `apps/api/test/fidelite-caisse.test.ts`
- créé : `apps/api/test/fidelite.test.ts`
- créé : `apps/api/test/formation.test.ts`
- créé : `apps/api/test/lieux-editeur.test.ts`
- créé : `apps/api/test/options.test.ts`
- créé : `apps/api/test/periodes.test.ts`
- créé : `apps/api/test/preparation-base.ts`
- créé : `apps/api/test/rapport-soiree.test.ts`
- créé : `apps/api/test/recettes.test.ts`
- créé : `apps/api/test/resultats.test.ts`
- créé : `apps/api/test/stock-ingredients.test.ts`
- créé : `apps/api/test/stock.test.ts`
- créé : `apps/api/test/tablette.ts`
- créé : `apps/api/tsconfig.json`
- créé : `apps/api/vitest.config.ts`
- créé : `apps/web/index.html`
- créé : `apps/web/package.json`
- créé : `apps/web/public/apple-touch-icon.png`
- créé : `apps/web/public/icone-192.png`
- créé : `apps/web/public/icone-512.png`
- créé : `apps/web/public/icone-masquable-512.png`
- créé : `apps/web/public/manifest.webmanifest`
- créé : `apps/web/public/sw.js`
- créé : `apps/web/src/App.tsx`
- créé : `apps/web/src/api.ts`
- créé : `apps/web/src/assets/logo-clair.svg`
- créé : `apps/web/src/assets/logo-sombre.svg`
- créé : `apps/web/src/composants/Coquille.test.ts`
- créé : `apps/web/src/composants/Coquille.tsx`
- créé : `apps/web/src/composants/Formation.tsx`
- créé : `apps/web/src/composants/Logo.tsx`
- créé : `apps/web/src/composants/MotDePasse.tsx`
- créé : `apps/web/src/composants/communs.tsx`
- créé : `apps/web/src/main.tsx`
- créé : `apps/web/src/pages/Compte.tsx`
- créé : `apps/web/src/pages/Connexion.tsx`
- créé : `apps/web/src/pages/ConnexionCaissiere.tsx`
- créé : `apps/web/src/pages/Resultats.tsx`
- créé : `apps/web/src/pages/caisse/EcranCaisse.test.tsx`
- créé : `apps/web/src/pages/caisse/EcranCaisse.tsx`
- créé : `apps/web/src/pages/caisse/FideliteCaisse.test.tsx`
- créé : `apps/web/src/pages/caisse/FideliteCaisse.tsx`
- créé : `apps/web/src/pages/caisse/MesCaisses.tsx`
- créé : `apps/web/src/pages/caisse/PosteCaissiere.tsx`
- créé : `apps/web/src/pages/caisse/TicketClient.tsx`
- créé : `apps/web/src/pages/caisse/memoire.test.ts`
- créé : `apps/web/src/pages/caisse/memoire.ts`
- créé : `apps/web/src/pages/clotures/Clotures.tsx`
- créé : `apps/web/src/pages/clotures/ExportComptable.tsx`
- créé : `apps/web/src/pages/clotures/Periodes.tsx`
- créé : `apps/web/src/pages/direct/EnDirect.tsx`
- créé : `apps/web/src/pages/editeur/EspaceEditeur.tsx`
- créé : `apps/web/src/pages/equipe/Equipe.tsx`
- créé : `apps/web/src/pages/equipe/Planning.tsx`
- créé : `apps/web/src/pages/factures/Factures.tsx`
- créé : `apps/web/src/pages/fidelite/Fidelite.tsx`
- créé : `apps/web/src/pages/parametres/ClickCollect.tsx`
- créé : `apps/web/src/pages/parametres/CoutsBuvette.tsx`
- créé : `apps/web/src/pages/parametres/Formation.tsx`
- créé : `apps/web/src/pages/parametres/Identite.tsx`
- créé : `apps/web/src/pages/parametres/JournalTechnique.tsx`
- créé : `apps/web/src/pages/parametres/Parametres.tsx`
- créé : `apps/web/src/pages/parametres/Produits.tsx`
- créé : `apps/web/src/pages/parametres/Recettes.tsx`
- créé : `apps/web/src/pages/parametres/Saison.tsx`
- créé : `apps/web/src/pages/parametres/StandsCaisses.tsx`
- créé : `apps/web/src/pages/resultats/RapportSoiree.test.tsx`
- créé : `apps/web/src/pages/resultats/RapportSoiree.tsx`
- créé : `apps/web/src/pages/resultats/Tableaux.tsx`
- créé : `apps/web/src/pages/resultats/graphiques.tsx`
- créé : `apps/web/src/pages/stock/Stock.tsx`
- créé : `apps/web/src/pages/stock/StockIngredients.tsx`
- créé : `apps/web/src/resultats.css`
- créé : `apps/web/src/session.tsx`
- créé : `apps/web/src/styles.css`
- créé : `apps/web/tsconfig.json`
- créé : `apps/web/vite.config.ts`
- créé : `apps/web/vitest.config.ts`
- créé : `db/migrations/0001_socle.sql`
- créé : `db/migrations/0002_configuration_lieu.sql`
- créé : `db/migrations/0003_matchs_et_caisse.sql`
- créé : `db/migrations/0004_vente_sans_reseau.sql`
- créé : `db/migrations/0005_caissieres_et_tablettes.sql`
- créé : `db/migrations/0006_comptage_especes.sql`
- créé : `db/migrations/0007_equipe_planning.sql`
- créé : `db/migrations/0008_stock.sql`
- créé : `db/migrations/0009_coffre.sql`
- créé : `db/migrations/0010_clotures_periode.sql`
- créé : `db/migrations/0011_exercice_a_regler.sql`
- créé : `db/migrations/0012_mode_formation.sql`
- créé : `db/migrations/0013_plan_comptes.sql`
- créé : `db/migrations/0014_click_collect.sql`
- créé : `db/migrations/0015_couts_buvette.sql`
- créé : `db/migrations/0016_fidelite.sql`
- créé : `db/migrations/0017_factures_fournisseurs.sql`
- créé : `db/migrations/0018_back_office_editeur.sql`
- créé : `db/migrations/0019_recettes.sql`
- créé : `db/migrations/0020_options_lieu.sql`
- créé : `db/migrations/0021_lieux_back_office.sql`
- créé : `db/migrations/0022_export_base_assiette_cc.sql`
- créé : `db/migrations/0023_stock_ingredients.sql`
- créé : `db/migrations/0024_fidelite_caisse.sql`
- créé : `db/migrations/0025_caisse_automatique.sql`
- créé : `db/migrations/0026_rapport_soiree.sql`
- créé : `docs/audits/AUDIT_2026-10-04_revue-code.md`
- créé : `docs/audits/README.md`
- créé : `docs/avancement.md`
- créé : `docs/cadrage/flex-expert-perimetre.md`
- créé : `docs/cadrage/flex-expert-test-terrain.md`
- créé : `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.docx`
- créé : `docs/conformite/FlaiX-Expert-Dossier-de-conformite-v0.1.pdf`
- créé : `docs/conformite/dossier-conformite-flaix-expert.md`
- créé : `docs/decisions-architecture-production.md`
- créé : `docs/developpement/CARTE_DU_CODE.md`
- créé : `docs/developpement/CODEX_AUDIT_PROMPT.md`
- créé : `docs/developpement/JOURNAL_DES_PHASES.md`
- créé : `docs/developpement/phases/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.md`
- créé : `docs/developpement/phases/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.md`
- créé : `docs/developpement/phases/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.md`
- créé : `docs/developpement/phases/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.md`
- créé : `docs/developpement/phases/PHASE_04_SERVEUR_DE_TEST_OVH.md`
- créé : `docs/developpement/phases/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.md`
- créé : `docs/developpement/phases/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.md`
- créé : `docs/developpement/phases/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.md`
- créé : `docs/developpement/phases/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.md`
- créé : `docs/developpement/phases/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.md`
- créé : `docs/developpement/phases/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.md`
- créé : `docs/developpement/phases/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.md`
- créé : `docs/developpement/phases/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.md`
- créé : `docs/developpement/phases/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.md`
- créé : `docs/developpement/phases/PHASE_14_MODE_FORMATION_FACTICE.md`
- créé : `docs/developpement/phases/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.md`
- créé : `docs/developpement/phases/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.md`
- créé : `docs/developpement/phases/PHASE_17_VUE_TELEPHONE_EN_DIRECT.md`
- créé : `docs/developpement/phases/PHASE_18_COUTS_PAR_BUVETTE.md`
- créé : `docs/developpement/phases/PHASE_19_FIDELITE_PARTIE_GESTION.md`
- créé : `docs/developpement/phases/PHASE_20_FACTURES_FOURNISSEURS.md`
- créé : `docs/developpement/phases/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.md`
- créé : `docs/developpement/phases/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.md`
- créé : `docs/developpement/phases/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.md`
- créé : `docs/developpement/phases/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.md`
- créé : `docs/developpement/phases/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.md`
- créé : `docs/developpement/phases/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.md`
- créé : `docs/developpement/phases/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.md`
- créé : `docs/developpement/phases/PHASE_28_LOGO_OFFICIEL_V2.md`
- créé : `docs/developpement/phases/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.md`
- créé : `docs/developpement/phases/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.md`
- créé : `docs/developpement/phases/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.md`
- créé : `docs/developpement/phases/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.md`
- créé : `docs/developpement/phases/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.md`
- créé : `docs/developpement/phases/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.md`
- créé : `docs/developpement/phases/README.md`
- créé : `docs/developpement/phases/word/PHASE_00_SOCLE_DE_PRODUCTION_ET_CONFIGURATION_DUN_LIEU_VIDE.docx`
- créé : `docs/developpement/phases/word/PHASE_01_MATCHS_CAISSE_MES_CAISSES_JOURNAL_DES_TICKETS.docx`
- créé : `docs/developpement/phases/word/PHASE_02_RETOUR_DE_DEMONSTRATION_ORGANISATION_EN_6_ENTREES_MAQUETTES.docx`
- créé : `docs/developpement/phases/word/PHASE_03_VENTE_SANS_RESEAU_LA_TABLETTE_SCELLE_LE_SERVEUR_VERIFIE.docx`
- créé : `docs/developpement/phases/word/PHASE_04_SERVEUR_DE_TEST_OVH.docx`
- créé : `docs/developpement/phases/word/PHASE_05_COMPTES_DES_CAISSIERES_ET_TABLETTES_ENREGISTREES.docx`
- créé : `docs/developpement/phases/word/PHASE_06_TICKET_CLIENT_SUR_DEMANDE_ET_DUPLICATA.docx`
- créé : `docs/developpement/phases/word/PHASE_07_CLOTURE_DU_MATCH_Z_DES_TIROIRS_RECTIFICATION_SIGNEE.docx`
- créé : `docs/developpement/phases/word/PHASE_08_RESULTATS_SUR_LES_VRAIES_VENTES.docx`
- créé : `docs/developpement/phases/word/PHASE_09_EQUIPE_FICHES_PLANNING_MASSE_SALARIALE.docx`
- créé : `docs/developpement/phases/word/PHASE_10_STOCK_RESERVE_LIVRAISONS_AU_CUMP_MISE_EN_PLACE_COMPTAGE.docx`
- créé : `docs/developpement/phases/word/PHASE_11_REMONTEES_AU_COFFRE_ET_Z_DU_COFFRE.docx`
- créé : `docs/developpement/phases/word/PHASE_12_CLOTURES_MENSUELLE_ET_ANNUELLE_TOTAL_PERPETUEL.docx`
- créé : `docs/developpement/phases/word/PHASE_13_EXERCICE_PAR_LIEU_SAUVEGARDES_CHIFFREES_HORS_SERVEUR.docx`
- créé : `docs/developpement/phases/word/PHASE_14_MODE_FORMATION_FACTICE.docx`
- créé : `docs/developpement/phases/word/PHASE_15_EXPORT_POUR_LEXPERT_COMPTABLE.docx`
- créé : `docs/developpement/phases/word/PHASE_16_CLICK_COLLECT_MOTEUR_DE_PRIX_ET_CATALOGUE.docx`
- créé : `docs/developpement/phases/word/PHASE_17_VUE_TELEPHONE_EN_DIRECT.docx`
- créé : `docs/developpement/phases/word/PHASE_18_COUTS_PAR_BUVETTE.docx`
- créé : `docs/developpement/phases/word/PHASE_19_FIDELITE_PARTIE_GESTION.docx`
- créé : `docs/developpement/phases/word/PHASE_20_FACTURES_FOURNISSEURS.docx`
- créé : `docs/developpement/phases/word/PHASE_21_BACK_OFFICE_EDITEUR_NIVEAU_1.docx`
- créé : `docs/developpement/phases/word/PHASE_22_DECISIONS_DU_2026_10_01_ET_RECETTES.docx`
- créé : `docs/developpement/phases/word/PHASE_23_OPTIONS_PAR_LIEU_APPLICATION_INSTALLABLE_LOGO.docx`
- créé : `docs/developpement/phases/word/PHASE_24_ADRESSE_DU_SITE_FLAIXEXPERT_FLAIXLABS_COM.docx`
- créé : `docs/developpement/phases/word/PHASE_25_MARQUE_FLAIX_EXPERT_LIEUX_ET_DIRECTEURS_DEPUIS_LE_BACK_OFFICE_MOTS_DE_.docx`
- créé : `docs/developpement/phases/word/PHASE_26_CLICK_COLLECT_NEUTRE_EXPORT_COMPTABLE_DANS_LA_BASE_ASSIETTE_DE_LA_COMM.docx`
- créé : `docs/developpement/phases/word/PHASE_27_STOCK_DES_INGREDIENTS_AU_CHOIX_BIERE_PRESSION.docx`
- créé : `docs/developpement/phases/word/PHASE_28_LOGO_OFFICIEL_V2.docx`
- créé : `docs/developpement/phases/word/PHASE_29_DOSSIER_DE_CONFORMITE_V0_1.docx`
- créé : `docs/developpement/phases/word/PHASE_30_FIDELITE_A_LA_CAISSE_CODE_PROMO_ET_POINTS_DANS_LE_TICKET_SCELLE.docx`
- créé : `docs/developpement/phases/word/PHASE_31_SUIVI_DU_DEVELOPPEMENT_ET_PREPARATION_DE_LAUDIT_CODEX.docx`
- créé : `docs/developpement/phases/word/PHASE_32_PREMIER_AUDIT_CODEX_ET_CORRECTIONS.docx`
- créé : `docs/developpement/phases/word/PHASE_33_CAISSE_AUTOMATIQUE_SELON_LA_DATE_CLOTURE_PAR_LE_DIRECTEUR_EVENEMENT_PA.docx`
- créé : `docs/developpement/phases/word/PHASE_34_RAPPORT_DE_SOIREE_FIGE_A_LA_CLOTURE_IMPRIMABLE_ET_EN_PDF.docx`
- créé : `docs/flaix-brief-production-claude-code.md`
- créé : `docs/flaix-gestion-dossier-projet.md`
- créé : `docs/guide-serveur-test-ovh.md`
- créé : `docs/maquettes/organisation-v2.html`
- créé : `docs/marque/logo-expert-officiel.png`
- créé : `docs/marque/logo-expert-officiel.svg`
- créé : `docs/questions-expert-comptable.md`
- créé : `docs/reference/flaix-gestion-final.html`
- créé : `infra/docker-compose.yml`
- créé : `infra/outils/carte-du-code-intro.md`
- créé : `infra/outils/icones-application.cjs`
- créé : `infra/outils/journal-developpement.cjs`
- créé : `infra/outils/logo.cjs`
- créé : `infra/outils/md-vers-docx.cjs`
- créé : `infra/outils/phases-word.cjs`
- créé : `infra/outils/phases.cjs`
- créé : `infra/postgres/init/01-bases.sql`
- créé : `infra/vps/deployer.sh`
- créé : `infra/vps/flaix-admin.sh`
- créé : `infra/vps/installer-socle.sh`
- créé : `infra/vps/montee-debian.sh`
- créé : `infra/vps/securiser.sh`
- créé : `package.json`
- créé : `packages/domain/package.json`
- créé : `packages/domain/src/argent.test.ts`
- créé : `packages/domain/src/argent.ts`
- créé : `packages/domain/src/caisse-auto.test.ts`
- créé : `packages/domain/src/caisse-auto.ts`
- créé : `packages/domain/src/caisse-scellee.test.ts`
- créé : `packages/domain/src/caisse-scellee.ts`
- créé : `packages/domain/src/chaine.test.ts`
- créé : `packages/domain/src/chaine.ts`
- créé : `packages/domain/src/click-collect.test.ts`
- créé : `packages/domain/src/click-collect.ts`
- créé : `packages/domain/src/cloture-periode.test.ts`
- créé : `packages/domain/src/cloture-periode.ts`
- créé : `packages/domain/src/couts-buvette.test.ts`
- créé : `packages/domain/src/couts-buvette.ts`
- créé : `packages/domain/src/editeur.ts`
- créé : `packages/domain/src/especes.test.ts`
- créé : `packages/domain/src/especes.ts`
- créé : `packages/domain/src/export-comptable.test.ts`
- créé : `packages/domain/src/export-comptable.ts`
- créé : `packages/domain/src/factures.test.ts`
- créé : `packages/domain/src/factures.ts`
- créé : `packages/domain/src/fidelite-caisse.test.ts`
- créé : `packages/domain/src/fidelite.test.ts`
- créé : `packages/domain/src/fidelite.ts`
- créé : `packages/domain/src/index.ts`
- créé : `packages/domain/src/journal-caisse.ts`
- créé : `packages/domain/src/journal-technique.ts`
- créé : `packages/domain/src/marge.ts`
- créé : `packages/domain/src/modele.ts`
- créé : `packages/domain/src/mot-de-passe.test.ts`
- créé : `packages/domain/src/mot-de-passe.ts`
- créé : `packages/domain/src/planning.test.ts`
- créé : `packages/domain/src/planning.ts`
- créé : `packages/domain/src/rapport-soiree.test.ts`
- créé : `packages/domain/src/rapport-soiree.ts`
- créé : `packages/domain/src/recettes.test.ts`
- créé : `packages/domain/src/recettes.ts`
- créé : `packages/domain/src/resultats.test.ts`
- créé : `packages/domain/src/resultats.ts`
- créé : `packages/domain/src/stock-ingredients.test.ts`
- créé : `packages/domain/src/stock-ingredients.ts`
- créé : `packages/domain/src/stock.test.ts`
- créé : `packages/domain/src/stock.ts`
- créé : `packages/domain/src/ticket.test.ts`
- créé : `packages/domain/src/ticket.ts`
- créé : `packages/domain/src/tva-marge.test.ts`
- créé : `packages/domain/src/tva.ts`
- créé : `packages/domain/tsconfig.json`
- créé : `pnpm-lock.yaml`
- créé : `pnpm-workspace.yaml`
- créé : `tsconfig.base.json`
