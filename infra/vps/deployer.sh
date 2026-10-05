#!/bin/bash
# Déploiement de FlaiX Expert (version test) sur le VPS OVH. Exécuté en root.
# Usage : deployer.sh /chemin/archive.tar.gz
# Les secrets de la base sont créés ici, sur le serveur, et n'en sortent jamais.
set -euo pipefail
etape() { echo "=== $(date -Is) $*"; }
# Adresse du site (sous-domaine FlaiX Expert, 2026-10-02) ; l'ancienne adresse provisoire renvoie vers elle.
ADRESSE="flaixexpert.flaixlabs.com"
ANCIENNE_ADRESSE="146-59-154-196.sslip.io"
ARCHIVE="$1"
VERSION="/srv/flaix/versions/$(date +%Y%m%d-%H%M%S)"
APP=/srv/flaix/app
export PATH=/opt/node/bin:$PATH

etape "code : $VERSION"
install -d -o flaix -g flaix -m 750 /srv/flaix/versions "$VERSION"
tar -xzf "$ARCHIVE" -C "$VERSION"
chown -R flaix:flaix "$VERSION"
chmod -R u+rwX,g+rX,g-w,o-rwx "$VERSION"

etape "dépendances et construction de l'écran (compte flaix)"
corepack enable
sudo -u flaix -H env PATH="$PATH" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1 bash -c "cd '$VERSION' && pnpm install --frozen-lockfile && pnpm --filter @flaix/web build"
chmod -R g+rX,g-w,o-rwx "$VERSION"

etape "base de données"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname = 'flaix_owner'" | grep -q 1; then
  MDP_PROPRIETAIRE="$(openssl rand -hex 24)"
  MDP_APP="$(openssl rand -hex 24)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
CREATE ROLE flaix_owner LOGIN PASSWORD '$MDP_PROPRIETAIRE';
CREATE ROLE flaix_app LOGIN PASSWORD '$MDP_APP';
CREATE DATABASE flaix OWNER flaix_owner;
SQL
  umask 077
  # Administration (migrations, création de lieu) : lisible par root seulement.
  cat > /etc/flaix/admin.env <<ENV
NODE_ENV=production
FLAIX_ENVIRONNEMENT=test
PORT=3001
DATABASE_URL=postgres://flaix_app:$MDP_APP@127.0.0.1:5432/flaix
DATABASE_OWNER_URL=postgres://flaix_owner:$MDP_PROPRIETAIRE@127.0.0.1:5432/flaix
ORIGINES_AUTORISEES=https://$ADRESSE
RELAIS_DE_CONFIANCE=127.0.0.1
DUREE_SESSION_HEURES=12
ENV
  # Serveur de l'application : il ne connaît que le compte restreint flaix_app.
  cat > /etc/flaix/flaix.env <<ENV
NODE_ENV=production
FLAIX_ENVIRONNEMENT=test
PORT=3001
DATABASE_URL=postgres://flaix_app:$MDP_APP@127.0.0.1:5432/flaix
DATABASE_OWNER_URL=postgres://non-utilise-par-le-serveur@127.0.0.1:1/aucune
ORIGINES_AUTORISEES=https://$ADRESSE
RELAIS_DE_CONFIANCE=127.0.0.1
DUREE_SESSION_HEURES=12
ENV
  chown root:root /etc/flaix/admin.env && chmod 600 /etc/flaix/admin.env
  chown root:flaix /etc/flaix/flaix.env && chmod 640 /etc/flaix/flaix.env
  umask 022
  echo "rôles et base créés, secrets écrits dans /etc/flaix (jamais affichés)"
fi

etape "migrations"
# systemd lit lui-même le fichier de secrets (root) et le transmet au compte flaix, sans l'afficher.
systemd-run --quiet --wait --pipe --collect --uid=flaix --gid=flaix \
  -p EnvironmentFile=/etc/flaix/admin.env -p WorkingDirectory="$VERSION/apps/api" \
  --setenv=PATH="$PATH" "$VERSION/apps/api/node_modules/.bin/tsx" src/outils/migrer.ts

etape "mise en service de la nouvelle version"
ln -sfn "$VERSION" "$APP"
cat > /etc/systemd/system/flaix-api.service <<'UNIT'
[Unit]
Description=FlaiX Expert - serveur (version test)
After=network-online.target postgresql.service
Wants=network-online.target postgresql.service

