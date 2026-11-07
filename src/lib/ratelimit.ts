import "server-only";
import type { NextRequest } from "next/server";
import { getDb } from "./db";

/**
 * Ограничитель частоты в общей базе SQLite — работает одинаково при одном процессе и при PM2 cluster.
 * IP берётся из заголовков только если сайт за доверенным прокси (TRUST_PROXY=1 → X-Real-IP, TRUST_PROXY=cloudflare → CF-Connecting-IP).
 */
export function clientIp(req: NextRequest | Request): string | null {
  const mode = process.env.TRUST_PROXY;
  if (mode === "cloudflare") return req.headers.get("cf-connecting-ip")?.trim() || null;
  if (mode === "1") {
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
    const xff = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
    return xff?.length ? xff[xff.length - 1] : null;
  }
  return null;
}

/** Окно фиксированной длины: не более `max` обращений за `windowMs`. Возвращает true, если можно продолжать. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const db = getDb();
  const now = Date.now();
  const row = db.prepare("SELECT window_start, count FROM rate_limits WHERE key = ?").get(key) as { window_start: number; count: number } | undefined;
  if (!row || now - row.window_start > windowMs) {
    db.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1")
      .run(key, now);
    return true;
  }
  if (row.count >= max) return false;
  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return true;
}

/** Проверка для публичных POST: по IP (если известен). Без IP — общий мягкий лимит на маршрут. */
export function allowRequest(req: NextRequest | Request, route: string, max: number, windowMs: number) {
  const ip = clientIp(req);
  return allow(`${route}:${ip ?? "any"}`, ip ? max : max * 20, windowMs);
}

// ---------- блокировка при подборе пароля / кода 2FA ----------
const MAX_FAILS = 5;
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 15 * 60_000;
const WINDOW_MS = 15 * 60_000;

type LockRow = { window_start: number; count: number; locked_until: number; locks: number };
const keysFor = (scope: string, username: string, ip: string | null) => [`${scope}:u:${username.toLowerCase().slice(0, 64)}`, ...(ip ? [`${scope}:ip:${ip}`] : [])];

export function lockedFor(scope: string, username: string, ip: string | null) {
  const db = getDb();
  const now = Date.now();
  let wait = 0;
  for (const k of keysFor(scope, username, ip)) {
    const r = db.prepare("SELECT locked_until FROM rate_limits WHERE key = ?").get(k) as { locked_until: number } | undefined;
    if (r) wait = Math.max(wait, r.locked_until - now);
  }
  return Math.max(0, wait);
}

/** Регистрирует неудачную попытку. Возвращает true, если эта попытка вызвала блокировку. */
export function registerFailure(scope: string, username: string, ip: string | null): boolean {
  const db = getDb();
  const now = Date.now();
  let locked = false;
  for (const k of keysFor(scope, username, ip)) {
    const r = db.prepare("SELECT window_start, count, locked_until, locks FROM rate_limits WHERE key = ?").get(k) as LockRow | undefined;
    let e: LockRow = r ? { ...r } : { window_start: now, count: 0, locked_until: 0, locks: 0 };
    if (now - e.window_start > WINDOW_MS) e = { window_start: now, count: 0, locked_until: 0, locks: e.locks };
    e.count++;
    if (e.count >= MAX_FAILS) {
      e.locked_until = now + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** e.locks);
      e.locks++;
      e.count = 0;
      e.window_start = now;
      locked = true;
    }
    db.prepare(
      "INSERT INTO rate_limits (key, window_start, count, locked_until, locks) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = excluded.count, locked_until = excluded.locked_until, locks = excluded.locks",
    ).run(k, e.window_start, e.count, e.locked_until, e.locks);
  }
  return locked;
}

export function registerSuccess(scope: string, username: string, ip: string | null) {
  const db = getDb();
  for (const k of keysFor(scope, username, ip)) db.prepare("DELETE FROM rate_limits WHERE key = ?").run(k);
}

/** Раз в сутки чистим устаревшие записи */
export function pruneRateLimits() {
  try {
    getDb().prepare("DELETE FROM rate_limits WHERE window_start < ? AND locked_until < ?").run(Date.now() - 24 * 3600_000, Date.now());
  } catch {}
}
