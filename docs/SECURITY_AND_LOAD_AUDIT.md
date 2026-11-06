# Barakat Auto — аудит безопасности и нагрузки

**Проект:** B2B-витрина экспорта авто и двигателей (каталог, поиск, кнопки WhatsApp, 4 языка) + админка с ролями.
**Стек:** Next.js 15 (App Router, SSR) · Node.js ≥ 22.13 · SQLite (`node:sqlite`, файл `data/app.db`) · sharp · загрузки в `data/uploads/`.
**Хостинг (целевой):** VPS (Ubuntu) с постоянным диском, nginx → Node.js.
**Публичная поверхность:** `/`, `/catalog/*`, `/item/*`, `/search`, `/about`, `/terms`, `/privacy`,
`/api/{rates,visit,presence,search/suggest,items/:id/view,wa}`, `/media/*`.
**Закрытая:** `/admin/*`, `/api/admin/*` (cookie-сессия HMAC, права в БД).

---

## 0. Что уже найдено и исправлено (проверено вручную)

| # | Риск | Находка | Статус |
|---|------|---------|--------|
| 1 | **Высокий** — Stored XSS (OWASP A03) | Название объявления с `</script>` выполнялось на странице объявления (JSON-LD). Админ с ограниченными правами мог выполнить JS у владельца и выдать себе все права. | ✅ Исправлено: экранирование `<`, `>`, `&` в JSON-LD |
| 2 | **Средний** — подбор пароля (A07) | Лимит попыток входа обходился подменой `X-Forwarded-For` (12/12 попыток проходили). | ✅ Исправлено: блокировка по логину (5 ошибок → 1, 2, 4 … 15 мин) + по IP при `TRUST_PROXY=1` |
| 3 | **Средний** — нет заголовков безопасности (A05) | Не было CSP, `X-Frame-Options` (clickjacking админки), `nosniff`, `Referrer-Policy`, HSTS. | ✅ Добавлены в `next.config.ts` (HSTS — только при https) |
| 4 | Производительность | Главная 548 КБ HTML: 139 длинных ссылок WhatsApp + полный словарь в браузере. | ✅ Короткие ссылки `/api/wa`, урезанный клиентский словарь: 413 КБ (96 КБ gzip), рендер 126 → 73 мс |

**Осталось сделать** (по приоритету):

| Приоритет | Что | Как |
|---|---|---|
| Высокий | Счётчики посещений/просмотров накручиваются запросами без cookie; каждый такой запрос — запись в БД | `limit_req` в nginx на `/api/` (см. `deploy/nginx.conf.example`) |
| Высокий | Node.js — один процесс, одно ядро | PM2 cluster или несколько процессов за nginx + микрокеш HTML 15 с |
| Средний | Сессию владельца (7 дней) нельзя отозвать точечно | При утечке — сменить `SESSION_SECRET` (выйдут все); рассмотреть TTL 24 ч |
| Средний | CSRF — защита только `SameSite=Lax` | Добавить проверку заголовка `Origin` на `POST/PUT/PATCH/DELETE /api/admin/*` |
| Средний | `npm audit`: PostCSS внутри Next (используется только при сборке) | Обновить Next.js до исправленной 15.x, когда выйдет; `npm audit` раз в месяц |
| Низкий | CSP содержит `'unsafe-inline'` для скриптов (ограничение Next.js) | Позже: CSP с nonce через middleware |
| Низкий | Поиск: `%`/`_` в запросе работают как шаблоны LIKE | Экранировать при желании; инъекции нет (параметризованные запросы) |

---

## 1. Чек-лист безопасности

### 1.1. Критичное — проверить в первую очередь (ручные тесты)

**Контроль доступа (A01)** — главный риск этого проекта (админка с ролями):
- [ ] Без входа: `curl -i https://SITE/api/admin/items -X POST` → **401**; `curl -i https://SITE/admin/cars` → **307 на /admin/login**.
- [ ] Создать админа только с правом «Автомобили» и под ним:
  - [ ] `/admin/engines`, `/admin/stats`, `/admin/admins` → редирект `/admin?denied=1`;
  - [ ] `POST /api/admin/items` с `type=engine` → **403**; `DELETE /api/admin/items/<id>` без права «Удаление» → **403**;
  - [ ] `PUT /api/admin/items/<id автомобиля>` с `type=engine` → **403** (смена раздела в обход прав);
  - [ ] `GET /api/admin/admins` → **403**.
