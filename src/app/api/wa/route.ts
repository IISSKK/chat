import { NextResponse, type NextRequest } from "next/server";
import { getItem } from "@/lib/items";
import { getT } from "@/i18n/server";
import { docsMessage, priceMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Короткая ссылка на WhatsApp: /api/wa?id=12&kind=price|docs → 302 на wa.me с готовым текстом на языке посетителя.
 * Вместо длинных закодированных ссылок в каждой карточке — страница легче в несколько раз.
 */
export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  const kind = req.nextUrl.searchParams.get("kind") === "docs" ? "docs" : "price";
  const item = Number.isInteger(id) && id > 0 ? getItem(id) : null;
  const t = await getT();
  const url = item ? waLink(kind === "docs" ? docsMessage(item, t) : priceMessage(item, t)) : waLink(t.whatsapp.generic);
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
