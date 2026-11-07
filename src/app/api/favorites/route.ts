import { NextResponse, type NextRequest } from "next/server";
import { getItem } from "@/lib/items";
import { getWhatsAppContacts } from "@/lib/contacts";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { allowRequest } from "@/lib/ratelimit";
import { getVisitor } from "@/lib/visitor";
import { isAdminRequest, recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/** Данные избранного: ?ids=1,2,3&l=ru → актуальные объявления на языке посетителя (только опубликованные) */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ids = [...new Set((sp.get("ids") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 50);
  const l = sp.get("l");
  const locale = isLocale(l) ? l : DEFAULT_LOCALE;
  const items = ids.map((id) => getItem(id, locale)).filter((i): i is NonNullable<typeof i> => !!i);
  return NextResponse.json({ items, contacts: getWhatsAppContacts() }, { headers: { "Cache-Control": "no-store" } });
}

/** Считает добавление в избранное для аналитики (sendBeacon) */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { id?: number };
  if (!getVisitor(req).isBot && !(await isAdminRequest(req)) && allowRequest(req, "fav", 60, 10 * 60_000)) {
    const item = Number.isInteger(body.id) ? getItem(Number(body.id)) : null;
    if (item) recordEvent(req, { type: "favorite", itemId: item.id });
  }
  return new NextResponse(null, { status: 204 });
}
