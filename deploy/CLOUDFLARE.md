# Развёртывание за Cloudflare

Приложению нужны Node.js 22+ и постоянный диск (SQLite + загрузки), поэтому на «чистых» Cloudflare Pages/Workers оно не запустится. Рабочая схема: VPS + Cloudflare перед ним.

1. VPS (Ubuntu), Node 22+: `git clone`, `npm ci`, `npm run build`.
2. Файл `.env` (см. `.env.example`): `SITE_URL=https://ваш-домен`, `SESSION_SECRET` (длинная случайная строка), `ADMIN_PASSWORD`, `TRUST_PROXY=cloudflare`, по желанию `ANTHROPIC_API_KEY`, `TRANSLATE_MODEL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `REQUIRE_2FA=1`.
3. Запуск: `pm2 start npm --name barakat -- start` (или `pm2 start npm -i 2 ...` для кластера: лимиты и онлайн хранятся в SQLite).
4. Cloudflare: добавить домен, A-запись на IP VPS с оранжевым облаком (Proxy), SSL/TLS = Full (strict), включить Always HTTPS.
   Вариант без открытых портов — Cloudflare Tunnel: `cloudflared tunnel` на `http://localhost:3000`.
5. Cache Rules: не кешировать `/admin*` и `/api/*`; статика `/_next/static/*` кешируется сама.
6. Search Console / Яндекс.Вебмастер: добавить сайт и отправить `https://домен/sitemap.xml`.
7. Бэкап: в админке «Резервные копии» (скачивается по запросу, на сервере не хранится).
8. Потеряли 2FA: `npm run admin:reset-2fa` на сервере.
