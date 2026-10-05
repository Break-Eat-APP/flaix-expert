#!/bin/bash
# Outils d'administration de FlaiX Expert sur le serveur (exécutés en root).
#   flaix-admin creer-lieu            crée un lieu vide et son directeur (questions posées à l'écran)
#   flaix-admin nouveau-mot-de-passe  donne un mot de passe provisoire à un compte
#   flaix-admin creer-editeur         crée un compte FlaiX Expert pour le back-office (supervision, §15.116)
#   flaix-admin sauvegarde-externe    règle la copie chiffrée des sauvegardes chez OVHcloud (dossier §15.108)
#   flaix-admin essai-restauration    restaure la dernière copie OVH dans une base temporaire et la compare
#   flaix-admin cle-mistral           règle (ou retire) la clé de l'API Mistral de l'assistant IA (dossier §15.136)
#   flaix-admin cle-ovh-ia            règle (ou retire) le jeton OVHcloud AI Endpoints, moteur de l'assistant IA (dossier §15.137, §15.145)
#   flaix-admin cle-brevo             règle (ou retire) la clé Brevo et l'adresse d'expédition des e-mails (dossier §15.146)
#   flaix-admin wallet-apple-demande     carte Apple Wallet, étape 1 : clé (reste sur le serveur) et demande de certificat (§15.147)
#   flaix-admin wallet-apple-certificat  carte Apple Wallet, étape 2 : installe le certificat pass.cer d'Apple
#   flaix-admin wallet-google         carte Google Wallet : clé du compte de service et Issuer ID
#   flaix-admin wallet-retirer        retire la carte Apple ou Google
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
    echo "Clé d'API OVHcloud AI Endpoints (« API key »), moteur de l'assistant IA de FlaiX Expert."
    echo "Elle se crée dans l'espace OVHcloud : Public Cloud > AI & Machine Learning > AI Endpoints > API keys."
    echo
    read -r -s -p "Clé d'API OVHcloud AI Endpoints (elle ne s'affiche pas ; vide = retirer la clé) : " JETON
    echo
    ENV_OVH_IA=/etc/flaix/ovh-ia.env
    if [ -z "$JETON" ]; then
      rm -f "$ENV_OVH_IA"
      systemctl restart flaix-api
      echo "Clé retirée : l'assistant IA est débranché (sauf si une clé Mistral est réglée)."
      exit 0
    fi
    [[ "$JETON" =~ ^[A-Za-z0-9._=+/-]{20,4000}$ ]] || { unset JETON; echo "Cette clé n'a pas la bonne forme (espace ou caractère inattendu ?) : rien n'est enregistré."; exit 1; }
    echo "Vérification auprès d'OVHcloud (une question avec un outil, comme l'assistant)…"
    CORPS='{"model":"Mistral-Small-3.2-24B-Instruct-2506","max_tokens":20,"messages":[{"role":"user","content":"Bonjour"}],"tools":[{"type":"function","function":{"name":"essai","description":"Outil d essai","parameters":{"type":"object","properties":{}}}}]}'
    # Le jeton passe par l'entrée standard de curl : il n'apparaît jamais dans la liste des processus.
    CODE="$(printf 'Authorization: Bearer %s\n' "$JETON" | curl -s -o /dev/null -w '%{http_code}' -m 30 -H @- -H 'Content-Type: application/json' -d "$CORPS" https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions || true)"
    if [ "$CODE" != "200" ]; then
      unset JETON
      echo "OVHcloud refuse cette clé ou les outils (réponse ${CODE:-aucune}) : vérifie-la, et qu'un moyen de paiement est réglé sur le projet Public Cloud, puis recommence. Rien n'est enregistré."
      exit 1
    fi
    umask 027
    printf 'OVH_AI_ENDPOINTS_ACCESS_TOKEN=%s\n' "$JETON" > "$ENV_OVH_IA"
    unset JETON
    chown root:flaix "$ENV_OVH_IA" && chmod 640 "$ENV_OVH_IA"
    systemctl restart flaix-api
    echo "Clé vérifiée et enregistrée : l'assistant IA passe par OVHcloud."
    ;;

  cle-brevo)
    # E-mails de FlaiX Expert par Brevo (dossier §15.146) : clé d'API tapée par Rémi, jamais affichée ; adresse d'expédition en clair.
    echo "Clé d'API Brevo (e-mails de FlaiX Expert : rapport de soirée, rectifications)."
    echo "Elle se crée dans Brevo : ton nom (en haut à droite) > SMTP & API > Clés API > Générer une nouvelle clé API."
    echo
    read -r -s -p "Clé d'API Brevo (elle ne s'affiche pas ; vide = retirer la clé) : " CLE
    echo
    ENV_BREVO=/etc/flaix/brevo.env
    if [ -z "$CLE" ]; then
      rm -f "$ENV_BREVO"
      systemctl restart flaix-api
      echo "Clé retirée : plus aucun e-mail ne part."
      exit 0
    fi
    [[ "$CLE" =~ ^[A-Za-z0-9_-]{20,300}$ ]] || { unset CLE; echo "Cette clé n'a pas la bonne forme (espace ou caractère inattendu ?) : rien n'est enregistré."; exit 1; }
    if [[ "$CLE" == xsmtpsib-* ]]; then
      unset CLE
      echo "C'est une clé SMTP (elle commence par « xsmtpsib- »), pas une clé d'API : dans Brevo > SMTP & API, prends l'onglet « Clés API » (la clé commence par « xkeysib- »). Rien n'est enregistré."
      exit 1
    fi
    read -r -p "Adresse d'expédition (déclarée dans Brevo, par exemple no-reply@ton-domaine) : " EXPEDITEUR
    EXPEDITEUR="$(printf '%s' "$EXPEDITEUR" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
    [[ "$EXPEDITEUR" =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$ ]] || { unset CLE; echo "Cette adresse n'a pas la bonne forme : rien n'est enregistré."; exit 1; }
    echo "Vérification auprès de Brevo…"
    # La clé passe par l'entrée standard de curl : elle n'apparaît jamais dans la liste des processus.
    REPONSE="$(mktemp)"
    CODE="$(printf 'api-key: %s\n' "$CLE" | curl -s -o "$REPONSE" -w '%{http_code}' -m 20 -H @- -H 'accept: application/json' https://api.brevo.com/v3/account || true)"
    if [ "$CODE" != "200" ]; then
      unset CLE
      # Le message de Brevo explique le refus (clé inconnue, adresse IP non reconnue…) ; il ne contient jamais la clé.
      MESSAGE="$(sed -n 's/.*"message":"\([^"]*\)".*/\1/p' "$REPONSE" | head -c 400)"
      rm -f "$REPONSE"
      echo "Brevo refuse cette clé (réponse ${CODE:-aucune}). Explication de Brevo : ${MESSAGE:-aucune}"
      echo "Causes fréquentes : clé SMTP au lieu de la clé d'API ; clé mal copiée ; adresse IP du serveur (146.59.154.196) bloquée dans Brevo > Sécurité > IP autorisées. Rien n'est enregistré."
      exit 1
    fi
    rm -f "$REPONSE"
    EXPEDITEURS="$(printf 'api-key: %s\n' "$CLE" | curl -s -m 20 -H @- -H 'accept: application/json' https://api.brevo.com/v3/senders || true)"
    if ! printf '%s' "$EXPEDITEURS" | tr '[:upper:]' '[:lower:]' | grep -q "\"email\":\"$EXPEDITEUR\""; then
      echo "Attention : « $EXPEDITEUR » n'apparaît pas dans les expéditeurs de ton compte Brevo. Si les e-mails ne partent pas, ajoute-le dans Brevo (Expéditeurs, domaines et IP dédiées)."
    fi
    umask 027
    printf 'BREVO_API_KEY=%s\nBREVO_EXPEDITEUR=%s\n' "$CLE" "$EXPEDITEUR" > "$ENV_BREVO"
    unset CLE
    chown root:flaix "$ENV_BREVO" && chmod 640 "$ENV_BREVO"
    systemctl restart flaix-api
    echo "Clé vérifiée et enregistrée. Expéditeur : FlaiX Expert <$EXPEDITEUR>."
    echo "Pour essayer : Paramètres > Notifications > E-mails > « Envoyer un e-mail d'essai »."
    ;;

  wallet-apple-demande)
    # Carte Apple Wallet (§15.147), étape 1 : la clé privée est fabriquée ici et ne quitte jamais le serveur ;
    # seule la « demande de certificat » (.certSigningRequest), sans rien de secret, part chez Apple.
    DOSSIER=/etc/flaix/wallet
    install -d -m 750 -o root -g flaix "$DOSSIER"
    if [ -f "$DOSSIER/apple-pass.key" ]; then
      echo "La clé de la carte Apple existe déjà sur ce serveur : la demande est refaite avec la même clé."
    else
      (umask 027 && openssl genrsa -out "$DOSSIER/apple-pass.key" 2048 2>/dev/null)
      chown root:flaix "$DOSSIER/apple-pass.key" && chmod 640 "$DOSSIER/apple-pass.key"
    fi
    DEMANDE=/home/debian/flaix-wallet.certSigningRequest
    openssl req -new -key "$DOSSIER/apple-pass.key" -subj "/CN=FlaiX Expert Wallet/O=Break Eat App/C=FR" -out "$DEMANDE"
    chown debian:debian "$DEMANDE"
    echo "Demande de certificat prête sur le serveur : $DEMANDE"
    echo
    echo "1. Sur ton PC, dans un terminal, récupère-la :"
    echo "   scp -i C:\\Users\\notta\\.ssh\\flaix_ovh debian@146.59.154.196:flaix-wallet.certSigningRequest ."
    echo "2. developer.apple.com > Certificates, IDs & Profiles > Certificates > « + » > Pass Type ID Certificate,"
    echo "   choisis ton Pass Type ID (pass.com.flaixlabs.abonne), envoie le fichier .certSigningRequest, télécharge pass.cer."
    echo "3. Renvoie pass.cer sur le serveur (depuis le dossier où il est téléchargé) :"
    echo "   scp -i C:\\Users\\notta\\.ssh\\flaix_ovh pass.cer debian@146.59.154.196:pass.cer"
    echo "4. Puis : sudo flaix-admin wallet-apple-certificat"
    ;;

  wallet-apple-certificat)
    # Carte Apple Wallet (§15.147), étape 2 : le certificat d'Apple est contrôlé (même clé que la demande, encore
    # valable, signé par l'intermédiaire d'Apple), puis installé ; Team ID et Pass Type ID sont lus dans le certificat.
    DOSSIER=/etc/flaix/wallet
    CER=/home/debian/pass.cer
    [ -f "$DOSSIER/apple-pass.key" ] || { echo "Aucune demande faite sur ce serveur : lance d'abord « sudo flaix-admin wallet-apple-demande »."; exit 1; }
    [ -f "$CER" ] || { echo "Fichier $CER introuvable : renvoie d'abord le certificat téléchargé chez Apple (voir « sudo flaix-admin wallet-apple-demande »)."; exit 1; }
    TMP="$(mktemp -d)"
    trap 'rm -rf "$TMP"' EXIT
    openssl x509 -inform DER -in "$CER" -out "$TMP/pass.pem" 2>/dev/null || openssl x509 -in "$CER" -out "$TMP/pass.pem" 2>/dev/null || { echo "Ce fichier n'est pas un certificat lisible : retélécharge pass.cer chez Apple."; exit 1; }
    if [ "$(openssl x509 -in "$TMP/pass.pem" -noout -pubkey | openssl sha256)" != "$(openssl pkey -in "$DOSSIER/apple-pass.key" -pubout | openssl sha256)" ]; then
      echo "Ce certificat ne correspond pas à la demande faite sur ce serveur : refais « sudo flaix-admin wallet-apple-demande » et utilise ce fichier-là chez Apple. Rien n'est installé."
      exit 1
    fi
    openssl x509 -in "$TMP/pass.pem" -noout -checkend 0 >/dev/null || { echo "Ce certificat est expiré : crée-en un nouveau chez Apple. Rien n'est installé."; exit 1; }
    SUJET="$(openssl x509 -in "$TMP/pass.pem" -noout -subject -nameopt RFC2253)"
    PASS_TYPE="$(printf '%s' "$SUJET" | sed -n 's/.*UID=\(pass\.[A-Za-z0-9.-]*\).*/\1/p')"
    TEAM="$(printf '%s' "$SUJET" | sed -n 's/.*OU=\([A-Z0-9]\{10\}\).*/\1/p')"
    if [ -z "$PASS_TYPE" ] || [ -z "$TEAM" ]; then echo "Ce n'est pas un certificat « Pass Type ID » d'Apple ($SUJET). Rien n'est installé."; exit 1; fi
    INTERMEDIAIRE=""
    for G in G4 G3; do
      curl -sf -m 20 -o "$TMP/wwdr.cer" "https://www.apple.com/certificateauthority/AppleWWDRCA$G.cer" || continue
      openssl x509 -inform DER -in "$TMP/wwdr.cer" -out "$TMP/wwdr.pem" 2>/dev/null || continue
      if openssl verify -partial_chain -CAfile "$TMP/wwdr.pem" "$TMP/pass.pem" >/dev/null 2>&1; then INTERMEDIAIRE=$G; break; fi
    done
    [ -n "$INTERMEDIAIRE" ] || { echo "Impossible de vérifier le certificat avec l'intermédiaire d'Apple (WWDR G4) : réessaie dans quelques minutes. Rien n'est installé."; exit 1; }
    install -m 640 -o root -g flaix "$TMP/pass.pem" "$DOSSIER/apple-pass.pem"
    install -m 640 -o root -g flaix "$TMP/wwdr.pem" "$DOSSIER/apple-wwdr.pem"
    ENV_APPLE=/etc/flaix/wallet-apple.env
    (umask 027 && printf 'WALLET_APPLE_TEAM_ID=%s\nWALLET_APPLE_PASS_TYPE_ID=%s\n' "$TEAM" "$PASS_TYPE" > "$ENV_APPLE")
    chown root:flaix "$ENV_APPLE" && chmod 640 "$ENV_APPLE"
    systemctl restart flaix-api
    FIN_VALIDITE="$(openssl x509 -in "$TMP/pass.pem" -noout -enddate | cut -d= -f2)"
    echo "Carte Apple Wallet prête : Team ID $TEAM, Pass Type ID $PASS_TYPE (intermédiaire Apple WWDR $INTERMEDIAIRE)."
    echo "Certificat valable jusqu'au $FIN_VALIDITE : à renouveler avant (même procédure)."
    ;;

  wallet-google)
    # Carte Google Wallet (§15.147) : clé du compte de service Google (fichier JSON envoyé par Rémi, jamais affiché),
    # Issuer ID ; vérifiés auprès de Google (la clé est acceptée et le compte de service a accès à l'émetteur).
    DOSSIER=/etc/flaix/wallet
    JSON=/home/debian/google-wallet.json
    [ -f "$JSON" ] || { echo "Fichier $JSON introuvable. Depuis ton PC : scp -i C:\\Users\\notta\\.ssh\\flaix_ovh <fichier téléchargé>.json debian@146.59.154.196:google-wallet.json"; exit 1; }
    read -r -p "Issuer ID (Google Pay & Wallet Console, en haut de la page Google Wallet API) : " ISSUER
    ISSUER="$(printf '%s' "$ISSUER" | tr -d '[:space:]')"
    [[ "$ISSUER" =~ ^[0-9]{10,25}$ ]] || { echo "L'Issuer ID est un nombre (une vingtaine de chiffres) : rien n'est enregistré."; exit 1; }
    echo "Vérification auprès de Google…"
    # Petit programme Node (déjà installé pour FlaiX Expert) : jeton d'accès signé par la clé, puis lecture de l'émetteur.
    VERIF="$(mktemp --suffix=.cjs)"
    cat > "$VERIF" <<'JS'
