import "server-only";
import type { NextRequest } from "next/server";

/**
 * Защита от подбора пароля. Считаем неудачные попытки:
 *  - по логину (нельзя обойти сменой IP или подменой заголовков);
 *  - по IP — только если TRUST_PROXY=1 (сайт за nginx/Cloudflare, который сам ставит X-Real-IP / X-Forwarded-For).
 * После 5 ошибок — блокировка на 1 мин, затем 2, 4 … до 15 мин. Успешный вход сбрасывает счётчик.
 */
const MAX_FAILS = 5;
const BASE_LOCK_MS = 60_000;
const MAX_LOCK_MS = 15 * 60_000;
const WINDOW_MS = 15 * 60_000;

type Entry = { fails: number; first: number; lockedUntil: number; locks: number };
const g = globalThis as unknown as { __loginLimiter?: Map<string, Entry> };
const store = (g.__loginLimiter ??= new Map());

export function clientIp(req: NextRequest): string | null {
  if (process.env.TRUST_PROXY !== "1") return null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  // Берём последний адрес: его добавил наш прокси, клиент не может его подделать
  const xff = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return xff?.length ? xff[xff.length - 1] : null;
}

function keys(username: string, ip: string | null) {
  return [`u:${username.toLowerCase().slice(0, 64)}`, ...(ip ? [`ip:${ip}`] : [])];
}

/** Сколько мс осталось до разблокировки (0 — можно пробовать). */
export function lockedFor(username: string, ip: string | null) {
  const now = Date.now();
  return Math.max(0, ...keys(username, ip).map((k) => (store.get(k)?.lockedUntil ?? 0) - now));
}

export function registerFailure(username: string, ip: string | null) {
  const now = Date.now();
  if (store.size > 50_000) store.clear(); // защита памяти от флуда случайными логинами
  for (const k of keys(username, ip)) {
    let e = store.get(k);
    if (!e || now - e.first > WINDOW_MS) e = { fails: 0, first: now, lockedUntil: 0, locks: e?.locks ?? 0 };
    e.fails++;
    if (e.fails >= MAX_FAILS) {
      e.lockedUntil = now + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** e.locks);
      e.locks++;
      e.fails = 0;
      e.first = now;
    }
    store.set(k, e);
  }
}

export function registerSuccess(username: string, ip: string | null) {
  for (const k of keys(username, ip)) store.delete(k);
}