[Service]
User=flaix
Group=flaix
WorkingDirectory=/srv/flaix/app/apps/api
EnvironmentFile=/etc/flaix/flaix.env
# Clé Mistral de l'assistant IA (§15.136), posée par « flaix-admin cle-mistral » ; facultative.
EnvironmentFile=-/etc/flaix/mistral.env
# Secours OVHcloud AI Endpoints (§15.137), posé par « flaix-admin cle-ovh-ia » ; facultatif.
EnvironmentFile=-/etc/flaix/ovh-ia.env
# E-mails par Brevo (§15.146), posés par « flaix-admin cle-brevo » ; facultatif.
EnvironmentFile=-/etc/flaix/brevo.env
Environment=PATH=/opt/node/bin:/usr/bin:/bin
ExecStart=/srv/flaix/app/apps/api/node_modules/.bin/tsx src/index.ts
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable flaix-api
systemctl restart flaix-api

etape "adresse du site : $ADRESSE"
# Les fichiers de configuration sont écrits à la première installation : l'adresse autorisée y est mise à jour à chaque déploiement.
sed -i "s|^ORIGINES_AUTORISEES=.*|ORIGINES_AUTORISEES=https://$ADRESSE|" /etc/flaix/admin.env /etc/flaix/flaix.env
systemctl restart flaix-api

etape "relais https (Caddy)"
usermod -aG flaix caddy
cat > /etc/caddy/Caddyfile <<CADDY
# FlaiX Expert - version test. Certificat https obtenu et renouvelé automatiquement.
$ADRESSE {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "same-origin"
		-Server
	}
	handle /api/* {
		reverse_proxy 127.0.0.1:3001
	}
	handle {
		root * /srv/flaix/app/apps/web/dist
		@fichiers path /assets/*
		header @fichiers Cache-Control "public, max-age=31536000, immutable"
		@frais path / /index.html /sw.js
		header @frais Cache-Control "no-cache"
		try_files {path} /index.html
		file_server
	}
}

# Ancienne adresse provisoire : renvoi définitif vers l'adresse du site.
$ANCIENNE_ADRESSE {
	redir https://$ADRESSE{uri} permanent
}
CADDY
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl restart caddy

etape "sauvegarde quotidienne de la base (14 jours sur le serveur, 1er du mois sans limite ; copie chiffrée chez OVH si réglée)"
command -v rclone >/dev/null && command -v age >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get -y install rclone age
install -m 750 -o root -g root "$VERSION/infra/vps/flaix-admin.sh" /usr/local/sbin/flaix-admin
cat > /usr/local/sbin/sauvegarde-flaix.sh <<'SAUVE'
#!/bin/bash
set -euo pipefail
fichier="/var/backups/flaix/flaix-$(date +%Y%m%d-%H%M).dump"
sudo -u postgres pg_dump -Fc flaix > "$fichier"
chmod 600 "$fichier"
# Tickets conservés sans limite (dossier §15.106) : la sauvegarde du 1er de chaque mois n'est jamais effacée.
find /var/backups/flaix -name 'flaix-*.dump' ! -name 'flaix-??????01-*.dump' -mtime +14 -delete
# Copie chiffrée hors du serveur, chez OVHcloud (dossier §15.108), une fois réglée par « flaix-admin sauvegarde-externe ».
# La clé publique chiffre ; la clé de restauration n'est jamais sur ce serveur.
if [ -f /etc/flaix/sauvegarde-externe.env ] && [ -f /etc/flaix/sauvegarde.age.pub ]; then
  set -a; . /etc/flaix/sauvegarde-externe.env; set +a
  chiffre="$(mktemp /var/backups/flaix/envoi-XXXXXX)"
  trap 'rm -f "$chiffre"' EXIT
  age -R /etc/flaix/sauvegarde.age.pub -o "$chiffre" "$fichier"
  nom="$(basename "$fichier").age"
  rclone copyto "$chiffre" "ovh:${FLAIX_S3_CONTENEUR}/quotidien/${nom}"
  # Copie du 1er du mois gardée sans limite ; copies quotidiennes gardées 30 jours.
  if [ "$(date +%d)" = "01" ]; then rclone copyto "$chiffre" "ovh:${FLAIX_S3_CONTENEUR}/mensuel/${nom}"; fi
  rclone delete "ovh:${FLAIX_S3_CONTENEUR}/quotidien" --min-age 30d
  echo "copie chiffrée envoyée chez OVH : ${nom}"
fi
SAUVE
chmod 750 /usr/local/sbin/sauvegarde-flaix.sh
cat > /etc/systemd/system/sauvegarde-flaix.service <<'UNIT'
[Unit]
Description=Sauvegarde de la base FlaiX Expert
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/sauvegarde-flaix.sh
UNIT
cat > /etc/systemd/system/sauvegarde-flaix.timer <<'UNIT'
[Unit]
Description=Sauvegarde quotidienne de la base FlaiX Expert
[Timer]
OnCalendar=*-*-* 04:15:00
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now sauvegarde-flaix.timer
systemctl start sauvegarde-flaix.service
ls -la /var/backups/flaix | tail -2

etape "TERMINE"
