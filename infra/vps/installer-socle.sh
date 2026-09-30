#!/bin/bash
# Phase 1 de l'installation du VPS de test FlaiX (Debian 13) : logiciels de base. Exécuté en root.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
etape() { echo "=== $(date -Is) $*"; }

etape "PostgreSQL, Caddy, outils"
apt-get update
apt-get -y install postgresql caddy curl ca-certificates xz-utils git openssl rclone age
psql --version
caddy version

etape "Node.js 24 depuis nodejs.org, empreinte vérifiée"
VERSION="$(curl -fsSL https://nodejs.org/dist/index.json | python3 -c 'import json,sys; print(next(v["version"] for v in json.load(sys.stdin) if v["version"].startswith("v24.")))')"
ARCHIVE="node-$VERSION-linux-x64.tar.xz"
cd /tmp
curl -fsSLO "https://nodejs.org/dist/$VERSION/$ARCHIVE"
curl -fsSLO "https://nodejs.org/dist/$VERSION/SHASUMS256.txt"
grep " $ARCHIVE\$" SHASUMS256.txt | sha256sum -c -
rm -rf /opt/node && mkdir -p /opt/node
tar -xJf "$ARCHIVE" -C /opt/node --strip-components=1
ln -sf /opt/node/bin/node /usr/local/bin/node
ln -sf /opt/node/bin/npm /usr/local/bin/npm
ln -sf /opt/node/bin/npx /usr/local/bin/npx
ln -sf /opt/node/bin/corepack /usr/local/bin/corepack
node --version
rm -f "$ARCHIVE" SHASUMS256.txt

etape "compte système flaix et dossiers"
id flaix >/dev/null 2>&1 || useradd --system --home-dir /srv/flaix --create-home --shell /usr/sbin/nologin flaix
install -d -o root -g flaix -m 750 /etc/flaix
install -d -o flaix -g flaix -m 750 /srv/flaix
install -d -o postgres -g postgres -m 700 /var/backups/flaix
etape "TERMINE"
