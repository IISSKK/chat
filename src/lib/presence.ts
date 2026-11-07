import "server-only";
import { getDb } from "./db";

/** Кто сейчас на сайте: посетители, приславшие «пульс» за последние 70 секунд. Хранится в БД — верно и при нескольких процессах. */
const WINDOW_MS = 70_000;

export function touchPresence(visitor: string) {
  const now = Date.now();
  const db = getDb();
  db.prepare("INSERT INTO presence (visitor, seen_at) VALUES (?, ?) ON CONFLICT(visitor) DO UPDATE SET seen_at = excluded.seen_at").run(visitor, now);
  if (Math.random() < 0.02) db.prepare("DELETE FROM presence WHERE seen_at < ?").run(now - 10 * 60_000);
}

export function onlineCount() {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM presence WHERE seen_at >= ?").get(Date.now() - WINDOW_MS) as { n: number }).n;
}
