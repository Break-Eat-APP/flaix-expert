# Guide — commander le serveur de la version test chez OVHcloud

Pour Rémi. Rédigé le 2026-09-29, prix relevés ce jour sur https://www.ovhcloud.com/fr/vps/. Les écrans d'OVHcloud changent de temps en temps : si une étape ne ressemble pas exactement à ce qui est écrit ici, garde le principe et demande-moi.

## Ce que tu commandes

**VPS-1** (gamme « VPS 2027 ») : 2 vCores, 4 Go de mémoire, 40 Go de disque NVMe, sauvegarde automatique quotidienne incluse.
Prix affiché : **« à partir de » 3,81 € HT, soit 4,57 € TTC par mois.** « À partir de » : le prix final dépend de la durée d'engagement choisie — vérifie le total avant de payer et dis-le-moi s'il est très différent.

Ce serveur héberge **la version test** (le logiciel + sa base de données, en France). La production viendra plus tard, avec une base de données gérée à part (décision n° 7).

## Étape 1 — Commander (toi seul : compte OVHcloud et paiement)

1. Va sur https://www.ovhcloud.com/fr/vps/ et clique **« Configurer »** sous **VPS-1**.
2. **Localisation** : choisis un **datacenter en France** (par exemple Gravelines ou Strasbourg). **Pas de « Local Zone »** : la sauvegarde automatique n'y est pas disponible.
3. **Système d'exploitation** : **Debian**, la version la plus récente proposée. **Aucune application préinstallée** (ni Plesk, ni cPanel, ni Docker, ni WordPress), **pas de Windows**.
4. **Clé SSH** : si la page propose d'ajouter une clé SSH, colle **exactement** cette ligne (c'est la partie publique de la clé de ton ordinateur, elle peut être montrée sans risque) :

   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPi4h9lrH/8uMEcO3VWnVQc973S6iybOH8sgSEB863Rc flaix-expert-deploiement
   ```

   Si la page ne propose rien, ignore cette étape : on l'ajoutera après.
5. **Options** : la sauvegarde quotidienne incluse suffit. **Ne prends aucune option payante.**
6. **Durée** : sans engagement si l'écart de prix est faible ; sinon 12 mois reste raisonnable pour un test de saison. C'est ton choix.
7. **Compte OVHcloud et paiement** : tu les fais toi-même. **Ne me donne jamais** ton mot de passe OVHcloud ni tes coordonnées bancaires.

## Étape 2 — Quand le serveur est prêt

OVHcloud t'envoie un e-mail (souvent quelques minutes après le paiement) avec **l'adresse IP** du serveur (quatre nombres, par exemple 51.xxx.xxx.xxx) et un identifiant de connexion.

**Envoie-moi seulement l'adresse IP.** Si l'e-mail contient un mot de passe ou un lien pour en créer un, **ne me l'envoie pas** : je me connecte avec la clé SSH de ton ordinateur, jamais avec un mot de passe.

Si tu n'as pas pu coller la clé à l'étape 1 : dans l'espace client OVHcloud, ouvre ton VPS et cherche « clé SSH » ou « réinstaller » — ou dis-le-moi, je te guiderai écran par écran.

## Étape 3 — L'adresse du site

La connexion au logiciel exige une adresse sécurisée (https) sur un serveur : c'est voulu, pour protéger les mots de passe. Deux possibilités :

- **Tu as un nom de domaine** (par exemple flaixlabs.com) : on crée un sous-domaine, par exemple `test-flaix.<ton-domaine>`, qui pointe vers l'adresse IP du serveur. Je te dirai exactement quoi saisir chez ton registraire (là où le domaine est acheté).
- **Tu n'en as pas, ou tu préfères attendre** : j'utilise une adresse provisoire gratuite construite à partir de l'adresse IP (service public sslip.io), avec un certificat https gratuit (Let's Encrypt). Parfait pour un test, moins joli à montrer.

## Étape 4 — Ce que je fais ensuite, depuis ton ordinateur

1. **Sécuriser le serveur** : mises à jour, pare-feu (seuls le web et la connexion par clé restent ouverts), connexion par mot de passe désactivée.
2. **Installer** Node.js, PostgreSQL 17 et un serveur web qui gère le https automatiquement (Caddy).
3. **Déployer FlaiX Expert en mode « test »** : le bandeau « VERSION DE TEST » s'affiche en haut de chaque écran.
4. **Créer le lieu vide** (Les Spartiates de Marseille) et le compte du directeur. Le mot de passe provisoire s'affiche une seule fois, **pour toi** : tu le transmets toi-même au directeur, qui le change à la première connexion.
5. **Mettre en place une sauvegarde quotidienne de la base de données**, en plus de la sauvegarde d'OVHcloud.
6. Te donner l'adresse du site et vérifier avec toi que tout fonctionne.

## Ce qui a été fait le 2026-09-29 (serveur en service)

- **Serveur** : `vps-1fbd80b9.vps.ovh.net`, adresse IPv4 146.59.154.196. **Adresse du site : https://flaixexpert.flaixlabs.com** depuis le 2026-10-02 (sous-domaine enregistré par Rémi, entrée DNS de type A vers 146.59.154.196 ; certificat https Let's Encrypt obtenu et renouvelé automatiquement). **Back-office FlaiX Expert : https://flaixexpert.flaixlabs.com/editeur**. L'ancienne adresse provisoire (https://146-59-154-196.sslip.io) renvoie automatiquement vers la nouvelle.
- **Système** : OVH avait installé Debian 11, **sans correctifs de sécurité depuis le 31/08/2026** (wiki Debian LTS). Monté en Debian 12 puis **Debian 13** (suivi jusqu'en 2030). Script : `infra/vps/montee-debian.sh`.
- **Sécurité** (`infra/vps/securiser.sh`) : mises à jour de sécurité automatiques ; pare-feu (entrées autorisées : 22, 80, 443 seulement) ; connexion SSH par clé uniquement, pas de root, mot de passe refusé à distance. Le mot de passe du compte `debian`, changé par Rémi, reste son accès de secours par la console OVH.
- **Logiciels** (`infra/vps/installer-socle.sh`) : PostgreSQL 17, Caddy (https), Node.js 24 depuis nodejs.org (empreinte vérifiée).
- **Application** (`infra/vps/deployer.sh`) : chaque version dans `/srv/flaix/versions/…`, `/srv/flaix/app` pointe sur la version en service (retour arrière possible). Service `flaix-api` sous un compte système sans shell. Mode serveur, environnement **test** (bandeau permanent).
- **Base de données** : deux rôles (`flaix_owner` pour les migrations, `flaix_app` pour le serveur), mots de passe tirés au hasard sur le serveur, jamais affichés : `/etc/flaix/admin.env` (root seul), `/etc/flaix/flaix.env` (le serveur, qui ne connaît que `flaix_app`).
- **Sauvegarde** : copie complète de la base chaque nuit à 4 h 15 dans `/var/backups/flaix`, 14 jours gardés ; **celle du 1er de chaque mois est gardée sans limite** (décision du 2026-09-30 : tickets conservés sans limite de durée, dossier §15.106). **Copie chiffrée chez OVH** : prête depuis le 2026-09-30, elle démarre dès que tu l'as réglée (section suivante).
- **Administration** : depuis le 2026-10-02, les lieux, leurs directeurs et les mots de passe provisoires se gèrent dans le back-office (/editeur) ; en secours, `sudo flaix-admin creer-lieu`, `sudo flaix-admin nouveau-mot-de-passe`, `sudo flaix-admin creer-editeur` (compte FlaiX Expert du back-office, adresse `/editeur`), `sudo flaix-admin sauvegarde-externe` et `sudo flaix-admin essai-restauration` (`infra/vps/flaix-admin.sh`) posent leurs questions à l'écran ; le mot de passe provisoire ne s'affiche que dans la fenêtre de celui qui lance la commande.
- **Mettre à jour l'application** : archive du dépôt (`git archive`), copie sur le serveur, `sudo deployer-flaix.sh archive.tar.gz` (applique les nouvelles migrations, redémarre le service).

## Copie des sauvegardes chez OVH (à faire par toi, environ 15 minutes)

Pourquoi : aujourd'hui les sauvegardes restent sur le serveur. S'il est perdu, elles le sont avec lui. Chaque nuit, une copie **chiffrée** partira dans un stockage OVH séparé : copie quotidienne gardée 30 jours, celle du 1er de chaque mois gardée sans limite (dossier §15.108).

**1. Créer le stockage (espace client OVHcloud, toi seul : compte et paiement)**
1. **Public Cloud** : si tu n'as pas encore de projet Public Cloud, crée-le (OVH demande un moyen de paiement ; facturation à l'usage).
2. Dans le projet : **Object Storage** → **Créer un conteneur d'objets**.
3. Offre **Standard (API S3)**, déploiement **1-AZ**, région **en France** : de préférence **une autre ville que le serveur** (Gravelines ou Strasbourg ; si tu ne sais plus où est le VPS, l'une ou l'autre convient).
4. Nom du conteneur : par exemple `flaix-sauvegardes`. Laisse-le **privé**.
5. OVH te demande de lier un **utilisateur S3** : crée-en un nouveau, avec les droits **lecture et écriture**. OVH affiche sa **clé d'accès** et sa **clé secrète** : garde la page ouverte. **Ne me les envoie pas.**
6. Sur la page du conteneur, OVH affiche son adresse, du type `https://s3.gra.io.cloud.ovh.net` : le mot entre `s3.` et `.io` est la **région** (ici `gra`).

