#!/bin/bash
# Outils d'administration de FlaiX Expert sur le serveur (exécutés en root).
#   flaix-admin creer-lieu            crée un lieu vide et son directeur (questions posées à l'écran)
#   flaix-admin nouveau-mot-de-passe  donne un mot de passe provisoire à un compte
#   flaix-admin sauvegarde-externe    règle la copie chiffrée des sauvegardes chez OVHcloud (dossier §15.108)
#   flaix-admin essai-restauration    restaure la dernière copie OVH dans une base temporaire et la compare
# Mots de passe, clés et codes s'affichent une seule fois, dans cette fenêtre seulement.
set -euo pipefail

ENV_EXTERNE=/etc/flaix/sauvegarde-externe.env
CLE_PUBLIQUE=/etc/flaix/sauvegarde.age.pub

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

  sauvegarde-externe)
    echo "Copie chiffrée des sauvegardes vers le stockage objet OVHcloud (S3)."
    echo "Les informations se trouvent dans ton espace OVHcloud : Public Cloud > Object Storage."
    echo
    read -r -p "Région du stockage (ex. gra pour Gravelines, sbg pour Strasbourg) : " REGION
    read -r -p "Nom du conteneur : " CONTENEUR
    read -r -p "Clé d'accès S3 (access key) : " CLE
    read -r -s -p "Clé secrète S3 (secret key, elle ne s'affiche pas) : " SECRET
    echo
    REGION="$(echo "$REGION" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
    [[ "$REGION" =~ ^[a-z0-9-]+$ && -n "$CONTENEUR" && -n "$CLE" && -n "$SECRET" ]] || { echo "Information manquante ou invalide : rien n'est enregistré."; exit 1; }
    umask 077
    cat > "$ENV_EXTERNE" <<ENV
RCLONE_CONFIG_OVH_TYPE=s3
RCLONE_CONFIG_OVH_PROVIDER=Other
RCLONE_CONFIG_OVH_ENDPOINT=https://s3.${REGION}.io.cloud.ovh.net
RCLONE_CONFIG_OVH_REGION=${REGION}
RCLONE_CONFIG_OVH_ACCESS_KEY_ID=${CLE}
RCLONE_CONFIG_OVH_SECRET_ACCESS_KEY=${SECRET}
RCLONE_CONFIG_OVH_NO_CHECK_BUCKET=true
RCLONE_LOG_LEVEL=ERROR
FLAIX_S3_CONTENEUR=${CONTENEUR}
ENV
    unset SECRET
    chown root:root "$ENV_EXTERNE" && chmod 600 "$ENV_EXTERNE"
    set -a; . "$ENV_EXTERNE"; set +a; export RCLONE_LOG_LEVEL=ERROR
    echo "Vérification de l'accès au conteneur…"
    if ! echo "essai d'accès FlaiX" | rclone rcat "ovh:${CONTENEUR}/essai-acces.txt" 2>/dev/null || ! rclone deletefile "ovh:${CONTENEUR}/essai-acces.txt" 2>/dev/null; then
      rm -f "$ENV_EXTERNE"
      echo "Accès refusé : vérifie la région, le nom du conteneur et les deux clés, puis recommence."
      exit 1
    fi
    echo "Accès vérifié."
    # La clé de chiffrement n'est créée qu'une fois : la changer rendrait les copies déjà envoyées illisibles.
    if [ ! -f "$CLE_PUBLIQUE" ]; then
      PRIVEE="$(age-keygen 2>/dev/null)"
      printf '%s\n' "$PRIVEE" | age-keygen -y > "$CLE_PUBLIQUE"
      chmod 644 "$CLE_PUBLIQUE"
      echo
      echo "=================== CLÉ DE RESTAURATION — AFFICHÉE UNE SEULE FOIS ==================="
      printf '%s\n' "$PRIVEE" | grep '^AGE-SECRET-KEY-'
      echo "======================================================================================"
      echo "Garde-la dans DEUX endroits sûrs (gestionnaire de mots de passe + clé USB)."
      echo "Elle n'est enregistrée nulle part sur ce serveur. Sans elle, les copies chez OVH sont illisibles."
      unset PRIVEE
    else
      echo "La clé de chiffrement existante est conservée (celle qui t'a été remise la première fois)."
    fi
    echo
    echo "Envoi d'une première copie chiffrée…"
    systemctl start sauvegarde-flaix.service && journalctl -u sauvegarde-flaix.service -n 3 --no-pager -o cat
    ;;

  essai-restauration)
    [ -f "$ENV_EXTERNE" ] || { echo "La copie chez OVH n'est pas encore réglée : lance d'abord « flaix-admin sauvegarde-externe »."; exit 1; }
    set -a; . "$ENV_EXTERNE"; set +a; export RCLONE_LOG_LEVEL=ERROR
    DERNIER="$(rclone lsf "ovh:${FLAIX_S3_CONTENEUR}/quotidien" | sort | tail -1)"
    [ -n "$DERNIER" ] || { echo "Aucune copie trouvée chez OVH."; exit 1; }
    echo "Dernière copie chez OVH : $DERNIER"
    TMP="$(mktemp -d)"
    ESSAI=flaix_essai_restauration
    trap 'rm -rf "$TMP"; sudo -u postgres dropdb --if-exists "$ESSAI" >/dev/null 2>&1 || true' EXIT
    rclone copyto "ovh:${FLAIX_S3_CONTENEUR}/quotidien/${DERNIER}" "$TMP/copie.age"
    read -r -s -p "Colle la clé de restauration (AGE-SECRET-KEY-…, elle ne s'affiche pas) : " CLE_PRIVEE
    echo
    printf '%s\n' "$CLE_PRIVEE" > "$TMP/cle" && chmod 600 "$TMP/cle"
    unset CLE_PRIVEE
    if ! age -d -i "$TMP/cle" -o "$TMP/copie.dump" "$TMP/copie.age" 2>/dev/null; then
      echo "Déchiffrement impossible : ce n'est pas la bonne clé de restauration."
      exit 1
    fi
    rm -f "$TMP/cle"
    chmod 755 "$TMP" && chmod 644 "$TMP/copie.dump"
    sudo -u postgres dropdb --if-exists "$ESSAI" >/dev/null 2>&1
    sudo -u postgres createdb "$ESSAI"
    sudo -u postgres pg_restore --no-owner --no-privileges -d "$ESSAI" "$TMP/copie.dump"
    echo
    printf '%-24s %12s %12s\n' "Table" "Copie OVH" "En service"
    for t in lieu utilisateur produit evenement journal_caisse ligne_ticket journal_technique cloture_periode; do
      a="$(sudo -u postgres psql -d "$ESSAI" -tAc "SELECT count(*) FROM $t" 2>/dev/null || echo '-')"
      b="$(sudo -u postgres psql -d flaix -tAc "SELECT count(*) FROM $t" 2>/dev/null || echo '-')"
      printf '%-24s %12s %12s\n' "$t" "$a" "$b"
    done
    echo
    echo "Restauration réussie : la copie chez OVH se relit entièrement. (Des écarts sont normaux si des ventes ont eu lieu depuis la copie.)"
    echo "La base temporaire va être supprimée."
    ;;

  *)
    echo "Usage : flaix-admin creer-lieu | nouveau-mot-de-passe | sauvegarde-externe | essai-restauration"
    exit 1
    ;;
esac