- [ ] Отключить админа → его старая cookie сразу перестаёт работать (`/admin/cars` → логин).
- [ ] Админ с правом «Администраторы» не может отключить/удалить себя или снять с себя это право.
- [ ] Подделка cookie: изменить payload (`id`, `u`) без подписи → 401.

**Инъекции и XSS (A03):**
- [ ] В админке создать объявление с названием/примечанием: `"><img src=x onerror=alert(1)>` и `</script><script>alert(1)</script>` → на сайте выводится как текст, alert нет (карточка, страница, поиск, подсказки, админ-список).
- [ ] Поиск: `'; DROP TABLE items;--`, `" OR 1=1 --` → обычная выдача, без 500.
- [ ] `sqlmap -u "https://STAGING/search?q=test" --batch --level=2` (только на стенде) → «not injectable».

**Аутентификация (A07):**
- [ ] 6 неверных паролей подряд → 429 с `Retry-After`; с подменой `X-Forwarded-For` — так же.
- [ ] В проде без `ADMIN_PASSWORD` или `SESSION_SECRET` вход невозможен (проверено в коде, `sessionSecretOk`).
- [ ] Cookie сессии: `HttpOnly; SameSite=Lax; Secure` (Secure — только при `SITE_URL=https://…`). Проверить в DevTools → Application → Cookies.
- [ ] Пароли дополнительных админов — минимум 8 символов, хранятся как scrypt (`SELECT password_hash FROM admins` → `scrypt$…`).

**Загрузка файлов:**
- [ ] Загрузить `.svg`, `.html`, `.php`, переименованный `.exe` → отклоняется или перекодируется в JPEG.
- [ ] `GET /media/../../data/app.db`, `/media/%2e%2e%2fapp.db` → **404**.
- [ ] Файл 20 МБ → ошибка «слишком большой»; в nginx `client_max_body_size 130m`.

**Логика / злоупотребления:**
- [ ] `for i in $(seq 200); do curl -s -X POST https://SITE/api/items/1/view; done` → после внедрения `limit_req` часть ответов **429**.
- [ ] Открытый редирект: `/api/wa?id=…` ведёт **только** на `wa.me`; `/admin/login?next=//evil.com` → после входа остаётесь на `/admin`.

### 1.2. Автоматические инструменты (бесплатные)

| Задача | Инструмент | Команда |
|---|---|---|
| Пассивный скан (безопасно для прода) | OWASP ZAP baseline | `docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://SITE -r zap.html` |
| Активный скан (**только стенд**) | OWASP ZAP full | `docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t https://STAGING -r zap-full.html` |
| Известные уязвимости/мисконфиги | nuclei | `nuclei -u https://SITE -severity medium,high,critical` |
| Веб-сервер | Nikto | `nikto -h https://SITE -Tuning x` |
| Открытые порты | nmap | `nmap -sV -Pn -p- SERVER_IP` — снаружи должны быть только 22, 80, 443 |
| TLS | testssl.sh | `./testssl.sh --severity MEDIUM https://SITE` |
| Заголовки | securityheaders.com, observatory.mozilla.org | открыть в браузере, цель — оценка A |
| Зависимости | npm | `npm audit --omit=dev` (ежемесячно) |
| Ручные тесты админки | Burp Suite Community / ZAP Manual | перехват запросов, подмена `id`/`type`/cookie |

### 1.3. Сервер и конфигурация (VPS Ubuntu)

