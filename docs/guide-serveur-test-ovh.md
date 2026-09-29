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

## À retenir

- Coût : environ **4,57 € TTC par mois** (à confirmer selon l'engagement choisi).
- Toi : compte OVHcloud, paiement, et plus tard éventuellement le nom de domaine.
- Moi : tout le reste, par la clé SSH de ton ordinateur.
- Aucune vente réelle sur ce serveur : c'est la version de test, pour que le directeur saisisse ses matchs et suive le fonctionnement.
