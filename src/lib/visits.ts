import "server-only";
import { getDb } from "./db";

function day(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

export function recordVisit(visitor: string) {
  getDb()
    .prepare(
      "INSERT INTO visits (day, visitor, hits) VALUES (?, ?, 1) ON CONFLICT(day, visitor) DO UPDATE SET hits = hits + 1",
    )
    .run(day(), visitor);
}

export interface VisitStats {
  today: number;
  week: number;
  month: number;
  total: number;
}

export function getVisitStats(): VisitStats {
  const db = getDb();
  const count = (from?: string) =>
    (
      (from
        ? db.prepare("SELECT COUNT(*) AS n FROM visits WHERE day >= ?").get(from)
        : db.prepare("SELECT COUNT(*) AS n FROM visits").get()) as { n: number }
    ).n;
  return { today: count(day()), week: count(day(6)), month: count(day(29)), total: count() };
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
