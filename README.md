# Barakat Auto

B2B-витрина экспорта автомобилей и двигателей из Южной Кореи: 4 языка (ru, en, ko, zh), каталог, поиск, WhatsApp, заявки, админка с ролями.
Стек: Next.js 15 · React 19 · Tailwind · SQLite (`node:sqlite`) · sharp. Нужен Node.js 22.13+.

## Запуск у себя
```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:3000
```
Админка: `/admin` (в разработке `admin` / `admin123`, при первом входе предложит настроить 2FA).
База `data/app.db` создаётся сама, вне продакшена с демо-данными. `npm run db:reset`: **стирает** базу и начинает заново.

## Сервер
- [docs/DEPLOY.md](docs/DEPLOY.md): VPS + Cloudflare, запуск, обновление, восстановление
- [docs/ADMIN.md](docs/ADMIN.md): работа с админкой, права, 2FA, блокировки
- [docs/SECURITY.md](docs/SECURITY.md): защита, чек-лист, нагрузочные тесты (`loadtest/`)

## Возможности
- Каталог (авто, двигатели) с фильтрами, поиск по VIN/модели/году/серийному номеру, избранное и сравнение, PWA.
- Курсы USD/EUR/KGS/KRW онлайн, счётчик посетителей, просмотры объявлений.
- Заявки (форма, Telegram-уведомления), аналитика, журнал действий, резервные копии по запросу.
- Автоперевод объявлений на 4 языка (Claude API), справочник марок и моделей, черновики и корзина.
- SEO: hreflang, sitemap, JSON-LD, страницы брендов и моделей.
- Админы с правами по разделам, 2FA, блокировка перебора с разблокировкой в админке.

## Структура
```
src/app/(site)   публичный сайт        src/app/admin   админка        src/app/api   API
src/admin        реестр разделов и права    src/components   интерфейс
src/lib          база, вход, перевод, заявки, SEO    src/i18n   словари
scripts          сервисные команды (reset-db, unlock, reset-2fa, generate-assets)
deploy           setup-vps.sh, update.sh     ecosystem.config.cjs   PM2
```
Новый раздел админки: модуль в `src/admin/modules/`, строка в `src/admin/registry.ts`, страница в `src/app/admin/(panel)/`, право в `src/admin/permissions.ts`.
Тексты интерфейса: `src/i18n/dictionaries/*.ts`. Цвета: `src/app/themes.css`. Контакты и название: `src/config/site.ts`.
