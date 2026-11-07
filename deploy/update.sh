#!/usr/bin/env bash
# Обновление сайта на сервере одной командой: ./deploy/update.sh
# Тянет свежую версию из GitHub, ставит зависимости, пересобирает и перезапускает сайт.
set -euo pipefail
cd "$(dirname "$0")/.."
BRANCH="${BRANCH:-claude/stoic-allen-wq9wep}"
echo "→ резервная копия базы"; mkdir -p ~/backups && cp -f data/app.db ~/backups/app-$(date +%F-%H%M).db 2>/dev/null || true
echo "→ git pull ($BRANCH)"; git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
echo "→ npm ci"; npm ci --no-audit --no-fund
echo "→ сборка"; npm run build
echo "→ перезапуск"; pm2 reload barakat 2>/dev/null || pm2 start npm --name barakat -- start
pm2 save >/dev/null 2>&1 || true
echo "✓ готово"