Coût : les sauvegardes font aujourd'hui 0,3 Mo chacune ; le prix exact est affiché par OVH à la création (quelques centimes par mois à ce volume).

**2. Le régler sur le serveur (dans ton terminal)**
1. Se connecter au serveur : `ssh -i ~/.ssh/flaix_ovh debian@146.59.154.196`
2. Lancer : `sudo flaix-admin sauvegarde-externe` ; répondre aux 4 questions (région, nom du conteneur, clé d'accès, clé secrète — cette dernière ne s'affiche pas quand tu la tapes ou la colles).
3. Le serveur vérifie l'accès, puis affiche **une seule fois** la **clé de restauration** (`AGE-SECRET-KEY-…`). **Garde-la à deux endroits** : ton gestionnaire de mots de passe **et** une clé USB rangée. Elle n'est nulle part sur le serveur : **sans elle, les copies chez OVH sont illisibles**, y compris pour toi.
4. Une première copie part aussitôt : la dernière ligne indique « copie chiffrée envoyée chez OVH ».

**3. Vérifier qu'on sait restaurer (à refaire une fois par trimestre)**
- `sudo flaix-admin essai-restauration` : télécharge la dernière copie, te demande la clé de restauration (elle ne s'affiche pas), restaure dans une base temporaire, compare avec la base en service, puis supprime la base temporaire. Rien n'est modifié dans la base en service.

## Assistant IA : brancher Mistral (à faire par toi, environ 10 minutes)

Pourquoi : l'assistant « pose ta question » et le brief de fin de soirée reformulé utilisent Mistral (décision du 2026-10-04, dossier §15.136). Sans clé, tout le reste fonctionne ; le brief part rédigé par les règles.

**1. Créer la clé (toi seul : compte et paiement)**
1. Va sur **console.mistral.ai** et crée un compte au nom de Break Eat App.
2. Choisis l'offre **payante à l'usage** et ajoute le moyen de paiement (facturation à la question ; fixe-toi une limite de dépense mensuelle dans l'espace Mistral).
3. Dans **API Keys**, crée une clé nommée par exemple `flaix-expert-serveur-test`. Mistral l'affiche une fois : garde la page ouverte. **Ne me l'envoie pas.**

**2. La régler sur le serveur (dans ton terminal)**
1. Se connecter au serveur : `ssh -i ~/.ssh/flaix_ovh debian@146.59.154.196`
2. Lancer : `sudo flaix-admin cle-mistral`, puis coller la clé (elle ne s'affiche pas).
3. Le serveur la vérifie auprès de Mistral, l'enregistre et redémarre l'application. Message attendu : « Clé vérifiée et enregistrée ».
4. Pour la retirer : relancer la même commande et valider sans rien coller.

**3. L'activer pour un lieu** : back-office (`/editeur`) → le lieu → option **« Assistant IA »** (désactivée par défaut, parce que chaque question coûte). L'entrée « Assistant » apparaît alors dans le menu du directeur, et le brief de fin de soirée est reformulé par Mistral — seulement si la reformulation ne change aucun chiffre.

## À retenir

- Coût : environ **4,57 € TTC par mois** (à confirmer selon l'engagement choisi).
- Toi : compte OVHcloud, paiement, et plus tard éventuellement le nom de domaine.
- Moi : tout le reste, par la clé SSH de ton ordinateur.
- Aucune vente réelle sur ce serveur : c'est la version de test, pour que le directeur saisisse ses matchs et suive le fonctionnement.
