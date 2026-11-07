# Запуск на сервере

Схема: VPS (Ubuntu) + Cloudflare. Сайт слушает только `127.0.0.1:3000`, наружу его выводит Cloudflare Tunnel: открытые порты, nginx и сертификаты не нужны.

**Нужно:** VPS от 2 ГБ памяти (Ubuntu 22.04/24.04), домен, аккаунт Cloudflare (бесплатный).

## 1. Cloudflare и домен
1. В Cloudflare: Add a site → ваш домен → бесплатный тариф. У регистратора домена замените NS-записи на те, что покажет Cloudflare.
2. SSL/TLS → режим **Full**. Включите **Always Use HTTPS**.

## 2. Сервер (один раз)
```bash
ssh root@IP-СЕРВЕРА
```
```bash
curl -fsSL https://raw.githubusercontent.com/ВЫ/РЕПО/claude/stoic-allen-wq9wep/deploy/setup-vps.sh -o setup.sh && bash setup.sh https://github.com/ВЫ/РЕПО.git
```
Скрипт ставит Node 22, PM2, firewall (открыт только SSH), fail2ban и клонирует проект в `/home/barakat/chat`. Для приватного репозитория клонируйте вручную (deploy-ключ или токен GitHub).

## 3. Настройка
```bash
su - barakat && cd chat && cp .env.example .env && nano .env
```
Обязательно заполнить:
- `SITE_URL=https://ваш-домен`
- `ADMIN_PASSWORD` — длинный пароль (от 10 символов, лучше 16+)
- `SESSION_SECRET` — вывод `openssl rand -hex 32`
- `TRUST_PROXY=cloudflare`

По желанию: `ANTHROPIC_API_KEY` (автоперевод), `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` (уведомления). В продакшене демо-данные не создаются: база стартует пустой.

## 4. Запуск
```bash
npm ci && npm run build && pm2 start ecosystem.config.cjs && pm2 save
```
```bash
pm2 startup
```
Последняя команда выведет строку с `sudo ...`: выполните её от root, чтобы сайт поднимался после перезагрузки. Проверка: `curl -I http://127.0.0.1:3000`.

## 5. Туннель Cloudflare (от root)
```bash
curl -fsSL https://pkg.cloudflare.com/install.sh | bash   # или инструкция на developers.cloudflare.com/cloudflare-one
```
В Cloudflare: Zero Trust → Networks → Tunnels → Create tunnel → выполнить показанную команду установки на сервере → Public hostname: ваш домен → Service `HTTP` → `localhost:3000`. Через минуту сайт открывается по домену.

В Cloudflare **не включайте** кеширование HTML (по умолчанию оно выключено) и добавьте Cache Rule: `/admin*` и `/api/*` → Bypass cache.

## 6. После запуска
1. Откройте `/admin`, войдите, настройте 2FA (QR-код в приложение-аутентификатор), сохраните резервные коды.
2. «Контакты» — номера WhatsApp. «Администраторы» — доступ сотрудникам.
3. Search Console и Яндекс.Вебмастер: добавить сайт, отправить `https://ваш-домен/sitemap.xml`.

## Обновление сайта
```bash
cd ~/chat && ./deploy/update.sh
```
Делает копию базы (хранит 7 последних), забирает код, собирает, перезагружает без простоя.

## Полезное на сервере
| Что | Команда |
| --- | --- |
| Логи | `pm2 logs barakat` |
| Состояние | `pm2 status` |
| Перезапуск | `pm2 reload barakat` |
| Снять блокировку входа | `npm run admin:unlock` (или в админке → «Блокировки входа») |
| Потерян телефон с 2FA | `npm run admin:reset-2fa` |
| Копия вручную | `cp data/app.db ~/backups/` (или в админке → «Резервная копия») |

## Восстановление из копии
```bash
pm2 stop barakat && rm -f data/app.db-wal data/app.db-shm && cp ~/backups/ФАЙЛ.db data/app.db && pm2 start barakat
```
Фото лежат в `data/uploads/`; копию с фото скачивайте из админки раз в неделю.
