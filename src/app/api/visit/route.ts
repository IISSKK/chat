import { NextResponse, type NextRequest } from "next/server";
import { getVisitStats, recordVisit } from "@/lib/visits";
import { onlineCount, touchPresence } from "@/lib/presence";
import { getVisitor, persistVisitor } from "@/lib/visitor";

export const dynamic = "force-dynamic";

/** Регистрирует визит (раз за сессию браузера) и возвращает статистику. */
export async function POST(req: NextRequest) {
  const v = getVisitor(req);
  if (!v.isBot) {
    recordVisit(v.id);
    touchPresence(v.id);
  }
  return persistVisitor(NextResponse.json({ ...getVisitStats(), online: onlineCount() }), v);
}

export async function GET() {
  return NextResponse.json({ ...getVisitStats(), online: onlineCount() });
}
