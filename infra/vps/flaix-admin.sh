#!/bin/bash
# Outils d'administration de FlaiX Expert sur le serveur de test (exécutés en root).
#   flaix-admin creer-lieu            crée un lieu vide et son directeur (questions posées à l'écran)
#   flaix-admin nouveau-mot-de-passe  donne un mot de passe provisoire à un compte
# Le mot de passe provisoire s'affiche une seule fois, dans cette fenêtre seulement.
set -euo pipefail

outil() {
  systemd-run --quiet --wait --pipe --collect --uid=flaix --gid=flaix \
    -p EnvironmentFile=/etc/flaix/admin.env -p WorkingDirectory=/srv/flaix/app/apps/api \
    --setenv=PATH=/opt/node/bin:/usr/bin:/bin \
    /srv/flaix/app/apps/api/node_modules/.bin/tsx src/outils/cli.ts "$@"
}

case "${1:-}" in
  creer-lieu)
    read -r -p "Nom du lieu (ex. Les Spartiates de Marseille) : " NOM
    read -r -p "Adresse e-mail du directeur : " EMAIL
    read -r -p "Prénom et nom du directeur : " DIRECTEUR
    outil creer-lieu --nom "$NOM" --email "$EMAIL" --directeur "$DIRECTEUR"
    ;;
  nouveau-mot-de-passe)
    read -r -p "Adresse e-mail du compte : " EMAIL
    outil nouveau-mot-de-passe --email "$EMAIL"
    ;;
  *)
    echo "Usage : flaix-admin creer-lieu | nouveau-mot-de-passe"
    exit 1
    ;;
esac
