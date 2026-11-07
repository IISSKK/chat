import "server-only";
import { getDb } from "./db";

function day(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Возвращает true, если это первый визит этого человека за сегодня */
export function recordVisit(visitor: string): boolean {
  const db = getDb();
  const d = day();
  const existed = !!db.prepare("SELECT 1 FROM visits WHERE day = ? AND visitor = ?").get(d, visitor);
  db.prepare("INSERT INTO visits (day, visitor, hits) VALUES (?, ?, 1) ON CONFLICT(day, visitor) DO UPDATE SET hits = hits + 1").run(d, visitor);
  return !existed;
}

export interface VisitStats {
  today: number;
  week: number;
  month: number;
  /** сумма уникальных посетителей по дням */
  total: number;
  /** всего разных людей за всё время */
  unique: number;
}

export function getVisitStats(): VisitStats {
  const db = getDb();
  const count = (from?: string) =>
    (
      (from
        ? db.prepare("SELECT COUNT(*) AS n FROM visits WHERE day >= ?").get(from)
        : db.prepare("SELECT COUNT(*) AS n FROM visits").get()) as { n: number }
    ).n;
  const distinct = (from: string) =>
    (db.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day >= ?").get(from) as { n: number }).n;
  return {
    today: count(day()),
    week: distinct(day(6)),
    month: distinct(day(29)),
    total: count(),
    unique: (db.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM visits").get() as { n: number }).n,
  };
}

export function getDailyVisits(days = 30) {
  const rows = getDb()
    .prepare("SELECT day, COUNT(*) AS visitors, SUM(hits) AS hits FROM visits WHERE day >= ? GROUP BY day ORDER BY day")
    .all(day(days - 1)) as { day: string; visitors: number; hits: number }[];
  const map = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const d = day(days - 1 - i);
    return { day: d, visitors: map.get(d)?.visitors ?? 0, hits: map.get(d)?.hits ?? 0 };
  });
}
