# Barakat Auto: запуск на MacBook

Папка `barakat-auto` содержит весь проект. Нужен только Node.js 22 или новее и Терминал.

## Быстрый способ (двойной щелчок)
1. Установите **Node.js 22 (LTS)** с https://nodejs.org (скачать установщик `.pkg` для Mac, дальше «Продолжить»). Один раз.
2. Откройте Терминал (Cmd + Пробел, «Терминал») и введите, подставив путь к папке (можно перетащить папку в окно Терминала после `cd `):
```bash
cd ~/Downloads/barakat-auto
```
3. Разрешите запуск файла (один раз, нужно после скачивания из интернета):
```bash
chmod +x start-mac.command && xattr -d com.apple.quarantine start-mac.command
```
4. Запускайте двойным щелчком по **`start-mac.command`** в Finder (если Mac не открывает: правой кнопкой → «Открыть» → «Открыть»).
   Первый запуск ставит пакеты (1–3 минуты), потом сам открывает браузер на `http://localhost:3000`.

## То же самое командами
```bash
cd ~/Downloads/barakat-auto
```
```bash
npm install
```
```bash
npm run dev
```
Откройте `http://localhost:3000`. Остановить: `Ctrl + C` в окне Терминала.

## Админка
Адрес `http://localhost:3000/admin`, логин `admin`, пароль `admin123` (пока нет файла `.env`).
При первом входе сайт предложит настроить 2FA: QR-код и приложение Google Authenticator на телефоне. Чтобы пока без неё, создайте файл `.env` с одной строкой:
```
REQUIRE_2FA=0
```
и перезапустите сайт.

## Свои настройки (пароль и ключи)
```bash
cp .env.example .env && open -e .env
```
Впишите свой `ADMIN_PASSWORD=` (длинный пароль), `SESSION_SECRET=` (строка из `openssl rand -hex 32`), по желанию `ANTHROPIC_API_KEY=` (автоперевод) и `TELEGRAM_BOT_TOKEN=` с `TELEGRAM_CHAT_ID=` (уведомления). Сохраните (Cmd + S) и перезапустите.

## Если что-то не так
- **`command not found: node`:** установите Node.js (шаг 1) и откройте Терминал заново.
- **Порт 3000 занят:** `npm run dev -- -p 3001` и откройте `http://localhost:3001`.
- **Страница выглядит по-старому:** `Cmd + Shift + R` в браузере.
- **Начать с чистой базой и демо-данными** (ваши объявления пропадут): `npm run db:reset`.

Дальше (сервер, Cloudflare, обновление, безопасность): папка `docs/` (`DEPLOY.md`, `ADMIN.md`, `SECURITY.md`, `PERFORMANCE.md`).
