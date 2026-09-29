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

- **Tu as un nom de domaine** (par exemple celui de Break Eat) : on crée un sous-domaine, par exemple `test-flaix.<ton-domaine>`, qui pointe vers l'adresse IP du serveur. Je te dirai exactement quoi saisir chez ton registraire (là où le domaine est acheté).
- **Tu n'en as pas, ou tu préfères attendre** : j'utilise une adresse provisoire gratuite construite à partir de l'adresse IP (service public sslip.io), avec un certificat https gratuit (Let's Encrypt). Parfait pour un test, moins joli à montrer.

## Étape 4 — Ce que je fais ensuite, depuis ton ordinateur

1. **Sécuriser le serveur** : mises à jour, pare-feu (seuls le web et la connexion par clé restent ouverts), connexion par mot de passe désactivée.
2. **Installer** Node.js, PostgreSQL 17 et un serveur web qui gère le https automatiquement (Caddy).
3. **Déployer FlaiX Expert en mode « test »** : le bandeau « VERSION DE TEST » s'affiche en haut de chaque écran.
4. **Créer le lieu vide** (Les Spartiates de Marseille) et le compte du directeur. Le mot de passe provisoire s'affiche une seule fois, **pour toi** : tu le transmets toi-même au directeur, qui le change à la première connexion.
5. **Mettre en place une sauvegarde quotidienne de la base de données**, en plus de la sauvegarde d'OVHcloud.
6. Te donner l'adresse du site et vérifier avec toi que tout fonctionne.

## Ce qui a été fait le 2026-09-29 (serveur en service)

- **Serveur** : `vps-1fbd80b9.vps.ovh.net`, adresse IPv4 146.59.154.196. **Adresse du site : https://146-59-154-196.sslip.io** (adresse provisoire gratuite construite sur l'IP, certificat https Let's Encrypt renouvelé automatiquement ; à remplacer par un sous-domaine de Break Eat quand il y en aura un).
- **Système** : OVH avait installé Debian 11, **sans correctifs de sécurité depuis le 31/08/2026** (wiki Debian LTS). Monté en Debian 12 puis **Debian 13** (suivi jusqu'en 2030). Script : `infra/vps/montee-debian.sh`.
- **Sécurité** (`infra/vps/securiser.sh`) : mises à jour de sécurité automatiques ; pare-feu (entrées autorisées : 22, 80, 443 seulement) ; connexion SSH par clé uniquement, pas de root, mot de passe refusé à distance. Le mot de passe du compte `debian`, changé par Rémi, reste son accès de secours par la console OVH.
- **Logiciels** (`infra/vps/installer-socle.sh`) : PostgreSQL 17, Caddy (https), Node.js 24 depuis nodejs.org (empreinte vérifiée).
- **Application** (`infra/vps/deployer.sh`) : chaque version dans `/srv/flaix/versions/…`, `/srv/flaix/app` pointe sur la version en service (retour arrière possible). Service `flaix-api` sous un compte système sans shell. Mode serveur, environnement **test** (bandeau permanent).
- **Base de données** : deux rôles (`flaix_owner` pour les migrations, `flaix_app` pour le serveur), mots de passe tirés au hasard sur le serveur, jamais affichés : `/etc/flaix/admin.env` (root seul), `/etc/flaix/flaix.env` (le serveur, qui ne connaît que `flaix_app`).
- **Sauvegarde** : copie complète de la base chaque nuit à 4 h 15 dans `/var/backups/flaix`, 14 jours gardés. **À compléter** : une copie hors du serveur, et un essai de restauration.
- **Administration** : `sudo flaix-admin creer-lieu` et `sudo flaix-admin nouveau-mot-de-passe` (`infra/vps/flaix-admin.sh`) posent leurs questions à l'écran ; le mot de passe provisoire ne s'affiche que dans la fenêtre de celui qui lance la commande.
- **Mettre à jour l'application** : archive du dépôt (`git archive`), copie sur le serveur, `sudo deployer-flaix.sh archive.tar.gz` (applique les nouvelles migrations, redémarre le service).

## À retenir

- Coût : environ **4,57 € TTC par mois** (à confirmer selon l'engagement choisi).
- Toi : compte OVHcloud, paiement, et plus tard éventuellement le nom de domaine.
- Moi : tout le reste, par la clé SSH de ton ordinateur.
- Aucune vente réelle sur ce serveur : c'est la version de test, pour que le directeur saisisse ses matchs et suive le fonctionnement.
