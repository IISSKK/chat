import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "./auth";
import { markLogin } from "./admins";
import { logAudit } from "./audit";
import { sendTelegram, tgEscape } from "./telegram";

/** Короткое описание устройства для уведомления: «iPhone · Safari» */
export function describeDevice(ua: string): string {
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "?";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "?";
  return `${os} · ${br}`;
}

export const countryOf = (req: NextRequest | Request) => (req.headers.get("cf-ipcountry") || "").toUpperCase().replace(/^XX$|^T1$/, "");

/** Завершает вход: ставит cookie сессии, пишет в журнал и сообщает в Telegram. */
export async function finalizeLogin(req: NextRequest, who: { name: string; id: number }, twoFactor: boolean) {
  markLogin(who.id);
  const device = describeDevice(req.headers.get("user-agent") || "");
  const country = countryOf(req);
  logAudit(who.name, "login", "admin", who.id, `${device}${country ? ` · ${country}` : ""}${twoFactor ? " · 2FA" : ""}`);
  void sendTelegram(`🔐 <b>Вход в админку</b>\nПользователь: <b>${tgEscape(who.name)}</b>${twoFactor ? " (2FA ✓)" : ""}\nУстройство: ${tgEscape(device)}${country ? `\nСтрана: ${country}` : ""}`);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(who.name, who.id, twoFactor), sessionCookieOptions(twoFactor));
  return res;
}