- [ ] **Firewall:** `ufw default deny incoming && ufw allow 22,80,443/tcp && ufw enable`. Порт Node (3000) снаружи **закрыт**.
- [ ] **SSH:** вход только по ключу (`PasswordAuthentication no`, `PermitRootLogin no`), `fail2ban`.
- [ ] Обновления: `apt install unattended-upgrades`.
- [ ] Node запускается **не от root**, через systemd/PM2; `data/` доступна только этому пользователю (`chmod 700 data`).
- [ ] `.env` — права `600`, не в git. Длинный случайный `SESSION_SECRET`: `openssl rand -hex 32`.
- [ ] `.env`: `SITE_URL=https://…`, `TRUST_PROXY=1` (только за nginx), `ADMIN_PASSWORD` ≥ 16 символов.
- [ ] HTTPS: `certbot --nginx -d DOMAIN`; редирект 80 → 443; после проверки — HSTS (включается сам при https).
- [ ] nginx: `server_tokens off`, `limit_req`, `client_max_body_size`, `X-Forwarded-For $remote_addr` (перезапись) — готовый пример `deploy/nginx.conf.example`.
- [ ] **Бэкапы:** ежедневно `sqlite3 data/app.db ".backup /backup/app-$(date +%F).db"` + `rsync data/uploads`; хранить вне сервера; раз в месяц пробное восстановление.
- [ ] Мониторинг доступности: UptimeRobot / Better Stack на `/` и `/api/rates`.

