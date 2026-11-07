#!/usr/bin/env bash
# Обновление сайта на сервере: ./deploy/update.sh  (от пользователя barakat, из папки проекта)
set -euo pipefail
cd "$(dirname "$0")/.."
BRANCH="${BRANCH:-claude/stoic-allen-wq9wep}"

mkdir -p ~/backups && cp -f data/app.db ~/backups/app-$(date +%F-%H%M).db 2>/dev/null || true
ls -t ~/backups/app-*.db 2>/dev/null | tail -n +8 | xargs -r rm -f

git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
npm ci --no-audit --no-fund
npm run build
pm2 reload ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
pm2 save >/dev/null
echo "Готово"
