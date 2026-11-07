# Безопасность и нагрузка

## Что уже сделано
- Вход: пароли scrypt, подписанная cookie (HttpOnly, SameSite), 2FA (TOTP + резервные коды, защита от повтора кода), блокировка перебора по логину и IP, отзыв сессий.
- Права по разделам проверяются на сервере (страницы и API), роль меняется мгновенно.
- Защита от CSRF (проверка Origin/Sec-Fetch-Site на всех POST/PUT/PATCH/DELETE).
- Заголовки: CSP, HSTS (при https), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
- Загрузки: только настоящие изображения (sharp), лимиты размера и пикселей, имена генерируются.
- SQL только параметризованный, JSON-LD экранируется, заявки с защитой от спама (honeypot, время, лимит).
- Журнал действий; `npm audit`: 0 уязвимостей.

## Чек-лист после запуска
1. `ADMIN_PASSWORD` длинный, `SESSION_SECRET` случайный, `TRUST_PROXY=cloudflare`.
2. 2FA включена у всех админов; резервные коды сохранены.
3. SSH только по ключу: в `/etc/ssh/sshd_config` `PasswordAuthentication no`, `PermitRootLogin no`, затем `systemctl reload ssh`.
4. Открыт только SSH (`ufw status`), сайт доступен лишь через туннель.
5. Проверить заголовки: securityheaders.com, SSL: ssllabs.com.
6. Раз в неделю скачивать резервную копию с фото.

## Проверка на прочность
Запускайте **с другого компьютера**, не с самого сервера, и вне часов работы.
```bash
k6 run -e BASE_URL=https://ваш-домен loadtest/k6-browse.js    # обычный трафик
k6 run -e BASE_URL=https://ваш-домен loadtest/k6-stress.js    # растущая нагрузка до отказа
k6 run -e BASE_URL=https://ваш-домен loadtest/k6-spike.js     # резкий всплеск
```
Нормой считаем: ответ ≤ 500 мс (p95), ошибок < 1%, процессор сервера < 80%. Во время теста смотрите `pm2 monit`.
Сканирование: OWASP ZAP (baseline) по боевому адресу: `docker run -t zaproxy/zap-stable zap-baseline.py -t https://ваш-домен`.