const fs = require("fs");
const crypto = require("crypto");
(async () => {
  let c;
  try { c = JSON.parse(fs.readFileSync(process.env.FICHIER, "utf8")); } catch { return console.log("erreur Ce fichier n'est pas un JSON lisible."); }
  if (c.type !== "service_account" || !c.client_email || !c.private_key) return console.log("erreur Ce fichier n'est pas une clé de compte de service Google (type service_account).");
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const t = Math.floor(Date.now() / 1000);
  const corps = b({ alg: "RS256", typ: "JWT" }) + "." + b({ iss: c.client_email, scope: "https://www.googleapis.com/auth/wallet_object.issuer", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 600 });
  let sig;
  try { sig = crypto.createSign("RSA-SHA256").update(corps).sign(c.private_key).toString("base64url"); } catch { return console.log("erreur La clé privée du fichier est illisible."); }
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: corps + "." + sig }), signal: AbortSignal.timeout(20000) });
  if (!r.ok) return console.log("erreur Google refuse la clé du compte de service (réponse " + r.status + ") : clé supprimée ou mal téléchargée ?");
  const { access_token } = await r.json();
  const i = await fetch("https://walletobjects.googleapis.com/walletobjects/v1/issuer/" + process.env.ISSUER, { headers: { authorization: "Bearer " + access_token }, signal: AbortSignal.timeout(20000) });
  if (i.status === 200) return console.log("ok " + c.client_email);
  const message = ((await i.json().catch(() => ({}))).error || {}).message || "";
  if (i.status === 404) return console.log("erreur Issuer ID inconnu chez Google : vérifie le numéro.");
  if (i.status === 401 || i.status === 403) return console.log("erreur Accès refusé (" + i.status + ") pour " + c.client_email + ". Vérifie : API Google Wallet activée dans Google Cloud, et ce compte de service ajouté dans Google Pay & Wallet Console > Utilisateurs. Google dit : " + message.slice(0, 300));
  console.log("erreur Réponse inattendue de Google (" + i.status + ") : " + message.slice(0, 300));
})().catch((e) => console.log("erreur Google injoignable : " + e.message));
JS
    RESULTAT="$(FICHIER="$JSON" ISSUER="$ISSUER" /opt/node/bin/node "$VERIF" || true)"
    rm -f "$VERIF"
    case "$RESULTAT" in
      "ok "*) ;;
      *) echo "${RESULTAT#erreur }"; echo "Rien n'est enregistré (le fichier reste dans /home/debian pour réessayer)."; exit 1 ;;
    esac
    install -d -m 750 -o root -g flaix "$DOSSIER"
    install -m 640 -o root -g flaix "$JSON" "$DOSSIER/google.json"
    shred -u "$JSON" 2>/dev/null || rm -f "$JSON"
    ENV_GOOGLE=/etc/flaix/wallet-google.env
    (umask 027 && printf 'WALLET_GOOGLE_ISSUER_ID=%s\n' "$ISSUER" > "$ENV_GOOGLE")
    chown root:flaix "$ENV_GOOGLE" && chmod 640 "$ENV_GOOGLE"
    systemctl restart flaix-api
    echo "Carte Google Wallet prête : émetteur $ISSUER, compte de service ${RESULTAT#ok }."
    echo "Le fichier de clé a été effacé de /home/debian ; supprime aussi celui de ton PC (Téléchargements)."
    ;;

  wallet-retirer)
    # Retire la carte Apple ou Google : les boutons disparaissent de la page de l'abonné ; les cartes déjà
    # ajoutées restent dans les téléphones, sans plus de mise à jour.
    read -r -p "Retirer la carte « apple » ou « google » ? " QUOI
    case "$QUOI" in
      apple) rm -f /etc/flaix/wallet-apple.env /etc/flaix/wallet/apple-pass.pem /etc/flaix/wallet/apple-wwdr.pem ;;
      google) rm -f /etc/flaix/wallet-google.env /etc/flaix/wallet/google.json ;;
      *) echo "Réponds « apple » ou « google »."; exit 1 ;;
    esac
    systemctl restart flaix-api
    echo "Carte $QUOI retirée."
    ;;

  *)
    echo "Usage : flaix-admin creer-lieu | nouveau-mot-de-passe | creer-editeur | sauvegarde-externe | essai-restauration | cle-mistral | cle-ovh-ia | cle-brevo | wallet-apple-demande | wallet-apple-certificat | wallet-google | wallet-retirer"
    exit 1
    ;;
esac
