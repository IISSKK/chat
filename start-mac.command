#!/bin/bash
# Запуск Barakat Auto на Mac двойным щелчком. Первый раз: см. INSTRUCTION-MAC.md
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/local/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "Не найден Node.js. Установите Node.js 22 (LTS) с https://nodejs.org и запустите этот файл снова."
  open "https://nodejs.org/en/download" 2>/dev/null
  read -r -p "Нажмите Enter, чтобы закрыть окно…" _; exit 1
fi
MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$MAJOR" -lt 22 ]; then
  echo "Нужен Node.js версии 22 или новее, сейчас: $(node -v). Установите свежий LTS с https://nodejs.org"
  open "https://nodejs.org/en/download" 2>/dev/null
  read -r -p "Нажмите Enter, чтобы закрыть окно…" _; exit 1
fi

if [ ! -d node_modules ]; then
  echo "Первый запуск: устанавливаю пакеты (1–3 минуты)…"
  npm install || { read -r -p "Ошибка установки. Нажмите Enter…" _; exit 1; }
fi

echo "Запускаю сайт: http://localhost:3000  (остановить: Ctrl + C)"
( sleep 6; open "http://localhost:3000" ) &
npm run dev
