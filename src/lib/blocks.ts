import "server-only";
import { getDb } from "./db";
import { listAdmins, ownerUsername } from "./admins";

export type BlockRow = {
  key: string;
  kind: "user" | "ip";
  /** логин или IP-адрес */
  target: string;
  /** на что блокировка: пароль или код 2FA */
  scope: "login" | "2fa";
  /** имя администратора, если блокировка относится к его логину */
  adminName: string | null;
  /** сколько секунд осталось */
  secondsLeft: number;
  /** сколько раз блокировали подряд (чем больше — тем дольше срок) */
  times: number;
};

/** Активные блокировки входа: и по логину, и по IP-адресу */
export function listBlocks(): BlockRow[] {
  const now = Date.now();
  const rows = getDb()
    .prepare("SELECT key, locked_until, locks FROM rate_limits WHERE locked_until > ? AND (key LIKE 'login:%' OR key LIKE '2fa:%') ORDER BY locked_until DESC LIMIT 200")
    .all(now) as { key: string; locked_until: number; locks: number }[];
  const names = new Map<string, string>();
  names.set(ownerUsername().toLowerCase(), ownerUsername());
  for (const a of listAdmins()) names.set(a.username.toLowerCase(), a.username);
  const out: BlockRow[] = [];
  for (const r of rows) {
    const m = /^(login|2fa):(u|ip):(.+)$/.exec(r.key);
    if (!m) continue;
    const kind = m[2] === "u" ? "user" : "ip";
    out.push({
      key: r.key,
      kind,
      target: m[3],
      scope: m[1] as "login" | "2fa",
      adminName: kind === "user" ? names.get(m[3].toLowerCase()) ?? null : null,
      secondsLeft: Math.max(1, Math.ceil((r.locked_until - now) / 1000)),
      times: r.locks,
    });
  }
  return out;
}

/** Снимает блокировку (и обнуляет счётчик ошибок). Без ключа — все. Возвращает число снятых. */
export function unblock(key?: string): number {
  const db = getDb();
  if (key) {
    if (!/^(login|2fa):(u|ip):.{1,80}$/.test(key)) return 0;
    return Number(db.prepare("DELETE FROM rate_limits WHERE key = ?").run(key).changes);
  }
  return Number(db.prepare("DELETE FROM rate_limits WHERE key LIKE 'login:%' OR key LIKE '2fa:%'").run().changes);
}
