#!/bin/bash
# Montée de version Debian sur le VPS de test FlaiX (vide) : de la version installée vers $1.
# Garde les fichiers de configuration existants (accès SSH inchangé). Journal : /var/log/montee-debian.log
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
CIBLE="$1"
OPTS=(-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)
etape() { echo "=== $(date -Is) $*"; }

ACTUELLE="$(. /etc/os-release && echo "$VERSION_CODENAME")"
etape "version actuelle : $ACTUELLE ; cible : $CIBLE"
# Mise à jour préalable : utile mais facultative (les dépôts d'une version en fin de vie peuvent être incomplets).
if ! { apt-get update && apt-get "${OPTS[@]}" upgrade && apt-get "${OPTS[@]}" full-upgrade; }; then
  etape "mise à jour préalable de $ACTUELLE impossible (dépôts incomplets) : on passe directement à $CIBLE"
fi

etape "sources : $ACTUELLE -> $CIBLE"
cp /etc/apt/sources.list "/etc/apt/sources.list.avant-$CIBLE"
sed -i "s/\b$ACTUELLE\b/$CIBLE/g" /etc/apt/sources.list
cat /etc/apt/sources.list
apt-get update
apt-get "${OPTS[@]}" upgrade --without-new-pkgs
apt-get "${OPTS[@]}" full-upgrade
apt-get -y autoremove
etape "TERMINE vers $CIBLE — redémarrage nécessaire"
