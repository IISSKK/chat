/**
 * Снять блокировку входа (после нескольких неверных паролей или кодов 2FA).
 * Запускается на сервере (нужен доступ к файлу базы):
 *   npm run admin:unlock              — снять все блокировки
 *   npm run admin:unlock -- manager1  — только для логина manager1
 *   npm run admin:unlock -- 203.0.113.5 — только для IP-адреса
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const db = new DatabaseSync(path.resolve(process.env.DATABASE_PATH || "./data/app.db"));
const who = (process.argv[2] || "").toLowerCase();
const r = who
  ? db.prepare("DELETE FROM rate_limits WHERE key LIKE ? OR key LIKE ?").run(`%:u:${who}`, `%:ip:${who}`)
  : db.prepare("DELETE FROM rate_limits WHERE key LIKE 'login:%' OR key LIKE '2fa:%'").run();
console.log(r.changes ? `Блокировки сняты (записей: ${r.changes}).` : "Активных блокировок не найдено.");
