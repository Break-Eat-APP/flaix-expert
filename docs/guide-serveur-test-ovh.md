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

## Assistant IA : brancher l'IA d'OVHcloud (à faire par toi, environ 5 minutes)

Pourquoi : l'assistant « pose ta question » et le brief de fin de soirée reformulé ont besoin d'un modèle de langage. Décision du 2026-10-05 (dossier §15.145) : **OVHcloud AI Endpoints**, avec ton compte OVH existant, hébergé en Europe. L'agent (ce que l'IA peut lire, les consignes, le contrôle des chiffres, la trace) reste celui de FlaiX Expert. Sans jeton, tout le reste fonctionne ; le brief part rédigé par les règles.

**1. Créer la clé d'API (toi seul : compte et paiement)**
1. Connecte-toi à ton **espace client OVHcloud** (le même compte que le serveur).
2. Va dans **Public Cloud** (choisis le projet du serveur s'il y en a plusieurs) → **AI & Machine Learning** → **AI Endpoints** → **API keys** → **Create a new API key**.
3. Nomme-la par exemple `flaix-expert-serveur-test`. OVHcloud l'affiche une fois : garde la page ouverte. **Ne me l'envoie pas.**
4. Le projet Public Cloud doit avoir un **moyen de paiement** (sans lui, la clé ne fonctionne pas) ; le paiement se fait à l'usage, sur ta facture OVHcloud.

**2. La régler sur le serveur (dans PowerShell, une seule ligne)**
1. Lancer : `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin cle-ovh-ia` (la commande s'exécute sur le serveur : `sudo` n'a pas à exister sur ton ordinateur).
2. Coller la clé (clic droit) : elle ne s'affiche pas ; Entrée.
3. Le serveur vérifie qu'OVHcloud répond et accepte les outils de l'assistant, l'enregistre et redémarre l'application. Message attendu : « Clé vérifiée et enregistrée ».
4. Pour le retirer : relancer la même commande et valider sans rien coller.

**Mistral, en option seulement** : si un jour tu veux un modèle plus puissant, `sudo flaix-admin cle-mistral` règle une clé Mistral (compte sur console.mistral.ai, **offre payante « Scale » obligatoire** : avec l'offre gratuite « Experiment », Mistral peut entraîner ses modèles avec les données envoyées). Mistral est alors essayé d'abord, et OVHcloud prend le relais s'il ne répond pas.

**3. L'activer pour un lieu** : back-office (`/editeur`) → le lieu → option **« Assistant IA »** (désactivée par défaut, parce que chaque question coûte). L'entrée « Assistant » apparaît alors dans le menu du directeur, et le brief de fin de soirée est reformulé par l'IA — seulement si la reformulation ne change aucun chiffre.

## E-mails par Brevo (à faire par toi, environ 5 minutes)

Pourquoi : le rapport de soirée part par e-mail à la clôture de l'événement, et chaque rectification d'un Z est notifiée (dossier §15.146). Sans clé, rien ne part ; tout le reste fonctionne.

**1. Dans Brevo (toi seul)**
1. **app.brevo.com** → ton nom (en haut à droite) → **SMTP & API** → **Clés API** → **Générer une nouvelle clé API**, nommée `flaix-expert` (une clé dédiée : elle se retire sans toucher aux autres logiciels). Garde-la ; **ne me l'envoie pas**.
2. L'adresse d'expédition : une adresse déjà déclarée dans **Expéditeurs, domaines et IP dédiées** → **Expéditeurs** (celle de ton autre logiciel convient, ou une adresse dédiée du même domaine).
3. Seulement si le **blocage des adresses IP inconnues** est actif dans Brevo : autoriser `146.59.154.196`.

**2. Sur le serveur (dans PowerShell, une seule ligne)**
1. `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin cle-brevo`
2. Coller la clé (elle ne s'affiche pas), Entrée ; puis taper l'adresse d'expédition, Entrée.
3. Le serveur vérifie la clé auprès de Brevo, prévient si l'adresse n'est pas dans tes expéditeurs, enregistre et redémarre l'application. Message attendu : « Clé vérifiée et enregistrée ».
4. Essai : FlaiX Expert → **Paramètres** → **Notifications** → carte **E-mails** → **M'envoyer un e-mail d'essai** ; le résultat s'affiche dans les derniers envois.

## Carte abonné : Apple Wallet et Google Wallet (à faire par toi, environ 40 minutes)

Pourquoi : chaque abonné peut ajouter sa carte (n° d'abonné en QR code, points, couleur du lieu) dans son téléphone ; le solde s'y met à jour tout seul (dossier §15.147). Sans ces réglages, le lien de la carte montre déjà la carte à l'écran ; seuls les boutons « Ajouter à… » manquent. **Aucun fichier ni aucune clé ne passe par moi** : tout va de ton PC au serveur.

Dans PowerShell, `$HOME\Downloads` est ton dossier Téléchargements. Les commandes `ssh` et `scp` s'exécutent sur le serveur : `sudo` n'a pas à exister sur ton ordinateur.

**A. Apple (compte Apple Developer)**
1. **developer.apple.com** → **Account** → **Certificates, IDs & Profiles** → **Identifiers** → **+** → **Pass Type IDs** → Continue. Description : `Carte abonné`, identifiant : `pass.com.flaixlabs.abonne` → **Register**.
2. Fabriquer la demande de certificat sur le serveur (la clé secrète y reste) :
   `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin wallet-apple-demande`
3. La rapatrier dans Téléchargements :
   `scp -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196:flaix-wallet.certSigningRequest $HOME\Downloads\`
4. Apple → **Certificates** → **+** → **Pass Type ID Certificate** → Continue → choisis `pass.com.flaixlabs.abonne` → envoie `flaix-wallet.certSigningRequest` → **Download** : le fichier `pass.cer` arrive dans Téléchargements.
5. L'envoyer au serveur, puis l'installer :
   `scp -i C:\Users\notta\.ssh\flaix_ovh $HOME\Downloads\pass.cer debian@146.59.154.196:pass.cer`
   `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin wallet-apple-certificat`
   Message attendu : « Carte Apple Wallet prête », avec ton Team ID (lu dans le certificat) et la date de fin du certificat (un an : même procédure pour le renouveler).

**B. Google (Google Pay & Wallet Console et Google Cloud)**
1. **pay.google.com/business/console** → **Google Wallet API** : si c'est la première fois, accepte les conditions ; note l'**Issuer ID** (une vingtaine de chiffres, en haut de la page).
2. **console.cloud.google.com** → crée un projet `flaix-expert-wallet` → **API et services** → **Bibliothèque** → « Google Wallet API » → **Activer**.
3. **IAM et administration** → **Comptes de service** → **Créer un compte de service** nommé `flaix-wallet` (aucun rôle à donner) → ouvre-le → **Clés** → **Ajouter une clé** → **Créer une clé** → **JSON** : un fichier `.json` arrive dans Téléchargements. **Ne me l'envoie pas.**
4. De retour dans la **Pay & Wallet Console** → **Utilisateurs** → **Inviter un utilisateur** : l'adresse du compte de service (elle finit par `iam.gserviceaccount.com`, visible dans Google Cloud), rôle **Développeur**.
5. L'envoyer au serveur (remplace `NOM` par le nom du fichier téléchargé), puis l'installer :
   `scp -i C:\Users\notta\.ssh\flaix_ovh $HOME\Downloads\NOM.json debian@146.59.154.196:google-wallet.json`
   `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin wallet-google`
   Tape l'Issuer ID. Le serveur vérifie la clé et l'accès auprès de Google, l'enregistre et efface le fichier déposé. Message attendu : « Carte Google Wallet prête ». Si Google refuse l'accès juste après l'invitation, attends quelques minutes et relance. Supprime ensuite le `.json` de tes Téléchargements.
6. Tant que la carte n'est pas publiée chez Google, seuls les **comptes de test** peuvent l'ajouter : Pay & Wallet Console → Google Wallet API → ajoute ton adresse Gmail (et celles des testeurs). Quand l'essai est bon : **Demander l'accès à la publication** (Google relit la carte, quelques jours).

**C. Essai**
1. FlaiX Expert → **Fidélité** → onglet **Carte téléphone** : les deux services doivent apparaître « en service » ; choisis la couleur des cartes.
2. Onglet **Abonnés** → ouvre un abonné → **Créer le lien de sa carte** → **Envoyer par e-mail** (ou copie le lien et ouvre-le sur ton téléphone).
3. Sur iPhone (Safari) : **Ajouter à Apple Wallet**. Sur Android : **Ajouter à Google Wallet**.
4. Ajuste ses points (fiche de l'abonné) : la carte du téléphone change toute seule dans la minute.

Pour retirer un service : `ssh -t -i C:\Users\notta\.ssh\flaix_ovh debian@146.59.154.196 sudo flaix-admin wallet-retirer`.

## À retenir

- Coût : environ **4,57 € TTC par mois** (à confirmer selon l'engagement choisi).
- Toi : compte OVHcloud, paiement, et plus tard éventuellement le nom de domaine.
- Moi : tout le reste, par la clé SSH de ton ordinateur.
- Aucune vente réelle sur ce serveur : c'est la version de test, pour que le directeur saisisse ses matchs et suive le fonctionnement.
