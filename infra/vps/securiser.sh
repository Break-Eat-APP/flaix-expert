#!/bin/bash
# Sécurisation du VPS de test FlaiX (Debian 13). Exécuté en root.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
etape() { echo "=== $(date -Is) $*"; }

etape "paquets de sécurité"
apt-get update
apt-get -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold full-upgrade
apt-get -y install unattended-upgrades apt-listchanges nftables

etape "mises à jour de sécurité automatiques"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades

etape "pare-feu : seuls SSH (22), HTTP (80) et HTTPS (443) entrent"
cat > /etc/nftables.conf <<'EOF'
#!/usr/sbin/nft -f
# Pare-feu du VPS de test FlaiX : tout ce qui n'est pas explicitement autorisé est refusé en entrée.
flush ruleset
table inet filtre {
  chain entree {
    type filter hook input priority filter; policy drop;
    ct state established,related accept
    ct state invalid drop
    iif "lo" accept
    meta l4proto { icmp, ipv6-icmp } accept
    tcp dport { 22, 80, 443 } accept
    udp dport 443 accept
  }
  chain transfert {
    type filter hook forward priority filter; policy drop;
  }
  chain sortie {
    type filter hook output priority filter; policy accept;
  }
}
EOF
nft -c -f /etc/nftables.conf
# Filet de sécurité : si la connexion est perdue, le pare-feu est retiré tout seul dans 2 minutes.
systemd-run --on-active=120 --unit=annule-parefeu --collect /usr/sbin/nft flush ruleset
nft -f /etc/nftables.conf
systemctl enable nftables

etape "SSH : connexion par clé uniquement, pas de root"
cat > /etc/ssh/sshd_config.d/10-flaix.conf <<'EOF'
# VPS de test FlaiX : seule la clé de déploiement ouvre une session à distance.
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
AllowUsers debian
EOF
sshd -t
systemctl reload ssh
etape "TERMINE — vérifier une nouvelle connexion, puis arrêter le minuteur annule-parefeu"
