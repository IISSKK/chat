import "server-only";
import { getDb } from "./db";

export const LEAD_STATUSES = ["new", "in_progress", "deal", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: number;
  created_at: string;
  name: string;
  contact: string;
  country: string;
  message: string;
  item_id: number | null;
  item_title: string;
  lang: string;
  source: string;
  status: LeadStatus;
  note: string;
  updated_at: string;
}

export interface LeadInput {
  name: string;
  contact: string;
  country: string;
  message: string;
  itemId: number | null;
  itemTitle: string;
  lang: string;
  source: string;
}

/** Проверяет поля формы. Возвращает очищенные данные или ключ ошибки. */
export function validateLead(raw: Record<string, unknown>): { data?: Omit<LeadInput, "itemId" | "itemTitle" | "lang" | "source">; error?: "name" | "contact" | "message" } {
  const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  const name = clean(raw.name, 80);
  const contact = clean(raw.contact, 120);
  const country = clean(raw.country, 60);
  const message = String(raw.message ?? "").replace(/\r/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 1500);
  if (name.length < 2) return { error: "name" };
  const digits = contact.replace(/\D/g, "");
  const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const looksHandle = /^@[A-Za-z0-9_]{4,32}$/.test(contact); // Telegram
  if (!(looksEmail || looksHandle || (digits.length >= 7 && digits.length <= 15))) return { error: "contact" };
  // грубая защита от ссылок-спама
  if ((message.match(/https?:\/\//gi) || []).length > 2) return { error: "message" };
  return { data: { name, contact, country, message } };
}

export function createLead(input: LeadInput): number {
  const res = getDb()
    .prepare("INSERT INTO leads (name, contact, country, message, item_id, item_title, lang, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(input.name, input.contact, input.country, input.message, input.itemId, input.itemTitle.slice(0, 200), input.lang, input.source.slice(0, 60));
  return Number(res.lastInsertRowid);
}

export function countNewLeads(): number {
  return (getDb().prepare("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'").get() as { n: number }).n;
}

export function leadCounts(): Record<LeadStatus | "all", number> {
  const rows = getDb().prepare("SELECT status, COUNT(*) AS n FROM leads GROUP BY status").all() as { status: LeadStatus; n: number }[];
  const out = { new: 0, in_progress: 0, deal: 0, closed: 0, all: 0 } as Record<LeadStatus | "all", number>;
  for (const r of rows) {
    out[r.status] = r.n;
    out.all += r.n;
  }
  return out;
}

export function listLeads(opts: { status?: LeadStatus; page?: number; perPage?: number } = {}) {
  const db = getDb();
  const perPage = opts.perPage ?? 25;
  const where = opts.status ? "WHERE status = ?" : "";
  const params = opts.status ? [opts.status] : [];
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM leads ${where}`).get(...params) as { n: number }).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, opts.page ?? 1), pages);
  const rows = (db
    .prepare(`SELECT * FROM leads ${where} ORDER BY (status = 'new') DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage) as unknown as Lead[]).map((r) => ({ ...r }));
  return { rows, total, page, pages };
}

export function updateLead(id: number, patch: { status?: string; note?: string }): boolean {
  const db = getDb();
  const cur = db.prepare("SELECT id FROM leads WHERE id = ?").get(id);
  if (!cur) return false;
  if (patch.status && (LEAD_STATUSES as readonly string[]).includes(patch.status)) db.prepare("UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?").run(patch.status, id);
  if (typeof patch.note === "string") db.prepare("UPDATE leads SET note = ?, updated_at = datetime('now') WHERE id = ?").run(patch.note.slice(0, 2000), id);
  return true;
}

export function deleteLead(id: number) {
  getDb().prepare("DELETE FROM leads WHERE id = ?").run(id);
}

/** Заявки старше 2 лет удаляем (персональные данные не храним дольше нужного) */
export function pruneLeads(days = 730) {
  try {
    getDb().prepare("DELETE FROM leads WHERE created_at < datetime('now', ?)").run(`-${days} days`);
  } catch {}
}
