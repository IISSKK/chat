import "server-only";
import type { NextRequest } from "next/server";
import { getDb } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** Аналитика без персональных данных: только страна (из заголовка Cloudflare), устройство, язык и источник перехода. IP не сохраняется. */
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|monitor|uptime|curl|wget|python|node-fetch|go-http/i;

export const isBot = (req: NextRequest | Request) => BOT.test(req.headers.get("user-agent") || "");

export function deviceOf(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export const countryOf = (req: NextRequest | Request) => {
  const c = (req.headers.get("cf-ipcountry") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : "";
};

/** Откуда пришёл посетитель: поисковик, соцсеть, мессенджер, прямой заход… */
export function classifySource(referrer: string, utm: string, ownHost: string): string {
  const u = utm.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30);
  if (u) return `utm:${u}`;
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (host === ownHost.replace(/^www\./, "")) return "direct";
  const map: [RegExp, string][] = [
    [/google\./, "google"], [/yandex\./, "yandex"], [/bing\.com|duckduckgo|baidu|naver\./, "search"],
    [/instagram\./, "instagram"], [/facebook\.|fb\.com|fb\.me/, "facebook"], [/t\.me|telegram\./, "telegram"],
    [/wa\.me|whatsapp\./, "whatsapp"], [/tiktok\./, "tiktok"], [/youtube\.|youtu\.be/, "youtube"], [/vk\.com/, "vk"],
    [/ok\.ru/, "ok"], [/olx\.|avito\.|auto\.ru|drom\.ru|mashina\.kg|kolesa\.kz/, "classifieds"],
  ];
  for (const [re, name] of map) if (re.test(host)) return name;
  return `site:${host.slice(0, 40)}`;
}

/** Не считаем действия самих администраторов (они заходят на сайт и смотрят объявления) */
export async function isAdminRequest(req: NextRequest | Request): Promise<boolean> {
  const raw = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return !!raw && !!(await verifySessionToken(raw.slice(SESSION_COOKIE.length + 1)));
}

export function recordEvent(req: NextRequest | Request, e: { type: "visit" | "item_view" | "wa_click" | "lead" | "favorite"; itemId?: number | null; detail?: string; source?: string; lang?: string }) {
  try {
    const ua = req.headers.get("user-agent") || "";
    getDb()
      .prepare("INSERT INTO events (day, type, item_id, detail, country, source, device, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(new Date().toISOString().slice(0, 10), e.type, e.itemId ?? null, (e.detail ?? "").slice(0, 60), countryOf(req), (e.source ?? "").slice(0, 60), deviceOf(ua), (e.lang ?? "").slice(0, 5));
  } catch {}
}

/** Старше 400 дней события не храним */
export function pruneEvents(days = 400) {
  try {
    getDb().prepare("DELETE FROM events WHERE day < date('now', ?)").run(`-${days} days`);
  } catch {}
}

// ---------- отчёты ----------
type Count = { name: string; n: number };

export function analyticsReport(days: number) {
  const db = getDb();
  const from = `-${days - 1} days`;
  const grp = (col: string, type: string, extra = ""): Count[] =>
    (db.prepare(`SELECT ${col} AS name, COUNT(*) AS n FROM events WHERE type = ? AND day >= date('now', ?) ${extra} GROUP BY ${col} ORDER BY n DESC LIMIT 12`).all(type, from) as unknown as Count[]).map((r) => ({ ...r }));
  const total = (type: string) => (db.prepare("SELECT COUNT(*) AS n FROM events WHERE type = ? AND day >= date('now', ?)").get(type, from) as { n: number }).n;

  const topItems = (type: string) =>
    db
      .prepare(
        `SELECT e.item_id AS id, i.title AS title, i.status AS status, COUNT(*) AS n FROM events e JOIN items i ON i.id = e.item_id
         WHERE e.type = ? AND e.day >= date('now', ?) GROUP BY e.item_id ORDER BY n DESC LIMIT 10`,
      )
      .all(type, from) as unknown as { id: number; title: string; status: string; n: number }[];

  const waByKind = grp("detail", "wa_click");
  const daily = db
    .prepare(
      `SELECT day, SUM(type = 'visit') AS visits, SUM(type = 'wa_click') AS wa, SUM(type = 'lead') AS leads FROM events
       WHERE day >= date('now', ?) GROUP BY day ORDER BY day`,
    )
    .all(from) as unknown as { day: string; visits: number; wa: number; leads: number }[];

  const visits = total("visit");
  return {
    days,
    visits,
    itemViews: total("item_view"),
    waClicks: total("wa_click"),
    leads: total("lead"),
    favorites: total("favorite"),
    contactRate: visits ? Math.round(((total("wa_click") + total("lead")) / visits) * 1000) / 10 : 0,
    countries: grp("country", "visit", "AND country <> ''"),
    sources: grp("source", "visit"),
    devices: grp("device", "visit"),
    langs: grp("lang", "visit", "AND lang <> ''"),
    topViewed: topItems("item_view").map((r) => ({ ...r })),
    topWa: topItems("wa_click").map((r) => ({ ...r })),
    waByKind,
    daily: daily.map((r) => ({ ...r })),
  };
}
