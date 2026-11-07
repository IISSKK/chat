import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { getItem } from "@/lib/items";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { getWhatsAppContacts } from "@/lib/contacts";
import { docsMessage, priceMessage, waLink } from "@/lib/whatsapp";
import { getVisitor } from "@/lib/visitor";
import { isAdminRequest, recordEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Короткая ссылка на WhatsApp → 302 на wa.me с готовым текстом на языке посетителя. Заодно считает клик (аналитика).
 *   kind = price | docs | generic | partner | body | chassis,  id = объявление,  n = номер из списка («Контакты» в админке),  l = язык
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = ["price", "docs", "partner", "body", "chassis"].includes(sp.get("kind") || "") ? sp.get("kind")! : "generic";
  const id = Number(sp.get("id"));
  const n = Math.max(0, Math.min(20, Number(sp.get("n")) || 0));
  const l = sp.get("l");
  const locale = isLocale(l) ? l : DEFAULT_LOCALE;
  const t = getDictionary(locale);
  const contacts = getWhatsAppContacts();
  const contact = contacts[n] ?? contacts[0];
  const item = Number.isInteger(id) && id > 0 ? getItem(id) : null;

  let text = t.whatsapp.generic;
  if (item && kind === "docs") text = docsMessage(item, t);
  else if (item && kind === "price") text = priceMessage(item, t);
  else if (kind === "body") text = t.parts.waBody;
  else if (kind === "chassis") text = t.parts.waChassis;
  else if (kind === "partner") text = fmt(t.whatsapp.partnership, { name: siteConfig.name });

  if (!getVisitor(req).isBot && !(await isAdminRequest(req))) recordEvent(req, { type: "wa_click", itemId: item?.id ?? null, detail: kind, lang: locale });

  return NextResponse.redirect(waLink(text, contact.digits), {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
