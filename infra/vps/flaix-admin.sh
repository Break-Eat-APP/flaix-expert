#!/bin/bash
# Outils d'administration de FlaiX Expert sur le serveur (exécutés en root).
#   flaix-admin creer-lieu            crée un lieu vide et son directeur (questions posées à l'écran)
#   flaix-admin nouveau-mot-de-passe  donne un mot de passe provisoire à un compte
#   flaix-admin creer-editeur         crée un compte FlaiX Expert pour le back-office (supervision, §15.116)
#   flaix-admin sauvegarde-externe    règle la copie chiffrée des sauvegardes chez OVHcloud (dossier §15.108)
#   flaix-admin essai-restauration    restaure la dernière copie OVH dans une base temporaire et la compare
#   flaix-admin cle-mistral           règle (ou retire) la clé de l'API Mistral de l'assistant IA (dossier §15.136)
#   flaix-admin cle-ovh-ia            règle (ou retire) le jeton OVHcloud AI Endpoints, moteur de l'assistant IA (dossier §15.137, §15.145)
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

  creer-editeur)
    read -r -p "Adresse e-mail du compte FlaiX Expert : " EMAIL
    read -r -p "Prénom et nom : " NOM
    outil creer-editeur --email "$EMAIL" --nom "$NOM"
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

  cle-mistral)
    # Clé de l'API Mistral : assistant et brief reformulé (dossier §15.136). Tapée par Rémi, jamais affichée.
    echo "Clé de l'API Mistral (assistant IA de FlaiX Expert)."
    echo "Elle se crée sur console.mistral.ai : API Keys > Create new key."
    echo
    read -r -s -p "Clé Mistral (elle ne s'affiche pas ; vide = retirer la clé) : " CLE
    echo
    ENV_MISTRAL=/etc/flaix/mistral.env
    if [ -z "$CLE" ]; then
      rm -f "$ENV_MISTRAL"
      systemctl restart flaix-api
      echo "Clé retirée : l'assistant est débranché."
      exit 0
    fi
    [[ "$CLE" =~ ^[A-Za-z0-9_-]{20,200}$ ]] || { unset CLE; echo "Cette clé n'a pas la bonne forme : rien n'est enregistré."; exit 1; }
    echo "Vérification auprès de Mistral…"
    # La clé passe par l'entrée standard de curl : elle n'apparaît jamais dans la liste des processus.
    CODE="$(printf 'Authorization: Bearer %s\n' "$CLE" | curl -s -o /dev/null -w '%{http_code}' -m 20 -H @- https://api.mistral.ai/v1/models || true)"
    if [ "$CODE" != "200" ]; then
      unset CLE
      echo "Mistral refuse cette clé (réponse ${CODE:-aucune}) : vérifie-la, puis recommence. Rien n'est enregistré."
      exit 1
    fi
    umask 027
    printf 'MISTRAL_API_KEY=%s\n' "$CLE" > "$ENV_MISTRAL"
    unset CLE
    chown root:flaix "$ENV_MISTRAL" && chmod 640 "$ENV_MISTRAL"
    systemctl restart flaix-api
    echo "Clé vérifiée et enregistrée. L'assistant est branché ; active l'option « Assistant IA » du lieu dans le back-office."
    ;;

  cle-ovh-ia)
    # Moteur de l'assistant IA : OVHcloud AI Endpoints (dossier §15.137, §15.145) ; secours de Mistral si une clé Mistral est aussi réglée.
    echo "Jeton d'accès OVHcloud AI Endpoints (moteur de l'assistant IA de FlaiX Expert)."
    echo "Il se crée dans l'espace OVHcloud : Public Cloud > AI Endpoints > API keys."
    echo
    read -r -s -p "Jeton OVHcloud AI Endpoints (il ne s'affiche pas ; vide = retirer le jeton) : " JETON
    echo
    ENV_OVH_IA=/etc/flaix/ovh-ia.env
    if [ -z "$JETON" ]; then
      rm -f "$ENV_OVH_IA"
      systemctl restart flaix-api
      echo "Jeton retiré : l'assistant IA est débranché (sauf si une clé Mistral est réglée)."
      exit 0
    fi
    [[ "$JETON" =~ ^[A-Za-z0-9._=-]{20,2000}$ ]] || { unset JETON; echo "Ce jeton n'a pas la bonne forme : rien n'est enregistré."; exit 1; }
    echo "Vérification auprès d'OVHcloud (une question avec un outil, comme l'assistant)…"
    CORPS='{"model":"Mistral-Small-3.2-24B-Instruct-2506","max_tokens":20,"messages":[{"role":"user","content":"Bonjour"}],"tools":[{"type":"function","function":{"name":"essai","description":"Outil d essai","parameters":{"type":"object","properties":{}}}}]}'
    # Le jeton passe par l'entrée standard de curl : il n'apparaît jamais dans la liste des processus.
    CODE="$(printf 'Authorization: Bearer %s\n' "$JETON" | curl -s -o /dev/null -w '%{http_code}' -m 30 -H @- -H 'Content-Type: application/json' -d "$CORPS" https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions || true)"
    if [ "$CODE" != "200" ]; then
      unset JETON
      echo "OVHcloud refuse ce jeton ou les outils (réponse ${CODE:-aucune}) : vérifie-le, puis recommence. Rien n'est enregistré."
      exit 1
    fi
    umask 027
    printf 'OVH_AI_ENDPOINTS_ACCESS_TOKEN=%s\n' "$JETON" > "$ENV_OVH_IA"
    unset JETON
    chown root:flaix "$ENV_OVH_IA" && chmod 640 "$ENV_OVH_IA"
    systemctl restart flaix-api
    echo "Jeton vérifié et enregistré : l'assistant IA passe par OVHcloud."
    ;;

  *)
    echo "Usage : flaix-admin creer-lieu | nouveau-mot-de-passe | creer-editeur | sauvegarde-externe | essai-restauration | cle-mistral | cle-ovh-ia"
    exit 1
    ;;
esac
