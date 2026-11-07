/**
 * Аварийный сброс двухфакторной защиты — на случай, если потерян телефон и резервные коды.
 * Запускается на сервере (нужен доступ к файлу базы):
 *   npm run admin:reset-2fa            — сбросить 2FA владельца
 *   npm run admin:reset-2fa -- manager1 — сбросить 2FA дополнительного админа
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const db = new DatabaseSync(path.resolve(process.env.DATABASE_PATH || "./data/app.db"));
const who = process.argv[2];
if (!who) {
  for (const k of ["owner_totp_secret", "owner_totp_enabled", "owner_recovery_codes", "totp_last:0"]) db.prepare("DELETE FROM settings WHERE key = ?").run(k);
  console.log("2FA владельца сброшена. Войдите логином и паролем и включите её заново.");
} else {
  const r = db.prepare("UPDATE admins SET totp_secret = '', totp_enabled = 0, recovery_codes = '[]' WHERE username = ? COLLATE NOCASE").run(who);
  console.log(r.changes ? `2FA для «${who}» сброшена.` : `Администратор «${who}» не найден.`);
}
