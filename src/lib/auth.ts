/** Подписанная cookie-сессия (HMAC-SHA256 через Web Crypto) — работает и в middleware, и в Node. */
export const SESSION_COOKIE = "barakat_admin";

function secret() {
  return process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // без 2FA — 12 часов
const SESSION_TTL_2FA_MS = 7 * 24 * 60 * 60 * 1000; // с включённой 2FA — 7 дней
const TICKET_TTL_MS = 5 * 60 * 1000;

/** id = 0 — владелец (логин из .env), иначе id администратора в БД. kind "2fa" — короткий билет между паролем и кодом. */
async function sign(payload: Record<string, unknown>) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function createSessionToken(user: string, id = 0, twoFactor = false) {
  const now = Date.now();
  return sign({ u: user, id, iat: now, exp: now + (twoFactor ? SESSION_TTL_2FA_MS : SESSION_TTL_MS) });
}

export const sessionMaxAge = (twoFactor: boolean) => Math.floor((twoFactor ? SESSION_TTL_2FA_MS : SESSION_TTL_MS) / 1000);

export async function createTicket(user: string, id: number) {
  return sign({ u: user, id, k: "2fa", exp: Date.now() + TICKET_TTL_MS });
}

/** В продакшене без SESSION_SECRET подпись сессии можно подделать — вход запрещён для всех. */
export function sessionSecretOk() {
  return process.env.NODE_ENV !== "production" || !!process.env.SESSION_SECRET;
}

async function open(token: string | undefined | null) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, await hmac(payload))) return null;
  try {
    const bin = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))) as {
      u: string; id?: number; iat?: number; exp: number; k?: string;
    };
    return json.exp > Date.now() ? json : null;
  } catch {
    return null;
  }
}

/** Сессия администратора (билеты 2FA не принимаются) */
export async function verifySessionToken(token: string | undefined | null) {
  const j = await open(token);
  return j && !j.k ? j : null;
}

export async function verifyTicket(token: string | undefined | null) {
  const j = await open(token);
  return j && j.k === "2fa" ? j : null;
}

export function checkCredentials(user: string, password: string) {
  const U = process.env.ADMIN_USER || "admin";
  const P = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin123");
  // В продакшене без ADMIN_PASSWORD (и SESSION_SECRET) вход запрещён — чтобы не остались значения по умолчанию.
  if (!P || (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)) return false;
  return safeEqual(user, U) && safeEqual(password, P);
}

export const sessionCookieOptions = (twoFactor: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
  path: "/",
  maxAge: sessionMaxAge(twoFactor),
});
