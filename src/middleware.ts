import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { LOCALE_COOKIE, LOCALE_HEADER, isLocale, matchAcceptLanguage, type Locale } from "@/i18n/config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|google|bing|yandex|baidu|duckduck/i;
// Без логина доступны только эти административные адреса
const ADMIN_PUBLIC = new Set(["/admin/login", "/api/admin/login", "/api/admin/login/2fa"]);

/** CSRF: изменяющие запросы к API принимаем только со своего сайта (заголовок Origin / Sec-Fetch-Site). */
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) {
    let host = "";
    try {
      host = new URL(origin).host;
    } catch {
      return false;
    }
    const own = [req.headers.get("host"), req.nextUrl.host];
    try {
      if (process.env.SITE_URL) own.push(new URL(process.env.SITE_URL).host);
    } catch {}
    return own.includes(host);
  }
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && !SAFE_METHODS.has(req.method) && !sameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // ---------- админка ----------
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (ADMIN_PUBLIC.has(pathname)) return NextResponse.next();
    const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (ok) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // ---------- публичные страницы: язык в адресе (/en, /ko, /zh; русский — без префикса) ----------
  const m = /^\/(en|ko|zh|ru)(?=\/|$)/.exec(pathname);
  if (m) {
    const rest = pathname.slice(m[0].length) || "/";
    if (m[1] === "ru") {
      const url = req.nextUrl.clone();
      url.pathname = rest;
      return NextResponse.redirect(url, 308); // у русской версии нет префикса — один адрес на страницу
    }
    if (/^\/(api|admin)(\/|$)/.test(rest)) return NextResponse.next(); // /en/admin → 404
    const headers = new Headers(req.headers);
    headers.set(LOCALE_HEADER, m[1]);
    const url = req.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.rewrite(url, { request: { headers } });
  }

  // Главная без префикса: человека с другим языком браузера или выбранным ранее языком отправляем на его версию.
  // Поисковых и превью-ботов не трогаем — им отдаётся русская версия.
  if (pathname === "/" && req.method === "GET") {
    const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
    let target: Locale | null = null;
    if (isLocale(cookie)) target = cookie;
    else if (!BOT.test(req.headers.get("user-agent") || "")) target = matchAcceptLanguage(req.headers.get("accept-language"));
    if (target && target !== "ru") {
      const url = req.nextUrl.clone();
      url.pathname = `/${target}`;
      const res = NextResponse.redirect(url, 307);
      if (!isLocale(cookie)) res.cookies.set(LOCALE_COOKIE, target, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      res.headers.set("Cache-Control", "private, no-store");
      res.headers.set("Vary", "Accept-Language, Cookie");
      return res;
    }
  }

  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, "ru");
  return NextResponse.next({ request: { headers } });
}

// Всё, кроме статики (файлы с расширением, _next, фото, демо, PDF)
export const config = {
  matcher: ["/((?!_next/|media/|demo/|guides/|.*\\.[a-zA-Z0-9]+$).*)"],
};
