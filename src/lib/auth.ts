/** Подписанная cookie-сессия (HMAC-SHA256 через Web Crypto) — работает и в middleware, и в Node. */
export const SESSION_COOKIE = "korida_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

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

export async function createSessionToken(user: string) {
  const payload = b64url(enc.encode(JSON.stringify({ u: user, exp: Date.now() + MAX_AGE * 1000 })));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, await hmac(payload))) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { u: string; exp: number };
    return json.exp > Date.now() ? json : null;
  } catch {
    return null;
  }
}

export function checkCredentials(user: string, password: string) {
  const U = process.env.ADMIN_USER || "admin";
  const P = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin123");
  // В продакшене без ADMIN_PASSWORD (и SESSION_SECRET) вход запрещён — чтобы не остались значения по умолчанию.
  if (!P || (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)) return false;
  return safeEqual(user, U) && safeEqual(password, P);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
  path: "/",
  maxAge: MAX_AGE,
};
