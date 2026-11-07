import { NextResponse, type NextRequest } from "next/server";
import { getVisitStats, recordVisit } from "@/lib/visits";
import { onlineCount, touchPresence } from "@/lib/presence";
import { getVisitor, persistVisitor } from "@/lib/visitor";
import { classifySource, isAdminRequest, recordEvent } from "@/lib/events";
import { allowRequest } from "@/lib/ratelimit";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

/** Регистрирует визит (раз за сессию браузера) и возвращает статистику. */
export async function POST(req: NextRequest) {
  const v = getVisitor(req);
  const body = (await req.json().catch(() => ({}))) as { ref?: string; utm?: string; lang?: string };
  if (!v.isBot && !(await isAdminRequest(req)) && allowRequest(req, "visit", 30, 10 * 60_000)) {
    const firstToday = recordVisit(v.id);
    touchPresence(v.id);
    if (firstToday) {
      const host = req.headers.get("host") || "";
      recordEvent(req, { type: "visit", source: classifySource(String(body.ref ?? "").slice(0, 500), String(body.utm ?? ""), host), lang: isLocale(body.lang) ? body.lang : "" });
    }
  }
  return persistVisitor(NextResponse.json({ ...getVisitStats(), online: onlineCount() }), v);
}

export async function GET() {
  return NextResponse.json({ ...getVisitStats(), online: onlineCount() });
}