**Ожидаемые заголовки ответа** (`curl -sI https://SITE/`):
`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
`Cross-Origin-Opener-Policy`, `Strict-Transport-Security` (https). **Не должно быть** `X-Powered-By` и версии nginx.

---

## 2. Нагрузочное тестирование

### 2.1. Базовые замеры (контейнер 4 vCPU / 16 ГБ, один процесс Node, генератор нагрузки на той же машине)

| Страница | 1 пользователь (время ответа) | 50 одновременных запросов | RPS при 50 |
|---|---|---|---|
| `/` главная | 73 мс | p50 2,7 с | ~19 |
| `/catalog/cars` | 29 мс | p50 1,2 с | ~44 |
| `/item/…` | 22 мс | p50 0,9 с | ~56 |
| `/api/search/suggest` | — | p50 0,15 с | ~325 |
| `/api/rates` (кеш 60 с) | — | p50 0,09 с | ~500 |
| статика `/demo/*.jpg` | — | p50 0,03 с | ~1700 |

**Вывод:** узкое место — серверный рендер HTML в **одном** процессе Node (одно ядро). API и статика запасом справляются.
Цифры пессимистичны (нагрузчик ел CPU той же машины) — повторите на своём VPS по сценариям ниже.

### 2.2. Как посчитать «сколько людей выдержит»

«Одновременные посетители» ≠ запросы в секунду. Типичный посетитель: 1 страница в 15–30 с + «пульс» `/api/presence` раз в 30 с + курсы раз в 60 с.

```
Ёмкость_людей ≈ RPS_страниц_на_пределе × (среднее время между страницами, с)
```
Пример: главная ~19 RPS × 20 с ≈ **~380 человек** на один процесс без кеша. Если все одновременно приходят по рекламе на главную, хуже.
С 4 процессами (PM2 cluster) ≈ ×3–3,5. С микрокешем nginx 15 с HTML почти не нагружает Node: ёмкость упирается в сеть и nginx (тысячи RPS).

**Точку отказа ищите тестом** `loadtest/k6-stress.js`: ступенчато 50 → 1000 виртуальных пользователей. Предел — последняя ступень, где ошибок < 1 % и p95 < 1,5–3 с.

### 2.3. Сценарии (готовые скрипты k6 в `loadtest/`)

| Сценарий | Файл | Что имитирует | Цель |
|---|---|---|---|
| Обычный просмотр | `k6-browse.js` | главная → каталог → объявление (+просмотр, +кнопка «Узнать цену») → поиск, 4 языка, паузы 2–10 с | p95 страниц < 1,5 с, ошибок < 1 % на плановой аудитории |
| Запуск рекламы | `k6-spike.js` | всплеск до `PEAK` пользователей за 30 с на главную и объявления | сайт не падает, после всплеска восстанавливается |
| Точка отказа | `k6-stress.js` | ступени 50…1000 VU | найти предел и что именно ломается первым |
| Админка (вручную, низкая нагрузка) | — | 2–3 админа загружают фото во время `k6-browse` | загрузки не тормозят сайт (sharp ест CPU) |

```bash
# установка k6 (Ubuntu): https://grafana.com/docs/k6/latest/set-up/install-k6/
k6 run -e BASE_URL=https://staging.DOMAIN -e TARGET_VUS=300 loadtest/k6-browse.js
k6 run -e BASE_URL=https://staging.DOMAIN -e PEAK=800 loadtest/k6-spike.js
k6 run -e BASE_URL=https://staging.DOMAIN loadtest/k6-stress.js
```
**Генератор нагрузки запускайте с другой машины**, не с сервера сайта.

### 2.4. Какие метрики смотреть во время теста

| Где | Метрика | Тревожный порог |
|---|---|---|
| k6 | `http_req_duration` p95/p99, `http_req_failed`, RPS | p95 > 1,5 с (страницы) / 0,5 с (API); ошибки > 1 % |
| Сервер (`htop`) | CPU **по ядрам** — Node занимает одно ядро на 100 % | ядро процесса Node ≥ 90 % дольше минуты |
| Сервер | RAM процесса Node (RSS), `free -m` | рост без остановки (утечка) / swap |
| Node | event loop lag (`pm2 monit` или `--inspect`) | > 100 мс |
| Диск | `iostat -x 1` (SQLite WAL, загрузки) | `%util` > 80 % |
| nginx | доля 5xx/429 в `access.log`, `X-Cache: HIT` | 502/504 — Node не успевает |
| SQLite | ошибки `SQLITE_BUSY` в логах | любые |

```bash
htop                      # CPU по ядрам, RAM
pm2 monit                 # если PM2: CPU/RAM/lag каждого процесса
iostat -x 1               # диск (пакет sysstat)
tail -f /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c   # коды ответов
```

### 2.5. Что делать, если не хватает

1. **PM2 cluster** (×3–3,5 на 4 ядрах): `pm2 start npm --name barakat -i max -- start`. Для `/api/presence` в кластере счётчик «онлайн» считается по каждому процессу отдельно: держать 1 процесс для API через отдельный upstream или вынести «онлайн» в SQLite.
2. **Микрокеш nginx 15 с** для страниц (в примере конфига) — главный рычаг под рекламу.
3. **CDN** (Cloudflare, бесплатно) для `/_next/static`, `/demo`, `/media` и защиты от L7-флуда.
4. VPS: от **2 vCPU / 2 ГБ** для старта, **4 vCPU / 4–8 ГБ** под рекламу.

---

## 3. Порядок действий — с чего начать сегодня

**Правило:** на **рабочем** сайте — только пассивные проверки. Активные сканеры, sqlmap и нагрузка — **только на копии (staging)**.

1. **Сегодня, 30 мин — подтянуть исправления:** `git pull`, `npm install`, `npm run build`. В `.env`: `SESSION_SECRET` (новый), `ADMIN_PASSWORD`, `SITE_URL=https://…`, `TRUST_PROXY=1` (если за nginx).
2. **Сегодня — пассивно на проде:** `curl -sI https://SITE/`, securityheaders.com, testssl.sh, `nmap` своего IP, ZAP **baseline**. Ничего не ломает.
3. **Сегодня — бэкап:** `sqlite3 data/app.db ".backup app-backup.db"` + копия `data/uploads`.
4. **Завтра — стенд:** второй VPS той же конфигурации (или тот же в нерабочее время на другом порту), копия `data/`, `SEED_DEMO=false`.
5. **На стенде:** ручные проверки из §1.1 (права, XSS, загрузки), затем ZAP full scan, nuclei, nikto.
6. **На стенде:** `k6-browse` (плановая аудитория) → `k6-stress` (точка отказа) → `k6-spike` (реклама). Записать: предел VU, p95, что упало первым.
7. **Исправить и настроить:** nginx из `deploy/nginx.conf.example` (rate limit + микрокеш), PM2 cluster, ufw, fail2ban, бэкапы по cron.
8. **Повторить шаг 6** и сравнить. Перед запуском рекламы — `k6-spike` с `PEAK` = ожидаемый всплеск × 2.
9. **Регулярно:** `npm audit` и ZAP baseline раз в месяц, проверка восстановления бэкапа раз в месяц.
