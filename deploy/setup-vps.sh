#!/usr/bin/env bash
# Первичная настройка чистого Ubuntu 22.04/24.04 (запуск от root): bash setup-vps.sh https://github.com/ВЫ/РЕПО.git
set -euo pipefail
REPO="${1:?Укажите адрес репозитория первым аргументом}"
BRANCH="${BRANCH:-claude/stoic-allen-wq9wep}"
APP_USER=barakat

apt-get update -y && apt-get install -y curl git ufw fail2ban unattended-upgrades ca-certificates
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
npm install -g pm2

id "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER"
sudo -u "$APP_USER" bash -c "cd ~ && [ -d chat ] || git clone -b '$BRANCH' '$REPO' chat"

ufw default deny incoming && ufw default allow outgoing && ufw allow OpenSSH && ufw --force enable
systemctl enable --now fail2ban
echo "Готово. Дальше: docs/DEPLOY.md, шаг 3 (файл .env)."
