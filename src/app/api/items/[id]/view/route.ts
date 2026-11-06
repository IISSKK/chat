import { NextResponse, type NextRequest } from "next/server";
import { getItem, recordItemView } from "@/lib/items";
import { getVisitor, persistVisitor } from "@/lib/visitor";

export const dynamic = "force-dynamic";

/** Засчитывает просмотр объявления (один раз на посетителя). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const item = Number.isInteger(id) ? getItem(id) : null;
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  const v = getVisitor(req);
  const views = v.isBot ? item.views : recordItemView(id, v.id);
  return persistVisitor(NextResponse.json({ views }), v);
}
