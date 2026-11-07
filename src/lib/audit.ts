import "server-only";
import { getDb } from "./db";

export interface AuditRow {
  id: number;
  ts: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
}

/** Записывает действие администратора в журнал. Никогда не бросает исключение (журнал не должен ломать работу). */
export function logAudit(actor: string, action: string, entity = "", entityId: string | number = "", details = "") {
  try {
    getDb()
      .prepare("INSERT INTO audit_log (actor, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)")
      .run(actor.slice(0, 64), action.slice(0, 64), entity.slice(0, 32), String(entityId).slice(0, 32), details.slice(0, 500));
  } catch {}
}

export function listAudit(opts: { actor?: string; action?: string; page?: number; perPage?: number } = {}) {
  const db = getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (opts.actor) (where.push("actor = ?"), params.push(opts.actor));
  if (opts.action) (where.push("action LIKE ?"), params.push(`${opts.action}%`));
  const sql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const perPage = opts.perPage ?? 50;
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM audit_log ${sql}`).get(...params) as { n: number }).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const rows = (db
    .prepare(`SELECT * FROM audit_log ${sql} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage) as unknown as AuditRow[]).map((r) => ({ ...r }));
  const actors = (db.prepare("SELECT DISTINCT actor FROM audit_log ORDER BY actor").all() as { actor: string }[]).map((r) => r.actor);
  return { rows, total, page, pages, actors };
}

/** Чистим журнал старше 180 дней, чтобы не занимал место */
export function pruneAudit(days = 180) {
  try {
    getDb().prepare("DELETE FROM audit_log WHERE ts < datetime('now', ?)").run(`-${days} days`);
  } catch {}
}
