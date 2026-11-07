import "server-only";
import { getDb } from "./db";

export const TASK_STATUSES = [
  { id: "new", label: "Новая" },
  { id: "in_progress", label: "В работе" },
  { id: "done", label: "Готово" },
] as const;
export type TaskRow = { id: number; ts: string; author: string; text: string; status: string; reply: string };

export const MAX_TASK_LEN = 600;

export function createTask(author: string, text: string): number | null {
  const t = text.replace(/\r/g, "").trim().slice(0, MAX_TASK_LEN);
  if (t.length < 3) return null;
  const r = getDb().prepare("INSERT INTO dev_tasks (author, text) VALUES (?, ?)").run(author.slice(0, 64), t);
  return Number(r.lastInsertRowid);
}

export function listTasks(): TaskRow[] {
  return (getDb().prepare("SELECT id, ts, author, text, status, reply FROM dev_tasks ORDER BY CASE status WHEN 'done' THEN 1 ELSE 0 END, id DESC LIMIT 200").all() as TaskRow[]).map((r) => ({ ...r }));
}

export function updateTask(id: number, patch: { status?: string; reply?: string }): boolean {
  const cur = getDb().prepare("SELECT id FROM dev_tasks WHERE id = ?").get(id);
  if (!cur) return false;
  if (patch.status && TASK_STATUSES.some((s) => s.id === patch.status)) getDb().prepare("UPDATE dev_tasks SET status = ? WHERE id = ?").run(patch.status, id);
  if (typeof patch.reply === "string") getDb().prepare("UPDATE dev_tasks SET reply = ? WHERE id = ?").run(patch.reply.slice(0, 600), id);
  return true;
}

export function deleteTask(id: number) {
  getDb().prepare("DELETE FROM dev_tasks WHERE id = ?").run(id);
}
