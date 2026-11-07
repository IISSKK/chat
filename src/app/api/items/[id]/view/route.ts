import { NextResponse, type NextRequest } from "next/server";
import { getItem, recordItemView } from "@/lib/items";
import { getVisitor, persistVisitor } from "@/lib/visitor";
import { isAdminRequest, recordEvent } from "@/lib/events";
import { allowRequest } from "@/lib/ratelimit";
import { isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

/** Засчитывает просмотр объявления (один раз на посетителя). Админы и боты не считаются. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const item = Number.isInteger(id) ? getItem(id) : null;
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  const v = getVisitor(req);
  let views = item.views;
  if (!v.isBot && !(await isAdminRequest(req)) && allowRequest(req, "view", 120, 10 * 60_000)) {
    const before = item.views;
    views = recordItemView(id, v.id);
    if (views > before) recordEvent(req, { type: "item_view", itemId: id, lang: isLocale(req.nextUrl.searchParams.get("l")) ? req.nextUrl.searchParams.get("l")! : "" });
  }
  return persistVisitor(NextResponse.json({ views }), v);
}
