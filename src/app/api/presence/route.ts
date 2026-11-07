import { NextResponse, type NextRequest } from "next/server";
import { onlineCount, touchPresence } from "@/lib/presence";
import { getVisitStats } from "@/lib/visits";
import { getVisitor, persistVisitor } from "@/lib/visitor";
import { isAdminRequest } from "@/lib/events";
import { allowRequest } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** «Пульс» открытой вкладки (раз в 30 с): обновляет онлайн и отдаёт счётчики. */
export async function POST(req: NextRequest) {
  const v = getVisitor(req);
  if (!v.isBot && !(await isAdminRequest(req)) && allowRequest(req, "presence", 60, 10 * 60_000)) touchPresence(v.id);
  const s = getVisitStats();
  return persistVisitor(NextResponse.json({ online: onlineCount(), unique: s.unique, today: s.today }), v);
}
