import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { getItem } from "@/lib/items";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/format";
import { getWhatsAppContacts } from "@/lib/contacts";
import { docsMessage, priceMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Короткая ссылка на WhatsApp → 302 на wa.me с готовым текстом на языке посетителя.
 *   kind = price | docs | generic | partner,  id = объявление,  n = номер из списка (раздел «Контакты» в админке)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = sp.get("kind") || "price";
  const id = Number(sp.get("id"));
  const n = Math.max(0, Number(sp.get("n")) || 0);
  const contacts = getWhatsAppContacts();
  const contact = contacts[n] ?? contacts[0];
  const t = await getT();
  const item = Number.isInteger(id) && id > 0 ? getItem(id) : null;

  let text = t.whatsapp.generic;
  if (item && kind === "docs") text = docsMessage(item, t);
  else if (item && kind === "price") text = priceMessage(item, t);
  else if (kind === "partner") text = fmt(t.whatsapp.partnership, { name: siteConfig.name });

  return NextResponse.redirect(waLink(text, contact.digits), {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
